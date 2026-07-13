import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DSE_TICKER, jitterDseSnapshot, type DseTickerItem } from '@/lib/bd-stock-market';
import { isSimulatedTelemetryEnabled } from '@/lib/telemetry-mode';
import { checkRateLimitResponse } from '@/lib/security';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const limited = checkRateLimitResponse(request, 'api-market-dse', 60, 60_000);
  if (limited) return limited;

  let items: DseTickerItem[] = DEFAULT_DSE_TICKER;

  if (isSimulatedTelemetryEnabled()) {
    items = jitterDseSnapshot(DEFAULT_DSE_TICKER);
  }

  return NextResponse.json({
    market: 'DSE',
    updatedAt: new Date().toISOString(),
    items,
  });
}