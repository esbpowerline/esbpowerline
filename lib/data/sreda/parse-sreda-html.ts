import type {
  SredaCarbonRow,
  SredaDailyData,
  SredaGenerationMixRow,
  SredaOrganisationRow,
  SredaOrganisationTable,
  SredaReconciliation,
  SredaProjectRegister,
  SredaProjectRow,
  SredaRenewableTechRow,
  SredaTechnologyRow,
  SredaYearRow,
  SredaYearTable,
} from '@/lib/data/sreda/types';

/** Only these projects are installed capacity. The rest are pipeline or retired. */
export const SREDA_STATUS_RUNNING = 'Completed & Running';

const LAST_UPDATE_RE = /Last Update:\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/i;
const RE_CAPACITY_HEADLINE_RE =
  /Renewable Energy Installed Capacity:[\s\S]*?<strong>([\d,.]+)\s*MW<\/strong>/i;
const RE_MIX_HEADLINE_RE =
  /Electricity Generation Mix:[\s\S]*?<strong>RE\s+([\d,.]+)\s*%<\/strong>/i;

function parseNumber(raw: string): number {
  return parseFloat(raw.replace(/,/g, '').trim());
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function parseLastUpdate(html: string): { date: string; lastUpdate: string } | null {
  const match = html.match(LAST_UPDATE_RE);
  if (!match) return null;
  const lastUpdate = match[1].trim();
  const date = lastUpdate.slice(0, 10);
  return { date, lastUpdate };
}

function parseRenewableCapacityTable(html: string): SredaRenewableTechRow[] {
  const tableMatch = html.match(
    /Techlology[\s\S]*?Off-grid \(MW\)[\s\S]*?On-grid \(MW\)[\s\S]*?Total \(MW\)[\s\S]*?<\/tr>([\s\S]*?)<\/table>/i,
  );
  if (!tableMatch) return [];

  const rows: SredaRenewableTechRow[] = [];
  const rowRegex = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(tableMatch[1])) !== null) {
    const tech = stripTags(match[1]);
    if (!tech || tech.toLowerCase() === 'total') continue;
    rows.push({
      tech,
      offGridMw: parseNumber(match[2]),
      onGridMw: parseNumber(match[3]),
      totalMw: parseNumber(match[4]),
    });
  }
  return rows;
}

function parseGenerationMixTable(html: string): {
  generationMix: SredaGenerationMixRow[];
  totalInstalledMw: number;
} {
  const tableMatch = html.match(
    /Fuel\/Resource<\/th>[\s\S]*?Installed Capacity[\s\S]*?Share[\s\S]*?<\/tr>([\s\S]*?)<\/table>/i,
  );
  if (!tableMatch) {
    return { generationMix: [], totalInstalledMw: 0 };
  }

  const generationMix: SredaGenerationMixRow[] = [];
  let totalInstalledMw = 0;

  const rowRegex = /<tr><td>([^<]+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(tableMatch[1])) !== null) {
    const fuel = stripTags(match[1]);
    const capacityRaw = stripTags(match[2]);
    const shareRaw = stripTags(match[3]);
    const capacityMw = parseNumber(capacityRaw.replace(/\s*MW\s*$/i, ''));
    const sharePct = parseNumber(shareRaw.replace(/%/g, ''));
    generationMix.push({ fuel, capacityMw, sharePct });
  }

  const totalMatch = tableMatch[1].match(/<strong>([\d,.]+)\s*MW<\/strong>/i);
  if (totalMatch) {
    totalInstalledMw = parseNumber(totalMatch[1]);
  } else if (generationMix.length > 0) {
    totalInstalledMw = generationMix.reduce((sum, row) => sum + row.capacityMw, 0);
  }

  return { generationMix, totalInstalledMw };
}

function parseChartRenewables(html: string): SredaRenewableTechRow[] {
  const chartMatch = html.match(/\['Technology',\s*'MW'\],([\s\S]*?)\]\)/i);
  if (!chartMatch) return [];

  const rows: SredaRenewableTechRow[] = [];
  const entryRegex = /\['([^']+)',\s*([\d.]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(chartMatch[1])) !== null) {
    const totalMw = parseNumber(match[2]);
    rows.push({
      tech: match[1],
      offGridMw: 0,
      onGridMw: totalMw,
      totalMw,
    });
  }
  return rows;
}

