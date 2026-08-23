import 'server-only';

import { BRAND, exportLogo, footerNote, qrPng, type ExportBrand } from '@/lib/data/grid/export-brand.server';

/**
 * A branded .docx package: header, footer, page numbers, logo and QR.
 *
 * The writers above this only produce a body. Everything that makes the file
 * look like it came from ESB PowerLine — the mark on every page, the rule under
 * it, the footer note, the page count, the QR back to the live view — is
 * assembled here once, so the four documents cannot end up with four slightly
 * different letterheads.
 *
 * Word puts running headers and footers in their own parts rather than in the
 * body, which is why this is a package builder and not a paragraph helper: a
 * header needs its own XML part, its own relationships file for the image it
 * shows, its own content-type override, and a reference from the section
 * properties. Miss any one and Word opens the file with no header and no
 * complaint.
 */

const EMU_PER_PX = 9525; // 914400 EMU per inch / 96 px per inch

export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** An inline image run. `relId` must exist in the part's own relationships. */
function inlineImage(relId: string, id: number, name: string, wPx: number, hPx: number): string {
  const cx = Math.round(wPx * EMU_PER_PX);
  const cy = Math.round(hPx * EMU_PER_PX);
  return (
    '<w:r><w:drawing>' +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:docPr id="${id}" name="${esc(name)}"/>` +
    '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    `<pic:nvPicPr><pic:cNvPr id="${id}" name="${esc(name)}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
    '</pic:pic></a:graphicData></a:graphic></wp:inline>' +
    '</w:drawing></w:r>'
  );
}

const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

function headerXml(
  brand: ExportBrand,
  hasLogo: boolean,
  logoPx: { w: number; h: number },
  textWidth: number,
): string {
  const mark = hasLogo
    ? inlineImage('rIdHeaderLogo', 100, 'ESB PowerLine', logoPx.w, logoPx.h)
    : `<w:r><w:rPr><w:b/><w:color w:val="${BRAND.greenHex}"/><w:sz w:val="24"/></w:rPr>` +
      '<w:t>ESB POWERLINE</w:t></w:r>';

  // The download date, top right: Gregorian, Bangla and transliterated Hijri.
  // The Arabic-script Hijri line is deliberately left off — three calendars
  // date the file; the fourth was the same one twice.
  const dates = brand.stampLines
    .filter((l) => l.script !== 'arabic')
    .map(
      (l) =>
        `<w:p><w:pPr><w:jc w:val="right"/><w:spacing w:after="20"/></w:pPr>` +
        `<w:r><w:rPr><w:color w:val="${BRAND.secondaryHex}"/><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>` +
        `<w:t xml:space="preserve">${esc(l.text)}</w:t></w:r></w:p>`,
    )
    .join('');
  const dateColW = 5200;
  const markColW = Math.max(textWidth - dateColW, 3000);

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>` +
    // The mark on the left, the dates on the right, in a borderless table —
    // then the document's own name over the rule.
    '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>' +
    ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
      .map((side) => `<w:${side} w:val="none"/>`)
      .join('') +
    '</w:tblBorders></w:tblPr>' +
    `<w:tblGrid><w:gridCol w:w="${markColW}"/><w:gridCol w:w="${dateColW}"/></w:tblGrid>` +
    '<w:tr>' +
    `<w:tc><w:tcPr><w:tcW w:w="${markColW}" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr>` +
    `<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${mark}</w:p></w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="${dateColW}" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr>` +
    (dates || '<w:p/>') +
    '</w:tc></w:tr></w:tbl>' +
    '<w:p><w:pPr><w:pBdr>' +
    `<w:bottom w:val="single" w:sz="12" w:space="4" w:color="${BRAND.greenHex}"/>` +
    '</w:pBdr><w:spacing w:after="120"/></w:pPr>' +
    `<w:r><w:rPr><w:caps/><w:b/><w:color w:val="${BRAND.secondaryHex}"/><w:sz w:val="16"/><w:szCs w:val="16"/>` +
    `<w:spacing w:val="30"/></w:rPr><w:t xml:space="preserve">${esc(brand.kind)}</w:t></w:r>` +
    `<w:r><w:rPr><w:color w:val="${BRAND.mutedHex}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>` +
    `<w:t xml:space="preserve">   ${esc(brand.covers)}</w:t></w:r>` +
    '</w:p></w:hdr>'
  );
}

