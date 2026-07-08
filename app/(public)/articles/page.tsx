import Link from 'next/link';
import { Search } from 'lucide-react';
import { ArticleCard } from '@/components/news/ArticleCard';
import { HomeTrendingSection } from '@/components/home/HomeTrendingSection';
import { getPublicCategories, getPublishedArticlesForPublic, getTrendingPublishedArticles } from '@/lib/category-content';
import { localizeCategoryFields } from '@/lib/i18n/categories';
import { createTranslator } from '@/lib/i18n/messages';
import { getServerSiteLocale } from '@/lib/locale-server';
import { SortSelect } from '@/components/news/SortSelect';
import { Suspense } from 'react';
import { ArticlesClient } from '@/components/news/ArticlesClient';
export const revalidate = 300;

export const metadata = {
  title: 'Latest News | ESB PowerLine',
  description: 'Latest power & energy sector news from Bangladesh. Filter by category, search, and read in-depth analysis.',
  openGraph: {
    title: 'Latest News | ESB PowerLine',
    description: 'Bangladesh power sector updates, renewable energy, policy, projects and tenders.',
  },
};

export default async function ArticlesPage() {
  const locale = await getServerSiteLocale();
  const t = createTranslator(locale);

  const [categories, allArticles, trending] = await Promise.all([
    getPublicCategories(),
    getPublishedArticlesForPublic(120, locale),
    getTrendingPublishedArticles(5, locale),
  ]);

  return (
    <div className="container container--shell articles-page py-8 md:py-10">
      <header className="articles-page__header flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="articles-page__kicker section-kicker text-rose-600/80 dark:text-rose-400/90 mb-1.5">
            {t('articles.kicker')}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{t('articles.title')}</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">{t('articles.subtitle')}</p>
        </div>
        <div className="articles-page__toolbar shrink-0">
          <Link href="/search" className="articles-page__toolbar-btn">
            <Search className="articles-page__toolbar-icon" strokeWidth={2} aria-hidden />
            <span>{t('articles.advancedSearch')}</span>
          </Link>
          <Suspense fallback={<div className="h-6 w-24 bg-muted/20 animate-pulse rounded" />}>
            <SortSelect />
          </Suspense>
        </div>
      </header>

      <div className="articles-editorial__grid">
        <div className="articles-editorial__main min-w-0">
          <Suspense fallback={<div className="h-96 rounded-2xl border border-border/50 bg-muted/15 animate-pulse my-8" />}>
            <ArticlesClient
              categories={categories}
              allArticles={allArticles}
              locale={locale}
            />
          </Suspense>
        </div>

        <aside className="articles-editorial__rail" aria-label={t('articles.trending')}>
          <HomeTrendingSection trending={trending} layout="rail" />
        </aside>
      </div>
    </div>
  );
}