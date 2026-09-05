import { describe, expect, it } from 'vitest';
import {
  aggregate,
  fillMissing,
  isBreak,
  sumReported,
  type HourRow,
} from '@/lib/data/grid/history-aggregate';

/**
 * Golden tests for historical aggregation.
 *
 * The fixtures are not invented. Each mirrors a shape the archive actually
 * contains, measured 2026-09-05 across 103,340 observations:
 *
 *   6 components   21,897 rows   2015-2017   no solar/wind/adani/nepal columns
 *   7 components   51,675 rows   2017-2023   solar appears
 *   8 components   11,323 rows   2023-2024   wind appears
 *   9 components    1,985 rows   2024        adani appears
 *  10 components   16,451 rows   2024-2026   nepal appears
 *
 * plus the two source defects that would corrupt an aggregate if admitted, and
 * the peak stamps that would bias one if averaged.
 */

const G = (
  at: string,
  values: Record<string, number | null>,
  kind: HourRow['kind'] = 'REGULAR',
  excluded: HourRow['excluded'] = null,
): HourRow => ({ observedAt: new Date(at), kind, excluded, values });

/** A whole day of flat regular hours, so a mean has an obvious right answer. */
const flatDay = (date: string, mw: number, hours = 24): HourRow[] =>
  Array.from({ length: hours }, (_, h) =>
    G(`${date}T${String(h).padStart(2, '0')}:00:00Z`, { totalMw: mw }),
  );

const opts = (over: Partial<Parameters<typeof aggregate>[1]> = {}) => ({
  resolution: 'day' as const,
  metric: 'totalMw',
  aggregation: 'mean' as const,
  ...over,
});

describe('schema eras — a column absent from the era is never a zero', () => {
  const ERAS: Array<{ name: string; row: HourRow; expectFrom: number; expectAbsent: string[] }> = [
    {
      name: '6 components (2015-2017)',
      row: G('2015-06-01T10:00:00Z', {
        gasMw: 4826, liquidMw: 1327, coalMw: 158, hydroMw: 46,
        solarMw: null, windMw: null, bheramaraMw: 466, tripuraMw: 0,
        adaniMw: null, nepalMw: null,
      }),
      expectFrom: 6,
      expectAbsent: ['solarMw', 'windMw', 'adaniMw', 'nepalMw'],
    },
    {
      name: '7 components (2018-2023, solar reported)',
      row: G('2018-06-01T10:00:00Z', {
        gasMw: 5173, liquidMw: 2105, coalMw: 346, hydroMw: 113,
        solarMw: 1.4, windMw: null, bheramaraMw: 475, tripuraMw: 120,
        adaniMw: null, nepalMw: null,
      }),
      expectFrom: 7,
      expectAbsent: ['windMw', 'adaniMw', 'nepalMw'],
    },
    {
      name: '8 components (2023-2024, wind reported)',
      row: G('2023-08-01T13:30:00Z', {
        gasMw: 6051, liquidMw: 4287, coalMw: 2654, hydroMw: 102,
        solarMw: 0, windMw: 6, bheramaraMw: 906, tripuraMw: 158,
        adaniMw: null, nepalMw: null,
      }),
      expectFrom: 8,
      expectAbsent: ['adaniMw', 'nepalMw'],
    },
    {
      name: '9 components (2024, adani reported)',
      row: G('2024-11-01T10:00:00Z', {
        gasMw: 5000, liquidMw: 1000, coalMw: 3000, hydroMw: 100,
        solarMw: 200, windMw: 5, bheramaraMw: 900, tripuraMw: 150,
        adaniMw: 1400, nepalMw: null,
      }),
      expectFrom: 9,
      expectAbsent: ['nepalMw'],
    },
    {
      name: '10 components (2025-2026, nepal reported)',
      row: G('2026-09-01T10:00:00Z', {
        gasMw: 4977, liquidMw: 1619, coalMw: 4255, hydroMw: 222,
        solarMw: 553, windMw: 2, bheramaraMw: 896, tripuraMw: 146,
        adaniMw: 1194, nepalMw: 0,
      }),
      expectFrom: 10,
      expectAbsent: [],
    },
  ];

  const COMPONENTS = [
    'gasMw', 'liquidMw', 'coalMw', 'hydroMw', 'solarMw', 'windMw',
    'bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw',
  ];

  for (const era of ERAS) {
    it(era.name, () => {
      const s = sumReported(era.row.values, COMPONENTS);
      expect(s.from).toHaveLength(era.expectFrom);
      expect([...s.absent].sort()).toEqual([...era.expectAbsent].sort());
      expect(s.complete).toBe(era.expectAbsent.length === 0);
      // The sum counts only what was reported — an absent column adds nothing
      // and, crucially, does not drag the total down as a zero would.
      const manual = s.from.reduce((a, c) => a + (era.row.values[c] as number), 0);
      expect(s.value).toBeCloseTo(manual, 6);
    });
  }

  it('names the components rather than inventing a completeness ratio', () => {
    const s = sumReported(ERAS[0].row.values, COMPONENTS);
    // A column the source never published is not a missing member of a known
    // total. There is deliberately no `outOf` and no percentage here.
    expect(s).not.toHaveProperty('outOf');
    expect(s.absent).toContain('adaniMw');
    expect(s.from).toContain('tripuraMw'); // printed 0 — a measurement, and counted
  });

  it('returns null, not 0, when no component was reported', () => {
    const s = sumReported({ gasMw: null, coalMw: null }, ['gasMw', 'coalMw']);
    expect(s.value).toBeNull();
    expect(s.from).toEqual([]);
  });
});

