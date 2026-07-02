import { isQuarantined } from './constants';
import { loadArchiveDay, loadArchiveIndex } from './loadArchive';
import type {
  PetrobanglaDaily,
  PetrobanglaIndex,
  PetrobanglaIndexDay,
  PetrobanglaLiveWeekBundle,
} from './types';



export const LIVE_WEEK_COUNT = 7;
export const LIVE_WEEK_MAX = 30;
export const LIVE_WEEK_PRESETS = [7, 15, 30] as const;
export type LiveWeekPreset = (typeof LIVE_WEEK_PRESETS)[number];

let liveWeekCache: PetrobanglaLiveWeekBundle | null = null;

export function pickLiveWeekEntries(
  index: PetrobanglaIndex,
  count = LIVE_WEEK_MAX,
): PetrobanglaIndexDay[] {
  const ok = index.days
    .filter((d) => d.parse_status === 'ok' && !isQuarantined(d.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  return ok.slice(-Math.min(count, LIVE_WEEK_MAX));
}

export function sliceLiveWeekBundle(
  bundle: PetrobanglaLiveWeekBundle,
  count: LiveWeekPreset,
): PetrobanglaLiveWeekBundle {
  const days = bundle.days.slice(-count);
  const index_entries = bundle.index_entries.slice(-count);
  const latest = index_entries[index_entries.length - 1];
  return {
    ...bundle,
    live_week_count: count,
    days,
    index_entries,
    latest_date: latest?.date ?? bundle.latest_date,
    latest_label: latest?.date_label ?? bundle.latest_label,
  };
}

function isCompleteLiveDay(day: PetrobanglaDaily | null | undefined): day is PetrobanglaDaily {
  return Boolean(day?.production?.grand_total && day?.report?.report_date_end);
}

/** Index gas-days under every alias the archive uses (grid date ≠ json filename ≠ report end). */
function registerLiveWeekDay(map: Map<string, PetrobanglaDaily>, day: PetrobanglaDaily) {
  const keys = new Set<string>();
  const end = day.report?.report_date_end;
  const start = day.report?.report_date_start;
  if (end) keys.add(end);
  if (start) keys.add(start);
  for (const k of keys) map.set(k, day);
}

function lookupLiveWeekDay(
  map: Map<string, PetrobanglaDaily>,
  entry: PetrobanglaIndexDay,
): PetrobanglaDaily | null {
  const fileDate = entry.json_file?.replace('.json', '') ?? entry.date;
  return map.get(entry.date) ?? map.get(fileDate) ?? null;
}

async function loadLiveWeekDays(
  entries: PetrobanglaIndexDay[],
  existing = new Map<string, PetrobanglaDaily>(),
): Promise<PetrobanglaDaily[]> {
  const loaded = await Promise.all(
    entries.map(async (entry) => {
      const hit = lookupLiveWeekDay(existing, entry);
      if (hit) return hit;
      const fileDate = entry.json_file?.replace('.json', '') ?? entry.date;
      try {
        return await loadArchiveDay(fileDate);
      } catch {
        try {
          return await loadArchiveDay(entry.date);
        } catch {
          return null;
        }
      }
    }),
  );
  return loaded.filter(isCompleteLiveDay);
}

async function fetchStaticLiveWeekBundle(): Promise<PetrobanglaLiveWeekBundle | null> {
  try {
    const res = await fetch('/data/petrobangla/_live_week.json');
    if (!res.ok) return null;
    return (await res.json()) as PetrobanglaLiveWeekBundle;
  } catch {
    return null;
  }
}

export async function loadLiveWeekBundle(
  count: LiveWeekPreset | number = LIVE_WEEK_MAX,
): Promise<PetrobanglaLiveWeekBundle> {
  const want = Math.min(Math.max(1, count), LIVE_WEEK_MAX);
  if (liveWeekCache && liveWeekCache.days.length >= want) return liveWeekCache;

  const staticBundle = await fetchStaticLiveWeekBundle();
  if (
    staticBundle &&
    staticBundle.days.length >= want &&
    staticBundle.index_entries.length >= want &&
    staticBundle.days.every(isCompleteLiveDay)
  ) {
    liveWeekCache = staticBundle;
    return staticBundle;
  }

  const index = await loadArchiveIndex();
  const entries = pickLiveWeekEntries(index, LIVE_WEEK_MAX);

  const existingByDate = new Map<string, PetrobanglaDaily>();
  const staticDays = staticBundle?.days ?? [];
  const staticEntries = staticBundle?.index_entries ?? [];
  staticDays.forEach((day, i) => {
    if (!isCompleteLiveDay(day)) return;
    registerLiveWeekDay(existingByDate, day);
    const entry = staticEntries[i];
    if (entry) {
      existingByDate.set(entry.date, day);
      const fileDate = entry.json_file?.replace('.json', '');
      if (fileDate) existingByDate.set(fileDate, day);
    }
  });

  const days = await loadLiveWeekDays(entries, existingByDate);
  const latest = entries[entries.length - 1];
  const bundle: PetrobanglaLiveWeekBundle = {
    generated_at: staticBundle?.generated_at ?? new Date().toISOString(),
    live_week_count: days.length,
    latest_date: latest?.date ?? null,
    latest_label: latest?.date_label ?? null,
    index_entries: staticBundle?.index_entries?.length === days.length
      ? staticBundle.index_entries
      : entries,
    days,
  };
  liveWeekCache = bundle;
  return bundle;
}

export function isDateInLiveWeek(gridDate: string, bundle: PetrobanglaLiveWeekBundle): boolean {
  return bundle.index_entries.some((e) => e.date === gridDate);
}

export function formatLiveWeekDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function clearLiveWeekCache() {
  liveWeekCache = null;
}