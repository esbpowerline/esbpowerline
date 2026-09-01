import type { GridDailyData } from '@/lib/data/grid/types';
import {
  type Figure,
  type Publisher,
  awaiting,
  fromNullable,
  known,
  mapFigure,
  peak,
  renderFigure,
  total,
} from '@/lib/data/grid/figure';
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

function sumGasProductionMmcf(data: GridDailyData): Figure {
  const rows = data.gasProductionData;
  if (!rows?.length) return awaiting('Petrobangla');
  const sum = rows.reduce((acc, row) => acc + (row.gas ?? 0), 0);
  return sum > 0 ? known(Math.round(sum)) : awaiting('Petrobangla');
}

/**
 * The one place a `Figure` becomes a tile.
 *
 * `HomeSnapshotStat` keeps `value: number | null` because it is serialised
 * across the server/client boundary and read by two components. The point of
 * the Figure type is not to change that wire shape — it is that everything
 * upstream of this function is now unable to produce a zero it was not given,
 * and unable to produce an absence without naming a publisher. The unsafe
 * shape survives only here, in ten lines, under a name that says so.
 */
function tile(
  label: string,
  figure: Figure,
  rest: Omit<HomeSnapshotStat, 'label' | 'value' | 'awaiting'>,
): HomeSnapshotStat {
  return renderFigure<HomeSnapshotStat>(figure, {
    known: (value) => ({ label, value, ...rest }),
    absent: (publisher) => ({ label, value: null, awaiting: publisher, ...rest }),
  });
}

function peakLoadShedMw(data: GridDailyData): Figure {
  const hourly = data.hourlyLoadData;
  if (hourly?.length) {
    // `HourlyLoadItem.loadShed` distinguishes the two cases and this used to
    // flatten them with `?? 0`: zero is a measurement — PGCB prints 0 on an
    // hour it served everything — but null is an hour the layout never
    // published. Pre-P4 days state the evening peak alone and leave the other
    // 23 hours unknown, and folding those to zero let a day nobody reported on
    // read as a day with no load shedding at all.
    const stated = peak(
      hourly.map((h) => fromNullable(h.loadShed, 'PGCB')),
      'PGCB',
    );
    if (stated.known) return mapFigure(stated, Math.round);
  }
  const regional = data.regionalDemandData;
  if (regional?.length) {
    return mapFigure(peak(regional.map((r) => known(r.loadShed)), 'PGCB'), Math.round);
  }
  // Neither sheet published a shedding figure. "0 MW" here would assert that
  // the country shed nothing, which is the one thing an absent figure never says.
  return awaiting('PGCB');
}

function fuelDailyAvgMw(data: GridDailyData, fuelName: string): Figure {
  const row = data.generationData?.find((g) => g.name === fuelName);
  // A row that is present and reads 0 is a published zero — HSD sits at 0 on
  // most days and that is a fact about the day. A row that is absent means the
  // fuel table did not carry that fuel, which is a fact about the report.
  return row ? known(gwhToAvgMw(row.gen)) : awaiting('PGCB');
}

function sumImportPeakMw(data: GridDailyData): Figure {
  const rows = data.borderImportsData;
  // No cross-border table is a report that did not publish one, not a day on
  // which Bheramara, Godda and Tripura all delivered nothing.
  if (!rows?.length) return awaiting('PGCB');
  return mapFigure(total(rows.map((row) => known(row.peakFlow ?? 0)), 'PGCB'), Math.round);
}

