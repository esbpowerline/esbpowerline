import { isQuarantined } from './constants';
import { loadArchiveDay, loadArchiveIndex } from './loadArchive';
import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import type {
  PetrobanglaDaily,
  PetrobanglaIndex,
  PetrobanglaIndexDay,
  PetrobanglaLiveWeekBundle,
} from './types';

export const LIVE_WEEK_COUNT = 7;
/** Matches prebuilt `/data/petrobangla/_live_week.json` — never blast-fetch the full archive on boot. */
export const LIVE_WEEK_BOOTSTRAP = 7;
export const LIVE_WEEK_MAX = 4000;

export type LiveWeekRangeLabel = '1W' | '1M' | '6M' | '1Y' | '3Y' | 'All';

export type LiveWeekRangeOption = {
  days: number;
  label: LiveWeekRangeLabel;
  requiredTier: GridAccessTier;
};

/** Rolling window presets — always show every chip; tier locks longer windows. */
export const LIVE_WEEK_RANGE_OPTIONS: LiveWeekRangeOption[] = [
  { days: 7, label: '1W', requiredTier: 'visitor' },
  // Visitor-accessible by product decision — the middleware opens a matching
  // public window for petrobangla day files (see PETROBANGLA_PUBLIC_DAYS_BACK).
  { days: 30, label: '1M', requiredTier: 'visitor' },
  { days: 180, label: '6M', requiredTier: 'member' },
  { days: 365, label: '1Y', requiredTier: 'plan_499' },
  { days: 1095, label: '3Y', requiredTier: 'plan_499' },
  { days: 4000, label: 'All', requiredTier: 'plan_499' },
];

export const LIVE_WEEK_PRESETS = LIVE_WEEK_RANGE_OPTIONS.map((o) => o.days);
export type LiveWeekPreset = number;

const TIER_RANK: Record<GridAccessTier, number> = {
  visitor: 0,
  member: 1,
  plan_499: 2,
  plan_999: 3,
};

export function getLiveWeekRangeOption(days: number): LiveWeekRangeOption | undefined {
  return LIVE_WEEK_RANGE_OPTIONS.find((o) => o.days === days);
}

export function isLiveWeekRangeLocked(days: number, tier: GridAccessTier): boolean {
  const opt = getLiveWeekRangeOption(days);
  if (!opt) return false;
  return TIER_RANK[tier] < TIER_RANK[opt.requiredTier];
}

export function maxLiveWeekDaysForTier(tier: GridAccessTier): number {
  let max = LIVE_WEEK_RANGE_OPTIONS[0].days;
  for (const opt of LIVE_WEEK_RANGE_OPTIONS) {
    if (TIER_RANK[tier] >= TIER_RANK[opt.requiredTier]) max = opt.days;
  }
  return max;
}

const LIVE_WEEK_FETCH_BATCH = 20;

let liveWeekCache: PetrobanglaLiveWeekBundle | null = null;

export function pickLiveWeekEntries(
  index: PetrobanglaIndex,
  count = LIVE_WEEK_BOOTSTRAP,
): PetrobanglaIndexDay[] {
  const ok = index.days
    .filter((d) => d.parse_status === 'ok' && !isQuarantined(d.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  return ok.slice(-Math.min(count, LIVE_WEEK_MAX));
}

export function sliceLiveWeekBundle(
  bundle: PetrobanglaLiveWeekBundle,
  count: number,
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

async function fetchOneLiveWeekDay(
  entry: PetrobanglaIndexDay,
  existing: Map<string, PetrobanglaDaily>,
): Promise<PetrobanglaDaily | null> {
  const hit = lookupLiveWeekDay(existing, entry);
  if (hit) return hit;
  const fileDate = entry.json_file?.replace('.json', '') ?? entry.date;
  try {
    const day = await loadArchiveDay(fileDate);
    registerLiveWeekDay(existing, day);
    return day;
  } catch {
    try {
      const day = await loadArchiveDay(entry.date);
      registerLiveWeekDay(existing, day);
      return day;
    } catch {
      return null;
    }
  }
}

/** Fetch missing gas-days in small batches — avoids thousands of parallel HTTP requests. */
async function loadLiveWeekDays(
  entries: PetrobanglaIndexDay[],
  existing = new Map<string, PetrobanglaDaily>(),
): Promise<PetrobanglaDaily[]> {
  const ordered: PetrobanglaDaily[] = [];
  for (let i = 0; i < entries.length; i += LIVE_WEEK_FETCH_BATCH) {
    const batch = entries.slice(i, i + LIVE_WEEK_FETCH_BATCH);
    const loaded = await Promise.all(batch.map((entry) => fetchOneLiveWeekDay(entry, existing)));
    for (const day of loaded) {
      if (isCompleteLiveDay(day)) ordered.push(day);
    }
  }
  return ordered;
}

async function fetchStaticLiveWeekBundle(): Promise<PetrobanglaLiveWeekBundle | null> {
  try {
    let res = await fetch('/data/petrobangla/_live_week.json');
    // Rebuilt on every publish, so on a deployed site the current bundle exists
    // only as a DataRelease — the static copy is whatever shipped with the build.
    if (res.status === 404) {
      res = await fetch('/api/data/petrobangla/_live_week.json');
    }
    if (!res.ok) return null;
    return (await res.json()) as PetrobanglaLiveWeekBundle;
  } catch {
    return null;
  }
}

function seedExistingFromStatic(
  staticBundle: PetrobanglaLiveWeekBundle | null,
): Map<string, PetrobanglaDaily> {
  const existingByDate = new Map<string, PetrobanglaDaily>();
  if (!staticBundle) return existingByDate;
  const staticDays = staticBundle.days ?? [];
  const staticEntries = staticBundle.index_entries ?? [];
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
  return existingByDate;
}

function buildLiveWeekBundle(
  entries: PetrobanglaIndexDay[],
  days: PetrobanglaDaily[],
  staticBundle: PetrobanglaLiveWeekBundle | null,
): PetrobanglaLiveWeekBundle {
  const latest = entries[entries.length - 1];
  return {
    generated_at: staticBundle?.generated_at ?? new Date().toISOString(),
    live_week_count: days.length,
    latest_date: latest?.date ?? null,
    latest_label: latest?.date_label ?? null,
    index_entries:
      staticBundle?.index_entries?.length === days.length ? staticBundle.index_entries : entries,
    days,
  };
}

export async function loadLiveWeekBundle(
  count: number = LIVE_WEEK_BOOTSTRAP,
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

  const existingByDate = seedExistingFromStatic(staticBundle);
  const index = await loadArchiveIndex();
  const entries = pickLiveWeekEntries(index, want);
  const days = await loadLiveWeekDays(entries, existingByDate);
  const bundle = buildLiveWeekBundle(entries, days, staticBundle);
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