/** Cell text with tags, entities and non-breaking spaces removed. */
function cellText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function tableRows(html: string): string[][] {
  const out: string[][] = [];
  for (const table of html.match(/<table[\s\S]*?<\/table>/gi) ?? []) {
    for (const tr of table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
      const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => cellText(m[1]));
      if (cells.some((c) => c.length > 0)) out.push(cells);
    }
  }
  return out;
}

/**
 * "594.65 MWp" / "292.08 kWp" -> MWp.
 *
 * SREDA switches unit mid-column — the solar-irrigation table prints MWp for
 * IDCOL and kWp for BARI in the same column — so a parser that strips the unit
 * and keeps the number overstates the small operators by a thousandfold.
 */
function capacityToMwp(raw: string): number | null {
  const m = raw.match(/([\d,.]+)\s*(MWp|kWp|MW|kW)\b/i);
  if (!m) {
    const bare = parseFloat(raw.replace(/,/g, ''));
    return Number.isFinite(bare) ? bare : null;
  }
  const value = parseNumber(m[1]);
  if (!Number.isFinite(value)) return null;
  return /^k/i.test(m[2]) ? value / 1000 : value;
}

function parseCount(raw: string): number {
  const n = parseInt(raw.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * "Technology wise Generation" (index.php?id=8).
 *
 * The RE Source cell is printed only on the first technology of each group and
 * left out of the rows beneath it, so a row is 7 cells when it opens a group
 * and 5 when it continues one. Reading fixed positions therefore shifts every
 * continuation row by two columns; the source is carried down instead.
 */
export function parseSredaTechnologyHtml(html: string): {
  technologyBreakdown: SredaTechnologyRow[];
  technologyTotals: SredaDailyData['technologyTotals'];
} {
  const breakdown: SredaTechnologyRow[] = [];
  let totals: SredaDailyData['technologyTotals'] = null;
  let currentSource = '';

  for (const cells of tableRows(html)) {
    if (cells.length > 7 || cells.join(' ').length > 400) continue; // organisation picker
    const first = cells[0] ?? '';

    if (/^total$/i.test(first) && cells.length >= 5) {
      const tail = cells.slice(-4);
      totals = {
        quantity: parseCount(tail[0]),
        offGridMwp: parseNumber(tail[1]),
        onGridMwp: parseNumber(tail[2]),
        totalMwp: parseNumber(tail[3]),
      };
      continue;
    }

    // A group-opening row leads with "1." and then names the source.
    let rest = cells;
    if (/^\d+\.$/.test(first) && cells.length >= 7) {
      currentSource = cells[1];
      rest = cells.slice(2);
    }
    if (rest.length < 5) continue;

    const [technology, quantity, off, on, total] = rest.slice(0, 5);
    const numbers = [quantity, off, on, total];
    if (!numbers.every((n) => /^[\d,.]+$/.test(n))) continue;

    breakdown.push({
      source: currentSource || 'Unknown',
      technology,
      quantity: parseCount(quantity),
      offGridMwp: parseNumber(off),
      onGridMwp: parseNumber(on),
      totalMwp: parseNumber(total),
    });
  }

  return { technologyBreakdown: breakdown, technologyTotals: totals };
}

/** An organisation-wise statistics page (index.php?id=15/16/17). */
export function parseSredaOrganisationHtml(
  html: string,
  category: string,
  sourceUrl: string,
): SredaOrganisationTable | null {
  const rows: SredaOrganisationRow[] = [];
  let publishedTotalMwp: number | null = null;
  let publishedTotalQuantity: number | null = null;
  let publishedTotalCapacity: string | null = null;

  for (const cells of tableRows(html)) {
    if (cells.length < 3 || cells.join(' ').length > 400) continue;
    const [name, qty, cap] = cells;
    if (/^organi[sz]ation$/i.test(name)) continue;
    const capacity = capacityToMwp(cap);
    if (capacity === null || !/^[\d,]+$/.test(qty.trim())) continue;

    if (/^total$/i.test(name)) {
      publishedTotalMwp = capacity;
      publishedTotalQuantity = parseCount(qty);
      publishedTotalCapacity = cap.trim();
      continue;
    }
    rows.push({
      organisation: name,
      quantity: parseCount(qty),
      capacityMwp: capacity,
      capacityPublished: cap.trim(),
    });
  }

  if (rows.length === 0) return null;
  return {
    category,
    sourceUrl,
    rows,
    publishedTotalMwp,
    publishedTotalQuantity,
    publishedTotalCapacity,
  };
}

/**
 * A year-wise commissioning table (index.php?id=11 large, id=12 small).
 *
 * Large-project rows are `year | capacity`; small-project rows are
 * `year | quantity | capacity`. Both are handled by reading the capacity from
 * the last cell and the quantity only when a third column is present, so
 * neither shape needs a fixed offset.
 */
export function parseSredaYearWiseHtml(
  html: string,
  category: string,
  sourceUrl: string,
): SredaYearTable | null {
  const rows: SredaYearRow[] = [];
  let publishedTotalMwp: number | null = null;
  let publishedTotalQuantity: number | null = null;
  let publishedTotalUnit: string | null = null;
  let publishedTotalCapacity: string | null = null;

  for (const cells of tableRows(html)) {
    if (cells.length < 2 || cells.length > 3 || cells.join(' ').length > 380) continue;
    const year = cells[0].trim();
    const capacityCell = cells[cells.length - 1];
    const capacity = capacityToMwp(capacityCell);
    if (capacity === null) continue;
    const quantity = cells.length === 3 ? parseCount(cells[1]) : null;

    if (/^total$/i.test(year)) {
      publishedTotalMwp = capacity;
      publishedTotalQuantity = quantity;
      publishedTotalUnit = capacityCell.match(/(MWp|kWp|MW|kW)\b/i)?.[1] ?? null;
      publishedTotalCapacity = capacityCell.trim();
      continue;
    }
    if (!/^\d{1,4}$/.test(year)) continue;

    rows.push({
      year,
      quantity,
      capacityMwp: capacity,
      capacityPublished: capacityCell.trim(),
      // "0000" and "0021" appear in SREDA's own large-project table. They are
      // kept, because their capacity is inside SREDA's total, but they are
      // marked so nothing plots them on a time axis as if they were years.
      yearMalformed: !/^(19|20)\d{2}$/.test(year),
    });
  }

  if (rows.length === 0) return null;
  return {
    category,
    sourceUrl,
    rows,
    publishedTotalMwp,
    publishedTotalQuantity,
    publishedTotalUnit,
    publishedTotalCapacity,
  };
}

/** Projects per page in the register. The view is paginated, not capped. */
export const SREDA_REGISTER_PAGE_SIZE = 30;

/**
 * The headline each register view prints above its table, e.g.
 * "All Wind Projects | System: 15, Capacity: 779.9 MWp".
 *
 * It counts and sums **every** project in the view, at every life stage, so it
 * is the control total for the register as a whole — not for installed
 * capacity. It is the only published figure that can confirm the row set was
 * read completely, which matters because the view is paginated.
 */
export function parseSredaRegisterHeadline(
  html: string,
): { systemCount: number; capacityMwp: number; capacityPublished: string } | null {
  const m = html.match(/System:\s*([\d,]+)\s*,\s*Capacity:\s*([\d,.]+)\s*(MWp|kWp|MW|kW)/i);
  if (!m) return null;
  const capacity = capacityToMwp(`${m[2]} ${m[3]}`);
  if (capacity === null) return null;
  return {
    systemCount: parseCount(m[1]),
    capacityMwp: capacity,
    capacityPublished: `${m[2]} ${m[3]}`,
  };
}

/** True when the page offers a link to the next page of the register. */
export function sredaRegisterHasNextPage(html: string, nextPage: number): boolean {
  return new RegExp(`pg=${nextPage}["'&]`).test(html);
}

/**
 * Rows of the RE Large Projects register (index.php?id=1[&i=N][&pg=N]).
 *
 * Columns are
 * `SL. | Project Name | SID | Capacity | Location | RE Technology | Agency |
 *  Finance LMFD | Completion Date | Present Status | Details`
 * and a row is identified by a numeric first cell, so header rows and the
 * trailing Details link fall away without a fixed offset.
 *
 * Agency and financier are printed as abbreviations wrapped in `<abbr title>`
 * carrying the full name — "NWPGCL" is titled "North-West Power Generation
 * Company Limited". Stripping tags before reading the cell throws that away, so
 * the raw cell HTML is kept and the title read from it.
 */
export function parseSredaProjectRegisterRows(html: string): SredaProjectRow[] {
  const rows: SredaProjectRow[] = [];
  for (const table of html.match(/<table[\s\S]*?<\/table>/gi) ?? []) {
    for (const tr of table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
      const raw = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => m[1]);
      if (raw.length < 10) continue;
      const cells = raw.map(cellText);
      if (!/^\d+$/.test(cells[0].trim())) continue;
      const capacity = capacityToMwp(cells[3]);
      if (capacity === null) continue;
      const title = (i: number) => {
        const m = raw[i].match(/title=['"]([^'"]+)['"]/i);
        return m ? H_unescape(m[1]).trim() : null;
      };
      rows.push({
        projectName: cells[1],
        sid: cells[2],
        capacityMwp: capacity,
        capacityPublished: cells[3].trim(),
        location: cells[4],
        technology: cells[5],
        agency: cells[6],
        agencyFullName: title(6),
        finance: cells[7],
        financeFullName: title(7),
        completionDate: cells[8],
        status: cells[9],
      });
    }
  }
  return rows;
}

/** Minimal entity decode for attribute values. */
function H_unescape(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/gi, ' ');
}

