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

/**
 * The report to render on first paint, and the day it is actually for.
 *
 * The two are not always the same day: when nothing is available for the
 * selected date — it is tier-locked, or simply absent — this falls back to the
 * latest report so the page opens with something rather than an empty frame.
 * Callers that pair the payload with anything else keyed by date must use the
 * returned `date`, not the date they asked for. Assuming they matched is what
 * made the unit-cost badge compare one day's rates against another day's BPDB
 * figures and report a disagreement between publishers that did not exist.
 */
export function resolveInitialDailyReportEntry(
  selectedDate: string,
  latestDate: string,
  prefetched?: Record<string, GridDailyData>,
): { date: string; data: GridDailyData } | null {
  const forSelected = prefetched?.[selectedDate] ?? getCachedDailyReport(selectedDate);
  if (forSelected) return { date: selectedDate, data: forSelected };

  const forLatest = prefetched?.[latestDate] ?? getCachedDailyReport(latestDate);
  if (forLatest) return { date: latestDate, data: forLatest };

  return null;
}

export function resolveInitialDailyReport(
  selectedDate: string,
  latestDate: string,
  prefetched?: Record<string, GridDailyData>,
): GridDailyData | null {
  return resolveInitialDailyReportEntry(selectedDate, latestDate, prefetched)?.data ?? null;
}