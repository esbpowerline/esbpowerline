import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import {
  canAccessPath,
  roleHomePath,
  resolveWorkspaceUrl,
  hostContextFromHeaders,
} from '@/lib/auth-routing';
import { isCronAuthorized } from '@/lib/api/cron-auth';
import { isProxyProtectedApi } from '@/lib/api/protected-routes';
import { resolveEdgeSession } from '@/lib/supabase/edge-session-gate';
import { can, type Role } from '@/lib/constants';
import { checkRateLimit, clientIpFromForwarded, edgeRateLimitKey } from '@/lib/rate-limit';
import {
  isBlockedBotUserAgent,
  isSameOriginDailyAccess,
  isProtectedDataJsonPath,
  canonicalDataPath,
  dataPathIsoDate,
} from '@/lib/data/grid/daily-access';
import { getLatestAvailableDate } from '@/lib/data/grid/available-dates';
import {
  isDateAllowedForTier,
  resolveGridAccessTier,
} from '@/lib/data/grid/grid-tier-access';
import { isPublicSampleDate } from '@/lib/data/grid/public-sample-dates';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

const authRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
}) : null;

const standardRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '10 s'),
  analytics: true,
}) : null;

/**
 * Every path that accepts a credential or mints a reset token. The limiter used
 * to cover only /login and /api/auth, which left /members/login (a Server Action
 * post, not under /api) and the password-reset routes completely unthrottled —
 * unlimited brute force against every subscriber account.
 */
function isCredentialPath(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/members/login') ||
    pathname.startsWith('/auth/forgot-password') ||
    pathname.startsWith('/auth/reset-password') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up')
  );
}

function denyDailyJson(message: string, status = 403): NextResponse {
  return new NextResponse(message, {
    status,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'private, no-store',
    },
  });
}

function apiRoleAllowed(pathname: string, role: Role): boolean {
  if (pathname === '/api/members/grid-export' || pathname.startsWith('/api/members/grid-export/')) {
    // Any signed-in account may export: members by plan tier, staff at full tier.
    // The route resolves the tier and enforces range clamps + rate limits.
    return Boolean(role);
  }
  if (pathname === '/api/analytics' || pathname.startsWith('/api/analytics/')) {
    return can(role, 'analytics.view_all');
  }
  if (pathname === '/api/upload' || pathname.startsWith('/api/upload/')) {
    return can(role, 'media.upload');
  }
  return false;
}

function unauthorizedApi(response: NextResponse): NextResponse {
  const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  response.cookies.getAll().forEach((cookie) => {
    denied.cookies.set(cookie.name, cookie.value);
  });
  return denied;
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.includes('-auth-token'));
}

