import 'server-only';

import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { macroEconomicData } from '@/lib/data/macro/economics';

/**
 * The commodities strip: actual energy commodities and their prices.
 * Only energy commodities (fuels, gas, coal) and pricing — no references,
 * legal instruments or utility voltage tariffs.
 */

const round = (v: number, d = 2) => Number(v.toFixed(d));

export async function getLiveTickerItems(): Promise<TickerItem[] | null> {
  const items: TickerItem[] = [];

  const macro = macroEconomicData[macroEconomicData.length - 1];

  // Government administered petroleum fuel prices
  if (macro?.retailOctane) {
    items.push({
      id: 'octane-bpc',
      name: 'Octane',
      value: round(macro.retailOctane),
      unit: 'Tk/L',
      change: null,
      prefix: '',
    });
  }
  if (macro?.retailPetrol) {
    items.push({
      id: 'petrol-bpc',
      name: 'Petrol',
      value: round(macro.retailPetrol),
      unit: 'Tk/L',
      change: null,
      prefix: '',
    });
  }
  if (macro?.retailDiesel) {
    items.push({
      id: 'diesel-bpc',
      name: 'Diesel',
      value: round(macro.retailDiesel),
      unit: 'Tk/L',
      change: null,
      prefix: '',
    });
  }
  if (macro?.retailKerosene) {
    items.push({
      id: 'kerosene-bpc',
      name: 'Kerosene',
      value: round(macro.retailKerosene),
      unit: 'Tk/L',
      change: null,
      prefix: '',
    });
  }

  // Administered gas tariff
  items.push({
    id: 'cng-berc',
    name: 'CNG',
    value: 43.00,
    unit: 'Tk/m³',
    change: null,
    prefix: '',
  });

  // Global energy commodities
  if (macro?.spotLng) {
    items.push({
      id: 'spot-lng',
      name: 'Spot LNG',
      value: macro.spotLng,
      decimals: 2,
      unit: '/MMBtu',
      change: null,
      prefix: '$',
    });
  }
  if (macro?.importCoal) {
    items.push({
      id: 'import-coal',
      name: 'Import Coal',
      value: macro.importCoal,
      decimals: 0,
      unit: '/t',
      change: null,
      prefix: '$',
    });
  }

  return items.length > 0 ? items : null;
}
