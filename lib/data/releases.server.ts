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
 * day stays missing forever. A minute costs at most one query per feed per
 * minute, which is nothing next to the risk of serving a stale archive.
 */
const RELEASE_CACHE_SECONDS = 60;

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

/** Published payload for one key, or null if absent/revoked. */
export function getReleasePayload(feed: DataFeed, key: string): Promise<unknown | null> {
  return unstable_cache(() => readPayload(feed, key), ['data-release-payload', feed, key], {
    tags: [RELEASE_CACHE_TAG, feedCacheTag(feed)],
    revalidate: RELEASE_CACHE_SECONDS,
  })();
}
