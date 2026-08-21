import 'server-only';

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Path,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer';
import {
  BRAND,
  exportLogo,
  footerNote,
  encodeQr,
  qrToSvgPath,
  type ExportBrand,
} from '@/lib/data/grid/export-brand.server';
import { F, FM, FB } from '@/lib/data/grid/grid-export-fonts.server';
import {
  formatDelta,
  formatFigure,
  formatPct,
  type DocMeta,
  type SheetDoc,
} from '@/lib/data/grid/comparison-docs.server';
import { metricLabel, sectionLabel, unitLabel, verdictOf, strings } from '@/lib/data/grid/comparison-i18n';

/**
 * The comparison as a PDF, in the same shape as the .docx: one landscape table,
 * grouped by section, changes coloured by whether they were an improvement.
 *
 * The Bengali problem is handled once, here. `bengaliPdfFont` returns null when
 * no Bengali face is installed in public/fonts, and this renderer then prints
 * the English document and stamps a line at the top saying the Bengali PDF was
 * unavailable. A PDF of empty boxes looks like a bug in the data; a PDF that
 * says which language it is in does not.
 *
 * ## Known limitation: Bengali conjuncts
 *
 * With the font present the Bengali pages are legible, but they are not
 * typographically correct. react-pdf shapes text with fontkit, whose Indic
 * support does not reliably form the ra-conjuncts: on a rendered page
 * "পরিবর্তন" comes out as "পরিবতর", "প্রতিবেদন" as "পত্রিবেদন" and "গ্রিড" as
 * "গিড্র" — the reph and ra-phala attach to the wrong consonant. Vowel signs,
 * numerals and every other cluster render correctly.
 *
 * Nothing in this file can fix that; it is the shaper, not the font, and not
 * the text. The .docx path has no such problem, because Word shapes the text
 * itself with the reader's own system — so Bengali that is going to be read
 * closely, or printed, should go out as .docx. The panel says as much beside
 * the PDF button whenever Bengali is selected.
 */

/**
 * Word gets Bengali from the reader's own machine. A PDF does not — it embeds
 * the font it prints with, and Source Sans 3, which every other export here
 * uses, has no Bengali coverage at all: a Bengali PDF built with it comes out
 * as a page of empty boxes.
 *
 * So this returns the registered family when a Bengali face is sitting in
 * public/fonts, and null when it is not. Both callers below degrade honestly on
 * null rather than emitting tofu — the comparison prints in English and says
 * why, and the year-on-year sheet, which is Bengali throughout and has nothing
 * to degrade to, refuses with an explanation.
 */
let bengaliFamily: string | null | undefined;

export function bengaliPdfFont(): string | null {
  if (bengaliFamily !== undefined) return bengaliFamily;

  const p = join(process.cwd(), 'public', 'fonts', 'NotoSansBengali-Regular.ttf');
  if (!existsSync(p)) {
    bengaliFamily = null;
    return null;
  }
  try {
    // Base64 data URI rather than a path, for the same reason the report fonts
    // use one: it works on serverless regardless of cwd and file-url quirks.
    Font.register({
      family: 'NotoBn',
      src: `data:font/ttf;base64,${readFileSync(p).toString('base64')}`,
    });
    bengaliFamily = 'NotoBn';
  } catch {
    bengaliFamily = null;
  }
  return bengaliFamily;
}

/**
 * A figure whose leading ▲ or ▼ is drawn by the Latin face.
 *
 * Noto Sans Bengali carries no U+25B2/U+25BC, and react-pdf has no glyph-level
 * fallback — a missing glyph is drawn as a stray mark, which is what appeared
 * beside every percentage on the first Bengali pages. Substituting `+` and `−`
 * fixed that but lost the desk's own notation.
 *
 * A nested `Text` keeps both: the triangle comes from Source Sans 3, which has
 * it, and the digits from whichever face the row is set in. react-pdf inherits
 * styles into nested Text, so this is one run visually.
 */
function Marked({ value, family }: { value: string; family: string }) {
  const match = /^([▲▼])\s*(.*)$/.exec(value);
  if (!match) return <Text style={{ fontFamily: family }}>{value}</Text>;
  return (
    <Text style={{ fontFamily: family }}>
      <Text style={{ fontFamily: F }}>{match[1]}</Text>
      {` ${match[2]}`}
    </Text>
  );
}

