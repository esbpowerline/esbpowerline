import 'server-only';
import { DataFeed as DataFeedEnum } from '@prisma/client';
import type { DataFeed } from '@prisma/client';
import prisma from '@/lib/prisma';
import { payloadChecksum } from '@/lib/data/release-checksum';
import { validateDailyReport } from '@/lib/data/grid/validate-daily-report';
import { isValidFeedKey, dataPathFor, SINGLETON, type DataFeedName } from '@/lib/data/feed-paths';

/**
 * Writing a release: validation, checksum, upsert.
 *
 * Separated from the `publishRelease` server action so the same rules apply
 * however a publish is triggered — the admin panel, the bulk publish route, or
 * the command line after a local ingest. A second write path that skipped the
 * daily-report schema, or keyed a feed differently, would be a way to get a
 * payload onto the site that the loader then refuses to render.
 *
 * Auth is deliberately NOT here. This module cannot be reached from the browser
 * (the routes and the action own that check); a CLI has no session to check.
 */

export type WriteResult =
  | { ok: true; key: string; checksum: string; replaced: boolean; skipped?: 'unchanged' }
  | { ok: false; error: string };

/**
 * Key shape per feed, delegated to the feed↔path table so there is one
 * definition of what a valid key is.
 */
export function validateReleaseKey(feed: DataFeed, key: string): string | null {
  if (isValidFeedKey(feed as DataFeedName, key)) return null;
  const expected = dataPathFor(feed as DataFeedName, SINGLETON)
    ? '"singleton"'
    : 'an ISO date or YYYY-MM';
  return `Key ${expected} expected for ${feed}, got "${key}"`;
}

/**
 * Feed-specific payload checks. Only the grid daily shape has a schema today.
 *
 * The payload was parsed on an operator's machine, so it is untrusted input no
 * matter who sent it — this is the same schema the loader applies to static
 * files, so a release can never be laxer than a shipped file.
 */
export function validateReleasePayload(feed: DataFeed, payload: unknown): string | null {
  if (feed !== 'GRID_DAILY') return null;
  const result = validateDailyReport(payload);
  if (result.success) return null;
  const issues = result.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  return `Payload failed grid daily validation — ${issues}`;
}

/**
 * Catch a stale Prisma client before Prisma does, and say what to do about it.
 *
 * `prisma generate` rewrites node_modules, but a dev server that was already
 * running keeps the old module in Node's require cache — restarting is the only
 * way to pick it up, and `isPrismaClientCurrent` in lib/prisma.ts cannot help
 * because recreating the client re-reads the same stale module.
 *
 * Untreated, the operator gets Prisma's raw complaint — a wall of query AST
 * with "Invalid value for argument `feed`. Expected DataFeed." at the end —
 * which reads as "this feed is not a real feed" when the truth is "your server
 * is older than your schema". It cost a publish on 2026-08-21: GRID_CURVE,
 * GRID_PLANTS and the two reserve feeds all failed this way while the older
 * feeds in the same publish went through.
 */
function staleClientError(feed: DataFeed): string | null {
  const known = Object.values(DataFeedEnum as Record<string, string>);
  if (known.includes(feed)) return null;
  return (
    `The running server has an out-of-date Prisma client: it does not know the ${feed} feed, ` +
    'which is in prisma/schema.prisma and in the database. Run `npx prisma generate` and then ' +
    'restart the dev server (npm run dev:all) — a running process keeps the old client in memory.'
  );
}

export async function writeRelease(input: {
  feed: DataFeed;
  key: string;
  payload: unknown;
  sourceName?: string;
  sourceUrl?: string;
  parserVersion?: string;
  publishedById?: string | null;
  /** Publish even when the stored checksum already matches. */
  force?: boolean;
}): Promise<WriteResult> {
  const stale = staleClientError(input.feed);
  if (stale) return { ok: false, error: stale };

  const keyError = validateReleaseKey(input.feed, input.key);
  if (keyError) return { ok: false, error: keyError };

  const payloadError = validateReleasePayload(input.feed, input.payload);
  if (payloadError) return { ok: false, error: payloadError };

  const checksum = payloadChecksum(input.payload);

  try {
    const existing = await prisma.dataRelease.findUnique({
      where: { feed_key: { feed: input.feed, key: input.key } },
      select: { id: true, checksum: true, revokedAt: true },
    });

    // An unchanged re-publish is a large write for nothing — the gas timeline
    // alone is ~1.6MB — and it expires the feed's cache tag, so it would make
    // every reader re-query to see the same bytes. A revoked row still gets
    // rewritten: re-publishing is how a revoke is undone.
    if (!input.force && existing && !existing.revokedAt && existing.checksum === checksum) {
      return { ok: true, key: input.key, checksum, replaced: true, skipped: 'unchanged' };
    }

    await prisma.dataRelease.upsert({
      where: { feed_key: { feed: input.feed, key: input.key } },
      create: {
        feed: input.feed,
        key: input.key,
        payload: input.payload as object,
        checksum,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        parserVersion: input.parserVersion,
        publishedById: input.publishedById ?? undefined,
      },
      update: {
        payload: input.payload as object,
        checksum,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        parserVersion: input.parserVersion,
        publishedById: input.publishedById ?? undefined,
        // Re-publishing a revoked key restores it.
        revokedAt: null,
        publishedAt: new Date(),
      },
    });

    return { ok: true, key: input.key, checksum, replaced: Boolean(existing) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Publish failed: ${message}` };
  }
}
