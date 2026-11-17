import { supabaseAdmin } from './supabaseAdmin.js';

/**
 * Verifies the caller's Supabase access token (Authorization: Bearer <jwt>).
 * Returns the user, or sends 401 and returns null.
 * Identity always comes from the verified token — never from the request body.
 */
export async function requireUser(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
  return data.user;
}
