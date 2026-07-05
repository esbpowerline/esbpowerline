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

const dailyFetchTimestamps = new Map<string, number[]>();
const DAILY_BURST_WINDOW_MS = 60_000;
const DAILY_BURST_LIMIT = 30;
const DAILY_SEQ_WINDOW_MS = 10_000;
const DAILY_SEQ_LIMIT = 8;

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

function dailyScrapeBlocked(request: NextRequest, ip: string): boolean {
  const burstKey = edgeRateLimitKey('daily-json-burst', ip);
  const burst = checkRateLimit(burstKey, DAILY_BURST_LIMIT, DAILY_BURST_WINDOW_MS);
  if (!burst.allowed) return true;

  const match = request.nextUrl.pathname.match(
    /\/data\/(?:daily|petrobangla\/daily)\/(\d{4}-\d{2}-\d{2})\.json$/,
  );
  if (!match) return false;

  const now = Date.now();
  const seqKey = ip;
  const history = (dailyFetchTimestamps.get(seqKey) ?? []).filter((t) => now - t < DAILY_SEQ_WINDOW_MS);
  history.push(now);
  dailyFetchTimestamps.set(seqKey, history);
  if (dailyFetchTimestamps.size > 5_000) {
    dailyFetchTimestamps.clear();
  }
  return history.length > DAILY_SEQ_LIMIT;
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

  if (isProtectedDataJsonPath(pathname)) {
    const ip = clientIpFromForwarded(
      request.headers.get('x-forwarded-for'),
      request.headers.get('x-real-ip'),
    );

    if (dailyScrapeBlocked(request, ip)) {
      return denyDailyJson('Too many requests. Please slow down.', 429);
    }

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

      if (!isDateAllowedForTier(isoDate, tier, latestDate)) {
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

  if (!pathNeedsRoleCheck(pathname) && !hasSupabaseAuthCookie(request)) {
    return NextResponse.next({ request });
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