describe('peak stamps are not extra hours', () => {
  it('excludes peak observations from a mean', () => {
    const rows = [
      ...flatDay('2026-06-01', 10_000),
      G('2026-06-01T19:00:00Z', { totalMw: 16_000 }, 'EVENING_PEAK'),
      G('2026-06-01T13:00:00Z', { totalMw: 15_000 }, 'DAY_PEAK'),
    ];
    const [day] = aggregate(rows, opts());
    // 24 regular hours at 10,000. Admitting the two peaks would give 10,192.
    expect(day.value).toBe(10_000);
    expect(day.coverage.observed).toBe(24);
  });

  it('admits peak observations to a maximum, because that is what they record', () => {
    const rows = [
      ...flatDay('2026-06-01', 10_000),
      G('2026-06-01T19:00:00Z', { totalMw: 16_000 }, 'EVENING_PEAK'),
    ];
    const [day] = aggregate(rows, opts({ aggregation: 'max' }));
    expect(day.value).toBe(16_000);
  });

  it('does not classify by minute offset', () => {
    // A :30 row with no remark is REGULAR and must count; a :00 row marked as a
    // peak must not. In the archive 3,899 rows are the former and 6,535 the
    // latter, so getting this backwards misreads about a tenth of the series.
    const rows = [
      G('2026-06-01T10:30:00Z', { totalMw: 12_000 }, 'REGULAR'),
      G('2026-06-01T11:00:00Z', { totalMw: 18_000 }, 'DAY_PEAK'),
    ];
    const [day] = aggregate(rows, opts({ coverageFloor: 0 }));
    expect(day.value).toBe(12_000);
    expect(day.coverage.observed).toBe(1);
  });
});

describe('source defects are excluded and counted, never altered', () => {
  it('keeps the 2023-01-15 typo out of the monthly mean', () => {
    // Published as 64526500 MW against components summing to 6,464. Admitted,
    // it moves January 2023 from ~8,900 to 91,349.
    const rows = [
      ...flatDay('2023-01-14', 6_500),
      ...flatDay('2023-01-16', 6_500),
      G('2023-01-15T05:00:00Z', { totalMw: 64_526_500 }, 'REGULAR', 'TOTAL_DISAGREES_WITH_COMPONENTS'),
    ];
    const [month] = aggregate(rows, opts({ resolution: 'month', coverageFloor: 0 }));
    expect(month.value).toBe(6_500);
    expect(month.excluded).toEqual({ TOTAL_DISAGREES_WITH_COMPONENTS: 1 });
  });

  it('keeps a 2015 all-zero breakdown out, and says which reason', () => {
    const rows = [
      ...flatDay('2015-04-18', 5_000),
      G('2015-04-17T12:30:00Z', { totalMw: 5_862 }, 'REGULAR', 'BREAKDOWN_ALL_ZERO'),
    ];
    const points = aggregate(rows, opts({ coverageFloor: 0 }));
    const apr17 = points.find((p) => p.t === '2015-04-17')!;
    expect(apr17.excluded).toEqual({ BREAKDOWN_ALL_ZERO: 1 });
    expect(apr17.value).toBeNull();
  });

  it('reports the reason rather than a bare flag', () => {
    const rows = [G('2020-01-01T00:00:00Z', { totalMw: 907 }, 'REGULAR', 'TOTAL_DISAGREES_WITH_COMPONENTS')];
    const [day] = aggregate(rows, opts({ coverageFloor: 0 }));
    // The count alone would not say WHICH side of the row is untrustworthy.
    expect(Object.keys(day.excluded ?? {})).toEqual(['TOTAL_DISAGREES_WITH_COMPONENTS']);
  });
});

