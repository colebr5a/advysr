-- Security hardening: RLS, column-level privileges, server-only tables.
--
-- Threat model: the anon key ships in the client bundle, so anyone can call
-- PostgREST directly with their own session. Everything the client must not
-- control (PIN hashes, AI usage counts, legacy billing columns) is either
-- in a column the client can't write or a table the client can't touch.
-- Server code uses the service_role key, which bypasses RLS and grants.
--
-- Idempotent: safe to re-run.

begin;

-- ─── server-only tables ─────────────────────────────────────────────────────
create table if not exists public.user_pins (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  pin_hash        text not null,
  failed_attempts int  not null default 0,
  locked_until    timestamptz,
  updated_at      timestamptz not null default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month   text not null,               -- 'YYYY-MM' (UTC)
  queries int  not null default 0,
  primary key (user_id, month)
);

-- ─── wipe existing policies so nothing permissive lingers ───────────────────
-- (Postgres ORs policies together; one leftover "true" policy defeats the rest.)
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'admins', 'user_pins', 'ai_usage')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

alter table public.profiles      enable row level security;
alter table public.admins        enable row level security;
alter table public.user_pins     enable row level security;
alter table public.ai_usage      enable row level security;

-- ─── admin check (security definer avoids RLS recursion on admins) ──────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ─── profiles ───────────────────────────────────────────────────────────────
-- Supabase grants ALL to anon/authenticated by default; start from nothing.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- Column-level: clients may write only these columns. Anything else on the
-- table (e.g. the unused is_premium / subscription_expires_at) stays read-only.
grant insert (id, email, profile_data, updated_at, last_seen) on public.profiles to authenticated;
grant update (email, profile_data, updated_at, last_seen)     on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_select_admin on public.profiles
  for select to authenticated using (public.is_admin());
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ─── admins: read your own row only; managed via SQL editor ─────────────────
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
create policy admins_select_own on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ─── ai_usage: users can read their own counts (for the UI), never write ────
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;
create policy ai_usage_select_own on public.ai_usage
  for select to authenticated using (user_id = auth.uid());

-- ─── user_pins: no client access at all ─────────────────────────────────────
revoke all on public.user_pins from anon, authenticated;

-- ─── RPCs (service_role only) ───────────────────────────────────────────────
-- Reserve one AI query against the monthly cap. p_limit null = uncapped (still counted).
-- The conditional UPDATE takes a row lock, so concurrent requests can't
-- both slip under the limit.
create or replace function public.consume_ai_query(p_user_id uuid, p_limit int)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_month text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_used  int;
begin
  insert into ai_usage (user_id, month) values (p_user_id, v_month)
  on conflict (user_id, month) do nothing;

  update ai_usage set queries = queries + 1
   where user_id = p_user_id and month = v_month
     and (p_limit is null or queries < p_limit)
  returning queries into v_used;

  if v_used is null then
    select queries into v_used from ai_usage where user_id = p_user_id and month = v_month;
    return jsonb_build_object('allowed', false, 'used', v_used);
  end if;
  return jsonb_build_object('allowed', true, 'used', v_used);
end $$;

-- Give back a reserved query when the upstream model call fails.
create or replace function public.refund_ai_query(p_user_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update ai_usage set queries = greatest(queries - 1, 0)
   where user_id = p_user_id
     and month = to_char(now() at time zone 'utc', 'YYYY-MM');
$$;

-- Atomically record a failed PIN attempt; lock after p_max failures.
create or replace function public.register_pin_failure(p_user_id uuid, p_max int, p_lock_minutes int)
returns setof public.user_pins
language sql security definer set search_path = public
as $$
  update user_pins set
    failed_attempts = case when failed_attempts + 1 >= p_max then 0 else failed_attempts + 1 end,
    locked_until    = case when failed_attempts + 1 >= p_max
                           then now() + make_interval(mins => p_lock_minutes)
                           else locked_until end,
    updated_at      = now()
  where user_id = p_user_id
  returning *;
$$;

revoke all on function public.consume_ai_query(uuid, int)              from public, anon, authenticated;
revoke all on function public.refund_ai_query(uuid)                    from public, anon, authenticated;
revoke all on function public.register_pin_failure(uuid, int, int)     from public, anon, authenticated;
grant execute on function public.consume_ai_query(uuid, int)           to service_role;
grant execute on function public.refund_ai_query(uuid)                 to service_role;
grant execute on function public.register_pin_failure(uuid, int, int)  to service_role;

commit;
