/**
 * API path prefixes gated by middleware.ts (CRON_SECRET or role-scoped session).
 * Role requirements enforced in middleware.ts: analytics → analytics.view_all,
 * upload → media.upload, grid-export → any signed-in role (tier resolved in route),
 * admin/cms → any staff role, with the specific permission left to the route.
 *
 * `/api/admin` and `/api/cms` were absent, and `pathNeedsRoleCheck()` matches
 * `/admin` — which `/api/admin` does not start with — so the whole admin API
 * surface reached its handlers without the middleware ever resolving a session.
 * Every handler does carry its own guard today (`data.publish`,
 * `article.create`, `canAccessAdminPanel`), so nothing was exposed; but
 * CLAUDE.md states that access control lives in middleware, and for this
 * surface it did not. A route added tomorrow without a guard would have been
 * protected by nothing at all.
 *
 * The middleware layer is deliberately coarse — "an active staff session" —
 * because the precise permission differs per route and belongs with the route.
 * Two independent layers, neither sufficient alone.
 */
export const PROXY_PROTECTED_API_PREFIXES = [
  '/api/analytics',
  '/api/upload',
  '/api/members/grid-export',
  '/api/admin',
  '/api/cms',
] as const;

export function isProxyProtectedApi(pathname: string): boolean {
  return PROXY_PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}