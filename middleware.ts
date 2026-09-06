import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import {
  canAccessPath,
  roleHomePath,
  resolveWorkspaceUrl,
  hostContextFromHeaders,
  isStaffRole,
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
  normalizeRequestPath,
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
  // Coarse outer gate for the staff API surface: an active staff session, and
  // nothing finer. Each handler still enforces its own permission — the publish
  // routes want `data.publish`, the CMS routes `article.create` — and that
  // stays where it can see the request body. What this adds is a floor: an
  // anonymous request, or a SUBSCRIBER, never reaches a handler at all, even
  // one someone forgets to guard.
  if (
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/') ||
    pathname === '/api/cms' ||
    pathname.startsWith('/api/cms/')
  ) {
    return isStaffRole(role);
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
  // Gate on the path the file system will resolve, not the path as typed:
  // see normalizeRequestPath for the percent-encoding bypass this closes.
  const pathname = normalizeRequestPath(request.nextUrl.pathname);

  // The news index no longer takes query strings: `?category=`, `?sort=` and
  // `?page=` each became a real page in Stage 4 of the SEO fix. Google holds
  // hundreds of the old combinations ("crawled, currently not indexed"), so
  // they are sent permanently to their replacements. Pure URL normalisation,
  // ahead of and independent from everything below.
  if (pathname === '/articles' && request.nextUrl.search) {
    const q = request.nextUrl.searchParams;
    const category = q.get('category');
    const page = Number.parseInt(q.get('page') ?? '', 10);
    const target = category
      ? `/categories/${encodeURIComponent(category)}`
      : q.get('sort') === 'views'
        ? '/articles/popular'
        : Number.isInteger(page) && page >= 2
          ? `/articles/page/${page}`
          : '/articles';
    return NextResponse.redirect(new URL(target, request.url), 308);
  }
  const ip = clientIpFromForwarded(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-vercel-forwarded-for'),
  );

  // Global Upstash Rate Limiting. An Upstash outage used to reject inside
  // middleware with no catch, which 500s every route on the site — a limiter
  // failure must degrade, not take the site down.
  if (redis) {
    // The data twins (/api/data/*, /api/data-manifest) are read-only, gated
    // and CDN-cached below; every Grid Explorer visit fires a handful of them,
    // and each limiter check is two Upstash commands. That was the single
    // largest consumer of the Upstash allowance for no protection the tier
    // gate and the edge cache do not already give.
    const isReadOnlyDataApi =
      request.method === 'GET' &&
      (pathname.startsWith('/api/data/') || pathname === '/api/data-manifest');
    const limiter = isCredentialPath(pathname)
      ? authRateLimit
      : pathname.startsWith('/api/') && !isReadOnlyDataApi
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
    // Bounded: a day can only be "just published" if it is within the visitor
    // window of the shipped catalog. Unbounded, this made EVERY runtime-
    // published day public at any tier — including a backfilled 2019 day,
    // which is exactly the kind of day the tier exists to sell.
    const isBeyondShippedArchive =
      !!isoDate &&
      !!latestDate &&
      isoDate > latestDate &&
      (Date.parse(isoDate) - Date.parse(latestDate)) / 86_400_000 <= 7;

    const isPublicDate =
      !isoDate ||
      !latestDate ||
      isPublicSampleDate(isoDate) ||
      isBeyondShippedArchive ||
      inPetrobanglaPublicWindow ||
      isDateAllowedForTier(isoDate, 'visitor', latestDate);

    if (isPublicDate) {
      const publicResponse = NextResponse.next({ request });
      // Public-window days are the hot path and the same bytes for everyone,
      // so let the CDN keep them. `private, no-store` here (and the matching
      // rules that used to sit in vercel.json / next.config) meant even the
      // newest day was fetched from origin by every visitor. The gate is
      // unaffected: middleware runs before the edge cache, so a day that has
      // fallen out of the window is refused before any cached copy is
      // consulted, and the referer/bot checks above run every time too.
      // An hour, because the newest day can be corrected and republished
      // (the daemon re-runs late Petrobangla windows into an existing day).
      publicResponse.headers.set(
        'Cache-Control',
        'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      );
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
    // A router prefetch is speculative and carries no user-visible state; it
    // never needs a token refresh, and on the homepage 10–30 of them fire per
    // view for a signed-in reader (cost audit, 2026-09-03).
    if (request.headers.get('next-router-prefetch') === '1') {
      return NextResponse.next({ request });
    }
    // Refresh only. No decision is made on this path, so no verification call.
    const { response } = await updateSession(request, { verify: false });
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

/**
 * What middleware is allowed to see.
 *
 * Middleware runs *before* the edge cache, so every matched request is an
 * invocation whether or not the CDN answers it. Measured with a browser
 * (2026-09-06): a category page cost 1, an article 3, the homepage 5.
 *
 * Two groups are excluded, and the distinction matters:
 *
 *   BY PREFIX — build output and asset directories that can never carry a
 *     session, a role or a gated date. `__nextjs_font` is new here; it was
 *     costing one invocation on every page that pulled a face.
 *
 *   BY EXTENSION — the same idea, generalised. Fonts, icons, stylesheets,
 *     source maps, the manifest, the RSS feed, the two extra sitemaps
 *     (news-sitemap.xml and grid-sitemap.xml, which crawlers hit constantly and
 *     which the old prefix list missed because it named only `sitemap.xml`) and
 *     the PDFs under /public/pdf. Anchored with `$`, so it matches a real file
 *     extension at the end of a path and not a dot inside a slug.
 *
 * `.json` is deliberately NOT in the extension list, and must never be added.
 * The Grid Explorer tier gate lives in this file and works on `/data/**.json`
 * and its `/api/data/**` twin; excluding those would publish the whole archive.
 * That is 41 of the 44 invocations one Grid Explorer view costs, and it is the
 * price of the gate, not waste. CLAUDE.md records three separate occasions when
 * a name-based exclusion around this data quietly unlocked it — most recently
 * 1,979 locked days served to anyone — so the safe direction here is fewer
 * requests from the client, not a wider hole in the matcher.
 * `lib/test/middleware-matcher.test.ts` asserts both halves.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|__nextjs_font|images|api/cron|.*\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|otf|eot|css|js|mjs|map|txt|xml|webmanifest|pdf)$).*)',
  ],
};