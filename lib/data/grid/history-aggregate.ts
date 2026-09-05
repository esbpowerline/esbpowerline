/**
 * Historical aggregation for the Grid Explorer Time Machine.
 *
 * The canonical series is hourly and is never resampled. Daily and monthly are
 * DERIVED here, on demand, from the hours beneath them — there is no stored
 * daily table that could drift from its own source.
 *
 * Four rules, each written because the archive has a row that breaks it:
 *
 *  1. Means, sums and distributions use REGULAR observations only. NLDC posts an
 *     extra reading at the day and evening peak, and those are annotations on an
 *     hour rather than additional hours. Averaging them in biases every
 *     historical mean by +35 to +71 MW, in one direction, growing with demand.
 *     Maxima MAY use every kind, because a peak stamp exists precisely to record
 *     a value no hourly reading caught.
 *
 *  2. Rows the source contradicted are excluded and COUNTED, never altered.
 *     2023-01-15 05:00 was published as 64526500 MW against components summing
 *     to 6,464. Left in, it moves that month's mean from ~8,900 to 91,349.
 *
 *  3. Nothing is interpolated. Not linear, not carry-forward, not seasonal. A
 *     period whose coverage falls below the floor reports itself insufficient
 *     and returns null. The 517-hour gap of January-February 2017 must appear as
 *     a break, because a line drawn across it is a claim no source made.
 *
 *  4. Coverage travels with the figure, into the API and the export, not just
 *     the chart. A mean of 20 days in a 28-day month is not the same number as a
 *     mean of 28, and the difference is not the caller's to guess.
 *
 * Pure functions over rows: no database, no clock, no I/O. The golden tests feed
 * these fixtures drawn from every schema era the archive contains.
 */

/** How a figure came to exist. ESTIMATED has no producer here, deliberately. */
export type SeriesState = 'REPORTED' | 'DERIVED' | 'ESTIMATED' | 'MISSING';

export type ObservationKind = 'REGULAR' | 'DAY_PEAK' | 'EVENING_PEAK' | 'UNCLASSIFIED';
export type AggregationExclusion = 'TOTAL_DISAGREES_WITH_COMPONENTS' | 'BREAKDOWN_ALL_ZERO';

/** The shape the aggregator reads. A canonical row, narrowed. */
export type HourRow = {
  observedAt: Date;
  kind: ObservationKind;
  excluded: AggregationExclusion | null;
  values: Readonly<Record<string, number | null>>;
};

/**
 * A sum over components, reported honestly.
 *
 * Deliberately NOT `{ of, outOf }` with a completeness percentage. A column NLDC
 * never published is not a missing member of a known total — treating it as one
 * would assert that the source was expected to report it, which this archive has
 * no evidence for. So the components that contributed are NAMED, the ones left
 * blank are NAMED, and no denominator is invented.
 *
 * `complete` is true only when nothing was blank. It is not a ratio.
 */
export type DerivedSum = {
  value: number | null;
  from: readonly string[];
  absent: readonly string[];
  complete: boolean;
};

export function sumReported(
  values: Readonly<Record<string, number | null>>,
  components: readonly string[],
): DerivedSum {
  const from: string[] = [];
  const absent: string[] = [];
  let total = 0;
  for (const c of components) {
    const v = values[c];
    if (v === null || v === undefined) absent.push(c);
    else {
      from.push(c);
      total += v;
    }
  }
  return {
    value: from.length ? total : null,
    from,
    absent,
    complete: absent.length === 0,
  };
}

export type Coverage = {
  /** Eligible REGULAR observations found in the period. */
  observed: number;
  /**
   * What a complete period looks like, derived from the cadence actually
   * observed — never from `24 x days`. NLDC does not always post 24 hours, and
   * a denominator that assumes it would report a false shortfall.
   */
  expected: number;
  sufficient: boolean;
};

export type SeriesPoint = {
  /** Period start: ISO hour, `YYYY-MM-DD`, or `YYYY-MM`. */
  t: string;
  value: number | null;
  state: SeriesState;
  coverage: Coverage;
  /** Rows set aside by rule 2, with their reasons. Present only when non-zero. */
  excluded?: Partial<Record<AggregationExclusion, number>>;
};

export type Resolution = 'hour' | 'day' | 'month';
export type Aggregation = 'mean' | 'max' | 'min' | 'sum';

export type AggregateOptions = {
  resolution: Resolution;
  metric: string;
  aggregation: Aggregation;
  /**
   * Minimum share of `expected` a period needs before a value is reported.
   * Below it the period is MISSING with its coverage attached — never estimated.
   */
  coverageFloor?: number;
  /** Hours per day assumed when a period has no observations at all. */
  nominalHoursPerDay?: number;
};

const DEFAULT_FLOOR = 0.75;
const NOMINAL_HOURS = 24;

const iso = (d: Date) => d.toISOString();
const dayKey = (d: Date) => iso(d).slice(0, 10);
const monthKey = (d: Date) => iso(d).slice(0, 7);
const daysInMonth = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** Maxima may draw on peak stamps; everything else may not. */
const usesAllKinds = (a: Aggregation) => a === 'max' || a === 'min';

