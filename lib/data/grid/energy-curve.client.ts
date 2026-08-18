import type { EnergyCurve } from '@/lib/data/grid/types';
import { parseIsoDate } from '@/lib/data/grid/date-utils';
import { fetchDataJson } from '@/lib/data/runtime-data.client';
import { staticDataUrl } from '@/lib/data/feed-paths';

/**
 * The day's half-hourly generation-by-fuel curve, fetched when the chart is on
 * screen rather than shipped with the daily payload.
 *
 * ~5.7KB a day against ~15KB for the rest of the day combined, over 1,611 days.
 * Inline that was 28MB on the daily archive, and because the server loader
 * builds its path at runtime Next traces the whole directory into every
 * function that imports it — including the member export, which asks for it
 * deliberately. Same reasoning, and same resting place, as the station detail.
 *
 * A missing file is a normal answer, not an error: PGCB began publishing the
 * En-Curve sheet partway through 2018, and days whose stack does not reconcile
 * against the load curve are deliberately left without one.
 */
/** Path relative to `public/data` — what the runtime reader keys on. */
export function energyCurveDataPath(isoDate: string): string {
  return `curves/${isoDate}.json`;
}

export function energyCurvePath(isoDate: string): string {
  return staticDataUrl(energyCurveDataPath(isoDate));
}

const cache = new Map<string, EnergyCurve | null>();

export async function fetchEnergyCurve(isoDate: string): Promise<EnergyCurve | null> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;
  if (cache.has(parsed)) return cache.get(parsed) ?? null;

  let curve: EnergyCurve | null = null;
  try {
    // Read through the manifest rather than straight off `/data`: this file had
    // no runtime path at all, so a day published after the last deploy rendered
    // its headline numbers from the runtime daily payload and then charted
    // nothing — the curve 404'd and was cached as "no curve for that day".
    const res = await fetchDataJson<EnergyCurve & { date?: string }>(
      energyCurveDataPath(parsed),
    );
    if (res.ok) {
      const { data } = res;
      // Guard against a truncated file rather than charting junk: `mw` is
      // positional against `fuels`, so a short row would re-label every series
      // after the gap.
      const wellFormed =
        Array.isArray(data?.fuels) &&
        data.fuels.length > 0 &&
        Array.isArray(data?.rows) &&
        data.rows.length > 0 &&
        data.rows.every((r) => Array.isArray(r?.mw) && r.mw.length === data.fuels.length);
      curve = wellFormed ? { fuels: data.fuels, rows: data.rows } : null;
    }
  } catch {
    curve = null;
  }
  cache.set(parsed, curve);
  return curve;
}
