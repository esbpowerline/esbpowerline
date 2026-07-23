import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DSE_TICKER, type DseTickerItem } from '@/lib/bd-stock-market';
import { checkRateLimitResponse } from '@/lib/security';

export const revalidate = 60;

/**
 * DSE snapshot endpoint. There is no official free DSE market feed, so this
 * serves the curated baseline snapshot and says so honestly (`live: false`) —
 * no simulated jitter. Swap in a licensed feed here when one is available.
 */
export async function GET(request: NextRequest) {
  const limited = checkRateLimitResponse(request, 'api-market-dse', 60, 60_000);
  if (limited) return limited;

  const items: DseTickerItem[] = DEFAULT_DSE_TICKER;

  return NextResponse.json({
    market: 'DSE',
    live: false,
    note: 'Indicative snapshot - not a live market feed',
    updatedAt: new Date().toISOString(),
    items,
  });
}
