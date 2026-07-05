import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientIpFromForwarded, PRIVATE_NO_STORE } from '@/lib/rate-limit';

/**
 * Double-submit CSRF: x-csrf-token header must match the csrf_token cookie.
 * Falls back to same-origin check when no cookie is present (legacy clients).
 */
export function checkCsrf(request: NextRequest): NextResponse | null {
  const cookieToken = request.cookies.get('csrf_token')?.value;
  const headerToken = request.headers.get('x-csrf-token');

  if (cookieToken && headerToken && cookieToken === headerToken) {
    return null;
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    try {
      if (new URL(origin).host === host) {
        return null;
      }
    } catch {
      /* invalid origin */
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * Apply per-IP rate limiting to a request.
 * Returns a 429 NextResponse if exceeded, or null if allowed.
 */
export function checkRateLimitResponse(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ip = clientIpFromForwarded(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
  );
  const result = checkRateLimit(`${key}:${ip}`, limit, windowMs);
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
          'Cache-Control': PRIVATE_NO_STORE,
        },
      },
    );
  }
  return null;
}

/** Attach private no-store cache header to a JSON response. */
export function withPrivateNoStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', PRIVATE_NO_STORE);
  return response;
}