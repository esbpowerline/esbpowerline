import 'server-only';

/**
 * The daily summary: one PGCB energy day, as PGCB printed it.
 *
 * Read through the same accessors the site uses — the runtime latest date
 * (never the build-time catalog, which would sit on the last deployed day) and
 * `loadDailyReportFromDisk` (a published release before the static file). So
 * the summary cannot describe a day the site does not show, or show a figure
 * the site does not.
 *
 * Energy day D is filed by PGCB on D+1, so "the latest day" is normally
 * yesterday. A day more than three days old is not summarised: by then it is
 * archive, not news.
 */

import { getRuntimeLatestDate } from '@/lib/data/grid/available-dates.server';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import { dhakaDateKey } from '@/lib/notifications/time';
import type { PayloadFor } from '@/lib/notifications/types';

export const DAILY_SUMMARY_MAX_AGE_DAYS = 3;

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

export async function buildDailySummaryPayload(now: Date): Promise<PayloadFor<'DAILY_GRID_SUMMARY'> | null> {
  const latest = await getRuntimeLatestDate();
  if (!latest) return null;
  if (daysBetween(latest, dhakaDateKey(now)) > DAILY_SUMMARY_MAX_AGE_DAYS) return null;

  const report = await loadDailyReportFromDisk(latest);
  if (!report.ok) return null;
  const data = report.data;
  const s = data.systemStats;

  const payload: PayloadFor<'DAILY_GRID_SUMMARY'> = {
    energyDay: latest,
    eveningPeakDemandMw: num(s.eveningPeakDemand),
    eveningPeakGenMw: num(s.eveningPeakGen),
    eveningPeakTime: s.peakTimes?.eveningPeakGen ?? null,
    dayPeakGenMw: num(s.dayPeakGen),
    maxGenMw: num(s.maxGen),
    energyGenGwh: num(s.totalEnergyGen),
    energyUnservedGwh: num(s.totalEnergyUnserved),
    fuelMix: (data.generationData ?? [])
      .map((g) => ({ name: g.name, gwh: num(g.gen) }))
      .filter((g): g is { name: string; gwh: number } => Boolean(g.name) && g.gwh !== null && g.gwh > 0),
    sourceFile: data.sourceFiles?.pgcb ?? null,
  };

  // A day that printed none of the headline figures has nothing to summarise.
  if (payload.eveningPeakDemandMw === null && payload.eveningPeakGenMw === null && payload.energyGenGwh === null) return null;
  return payload;
}
