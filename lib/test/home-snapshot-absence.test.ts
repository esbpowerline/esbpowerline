import { describe, it, expect } from 'vitest';
import { buildHomeSnapshotFromDaily } from '@/lib/data/grid/home-snapshot-core';
import {
  SAMPLE_DAILY_REPORT,
  SAMPLE_SYSTEM_ONLY_REPORT,
  SAMPLE_SREDA,
} from '@/lib/test/fixtures/daily-report';

/**
 * "Absent is absent" — the charter, applied to every figure the snapshot builds.
 *
 * The rule was written down in `GridSystemStats` and honoured by the parsers,
 * and then five separate places in the builder quietly coerced a missing figure
 * to zero on its way to the homepage. Zero is a measurement: "no load was shed",
 * "the country generated nothing", "there is no renewable capacity". None of
 * those is what a blank cell in a PGCB workbook means.
 */

const tile = (report: unknown, sreda: unknown, label: string) =>
  buildHomeSnapshotFromDaily(report as never, sreda as never).find((s) => s.label === label);

describe('absent is absent — load shedding', () => {
  it('is null, not 0, when neither sheet publishes a shedding figure', () => {
    const t = tile(SAMPLE_DAILY_REPORT, SAMPLE_SREDA, 'Load Shedding');
    expect(t?.value).toBeNull();
    expect(t?.awaiting).toBe('PGCB');
  });

  it('is null when every published hour leaves the shed column blank', () => {
    // Pre-P4 layouts state the evening peak alone; the other hours are unknown.
    // `?? 0` used to fold all 24 into a measured zero.
    const report = {
      ...SAMPLE_DAILY_REPORT,
      hourlyLoadData: [
        { time: '01:00', generation: 9000, loadShed: null, demand: null },
        { time: '02:00', generation: 8800, loadShed: null, demand: null },
      ],
    };
    expect(tile(report, SAMPLE_SREDA, 'Load Shedding')?.value).toBeNull();
  });

  it('keeps a published zero — PGCB prints 0 on an hour it served everything', () => {
    const report = {
      ...SAMPLE_DAILY_REPORT,
      hourlyLoadData: [
        { time: '01:00', generation: 9000, loadShed: 0, demand: 9000 },
        { time: '02:00', generation: 8800, loadShed: null, demand: null },
      ],
    };
    const t = tile(report, SAMPLE_SREDA, 'Load Shedding');
    expect(t?.value).toBe(0);
    expect(t?.awaiting).toBeUndefined();
  });

  it('reports the peak of the stated hours', () => {
    const report = {
      ...SAMPLE_DAILY_REPORT,
      hourlyLoadData: [
        { time: '19:00', generation: 15000, loadShed: 412.4, demand: 15412 },
        { time: '20:00', generation: 15100, loadShed: 980.6, demand: 16081 },
        { time: '21:00', generation: 15050, loadShed: null, demand: null },
      ],
    };
    expect(tile(report, SAMPLE_SREDA, 'Load Shedding')?.value).toBe(981);
  });
});

describe('absent is absent — daily generation', () => {
  it('is null when P1 leaves the total generation cell empty', () => {
    // 42 days of early 2018 published "0.0 MKWh" because of exactly this.
    const report = {
      ...SAMPLE_DAILY_REPORT,
      systemStats: { ...SAMPLE_DAILY_REPORT.systemStats, totalEnergyGen: null },
    };
    const t = tile(report, SAMPLE_SREDA, 'Daily Generation');
    expect(t?.value).toBeNull();
    expect(t?.awaiting).toBe('PGCB');
  });

  it('converts a stated total to average MW', () => {
    expect(tile(SAMPLE_DAILY_REPORT, SAMPLE_SREDA, 'Daily Generation')?.value).toBe(
      Math.round((354.94 * 1000) / 24),
    );
  });
});

describe('absent is absent — coal', () => {
  it('is null when the fuel table carries no Coal row', () => {
    const report = {
      ...SAMPLE_DAILY_REPORT,
      generationData: SAMPLE_DAILY_REPORT.generationData.filter((g) => g.name !== 'Coal'),
    };
    const t = tile(report, SAMPLE_SREDA, 'Coal Generation');
    expect(t?.value).toBeNull();
    expect(t?.awaiting).toBe('PGCB');
  });

  it('keeps a published zero for a fuel that ran none — HSD does this most days', () => {
    const report = {
      ...SAMPLE_DAILY_REPORT,
      generationData: SAMPLE_DAILY_REPORT.generationData.map((g) =>
        g.name === 'Coal' ? { ...g, gen: 0 } : g,
      ),
    };
    const t = tile(report, SAMPLE_SREDA, 'Coal Generation');
    expect(t?.value).toBe(0);
    expect(t?.awaiting).toBeUndefined();
  });
});

describe('absent is absent — cross-border imports', () => {
  it('is null when the report publishes no border table', () => {
    // Not "Bheramara, Godda and Tripura all delivered nothing".
    const t = tile(SAMPLE_SYSTEM_ONLY_REPORT, SAMPLE_SREDA, 'Grid Import');
    expect(t?.value).toBeNull();
    expect(t?.awaiting).toBe('PGCB');
  });

  it('sums the stated peak flows', () => {
    expect(tile(SAMPLE_DAILY_REPORT, SAMPLE_SREDA, 'Grid Import')?.value).toBe(2570);
  });
});

describe('absent is absent — SREDA register', () => {
  it('holds both renewable tiles when the register was not read', () => {
    // These hardcoded 0, which published "0 MW installed" and "0% renewable
    // share" over SREDA's name on any day the register was unavailable.
    const built = buildHomeSnapshotFromDaily(SAMPLE_DAILY_REPORT as never, null);
    for (const label of ['RE Installed', 'RE Grid Share']) {
      const t = built.find((s) => s.label === label);
      expect(t?.value, `${label} should be null`).toBeNull();
      expect(t?.awaiting).toBe('SREDA');
    }
  });

  it('reports the register when it is present', () => {
    expect(tile(SAMPLE_DAILY_REPORT, SAMPLE_SREDA, 'RE Installed')?.value).toBe(1806);
    expect(tile(SAMPLE_DAILY_REPORT, SAMPLE_SREDA, 'RE Grid Share')?.value).toBe(5.56);
  });
});

describe('no tile ever invents a zero', () => {
  it('a report stating nothing beyond its peaks yields nulls, never zeros', () => {
    const bare = {
      systemStats: {
        ...SAMPLE_SYSTEM_ONLY_REPORT.systemStats,
        totalEnergyGen: null,
        totalEnergyUnserved: null,
      },
      generationData: [],
    };
    const zeroed = buildHomeSnapshotFromDaily(bare as never, null).filter((s) => s.value === 0);
    expect(zeroed.map((s) => s.label)).toEqual([]);
  });
});
