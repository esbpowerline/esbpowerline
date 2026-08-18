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
    initial: latestDate ? await buildYoyComparison(latestDate) : null,
    sections: SECTIONS.map((s) => ({ ...s })),
    maxRangeDays: MAX_RANGE_DAYS,
    months: await availableMonths(),
    monthlySections: MONTHLY_SECTIONS.map((s) => ({ ...s })),
  };
}

export async function generateYoySheet(isoDate: string): Promise<YoyResult> {
  await requireCmsUser();
  return buildYoyComparison(isoDate);
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
    text: comparisonToText(narrowed),
    csv: comparisonToCsv(narrowed),
    json: comparisonToJson(narrowed),
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
    text: comparisonToText(narrowed, monthlySectionLabel),
    csv: comparisonToCsv(narrowed),
    json: comparisonToJson(narrowed),
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
