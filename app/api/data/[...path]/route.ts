import { NextResponse } from 'next/server';
import type { DataFeed } from '@prisma/client';
import { getReleasePayload } from '@/lib/data/releases.server';
import { resolveDataTarget } from '@/lib/data/feed-paths';

/**
 * Runtime twin of the static data files under public/data.
 *
 * The URL deliberately mirrors the static one — /api/data/daily/2026-08-01.json
 * against /data/daily/2026-08-01.json — so middleware can strip the /api prefix
 * and apply exactly the same tier gating to both. One gate, no second copy of
 * the rules to drift.
 *
 * A 404 here is the normal case for any day that still lives in the static
 * archive; the client tries this route only after the static path misses.
 */

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = resolveDataTarget((path ?? []).join('/'));

  if (!target) {
    return NextResponse.json({ error: 'Unknown data path' }, { status: 404 });
  }

  const payload = await getReleasePayload(target.feed, target.key);
  if (payload === null) {
    return NextResponse.json({ error: 'Not published' }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      // Matches what middleware puts on the static files. These payloads are
      // tier-gated, so they must not land in a shared cache; the database read
      // behind this is memoised by tag instead (see releases.server.ts).
      'Cache-Control': 'private, no-store',
    },
  });
}
