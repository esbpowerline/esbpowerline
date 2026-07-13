'use server';

import {
  getPublicSettingsMap,
  getCarouselItems,
  applyEditorialPlacementToCoverageSlots,
  getCoverageSlotsFromSettings,
} from '@/lib/homepage-content';
import { getPinnedCoverageArticles, resolveCoverageSlots } from '@/lib/coverage-content';
import {
  getPublicCategories,
  getPublishedArticlesForPublic,
  getTrendingPublishedArticles,
} from '@/lib/category-content';
import { requireEditorialReader } from '@/lib/server-auth';

export async function getArticlePreviewContext() {
  await requireEditorialReader();
  const settings = await getPublicSettingsMap();

  const [carouselItems, categories, sectorArticles, coverageSlots, pinnedArticles, trendingArticles] = await Promise.all([
    getCarouselItems(settings),
    getPublicCategories(),
    getPublishedArticlesForPublic(12),
    (async () => {
      const slots = getCoverageSlotsFromSettings(settings);
      const withPlacement = await applyEditorialPlacementToCoverageSlots(slots);
      return resolveCoverageSlots(withPlacement);
    })(),
    getPinnedCoverageArticles(),
    getTrendingPublishedArticles(5),
  ]);

  return {
    carouselItems,
    categories,
    sectorArticles,
    coverageSlots,
    pinnedArticles,
    trendingArticles,
  };
}