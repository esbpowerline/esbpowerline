/** Constant-time string compare — Edge-safe (no Node crypto/Buffer). */
function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Bearer check against a named secret; false when the secret is unset, so a missing env var never opens a route. */
export function isBearerAuthorized(request: Request, secret: string | undefined): boolean {
  const s = secret?.trim();
  if (!s) return false;
  const auth = request.headers.get('authorization') ?? '';
  return timingSafeEqualString(auth, `Bearer ${s}`);
}

/** Shared CRON bearer check for health routes and proxy API bypass. */
export function isCronAuthorized(request: Request): boolean {
  return isBearerAuthorized(request, process.env.CRON_SECRET);
}