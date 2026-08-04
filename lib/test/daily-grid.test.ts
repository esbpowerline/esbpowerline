import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  legacyDateToIso,
  isoDateToLegacy,
  parseIsoDate,
  normalizeDateKey,
} from '@/lib/data/grid/date-utils';
import { validateDailyReport } from '@/lib/data/grid/validate-daily-report';
import { resolveDailyLoadFromStatus } from '@/lib/data/grid/daily-loader.server';
import {
  normalizeSiteHost,
  isSameOriginDailyAccess,
  isBlockedBotUserAgent,
  shouldUseArchiveFallback,
} from '@/lib/data/grid/daily-access';
import { getLatestAvailableDate, isDateAvailable } from '@/lib/data/grid/available-dates';
import {
  getCachedDailyReport,
  resolveInitialDailyReport,
  seedDailyReportCache,
  setCachedDailyReport,
} from '@/lib/data/grid/daily-cache';
import { prefetchGridExplorerDailyReports } from '@/lib/data/grid/grid-explorer-prefetch.server';
import { buildHomeSnapshotFromDaily, gwhToAvgMw, POWER_UNIT } from '@/lib/data/grid/home-snapshot-core';

const sampleReport = {
  systemStats: {
    date: '29 Jun 2026',
    dayPeakGen: 14308,
    eveningPeakGen: 16180.9,
    dayPeakDemand: 14575.8,
    eveningPeakDemand: 16740.5,
    minGen: 13739.5,
    maxGen: 15788,
    totalEnergyGen: 354.94,
    totalEnergyUnserved: 2.14,
    totalEnergyDemand: 357.08,
    maxTemp: 32.2,
    totalGasSuppliedPower: 894.75,
    avgProductionCost: 6.498,
    totalDailyCost: 2299089200,
  },
  generationData: [
    { name: 'Gas', gen: 126.19, cost: 1, unitCost: 3.45, color: '#0ea5e9' },
    { name: 'Coal', gen: 129.21, cost: 1, unitCost: 6.62, color: '#64748b' },
    { name: 'HFO', gen: 30.41, cost: 1, unitCost: 18.06, color: '#f97316' },
    { name: 'Hydro', gen: 2.21, cost: 1, unitCost: 0.1, color: '#06b6d4' },
    { name: 'Solar', gen: 3.75, cost: 1, unitCost: 15.77, color: '#eab308' },
    { name: 'Imports', gen: 63.06, cost: 1, unitCost: 6.34, color: '#a855f7' },
    { name: 'HSD (Diesel)', gen: 0, cost: 0, unitCost: 0, color: '#ef4444' },
  ],
};

describe('date-utils', () => {
  it('converts legacy PGCB dates to ISO', () => {
    expect(legacyDateToIso('29 Jun 2026')).toBe('2026-06-29');
    expect(isoDateToLegacy('2026-06-29')).toBe('29 Jun 2026');
  });

  it('rejects invalid ISO dates', () => {
    expect(parseIsoDate('0202-01-02')).toBeNull();
    expect(parseIsoDate('2026-13-40')).toBeNull();
  });

  it('normalizes either key format', () => {
    expect(normalizeDateKey('23 Jun 2026')).toBe('2026-06-23');
    expect(normalizeDateKey('2026-06-23')).toBe('2026-06-23');
  });
});

