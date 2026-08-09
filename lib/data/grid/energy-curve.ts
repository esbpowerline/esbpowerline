import type { EnergyCurve } from '@/lib/data/grid/types';

/**
 * The En-Curve sheet's 15 columns folded into the eight fuels the rest of the
 * Grid Explorer already names.
 *
 * The sheet splits public from private plant and names each import separately.
 * Charted as one band per column that is unreadable — eight is the ceiling for
 * categorical hues before they stop being distinguishable — and it would also
 * put a second, conflicting set of fuel colours on a page that already has one.
 * Folding to the eight established categories means "sky is gas" holds
 * everywhere on the page, and the split is kept for the tooltip instead of
 * being thrown away.
 *
 * Which columns a day has depends on when it was published: PGCB has renamed
 * and re-split this sheet three times since 2018. The parser maps every layout
 * onto one set of names, and groups with nothing in them are dropped at build
 * time, so a 2019 day shows the six series it actually has rather than eight
 * with two blank.
 *
 * "Shortage" is not generation; it is the same measure as the load-shed panel
 * and is deliberately not part of the stack.
 */
export const ENERGY_CURVE_GROUPS: { name: string; color: string; columns: string[] }[] = [
  { name: 'Coal', color: '#64748b', columns: ['Coal'] },
  { name: 'Gas', color: '#0ea5e9', columns: ['Gas-Public', 'Gas-Pvt'] },
  { name: 'HFO', color: '#f97316', columns: ['HFO-Public', 'HFO-Pvt'] },
  // The 2018-2021 sheets report one oil column instead of splitting HFO from
  // HSD, so those days carry this group and neither of the two below. It takes
  // the same orange because it is the same thing on the chart — oil-fired
  // plant — and the two can never appear together: which one a day has is
  // decided by its layout, so nine groups defined here is still at most eight
  // bands drawn.
  { name: 'Oil (HFO+HSD)', color: '#f97316', columns: ['Oil-Public', 'Oil-Pvt'] },
  { name: 'Imports', color: '#a855f7', columns: ['HVDC', 'Nepal', 'Tripura', 'Adani'] },
  { name: 'Wind', color: '#22c55e', columns: ['Wind'] },
  { name: 'HSD', color: '#ef4444', columns: ['HSD-Public', 'HSD-Pvt'] },
  { name: 'Hydro', color: '#06b6d4', columns: ['Hydro'] },
  { name: 'Solar', color: '#eab308', columns: ['Solar'] },
];

/** The column the chart never stacks — shedding, not generation. */
export const ENERGY_CURVE_SHORTAGE = 'Shortage';

export interface EnergyCurvePoint {
  time: string;
  total: number;
  /** One key per entry in ENERGY_CURVE_GROUPS. */
  [fuel: string]: number | string;
}

export interface EnergyCurveSeries {
  points: EnergyCurvePoint[];
  /** Groups that carry output on at least one half hour, in stack order. */
  active: typeof ENERGY_CURVE_GROUPS;
  /** The underlying column split, for the tooltip: group name -> [label, mw][]. */
  breakdown: Map<string, { time: string; parts: { label: string; mw: number }[] }[]>;
}

/**
 * Reshape a day's curve for charting.
 *
 * A group whose columns are all absent or zero across the whole day is dropped
 * rather than drawn as a zero-height band, so the legend lists what actually
 * ran. Null means the sheet has no such column; it contributes nothing and is
 * not treated as a measured zero.
 */
export function buildEnergyCurveSeries(curve: EnergyCurve | undefined): EnergyCurveSeries | null {
  if (!curve?.rows?.length || !curve.fuels?.length) return null;

  const indexOf = new Map(curve.fuels.map((f, i) => [f, i]));
  const points: EnergyCurvePoint[] = [];
  const nonZero = new Set<string>();
  const breakdown = new Map<string, { time: string; parts: { label: string; mw: number }[] }[]>();

  for (const row of curve.rows) {
    const point: EnergyCurvePoint = { time: row.time, total: 0 };
    for (const group of ENERGY_CURVE_GROUPS) {
      let sum = 0;
      const parts: { label: string; mw: number }[] = [];
      for (const column of group.columns) {
        const i = indexOf.get(column);
        const v = i == null ? null : row.mw[i];
        if (v == null) continue;
        sum += v;
        if (v > 0) parts.push({ label: column, mw: v });
      }
      point[group.name] = Math.round(sum * 100) / 100;
      point.total += sum;
      if (sum > 0) nonZero.add(group.name);
      if (!breakdown.has(group.name)) breakdown.set(group.name, []);
      breakdown.get(group.name)!.push({ time: row.time, parts });
    }
    point.total = Math.round(point.total * 100) / 100;
    points.push(point);
  }

  const active = ENERGY_CURVE_GROUPS.filter((g) => nonZero.has(g.name));
  if (!active.length) return null;
  return { points, active, breakdown };
}

/** Shedding as the En-Curve sheet states it, at half-hour resolution. */
export function energyCurveShortage(curve: EnergyCurve | undefined): { time: string; mw: number }[] {
  if (!curve?.rows?.length) return [];
  const i = curve.fuels.indexOf(ENERGY_CURVE_SHORTAGE);
  if (i < 0) return [];
  return curve.rows
    .map((r) => ({ time: r.time, mw: r.mw[i] ?? 0 }))
    .filter((r) => r.mw != null);
}
