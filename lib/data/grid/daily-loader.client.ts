import type { GridDailyData } from '@/lib/data/grid/types';
import { shouldUseArchiveFallback } from '@/lib/data/grid/daily-access';
import {
  dailyReportPath,
  parseIsoDate,
  type DailyLoadResult,
} from '@/lib/data/grid/daily-loader-core';
import { getCachedDailyReport, setCachedDailyReport } from '@/lib/data/grid/daily-cache';
import { warnIfInvalidDailyReport } from '@/lib/data/grid/validate-daily-report';

export type { DailyLoadResult, DailyLoadSource } from '@/lib/data/grid/daily-loader-core';

async function loadArchiveFallback(isoDate: string): Promise<GridDailyData | null> {
  const { getArchiveFallback } = await import('@/lib/data/grid/archive-fallback');
  return getArchiveFallback(isoDate);
}

/** Client-side fetch of a daily PGCB report JSON. */
export async function fetchDailyReport(
  isoDate: string,
  opts?: { refresh?: boolean },
): Promise<DailyLoadResult> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return { ok: false, error: `Invalid date: ${isoDate}` };
  }

  if (!opts?.refresh) {
    const cached = getCachedDailyReport(parsed);
    if (cached) {
      return { ok: true, data: cached, source: 'network' };
    }
  }

  try {
    const res = await fetch(dailyReportPath(parsed), { cache: 'default' });
    if (!res.ok) {
      if (shouldUseArchiveFallback(res.status)) {
        const fallback = await loadArchiveFallback(parsed);
        if (fallback) {
          setCachedDailyReport(parsed, fallback);
          return { ok: true, data: fallback, source: 'archive' };
        }
        return { ok: false, error: `Daily report not found for ${parsed}`, status: 404 };
      }
      if (res.status === 403) {
        return { ok: false, error: 'tier_locked', status: 403 };
      }
      return { ok: false, error: `HTTP ${res.status}`, status: res.status };
    }
    const data = (await res.json()) as GridDailyData;
    warnIfInvalidDailyReport(data, parsed);
    setCachedDailyReport(parsed, data);
    return { ok: true, data, source: 'network' };
  } catch {
    const fallback = await loadArchiveFallback(parsed);
    if (fallback) {
      setCachedDailyReport(parsed, fallback);
      return { ok: true, data: fallback, source: 'archive' };
    }
    return { ok: false, error: 'Network error while loading daily report' };
  }
}