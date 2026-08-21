import 'server-only';

import type { ComparisonRow } from '@/lib/data/grid/comparison';
import { packBrandedDocx } from '@/lib/data/grid/docx-package.server';
import type { ExportBrand } from '@/lib/data/grid/export-brand.server';
import {
  metricLabel,
  sectionLabel,
  toBnDigits,
  unitLabel,
  verdictOf,
  strings,
  type Lang,
} from '@/lib/data/grid/comparison-i18n';

/**
 * The comparison as a Word document.
 *
 * Written as raw OOXML through JSZip rather than pulled in as a dependency. A
 * .docx is a zip of five small XML parts and this writer emits one table; the
 * smallest library that does the same is an order of magnitude more code than
 * the file below, and this way the Bengali rows need no font work at all —
 * Word resolves Bengali from the reader's own system, which is the one thing
 * the PDF path cannot do.
 */

export type DocMeta = {
  /** Column heading for the first day/month. */
  a: string;
  /** Column heading for the second day/month. */
  b: string;
  rows: ComparisonRow[];
  /** Whole-comparison warnings from the engine, printed under the table. */
  notes: string[];
  lang: Lang;
  /** Section id to English heading; the monthly engine has its own vocabulary. */
  sectionName: (id: string) => string;
  /** ISO timestamp, passed in so the document is reproducible in a test. */
  generatedAt: string;
  /** Logo, palette, provenance block and the QR link. */
  brand: ExportBrand;
};

/* ── shared formatting ───────────────────────────────────────────────────── */

/** `—` for anything unpublished; never a 0 standing in for a missing figure. */
function num(v: number | null, lang: Lang): string {
  if (v === null) return '—';
  const s = Number.isInteger(v) ? String(v) : v.toFixed(2);
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))(?=[^.]*$)/g, ',');
  return lang === 'bn' ? toBnDigits(grouped) : grouped;
}

function delta(v: number | null, lang: Lang): string {
  if (v === null) return '—';
  return (v >= 0 ? '+' : '') + num(v, lang);
}

function pct(v: number | null, lang: Lang): string {
  if (v === null) return '—';
  const body = `${Math.abs(v).toFixed(1)}%`;
  return `${v >= 0 ? '▲' : '▼'} ${lang === 'bn' ? toBnDigits(body) : body}`;
}

/**
 * Row colour follows the verdict, not the sign.
 *
 * Shedding falling by 300 MW and generation rising by 300 MW are both good
 * news, and a sheet that paints the first red because the number went down is
 * telling the reader the opposite of what happened. `verdictOf` holds which
 * way is up for each metric; anything it will not judge is left uncoloured.
 */
const GOOD = '15803D';
const BAD = 'B91C1C';
const PLAIN = '111827';

function rowColor(r: ComparisonRow): string {
  const v = verdictOf(r.id, r.delta);
  return v === 'up' ? GOOD : v === 'down' ? BAD : PLAIN;
}

/* ── DOCX ────────────────────────────────────────────────────────────────── */

/** XML text escaping. `&` first, or it double-escapes the entities below it. */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type CellOpts = { bold?: boolean; color?: string; align?: 'left' | 'right'; shade?: string };

function cell(text: string, width: number, o: CellOpts = {}): string {
  const align = o.align === 'right' ? '<w:jc w:val="right"/>' : '';
  const shade = o.shade ? `<w:shd w:val="clear" w:fill="${o.shade}"/>` : '';
  const bold = o.bold ? '<w:b/>' : '';
  const color = o.color ? `<w:color w:val="${o.color}"/>` : '';
  return (
    `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${shade}</w:tcPr>` +
    `<w:p><w:pPr>${align}<w:rPr>${bold}${color}</w:rPr></w:pPr>` +
    `<w:r><w:rPr>${bold}${color}<w:sz w:val="17"/></w:rPr>` +
    `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`
  );
}

function para(text: string, o: { bold?: boolean; size?: number; color?: string } = {}): string {
  const rpr =
    `${o.bold ? '<w:b/>' : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}` +
    `<w:sz w:val="${o.size ?? 20}"/>`;
  return (
    `<w:p><w:pPr><w:rPr>${rpr}</w:rPr></w:pPr>` +
    `<w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`
  );
}

