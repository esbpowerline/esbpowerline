'use client';

/**
 * Data for the phone Grid Explorer, read through exactly the loaders the
 * desktop explorer uses — the daily report, the energy curve, the plant
 * detail, the Petrobangla day and the PGCB monthly series — so the tier gate,
 * the release-over-static precedence and the request dedupe all apply
 * unchanged. Nothing here derives a figure; screens do, and mark it.
 */

import { useEffect, useMemo, useState } from 'react';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { fetchEnergyCurve } from '@/lib/data/grid/energy-curve.client';
import { fetchPlantDetail } from '@/lib/data/grid/plant-detail.client';
import { loadArchiveDay } from '@/lib/data/petrobangla/loadArchive';
import { fetchDataJson } from '@/lib/data/runtime-data.client';
import type { DailyPlantDetail, EnergyCurve, GridDailyData } from '@/lib/data/grid/types';
import type { PetrobanglaDaily } from '@/lib/data/petrobangla/types';

export type MonthlyRow = {
  date_key: string;
  max_evening_peak_gen: number | null;
  max_evening_peak_demand: number | null;
  total_net_generation: number | null;
  generation_by_fuel?: Record<string, number | null>;
};

type Status = 'idle' | 'loading' | 'ok' | 'locked' | 'missing';
export type Loaded<T> = { status: Status; data: T | null };

const idle = <T,>(): Loaded<T> => ({ status: 'idle', data: null });

function useLoad<T>(key: string | null, load: (key: string) => Promise<Loaded<T>>): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>(idle);
  useEffect(() => {
    if (!key) {
      setState(idle());
      return;
    }
    let live = true;
    setState((s) => ({ status: 'loading', data: s.data }));
    load(key)
      .then((r) => live && setState(r))
      .catch(() => live && setState({ status: 'missing', data: null }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

export function useDay(date: string | null) {
  return useLoad<GridDailyData>(date, async (d) => {
    const r = await fetchDailyReport(d);
    if (r.ok) return { status: 'ok', data: r.data };
    return { status: r.error === 'tier_locked' ? 'locked' : 'missing', data: null };
  });
}

export function useCurve(date: string | null, enabled = true) {
  return useLoad<EnergyCurve>(enabled ? date : null, async (d) => {
    const c = await fetchEnergyCurve(d);
    return c ? { status: 'ok', data: c } : { status: 'missing', data: null };
  });
}

export function usePlants(date: string | null, enabled = true) {
  return useLoad<DailyPlantDetail>(enabled ? date : null, async (d) => {
    const p = await fetchPlantDetail(d);
    return p ? { status: 'ok', data: p } : { status: 'missing', data: null };
  });
}

/** The Petrobangla gas day that opens at 08:00 on energy day D (observation-window.ts, rule L1). */
export function useGasDay(date: string | null, enabled = true) {
  return useLoad<PetrobanglaDaily>(enabled ? date : null, async (d) => {
    const g = await loadArchiveDay(d);
    return g ? { status: 'ok', data: g } : { status: 'missing', data: null };
  });
}

/** Several days at once, for the week strips. Days that fail are null, never dropped. */
export function useDays(dates: string[], enabled = true) {
  const key = enabled && dates.length ? dates.join(',') : null;
  return useLoad<(GridDailyData | null)[]>(key, async (k) => {
    const list = k.split(',');
    const res = await Promise.all(list.map((d) => fetchDailyReport(d).then((r) => (r.ok ? r.data : null)).catch(() => null)));
    return { status: 'ok', data: res };
  });
}

export function useGasDays(dates: string[], enabled = true) {
  const key = enabled && dates.length ? dates.join(',') : null;
  return useLoad<(PetrobanglaDaily | null)[]>(key, async (k) => {
    const res = await Promise.all(k.split(',').map((d) => loadArchiveDay(d).catch(() => null)));
    return { status: 'ok', data: res };
  });
}

export function useMonthly(enabled = true) {
  return useLoad<MonthlyRow[]>(enabled ? 'series' : null, async () => {
    const r = await fetchDataJson<MonthlyRow[]>('pgcb-monthly/_series.json');
    return r.ok ? { status: 'ok', data: r.data } : { status: 'missing', data: null };
  });
}

/** The week ending at `date`, among the dates the reader may open. */
export function useWeekWindow(allowed: string[], date: string | null, n = 7) {
  return useMemo(() => {
    if (!date) return [];
    const i = allowed.indexOf(date);
    if (i < 0) return [date];
    return allowed.slice(Math.max(0, i - n + 1), i + 1);
  }, [allowed, date, n]);
}
