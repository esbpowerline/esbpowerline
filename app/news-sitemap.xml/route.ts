import { prisma } from '@/lib/prisma';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 600;

const BENGALI_SCRIPT = /[ঀ-৿]/;
const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

function xml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Google News sitemap: only articles published in the last 48 hours, which is
 * the window Google reads it for. Empty when nothing is that new — an honest
 * empty file, not a padded one (SEO_FIX_LOG stage 5).
 */
export async function GET() {
  const since = new Date(Date.now() - TWO_DAYS_MS);
  const rows = await prisma.article.findMany({
    where: { status: 'PUBLISHED', publishedAt: { gte: since } },
    select: { slug: true, title: true, publishedAt: true, tags: true },
    orderBy: { publishedAt: 'desc' },
    take: 1000,
  });
  const items = rows.filter((r) => !BENGALI_SCRIPT.test(r.title) && r.publishedAt);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items
  .map((r) => {
    const tags = Array.isArray(r.tags) ? (r.tags as unknown[]).filter((t): t is string => typeof t === 'string') : [];
    return `<url>
<loc>${SITE_URL}/articles/${encodeURIComponent(r.slug)}</loc>
<news:news>
<news:publication><news:name>${xml(SITE_NAME)}</news:name><news:language>en</news:language></news:publication>
<news:publication_date>${r.publishedAt!.toISOString()}</news:publication_date>
<news:title>${xml(r.title)}</news:title>
${tags.length ? `<news:keywords>${xml(tags.join(', '))}</news:keywords>` : ''}
</news:news>
</url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=1800',
    },
  });
}
