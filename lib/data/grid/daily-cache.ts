import type { GridDailyData } from '@/lib/data/grid/types';

const dailyDataCache = new Map<string, GridDailyData>();

export function getCachedDailyReport(isoDate: string): GridDailyData | undefined {
  return dailyDataCache.get(isoDate);
}

export function setCachedDailyReport(isoDate: string, data: GridDailyData): void {
  dailyDataCache.set(isoDate, data);
}

export function peekLatestCachedReport(latestDate: string): GridDailyData | undefined {
  return dailyDataCache.get(latestDate);
}

/** Seed the in-memory cache (e.g. from server-prefetched daily reports). */
export function seedDailyReportCache(reports: Record<string, GridDailyData>): void {
  for (const [isoDate, data] of Object.entries(reports)) {
    dailyDataCache.set(isoDate, data);
  }
}

export function resolveInitialDailyReport(
  selectedDate: string,
  latestDate: string,
  prefetched?: Record<string, GridDailyData>,
): GridDailyData | null {
  return (
    prefetched?.[selectedDate] ??
    getCachedDailyReport(selectedDate) ??
    prefetched?.[latestDate] ??
    getCachedDailyReport(latestDate) ??
    null
  );
}