function pathNeedsRoleCheck(pathname: string): boolean {
  if (pathname.startsWith('/admin') || pathname.startsWith('/cms') || pathname.startsWith('/members')) {
    return true;
  }
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return true;
  }
  return isProxyProtectedApi(pathname);
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  destination: string,
): NextResponse {
  const hostContext = hostContextFromHeaders(
    request.headers.get('host'),
    request.headers.get('x-forwarded-proto'),
  );
  const resolvedUrl = resolveWorkspaceUrl(destination, hostContext);
  const finalUrl = /^https?:\/\//i.test(resolvedUrl)
    ? new URL(resolvedUrl)
    : new URL(resolvedUrl, request.url);

  const redirectResponse = NextResponse.redirect(finalUrl);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = clientIpFromForwarded(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
  );

  // Global Upstash Rate Limiting. An Upstash outage used to reject inside
  // middleware with no catch, which 500s every route on the site — a limiter
  // failure must degrade, not take the site down.
  if (redis) {
    const limiter = isCredentialPath(pathname)
      ? authRateLimit
      : pathname.startsWith('/api/')
        // Protect API routes from abuse, but avoid draining the 10,000 Upstash
        // Free Tier limit on regular page views.
        ? standardRateLimit
        : null;

    if (limiter) {
      let allowed = true;
      try {
        allowed = (await limiter.limit(ip)).success;
      } catch {
        allowed = true; // fail open rather than take the site offline
      }
      if (!allowed) {
        return new NextResponse(
          isCredentialPath(pathname)
            ? 'Too many login attempts. Please try again later.'
            : 'Too many requests. Please slow down.',
          { status: 429 },
        );
      }
    }
  }

  if (isProtectedDataJsonPath(pathname)) {

    const userAgent = request.headers.get('user-agent');
    if (isBlockedBotUserAgent(userAgent)) {
      return denyDailyJson('Access Denied: Request blocked by security policy.');
    }

    if (
      !isSameOriginDailyAccess(
        request.headers.get('referer'),
        request.headers.get('origin'),
        request.headers.get('host'),
      )
    ) {
      return denyDailyJson('Access Denied: Direct data access is restricted.');
    }

    // Everything below reasons about the static shape, so runtime /api/data/*
    // requests are gated by the same rules as their /data/* twin.
    const dataPath = canonicalDataPath(pathname);
    const isoDate = dataPathIsoDate(pathname);
    const latestDate = getLatestAvailableDate();

    // Petrobangla gas-day files power the visitor-accessible 1M rolling window,
    // so they get a wider public window (30 gas-days + gap buffer) than the
    // 7-day PGCB grid window. Older archive days stay tier-gated.
    const PETROBANGLA_PUBLIC_DAYS_BACK = 45;
    const isPetrobanglaDaily = dataPath.startsWith('/data/petrobangla/daily/');
    const inPetrobanglaPublicWindow =
      isPetrobanglaDaily &&
      !!isoDate &&
      !!latestDate &&
      isoDate <= latestDate &&
      (Date.parse(latestDate) - Date.parse(isoDate)) / 86_400_000 <= PETROBANGLA_PUBLIC_DAYS_BACK;

    // Fast path: dates inside the public visitor window (and the demo date) are
    // accessible to everyone, so skip the Supabase token refresh + Postgres
    // session lookup entirely. This is the hot path — most Grid Explorer reads
    // are recent dates — and avoids a per-fetch DB round-trip on Vercel.
    // `latestDate` comes from the build-time catalog, so it cannot see a day
    // published at runtime — and isDateAllowedForTier rejects anything past
    // latest outright, which would 403 every newly published day. A date beyond
    // the shipped archive can only exist because it was just published, and the
    // newest day is always inside the public window, so treat it as public.
    // Nothing leaks: if no release exists the route simply 404s.
    const isBeyondShippedArchive = !!isoDate && !!latestDate && isoDate > latestDate;

    const isPublicDate =
      !isoDate ||
      !latestDate ||
      isPublicSampleDate(isoDate) ||
      isBeyondShippedArchive ||
      inPetrobanglaPublicWindow ||
      isDateAllowedForTier(isoDate, 'visitor', latestDate);

    if (isPublicDate) {
      const publicResponse = NextResponse.next({ request });
      publicResponse.headers.set('Cache-Control', 'private, no-store');
      return publicResponse;
    }

    // Restricted (historical) date → resolve the session and tier-gate it.
    const { response, supabase, user } = await updateSession(request);
    const { active, role, gridPlan } = await resolveEdgeSession(user, supabase);

    const tier = resolveGridAccessTier({
      isAuthenticated: active,
      role,
      gridPlan,
    });

    if (!isDateAllowedForTier(isoDate!, tier, latestDate!)) {
      return denyDailyJson('Subscription required for historical grid data access.');
    }

    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  const userAgent = request.headers.get('user-agent') || '';

  if (isBlockedBotUserAgent(userAgent)) {
    return new NextResponse('Access Denied: Request blocked by security policy.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Fast path #1: No auth cookie + public route → skip everything (no Supabase calls)
  if (!pathNeedsRoleCheck(pathname) && !hasSupabaseAuthCookie(request)) {
    return NextResponse.next({ request });
  }

  // Fast path #2: Has auth cookie but route doesn't need a role check (e.g. a logged-in
  // reader browsing public articles). Refresh the Supabase session token only — skip the
  // Postgres profiles lookup in resolveEdgeSession entirely.
  if (!pathNeedsRoleCheck(pathname) && hasSupabaseAuthCookie(request)) {
    const { response } = await updateSession(request);
    return response;
  }

  const { response, supabase, user } = await updateSession(request);


  if (isProxyProtectedApi(pathname)) {
    if (isCronAuthorized(request)) return response;

    const { active, role } = await resolveEdgeSession(user, supabase);
    if (!active || !role || !apiRoleAllowed(pathname, role)) {
      return unauthorizedApi(response);
    }

    return response;
  }

  const { active, role } = await resolveEdgeSession(user, supabase);
  const effectiveRole = active ? (role ?? undefined) : undefined;

  if (!canAccessPath(effectiveRole, pathname)) {
    let destination = '/login';
    if (!effectiveRole) {
      if (pathname.startsWith('/members')) destination = '/members/login';
    } else {
      destination = roleHomePath(effectiveRole);
    }
    return redirectWithCookies(request, response, destination);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml|api/cron).*)',
  ],
};