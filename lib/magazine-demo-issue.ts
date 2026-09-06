/**
 * The one magazine issue the site currently has: a DEMO issue.
 *
 * Every figure, title, page number and name below is transcribed from the
 * artwork PDF ("A Shift in Power", Vol 001 / Issue 01, 48pp, produced
 * 2026-07-28). Nothing here is invented — the page this feeds used to ship a
 * hand-written feature list ("Solar + Wind Pipeline 2026-2030", "Rooppur
 * Commissioning Timeline") that corresponded to no real article, alongside a
 * hardcoded "12 pages" on every card. If you edit this file, read it off the
 * PDF; do not improve the copy.
 *
 * It is a DEMO and the site must say so. The issue carries full-page adverts
 * for JERA Meghnaghat, Summit Power International and Excelerate Energy, and
 * its own contents page labels one "ADVERTISEMENT · HALF PAGE · 176 × 87 MM" —
 * i.e. they are layout mockups, not sold placements. Publishing this as a real
 * issue would imply commercial relationships that do not exist. `IS_DEMO` is
 * what the UI keys its badges off; do not quietly flip it.
 */

export const IS_DEMO = true;

/**
 * Where the rendered page images are served from.
 *
 * They were staged on the Raspberry Pi (nginx on :8090, `/srv/magazine`), which
 * is reachable only over Tailscale. That was right for review and wrong the
 * moment the page shipped: an `http://` image on the deployed `https://` page is
 * blocked as mixed content, and next.config.ts's CSP `img-src` never listed that
 * origin — so the cover, all 48 thumbnails and the reader were blank for every
 * visitor, including anyone on the tailnet browsing the deployed site rather
 * than localhost. Mirrored to Supabase storage 2026-09-06 (97 objects, 20.9 MB)
 * by `scripts/upload-magazine-assets.ts`; the Supabase host is already allowed
 * by that CSP and by next.config's image `remotePatterns`.
 *
 * Set NEXT_PUBLIC_MAGAZINE_ASSET_BASE to point somewhere else.
 */
export const MAGAZINE_ASSET_BASE =
  process.env.NEXT_PUBLIC_MAGAZINE_ASSET_BASE?.replace(/\/+$/, '') ||
  'https://sxgokpmrbgdndstygapc.supabase.co/storage/v1/object/public/media/magazine/vol001-issue01';

export const magazineAsset = (path: string) =>
  `${MAGAZINE_ASSET_BASE}/${path.replace(/^\/+/, '')}`;

/**
 * The full-resolution PDF, which did NOT move with the artwork.
 *
 * It is 106,933,904 bytes. The `media` bucket carries a 10 MB per-object limit
 * and Supabase's free plan caps a standard upload at 50 MB, so it cannot go
 * where the page images went; at 102 MB a download is also ~2% of the project's
 * 5 GB monthly egress, shared with every image on the site. It therefore stays
 * on the Pi and remains reachable only over Tailscale — the download button is
 * member-gated and will not resolve for a public reader. Point
 * NEXT_PUBLIC_MAGAZINE_PDF_URL at a real host to light it up.
 */
export const MAGAZINE_PDF_URL =
  process.env.NEXT_PUBLIC_MAGAZINE_PDF_URL?.trim() ||
  'http://esb-pi:8090/vol001-issue01/a-shift-in-power.pdf';

export const DEMO_ISSUE = {
  title: 'A Shift in Power',
  volume: 'Vol 001',
  issue: 'Issue 01',
  pageCount: 48,
  /** The PDF's own creation date; there is no cover date printed on the issue. */
  producedOn: '2026-07-28',
  priceLabel: 'Tk 100',
  cadence: 'Printed fortnightly',
  publisher:
    'ESB Media Ltd, House 36/1, Avenue 01, Block-A, Section-10, Mirpur, Dhaka-1216',
  /** Cover standfirst, transcribed verbatim. */
  standfirst:
    'Fuel loading begins at Rooppur as a distant war halves the LNG lifeline — the summer Bangladesh’s energy security was stress-tested.',
  coverUrl: magazineAsset('cover.jpg'),
  pdfUrl: MAGAZINE_PDF_URL,
  /** The file's own size on disk. Worth warning about before someone taps it
   *  on mobile data. This read 106_954_752 — a round 102 MiB, not the file. */
  pdfBytes: 106_933_904,
} as const;

