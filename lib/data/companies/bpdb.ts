import { BPDB_ANNUAL_ACCOUNTS } from '@/lib/data/bpdb-annual-accounts';

/**
 * BPDB's revenue, cost and subsidy by year, read out of its annual reports.
 *
 * Rebuilt 2026-10-04 from `BPDB_ANNUAL_ACCOUNTS`. It replaced a hand-typed
 * eleven-row series labelled "(indicative, crore BDT)" that cited nothing and
 * is the same defect `macroTariffData` was rebuilt for on 2026-09-30 --
 * except that this one also carried **FY 24 and FY 26**, and BPDB has
 * published neither. Its FY 2022-23 row read 50,900 / 98,600 / 39,500 where
 * the audited report prints 50,858.25 / 95,386.28 / 39,534.95. Macro Trends
 * truncates to the LAST n rows for an untiered reader, so the two invented
 * years were the two every free visitor saw, under an "Audited Ledger" badge.
 *
 * Three things follow from deriving it instead:
 *
 *  - Coverage is FY 2016-17 to FY 2022-23 and stops there. BPDB lists
 *    FY 2023-24 and FY 2024-25 with no file attached; everything before
 *    FY 2016-17 is a page scan with no text layer. The pre-2016 half of the
 *    old series is gone for that reason, not trimmed for space.
 *  - **FY 2021-22 is absent from BPDB's own set**, so the series has a hole in
 *    it. Do not close it by interpolating the neighbours.
 *  - `cost` is Total Operating Expenses, which is NOT the old "Gen & Purchase
 *    Cost" label: it carries depreciation, personnel, administration, repair
 *    and PGCB wheeling as well. The chart labels were changed with it. Reusing
 *    the old label over this figure is doctrine rule 2 -- a different quantity
 *    under one unchanged label.
 *
 * `subsidy` is null for FY 2016-17, which printed none, and `loss` is null
 * wherever either input is -- a subsidy nobody filed is not a subsidy of zero,
 * and a loss computed without it would be wrong by the whole transfer.
 */
export interface BpdbFinancialYear {
  year: string;
  /** Energy sales as printed. */
  revenue: number | null;
  /** Total Operating Expenses as printed, all twelve heads. */
  cost: number;
  /** Government subsidy as printed; null where the year printed none. */
  subsidy: number | null;
  /**
   * ESB PowerLine's arithmetic: (revenue + subsidy) - cost. Null if either input is.
   *
   * This is the OPERATING balance after the treasury transfer, not BPDB's
   * bottom line -- it carries no interest, no other income and no
   * non-operating items, none of which the Comparative Statement prints. It
   * comes out positive in FY 2018-19, 2019-20 and 2020-21, so nothing reading
   * it may assume a loss: the old hand-typed series showed a deficit in every
   * year and that was an artefact of the invented numbers.
   */
  loss: number | null;
  /** The report this row was read out of. A row cannot ship without one. */
  sourceFile: string;
}

export const bpdbAuditedFinancials: BpdbFinancialYear[] = BPDB_ANNUAL_ACCOUNTS.map((a) => {
  const revenue = a.energySalesCrore ?? null;
  const subsidy = a.subsidyCrore ?? null;
  return {
    year: `FY ${a.fy}`,
    revenue,
    cost: a.totalOperatingExpensesCrore,
    subsidy,
    loss:
      revenue == null || subsidy == null
        ? null
        : Number((revenue + subsidy - a.totalOperatingExpensesCrore).toFixed(2)),
    sourceFile: a.source.file,
  };
});

/** What BPDB has not filed, named rather than left as a silent gap in the chart. */
export const BPDB_FINANCIALS_COVERAGE_NOTE =
  'BPDB published no annual report with a text layer before FY 2016-17, has not ' +
  'filed FY 2021-22, and lists FY 2023-24 and FY 2024-25 with no file attached. ' +
  'Those years are blank here rather than estimated.';

/** Homepage snapshot defaults derived from latest PGCB daily report. */
export const bpdbSnapshotDefaults = {
  generationCapacityMw: '28420',
  snapshotDate: '2026-06-29',
} as const;