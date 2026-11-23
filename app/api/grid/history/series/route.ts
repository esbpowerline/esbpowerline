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
import { parseIsoDate } from '@/lib/data/grid/date-utils';

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
/**
 * Most periods one request may ask for. `fillMissing` emits a point for every period in the
 * range, and `to` was unbounded, so `resolution=hour&from=2014-01-01&to=9999-12-31` built
 * ~70 million objects in one function invocation (2026-11-23 audit). The explorer asks for
 * day and month only; 20,000 is ~54 years of days or ~2.3 years of hours.
 */
const MAX_PERIODS = 20_000;
const PERIOD_MS: Record<Resolution, number> = { hour: 3_600_000, day: 86_400_000, month: 28 * 86_400_000 };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const metric = url.searchParams.get('metric') ?? 'totalMw';
  const resolution = (url.searchParams.get('resolution') ?? 'day') as Resolution;
  const aggregation = (url.searchParams.get('agg') ?? 'mean') as Aggregation;
  const requestedFrom = url.searchParams.get('from') ?? '';
  const requestedTo = url.searchParams.get('to') ?? '';
  const dense = url.searchParams.get('dense') !== '0';

  if (!HISTORY_METRICS.includes(metric as never)) {
    return NextResponse.json({ error: `Unknown metric: ${metric}` }, { status: 400 });
  }
  if (!RESOLUTIONS.includes(resolution) || !AGGREGATIONS.includes(aggregation)) {
    return NextResponse.json({ error: 'Unknown resolution or aggregation' }, { status: 400 });
  }
  // A real calendar date, not just the shape: 2026-02-31 passed the regex.
  if (!parseIsoDate(requestedFrom) || !parseIsoDate(requestedTo)) {
    return NextResponse.json({ error: 'from and to must be YYYY-MM-DD' }, { status: 400 });
  }
  // Nothing exists after today in Dhaka (the hourly capture can run ahead of the daily
  // catalog, so the bound is the clock, not `latest`).
  const todayDhaka = new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);
  const to = requestedTo > todayDhaka ? todayDhaka : requestedTo;

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
    requested: { from: requestedFrom, to: requestedTo },
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

  const periods = (Date.parse(to) - Date.parse(from)) / PERIOD_MS[resolution] + 1;
  if (periods > MAX_PERIODS) {
    return NextResponse.json(
      { error: `Range too long for ${resolution} resolution; narrow it or use a coarser one.` },
      { status: 400 },
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
        // Only a visitor's answer may sit in the shared cache. The body depends on the
        // SESSION (the tier clamp above), and the URL does not carry it: a subscriber's
        // unclamped decade cached under a public URL was served to the next anonymous
        // reader, and a visitor's clamped copy to the next subscriber (2026-11-23 audit).
        'Cache-Control':
          tier === 'visitor'
            ? 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
            : 'private, no-store',
      },
    },
  );
}
