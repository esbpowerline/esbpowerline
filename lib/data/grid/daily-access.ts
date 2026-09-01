const BLOCKED_BOT_REGEX =
  /ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|exabot|screamingfrog|petalbot|coccocbot|yandexbot|baiduspider|sogou|adsbot-google|amazonbot|claude-web-crawler|claudebot|gptbot|chatgpt-user|perplexitybot|coherebot|blexbot|bytespider|python-requests|node-fetch|got|axios|urllib|curl|wget|headless|phantomjs|selenium|playwright|puppeteer|oai-searchbot|meta-externalagent|applebot-extended|google-cloudvertexbot/i;

/** Strip port and www. for apex/www host comparison. */
export function normalizeSiteHost(host: string): string {
  return host.split(':')[0].replace(/^www\./i, '').toLowerCase();
}

export function isBlockedBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim() === '') return true;
  return BLOCKED_BOT_REGEX.test(userAgent);
}

/**
 * Production gate: require Referer or Origin from the same site (www/apex normalized).
 * In non-production, always allow.
 */
export function isSameOriginDailyAccess(
  referer: string | null,
  origin: string | null,
  requestHost: string | null,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (nodeEnv !== 'production') return true;
  if (!requestHost) return false;

  const normalizedRequest = normalizeSiteHost(requestHost);
  const candidates = [referer, origin].filter((v): v is string => Boolean(v?.trim()));

  for (const header of candidates) {
    try {
      const url = new URL(header);
      if (normalizeSiteHost(url.host) === normalizedRequest) return true;
    } catch {
      // ignore malformed header
    }
  }
  return false;
}

/**
 * Directories holding one JSON file per grid day, all of them the same day's
 * data behind the same tier gate.
 *
 * `daily` is the payload proper; `plants` (per-station detail) and `curves`
 * (the half-hourly generation-by-fuel stack) were split out of it only so Next
 * stops tracing the whole archive into every serverless bundle that imports the
 * loader. Splitting a section out must not unlock it, but it did twice: `plants`
 * was caught, `curves` was not, and 1,979 days of locked fuel-mix history served
 * 200 to anonymous requests — with the bot and same-origin checks skipped as
 * well, since they sit in the same middleware block.
 *
 * This list lives here rather than inline in middleware.ts so the next split has
 * one obvious place to register itself and a test that fails if it doesn't.
 *
 * It did not, again: `forecast` was added as a fourth per-day directory and
 * never registered, so the test that exists for exactly this had been failing.
 * A forecast is derived from the same gated readings and the historical run of
 * them is the backtest — the analytical use the tier is for. Forward-dated
 * files are unaffected, because the gate is a window on the date in the
 * filename, and a day that has not happened yet is never outside it.
 */
export const TIER_GATED_DAILY_DIRS = ['daily', 'plants', 'curves', 'forecast'] as const;

const DAILY_JSON_RE = new RegExp(
  `^/data/(${TIER_GATED_DAILY_DIRS.join('|')})/\\d{4}-\\d{2}-\\d{2}\\.json$`,
);

const PETROBANGLA_JSON_RE =
  /^\/data\/petrobangla\/(daily\/\d{4}-\d{2}-\d{2}\.json|_index\.json|timeline-summary\.json|_live_week\.json)$/;

/** The ISO date a gated data path is for, or undefined for the non-dated files. */
const DATED_JSON_RE = new RegExp(
  `/data/(?:${TIER_GATED_DAILY_DIRS.join('|')}|petrobangla/daily)/(\\d{4}-\\d{2}-\\d{2})\\.json$`,
);

/**
 * Runtime-published days are served by /api/data/*, which mirrors the static
 * /data/* path exactly. Canonicalising means the gating rules are written once
 * and apply to both — a second copy for the API twin is precisely the kind of
 * thing that drifts and quietly opens a hole.
 */
export function canonicalDataPath(pathname: string): string {
  return pathname.startsWith('/api/data/') ? pathname.slice('/api'.length) : pathname;
}

export function isDailyJsonPath(pathname: string): boolean {
  return DAILY_JSON_RE.test(pathname);
}

export function isPetrobanglaJsonPath(pathname: string): boolean {
  return PETROBANGLA_JSON_RE.test(pathname);
}

export function isProtectedDataJsonPath(pathname: string): boolean {
  const canonical = canonicalDataPath(pathname);
  return isDailyJsonPath(canonical) || isPetrobanglaJsonPath(canonical);
}

export function dataPathIsoDate(pathname: string): string | undefined {
  return DATED_JSON_RE.exec(canonicalDataPath(pathname))?.[1];
}

/** Archive fallback only for missing files or network failures — not auth/rate-limit blocks. */
export function shouldUseArchiveFallback(httpStatus: number | null): boolean {
  return httpStatus === null || httpStatus === 404;
}