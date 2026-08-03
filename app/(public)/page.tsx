import { getServerSiteLocale } from '@/lib/locale-server';
import {
  DeferredHomeBottomRow as HomeBottomRow,
  DeferredHomePowerSector as HomePowerSector,
  DeferredHomeTrendingSection as HomeTrendingSection,
  DeferredInterviewsSection as InterviewsSection,
} from '@/components/home/DeferredComponents';
import { ImportantLinks } from '@/components/home/ImportantLinks';
import { PolicyFramework } from '@/components/home/PolicyFramework';
import { TitasGasWatch } from '@/components/home/TitasGasWatch';
import { resolvePolicies } from '@/lib/data/policy/policies';
import { resolveImportantLinks } from '@/lib/data/important-links';
const HomeSnapshotPanel = dynamic(
  () => import('@/components/home/HomeSnapshotPanel').then((mod) => mod.HomeSnapshotPanel),
  { ssr: true }
);

import type { TickerItem } from '@/components/news/LiveMarketTicker';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { FeaturedCarousel } from '@/components/news/FeaturedCarousel';

import { normalizeInterviews, withPinnedInterviews } from '@/lib/interview-content';
import {
  getPublicSettingsMap,
  getPanelFlags,
  getCarouselItems,
  getSnapshotLabel,
  getProfessionalsCta,
  getCoverageSlotsFromSettings,
  applyEditorialPlacementToCoverageSlots,
} from '@/lib/homepage-content';
import { getPinnedCoverageArticles, resolveCoverageSlots } from '@/lib/coverage-content';
import {
  getPublicCategories,
  getPublishedArticlesForPublic,
  getTrendingPublishedArticles,
  getLatestMagazineIssue,
  getPublishedArticlesByCategory,
  getFeaturedArticles,
} from '@/lib/category-content';
import { getLatestYoutubeInterviews } from '@/lib/youtube-channel';
import { getLatestHomeSnapshot } from '@/lib/data/grid/home-snapshot.server';
import { getLiveTickerItems } from '@/lib/data/grid/live-ticker.server';
import { createTranslator } from '@/lib/i18n/messages';
import { formatSnapshotHeaderDate } from '@/lib/i18n/homepage-copy';

export const revalidate = 180;

export const metadata = {
  // `absolute` opts out of the root '%s | ESB PowerLine' template, which was
  // appending the brand to a title that already starts with it.
  title: { absolute: 'ESB PowerLine — Bangladesh Energy & Power News' },
  description:
    "Bangladesh's premier source for power sector news, renewable energy, policy, projects & tenders, grid explorer, and the monthly magazine.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ESB PowerLine — Bangladesh Energy & Power News',
    description:
      'Authoritative coverage of generation, renewables, policy, grid infrastructure and the projects shaping the sector.',
  },
};