/**
 * An Arabic face, if one has been installed.
 *
 * None ships today, so the Hijri date prints in its transliterated Latin form
 * and the Arabic-script line is left out. Dropping `NotoNaskhArabic-Regular.ttf`
 * into public/fonts is all it takes to turn it on — the same arrangement the
 * Bengali face uses.
 */
let arabicFamily: string | null | undefined;

export function arabicPdfFont(): string | null {
  if (arabicFamily !== undefined) return arabicFamily;
  const p = join(process.cwd(), 'public', 'fonts', 'NotoNaskhArabic-Regular.ttf');
  if (!existsSync(p)) {
    arabicFamily = null;
    return null;
  }
  try {
    Font.register({
      family: 'NotoAr',
      src: `data:font/ttf;base64,${readFileSync(p).toString('base64')}`,
    });
    arabicFamily = 'NotoAr';
  } catch {
    arabicFamily = null;
  }
  return arabicFamily;
}

// Never hyphen-break a metric name mid-cell.
Font.registerHyphenationCallback((word) => [word]);

const INK = '#111827';
const SECONDARY = '#475569';
const MUTED = '#94a3b8';
const HAIR = '#e5e7eb';
const BAND = '#f1f5f9';
const SECTION_BG = '#e2e8f0';
const GOOD = '#15803d';
const BAD = '#b91c1c';
const WARM = '#b45309';

/** Percent of the content width. They sum to 100. */
const W = [26, 9, 12, 12, 12, 11, 18];

const s = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 34, paddingHorizontal: 28, fontFamily: F, color: INK },
  title: { fontFamily: FB, fontSize: 14, letterSpacing: 0.2 },
  sub: { fontFamily: F, fontSize: 9, color: SECONDARY, marginTop: 3 },
  stamp: { fontFamily: F, fontSize: 7, color: MUTED, marginTop: 2 },
  warn: { fontFamily: FM, fontSize: 7.5, color: WARM, marginTop: 6 },

  headRow: { flexDirection: 'row', backgroundColor: BAND, borderBottomWidth: 1, borderBottomColor: HAIR },
  headCell: { fontFamily: FM, fontSize: 7, paddingVertical: 5, paddingHorizontal: 4, color: SECONDARY },

  sectionRow: { backgroundColor: SECTION_BG, paddingVertical: 3, paddingHorizontal: 4, marginTop: 6 },
  sectionText: { fontFamily: FB, fontSize: 7.5, letterSpacing: 0.6 },

  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: HAIR },
  cell: { fontSize: 7.5, paddingVertical: 3.5, paddingHorizontal: 4 },

  footer: { marginTop: 10, borderTopWidth: 1, borderTopColor: HAIR, paddingTop: 6 },
  foot: { fontSize: 7, color: SECONDARY, marginBottom: 2 },
  note: { fontSize: 7, color: WARM, marginBottom: 2 },
});

function colorFor(id: string, delta: number | null): string | undefined {
  const v = verdictOf(id, delta);
  return v === 'up' ? GOOD : v === 'down' ? BAD : undefined;
}

