/**
 * PGCB's forward forecast for a day still in progress, matched against the
 * NLDC hours posted so far.
 *
 * The archive's forecast-vs-actual card compares a settled day: both halves
 * come off workbooks, and the day is over. This is the same comparison made
 * one day earlier, while the day is still running — the projection PGCB filed
 * this morning against the hours NLDC has posted since. It exists because the
 * archive cannot do it: a forecast is anchored to the day it describes, so
 * today's projection is only archived tomorrow, long after the live hours it
 * should have been read against have rolled past.
 *
 * Two rules hold this honest:
 *
 *   - Only hours belonging to the forecast's own target day are matched. The
 *     live window is "the last 24 posted rows", which routinely spans two
 *     calendar days; silently folding yesterday's 22:00 into today's curve
 *     would invent a comparison PGCB never made.
 *   - A gap is a signed difference and nothing more. No scoring, no grading,
 *     no "accuracy" percentage — the same position the archive card takes,
 *     for the same reason: PGCB forecasts a system it does not fully control.
 */

export type ForwardForecastHour = {
  time: string;
  generationMw?: number | null;
  demandMw?: number | null;
  loadShedMw?: number | null;
};

export type ForwardForecast = {
  targetDay: string;
  issuedOn?: string;
  issuedIn?: string;
  issuedAt?: string | null;
  layout?: string | null;
  forward?: boolean;
  maxDemandEveningMw?: number | null;
  maxDemandDayMw?: number | null;
  maxGenEveningMw?: number | null;
  totalLoadShedMw?: number | null;
  hourly?: ForwardForecastHour[] | null;
};

/** The slice of a live-grid hour this comparison needs. */
export type LiveHourLike = {
  at: string;
  totalMw: number;
  demandMw?: number | null;
  loadShedMw?: number | null;
};

export type ForecastVsLiveRow = {
  /** "21:00" — Dhaka wall-clock, the key both sides are stated in. */
  time: string;
  forecastGenMw: number | null;
  actualGenMw: number | null;
  /** actual − forecast. Null unless both sides are present. */
  genGapMw: number | null;
  forecastDemandMw: number | null;
  actualDemandMw: number | null;
  demandGapMw: number | null;
  forecastLoadShedMw: number | null;
  actualLoadShedMw: number | null;
  /**
   * The hour had already happened when PGCB generated the report. It is
   * published in the forecast block, so it belongs on the page, but it was
   * never a prediction -- scoring it would invent an accuracy the forecast
   * never claimed. The archive card takes exactly this position.
   */
  beforeIssue: boolean;
};

export type ForecastVsLive = {
  /** The day both halves describe. */
  day: string;
  rows: ForecastVsLiveRow[];
  coverage: {
    /** Hours where forecast and a posted actual both exist. */
    matched: number;
    /** Matched hours issued ahead of the clock -- the ones fit to score. */
    scored: number;
    /** Forecast hours published for the day, including any half-hour rows. */
    forecastHours: number;
    /** Live rows NLDC has posted for this day so far. */
    liveHours: number;
    /**
     * Forecast rows with no live counterpart — the 18:30/19:30 half-hour
     * readings PGCB projects, plus every hour still ahead of the clock.
     */
    unmatched: number;
  };
  /** The newest hour that has both halves, which is what a headline quotes. */
  latestMatched: ForecastVsLiveRow | null;
  /** Mean signed generation gap over SCORED hours, or null with none. */
  meanGenGapMw: number | null;
  /** Widest signed generation gap so far, by absolute size, among scored hours. */
  widestGenGap: ForecastVsLiveRow | null;
  /** PGCB's own generation stamp, "08:56", when the layout prints one. */
  issuedClock: string | null;
};

const HOUR_RE = /^(\d{2}):(\d{2})$/;

