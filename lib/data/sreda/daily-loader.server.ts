import { cache } from 'react';
import type { SredaDailyData } from '@/lib/data/sreda/types';
import { getLatestSredaDate, sredaAvailableDates } from '@/lib/data/sreda/available-dates';
import { parseIsoDate } from '@/lib/data/grid/date-utils';

export async function loadSredaDailyFromDisk(isoDate: string): Promise<SredaDailyData | null> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;

  // Release first: a re-published snapshot corrects a day whose static file
  // still exists, so a file-first read would keep serving the superseded one.
  // Fails soft — no release, or no database, means the file read below.
  try {
    const { getReleaseOverride } = await import('@/lib/data/releases.server');
    const released = await getReleaseOverride('SREDA_DAILY', parsed);
    if (released) return released as SredaDailyData;
  } catch {
    // Enhancement only; never break the static read.
  }

  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'sreda', 'daily', `${parsed}.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as SredaDailyData;
  } catch {
    return null;
  }
}

export const getLatestSredaDaily = cache(async (): Promise<SredaDailyData | null> => {
  // The bundled catalogue is compiled at build time, so a snapshot refreshed
  // from the admin panel has to be merged in or the homepage's renewables
  // figures would sit on the last shipped day forever. Merge rather than check
  // releases first: publishing a *correction* to an old day must not make that
  // old day the "latest". The per-date loader applies the release precedence.
  let dates = [...sredaAvailableDates];
  try {
    const { getPublishedKeys } = await import('@/lib/data/releases.server');
    const published = await getPublishedKeys('SREDA_DAILY');
    if (published.length > 0) dates = [...new Set([...dates, ...published])].sort();
  } catch {
    // Fall back to the bundled catalogue.
  }

  for (const date of dates.reverse()) {
    const data = await loadSredaDailyFromDisk(date);
    if (data) return data;
  }
  return null;
});