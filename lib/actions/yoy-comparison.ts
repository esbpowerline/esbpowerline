'use server';

import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { getRuntimeAvailableDates } from '@/lib/data/grid/available-dates.server';
import { buildYoyComparison, findLatestYoyDate, type YoyResult } from '@/lib/data/grid/yoy-comparison';
import {
  SECTIONS,
  compareDates,
  comparisonToCsv,
  comparisonToJson,
  comparisonToText,
  seriesForDates,
  seriesToCsv,
  type ComparisonRow,
  type SectionId,
} from '@/lib/data/grid/comparison';
import {
  MONTHLY_SECTIONS,
  availableMonths,
  compareMonths,
  seriesForMonths,
  type MonthlySectionId,
} from '@/lib/data/grid/monthly-comparison';
import type { Lang } from '@/lib/data/grid/comparison-i18n';
import { buildCoverage, type ArchiveCoverage } from '@/lib/data/grid/archive-coverage';
import { buildBrand } from '@/lib/data/grid/export-brand.server';

/**
 * The year-on-year sheet is derived reading, not a publish, so it sits behind
 * the CMS gate (`article.create`) rather than `admin.access` — editors need it.
 */
async function requireCmsUser() {
  const session = await auth();
  if (!session?.user?.role || !can(session.user.role, 'article.create')) {
    throw new Error('Unauthorized');
  }
}

export type YoyBootstrap = {
  /** Newest day that can actually produce a sheet, or null if none can. */
  latestDate: string | null;
  earliestDate: string | null;
  newestArchiveDate: string | null;
  /**
   * Exactly which days the archive holds, run-length encoded.
   *
   * The pickers need this, not just the two ends: 81 days inside our span are
   * missing, and a calendar that offers them is a calendar that hands back an
   * error. 63 runs, about 1.1 KB — the list of 4,534 ISO strings would be 59.
   */
  coverage: ArchiveCoverage;
  initial: YoyResult | null;
  /** `SECTIONS` relayed to the client — the engine module is server-only. */
  sections: Array<{ id: SectionId; label: string; description: string }>;
  maxRangeDays: number;
  /** Every month with an archived PGCB monthly report, newest first. */
  months: string[];
  /** `MONTHLY_SECTIONS` relayed the same way, for the same reason. */
  monthlySections: Array<{ id: MonthlySectionId; label: string; description: string }>;
};

export async function getYoyBootstrap(): Promise<YoyBootstrap> {
  await requireCmsUser();

  const dates = await getRuntimeAvailableDates();
  const latestDate = await findLatestYoyDate(dates);
  return {
    latestDate,
    earliestDate: dates[0] ?? null,
    newestArchiveDate: dates[dates.length - 1] ?? null,
    coverage: buildCoverage(dates),
    // English to match the panel's own default Output language, so the first
    // paint is not a Bengali sheet under an English toggle.
    initial: latestDate ? await buildYoyComparison(latestDate, 'en') : null,
    sections: SECTIONS.map((s) => ({ ...s })),
    maxRangeDays: MAX_RANGE_DAYS,
    months: await availableMonths(),
    monthlySections: MONTHLY_SECTIONS.map((s) => ({ ...s })),
  };
}

export async function generateYoySheet(isoDate: string, lang: Lang = 'bn'): Promise<YoyResult> {
  await requireCmsUser();
  return buildYoyComparison(isoDate, lang);
}

/* ── free comparison of any two days ─────────────────────────────────────── */

/**
 * Everything the panel needs for one comparison, already serialised. The
 * exporters live in a `server-only` module, so the client cannot build the
 * .txt/.csv/.json itself; it gets them back with the rows and hands them
 * straight to a Blob.
 */
export type MetricChoice = { id: string; section: SectionId; label: string; unit: string };

