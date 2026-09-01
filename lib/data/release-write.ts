import 'server-only';
import { DataFeed as DataFeedEnum } from '@prisma/client';
import type { DataFeed, RevisionKind } from '@prisma/client';
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
  | {
      ok: true;
      key: string;
      checksum: string;
      replaced: boolean;
      skipped?: 'unchanged';
      /** False when the append-only history row could not be written (see
       *  appendRevision) — the publish stands, but it is unaudited. */
      revisionRecorded?: boolean;
    }
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

/**
 * Append one row to the release's history, superseding the previous one.
 *
 * Fails SOFT, and loudly: the publish itself must not start failing on a
 * machine where migration 0012 has not been applied yet, and the release
 * layer's doctrine is fail-open (an Upstash outage once 500'd the whole site).
 * But an unrecorded revision is not silent either — it is logged and surfaced
 * as `revisionRecorded: false` so the operator sees an unaudited publish.
 * Rows here are never updated after creation except `supersededAt`.
 */
async function appendRevision(input: {
  releaseId: string;
  payload: unknown;
  checksum: string;
  previousChecksum: string | null;
  reason: string;
  kind: RevisionKind;
  publishedById?: string | null;
}): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      const last = await tx.dataReleaseRevision.findFirst({
        where: { releaseId: input.releaseId },
        orderBy: { revision: 'desc' },
        select: { id: true, revision: true },
      });
      const now = new Date();
      if (last) {
        await tx.dataReleaseRevision.update({
          where: { id: last.id },
          data: { supersededAt: now },
        });
      }
      await tx.dataReleaseRevision.create({
        data: {
          releaseId: input.releaseId,
          revision: (last?.revision ?? 0) + 1,
          payload: input.payload as object,
          checksum: input.checksum,
          previousChecksum: input.previousChecksum,
          reason: input.reason,
          kind: input.kind,
          publishedById: input.publishedById ?? undefined,
          publishedAt: now,
        },
      });
    });
    return true;
  } catch (error) {
    console.error(
      '[appendRevision] revision NOT recorded — this publish is unaudited. ' +
        'If migration 0012_data_release_revisions has not been applied, run npm run db:migrate. ',
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Record a revocation in the history. Called by `revokeRelease` after it sets
 * `revokedAt` — the payload is copied onto the revision so the history shows
 * exactly what was withdrawn, not merely that something was.
 */
export async function recordRevocation(
  feed: DataFeed,
  key: string,
  publishedById?: string | null,
  reason?: string,
): Promise<boolean> {
  const row = await prisma.dataRelease.findUnique({
    where: { feed_key: { feed, key } },
    select: { id: true, payload: true, checksum: true },
  });
  if (!row) return false;
  return appendRevision({
    releaseId: row.id,
    payload: row.payload,
    checksum: row.checksum,
    previousChecksum: row.checksum,
    reason: reason?.trim() || 'revoked — loader falls back to the static archive',
    kind: 'REVOKE',
    publishedById,
  });
}

export async function writeRelease(input: {
  feed: DataFeed;
  key: string;
  payload: unknown;
  sourceName?: string;
  sourceUrl?: string;
  parserVersion?: string;
  publishedById?: string | null;
  /** Why this is being published — carried verbatim onto the revision row.
   *  Defaults describe the mechanism; a human correction deserves a real one. */
  reason?: string;
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

    const row = await prisma.dataRelease.upsert({
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
      select: { id: true },
    });

    const kind: RevisionKind = !existing ? 'PUBLISH' : existing.revokedAt ? 'RESTORE' : 'CORRECT';
    const reason =
      input.reason?.trim() ||
      (kind === 'PUBLISH'
        ? `published${input.sourceName ? ` from ${input.sourceName}` : ''}`
        : kind === 'RESTORE'
          ? 're-published after revoke'
          : `payload replaced${input.sourceName ? ` from ${input.sourceName}` : ''}`);

    const revisionRecorded = await appendRevision({
      releaseId: row.id,
      payload: input.payload,
      checksum,
      previousChecksum: existing?.checksum ?? null,
      reason,
      kind,
      publishedById: input.publishedById,
    });

    return { ok: true, key: input.key, checksum, replaced: Boolean(existing), revisionRecorded };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Publish failed: ${message}` };
  }
}
