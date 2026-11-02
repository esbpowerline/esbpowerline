import type { DailyPlantDetail } from '@/lib/data/grid/types';
import { parseIsoDate } from '@/lib/data/grid/date-utils';
import { fetchDataJson } from '@/lib/data/runtime-data.client';
import { staticDataUrl } from '@/lib/data/feed-paths';
import { isDateRequestable } from '@/lib/data/grid/client-date-window';

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
/** Path relative to `public/data` — what the runtime reader keys on. */
export function plantDetailDataPath(isoDate: string): string {
  return `plants/${isoDate}.json`;
}

export function plantDetailPath(isoDate: string): string {
  return staticDataUrl(plantDetailDataPath(isoDate));
}

const cache = new Map<string, DailyPlantDetail | null>();
// One request per day while it is open, so the Overview strip and a tab asking
// for the same station file a moment apart share it (seen twice on production).
const inflight = new Map<string, Promise<DailyPlantDetail | null>>();

export function fetchPlantDetail(isoDate: string): Promise<DailyPlantDetail | null> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return Promise.resolve(null);
  if (cache.has(parsed)) return Promise.resolve(cache.get(parsed) ?? null);
  // Outside the reader's tier window: the server would 403. Not cached.
  if (!isDateRequestable(parsed)) return Promise.resolve(null);
  const held = inflight.get(parsed);
  if (held) return held;
  const job = loadPlantDetail(parsed).finally(() => inflight.delete(parsed));
  inflight.set(parsed, job);
  return job;
}

async function loadPlantDetail(parsed: string): Promise<DailyPlantDetail | null> {
  let detail: DailyPlantDetail | null = null;
  try {
    // Manifest-aware, like every other client reader: this file only ever read
    // `/data`, so a day published after the last deploy opened the Plants tab
    // on an empty table even though the same day's headline figures were there.
    const res = await fetchDataJson<DailyPlantDetail>(plantDetailDataPath(parsed));
    if (res.ok) {
      const { data } = res;
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
/**
 * Installed capacity of the stations this day's sheet lists, for measuring how
 * much of the fleet the evening peak actually used.
 *
 * The same sheet's `eveningPeakMw` sums to PGCB's published evening-peak
 * generation (16,093 MW against a printed 16,092.99 on 2026-08-12), so the two
 * sides of that ratio come off one document and share a basis. A national
 * installed-capacity figure from elsewhere would not: those include captive and
 * off-grid plant this sheet never dispatches, and dividing one by the other
 * would overstate idle capacity by whatever the difference happens to be.
 *
 * `stationsMissingCapacity` is reported rather than hidden — the total is a
 * floor when any station omits its rating, and a ratio built on it reads high.
 */
export function plantCapacityTotals(
  detail: DailyPlantDetail | null,
): { installedMw: number; stations: number; stationsMissingCapacity: number } | null {
  if (!detail?.plants?.length) return null;
  const rated = detail.plants.filter((p) => p.installedMw != null);
  if (!rated.length) return null;
  return {
    installedMw: rated.reduce((sum, p) => sum + (p.installedMw || 0), 0),
    stations: detail.plants.length,
    stationsMissingCapacity: detail.plants.length - rated.length,
  };
}

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
