import 'server-only';

import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { ADMINISTERED_PRICES } from '@/lib/data/tariff/administered-prices';

/**
 * The commodities strip: actual energy commodities and their prices.
 * Only energy commodities (fuels, gas, coal) and pricing — no references,
 * legal instruments or utility voltage tariffs.
 *
 * Every figure comes from `administered-prices.ts`, which names the gazette or
 * notification that set it. Until 2026-09-30 these were read from a hand-typed
 * yearly table and a literal CNG value, citing nothing.
 */

export async function getLiveTickerItems(): Promise<TickerItem[] | null> {
  const items: TickerItem[] = ADMINISTERED_PRICES.map((p) => ({
    id: p.id,
    name: p.name,
    value: p.value,
    unit: p.unit,
    // An administered price has no daily delta; null, never a flat 0.
    change: null,
    prefix: '',
    // No `source` on the item: the strip carries prices without reference
    // clutter (29 Sep 2026). The citation lives on the price record.
  }));
  return items.length > 0 ? items : null;
}
