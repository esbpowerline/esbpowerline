import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { packBrandedDocx } from '@/lib/data/grid/docx-package.server';
import { buildBrand } from '@/lib/data/grid/export-brand.server';

/**
 * Word refuses a document whose markup is merely well-formed.
 *
 * Every .docx this package produced failed to open with "Word experienced an
 * error trying to open the file", and nothing in the package looked wrong: the
 * zip was valid, all fourteen parts parsed, every relationship id resolved, and
 * python-docx read it happily. The defect was a schema violation — the QR image
 * run sat directly inside the `w:tc` of the provenance table, where only
 * block-level content is allowed. Word rejects the whole document for that;
 * lenient readers do not.
 *
 * So these assert the structural rules a validating consumer applies, not that
 * the XML parses. Bisected against Word itself: wrapping the run in a `w:p` is
 * what turned "FAILED" into "OPENED".
 */

async function partsOf(body: string) {
  // `buildBrand` only produces a link — and so a QR — when the site origin is
  // configured. Without it there is nothing to embed and the cell-nesting rule
  // these tests exist for would never be exercised.
  process.env.NEXT_PUBLIC_SITE_URL ??= 'https://esbpowerline.com';
  const brand = buildBrand('Test document', 'covers', '/cms/yoy-sheet?x=1', undefined, 'en', [
    '2026-08-25',
    '2026-08-26',
  ]);
  expect(brand.link).toBeTruthy();
  // The provenance table (and with it the QR) is added by packBrandedDocx
  // itself, from the same `qr` value that decides the relationship — so a
  // caller cannot put the two out of step. Only the body goes in here.
  const buf = await packBrandedDocx({
    body,
    pageXml: '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>',
    brand,
  });
  const zip = await JSZip.loadAsync(buf);
  const read = async (name: string) => (await zip.file(name)!.async('string')) as string;
  return { zip, read };
}

const BLOCK_LEVEL = new Set([
  'w:p',
  'w:tbl',
  'w:tcPr',
  'w:sdt',
  'w:customXml',
  'w:bookmarkStart',
  'w:bookmarkEnd',
]);

/**
 * Element names appearing as a DIRECT child of any `w:tc`, minus the allowed
 * ones. Walked by hand rather than with a DOM: the repo has no XML parser
 * dependency, and adding one to assert a nesting rule would be a poor trade.
 */
function badCellChildren(xml: string): string[] {
  const bad: string[] = [];
  // Depth relative to the nearest enclosing w:tc; -1 when outside one entirely.
  const stack: number[] = [];
  for (const m of xml.matchAll(/<(\/?)(\w+:\w+)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = m;
    const inCell = stack.length > 0;
    if (selfClosing === '/') {
      if (inCell && stack[stack.length - 1] === 0 && !BLOCK_LEVEL.has(name!)) bad.push(name!);
      continue;
    }
    if (closing === '/') {
      if (name === 'w:tc') stack.pop();
      else if (inCell) stack[stack.length - 1]! -= 1;
      continue;
    }
    if (name === 'w:tc') {
      stack.push(0);
      continue;
    }
    if (inCell) {
      if (stack[stack.length - 1] === 0 && !BLOCK_LEVEL.has(name!)) bad.push(name!);
      stack[stack.length - 1]! += 1;
    }
  }
  return bad;
}

describe('the branded .docx package', () => {
  it('puts only block-level content inside a table cell', async () => {
    const { read } = await partsOf('<w:p><w:r><w:t>body</w:t></w:r></w:p>');
    // The provenance table is where the QR lives, and the header table carries
    // the logo — both put an image in a cell, which is how this went wrong.
    expect(badCellChildren(await read('word/document.xml'))).toEqual([]);
    expect(badCellChildren(await read('word/header1.xml'))).toEqual([]);
  });

  it('still embeds the QR, rather than passing by dropping it', async () => {
    const { read } = await partsOf('<w:p/>');
    const doc = await read('word/document.xml');
    expect(doc).toContain('r:embed="rIdQr"');
    // and it is inside a paragraph, not loose in the cell
    expect(doc).toMatch(/<w:tc>(?:(?!<\/w:tc>).)*?<w:p>[^]*?<w:drawing>/);
  });

  it('declares every relationship id it references', async () => {
    const { read } = await partsOf('<w:p/>');
    for (const [part, rels] of [
      ['word/document.xml', 'word/_rels/document.xml.rels'],
      ['word/header1.xml', 'word/_rels/header1.xml.rels'],
    ] as const) {
      const xml = await read(part);
      const declared = new Set([...(await read(rels)).matchAll(/Id="([^"]+)"/g)].map((m) => m[1]));
      const used = new Set([...xml.matchAll(/r:(?:embed|id)="([^"]+)"/g)].map((m) => m[1]));
      for (const id of used) expect(declared).toContain(id);
    }
  });

  it('compresses the package', async () => {
    // Stored rather than deflated made a 232-row comparison 641 KB instead of
    // 32 KB, and that file crosses a server action as base64.
    const big = '<w:p><w:r><w:t>row</w:t></w:r></w:p>'.repeat(4000);
    const { zip } = await partsOf(big);
    const doc = zip.file('word/document.xml')!;
    const raw = (await doc.async('string')).length;
    const packed = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    expect(raw).toBeGreaterThan(100_000);
    expect(packed.length).toBeLessThan(raw / 4);
  });
});
