import 'server-only';

import { unstable_cache } from 'next/cache';
import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { getRuntimeAvailableDates } from '@/lib/data/grid/available-dates.server';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import { getPublishedKeys, getReleasePayload, RELEASE_CACHE_TAG } from '@/lib/data/releases.server';
import type { PetrobanglaDaily } from '@/lib/data/petrobangla/types';
import { macroTariffData } from '@/lib/data/macro/tariff';
import { macroEconomicData } from '@/lib/data/macro/economics';

/**
 * Real ticker data, derived at render time from the same parsed archives that
 * ship with each deploy (PGCB daily reports + Petrobangla index) plus published
 * regulated prices (BERC tariff, BPC retail) and a live USD/BDT rate. No
 * simulation anywhere — change percentages are true day-over-day deltas.
 */

const pct = (cur: number, prev: number): number =>
  prev > 0 ? Number((((cur - prev) / prev) * 100).toFixed(1)) : 0;

const round = (v: number, d = 2) => Number(v.toFixed(d));

/** Live USD/BDT from the Open Exchange Rate API (public, daily-updated). */
async function fetchUsdBdt(): Promise<number | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      // One origin hit per 6h across all visitors; ticker is not tick-by-tick FX.
      next: { revalidate: 21_600 },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const rate = data.result === 'success' ? data.rates?.BDT : null;
    return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 ? round(rate, 2) : null;
  } catch {
    return null;
  }
}

type GasTotal = { date: string; total: number };

/**
 * The last two national gas totals, without reading the gas index release.
 *
 * The ticker wants two scalars — yesterday's grand total and the day before —
 * and used to get them through `loadPetrobanglaIndexDays()`, which returns
 * the whole GAS_INDEX release: ~1.19 MB of JSON read from Postgres, once per
 * warm serverless instance per ten minutes, on every public page render (the
 * ticker sits in the public layout). That one call was the largest single
 * source of Supabase egress on the site (SEO_FIX_LOG stage 1, 2026-09-02).
 *
 * Precedence is unchanged — a release still wins over a static file — but the
 * release side now reads the two GAS_DAILY payloads it needs (~48 KB each,
 * already cached per key) instead of the index. The shipped index on disk is
 * a local file read, not egress, and is only consulted for days that were
 * never published as a release.
 */
let shippedIndexCache: Map<string, number> | null = null;

/** The shipped index, read from disk once per process — never from the database. */
async function shippedGasTotals(): Promise<Map<string, number>> {
  if (shippedIndexCache) return shippedIndexCache;
  const map = new Map<string, number>();
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = path.join(process.cwd(), 'public', 'data', 'petrobangla', '_index.json');
    const parsed = JSON.parse(await fs.readFile(file, 'utf8')) as {
      days?: Array<{ date?: string; grand_total_gas_mmcfd?: number }>;
    };
    for (const d of parsed.days ?? []) {
      if (d.date && typeof d.grand_total_gas_mmcfd === 'number') map.set(d.date, d.grand_total_gas_mmcfd);
    }
  } catch {
    // Not bundled into this function, or unreadable: the released days below
    // still answer, and a ticker with no gas item beats one with a guess.
  }
  shippedIndexCache = map;
  return map;
}

async function latestGasTotals(): Promise<[GasTotal | null, GasTotal | null]> {
  const releasedDates = (await getPublishedKeys('GAS_DAILY'))
    .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort();
  const releasedSet = new Set(releasedDates);

  // Every day since 2026-08-21 is published as a release, so the disk index is
  // only opened when fewer than two released gas days exist.
  const shippedByDate = releasedDates.length >= 2 ? new Map<string, number>() : await shippedGasTotals();

  const dates = [...new Set([...shippedByDate.keys(), ...releasedDates])].sort();
  const lastTwo = dates.slice(-2).reverse();

  const resolve = async (date: string | undefined): Promise<GasTotal | null> => {
    if (!date) return null;
    if (releasedSet.has(date)) {
      const doc = (await getReleasePayload('GAS_DAILY', date)) as PetrobanglaDaily | null;
      const total = doc?.production?.grand_total?.gas_mmcfd;
      return typeof total === 'number' && total > 0 ? { date, total } : null;
    }
    const total = shippedByDate.get(date);
    return typeof total === 'number' && total > 0 ? { date, total } : null;
  };

  const [latest, prev] = await Promise.all([resolve(lastTwo[0]), resolve(lastTwo[1])]);
  return [latest, prev];
}

