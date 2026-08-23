import { cache } from 'react';
import prisma from '@/lib/prisma';
import { HOMEPAGE_DEFAULTS, type CarouselItem } from '@/lib/homepage-defaults';
import { normalizeCoverageSlots } from '@/lib/coverage-defaults';
import type { CoverageSlot } from '@/lib/coverage-types';
import { MAX_CAROUSEL_ITEMS } from '@/lib/placement-rules';
import { normalizeArticleImageUrl } from '@/lib/article-image';
import { ARTICLE_CARD_SELECT } from '@/lib/category-content';

const PUBLIC_SETTING_KEYS = [
  'homepage', 'ticker', 'snapshot', 'snapshotDate', 'interviews', 'site', 'seo', 'hero', 'coverage', 'panels',
  'importantLinks', 'policyFramework',
] as const;

const GRID_SETTING_KEYS = ['gridMix', 'gridLines', 'gridProjects'] as const;

export type { CarouselItem };
export { HOMEPAGE_DEFAULTS };

export const getPublicSettingsMap = cache(async () => {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_SETTING_KEYS] } },
  });
  const map: Record<string, unknown> = {};
  for (const s of settings) map[s.key] = s.value;
  return map;
});

export const getGridSettingsMap = cache(async () => {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: [...GRID_SETTING_KEYS] } },
  });
  const map: Record<string, unknown> = {};
  for (const s of settings) map[s.key] = s.value;
  return map;
});

function mapCarouselArticle(
  a: {
    slug: string;
    title: string;
    excerpt: string | null;
    imageUrl: string | null;
    readTime: number;
    category: string;
    isBreaking: boolean;
    isFeatured: boolean;
    isPinned: boolean;
    postAsNewsDesk?: boolean;
    author?: { name: string } | null;
    titleBn?: string | null;
    excerptBn?: string | null;
    publishedAt?: Date | null;
    createdAt?: Date | null;
  },
  locale?: string,
): CarouselItem {
  const displayTitle = locale === 'bn' && a.titleBn ? a.titleBn : a.title;
  const displayExcerpt = locale === 'bn' && a.excerptBn ? a.excerptBn : (a.excerpt ?? '');

  // Publication time, matching every other card in the app
  // (`lib/category-content.ts` maps `publishedAt ?? createdAt`).
  //
  // NOT `updatedAt`, despite it sounding like the right column. Prisma's
  // `@updatedAt` fires on any write, so it tracks database maintenance rather
  // than journalism: measured 2026-08-13, all 130 hero-eligible articles had
  // an `updatedAt` past publication, 124 of them by over a day, median gap 37
  // days, and 60 shared two adjacent minutes on 2026-06-26 — one bulk write.
  // Rendering that as "Updated" would tell readers the newsroom revised
  // stories it never touched. Real revision stamps need a separate column the
  // CMS sets on actual content edits.
  const published = a.publishedAt ?? a.createdAt ?? null;

  return {
    date: published ? published.toISOString() : undefined,
    slug: a.slug,
    title: displayTitle,
    excerpt: displayExcerpt,
    imageUrl: normalizeArticleImageUrl(a.imageUrl) ?? '',
    // Same byline rule as every other card (`lib/category-content.ts`): a
    // story posted as the desk is credited to the desk, not to whichever
    // account uploaded it. The hero was the one surface skipping this, which
    // put a single staff name under every slot.
    author: a.postAsNewsDesk ? 'ESB News Desk' : (a.author?.name ?? 'ESB PowerLine'),
    readTime: a.readTime ?? 5,
    category: a.category,
    isBreaking: a.isBreaking,
    isFeatured: a.isFeatured,
    isPinned: false,
  };
}

async function fetchManagedCarouselItems(locale?: string): Promise<CarouselItem[]> {
  const articles = await prisma.article.findMany({
    // The hero carries the latest published news, not only the breaking items.
    // Pinned and trending stories stay excluded because they each render in
    // their own row further down the homepage, and the hero repeating them
    // would spend its slots on stories the reader has already been shown.
    where: {
      status: 'PUBLISHED',
      isPinned: false,
      isTrending: false,
    },
    select: ARTICLE_CARD_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: MAX_CAROUSEL_ITEMS * 2,
  });

  const filtered = articles.filter((a) => {
    if (locale === 'bn') {
      return !!a.titleBn || /[\u0980-\u09FF]/.test(a.title);
    } else {
      return !/[\u0980-\u09FF]/.test(a.title);
    }
  });

  return filtered.slice(0, MAX_CAROUSEL_ITEMS).map((a) => mapCarouselArticle(a, locale));
}

export const getCarouselItems = cache(async (_settings: Record<string, unknown>, locale?: string): Promise<CarouselItem[]> => {
  return fetchManagedCarouselItems(locale);
});

/** Coverage slots come from admin settings; pinned stories render in a separate top row. */
export const applyEditorialPlacementToCoverageSlots = cache(
  async (slots: CoverageSlot[]): Promise<CoverageSlot[]> => slots,
);

export function getMarketPulse(settings: Record<string, unknown>) {
  const hp = settings.homepage as { marketPulse?: string } | undefined;
  return hp?.marketPulse?.trim() || HOMEPAGE_DEFAULTS.marketPulse;
}

export function getSnapshotLabel(settings: Record<string, unknown>) {
  const hp = settings.homepage as { snapshotLabel?: string } | undefined;
  return hp?.snapshotLabel?.trim() || HOMEPAGE_DEFAULTS.snapshotLabel;
}

export function getProfessionalsCta(settings: Record<string, unknown>) {
  const hp = settings.homepage as Partial<typeof HOMEPAGE_DEFAULTS.professionalsCta> | undefined;
  return { ...HOMEPAGE_DEFAULTS.professionalsCta, ...hp };
}

export function getCoverageSlotsFromSettings(settings: Record<string, unknown>): CoverageSlot[] {
  return normalizeCoverageSlots(settings.coverage);
}

export type PanelFlags = { importantLinks: boolean; policyFramework: boolean };

/** Homepage sidebar panel visibility toggles (both default ON when unset). */
export function getPanelFlags(settings: Record<string, unknown>): PanelFlags {
  const p = settings.panels as Partial<PanelFlags> | undefined;
  return {
    importantLinks: p?.importantLinks !== false,
    policyFramework: p?.policyFramework !== false,
  };
}