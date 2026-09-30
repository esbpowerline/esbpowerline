import { describe, it, expect } from 'vitest';
import {
  buildHomeSnapshotFromDaily,
  buildSredaSnapshotStats,
} from '@/lib/data/grid/home-snapshot-core';
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

  it('is null, not a smaller sum, when one line states no peak', () => {
    // 2018-01-21 published "Grid Import: 0 MW" beside 11.99 GWh of imports —
    // a blank peak cell read as zero. A line with no stated peak leaves the
    // national figure unknown; summing the others would understate it.
    const report = {
      ...SAMPLE_DAILY_REPORT,
      borderImportsData: SAMPLE_DAILY_REPORT.borderImportsData.map((row, i) =>
        i === 0 ? { ...row, peakFlow: null } : row,
      ),
    };
    const t = tile(report, SAMPLE_SREDA, 'Grid Import');
    expect(t?.value).toBeNull();
    expect(t?.awaiting).toBe('PGCB');
  });
});

describe('SREDA register — off the snapshot, still reported', () => {
  it('no longer occupies snapshot slots', () => {
    // The register answers "what is built", never "what is generating now", so
    // it lost its two tiles to `Solar + Wind` — NLDC's hourly renewable output.
    // A capacity figure in a panel of live readings invited exactly the
    // quantity confusion rule 2 exists to prevent.
    const built = buildHomeSnapshotFromDaily(SAMPLE_DAILY_REPORT as never, SAMPLE_SREDA as never);
    for (const label of ['RE Installed', 'RE Grid Share']) {
      expect(built.find((s) => s.label === label), `${label} should be gone`).toBeUndefined();
    }
  });

  it('still reports the register itself, for the surfaces that want capacity', () => {
    const stats = buildSredaSnapshotStats(SAMPLE_SREDA as never);
    expect(stats.find((s) => s.label === 'RE Installed')?.value).toBe(1806);
    expect(stats.find((s) => s.label === 'RE Grid Share')?.value).toBe(5.56);
  });
});

describe('absent is absent — hourly fuel tiles', () => {
  it('holds Solar + Wind rather than reporting a grid with no renewables', () => {
    // NLDC printed neither column for most of the archive's life — solar is in
    // 78.8% of stored hours and wind in 28.8%. A report with no renewable rows
    // is a report that did not carry them, not a day the sun and wind produced
    // nothing, and 0 MW would be the second claim.
    const report = {
      ...SAMPLE_DAILY_REPORT,
      generationData: [{ name: 'Coal', gen: 129.21 }],
    };
    const t = tile(report, SAMPLE_SREDA, 'Solar + Wind');
    expect(t?.value).toBeNull();
    expect(t?.awaiting).toBe('PGCB');
  });

  it('sums whichever renewable rows the day did publish', () => {
    const report = {
      ...SAMPLE_DAILY_REPORT,
      generationData: [
        { name: 'Solar', gen: 24 },
        { name: 'Wind', gen: 12 },
      ],
    };
    expect(tile(report, SAMPLE_SREDA, 'Solar + Wind')?.value).toBe(1500);
  });

  it('keeps Gas Generation and Gas Supply apart', () => {
    // Adjacent tiles, different quantities: gas burned for power versus national
    // production. Standing one in for the other printed a 64% collapse once.
    const gen = tile(SAMPLE_DAILY_REPORT, SAMPLE_SREDA, 'Gas Generation');
    const supply = tile(SAMPLE_DAILY_REPORT, SAMPLE_SREDA, 'Gas Supply');
    expect(gen?.unit).toBe('MW');
    expect(supply?.unit).toBe('MMCFD');
    expect(gen?.value).not.toBe(supply?.value);
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
