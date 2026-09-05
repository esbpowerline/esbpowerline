import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import {
  getEarliestAllowedDate,
  parseGridPlanId,
  resolveGridAccessTier,
} from '@/lib/data/grid/grid-tier-access';
import { getRuntimeLatestDate } from '@/lib/data/grid/available-dates.server';
import {
  HISTORY_METRICS,
  getHistorySeries,
  RULES_VERSION,
} from '@/lib/data/grid/history.server';
import type { Aggregation, Resolution } from '@/lib/data/grid/history-aggregate';

/**
 * A derived historical series.
 *
 * The tier is applied by CLAMPING the range rather than refusing the request:
 * a visitor asking for a decade gets the window their plan allows and is told,
 * in `clamped`, that the range was narrowed and where to. Refusing outright
 * would make the scrubber unusable for the readers most likely to convert, and
 * clamping leaks nothing — the earliest allowed date comes from the same
 * `getEarliestAllowedDate` the static gate uses, so there is one rule with two
 * call sites rather than two rules.
 *
 * Middleware still applies the bot and same-origin checks: this path is
 * registered in `isProtectedDataJsonPath`, and carries no date in the path, so
 * it takes the same `!isoDate` public branch the Petrobangla aggregates take.
 */
export const dynamic = 'force-dynamic';

const RESOLUTIONS: Resolution[] = ['hour', 'day', 'month'];
const AGGREGATIONS: Aggregation[] = ['mean', 'max', 'min', 'sum'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const metric = url.searchParams.get('metric') ?? 'totalMw';
  const resolution = (url.searchParams.get('resolution') ?? 'day') as Resolution;
  const aggregation = (url.searchParams.get('agg') ?? 'mean') as Aggregation;
  const requestedFrom = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';
  const dense = url.searchParams.get('dense') !== '0';

  if (!HISTORY_METRICS.includes(metric as never)) {
    return NextResponse.json({ error: `Unknown metric: ${metric}` }, { status: 400 });
  }
  if (!RESOLUTIONS.includes(resolution) || !AGGREGATIONS.includes(aggregation)) {
    return NextResponse.json({ error: 'Unknown resolution or aggregation' }, { status: 400 });
  }
  if (!ISO_DATE.test(requestedFrom) || !ISO_DATE.test(to)) {
    return NextResponse.json({ error: 'from and to must be YYYY-MM-DD' }, { status: 400 });
  }

  // Tier window, resolved exactly as /api/members/grid-export resolves it, and
  // clamped with the same helper the static gate uses.
  const latest = await getRuntimeLatestDate();
  let from = requestedFrom;
  let clamped: { from: string; requestedFrom: string } | null = null;
  let tier: Parameters<typeof getEarliestAllowedDate>[0] = 'visitor';
  try {
    const session = await auth();
    if (session?.user?.id) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      tier = resolveGridAccessTier({
        isAuthenticated: true,
        role: session.user.role,
        gridPlan: parseGridPlanId(data?.user?.app_metadata?.grid_plan),
      });
    }
  } catch {
    // A failure resolving the session must never grant MORE than a visitor has.
    tier = 'visitor';
  }
  const earliest = latest ? getEarliestAllowedDate(tier, latest) : null;
  if (earliest && requestedFrom < earliest) {
    from = earliest;
    clamped = { from: earliest, requestedFrom };
  }

  const restriction = {
    requested: { from: requestedFrom, to },
    effective: { from: clamped ? from : requestedFrom, to },
    restricted: Boolean(clamped),
    reason: clamped ? ('tier' as const) : null,
    tier,
  };

  if (from > to) {
    // The whole range is outside entitlement. This is NOT a 404 and the body
    // says so: the archive is not missing these years, the reader cannot reach
    // them. Both ranges are returned so the client can say which is which.
    return NextResponse.json(
      {
        error: 'The requested range lies entirely outside your plan window.',
        restriction,
        rulesVersion: RULES_VERSION,
        points: [],
      },
      { status: 403 },
    );
  }

  const result = await getHistorySeries({
    metric,
    resolution,
    aggregation,
    from: `${from}T00:00:00.000Z`,
    to: `${to}T23:59:59.999Z`,
    dense,
    requestedFrom: clamped ? `${requestedFrom}T00:00:00.000Z` : undefined,
  });

  return NextResponse.json(
    { ...result, restriction },
    {
      headers: {
        // Same reasoning as the data routes: middleware gates before the edge
        // cache, so what is cached is the same bytes every passing reader gets.
        'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
      },
    },
  );
}
