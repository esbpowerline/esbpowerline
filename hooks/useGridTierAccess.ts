'use client';

import { useCallback, useMemo } from 'react';
import { useSession } from '@/utils/supabase/auth-context';
import { getLatestAvailableDate } from '@/lib/data/grid/available-dates';
import {
  filterDatesForTier,
  getEarliestAllowedDate,
  getRequiredTierForDate,
  GRID_TIER_LIMITS,
  isDateAllowedForTier,
  resolveGridAccessTier,
  type GridAccessTier,
} from '@/lib/data/grid/grid-tier-access';
import type { GridPlanId } from '@/lib/membership/grid-plans';

export type GridTierAccessState = {
  loading: boolean;
  tier: GridAccessTier;
  gridPlan: GridPlanId;
  latestDate: string;
  earliestAllowedDate: string | null;
  limits: (typeof GRID_TIER_LIMITS)[GridAccessTier];
  isDateAllowed: (isoDate: string) => boolean;
  requiredTierForDate: (isoDate: string) => GridAccessTier;
  canAccessDate: (isoDate: string) => boolean;
  filterDates: (dates: string[]) => string[];
  signedIn: boolean;
  isMember: boolean;
  isStaff: boolean;
};

export function useGridTierAccess(): GridTierAccessState {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const role = session?.user?.role;
  const gridPlan: GridPlanId = session?.user?.gridPlan ?? 'none';
  const signedIn = status === 'authenticated' && !!session?.user;
  const isMember = signedIn && role === 'SUBSCRIBER';
  const isStaff = signedIn && role !== 'SUBSCRIBER';

  const latestDate = getLatestAvailableDate() ?? '2026-06-29';

  const tier = useMemo(
    () =>
      resolveGridAccessTier({
        isAuthenticated: signedIn,
        role: role ?? null,
        gridPlan,
      }),
    [signedIn, role, gridPlan],
  );

  const limits = GRID_TIER_LIMITS[tier];
  const earliestAllowedDate = useMemo(
    () => getEarliestAllowedDate(tier, latestDate),
    [tier, latestDate],
  );

  const isDateAllowed = useCallback(
    (isoDate: string) => isDateAllowedForTier(isoDate, tier, latestDate),
    [tier, latestDate],
  );

  const requiredTierForDate = useCallback(
    (isoDate: string) => getRequiredTierForDate(isoDate, latestDate),
    [latestDate],
  );

  const filterDates = useCallback(
    (dates: string[]) => filterDatesForTier(dates, tier, latestDate),
    [tier, latestDate],
  );

  return useMemo(() => ({
    loading,
    tier,
    gridPlan,
    latestDate,
    earliestAllowedDate,
    limits,
    isDateAllowed,
    requiredTierForDate,
    canAccessDate: isDateAllowed,
    filterDates,
    signedIn,
    isMember,
    isStaff,
  }), [
    loading,
    tier,
    gridPlan,
    latestDate,
    earliestAllowedDate,
    limits,
    isDateAllowed,
    requiredTierForDate,
    signedIn,
    isMember,
    isStaff,
  ]);
}