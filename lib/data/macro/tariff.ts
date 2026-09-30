import { BPDB_ANNUAL_ACCOUNTS } from '@/lib/data/bpdb-annual-accounts';
import { BULK_RATES } from '@/lib/data/tariff/berc-electricity-2026';

/**
 * BPDB's cost of supply per unit against its average bulk tariff (Tk/kWh), one
 * row per fiscal year, as BPDB printed them in its own annual reports.
 *
 * Until 2026-09-30 this was a hand-typed series, Mar 2010 → Jun 2026, citing
 * nothing — and it disagreed with the audits: its Jan 2023 point read cost
 * 11.33 / tariff 6.70 where BPDB's FY 2022-23 report prints 11.52 and 5.94, and
 * its last point was BERC's one-day 3 June 2026 average (8.39), superseded on
 * 4 June by per-utility, per-voltage rates. It now reads the dual-engine-
 * verified accounts in `bpdb-annual-accounts.ts`, so it covers FY 2016-17 to
 * FY 2022-23 only — the years BPDB has published with a text layer.
 *
 * `cost` is BPDB's printed bulk supply cost per unit (generation plus power
 * purchased, per unit sold in bulk). `tariff` is BPDB's printed average bulk
 * tariff, which it states for FY 2022-23 only; every other year is null, never
 * a figure derived from sales over units — that division gives 6.02 for
 * FY 2022-23 against BPDB's own 5.94.
 */
export const macroTariffData = BPDB_ANNUAL_ACCOUNTS.map((y) => ({
  year: `FY ${y.fy}`,
  cost: y.published.bulkSupplyCostPerUnit?.value ?? null,
  tariff: y.published.bulkTariffPerUnit?.value ?? null,
}));

const latest = BPDB_ANNUAL_ACCOUNTS[BPDB_ANNUAL_ACCOUNTS.length - 1];

/** The latest year BPDB has published, with the figures the Macro cards quote. */
export const LATEST_BPDB_AUDIT = {
  fy: latest.fy,
  cost: latest.published.bulkSupplyCostPerUnit?.value ?? null,
  tariff: latest.published.bulkTariffPerUnit?.value ?? null,
  subsidyCrore: latest.subsidyCrore ?? null,
  source: latest.source.file,
} as const;

/**
 * BERC's bulk rates since 4 June 2026, lowest to highest, to the digits the
 * order prints (Reconsideration Order 2026/01, Appendix-ka). A range, because
 * the order fixes bulk per distributor and voltage — there is no national figure.
 */
const bulkSorted = [...BULK_RATES].sort((a, b) => a.value - b.value);
export const BERC_BULK_RANGE = `${bulkSorted[0].value.toFixed(bulkSorted[0].decimals)}–${bulkSorted[bulkSorted.length - 1].value.toFixed(bulkSorted[bulkSorted.length - 1].decimals)}`;
