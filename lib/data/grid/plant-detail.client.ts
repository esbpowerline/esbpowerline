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
/**
 * Deliberately NOT under `public/data/daily`. Next traces that directory into
 * every function that transitively imports the server-side daily loader —
 * `admin/media` alone bundles 4,814 files from it — so 17MB of station detail
 * added there pushed that function to 256MB against a 250MB Vercel limit and
 * the deploy failed. These files are only ever fetched over HTTP by the
 * browser, so they belong outside anything the tracer follows.
 */
export function plantDetailPath(isoDate: string): string {
  return `/data/plants/${isoDate}.json`;
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

/**
 * Station totals, for checking against the headline figures.
 *
 * `day` is null when the day's source is the P2 sheet, which publishes the
 * evening peak alone — summing its nulls to 0 would print a day peak of zero
 * beneath stations that plainly generated.
 */
export function plantTotals(
  detail: DailyPlantDetail | null,
): { day: number | null; evening: number; energyKwh: number | null } | null {
  if (!detail?.plants?.length) return null;
  const hasDayPeak = detail.plants.some((p) => p.dayPeakMw != null);
  const hasEnergy = detail.plants.some((p) => p.energyKwh != null);
  return detail.plants.reduce(
    (acc, p) => ({
      day: acc.day == null ? null : acc.day + (p.dayPeakMw || 0),
      evening: acc.evening + (p.eveningPeakMw || 0),
      energyKwh: acc.energyKwh == null ? null : acc.energyKwh + (p.energyKwh || 0),
    }),
    { day: hasDayPeak ? 0 : null, evening: 0, energyKwh: hasEnergy ? 0 : null },
  );
}
