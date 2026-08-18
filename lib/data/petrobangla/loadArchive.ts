import { isQuarantined } from './constants';
import type {
  PetrobanglaDaily,
  PetrobanglaIndex,
  PetrobanglaIndexDay,
  PetrobanglaTimelineDay,
  PetrobanglaTimelineSummary,
} from './types';
import { QuarantinedDayError } from './types';
import { fetchDataJson } from '@/lib/data/runtime-data.client';

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
 * Fetch a data file from wherever its current version lives.
 *
 * Files under public/data ship with a deploy. Anything published from the admin
 * panel since exists only as a DataRelease, served by /api/data/* — and on
 * serverless the filesystem is read-only, so for those days the static path is
 * all that ever existed. Without this the gas archive, the rolling week and the
 * reserve-depletion timeline would all sit on whatever shipped with the last
 * build, however many days had been published.
 *
 * This used to be a private static-then-404-retry, which covered a *new* day
 * but not a *corrected* one: the stale static file answers 200, so the retry
 * never fired. `fetchDataJson` consults the publish manifest first and so
 * catches both; a 403 is still a tier denial and still stands, unretried.
 *
 * Locally the publish also writes to disk, which is why this gap is invisible
 * in development and only appears in production.
 */
export async function loadArchiveIndex(): Promise<PetrobanglaIndex> {
  if (indexCache) return indexCache;
  const res = await fetchDataJson<PetrobanglaIndex>('petrobangla/_index.json');
  if (!res.ok) throw new Error('Failed to load Petrobangla archive index');
  ingestIndex(res.data);
  return indexCache!;
}

export async function loadArchiveTimeline(): Promise<PetrobanglaTimelineSummary> {
  if (timelineCache) return timelineCache;
  const res = await fetchDataJson<PetrobanglaTimelineSummary>(
    'petrobangla/timeline-summary.json',
  );
  if (!res.ok) throw new Error('Failed to load Petrobangla timeline summary');
  ingestTimeline(res.data);
  return timelineCache!;
}

export async function loadArchiveDay(
  date: string,
  { allowPartial = false }: { allowPartial?: boolean } = {},
): Promise<PetrobanglaDaily> {
  if (dayCache.has(date)) return dayCache.get(date)!;

  const res = await fetchDataJson<PetrobanglaDaily>(`petrobangla/daily/${date}.json`);
  if (!res.ok) throw new Error(`Archive day not found: ${date}`);
  const data = res.data;

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