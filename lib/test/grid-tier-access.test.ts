import { describe, it, expect } from 'vitest';
import {
  filterDatesForTier,
  getEarliestAllowedDate,
  getRequiredTierForDate,
  isDateAllowedForTier,
  resolveGridAccessTier,
  subtractDaysFromIso,
} from '@/lib/data/grid/grid-tier-access';

const LATEST = '2026-06-29';

describe('grid-tier-access', () => {
  it('resolves visitor tier for anonymous users', () => {
    expect(
      resolveGridAccessTier({ isAuthenticated: false, role: null }),
    ).toBe('visitor');
  });

  it('resolves member tier for subscribers without paid plan', () => {
    expect(
      resolveGridAccessTier({ isAuthenticated: true, role: 'SUBSCRIBER', gridPlan: 'none' }),
    ).toBe('member');
  });

  it('resolves plan tiers from active grid plan', () => {
    expect(
      resolveGridAccessTier({ isAuthenticated: true, role: 'SUBSCRIBER', gridPlan: 'plan_499' }),
    ).toBe('plan_499');
    expect(
      resolveGridAccessTier({ isAuthenticated: true, role: 'SUBSCRIBER', gridPlan: 'plan_999' }),
    ).toBe('plan_999');
  });

  it('grants staff full archive access', () => {
    expect(
      resolveGridAccessTier({ isAuthenticated: true, role: 'EDITOR', gridPlan: 'none' }),
    ).toBe('plan_999');
  });

  it('allows visitors the last 7 days inclusive', () => {
    expect(isDateAllowedForTier(LATEST, 'visitor', LATEST)).toBe(true);
    expect(isDateAllowedForTier('2026-06-23', 'visitor', LATEST)).toBe(true); // 6 days back = earliest
    expect(isDateAllowedForTier('2026-06-22', 'visitor', LATEST)).toBe(false);
  });

  it('allows members 30 days inclusive', () => {
    const earliest = getEarliestAllowedDate('member', LATEST);
    expect(earliest).toBe(subtractDaysFromIso(LATEST, 29));
    expect(isDateAllowedForTier(earliest!, 'member', LATEST)).toBe(true);
    expect(isDateAllowedForTier('2026-05-30', 'member', LATEST)).toBe(false); // 30 days back = outside
  });

  it('maps dates to required upgrade tier', () => {
    expect(getRequiredTierForDate(LATEST, LATEST)).toBe('visitor');
    expect(getRequiredTierForDate('2026-06-20', LATEST)).toBe('member');
    expect(getRequiredTierForDate('2024-01-01', LATEST)).toBe('plan_499');
    expect(getRequiredTierForDate('2014-01-01', LATEST)).toBe('plan_999');
  });

  it('filters date lists for tier windows', () => {
    const dates = ['2026-06-27', '2026-06-28', '2026-06-29'];
    expect(filterDatesForTier(dates, 'visitor', LATEST)).toEqual(dates); // all within 7-day window
    expect(filterDatesForTier(dates, 'member', LATEST)).toEqual(dates);
  });
});