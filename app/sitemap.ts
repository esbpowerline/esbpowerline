import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://esbpowerline.com';

  // Fetch all published articles
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });

  // Fetch all categories
  const categories = await prisma.category.findMany({
    select: { slug: true, createdAt: true },
  });

  // Fetch all magazines
  const magazines = await prisma.magazineIssue.findMany({
    where: { status: 'published' },
    select: { id: true, createdAt: true },
  });

  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
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

  const magazineUrls = magazines.map((mag) => ({
    url: `${baseUrl}/magazine`,
    lastModified: mag.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const staticRoutes = [
    '',
    '/grid-explorer',
    '/articles',
    '/categories',
    '/magazine',
    '/about',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : route === '/grid-explorer' ? 0.9 : 0.8,
  }));

  return [...staticRoutes, ...articleUrls, ...categoryUrls, ...magazineUrls];
}
