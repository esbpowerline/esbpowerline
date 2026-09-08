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

/**
 * Petrobangla's six company rows for a filed day, summing to 2,388 MMCFD.
 *
 * Stated separately because the Gas Supply tile is national production, while
 * `systemStats.totalGasSuppliedPower` (894.75, below) is the power sector's
 * slice — about a third of it. The two were once interchangeable in that tile.
 */
import {
  SAMPLE_GAS_PRODUCTION as GAS_PRODUCTION,
  SAMPLE_SYSTEM_ONLY_REPORT as sampleReport,
  SAMPLE_SREDA,
} from '@/lib/test/fixtures/daily-report';

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

  it('returns ok:false for 403 without archive masquerade', async () => {
    const result = await resolveDailyLoadFromStatus('2026-06-15', 403);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe('tier_locked');
    }
  });

  it('returns ok:false for 429', async () => {
    const result = await resolveDailyLoadFromStatus('2026-06-15', 429);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(429);
  });

  it('returns archive data for known fallback date on 404', async () => {
    const result = await resolveDailyLoadFromStatus('2026-06-29', 404);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe('archive');
      expect(result.data.systemStats.eveningPeakGen).toBeGreaterThan(0);
    }
  });

  it('returns network payload on 200', async () => {
    const result = await resolveDailyLoadFromStatus('2026-06-29', 200, sampleReport as any);
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

  it('reports a 404 as missing rather than serving the bundled archive', async () => {
    // The client used to fall back to a bundled chunk of 31 full days, which
    // shipped gated figures to every browser (audit 2026-08-08, fixed
    // 2026-09-03). A day the network cannot produce is now reported missing;
    // only the server-side prefetch may read the bundled fallback.
    const { fetchDailyReport } = await import('@/lib/data/grid/daily-loader.client');
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await fetchDailyReport('2026-06-29');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });
});

