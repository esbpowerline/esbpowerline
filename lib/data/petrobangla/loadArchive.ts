import { isQuarantined } from './constants';
import type {
  PetrobanglaDaily,
  PetrobanglaIndex,
  PetrobanglaIndexDay,
  PetrobanglaTimelineDay,
  PetrobanglaTimelineSummary,
} from './types';
import { QuarantinedDayError } from './types';

let indexCache: PetrobanglaIndex | null = null;
let indexDayMap: Map<string, PetrobanglaIndexDay> | null = null;
let timelineCache: PetrobanglaTimelineSummary | null = null;
let timelineDayMap: Map<string, PetrobanglaTimelineDay> | null = null;
const dayCache = new Map<string, PetrobanglaDaily>();

function ingestIndex(data: PetrobanglaIndex) {
  indexCache = data;
  indexDayMap = new Map(data.days.map((d) => [d.date, d]));
}

function ingestTimeline(data: PetrobanglaTimelineSummary) {
  timelineCache = data;
  timelineDayMap = new Map(data.days.map((d) => [d.date, d]));
}

export function lookupIndexDay(date: string): PetrobanglaIndexDay | undefined {
  return indexDayMap?.get(date);
}

export function lookupTimelineDay(date: string): PetrobanglaTimelineDay | undefined {
  return timelineDayMap?.get(date);
}

/**
 * Fetch a data file, falling back to its runtime twin.
 *
 * Files under public/data ship with a deploy. Anything published from the admin
 * panel since exists only as a DataRelease, served by /api/data/* — and on
 * serverless the filesystem is read-only, so for those days the static path is
 * all that ever existed. Without this fallback the gas archive, the rolling
 * week and the reserve-depletion timeline would all sit on whatever shipped
 * with the last build, however many days had been published.
 *
 * Locally the publish also writes to disk, which is why this gap is invisible
 * in development and only appears in production.
 */
async function fetchDataFile(relPath: string): Promise<Response> {
  const res = await fetch(`/data/${relPath}`);
  if (res.ok) return res;
  // Only a miss is retried; a 403 is a tier denial and must stand.
  if (res.status !== 404) return res;
  return fetch(`/api/data/${relPath}`);
}

export async function loadArchiveIndex(): Promise<PetrobanglaIndex> {
  if (indexCache) return indexCache;
  const res = await fetchDataFile('petrobangla/_index.json');
  if (!res.ok) throw new Error('Failed to load Petrobangla archive index');
  ingestIndex((await res.json()) as PetrobanglaIndex);
  return indexCache!;
}

export async function loadArchiveTimeline(): Promise<PetrobanglaTimelineSummary> {
  if (timelineCache) return timelineCache;
  const res = await fetchDataFile('petrobangla/timeline-summary.json');
  if (!res.ok) throw new Error('Failed to load Petrobangla timeline summary');
  ingestTimeline((await res.json()) as PetrobanglaTimelineSummary);
  return timelineCache!;
}

export async function loadArchiveDay(
  date: string,
  { allowPartial = false }: { allowPartial?: boolean } = {},
): Promise<PetrobanglaDaily> {
  if (dayCache.has(date)) return dayCache.get(date)!;

  const res = await fetchDataFile(`petrobangla/daily/${date}.json`);
  if (!res.ok) throw new Error(`Archive day not found: ${date}`);
  const data = (await res.json()) as PetrobanglaDaily;

  if (data.meta.parse_status !== 'ok' && !allowPartial) {
    throw new QuarantinedDayError(date);
  }
  if (isQuarantined(date) && !allowPartial) {
    throw new QuarantinedDayError(date);
  }

  dayCache.set(date, data);
  return data;
}

export function clearArchiveDayCache() {
  dayCache.clear();
}

export async function preloadArchiveDays(dates: string[]): Promise<Map<string, PetrobanglaDaily>> {
  const map = new Map<string, PetrobanglaDaily>();
  await Promise.all(
    dates.map(async (d) => {
      try {
        map.set(d, await loadArchiveDay(d, { allowPartial: true }));
      } catch {
        /* skip missing */
      }
    }),
  );
  return map;
}