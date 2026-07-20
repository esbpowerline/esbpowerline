import type { GridDailyData } from '@/lib/data/grid/types';
import type { SredaDailyData } from '@/lib/data/sreda/types';

export const POWER_UNIT = 'MW' as const;

/** Daily energy (GWh) → average power (MW) over 24 hours. */
export function gwhToAvgMw(gwh: number): number {
  return Math.round((gwh * 1000) / 24);
}

export interface HomeSnapshotStat {
  label: string;
  value: number;
  unit: string;
  isDecimal?: boolean;
  icon: string;
}

/** Daily PGCB / Petrobangla / SREDA metrics — homepage snapshot (12 tiles). */
export const DAILY_SNAPSHOT_LABELS = [
  'Current Demand',
  'Peak Generation',
  'Peak Today',
  'Daily Generation',
  'Load Shedding',
  'Energy Unserved',
  'Fuel Cost',
  'Gas Supply',
  'Coal Generation',
  'Grid Import',
  'RE Installed',
  'RE Grid Share',
] as const;

export type DailySnapshotLabel = (typeof DAILY_SNAPSHOT_LABELS)[number];

function sumGasProductionMmcf(data: GridDailyData): number | null {
  const rows = data.gasProductionData;
  if (!rows?.length) return null;
  const total = rows.reduce((sum, row) => sum + (row.gas ?? 0), 0);
  return total > 0 ? Math.round(total) : null;
}

function peakLoadShedMw(data: GridDailyData): number {
  const hourly = data.hourlyLoadData;
  if (hourly?.length) {
    return Math.round(Math.max(0, ...hourly.map((h) => h.loadShed ?? 0)));
  }
  const regional = data.regionalDemandData;
  if (regional?.length) {
    return Math.round(Math.max(0, ...regional.map((r) => r.loadShed ?? 0)));
  }
  return 0;
}

function fuelDailyAvgMw(data: GridDailyData, fuelName: string): number {
  const row = data.generationData?.find((g) => g.name === fuelName);
  return row ? gwhToAvgMw(row.gen) : 0;
}

function sumImportPeakMw(data: GridDailyData): number {
  const rows = data.borderImportsData;
  if (!rows?.length) return 0;
  return Math.round(rows.reduce((sum, row) => sum + (row.peakFlow ?? 0), 0));
}

export function buildSredaSnapshotStats(sreda: SredaDailyData): HomeSnapshotStat[] {
  return [
    {
      label: 'RE Installed',
      value: Math.round(sreda.totalRenewableMw),
      unit: POWER_UNIT,
      icon: 'Sun',
    },
    {
      label: 'RE Grid Share',
      value: parseFloat(sreda.reGridSharePct.toFixed(2)),
      unit: '%',
      isDecimal: true,
      icon: 'Leaf',
    },
  ];
}

export function buildHomeSnapshotFromDaily(
  data: GridDailyData,
  sreda?: SredaDailyData | null,
): HomeSnapshotStat[] {
  const s = data.systemStats;
  const peakDemand = Math.max(s.eveningPeakDemand, s.dayPeakDemand);
  const peakGeneration = Math.max(s.eveningPeakGen, s.dayPeakGen);
  const gasSupply = sumGasProductionMmcf(data) ?? Math.round(s.totalGasSuppliedPower);

  const pgcbStats: HomeSnapshotStat[] = [
    { label: 'Evening Peak Demand', value: Math.round(s.eveningPeakDemand), unit: POWER_UNIT, icon: 'Activity' },
    { label: 'Peak Generation', value: Math.round(peakGeneration), unit: POWER_UNIT, icon: 'Zap' },
    { label: 'Peak Today', value: Math.round(peakDemand), unit: POWER_UNIT, icon: 'TrendingUp' },
    {
      label: 'Daily Generation',
      value: gwhToAvgMw(s.totalEnergyGen),
      unit: POWER_UNIT,
      icon: 'TrendingUp',
    },
    { label: 'Load Shedding', value: peakLoadShedMw(data), unit: POWER_UNIT, icon: 'Activity' },
    {
      label: 'Energy Unserved',
      value: gwhToAvgMw(s.totalEnergyUnserved),
      unit: POWER_UNIT,
      icon: 'Gauge',
    },
    {
      label: 'Fuel Cost',
      value: parseFloat(s.avgProductionCost.toFixed(2)),
      unit: 'Tk/kWh',
      isDecimal: true,
      icon: 'Gauge',
    },
    { label: 'Gas Supply', value: gasSupply, unit: 'MMcfd', icon: 'Flame' },
    {
      label: 'Coal Generation',
      value: fuelDailyAvgMw(data, 'Coal'),
      unit: POWER_UNIT,
      icon: 'Flame',
    },
    { label: 'Grid Import', value: sumImportPeakMw(data), unit: POWER_UNIT, icon: 'Cable' },
  ];

  if (sreda) {
    return [...pgcbStats, ...buildSredaSnapshotStats(sreda)];
  }

  return [
    ...pgcbStats,
    { label: 'RE Installed', value: 0, unit: POWER_UNIT, icon: 'Sun' },
    { label: 'RE Grid Share', value: 0, unit: '%', isDecimal: true, icon: 'Leaf' },
  ];
}