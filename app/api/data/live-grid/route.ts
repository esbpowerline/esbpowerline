import { NextResponse } from 'next/server';
import { getLiveGridSnapshot } from '@/lib/data/grid/live-grid.server';

/**
 * The live grid snapshot — NLDC's hourly generation/demand pages, parsed and
 * cached server-side (10-minute window shared by every reader).
 *
 * Public and unauthenticated, like the rest of /api/data: the figures are
 * PGCB's own published page, restated. The homepage panel polls this to stay
 * current while open; anything else that wants "the grid right now" reads the
 * same route rather than scraping twice.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getLiveGridSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    // No cached copy and the source is unreachable: say so, cache nothing.
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: `NLDC pages unavailable: ${message}` },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
