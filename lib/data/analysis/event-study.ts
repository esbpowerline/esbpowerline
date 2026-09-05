/**
 * Event study — the pure engine.
 *
 * Turns a run of archive days into the series set for an analysis page: the
 * chain gas supply → gas-fired generation → total generation → demand → load
 * shed, each point carrying its state and each series carrying its coverage,
 * provenance and a baseline delta whose formula is stated on the object itself.
 *
 * This module is deliberately free of IO and React. The server loader
 * (`event-study.server.ts`) reads the archive through the existing accessors
 * and hands plain nullable readings in; everything here is arithmetic over
 * them. That split is what makes the doctrine testable: a unit test can feed a
 * real archive day in and assert that a null reading stays null all the way to
 * the delta — the Gas Supply tile incident (2,366 → 856 MMCFD under one label,
 * 2026-08) happened precisely where loading and computing were tangled.
 *
 * The rules, restated where they are enforced:
 *  - null is not zero. A day the publisher did not file contributes nothing to
 *    a mean — it is excluded and counted, never averaged in as 0.
 *  - A delta is a SIGNED DIFFERENCE and nothing more. No grading, no accuracy,
 *    and no percentage against a mean that a missing day would distort — the
 *    same stance `forward-forecast.ts` takes for forecast-vs-actual.
 *  - Every series names one publisher and one printed field. The chain is the
 *    page's reading order, not a causal claim; nothing here computes
 *    "attribution", and the June 2026 archive is why (62.3 GWh unserved on
 *    2026-06-28 with gas at full supply — see PHASE1_EVENT_STUDY_FINDINGS.md §3).
 */

import type { Figure, Publisher } from '@/lib/data/grid/figure';
import { fromNullable } from '@/lib/data/grid/figure';
import {
  comparable,
  pgcbEnergyDay,
  petrobanglaGasDay,
  shiftDay,
  type AlignmentClass,
  type ObservationWindow,
} from '@/lib/data/grid/observation-window';
// Type-only, so no component code is pulled into this pure module; it is the
// same P/D vocabulary every explorer figure already renders, not a new one.
import type { GridProvenance } from '@/components/news/power-grid/GridExplorerUI';

/** Inclusive ISO date range. */
export type DateRange = { start: string; end: string };

/**
 * One day's readings, already extracted from the archive by the server loader.
 * Every field is `number | null` because that is what reading a report yields;
 * `fromNullable` is where ambiguity stops (figure.ts).
 *
 * Petrobangla figures are anchored to this energy day under the L1 rule — the
 * gas day STARTING 08:00 on this date — which the loader guarantees by going
 * through `loadPetrobanglaForEnergyDay` (it rejects a document whose window
 * does not start on the requested day).
 */
export interface EventStudyDayInput {
  date: string;
  /** Petrobangla, gas day 08:00 D → 08:00 D+1, MMCFD. */
  gasNationalMmcfd: number | null;
  gasRlngMmcfd: number | null;
  /** PGCB P1, energy day 00:00 → 24:00. */
  gasToPowerMmcfd: number | null;
  gasGenGwh: number | null;
  hfoGenGwh: number | null;
  coalGenGwh: number | null;
  totalGenGwh: number | null;
  demandGwh: number | null;
  unservedGwh: number | null;
  totalDailyCostTk: number | null;
  /** Derived UPSTREAM by the parser (cost ÷ generation, parse_daily_reports.py:1890). */
  avgCostTkPerKwh: number | null;
  /** The documents this day cites, named as the publishers name them. */
  pgcbSourceFile: string | null;
  petrobanglaSourceFile: string | null;
}

export type EventStudySeriesId =
  | 'gasNational'
  | 'gasRlng'
  | 'gasToPower'
  | 'gasGen'
  | 'hfoGen'
  | 'coalGen'
  | 'totalGen'
  | 'demand'
  | 'unserved'
  | 'dailyCost'
  | 'avgCost';

interface SeriesMeta {
  id: EventStudySeriesId;
  label: string;
  publisher: Publisher;
  unit: string;
  alignment: AlignmentClass;
  /** P = the source prints it; D = computed from printed figures. */
  provenance: GridProvenance;
  /** The printed field, stated so a reader can find it in the document. */
  sourceNote: string;
  pick: (d: EventStudyDayInput) => number | null;
  windowFor: (date: string, sourceFile?: string) => ObservationWindow;
}

