'use server';

import type { DataFeed } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { RELEASE_CACHE_TAG, feedCacheTag } from '@/lib/data/releases.server';
import { revalidateDataRelease } from '@/lib/revalidate-tags';
import { validateDailyReport } from '@/lib/data/grid/validate-daily-report';
import { payloadChecksum } from '@/lib/data/release-checksum';

/**
 * Publishing a day to the live site without a deployment.
 *
 * The payload arriving here was parsed on an operator's machine, so it is
 * untrusted input no matter who sent it — it is re-validated server-side before
 * anything is written. That check is the same `dailyReportSchema` the loader
 * already applies to static files, so a release cannot be laxer than a shipped
 * file.
 */

export type PublishResult =
  | { ok: true; key: string; checksum: string; replaced: boolean }
  | { ok: false; error: string };

const ISO_DATE_RE = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;
const MONTH_RE = /^(201[1-9]|202[0-9])-(0[1-9]|1[0-2])$/;

function validateKey(feed: DataFeed, key: string): string | null {
  switch (feed) {
    case 'GRID_DAILY':
    case 'GAS_DAILY':
    case 'SREDA_DAILY':
      return ISO_DATE_RE.test(key) ? null : `Key must be an ISO date, got "${key}"`;
    case 'PGCB_MONTHLY':
      return MONTH_RE.test(key) ? null : `Key must be YYYY-MM, got "${key}"`;
    default:
      return key === 'singleton' ? null : `Aggregate feeds use the key "singleton", got "${key}"`;
  }
}

/** Feed-specific payload checks. Only the grid daily shape has a schema today. */
function validatePayload(feed: DataFeed, payload: unknown): string | null {
  if (feed !== 'GRID_DAILY') return null;
  const result = validateDailyReport(payload);
  if (result.success) return null;
  const issues = result.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  return `Payload failed grid daily validation — ${issues}`;
}

export async function publishRelease(input: {
  feed: DataFeed;
  key: string;
  payload: unknown;
  sourceName?: string;
  sourceUrl?: string;
  parserVersion?: string;
}): Promise<PublishResult> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return { ok: false, error: 'Unauthorized' };
  }

  const keyError = validateKey(input.feed, input.key);
  if (keyError) return { ok: false, error: keyError };

  const payloadError = validatePayload(input.feed, input.payload);
  if (payloadError) return { ok: false, error: payloadError };

  const checksum = payloadChecksum(input.payload);

  try {
    const existing = await prisma.dataRelease.findUnique({
      where: { feed_key: { feed: input.feed, key: input.key } },
      select: { id: true },
    });

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
        publishedById: session.user.id,
      },
      update: {
        payload: input.payload as object,
        checksum,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        parserVersion: input.parserVersion,
        publishedById: session.user.id,
        // Re-publishing a revoked key restores it.
        revokedAt: null,
        publishedAt: new Date(),
      },
    });

    revalidateDataRelease(feedCacheTag(input.feed), RELEASE_CACHE_TAG);

    return { ok: true, key: input.key, checksum, replaced: Boolean(existing) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Publish failed: ${message}` };
  }
}

/**
 * Withdraw a release. The row is kept (so the mistake stays auditable) and the
 * loader falls back to the static archive for that key.
 */
export async function revokeRelease(feed: DataFeed, key: string): Promise<PublishResult> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.revoke')) {
    return { ok: false, error: 'Unauthorized' };
  }

  try {
    const row = await prisma.dataRelease.update({
      where: { feed_key: { feed, key } },
      data: { revokedAt: new Date() },
      select: { checksum: true },
    });

    revalidateDataRelease(feedCacheTag(feed), RELEASE_CACHE_TAG);

    return { ok: true, key, checksum: row.checksum, replaced: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Revoke failed: ${message}` };
  }
}
