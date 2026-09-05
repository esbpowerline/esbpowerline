import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  aggregate,
  fillMissing,
  type Aggregation,
  type HourRow,
  type Resolution,
  type SeriesPoint,
} from '@/lib/data/grid/history-aggregate';

/**
 * Reading the hourly archive for the Time Machine.
 *
 * The canonical rows are never resampled on the way in. This loads hours, hands
 * them to the pure aggregator, and attaches the provenance a caller needs to
 * know what it is looking at. Every rule about kinds, exclusions, coverage and
 * gaps lives in `history-aggregate.ts` and none of it is duplicated here.
 *
 * Caching is split by whether a period can still change. A closed historical
 * hour is immutable — PGCB does not revise 2017 — so it is cached for a year.
 * Anything touching the current day shares the 600 s window the rest of the
 * runtime data layer uses, because the newest hours are still arriving.
 */

export const HISTORY_METRICS = [
  'totalMw', 'gasMw', 'liquidMw', 'coalMw', 'hydroMw', 'solarMw', 'windMw',
  'bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw',
  'demandMw', 'supplyMw', 'loadShedMw',
] as const;
export type HistoryMetric = (typeof HISTORY_METRICS)[number];

/** Which page a metric comes from. Asking for demand on the generation series
 *  would silently return nothing, so the mapping is explicit. */
const DEMAND_METRICS = new Set<string>(['demandMw', 'supplyMw', 'loadShedMw']);
export const seriesFor = (metric: string) =>
  DEMAND_METRICS.has(metric) ? 'DEMAND_SUPPLY' : 'GENERATION';

/**
 * The aggregation contract, versioned.
 *
 * It is part of every cache key. When a rule here changes — a coverage floor, a
 * kind policy, an exclusion — every derived figure computed under the old rules
 * must stop being served. Without this a rule change would quietly leave months
 * of stale aggregates in the cache, computed one way and labelled another.
 */
export const RULES_VERSION = 'agg@2026-09-05';

export type HistoryResult = {
  metric: string;
  resolution: Resolution;
  aggregation: Aggregation;
  rulesVersion: string;
  /**
   * Both ranges, always, plus why they differ.
   *
   * `requested` is what the caller asked for; `effective` is what entitlement
   * permitted and what was actually queried. When they differ, every period
   * outside `effective` comes back RESTRICTED — never MISSING, which would
   * misreport a paywall as an absence of data.
   */
  restriction: {
    requested: { from: string; to: string };
    effective: { from: string; to: string };
    restricted: boolean;
    reason: 'tier' | null;
    tier: string;
  };
  points: SeriesPoint[];
  sources: Array<{ publisher: string; documents: number; earliest: string; latest: string }>;
};

async function loadHours(
  series: string,
  metric: string,
  from: Date,
  to: Date,
): Promise<HourRow[]> {
  // Only the requested metric is selected. A decade of eleven columns is a large
  // payload to build and then throw away, and this route can be asked for a
  // decade.
  const rows = await prisma.$queryRawUnsafe<
    Array<{ observedAt: Date; kind: string; excluded: string | null; v: unknown }>
  >(
    `SELECT "observedAt", "kind"::text AS kind, "excluded"::text AS excluded, "${metric}" AS v
     FROM "GridHourlyObservation"
     WHERE "series" = $1::"GridSeries" AND "observedAt" >= $2 AND "observedAt" < $3
     ORDER BY "observedAt" ASC`,
    series,
    from,
    to,
  );
  return rows.map((r) => ({
    observedAt: r.observedAt,
    kind: r.kind as HourRow['kind'],
    excluded: r.excluded as HourRow['excluded'],
    values: { [metric]: r.v === null ? null : Number(r.v) },
  }));
}

async function sourcesFor(series: string, from: Date, to: Date) {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ publisher: string; documents: bigint; earliest: Date; latest: Date }>
  >(
    `SELECT d."publisher"::text AS publisher, COUNT(DISTINCT d."id")::bigint AS documents,
            MIN(g."observedAt") AS earliest, MAX(g."observedAt") AS latest
     FROM "GridHourlyObservation" g
     JOIN "SourceDocument" d ON d."id" = g."sourceDocumentId"
     WHERE g."series" = $1::"GridSeries" AND g."observedAt" >= $2 AND g."observedAt" < $3
     GROUP BY 1`,
    series,
    from,
    to,
  );
  return rows.map((r) => ({
    publisher: r.publisher,
    documents: Number(r.documents),
    earliest: r.earliest?.toISOString() ?? '',
    latest: r.latest?.toISOString() ?? '',
  }));
}

