import type { Metadata } from 'next';
import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { getPublicCategories } from '@/lib/category-content';
import { getPublicSettingsMap } from '@/lib/homepage-content';
import { getLiveTickerItems } from '@/lib/data/grid/live-ticker.server';

/**
 * The second half of the 60-second clamp, and the one that only showed up in a
 * build.
 *
 * A layout's revalidate applies to every page beneath it, and the effective
 * window is the minimum down the whole segment tree — so this five minutes
 * capped all 26 public routes regardless of what each declared. With the data
 * caches fixed, /about and /grid-explorer/archive/2013 went from 1m to 5m and
 * stopped there, still re-rendering 288 times a day apiece.
 *
 * Nothing this layout reads needs five minutes. Categories and settings are
 * both tagged caches that are expired on mutation, and the ticker is a plain
 * import of lib/data/macro/*.ts — compile-time data, no query, no fetch. So
 * this is a backstop like the others, and each page's own declaration is what
 * should govern: 3m for the homepage, 10m for an article, a day for /about.
 */
export const revalidate = 86_400;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettingsMap();
  const site = settings.site as { name?: string; tagline?: string } | undefined;
  const seo = settings.seo as { metaTitle?: string; metaDescription?: string } | undefined;
  return {
    // A template, so every public page states its own title and the site name
    // is appended once. Pages used to hard-code "| ESB PowerLine" themselves
    // (17 files) because a plain string here cancelled the root template; the
    // suffix then cost ~15 of the ~60 characters a result shows on 121 of 161
    // article titles. Articles opt out with an absolute title (stage 5).
    title: {
      // `absolute`, not `default`: the site-level title already names the
      // site, and the root template would append the name a second time.
      absolute: seo?.metaTitle ?? 'ESB PowerLine — Bangladesh Power Sector News & Grid Data',
      template: '%s | ESB PowerLine',
    },
    description: seo?.metaDescription ?? site?.tagline,
    openGraph: {
      siteName: 'ESB PowerLine',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, liveTicker] = await Promise.all([
    getPublicCategories(),
    getPublicSettingsMap(),
    getLiveTickerItems().catch(() => null),
  ]);

  return (
    <>
      <PublicNavbar
        categories={categories}
        tickerItems={liveTicker ?? (settings.ticker as TickerItem[] | undefined)}
      />
      {children}
      <PublicFooter categories={categories} />
    </>
  );
}