import 'server-only';

import { cache } from 'react';
import prisma from '@/lib/prisma';
import type { CoverageSlot, ResolvedCoverageSlot } from '@/lib/coverage-types';
import type { PublicArticleCard } from '@/lib/category-types';
import { MAX_PINNED_COVERAGE } from '@/lib/placement-rules';
import { normalizeArticleImageUrl } from '@/lib/article-image';
import { ARTICLE_CARD_SELECT } from '@/lib/category-content';

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
    author: a.author?.name ?? 'ESB PowerLine',
    date: (a.publishedAt ?? a.createdAt).toISOString(),
    readTime: a.readTime,
    views: a.views,
    imageUrl: normalizeArticleImageUrl(a.imageUrl) ?? '',
    heroMeta: a.seo?.heroImage,
    isFeatured: a.isFeatured,
    isBreaking: a.isBreaking,
    isPinned: a.isPinned,
  };
}

export const getPinnedCoverageArticles = cache(async (locale?: string): Promise<PublicArticleCard[]> => {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED', isPinned: true },
    select: ARTICLE_CARD_SELECT,
    orderBy: { publishedAt: 'desc' },
    // Was unbounded and sliced in JS — one bulk-pin made the homepage fetch the
    // whole table. Over-fetch slightly to survive the locale filter below.
    take: MAX_PINNED_COVERAGE * 4,
  });
  return articles
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
      } else {
        return !/[\u0980-\u09FF]/.test(a.title);
      }
    })
    .slice(0, MAX_PINNED_COVERAGE)
    .map((a) => mapArticle(a, locale));
});

export const resolveCoverageSlots = cache(async (slots: CoverageSlot[], locale?: string): Promise<ResolvedCoverageSlot[]> => {
  const slugs = [...new Set(slots.map((slot) => slot.articleSlug).filter(Boolean))];
  const articles = slugs.length
    ? await prisma.article.findMany({
        where: { status: 'PUBLISHED', slug: { in: slugs } },
        select: ARTICLE_CARD_SELECT,
      })
    : [];

  const bySlug = new Map(
    articles
      .filter((a) => {
        if (locale === 'bn') {
          return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
        } else {
          return !/[\u0980-\u09FF]/.test(a.title);
        }
      })
      .map((article) => [article.slug, mapArticle(article, locale)])
  );

  const fallbackPool = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: ARTICLE_CARD_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: 36,
  });
  const fallbackArticles = fallbackPool
    .filter((a) => {
      if (locale === 'bn') {
        return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
      } else {
        return !/[\u0980-\u09FF]/.test(a.title);
      }
    })
    .map((article) => mapArticle(article, locale));
  let fallbackIndex = 0;
  const usedArticleIds = new Set<string>();

  const takeFallback = (): PublicArticleCard | null => {
    while (fallbackIndex < fallbackArticles.length) {
      const candidate = fallbackArticles[fallbackIndex++];
      if (!usedArticleIds.has(candidate.id)) return candidate;
    }
    return null;
  };

  return slots.map((slot) => {
    let article = slot.articleSlug ? bySlug.get(slot.articleSlug) ?? null : null;
    if (article && usedArticleIds.has(article.id)) {
      article = null;
    }
    if (!article) {
      article = takeFallback();
    }
    if (article) usedArticleIds.add(article.id);
    return { ...slot, article };
  });
});

export async function getPublishedArticlePickerList() {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, title: true, category: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
    take: 100,
  });
  return articles;
}