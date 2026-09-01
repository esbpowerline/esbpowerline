/**
 * A single real-shaped PGCB day (29 Jun 2026) plus the matching SREDA register,
 * shared by every test that needs a plausible daily report. Extracted from
 * `daily-grid.test.ts` when a second suite needed the same day; keeping one
 * copy means a fixture that drifts from the schema breaks both at once.
 */

export const SAMPLE_GAS_PRODUCTION = [
  { company: 'BGFCL', fields: 5, gas: 476.4, condensate: 358.5, share: 20 },
  { company: 'SGFL', fields: 5, gas: 138.9, condensate: 71.2, share: 5.8 },
  { company: 'BAPEX', fields: 8, gas: 78.3, condensate: 40.1, share: 3.3 },
  { company: 'Chevron', fields: 3, gas: 800.1, condensate: 210.4, share: 33.5 },
  { company: 'Tullow', fields: 1, gas: 41.7, condensate: 8.9, share: 1.7 },
  { company: 'R-LNG', fields: 0, gas: 852.6, condensate: 0, share: 35.7 },
];

export const SAMPLE_BORDER_IMPORTS = [
  { source: 'HVDC Bheramara (India)', energy: 21.74, peakFlow: 902.3, type: 'West' },
  { source: 'Adani Godda (India)', energy: 36.56, peakFlow: 1489.6, type: 'North' },
  { source: 'Tripura Cumilla (India)', energy: 3.84, peakFlow: 177.9, type: 'East' },
];

/** The bare report: no gas window, no border imports — the newest-day shape. */
export const SAMPLE_SYSTEM_ONLY_REPORT = {
  systemStats: {
    date: '29 Jun 2026',
    dayPeakGen: 14308,
    eveningPeakGen: 16180.9,
    dayPeakDemand: 14575.8,
    eveningPeakDemand: 16740.5,
    minGen: 13739.5,
    maxGen: 15788,
    totalEnergyGen: 354.94,
    totalEnergyUnserved: 2.14,
    totalEnergyDemand: 357.08,
    maxTemp: 32.2,
    totalGasSuppliedPower: 894.75,
    avgProductionCost: 6.498,
    totalDailyCost: 2299089200,
  },
  generationData: [
    { name: 'Gas', gen: 126.19, cost: 1, unitCost: 3.45, color: '#0ea5e9' },
    { name: 'Coal', gen: 129.21, cost: 1, unitCost: 6.62, color: '#64748b' },
    { name: 'HFO', gen: 30.41, cost: 1, unitCost: 18.06, color: '#f97316' },
    { name: 'Hydro', gen: 2.21, cost: 1, unitCost: 0.1, color: '#06b6d4' },
    { name: 'Solar', gen: 3.75, cost: 1, unitCost: 15.77, color: '#eab308' },
    { name: 'Imports', gen: 63.06, cost: 1, unitCost: 6.34, color: '#a855f7' },
    { name: 'HSD (Diesel)', gen: 0, cost: 0, unitCost: 0, color: '#ef4444' },
  ],
};

/** A fully filed day: PGCB report, Petrobangla gas window and border imports. */
export const SAMPLE_DAILY_REPORT = {
  ...SAMPLE_SYSTEM_ONLY_REPORT,
  gasProductionData: SAMPLE_GAS_PRODUCTION,
  borderImportsData: SAMPLE_BORDER_IMPORTS,
};

export const SAMPLE_SREDA = {
  date: '2026-06-29',
  lastUpdate: '2026-06-29 16:16:30',
  sourceUrl: 'https://ndre.sreda.gov.bd/',
  totalRenewableMw: 1805.84,
  renewableTech: [],
  reGridSharePct: 5.56,
  totalInstalledMw: 32456,
  generationMix: [],
  scrapedAt: '2026-06-30T00:00:00.000Z',
};
