import { SearchResults } from '@/components/news/SearchResults';
import { getPublishedArticlesForPublic } from '@/lib/category-content';
import { createTranslator } from '@/lib/i18n/messages';
import { getServerSiteLocale } from '@/lib/locale-server';

export const revalidate = 600;

export const metadata = {
  title: 'Search',
  description: 'Search published power sector news and analysis.',
  // Every ?q= variant renders the same shell — keep the whole surface out of
  // the index rather than letting Google pick a canonical for us.
  robots: { index: false, follow: true },
};

export default async function SearchPage() {
  const locale = await getServerSiteLocale();
  const t = createTranslator(locale);
  const articles = await getPublishedArticlesForPublic(120, locale);

  return (
    <div className="container container--shell search-page py-8 md:py-10">
      <header className="search-page__header mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{t('search.title')}</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">{t('search.subtitle')}</p>
      </header>
      <SearchResults articles={articles} />
    </div>
  );
}