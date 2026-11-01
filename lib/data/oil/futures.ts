/**
 * World oil prices for the fuel-price card: four futures series, read as
 * daily settlements of one named contract at a time.
 *
 * Three rules, each learned from the first live card (2026-11-01):
 *
 * 1. **Settlement, never a live quote.** A card is posted and shared; two
 *    editors downloading an hour apart must get the same figure. A session
 *    counts only once it has closed — see `isSettled`.
 *
 * 2. **One contract per comparison.** Yahoo's continuous symbols (`BZ=F`, …)
 *    jump to the next contract on expiry day. Brent's December contract
 *    expired on 30 Oct 2026 and `BZ=F` moved to January that day, so the
 *    continuous series made the week read −2.8% where the same contract moved
 *    +1.5%; heating oil read −6.2% for −2.3%. "vs week" and "vs month" are
 *    therefore always the *same contract's* settlement on the earlier date.
 *
 * 3. **The front month is observed, not computed.** Each exchange has its own
 *    expiry rule and holiday calendar. Rather than re-implement them, the
 *    ingest asks Yahoo for the continuous series and the next few named
 *    contracts, and records which named contract the continuous series equals
 *    on each day.
 *
 * Client-safe on purpose: no `server-only`, no I/O.
 */

export type SeriesId = 'brent' | 'wti' | 'rbob' | 'ulsd';

export interface SeriesDef {
  id: SeriesId;
  label: string;
  unit: 'USD/barrel' | 'USD/gallon';
  /** Yahoo's continuous front-month symbol. */
  continuous: string;
  /** Root of the named contracts, e.g. `CL` → `CLZ26.NYM`. */
  root: string;
  exchange: 'ICE' | 'NYMEX';
}

export const SERIES: readonly SeriesDef[] = [
  { id: 'brent', label: 'Brent Crude', unit: 'USD/barrel', continuous: 'BZ=F', root: 'BZ', exchange: 'ICE' },
  { id: 'wti', label: 'WTI Crude', unit: 'USD/barrel', continuous: 'CL=F', root: 'CL', exchange: 'NYMEX' },
  { id: 'rbob', label: 'Gasoline', unit: 'USD/gallon', continuous: 'RB=F', root: 'RB', exchange: 'NYMEX' },
  { id: 'ulsd', label: 'Heating Oil (ULSD)', unit: 'USD/gallon', continuous: 'HO=F', root: 'HO', exchange: 'NYMEX' },
];

const MONTH_CODES = 'FGHJKMNQUVXZ';

/** `CL`, 2026-12 → `CLZ26.NYM`, Yahoo's name for a single NYMEX-listed contract. */
export function contractSymbol(root: string, year: number, month: number): string {
  return `${root}${MONTH_CODES[month - 1]}${String(year % 100).padStart(2, '0')}.NYM`;
}

/**
 * The named contracts worth asking about on `isoDay`: this month's and the
 * next `count - 1`. Brent's front month runs two months ahead of the
 * calendar, the products' one, so five covers every series with a spare.
 */
export function candidateContracts(root: string, isoDay: string, count = 5): string[] {
  const [y, m] = isoDay.split('-').map(Number);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = m - 1 + i;
    out.push(contractSymbol(root, y + Math.floor(idx / 12), (idx % 12) + 1));
  }
  return out;
}

export interface DailyBar {
  /** Exchange trading day, `YYYY-MM-DD`. */
  day: string;
  close: number;
}

/**
 * Yahoo's chart payload → one bar per trading day. Yahoo stamps a futures
 * session at 00:00 New York time of its trading day (04:00Z or 05:00Z), so the
 * day is read in New York. Reading it with the meta's `gmtoffset` subtracted
 * a second time — as a first attempt did — files every bar a day early.
 */
export function parseChart(json: unknown): { bars: DailyBar[]; meta: ChartMeta } {
  const result = (json as { chart?: { result?: unknown[] } })?.chart?.result?.[0] as
    | { meta: ChartMeta; timestamp?: number[]; indicators: { quote: { close: (number | null)[] }[] } }
    | undefined;
  if (!result) throw new Error('Yahoo chart: no result');
  const ts = result.timestamp ?? [];
  const closes = result.indicators.quote[0]?.close ?? [];
  const bars: DailyBar[] = [];
  ts.forEach((t, i) => {
    const c = closes[i];
    // A null close is a session Yahoo has no figure for — absent, never zero.
    if (c == null || !Number.isFinite(c)) return;
    bars.push({ day: nyDay(t * 1000), close: c });
  });
  return { bars, meta: result.meta };
}

