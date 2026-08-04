import type { DailyPlantDetail } from '@/lib/data/grid/types';
import { parseIsoDate } from '@/lib/data/grid/date-utils';

/**
 * Per-station detail for a day, fetched only when the Plants tab is opened.
 *
 * Kept out of the daily payload because it is ~55KB a day against ~15KB for
 * everything else combined, and most visits never open it.
 *
 * A missing file is a normal answer, not an error: only reports carrying the
 * GenLog or Forecast plant sheets have one — 299 days of 4,515 — and days whose
 * figures did not reconcile against P1 are deliberately left without one.
 */
export function plantDetailPath(isoDate: string): string {
  return `/data/daily/${isoDate}-plants.json`;
}

const cache = new Map<string, DailyPlantDetail | null>();

export async function fetchPlantDetail(isoDate: string): Promise<DailyPlantDetail | null> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;
  if (cache.has(parsed)) return cache.get(parsed) ?? null;

  let detail: DailyPlantDetail | null = null;
  try {
    const res = await fetch(plantDetailPath(parsed));
    if (res.ok) {
      const data = (await res.json()) as DailyPlantDetail;
      // Guard against a stale or truncated file rather than rendering junk.
      detail = data && typeof data === 'object' && (data.plants || data.genlog) ? data : null;
    }
  } catch {
    detail = null;
  }
  cache.set(parsed, detail);
  return detail;
}

/** Day-peak and evening-peak totals, for checking against the headline figures. */
export function plantTotals(detail: DailyPlantDetail | null): { day: number; evening: number } | null {
  if (!detail?.plants?.length) return null;
  return detail.plants.reduce(
    (acc, p) => ({ day: acc.day + (p.dayPeakMw || 0), evening: acc.evening + (p.eveningPeakMw || 0) }),
    { day: 0, evening: 0 },
  );
}