/** Assemble a register from pages already fetched, newest page first. */
export function buildSredaProjectRegister(
  technology: string,
  sourceUrl: string,
  pages: string[],
): SredaProjectRegister | null {
  const rows = pages.flatMap((p) => parseSredaProjectRegisterRows(p));
  if (rows.length === 0) return null;
  const headline = pages.length > 0 ? parseSredaRegisterHeadline(pages[0]) : null;
  return {
    technology,
    sourceUrl,
    rows,
    pagesFetched: pages.length,
    publishedSystemCount: headline?.systemCount ?? null,
    publishedCapacityMwp: headline?.capacityMwp ?? null,
    publishedCapacity: headline?.capacityPublished ?? null,
  };
}

/**
 * "Energy Generation and Carbon Savings" (index.php?id=21).
 *
 * Values are kept as SREDA's own strings ("17 TWh", "11 M tCO 2"). They are
 * modelled projections rounded to one or two significant figures, so parsing
 * them into numbers would invent precision that is not in the source and invite
 * arithmetic the source does not support.
 */
export function parseSredaCarbonHtml(html: string): SredaCarbonRow[] {
  const out: SredaCarbonRow[] = [];
  for (const cells of tableRows(html)) {
    if (cells.length !== 6) continue;
    const [technology, installedCapacity, ...rest] = cells;
    if (/^technology name$/i.test(technology)) continue;
    if (!/\d/.test(installedCapacity)) continue;
    out.push({
      technology,
      installedCapacity,
      lifetimeEnergyExpected: rest[0],
      lifetimeCo2Expected: rest[1].replace(/tCO\s*2/i, 'tCO₂'),
      tillTodayEnergyExpected: rest[2],
      tillTodayCo2Expected: rest[3].replace(/tCO\s*2/i, 'tCO₂'),
    });
  }
  return out;
}