export type ComparisonPayload =
  | {
      ok: true;
      a: string;
      b: string;
      rows: ComparisonRow[];
      /** Every metric the two chosen days can offer, before the metric filter. */
      available: MetricChoice[];
      text: string;
      csv: string;
      json: string;
      /** Rows that could not be compared, i.e. carry a note. Never a zero. */
      unpublished: number;
      /** Whole-section availability warnings the engine raised. */
      notes: string[];
    }
  | { ok: false; error: string };

export async function runComparison(
  aDate: string,
  bDate: string,
  sections: SectionId[],
  metricIds: string[],
  // The language of the OUTPUT, not of the CMS: it reaches the .txt block the
  // panel previews and exports. The .csv and .json stay English — they are read
  // by spreadsheets and scripts, and a translated header breaks them.
  lang: Lang = 'en',
): Promise<ComparisonPayload> {
  await requireCmsUser();

  // Sections only. The engine lets `metricIds` win outright, and the picker
  // needs to keep offering the metrics the editor has *not* ticked, so the
  // narrowing happens here on the full set rather than inside the engine.
  const result = await compareDates(aDate, bDate, { sections: sections.length ? sections : undefined });
  if (!result.ok) return { ok: false, error: result.error };

  const available: MetricChoice[] = result.rows.map((r) => ({
    id: r.id,
    section: r.section,
    label: r.label,
    unit: r.unit,
  }));

  const wanted = new Set(metricIds);
  const rows = metricIds.length ? result.rows.filter((r) => wanted.has(r.id)) : result.rows;
  const narrowed = { ...result, rows, sections: [...new Set(rows.map((r) => r.section))] };

  return {
    ok: true,
    a: result.a,
    b: result.b,
    rows,
    available,
    text: comparisonToText(narrowed, undefined, lang),
    csv: comparisonToCsv(narrowed, undefined, lang),
    json: comparisonToJson(narrowed, lang),
    unpublished: rows.filter((r) => r.note).length,
    notes: result.notes ?? [],
  };
}

/* ── free comparison of any two months ───────────────────────────────────── */

/**
 * The monthly engine's section vocabulary is its own, so the text writer has to
 * be told where to find the headings; left to its default it would print the
 * daily section names over monthly rows.
 */
const monthlySectionLabel = (id: string) =>
  MONTHLY_SECTIONS.find((s) => s.id === id)?.label ?? id;

export type MonthlyMetricChoice = { id: string; section: string; label: string; unit: string };

export type MonthlyComparisonPayload =
  | {
      ok: true;
      a: string;
      b: string;
      rows: ComparisonRow[];
      available: MonthlyMetricChoice[];
      text: string;
      csv: string;
      json: string;
      /** Rows that could not be compared, i.e. carry a note. Never a zero. */
      unpublished: number;
      /** Whole-section availability warnings the engine raised. */
      notes: string[];
    }
  | { ok: false; error: string };

export async function runMonthlyComparison(
  aMonth: string,
  bMonth: string,
  sections: string[],
  metricIds: string[],
  lang: Lang = 'en',
): Promise<MonthlyComparisonPayload> {
  await requireCmsUser();

  // Sections only, for the same reason the daily action narrows here: the
  // picker must keep offering the metrics the editor has *not* ticked.
  const result = await compareMonths(aMonth, bMonth, {
    sections: sections.length ? sections : undefined,
  });
  if (!result.ok) return { ok: false, error: result.error };

  const available: MonthlyMetricChoice[] = result.rows.map((r) => ({
    id: r.id,
    section: r.section,
    label: r.label,
    unit: r.unit,
  }));

  const wanted = new Set(metricIds);
  const rows = metricIds.length ? result.rows.filter((r) => wanted.has(r.id)) : result.rows;
  const narrowed = { a: result.a, b: result.b, rows, notes: result.notes };

  return {
    ok: true,
    a: result.a,
    b: result.b,
    rows,
    available,
    text: comparisonToText(narrowed, monthlySectionLabel, lang),
    csv: comparisonToCsv(narrowed, monthlySectionLabel, lang),
    json: comparisonToJson(narrowed, lang),
    unpublished: rows.filter((r) => r.note).length,
    notes: result.notes ?? [],
  };
}

