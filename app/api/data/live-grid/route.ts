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
        /*
          Kept in step with REVALIDATE_S in live-grid.server.ts, because the two
          caches STACK. At 600s each a reader sat up to ~20 minutes behind NLDC,
          and the hour-long `stale-while-revalidate` made the tail far worse on
          a quiet day: SWR serves the stale copy immediately and refreshes
          behind it, so the reader who triggers the refresh is not the one who
          benefits from it.

          Vercel consumes `s-maxage` for its edge cache and strips it from the
          response, which is why the header a client sees is a bare
          `Cache-Control: public`. That is worth knowing before checking this
          from the outside: a request with a cache-busting query string skips
          the edge entirely and will look fresh no matter how stale the cached
          copy is. Ask for the URL the browser actually asks for, and read
          `Age` and `X-Vercel-Cache`.
        */
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=600',
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
