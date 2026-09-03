import 'server-only';

import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { macroTariffData } from '@/lib/data/macro/tariff';
import { macroEconomicData } from '@/lib/data/macro/economics';

/**
 * The commodities strip: things bought and sold at a rate somebody official set.
 *
 * It carries gazetted prices and nothing else — a rate the state buys at, or
 * one a household pays at the pump. Two rounds of the wrong thing were in here
 * before.
 *
 * First, "Avg Gen Cost" and five per-fuel "Gen Cost" entries, none of which any
 * body publishes: `avgProductionCost` is the day's bill divided by its energy
 * (the parser computes it and never reads P1's printed rate), and each per-fuel
 * `unitCost` is that fuel's cost over its generation. The Grid Explorer's own
 * briefing says so outright — "the per-fuel rates below are not published
 * tariffs" — while the site chrome quoted them on every page under a heading
 * reading COMMODITIES. The import figure was the sharpest of them: a blended
 * settlement number standing beside BPC's gazetted diesel price as though the
 * two were the same kind of thing.
 *
 * Then PGCB's and Petrobangla's published operating figures — evening peak
 * generation and demand, energy generated, energy unserved, the production-cost
 * total, national gas production. All official, all correct, and not one of them
 * a commodity or a price. They belong to the Grid Explorer and the homepage
 * snapshot, which both carry them; they were in this strip only because it had
 * to be filled with something.
 *
 * Each price states the date its order took effect. A regulated price is the
 * price until the next order, not a quote for today, and it carries no daily
 * delta — a 0 there rendered as a green "▲ 0%" badge, which claims the price was
 * measured today and found unchanged.
 *
 * No I/O at all now: no exchange-rate fetch, no daily report, no GAS_DAILY
 * release read. That last one had already been cut from 1.19 MB to two payloads
 * in the cost pass; the strip no longer reads Postgres from the public layout
 * on any request.
 */

const round = (v: number, d = 2) => Number(v.toFixed(d));

export async function getLiveTickerItems(): Promise<TickerItem[] | null> {
  const items: TickerItem[] = [];

  const tariffRow = macroTariffData[macroTariffData.length - 1];
  if (tariffRow?.tariff) {
    items.push({
      id: 'tariff',
      name: 'Bulk Electricity',
      value: round(tariffRow.tariff),
      unit: 'Tk/kWh',
      change: null,
      prefix: '',
      source: `BERC · ${tariffRow.year}`,
    });
  }

  // BPC's administered retail prices. The dataset holds one row per year, so
  // the year is the only effective date that can honestly be stated for them —
  // a fuel price set by notification in March should not be dated "today".
  const macro = macroEconomicData[macroEconomicData.length - 1];
  if (macro?.retailDiesel) {
    items.push({
      id: 'diesel-bpc',
      name: 'Diesel',
      value: round(macro.retailDiesel),
      unit: 'Tk/L',
      change: null,
      prefix: '',
      source: `BPC · ${macro.year}`,
    });
  }
  if (macro?.retailOctane) {
    items.push({
      id: 'octane-bpc',
      name: 'Octane',
      value: round(macro.retailOctane),
      unit: 'Tk/L',
      change: null,
      prefix: '',
      source: `BPC · ${macro.year}`,
    });
  }

  // An empty strip is the correct output when nothing is quotable: the ticker
  // renders no bar at all rather than a COMMODITIES heading over an empty
  // track, which would claim a feed that is not there.
  return items.length > 0 ? items : null;
}
