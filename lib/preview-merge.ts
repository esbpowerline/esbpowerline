import type { CarouselItem } from '@/lib/homepage-defaults';
import type { PublicArticleCard, PublicCategory } from '@/lib/category-types';
import type { ResolvedCoverageSlot } from '@/lib/coverage-types';
import { MAX_PINNED_COVERAGE } from '@/lib/placement-rules';

export type DraftPreviewInput = {
  slug: string;
  title: string;
  shortTitle?: string | null;
  excerpt: string;
  imageUrl: string;
  heroMeta?: any;
  category: string;
  author: string;
  readTime: number;
  isFeatured?: boolean;
  isPinned?: boolean;
  isBreaking?: boolean;
  isTrending?: boolean;
};

function toCard(draft: DraftPreviewInput, id = 'preview-draft'): PublicArticleCard {
  return {
    id,
    slug: draft.slug || 'preview',
    title: draft.title || 'Untitled',
    shortTitle: draft.shortTitle,
    excerpt: draft.excerpt || '',
    category: draft.category,
    author: draft.author,
    date: new Date().toISOString(),
    readTime: draft.readTime,
    views: 0,
    // The trending rail prints reads this week beside every other row; a draft
    // has had none, and without this it alone fell back to the lifetime label.
    weekViews: 0,
    imageUrl: draft.imageUrl?.trim() || '',
    heroMeta: draft.heroMeta,
    isFeatured: draft.isFeatured,
    isBreaking: draft.isBreaking,
    isPinned: draft.isPinned,
    isTrending: draft.isTrending,
  };
}

function toCarouselItem(draft: DraftPreviewInput): CarouselItem {
  return {
    slug: draft.slug || 'preview',
    title: draft.title || 'Untitled',
    shortTitle: draft.shortTitle,
    excerpt: draft.excerpt || '',
    imageUrl: draft.imageUrl?.trim() || '',
    author: draft.author,
    readTime: draft.readTime,
    category: draft.category,
    isBreaking: draft.isBreaking,
    isFeatured: draft.isFeatured,
    isPinned: draft.isPinned,
    heroMeta: draft.heroMeta,
  };
}

export function mergeDraftIntoCarousel(items: CarouselItem[], draft: DraftPreviewInput): CarouselItem[] {
  const carouselOnly = items.filter((i) => !i.isPinned);
  const rest = carouselOnly.filter((i) => i.slug !== (draft.slug || 'preview'));

  if (draft.isPinned) {
    return rest.slice(0, 5);
  }
  if (draft.isFeatured || draft.isBreaking) {
    const entry = { ...toCarouselItem(draft), isPinned: false };
    return [entry, ...rest].slice(0, 5);
  }
  return rest.slice(0, 5);
}

export function mergeDraftIntoArticles(
  articles: PublicArticleCard[],
  draft: DraftPreviewInput,
  limit = 9,
): PublicArticleCard[] {
  const entry = toCard(draft);
  const rest = articles.filter((a) => a.slug !== entry.slug);
  return [entry, ...rest].slice(0, limit);
}

export function mergeDraftIntoPinnedRow(
  pinned: PublicArticleCard[],
  draft: DraftPreviewInput,
): PublicArticleCard[] {
  const rest = pinned.filter((a) => a.slug !== (draft.slug || 'preview'));
  if (!draft.isPinned) return rest.slice(0, MAX_PINNED_COVERAGE);
  const entry = toCard(draft);
  return [entry, ...rest].slice(0, MAX_PINNED_COVERAGE);
}

export function mergeDraftIntoCoverage(
  slots: ResolvedCoverageSlot[],
  draft: DraftPreviewInput,
  fallbackArticles: PublicArticleCard[] = [],
): ResolvedCoverageSlot[] {
  if (draft.isPinned) {
    return slots.map((s) => ({ ...s }));
  }

  const entry = toCard(draft);
  if (!slots.length) {
    return [
      { id: 'preview-hero', layout: 'hero', articleSlug: entry.slug, article: entry },
      ...restFromArticles(fallbackArticles, draft, 3),
    ];
  }

  const copy = slots.map((s) => ({ ...s }));
  const heroIdx = copy.findIndex((s) => s.layout === 'hero' || s.layout === 'banner');
  const targetIdx = heroIdx >= 0 ? heroIdx : 0;
  if (copy[targetIdx]) {
    copy[targetIdx] = { ...copy[targetIdx], article: entry };
  }
  return copy;
}

function restFromArticles(
  articles: PublicArticleCard[],
  draft: DraftPreviewInput,
  count: number,
): ResolvedCoverageSlot[] {
  const layouts: ResolvedCoverageSlot['layout'][] = ['horizontal', 'compact', 'compact'];
  return articles
    .filter((a) => a.slug !== draft.slug)
    .slice(0, count)
    .map((article, i) => ({
      id: `preview-slot-${i}`,
      layout: layouts[i] ?? 'compact',
      articleSlug: article.slug,
      article,
    }));
}

export function mergeDraftIntoTrending(
  trending: PublicArticleCard[],
  draft: DraftPreviewInput,
  limit = 5,
): PublicArticleCard[] {
  const entry = toCard(draft);
  const rest = trending.filter((a) => a.slug !== entry.slug);
  if (draft.isTrending) {
    return [entry, ...rest].slice(0, limit);
  }
  return rest.slice(0, limit);
}

export function findCategoryColor(categories: PublicCategory[], name: string): string | null {
  return categories.find((c) => c.name === name)?.color ?? null;
}