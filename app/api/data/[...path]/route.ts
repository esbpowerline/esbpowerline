import { NextResponse } from 'next/server';
import type { DataFeed } from '@prisma/client';
import { getReleasePayload } from '@/lib/data/releases.server';

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

/** Aggregates have no natural key; they are singletons per feed. */
const SINGLETON = 'singleton';

const ISO_DATE_RE = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;
const MONTH_RE = /^(201[1-9]|202[0-9])-(0[1-9]|1[0-2])$/;

type Target = { feed: DataFeed; key: string };

/** Map a mirrored data path to the feed + key that backs it. */
export function resolveTarget(segments: string[]): Target | null {
  const path = segments.join('/');

  const daily = /^daily\/(.+)\.json$/.exec(path);
  if (daily) {
    return ISO_DATE_RE.test(daily[1]) ? { feed: 'GRID_DAILY', key: daily[1] } : null;
  }

  const gasDaily = /^petrobangla\/daily\/(.+)\.json$/.exec(path);
  if (gasDaily) {
    return ISO_DATE_RE.test(gasDaily[1]) ? { feed: 'GAS_DAILY', key: gasDaily[1] } : null;
  }

  if (path === 'petrobangla/_index.json') return { feed: 'GAS_INDEX', key: SINGLETON };
  if (path === 'petrobangla/_live_week.json') return { feed: 'GAS_LIVE_WEEK', key: SINGLETON };
  if (path === 'petrobangla/timeline-summary.json') return { feed: 'GAS_TIMELINE', key: SINGLETON };
  if (path === 'pgcb-monthly/_series.json') return { feed: 'PGCB_MONTHLY_SERIES', key: SINGLETON };

  const month = /^pgcb-monthly\/(.+)\.json$/.exec(path);
  if (month) {
    return MONTH_RE.test(month[1]) ? { feed: 'PGCB_MONTHLY', key: month[1] } : null;
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = resolveTarget(path ?? []);

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
