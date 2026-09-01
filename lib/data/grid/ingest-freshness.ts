/**
 * How far behind the archive is, and saying so.
 *
 * The pipeline is manual. `/api/cron/ingest` returns 503 on Vercel by design —
 * the Python chain exceeds serverless compute limits — so days are ingested by
 * hand on one machine, and the commit history shows them arriving in batches
 * (`ingest energy days 2026-08-24..28`) rather than daily.
 *
 * Meanwhile the interface carries pulsing live indicators, an "as of" stamp and
 * a badge reading LATEST on whatever the newest stored day happens to be. Those
 * are promises about freshness that the architecture cannot keep, and a reader
 * has no way to tell a portal that is up to date from one whose operator was
 * away for a week.
 *
 * This does not fix the cadence — a scheduled runner on an always-on host does
 * that, and `scripts/ingest-daemon.mjs` is here for it. What it fixes is the
 * claim: the interface can now state the lag instead of implying there is none.
 */

/** BST is UTC+06:00 with no DST, so a "today" is a fixed offset from UTC. */
const BST_OFFSET_MINUTES = 6 * 60;

export function bstToday(now: Date = new Date()): string {
  return new Date(now.getTime() + BST_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export type FreshnessLevel = 'current' | 'lagging' | 'stale';

export interface Freshness {
  /** Newest day held. */
  latestDay: string;
  /** Days between the newest day held and the newest day that could exist. */
  daysBehind: number;
  level: FreshnessLevel;
  /** A sentence for the reader. Empty when there is nothing to disclose. */
  note: string;
}

/**
 * PGCB publishes day D's report on the morning of D+1, so on any given date the
 * newest day that *can* exist is yesterday. Being one day back is the normal
 * state of a perfectly current archive, not a lag — which is why the threshold
 * starts at two.
 */
export function assessFreshness(latestDay: string | null, now: Date = new Date()): Freshness | null {
  if (!latestDay) return null;

  const today = bstToday(now);
  const expected = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const daysBehind = Math.max(0, daysBetween(latestDay, expected));

  if (daysBehind <= 0) {
    return { latestDay, daysBehind: 0, level: 'current', note: '' };
  }

  if (daysBehind === 1) {
    return {
      latestDay,
      daysBehind,
      level: 'current',
      note: '',
    };
  }

  const level: FreshnessLevel = daysBehind >= 4 ? 'stale' : 'lagging';
  const plural = daysBehind === 1 ? 'day' : 'days';

  return {
    latestDay,
    daysBehind,
    level,
    note:
      `The newest report held here is ${daysBehind} ${plural} behind what PGCB should have published by now. ` +
      'Reports are ingested manually, so the archive can trail the source; this is a gap in our collection, not in PGCB’s publishing.',
  };
}