function footerXml(brand: ExportBrand, rightTabPos: number): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}>` +
    '<w:p><w:pPr><w:pBdr>' +
    `<w:top w:val="single" w:sz="6" w:space="4" w:color="${BRAND.hairHex}"/>` +
    `</w:pBdr><w:tabs><w:tab w:val="right" w:pos="${rightTabPos}"/></w:tabs></w:pPr>` +
    `<w:r><w:rPr><w:color w:val="${BRAND.mutedHex}"/><w:sz w:val="15"/><w:szCs w:val="15"/></w:rPr>` +
    `<w:t xml:space="preserve">${esc(footerNote(brand))}</w:t></w:r>` +
    '<w:r><w:tab/></w:r>' +
    // PAGE and NUMPAGES as real fields, so Word repaginates them itself.
    `<w:r><w:rPr><w:color w:val="${BRAND.mutedHex}"/><w:sz w:val="15"/><w:szCs w:val="15"/></w:rPr>` +
    '<w:fldChar w:fldCharType="begin"/></w:r>' +
    '<w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>' +
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>' +
    `<w:r><w:rPr><w:color w:val="${BRAND.mutedHex}"/><w:sz w:val="15"/><w:szCs w:val="15"/></w:rPr>` +
    '<w:t xml:space="preserve"> / </w:t></w:r>' +
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r>' +
    '<w:r><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r>' +
    '<w:r><w:fldChar w:fldCharType="end"/></w:r>' +
    '</w:p></w:ftr>'
  );
}

/**
 * The provenance block: what the document covers, and when it was pulled.
 *
 * The two dates are laid out differently on purpose. An export names the period
 * it compares and the day it was downloaded, and a reader six months later has
 * to tell them apart at a glance — a sheet comparing 19 August, downloaded on
 * the 21st, has been read as data for the 21st.
 */
export function provenanceTable(brand: ExportBrand, hasQr: boolean): string {
  const label = (t: string) =>
    `<w:p><w:pPr><w:spacing w:after="20"/></w:pPr><w:r><w:rPr><w:caps/><w:b/>` +
    `<w:color w:val="${BRAND.mutedHex}"/><w:sz w:val="13"/><w:szCs w:val="13"/><w:spacing w:val="30"/></w:rPr>` +
    `<w:t>${esc(t)}</w:t></w:r></w:p>`;
  const value = (t: string, bold = false) =>
    `<w:p><w:pPr><w:spacing w:after="20"/></w:pPr><w:r><w:rPr>${bold ? '<w:b/>' : ''}` +
    `<w:color w:val="${BRAND.inkHex}"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>` +
    `<w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;

  const note = (t: string) =>
    `<w:p><w:pPr><w:spacing w:after="40"/></w:pPr><w:r><w:rPr><w:i/>` +
    `<w:color w:val="${BRAND.mutedHex}"/><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>` +
    `<w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;

  const left =
    label(brand.periodLabel) +
    value(brand.periodValue, true) +
    (brand.periodNote ? note(brand.periodNote) : '') +
    // The download date itself lives in the running head, top right, so the
    // block below the letterhead carries only what the figures ARE: the
    // period, how they were arrived at, and what a blank means.
    note(brand.method);

  const right = hasQr
    ? inlineImage('rIdQr', 200, 'Open this comparison', 108, 108) +
      `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="${BRAND.mutedHex}"/>` +
      `<w:sz w:val="12"/></w:rPr><w:t xml:space="preserve">${esc(brand.qrCaption)}</w:t></w:r></w:p>`
    : '';

  return (
    '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>' +
    `<w:tblBorders><w:top w:val="none"/><w:bottom w:val="single" w:sz="6" w:space="4" w:color="${BRAND.hairHex}"/>` +
    '<w:left w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>' +
    '</w:tblBorders></w:tblPr>' +
    '<w:tblGrid><w:gridCol w:w="7600"/><w:gridCol w:w="2200"/></w:tblGrid>' +
    '<w:tr>' +
    `<w:tc><w:tcPr><w:tcW w:w="7600" w:type="dxa"/></w:tcPr>${left}</w:tc>` +
    '<w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr>' +
    (right || '<w:p/>') +
    '</w:tc>' +
    '</w:tr></w:tbl><w:p/>'
  );
}

export type DocxOptions = {
  body: string;
  /** Page size and margins; the header and footer references are added here. */
  pageXml: string;
  brand: ExportBrand;
};

export async function packBrandedDocx({ body, pageXml, brand }: DocxOptions): Promise<Buffer> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const logo = exportLogo();
  // 1.55 inches wide keeps the mark clear of the document title at 149px.
  const logoW = 149;
  const logoH = logo ? Math.round((logo.height / logo.width) * logoW) : 52;

  let qr: Buffer | null = null;
  if (brand.link) {
    try {
      qr = qrPng(brand.link, 'M', 6, 4);
    } catch {
      // A link too long to encode is not a reason to fail the download.
      qr = null;
    }
  }

  const sectPr =
    '<w:sectPr>' +
    '<w:headerReference r:id="rIdHeader" w:type="default"/>' +
    '<w:footerReference r:id="rIdFooter" w:type="default"/>' +
    pageXml +
    '</w:sectPr>';

  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}>` +
      `<w:body>${provenanceTable(brand, Boolean(qr))}${body}${sectPr}</w:body></w:document>`,
  );

  // The header's date column and the footer's page-number tab must sit at the
  // text width of THIS page — portrait and landscape differ, and a fixed
  // position leaves them floating mid-line.
  const pageW = Number(/<w:pgSz[^>]*\bw:w="(\d+)"/.exec(pageXml)?.[1] ?? 11906);
  const marL = Number(/\bw:left="(\d+)"/.exec(pageXml)?.[1] ?? 720);
  const marR = Number(/\bw:right="(\d+)"/.exec(pageXml)?.[1] ?? 720);
  const textWidth = pageW - marL - marR;
  zip.file('word/header1.xml', headerXml(brand, Boolean(logo), { w: logoW, h: logoH }, textWidth));
  zip.file('word/footer1.xml', footerXml(brand, textWidth));

  const docRels = [
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>',
    '<Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>',
  ];
  if (qr) {
    zip.file('word/media/qr.png', qr);
    docRels.push(
      '<Relationship Id="rIdQr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/qr.png"/>',
    );
  }
  if (logo) zip.file('word/media/logo.png', logo.bytes);

  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      docRels.join('') +
      '</Relationships>',
  );

  // The header shows the logo, so the image relationship belongs to the HEADER
  // part, not the document part. Word ignores a blip pointing at a relationship
  // the containing part does not own.
  zip.file(
    'word/_rels/header1.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      (logo
        ? '<Relationship Id="rIdHeaderLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>'
        : '') +
      '</Relationships>',
  );

  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' +
      '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
      '</Types>',
  );

  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>',
  );

  zip.file(
    'word/styles.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr>' +
      // `w:cs` is the complex-script face: it is what Word uses for the Bengali
      // rows, and why the .docx renders Bengali where the PDF cannot. `w:szCs`
      // must track `w:sz`, or Bengali prints a size larger than the Latin text
      // beside it — Word sizes the two scripts independently.
      '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Nirmala UI"/>' +
      '<w:sz w:val="20"/><w:szCs w:val="20"/>' +
      '</w:rPr></w:rPrDefault></w:docDefaults>' +
      '<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style>' +
      '</w:styles>',
  );

  return zip.generateAsync({ type: 'nodebuffer' }) as Promise<Buffer>;
}
