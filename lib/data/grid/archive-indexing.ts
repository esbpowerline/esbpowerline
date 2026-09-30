/**
 * Which archive day pages ask to be indexed.
 *
 * Every day from 2013 has a page at `/grid-explorer/{date}` (SEO_FIX_LOG stage
 * 8), and all ~4,578 were submitted. Search Console, read 2026-09-30: 96
 * indexed, ~1,000 "crawled — currently not indexed" and ~4,184 "discovered —
 * currently not indexed", against 330 indexed pages site-wide. Each page is
 * ~200 words of one templated sentence and a tile grid, so Google treated the
 * set as thousands of near-duplicates and took a sample — while real pages
 * (policy entries, an author page) sat in the same "discovered" queue.
 *
 * So only the recent window asks to be indexed; it is what people search for
 * by date. Older days stay reachable and linked from the year indexes — which
 * remain indexed and in the sitemap — but carry `noindex, follow` and leave the
 * sitemap. Nothing a reader can open is removed. This is the holding position
 * until the archive has a richer page Google should index instead.
 *
 * Counted back from the newest catalogue day, not the wall clock, so the
 * sitemap and the page agree whatever time either was rendered.
 */
export const INDEXED_ARCHIVE_DAYS = 90;

const DAY_MS = 86_400_000;

export function isIndexedArchiveDay(date: string, newest: string | undefined): boolean {
  if (!newest) return true;
  const age = (Date.parse(`${newest}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY_MS;
  return age < INDEXED_ARCHIVE_DAYS;
}
