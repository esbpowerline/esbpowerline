import { cache } from 'react';
import type { SredaDailyData } from '@/lib/data/sreda/types';
import { getLatestSredaDate, sredaAvailableDates } from '@/lib/data/sreda/available-dates';
import { parseIsoDate } from '@/lib/data/grid/date-utils';

export async function loadSredaDailyFromDisk(isoDate: string): Promise<SredaDailyData | null> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;

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
  const dates = [...sredaAvailableDates].reverse();
  for (const date of dates) {
    const data = await loadSredaDailyFromDisk(date);
    if (data) return data;
  }
  return null;
});