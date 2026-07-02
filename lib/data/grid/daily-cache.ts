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