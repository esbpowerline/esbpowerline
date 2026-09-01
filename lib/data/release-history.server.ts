import 'server-only';
import prisma from '@/lib/prisma';
import type { RevisionKind } from '@prisma/client';

/**
 * Read side of the append-only release history (schema: DataReleaseRevision).
 *
 * The write side exists so a correction can never destroy the previous truth;
 * this is the half that makes the history visible — before it, revisions
 * accumulated with no way for a reviewer to see what changed, why, or by whom,
 * which is only marginally better than not keeping them.
 *
 * Fails soft to an empty list like every reader in releases.server.ts: the
 * history is an audit surface, and an audit surface that can take the admin
 * panel down with a database hiccup would get itself removed.
 */

export interface ReleaseRevisionRow {
  id: string;
  feed: string;
  key: string;
  revision: number;
  kind: RevisionKind;
  reason: string;
  checksum: string;
  previousChecksum: string | null;
  publishedById: string | null;
  publishedAt: string; // ISO — serialisable across the RSC boundary
  current: boolean;
}

export async function getRecentReleaseRevisions(limit = 40): Promise<ReleaseRevisionRow[]> {
  try {
    const rows = await prisma.dataReleaseRevision.findMany({
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        revision: true,
        kind: true,
        reason: true,
        checksum: true,
        previousChecksum: true,
        publishedById: true,
        publishedAt: true,
        supersededAt: true,
        release: { select: { feed: true, key: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      feed: r.release.feed,
      key: r.release.key,
      revision: r.revision,
      kind: r.kind,
      reason: r.reason,
      checksum: r.checksum,
      previousChecksum: r.previousChecksum,
      publishedById: r.publishedById,
      publishedAt: r.publishedAt.toISOString(),
      current: r.supersededAt === null,
    }));
  } catch (error) {
    console.warn(
      '[getRecentReleaseRevisions] history unavailable:',
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