/**
 * Recompute each of SREDA's published totals from the rows it prints above it,
 * and compare the same quantity where two SREDA pages both state it.
 *
 * Tolerances come from how SREDA prints the figures — half of the last decimal
 * place, once per term summed — never from a chosen constant. A disagreement is
 * recorded, not corrected.
 */
export function buildSredaReconciliation(snapshot: SredaDailyData): SredaReconciliation[] {
  const out: SredaReconciliation[] = [];

  /**
   * The band a sum of printed figures can move within: half of the last decimal
   * place each figure actually carries, added up.
   *
   * Two wrong versions preceded this one, and the columns here defeat both. Per
   * value alone reads SREDA's "0" as integer precision and contributes +/-0.5
   * per empty row, inflating the technology off-grid band to 3.06 MWp. The
   * column maximum instead under-states a genuinely mixed column: the national
   * mix prints "6273 MW" beside "1823.65 MW", and pricing those integers at two
   * decimals gave a 0.04 MW band against a 0.35 MW rounding gap, reporting an
   * ordinary rounding as a source defect.
   *
   * So: each figure's own precision, and an exact zero contributes nothing,
   * because a printed 0 in these tables is a structural absence — a technology
   * with no off-grid capacity — rather than a rounded measurement.
   */
  const half = (values: number[]) =>
    values.reduce((sum, v) => {
      if (v === 0) return sum;
      const decimals = (String(v).split('.')[1] ?? '').length;
      return sum + 0.5 * Math.pow(10, -decimals);
    }, 0);

  /**
   * The same band for a column whose rows are not all in the same unit.
   *
   * The organisation tables print "43.47 MWp" beside "292.08 kWp". Converting
   * first and measuring the result's decimals reads the converted 0.29208 as
   * five-decimal precision, when what SREDA actually stated was two decimals of
   * a kWp — a band a hundredfold too tight, which reported an exact table as a
   * disagreement. So each figure's half-step is taken in the unit it was
   * printed in and only then converted.
   */
  const halfFromPublished = (printed: string[]) =>
    printed.reduce((sum, raw) => {
      const m = raw.match(/([\d,.]+)\s*(MWp|kWp|MW|kW)?\b/i);
      if (!m) return sum + 0.5;
      const decimals = (m[1].split('.')[1] ?? '').length;
      const unitFactor = m[2] && /^k/i.test(m[2]) ? 0.001 : 1;
      return sum + 0.5 * Math.pow(10, -decimals) * unitFactor;
    }, 0);

  const breakdown = snapshot.technologyBreakdown ?? [];
  const totals = snapshot.technologyTotals;
  if (breakdown.length > 0 && totals) {
    for (const [label, key] of [
      ['off-grid', 'offGridMwp'],
      ['on-grid', 'onGridMwp'],
      ['total', 'totalMwp'],
    ] as const) {
      const values = breakdown.map((r) => r[key]);
      const computed = values.reduce((a, b) => a + b, 0);
      const published = totals[key];
      const tolerance = half([...values, published]);
      out.push({
        check: `Technology-wise ${label} capacity == SREDA's own Total row`,
        published,
        computed: Number(computed.toFixed(3)),
        delta: Number((computed - published).toFixed(3)),
        tolerance: Number(tolerance.toFixed(4)),
        ok: Math.abs(computed - published) <= tolerance,
        sourceUrl: 'https://ndre.sreda.gov.bd/index.php?id=8',
      });
    }
  }

  for (const table of snapshot.organisationTables ?? []) {
    if (table.publishedTotalMwp === null) continue;
    const values = table.rows.map((r) => r.capacityMwp);
    const computed = values.reduce((a, b) => a + b, 0);
    const tolerance = halfFromPublished([
      ...table.rows.map((r) => r.capacityPublished),
      `${table.publishedTotalMwp} MWp`,
    ]);
    out.push({
      check: `${table.category}: organisations sum == SREDA's own Total row`,
      published: table.publishedTotalMwp,
      computed: Number(computed.toFixed(3)),
      delta: Number((computed - table.publishedTotalMwp).toFixed(3)),
      tolerance: Number(tolerance.toFixed(4)),
      ok: Math.abs(computed - table.publishedTotalMwp) <= tolerance,
      sourceUrl: table.sourceUrl,
    });

    // The same quantity stated on two different SREDA pages. Neither is
    // adjusted to match the other.
    const TECH_FOR_CATEGORY: Record<string, string> = {
      'Solar Parks': 'Solar Park',
      'Net Metered Rooftop Solar': 'Net Metering Rooftop Solar',
      'Solar Irrigation Pumps': 'Solar Irrigation',
    };
    const techName = TECH_FOR_CATEGORY[table.category];
    const techRow = breakdown.find((r) => r.technology === techName);
    if (techRow) {
      const tolerance = half([techRow.totalMwp, table.publishedTotalMwp]);
      out.push({
        check: `${table.category}: technology-wise page == statistics page`,
        published: table.publishedTotalMwp,
        computed: techRow.totalMwp,
        delta: Number((techRow.totalMwp - table.publishedTotalMwp).toFixed(3)),
        tolerance: Number(tolerance.toFixed(4)),
        ok: Math.abs(techRow.totalMwp - table.publishedTotalMwp) <= tolerance,
        sourceUrl: 'https://ndre.sreda.gov.bd/index.php?id=8',
      });
    }
  }

  for (const table of snapshot.yearWiseTables ?? []) {
    if (table.publishedTotalMwp === null) continue;
    const computed = table.rows.reduce((a, r) => a + r.capacityMwp, 0);
    const tolerance = halfFromPublished([
      ...table.rows.map((r) => r.capacityPublished),
      `${table.publishedTotalMwp} ${table.publishedTotalUnit ?? 'MW'}`,
    ]);
    out.push({
      check: `${table.category} by year: years sum == SREDA's own Total row`,
      published: table.publishedTotalMwp,
      computed: Number(computed.toFixed(3)),
      delta: Number((computed - table.publishedTotalMwp).toFixed(3)),
      tolerance: Number(tolerance.toFixed(4)),
      ok: Math.abs(computed - table.publishedTotalMwp) <= tolerance,
      sourceUrl: table.sourceUrl,
    });
  }

  // Each register view lists the projects behind a technology's capacity, so
  // the ones marked running should sum to what the technology page states for
  // it. Only running projects count: the register also carries planning and
  // obsolete rows, and adding those would inflate installed capacity with a
  // pipeline.
  for (const register of snapshot.projectRegisters ?? []) {
    // The view's own headline counts and sums every project in it. These two
    // checks are what prove the paginated read was complete — a missed page
    // fails them both, where the running-capacity check below could still pass
    // by chance if the missing page held no running projects.
    if (register.publishedSystemCount !== null) {
      out.push({
        check: `${register.technology}: projects read == SREDA's own "System" count`,
        published: register.publishedSystemCount,
        computed: register.rows.length,
        delta: register.rows.length - register.publishedSystemCount,
        tolerance: 0,
        ok: register.rows.length === register.publishedSystemCount,
        sourceUrl: register.sourceUrl,
      });
    }
    if (register.publishedCapacityMwp !== null) {
      const computed = register.rows.reduce((a, r) => a + r.capacityMwp, 0);
      const tolerance = halfFromPublished([
        ...register.rows.map((r) => r.capacityPublished),
        register.publishedCapacity ?? `${register.publishedCapacityMwp} MWp`,
      ]);
      out.push({
        check: `${register.technology}: all projects sum == SREDA's own "Capacity" headline`,
        published: register.publishedCapacityMwp,
        computed: Number(computed.toFixed(3)),
        delta: Number((computed - register.publishedCapacityMwp).toFixed(3)),
        tolerance: Number(tolerance.toFixed(4)),
        ok: Math.abs(computed - register.publishedCapacityMwp) <= tolerance,
        sourceUrl: register.sourceUrl,
      });
    }

    const techRow = breakdown.find((r) => r.technology === register.technology);
    if (!techRow) continue;
    const running = register.rows.filter((r) => r.status === SREDA_STATUS_RUNNING);
    if (running.length === 0) continue;

    // The technology page states a project count beside its capacity, so the
    // running rows can be checked on both. Counting separately localises a
    // disagreement: Biogas differs by one project *and* by that project's
    // 0.3 MWp, which says a specific row is missing from one page rather than a
    // capacity being mis-stated.
    out.push({
      check: `${register.technology}: running project count == technology-wise page`,
      published: techRow.quantity,
      computed: running.length,
      delta: running.length - techRow.quantity,
      tolerance: 0,
      ok: running.length === techRow.quantity,
      sourceUrl: register.sourceUrl,
    });
    const computed = running.reduce((a, r) => a + r.capacityMwp, 0);
    const tolerance = halfFromPublished([
      ...running.map((r) => r.capacityPublished),
      `${techRow.totalMwp} MWp`,
    ]);
    out.push({
      check: `${register.technology}: running projects in the register == technology-wise page`,
      published: techRow.totalMwp,
      computed: Number(computed.toFixed(3)),
      delta: Number((computed - techRow.totalMwp).toFixed(3)),
      tolerance: Number(tolerance.toFixed(4)),
      ok: Math.abs(computed - techRow.totalMwp) <= tolerance,
      sourceUrl: register.sourceUrl,
    });
  }

  // The national mix page states its own total, and a Renewable row that the
  // technology page states again. Both are SREDA's, on the same day.
  const mix = snapshot.generationMix ?? [];
  if (mix.length > 0 && snapshot.totalInstalledMw > 0) {
    const values = mix.map((r) => r.capacityMw);
    const computed = values.reduce((a, b) => a + b, 0);
    const tolerance = half([...values, snapshot.totalInstalledMw]);
    out.push({
      check: "National mix: fuel rows sum == SREDA's own total installed capacity",
      published: snapshot.totalInstalledMw,
      computed: Number(computed.toFixed(3)),
      delta: Number((computed - snapshot.totalInstalledMw).toFixed(3)),
      tolerance: Number(tolerance.toFixed(4)),
      ok: Math.abs(computed - snapshot.totalInstalledMw) <= tolerance,
      sourceUrl: 'https://ndre.sreda.gov.bd/index.php?id=7',
    });

    const renewableRow = mix.find((r) => r.fuel.toLowerCase() === 'renewable');
    const techTotal = snapshot.technologyTotals?.totalMwp;
    if (renewableRow && techTotal != null) {
      // Note the unit: the mix page labels this column MW, the technology page
      // MWp. SREDA carries the same figure under both, so the comparison is
      // reported as SREDA states it rather than converted between them.
      const tolerance = half([renewableRow.capacityMw, techTotal]);
      out.push({
        check: 'Renewable capacity: national mix page == technology-wise page',
        published: renewableRow.capacityMw,
        computed: techTotal,
        delta: Number((techTotal - renewableRow.capacityMw).toFixed(3)),
        tolerance: Number(tolerance.toFixed(4)),
        ok: Math.abs(techTotal - renewableRow.capacityMw) <= tolerance,
        sourceUrl: 'https://ndre.sreda.gov.bd/index.php?id=7',
      });
    }
  }

  return out;
}

