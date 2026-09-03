'use client';

import { useEffect, useState } from 'react';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { fetchPlantDetail, plantCapacityTotals } from '@/lib/data/grid/plant-detail.client';
import { subtractDaysFromIso } from '@/lib/data/grid/grid-tier-access';
import type { GridDailyData, GridSystemStats } from '@/lib/data/grid/types';

/** Days of history the Overview compares the selected day against. */
export const TREND_WINDOW_DAYS = 7;
/** Below this many days the mean is too thin to describe as "the last week". */
const MIN_TREND_DAYS = 3;

export interface OverviewBaseline {
  peakDemand: number | null;
  peakSupply: number | null;
  peakDeficit: number | null;
  costPerKwh: number | null;
  /** Mean of P1's printed "Production Cost (Tk.)" total row, in Taka. The
   *  Cost of Power tile headlines that published total, so its trend has to
   *  compare against the same quantity — trending a total against a mean of
   *  per-unit rates would move for reasons the headline never shows. */
  dailyCost: number | null;
  /**
   * The most recent day before this one that Petrobangla did file, with its
   * date. The newest energy day routinely has no gas window — Petrobangla files
   * a day or two behind PGCB — and on that day there is no current figure to
   * trend, because a percentage change needs both sides. The week behind it is
   * still known, so the tile reports the last window on record instead of
   * nothing. Dated, always: an undated gas figure on a tile whose own day has
   * none is exactly the substitution the Gas Supply incident was about.
   */
  lastGas: { date: string; total: number } | null;
  /** How many of the requested days actually answered. */
  days: number;
}

export interface OverviewCapacity {
  installedMw: number;
  stations: number;
  stationsMissingCapacity: number;
}

export interface GridOverviewContext {
  capacity: OverviewCapacity | null;
  baseline: OverviewBaseline | null;
  loading: boolean;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * The two things the Overview strip needs that the day's own report does not
 * carry: what the fleet could have produced, and what the days before it did.
 *
 * Both are fetched after paint and both are allowed to fail. A visitor whose
 * tier stops at seven days gets 403s on the older ones and simply sees a
 * thinner mean; a day with no plant sheet gets no capacity tile. Neither
 * blocks the figures PGCB published for the day itself.
 */
export function useGridOverviewContext(
  isoDate: string,
  systemStats: GridSystemStats | null,
): GridOverviewContext {
  const [capacity, setCapacity] = useState<OverviewCapacity | null>(null);
  const [baseline, setBaseline] = useState<OverviewBaseline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setCapacity(null);
    setBaseline(null);

    const capacityJob = fetchPlantDetail(isoDate).then((detail) => {
      if (live) setCapacity(plantCapacityTotals(detail));
    });

    const days = Array.from({ length: TREND_WINDOW_DAYS }, (_, i) =>
      subtractDaysFromIso(isoDate, i + 1),
    ).filter((d): d is string => d != null);

    const baselineJob = Promise.all(days.map((d) => fetchDailyReport(d))).then((results) => {
      if (!live) return;
      // Paired with their dates and kept in order — `days` runs backwards from
      // the selected day, so the first entry that carries gas is the most
      // recent window on record, which is what `lastGas` reports.
      const dated = results
        .map((r, i) => ({ date: days[i], result: r }))
        .filter((entry) => entry.result.ok)
        .map((entry) => ({
          date: entry.date,
          data: (entry.result as { ok: true; data: GridDailyData }).data,
        }))
        .filter((entry) => Boolean(entry.data));
      const payloads = dated.map((entry) => entry.data);
      const stats = payloads.map((d) => d.systemStats).filter(Boolean);
      if (stats.length < MIN_TREND_DAYS) {
        setBaseline(null);
        return;
      }
      const nums = (pick: (s: GridSystemStats) => number | null | undefined) =>
        stats.map(pick).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));

      // Peak deficit is demand minus what was generated at that same peak — the
      // day's own subtraction, repeated per day so the mean compares like with
      // like rather than averaging two independently-averaged series.
      const deficits = stats
        .map((s) =>
          typeof s.eveningPeakDemand === 'number' && typeof s.eveningPeakGen === 'number'
            ? Math.max(0, s.eveningPeakDemand - s.eveningPeakGen)
            : null,
        )
        .filter((n): n is number => n != null);

      const unitCosts = stats
        .map((s) =>
          typeof s.avgProductionCost === 'number' && s.avgProductionCost > 0
            ? s.avgProductionCost
            : null,
        )
        .filter((n): n is number => n != null);

      // A day whose report carries no production-cost block prints 0 here; that
      // is an omission, not a day the country generated for free, so it is
      // dropped from the mean rather than pulling it down.
      const dailyCosts = stats
        .map((s) => (typeof s.totalDailyCost === 'number' && s.totalDailyCost > 0 ? s.totalDailyCost : null))
        .filter((n): n is number => n != null);

      // The nearest earlier day Petrobangla actually filed. A day without a gas
      // window is written with the six company rows present and zeroed — which
      // is why `hasGasProductionData` tests the sum and not the row count — so
      // a zero total means absent and is skipped rather than reported as a
      // reading of nothing.
      const lastGas =
        dated
          .map((entry) => ({
            date: entry.date,
            total: (entry.data.gasProductionData ?? []).reduce((sum, row) => sum + (row.gas || 0), 0),
          }))
          .find((g) => g.total > 0) ?? null;

      setBaseline({
        peakDemand: mean(nums((s) => s.eveningPeakDemand)),
        peakSupply: mean(nums((s) => s.eveningPeakGen)),
        peakDeficit: mean(deficits),
        costPerKwh: mean(unitCosts),
        dailyCost: mean(dailyCosts),
        lastGas,
        days: stats.length,
      });
    });

    Promise.allSettled([capacityJob, baselineJob]).then(() => {
      if (live) setLoading(false);
    });

    return () => {
      live = false;
    };
  }, [isoDate, systemStats]);

  return { capacity, baseline, loading };
}