async function compute(
  metric: string,
  resolution: Resolution,
  aggregation: Aggregation,
  fromIso: string,
  toIso: string,
  dense: boolean,
  /** Where entitlement actually started, when narrower than the request. */
  effectiveFrom?: string,
  /** What the caller asked for, so a dense axis can show the restricted span. */
  axisFromIso?: string,
): Promise<Omit<HistoryResult, 'restriction'>> {
  const series = seriesFor(metric);
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const rows = await loadHours(series, metric, from, to);
  let points = aggregate(rows, { resolution, metric, aggregation, effectiveFrom });
  // The axis spans what was ASKED for, so a restricted span is visible as
  // restricted rather than silently absent from the chart.
  if (dense) points = fillMissing(points, new Date(axisFromIso ?? fromIso), to, resolution, effectiveFrom);
  return {
    metric,
    resolution,
    aggregation,
    rulesVersion: RULES_VERSION,
    points,
    sources: await sourcesFor(series, from, to),
  };
}

/**
 * A range is "settled" when it ends before today. Settled ranges are immutable
 * and cached for a year; anything touching today shares the runtime data
 * layer's 600 s window because the archive is still being written into it.
 */
function isSettled(toIso: string): boolean {
  const endOfYesterday = new Date();
  endOfYesterday.setUTCHours(0, 0, 0, 0);
  return new Date(toIso) <= endOfYesterday;
}

export function getHistorySeries(args: {
  metric: string;
  resolution: Resolution;
  aggregation: Aggregation;
  /** What entitlement permits — the range actually queried. */
  from: string;
  to: string;
  dense: boolean;
  /** What the caller asked for, when wider than `from`. */
  requestedFrom?: string;
}) {
  const restricted = Boolean(args.requestedFrom && args.requestedFrom < args.from);
  const effectiveFrom = restricted ? args.from : undefined;
  const axisFrom = restricted ? args.requestedFrom : undefined;
  // The entitlement window is part of the cache key. Without it a visitor's
  // clamped answer could be served to a subscriber, or the reverse.
  const key = [
    'grid-history', RULES_VERSION, args.metric, args.resolution, args.aggregation,
    args.from, args.to, String(args.dense), effectiveFrom ?? '-', axisFrom ?? '-',
  ];
  return unstable_cache(
    () =>
      compute(
        args.metric, args.resolution, args.aggregation, args.from, args.to,
        args.dense, effectiveFrom, axisFrom,
      ),
    key,
    { revalidate: isSettled(args.to) ? 31_536_000 : 600 },
  )();
}

/** Every metric at one instant, for the scrubber's readout. */
export async function getHistoryAt(instantIso: string) {
  const at = new Date(instantIso);
  const hourStart = new Date(at);
  hourStart.setUTCMinutes(0, 0, 0);
  const next = new Date(hourStart.getTime() + 3_600_000);

  const rows = await prisma.gridHourlyObservation.findMany({
    where: { observedAt: { gte: hourStart, lt: next } },
    orderBy: { observedAt: 'asc' },
    include: { sourceDocument: { select: { publisher: true, sourceUrl: true, contentSha256: true, fetchedAt: true } } },
  });

  return {
    at: hourStart.toISOString(),
    rulesVersion: RULES_VERSION,
    observations: rows.map((r) => ({
      series: r.series,
      observedAt: r.observedAt.toISOString(),
      fetchedAt: r.fetchedAt.toISOString(),
      kind: r.kind,
      excluded: r.excluded,
      remark: r.remark,
      // Values are handed over exactly as stored: null means the source printed
      // nothing, and is never rendered as a zero downstream.
      values: Object.fromEntries(
        HISTORY_METRICS.map((m) => {
          const v = (r as unknown as Record<string, unknown>)[m];
          return [m, v === null || v === undefined ? null : Number(v)];
        }),
      ),
      source: r.sourceDocument && {
        publisher: r.sourceDocument.publisher,
        url: r.sourceDocument.sourceUrl,
        sha256: r.sourceDocument.contentSha256,
        fetchedAt: r.sourceDocument.fetchedAt.toISOString(),
      },
    })),
  };
}

/** The archive's own bounds, for the scrubber's extent. */
export const getHistoryBounds = unstable_cache(
  async () => {
    const r = await prisma.$queryRawUnsafe<Array<{ series: string; lo: Date; hi: Date; n: bigint }>>(
      `SELECT "series"::text AS series, MIN("observedAt") lo, MAX("observedAt") hi, COUNT(*)::bigint n
       FROM "GridHourlyObservation" GROUP BY 1`,
    );
    return r.map((x) => ({
      series: x.series,
      earliest: x.lo.toISOString(),
      latest: x.hi.toISOString(),
      observations: Number(x.n),
    }));
  },
  ['grid-history-bounds', RULES_VERSION],
  { revalidate: 600 },
);
