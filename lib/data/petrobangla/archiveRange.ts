import { ARCHIVE_START_DATE } from './constants';
import { decimateTimelineDays, filterTimelineDays } from './compute';
import type { PetrobanglaTimelineDay } from './types';
import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';

export type ArchiveRangePreset = '1W' | '1M' | '6M' | '1Y' | '3Y' | 'ALL';

export const ARCHIVE_RANGE_PRESETS: ArchiveRangePreset[] = ['1W', '1M', '6M', '1Y', '3Y', 'ALL'];

export function resolveArchiveRangeStart(preset: ArchiveRangePreset, endDate: string): string {
  if (preset === 'ALL') return ARCHIVE_START_DATE;
  const [y, m, d] = endDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (preset === '1W') {
    date.setDate(date.getDate() - 7);
  } else if (preset === '1M') {
    date.setMonth(date.getMonth() - 1);
  } else if (preset === '6M') {
    date.setMonth(date.getMonth() - 6);
  } else if (preset === '1Y') {
    date.setFullYear(date.getFullYear() - 1);
  } else if (preset === '3Y') {
    date.setFullYear(date.getFullYear() - 3);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function filterTimelineByPreset(
  days: PetrobanglaTimelineDay[],
  preset: ArchiveRangePreset,
  endDate: string,
  { decimate = true, maxPoints = 420 }: { decimate?: boolean; maxPoints?: number } = {},
): PetrobanglaTimelineDay[] {
  const start = resolveArchiveRangeStart(preset, endDate);
  const filtered = filterTimelineDays(days, start, endDate);
  return decimate ? decimateTimelineDays(filtered, maxPoints) : filtered;
}

export function getRequiredTierForArchivePreset(p: ArchiveRangePreset): GridAccessTier {
  if (p === '1W') return 'visitor';
  if (p === '1M') return 'visitor';
  if (p === '6M') return 'member';
  return 'plan_499';
}

export function isArchivePresetLockedForTier(p: ArchiveRangePreset, tier: GridAccessTier): boolean {
  // A dev affordance for previewing locked presets locally. It only unlocks the
  // UI chrome — the data itself stays gated server-side by middleware — but it
  // has no place in production, where it let anyone reveal (and then 403 against)
  // every paid preset. Compiled out of the production bundle entirely.
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    const hasBypass =
      window.location.search.includes('bypass_gate=true') ||
      localStorage.getItem('bypass_grid_gate') === 'true';
    if (hasBypass) return false;
  }
  const req = getRequiredTierForArchivePreset(p);
  if (req === 'visitor') return false;
  if (req === 'member') return tier === 'visitor';
  return tier === 'visitor' || tier === 'member';
}

export function archivePresetGateLabel(p: ArchiveRangePreset): string {
  if (p === '1M') return '1-month timeline';
  if (p === '6M') return '6-month timeline';
  if (p === '1Y') return '1-year timeline';
  if (p === '3Y') return '3-year timeline';
  return 'complete archive timeline';
}