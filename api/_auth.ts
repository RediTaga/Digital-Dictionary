/**
 * Extremely simple API auth.
 *
 * This is NOT full user authentication. It exists to prevent random public
 * writes if you publish the API endpoint.
 *
 * The frontend can send the passphrase in the `X-Passphrase` header.
 */
export function requirePassphrase(req: any, res: any): boolean {
  const expected = (process.env.API_PASSPHRASE || '').trim();
  if (!expected) {
    // If no passphrase configured, allow all requests.
    return true;
  }
  const got = (req.headers?.['x-passphrase'] || req.headers?.['X-Passphrase'] || '').toString().trim();
  if (got && got === expected) return true;

  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Unauthorized' }));
  return false;
}
