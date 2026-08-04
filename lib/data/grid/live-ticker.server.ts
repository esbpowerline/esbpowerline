import 'server-only';

import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { getRuntimeAvailableDates } from '@/lib/data/grid/available-dates.server';
import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import { loadPetrobanglaIndexDays } from '@/lib/data/grid/grid-export.server';
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

export async function getLiveTickerItems(): Promise<TickerItem[] | null> {
  // Runtime catalog, so the ticker follows days published from the admin panel
  // rather than freezing on the last day that shipped with a deploy.
  const runtime = await getRuntimeAvailableDates();
  const latest = runtime[runtime.length - 1] ?? null;
  if (!latest) return null;
  const prevDate = runtime[runtime.length - 2];

  const [latestRes, prevRes, pbDays, fxLive] = await Promise.all([
    loadDailyReportFromDisk(latest),
    prevDate ? loadDailyReportFromDisk(prevDate) : Promise.resolve(null),
    loadPetrobanglaIndexDays().catch(() => []),
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
    items.push({ id: 'avg-cost', name: 'Avg Gen Cost', value: round(avgCur), unit: 'Tk/kWh', change: pct(avgCur, avgPrev), prefix: '' });
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
      items.push({ id, name, value: round(c.unitCost), unit: 'Tk/kWh', change: pct(c.unitCost, p?.unitCost ?? 0), prefix: '' });
    }
  }

  // Evening peak generation.
  const peakCur = cur.systemStats?.eveningPeakGen ?? 0;
  const peakPrev = prev?.systemStats?.eveningPeakGen ?? 0;
  if (peakCur > 0) {
    items.push({ id: 'peak-gen', name: 'Evening Peak', value: round(peakCur, 0), unit: 'MW', change: pct(peakCur, peakPrev), prefix: '' });
  }

  // National gas production from the Petrobangla archive index.
  const pbSorted = pbDays
    .filter((d) => typeof d.grand_total_gas_mmcfd === 'number' && d.date)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const pbLast = pbSorted[pbSorted.length - 1];
  const pbPrev = pbSorted[pbSorted.length - 2];
  if (pbLast?.grand_total_gas_mmcfd) {
    items.push({
      id: 'gas-prod',
      name: 'Total Gas Prod',
      value: round(pbLast.grand_total_gas_mmcfd, 1),
      unit: 'MMcfd',
      change: pct(pbLast.grand_total_gas_mmcfd, pbPrev?.grand_total_gas_mmcfd ?? 0),
      prefix: '',
    });
  }

  // USD/BDT — live rate, falling back to the latest published macro figure.
  const fxFallback = macroEconomicData[macroEconomicData.length - 1]?.exchangeRate ?? 0;
  const fx = fxLive ?? fxFallback;
  if (fx > 0) {
    items.push({ id: 'fx', name: 'USD/BDT', value: fx, unit: '', change: 0, prefix: '৳' });
  }

  // Published regulated prices (BERC bulk tariff, BPC retail fuel).
  const tariff = macroTariffData[macroTariffData.length - 1]?.tariff ?? 0;
  if (tariff > 0) {
    items.push({ id: 'tariff', name: 'Bulk Tariff', value: round(tariff), unit: 'Tk/kWh', change: 0, prefix: '' });
  }
  const macro = macroEconomicData[macroEconomicData.length - 1];
  if (macro?.retailDiesel) {
    items.push({ id: 'diesel-bpc', name: 'Diesel (BPC)', value: round(macro.retailDiesel), unit: 'Tk/L', change: 0, prefix: '' });
  }
  if (macro?.retailOctane) {
    items.push({ id: 'octane-bpc', name: 'Octane (BPC)', value: round(macro.retailOctane), unit: 'Tk/L', change: 0, prefix: '' });
  }

  return items.length > 0 ? items : null;
}
