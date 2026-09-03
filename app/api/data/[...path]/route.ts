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
      // Shared-cacheable, on purpose. This used to be `private, no-store` on
      // the theory that tier-gated payloads must never sit in a shared cache —
      // which meant nothing through here was ever absorbed by the CDN: every
      // read of a released day, and of the 1.2–1.65 MB gas index and timeline
      // keys, was a function invocation plus a Postgres payload read, per
      // visitor, per region (audit 2026-09-01, §3 "top offenders").
      //
      // The gate does not live in this handler; it lives in middleware, and on
      // Vercel middleware runs BEFORE the edge cache on every request. A locked
      // date is 403'd by the middleware before any cache lookup, so a cached
      // body is only ever handed to a request the gate has already passed.
      // What the cache stores is the same bytes every passing reader would get.
      //
      // Ten minutes matches RELEASE_CACHE_SECONDS in releases.server.ts — a
      // correction republished today is visible within the same window the
      // data cache already allows — and stale-while-revalidate keeps a
      // cold-region miss from waiting on Postgres.
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
