/**
 * Petrobangla's FY 2016-17 and FY 2017-18 statements, as they reached this repo.
 *
 * Lifted out of `app/(public)/annual-reports/financials/FinancialsClient.tsx`
 * on 2026-10-04, where every figure was an inline literal in a React component
 * and nothing anywhere named the document they came from.
 *
 * ── Read this before quoting anything below ───────────────────────────────
 *
 * UNVERIFIED. These figures are almost certainly real readings from
 * Petrobangla's audited annual accounts -- the revenue entries agree to the
 * lakh with the FY 17 and FY 18 rows of `petrobanglaAuditedFinancials` in
 * `lib/data/macro/economics.ts`, which were typed in separately -- but **no
 * source document is recorded for them**, so doctrine rule 5 is not satisfied
 * and they cannot be treated like the BPDB accounts beside them. The page
 * says so in its own banner rather than letting the word "Audited" carry a
 * claim this module cannot support.
 *
 * Closing this means getting Petrobangla's annual report for those two years,
 * reading the figures off it, and recording the file name and statement here
 * the way `BPDB_ANNUAL_ACCOUNTS` does. Until that happens, do not add years,
 * do not extend the series, and do not derive a trend from two points.
 *
 * `lib/data/macro/economics.ts`'s `petrobanglaAuditedFinancials` carries the
 * same defect in a worse form: it runs FY 10 to FY 26, and its FY 16 revenue
 * of 16,400 crore sits beside an FY 17 of 4,593 -- a discontinuity of a kind
 * no real accounts produce, so most of that series is filled in rather than
 * read. It still feeds Macro Trends and the grid export. Not fixed here.
 *
 * ── Units ─────────────────────────────────────────────────────────────────
 *
 * Crore BDT throughout, matching `BPDB_ANNUAL_ACCOUNTS`. The page this feeds
 * renders in Billions, so it divides by 100 at the edge through `croreToBillion`.
 * Getting that factor wrong is the same hundred-fold error the BPDB extractor
 * header warns about, so the conversion lives in one named function rather
 * than being written out at each call site.
 */

export interface PetrobanglaFyStatement {
  /** The fiscal year as Petrobangla labels it. */
  fy: string;
  /** Short form for a chart axis. */
  shortLabel: string;
  revenueCrore: number;
  costOfSalesCrore: number;
  /** As filed: negative is a loss. */
  operatingResultCrore: number;
  /** Gas Development and Energy Security fund receipts. */
  gdesFundCrore: number;
}

export interface PetrobanglaBalanceSheetRow {
  label: string;
  /** Keyed by the same `shortLabel` the statements carry. */
  byYear: Record<string, number>;
  /** Lower is better for this line (payables, deficits), so colour follows it. */
  lowerIsBetter?: boolean;
}

export const PETROBANGLA_STATEMENTS: PetrobanglaFyStatement[] = [
  {
    fy: 'FY 2016-17',
    shortLabel: '2017',
    revenueCrore: 4593,
    costOfSalesCrore: 6595,
    operatingResultCrore: -2009,
    gdesFundCrore: 5026,
  },
  {
    fy: 'FY 2017-18',
    shortLabel: '2018',
    revenueCrore: 4825,
    costOfSalesCrore: 6907,
    operatingResultCrore: -2031,
    gdesFundCrore: 11778,
  },
];

export const PETROBANGLA_BALANCE_SHEET: PetrobanglaBalanceSheetRow[] = [
  { label: 'Total Assets', byYear: { '2017': 16516, '2018': 23857 } },
  { label: 'Total Equity & Liabilities', byYear: { '2017': 16516, '2018': 23857 } },
  { label: 'Accounts Payable', byYear: { '2017': 7733, '2018': 4693 }, lowerIsBetter: true },
  { label: 'Un-appropriated Deficit', byYear: { '2017': -8442, '2018': -10715 }, lowerIsBetter: true },
];

export const PETROBANGLA_FINANCIALS_PROVENANCE =
  'Petrobangla figures on this page are held without a source document. They ' +
  'match a second hand-typed series in the repo but neither records which ' +
  'annual report they were read from, so they are shown as unverified and ' +
  'should not be quoted until the report is attached.';

/** The one place the Crore→Billion factor is written down. 1 Billion BDT = 100 Crore. */
export function croreToBillion(crore: number): number {
  return Number((crore / 100).toFixed(2));
}

/** Petrobangla's two years are a pair, not a trend; this is the later one. */
export const PETROBANGLA_LATEST = PETROBANGLA_STATEMENTS[PETROBANGLA_STATEMENTS.length - 1];
export const PETROBANGLA_PRIOR = PETROBANGLA_STATEMENTS[PETROBANGLA_STATEMENTS.length - 2];