export function parseSredaHomepageHtml(html: string, sourceUrl: string): Partial<SredaDailyData> {
  const update = parseLastUpdate(html);
  const headlineMatch = html.match(RE_CAPACITY_HEADLINE_RE);
  const totalRenewableMw = headlineMatch ? parseNumber(headlineMatch[1]) : 0;

  let renewableTech = parseRenewableCapacityTable(html);
  if (renewableTech.length === 0) {
    renewableTech = parseChartRenewables(html);
  }

  return {
    date: update?.date,
    lastUpdate: update?.lastUpdate,
    sourceUrl,
    totalRenewableMw,
    renewableTech,
  };
}

export function parseSredaGenerationMixHtml(html: string): Partial<SredaDailyData> {
  const update = parseLastUpdate(html);
  const reShareMatch = html.match(RE_MIX_HEADLINE_RE);
  const reGridSharePct = reShareMatch ? parseNumber(reShareMatch[1]) : 0;
  const { generationMix, totalInstalledMw } = parseGenerationMixTable(html);

  return {
    date: update?.date,
    lastUpdate: update?.lastUpdate,
    reGridSharePct,
    totalInstalledMw,
    generationMix,
  };
}

export function mergeSredaSnapshots(
  home: Partial<SredaDailyData>,
  mix: Partial<SredaDailyData>,
  scrapedAt: string,
): SredaDailyData | null {
  const date = home.date ?? mix.date;
  const lastUpdate = home.lastUpdate ?? mix.lastUpdate;
  if (!date || !lastUpdate) return null;

  const renewableTech = home.renewableTech ?? [];
  const totalRenewableMw =
    home.totalRenewableMw && home.totalRenewableMw > 0
      ? home.totalRenewableMw
      : renewableTech.reduce((sum, row) => sum + row.totalMw, 0);

  const generationMix = mix.generationMix ?? [];
  const renewableRow = generationMix.find((row) => row.fuel.toLowerCase() === 'renewable');

  return {
    date,
    lastUpdate,
    sourceUrl: home.sourceUrl ?? 'https://ndre.sreda.gov.bd/',
    totalRenewableMw,
    renewableTech,
    reGridSharePct: mix.reGridSharePct ?? renewableRow?.sharePct ?? 0,
    totalInstalledMw: mix.totalInstalledMw ?? 0,
    generationMix,
    scrapedAt,
  };
}