import type { GridDailyData } from '@/lib/data/grid/types';
import { parseIsoDate, dailyReportPath } from '@/lib/data/grid/date-utils';

export type DailyLoadSource = 'network' | 'archive' | 'disk';

export type DailyLoadResult =
  | { ok: true; data: GridDailyData; source: DailyLoadSource }
  | { ok: false; error: string; status?: number };

export { dailyReportPath, parseIsoDate };
