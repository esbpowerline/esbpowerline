import { cache } from 'react';
import { getRuntimeLatestDate } from '@/lib/data/grid/available-dates.server';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import { getLatestSredaDaily } from '@/lib/data/sreda/daily-loader.server';
import { buildHomeSnapshotFromDaily, type HomeSnapshotStat } from '@/lib/data/grid/home-snapshot-core';

export type { HomeSnapshotStat, DailySnapshotLabel } from '@/lib/data/grid/home-snapshot-core';
export {
  DAILY_SNAPSHOT_LABELS,
  buildHomeSnapshotFromDaily,
  POWER_UNIT,
  gwhToAvgMw,
} from '@/lib/data/grid/home-snapshot-core';

export const getLatestHomeSnapshot = cache(async (): Promise<{
  date: string;
  stats: HomeSnapshotStat[];
} | null> => {
  // Must be the runtime catalog, not the bundled one: `availableDates` is
  // compiled at build time, so a day published from the admin panel would never
  // reach the homepage and its KPIs would sit on the last shipped day forever.
  const isoDate = await getRuntimeLatestDate();
  if (!isoDate) return null;

  const [result, sreda] = await Promise.all([
    loadDailyReportFromDisk(isoDate),
    getLatestSredaDaily(),
  ]);
  if (!result.ok) return null;

  return {
    date: isoDate,
    stats: buildHomeSnapshotFromDaily(result.data, sreda),
  };
});