import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { CONTENT_TAGS } from '@/lib/public-paths';
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
    // Date from Prisma, string once the row has passed through
    // `unstable_cache`, which serialises to JSON.
    publishedAt: Date | string | null;
    createdAt: Date | string;
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
    date: new Date(a.publishedAt ?? a.createdAt).toISOString(),
    readTime: a.readTime,
    views: a.views,
    imageUrl: normalizeArticleImageUrl(a.imageUrl) ?? '',
    heroMeta: a.seo?.heroImage,
    isFeatured: a.isFeatured,
    isBreaking: a.isBreaking,
    isPinned: a.isPinned,
  };
}

/**
 * The three homepage pools below (pinned, slot lookups, the fallback pool) were
 * memoised per request only, so every ISR regeneration of the homepage — every
 * 180 s, and on every publish — re-read ~80 card rows from Postgres while the
 * neighbouring lists in category-content.ts were served from `unstable_cache`.
 * Same 60 s window and the same articles tag now, so a publish still shows up
 * at once (SEO_FIX_LOG stage 1, 2026-09-02).
 */
const readPinnedPool = unstable_cache(
  () =>
    prisma.article.findMany({
      where: { status: 'PUBLISHED', isPinned: true },
      select: ARTICLE_CARD_SELECT,
      orderBy: { publishedAt: 'desc' },
      // Was unbounded and sliced in JS — one bulk-pin made the homepage fetch the
      // whole table. Over-fetch slightly to survive the locale filter below.
      take: MAX_PINNED_COVERAGE * 4,
    }),
  ['coverage-pinned-pool'],
  { revalidate: 60, tags: [CONTENT_TAGS.articles] },
);

const readSlotArticles = unstable_cache(
  (slugs: string[]) =>
    prisma.article.findMany({
      where: { status: 'PUBLISHED', slug: { in: slugs } },
      select: ARTICLE_CARD_SELECT,
    }),
  ['coverage-slot-articles'],
  { revalidate: 60, tags: [CONTENT_TAGS.articles] },
);

const readFallbackPool = unstable_cache(
  () =>
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: ARTICLE_CARD_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: 36,
    }),
  ['coverage-fallback-pool'],
  { revalidate: 60, tags: [CONTENT_TAGS.articles] },
);

export const getPinnedCoverageArticles = cache(async (locale?: string): Promise<PublicArticleCard[]> => {
  const articles = await readPinnedPool();
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
  const articles = slugs.length ? await readSlotArticles(slugs) : [];

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

  const fallbackPool = await readFallbackPool();
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