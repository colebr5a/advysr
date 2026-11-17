// One-off backfill: hash every plaintext profile_data.pin into user_pins and
// strip it from profile_data. Run once after applying the security migration:
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-legacy-pins.js
//
// Safe to re-run; profiles without a plaintext PIN are skipped.

import { supabaseAdmin } from '../api/_lib/supabaseAdmin.js';
import { migrateLegacyPin } from '../api/_lib/pinHash.js';

const db = supabaseAdmin();
const PAGE = 500;

// Collect first, then migrate — migrating while paging would shift the window.
const rows = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await db
    .from('profiles')
    .select('id, profile_data')
    .not('profile_data->pin', 'is', null)
    .order('id')
    .range(from, from + PAGE - 1);
  if (error) throw error;
  rows.push(...data);
  if (data.length < PAGE) break;
}

let migrated = 0;
for (const row of rows) {
  if (await migrateLegacyPin(db, row.id, row.profile_data)) migrated++;
}
console.log(`Found ${rows.length} profiles with a pin field; migrated ${migrated}.`);
