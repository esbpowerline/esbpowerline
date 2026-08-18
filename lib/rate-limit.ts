type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function pruneExpired(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size <= MAX_BUCKETS * 0.8) break;
  }
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * Simple in-process rate limiter.
 * Limitation: buckets are per serverless instance — use WAF/edge for production scale.
 * On Vercel, combine with `clientIpFromForwarded` using x-forwarded-for / x-real-ip.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
  }

  bucket.count += 1;
  return { allowed: true };
}

/**
 * Resolve the client IP for rate-limit keying, trusting only headers the
 * platform sets.
 *
 * `x-forwarded-for` is client-supplied — its LEFT-most entry is whatever the
 * caller wrote, so keying the login limiter on it let an attacker rotate
 * `X-Forwarded-For: 1.2.3.<n>` for unlimited credential attempts. On Vercel the
 * platform sets `x-vercel-forwarded-for` and overwrites it on every request, so
 * it cannot be spoofed; prefer it. `x-real-ip` (also proxy-set) is next. The
 * spoofable header is the last resort, for a non-Vercel front that sets nothing
 * better — a degraded key is better than the literal string 'unknown', which
 * would collapse every caller into one bucket.
 */
export function clientIpFromForwarded(
  forwardedFor: string | null,
  realIp: string | null,
  vercelForwardedFor: string | null = null,
): string {
  const trusted = vercelForwardedFor?.split(',')[0]?.trim();
  if (trusted) return trusted;
  const real = realIp?.trim();
  if (real) return real;
  const fromForwarded = forwardedFor?.split(',')[0]?.trim();
  return fromForwarded || 'unknown';
}

/** Build a rate-limit key scoped by route prefix and client IP. */
export function edgeRateLimitKey(routePrefix: string, ip: string): string {
  return `${routePrefix}:${ip}`;
}

/** Standard Cache-Control for sensitive API responses. */
export const PRIVATE_NO_STORE = 'private, no-store' as const;