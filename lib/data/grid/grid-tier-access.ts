import type { Role } from '@/lib/constants';
import { parseIsoDate } from '@/lib/data/grid/date-utils';
import type { GridPlanId } from '@/lib/membership/grid-plans';

export type GridAccessTier = 'visitor' | 'member' | 'plan_499' | 'plan_999';

export type GridTierLimits = {
  tier: GridAccessTier;
  label: string;
  shortLabel: string;
  description: string;
  /** Inclusive calendar days back from latest (0 = latest only). null = unlimited. */
  daysBack: number | null;
};

export const GRID_TIER_LIMITS: Record<GridAccessTier, GridTierLimits> = {
  visitor: {
    tier: 'visitor',
    label: 'Visitor',
    shortLabel: '7 days',
    description: 'Last 7 days — no account required.',
    daysBack: 6,
  },
  member: {
    tier: 'member',
    label: 'Free member',
    shortLabel: '1 month',
    description: 'Last 30 days of grid data with a free account.',
    daysBack: 29,
  },
  plan_499: {
    tier: 'plan_499',
    label: 'Grid Archive — 5 Years',
    shortLabel: '5 years',
    description: 'Five years of historical grid reports (৳499/month).',
    daysBack: 365 * 5,
  },
  plan_999: {
    tier: 'plan_999',
    label: 'Grid Archive — Full',
    shortLabel: 'Full archive',
    description: 'Complete PGCB grid data backlog (৳999/month).',
    daysBack: null,
  },
};

const TIER_RANK: Record<GridAccessTier, number> = {
  visitor: 0,
  member: 1,
  plan_499: 2,
  plan_999: 3,
};

const MS_PER_DAY = 86_400_000;

export function subtractDaysFromIso(isoDate: string, days: number): string | null {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;
  const [y, m, d] = parsed.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);
  const ny = dt.getUTCFullYear();
  const nm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(dt.getUTCDate()).padStart(2, '0');
  return parseIsoDate(`${ny}-${nm}-${nd}`);
}

export function resolveGridAccessTier(input: {
  isAuthenticated: boolean;
  role: Role | null | undefined;
  gridPlan?: GridPlanId | null;
}): GridAccessTier {
  const role = input.role ?? null;
  const plan = input.gridPlan ?? 'none';

  if (role && role !== 'SUBSCRIBER') return 'plan_999';
  if (plan === 'plan_999') return 'plan_999';
  if (plan === 'plan_499') return 'plan_499';
  if (input.isAuthenticated && role === 'SUBSCRIBER') return 'member';
  return 'visitor';
}

export function getEarliestAllowedDate(tier: GridAccessTier, latestDate: string): string | null {
  const parsed = parseIsoDate(latestDate);
  if (!parsed) return null;

  const limits = GRID_TIER_LIMITS[tier];
  if (limits.daysBack === null) return null;

  return subtractDaysFromIso(parsed, limits.daysBack) ?? parsed;
}

export function isDateAllowedForTier(
  isoDate: string,
  tier: GridAccessTier,
  latestDate: string,
  earliestCatalogDate?: string | null,
): boolean {
  const target = parseIsoDate(isoDate);
  const latest = parseIsoDate(latestDate);
  if (!target || !latest) return false;

  if (target > latest) return false;

  const earliest = getEarliestAllowedDate(tier, latestDate);
  if (!earliest) {
    const floor = earliestCatalogDate ? parseIsoDate(earliestCatalogDate) : null;
    if (floor && target < floor) return false;
    return true;
  }

  return target >= earliest;
}

/** Minimum tier required to view a date relative to latest. */
export function getRequiredTierForDate(
  isoDate: string,
  latestDate: string,
): GridAccessTier {
  const tiers: GridAccessTier[] = ['visitor', 'member', 'plan_499', 'plan_999'];
  for (const tier of tiers) {
    if (isDateAllowedForTier(isoDate, tier, latestDate)) return tier;
  }
  return 'plan_999';
}

export function tierMeetsRequirement(
  currentTier: GridAccessTier,
  requiredTier: GridAccessTier,
): boolean {
  return TIER_RANK[currentTier] >= TIER_RANK[requiredTier];
}

export function filterDatesForTier(
  dates: string[],
  tier: GridAccessTier,
  latestDate: string,
): string[] {
  const earliest = dates[0] ?? null;
  return dates.filter((d) => isDateAllowedForTier(d, tier, latestDate, earliest));
}

export function parseGridPlanId(value: unknown): GridPlanId {
  if (value === 'plan_499' || value === 'plan_999') return value;
  return 'none';
}