function ComparisonDocument({ meta, bengaliMissing }: { meta: DocMeta; bengaliMissing: boolean }) {
  // Falling back to a Latin font is not enough on its own: the labels would
  // still be Bengali, printed with glyphs that do not exist, and the page came
  // out as mojibake rather than as the English document the banner promises.
  // The whole document drops to English, and only the banner says why.
  const lang = bengaliMissing ? 'en' : meta.lang;
  const t = strings(lang);
  const bn = lang === 'bn';
  const family = bn ? bengaliPdfFont() ?? F : F;

  const rows: React.ReactNode[] = [];
  let current: string | null = null;

  meta.rows.forEach((r, i) => {
    if (r.section !== current) {
      current = r.section;
      rows.push(
        // `wrap={false}` keeps a heading from being the last thing on a page
        // with its first row overleaf.
        <View key={`s-${current}-${i}`} style={s.sectionRow} wrap={false}>
          <Text style={[s.sectionText, { fontFamily: bn ? family : FB }]}>
            {sectionLabel(current, meta.sectionName(current), lang).toUpperCase()}
          </Text>
        </View>,
      );
    }
    const c = colorFor(r.id, r.delta);
    rows.push(
      <View key={r.id} style={s.row} wrap={false}>
        <Text style={[s.cell, { width: `${W[0]}%`, fontFamily: family }]}>
          {metricLabel(r.id, r.label, lang)}
        </Text>
        <Text style={[s.cell, { width: `${W[1]}%`, color: SECONDARY, fontFamily: family }]}>
          {unitLabel(r.unit, lang)}
        </Text>
        <Text style={[s.cell, { width: `${W[2]}%`, textAlign: 'right', fontFamily: family }]}>
          {formatFigure(r.a, lang)}
        </Text>
        <Text style={[s.cell, { width: `${W[3]}%`, textAlign: 'right', fontFamily: family }]}>
          {formatFigure(r.b, lang)}
        </Text>
        <Text style={[s.cell, { width: `${W[4]}%`, textAlign: 'right', color: c, fontFamily: family }]}>
          {formatDelta(r.delta, lang)}
        </Text>
        <Text style={[s.cell, { width: `${W[5]}%`, textAlign: 'right', color: c }]}>
          <Marked value={formatPct(r.pct, lang)} family={family} />
        </Text>
        <Text style={[s.cell, { width: `${W[6]}%`, color: MUTED, fontFamily: family }]}>
          {r.note ?? ''}
        </Text>
      </View>,
    );
  });

  const heads = [t.metric, t.unit, meta.a, meta.b, t.change, t.changePct, t.note];

  return (
    <Document title={`${t.docTitle} ${meta.a} vs ${meta.b}`}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <RunningHead brand={meta.brand} family={family} />
        <RunningFoot brand={meta.brand} />
        {/* Every style that prints a TRANSLATED string has to carry the
            Bengali family explicitly. The stylesheet pins F/FM/FB — Source
            Sans 3 — and a Bengali word rendered with it comes out as mojibake
            even when the rest of the page is correct. */}
        <Text style={[s.title, { fontFamily: bn ? family : FB }]}>{t.docTitle}</Text>
        <Provenance brand={meta.brand} family={family} />
        {bengaliMissing && (
          <Text style={s.warn}>
            This PDF is in English. A Bengali PDF needs a Bengali font in public/fonts
            (NotoSansBengali-Regular.ttf); without one every Bengali character embeds as an empty
            box. The Word export carries Bengali correctly in the meantime.
          </Text>
        )}

        {/* Repeated on every page: a 230-row table whose headings appear once
            is unreadable from page two onward. */}
        <View style={[s.headRow, { marginTop: 10 }]} fixed>
          {heads.map((h, i) => (
            <Text
              key={h + i}
              style={[
                s.headCell,
                {
                  width: `${W[i]}%`,
                  textAlign: i >= 2 && i <= 5 ? 'right' : 'left',
                  fontFamily: bn ? family : FM,
                },
              ]}
            >
              {h}
            </Text>
          ))}
        </View>

        {rows}

        <View style={s.footer}>
          <Text style={[s.foot, { fontFamily: family }]}>{t.docSource}</Text>
          <Text style={[s.foot, { fontFamily: family }]}>{t.docDashRule}</Text>
          {meta.notes.map((n) => (
            <Text key={n} style={[s.note, { fontFamily: family }]}>
              {n}
            </Text>
          ))}
        </View>

      </Page>
    </Document>
  );
}

export async function comparisonToPdf(meta: DocMeta): Promise<Buffer> {
  const bengaliMissing = meta.lang === 'bn' && bengaliPdfFont() === null;
  return renderToBuffer(<ComparisonDocument meta={meta} bengaliMissing={bengaliMissing} />);
}

/* ── the running chrome ──────────────────────────────────────────────────── */

const brandStyles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 6,
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND.green,
  },
  headLogo: { height: 22, objectFit: 'contain' },
  headWord: { fontFamily: FB, fontSize: 12, color: BRAND.green, letterSpacing: 0.4 },
  headKind: { fontFamily: FM, fontSize: 7.5, color: SECONDARY, letterSpacing: 0.7 },
  headCovers: { fontFamily: F, fontSize: 7.5, color: MUTED, marginTop: 1 },

  foot: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.75,
    borderTopColor: HAIR,
    paddingTop: 4,
  },
  footText: { fontFamily: F, fontSize: 6.5, color: MUTED },

  provenance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.75,
    borderBottomColor: HAIR,
  },
  label: { fontFamily: FM, fontSize: 6.5, color: MUTED, letterSpacing: 0.9, marginBottom: 2 },
  covers: { fontFamily: FB, fontSize: 11.5, color: BRAND.ink, letterSpacing: -0.1 },
  // No italic: only one weight of Source Sans 3 is registered, and react-pdf
  // refuses to synthesise a face it was not given rather than faking a slant.
  // Colour and size carry the de-emphasis instead.
  periodNote: { fontFamily: F, fontSize: 7, color: MUTED, marginTop: 2 },
  stamp: { fontSize: 8.5, color: SECONDARY, marginTop: 1 },
  method: { fontFamily: F, fontSize: 6.8, color: MUTED, lineHeight: 1.5, marginTop: 8 },
  qrCaption: { fontFamily: F, fontSize: 5.5, color: MUTED, textAlign: 'center', marginTop: 3 },
});

