import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const KEYLEN = 32;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

export const PIN_RE = /^\d{4}$/;

// Format: scrypt$N$r$p$<salt b64>$<hash b64> — params stored so they can be raised later.
export async function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(pin, salt, KEYLEN, SCRYPT_OPTS);
  const { N, r, p } = SCRYPT_OPTS;
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function checkPin(pin, stored) {
  const [alg, N, r, p, saltB64, hashB64] = String(stored).split('$');
  if (alg !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(pin, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p),
  });
  return crypto.timingSafeEqual(actual, expected);
}

export async function storePin(db, userId, pin) {
  const { error } = await db.from('user_pins').upsert({
    user_id: userId,
    pin_hash: await hashPin(pin),
    failed_attempts: 0,
    locked_until: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

// Move a plaintext profile_data.pin (pre-hashing accounts) into user_pins and
// strip it from the profile. Returns true if a legacy PIN was migrated.
export async function migrateLegacyPin(db, userId, profileData) {
  const legacy = profileData?.pin;
  if (!legacy || !PIN_RE.test(String(legacy))) return false;
  await storePin(db, userId, String(legacy));
  const { pin: _drop, ...rest } = profileData;
  const { error } = await db.from('profiles')
    .update({ profile_data: { ...rest, hasPin: true } })
    .eq('id', userId);
  if (error) throw error;
  return true;
}
