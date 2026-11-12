import '@/app/articles-phone.css';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { HomeTrendingSection } from '@/components/home/HomeTrendingSection';
import { getPublicCategories, getPublishedArticlesForPublic, getTrendingPublishedArticles } from '@/lib/category-content';
import { createTranslator } from '@/lib/i18n/messages';
import { getServerSiteLocale } from '@/lib/locale-server';
import { ArticlesIndex, ARTICLES_PER_PAGE } from '@/components/news/ArticlesIndex';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

/** How many articles the index paginates over. Page 2… live at /articles/page/N. */
export const ARTICLES_INDEX_LIMIT = 120;

/**
 * The shared frame of the news index: header, sort links, the grid and the
 * trending rail. `/articles`, `/articles/page/[n]` and `/articles/popular`
 * all render through this so they stay one design.
 */
export async function ArticlesIndexFrame({
  page,
  sort,
  featured = false,
}: {
  page: number;
  sort: 'latest' | 'popular';
  /** /articles/featured: only editor-flagged (isFeatured) stories, newest first, one page. */
  featured?: boolean;
}) {
  const locale = await getServerSiteLocale();
  const t = createTranslator(locale);

  const [categories, allArticles, trending] = await Promise.all([
    getPublicCategories(),
    getPublishedArticlesForPublic(ARTICLES_INDEX_LIMIT, locale),
    getTrendingPublishedArticles(5, locale),
  ]);

  const pool = featured ? allArticles.filter((a) => a.isFeatured) : allArticles;
  const ordered =
    sort === 'popular'
      ? [...pool].sort((a, b) => b.views - a.views)
      : [...pool].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = featured ? 1 : Math.max(1, Math.ceil(ordered.length / ARTICLES_PER_PAGE));
  const articles = featured
    ? ordered
    : sort === 'popular'
      ? ordered.slice(0, ARTICLES_PER_PAGE * 2)
      : ordered.slice((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE);

  return (
    <div className="container container--shell articles-page py-8 md:py-10">
      <Breadcrumbs
        crumbs={
          featured
            ? [{ name: 'News', path: '/articles' }, { name: 'Featured' }]
            : sort === 'popular'
            ? [{ name: 'News', path: '/articles' }, { name: t('articles.mostRead') }]
            : page > 1
              ? [{ name: 'News', path: '/articles' }, { name: `${t('articles.page')} ${page}` }]
              : [{ name: 'News' }]
        }
      />
      <header className="articles-page__header flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="articles-page__kicker section-kicker text-rose-600/80 dark:text-rose-400/90 mb-1.5">
            {t('articles.kicker')}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            {featured ? 'Featured' : sort === 'popular' ? t('articles.mostRead') : t('articles.title')}
            {!featured && sort === 'latest' && page > 1 ? ` — ${t('articles.page')} ${page}` : ''}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">{t('articles.subtitle')}</p>
        </div>
        <div className="articles-page__toolbar shrink-0">
          <Link prefetch={false} href="/search" className="articles-page__toolbar-btn">
            <Search className="articles-page__toolbar-icon" strokeWidth={2} aria-hidden />
            <span>{t('articles.advancedSearch')}</span>
          </Link>
          {/* The sort control, as two links instead of a client select that
              wrote `?sort=` into the URL: each order is its own page. */}
          {/* A segmented control, styled in globals.css alongside the search
              button it sits next to. The Tailwind version put a solid
              `bg-primary` blob against bare grey text inside a track whose
              border/60 was invisible — so the active half read as a heavy
              badge and the inactive half did not read as a control at all. */}
          <nav className="articles-page__sort" aria-label={t('articles.filterBy')}>
            <Link
              prefetch={false}
              href="/articles"
              className="articles-page__sort-btn"
              data-active={sort === 'latest' && !featured ? 'true' : 'false'}
              aria-current={sort === 'latest' && !featured ? 'page' : undefined}
            >
              {t('articles.latest')}
            </Link>
            <Link
              prefetch={false}
              href="/articles/popular"
              className="articles-page__sort-btn"
              data-active={sort === 'popular' ? 'true' : 'false'}
              aria-current={sort === 'popular' ? 'page' : undefined}
            >
              {t('articles.mostRead')}
            </Link>
          </nav>
        </div>
      </header>

      <div className="articles-editorial__grid">
        <main className="articles-editorial__main min-w-0">
          <ArticlesIndex
            articles={articles}
            categories={categories}
            locale={locale}
            page={page}
            totalPages={totalPages}
            sort={sort}
          />
        </main>

        <aside className="articles-editorial__rail" aria-label={t('articles.trending')}>
          <HomeTrendingSection trending={trending} layout="rail" />
        </aside>
      </div>
    </div>
  );
}
