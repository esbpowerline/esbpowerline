import { SITE_URL } from '@/lib/seo';
import { getArchiveCatalogue } from '@/lib/data/grid/archive-day.server';

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
 * `lastmod` is stated once, per day, as the day itself. An archive day's
 * figures do not change after publication; when a correction ships as a
 * DataRelease the date is unchanged but the payload is not, which is what the
 * page's own 24-hour revalidation covers. Stamping every entry with the
 * generation time was the exact mistake stage 2 of the SEO work removed from
 * the main sitemap — a lastmod Google learns to distrust is worth less than
 * an honest one.
 */
export const revalidate = 86400;

export async function GET() {
  const catalogue = await getArchiveCatalogue();
  const years = [...new Set(catalogue.map((d) => d.slice(0, 4)))].sort();

  const entries: string[] = [
    `<url><loc>${SITE_URL}/grid-explorer/archive</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    ...years.map(
      (year) =>
        `<url><loc>${SITE_URL}/grid-explorer/archive/${year}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    ),
    ...catalogue.map(
      (date) =>
        `<url><loc>${SITE_URL}/grid-explorer/${date}</loc><lastmod>${date}</lastmod><changefreq>yearly</changefreq><priority>0.6</priority></url>`,
    ),
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
