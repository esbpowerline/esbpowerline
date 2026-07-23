import type { Metadata } from 'next';
import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { getPublicCategories } from '@/lib/category-content';
import { getPublicSettingsMap } from '@/lib/homepage-content';
import { getLiveTickerItems } from '@/lib/data/grid/live-ticker.server';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettingsMap();
  const site = settings.site as { name?: string; tagline?: string } | undefined;
  const seo = settings.seo as { metaTitle?: string; metaDescription?: string } | undefined;
  return {
    ...(seo?.metaTitle ? { title: seo.metaTitle } : {}),
    description: seo?.metaDescription ?? site?.tagline,
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