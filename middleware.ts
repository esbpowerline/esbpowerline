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
} from '@/lib/data/grid/daily-access';
import { getLatestAvailableDate } from '@/lib/data/grid/available-dates';
import {
  isDateAllowedForTier,
  resolveGridAccessTier,
} from '@/lib/data/grid/grid-tier-access';

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

function isDailyJsonPath(pathname: string): boolean {
  return /^\/data\/daily\/\d{4}-\d{2}-\d{2}\.json$/.test(pathname);
}

function isPetrobanglaJsonPath(pathname: string): boolean {
  return /^\/data\/petrobangla\/(daily\/\d{4}-\d{2}-\d{2}\.json|_index\.json|timeline-summary\.json|_live_week\.json)$/.test(
    pathname,
  );
}

function isProtectedDataJsonPath(pathname: string): boolean {
  return isDailyJsonPath(pathname) || isPetrobanglaJsonPath(pathname);
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
    return role === 'SUBSCRIBER';
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

  // Global Upstash Rate Limiting
  if (redis) {
    if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
      const { success } = await authRateLimit!.limit(ip);
      if (!success) {
        return new NextResponse('Too many login attempts. Please try again later.', { status: 429 });
      }
    } else {
      const { success } = await standardRateLimit!.limit(ip);
      if (!success) {
        return new NextResponse('Too many requests. Please slow down.', { status: 429 });
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

    const { response, supabase, user } = await updateSession(request);
    const { active, role, gridPlan } = await resolveEdgeSession(user, supabase);

    const dailyMatch = pathname.match(/\/data\/(?:daily|petrobangla\/daily)\/(\d{4}-\d{2}-\d{2})\.json$/);
    const isoDate = dailyMatch?.[1];
    const latestDate = getLatestAvailableDate();

    if (isoDate && latestDate) {
      const tier = resolveGridAccessTier({
        isAuthenticated: active,
        role,
        gridPlan,
      });

      if (isoDate !== '2024-07-02' && !isDateAllowedForTier(isoDate, tier, latestDate)) {
        return denyDailyJson('Subscription required for historical grid data access.');
      }
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
    '/data/daily/:path*.json',
    '/data/petrobangla/:path*.json',
    '/((?!_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml|api/cron).*)',
  ],
};