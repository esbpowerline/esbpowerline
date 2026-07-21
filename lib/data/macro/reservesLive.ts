/**
 * Live gas-reserve depletion model — derived from the daily Petrobangla archive.
 *
 * Integrates domestic (non-RLNG) production day-by-day from the 2020 audited
 * baseline (12.27 Tcf remaining) and calibrates the cumulative draw so it lands
 * exactly on the 2026 audit anchor (7.63 Tcf on 1 Jan 2026). After the anchor the
 * same calibrated rate keeps depleting daily, so "remaining reserves" moves with
 * every new Petrobangla report instead of being a hardcoded editorial figure.
 */
import type { PetrobanglaTimelineSummary } from '@/lib/data/petrobangla/types';
import {
  RESERVE_SCENARIOS,
  RESERVES_AUDITED_META,
  type ReserveScenarioId,
} from './reserves';

/** Audited remaining recoverable balance on 1 Jan 2020 (reservesDepletionData) */
const BASELINE_REMAINING_2020_TCF = 12.27;
const MMCF_PER_TCF = 1_000_000;
const STATIC_BAU_EXHAUSTION = RESERVE_SCENARIOS.find((s) => s.id === 'bau')!.exhaustionYear;

export interface LiveReserveScenario {
  id: ReserveScenarioId;
  exhaustionYear: number;
  runwayYears: number;
  annualDrawTcf: number;
  vsBauYears: number;
}

export interface LiveReserveChartRow {
  year: string;
  audited: number | null;
  lowGrowth: number | null;
  bau: number | null;
  highGrowth: number | null;
}

export interface LiveReserveModel {
  /** Latest ok gas-day in the archive the model is computed through */
  asOfDate: string;
  /** Fractional year of asOfDate, e.g. 2026.55 */
  asOfYear: number;
  /** Integer chart year where scenario forks leave the live line */
  forkYear: number;
  remainingTcf: number;
  extractedTcf: number;
  extractedPct: number;
  declineSince2020Tcf: number;
  /** 30-day average domestic extraction, MMCFD */
  currentRateMmcfd: number;
  annualDrawTcf: number;
  daysCounted: number;
  scenarios: LiveReserveScenario[];
  series: LiveReserveChartRow[];
  yMax: number;
  /** e.g. "2033–41" */
  exhaustionWindowLabel: string;
}

function isoToUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  return Math.round((isoToUtcMs(b) - isoToUtcMs(a)) / 86_400_000);
}

function fractionalYear(iso: string): number {
  const [y] = iso.split('-').map(Number);
  const dayOfYear = daysBetween(`${y}-01-01`, iso);
  return y + dayOfYear / 365;
}

export function scenarioById(model: LiveReserveModel, id: ReserveScenarioId): LiveReserveScenario {
  return model.scenarios.find((s) => s.id === id) ?? model.scenarios[0];
}

/** Remaining Tcf at an integer year for a scenario (live line before fork, linear decline after) */
export function liveTcfAt(model: LiveReserveModel, year: number, id: ReserveScenarioId): number | null {
  if (year <= model.forkYear) {
    const row = model.series.find((r) => r.year === String(year));
    return row?.audited ?? null;
  }
  const s = scenarioById(model, id);
  const draw = model.remainingTcf / Math.max(s.exhaustionYear - model.asOfYear, 0.5);
  return Math.max(0, model.remainingTcf - draw * (year - model.asOfYear));
}