describe('validate-daily-report', () => {
  it('accepts reports without Wind fuel', () => {
    const result = validateDailyReport(sampleReport);
    expect(result.success).toBe(true);
  });

  it('rejects missing systemStats', () => {
    const result = validateDailyReport({ generationData: [] });
    expect(result.success).toBe(false);
  });

  it('accepts null daily extremes', () => {
    // Days whose source states neither extreme and carries no load curve
    // report null. The alternative — a number derived from an unrelated
    // peak — is indistinguishable from a measured value once archived.
    const result = validateDailyReport({
      ...sampleReport,
      systemStats: { ...sampleReport.systemStats, minGen: null, maxGen: null },
    });
    expect(result.success).toBe(true);
  });

  it('still rejects a non-numeric, non-null extreme', () => {
    const result = validateDailyReport({
      ...sampleReport,
      systemStats: { ...sampleReport.systemStats, maxGen: 'n/a' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts null for every figure the source may not publish', () => {
    // Older layouts print generation but not demand, unserved energy or the
    // day's temperature. Those days report null rather than the estimates the
    // site used to synthesise (maxTemp was the constant 32.8 throughout).
    const result = validateDailyReport({
      ...sampleReport,
      systemStats: {
        ...sampleReport.systemStats,
        dayPeakDemand: null,
        totalEnergyUnserved: null,
        totalEnergyDemand: null,
        maxTemp: null,
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts fuel rows with no published cost', () => {
    const result = validateDailyReport({
      ...sampleReport,
      generationData: [{ name: 'Gas', gen: 126.19, cost: null, unitCost: null, color: '#0ea5e9' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an hourly curve carrying shedding on the peak hour only', () => {
    const result = validateDailyReport({
      ...sampleReport,
      hourlyLoadData: [
        { time: '00:00', generation: 13000, loadShed: null, demand: null },
        { time: '21:00', generation: 16180.9, loadShed: 359, demand: 16740.5 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('daily-loader-core status handling', () => {
  it('uses archive fallback only for 404 and network', () => {
    expect(shouldUseArchiveFallback(404)).toBe(true);
    expect(shouldUseArchiveFallback(null)).toBe(true);
    expect(shouldUseArchiveFallback(403)).toBe(false);
    expect(shouldUseArchiveFallback(429)).toBe(false);
  });

  it('returns ok:false for 403 without archive masquerade', () => {
    const result = resolveDailyLoadFromStatus('2026-06-15', 403);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe('tier_locked');
    }
  });

  it('returns ok:false for 429', () => {
    const result = resolveDailyLoadFromStatus('2026-06-15', 429);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(429);
  });

  it('returns archive data for known fallback date on 404', () => {
    const result = resolveDailyLoadFromStatus('2026-06-29', 404);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe('archive');
      expect(result.data.systemStats.eveningPeakGen).toBeGreaterThan(0);
    }
  });

  it('returns network payload on 200', () => {
    const result = resolveDailyLoadFromStatus('2026-06-29', 200, sampleReport as any);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.source).toBe('network');
  });
});

describe('daily-access gate', () => {
  it('normalizes www and apex hosts', () => {
    expect(normalizeSiteHost('www.esbpowerline.com')).toBe('esbpowerline.com');
    expect(normalizeSiteHost('esbpowerline.com:443')).toBe('esbpowerline.com');
  });

  it('allows same-origin via Referer or Origin in production', () => {
    expect(
      isSameOriginDailyAccess(
        'https://www.esbpowerline.com/grid-explorer',
        null,
        'esbpowerline.com',
        'production',
      ),
    ).toBe(true);
    expect(
      isSameOriginDailyAccess(
        null,
        'https://esbpowerline.com',
        'www.esbpowerline.com',
        'production',
      ),
    ).toBe(true);
    expect(
      isSameOriginDailyAccess(
        'https://evil.example/data',
        null,
        'esbpowerline.com',
        'production',
      ),
    ).toBe(false);
  });

  it('blocks curl user agents', () => {
    expect(isBlockedBotUserAgent('curl/8.0')).toBe(true);
    expect(isBlockedBotUserAgent('Mozilla/5.0')).toBe(false);
  });
});

describe('available-dates sanitization', () => {
  it('excludes corrupt historical junk keys', () => {
    expect(isDateAvailable('0202-01-02')).toBe(false);
    expect(isDateAvailable('0219-11-03')).toBe(false);
  });

  it('includes latest July 2026 backlog date', () => {
    const latest = getLatestAvailableDate();
    expect(latest).not.toBeNull();
    expect(isDateAvailable(latest!)).toBe(true);
  });
});

describe('fetchDailyReport client integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('surfaces 429 without archive fallback', async () => {
    const { fetchDailyReport } = await import('@/lib/data/grid/daily-loader.client');
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 429 } as Response);
    const result = await fetchDailyReport('2026-06-29');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(429);
  });

  it('falls back to archive on 404', async () => {
    const { fetchDailyReport } = await import('@/lib/data/grid/daily-loader.client');
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await fetchDailyReport('2026-06-29');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.source).toBe('archive');
  });
});

describe('home-snapshot', () => {
  const sredaSample = {
    date: '2026-06-29',
    lastUpdate: '2026-06-29 16:16:30',
    sourceUrl: 'https://ndre.sreda.gov.bd/',
    totalRenewableMw: 1805.84,
    renewableTech: [],
    reGridSharePct: 5.56,
    totalInstalledMw: 32456,
    generationMix: [],
    scrapedAt: '2026-06-30T00:00:00.000Z',
  };

  it('builds twelve daily metrics with MW units (GWh converted to avg MW)', () => {
    const stats = buildHomeSnapshotFromDaily({
      ...sampleReport,
      borderImportsData: [
        { source: 'HVDC Bheramara (India)', energy: 21.74, peakFlow: 902.3, type: 'West' },
        { source: 'Adani Godda (India)', energy: 36.56, peakFlow: 1489.6, type: 'North' },
        { source: 'Tripura Cumilla (India)', energy: 3.84, peakFlow: 177.9, type: 'East' },
      ],
    } as never, sredaSample);
    expect(stats).toHaveLength(12);
    expect(stats.map((s) => s.label)).toEqual([
      'Evening Peak Demand',
      'Peak Generation',
      'Peak Today',
      'Daily Generation',
      'Load Shedding',
      'Energy Unserved',
      'Fuel Cost',
      'Gas Supply',
      'Coal Generation',
      'Grid Import',
      'RE Installed',
      'RE Grid Share',
    ]);
    expect(stats[0].value).toBe(16741);
    expect(stats[0].unit).toBe(POWER_UNIT);
    expect(stats[1].value).toBe(16181);
    expect(stats[1].unit).toBe(POWER_UNIT);
    expect(stats[3].value).toBe(gwhToAvgMw(354.94));
    expect(stats[3].unit).toBe(POWER_UNIT);
    expect(stats[5].value).toBe(gwhToAvgMw(2.14));
    expect(stats[5].unit).toBe(POWER_UNIT);
    expect(stats[6].value).toBe(6.5);
    expect(stats[8].value).toBe(gwhToAvgMw(129.21));
    expect(stats[8].unit).toBe(POWER_UNIT);
    expect(stats[9].value).toBe(2570);
    expect(stats[9].unit).toBe(POWER_UNIT);
    expect(stats[10].value).toBe(1806);
    expect(stats[10].unit).toBe(POWER_UNIT);
    expect(stats[11].value).toBe(5.56);
  });
});

describe('grid explorer prefetch', () => {
  it('prefetches latest daily report from disk', async () => {
    const latest = getLatestAvailableDate();
    expect(latest).toBeTruthy();
    const reports = await prefetchGridExplorerDailyReports(null);
    expect(reports[latest!]).toBeDefined();
    expect(reports[latest!].systemStats.date).toBeTruthy();
  });

  it('also prefetches a deep-linked date when provided', async () => {
    const latest = getLatestAvailableDate();
    expect(latest).toBeTruthy();
    const deepLink = latest!.slice(0, 8) + '01';
    if (!isDateAvailable(deepLink)) return;

    const reports = await prefetchGridExplorerDailyReports(deepLink);
    expect(reports[latest!]).toBeDefined();
    expect(reports[deepLink]).toBeDefined();
  });
});

describe('daily-cache seeding', () => {
  it('resolves initial report from prefetched map before network', () => {
    const latest = getLatestAvailableDate() ?? '2026-07-03';
    const seeded = { ...sampleReport, systemStats: { ...sampleReport.systemStats, date: '1 Jul 2026' } };
    seedDailyReportCache({ [latest]: seeded as typeof sampleReport });

    const resolved = resolveInitialDailyReport(latest, latest, { [latest]: seeded as typeof sampleReport });
    expect(resolved?.systemStats.date).toBe('1 Jul 2026');
    expect(getCachedDailyReport(latest)?.systemStats.date).toBe('1 Jul 2026');

    setCachedDailyReport(latest, sampleReport as typeof sampleReport);
  });
});


