import { describe, it, expect } from 'vitest';
import { describeDay, formatArchiveDate, type ArchiveDaySummary } from '@/lib/data/grid/archive-day.server';
import { buildHomeSnapshotFromDaily } from '@/lib/data/grid/home-snapshot-core';
import { SAMPLE_DAILY_REPORT, SAMPLE_SREDA } from '@/lib/test/fixtures/daily-report';

/**
 * The archive day page states its figures in a sentence, and a sentence is a
 * new place a figure can be invented.
 *
 * The tiles were already covered by `home-snapshot-absence` — that is why this
 * page reuses `buildHomeSnapshotFromDaily` rather than reading `systemStats`
 * itself. What is new here is the prose: it goes into the `<title>`'s sibling
 * description and into the search result, which is the one piece of this site
 * a reader may see without ever visiting it. A clause about a figure nobody
 * filed must not be written at all — not written with a zero, and not written
 * with a hedge.
 */

const summaryFrom = (report: unknown, overrides: Partial<ArchiveDaySummary> = {}): ArchiveDaySummary => ({
  date: '2024-08-12',
  stats: buildHomeSnapshotFromDaily(report as never, SAMPLE_SREDA as never).filter(
    (s) => s.label !== 'Current Demand',
  ),
  fuels: [],
  fuelTotalGwh: null,
  sources: {},
  previous: null,
  next: null,
  ...overrides,
});

describe('archive day description', () => {
  it('names the country and the date so the sentence stands alone in a search result', () => {
    const text = describeDay(summaryFrom(SAMPLE_DAILY_REPORT));
    expect(text).toContain('Bangladesh');
    expect(text).toContain('12 August 2024');
  });

  it('omits the load shedding clause entirely when no sheet published one', () => {
    // The fixture publishes no shedding figure, so the tile is null. A sentence
    // reading "load shedding peaked at 0 MW" would assert the country shed
    // nothing — the exact claim an absent figure never makes.
    const text = describeDay(summaryFrom(SAMPLE_DAILY_REPORT));
    expect(text).not.toMatch(/load shedding/i);
    expect(text).not.toMatch(/\b0 MW/);
  });

  it('states a published zero as a measurement, because it is one', () => {
    const report = {
      ...SAMPLE_DAILY_REPORT,
      hourlyLoadData: [
        { time: '19:00', generation: 12000, loadShed: 0, demand: 12000 },
        { time: '20:00', generation: 12500, loadShed: 0, demand: 12500 },
      ],
    };
    const text = describeDay(summaryFrom(report));
    expect(text).toMatch(/no load shedding/i);
  });

  it('never prints "null", "undefined" or "NaN" into the sentence', () => {
    const bare = {
      ...SAMPLE_DAILY_REPORT,
      generationData: [],
      gasProductionData: [],
      hourlyLoadData: [],
      regionalDemandData: [],
    };
    const text = describeDay(summaryFrom(bare));
    expect(text).not.toMatch(/null|undefined|NaN/);
    expect(text.length).toBeGreaterThan(0);
  });

  it('falls back to naming the report when even the peaks are missing', () => {
    const noPeaks = {
      ...SAMPLE_DAILY_REPORT,
      systemStats: { ...SAMPLE_DAILY_REPORT.systemStats, eveningPeakGen: 0, dayPeakGen: 0 },
    };
    const text = describeDay(summaryFrom(noPeaks));
    expect(text).toContain('12 August 2024');
  });
});

describe('archive date formatting', () => {
  it('renders the form a reader and a search snippet both want', () => {
    expect(formatArchiveDate('2024-08-12')).toBe('12 August 2024');
    expect(formatArchiveDate('2013-12-31')).toBe('31 December 2013');
  });

  it('does not drift across the timezone boundary', () => {
    // Built with Date.UTC and formatted in UTC: a local-time constructor put
    // 1 January back into 31 December for anyone west of Greenwich.
    expect(formatArchiveDate('2020-01-01')).toBe('1 January 2020');
  });
});
