import type { GridDailyData } from '@/lib/data/grid/types';
import type { SredaDailyData } from '@/lib/data/sreda/types';

export const POWER_UNIT = 'MW' as const;

/** Daily energy (GWh) → average power (MW) over 24 hours. */
export function gwhToAvgMw(gwh: number): number {
  return Math.round((gwh * 1000) / 24);
}

export interface HomeSnapshotStat {
  label: string;
  /**
   * `null` when the source has not published the figure — never 0, and never a
   * stand-in from a neighbouring quantity. The tile still renders; it prints a
   * dash and names who owes the number.
   */
  value: number | null;
  unit: string;
  isDecimal?: boolean;
  icon: string;
  /**
   * The upstream this tile is waiting on, set only when `value` is null.
   *
   * Dropping the tile outright was the previous stance, and it was right about
   * the figure and wrong about the grid: the snapshot is a fixed 2x6 and losing
   * a tile reflows the other eleven, so the panel silently changed shape on the
   * newest day — every day, until Petrobangla filed. Naming the gap keeps the
   * layout still and tells the reader why, which "absent" never did.
   */
  awaiting?: string;
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
  const peakDemand = Math.max(s.eveningPeakDemand, s.dayPeakDemand ?? 0);
  const peakGeneration = Math.max(s.eveningPeakGen, s.dayPeakGen);
  // National gas production, and nothing else.
  //
  // This used to fall back to `totalGasSuppliedPower` when Petrobangla had not
  // filed the window yet, which is a different quantity entirely: the power
  // sector's slice, about a third of the national total. The tile read 2,366
  // MMcfd on 26 August and 856 on the 28th — a 64% "collapse" that was only a
  // change of source, under one unchanged label. Absent is absent, the same
  // stance Energy Unserved takes below and the same one the Grid Explorer's
  // own Gas Supply KPI takes when it prints "—".
  const gasSupply = sumGasProductionMmcf(data);

  const pgcbStats: HomeSnapshotStat[] = [
    { label: 'Evening Peak Demand', value: Math.round(s.eveningPeakDemand), unit: POWER_UNIT, icon: 'Activity' },
    { label: 'Peak Generation', value: Math.round(peakGeneration), unit: POWER_UNIT, icon: 'Zap' },
    { label: 'Peak Today', value: Math.round(peakDemand), unit: POWER_UNIT, icon: 'TrendingUp' },
    {
      label: 'Daily Generation',
      value: s.totalEnergyGen == null ? 0 : gwhToAvgMw(s.totalEnergyGen),
      unit: POWER_UNIT,
      icon: 'TrendingUp',
    },
    { label: 'Load Shedding', value: peakLoadShedMw(data), unit: POWER_UNIT, icon: 'Activity' },
    // Never shown as zero on days whose report does not publish unserved
    // energy — a homepage tile reading "0 MW" would assert that no load was
    // shed, which is not what an absent figure means. It now holds its place
    // as a dash instead of vanishing.
    {
      label: 'Energy Unserved',
      value: s.totalEnergyUnserved == null ? null : gwhToAvgMw(s.totalEnergyUnserved),
      unit: POWER_UNIT,
      icon: 'Gauge',
      ...(s.totalEnergyUnserved == null ? { awaiting: 'PGCB' } : {}),
    },
    {
      label: 'Fuel Cost',
      value: parseFloat(s.avgProductionCost.toFixed(2)),
      unit: 'Tk/kWh',
      isDecimal: true,
      icon: 'Gauge',
    },
    // Petrobangla files its 08:00-08:00 window a day or two behind PGCB, so the
    // newest day routinely has grid figures and no gas. That is the ordinary
    // state, not an outage, and `awaiting` is what says so on the tile.
    {
      label: 'Gas Supply',
      value: gasSupply,
      unit: 'MMcfd',
      icon: 'Flame' as const,
      ...(gasSupply == null ? { awaiting: 'Petrobangla' } : {}),
    },
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