export function computeLiveReserveModel(
  timeline: PetrobanglaTimelineSummary,
): LiveReserveModel | null {
  const days = timeline.days
    .filter((d) => !d.quarantined && d.parse_status === 'ok' && d.domestic_gas > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (days.length < 365) return null;

  // Integrate raw extraction (MMCF) with trapezoid fill across report gaps,
  // including the lead-in from 1 Jan 2020 to the first archived gas-day.
  let rawCumMmcf = 0;
  const cumByDate: { date: string; cum: number }[] = [];
  let prevDate = '2020-01-01';
  let prevGas = days[0].domestic_gas;
  for (const d of days) {
    const gap = daysBetween(prevDate, d.date);
    if (gap > 0) rawCumMmcf += ((prevGas + d.domestic_gas) / 2) * gap;
    cumByDate.push({ date: d.date, cum: rawCumMmcf });
    prevDate = d.date;
    prevGas = d.domestic_gas;
  }

  // Calibrate so cumulative draw hits the audited 2026 anchor exactly.
  const anchorIdx = lastIndexBefore(cumByDate, '2026-01-01');
  if (anchorIdx < 0) return null;
  const rawAtAnchorTcf = cumByDate[anchorIdx].cum / MMCF_PER_TCF;
  if (rawAtAnchorTcf <= 0) return null;
  const k =
    (BASELINE_REMAINING_2020_TCF - RESERVES_AUDITED_META.remaining2026Tcf) / rawAtAnchorTcf;

  const remainingAt = (cumMmcf: number) =>
    BASELINE_REMAINING_2020_TCF - (k * cumMmcf) / MMCF_PER_TCF;

  const asOfDate = days[days.length - 1].date;
  const asOfYear = fractionalYear(asOfDate);
  const forkYear = Number(asOfDate.slice(0, 4));
  const remainingTcf = remainingAt(rawCumMmcf);
  const extractedTcf = RESERVES_AUDITED_META.initialRecoverableTcf - remainingTcf;

  const last30 = days.slice(-30);
  const currentRateMmcfd = last30.reduce((s, d) => s + d.domestic_gas, 0) / last30.length;
  const annualDrawTcf = (currentRateMmcfd * k * 365.25) / MMCF_PER_TCF;
  if (annualDrawTcf <= 0) return null;

  const bauExhaustion = Math.round(asOfYear + remainingTcf / annualDrawTcf);
  const bauLive = { exhaustionYear: bauExhaustion };
  const scenarios: LiveReserveScenario[] = RESERVE_SCENARIOS.map((s) => {
    // Preserve the editorial scenario spreads relative to BAU, re-anchored on the live rate.
    const exhaustionYear = bauLive.exhaustionYear + (s.exhaustionYear - STATIC_BAU_EXHAUSTION);
    const runwayYears = Math.max(1, exhaustionYear - forkYear);
    return {
      id: s.id,
      exhaustionYear,
      runwayYears,
      annualDrawTcf: remainingTcf / Math.max(exhaustionYear - asOfYear, 0.5),
      vsBauYears: s.exhaustionYear - STATIC_BAU_EXHAUSTION,
    };
  });

  // Live line: 1 Jan balances 2020 → forkYear, then the current balance on the fork year.
  const series: LiveReserveChartRow[] = [];
  for (let y = 2020; y < forkYear; y++) {
    const idx = lastIndexBefore(cumByDate, `${y}-01-01`);
    const cum = idx >= 0 ? cumByDate[idx].cum : 0;
    series.push({ year: String(y), audited: round2(remainingAt(cum)), lowGrowth: null, bau: null, highGrowth: null });
  }
  const forkRow: LiveReserveChartRow = {
    year: String(forkYear),
    audited: round2(remainingTcf),
    lowGrowth: round2(remainingTcf),
    bau: round2(remainingTcf),
    highGrowth: round2(remainingTcf),
  };
  series.push(forkRow);

  const maxExhaustion = Math.max(...scenarios.map((s) => s.exhaustionYear));
  const lastChartYear = maxExhaustion + (maxExhaustion - forkYear) % 2;
  for (let y = forkYear + 2; y <= lastChartYear; y += 2) {
    const row: LiveReserveChartRow = { year: String(y), audited: null, lowGrowth: null, bau: null, highGrowth: null };
    for (const s of scenarios) {
      const draw = remainingTcf / Math.max(s.exhaustionYear - asOfYear, 0.5);
      row[s.id] = round2(Math.max(0, remainingTcf - draw * (y - asOfYear)));
    }
    series.push(row);
  }

  const minExhaustion = Math.min(...scenarios.map((s) => s.exhaustionYear));
  const exhaustionWindowLabel = `${minExhaustion}–${String(maxExhaustion).slice(2)}`;

  return {
    asOfDate,
    asOfYear,
    forkYear,
    remainingTcf,
    extractedTcf,
    extractedPct: (extractedTcf / RESERVES_AUDITED_META.initialRecoverableTcf) * 100,
    declineSince2020Tcf: BASELINE_REMAINING_2020_TCF - remainingTcf,
    currentRateMmcfd,
    annualDrawTcf,
    daysCounted: days.length,
    scenarios,
    series,
    yMax: Math.ceil(BASELINE_REMAINING_2020_TCF + 1.5),
    exhaustionWindowLabel,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Index of the last entry dated strictly before `cutoff` (dates are sorted ascending) */
function lastIndexBefore(rows: { date: string }[], cutoff: string): number {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].date < cutoff) return i;
  }
  return -1;
}