describe('gaps are never interpolated', () => {
  it('breaks the series across the 517-hour 2017 outage', () => {
    const rows = [...flatDay('2017-01-17', 6_000), ...flatDay('2017-02-09', 6_200)];
    const dense = fillMissing(
      aggregate(rows, opts()),
      new Date('2017-01-17T00:00:00Z'),
      new Date('2017-02-09T00:00:00Z'),
      'day',
    );
    const gap = dense.filter((p) => p.t > '2017-01-17' && p.t < '2017-02-09');
    expect(gap.length).toBeGreaterThan(20);
    // Every day of the outage is MISSING — no carry-forward, no straight line.
    expect(gap.every((p) => p.value === null && p.state === 'MISSING')).toBe(true);
    expect(gap.every(isBreak)).toBe(true);
    // And the days either side survive untouched.
    expect(dense.find((p) => p.t === '2017-01-17')!.value).toBe(6_000);
    expect(dense.find((p) => p.t === '2017-02-09')!.value).toBe(6_200);
  });

  it('refuses a mean below the coverage floor instead of estimating', () => {
    const [day] = aggregate(flatDay('2026-06-01', 9_000, 10), opts({ coverageFloor: 0.75 }));
    expect(day.value).toBeNull();
    expect(day.state).toBe('MISSING');
    expect(day.coverage).toMatchObject({ observed: 10, sufficient: false });
  });

  it('reports a February 2017 month on the days it actually rests on', () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      flatDay(`2017-02-${String(i + 9).padStart(2, '0')}`, 6_000),
    ).flat();
    const [month] = aggregate(rows, opts({ resolution: 'month', coverageFloor: 0.9 }));
    expect(month.coverage.expected).toBe(24 * 28);
    expect(month.coverage.observed).toBe(20 * 24);
    expect(month.coverage.sufficient).toBe(false);
    expect(month.value).toBeNull();
  });

  it('never emits ESTIMATED — nothing in this module may produce it', () => {
    const rows = [...flatDay('2026-06-01', 9_000), ...flatDay('2026-06-03', 9_500)];
    const dense = fillMissing(
      aggregate(rows, opts()),
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-06-03T00:00:00Z'),
      'day',
    );
    expect(dense.some((p) => p.state === 'ESTIMATED')).toBe(false);
    expect(dense.map((p) => p.state)).toEqual(['DERIVED', 'MISSING', 'DERIVED']);
  });
});

describe('states', () => {
  it('marks an hour REPORTED and a day DERIVED', () => {
    const [hour] = aggregate([G('2026-06-01T10:00:00Z', { totalMw: 12_345 })], opts({ resolution: 'hour' }));
    expect(hour).toMatchObject({ state: 'REPORTED', value: 12_345 });
    const [day] = aggregate(flatDay('2026-06-01', 12_345), opts());
    expect(day.state).toBe('DERIVED');
  });

  it('treats a metric absent on every row as MISSING, not zero', () => {
    const rows = flatDay('2016-06-01', 6_000).map((r) => ({ ...r, values: { ...r.values, adaniMw: null } }));
    const [day] = aggregate(rows, opts({ metric: 'adaniMw' }));
    expect(day.value).toBeNull();
    expect(day.state).toBe('MISSING');
  });
});
