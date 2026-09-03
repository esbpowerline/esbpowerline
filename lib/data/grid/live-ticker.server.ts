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

/**
 * Day-over-day movement, or null when there is no previous figure to move from.
 *
 * This returned 0 in that case, and 0 is not "unknown" — the ticker renders it
 * as a green "▲ 0%" badge, which claims the figure was measured and did not
 * change. The FX item already passed null explicitly with a comment saying so;
 * every report-derived item was quietly doing the opposite whenever the day
 * before was missing or carried no such figure.
 */
const pct = (cur: number, prev: number | null | undefined): number | null =>
  typeof prev === 'number' && prev > 0
    ? Number((((cur - prev) / prev) * 100).toFixed(1))
    : null;

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

  /**
   * Published figures only, each named to the body that published it.
   *
   * The strip used to lead with "Avg Gen Cost" and five per-fuel "Gen Cost"
   * entries. None of the six is a price anyone publishes: `avgProductionCost`
   * is the day's bill divided by its energy (parse_daily_reports.py:1890, which
   * never reads P1's printed rate), and each per-fuel `unitCost` is that fuel's
   * cost divided by its generation. The Grid Explorer's own cost briefing says
   * as much in as many words — "the per-fuel rates below are not published
   * tariffs" — while the site chrome was quoting them, on every page, under a
   * heading that reads COMMODITIES. The import figure was the worst of them: a
   * blended settlement number presented beside BPC's gazetted diesel price.
   *
   * What replaces them is what PGCB, Petrobangla, BERC and BPC actually state.
   */
  const s = cur.systemStats;
  const sPrev = prev?.systemStats;

  // P1's Evening Peak Generation row.
  if (s?.eveningPeakGen != null && s.eveningPeakGen > 0) {
    items.push({ id: 'peak-gen', name: 'Evening Peak Gen', value: round(s.eveningPeakGen, 0), unit: 'MW', change: pct(s.eveningPeakGen, sPrev?.eveningPeakGen), prefix: '', asOf: latest, source: 'PGCB' });
  }

  // P1's Evening Peak Demand row.
  if (s?.eveningPeakDemand != null && s.eveningPeakDemand > 0) {
    items.push({ id: 'peak-demand', name: 'Evening Peak Demand', value: round(s.eveningPeakDemand, 0), unit: 'MW', change: pct(s.eveningPeakDemand, sPrev?.eveningPeakDemand), prefix: '', asOf: latest, source: 'PGCB' });
  }

  // Explicitly nullable in the schema: PGCB leaves the cell empty on some days,
  // and 42 days of early 2018 published a headline "0.0 MKWh" as a result.
  if (s?.totalEnergyGen != null && s.totalEnergyGen > 0) {
    items.push({ id: 'energy-gen', name: 'Energy Generated', value: round(s.totalEnergyGen, 2), unit: 'MKWh', change: pct(s.totalEnergyGen, sPrev?.totalEnergyGen), prefix: '', asOf: latest, source: 'PGCB' });
  }

  // P1's "Production Cost (Tk.)" total row — the printed total, not the rate
  // derived from it. Zero means the day's report carries no cost block.
  if (s?.totalDailyCost != null && s.totalDailyCost > 0) {
    items.push({ id: 'production-cost', name: 'Production Cost', value: round(s.totalDailyCost / 10000000, 2), unit: 'Cr BDT', change: pct(s.totalDailyCost, sPrev?.totalDailyCost), prefix: '', asOf: latest, source: 'PGCB' });
  }

  // P1's "Energy Unserverd" row, PGCB's own spelling. Absent on the layouts
  // that omit it; never shown as zero, which would assert nothing was shed.
  if (s?.totalEnergyUnserved != null && s.totalEnergyUnserved > 0) {
    items.push({ id: 'energy-unserved', name: 'Energy Unserved', value: round(s.totalEnergyUnserved, 2), unit: 'MKWh', change: pct(s.totalEnergyUnserved, sPrev?.totalEnergyUnserved), prefix: '', asOf: latest, source: 'PGCB' });
  }

  // National gas production: the newest gas day and the one before it.
  // Petrobangla's own printed grand total for the gas day, not our sum of the
  // company rows beneath it.
  const [gasLast, gasPrev] = gasTotals;
  if (gasLast) {
    items.push({
      id: 'gas-prod',
      name: 'Gas Production',
      value: round(gasLast.total, 1),
      unit: 'MMCFD',
      change: pct(gasLast.total, gasPrev?.total),
      prefix: '',
      asOf: gasLast.date,
      source: 'Petrobangla',
    });
  }

  // Regulated prices, as gazetted. Standing prices carry no daily delta — a 0
  // there rendered as a green "▲ 0%" badge, a claim the price was measured
  // unchanged today.
  const tariff = macroTariffData[macroTariffData.length - 1]?.tariff ?? 0;
  if (tariff > 0) {
    items.push({ id: 'tariff', name: 'Bulk Tariff', value: round(tariff), unit: 'Tk/kWh', change: null, prefix: '', source: 'BERC' });
  }
  const macro = macroEconomicData[macroEconomicData.length - 1];
  if (macro?.retailDiesel) {
    items.push({ id: 'diesel-bpc', name: 'Diesel', value: round(macro.retailDiesel), unit: 'Tk/L', change: null, prefix: '', source: 'BPC' });
  }
  if (macro?.retailOctane) {
    items.push({ id: 'octane-bpc', name: 'Octane', value: round(macro.retailOctane), unit: 'Tk/L', change: null, prefix: '', source: 'BPC' });
  }

  // Last, and named for what it is. Bangladesh Bank publishes the official
  // rate; this is a public aggregator, so it is the one figure on the strip no
  // government body stands behind and it says so rather than borrowing the
  // authority of the four that do.
  const fxFallback = macroEconomicData[macroEconomicData.length - 1]?.exchangeRate ?? 0;
  const fx = fxLive ?? fxFallback;
  if (fx > 0) {
    items.push({ id: 'fx', name: 'USD/BDT', value: fx, unit: '', change: null, prefix: '৳', source: fxLive ? 'ER-API' : 'ESB archive' });
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
