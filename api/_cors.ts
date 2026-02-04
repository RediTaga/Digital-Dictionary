/**
 * Minimal CORS helper for Vercel Serverless Functions.
 *
 * We set CORS headers per-request (recommended) rather than relying on
 * platform-wide headers, so it works whether the frontend is on GitHub Pages
 * or elsewhere.
 *
 * Vercel notes: you can implement CORS on API routes by setting headers on the
 * endpoint and handling OPTIONS preflight requests.
 */
export function applyCors(req: any, res: any) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const origin = req.headers?.origin;

  // If you specify ALLOWED_ORIGIN, reflect it only when it matches.
  // Otherwise, default to "*" for quick testing.
  const originToSet = allowedOrigin === '*'
    ? '*'
    : origin && origin === allowedOrigin
      ? origin
      : allowedOrigin;

  res.setHeader('Access-Control-Allow-Origin', originToSet);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Passphrase');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}