async function buildLiveTickerItems(): Promise<TickerItem[] | null> {
  // Runtime catalog, so the ticker follows days published from the admin panel
  // rather than freezing on the last day that shipped with a deploy.
  const runtime = await getRuntimeAvailableDates();
  const latest = runtime[runtime.length - 1] ?? null;
  if (!latest) return null;
  const prevDate = runtime[runtime.length - 2];

  const [latestRes, prevRes, gasTotals, fxLive] = await Promise.all([
    loadDailyReportFromDisk(latest),
    prevDate ? loadDailyReportFromDisk(prevDate) : Promise.resolve(null),
    latestGasTotals().catch((): [null, null] => [null, null]),
    fetchUsdBdt(),
  ]);
  if (!latestRes.ok) return null;

  const cur = latestRes.data;
  const prev = prevRes && prevRes.ok ? prevRes.data : null;
  const items: TickerItem[] = [];

  // Average production cost — the headline number.
  const avgCur = cur.systemStats?.avgProductionCost ?? 0;
  const avgPrev = prev?.systemStats?.avgProductionCost ?? 0;
  if (avgCur > 0) {
    items.push({ id: 'avg-cost', name: 'Avg Gen Cost', value: round(avgCur), unit: 'Tk/kWh', change: pct(avgCur, avgPrev), prefix: '', asOf: latest });
  }

  // Per-fuel unit costs with true day-over-day movement.
  const fuelRows: Array<[string, string, string]> = [
    ['Gas', 'gas-cost', 'Gas Gen Cost'],
    ['Coal', 'coal-cost', 'Coal Gen Cost'],
    ['HFO', 'hfo-cost', 'HFO Gen Cost'],
    ['Imports', 'import-cost', 'Import Gen Cost'],
    ['Solar', 'solar-cost', 'Solar Gen Cost'],
  ];
  for (const [fuel, id, name] of fuelRows) {
    const c = cur.generationData?.find((g) => g.name === fuel);
    const p = prev?.generationData?.find((g) => g.name === fuel);
    // unitCost is null when the day's report carries no production-cost
    // block; such a day is skipped rather than shown as a 0 Tk/kWh fuel.
    if (c && c.unitCost != null && c.unitCost > 0 && c.gen > 0) {
      items.push({ id, name, value: round(c.unitCost), unit: 'Tk/kWh', change: pct(c.unitCost, p?.unitCost ?? 0), prefix: '', asOf: latest });
    }
  }

  // Evening peak generation.
  const peakCur = cur.systemStats?.eveningPeakGen ?? 0;
  const peakPrev = prev?.systemStats?.eveningPeakGen ?? 0;
  if (peakCur > 0) {
    items.push({ id: 'peak-gen', name: 'Evening Peak', value: round(peakCur, 0), unit: 'MW', change: pct(peakCur, peakPrev), prefix: '', asOf: latest });
  }

  // National gas production: the newest gas day and the one before it.
  const [gasLast, gasPrev] = gasTotals;
  if (gasLast) {
    items.push({
      id: 'gas-prod',
      name: 'Total Gas Prod',
      value: round(gasLast.total, 1),
      unit: 'MMCFD',
      change: pct(gasLast.total, gasPrev?.total ?? 0),
      prefix: '',
      asOf: gasLast.date,
    });
  }

  // USD/BDT — live rate, falling back to the latest published macro figure.
  const fxFallback = macroEconomicData[macroEconomicData.length - 1]?.exchangeRate ?? 0;
  const fx = fxLive ?? fxFallback;
  if (fx > 0) {
    // Standing prices carry no daily delta. A 0 here rendered as a green
    // "▲ 0%" badge — a claim the price was measured unchanged today.
    items.push({ id: 'fx', name: 'USD/BDT', value: fx, unit: '', change: null, prefix: '৳' });
  }

  // Published regulated prices (BERC bulk tariff, BPC retail fuel).
  const tariff = macroTariffData[macroTariffData.length - 1]?.tariff ?? 0;
  if (tariff > 0) {
    items.push({ id: 'tariff', name: 'Bulk Tariff', value: round(tariff), unit: 'Tk/kWh', change: null, prefix: '' });
  }
  const macro = macroEconomicData[macroEconomicData.length - 1];
  if (macro?.retailDiesel) {
    items.push({ id: 'diesel-bpc', name: 'Diesel (BPC)', value: round(macro.retailDiesel), unit: 'Tk/L', change: null, prefix: '' });
  }
  if (macro?.retailOctane) {
    items.push({ id: 'octane-bpc', name: 'Octane (BPC)', value: round(macro.retailOctane), unit: 'Tk/L', change: null, prefix: '' });
  }

  return items.length > 0 ? items : null;
}

/**
 * Cached across requests: the public layout calls this on every route's render
 * and the homepage calls it a second time. Ten minutes matches the release
 * cache beneath it, and the release tag drops it the moment a day is published.
 */
export const getLiveTickerItems = unstable_cache(buildLiveTickerItems, ['live-ticker-items'], {
  revalidate: 600,
  tags: [RELEASE_CACHE_TAG],
});
