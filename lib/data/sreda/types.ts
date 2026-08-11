/** SREDA National Database of Renewable Energy — daily snapshot types. */

export interface SredaRenewableTechRow {
  tech: string;
  offGridMw: number;
  onGridMw: number;
  totalMw: number;
}

export interface SredaGenerationMixRow {
  fuel: string;
  capacityMw: number;
  sharePct: number;
}

/**
 * One row of SREDA's "Technology wise Generation" table (index.php?id=8).
 *
 * `quantity` is a count of installations, not a capacity — 6,037,583 solar home
 * systems against 14 solar parks — so the two columns must never be summed
 * together or ranked against each other.
 *
 * Capacity is in MWp (peak DC) exactly as SREDA prints it. That is not the same
 * unit as the MW used for the grid's installed capacity, and converting between
 * them requires a performance ratio SREDA does not publish, so they are kept
 * apart and labelled.
 */
export interface SredaTechnologyRow {
  /** "Solar", "Wind", "Hydro", "Biogas", "Biomass". */
  source: string;
  technology: string;
  quantity: number;
  offGridMwp: number;
  onGridMwp: number;
  totalMwp: number;
}

/** One organisation's holding within a technology (index.php?id=15/16/17). */
export interface SredaOrganisationRow {
  /** Acronym as SREDA prints it: BPDB, NWPGCL, EGCB, BREB, IDCOL, BADC… */
  organisation: string;
  quantity: number;
  /** Normalised to MWp for arithmetic. Derived where SREDA printed kWp. */
  capacityMwp: number;
  /** SREDA's own string, e.g. "594.65 MWp" or "292.08 kWp". */
  capacityPublished: string;
}

export interface SredaOrganisationTable {
  /** "Solar Parks", "Net Metered Rooftop Solar", "Solar Irrigation Pumps". */
  category: string;
  sourceUrl: string;
  rows: SredaOrganisationRow[];
  /** SREDA's own printed Total row, kept separate from any recomputation. */
  publishedTotalMwp: number | null;
  publishedTotalQuantity: number | null;
  /**
   * The Total exactly as SREDA printed it, e.g. "290.9 kWp".
   *
   * Displaying the converted number instead showed 0.29 MWp for a total the
   * source states as 290.9 kWp — the same figure, but not the one published,
   * and rounded past the precision SREDA gave.
   */
  publishedTotalCapacity: string | null;
}

/**
 * A row of SREDA's "Energy Generation and Carbon Savings" table
 * (index.php?id=21).
 *
 * Both of SREDA's column groups are headed "Expected Energy Generation" — the
 * "Till Today" pair included. These are modelled from installed capacity and
 * elapsed time, NOT metered output, and SREDA publishes neither the yield
 * assumption nor the emission factor behind them. They are carried verbatim as
 * strings and labelled as estimates so nothing here can be read as measured
 * generation.
 */
export interface SredaCarbonRow {
  technology: string;
  installedCapacity: string;
  lifetimeEnergyExpected: string;
  lifetimeCo2Expected: string;
  tillTodayEnergyExpected: string;
  tillTodayCo2Expected: string;
}

/**
 * One row of SREDA's year-wise commissioning tables (index.php?id=11 and 12).
 *
 * `year` is kept as SREDA's own string rather than a number. Its large-project
 * table carries three values that are not usable years — "0021", "0000" and a
 * 1988 row — and coercing them would either invent a date or silently drop
 * capacity that SREDA counts in its own total.
 */
export interface SredaYearRow {
  year: string;
  /** Installations. SREDA prints this only on the small-projects table. */
  quantity: number | null;
  /** Normalised to MWp. Derived where SREDA printed kWp. */
  capacityMwp: number;
  /** SREDA's own string, e.g. "380.48 MWp" or "85.14 kWp". */
  capacityPublished: string;
  /** True when `year` is not a usable four-digit year in the published data. */
  yearMalformed: boolean;
}

export interface SredaYearTable {
  /** "Large Projects" or "Small Projects". */
  category: string;
  sourceUrl: string;
  rows: SredaYearRow[];
  publishedTotalMwp: number | null;
  publishedTotalQuantity: number | null;
  /** SREDA's own unit on the Total row — it prints "MW" where rows say "MWp". */
  publishedTotalUnit: string | null;
  /** The Total exactly as SREDA printed it, e.g. "1536.86 MW". */
  publishedTotalCapacity: string | null;
}

