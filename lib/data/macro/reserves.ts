/**
 * Petrobangla Hydrocarbon Unit — remaining recoverable gas reserves (Tcf).
 * Historical 2020–2026: audited/official year-end balances (all scenarios identical).
 * 2028+: MPEMR multi-scenario depletion forecasts from 7.63 Tcf baseline (2026).
 * Initial recoverable endowment: 29.74 Tcf (CAGR / Petrobangla annual reserve audits).
 */
export const RESERVES_AUDITED_META = {
  initialRecoverableTcf: 29.74,
  remaining2026Tcf: 7.63,
  cumulativeExtracted2026Tcf: 22.11,
  archiveStartYear: 2020,
  forecastStartYear: 2026,
} as const;

export const RESERVE_SCENARIO_COLORS = {
  audited: '#0ea5e9',
  lowGrowth: '#10b981',
  bau: '#f59e0b',
  highGrowth: '#ef4444',
} as const;

export const RESERVE_SCENARIOS = [
  {
    id: 'lowGrowth' as const,
    label: 'Low demand growth',
    shortLabel: 'Low growth',
    chip: 'Optimistic',
    exhaustionYear: 2037,
    demandGrowth: '2–3% /yr',
    color: RESERVE_SCENARIO_COLORS.lowGrowth,
    description: 'Strong renewables rollout and industrial efficiency extend reserve life by ~2 years.',
    drivers: ['Accelerated solar & grid imports', 'Industrial gas efficiency', 'Slower petrochemical ramp'],
    implication: 'Buys ~2 extra years vs BAU — needs sustained efficiency gains and lower industrial burn.',
  },
  {
    id: 'bau' as const,
    label: 'Business as usual',
    shortLabel: 'BAU',
    chip: 'Baseline',
    exhaustionYear: 2035,
    demandGrowth: '4–5% /yr',
    color: RESERVE_SCENARIO_COLORS.bau,
    description: 'Typical 4–5% demand growth — domestic fields exhausted in ~9 years.',
    drivers: ['Current industrial expansion pace', 'Steady power & fertilizer demand', 'LNG fills shortfall'],
    implication: 'Official planning baseline — own-field gas effectively exhausted by the mid-2030s.',
  },
  {
    id: 'highGrowth' as const,
    label: 'High growth demand',
    shortLabel: 'High growth',
    chip: 'Stress case',
    exhaustionYear: 2033,
    demandGrowth: '7–8% /yr',
    color: RESERVE_SCENARIO_COLORS.highGrowth,
    description: 'Rapid industrial expansion without efficiency — reserves gone in ~7 years.',
    drivers: ['Export-oriented manufacturing surge', 'Delayed efficiency retrofits', 'Minimal renewables offset'],
    implication: 'Loses ~2 years vs BAU — domestic fields dry before major industrial projects mature.',
  },
] as const;

export const RESERVE_FORECAST_MILESTONES = ['2028', '2030', '2032', '2034'] as const;

export type ReserveScenarioId = (typeof RESERVE_SCENARIOS)[number]['id'];

export const reservesDepletionData = [
  { year: '2020', bau: 12.27, lowGrowth: 12.27, highGrowth: 12.27 },
  { year: '2021', bau: 11.52, lowGrowth: 11.52, highGrowth: 11.52 },
  { year: '2022', bau: 10.78, lowGrowth: 10.78, highGrowth: 10.78 },
  { year: '2023', bau: 9.98, lowGrowth: 9.98, highGrowth: 9.98 },
  { year: '2024', bau: 9.18, lowGrowth: 9.18, highGrowth: 9.18 },
  { year: '2025', bau: 8.38, lowGrowth: 8.38, highGrowth: 8.38 },
  { year: '2026', bau: 7.63, lowGrowth: 7.63, highGrowth: 7.63 },
  { year: '2028', bau: 5.63, lowGrowth: 5.83, highGrowth: 5.43 },
  { year: '2030', bau: 3.83, lowGrowth: 4.13, highGrowth: 3.53 },
  { year: '2032', bau: 2.23, lowGrowth: 2.63, highGrowth: 1.83 },
  { year: '2034', bau: 0.83, lowGrowth: 1.33, highGrowth: 0.33 },
  { year: '2036', bau: 0.0, lowGrowth: 0.23, highGrowth: 0.0 },
  { year: '2038', bau: 0.0, lowGrowth: 0.0, highGrowth: 0.0 },
] as const;

export type ReservesDepletionRow = (typeof reservesDepletionData)[number];

/** Split audited history (single line) from post-2026 scenario forks for chart clarity */
export function reservesChartSeries() {
  return reservesDepletionData.map((row) => {
    const y = Number(row.year);
    const isAudited = y < RESERVES_AUDITED_META.forecastStartYear;
    const isFork = y >= RESERVES_AUDITED_META.forecastStartYear;
    return {
      year: row.year,
      audited: isAudited ? row.bau : y === RESERVES_AUDITED_META.forecastStartYear ? row.bau : null,
      lowGrowth: isFork ? row.lowGrowth : null,
      bau: isFork ? row.bau : null,
      highGrowth: isFork ? row.highGrowth : null,
    };
  });
}

/** Y-axis ceiling — snug headroom above peak remaining (12.27 Tcf, 2020) so decline reads clearly */
export function reservesChartYMax() {
  const peakRemaining = Math.max(
    ...reservesDepletionData.map((r) => Math.max(r.bau, r.lowGrowth, r.highGrowth)),
  );
  return Math.ceil(peakRemaining + 1.5);
}

export function reserveDepletionPct(year: string): number {
  const row = reservesDepletionData.find((r) => r.year === year);
  if (!row) return 0;
  const remaining = row.bau;
  const extracted = RESERVES_AUDITED_META.initialRecoverableTcf - remaining;
  return (extracted / RESERVES_AUDITED_META.initialRecoverableTcf) * 100;
}

export function reserveScenarioRunwayYears(scenarioId: ReserveScenarioId): number {
  const scenario = RESERVE_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return 0;
  return scenario.exhaustionYear - RESERVES_AUDITED_META.forecastStartYear;
}

export function reserveScenarioVsBauYears(scenarioId: ReserveScenarioId): number {
  const bau = RESERVE_SCENARIOS.find((s) => s.id === 'bau');
  const scenario = RESERVE_SCENARIOS.find((s) => s.id === scenarioId);
  if (!bau || !scenario) return 0;
  return scenario.exhaustionYear - bau.exhaustionYear;
}

export function reserveScenarioAnnualDrawTcf(scenarioId: ReserveScenarioId): number {
  const runway = reserveScenarioRunwayYears(scenarioId);
  if (runway <= 0) return 0;
  return RESERVES_AUDITED_META.remaining2026Tcf / runway;
}

/** Remaining Tcf at a forecast year for each scenario */
export function reserveScenarioTcfAt(year: string, scenarioId: ReserveScenarioId): number | null {
  const row = reservesDepletionData.find((r) => r.year === year);
  if (!row) return null;
  const y = Number(year);
  if (y < RESERVES_AUDITED_META.forecastStartYear) return row.bau;
  return row[scenarioId];
}