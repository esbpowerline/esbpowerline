import { cache } from 'react';
import type { GridDailyData } from '@/lib/data/grid/types';
import { getLatestAvailableDate, isDateAvailable } from '@/lib/data/grid/available-dates';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import { parseGridExplorerDate } from '@/lib/grid-explorer-url';

async function loadReportIfAvailable(isoDate: string): Promise<GridDailyData | null> {
  if (!isDateAvailable(isoDate)) return null;
  const result = await loadDailyReportFromDisk(isoDate);
  return result.ok ? result.data : null;
}

/**
 * Server-side prefetch of PGCB daily JSON for Grid Explorer.
 * Always loads the latest catalog date; also loads a deep-linked ?date= when valid.
 */
export const prefetchGridExplorerDailyReports = cache(
  async (urlDate?: string | null): Promise<Record<string, GridDailyData>> => {
    const latestDate = getLatestAvailableDate();
    if (!latestDate) return {};

    const datesToLoad = new Set<string>([latestDate]);
    const parsedUrlDate = parseGridExplorerDate(urlDate ?? null);
    if (parsedUrlDate) {
      datesToLoad.add(parsedUrlDate);
    }

    const entries = await Promise.all(
      [...datesToLoad].map(async (iso) => {
        const data = await loadReportIfAvailable(iso);
        return data ? ([iso, data] as const) : null;
      }),
    );

    return Object.fromEntries(entries.filter((entry): entry is [string, GridDailyData] => entry !== null));
  },
);