import { supabase } from './supabase.js';
import { computeNetWorth } from '../sim/netWorth.js';

function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Skip writes when nothing changed since the last one this session.
let lastWritten = null;

/** Upserts today's net worth snapshot. Never throws — history is best-effort. */
export async function recordSnapshot(userId, profile) {
  if (!userId || !profile) return;
  const { assets, liabilities } = computeNetWorth(profile);
  const date = localDate();
  const key = `${userId}|${date}|${assets}|${liabilities}`;
  if (key === lastWritten) return;
  lastWritten = key;

  const { error } = await supabase.from('net_worth_snapshots').upsert({
    user_id: userId,
    snapshot_date: date,
    assets,
    liabilities,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,snapshot_date' });
  if (error) {
    lastWritten = null;
    console.warn('Net worth snapshot skipped:', error.message);
  }
}

/** All of the current user's snapshots, oldest first. RLS limits rows to the caller. */
export async function fetchSnapshots() {
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .select('snapshot_date, assets, liabilities, net_worth')
    .order('snapshot_date', { ascending: true });
  if (error) {
    console.warn('Could not load net worth history:', error.message);
    return { snapshots: [], available: false };
  }
  return {
    snapshots: data.map(r => ({
      date: r.snapshot_date,
      assets: Number(r.assets),
      liabilities: Number(r.liabilities),
      netWorth: Number(r.net_worth),
    })),
    available: true,
  };
}
