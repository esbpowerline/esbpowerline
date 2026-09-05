import 'server-only';

/**
 * Event study — the archive-facing half.
 *
 * Reads days through the SAME accessors every other surface uses, so the
 * precedence rule (a DataRelease always beats a static file) and the window
 * rule (a Petrobangla document must START on the requested energy day) are
 * enforced in their one existing home each, not re-implemented here:
 *
 *   - `loadDailyReportFromDisk`      release → public/data/daily, validated
 *   - `loadPetrobanglaForEnergyDay`  release → file, window-checked (it is the
 *     function that rejects a PDF filed under the wrong day — see the
 *     2026-06-22 file-keying flip in observation-window.ts)
 *
 * Two readings deliberately do NOT come from the grid day file:
 *   - gas figures. On 2026-06-25..29 the grid file's own gasProductionData rows
 *     are the legacy all-zero "window not published" form while the Petrobangla
 *     files for the same days carry real figures (verify:data WARN zero-gas).
 *     Reading gas from the grid file would publish six zeros as measurements.
 *   - anything hourly. The page's hourly panel calls /api/grid/history/series,
 *     where the aggregation rules are versioned; nothing here re-aggregates.
 */

import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import {
  archiveGasLng,
  archiveGasTotal,
  loadPetrobanglaForEnergyDay,
} from '@/lib/data/grid/petrobangla-day.server';
import type { GridDailyData } from '@/lib/data/grid/types';
import {
  buildEventStudy,
  enumerateDays,
  type DateRange,
  type EventStudyDayInput,
  type EventStudyResult,
} from '@/lib/data/analysis/event-study';

/**
 * The study window: the R-LNG break (gas day starting 2026-07-21, when the
 * RPGCL line fell 993.5 → 621.6 MMCFD day-on-day) through the end of August.
 */
export const GAS_CRISIS_WINDOW: DateRange = { start: '2026-07-21', end: '2026-08-31' };

/**
 * The 30 days before the break. Not further back: twelve June days (06-02,
 * 06-06..11, 06-14..17, 06-20) carry no workbook hourly sheet and null
 * unserved/demand, so a longer baseline would quietly thin exactly the series
 * the study is about. This range has full unserved coverage — and it CONTAINS
 * the June shedding episode (62.3 GWh on 06-28 with gas at full supply), which
 * the page states rather than trims away: a baseline curated to look calm
 * would be our editing, not PGCB's record.
 */
export const GAS_CRISIS_BASELINE: DateRange = { start: '2026-06-21', end: '2026-07-20' };

function fuelGen(data: GridDailyData, name: string): number | null {
  const row = data.generationData?.find((g) => g.name === name);
  return typeof row?.gen === 'number' && Number.isFinite(row.gen) ? row.gen : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

async function loadDayInput(date: string): Promise<EventStudyDayInput> {
  const empty: EventStudyDayInput = {
    date,
    gasNationalMmcfd: null,
    gasRlngMmcfd: null,
    gasToPowerMmcfd: null,
    gasGenGwh: null,
    hfoGenGwh: null,
    coalGenGwh: null,
    totalGenGwh: null,
    demandGwh: null,
    unservedGwh: null,
    totalDailyCostTk: null,
    avgCostTkPerKwh: null,
    pgcbSourceFile: null,
    petrobanglaSourceFile: null,
  };

  const [grid, gas] = await Promise.all([
    loadDailyReportFromDisk(date),
    loadPetrobanglaForEnergyDay(date),
  ]);

  const input = { ...empty };
  if (grid.ok) {
    const s = grid.data.systemStats;
    input.gasToPowerMmcfd = num(s.totalGasSuppliedPower);
    input.gasGenGwh = fuelGen(grid.data, 'Gas');
    input.hfoGenGwh = fuelGen(grid.data, 'HFO');
    input.coalGenGwh = fuelGen(grid.data, 'Coal');
    input.totalGenGwh = num(s.totalEnergyGen);
    input.demandGwh = num(s.totalEnergyDemand);
    input.unservedGwh = num(s.totalEnergyUnserved);
    input.totalDailyCostTk = num(s.totalDailyCost);
    input.avgCostTkPerKwh = num(s.avgProductionCost);
    input.pgcbSourceFile = grid.data.sourceFiles?.pgcb ?? null;
  }
  if (gas) {
    input.gasNationalMmcfd = archiveGasTotal(gas.doc);
    input.gasRlngMmcfd = archiveGasLng(gas.doc);
    input.petrobanglaSourceFile =
      (gas.doc as { meta?: { source_filename?: string } }).meta?.source_filename ?? null;
  }
  return input;
}

/** Load and build the full study. Days both ranges need, one read each. */
export async function loadGasCrisisStudy(
  window: DateRange = GAS_CRISIS_WINDOW,
  baseline: DateRange = GAS_CRISIS_BASELINE,
): Promise<EventStudyResult> {
  const dates = [...new Set([...enumerateDays(baseline), ...enumerateDays(window)])];
  const days = await Promise.all(dates.map(loadDayInput));
  return buildEventStudy(days, window, baseline);
}

/* ── the quoted outage rows ──────────────────────────────────────────────── */

/**
 * The generating-plant outages whose printed reason names the gas supply.
 *
 * An explicit list, not a regex series: most "gas" matches in the outage log
 * are SF6 breaker gas at substations ("Low SF6 gas pressure in LCC", "Breaker
 * gas pressure problem"), and counting matches would fabricate a statistic no
 * source published. These three were identified by reading every reason in the
 * window (PHASE1_EVENT_STUDY_FINDINGS.md §3.2); the page quotes the rows
 * verbatim. The `reasonMustMatch` guard means that if a republish ever changes
 * the underlying text, the row drops out rather than being quoted wrongly.
 */
const GAS_SUPPLY_OUTAGE_KEYS: Array<{
  date: string;
  plantIncludes: string;
  reasonMustMatch: RegExp;
}> = [
  { date: '2026-07-22', plantIncludes: 'Sirajgonj 225MW', reasonMustMatch: /low gas pressure/i },
  { date: '2026-07-23', plantIncludes: 'JERA Meghnaghat', reasonMustMatch: /gas shortage/i },
  { date: '2026-08-14', plantIncludes: 'Unique Meghnaghat', reasonMustMatch: /low gas pressure/i },
];

export interface GasSupplyOutageQuote {
  date: string;
  plant: string;
  time: string | null;
  /** Verbatim from the archive — never paraphrased. */
  reason: string;
  pgcbSourceFile: string | null;
}

export async function loadGasSupplyOutageQuotes(): Promise<GasSupplyOutageQuote[]> {
  const quotes: GasSupplyOutageQuote[] = [];
  const byDate = new Map<string, typeof GAS_SUPPLY_OUTAGE_KEYS>();
  for (const key of GAS_SUPPLY_OUTAGE_KEYS) {
    byDate.set(key.date, [...(byDate.get(key.date) ?? []), key]);
  }
  for (const [date, keys] of byDate) {
    const grid = await loadDailyReportFromDisk(date);
    if (!grid.ok) continue;
    for (const key of keys) {
      for (const row of grid.data.dailyOutages ?? []) {
        const plant = row.plant ?? '';
        const reason = row.reason ?? '';
        if (plant.includes(key.plantIncludes) && key.reasonMustMatch.test(reason)) {
          quotes.push({
            date,
            plant,
            time: row.time ?? null,
            reason,
            pgcbSourceFile: grid.data.sourceFiles?.pgcb ?? null,
          });
        }
      }
    }
  }
  return quotes;
}