function finite(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function gap(actual: number | null, forecast: number | null): number | null {
  return actual === null || forecast === null ? null : actual - forecast;
}

/** "2026-08-24T21:00:00" → "21:00"; null when it is not an ISO local hour. */
function hourKey(at: string): string | null {
  const match = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/.exec(at);
  return match ? `${match[1]}:${match[2]}` : null;
}

export function compareForecastToLive(
  forecast: ForwardForecast | null | undefined,
  hours: LiveHourLike[] | null | undefined,
): ForecastVsLive | null {
  const day = forecast?.targetDay;
  if (!forecast || !day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;

  const forecastHours = (forecast.hourly ?? []).filter((h) => HOUR_RE.test(h.time ?? ''));
  if (forecastHours.length === 0) return null;

  // Only this day's rows. The live window spans two calendar days by design.
  const actualByHour = new Map<string, LiveHourLike>();
  for (const h of hours ?? []) {
    if (!h?.at?.startsWith(day)) continue;
    const key = hourKey(h.at);
    if (key) actualByHour.set(key, h);
  }

  // PGCB stamps the report with the time it was generated -- around 09:00 on
  // every 2025+ layout. Everything before that hour is a record, not a
  // forecast, so it is marked here and kept out of every summary figure below.
  const issuedClock = forecast.issuedAt ? forecast.issuedAt.slice(11, 16) : null;
  const issuedHour = issuedClock ? Number(issuedClock.slice(0, 2)) : null;

  const rows: ForecastVsLiveRow[] = forecastHours.map((f) => {
    const actual = actualByHour.get(f.time) ?? null;
    const forecastGenMw = finite(f.generationMw);
    const actualGenMw = actual ? finite(actual.totalMw) : null;
    const forecastDemandMw = finite(f.demandMw);
    const actualDemandMw = actual ? finite(actual.demandMw) : null;
    return {
      time: f.time,
      forecastGenMw,
      actualGenMw,
      genGapMw: gap(actualGenMw, forecastGenMw),
      forecastDemandMw,
      actualDemandMw,
      demandGapMw: gap(actualDemandMw, forecastDemandMw),
      forecastLoadShedMw: finite(f.loadShedMw),
      actualLoadShedMw: actual ? finite(actual.loadShedMw) : null,
      beforeIssue:
        issuedHour != null && Number.isFinite(issuedHour) && Number(f.time.slice(0, 2)) < issuedHour,
    };
  });
  rows.sort((a, b) => a.time.localeCompare(b.time));

  const matchedRows = rows.filter((r) => r.genGapMw !== null);
  const scoredRows = matchedRows.filter((r) => !r.beforeIssue);
  const gaps = scoredRows.map((r) => r.genGapMw as number);

  return {
    day,
    rows,
    coverage: {
      matched: matchedRows.length,
      scored: scoredRows.length,
      forecastHours: forecastHours.length,
      liveHours: actualByHour.size,
      unmatched: rows.length - matchedRows.length,
    },
    latestMatched: matchedRows.length ? matchedRows[matchedRows.length - 1] : null,
    meanGenGapMw: gaps.length
      ? Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10
      : null,
    widestGenGap: scoredRows.length
      ? scoredRows.reduce((worst, r) =>
          Math.abs(r.genGapMw as number) > Math.abs(worst.genGapMw as number) ? r : worst,
        )
      : null,
    issuedClock,
  };
}

/** Minutes past midnight for a "HH:MM" row, so it can be placed against now. */
export function minutesOfRow(time: string): number {
  const [h, m] = (time ?? '').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * "21:00" -> "9 PM", the form a reader holds an hour in.
 *
 * PGCB prints 00:00 and a reader thinks 12 AM; the table shows both, because
 * the sheet's form is what makes it checkable against the source and the
 * reader's form is what makes it mean anything.
 */
export function friendlyHour(time: string): string {
  const [h, m] = (time ?? '').split(':').map(Number);
  if (!Number.isFinite(h)) return time;
  const suffix = h < 12 ? 'AM' : 'PM';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return m ? `${twelve}:${String(m).padStart(2, '0')} ${suffix}` : `${twelve} ${suffix}`;
}
