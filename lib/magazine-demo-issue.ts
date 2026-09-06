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
 * Where the issue's artwork lives: a PRIVATE Supabase Storage bucket.
 *
 * This used to be nginx on a Raspberry Pi (`http://esb-pi:8090`), reachable
 * only over Tailscale. That meant every page image, the cover and the PDF 404'd
 * for anyone off the tailnet, and broke outright whenever Tailscale was down —
 * which is exactly what happened. The Pi keeps its real job (daily and hourly
 * log collection); it is no longer in the path of anything a reader loads.
 *
 * The bucket stays private on purpose. The demo issue carries full-page mockup
 * adverts for real companies (see the note above), so the artwork must not be
 * fetchable by URL alone. Nothing here is a usable URL: these are object paths,
 * and lib/magazine-assets.ts signs them per render. Do not make the bucket
 * public to "simplify" this.
 *
 * Upload with scripts/upload-magazine-assets.mjs.
 */
export const MAGAZINE_BUCKET = process.env.MAGAZINE_BUCKET?.trim() || 'magazine';

/** Object-path prefix within the bucket; one issue per prefix. */
export const MAGAZINE_ISSUE_SLUG =
  process.env.MAGAZINE_ISSUE_SLUG?.trim() || 'vol001-issue01';

/** An object path inside MAGAZINE_BUCKET — not a URL. */
export const magazineObject = (path: string) =>
  `${MAGAZINE_ISSUE_SLUG}/${path.replace(/^\/+/, '')}`;

/**
 * Cover shown when Storage is unreachable or unconfigured, so the page still
 * has artwork instead of a broken image. Served from this app's own /public.
 */
export const MAGAZINE_FALLBACK_COVER = '/images/demo_magazine_cover.jpg';

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
  coverPath: magazineObject('cover.jpg'),
  /**
   * The web edition, not the print master. The 102 MB master exceeds this
   * Supabase project's 50 MB per-object limit and was a punishing download in
   * any case; scripts/render-magazine-pdf.mjs rebuilds the issue from
   * downsampled page renders at the same 587x803pt geometry.
   */
  pdfPath: magazineObject('a-shift-in-power-web.pdf'),
  /** 20 MB. Still worth warning about before someone taps it on mobile data. */
  pdfBytes: 21_424_118,
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

const pageStem = (i: number) => `page-${String(i + 1).padStart(2, '0')}.jpg`;

/** Every rendered page, 1..48, in order, as bucket object paths. */
export const PAGE_OBJECTS = Array.from({ length: DEMO_ISSUE.pageCount }, (_, i) =>
  magazineObject(`pages/${pageStem(i)}`),
);

export const THUMB_OBJECTS = Array.from({ length: DEMO_ISSUE.pageCount }, (_, i) =>
  magazineObject(`thumbs/${pageStem(i)}`),
);
