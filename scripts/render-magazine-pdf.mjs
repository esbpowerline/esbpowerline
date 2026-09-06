/**
 * Renders one magazine issue from its print PDF into everything the site needs:
 * page images, thumbnails, a cover, and a web-edition PDF.
 *
 * Why a web edition exists: the print master of the demo issue is 102 MB, and
 * this Supabase project's global per-object upload limit is 50 MB, so the master
 * simply cannot live in Storage. It is also a hostile download — the old UI
 * warned about its size before anyone tapped it. This rebuilds the issue from
 * downsampled page renders, which is visually faithful at screen sizes and lands
 * around a third of the size. Text stops being selectable; that is the trade.
 *
 * The print master stays wherever it is archived. It is not what readers get.
 *
 * Usage:
 *   node scripts/render-magazine-pdf.mjs <printPdf> <outDir> [--width=1500] [--quality=80]
 *
 * Then upload with scripts/upload-magazine-assets.mjs.
 */
import * as mupdf from 'mupdf';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const [srcPdf, outDir] = args.filter((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : fallback;
};

if (!srcPdf || !outDir) {
  throw new Error('Usage: node scripts/render-magazine-pdf.mjs <printPdf> <outDir> [--width=1500] [--quality=80]');
}

/** Reader shows pages at 380 CSS px; 1500 covers 2x displays and pinch-zoom. */
const PAGE_WIDTH = flag('width', 1500);
const PAGE_QUALITY = flag('quality', 80);
const THUMB_WIDTH = 260;
const THUMB_QUALITY = 72;

const toBuffer = (b) =>
  Buffer.from(b instanceof Uint8Array ? b : (b.asUint8Array?.() ?? b.getUint8Array?.() ?? new Uint8Array(b)));

fs.mkdirSync(path.join(outDir, 'pages'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'thumbs'), { recursive: true });

const doc = mupdf.Document.openDocument(fs.readFileSync(srcPdf), 'application/pdf');
const pageCount = doc.countPages();
console.log(`${path.basename(srcPdf)}: ${pageCount} pages`);

/** Web-edition PDF, assembled page by page from the same renders. */
const webPdf = new mupdf.PDFDocument();
const pageJpegs = [];

for (let i = 0; i < pageCount; i += 1) {
  const page = doc.loadPage(i);
  const [x0, y0, x1, y1] = page.getBounds();
  const widthPt = x1 - x0;
  const heightPt = y1 - y0;
  const stem = `page-${String(i + 1).padStart(2, '0')}.jpg`;

  const renderJpeg = (targetWidth, quality) => {
    const scale = targetWidth / widthPt;
    const pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true);
    const jpeg = toBuffer(pixmap.asJPEG(quality));
    pixmap.destroy();
    return jpeg;
  };

  const pageJpeg = renderJpeg(PAGE_WIDTH, PAGE_QUALITY);
  fs.writeFileSync(path.join(outDir, 'pages', stem), pageJpeg);
  fs.writeFileSync(path.join(outDir, 'thumbs', stem), renderJpeg(THUMB_WIDTH, THUMB_QUALITY));
  pageJpegs.push({ jpeg: pageJpeg, widthPt, heightPt });

  if ((i + 1) % 8 === 0 || i + 1 === pageCount) console.log(`  rendered ${i + 1}/${pageCount}`);
}

fs.copyFileSync(path.join(outDir, 'pages', 'page-01.jpg'), path.join(outDir, 'cover.jpg'));

// Each web-PDF page is one full-bleed image at the original page geometry, so
// page size and aspect match the print issue exactly.
for (const { jpeg, widthPt, heightPt } of pageJpegs) {
  const image = webPdf.addImage(new mupdf.Image(new mupdf.Buffer(jpeg)));
  const resources = webPdf.addObject({ XObject: { Im0: image } });
  const contents = `${widthPt} 0 0 ${heightPt} 0 0 cm /Im0 Do`;
  webPdf.insertPage(-1, webPdf.addPage([0, 0, widthPt, heightPt], 0, resources, contents));
}

const webPdfPath = path.join(outDir, `${path.basename(srcPdf, '.pdf').toLowerCase().replace(/\s+/g, '-')}-web.pdf`);
fs.writeFileSync(webPdfPath, toBuffer(webPdf.saveToBuffer('compress')));

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
console.log('\ndone');
console.log(`  images:  ${outDir}`);
console.log(`  web pdf: ${webPdfPath} (${mb(fs.statSync(webPdfPath).size)}, print master ${mb(fs.statSync(srcPdf).size)})`);