/**
 * The running head, repeated on every page.
 *
 * `fixed` is what makes react-pdf repeat it; the logo is drawn from a data URI
 * so nothing is fetched at render time.
 */
/**
 * `family` is not optional decoration: the period line in the head is the
 * document's own `covers` string, which is Bengali in a Bengali document, and
 * the stylesheet pins Source Sans 3. Drawn with that, the running head on every
 * Bengali page came out as mojibake while the table below it read perfectly.
 */
function RunningHead({ brand, family }: { brand: ExportBrand; family: string }) {
  const logo = exportLogo();
  return (
    <View style={brandStyles.head} fixed>
      {logo ? (
        // react-pdf's Image draws into a PDF, not into a DOM; there is no alt
        // attribute in the format and nothing to read it.
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={logo.dataUri} style={[brandStyles.headLogo, { width: (logo.width / logo.height) * 22 }]} />
      ) : (
        <Text style={brandStyles.headWord}>ESB POWERLINE</Text>
      )}
      <View>
        <Text style={[brandStyles.headKind, { textAlign: 'right' }]}>{brand.kind.toUpperCase()}</Text>
        <Text style={[brandStyles.headCovers, { textAlign: 'right', fontFamily: family }]}>
          {brand.covers}
        </Text>
      </View>
    </View>
  );
}