/** The border set both tables use. */
const TABLE_BORDERS =
  '<w:tblBorders>' +
  ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
    .map((side) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="D5DBE3"/>`)
    .join('') +
  '</w:tblBorders>';

/** Column widths in twentieths of a point; they sum to the usable page width. */
const COLS = [3000, 1200, 1500, 1500, 1500, 1400, 2300];

export async function comparisonToDocx(meta: DocMeta): Promise<Buffer> {
  const t = strings(meta.lang);
  const body: string[] = [];

  body.push(para(t.docTitle, { bold: true, size: 30 }));
  body.push(para(`${meta.a}  vs  ${meta.b}`, { size: 22, color: '475569' }));
  body.push('<w:p/>');

  const head =
    '<w:tr><w:trPr><w:tblHeader/></w:trPr>' +
    [
      cell(t.metric, COLS[0], { bold: true, shade: 'F1F5F9' }),
      cell(t.unit, COLS[1], { bold: true, shade: 'F1F5F9' }),
      cell(meta.a, COLS[2], { bold: true, align: 'right', shade: 'F1F5F9' }),
      cell(meta.b, COLS[3], { bold: true, align: 'right', shade: 'F1F5F9' }),
      cell(t.change, COLS[4], { bold: true, align: 'right', shade: 'F1F5F9' }),
      cell(t.changePct, COLS[5], { bold: true, align: 'right', shade: 'F1F5F9' }),
      cell(t.note, COLS[6], { bold: true, shade: 'F1F5F9' }),
    ].join('') +
    '</w:tr>';

  const trs: string[] = [head];
  let current: string | null = null;
  for (const r of meta.rows) {
    if (r.section !== current) {
      current = r.section;
      // A section heading spanning the full width, so the table still reads as
      // sections rather than 230 undifferentiated rows.
      trs.push(
        '<w:tr>' +
          `<w:tc><w:tcPr><w:tcW w:w="${COLS.reduce((a, b) => a + b, 0)}" w:type="dxa"/>` +
          `<w:gridSpan w:val="${COLS.length}"/><w:shd w:val="clear" w:fill="E2E8F0"/></w:tcPr>` +
          `<w:p><w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">` +
          esc(sectionLabel(current, meta.sectionName(current), meta.lang).toUpperCase()) +
          '</w:t></w:r></w:p></w:tc></w:tr>',
      );
    }
    const color = rowColor(r);
    trs.push(
      '<w:tr>' +
        cell(metricLabel(r.id, r.label, meta.lang), COLS[0]) +
        cell(unitLabel(r.unit, meta.lang), COLS[1]) +
        cell(num(r.a, meta.lang), COLS[2], { align: 'right' }) +
        cell(num(r.b, meta.lang), COLS[3], { align: 'right' }) +
        cell(delta(r.delta, meta.lang), COLS[4], { align: 'right', color }) +
        cell(pct(r.pct, meta.lang), COLS[5], { align: 'right', color }) +
        cell(r.note ?? '', COLS[6], { color: '64748B' }) +
        '</w:tr>',
    );
  }

  body.push(
    '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>' +
      '<w:tblW w:w="0" w:type="auto"/>' +
      TABLE_BORDERS +
      '</w:tblPr>' +
      `<w:tblGrid>${COLS.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` +
      trs.join('') +
      '</w:tbl>',
  );

  body.push('<w:p/>');
  body.push(para(t.docSource, { size: 16, color: '64748B' }));
  body.push(para(t.docDashRule, { size: 16, color: '64748B' }));
  for (const n of meta.notes) body.push(para(n, { size: 16, color: 'B45309' }));

  return packBrandedDocx({
    body: body.join(''),
    brand: meta.brand,
    // Landscape: seven columns do not fit across a portrait page, and Word
    // silently shrinks the last one to nothing rather than rotating for you.
    // The top margin leaves room for the running head.
    pageXml:
      '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>' +
      '<w:pgMar w:top="1500" w:right="720" w:bottom="1000" w:left="720" w:header="480" w:footer="480"/>',
  });
}

