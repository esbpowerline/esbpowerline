import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { POLICIES } from '@/lib/data/policy/policies';

export const revalidate = 3600; // revalidate sitemap every hour

/** Same test getPublishedArticleBySlug uses to decide an article is not English. */
const BENGALI_SCRIPT = /[ঀ-৿]/;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';

  // Fetch all published articles.
  //
  // getPublishedArticleBySlug rejects Bengali-titled rows while the server
  // locale is pinned to 'en' (lib/category-content.ts), so those articles
  // render a hard 404. Submitting them here is what Search Console reports as
  // "Submitted URL not found (404)" — filter them out until they carry an
  // English title, or until real /bn routes exist.
  const publishedArticles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, title: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });
  const articles = publishedArticles.filter((a) => !BENGALI_SCRIPT.test(a.title));

  // Fetch all categories
  const categories = await prisma.category.findMany({
    select: { slug: true, createdAt: true },
  });

  // /magazine always renders the latest issue — one URL, so take the newest
  // issue's date as its lastModified rather than emitting one entry per issue.
  const latestMagazine = await prisma.magazineIssue.findFirst({
    where: { status: 'published' },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // Non-ASCII slugs must be percent-encoded to be a valid <loc>.
  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/articles/${encodeURIComponent(article.slug)}`,
    lastModified: article.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    lastModified: cat.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const magazineUrls = [
    {
      url: `${baseUrl}/magazine`,
      lastModified: latestMagazine?.createdAt ?? new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  const policyUrls = POLICIES.map((policy) => ({
    url: `${baseUrl}/energy-policy/${policy.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Tag pages are deliberately NOT listed. They are auto-generated per keyword,
  // and the overwhelming majority hold a single article — thin, near-duplicate
  // pages that Google crawls and refuses to index. They are noindex,follow so
  // link equity still reaches the articles.

  const staticRoutes = [
    '',
    '/grid-explorer',
    '/articles',
    '/categories',
    '/energy-policy',
    '/annual-reports/financials',
    '/about',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : route === '/grid-explorer' ? 0.9 : 0.8,
  }));

  return [
    ...staticRoutes,
    ...articleUrls,
    ...categoryUrls,
    ...magazineUrls,
    ...policyUrls,
  ];
}
