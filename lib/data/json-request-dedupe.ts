/**
 * One in-flight request per data URL, shared by every caller in the tab.
 *
 * Measured on production 2026-09-19 (SEO_FIX_LOG stage 10, §10.2): one load of
 * /grid-explorer made 25 same-origin `/api/data/…` requests for 10 distinct
 * files — `daily/2026-09-12.json` four times, three other days three times
 * each, `plants/2026-09-17.json` four times. Every reader above this layer
 * already keeps a result cache (`daily-cache.ts`, the plant and curve maps,
 * the Petrobangla `dayCache`), but each fills its cache only after the
 * response lands, so two components asking for the same day in the same
 * render — the stations KPI strip and the stations table, the gas bootstrap
 * and the live week, an effect re-run on a session-state change — each sent
 * their own request. Each of those is a middleware invocation (the tier gate
 * runs before the edge cache, by design) and on a STALE or MISS a function
 * run and a Postgres read: the largest per-view request cost on the site.
 *
 * This maps a URL to the promise of its parsed body while the request is
 * open, so concurrent callers share one fetch, and drops it on settle. It is
 * deliberately not a result cache: the readers above own those, and the
 * daily loader's `refresh` flag relies on a settled URL being fetchable
 * again (stale-while-revalidate, revalidated by ETag). A body can only be
 * read once, which is why the shared value is the parsed JSON rather than
 * the Response.
 *
 * What is shared is exactly what `fetch` answered — a 403 or 404 is
 * returned to every waiter as that status, never as data, and is not held
 * past the request: a tier denial is decided by middleware on each request
 * and a reader that signs in between two asks must be able to get the day.
 * A network failure rejects for every waiter, as each would have seen alone.
 */

export type JsonRequestResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number };

const inflight = new Map<string, Promise<JsonRequestResult<unknown>>>();

export function fetchJsonDeduped<T>(
  url: string,
  init?: RequestInit,
): Promise<JsonRequestResult<T>> {
  const held = inflight.get(url);
  if (held) return held as Promise<JsonRequestResult<T>>;

  const request: Promise<JsonRequestResult<unknown>> = fetch(url, init).then(async (res) => {
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, data: (await res.json()) as unknown };
  });
  inflight.set(url, request);
  void request
    .finally(() => {
      if (inflight.get(url) === request) inflight.delete(url);
    })
    // The waiters see the rejection through `request`; this chain exists only
    // to clear the map and must not surface as an unhandled rejection.
    .catch(() => undefined);
  return request as Promise<JsonRequestResult<T>>;
}

/** How many URLs are open right now — for tests. */
export function inflightJsonRequestCount(): number {
  return inflight.size;
}