/* ── ranges ──────────────────────────────────────────────────────────────── */

/**
 * A range wide enough to sweep the whole archive would load thousands of JSON
 * days in one request. A little over a year is as much as the desk has ever
 * wanted, and it is the point past which this stops being interactive.
 */
const MAX_RANGE_DAYS = 370;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Every calendar date from `start` to `end`, inclusive, in UTC so no DST shifts it. */
function datesBetween(start: string, end: string): string[] | null {
  if (!ISO_RE.test(start) || !ISO_RE.test(end)) return null;
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;

  const out: string[] = [];
  for (let t = from; t <= to; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
    if (out.length > MAX_RANGE_DAYS) break; // caller reports the overrun
  }
  return out;
}

export type RangeSeriesPayload =
  | {
      ok: true;
      csv: string;
      dates: string[];
      /** Calendar days in the range with nothing in the archive — columns left blank. */
      missing: string[];
      /** Metrics these days can offer; discovered from the days, as ever. */
      available: Array<{ id: string; label: string; unit: string }>;
      metricCount: number;
    }
  | { ok: false; error: string };

export async function runRangeSeries(
  start: string,
  end: string,
  metricIds: string[],
): Promise<RangeSeriesPayload> {
  await requireCmsUser();

  const dates = datesBetween(start, end);
  if (!dates) return { ok: false, error: `Not a usable range: ${start} to ${end}` };
  if (dates.length > MAX_RANGE_DAYS) {
    return { ok: false, error: `That range is longer than ${MAX_RANGE_DAYS} days. Narrow it and export again.` };
  }

  // A day absent from the catalog has no figures at all; the series still
  // carries its column so the gap is visible in the sheet rather than skipped.
  const archived = new Set(await getRuntimeAvailableDates());
  const missing = dates.filter((d) => !archived.has(d));

  // Unfiltered, so the picker can keep offering the metrics not yet ticked;
  // the days are loaded once either way.
  const series = await seriesForDates(dates);
  const available = series.metrics.map(({ id, label, unit }) => ({ id, label, unit }));
  const wanted = new Set(metricIds);
  const metrics = metricIds.length ? series.metrics.filter((m) => wanted.has(m.id)) : series.metrics;

  return {
    ok: true,
    csv: seriesToCsv({ ...series, metrics }),
    dates,
    missing,
    available,
    metricCount: metrics.length,
  };
}

/* ── monthly ranges ──────────────────────────────────────────────────────── */

/** The archive is 159 months deep; this is the whole of it with room to grow. */
const MAX_RANGE_MONTHS = 240;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Every calendar month from `start` to `end`, inclusive. */
function monthsBetween(start: string, end: string): string[] | null {
  if (!MONTH_RE.test(start) || !MONTH_RE.test(end)) return null;
  const from = Number(start.slice(0, 4)) * 12 + Number(start.slice(5, 7)) - 1;
  const to = Number(end.slice(0, 4)) * 12 + Number(end.slice(5, 7)) - 1;
  if (to < from) return null;

  const out: string[] = [];
  for (let n = from; n <= to; n += 1) {
    out.push(`${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`);
    if (out.length > MAX_RANGE_MONTHS) break; // caller reports the overrun
  }
  return out;
}

export type MonthlySeriesPayload =
  | {
      ok: true;
      csv: string;
      months: string[];
      /** Months in the range with no archived report — columns left blank. */
      missing: string[];
      available: Array<{ id: string; label: string; unit: string }>;
      metricCount: number;
    }
  | { ok: false; error: string };

