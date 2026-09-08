import {
  DAILY_SNAPSHOT_LABELS,
  POWER_UNIT,
  type DailySnapshotLabel,
  type HomeSnapshotStat,
} from '@/lib/data/grid/home-snapshot-core';

/**
 * The presentation half of the snapshot: what each of the twelve tiles is
 * called, what unit it carries, which icon it wears, and — the part that
 * matters — **who owes the number** when nobody has published it.
 *
 * There are deliberately no values in here. The panel used to hold a parallel
 * array of specimen figures ("Current Demand: 16740") as a layout template, and
 * a tile that the server did not supply fell through to one. Combined with a
 * label the builder never emitted, that printed a fixed 16,740 MW under a LIVE
 * badge, sourced to PGCB, for as long as the NLDC overlay was down. A template
 * that cannot hold a number cannot leak one.
 */
export interface SnapshotSlotSpec {
  label: DailySnapshotLabel;
  unit: string;
  isDecimal?: boolean;
  icon: string;
  /** The upstream that publishes this figure — printed as `awaiting` when absent. */
  source: string;
  /**
   * True for the tiles `liveValueFor` can fill from the NLDC hourly feed alone.
   * Such a tile keeps its slot even when the daily report has nothing for it;
   * every other tile appears only because a source filed it.
   */
  liveBacked?: boolean;
}

export const SNAPSHOT_SLOTS: readonly SnapshotSlotSpec[] = [
  // The panel's twelve, in reading order: what the grid managed yesterday, what
  // is expected of it today, what it is being asked for and delivering now,
  // what is going unmet, and then what the generation is made of.
  //
  // Gas Supply and Production Cost are no longer here. The gas window is filed
  // a day or two behind PGCB, so that tile was a dash most mornings, and the
  // cost is derived over a closed day — neither belongs on a noticeboard. Both
  // are still built, and the Grid Explorer's dated pages still print them.
  { label: 'Yesterday Peak Gen', unit: POWER_UNIT, icon: 'Gauge', source: 'PGCB', liveBacked: true },
  { label: 'Forecast Demand', unit: POWER_UNIT, icon: 'TrendingUp', source: 'PGCB', liveBacked: true },

  { label: 'Current Demand', unit: POWER_UNIT, icon: 'Activity', source: 'NLDC', liveBacked: true },
  { label: 'Current Supply', unit: POWER_UNIT, icon: 'TrendingUp', source: 'NLDC', liveBacked: true },
  { label: 'Load Shedding', unit: POWER_UNIT, icon: 'Activity', source: 'PGCB', liveBacked: true },
  { label: 'Current Generation', unit: POWER_UNIT, icon: 'Zap', source: 'NLDC', liveBacked: true },

  // These six sum to Current Generation above them.
  { label: 'Gas Generation', unit: POWER_UNIT, icon: 'Flame', source: 'PGCB', liveBacked: true },
  { label: 'Coal Generation', unit: POWER_UNIT, icon: 'Flame', source: 'PGCB', liveBacked: true },
  { label: 'Liquid Fuel', unit: POWER_UNIT, icon: 'Flame', source: 'NLDC', liveBacked: true },
  { label: 'Hydro', unit: POWER_UNIT, icon: 'Droplet', source: 'NLDC', liveBacked: true },
  { label: 'Grid Import', unit: POWER_UNIT, icon: 'Cable', source: 'PGCB', liveBacked: true },
  { label: 'Solar + Wind', unit: POWER_UNIT, icon: 'Sun', source: 'PGCB', liveBacked: true },
] as const;

/** The tiles the NLDC hourly overlay can carry on its own. */
export const LIVE_BACKED_LABELS: ReadonlySet<string> = new Set(
  SNAPSHOT_SLOTS.filter((s) => s.liveBacked).map((s) => s.label),
);

/** A tile as the panel renders it: a real figure, or a named gap. Never a specimen. */
export interface SnapshotSlot {
  label: DailySnapshotLabel;
  value: number | null;
  unit: string;
  isDecimal?: boolean;
  icon: string;
  /** Set whenever `value` is null — the source that has not filed yet. */
  awaiting?: string;
}

/**
 * Fold the server's stats onto the twelve declared slots.
 *
 * Three rules, and they are the whole point of the module:
 *  1. A slot's value comes from the server or it is `null`. There is no third
 *     source, and in particular no template to fall back to.
 *  2. A `null` slot always names the source that owes it, so the tile prints
 *     "— awaiting" rather than a bare dash or, worse, a zero.
 *  3. The grid keeps its shape — always twelve slots, always in this order.
 *     The snapshot is a fixed 2x6, so a tile that vanishes reflows the other
 *     eleven and the panel silently changes shape on whichever day a source
 *     ran late. Holding the slot and naming the source it is waiting on tells
 *     the reader more than an absent tile ever did.
 */
export function mergeHomeSnapshot(incoming?: readonly HomeSnapshotStat[] | null): SnapshotSlot[] {
  const byLabel = new Map<string, HomeSnapshotStat>();
  for (const stat of incoming ?? []) {
    if (stat?.label && (DAILY_SNAPSHOT_LABELS as readonly string[]).includes(stat.label)) {
      byLabel.set(stat.label, stat);
    }
  }

  const slots: SnapshotSlot[] = [];
  for (const spec of SNAPSHOT_SLOTS) {
    const matched = byLabel.get(spec.label);
    const value = typeof matched?.value === 'number' ? matched.value : null;
    slots.push({
      label: spec.label,
      value,
      unit: matched?.unit || spec.unit,
      isDecimal: typeof matched?.isDecimal === 'boolean' ? matched.isDecimal : spec.isDecimal,
      icon: spec.icon,
      ...(value === null ? { awaiting: matched?.awaiting || spec.source } : {}),
    });
  }
  return slots;
}
