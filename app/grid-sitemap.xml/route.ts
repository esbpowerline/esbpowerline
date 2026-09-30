import { SITE_URL } from '@/lib/seo';
import { getArchiveCatalogue } from '@/lib/data/grid/archive-day.server';
import { getReleaseRevisionTimes } from '@/lib/data/releases.server';
import { isIndexedArchiveDay } from '@/lib/data/grid/archive-indexing';

/**
 * The archive's own sitemap: one entry per day, plus the year indexes.
 *
 * Kept out of `app/sitemap.ts` deliberately. That file is a database read of
 * articles, categories and authors and turns over as the desk publishes; this
 * one is ~4,500 mostly-immutable URLs derived from the date catalogue. Separate
 * files mean Search Console reports indexing for the archive and for editorial
 * separately, which is the only way to tell which of the two Google is actually
 * taking — and it follows the convention `news-sitemap.xml` already set.
 *
 * `lastmod` is the moment the day's payload last changed on this site, read
 * from the release revision ledger — and stated only for days that have one.
 * Until 2026-09-19 every entry carried the observation date instead: the day
 * PGCB measured, which is not when this page was published or corrected, and
 * on a 2019 day is off by seven years. That is the same dishonest-lastmod
 * mistake stage 2 removed from the editorial sitemap, in different clothes.
 * A day held only in the static archive has no revision row and no lastmod;
 * the sitemap is not the place to guess.
 */
export const revalidate = 86400;

export async function GET() {
  const [catalogue, revised] = await Promise.all([
    getArchiveCatalogue(),
    // GAS_DAILY too: the day page prints the gas window beside the grid.
    getReleaseRevisionTimes(['GRID_DAILY', 'GAS_DAILY']).catch(() => ({}) as Record<string, string>),
  ]);
  const years = [...new Set(catalogue.map((d) => d.slice(0, 4)))].sort();
  const newest = catalogue.at(-1);

  const entries: string[] = [
    `<url><loc>${SITE_URL}/grid-explorer/archive</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    ...years.map(
      (year) =>
        `<url><loc>${SITE_URL}/grid-explorer/archive/${year}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    ),
    // The recent window only: older days are `noindex` (archive-indexing.ts),
    // and a sitemap listing a noindexed URL contradicts itself.
    ...catalogue.filter((date) => isIndexedArchiveDay(date, newest)).map((date) => {
      const lastmod = revised[date] ? `<lastmod>${revised[date]}</lastmod>` : '';
      return `<url><loc>${SITE_URL}/grid-explorer/${date}</loc>${lastmod}<changefreq>yearly</changefreq><priority>0.6</priority></url>`;
    }),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
