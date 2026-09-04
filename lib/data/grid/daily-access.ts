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

/**
 * The Petrobangla archive: the per-gas-day files, and every aggregate derived
 * from them.
 *
 * The aggregates were listed by name — `_index`, `_live_week`,
 * `timeline-summary` — and the list went stale exactly the way
 * TIER_GATED_DAILY_DIRS did. `reserve-model.json`, `reserve-sensitivity.json`
 * and `reserves-published.json` were added later and never registered, so they
 * were served to any request that sent a browser user-agent, with no
 * same-origin check: 200 with no Referer at all, while `timeline-summary.json`
 * beside them answered 403 (verified against production 2026-09-04). They are
 * built from the same gated per-day archive — the reserve model is a depletion
 * projection over the whole of it — so they were the analytical use the tier
 * exists to sell, given away by an omission.
 *
 * So this matches the DIRECTORY rather than a roster: any .json sitting
 * directly under petrobangla/ is protected, and the next artifact to be split
 * out is covered on the day it lands instead of the day someone notices. The
 * dated `daily/` files keep their own branch because the tier window reads a
 * date out of them; an aggregate has none and takes the `!isoDate` public path
 * in middleware, so this adds the bot and same-origin checks without changing
 * what a browser on the site can read.
 */
const PETROBANGLA_JSON_RE =
  /^\/data\/petrobangla\/(daily\/\d{4}-\d{2}-\d{2}\.json|[A-Za-z0-9_][A-Za-z0-9._-]*\.json)$/;

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
/**
 * The path as the file system will see it, for gating.
 *
 * `request.nextUrl.pathname` is the path as SENT, and Next decodes it before
 * matching a static file. So `/data/d%61ily/2013-12-31.json` did not match
 * the gate's regex, was waved through as public, and was then served as
 * `/data/daily/2013-12-31.json` — every paid day, one percent sign away.
 * Reproduced live 2026-08-08 and still live 2026-09-03 (403 for the plain
 * path, 200 with real figures for the encoded one).
 *
 * Decoding repeats until the string is stable so a double-encoded `%2561`
 * cannot slip through either; that is strictly conservative, since a path that
 * needed two decodes never matches a real file and 404s regardless. A malformed
 * sequence keeps the raw path — a request Next itself will reject.
 */
export function normalizeRequestPath(pathname: string): string {
  let current = pathname;
  for (let i = 0; i < 3; i += 1) {
    if (!current.includes('%')) break;
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      break;
    }
    if (decoded === current) break;
    current = decoded;
  }
  // Collapse duplicate separators; `/data//daily/x.json` also reaches the file.
  return current.replace(/\/{2,}/g, '/');
}

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