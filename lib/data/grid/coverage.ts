/**
 * What each dataset on the Grid Explorer actually covers.
 *
 * Every card used to carry the same hardcoded "Tracked since December 31,
 * 2013" — the archive's own first day, copied across eight of them. It was
 * wrong wherever a dataset starts later, and it was reported: the Cross-Border
 * Imports tracker advertised 2013 while returning nothing until 2018, because
 * imports were read from a sheet that does not exist before then.
 *
 * These figures are measured off `public/data`, not asserted. Re-measure with:
 *
 *   node -e "…" over public/data/daily — see scripts/audit_workbook_sheets.py
 *   for the same idea applied to source sheets
 *
 * A start date here is the first day the archive HAS the data, which is not a
 * claim about when PGCB began publishing it. Where the two differ it is usually
 * because a sheet is unread or a source workbook is missing, and that gap is
 * worth closing rather than papering over with an earlier date.
 */
export interface GridCoverage {
  /** First archived day carrying this dataset, ISO. */
  since: string;
  /** How many days carry it, out of 4,523 archived. */
  days: number;
  /** Why it starts there, when that is not simply the archive's own start. */
  note?: string;
}

/** Measured 2026-08-09 across 4,523 archived days. */
export const GRID_COVERAGE = {
  fuelMix: { since: '2013-12-31', days: 4523 },
  fuelCost: {
    since: '2014-01-01',
    days: 2027,
    note: 'the per-fuel production-cost block is absent from many layouts',
  },
  loadCurve: { since: '2014-01-01', days: 3270 },
  hourlyShedding: {
    since: '2014-01-01',
    days: 2027,
    note: 'from the hourly sheet each era publishes; days without one carry the evening peak alone',
  },
  borderImports: {
    since: '2014-01-01',
    days: 3452,
    note: 'HVDC Bheramara from 2014, Tripura from 2016, Adani and Nepal on the 2025 layout',
  },
  regionalDemand: { since: '2013-12-31', days: 4451 },
  outages: { since: '2013-12-31', days: 4518 },
  gasProduction: {
    since: '2020-01-11',
    days: 1474,
    note: 'Petrobangla daily gas reports, a separate publisher from PGCB',
  },
  powerStations: {
    since: '2014-01-01',
    days: 1864,
    note: 'limited by which source workbooks are archived, not by the report',
  },
  energyCurve: { since: '2014-01-01', days: 1972 },
} as const satisfies Record<string, GridCoverage>;

export type GridDataset = keyof typeof GRID_COVERAGE;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "December 31, 2013" from an ISO date, without pulling in a date library. */
export function formatCoverageDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** The caption a card shows, e.g. "Tracked since January 1, 2014 · 3,452 days". */
export function coverageLabel(dataset: GridDataset): string {
  const { since, days } = GRID_COVERAGE[dataset];
  return `Tracked since ${formatCoverageDate(since)} · ${days.toLocaleString('en-US')} days`;
}
