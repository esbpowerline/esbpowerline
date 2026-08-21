import { describe, it, expect } from 'vitest';
import {
  buildCoverage,
  createArchiveIndex,
  formatIso,
  formatMonth,
  priorYearIso,
  shiftIso,
  toRuns,
} from '@/lib/data/grid/archive-coverage';

/**
 * The calendar decides which days an editor may pick from this, so an index
 * that is wrong by one silently hides days the site has, or offers days it does
 * not. Both look like a data problem rather than a picker problem, which is
 * exactly why it is worth pinning here.
 *
 * The real archive is 4,534 days in 63 runs with 81 interior gaps.
 */

const FEB_2014 = [
  // The archive's own gap: 10 and 25 February 2014 are not held.
  ...Array.from({ length: 9 }, (_, i) => `2014-02-0${i + 1}`),
  ...Array.from({ length: 14 }, (_, i) => `2014-02-${String(i + 11).padStart(2, '0')}`),
  '2014-02-26',
  '2014-02-27',
  '2014-02-28',
];

describe('run-length encoding', () => {
  it('collapses consecutive days into one run', () => {
    expect(toRuns(['2026-01-01', '2026-01-02', '2026-01-03'])).toEqual([['2026-01-01', 3]]);
  });

  it('starts a new run at every gap', () => {
    expect(toRuns(['2026-01-01', '2026-01-02', '2026-01-04'])).toEqual([
      ['2026-01-01', 2],
      ['2026-01-04', 1],
    ]);
  });

  it('crosses month and year boundaries without breaking a run', () => {
    expect(toRuns(['2025-12-30', '2025-12-31', '2026-01-01'])).toEqual([['2025-12-30', 3]]);
  });

  it('handles a leap day as an ordinary consecutive day', () => {
    expect(toRuns(['2024-02-28', '2024-02-29', '2024-03-01'])).toEqual([['2024-02-28', 3]]);
    // 2023 is not a leap year, so the 28th and the 1st are consecutive there.
    expect(toRuns(['2023-02-28', '2023-03-01'])).toEqual([['2023-02-28', 2]]);
  });

  it('survives a round trip through the index', () => {
    const days = FEB_2014;
    const idx = createArchiveIndex(buildCoverage(days));
    for (const d of days) expect(idx.has(d), d).toBe(true);
    for (const d of ['2014-02-10', '2014-02-25', '2014-01-31', '2014-03-01']) {
      expect(idx.has(d), d).toBe(false);
    }
  });

  it('reports the bounds and the total, not just the ends of the span', () => {
    const c = buildCoverage(FEB_2014);
    expect(c.first).toBe('2014-02-01');
    expect(c.last).toBe('2014-02-28');
    expect(c.total).toBe(26);
    // 28 calendar days, 26 held: the two gaps are the whole point.
    expect(c.runs.length).toBe(3);
  });

  it('is unbothered by unsorted or duplicated input', () => {
    const c = buildCoverage(['2026-01-03', '2026-01-01', '2026-01-02', '2026-01-02']);
    expect(c.runs).toEqual([['2026-01-01', 3]]);
    expect(c.total).toBe(3);
  });
});

describe('index lookups', () => {
  const idx = createArchiveIndex(buildCoverage(FEB_2014));

  it('counts a month against its real length', () => {
    expect(idx.monthCoverage(2014, 2)).toEqual({ held: 26, days: 28 });
    expect(idx.monthCoverage(2014, 3)).toEqual({ held: 0, days: 31 });
  });

  it('knows February is 29 days in a leap year', () => {
    const leap = createArchiveIndex(buildCoverage(['2024-02-29']));
    expect(leap.monthCoverage(2024, 2)).toEqual({ held: 1, days: 29 });
  });

  it('answers hasMonth without expanding the runs', () => {
    expect(idx.hasMonth(2014, 2)).toBe(true);
    expect(idx.hasMonth(2014, 3)).toBe(false);
  });

  it('finds the nearest held day when a jump lands in a gap', () => {
    // 10 Feb is missing; the 9th and the 11th are both one day away, and the
    // search looks backward first so a "jump to" lands on the earlier one.
    expect(idx.nearest('2014-02-10')).toBe('2014-02-09');
    expect(idx.nearest('2014-02-14')).toBe('2014-02-14');
  });

  it('gives up rather than wandering the whole archive', () => {
    expect(idx.nearest('2020-06-01', 30)).toBeNull();
  });

  it('refuses a malformed date instead of throwing', () => {
    expect(idx.has('not-a-date')).toBe(false);
    expect(idx.has('')).toBe(false);
  });
});

describe('date helpers', () => {
  it('shifts across month and year ends in UTC', () => {
    expect(shiftIso('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftIso('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftIso('2023-02-28', 1)).toBe('2023-03-01');
  });

  it('walks a year back, and drops 29 February to the 28th', () => {
    expect(priorYearIso('2026-08-19')).toBe('2025-08-19');
    // A naive year swap would produce 29 February 2023, which is not a date.
    expect(priorYearIso('2024-02-29')).toBe('2023-02-28');
  });

  it('formats the way the triggers read', () => {
    expect(formatIso('2026-08-19')).toBe('19 Aug 2026');
    expect(formatIso('2026-01-01')).toBe('1 Jan 2026');
    expect(formatMonth('2026-08')).toBe('Aug 2026');
  });

  it('hands back anything it cannot parse untouched', () => {
    expect(formatIso('nonsense')).toBe('nonsense');
    expect(priorYearIso('nonsense')).toBe('nonsense');
  });
});
