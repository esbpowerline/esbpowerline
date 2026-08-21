/**
 * Which days the archive actually holds, in a form small enough to hand the
 * browser.
 *
 * The pickers have to know this. A plain `min`/`max` on a date input lets an
 * editor choose any day in a twelve-year span, and 81 of those days are not in
 * the archive at all — the picker accepted them, the request went to the
 * server, and the answer came back as an error. The calendar should simply not
 * offer a day the site does not have.
 *
 * Sent as runs rather than as dates. The archive is 4,534 days across 63
 * contiguous stretches, so the run form is 1.1 KB where the list of ISO strings
 * is 59 KB — the same information, 52 times smaller, and it is also the shape
 * that answers "what is this site backlogged at" directly.
 *
 * Deliberately not `server-only`: the server builds it, the picker reads it.
 */

/** `[first day, how many consecutive days]`. */
export type DateRun = [start: string, length: number];

export type ArchiveCoverage = {
  runs: DateRun[];
  /** First and last archived day; the outer bounds of every picker. */
  first: string | null;
  last: string | null;
  /** Total archived days, for the coverage line under the calendar. */
  total: number;
};

const MS_DAY = 86_400_000;

/** UTC throughout, so no timezone can shift a day across a boundary. */
function toUtc(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function shiftIso(iso: string, days: number): string {
  return fromUtc(toUtc(iso) + days * MS_DAY);
}

/** Sorted ISO days to runs. The days must already be sorted and unique. */
export function toRuns(days: string[]): DateRun[] {
  const runs: DateRun[] = [];
  for (const day of days) {
    const last = runs[runs.length - 1];
    if (last && toUtc(day) === toUtc(last[0]) + last[1] * MS_DAY) {
      last[1] += 1;
      continue;
    }
    runs.push([day, 1]);
  }
  return runs;
}

export function buildCoverage(days: string[]): ArchiveCoverage {
  const sorted = [...new Set(days)].sort();
  return {
    runs: toRuns(sorted),
    first: sorted[0] ?? null,
    last: sorted[sorted.length - 1] ?? null,
    total: sorted.length,
  };
}

/**
 * A lookup over the runs.
 *
 * Binary search rather than expanding the runs into a Set: expanding costs
 * 4,534 strings on every mount, and the calendar only ever asks about the ~42
 * cells of one month at a time.
 */
export function createArchiveIndex(coverage: ArchiveCoverage) {
  const starts = coverage.runs.map((r) => toUtc(r[0]));
  const ends = coverage.runs.map((r, i) => starts[i] + (r[1] - 1) * MS_DAY);

  function has(iso: string): boolean {
    const t = toUtc(iso);
    if (Number.isNaN(t)) return false;
    let lo = 0;
    let hi = starts.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (t < starts[mid]) hi = mid - 1;
      else if (t > ends[mid]) lo = mid + 1;
      else return true;
    }
    return false;
  }

  /** How many of a month's days are archived, and how many days it has. */
  function monthCoverage(year: number, month: number): { held: number; days: number } {
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    let held = 0;
    for (let d = 1; d <= days; d += 1) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (has(iso)) held += 1;
    }
    return { held, days };
  }

  /** True when any day of that month is archived. */
  function hasMonth(year: number, month: number): boolean {
    return monthCoverage(year, month).held > 0;
  }

  /**
   * The archived day closest to `iso`, searching outward.
   *
   * Used when a jump — "same day last year", switching months — lands on a gap.
   * Bounded, because past the bound there is nothing to find and walking the
   * whole span one day at a time to discover that is wasted work.
   */
  function nearest(iso: string, maxDistance = 45): string | null {
    if (has(iso)) return iso;
    for (let d = 1; d <= maxDistance; d += 1) {
      const back = shiftIso(iso, -d);
      if (has(back)) return back;
      const forward = shiftIso(iso, d);
      if (has(forward)) return forward;
    }
    return null;
  }

  return { has, hasMonth, monthCoverage, nearest, coverage };
}

export type ArchiveIndex = ReturnType<typeof createArchiveIndex>;

/**
 * The same calendar day a year earlier; 29 February falls back to the 28th.
 *
 * The same rule the sheet builder uses. A naive year swap produces 29 February
 * in a common year, which is not a date.
 */
export function priorYearIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  if (m[2] === '02' && m[3] === '29') return `${Number(m[1]) - 1}-02-28`;
  return `${Number(m[1]) - 1}-${m[2]}-${m[3]}`;
}

/** `2026-08-19` → `19 Aug 2026`, the form the triggers show. */
const MONTHS_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS_ABBR[Number(m[2]) - 1]} ${m[1]}`;
}

/** `2026-08` → `Aug 2026`. */
export function formatMonth(key: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return key;
  return `${MONTHS_ABBR[Number(m[2]) - 1]} ${m[1]}`;
}

export { MONTHS_ABBR };
