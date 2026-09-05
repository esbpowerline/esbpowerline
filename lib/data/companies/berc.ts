/**
 * BERC bulk wholesale tariff history (Tk/kWh) — paired with BPDB production cost
 * in macro charts.
 *
 * HAND-TYPED, UNCITED, AND STRUCTURALLY WRONG AT THE TOP. Flagged 2026-09-05 for
 * replacement by the versioned tariff engine; not corrected here, because the
 * honest correction is not a different number.
 *
 * `Jun 2026: 8.39` is the national weighted-average bulk tariff BERC announced on
 * 3 June 2026. On 4 June, Reconsideration Order 2026/01 restored the residential
 * lifeline and first-step rates and cut the bulk rates to cover the distributors'
 * shortfall, so 8.39 never governed a full billing month. Its replacement is not a
 * scalar: Appendix-ka sets bulk per utility and per voltage level, from 7.1530
 * (BREB PBSs at 33 kV) to 10.0950 (DPDC/DESCO at 33 kV).
 *
 * `Feb 2024: 7.04` also wants checking — the June 2026 order states the prior bulk
 * tariff as 7.00, four paisa away, and no document here says which is which.
 *
 * Evidence held: evidence/tariff/manifest.json.
 */
export const bercBulkTariffHistory = [
  { year: 'Mar 2010', tariff: 2.37 },
  { year: 'Feb 2011', tariff: 2.61 },
  { year: 'Dec 2011', tariff: 2.89 },
  { year: 'Feb 2012', tariff: 3.36 },
  { year: 'Sep 2012', tariff: 4.02 },
  { year: 'Sep 2015', tariff: 4.90 },
  { year: 'Mar 2020', tariff: 5.17 },
  { year: 'Dec 2022', tariff: 6.20 },
  { year: 'Jan 2023', tariff: 6.70 },
  { year: 'Feb 2024', tariff: 7.04 },
  { year: 'Jun 2026', tariff: 8.39 },
] as const;