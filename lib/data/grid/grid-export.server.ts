import 'server-only';

import { loadDailyReportFromDisk } from '@/lib/data/grid/daily-loader.server';
import { availableDates } from '@/lib/data/grid/available-dates';
import { parseIsoDate } from '@/lib/data/grid/date-utils';
import { getReleaseOverride } from '@/lib/data/releases.server';
import { SINGLETON } from '@/lib/data/feed-paths';
import {
  GRID_EXPORT_DATASETS,
  type ExportColumn,
  type ExportRow,
  type GridExportDatasetKey,
  type PetrobanglaDayInput,
  type PetrobanglaIndexDayInput,
} from '@/lib/data/grid/grid-export-datasets';

/**
 * Read one Petrobangla day: the runtime release if that day has been published,
 * otherwise the archive file (server-safe; no HTTP fetch).
 */
async function loadPetrobanglaDayFromDisk(isoDate: string): Promise<PetrobanglaDayInput | null> {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;

  // Release wins over a static file of the same key, so a re-parsed gas day
  // reaches the member export without a redeploy. Fails soft to the file.
  try {
    const released = await getReleaseOverride('GAS_DAILY', parsed);
    if (released) return released as PetrobanglaDayInput;
  } catch {
    // Enhancement only.
  }

  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'petrobangla', 'daily', `${parsed}.json`);
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as PetrobanglaDayInput;
  } catch {
    return null;
  }
}

/**
 * Only the *file* is memoised, and only because it cannot change without a
 * redeploy. The release is deliberately re-checked on every call — a cache that
 * outlived the first read would pin the index for the life of the process and
 * defeat the point of publishing one. That check is itself cached (per feed,
 * ~60s) inside releases.server, so re-checking costs nothing per call.
 */
let pbIndexFileCache: PetrobanglaIndexDayInput[] | null = null;

/** Load the Petrobangla archive index (per-day totals): release, else disk. */
export async function loadPetrobanglaIndexDays(): Promise<PetrobanglaIndexDayInput[]> {
  try {
    const released = (await getReleaseOverride('GAS_INDEX', SINGLETON)) as
      | { days?: PetrobanglaIndexDayInput[] }
      | null;
    if (released && Array.isArray(released.days)) return released.days;
  } catch {
    // Enhancement only; fall through to the shipped index.
  }

  if (pbIndexFileCache) return pbIndexFileCache;
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'petrobangla', '_index.json');
    const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as { days?: PetrobanglaIndexDayInput[] };
    pbIndexFileCache = Array.isArray(parsed.days) ? parsed.days : [];
  } catch {
    pbIndexFileCache = [];
  }
  return pbIndexFileCache;
}

/** Restrict a dataset's columns to a selected subset (all columns if none/empty). */
function selectColumns(all: ExportColumn[], selected?: string[]): ExportColumn[] {
  if (!selected || selected.length === 0) return all;
  const set = new Set(selected);
  const picked = all.filter((c) => set.has(c.key));
  return picked.length ? picked : all;
}
import {
  getEarliestAllowedDate,
  filterDatesForTier,
  type GridAccessTier,
} from '@/lib/data/grid/grid-tier-access';

/** Hard ceiling on days per export — a full-archive request never blows memory. */
export const MAX_EXPORT_DATES = 1500;

export type ResolvedExportScope = {
  from: string;
  to: string;
  dates: string[];
  /** True when the requested window was narrowed by the tier or catalog bounds. */
  clamped: boolean;
  clampReason: 'tier' | 'catalog' | 'cap' | null;
  tier: GridAccessTier;
};

