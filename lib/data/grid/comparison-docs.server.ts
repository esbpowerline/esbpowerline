import 'server-only';

import type { ComparisonRow } from '@/lib/data/grid/comparison';
import { packBrandedDocx } from '@/lib/data/grid/docx-package.server';
import { BRAND, type ExportBrand } from '@/lib/data/grid/export-brand.server';
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

/**
 * Bengali numerals → Western ("Arabic") numerals.
 *
 * The desk publishes the .txt sheet in Bengali numerals and that format is
 * reproduced byte for byte elsewhere. The branded DOCUMENT is typeset for a
 * wider readership: dates and figures print in Arabic digits while the labels,
 * units and footer stay Bengali in a Bengali face. Only ০–৯ are mapped — the
 * Hijri stamp line's Arabic-Indic digits are a different script and stay.
 */
function arabicDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6));
}

/** The brand block with the same digit policy applied to its Bengali lines. */
function brandWithArabicDigits(brand: ExportBrand, lang: Lang): ExportBrand {
  if (lang !== 'bn') return brand;
  return {
    ...brand,
    covers: arabicDigits(brand.covers),
    periodValue: arabicDigits(brand.periodValue),
    periodNote: brand.periodNote ? arabicDigits(brand.periodNote) : null,
    method: arabicDigits(brand.method),
    stampLines: brand.stampLines.map((l) =>
      l.script === 'bengali' ? { ...l, text: arabicDigits(l.text) } : l,
    ),
  };
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

type CellOpts = {
  bold?: boolean;
  color?: string;
  align?: 'left' | 'right' | 'center';
  shade?: string;
  size?: number;
};

function cell(text: string, width: number, o: CellOpts = {}): string {
  const align = o.align && o.align !== 'left' ? `<w:jc w:val="${o.align}"/>` : '';
  const shade = o.shade ? `<w:shd w:val="clear" w:fill="${o.shade}"/>` : '';
  const bold = o.bold ? '<w:b/>' : '';
  const color = o.color ? `<w:color w:val="${o.color}"/>` : '';
  // `w:szCs` sizes the complex-script (Bengali) run; without it Word falls back
  // to its own default and the Bengali text prints a size larger than the Latin
  // beside it, which is most of why the old file looked ragged.
  const sz = o.size ?? 18;
  const rpr = `${bold}${color}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
  return (
    `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${shade}<w:vAlign w:val="center"/></w:tcPr>` +
    `<w:p><w:pPr>${align}<w:spacing w:before="20" w:after="20"/><w:rPr>${rpr}</w:rPr></w:pPr>` +
    `<w:r><w:rPr>${rpr}</w:rPr>` +
    `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`
  );
}

function para(
  text: string,
  o: { bold?: boolean; size?: number; color?: string; align?: 'center' | 'right'; font?: string } = {},
): string {
  const sz = o.size ?? 20;
  const rpr =
    `${o.font ? `<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}"/>` : ''}` +
    `${o.bold ? '<w:b/>' : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}` +
    `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
  const jc = o.align ? `<w:jc w:val="${o.align}"/>` : '';
  return (
    `<w:p><w:pPr>${jc}<w:rPr>${rpr}</w:rPr></w:pPr>` +
    `<w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`
  );
}

/** The border set both tables use: hairline grid, firmer outer frame. */
const TABLE_BORDERS =
  '<w:tblBorders>' +
  ['top', 'left', 'bottom', 'right']
    .map((side) => `<w:${side} w:val="single" w:sz="8" w:space="0" w:color="94A3B8"/>`)
    .join('') +
  ['insideH', 'insideV']
    .map((side) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="D5DBE3"/>`)
    .join('') +
  '</w:tblBorders>';

/** Cell padding, so figures never sit against the rules. */
const TABLE_CELL_MARGINS =
  '<w:tblCellMar>' +
  '<w:top w:w="50" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/>' +
  '<w:left w:w="110" w:type="dxa"/><w:right w:w="110" w:type="dxa"/>' +
  '</w:tblCellMar>';

/** Shared table properties: style, width, borders and padding in one place. */
const TABLE_PROPS =
  '<w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/>' +
  TABLE_BORDERS +
  TABLE_CELL_MARGINS +
  '</w:tblPr>';

/** Zebra banding: every second data row, light enough to survive photocopying. */
const BAND = 'F8FAFC';
/** The header row: the brand green with white text, so the table opens clearly. */
const HEAD_SHADE = BRAND.greenHex;
const HEAD_TEXT = 'FFFFFF';

/** Column widths in twentieths of a point; they sum to the usable page width. */
const COLS = [3000, 1200, 1500, 1500, 1500, 1400, 2300];

export async function comparisonToDocx(meta: DocMeta): Promise<Buffer> {
  const t = strings(meta.lang);
  // Arabic digits throughout the typeset document; the Bengali labels keep
  // their own face. A no-op for English.
  const A = (s: string) => (meta.lang === 'bn' ? arabicDigits(s) : s);
  const body: string[] = [];

  body.push(para(A(t.docTitle), { bold: true, size: 30, color: BRAND.greenHex, font: 'Cambria', align: 'center' }));
  body.push(para(`${A(meta.a)}  vs  ${A(meta.b)}`, { size: 22, color: '475569', align: 'center' }));
  body.push('<w:p/>');

  const head =
    '<w:tr><w:trPr><w:tblHeader/></w:trPr>' +
    [
      cell(A(t.metric), COLS[0], { bold: true, shade: HEAD_SHADE, color: HEAD_TEXT, align: 'center' }),
      cell(A(t.unit), COLS[1], { bold: true, shade: HEAD_SHADE, color: HEAD_TEXT, align: 'center' }),
      cell(A(meta.a), COLS[2], { bold: true, shade: HEAD_SHADE, color: HEAD_TEXT, align: 'center' }),
      cell(A(meta.b), COLS[3], { bold: true, shade: HEAD_SHADE, color: HEAD_TEXT, align: 'center' }),
      cell(A(t.change), COLS[4], { bold: true, shade: HEAD_SHADE, color: HEAD_TEXT, align: 'center' }),
      cell(A(t.changePct), COLS[5], { bold: true, shade: HEAD_SHADE, color: HEAD_TEXT, align: 'center' }),
      cell(A(t.note), COLS[6], { bold: true, shade: HEAD_SHADE, color: HEAD_TEXT, align: 'center' }),
    ].join('') +
    '</w:tr>';

  const trs: string[] = [head];
  let current: string | null = null;
  let band = false;
  for (const r of meta.rows) {
    if (r.section !== current) {
      current = r.section;
      band = false;
      // A section heading spanning the full width, so the table still reads as
      // sections rather than 230 undifferentiated rows.
      trs.push(
        '<w:tr>' +
          `<w:tc><w:tcPr><w:tcW w:w="${COLS.reduce((a, b) => a + b, 0)}" w:type="dxa"/>` +
          `<w:gridSpan w:val="${COLS.length}"/><w:shd w:val="clear" w:fill="E2E8F0"/></w:tcPr>` +
          `<w:p><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">` +
          esc(A(sectionLabel(current, meta.sectionName(current), meta.lang)).toUpperCase()) +
          '</w:t></w:r></w:p></w:tc></w:tr>',
      );
    }
    const color = rowColor(r);
    const shade = band ? BAND : undefined;
    band = !band;
    trs.push(
      '<w:tr>' +
        cell(A(metricLabel(r.id, r.label, meta.lang)), COLS[0], { shade }) +
        cell(A(unitLabel(r.unit, meta.lang)), COLS[1], { align: 'center', shade, color: '64748B' }) +
        cell(A(num(r.a, meta.lang)), COLS[2], { align: 'center', shade }) +
        cell(A(num(r.b, meta.lang)), COLS[3], { align: 'center', shade }) +
        cell(A(delta(r.delta, meta.lang)), COLS[4], { align: 'center', color, shade }) +
        cell(A(pct(r.pct, meta.lang)), COLS[5], { align: 'center', color, shade }) +
        cell(A(r.note ?? ''), COLS[6], { color: '64748B', shade }) +
        '</w:tr>',
    );
  }

  body.push(
    '<w:tbl>' +
      TABLE_PROPS +
      `<w:tblGrid>${COLS.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` +
      trs.join('') +
      '</w:tbl>',
  );

  body.push('<w:p/>');
  body.push(para(A(t.docSource), { size: 16, color: '64748B' }));
  body.push(para(A(t.docDashRule), { size: 16, color: '64748B' }));
  for (const n of meta.notes) body.push(para(A(n), { size: 16, color: 'B45309' }));

  return packBrandedDocx({
    body: body.join(''),
    brand: brandWithArabicDigits(meta.brand, meta.lang),
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

/**
 * Column widths in twentieths of a point, summing to the portrait text width
 * (11906 page - 720 - 720 margins = 10466, less the table's own indent).
 *
 * They used to sum to 12000, which is 1,534 twips WIDER than the page they sit
 * on. `tblW` is auto, so Word did not complain — it silently re-fitted the six
 * columns to whatever it liked, which is why the file on disk never matched the
 * widths declared here and why Metric came out narrower than Unit. These are
 * the proportions the fitted document settles at, now stated rather than left
 * for the reader's word processor to guess: Word, LibreOffice and Google Docs
 * each guess differently.
 */
const SHEET_COLS = [2930, 1684, 1504, 1505, 1516, 1437];

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
  // The Bengali document keeps its Bengali labels and face but prints every
  // date and figure in Arabic digits — the register a formal report uses.
  const A = (s: string) => (bn ? arabicDigits(s) : s);
  // No timestamp line here: the branded package puts the download date, in all
  // three calendars, in the provenance block above the body.
  const body: string[] = [
    para(A(sheet.heading), { bold: true, size: 30, color: BRAND.greenHex, font: 'Cambria', align: 'center' }),
    para(A(sheet.subheading), { size: 22, color: '475569', align: 'center' }),
    '<w:p/>',
  ];

  const heads: string[] = [
    bn ? 'বিবরণ' : 'Metric',
    bn ? 'একক' : 'Unit',
    sheet.aLabel,
    sheet.bLabel,
    bn ? 'পরিবর্তন' : 'Change',
    bn ? 'পরিবর্তন %' : 'Change %',
  ];
  const trs = [
    '<w:tr><w:trPr><w:tblHeader/></w:trPr>' +
      heads
        .map((label, i) =>
          cell(A(label), SHEET_COLS[i], {
            bold: true,
            shade: HEAD_SHADE,
            color: HEAD_TEXT,
            align: 'center',
            size: 19,
          }),
        )
        .join('') +
      '</w:tr>',
  ];

  sheet.rows.forEach((r, i) => {
    // Coloured by whether the day got better, not by the sign — the same rule
    // as every other table here, which is why the rows carry a metric id.
    const v = verdictOf(r.id, r.delta);
    const color = v === 'up' ? GOOD : v === 'down' ? BAD : PLAIN;
    const arrow = r.delta >= 0 ? '▲' : '▼';
    const shade = i % 2 === 1 ? BAND : undefined;
    trs.push(
      '<w:tr>' +
        cell(A(r.label), SHEET_COLS[0], { bold: true, align: 'center', shade, size: 19 }) +
        cell(A(r.unit), SHEET_COLS[1], { color: '64748B', align: 'center', shade, size: 19 }) +
        cell(A(r.aText), SHEET_COLS[2], { align: 'center', color: '475569', shade, size: 19 }) +
        cell(A(r.bText), SHEET_COLS[3], { align: 'center', bold: true, shade, size: 19 }) +
        cell(A(r.deltaText), SHEET_COLS[4], { align: 'center', color, shade, size: 19 }) +
        cell(`${arrow} ${A(r.pctText)}%`, SHEET_COLS[5], { align: 'center', color, shade, size: 19 }) +
        '</w:tr>',
    );
  });

  body.push(
    '<w:tbl>' +
      TABLE_PROPS +
      `<w:tblGrid>${SHEET_COLS.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` +
      trs.join('') +
      '</w:tbl>',
  );

  body.push('<w:p/>');
  for (const line of sheet.footer) body.push(para(A(line), { size: 16, color: '64748B' }));

  // Portrait: six columns fit, and the sheet is a one-page document.
  return packBrandedDocx({
    body: body.join(''),
    brand: brandWithArabicDigits(sheet.brand, sheet.lang),
    pageXml:
      '<w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1500" w:right="720" w:bottom="1000" w:left="720" w:header="480" w:footer="480"/>',
  });
}

export { num as formatFigure, delta as formatDelta, pct as formatPct, rowColor };
