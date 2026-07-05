import { cache } from 'react';
import prisma from '@/lib/prisma';
import type { PublicArticleCard, PublicCategory } from '@/lib/category-types';
import type { HeroImageMeta } from '@/lib/hero-image';
import { normalizeArticleImageUrl } from '@/lib/article-image';

export type { PublicArticleCard, PublicCategory, HeroImageMeta };

export type PublicArticleDetail = PublicArticleCard & {
  content: string;
  tags: string[];
  heroImage?: HeroImageMeta;
  imageCredit?: string | null;
  collaborators?: { id: string; name: string }[];
};


export type PublicMagazineIssue = {
  id: string;
  title: string;
  issueDate: Date;
  coverUrl: string;
  pdfUrl: string | null;
  summary: string;
};

function mapArticle(
  a: {
    id: string;
    slug: string;
    title: string;
    shortTitle?: string | null;
    excerpt: string | null;
    category: string;
    readTime: number;
    views: number;
    imageUrl: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    isFeatured?: boolean;
    isBreaking?: boolean;
    isPinned?: boolean;
    isTrending?: boolean;
    postAsNewsDesk?: boolean;
    author?: { name: string } | null;
    seo?: any;
    titleBn?: string | null;
    excerptBn?: string | null;
  },
  locale?: string,
): PublicArticleCard {
  const displayTitle = locale === 'bn' && a.titleBn ? a.titleBn : a.title;
  const displayExcerpt = locale === 'bn' && a.excerptBn ? a.excerptBn : (a.excerpt ?? '');

  return {
    id: a.id,
    slug: a.slug,
    title: displayTitle,
    shortTitle: a.shortTitle,
    excerpt: displayExcerpt,
    category: a.category,
    author: a.postAsNewsDesk ? 'ESB News Desk' : (a.author?.name ?? 'ESB PowerLine'),
    date: (a.publishedAt ?? a.createdAt).toISOString(),
    readTime: a.readTime,
    views: a.views,
    imageUrl: normalizeArticleImageUrl(a.imageUrl) ?? '',
    heroMeta: a.seo?.heroImage,
    isFeatured: a.isFeatured,
    isBreaking: a.isBreaking,
    isPinned: a.isPinned,
    isTrending: a.isTrending,
  };
}

export const getPublicCategories = cache(async (): Promise<PublicCategory[]> => {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.article.groupBy({
      by: ['category'],
      where: { status: 'PUBLISHED' },
      _count: { category: true },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.category, c._count.category]));

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    color: c.color,
    icon: c.icon,
    iconImageUrl: c.iconImageUrl,
    order: c.order,
    articleCount: countMap[c.name] ?? 0,
  }));
});

export async function getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return null;

  const articleCount = await prisma.article.count({
    where: { status: 'PUBLISHED', category: cat.name },
  });

  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    color: cat.color,
    icon: cat.icon,
    iconImageUrl: cat.iconImageUrl,
    order: cat.order,
    articleCount,
  };
}

export const getPublishedArticlesByCategory = cache(async function getPublishedArticlesByCategory(
  categoryName: string,
  locale?: string,
): Promise<PublicArticleCard[]> {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      category: categoryName,
      isBreaking: false,
      isFeatured: false,
      isTrending: false,
    },
    include: { author: { select: { name: true } } },
    orderBy: { publishedAt: 'desc' },
  });
  return articles
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
      } else {
        return !/[\u0980-\u09FF]/.test(a.title);
      }
    })
    .map((a) => mapArticle(a, locale));
});

export const getPublishedArticlesForPublic = cache(async (limit = 60, locale?: string): Promise<PublicArticleCard[]> => {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    include: { author: { select: { name: true } } },
    orderBy: [{ isPinned: 'desc' }, { isFeatured: 'desc' }, { publishedAt: 'desc' }],
    take: limit * 2,
  });
  return articles
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
      } else {
        return !/[\u0980-\u09FF]/.test(a.title);
      }
    })
    .slice(0, limit)
    .map((a) => mapArticle(a, locale));
});

