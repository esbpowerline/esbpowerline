/**
 * Which tabs of the Grid Explorer actually have something to show for a day.
 *
 * The explorer renders the same ten tabs whatever date is chosen, but the
 * source reports do not carry the same sheets in every era. PGCB's workbook
 * gained a P4 hourly sheet, then an En-Curve stack, then an EWIC sheet, and
 * Petrobangla's gas reports only enter the archive in 2020. Opening a 2015 day
 * therefore lands a reader on tabs that are structurally empty — and an empty
 * tab reads as "nothing happened here", which is a different and much stronger
 * claim than "this era's report has no such sheet".
 *
 * `GRID_COVERAGE` in coverage.ts already measures the archive-wide span of each
 * dataset. What was missing is the per-day statement, which is what a reader
 * standing on one date actually needs. This derives it from the day's own
 * payload rather than from a date range, so a day that is missing a sheet its
 * era normally carries is reported as missing rather than assumed present.
 */

import type { GridDailyData } from '@/lib/data/grid/types';

export type GridTabId =
  | 'overview'
  | 'gen'
  | 'gas'
  | 'imports'
  | 'regional'
  | 'renewables'
  | 'plants'
  | 'transmission'
  | 'macro';

export interface TabAvailability {
  /** False when the day's report carries nothing this tab is built from. */
  hasData: boolean;
  /**
   * Why it is empty, in the words the UI should use. Says what the SOURCE does
   * or does not publish — never "no data", which reads as a measurement of
   * zero.
   */
  reason?: string;
}

/**
 * Tabs whose content does not move with the date picker at all.
 *
 * Renewables leads with SREDA's standing register and Macro with annual and
 * monthly series. Marking them "empty" on a day whose daily payload is thin
 * would be wrong — they were never keyed to the day in the first place.
 */
const DATE_INDEPENDENT: ReadonlySet<GridTabId> = new Set(['macro', 'transmission']);

export function tabAvailability(
  data: GridDailyData | null | undefined,
): Record<GridTabId, TabAvailability> {
  const ok = (hasData: boolean, reason: string): TabAvailability =>
    hasData ? { hasData: true } : { hasData: false, reason };

  if (!data) {
    const none = { hasData: false, reason: 'No report is held for this day.' };
    return {
      overview: none,
      gen: none,
      gas: none,
      imports: none,
      regional: none,
      renewables: { hasData: true },
      plants: none,
      transmission: { hasData: true },
      macro: { hasData: true },
    };
  }

  const gen = data.generationData ?? [];
  const hasGen = gen.some((g) => (g?.gen ?? 0) > 0);
  const hasCost = gen.some((g) => g?.cost != null);
  const gas = data.gasProductionData ?? [];
  const hasGas = gas.some((g) => (g?.gas ?? 0) > 0);
  const imports = data.borderImportsData ?? [];
  const regional = data.regionalDemandData ?? [];
  const hourly = data.hourlyLoadData ?? [];

  return {
    overview: ok(
      hasGen || (data.systemStats?.eveningPeakGen ?? 0) > 0,
      "PGCB's report for this day carries no generation summary.",
    ),
    gen: ok(
      hasGen,
      hasCost
        ? "PGCB's report for this day carries no per-fuel generation table."
        : 'This era of the report publishes no per-fuel production-cost block, so cost per unit cannot be shown.',
    ),
    gas: ok(
      hasGas,
      'Petrobangla published no gas report for this day, or none is held. Petrobangla daily reports enter this archive from January 2020; before that the grid figures stand alone.',
    ),
    imports: ok(
      imports.length > 0,
      'This era of the report carries no cross-border interconnector sheet. HVDC Bheramara appears from 2014, Tripura from 2016, and Adani and Nepal only on the 2025 layout.',
    ),
    regional: ok(
      regional.length > 0,
      "PGCB's report for this day carries no zone-wise demand and load-shed table.",
    ),
    renewables: { hasData: true },
    plants: ok(
      // The per-station table lives in a separate file fetched on demand, so
      // its presence cannot be read off this payload. The evening-peak total is
      // the honest proxy: a day with no peak generation has no station table.
      (data.systemStats?.eveningPeakGen ?? 0) > 0,
      "PGCB's report for this day carries no power-station table.",
    ),
    transmission: { hasData: true },
    macro: { hasData: true },
  };
}

/** Tabs that are empty for this day, in the order the tab bar lists them. */
export function emptyTabs(
  availability: Record<GridTabId, TabAvailability>,
  order: readonly GridTabId[],
): Array<{ id: GridTabId; reason: string }> {
  return order
    .filter((id) => !DATE_INDEPENDENT.has(id) && !availability[id]?.hasData)
    .map((id) => ({ id, reason: availability[id]?.reason ?? 'Not published for this day.' }));
}

/** Whether the hourly profile on this day is measured or a single stated hour. */
export function hourlyResolution(data: GridDailyData | null | undefined): {
  kind: 'hourly' | 'single-hour' | 'none';
  note: string;
} {
  const rows = data?.hourlyLoadData ?? [];
  if (!rows.length) {
    return {
      kind: 'none',
      note: 'This era of the report carries no hourly sheet and no load curve.',
    };
  }
  const stated = rows.filter((r) => r.demand != null || r.loadShed != null).length;
  if (stated <= 1) {
    return {
      kind: 'single-hour',
      // The distinction that matters: one published hour is not a profile, and
      // drawing it as one is how a synthesised curve gets mistaken for a
      // measurement.
      note:
        'This era publishes demand and load shedding for the evening peak alone. ' +
        'The other hours are unknown, not zero, and no profile is drawn across them.',
    };
  }
  return { kind: 'hourly', note: `${stated} hours published for this day.` };
}
