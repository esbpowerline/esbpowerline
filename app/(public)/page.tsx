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

import { resolveHomepageInterviews } from '@/lib/interview-content';
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
import { DEMO_ISSUE, IS_DEMO } from '@/lib/magazine-demo-issue';
import { getMagazineCoverUrl } from '@/lib/magazine-assets';
import { getLatestYoutubeInterviews } from '@/lib/youtube-channel';
import { getLatestHomeSnapshot } from '@/lib/data/grid/home-snapshot.server';
import { getLiveTickerItems } from '@/lib/data/grid/live-ticker.server';
import { formatSnapshotHeaderDate } from '@/lib/i18n/homepage-copy';

export const revalidate = 180;

export const metadata = {
  // `absolute` opts out of the root '%s | ESB PowerLine' template, which was
  // appending the brand to a title that already starts with it.
  title: { absolute: 'ESB PowerLine — Bangladesh Power Sector News & Grid Data' },
  description:
    "Bangladesh's premier source for power sector news, renewable energy, policy, projects & tenders, grid explorer, and the monthly magazine.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ESB PowerLine — Bangladesh Power Sector News & Grid Data',
    description:
      'Authoritative coverage of generation, renewables, policy, grid infrastructure and the projects shaping the sector.',
    // A page-level openGraph replaces the layout's block, image included.
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
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
      let articles = await getPublishedArticlesByCategory(cat.name, locale, 24);
      return {
        ...cat,
        articles,
      };
    })
  );

  /**
   * The teaser must advertise the issue /magazine actually opens.
   *
   * It read `getLatestMagazineIssue()` unconditionally, which is a seed row —
   * so the homepage promoted "Renewables Surge & Tariff Reform", a May 2026
   * edition that was never produced, while /magazine served the real demo issue
   * "A Shift in Power". Same precedence rule as the magazine page: while
   * IS_DEMO holds, the demo issue wins over whatever the database says.
   */
  const magazine = IS_DEMO
    ? {
        title: DEMO_ISSUE.title,
        summary: DEMO_ISSUE.standfirst,
        coverUrl: await getMagazineCoverUrl(),
        issueDate: new Date(DEMO_ISSUE.producedOn),
      }
    : (magazineRow ?? {
        title: 'ESB PowerLine Monthly',
        summary: 'In-depth analysis on Bangladesh power sector policy, projects and data.',
        coverUrl: '/images/demo_magazine_cover.jpg',
        issueDate: new Date(),
      });
  // Feeds "Read {label} Issue" / "{label} সংখ্যা পড়ুন", so the volume alone —
  // "Vol 001 • Issue 01" would render as "Read ... Issue 01 Issue".
  const magazineLabel = IS_DEMO
    ? DEMO_ISSUE.volume
    : magazineRow
      ? new Date(magazineRow.issueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Latest';
  const snapshotLabel = getSnapshotLabel(settings);
  const professionalsCta = getProfessionalsCta(settings);
  const panelFlags = getPanelFlags(settings);
  const snapshotStats = dailySnapshot?.stats ?? settings.snapshot;
  const snapshotDate = (dailySnapshot?.date ?? settings.snapshotDate) as string | undefined;
  const snapshotHeaderDate = formatSnapshotHeaderDate(snapshotDate, locale);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 home-page">
        {/* The homepage had no h1 at all — the hero story is an h2 — so the
            site's highest-authority URL carried no heading-level topic signal
            (SEO_FIX_LOG stage 5). Screen-reader-only; the visual design is
            unchanged. */}
        <h1 className="sr-only">ESB PowerLine — Bangladesh power sector news, grid data and energy policy</h1>
        <div className="container container--shell home-hero-band">
          <div className="home-hero-band__grid">
            <div className="home-hero-band__hero">
              <FeaturedCarousel
                items={carouselItems}
                tickerItems={liveTicker ?? (settings.ticker as TickerItem[] | undefined)}
                inBand
              />
            </div>
            <aside className="home-hero-band__snapshot">
              <HomeSnapshotPanel
                snapshotStats={snapshotStats}
                snapshotLabel={snapshotLabel}
                snapshotDate={snapshotDate}
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
                initialInterviews={resolveHomepageInterviews(settings.interviews, interviews)}
              />

              {/* Mobile/Tablet Inline Ad block for 004.png */}
              <div className="block lg:hidden home-ad-space--sidebar mb-8 max-w-sm mx-auto" suppressHydrationWarning>
                <Link prefetch={false} href="/contact#advertising" className="rounded-2xl w-full overflow-hidden relative group block" suppressHydrationWarning>
                  {/* Without `sizes` the browser assumed the viewport and
                      picked the 2560px candidate for a slot capped at 24rem
                      (measured 2026-09-19). Hidden from lg up, so 0px there. */}
                  <Image src="/images/promotions/004.png" alt="Advertisement" width={1248} height={1200} sizes="(max-width: 1023px) 24rem, 0px" className="w-full h-auto object-cover block" suppressHydrationWarning />
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
              
              {/* Sidebar: the magazine's declaration announcement, in the slot
                  that carried an ad. It links to /magazine because that is the
                  thing the card is announcing. */}
              <Link prefetch={false} href="/magazine" className="home-ad-space--sidebar rounded-2xl w-full overflow-hidden relative group hidden lg:block mt-8" suppressHydrationWarning>
                <Image
                  src="/images/cards/magazine-declaration.jpg"
                  alt="Congratulations: Energy & Power Base, a monthly English magazine, gets its official declaration to publish. Farid Uddin Ahmed, Editor & Publisher, ESB Power Line."
                  width={2163}
                  height={2163}
                  sizes="(max-width: 1023px) 0px, 26rem"
                  className="w-full h-auto object-cover block"
                  suppressHydrationWarning
                />
              </Link>

              {panelFlags.importantLinks && <ImportantLinks data={resolveImportantLinks(settings)} />}

              {panelFlags.policyFramework && <PolicyFramework policies={resolvePolicies(settings)} />}

              <TitasGasWatch />
            </aside>
          </div>

          {/* 2-Column Pre-Footer Ad Space */}
          <div className="home-ad-space--pre-footer grid grid-cols-1 md:grid-cols-2 gap-6" suppressHydrationWarning>
            <Link prefetch={false} href="/contact#advertising" className="rounded-2xl w-full overflow-hidden relative group block" suppressHydrationWarning>
              <Image src="/images/promotions/006.png" alt="Advertisement" width={2184} height={480} sizes="(max-width: 767px) 100vw, (max-width: 1536px) 50vw, 768px" className="w-full h-auto object-cover block" suppressHydrationWarning />
            </Link>
            <Link prefetch={false} href="/contact#advertising" className="rounded-2xl w-full overflow-hidden relative group hidden md:block" suppressHydrationWarning>
              <Image src="/images/promotions/007.png" alt="Advertisement" width={2184} height={480} sizes="(max-width: 767px) 0px, (max-width: 1536px) 50vw, 768px" className="w-full h-auto object-cover block" suppressHydrationWarning />
            </Link>
          </div>

          <HomeBottomRow
            layout="split"
            magazine={magazine}
            magazineLabel={magazineLabel}
            magazineIsDemo={IS_DEMO}
            professionalsCta={professionalsCta}
          />
        </div>
      </main>
    </div>
  );
}