/** The three figures printed on the cover. */
export const COVER_STATS = [
  { value: '50%', label: 'QatarEnergy cargoes withdrawn for 2026' },
  { value: '$1.07bn', label: 'Extra LNG subsidy, April–June (IEEFA)' },
  { value: '2,400 MW', label: 'Rooppur capacity entering the grid' },
] as const;

/** Masthead, page 3. */
export const MASTHEAD = [
  { name: 'Farid Uddin Ahmed', role: 'Editor & Publisher' },
  { name: 'Mehedi Hasan Hamim', role: 'Sub Editor' },
  { name: 'Prof Jamal Uddin Runu', role: 'Advisory Editor' },
  { name: 'Rasel Seikh', role: 'Advisory Editor' },
  { name: 'Mostofa Akmal', role: 'Advisory Editor' },
  { name: 'Dr Mahamudur Rashid', role: 'International Editor (Doha, Qatar)' },
] as const;

/**
 * The printed table of contents, page 3. `page` is the page number printed in
 * the magazine, which is also its index in the rendered page images.
 */
export const CONTENTS = [
  { page: 5,  section: 'Lead News',            title: 'A Shift in Power',                      pages: 3 },
  { page: 9,  section: 'Headline News',        title: 'The War Bill Lands on the Meter',       pages: 2 },
  { page: 11, section: 'Opinion',              title: 'Targets Are Not Transition',            pages: 2 },
  { page: 13, section: 'Headline News',        title: 'Sharing the Dark',                      pages: 2 },
  { page: 16, section: 'Headline News',        title: 'The State Steps Back from the Meter',   pages: 2 },
  { page: 18, section: 'Opinion',              title: 'The Import Trap',                       pages: 2 },
  { page: 21, section: 'Day Event · Follow-up', title: 'Ninety Days That Tested the Grid',     pages: 6 },
  { page: 27, section: 'Featuring BD',         title: 'The Roof Above, the Grid Below',        pages: 2 },
  { page: 30, section: 'Government Decision',  title: 'Approvals in a Hurry',                  pages: 2 },
  { page: 32, section: 'International News',   title: 'After the Strait Reopened',             pages: 3 },
  { page: 35, section: 'Power Grid',           title: 'One Terminal Down',                     pages: 1 },
  { page: 36, section: 'Economy',              title: 'Subsidy Arithmetic',                    pages: 1 },
  { page: 37, section: 'Renewable',            title: 'Tenders at Last',                       pages: 2 },
  { page: 39, section: "Editor's Note",        title: 'The Stress Test',                       pages: 1 },
  { page: 42, section: 'Worldwatch',           title: 'Worldwatch: The Wires This Fortnight',  pages: 2 },
  { page: 44, section: 'Data',                 title: 'Grid Explorer',                         pages: 1 },
  { page: 45, section: 'Climate · Global',     title: 'The Thermometer and the Ledger',        pages: 2 },
] as const;

/** Every rendered page, 1..48, in order. */
export const PAGE_IMAGES = Array.from({ length: DEMO_ISSUE.pageCount }, (_, i) =>
  magazineAsset(`pages/page-${String(i + 1).padStart(2, '0')}.jpg`),
);

export const THUMB_IMAGES = Array.from({ length: DEMO_ISSUE.pageCount }, (_, i) =>
  magazineAsset(`thumbs/page-${String(i + 1).padStart(2, '0')}.jpg`),
);
