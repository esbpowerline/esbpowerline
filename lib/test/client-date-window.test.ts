import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  dateRequestable,
  getDateGuardVersion,
  isDateRequestable,
  setDateGuard,
  subscribeDateGuard,
} from '@/lib/data/grid/client-date-window';
import { loadNoSourceDays, resetNoSourceDaysCache } from '@/lib/data/grid/no-source-days.client';
import { isDateAllowedForTier } from '@/lib/data/grid/grid-tier-access';
import { isPublicSampleDate, PUBLIC_SAMPLE_DATES } from '@/lib/data/grid/public-sample-dates';

const LATEST = '2026-11-01';
const DEMO = [...PUBLIC_SAMPLE_DATES][0];

describe('dateRequestable', () => {
  const g = (over: Partial<Parameters<typeof dateRequestable>[1]> = {}) => ({
    loading: false,
    tier: 'visitor' as const,
    bundledLatest: LATEST,
    ...over,
  });

  it('while the session loads, only the visitor window (7 days) is requested', () => {
    expect(dateRequestable('2026-11-01', g({ loading: true, tier: 'member' }))).toBe(true);
    expect(dateRequestable('2026-10-26', g({ loading: true, tier: 'member' }))).toBe(true);
    expect(dateRequestable('2026-10-25', g({ loading: true, tier: 'member' }))).toBe(false);
  });

  it('once resolved, follows the tier window', () => {
    expect(dateRequestable('2026-10-10', g({ tier: 'member' }))).toBe(true);
    expect(dateRequestable('2026-10-03', g({ tier: 'member' }))).toBe(true);
    expect(dateRequestable('2026-10-02', g({ tier: 'member' }))).toBe(false);
    expect(dateRequestable('2026-10-24', g({ tier: 'visitor' }))).toBe(false);
    expect(dateRequestable('2020-01-01', g({ tier: 'plan_999' }))).toBe(true);
  });

  it('agrees with isDateAllowedForTier inside the shipped archive', () => {
    for (const tier of ['visitor', 'member', 'plan_499', 'plan_999'] as const) {
      for (const d of ['2026-11-01', '2026-10-26', '2026-10-25', '2026-10-03', '2026-10-02', '2021-05-05']) {
        if (isPublicSampleDate(d)) continue;
        expect(dateRequestable(d, g({ tier })), `${tier} ${d}`).toBe(isDateAllowedForTier(d, tier, LATEST));
      }
    }
  });

  it('never stricter than the server: a day past the build catalog is asked for', () => {
    // After a runtime publish the page's latest is newer than the build's.
    expect(dateRequestable('2026-11-02', g({ bundledLatest: '2026-10-31' }))).toBe(true);
    // And the window anchors on the build's latest, as middleware does: 10-25
    // is inside [10-25, 10-31] there even though the page's own window is later.
    expect(dateRequestable('2026-10-25', g({ bundledLatest: '2026-10-31' }))).toBe(true);
  });

  it('public sample days are always asked for', () => {
    expect(isPublicSampleDate(DEMO)).toBe(true);
    expect(dateRequestable(DEMO, g())).toBe(true);
  });
});

describe('date guard registry', () => {
  afterEach(() => setDateGuard(null));

  it('allows everything when nothing is registered', () => {
    expect(isDateRequestable('2013-01-01')).toBe(true);
  });

  it('applies the registered guard, bumps the version and notifies', () => {
    const v0 = getDateGuardVersion();
    const cb = vi.fn();
    const off = subscribeDateGuard(cb);
    setDateGuard((iso) => iso >= '2026-10-26');
    expect(isDateRequestable('2026-10-25')).toBe(false);
    expect(isDateRequestable('2026-10-26')).toBe(true);
    expect(getDateGuardVersion()).toBe(v0 + 1);
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    setDateGuard(null);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('loadNoSourceDays', () => {
  afterEach(() => {
    resetNoSourceDaysCache();
    vi.unstubAllGlobals();
  });

  it('requests the file once however many callers ask', async () => {
    const fn = vi.fn(async () => ({ ok: true, json: async () => ({ days: ['2026-01-01'] }) }) as unknown as Response);
    vi.stubGlobal('fetch', fn);
    const [a, b] = await Promise.all([loadNoSourceDays(), loadNoSourceDays()]);
    const c = await loadNoSourceDays();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(a).toEqual(['2026-01-01']);
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('does not remember a failure', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => null } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ days: ['2026-02-02'] }) } as unknown as Response);
    vi.stubGlobal('fetch', fn);
    expect(await loadNoSourceDays()).toBeNull();
    expect(await loadNoSourceDays()).toEqual(['2026-02-02']);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