describe('home-snapshot', () => {
  const sredaSample = SAMPLE_SREDA;

  it('builds twelve daily metrics with MW units (GWh converted to avg MW)', () => {
    const stats = buildHomeSnapshotFromDaily({
      ...sampleReport,
      // A day Petrobangla has filed; the test below covers one it has not.
      gasProductionData: GAS_PRODUCTION,
      borderImportsData: [
        { source: 'HVDC Bheramara (India)', energy: 21.74, peakFlow: 902.3, type: 'West' },
        { source: 'Adani Godda (India)', energy: 36.56, peakFlow: 1489.6, type: 'North' },
        { source: 'Tripura Cumilla (India)', energy: 3.84, peakFlow: 177.9, type: 'East' },
      ],
    } as never, sredaSample);
    // Fourteen, not twelve: the builder emits the panel's twelve plus the two
    // archive figures the Grid Explorer's dated pages read and the noticeboard
    // does not carry.
    // Sixteen: the panel's twelve plus the four archive figures the Grid
    // Explorer's dated pages read and the noticeboard does not carry.
    expect(stats).toHaveLength(16);
    expect(stats.map((s) => s.label)).toEqual([
      'Yesterday Peak Gen',
      'Forecast Demand',
      'Current Demand',
      'Current Supply',
      'Load Shedding',
      'Current Generation',
      'Gas Generation',
      'Coal Generation',
      'Liquid Fuel',
      'Hydro',
      'Grid Import',
      'Solar + Wind',
      'Daily Generation',
      'Energy Unserved',
      'Gas Supply',
      'Production Cost',
    ]);
    // Asserted by LABEL rather than by position from here on. These indices
    // have now been renumbered three times by tile changes that had nothing to
    // do with what the builder computes, and each time the test failed on the
    // arithmetic rather than on the behaviour it exists to protect.
    const at = (label: string) => {
      const found = stats.find((x) => x.label === label);
      expect(found, `no tile emitted for ${label}`).toBeDefined();
      return found!;
    };

    // The forecast board's two and NLDC's three are held places: a CURRENT
    // figure, and a same-morning forecast, exist only on those pages. A daily
    // report yields the name and the owing source, never a substitute — it used
    // to carry the evening peak under a label the panel never listened for.
    for (const label of ['Current Demand', 'Current Supply', 'Current Generation', 'Liquid Fuel', 'Hydro']) {
      expect(at(label).value).toBeNull();
      expect(at(label).awaiting).toBe('NLDC');
      expect(at(label).unit).toBe(POWER_UNIT);
    }
    for (const label of ['Forecast Demand', 'Yesterday Peak Gen']) {
      expect(at(label).value).toBeNull();
      expect(at(label).awaiting).toBe('PGCB');
    }

    // The archive figures the panel no longer carries are still built.
    expect(at('Daily Generation').value).toBe(gwhToAvgMw(354.94));
    expect(at('Daily Generation').unit).toBe(POWER_UNIT);
    expect(at('Energy Unserved').value).toBe(gwhToAvgMw(2.14));
    expect(at('Energy Unserved').unit).toBe(POWER_UNIT);
    expect(at('Coal Generation').value).toBe(gwhToAvgMw(129.21));
    expect(at('Coal Generation').unit).toBe(POWER_UNIT);
    expect(at('Grid Import').value).toBe(2570);
    expect(at('Grid Import').unit).toBe(POWER_UNIT);
    expect(at('Production Cost').value).toBe(6.5);
    // National production, not the power sector's slice of it — and the two now
    // sit side by side, so the distinction has to survive being adjacent.
    expect(at('Gas Supply').value).toBe(2388);
    expect(at('Gas Supply').unit).toBe('MMCFD');
    expect(at('Gas Generation').unit).toBe(POWER_UNIT);
  });

  it('holds Gas Supply as a dash on a day Petrobangla has not filed, rather than substituting', () => {
    // The fallback used to be `totalGasSuppliedPower` — the power sector's
    // slice. Under one unchanged label the tile read 2,366 MMcfd on
    // 2026-08-26 and 856 two days later, a 64% "collapse" that was only a
    // change of source. Petrobangla files a day or two behind PGCB, so this is
    // the ordinary state of the newest day, not an edge case.
    //
    // Dropping the tile fixed the figure and broke the grid: the snapshot is a
    // fixed 2x6, so the panel reflowed to eleven tiles on the newest day, every
    // day, until the gas landed. The tile now keeps its slot with a null value
    // and names the source it is waiting on.
    const filed = buildHomeSnapshotFromDaily(
      { ...sampleReport, gasProductionData: GAS_PRODUCTION } as never,
      sredaSample,
    );
    const unfiled = buildHomeSnapshotFromDaily({ ...sampleReport } as never, sredaSample);

    expect(filed.find((s) => s.label === 'Gas Supply')?.value).toBe(2388);
    expect(filed.find((s) => s.label === 'Gas Supply')?.awaiting).toBeUndefined();

    const pending = unfiled.find((s) => s.label === 'Gas Supply');
    // Null, never 0 — a zero here asserts the country produced no gas.
    expect(pending?.value).toBeNull();
    expect(pending?.awaiting).toBe('Petrobangla');
    // and never the power-sector slice it used to borrow
    expect(pending?.value).not.toBe(sampleReport.systemStats.totalGasSuppliedPower);

    // The grid keeps its shape: same tiles, same order, on both days.
    expect(unfiled).toHaveLength(filed.length);
    expect(unfiled.map((s) => s.label)).toEqual(filed.map((s) => s.label));
  });

  it('holds Energy Unserved the same way when the report omits it', () => {
    const omitted = buildHomeSnapshotFromDaily(
      { ...sampleReport, systemStats: { ...sampleReport.systemStats, totalEnergyUnserved: null } } as never,
      sredaSample,
    );
    const tile = omitted.find((s) => s.label === 'Energy Unserved');
    expect(tile).toBeDefined();
    expect(tile?.value).toBeNull();
    expect(tile?.awaiting).toBe('PGCB');
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


