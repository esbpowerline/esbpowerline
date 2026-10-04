/**
 * Macroeconomic indicators affecting power sector costs.
 *
 * HAND-TYPED AND UNCITED, except the 2026 Diesel and Octane figures, which
 * match EMRD's gazette of 20 Sep 2026 (see `lib/data/tariff/administered-prices.ts`,
 * which is what the commodities strip reads). Kerosene and Petrol columns were
 * removed 2026-09-30: every Kerosene figure equalled that year's Diesel and every
 * Petrol was Octane minus 3–5, the signature of a column filled in rather than
 * read. Rebuild any column here from EMRD/BPC notifications before trusting it.
 */
export const macroEconomicData = [
  { year: '2010', exchangeRate: 69.50, inflation: 8.13, spotLng: 0.0, importCoal: 0.0, retailDiesel: 44.0, retailOctane: 77.0 },
  { year: '2012', exchangeRate: 81.80, inflation: 8.69, spotLng: 0.0, importCoal: 0.0, retailDiesel: 61.0, retailOctane: 94.0 },
  { year: '2014', exchangeRate: 77.60, inflation: 7.35, spotLng: 0.0, importCoal: 0.0, retailDiesel: 68.0, retailOctane: 99.0 },
  { year: '2016', exchangeRate: 78.40, inflation: 5.92, spotLng: 0.0, importCoal: 0.0, retailDiesel: 65.0, retailOctane: 89.0 },
  { year: '2018', exchangeRate: 83.90, inflation: 5.78, spotLng: 8.2, importCoal: 85.0, retailDiesel: 65.0, retailOctane: 89.0 },
  { year: '2020', exchangeRate: 84.90, inflation: 5.65, spotLng: 6.4, importCoal: 70.0, retailDiesel: 65.0, retailOctane: 89.0 },
  { year: '2021', exchangeRate: 84.80, inflation: 5.56, spotLng: 10.2, importCoal: 90.0, retailDiesel: 65.0, retailOctane: 89.0 },
  { year: '2022', exchangeRate: 93.50, inflation: 6.15, spotLng: 35.4, importCoal: 280.0, retailDiesel: 80.0, retailOctane: 130.0 },
  { year: '2023', exchangeRate: 109.20, inflation: 9.02, spotLng: 14.5, importCoal: 140.0, retailDiesel: 109.0, retailOctane: 130.0 },
  { year: '2024', exchangeRate: 117.50, inflation: 9.73, spotLng: 12.5, importCoal: 115.0, retailDiesel: 106.75, retailOctane: 131.0 },
  { year: '2026', exchangeRate: 122.00, inflation: 10.45, spotLng: 11.8, importCoal: 105.0, retailDiesel: 135.00, retailOctane: 165.00 },
] as const;

/**
 * Petrobangla's accounts. Cut back to two years on 2026-10-04.
 *
 * This was twelve rows running FY 10 to FY 26, and all but two of them were
 * filled in rather than read. The tell was in the series itself: FY 16 revenue
 * of 16,400 crore sits beside FY 17 of 4,593, a fourfold step no real accounts
 * produce, and every row before FY 17 carried `lngCost: 0` as a placeholder.
 * FY 24 and FY 26 are years Petrobangla has not published at all — the same
 * defect found in `bpdbAuditedFinancials` the same day, and the reason this
 * one was looked at.
 *
 * FY 17 and FY 18 survive because they are corroborated: they agree to the
 * lakh with the figures the Sector Financials page carried independently,
 * which are now in `lib/data/companies/petrobangla-financials.ts`. That makes
 * them very likely genuine readings of Petrobangla's annual accounts. It does
 * NOT make them sourced — **no source document is recorded for either year**,
 * so doctrine rule 5 is unsatisfied and the explorer labels them unverified.
 *
 * `revenue` here agrees with that module's `revenueCrore`. `lngCost` and
 * `netProfit` have no counterpart there and are kept as they were found:
 * `netProfit` is not `revenue - lngCost`, and is not the operating result the
 * other module carries, so the three are different quantities and must not be
 * reconciled against each other.
 *
 * To restore the long series, get Petrobangla's annual reports and read them.
 * Do not re-add a row without the file name that backs it.
 */
export const petrobanglaAuditedFinancials = [
  { year: 'FY 17', revenue: 4593, lngCost: 6602, netProfit: -1874 },
  { year: 'FY 18', revenue: 4825, lngCost: 6857, netProfit: -1825 },
] as const;

/** What was removed, and why, named rather than left as a shorter chart. */
export const PETROBANGLA_SERIES_COVERAGE_NOTE =
  'Only FY 2016-17 and FY 2017-18 are held. The ten other years this series ' +
  'once showed were hand-typed without a source, two of them for fiscal years ' +
  'Petrobangla has never published, and were removed rather than corrected.';