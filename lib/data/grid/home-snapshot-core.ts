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

/**
 * The homepage snapshot's twelve tiles, in panel order.
 *
 * Ten of these are quantities NLDC posts every hour, so the panel now moves
 * through the day instead of restating a workbook filed the morning after. The
 * hourly page carries far more than the snapshot used to read from it — gas,
 * liquid fuel, coal, hydro, solar, wind and four interconnectors, alongside
 * demand, supply and load shed — and all of it has been in
 * `GridHourlyObservation` since the NLDC capture was written. Only five tiles
 * were reading it.
 *
 * What left, and why: `RE Installed` and `RE Grid Share` came from SREDA's
 * National Database, which is a standing register of commissioned projects, not
 * a time series — it answers "what is built", never "what is generating now".
 * `Solar + Wind` replaces them with the renewable output NLDC actually reports
 * for the hour. That is a different quantity under a different name, which is
 * the only honest way to make the swap; the register still backs the Grid
 * Explorer, where a capacity figure belongs.
 *
 * The last two are day quantities by nature and stay daily — a day's total
 * generation and a day's unserved energy are not instantaneous readings, and
 * pairing an integral with a spot figure under one label is the L2 mistake in
 * `observation-window.ts`. `Gas Supply` and `Production Cost` are likewise the
 * cadence their publishers file at: Petrobangla's 08:00-08:00 gas window, and
 * BPDB's daily fuel cost.
 *
 * This list is what the BUILDER emits, and it is no longer the same list as the
 * homepage panel's. `SNAPSHOT_SLOTS` is the panel's fixed 2x6 and selects from
 * this one; the extra entries here are archive-grade figures the Grid
 * Explorer's dated pages read directly (`archive-day.server.ts`) and the
 * noticeboard does not carry. A label may appear here and not there; the
 * reverse would be a bug, and the merge test pins that direction.
 */
export const DAILY_SNAPSHOT_LABELS = [
  // The panel's twelve, in the order a reader asks the questions: what the grid
  // managed yesterday, what is expected of it today, what it is being asked for
  // and delivering right now, what is going unmet — and only then what the
  // generation is made of.
  'Yesterday Peak Gen',
  'Forecast Demand',
  'Current Demand',
  'Current Supply',
  'Load Shedding',
  'Current Generation',
  // The mix, which sums to Current Generation above it. Every fuel NLDC prints
  // is here now: liquid is the third largest source on most hours and was not
  // on the panel at all, and hydro completes the set. A reader can add the six
  // tiles below and get the tile above them, which is a property worth having
  // on a page that asks to be trusted with figures.
  'Gas Generation',
  'Coal Generation',
  'Liquid Fuel',
  'Hydro',
  'Grid Import',
  'Solar + Wind',
  // Archive-grade, and NOT on the panel. The Grid Explorer's dated pages read
  // this list directly and print all four under their own names.
  'Daily Generation',
  'Energy Unserved',
  'Gas Supply',
  'Production Cost',
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
  // One line with no stated peak makes the whole sum absent. Adding up the
  // lines that have one would print a smaller figure under the same label —
  // a partial total posing as the national one.
  const peaks = rows.map((row) => row.peakFlow);
  if (peaks.some((p) => p == null)) return awaiting('PGCB');
  return mapFigure(total((peaks as number[]).map(known), 'PGCB'), Math.round);
}

/**
 * Solar and wind as the daily report states them, for when the live feed is down.
 *
 * Summed with `total`, so a report carrying neither fuel row is absent rather
 * than zero — a homepage tile reading "0 MW renewable" is a claim the archive
 * has never made. A report that carries one and not the other sums what it has:
 * that is what the day published.
 */
