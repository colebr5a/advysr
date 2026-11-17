// Origin allowlist for browser callers. Non-browser callers (curl, scripts) send
// no Origin header; CORS doesn't apply to them, so authenticated routes rely on
// requireUser() instead.
//
// Override with ALLOWED_ORIGINS="https://a.com,https://b.com" in the environment.
const DEFAULT_ORIGINS = [
  'https://advysr.org',
  'https://www.advysr.org',
  'capacitor://localhost', // iOS app (Capacitor WKWebView)
  'http://localhost:5173', // vite dev
];

function allowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const appUrl = process.env.APP_URL ? [process.env.APP_URL.replace(/\/$/, '')] : [];
  return new Set([...DEFAULT_ORIGINS, ...appUrl, ...fromEnv]);
}

/**
 * Applies CORS headers. Returns true when the request has been fully handled
 * (preflight answered or origin rejected) and the caller should return.
 */
export function applyCors(req, res, { methods = ['GET'] } = {}) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');

  if (origin) {
    if (!allowedOrigins().has(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return true;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  if (!methods.includes(req.method)) {
    res.status(405).end();
    return true;
  }
  return false;
}
