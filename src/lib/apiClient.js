import { supabase } from './supabase.js';
import { API_BASE } from '../utils/api.js';

/**
 * Calls an authenticated API route with the current Supabase access token.
 * Resolves to { ok, status, data } — never throws on HTTP errors, only on
 * network failure.
 */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  return { ok: res.ok, status: res.status, data };
}

export const setPin    = pin => apiFetch('/api/pin', { method: 'POST', body: { action: 'set', pin } });
export const verifyPin = pin => apiFetch('/api/pin', { method: 'POST', body: { action: 'verify', pin } });