export async function getPublishedArticleBySlug(slug: string, locale?: string): Promise<PublicArticleDetail | null> {
  const article = await prisma.article.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { author: { select: { name: true } } },
  });
  if (!article) return null;

  if (locale === 'bn') {
    if (!article.titleBn && !/[\u0980-\u09FF]/.test(article.title)) return null;
  } else {
    if (/[\u0980-\u09FF]/.test(article.title)) return null;
  }

  let collaborators: { id: string; name: string }[] = [];
  const collaboratorIds = Array.isArray(article.collaboratorIds)
    ? (article.collaboratorIds as string[])
    : [];

  if (collaboratorIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: collaboratorIds } },
      select: { id: true, name: true },
    });
    collaborators = users;
  }

  const seo = (article.seo ?? {}) as { heroImage?: HeroImageMeta };
  const displayContent = locale === 'bn' && article.contentBn ? article.contentBn : article.content;
  return {
    ...mapArticle(article, locale),
    content: displayContent,
    tags: (article.tags as string[]) ?? [],
    heroImage: seo.heroImage,
    imageCredit: article.imageCredit,
    collaborators,
  };
}

export async function getRelatedPublishedArticles(
  slug: string,
  category: string,
  tags: string[],
  limit = 3,
  locale?: string,
): Promise<PublicArticleCard[]> {
  const candidates = await prisma.article.findMany({
    where: { status: 'PUBLISHED', slug: { not: slug } },
    include: { author: { select: { name: true } } },
    orderBy: { views: 'desc' },
    take: 60,
  });

  const filtered = candidates.filter((a) => {
    if (locale === 'bn') {
      return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
    } else {
      return !/[\u0980-\u09FF]/.test(a.title);
    }
  });

  const tagSet = new Set(tags);
  const scored = filtered
    .map((a) => {
      const articleTags = (a.tags as string[]) ?? [];
      const tagOverlap = articleTags.filter((t) => tagSet.has(t)).length;
      const score = (a.category === category ? 2 : 0) + tagOverlap;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.a.views - x.a.views);

  const picked = (scored.length > 0 ? scored.map((x) => x.a) : filtered).slice(0, limit);
  return picked.map((a) => mapArticle(a, locale));
}

export const getTrendingPublishedArticles = cache(async (limit = 5, locale?: string): Promise<PublicArticleCard[]> => {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      isBreaking: false,
      isFeatured: false,
    },
    include: { author: { select: { name: true } } },
    orderBy: [{ isTrending: 'desc' }, { views: 'desc' }],
    take: limit * 2,
  });
  return articles
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
      } else {
        return !/[\u0980-\u09FF]/.test(a.title);
      }
    })
    .slice(0, limit)
    .map((a) => mapArticle(a, locale));
});

export const getFeaturedArticles = cache(async (limit = 8, locale?: string): Promise<PublicArticleCard[]> => {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      isFeatured: true,
      isBreaking: false,
      isTrending: false,
    },
    include: { author: { select: { name: true } } },
    orderBy: { publishedAt: 'desc' },
    take: limit * 2,
  });
  return articles
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
      } else {
        return !/[\u0980-\u09FF]/.test(a.title);
      }
    })
    .slice(0, limit)
    .map((a) => mapArticle(a, locale));
});

export async function getPublicTagCounts(): Promise<{ tag: string; count: number }[]> {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { tags: true },
  });
  const counts = new Map<string, number>();
  for (const a of articles) {
    for (const t of (a.tags as string[]) ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPublishedArticlesByTag(tag: string, locale?: string): Promise<PublicArticleCard[]> {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    include: { author: { select: { name: true } } },
    orderBy: { publishedAt: 'desc' },
  });
  return articles
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
      } else {
        return !/[\u0980-\u09FF]/.test(a.title);
      }
    })
    .filter((a) => ((a.tags as string[]) ?? []).includes(tag))
    .map((a) => mapArticle(a, locale));
}

export const getLatestMagazineIssue = cache(async (): Promise<PublicMagazineIssue | null> => {
  const issue = await prisma.magazineIssue.findFirst({
    where: { status: 'published' },
    orderBy: { issueDate: 'desc' },
  });
  if (!issue) return null;
  return {
    id: issue.id,
    title: issue.title,
    issueDate: issue.issueDate,
    coverUrl: issue.coverUrl ?? '/images/demo_magazine_cover.jpg',
    pdfUrl: issue.pdfUrl,
    summary: issue.summary ?? '',
  };
});