export async function runMonthlySeries(
  start: string,
  end: string,
  metricIds: string[],
): Promise<MonthlySeriesPayload> {
  await requireCmsUser();

  const months = monthsBetween(start, end);
  if (!months) return { ok: false, error: `Not a usable range: ${start} to ${end}` };
  if (months.length > MAX_RANGE_MONTHS) {
    return {
      ok: false,
      error: `That range is longer than ${MAX_RANGE_MONTHS} months. Narrow it and export again.`,
    };
  }

  // Unfiltered, so the picker can keep offering the metrics not yet ticked;
  // the months are read once either way.
  const series = await seriesForMonths(months);
  const available = series.metrics.map(({ id, label, unit }) => ({ id, label, unit }));
  const wanted = new Set(metricIds);
  const metrics = metricIds.length ? series.metrics.filter((m) => wanted.has(m.id)) : series.metrics;

  return {
    ok: true,
    csv: seriesToCsv({ dates: series.dates, metrics }),
    months,
    // Straight from the engine: a month it could not read is a gap in the
    // record, and is reported as such rather than left to look like zeroes.
    missing: series.missing,
    available,
    metricCount: metrics.length,
  };
}

export type BulkYoyPayload =
  | {
      ok: true;
      text: string;
      built: string[];
      /** Days that cannot produce a sheet, each with the reason the builder gave. */
      skipped: Array<{ date: string; reason: string }>;
    }
  | { ok: false; error: string };

/**
 * Every sheet the range can produce, one after another. A day that cannot
 * produce one is reported with its reason rather than dropped — usually the
 * gas window Petrobangla files the following morning.
 */
export async function runBulkYoySheets(start: string, end: string): Promise<BulkYoyPayload> {
  await requireCmsUser();

  const dates = datesBetween(start, end);
  if (!dates) return { ok: false, error: `Not a usable range: ${start} to ${end}` };
  if (dates.length > MAX_RANGE_DAYS) {
    return { ok: false, error: `That range is longer than ${MAX_RANGE_DAYS} days. Narrow it and export again.` };
  }

  const built: string[] = [];
  const skipped: Array<{ date: string; reason: string }> = [];
  const sheets: string[] = [];

  // Sequential on purpose: a year of days is a year of JSON reads, and the
  // sheet builder loads two days for each of them.
  for (const iso of dates) {
    const sheet = await buildYoyComparison(iso);
    if (sheet.ok) {
      built.push(iso);
      sheets.push(sheet.text.replace(/\n+$/, ''));
    } else {
      skipped.push({ date: iso, reason: sheet.reason });
    }
  }

  if (!sheets.length) {
    return { ok: false, error: `No day between ${start} and ${end} can produce a sheet.` };
  }

  const rule = '\n\n' + '━'.repeat(77) + '\n\n';
  return { ok: true, text: sheets.join(rule) + '\n', built, skipped };
}

/* ── Word and PDF ────────────────────────────────────────────────────────── */

/**
 * The .txt/.csv/.json exports are strings, so they cross the wire as strings
 * and the client drops them into a Blob. A .docx and a .pdf are binaries, and a
 * server action cannot return a Buffer, so they come back base64 and the panel
 * decodes them. Everything else about the flow is the same: the document is
 * built server-side from a freshly run comparison, never from whatever the
 * client happens to be holding.
 */
export type DocFormat = 'docx' | 'pdf';

export type DocumentPayload =
  | { ok: true; filename: string; mime: string; base64: string }
  | { ok: false; error: string };

const MIME: Record<DocFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
};

/**
 * A timestamp for the document's own footer. Stamped once per export, in Dhaka
 * time, because that is the desk that reads it.
 */
function stamp(): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(new Date());
}

