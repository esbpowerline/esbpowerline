/**
 * Parsers for the NLDC hourly pages on PGCB's ERP portal.
 *
 * These are the only official, timestamped, hourly HTML the sector publishes:
 *
 *   - view_generations_bn — one row per hour: total generation and its split
 *     (gas, liquid fuel, coal, hydro, solar, wind) plus the four import lines
 *     (Bheramara HVDC, Tripura, Adani, Nepal). The printed "deficit" column is
 *     junk (always the negated total) and is ignored.
 *   - view_demand_supply_loadshed_bn — one row per hour: demand, supply and
 *     load shed, with "Day Peak" / "Evening Peak" remarks.
 *
 * BPDB's live page (misc.bpdb.gov.bd/area-wise-demand) was evaluated and
 * rejected 2026-08-23: it prints no timestamp for the reading, its totals row
 * is broken, and its zone sum did not reconcile with NLDC supply for the same
 * moment. BPDB's own figures reach the site daily through PGCB's workbook.
 *
 * Dates and digits on both pages are Bangla-script; values must be translated
 * before parsing. Pure functions, no fetching — the fetch lives in
 * live-grid.server.ts and the tests exercise these directly.
 */

const BANGLA_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function banglaToLatinDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => BANGLA_DIGITS[d] ?? d);
}

export type LiveGenerationRow = {
  /** ISO local Dhaka wall-clock, e.g. "2026-08-23T10:00:00" */
  at: string;
  totalMw: number;
  gasMw: number;
  liquidMw: number;
  coalMw: number;
  hydroMw: number;
  solarMw: number;
  windMw: number;
  bheramaraMw: number;
  tripuraMw: number;
  adaniMw: number;
  nepalMw: number;
  loadShedMw: number | null;
  remark: string;
};

export type LiveDemandRow = {
  at: string;
  demandMw: number;
  supplyMw: number;
  loadShedMw: number;
  remark: string;
};

