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

/** Archive fallback only for missing files or network failures — not auth/rate-limit blocks. */
export function shouldUseArchiveFallback(httpStatus: number | null): boolean {
  return httpStatus === null || httpStatus === 404;
}