export default async function Home() {
  const locale = await getServerSiteLocale();
  const settingsPromise = getPublicSettingsMap();
  const [settings, trending, magazineRow, categories, featuredArticles, carouselItems, coverageSlots, pinnedArticles, interviews, dailySnapshot, liveTicker] =
    await Promise.all([
      settingsPromise,
      getTrendingPublishedArticles(5, locale),
      getLatestMagazineIssue(),
      getPublicCategories(),
      getFeaturedArticles(8, locale),
      settingsPromise.then((map) => getCarouselItems(map, locale)),
      settingsPromise.then(async (map) => {
        const slots = getCoverageSlotsFromSettings(map);
        const withPlacement = await applyEditorialPlacementToCoverageSlots(slots);
        return resolveCoverageSlots(withPlacement, locale);
      }),
      getPinnedCoverageArticles(locale),
      getLatestYoutubeInterviews(4),
      getLatestHomeSnapshot(),
      getLiveTickerItems().catch(() => null),
    ]);

  const categoriesWithArticles = await Promise.all(
    categories.map(async (cat) => {
      let articles = await getPublishedArticlesByCategory(cat.name, locale);
      return {
        ...cat,
        articles,
      };
    })
  );

  const magazine = magazineRow ?? {
    title: 'ESB PowerLine Monthly',
    summary: 'In-depth analysis on Bangladesh power sector policy, projects and data.',
    coverUrl: '/images/demo_magazine_cover.jpg',
    issueDate: new Date(),
  };
  const magazineLabel = magazineRow
    ? new Date(magazineRow.issueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Latest';
  const snapshotLabel = getSnapshotLabel(settings);
  const professionalsCta = getProfessionalsCta(settings);
  const panelFlags = getPanelFlags(settings);
  const snapshotStats = dailySnapshot?.stats ?? settings.snapshot;
  const snapshotDate = (dailySnapshot?.date ?? settings.snapshotDate) as string | undefined;
  const snapshotHeaderDate = formatSnapshotHeaderDate(snapshotDate, locale);
  const tr = createTranslator(locale);
  const carouselFooterLabels = {
    readStory: tr('carousel.readStory'),
    browseAll: tr('carousel.browseAll'),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 home-page">
        <div className="container container--shell home-hero-band">
          <div className="home-hero-band__grid">
            <div className="home-hero-band__hero">
              <FeaturedCarousel
                items={carouselItems}
                tickerItems={liveTicker ?? (settings.ticker as TickerItem[] | undefined)}
                inBand
                footerLabels={carouselFooterLabels}
              />
            </div>
            <aside className="home-hero-band__snapshot">
              <HomeSnapshotPanel
                snapshotStats={snapshotStats}
                snapshotLabel={snapshotLabel}
                snapshotHeaderDate={snapshotHeaderDate}
                layout="segment"
              />
            </aside>
          </div>
        </div>

        <div className="container container--shell home-editorial">
          <div className="home-editorial__grid">
            <div className="home-editorial__main">
              <InterviewsSection
                className="home-block home-editorial__interviews"
                initialInterviews={withPinnedInterviews(normalizeInterviews(interviews))}
              />

              {/* Mobile/Tablet Inline Ad block for 004.png */}
              <div className="block lg:hidden home-ad-space--sidebar mb-8 max-w-sm mx-auto" suppressHydrationWarning>
                <Link href="/contact#advertising" className="rounded-2xl w-full overflow-hidden relative group block" suppressHydrationWarning>
                  <Image src="/images/promotions/004.png" alt="Advertisement" width={1248} height={1200} className="w-full h-auto object-cover block" suppressHydrationWarning />
                </Link>
              </div>

              <HomePowerSector
                categoriesWithArticles={categoriesWithArticles}
                coverageSlots={coverageSlots}
                pinnedArticles={pinnedArticles}
                featuredArticles={featuredArticles}
              />
            </div>

             <aside className="home-editorial__rail" aria-label="Sidebar">
              <HomeTrendingSection trending={trending} layout="hero-rail" />
              
              {/* Sidebar Ad Block */}
              <Link href="/contact#advertising" className="home-ad-space--sidebar rounded-2xl w-full overflow-hidden relative group hidden lg:block mt-8" suppressHydrationWarning>
                <Image src="/images/promotions/004.png" alt="Advertisement" width={1248} height={1200} className="w-full h-auto object-cover block" suppressHydrationWarning />
              </Link>

              {panelFlags.importantLinks && <ImportantLinks data={resolveImportantLinks(settings)} />}

              {panelFlags.policyFramework && <PolicyFramework policies={resolvePolicies(settings)} />}

              <TitasGasWatch />
            </aside>
          </div>

          {/* 2-Column Pre-Footer Ad Space */}
          <div className="home-ad-space--pre-footer grid grid-cols-1 md:grid-cols-2 gap-6" suppressHydrationWarning>
            <Link href="/contact#advertising" className="rounded-2xl w-full overflow-hidden relative group block" suppressHydrationWarning>
              <Image src="/images/promotions/006.png" alt="Advertisement" width={2184} height={480} className="w-full h-auto object-cover block" suppressHydrationWarning />
            </Link>
            <Link href="/contact#advertising" className="rounded-2xl w-full overflow-hidden relative group hidden md:block" suppressHydrationWarning>
              <Image src="/images/promotions/007.png" alt="Advertisement" width={2184} height={480} className="w-full h-auto object-cover block" suppressHydrationWarning />
            </Link>
          </div>

          <HomeBottomRow
            layout="split"
            magazine={magazine}
            magazineLabel={magazineLabel}
            professionalsCta={professionalsCta}
          />
        </div>
      </main>
    </div>
  );
}