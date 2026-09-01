import 'server-only';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import type { DataFeed } from '@prisma/client';

/**
 * Runtime-published data (see the DataRelease model). The static archive under
 * public/data still serves every day shipped with the last deploy; this layer
 * only knows about days published since.
 *
 * Everything here fails soft. A release lookup is an enhancement to a read path
 * that already works, so a database outage — or a deploy that lands the code
 * before the table exists — must degrade to the static archive rather than take
 * the Grid Explorer down. That mirrors the fail-open choice in middleware.ts.
 */

export const RELEASE_CACHE_TAG = 'data-releases';

/**
 * Upper bound on staleness, in seconds.
 *
 * Publishing invalidates by tag, so this is not the normal refresh path — it is
 * the backstop for the cases tag invalidation cannot cover: a row written
 * outside the server action (the local ingest bridge writes over SQL), or a
 * publish handled by a different serverless instance from the one serving a
 * read. Without it, `unstable_cache` holds a value indefinitely and a missing
 * day stays missing forever.
 *
 * A minute was chosen when the cost looked like "one query per feed per
 * minute". It is not: the query is `select { payload }`, and a payload is a
 * whole dataset — the gas timeline alone is ~1.6 MB — re-read per key, per
 * serverless instance, per region, with `/api/data/*` on `no-store` so no CDN
 * layer absorbs any of it. `grid-export.server.ts` calls `getReleaseOverride`
 * once per day in an export range, so one wide export is one full payload per
 * published day.
 *
 * The two environments want different numbers, and for a stated reason:
 *
 *   development — the local ingest bridge writes releases over raw SQL,
 *     bypassing the server action, so tag invalidation never fires and this
 *     backstop is the only thing that surfaces a freshly ingested day. Keep it
 *     short or the operator publishes and sees nothing.
 *
 *   production — every publish goes through `/api/admin/data/publish`, which
 *     calls `revalidateDataRelease` on the way out. Tag invalidation is the
 *     refresh path there, and this is genuinely only a backstop, so it can be
 *     long. Ten minutes bounds the worst case if an invalidation is ever missed
 *     and cuts the redundant payload reads by an order of magnitude.
 *
 * `RELEASE_CACHE_SECONDS` overrides both, for anyone who needs to tune it
 * without a deploy.
 */
const RELEASE_CACHE_SECONDS = (() => {
  const override = Number.parseInt(process.env.RELEASE_CACHE_SECONDS ?? '', 10);
  if (Number.isFinite(override) && override > 0) return override;
  return process.env.NODE_ENV === 'production' ? 600 : 60;
})();

/** Cache tag for one feed, so publishing a gas day does not bust the grid list. */
export function feedCacheTag(feed: DataFeed): string {
  return `data-release:${feed}`;
}

function logSoftFailure(what: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[releases] ${what} failed, falling back to static archive: ${message}`);
}

async function readPublishedKeys(feed: DataFeed): Promise<string[]> {
  try {
    const rows = await prisma.dataRelease.findMany({
      where: { feed, revokedAt: null },
      select: { key: true },
      orderBy: { key: 'asc' },
    });
    return rows.map((r) => r.key);
  } catch (error) {
    logSoftFailure(`key listing for ${feed}`, error);
    return [];
  }
}

async function readPayload(feed: DataFeed, key: string): Promise<unknown | null> {
  try {
    const row = await prisma.dataRelease.findUnique({
      where: { feed_key: { feed, key } },
      select: { payload: true, revokedAt: true },
    });
    if (!row || row.revokedAt) return null;
    return row.payload;
  } catch (error) {
    logSoftFailure(`payload read for ${feed}/${key}`, error);
    return null;
  }
}

/**
 * Keys published for a feed. Cached across requests and invalidated by tag on
 * publish — without this every Grid Explorer render would hit Postgres, which
 * is the one change here that could turn a free CDN read into a billed one.
 */
export function getPublishedKeys(feed: DataFeed): Promise<string[]> {
  return unstable_cache(() => readPublishedKeys(feed), ['data-release-keys', feed], {
    tags: [RELEASE_CACHE_TAG, feedCacheTag(feed)],
    revalidate: RELEASE_CACHE_SECONDS,
  })();
}

/**
 * Every published key, for every feed, in one query.
 *
 * The manifest previously asked `getPublishedKeys` once per feed — thirteen
 * concurrent queries against a pool of two, where any that lost the race
 * returned its soft-failure `[]` and `unstable_cache` then stored that empty
 * answer. The manifest visibly flickered: feeds appeared and vanished between
 * requests, which on the client means a published day intermittently reads as
 * unpublished.
 *
 * One query, one cache entry. Errors are deliberately NOT caught here: a thrown
 * error is not cached, whereas a caught one would poison the entry for the
 * whole revalidate window. The caller decides what a failure means.
 */
async function readAllPublishedKeys(): Promise<Record<string, string[]>> {
  const rows = await prisma.dataRelease.findMany({
    where: { revokedAt: null },
    select: { feed: true, key: true },
    orderBy: [{ feed: 'asc' }, { key: 'asc' }],
  });

  const grouped: Record<string, string[]> = {};
  for (const row of rows) {
    (grouped[row.feed] ??= []).push(row.key);
  }
  return grouped;
}

export function getAllPublishedKeys(): Promise<Record<string, string[]>> {
  return unstable_cache(readAllPublishedKeys, ['data-release-keys-all'], {
    tags: [RELEASE_CACHE_TAG],
    revalidate: RELEASE_CACHE_SECONDS,
  })();
}

/** Published payload for one key, or null if absent/revoked. */
export function getReleasePayload(feed: DataFeed, key: string): Promise<unknown | null> {
  return unstable_cache(() => readPayload(feed, key), ['data-release-payload', feed, key], {
    tags: [RELEASE_CACHE_TAG, feedCacheTag(feed)],
    revalidate: RELEASE_CACHE_SECONDS,
  })();
}

/**
 * The precedence rule every server-side reader must apply, in one place:
 * "a release always wins over a static file of the same key" (see the comment
 * above `enum DataFeed` in prisma/schema.prisma). Returns the published payload
 * when the key is published, or null to mean "nothing published — read the file".
 *
 * Checking the key list first is what makes this affordable. `getReleasePayload`
 * caches per key, so asking it about every day of a 1,500-day export would cost
 * a cache entry (and, on a cold instance, a query) per day; the key list is one
 * cached entry per feed. It also keeps the common case — a day that only exists
 * as a static file — free.
 *
 * Fails soft in both steps: an unreachable database yields an empty key list and
 * a null payload, so the caller falls through to the static archive.
 */
export async function getReleaseOverride(feed: DataFeed, key: string): Promise<unknown | null> {
  const published = await getPublishedKeys(feed);
  if (!published.includes(key)) return null;
  return getReleasePayload(feed, key);
}