/**
 * One project from SREDA's RE Large Projects register (index.php?id=1).
 *
 * The register lists projects at every stage of life, not only running ones:
 * "Completed & Running", "Implementation Ongoing", "Under Planning" and
 * "Obsolete System/Plant" all appear in the same table. Wind shows 15 projects
 * of which 2 are running, so a reader shown the row count alone would take a
 * planning pipeline for an installed fleet. `status` is therefore mandatory
 * wherever these rows are displayed or summed.
 */
export interface SredaProjectRow {
  projectName: string;
  /** SREDA's own project identifier. */
  sid: string;
  /** Normalised to MWp for arithmetic. Derived where SREDA printed kWp. */
  capacityMwp: number;
  /** SREDA's own string, e.g. "140 MWp" or "4 kWp". */
  capacityPublished: string;
  location: string;
  technology: string;
  /** Implementing agency as SREDA prints it: BPDB, NWPGCL, EGCB, DESCO… */
  agency: string;
  /** The full name from the cell's `abbr title`, e.g. "North-West Power Generation Company Limited". */
  agencyFullName: string | null;
  /** Lender / financing mode, e.g. "UCB", "WB", "IPP (Unsolicited)". */
  finance: string;
  /** The full name from the cell's `abbr title`, e.g. "European Investment Bank (EIB)". */
  financeFullName: string | null;
  /**
   * SREDA's Completion Date column, sorted as "COD" — commercial operation
   * date. For a running project it is achieved; for any other status it is a
   * date SREDA records against the project and may be in the past (a project
   * dated 2023-11-22 is still Under Planning), so it is neither an achieved nor
   * a reliably expected completion and is shown as printed.
   */
  completionDate: string;
  status: string;
}

export interface SredaProjectRegister {
  /** Technology this view was filtered to, e.g. "Solar Park". */
  technology: string;
  sourceUrl: string;
  rows: SredaProjectRow[];
  /** How many pages of the paginated view were read. */
  pagesFetched: number;
  /**
   * The view's own headline: "System: 76, Capacity: 5083.6 MWp".
   *
   * It counts every project at every life stage, so it is the control total for
   * the register — not for installed capacity — and it is what proves the
   * paginated row set was read completely.
   */
  publishedSystemCount: number | null;
  publishedCapacityMwp: number | null;
  publishedCapacity: string | null;
}

/**
 * One published control total and our recomputation of it from the same
 * document's itemised rows — the same P/D discipline used across the grid data.
 */
export interface SredaReconciliation {
  check: string;
  published: number;
  computed: number;
  delta: number;
  /** Half of the last digit SREDA prints, summed over the terms involved. */
  tolerance: number;
  ok: boolean;
  sourceUrl: string;
}

export interface SredaDailyData {
  /** ISO date (YYYY-MM-DD) derived from SREDA Last Update timestamp. */
  date: string;
  /** Raw timestamp from SREDA footer, e.g. 2026-06-29 16:16:30 */
  lastUpdate: string;
  sourceUrl: string;
  /** Total RE installed capacity (MW) from homepage headline. */
  totalRenewableMw: number;
  renewableTech: SredaRenewableTechRow[];
  /** RE share of national installed capacity mix (%). */
  reGridSharePct: number;
  /** Total national installed capacity (MW) from generation mix page. */
  totalInstalledMw: number;
  generationMix: SredaGenerationMixRow[];
  scrapedAt: string;

  // Sections below were added 2026-08-11 and are absent from earlier snapshots,
  // so every consumer must treat them as optional rather than assume them.
  technologyBreakdown?: SredaTechnologyRow[];
  technologyTotals?: {
    quantity: number;
    offGridMwp: number;
    onGridMwp: number;
    totalMwp: number;
  } | null;
  organisationTables?: SredaOrganisationTable[];
  yearWiseTables?: SredaYearTable[];
  projectRegisters?: SredaProjectRegister[];
  carbonEstimates?: SredaCarbonRow[];
  /** Recomputations of SREDA's own totals, including cross-page comparisons. */
  reconciliation?: SredaReconciliation[];
}