/**
 * The one place that knows which data file belongs to which feed.
 *
 * Both directions are needed and they must not drift: the runtime route maps a
 * URL to a feed, the publisher maps a feed back to the path it mirrors, and the
 * client asks "is this path published?" before choosing where to read it from.
 * Those were three separate hardcoded lists; a path added to one and missed in
 * another is exactly how curves and plants ended up publishable in principle
 * and 404 in practice.
 *
 * Isomorphic on purpose — the browser helper imports it too, so it must not
 * pull in Prisma or anything server-only. The feed names are a string union
 * kept in step with `enum DataFeed` in prisma/schema.prisma.
 */

export type DataFeedName =
  | 'GRID_DAILY'
  | 'GAS_DAILY'
  | 'GAS_INDEX'
  | 'GAS_LIVE_WEEK'
  | 'GAS_TIMELINE'
  | 'PGCB_MONTHLY_SERIES'
  | 'PGCB_MONTHLY'
  | 'SREDA_DAILY'
  | 'GRID_CURVE'
  | 'GRID_PLANTS'
  | 'PGCB_MONTHLY_EVENTS'
  | 'GAS_RESERVE_MODEL'
  | 'GAS_RESERVE_SENSITIVITY';

/** Aggregates have no natural key; they are singletons per feed. */
export const SINGLETON = 'singleton';

export type FeedTarget = { feed: DataFeedName; key: string };

const ISO_DATE_RE = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;
const MONTH_RE = /^(201[1-9]|202[0-9])-(0[1-9]|1[0-2])$/;

/** Feeds whose key is an ISO date, and the directory each mirrors. */
const DATED_FEEDS: ReadonlyArray<{ dir: string; feed: DataFeedName }> = [
  { dir: 'daily', feed: 'GRID_DAILY' },
  { dir: 'curves', feed: 'GRID_CURVE' },
  { dir: 'plants', feed: 'GRID_PLANTS' },
  { dir: 'petrobangla/daily', feed: 'GAS_DAILY' },
  { dir: 'sreda/daily', feed: 'SREDA_DAILY' },
];

/** Feeds that are a single file. */
const SINGLETON_FEEDS: ReadonlyArray<{ path: string; feed: DataFeedName }> = [
  { path: 'petrobangla/_index.json', feed: 'GAS_INDEX' },
  { path: 'petrobangla/_live_week.json', feed: 'GAS_LIVE_WEEK' },
  { path: 'petrobangla/timeline-summary.json', feed: 'GAS_TIMELINE' },
  { path: 'petrobangla/reserve-model.json', feed: 'GAS_RESERVE_MODEL' },
  { path: 'petrobangla/reserve-sensitivity.json', feed: 'GAS_RESERVE_SENSITIVITY' },
  { path: 'pgcb-monthly/_series.json', feed: 'PGCB_MONTHLY_SERIES' },
];

/**
 * Map a data path such as `daily/2026-08-19.json` to the feed backing it.
 *
 * The argument is a path RELATIVE to public/data — `daily/…`, `curves/…`,
 * `petrobangla/daily/…`. It must NOT begin with `data/` or `api/data/`.
 *
 * A previous version stripped exactly those prefixes, which quietly opened a
 * paywall bypass: middleware gates `/api/data/…` by canonicalising away only
 * the `/api`, so `/api/data/data/daily/X.json` failed its `^/data/(daily|…)/`
 * regex and passed ungated — while this resolver stripped the extra `data/` and
 * happily resolved it, serving tier-locked history to anonymous requests. The
 * two canonicalisers disagreeing IS the hole. So this no longer strips: a
 * doubled or prefixed path resolves to null, and the route 404s it.
 */
export function resolveDataTarget(relPath: string): FeedTarget | null {
  const path = relPath.replace(/^\/+/, '');
  // A leading `data/` or `api/data/` is never a valid feed directory; refusing
  // it here keeps this resolver from re-canonicalising a path middleware
  // already decided about.
  if (/^(api\/)?data\//.test(path)) return null;

  for (const { path: exact, feed } of SINGLETON_FEEDS) {
    if (path === exact) return { feed, key: SINGLETON };
  }

  // Before the generic month rule: `2026-07-events` would otherwise be taken
  // as a month key, fail the month pattern, and report the path as unknown.
  const events = /^pgcb-monthly\/(.+)-events\.json$/.exec(path);
  if (events) {
    return MONTH_RE.test(events[1]) ? { feed: 'PGCB_MONTHLY_EVENTS', key: events[1] } : null;
  }

  const month = /^pgcb-monthly\/(.+)\.json$/.exec(path);
  if (month) {
    return MONTH_RE.test(month[1]) ? { feed: 'PGCB_MONTHLY', key: month[1] } : null;
  }

  for (const { dir, feed } of DATED_FEEDS) {
    const hit = new RegExp(`^${dir}/(.+)\\.json$`).exec(path);
    if (hit) return ISO_DATE_RE.test(hit[1]) ? { feed, key: hit[1] } : null;
  }

  return null;
}

/** The data path a feed+key mirrors, or null if the key is not valid for it. */
export function dataPathFor(feed: DataFeedName, key: string): string | null {
  const singleton = SINGLETON_FEEDS.find((f) => f.feed === feed);
  if (singleton) return singleton.path;

  const dated = DATED_FEEDS.find((f) => f.feed === feed);
  if (dated) return ISO_DATE_RE.test(key) ? `${dated.dir}/${key}.json` : null;

  if (feed === 'PGCB_MONTHLY') return MONTH_RE.test(key) ? `pgcb-monthly/${key}.json` : null;
  if (feed === 'PGCB_MONTHLY_EVENTS') {
    return MONTH_RE.test(key) ? `pgcb-monthly/${key}-events.json` : null;
  }
  return null;
}

/** Whether a key is well-formed for a feed — the publisher's guard. */
export function isValidFeedKey(feed: DataFeedName, key: string): boolean {
  if (SINGLETON_FEEDS.some((f) => f.feed === feed)) return key === SINGLETON;
  return dataPathFor(feed, key) !== null;
}

export function staticDataUrl(relPath: string): string {
  return `/data/${relPath.replace(/^\/+/, '')}`;
}

export function runtimeDataUrl(relPath: string): string {
  return `/api/data/${relPath.replace(/^\/+/, '')}`;
}