function clampDate(value: string, min: string, max: string): string {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Resolve the concrete list of daily-report dates to export: the requested
 * [from, to] window, intersected with the catalog and clamped to the member's
 * tier entitlement. Dates are ISO (YYYY-MM-DD), so lexicographic compare is safe.
 */
export function resolveExportDates(
  input: { from?: string | null; to?: string | null },
  tier: GridAccessTier,
  latestDate: string,
  catalog: string[] = availableDates,
): ResolvedExportScope {
  const catalogEarliest = catalog[0] ?? latestDate;

  const reqTo = parseIsoDate(input.to ?? '') ?? latestDate;
  const reqFrom = parseIsoDate(input.from ?? '') ?? reqTo;
  let from = reqFrom;
  let to = reqTo;
  if (from > to) [from, to] = [to, from];

  // Upper bound: never beyond the latest published report.
  to = clampDate(to, catalogEarliest, latestDate);

  // Lower bound: the stricter of tier entitlement and catalog start.
  const tierEarliest = getEarliestAllowedDate(tier, latestDate); // null = unlimited
  const floor = tierEarliest && tierEarliest > catalogEarliest ? tierEarliest : catalogEarliest;
  const clampedFrom = clampDate(from, floor, to);

  let clampReason: ResolvedExportScope['clampReason'] = null;
  if (clampedFrom > from) clampReason = tierEarliest && floor === tierEarliest ? 'tier' : 'catalog';

  let dates = catalog.filter((d) => d >= clampedFrom && d <= to);
  // Belt-and-suspenders: enforce the tier window on the concrete list too.
  dates = filterDatesForTier(dates, tier, latestDate);

  if (dates.length > MAX_EXPORT_DATES) {
    // Keep the most recent slice.
    dates = dates.slice(dates.length - MAX_EXPORT_DATES);
    clampReason = clampReason ?? 'cap';
  }

  return {
    from: dates[0] ?? clampedFrom,
    to: dates[dates.length - 1] ?? to,
    dates,
    clamped: clampReason !== null,
    clampReason,
    tier,
  };
}

export type DatasetTable = {
  key: GridExportDatasetKey;
  label: string;
  sheetName: string;
  columns: ExportColumn[];
  rows: ExportRow[];
};

/** Concurrency for daily-file reads — enough to cut wall-clock without hammering IO. */
const READ_CONCURRENCY = 16;

export type BuildExportInput = {
  keys: GridExportDatasetKey[];
  /** Grid daily report dates (tier-clamped) for `daily` datasets. */
  gridDates: string[];
  /** Petrobangla archive dates (tier-clamped) for `petrobangla-*` datasets. */
  pbDates?: string[];
  /** Pre-loaded Petrobangla index days (for the timeline dataset). */
  pbIndexDays?: PetrobanglaIndexDayInput[];
  columnSelection?: Partial<Record<GridExportDatasetKey, string[]>>;
  /** Member tier — free tiers get recent-history slices of the static series. */
  tier?: GridAccessTier;
};

/** Static (financial) series entries kept for non-paying tiers. */
export const STATIC_RECENT_LIMIT = 6;

function clampStaticRows(
  rows: ExportRow[],
  latestFirst: boolean | undefined,
  tier: GridAccessTier | undefined,
): ExportRow[] {
  const paid = tier === 'plan_499' || tier === 'plan_999';
  if (paid || rows.length <= STATIC_RECENT_LIMIT) return rows;
  return latestFirst ? rows.slice(0, STATIC_RECENT_LIMIT) : rows.slice(-STATIC_RECENT_LIMIT);
}

/**
 * Build the requested dataset tables. `daily` datasets read one row per grid date;
 * `petrobangla-day` datasets read one row-set per Petrobangla date; `petrobangla-index`
 * reads the timeline from the pre-loaded index; `static` (financial/macro) returns its
 * full-history series once. `columnSelection` restricts each dataset's columns.
 */
export async function buildExportTables(input: BuildExportInput): Promise<DatasetTable[]> {
  const { keys, gridDates, pbDates = [], pbIndexDays = [], columnSelection, tier } = input;

  const tableByKey = new Map<GridExportDatasetKey, DatasetTable>();
  for (const key of keys) {
    const def = GRID_EXPORT_DATASETS[key];
    tableByKey.set(key, {
      key,
      label: def.label,
      sheetName: def.sheetName,
      columns: selectColumns(def.columns, columnSelection?.[key]),
      rows: [],
    });
  }

  const dailyKeys: GridExportDatasetKey[] = [];
  const pbDayKeys: GridExportDatasetKey[] = [];
  for (const key of keys) {
    const def = GRID_EXPORT_DATASETS[key];
    if (def.kind === 'static') {
      tableByKey.get(key)!.rows.push(...clampStaticRows(def.rows(), def.latestFirst, tier));
    } else if (def.kind === 'daily') {
      dailyKeys.push(key);
    } else if (def.kind === 'petrobangla-day') {
      pbDayKeys.push(key);
    } else if (def.kind === 'petrobangla-index') {
      // Timeline from the pre-loaded index, restricted to the tier-clamped dates.
      const allowed = new Set(pbDates);
      for (const day of pbIndexDays) {
        if (allowed.size > 0 && !allowed.has(day.date)) continue;
        tableByKey.get(key)!.rows.push(...def.extract(day));
      }
    }
  }

  // Grid daily datasets — read each grid date once, fan out.
  if (dailyKeys.length > 0) {
    for (let i = 0; i < gridDates.length; i += READ_CONCURRENCY) {
      const batch = gridDates.slice(i, i + READ_CONCURRENCY);
      const results = await Promise.all(batch.map((date) => loadDailyReportFromDisk(date)));
      results.forEach((result, idx) => {
        if (!result.ok) return;
        const date = batch[idx];
        for (const key of dailyKeys) {
          const def = GRID_EXPORT_DATASETS[key];
          if (def.kind !== 'daily') continue;
          const rows = def.extract(result.data, date);
          if (rows.length) tableByKey.get(key)!.rows.push(...rows);
        }
      });
    }
  }

  // Petrobangla day datasets — read each PB date once, fan out.
  if (pbDayKeys.length > 0) {
    for (let i = 0; i < pbDates.length; i += READ_CONCURRENCY) {
      const batch = pbDates.slice(i, i + READ_CONCURRENCY);
      const results = await Promise.all(batch.map((date) => loadPetrobanglaDayFromDisk(date)));
      results.forEach((data, idx) => {
        if (!data) return;
        const date = batch[idx];
        for (const key of pbDayKeys) {
          const def = GRID_EXPORT_DATASETS[key];
          if (def.kind !== 'petrobangla-day') continue;
          const rows = def.extract(data, date);
          if (rows.length) tableByKey.get(key)!.rows.push(...rows);
        }
      });
    }
  }

  return keys.map((key) => tableByKey.get(key)!);
}

/**
 * RFC-4180 CSV field escaping plus spreadsheet formula-injection neutralization:
 * a leading =, +, -, @, tab or CR is prefixed with a quote so Excel/Sheets treat
 * the cell as text rather than a formula.
 */
export function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function tableToCsv(table: DatasetTable): string {
  const header = table.columns.map((c) => csvField(c.header)).join(',');
  const body = table.rows.map((row) =>
    table.columns.map((c) => csvField(row[c.key])).join(','),
  );
  return [header, ...body].join('\n');
}

export type ExportMeta = {
  memberName: string;
  tierLabel: string;
  from: string;
  to: string;
  generatedAt: string;
  clampNote: string | null;
};

/** Plain-text digest of the report (meta + computed findings) for the CSV bundle. */
async function buildSummaryText(tables: DatasetTable[], meta: ExportMeta): Promise<string> {
  const { computeInsights } = await import('@/lib/data/grid/grid-export-insights.server');
  const lines: string[] = [
    'ESB POWERLINE — POWER GRID DATA EXPORT',
    '======================================',
    '',
    `Prepared for : ${meta.memberName}`,
    `Access tier  : ${meta.tierLabel}`,
    `Date range   : ${meta.from} to ${meta.to}`,
    `Generated    : ${meta.generatedAt}`,
    '',
    'DATASETS',
    ...tables.map((t) => `  - ${t.label} (${t.rows.length} rows) -> ${t.key}.csv`),
    '',
    'KEY FINDINGS',
  ];
  let n = 0;
  for (const t of tables) {
    for (const ins of computeInsights(t)) {
      lines.push(`  ${String(++n).padStart(2, '0')}. [${t.label}] ${ins}`);
    }
  }
  if (meta.clampNote) lines.push('', `NOTE: ${meta.clampNote}`);
  lines.push(
    '',
    'Source: PGCB Daily Progress Reports / NLDC / Petrobangla daily reports / BPDB & audited financials.',
    'Compiled by esbpowerline.com — not for redistribution.',
  );
  return lines.join('\n');
}

export async function tablesToZip(tables: DatasetTable[], meta: ExportMeta): Promise<Buffer> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file('_REPORT-SUMMARY.txt', await buildSummaryText(tables, meta));
  for (const table of tables) {
    zip.file(`${table.key}.csv`, tableToCsv(table));
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

// Workbook ink — mirrors the PDF's editorial palette (ARGB).
const XL_INK = 'FF111827';
const XL_ACCENT = 'FF2563EB';
const XL_MUTED = 'FF64748B';
const XL_ZEBRA = 'FFF6F8FB';
const XL_WHITE = 'FFFFFFFF';
const XL_WARM = 'FFB45309';

function columnNumFmt(key: string, sample: unknown): string | null {
  if (typeof sample !== 'number') return null;
  if (key.endsWith('_bdt') && !key.includes('crore')) return '#,##0';
  if (key.includes('pct') || key.includes('share')) return '0.00';
  return '#,##0.00';
}

export async function tablesToXlsx(tables: DatasetTable[], meta: ExportMeta): Promise<Buffer> {
  const { default: ExcelJS } = await import('exceljs');
  const { computeInsights, computeSummary } = await import('@/lib/data/grid/grid-export-insights.server');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ESB PowerLine';
  workbook.created = new Date(meta.generatedAt);

  // ---- Report sheet — the PDF's cover + executive summary, in workbook form.
  const summary = computeSummary(tables);
  const rpt = workbook.addWorksheet('Report');
  rpt.getColumn(1).width = 26;
  rpt.getColumn(2).width = 52;
  rpt.getColumn(3).width = 46;

  const addRpt = (
    a: string,
    b = '',
    c = '',
    style: 'brand' | 'title' | 'label' | 'meta' | 'finding' | 'warn' | 'plain' = 'plain',
  ) => {
    const row = rpt.addRow([a, b, c]);
    const [ca, cb, cc] = [row.getCell(1), row.getCell(2), row.getCell(3)];
    if (style === 'brand') ca.font = { bold: true, size: 10, color: { argb: XL_ACCENT } };
    if (style === 'title') ca.font = { bold: true, size: 15, color: { argb: XL_INK } };
    if (style === 'label') ca.font = { bold: true, size: 9, color: { argb: XL_MUTED } };
    if (style === 'meta') {
      ca.font = { bold: true, size: 10, color: { argb: XL_INK } };
      cb.font = { size: 10, color: { argb: XL_INK } };
    }
    if (style === 'finding') {
      ca.font = { bold: true, size: 10, color: { argb: XL_ACCENT } };
      cb.font = { size: 10, color: { argb: XL_INK } };
      cc.font = { size: 9, color: { argb: XL_MUTED } };
    }
    if (style === 'warn') ca.font = { italic: true, size: 9, color: { argb: XL_WARM } };
    return row;
  };

  addRpt('ESB POWERLINE', '', '', 'brand');
  addRpt('Power Grid Data Report — Grid Explorer', '', '', 'title');
  addRpt('');
  addRpt('Prepared for', meta.memberName, '', 'meta');
  addRpt('Access tier', meta.tierLabel, '', 'meta');
  addRpt('Date range', `${meta.from} to ${meta.to}`, '', 'meta');
  addRpt('Generated', meta.generatedAt, '', 'meta');
  addRpt('Contents', `${tables.length} datasets · ${tables.reduce((s, t) => s + t.rows.length, 0)} rows`, '', 'meta');
  if (meta.clampNote) addRpt(meta.clampNote, '', '', 'warn');
  addRpt('');
  if (summary.tiles.length > 0) {
    addRpt('KEY METRICS', '', '', 'label');
    for (const tile of summary.tiles) addRpt(tile.label, tile.value, tile.sub, 'meta');
    addRpt('');
  }
  const findings: Array<{ label: string; text: string }> = [];
  for (const t of tables) for (const ins of computeInsights(t)) findings.push({ label: t.label, text: ins });
  if (findings.length > 0) {
    addRpt('KEY FINDINGS', '', '', 'label');
    findings.forEach((f, i) => addRpt(String(i + 1).padStart(2, '0'), f.text, f.label, 'finding'));
    addRpt('');
  }
  addRpt('Source', 'PGCB / NLDC / Petrobangla / BPDB & audited financials — compiled by esbpowerline.com', '', 'meta');

  // ---- Dataset sheets — titled, findings-annotated, styled headers, zebra, filters.
  for (const table of tables) {
    const sheet = workbook.addWorksheet(table.sheetName);
    const nCols = table.columns.length;
    const insights = computeInsights(table);

    const titleRow = sheet.addRow([table.label]);
    titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: XL_INK } };
    sheet.mergeCells(1, 1, 1, Math.max(nCols, 2));
    const findingRow = sheet.addRow([insights[0] ?? '']);
    findingRow.getCell(1).font = { italic: true, size: 9, color: { argb: XL_MUTED } };
    sheet.mergeCells(2, 1, 2, Math.max(nCols, 2));
    sheet.addRow([]);

    const headRow = sheet.addRow(table.columns.map((c) => c.header));
    headRow.eachCell((cell) => {
      cell.font = { bold: true, size: 9, color: { argb: XL_WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_INK } };
      cell.alignment = { vertical: 'middle' };
    });
    headRow.height = 18;

    const sample = table.rows[0] ?? {};
    const fmts = table.columns.map((c) => columnNumFmt(c.key, sample[c.key]));
    table.columns.forEach((c, i) => {
      sheet.getColumn(i + 1).width = c.key === 'date' ? 12 : Math.max(14, c.header.length + 2);
    });

    table.rows.forEach((row, ri) => {
      const r = sheet.addRow(table.columns.map((c) => row[c.key]));
      r.eachCell((cell, colNumber) => {
        const fmtStr = fmts[colNumber - 1];
        if (fmtStr) cell.numFmt = fmtStr;
        cell.font = { size: 9, color: { argb: 'FF1F2937' } };
        if (ri % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_ZEBRA } };
        }
      });
    });

    sheet.views = [{ state: 'frozen', ySplit: 4 }];
    sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: nCols } };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
