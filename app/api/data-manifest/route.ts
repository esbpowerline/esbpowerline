import { NextResponse } from 'next/server';
import { getAllPublishedKeys, RELEASE_CACHE_TAG } from '@/lib/data/releases.server';
import type { DataFeedName } from '@/lib/data/feed-paths';

/**
 * Which keys are published at runtime, so a reader can tell whether the static
 * file or the database holds the current version.
 *
 * Without this the browser could only discover a release by getting a 404 from
 * the static path — which means a *correction* to an already-shipped day could
 * never be seen, because the stale file answers 200 and nothing ever asks the
 * database. The schema has always said "a release always wins over a static
 * file of the same key"; this is what makes that true on the client.
 *
 * It lives outside /api/data because that segment is a catch-all, and Next
 * treats an `_`-prefixed folder as private and would not route it at all.
 *
 * Keys only — no payloads — so it stays small and carries nothing tier-gated.
 */

export const dynamic = 'force-dynamic';

export type DataManifest = {
  generatedAt: string;
  feeds: Partial<Record<DataFeedName, string[]>>;
  /** True when the database could not be read; the client then keeps to static. */
  degraded?: boolean;
};

export async function GET() {
  let feeds: Partial<Record<DataFeedName, string[]>> = {};
  let degraded = false;

  try {
    feeds = (await getAllPublishedKeys()) as Partial<Record<DataFeedName, string[]>>;
  } catch (error) {
    // Fail soft, like every other release read: the site must keep serving its
    // static archive rather than break every chart. Saying so explicitly beats
    // an empty manifest that reads as "nothing is published".
    degraded = true;
    console.warn(
      `[data-manifest] read failed, clients will use the static archive: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const body: DataManifest = {
    generatedAt: new Date().toISOString(),
    feeds,
    ...(degraded ? { degraded: true } : {}),
  };

  return NextResponse.json(body, {
    headers: {
      // Short shared cache: every reader wants the same answer and none of it is
      // tier-gated, but a publish must show up quickly. Not cached at all when
      // degraded, so a database blip cannot be pinned for the whole window.
      'Cache-Control': degraded
        ? 'no-store'
        : 'public, s-maxage=30, stale-while-revalidate=120',
      'X-Release-Tag': RELEASE_CACHE_TAG,
    },
  });
}
