-- Net worth history: one snapshot per user per day (latest value that day wins).
-- Written by the client whenever the profile loads or changes; read by the
-- Simulations tab to draw past net worth alongside the projection.

begin;

create table if not exists public.net_worth_snapshots (
  user_id       uuid          not null references auth.users (id) on delete cascade,
  snapshot_date date          not null,
  assets        numeric(14,2) not null,
  liabilities   numeric(14,2) not null,
  net_worth     numeric(14,2) generated always as (assets - liabilities) stored,
  updated_at    timestamptz   not null default now(),
  primary key (user_id, snapshot_date)
);

alter table public.net_worth_snapshots enable row level security;

revoke all on public.net_worth_snapshots from anon, authenticated;
grant select on public.net_worth_snapshots to authenticated;
grant insert (user_id, snapshot_date, assets, liabilities, updated_at) on public.net_worth_snapshots to authenticated;
grant update (assets, liabilities, updated_at)                         on public.net_worth_snapshots to authenticated;

drop policy if exists snapshots_select_own on public.net_worth_snapshots;
drop policy if exists snapshots_insert_own on public.net_worth_snapshots;
drop policy if exists snapshots_update_own on public.net_worth_snapshots;

create policy snapshots_select_own on public.net_worth_snapshots
  for select to authenticated using (user_id = auth.uid());
create policy snapshots_insert_own on public.net_worth_snapshots
  for insert to authenticated with check (user_id = auth.uid());
create policy snapshots_update_own on public.net_worth_snapshots
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;
