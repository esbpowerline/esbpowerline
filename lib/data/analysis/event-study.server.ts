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
import { GAS_CRISIS_2026, eventWindow } from '@/lib/data/analysis/event-registry';

/**
 * The study window: three ordinary days, then the R-LNG break (gas day
 * starting 2026-07-21, when the RPGCL line fell 993.5 → 621.6 MMCFD
 * day-on-day), through the end of August.
 *
 * The lead-in is not decoration. A reader cannot see that something broke
 * without seeing what unbroken looked like, and 18-20 July sit at 966.5, 976.3
 * and 993.5 MMCFD — flat, and against the same printed 1,100 capacity the line
 * kept all through the collapse. Derived from the registry so the window and
 * the story it tells cannot drift apart.
 */
export const GAS_CRISIS_WINDOW: DateRange = eventWindow(GAS_CRISIS_2026);

/**
 * The 30 days ending the day before the lead-in (2026-06-18 → 07-17).
 *
 * Two absences in it are real and are carried rather than dodged. PGCB filed
 * no unserved/demand figure on 2026-06-20 — one of twelve June days whose
 * workbook has no hourly sheet — so the unserved baseline is 29 of 30 days.
 * Petrobangla has no document whose window starts on 2026-06-21, so its
 * baselines are 29 of 30 too, for a different reason and on a different day.
 * Neither is smoothed: each series states its own denominator on its own tile.
 *
 * An earlier version of this range started on 06-21 precisely to sidestep the
 * first gap. That was the wrong instinct — it chose the baseline to flatter the
 * arithmetic instead of choosing it to sit against the lead-in, and it is
 * exactly the kind of quiet curation the archive's charter exists to prevent.
 *
 * The range also CONTAINS the late-June shedding episode (62.3 GWh unserved on
 * 06-28 with gas at full supply), which the page states rather than trims: a
 * baseline curated to look calm would be our editing, not PGCB's record.
 */
export const GAS_CRISIS_BASELINE: DateRange = GAS_CRISIS_2026.baseline;

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
