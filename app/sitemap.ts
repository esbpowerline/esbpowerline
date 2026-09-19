import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { POLICIES } from '@/lib/data/policy/policies';
import { EVENT_STUDIES } from '@/lib/data/analysis/event-registry';
import { IS_DEMO } from '@/lib/magazine-demo-issue';
import { getLatestAvailableDate } from '@/lib/data/grid/available-dates';
import { slugify } from '@/lib/utils';

export const revalidate = 3600; // revalidate sitemap every hour

/** Same test getPublishedArticleBySlug uses to decide an article is not English. */
const BENGALI_SCRIPT = /[ঀ-৿]/;

/**
 * Only canonical, indexable, 200-returning URLs — not every URL the router can
 * produce. Tag pages, search, login and members are deliberately absent (tags
 * and search are noindex; the rest are robots-blocked).
 *
 * `lastModified` is stated only where a real date exists. Search Console's
 * export of 2026-09-02 showed every static and policy entry stamped with the
 * generation time and every article stamped with `updatedAt`, which the view
 * counter rewrote on each read; 0 of 172 entries were honestly dated. A field
 * Google learns to distrust is worth less than no field (SEO_FIX_LOG stage 2).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';

  // Failures are logged, not swallowed. With `revalidate`, a thrown error
  // keeps the previously generated copy in service, which is the right
  // fallback — but a silent one hid a sitemap frozen since 2026-08-30.
  let publishedArticles: { slug: string; title: string; publishedAt: Date | null; authorId: string; postAsNewsDesk: boolean }[];
  let categories: { slug: string; createdAt: Date }[];
  let latestMagazine: { createdAt: Date } | null;
  let authors: { name: string }[];
  try {
    // getPublishedArticleBySlug rejects Bengali-titled rows while the server
    // locale is pinned to 'en' (lib/category-content.ts), so those articles
    // render a hard 404. Submitting them here is what Search Console reports
    // as "Submitted URL not found (404)" — filter them out until they carry an
    // English title, or until real /bn routes exist.
    [publishedArticles, categories, latestMagazine] = await Promise.all([
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, title: true, publishedAt: true, authorId: true, postAsNewsDesk: true },
        orderBy: { publishedAt: 'desc' },
      }),
      // A category with nothing published renders "no articles yet" — a soft
      // 404 to Google, and two were being submitted.
      prisma.category.findMany({
        where: { articles: { some: { status: 'PUBLISHED' } } },
        select: { slug: true, createdAt: true },
      }),
      // /magazine always renders the latest issue — one URL, so take the newest
      // issue's date as its lastModified rather than emitting one entry per issue.
      prisma.magazineIssue.findFirst({
        where: { status: 'published' },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    // Author pages exist for every user with a published byline (and the desk).
    const authorIds = [...new Set(publishedArticles.filter((a) => !a.postAsNewsDesk).map((a) => a.authorId))];
    authors = authorIds.length
      ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { name: true } })
      : [];
  } catch (error) {
    console.error('[sitemap] database read failed; the previous sitemap stays in service:', error);
    throw error;
  }

  const articles = publishedArticles.filter((a) => !BENGALI_SCRIPT.test(a.title));

  // Non-ASCII slugs must be percent-encoded to be a valid <loc>.
  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/articles/${encodeURIComponent(article.slug)}`,
    // publishedAt, not updatedAt: the only date on the row that means what a
    // crawler thinks lastmod means. A content-edit timestamp would be better
    // and does not exist yet.
    ...(article.publishedAt ? { lastModified: article.publishedAt } : {}),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // De-duplicated by URL: a user row named "ESB News Desk" slugifies to the
  // same path as the desk's own fixed entry.
  const authorSlugs = [...new Set(['esb-news-desk', ...authors.map((u) => slugify(u.name))])];
  const authorUrls = authorSlugs.map((slug) => ({
    url: `${baseUrl}/authors/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }));

  // /magazine declares `noindex` while IS_DEMO holds (the page shows a demo
  // issue, not an edition), yet it was submitted here regardless — the exact
  // "Submitted URL marked noindex" contradiction Search Console flags. A
  // sitemap lists what we want indexed; a page that says "do not index me"
  // must not be in it. The entry returns the day IS_DEMO is switched off.
  const magazineUrls: MetadataRoute.Sitemap = IS_DEMO
    ? []
    : [
        {
          url: `${baseUrl}/magazine`,
          ...(latestMagazine ? { lastModified: latestMagazine.createdAt } : {}),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        },
      ];

  // Event studies: /analysis and one page per registry entry. Derived from
  // EVENT_STUDIES so a study added to the registry is submitted without a
  // second list to keep in step — both live pages were absent from here for
  // the six days after they shipped (2026-09-13 → 2026-09-19). No lastmod:
  // the registry records the event's dates, not the page's, and stating the
  // incident date as a modification time would be the stage-2 mistake again.
  const analysisUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/analysis`, changeFrequency: 'monthly', priority: 0.7 },
    ...EVENT_STUDIES.map((study) => ({
      url: `${baseUrl}/analysis/${study.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  // Policy pages are hand-maintained reference documents with no stored
  // modification date, so none is claimed.
  const policyUrls = POLICIES.map((policy) => ({
    url: `${baseUrl}/energy-policy/${policy.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Tag pages are deliberately NOT listed. They are auto-generated per keyword,
  // and the overwhelming majority hold a single article — thin, near-duplicate
  // pages that Google crawls and refuses to index. They are noindex,follow so
  // link equity still reaches the articles.

  // /grid-explorer changes when a new report day lands, not when the sitemap is
  // built. The catalogue's newest day is the honest answer.
  const latestGridDate = getLatestAvailableDate();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, changeFrequency: 'daily', priority: 1.0 },
    {
      url: `${baseUrl}/grid-explorer`,
      ...(latestGridDate ? { lastModified: new Date(`${latestGridDate}T00:00:00Z`) } : {}),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    { url: `${baseUrl}/articles`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/categories`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/energy-policy`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/titas-gas`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/annual-reports/financials`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/contact`, changeFrequency: 'yearly', priority: 0.4 },
  ];

  return [
    ...staticRoutes,
    ...articleUrls,
    ...categoryUrls,
    ...authorUrls,
    ...magazineUrls,
    ...analysisUrls,
    ...policyUrls,
  ];
}