function RunningFoot({ brand }: { brand: ExportBrand }) {
  return (
    <View style={brandStyles.foot} fixed>
      <Text style={brandStyles.footText}>{footerNote(brand)}</Text>
      <Text
        style={brandStyles.footText}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

/**
 * What the document covers, and when it was pulled — kept visibly apart.
 *
 * The QR is drawn as vector paths rather than an embedded image: a PDF scales,
 * and a 25-module code rasterised at export size is exactly the thing that
 * fails to scan on paper.
 */
function Provenance({ brand, family }: { brand: ExportBrand; family: string }) {
  let path: string | null = null;
  let modules = 0;
  if (brand.link) {
    try {
      const qr = encodeQr(brand.link, 'M');
      modules = qr.size;
      path = qrToSvgPath(qr);
    } catch {
      path = null;
    }
  }
  const side = 62;

  return (
    <View style={brandStyles.provenance}>
      <View style={{ flexGrow: 1, paddingRight: 16 }}>
        <Text style={[brandStyles.label, { fontFamily: family }]}>
          {brand.periodLabel.toUpperCase()}
        </Text>
        <Text style={[brandStyles.covers, { fontFamily: family }]}>{brand.periodValue}</Text>
        {brand.periodNote && (
          <Text style={[brandStyles.periodNote, { fontFamily: family }]}>{brand.periodNote}</Text>
        )}
        <Text style={[brandStyles.label, { marginTop: 8, fontFamily: family }]}>
          {brand.retrievedLabel.toUpperCase()}
        </Text>
        {/* A face per line. The stamp is multi-script whatever language the
            document is in, and a PDF embeds the font it draws with — so the
            Bangla line needs the Bengali face even on an English page, and a
            line with no face available is dropped rather than printed as
            mojibake. There is no Arabic face in public/fonts, so the Hijri
            date prints transliterated and its Arabic form is omitted; adding
            one there is all it would take. */}
        {brand.stampLines.map((line) => {
          const face =
            line.script === 'bengali'
              ? bengaliPdfFont()
              : line.script === 'arabic'
                ? arabicPdfFont()
                : F;
          if (!face) return null;
          return (
            <Text key={line.text} style={[brandStyles.stamp, { fontFamily: face }]}>
              {line.text}
            </Text>
          );
        })}
        {/* How the figures were arrived at, and what a blank means — the two
            things a reader needs before quoting a number off this page. */}
        <Text style={[brandStyles.method, { fontFamily: family }]}>{brand.method}</Text>
      </View>
      {path && (
        <View style={{ width: 96, alignItems: 'center' }}>
          {/* A quiet zone of four modules is part of the spec, not decoration:
              without it a reader cannot find the edge of the code. */}
          <Svg width={side} height={side} viewBox={`-4 -4 ${modules + 8} ${modules + 8}`}>
            <Path d={`M-4 -4h${modules + 8}v${modules + 8}h-${modules + 8}z`} fill="#ffffff" />
            <Path d={path} fill={BRAND.ink} />
          </Svg>
          <Text style={[brandStyles.qrCaption, { fontFamily: family }]}>{brand.qrCaption}</Text>
        </View>
      )}
    </View>
  );
}

/* ── the year-on-year sheet ──────────────────────────────────────────────── */

const SW = [30, 16, 14, 14, 14, 12];

/**
 * The sheet as the same table the panel previews.
 *
 * It used to set `text` as monospaced lines, which is what that block is for —
 * but its columns are held together by space padding, and there is no
 * monospaced Bengali face to hold them with, so the Bengali PDF came out
 * ragged. Nothing here formats a figure: every column arrives already
 * formatted by the engine, which is what keeps the document, the preview and
 * the published .txt saying the same numbers.
 */
export async function sheetToPdf(sheet: SheetDoc): Promise<Buffer> {
  const bn = sheet.lang === 'bn';
  const family = bn ? bengaliPdfFont() : F;
  if (!family) {
    throw new Error(
      'A Bengali PDF has to embed the font it prints with, and no Bengali face is installed. ' +
        'Add NotoSansBengali-Regular.ttf to public/fonts, or use the Word export, which takes ' +
        'Bengali from the reader’s own system.',
    );
  }

  const heads = [
    bn ? 'বিবরণ' : 'Metric',
    bn ? 'একক' : 'Unit',
    sheet.aLabel,
    sheet.bLabel,
    bn ? 'পরিবর্তন' : 'Change',
    bn ? 'পরিবর্তন %' : 'Change %',
  ];

  return renderToBuffer(
    <Document title={`${sheet.heading} ${sheet.subheading}`}>
      <Page size="A4" style={s.page}>
        <RunningHead brand={sheet.brand} family={family} />
        <RunningFoot brand={sheet.brand} />
        <Text style={[s.title, { fontFamily: bn ? family : FB, fontSize: 13 }]}>{sheet.heading}</Text>
        <Provenance brand={sheet.brand} family={family} />

        <View style={[s.headRow, { marginTop: 12 }]}>
          {heads.map((h, i) => (
            <Text
              key={h + i}
              style={[
                s.headCell,
                { width: `${SW[i]}%`, fontSize: 8, textAlign: i >= 2 ? 'right' : 'left', fontFamily: family },
              ]}
            >
              {h}
            </Text>
          ))}
        </View>

        {sheet.rows.map((r) => {
          const v = verdictOf(r.id, r.delta);
          const c = v === 'up' ? GOOD : v === 'down' ? BAD : undefined;
          const arrow = r.delta >= 0 ? '▲' : '▼';
          return (
            <View key={r.id} style={s.row} wrap={false}>
              <Text style={[s.cell, { width: `${SW[0]}%`, fontSize: 9, fontFamily: family }]}>
                {r.label}
              </Text>
              <Text style={[s.cell, { width: `${SW[1]}%`, fontSize: 8.5, color: SECONDARY, fontFamily: family }]}>
                {r.unit}
              </Text>
              <Text style={[s.cell, { width: `${SW[2]}%`, fontSize: 9, textAlign: 'right', color: SECONDARY, fontFamily: family }]}>
                {r.aText}
              </Text>
              <Text style={[s.cell, { width: `${SW[3]}%`, fontSize: 9.5, textAlign: 'right', fontFamily: bn ? family : FB }]}>
                {r.bText}
              </Text>
              <Text style={[s.cell, { width: `${SW[4]}%`, fontSize: 9, textAlign: 'right', color: c, fontFamily: family }]}>
                {r.deltaText}
              </Text>
              <Text style={[s.cell, { width: `${SW[5]}%`, fontSize: 9, textAlign: 'right', color: c }]}>
                <Marked value={`${arrow} ${r.pctText}%`} family={family} />
              </Text>
            </View>
          );
        })}

        <View style={s.footer}>
          {sheet.footer.map((line) => (
            <Text key={line} style={[s.foot, { fontFamily: family }]}>
              {line}
            </Text>
          ))}
        </View>
      </Page>
    </Document>,
  );
}