export interface ChartMeta {
  symbol: string;
  regularMarketTime?: number;
  currentTradingPeriod?: { regular?: { start: number; end: number } };
}

const NY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The New York calendar day of an instant — daylight saving included. */
export function nyDay(ms: number): string {
  return NY.format(new Date(ms));
}

/**
 * Whether the session for `day` has settled at `nowMs`.
 *
 * NYMEX settles WTI, RBOB and ULSD at 14:30 New York time; ICE Brent at 19:30
 * London, which is 14:30 or 15:30 in New York depending on whose clocks have
 * changed. 16:00 New York clears both with a margin, every week of the year,
 * without a holiday table: a day before today has always settled.
 */
export function isSettled(day: string, nowMs: number): boolean {
  const today = nyDay(nowMs);
  if (day < today) return true;
  if (day > today) return false;
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(
      new Date(nowMs),
    ),
  );
  return hour >= 16;
}

/**
 * Which named contract the continuous series was on each day: the candidate
 * whose close equals the continuous close that day. A day where none matches
 * (or two do, as can happen when adjacent contracts settle level) is left
 * unassigned rather than guessed.
 */
export function matchFront(
  continuous: DailyBar[],
  contracts: Record<string, DailyBar[]>,
): Record<string, string> {
  const byContract = new Map(
    Object.entries(contracts).map(([sym, bars]) => [sym, new Map(bars.map((b) => [b.day, b.close]))]),
  );
  const front: Record<string, string> = {};
  for (const bar of continuous) {
    const hits = [...byContract.entries()]
      .filter(([, days]) => {
        const c = days.get(bar.day);
        return c != null && Math.abs(c - bar.close) < 1e-6;
      })
      .map(([sym]) => sym);
    if (hits.length === 1) front[bar.day] = hits[0];
  }
  return front;
}

export interface Settlement {
  series: SeriesId;
  contract: string;
  day: string;
  settle: number;
  front: boolean;
}

/** `YYYY-MM-DD` minus whole days, as plain calendar arithmetic. */
export function minusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * The same day one calendar month earlier, clamped to that month's end:
 * 31 Oct → 30 Sep, 31 Mar → 28/29 Feb.
 */
export function minusMonth(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const last = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  return `${py}-${String(pm).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

export interface WorldRow {
  series: SeriesId;
  label: string;
  unit: SeriesDef['unit'];
  contract: string;
  settle: number;
  /** Percent change against the same contract, null where it has no settlement that far back. */
  week: number | null;
  month: number | null;
}

/**
 * The world table for a card, from stored settlements.
 *
 * The settlement day is the latest day on which *every* series has a front
 * contract — one date heads the column, so the four rows must share it. The
 * baselines are the same contract's last settlement on or before 7 days and
 * one calendar month earlier.
 */
export function buildWorldRows(
  rows: Settlement[],
  onOrBefore: string,
): { day: string; rows: WorldRow[] } | null {
  const fronts = rows.filter((r) => r.front && r.day <= onOrBefore);
  const days = [...new Set(fronts.map((r) => r.day))].sort().reverse();
  const day = days.find((d) => SERIES.every((s) => fronts.some((r) => r.series === s.id && r.day === d)));
  if (!day) return null;

  const pct = (now: number, then: number | undefined) =>
    then == null || then === 0 ? null : Math.round(((now / then - 1) * 100) * 10) / 10;

  const out: WorldRow[] = SERIES.map((s) => {
    const cur = fronts.find((r) => r.series === s.id && r.day === day)!;
    const same = rows.filter((r) => r.contract === cur.contract).sort((a, b) => (a.day < b.day ? 1 : -1));
    const at = (limit: string) => same.find((r) => r.day <= limit)?.settle;
    return {
      series: s.id,
      label: s.label,
      unit: s.unit,
      contract: cur.contract,
      settle: cur.settle,
      week: pct(cur.settle, at(minusDays(day, 7))),
      month: pct(cur.settle, at(minusMonth(day))),
    };
  });
  return { day, rows: out };
}