function stripTags(cell: string): string {
  return banglaToLatinDigits(cell.replace(/<[^>]+>/g, ' '))
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tableRows(html: string): string[][] {
  // The generation page ships its deficit and load-shed columns commented out
  // (<!--<td>…</td>-->); a naive td match reads inside the comments and
  // invents two extra cells per row. Strip comments before parsing.
  const clean = html.replace(/<!--[\s\S]*?-->/g, '');
  const rows: string[][] = [];
  for (const tr of clean.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? []) {
    const cells = (tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) ?? []).map(stripTags);
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/**
 * "23-08-2026" + "10:00:00" → "2026-08-23T10:00:00", or null when malformed.
 *
 * Both cells are SEARCHED, not anchored, and the seconds are optional. NLDC
 * made the demand/supply page's time cell responsive between 2026-08-23 and
 * 2026-09-04 — it now prints the hour twice, once per breakpoint:
 *
 *   <td class="text-nowrap">
 *     <span class="time-desktop">১৩:০০:০০</span>
 *     <span class="time-mobile">১৩:০০</span>
 *   </td>
 *
 * `stripTags` flattens that to "13:00:00 13:00", which `^…$` rejects. Every
 * demand row was therefore dropped, and because the generation page was NOT
 * changed, the failure was silent and one-sided: the live layer kept reporting
 * generation while the entire demand/supply half went dark. On 2026-09-04 the
 * site had shown "Current Demand — awaiting NLDC" against a page that was
 * publishing 13,847 MW at that very hour. Matching the first token parses
 * either span, in whichever order the markup lists them.
 */
function toIsoLocal(date: string, time: string): string | null {
  const d = /(\d{2})-(\d{2})-(\d{4})/.exec(date);
  const t = /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(time);
  if (!d || !t) return null;
  return `${d[3]}-${d[2]}-${d[1]}T${t[1].padStart(2, '0')}:${t[2]}:${t[3] ?? '00'}`;
}

const num = (cell: string): number | null => {
  const n = Number(cell.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

export function parseNldcGenerationHtml(html: string): LiveGenerationRow[] {
  const out: LiveGenerationRow[] = [];
  for (const cells of tableRows(html)) {
    // Current layout (deficit + loadshed columns commented out, 14 cells):
    //   date, time, total, gas, liquid, coal, hydro, solar, wind,
    //   bheramara, tripura, adani, nepal, remark
    // If PGCB re-enables the two columns (16 cells), deficit and loadshed sit
    // between total and gas; the deficit column prints the negated total and
    // is discarded either way.
    if (cells.length < 14) continue;
    const at = toIsoLocal(cells[0], cells[1]);
    if (!at) continue;
    const wide = cells.length >= 16;
    const v = cells.slice(2).map(num);
    const total = v[0];
    const loadShed = wide ? v[2] : null;
    const [gas, liquid, coal, hydro, solar, wind, bheramara, tripura, adani, nepal] = v.slice(wide ? 3 : 1);
    if (total === null || gas === null || coal === null) continue;
    out.push({
      at,
      totalMw: total,
      gasMw: gas,
      liquidMw: liquid ?? 0,
      coalMw: coal,
      hydroMw: hydro ?? 0,
      solarMw: solar ?? 0,
      windMw: wind ?? 0,
      bheramaraMw: bheramara ?? 0,
      tripuraMw: tripura ?? 0,
      adaniMw: adani ?? 0,
      nepalMw: nepal ?? 0,
      loadShedMw: loadShed,
      remark: cells[cells.length - 1] ?? '',
    });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export function parseNldcDemandSupplyHtml(html: string): LiveDemandRow[] {
  const out: LiveDemandRow[] = [];
  for (const cells of tableRows(html)) {
    // date, time, demand, supply, loadshed, remark
    if (cells.length < 5) continue;
    const at = toIsoLocal(cells[0], cells[1]);
    if (!at) continue;
    const demand = num(cells[2]);
    const supply = num(cells[3]);
    const loadShed = num(cells[4]);
    if (demand === null || supply === null || loadShed === null) continue;
    out.push({ at, demandMw: demand, supplyMw: supply, loadShedMw: loadShed, remark: cells[5] ?? '' });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export type LiveGridHour = {
  at: string;
  totalMw: number;
  byFuel: { gasMw: number; liquidMw: number; coalMw: number; hydroMw: number; solarMw: number; windMw: number };
  imports: { bheramaraMw: number; tripuraMw: number; adaniMw: number; nepalMw: number; indiaMw: number; totalMw: number };
  demandMw: number | null;
  supplyMw: number | null;
  loadShedMw: number | null;
};

export type LiveGridSnapshot = {
  /** When our server read the pages (ISO UTC). */
  fetchedAt: string;
  /** The newest hour NLDC has posted (Dhaka wall-clock, ISO local). */
  asOf: string;
  latest: LiveGridHour;
  /**
   * Extremes across the newest day's rows, as posted so far.
   *
   * Every field is nullable because all five come from the demand/supply page
   * alone, and that page can be absent, unparseable or newly re-laid-out while
   * the generation page keeps working. They used to fall back to the generation
   * total — `maxDemandMw: byDemand?.demandMw ?? latest.demandMw ?? latest.totalMw`
   * — which is a different quantity under the same label: on 2026-09-04 that
   * substitution would have printed the day's peak demand as 13,864 MW when
   * NLDC's own demand column said 14,937 MW, understating it by 1,073 MW. Load
   * shed was worse: `Math.max(0, ...[])` returned 0, asserting that no load was
   * shed on a day nobody had measured. Absent is absent (CLAUDE.md rules 1-2).
   */
  today: {
    date: string;
    maxSupplyMw: number | null;
    maxSupplyAt: string | null;
    maxDemandMw: number | null;
    maxDemandAt: string | null;
    maxLoadShedMw: number | null;
  };
  /**
   * The last 24 POSTED rows, oldest first, for sparklines -- not 24 hours.
   * NLDC drops an hour from the page now and then (00:00 was missing on
   * 2026-08-24), so this window can span more wall-clock than it has rows.
   * Fine for a sparkline; do not average it and call the result daily.
   */
  hours: LiveGridHour[];
  /** |total − sum of components| ≤ 1 MW on the latest row. */
  reconciles: boolean;
  sources: { generation: string; demandSupply: string };
};

export function buildLiveGridSnapshot(
  gen: LiveGenerationRow[],
  demand: LiveDemandRow[],
  opts: { fetchedAt: string; generationUrl: string; demandSupplyUrl: string },
): LiveGridSnapshot {
  if (gen.length === 0) throw new Error('NLDC generation page yielded no hourly rows');

  const demandByAt = new Map(demand.map((r) => [r.at, r]));
  const hours: LiveGridHour[] = gen.slice(-24).map((g) => {
    const d = demandByAt.get(g.at) ?? null;
    const indiaMw = g.bheramaraMw + g.tripuraMw + g.adaniMw;
    return {
      at: g.at,
      totalMw: g.totalMw,
      byFuel: {
        gasMw: g.gasMw, liquidMw: g.liquidMw, coalMw: g.coalMw,
        hydroMw: g.hydroMw, solarMw: g.solarMw, windMw: g.windMw,
      },
      imports: {
        bheramaraMw: g.bheramaraMw, tripuraMw: g.tripuraMw, adaniMw: g.adaniMw,
        nepalMw: g.nepalMw, indiaMw, totalMw: indiaMw + g.nepalMw,
      },
      demandMw: d?.demandMw ?? null,
      supplyMw: d?.supplyMw ?? null,
      loadShedMw: d?.loadShedMw ?? g.loadShedMw,
    };
  });

  const latest = hours[hours.length - 1];
  const f = latest.byFuel;
  const componentSum =
    f.gasMw + f.liquidMw + f.coalMw + f.hydroMw + f.solarMw + f.windMw + latest.imports.totalMw;

  const date = latest.at.slice(0, 10);
  const todayDemand = demand.filter((r) => r.at.startsWith(date));
  const bySupply = [...todayDemand].sort((a, b) => a.supplyMw - b.supplyMw).pop();
  const byDemand = [...todayDemand].sort((a, b) => a.demandMw - b.demandMw).pop();

  return {
    fetchedAt: opts.fetchedAt,
    asOf: latest.at,
    latest,
    today: {
      date,
      // No generation-side fallback. Supply, demand and load shed are the
      // demand/supply page's quantities; the generation total is not a stand-in
      // for any of them (it read 13,864 MW against 13,460 MW supplied and
      // 14,937 MW demanded on 2026-09-04). A caller that gets null renders a
      // dash and names NLDC, which is what the tiles already do.
      maxSupplyMw: bySupply?.supplyMw ?? null,
      maxSupplyAt: bySupply?.at ?? null,
      maxDemandMw: byDemand?.demandMw ?? null,
      maxDemandAt: byDemand?.at ?? null,
      maxLoadShedMw: todayDemand.length
        ? Math.max(...todayDemand.map((r) => r.loadShedMw))
        : null,
    },
    hours,
    reconciles: Math.abs(latest.totalMw - componentSum) <= 1,
    sources: { generation: opts.generationUrl, demandSupply: opts.demandSupplyUrl },
  };
}
