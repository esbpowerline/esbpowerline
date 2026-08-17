export function assertEnvVar(name: string): void {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable ${name}`);
  }
}

/**
 * Names whose absence makes the app wrong or insecure rather than degraded.
 * There is no working behaviour without these: no database, no session signing,
 * no auth backend. Failing the boot is the correct response.
 */
const FATAL_ENV = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/**
 * Names the app already handles the absence of. Missing one costs a feature,
 * not the site, so it is logged and the boot continues.
 *
 *   CRON_SECRET           `isCronAuthorized` returns false and both /api/cron/*
 *                         routes answer 503 — it fails closed. The cost is that
 *                         scheduled publishing silently stops, which is worth
 *                         shouting about but not worth a site-wide outage.
 *   NEXT_PUBLIC_SITE_URL  every one of its call sites already falls back to
 *                         https://esbpowerline.com.
 */
const WARN_ENV: Record<string, string> = {
  CRON_SECRET: 'scheduled publishing and /api/cron/* are disabled (they answer 503)',
  NEXT_PUBLIC_SITE_URL: 'canonical URLs fall back to https://esbpowerline.com',
};

/**
 * Check production configuration at boot.
 *
 * This runs from the instrumentation hook, which means a throw here kills every
 * server-rendered request before any page code runs while static routes keep
 * serving 200 — the build stays green and `vercel ls` reports Ready, so the
 * outage looks like an application bug. On 2026-08-15 three names were missing
 * from Vercel Production and /articles/*, /categories/* and /tags/* all 500'd
 * on that path. Two of the three could not have broken anything: CSRF_SECRET
 * was referenced nowhere outside this file, and NEXT_PUBLIC_SITE_URL has a
 * fallback at every call site.
 *
 * So the list is split by consequence, and every missing name is reported in
 * one message instead of throwing on the first — fixing these one redeploy at
 * a time is how a short outage becomes a long one.
 */
export function validateProdEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  for (const [name, consequence] of Object.entries(WARN_ENV)) {
    if (!process.env[name]) {
      console.warn(`[env-guard] ${name} is not set — ${consequence}.`);
    }
  }

  const missing = FATAL_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? 's' : ''} ${missing.join(', ')}`,
    );
  }
}
