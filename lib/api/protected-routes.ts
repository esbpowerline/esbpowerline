/**
 * API path prefixes gated by middleware.ts (CRON_SECRET or role-scoped session).
 * Role requirements enforced in middleware.ts: analytics → analytics.view_all,
 * upload → media.upload, grid-export → SUBSCRIBER only.
 */
export const PROXY_PROTECTED_API_PREFIXES = [
  '/api/analytics',
  '/api/upload',
  '/api/members/grid-export',
] as const;

export function isProxyProtectedApi(pathname: string): boolean {
  return PROXY_PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}