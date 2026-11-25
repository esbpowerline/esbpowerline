/**
 * The hourly half of "Forecast against Outturn": which forecast column is set
 * against which measured figure.
 *
 * PGCB's 2025+ forecast block prints three columns per hour — Generation,
 * Load-Shed, Demand — and the Generation column does not mean the same thing
 * every season. In a shortage season it is the output PGCB plans to dispatch
 * (15 Jun 2026, 18:00: generation 14,600, shed 1,165, demand 15,820 — gen +
 * shed ≈ demand). In a surplus season it is generation PGCB expects to have
 * AVAILABLE, flat across the day and above the demand it forecasts beside it
 * (23 Nov 2026, 10:00: generation 13,995 against demand 10,940). Nobody
 * dispatches 3,000 MW more than the load, so that column is not a forecast of
 * output at all.
 *
 * The card used to set that column against measured generation and called the
 * difference a miss: on 23 Nov 2026 it reported a mean hourly miss of 1,930 MW,
 * "widest at 10:00 (−3,015 MW)", where PGCB's demand forecast for 10:00 (10,940)
 * was within 39 MW of what the grid carried (10,979). The gap was spare
 * capacity, reported as forecasting error.
 *
 * Demand is the one column that means the same thing in every season, so the
 * curve compares forecast demand with measured demand. Measured demand for an
 * hour is generation + load shed where P4 publishes the shed. Where it does not,
 * it is generation only when PGCB itself states the day had no unserved load —
 * Energy Unserved printed as 0, or Energy Demand equal to Energy Generated —
 * because then every hour's demand was served in full. Otherwise it is null:
 * an hour whose shedding nobody published has no known demand.
 */

import type { GridForecast, GridSystemStats, HourlyLoadItem } from '@/lib/data/grid/types';

type HourlyForecastRow = NonNullable<GridForecast['hourly']>[number];

/** P1's energy block within this tolerance counts as "demand equals generation" (MKWh). */
const ENERGY_EQUAL_TOLERANCE_MKWH = 0.01;

/**
 * PGCB says, on this day's own report, that no load went unserved. Either it
 * printed Energy Unserved as 0, or it printed Energy Demand equal to Energy
 * Generated. A null on both sides is not that statement.
 */
export function dayStatesNoUnservedLoad(
  s: Pick<GridSystemStats, 'totalEnergyUnserved' | 'totalEnergyDemand' | 'totalEnergyGen'> | null | undefined,
): boolean {
  if (!s) return false;
  if (s.totalEnergyUnserved === 0) return true;
  if (s.totalEnergyUnserved != null && s.totalEnergyUnserved > 0) return false;
  return (
    s.totalEnergyDemand != null &&
    s.totalEnergyGen != null &&
    s.totalEnergyGen > 0 &&
    Math.abs(s.totalEnergyDemand - s.totalEnergyGen) <= ENERGY_EQUAL_TOLERANCE_MKWH
  );
}

/** Measured demand for one hour, or null when the source does not let us know it. */
export function measuredHourlyDemand(
  hour: Pick<HourlyLoadItem, 'generation' | 'loadShed'> | undefined,
  noUnservedLoad: boolean,
): number | null {
  if (!hour || hour.generation == null || !Number.isFinite(hour.generation)) return null;
  if (hour.loadShed != null && Number.isFinite(hour.loadShed)) return hour.generation + hour.loadShed;
  return noUnservedLoad ? hour.generation : null;
}

export type ForecastCurvePoint = HourlyForecastRow & {
  /** PGCB's forecast demand for the hour — the forecast side of the comparison. */
  forecastMw: number | null;
  /** Measured demand for the hour (see measuredHourlyDemand). */
  actualMw: number | null;
  /** actual − forecast, signed; null when either side is unknown. */
  gap: number | null;
  /** The hour had already passed when PGCB generated the report. */
  beforeIssue: boolean;
};

export function buildForecastCurve(
  forecastHourly: readonly HourlyForecastRow[] | null | undefined,
  hourlyLoadData: readonly HourlyLoadItem[] | null | undefined,
  systemStats: Parameters<typeof dayStatesNoUnservedLoad>[0],
  issuedHour: number | null,
): ForecastCurvePoint[] {
  const noUnserved = dayStatesNoUnservedLoad(systemStats);
  const actualByHour = new Map((hourlyLoadData ?? []).map((h) => [h.time, h]));
  return (forecastHourly ?? []).map((row) => {
    const forecastMw = row.demandMw ?? null;
    const actualMw = measuredHourlyDemand(actualByHour.get(row.time), noUnserved);
    const hour = Number(row.time.slice(0, 2));
    return {
      ...row,
      forecastMw,
      actualMw,
      gap: forecastMw != null && actualMw != null ? actualMw - forecastMw : null,
      beforeIssue: issuedHour != null && hour < issuedHour,
    };
  });
}

/**
 * True when PGCB's Generation column runs above its own Demand column at the
 * evening peak — the surplus-season reading, where "Probable Maximum
 * Generation" and "Probable Total Energy Generation" state availability rather
 * than expected output, so a shortfall against them is unused capacity.
 */
export function forecastStatesAvailability(
  forecast: Pick<GridForecast, 'maxGenEveningMw' | 'maxDemandEveningMw'> | null | undefined,
): boolean {
  return (
    forecast?.maxGenEveningMw != null &&
    forecast.maxDemandEveningMw != null &&
    forecast.maxGenEveningMw > forecast.maxDemandEveningMw
  );
}
