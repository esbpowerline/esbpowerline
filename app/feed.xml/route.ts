import { prisma } from '@/lib/prisma';
import { cleanDescription, SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 900;

const BENGALI_SCRIPT = /[ঀ-৿]/;

function xml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * RSS 2.0 over the same rows the sitemap lists. A news site with no feed had
 * no path into readers, aggregators or Google's news discovery beyond the
 * hourly sitemap (SEO_FIX_LOG stage 5). Fifty newest English articles.
 */
export async function GET() {
  const rows = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      publishedAt: true,
      imageUrl: true,
      postAsNewsDesk: true,
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 80,
  });
  const items = rows.filter((r) => !BENGALI_SCRIPT.test(r.title)).slice(0, 50);
  const newest = items[0]?.publishedAt ?? new Date();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${xml(SITE_NAME)}</title>
<link>${SITE_URL}</link>
<description>Bangladesh power sector news, grid data and energy policy.</description>
<language>en</language>
<lastBuildDate>${newest.toUTCString()}</lastBuildDate>
<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map((r) => {
    const url = `${SITE_URL}/articles/${encodeURIComponent(r.slug)}`;
    const desc = cleanDescription(r.excerpt, 300);
    const author = r.postAsNewsDesk ? 'ESB News Desk' : r.author?.name;
    return `<item>
<title>${xml(r.title)}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
${r.publishedAt ? `<pubDate>${r.publishedAt.toUTCString()}</pubDate>` : ''}
<category>${xml(r.category)}</category>
${author ? `<dc:creator>${xml(author)}</dc:creator>` : ''}
${desc ? `<description>${xml(desc)}</description>` : ''}
${r.imageUrl && /^https?:\/\//.test(r.imageUrl) ? `<enclosure url="${xml(r.imageUrl)}" type="image/webp"/>` : ''}
</item>`;
  })
  .join('\n')}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600',
    },
  });
}
