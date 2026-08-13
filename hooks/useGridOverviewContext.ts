'use client';

import { useEffect, useState } from 'react';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { fetchPlantDetail, plantCapacityTotals } from '@/lib/data/grid/plant-detail.client';
import { subtractDaysFromIso } from '@/lib/data/grid/grid-tier-access';
import type { GridSystemStats } from '@/lib/data/grid/types';

/** Days of history the Overview compares the selected day against. */
export const TREND_WINDOW_DAYS = 7;
/** Below this many days the mean is too thin to describe as "the last week". */
const MIN_TREND_DAYS = 3;

export interface OverviewBaseline {
  peakDemand: number | null;
  peakSupply: number | null;
  peakDeficit: number | null;
  costPerKwh: number | null;
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
      const stats = results
        .filter((r) => r.ok)
        .map((r) => (r as { ok: true; data: { systemStats: GridSystemStats } }).data.systemStats)
        .filter(Boolean);
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

      setBaseline({
        peakDemand: mean(nums((s) => s.eveningPeakDemand)),
        peakSupply: mean(nums((s) => s.eveningPeakGen)),
        peakDeficit: mean(deficits),
        costPerKwh: mean(unitCosts),
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