/**
 * The registry. Order here is meaningless — the page's reading order lives in
 * CHAIN_CARDS below, where the pairing rules are enforced.
 */
export const EVENT_STUDY_SERIES: Record<EventStudySeriesId, SeriesMeta> = {
  gasNational: {
    id: 'gasNational',
    label: 'National gas production',
    publisher: 'Petrobangla',
    unit: 'MMCFD',
    alignment: 'interval-mean',
    provenance: 'P',
    sourceNote: 'Grand Total (1+2+3+4+5) row of the daily gas report',
    pick: (d) => d.gasNationalMmcfd,
    windowFor: (date, f) => petrobanglaGasDay(date, { sourceFile: f }),
  },
  gasRlng: {
    id: 'gasRlng',
    label: 'RPGCL R-LNG supply',
    publisher: 'Petrobangla',
    unit: 'MMCFD',
    alignment: 'interval-mean',
    provenance: 'P',
    sourceNote: 'RPGCL (R-LNG) subtotal of the daily gas report',
    pick: (d) => d.gasRlngMmcfd,
    windowFor: (date, f) => petrobanglaGasDay(date, { sourceFile: f }),
  },
  gasToPower: {
    id: 'gasToPower',
    label: 'Gas supplied to power sector',
    publisher: 'PGCB',
    unit: 'MMCFD',
    alignment: 'interval-mean',
    provenance: 'P',
    sourceNote: 'P1 "Total Gas Supplied" — PGCB’s own figure, not Petrobangla’s',
    pick: (d) => d.gasToPowerMmcfd,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
  gasGen: {
    id: 'gasGen',
    label: 'Gas-fired generation',
    publisher: 'PGCB',
    unit: 'GWh',
    alignment: 'interval-total',
    provenance: 'P',
    sourceNote: 'P1 fuel-wise generation, Gas row',
    pick: (d) => d.gasGenGwh,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
  hfoGen: {
    id: 'hfoGen',
    label: 'HFO generation',
    publisher: 'PGCB',
    unit: 'GWh',
    alignment: 'interval-total',
    provenance: 'P',
    sourceNote: 'P1 fuel-wise generation, HFO row',
    pick: (d) => d.hfoGenGwh,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
  coalGen: {
    id: 'coalGen',
    label: 'Coal generation',
    publisher: 'PGCB',
    unit: 'GWh',
    alignment: 'interval-total',
    provenance: 'P',
    sourceNote: 'P1 fuel-wise generation, Coal row',
    pick: (d) => d.coalGenGwh,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
  totalGen: {
    id: 'totalGen',
    label: 'Total generation',
    publisher: 'PGCB',
    unit: 'GWh',
    alignment: 'interval-total',
    provenance: 'P',
    sourceNote: 'P1 total energy generated',
    pick: (d) => d.totalGenGwh,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
  demand: {
    id: 'demand',
    label: 'Energy demand',
    publisher: 'PGCB',
    unit: 'GWh',
    alignment: 'interval-total',
    provenance: 'P',
    sourceNote: 'P1 total energy demand',
    pick: (d) => d.demandGwh,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
  unserved: {
    id: 'unserved',
    label: 'Energy unserved (load shed)',
    publisher: 'PGCB',
    unit: 'GWh',
    alignment: 'interval-total',
    provenance: 'P',
    sourceNote: 'P1 total energy unserved',
    pick: (d) => d.unservedGwh,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
  dailyCost: {
    id: 'dailyCost',
    label: 'Total production cost',
    publisher: 'PGCB',
    unit: 'Tk',
    alignment: 'interval-total',
    provenance: 'P',
    sourceNote: 'P1 "Production Cost (Tk.)" total row',
    pick: (d) => d.totalDailyCostTk,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
  avgCost: {
    id: 'avgCost',
    label: 'Average production cost',
    publisher: 'PGCB',
    unit: 'Tk/kWh',
    alignment: 'interval-mean',
    // Derived by the archive's parser (cost ÷ generation); PGCB prints a cell
    // the parser deliberately never reads. Rendered D since 2026-09-04, when
    // months of it marked P became the incident recorded in types.ts:42.
    provenance: 'D',
    sourceNote: 'totalDailyCost ÷ totalEnergyGen — the source never states this rate',
    pick: (d) => d.avgCostTkPerKwh,
    windowFor: (date, f) => pgcbEnergyDay(date, f),
  },
};

export interface EventStudyPoint {
  date: string;
  /** null = the publisher did not file this figure for this day. Never 0. */
  value: number | null;
}

export interface RangeCoverage {
  /** Calendar days in the range. */
  expectedDays: number;
  /** Days on which this series has a published value. */
  publishedDays: number;
  /** The days that have none — listed, because "which days" is the finding. */
  missingDates: string[];
}

export interface BaselineDelta {
  /** Mean over published days in the study window, or null when none. */
  windowMean: number | null;
  /** Mean over published days in the baseline, or null when none. */
  baselineMean: number | null;
  /**
   * windowMean − baselineMean; null when either side has no published days.
   * A signed difference and nothing more — no percentage, no grade.
   */
  delta: number | null;
  /** The formula, stated on the object so every renderer shows the same one. */
  formula: string;
}

export interface EventStudySeries {
  id: EventStudySeriesId;
  label: string;
  publisher: Publisher;
  unit: string;
  alignment: AlignmentClass;
  provenance: GridProvenance;
  sourceNote: string;
  /** One point per calendar day of the study window, in order, nulls kept. */
  points: EventStudyPoint[];
  windowCoverage: RangeCoverage;
  baselineCoverage: RangeCoverage;
  /** DERIVED — the only computation this module performs. */
  baseline: BaselineDelta;
}

export interface EventStudyResult {
  window: DateRange;
  baselineRange: DateRange;
  series: Record<EventStudySeriesId, EventStudySeries>;
  /**
   * Source documents cited by the days in the window, deduplicated, per
   * publisher — in DAY ORDER, not name order. The archive's held names are
   * heterogeneous ("Daily-Gas-Intake-Offtake-Report (26.07.26).pdf" beside
   * "petrobangla_2026-08-01.pdf"), so a lexical sort would present two
   * arbitrary names as the span's endpoints.
   */
  sourceFiles: { pgcb: string[]; petrobangla: string[] };
}

/** Every calendar day of an inclusive range, in order. */
export function enumerateDays(range: DateRange): string[] {
  const days: string[] = [];
  for (let d = range.start; d <= range.end; d = shiftDay(d, 1)) {
    days.push(d);
    if (days.length > 1000) throw new Error(`Range too large: ${range.start}..${range.end}`);
  }
  return days;
}

function meanOfPublished(values: Array<number | null>): { mean: number | null; published: number } {
  const present = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (present.length === 0) return { mean: null, published: 0 };
  return { mean: present.reduce((a, b) => a + b, 0) / present.length, published: present.length };
}

function coverageOf(days: string[], byDate: Map<string, EventStudyDayInput>, pick: SeriesMeta['pick']): RangeCoverage {
  const missing: string[] = [];
  let published = 0;
  for (const d of days) {
    const input = byDate.get(d);
    const v = input ? pick(input) : null;
    if (v === null || !Number.isFinite(v)) missing.push(d);
    else published += 1;
  }
  return { expectedDays: days.length, publishedDays: published, missingDates: missing };
}

/**
 * Build the full series set. `days` may cover both ranges in one array; days
 * outside them are ignored. A range day with no entry in `days` at all is
 * treated exactly like a day whose figure is unpublished — absent, counted.
 */
export function buildEventStudy(
  days: EventStudyDayInput[],
  window: DateRange,
  baselineRange: DateRange,
): EventStudyResult {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const windowDays = enumerateDays(window);
  const baselineDays = enumerateDays(baselineRange);

  const series = {} as Record<EventStudySeriesId, EventStudySeries>;
  for (const meta of Object.values(EVENT_STUDY_SERIES)) {
    const points: EventStudyPoint[] = windowDays.map((date) => {
      const input = byDate.get(date);
      const v = input ? meta.pick(input) : null;
      return { date, value: v !== null && Number.isFinite(v) ? v : null };
    });
    const windowCoverage = coverageOf(windowDays, byDate, meta.pick);
    const baselineCoverage = coverageOf(baselineDays, byDate, meta.pick);
    const w = meanOfPublished(points.map((p) => p.value));
    const b = meanOfPublished(baselineDays.map((d) => {
      const input = byDate.get(d);
      return input ? meta.pick(input) : null;
    }));
    series[meta.id] = {
      id: meta.id,
      label: meta.label,
      publisher: meta.publisher,
      unit: meta.unit,
      alignment: meta.alignment,
      provenance: meta.provenance,
      sourceNote: meta.sourceNote,
      points,
      windowCoverage,
      baselineCoverage,
      baseline: {
        windowMean: w.mean,
        baselineMean: b.mean,
        delta: w.mean !== null && b.mean !== null ? w.mean - b.mean : null,
        formula:
          `mean over ${w.published} published day(s) of ${window.start}..${window.end}` +
          ` − mean over ${b.published} published day(s) of ${baselineRange.start}..${baselineRange.end};` +
          ' unpublished days excluded, never zeroed',
      },
    };
  }

  const pgcb = new Set<string>();
  const petrobangla = new Set<string>();
  for (const d of windowDays) {
    const input = byDate.get(d);
    if (input?.pgcbSourceFile) pgcb.add(input.pgcbSourceFile);
    if (input?.petrobanglaSourceFile) petrobangla.add(input.petrobanglaSourceFile);
  }

  return {
    window,
    baselineRange,
    series,
    sourceFiles: { pgcb: [...pgcb], petrobangla: [...petrobangla] },
  };
}

/** Lift one point into a Figure — the render boundary's `?? 0` firewall. */
export function pointFigure(series: EventStudySeries, point: EventStudyPoint): Figure {
  return fromNullable(point.value, series.publisher);
}

/**
 * The page's reading order — one card per question, same philosophy as the
 * explorer's tab bar. A card may overlay several series ONLY when every pair
 * passes `comparable()`; `assertCardsComparable` (used by the tests, and cheap
 * enough to call at module load in dev) makes the L2 mistake — a rate and an
 * accumulated total on one axis — a build failure instead of a memory.
 */
export interface ChainCard {
  key: string;
  question: string;
  seriesIds: EventStudySeriesId[];
}

export const CHAIN_CARDS: ChainCard[] = [
  {
    key: 'gas-supply',
    question: 'How much gas was lost?',
    seriesIds: ['gasNational', 'gasRlng'],
  },
  {
    key: 'gas-to-power',
    question: 'How much reached the power sector?',
    seriesIds: ['gasToPower'],
  },
  {
    key: 'generation',
    question: 'What generation was lost, and what ran instead?',
    seriesIds: ['gasGen', 'hfoGen', 'coalGen'],
  },
  {
    key: 'shortfall',
    question: 'What was the shortfall?',
    seriesIds: ['totalGen', 'demand', 'unserved'],
  },
  {
    key: 'cost',
    question: 'What did it cost?',
    seriesIds: ['dailyCost'],
  },
];

/** Throws when any card pairs series that must not share an axis. */
export function assertCardsComparable(cards: ChainCard[] = CHAIN_CARDS): void {
  // Any window day works as the representative — comparability depends on the
  // window SHAPE and alignment class, not on which date is chosen.
  const probe = '2026-07-21';
  for (const card of cards) {
    for (let i = 0; i < card.seriesIds.length; i += 1) {
      for (let j = i + 1; j < card.seriesIds.length; j += 1) {
        const a = EVENT_STUDY_SERIES[card.seriesIds[i]];
        const b = EVENT_STUDY_SERIES[card.seriesIds[j]];
        const verdict = comparable(
          { window: a.windowFor(probe), alignment: a.alignment },
          { window: b.windowFor(probe), alignment: b.alignment },
        );
        if (!verdict.ok) {
          throw new Error(
            `Card "${card.key}" pairs ${a.id} with ${b.id}: ${verdict.reason}`,
          );
        }
      }
    }
  }
}
