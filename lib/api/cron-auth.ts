/** Constant-time string compare — Edge-safe (no Node crypto/Buffer). */
function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Shared CRON bearer check for health routes and proxy API bypass. */
export function isCronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;

  const auth = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${cronSecret}`;
  return timingSafeEqualString(auth, expected);
}