/* ── the year-on-year sheet ──────────────────────────────────────────────── */

/** The nine published rows, already formatted by the engine. */
export type SheetDoc = {
  heading: string;
  subheading: string;
  footer: string[];
  aLabel: string;
  bLabel: string;
  lang: Lang;
  brand: ExportBrand;
  rows: ReadonlyArray<{
    id: string;
    label: string;
    unit: string;
    aText: string;
    bText: string;
    delta: number;
    deltaText: string;
    pctText: string;
  }>;
};

const SHEET_COLS = [3400, 1900, 1700, 1700, 1700, 1600];

/**
 * The sheet as a table, the same one the panel previews.
 *
 * It used to write `text` verbatim, one monospaced paragraph per line. That is
 * the right artefact for Copy, for .txt and for the archive folder, and the
 * wrong one for a document: those columns are held together by space padding,
 * which only lines up in a monospaced font — and no monospaced Bengali face
 * exists, so the Bengali .docx came out ragged.
 *
 * Neither this nor the preview formats a number. The engine formatted all six
 * columns once, so the document and the screen cannot drift apart.
 */
export async function sheetToDocx(sheet: SheetDoc): Promise<Buffer> {
  const bn = sheet.lang === 'bn';
  // No timestamp line here: the branded package puts the download date, in all
  // three calendars, in the provenance block above the body.
  const body: string[] = [
    para(sheet.heading, { bold: true, size: 28 }),
    para(sheet.subheading, { size: 22, color: '475569' }),
    '<w:p/>',
  ];

  const heads: Array<[string, boolean]> = [
    [bn ? 'বিবরণ' : 'Metric', false],
    [bn ? 'একক' : 'Unit', false],
    [sheet.aLabel, true],
    [sheet.bLabel, true],
    [bn ? 'পরিবর্তন' : 'Change', true],
    [bn ? 'পরিবর্তন %' : 'Change %', true],
  ];
  const trs = [
    '<w:tr><w:trPr><w:tblHeader/></w:trPr>' +
      heads
        .map(([label, right], i) =>
          cell(label, SHEET_COLS[i], {
            bold: true,
            shade: 'F1F5F9',
            align: right ? 'right' : 'left',
          }),
        )
        .join('') +
      '</w:tr>',
  ];

  for (const r of sheet.rows) {
    // Coloured by whether the day got better, not by the sign — the same rule
    // as every other table here, which is why the rows carry a metric id.
    const v = verdictOf(r.id, r.delta);
    const color = v === 'up' ? GOOD : v === 'down' ? BAD : PLAIN;
    const arrow = r.delta >= 0 ? '▲' : '▼';
    trs.push(
      '<w:tr>' +
        cell(r.label, SHEET_COLS[0], { bold: true }) +
        cell(r.unit, SHEET_COLS[1], { color: '64748B' }) +
        cell(r.aText, SHEET_COLS[2], { align: 'right', color: '475569' }) +
        cell(r.bText, SHEET_COLS[3], { align: 'right', bold: true }) +
        cell(r.deltaText, SHEET_COLS[4], { align: 'right', color }) +
        cell(`${arrow} ${r.pctText}%`, SHEET_COLS[5], { align: 'right', color }) +
        '</w:tr>',
    );
  }

  body.push(
    '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/>' +
      TABLE_BORDERS +
      '</w:tblPr>' +
      `<w:tblGrid>${SHEET_COLS.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` +
      trs.join('') +
      '</w:tbl>',
  );

  body.push('<w:p/>');
  for (const line of sheet.footer) body.push(para(line, { size: 16, color: '64748B' }));

  // Portrait: six columns fit, and the sheet is a one-page document.
  return packBrandedDocx({
    body: body.join(''),
    brand: sheet.brand,
    pageXml:
      '<w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1500" w:right="720" w:bottom="1000" w:left="720" w:header="480" w:footer="480"/>',
  });
}

export { num as formatFigure, delta as formatDelta, pct as formatPct, rowColor };
