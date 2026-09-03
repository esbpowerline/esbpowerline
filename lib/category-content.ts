import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { CONTENT_TAGS } from '@/lib/public-paths';
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
  /** ISO timestamp — feeds NewsArticle.dateModified, which Google uses for freshness. */
  updatedAt: string;
  /** The editor's search title / description from the article's seo JSON; null when unset. */
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
};


export type PublicMagazineIssue = {
  id: string;
  title: string;
  issueDate: Date;
  coverUrl: string;
  pdfUrl: string | null;
  summary: string;
};

/**
 * Exactly the columns mapArticle reads.
 *
 * These card queries used `include: { author: … }` with no `select`, so Prisma
 * pulled `Article.*` — including `content` and `contentBn`, the full article
 * HTML — and mapArticle threw both away. The homepage alone runs ten of these
 * at `take: 60`, so it was transferring tens of MB of article bodies per ISR
 * regeneration to render title-and-image cards.
 */
export const ARTICLE_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  titleBn: true,
  shortTitle: true,
  excerpt: true,
  excerptBn: true,
  category: true,
  readTime: true,
  views: true,
  imageUrl: true,
  publishedAt: true,
  createdAt: true,
  isFeatured: true,
  isBreaking: true,
  isPinned: true,
  isTrending: true,
  postAsNewsDesk: true,
  seo: true,
  // Small JSON array, used by the related-articles relevance score. Cheap,
  // unlike `content`, which is what this select exists to exclude.
  tags: true,
  author: { select: { name: true } },
} as const;

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

export const getPublicCategories = unstable_cache(async (): Promise<PublicCategory[]> => {
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
}, ['getPublicCategories'], { revalidate: 60, tags: [CONTENT_TAGS.categories, CONTENT_TAGS.articles] });

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

export const getPublishedArticlesByCategory = unstable_cache(async function getPublishedArticlesByCategory(
  categoryName: string,
  locale?: string,
  // The homepage renders a handful of cards per category row and was pulling
  // sixty per category, for every category, every regeneration (cost audit,
  // 2026-09-03). Category pages keep the default.
  limit = 60,
): Promise<PublicArticleCard[]> {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      category: categoryName,
    },
    select: ARTICLE_CARD_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit,
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
}, ['getPublishedArticlesByCategory'], { revalidate: 60, tags: [CONTENT_TAGS.articles] });



export const getPublishedArticlesForPublic = unstable_cache(async (limit = 60, locale?: string): Promise<PublicArticleCard[]> => {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: ARTICLE_CARD_SELECT,
    orderBy: [{ isPinned: 'desc' }, { isFeatured: 'desc' }, { publishedAt: 'desc' }],
    // Over-fetch only by the size of the Bengali-titled set the filter below
    // drops (33 of 161 published rows, 2026-09-02). `limit * 2` fetched 240 card
    // rows to show 120 on /search and /articles (SEO_FIX_LOG stage 1).
    take: limit + 40,
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
}, ['getPublishedArticlesForPublic'], { revalidate: 60, tags: [CONTENT_TAGS.articles] });

export const getPublishedArticleBySlug = unstable_cache(async function getPublishedArticleBySlug(slug: string, locale?: string): Promise<PublicArticleDetail | null> {
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

  const seo = (article.seo ?? {}) as {
    heroImage?: HeroImageMeta;
    metaTitle?: string | null;
    metaDescription?: string | null;
    focusKeyword?: string | null;
  };
  const displayContent = locale === 'bn' && article.contentBn ? article.contentBn : article.content;
  return {
    ...mapArticle(article, locale),
    content: displayContent,
    tags: (article.tags as string[]) ?? [],
    heroImage: seo.heroImage,
    // The editor's own search title and description. They were stored on
    // every article and rendered nowhere: the page built <title> from the
    // headline and the description from the excerpt (stage 5, 2026-09-02).
    metaTitle: seo.metaTitle?.trim() || null,
    metaDescription: seo.metaDescription?.trim() || null,
    focusKeyword: seo.focusKeyword?.trim() || null,
    imageCredit: article.imageCredit,
    collaborators,
    updatedAt: article.updatedAt.toISOString(),
  };
}, ['getPublishedArticleBySlug'], { revalidate: 60, tags: [CONTENT_TAGS.articles] });

export async function getRelatedPublishedArticles(
  slug: string,
  category: string,
  tags: string[],
  limit = 3,
  locale?: string,
): Promise<PublicArticleCard[]> {
  return unstable_cache(async () => {
    const candidates = await prisma.article.findMany({
    where: { status: 'PUBLISHED', slug: { not: slug } },
    select: ARTICLE_CARD_SELECT,
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
  }, ['related', slug, category, tags?.join(',') ?? '', String(limit), String(locale)], { revalidate: 3600, tags: [CONTENT_TAGS.articles] })();
}

export const getTrendingPublishedArticles = unstable_cache(async (limit = 5, locale?: string): Promise<PublicArticleCard[]> => {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      isBreaking: false,
      isFeatured: false,
    },
    select: ARTICLE_CARD_SELECT,
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
}, ['getTrendingPublishedArticles'], { revalidate: 60, tags: [CONTENT_TAGS.articles] });

export const getFeaturedArticles = unstable_cache(async (limit = 8, locale?: string): Promise<PublicArticleCard[]> => {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      isFeatured: true,
      isBreaking: false,
      isTrending: false,
    },
    select: ARTICLE_CARD_SELECT,
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
}, ['getFeaturedArticles'], { revalidate: 60, tags: [CONTENT_TAGS.articles] });

export async function getPublicTagCounts(): Promise<{ tag: string; count: number }[]> {
  try {
    const counts = await prisma.$queryRaw<{ tag: string; count: bigint }[]>`
      SELECT jsonb_array_elements_text(tags) AS tag, COUNT(*) as count 
      FROM "Article" 
      WHERE status = 'PUBLISHED' 
      AND tags IS NOT NULL 
      AND jsonb_typeof(tags) = 'array'
      GROUP BY tag 
      ORDER BY count DESC
    `;
    return counts.map(r => ({ tag: r.tag, count: Number(r.count) }));
  } catch (e) {
    console.error('Error fetching tag counts natively:', e);
    return [];
  }
}

export async function getPublishedArticlesByTag(tag: string, locale?: string): Promise<PublicArticleCard[]> {
  const articles = await prisma.article.findMany({
    where: { 
      status: 'PUBLISHED',
      tags: { array_contains: tag } 
    },
    select: ARTICLE_CARD_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: 60,
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
}

export const getLatestMagazineIssue = unstable_cache(async (): Promise<PublicMagazineIssue | null> => {
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
}, ['getLatestMagazineIssue'], { revalidate: 60, tags: [CONTENT_TAGS.magazine] });