/**
 * Aggregate canonical hours into a derived series.
 *
 * `rows` must already be restricted to the requested range and metric's series.
 * Periods with no rows are NOT emitted here — a caller wanting a dense axis asks
 * `fillMissing`, which marks the holes rather than filling them.
 */
export function aggregate(rows: readonly HourRow[], opts: AggregateOptions): SeriesPoint[] {
  const floor = opts.coverageFloor ?? DEFAULT_FLOOR;
  const keyOf =
    opts.resolution === 'hour' ? iso : opts.resolution === 'day' ? dayKey : monthKey;

  const buckets = new Map<string, HourRow[]>();
  for (const r of rows) {
    const k = keyOf(r.observedAt);
    const b = buckets.get(k);
    if (b) b.push(r);
    else buckets.set(k, [r]);
  }

  const out: SeriesPoint[] = [];
  for (const [t, all] of [...buckets.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    // Rule 2: set aside what the source contradicted, and say how much.
    const excluded: Partial<Record<AggregationExclusion, number>> = {};
    const eligible = all.filter((r) => {
      if (!r.excluded) return true;
      excluded[r.excluded] = (excluded[r.excluded] ?? 0) + 1;
      return false;
    });

    // Rule 1: kinds are not interchangeable.
    const usable = usesAllKinds(opts.aggregation)
      ? eligible
      : eligible.filter((r) => r.kind === 'REGULAR');

    const nums = usable
      .map((r) => r.values[opts.metric])
      .filter((v): v is number => v !== null && v !== undefined);

    const regularCount = eligible.filter((r) => r.kind === 'REGULAR').length;
    const expected = expectedFor(opts.resolution, t, all, opts.nominalHoursPerDay ?? NOMINAL_HOURS);
    const coverage: Coverage = {
      observed: regularCount,
      expected,
      sufficient: expected > 0 && regularCount / expected >= floor,
    };

    const hasExclusions = Object.keys(excluded).length > 0;
    // Rule 3 and 4: an hour is REPORTED as published; a period is DERIVED, and
    // only when enough of it exists. Otherwise MISSING, with the coverage said.
    let value: number | null = null;
    let state: SeriesState = 'MISSING';
    if (nums.length) {
      if (opts.resolution === 'hour') {
        value = nums[0];
        state = 'REPORTED';
      } else if (coverage.sufficient) {
        value = combine(nums, opts.aggregation);
        state = 'DERIVED';
      }
    }

    out.push({
      t,
      value,
      state,
      coverage,
      ...(hasExclusions ? { excluded } : {}),
    });
  }
  return out;
}

function combine(nums: readonly number[], how: Aggregation): number {
  switch (how) {
    case 'max':
      return Math.max(...nums);
    case 'min':
      return Math.min(...nums);
    case 'sum':
      return nums.reduce((a, b) => a + b, 0);
    case 'mean':
    default:
      return nums.reduce((a, b) => a + b, 0) / nums.length;
  }
}

/**
 * What a complete period would hold.
 *
 * For an hour it is one. For a day it is the REGULAR hours the source actually
 * posted, falling back to the nominal 24 when the day is empty — the fallback
 * only ever applies to a period being reported as MISSING anyway. For a month it
 * is that nominal figure times the calendar length, which is the one place a
 * denominator is assumed rather than observed, and it is stated here so a reader
 * of the coverage knows which it was.
 */
function expectedFor(
  resolution: Resolution,
  key: string,
  rows: readonly HourRow[],
  nominal: number,
): number {
  if (resolution === 'hour') return 1;
  if (resolution === 'day') {
    const regular = rows.filter((r) => r.kind === 'REGULAR').length;
    return regular > 0 ? Math.max(regular, nominal) : nominal;
  }
  return nominal * daysInMonth(key);
}

/**
 * Mark the holes in a series without filling them.
 *
 * A caller drawing a chart needs a point for every period, or the x-axis lies by
 * omission. What it must NOT get is a value there. Every period absent from
 * `points` comes back MISSING with zero coverage, and a renderer is expected to
 * break the line rather than join across it.
 */
export function fillMissing(
  points: readonly SeriesPoint[],
  from: Date,
  to: Date,
  resolution: Resolution,
): SeriesPoint[] {
  const have = new Map(points.map((p) => [p.t, p]));
  const out: SeriesPoint[] = [];
  const cur = new Date(from.getTime());

  const step = () => {
    if (resolution === 'hour') cur.setUTCHours(cur.getUTCHours() + 1);
    else if (resolution === 'day') cur.setUTCDate(cur.getUTCDate() + 1);
    else cur.setUTCMonth(cur.getUTCMonth() + 1);
  };
  const key = (d: Date) =>
    resolution === 'hour' ? iso(d) : resolution === 'day' ? dayKey(d) : monthKey(d);

  while (cur <= to) {
    const k = key(cur);
    out.push(
      have.get(k) ?? {
        t: k,
        value: null,
        state: 'MISSING',
        coverage: { observed: 0, expected: 0, sufficient: false },
      },
    );
    step();
  }
  return out;
}

/**
 * True where a renderer must lift the pen.
 *
 * Exposed as a function rather than left to each chart, because "draw a line
 * between two points" is the default everywhere and drawing it across the 2017
 * outage would be the single most damaging thing this feature could do.
 */
export function isBreak(p: SeriesPoint): boolean {
  return p.value === null || p.state === 'MISSING';
}