function renewableDailyAvgMw(data: GridDailyData): Figure {
  const rows = (data.generationData ?? []).filter((g) => g.name === 'Solar' || g.name === 'Wind');
  if (!rows.length) return awaiting('PGCB');
  return mapFigure(total(rows.map((r) => known(r.gen)), 'PGCB'), gwhToAvgMw);
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
  const fuelCost = mapFigure(fromNullable(s.avgProductionCost, 'PGCB'), (v) =>
    parseFloat(v.toFixed(2)),
  );
  const dailyGeneration = mapFigure(fromNullable(s.totalEnergyGen, 'PGCB'), gwhToAvgMw);
  const energyUnserved = mapFigure(fromNullable(s.totalEnergyUnserved, 'PGCB'), gwhToAvgMw);
  const loadShedding = peakLoadShedMw(data);
  const coalGeneration = fuelDailyAvgMw(data, 'Coal');
  const gasGeneration = fuelDailyAvgMw(data, 'Gas');
  const renewableGeneration = renewableDailyAvgMw(data);
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
    // The evening peak is not lost — `Peak Demand` below is the max of the
    // evening and day peaks, and the Grid Explorer prints the evening figure
    // under its own name. Here the honest answer on a day with no live feed is
    // that nobody has published a current demand, which is what `awaiting` says.
    // ── what happened, and what is expected ────────────────────────────
    //
    // Both come off PGCB's forecast board — HTML on a daily cadence — so they
    // are `awaiting('PGCB')` here for the same reason the NLDC tiles are
    // `awaiting('NLDC')`: the daily workbook does not carry them in this shape.
    tile('Yesterday Peak Gen', awaiting('PGCB'), { unit: POWER_UNIT, icon: 'Gauge' }),
    tile('Forecast Demand', awaiting('PGCB'), { unit: POWER_UNIT, icon: 'TrendingUp' }),

    // ── what is happening now ──────────────────────────────────────────
    //
    // All four are `awaiting('NLDC')`: a CURRENT figure exists only on the
    // hourly page. The daily report publishes peaks — a maximum over the day,
    // at an instant PGCB names — and printing one under a tile called "Current
    // Generation" would be the substitution rule 2 forbids: a different
    // quantity under an unchanged label. Load Shedding is the exception, being
    // the one figure here the workbook also states for the day.
    tile('Current Demand', awaiting('NLDC'), { unit: POWER_UNIT, icon: 'Activity' }),
    tile('Current Supply', awaiting('NLDC'), { unit: POWER_UNIT, icon: 'TrendingUp' }),
    tile('Load Shedding', loadShedding, { unit: POWER_UNIT, icon: 'Activity' }),
    tile('Current Generation', awaiting('NLDC'), { unit: POWER_UNIT, icon: 'Zap' }),

    // ── what that generation is made of ────────────────────────────────
    //
    // The six below sum to Current Generation above them, which is the whole
    // reason every fuel NLDC prints is now here: liquid runs third behind coal
    // and gas on most hours and was not on the panel at all, and hydro closes
    // the set. A panel whose parts add up to its own headline is one a reader
    // can check.
    //
    // Gas BURNED FOR POWER, which is not the Gas Supply tile and must never be
    // swapped for it. That substitution is the sharpest incident in the repo:
    // the power sector's slice is about a third of national production, and
    // standing in for it printed a 64% collapse that was only a change of
    // source. Two tiles, two quantities, two names.
    tile('Gas Generation', gasGeneration, { unit: POWER_UNIT, icon: 'Flame' }),
    tile('Coal Generation', coalGeneration, { unit: POWER_UNIT, icon: 'Flame' }),
    tile('Liquid Fuel', awaiting('NLDC'), { unit: POWER_UNIT, icon: 'Flame' }),
    tile('Hydro', awaiting('NLDC'), { unit: POWER_UNIT, icon: 'Droplet' }),
    tile('Grid Import', gridImport, { unit: POWER_UNIT, icon: 'Cable' }),
    // Renewable OUTPUT, not installed capacity. NLDC's solar and wind columns
    // are the youngest on the page — 78.8% and 28.8% of stored hours carry
    // them, because the columns postdate most of the archive. An hour without
    // them is absent, not a night with no sun.
    tile('Solar + Wind', renewableGeneration, { unit: POWER_UNIT, icon: 'Sun' }),

    // ── archive-grade, and NOT on the panel ────────────────────────────
    //
    // Still built and still published; the Grid Explorer's dated pages read
    // this list directly (`archive-day.server.ts`) and print all four under
    // their own names, which is where a reader comparing days wants them.
    //
    // Gas Supply and Production Cost left the noticeboard last: Petrobangla
    // files its 08:00-08:00 window a day or two behind PGCB, so that tile was a
    // dash on most mornings, and the cost is a derived figure (marked D) over a
    // day that has closed. Neither answers "what is happening now".
    //
    // `totalEnergyGen` is explicitly nullable and says why: PGCB leaves the
    // cell empty on some days, and 42 days of early 2018 published a headline
    // "0.0 MKWh" as a result. Zero national generation is a claim no report has
    // ever made, and with `Figure` it is one this function can no longer make
    // by accident.
    tile('Daily Generation', dailyGeneration, { unit: POWER_UNIT, icon: 'TrendingUp' }),
    tile('Energy Unserved', energyUnserved, { unit: POWER_UNIT, icon: 'Gauge' }),
    tile('Gas Supply', gasSupply, { unit: 'MMCFD', icon: 'Flame' }),
    tile('Production Cost', fuelCost, { unit: 'Tk/kWh', isDecimal: true, icon: 'Gauge' }),
  ];

  // SREDA no longer appears in the snapshot. `buildSredaSnapshotStats` is kept
  // and still tested — the register is the right source for installed capacity
  // and the Grid Explorer reads it — but a standing register cannot answer the
  // question this panel asks, which is what the grid is doing today.
  return pgcbStats;
}