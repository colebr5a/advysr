// PIN set/verify.
//
// A 4-digit PIN has only 10,000 possibilities, so hashing alone doesn't protect
// it — anyone who can read the hash can brute-force it offline instantly. The
// real protections are:
//   1. The hash lives in `user_pins`, which has no client grants/RLS policies;
//      only this service-role code can read it.
//   2. Verification happens here, with a lockout after repeated failures.
// scrypt + per-user salt is defense in depth if the table ever leaks.

import { applyCors } from './_lib/cors.js';
import { requireUser } from './_lib/auth.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { PIN_RE, checkPin, storePin, migrateLegacyPin } from './_lib/pinHash.js';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

async function loadPinRecord(db, userId) {
  const { data } = await db.from('user_pins').select('*').eq('user_id', userId).maybeSingle();
  if (data) return data;

  // Lazy migration for accounts created before PINs were hashed.
  const { data: row } = await db
    .from('profiles').select('profile_data').eq('id', userId).maybeSingle();
  if (!(await migrateLegacyPin(db, userId, row?.profile_data))) return null;
  const { data: migrated } = await db.from('user_pins').select('*').eq('user_id', userId).single();
  return migrated;
}

function locked(res, until) {
  return res.status(423).json({ error: 'Too many attempts', code: 'locked', lockedUntil: until });
}

export default async function handler(req, res) {
  if (applyCors(req, res, { methods: ['POST'] })) return;

  const user = await requireUser(req, res);
  if (!user) return;

  const { action, pin } = req.body || {};
  if (typeof pin !== 'string' || !PIN_RE.test(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }

  const db = supabaseAdmin();

  try {
    if (action === 'set') {
      await storePin(db, user.id, pin);
      return res.status(200).json({ ok: true });
    }
    if (action !== 'verify') return res.status(400).json({ error: 'Unknown action' });

    const record = await loadPinRecord(db, user.id);
    if (!record) return res.status(404).json({ error: 'No PIN set', code: 'pin_not_set' });

    if (record.locked_until && new Date(record.locked_until) > new Date()) {
      return locked(res, record.locked_until);
    }

    if (await checkPin(pin, record.pin_hash)) {
      if (record.failed_attempts > 0) {
        await db.from('user_pins')
          .update({ failed_attempts: 0, locked_until: null })
          .eq('user_id', user.id);
      }
      return res.status(200).json({ ok: true });
    }

    // Atomic increment so parallel guesses can't dodge the counter.
    const { data: after, error: failErr } = await db.rpc('register_pin_failure', {
      p_user_id: user.id, p_max: MAX_ATTEMPTS, p_lock_minutes: LOCK_MINUTES,
    });
    if (failErr) throw failErr;
    const state = Array.isArray(after) ? after[0] : after;

    if (state?.locked_until && new Date(state.locked_until) > new Date()) {
      return locked(res, state.locked_until);
    }
    return res.status(401).json({
      error: 'Incorrect PIN',
      code: 'wrong_pin',
      attemptsRemaining: MAX_ATTEMPTS - (state?.failed_attempts ?? 0),
    });
  } catch (err) {
    console.error('pin handler error:', err);
    return res.status(500).json({ error: 'Could not process PIN' });
  }
}