export function buildSredaSnapshotStats(sreda: SredaDailyData): HomeSnapshotStat[] {
  return [
    tile('RE Installed', mapFigure(fromNullable(sreda.totalRenewableMw, 'SREDA'), Math.round), {
      unit: POWER_UNIT,
      icon: 'Sun',
    }),
    tile(
      'RE Grid Share',
      mapFigure(fromNullable(sreda.reGridSharePct, 'SREDA'), (v) => parseFloat(v.toFixed(2))),
      { unit: '%', isDecimal: true, icon: 'Leaf' },
    ),
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
  const dailyGeneration = mapFigure(fromNullable(s.totalEnergyGen, 'PGCB'), gwhToAvgMw);
  const energyUnserved = mapFigure(fromNullable(s.totalEnergyUnserved, 'PGCB'), gwhToAvgMw);
  const fuelCost = mapFigure(fromNullable(s.avgProductionCost, 'PGCB'), (v) =>
    parseFloat(v.toFixed(2)),
  );
  const loadShedding = peakLoadShedMw(data);
  const coalGeneration = fuelDailyAvgMw(data, 'Coal');
  const gridImport = sumImportPeakMw(data);

  const pgcbStats: HomeSnapshotStat[] = [
    // Instantaneous demand, and only the NLDC hourly page publishes it.
    //
    // This slot used to be filled with `eveningPeakDemand` under the label
    // "Evening Peak Demand" — a label the snapshot never declared, so the panel
    // discarded the tile at the door and rendered its own specimen figure
    // (16,740 MW) in the slot instead, badged LIVE and sourced to PGCB. Two
    // faults in one line: a quantity that is not current demand, and a name
    // nothing downstream was listening for.
    //
    // The evening peak is not lost — `Peak Today` below is the max of the
    // evening and day peaks, and the Grid Explorer prints the evening figure
    // under its own name. Here the honest answer on a day with no live feed is
    // that nobody has published a current demand, which is what `awaiting` says.
    tile('Current Demand', awaiting('NLDC'), { unit: POWER_UNIT, icon: 'Activity' }),
    tile('Peak Generation', known(Math.round(peakGeneration)), { unit: POWER_UNIT, icon: 'Zap' }),
    tile('Peak Today', known(Math.round(peakDemand)), { unit: POWER_UNIT, icon: 'TrendingUp' }),
    // `GridSystemStats.totalEnergyGen` is explicitly nullable and says why:
    // PGCB leaves the cell empty on some days, and 42 days of early 2018
    // published a headline "0.0 MKWh" as a result. This read `== null ? 0`,
    // reintroducing on the homepage exactly the zero the parser refuses to
    // invent. Zero national generation is a claim no report has ever made —
    // and with `Figure` it is a claim this function can no longer make by
    // accident, because there is no `?? 0` that type-checks.
    tile('Daily Generation', dailyGeneration, { unit: POWER_UNIT, icon: 'TrendingUp' }),
    tile('Load Shedding', loadShedding, { unit: POWER_UNIT, icon: 'Activity' }),
    // Never shown as zero on days whose report does not publish unserved
    // energy — a homepage tile reading "0 MW" would assert that no load was
    // shed, which is not what an absent figure means.
    tile('Energy Unserved', energyUnserved, { unit: POWER_UNIT, icon: 'Gauge' }),
    tile('Fuel Cost', fuelCost, { unit: 'Tk/kWh', isDecimal: true, icon: 'Gauge' }),
    // Petrobangla files its 08:00-08:00 window a day or two behind PGCB, so the
    // newest day routinely has grid figures and no gas. That is the ordinary
    // state, not an outage, and `awaiting` is what says so on the tile.
    tile('Gas Supply', gasSupply, { unit: 'MMcfd', icon: 'Flame' }),
    tile('Coal Generation', coalGeneration, { unit: POWER_UNIT, icon: 'Flame' }),
    tile('Grid Import', gridImport, { unit: POWER_UNIT, icon: 'Cable' }),
  ];

  if (sreda) {
    return [...pgcbStats, ...buildSredaSnapshotStats(sreda)];
  }

  // SREDA's is a standing register, not a daily filing, and it is occasionally
  // unavailable when a day is built. These two tiles used to hardcode 0 for
  // that case, which printed "0 MW installed" and "0% renewable share" over
  // SREDA's name — a claim that the country has no renewable capacity at all,
  // made on the days SREDA simply had not been read.
  return [
    ...pgcbStats,
    tile('RE Installed', awaiting('SREDA'), { unit: POWER_UNIT, icon: 'Sun' }),
    tile('RE Grid Share', awaiting('SREDA'), { unit: '%', isDecimal: true, icon: 'Leaf' }),
  ];
}