export async function exportComparisonDocument(args: {
  kind: 'days' | 'months';
  a: string;
  b: string;
  sections: string[];
  metricIds: string[];
  format: DocFormat;
  lang: Lang;
}): Promise<DocumentPayload> {
  await requireCmsUser();

  const { kind, a, b, sections, metricIds, format, lang } = args;

  // Re-run rather than trusting a payload posted back from the client: the rows
  // are the document, and a client that has been sitting on a stale comparison
  // would otherwise export figures for a different pair of days than its own
  // heading claims.
  const result =
    kind === 'days'
      ? await compareDates(a, b, { sections: sections.length ? (sections as SectionId[]) : undefined })
      : await compareMonths(a, b, { sections: sections.length ? sections : undefined });

  if (!result.ok) return { ok: false, error: result.error };

  const wanted = new Set(metricIds);
  const rows = metricIds.length ? result.rows.filter((r) => wanted.has(r.id)) : result.rows;
  if (!rows.length) {
    return { ok: false, error: 'No metric is selected, so there is nothing to put in the document.' };
  }

  const sectionName =
    kind === 'days'
      ? (id: string) => SECTIONS.find((s) => s.id === id)?.label ?? id
      : monthlySectionLabel;

  // The QR reopens exactly this comparison: the URL state the panel writes is
  // the same state a link can restore.
  const params = new URLSearchParams({ mode: kind === 'days' ? 'compare' : 'months', a, b, lang });
  if (sections.length) params.set(kind === 'days' ? 'sections' : 'msections', sections.join(','));

  const meta = {
    a: result.a,
    b: result.b,
    rows,
    notes: result.notes ?? [],
    lang,
    sectionName,
    generatedAt: stamp(),
    brand: buildBrand(
      kind === 'days' ? 'Grid comparison — two days' : 'Grid comparison — two months',
      `${result.a} vs ${result.b}`,
      `/cms/yoy-sheet?${params.toString()}`,
      undefined,
      lang,
      [result.a, result.b],
    ),
  };

  const stem =
    kind === 'days' ? `Grid_Compare_${a}_vs_${b}` : `Grid_Compare_Months_${a}_vs_${b}`;

  try {
    const buffer =
      format === 'docx'
        ? await (await import('@/lib/data/grid/comparison-docs.server')).comparisonToDocx(meta)
        : await (await import('@/lib/data/grid/comparison-pdf.server')).comparisonToPdf(meta);

    return {
      ok: true,
      filename: `${stem}${lang === 'bn' ? '_bn' : ''}.${format}`,
      mime: MIME[format],
      base64: buffer.toString('base64'),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * The published year-on-year sheet as a document. The sheet is already
 * formatted — fixed column widths, Bengali numerals — so both writers lay it
 * out as a monospaced block rather than re-typesetting it into a table and
 * losing the format the desk publishes.
 */
export async function exportSheetDocument(
  isoDate: string,
  format: DocFormat,
  lang: Lang = 'bn',
): Promise<DocumentPayload> {
  await requireCmsUser();

  // Built in the language being asked for, so the file matches the preview the
  // editor is looking at rather than always coming out in the published one.
  const sheet = await buildYoyComparison(isoDate, lang);
  if (!sheet.ok) return { ok: false, error: sheet.reason };

  const title = sheet.filename.replace(/\.[a-z]+$/i, '');
  // The rows, not the text block. Both writers lay out the same six columns the
  // panel previews, from the strings the engine already formatted — so the
  // document, the screen and the published .txt cannot disagree about a figure.
  // The .txt export and Save to archive folder still write the block itself.
  const doc = {
    heading: sheet.heading,
    subheading: sheet.subheading,
    footer: sheet.footer,
    aLabel: sheet.aLabel,
    bLabel: sheet.bLabel,
    lang: sheet.lang,
    rows: sheet.rows,
    brand: buildBrand(
      'Year-on-year sheet',
      sheet.subheading,
      `/cms/yoy-sheet?mode=sheet&date=${isoDate}&lang=${lang}`,
      undefined,
      lang,
      // The sheet is always a day against the same day a year earlier.
      [`${Number(isoDate.slice(0, 4)) - 1}${isoDate.slice(4)}`, isoDate],
    ),
  };

  try {
    const buffer =
      format === 'docx'
        ? await (await import('@/lib/data/grid/comparison-docs.server')).sheetToDocx(doc)
        : await (await import('@/lib/data/grid/comparison-pdf.server')).sheetToPdf(doc);

    return {
      ok: true,
      filename: `${title}${lang === 'en' ? '_en' : ''}.${format}`,
      mime: MIME[format],
      base64: buffer.toString('base64'),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
