import { NextResponse } from 'next/server';
import { getHistoryBounds } from '@/lib/data/grid/history.server';

/** The archive's extent, so the scrubber knows how far back it may travel. */
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { series: await getHistoryBounds() },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400' } },
  );
}
