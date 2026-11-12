'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
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

const subscribeNever = () => () => {};

/**
 * @param runtimeLatestDate The newest day the site is actually serving, which
 * the server must supply. `availableDates` is compiled at build time, so a day
 * published from the admin panel is *newer* than the bundled latest — and
 * `isDateAllowedForTier` rejects anything past latest outright. Without this the
 * freshest day reads as locked for every tier, including staff.
 */
export function useGridTierAccess(runtimeLatestDate?: string): GridTierAccessState {
  const { data: session, status } = useSession();
  // The server always renders the session as loading; a browser can already
  // know it at hydration, which made the first client render differ from the
  // server's HTML (React #418 on the access banner). Hold `loading` through
  // hydration so both agree, then let the real status through.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const loading = status === 'loading' || !hydrated;

  const role = session?.user?.role;
  const gridPlan: GridPlanId = session?.user?.gridPlan ?? 'none';
  const signedIn = status === 'authenticated' && !!session?.user;
  const isMember = signedIn && role === 'SUBSCRIBER';
  const isStaff = signedIn && role !== 'SUBSCRIBER';

  const bundledLatest = getLatestAvailableDate() ?? '2026-06-29';
  const latestDate =
    runtimeLatestDate && runtimeLatestDate > bundledLatest ? runtimeLatestDate : bundledLatest;

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