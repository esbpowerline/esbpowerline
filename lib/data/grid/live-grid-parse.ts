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

/**
 * One posted hour of the generation table.
 *
 * Most columns are nullable because NLDC uses TWO different empty cells and
 * means different things by them: a literal `0` is a measured zero, and an
 * empty cell is "not reported". The same 2015 row prints `0` for Tripura and
 * nothing at all for Adani — two different cells on one row, so the source is
 * distinguishing them deliberately. What the blank means is NLDC's to say; this
 * file only records that it said nothing.
 *
 * The parser used to collapse both to `0` (`adaniMw: adani ?? 0`). Measured
 * against 3,381 preserved documents, that put a figure into 84,895 canonical
 * observations for Adani, 86,880 for Nepal, 73,572 for wind and 21,897 for
 * solar where the source printed none — a claim no source made. Why NLDC left
 * the column blank is not established here and is not this file's business. `gas`, `liquid`, `coal`, `hydro`, `bheramara` and
 * `tripura` are never blank in the held evidence, but they are typed the same
 * way: whether a column is reported is the source's decision to change, not a
 * property to hard-code here.
 */
export type LiveGenerationRow = {
  /** ISO local Dhaka wall-clock, e.g. "2026-08-23T10:00:00" */
  at: string;
  totalMw: number;
  gasMw: number;
  coalMw: number;
  liquidMw: number | null;
  hydroMw: number | null;
  solarMw: number | null;
  windMw: number | null;
  bheramaraMw: number | null;
  tripuraMw: number | null;
  adaniMw: number | null;
  nepalMw: number | null;
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

/**
 * A printed figure, or null where the cell carries none.
 *
 * The empty check is load-bearing and easy to lose: `Number('')` is `0`, and
 * `0` is finite, so an empty cell used to pass straight through this function
 * as a measured zero. That — not the `?? 0` further down — was the deeper half
 * of how the archive came to assert that Adani generated 0 MW in 2015. NLDC
 * distinguishes the two cases itself, printing a literal `0` for a measured
 * zero and nothing at all for a column it is not reporting, so both layers had
 * to stop collapsing them.
 *
 * `-`, `—` and `n/a` are treated the same way: a placeholder is not a figure.
 */
const num = (cell: string): number | null => {
  const t = cell.replace(/,/g, '').trim();
  if (t === '' || /^(?:[-–—.]+|n\/?a)$/i.test(t)) return null;
  const n = Number(t);
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
      // No `?? 0` here. A blank cell is not a zero — see LiveGenerationRow.
      liquidMw: liquid,
      coalMw: coal,
      hydroMw: hydro,
      solarMw: solar,
      windMw: wind,
      bheramaraMw: bheramara,
      tripuraMw: tripura,
      adaniMw: adani,
      nepalMw: nepal,
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

/**
 * PGCB's two cross-border import pages, which the generation table does not
 * replace.
 *
 * Every actual on these pages already appears on `view_generations_bn`, and was
 * checked column by column against it on 2026-09-07 — identical for all 51
 * hours on both pages. So these are NOT ingested for the actuals. They are
 * ingested for the one figure that appears nowhere else in this archive: NLDC's
 * hourly **forecast** (পূর্বাভাস) for each interconnector, printed beside the
 * actual (প্রকৃত) it is to be read against.
 *
 * Storing the actual anyway is deliberate and cheap. Two PGCB pages stating the
 * same MW for the same hour is an independent check of a figure the site
 * prints, of exactly the kind that has caught every real defect in this repo —
 * a number verified against something else that should agree with it, rather
 * than against the parser that produced it.
 *
 * Rule 6 of the data doctrine governs what may be done with the pair: the
 * forecast and the actual may be shown side by side and subtracted, and that
 * signed difference is all. No accuracy percentage, no scoring, no grading.
 * PGCB does not control the interconnector on the far side of the border.
 */
export type LiveIndiaImportRow = {
  at: string;
  bheramaraMw: number | null;
  bheramaraForecastMw: number | null;
  tripuraMw: number | null;
  tripuraForecastMw: number | null;
  adaniMw: number | null;
  adaniForecastMw: number | null;
};

export type LiveNepalImportRow = {
  at: string;
  nepalMw: number | null;
  nepalForecastMw: number | null;
};

/**
 * `imported_power_india_bn` — 8 cells:
 *   date, time, bheramara actual, bheramara forecast, tripura actual,
 *   tripura forecast, adani actual, adani forecast
 *
 * The header is two <tr>s deep (the interconnector names carry colspan=2 over a
 * প্রকৃত/পূর্বাভাস pair), and neither parses as a date, so `toIsoLocal` drops
 * both without a cell-count rule that would break when PGCB adds a fourth
 * interconnector. A row is kept on its timestamp alone: every figure here is
 * nullable, because an interconnector PGCB is not reporting this hour must read
 * absent and never 0 MW — 0 is a claim that the line was up and carrying
 * nothing, which is a real and different operating state.
 */
export function parseNldcIndiaImportHtml(html: string): LiveIndiaImportRow[] {
  const out: LiveIndiaImportRow[] = [];
  for (const cells of tableRows(html)) {
    if (cells.length < 8) continue;
    const at = toIsoLocal(cells[0], cells[1]);
    if (!at) continue;
    out.push({
      at,
      bheramaraMw: num(cells[2]),
      bheramaraForecastMw: num(cells[3]),
      tripuraMw: num(cells[4]),
      tripuraForecastMw: num(cells[5]),
      adaniMw: num(cells[6]),
      adaniForecastMw: num(cells[7]),
    });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * `imported_power_nepal_bn` — 4 cells: date, time, actual, forecast.
 *
 * Nepal prints a literal ০ for most hours rather than leaving the cell blank,
 * and that zero is kept as a zero: NLDC is stating the line carried nothing,
 * which is a measurement. `num` already separates it from an empty cell.
 */
export function parseNldcNepalImportHtml(html: string): LiveNepalImportRow[] {
  const out: LiveNepalImportRow[] = [];
  for (const cells of tableRows(html)) {
    if (cells.length < 4) continue;
    const at = toIsoLocal(cells[0], cells[1]);
    if (!at) continue;
    out.push({ at, nepalMw: num(cells[2]), nepalForecastMw: num(cells[3]) });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * PGCB's forecast board — `w/forecasts/show_forecasts_bn`.
 *
 * The little table pgcb.gov.bd embeds in its homepage, four kilobytes of static
 * HTML on the same ERP host as the hourly pages. It carries two rows the site
 * has no other same-morning source for:
 *
 *   আজকের চাহিদার পূর্বাভাস   today's demand forecast, day and evening peak
 *   গতকালের প্রকৃত উৎপাদন     yesterday's actual generation, day and evening
 *
 * Rows are matched on their Bengali label, never on position. A third row —
 * উৎপাদন ক্ষমতা, generation capacity — sits in the markup COMMENTED OUT, so
 * the row count is not stable and an index-based read would silently take
 * capacity for a forecast the day PGCB uncomments it. `tableRows` strips
 * comments before parsing, which is what keeps that row out entirely; the label
 * match is the second guard.
 *
 * The page states its own date, and that date is read rather than assumed —
 * `তারিখঃ ০৮-০৯-২০২৬`. It is the only thing that says which day the forecast
 * is FOR, and therefore which day "yesterday" was. Taking the reader's clock
 * for it would repeat the Petrobangla filing mistake in a new place: a document
 * says which day it is, never the caller.
 */
export type PgcbForecastBoard = {
  /** The date the page states for itself, ISO. The forecast is for this day. */
  date: string;
  /** The day BEFORE `date` — whose actual generation the second row carries. */
  previousDate: string;
  forecastDemand: { dayPeakMw: number | null; eveningPeakMw: number | null };
  previousGeneration: { dayPeakMw: number | null; eveningPeakMw: number | null };
};

function shiftIsoDay(iso: string, days: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

export function parsePgcbForecastHtml(html: string): PgcbForecastBoard | null {
  const text = banglaToLatinDigits(html.replace(/<!--[\s\S]*?-->/g, ''));
  const d = /(\d{2})-(\d{2})-(\d{4})/.exec(text);
  if (!d) return null;
  const date = `${d[3]}-${d[2]}-${d[1]}`;
  if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return null;

  let forecast: { dayPeakMw: number | null; eveningPeakMw: number | null } | null = null;
  let previous: { dayPeakMw: number | null; eveningPeakMw: number | null } | null = null;

  for (const cells of tableRows(html)) {
    if (cells.length < 3) continue;
    const label = cells[0];
    const pair = { dayPeakMw: num(cells[1]), eveningPeakMw: num(cells[2]) };
    // পূর্বাভাস = forecast, প্রকৃত = actual. Both appear once.
    if (label.includes('পূর্বাভাস')) forecast ??= pair;
    else if (label.includes('প্রকৃত')) previous ??= pair;
  }
  if (!forecast && !previous) return null;

  const none = { dayPeakMw: null, eveningPeakMw: null };
  return {
    date,
    previousDate: shiftIsoDay(date, -1),
    forecastDemand: forecast ?? none,
    previousGeneration: previous ?? none,
  };
}

/**
 * Sum of the components the source actually reported, or null when it reported
 * none of them.
 *
 * A total over partly-reported components is a DERIVED figure and any surface
 * printing it has to say so. What it must never be is a fabricated zero: before
 * the Adani interconnector existed NLDC left that column blank, and adding it in
 * as 0 would silently assert an import total the source never stated.
 */
function sumReported(...vals: Array<number | null>): number | null {
  const present = vals.filter((v): v is number => v !== null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

export type LiveGridHour = {
  at: string;
  totalMw: number;
  /** Nullable throughout — a blank cell is "not reported", never zero. */
  byFuel: {
    gasMw: number;
    coalMw: number;
    liquidMw: number | null;
    hydroMw: number | null;
    solarMw: number | null;
    windMw: number | null;
  };
  /** The four interconnectors as reported; `indiaMw` and `totalMw` are DERIVED
   *  sums over whichever of them the source printed. */
  imports: {
    bheramaraMw: number | null;
    tripuraMw: number | null;
    adaniMw: number | null;
    nepalMw: number | null;
    indiaMw: number | null;
    totalMw: number | null;
  };
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
    /**
     * The day's highest generation total, from the generation page.
     *
     * Kept apart from `maxSupplyMw` deliberately. Generation dispatched and
     * supply delivered are different quantities measured on different pages,
     * and on 2026-09-04 they differed by 404 MW; the snapshot has already been
     * burned once by treating one as a stand-in for the other. This is the
     * generation page's own maximum and nothing else's.
     */
    maxGenerationMw: number | null;
    maxGenerationAt: string | null;
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
  /**
   * The sum of the components the latest row reported, or null when it
   * reported none. Sent beside `reconciles` so a reader can be told HOW FAR
   * NLDC's row is from its own total, not just that it is: on 2026-09-13 the
   * 11:00 row printed 14,854 MW against parts summing to 14,584, and the panel
   * could only say the row was wrong, by hiding it.
   */
  componentSumMw: number | null;
  /**
   * PGCB's forecast board, or null when that page could not be read.
   *
   * Optional on purpose, and fetched with its own catch. It is a different page
   * on a daily cadence, and the hourly snapshot must not depend on it: a
   * failure there would otherwise take down ten tiles that have nothing to do
   * with it. Absent means absent — the two tiles it backs say so and name PGCB.
   */
  forecast: PgcbForecastBoard | null;
  sources: { generation: string; demandSupply: string; forecast?: string };
};

export function buildLiveGridSnapshot(
  gen: LiveGenerationRow[],
  demand: LiveDemandRow[],
  opts: {
    fetchedAt: string;
    generationUrl: string;
    demandSupplyUrl: string;
    forecast?: PgcbForecastBoard | null;
    forecastUrl?: string;
  },
): LiveGridSnapshot {
  if (gen.length === 0) throw new Error('NLDC generation page yielded no hourly rows');

  const demandByAt = new Map(demand.map((r) => [r.at, r]));
  const hours: LiveGridHour[] = gen.slice(-24).map((g) => {
    const d = demandByAt.get(g.at) ?? null;
    const indiaMw = sumReported(g.bheramaraMw, g.tripuraMw, g.adaniMw);
    return {
      at: g.at,
      totalMw: g.totalMw,
      byFuel: {
        gasMw: g.gasMw, liquidMw: g.liquidMw, coalMw: g.coalMw,
        hydroMw: g.hydroMw, solarMw: g.solarMw, windMw: g.windMw,
      },
      imports: {
        bheramaraMw: g.bheramaraMw, tripuraMw: g.tripuraMw, adaniMw: g.adaniMw,
        nepalMw: g.nepalMw, indiaMw, totalMw: sumReported(indiaMw, g.nepalMw),
      },
      demandMw: d?.demandMw ?? null,
      supplyMw: d?.supplyMw ?? null,
      loadShedMw: d?.loadShedMw ?? g.loadShedMw,
    };
  });

  const latest = hours[hours.length - 1];
  const f = latest.byFuel;
  // Reconciliation runs over the components the source REPORTED. A column NLDC
  // left blank contributes nothing to its own printed total either, so omitting
  // it is right; inventing a 0 for it would be the thing this file exists to
  // prevent. If nothing at all was reported there is no sum to compare, and the
  // hour is simply not reconcilable.
  const componentSum = sumReported(
    f.gasMw, f.liquidMw, f.coalMw, f.hydroMw, f.solarMw, f.windMw, latest.imports.totalMw,
  );

  const date = latest.at.slice(0, 10);
  const todayDemand = demand.filter((r) => r.at.startsWith(date));
  const todayGen = gen.filter((r) => r.at.startsWith(date));
  const byGeneration = [...todayGen].sort((a, b) => a.totalMw - b.totalMw).pop();
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
      maxGenerationMw: byGeneration?.totalMw ?? null,
      maxGenerationAt: byGeneration?.at ?? null,
    },
    hours,
    reconciles: componentSum !== null && Math.abs(latest.totalMw - componentSum) <= 1,
    componentSumMw: componentSum,
    forecast: opts.forecast ?? null,
    sources: {
      generation: opts.generationUrl,
      demandSupply: opts.demandSupplyUrl,
      ...(opts.forecastUrl ? { forecast: opts.forecastUrl } : {}),
    },
  };
}
