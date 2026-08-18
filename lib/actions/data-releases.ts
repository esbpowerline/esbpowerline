'use server';

import type { DataFeed } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { RELEASE_CACHE_TAG, feedCacheTag } from '@/lib/data/releases.server';
import { revalidateDataRelease } from '@/lib/revalidate-tags';
import { writeRelease } from '@/lib/data/release-write';

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

  const result = await writeRelease({ ...input, publishedById: session.user.id });
  if (!result.ok) return result;

  revalidateDataRelease(feedCacheTag(input.feed), RELEASE_CACHE_TAG);
  return { ok: true, key: result.key, checksum: result.checksum, replaced: result.replaced };
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
