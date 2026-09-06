import Link from 'next/link';
import { ArticleCard } from '@/components/news/ArticleCard';
import { localizeCategoryFields } from '@/lib/i18n/categories';
import { createTranslator } from '@/lib/i18n/messages';
import type { PublicArticleCard, PublicCategory } from '@/lib/category-types';
import type { SiteLocale } from '@/lib/locale';

export const ARTICLES_PER_PAGE = 9;

/**
 * The news index, rendered on the server.
 *
 * Its predecessor (`ArticlesClient`) filtered, sorted and paginated in the
 * browser from `useSearchParams`, which on a static route bails the whole
 * subtree out of prerendering: the served HTML held four grey placeholder
 * boxes and five sidebar links while 120 fetched articles were thrown away.
 * "Load more" was cumulative (`?page=2` was a superset of page 1) and every
 * filter combination — ten categories × two sorts × N pages — was a distinct
 * query-string URL canonicalised to `/articles` (SEO_FIX_LOG stage 4).
 *
 * Now every view is a real page with its own URL and its own canonical:
 * `/articles` and `/articles/page/N` (latest first), `/articles/popular`
 * (most read), and the category pills link to the category pages, which
 * already existed. The controls a reader had — category filter, sort,
 * pagination — are all still here; they are links instead of client state.
 */
export function ArticlesIndex({
  articles,
  categories,
  locale,
  page,
  totalPages,
  sort,
}: {
  articles: PublicArticleCard[];
  categories: PublicCategory[];
  locale: SiteLocale;
  page: number;
  totalPages: number;
  sort: 'latest' | 'popular';
}) {
  const t = createTranslator(locale);
  const pageHref = (n: number) => (n <= 1 ? '/articles' : `/articles/page/${n}`);

  // A window of page numbers around the current one; the first and last are
  // always present so every page is reachable in at most two hops.
  const numbers = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, totalPages])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  return (
    <>
      <div className="articles-page__filters mb-6 md:mb-8">
        <Link prefetch={false} href="/articles" className={`category-pill ${sort === 'latest' ? 'active' : ''}`}>
          {t('common.all')}
        </Link>
        {categories.map((cat) => {
          const localized = localizeCategoryFields(locale, cat);
          return (
            <Link prefetch={false} key={cat.id} href={`/categories/${cat.slug}`} className="category-pill">
              {localized.name}
            </Link>
          );
        })}
      </div>

      <div className="articles-editorial__main min-w-0">
        {articles.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">{t('coverage.noArticles')}</p>
        ) : (
          <div className="articles-grid" id="articles-grid">
            {articles.map((article, i) => (
              <ArticleCard
                key={article.id}
                priority={i < 2}
                id={article.slug}
                articleId={article.id}
                title={article.title}
                shortTitle={article.shortTitle}
                excerpt={article.excerpt}
                category={article.category}
                imageUrl={article.imageUrl}
                author={article.author}
                date={article.date}
                readTime={article.readTime}
                views={article.views}
              />
            ))}
          </div>
        )}

        {sort === 'latest' && totalPages > 1 && (
          <nav className="articles-pagination mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={t('articles.page')}>
            {page > 1 && (
              <Link prefetch={false} href={pageHref(page - 1)} className="btn btn-outline px-4" rel="prev">
                ← {t('articles.previous')}
              </Link>
            )}
            {numbers.map((n, i) => (
              <span key={n} className="inline-flex items-center gap-2">
                {i > 0 && numbers[i - 1] !== n - 1 && <span aria-hidden className="text-muted-foreground">…</span>}
                {n === page ? (
                  <span className="btn btn-primary px-4" aria-current="page">{n}</span>
                ) : (
                  <Link prefetch={false} href={pageHref(n)} className="btn btn-outline px-4" aria-label={`${t('articles.page')} ${n}`}>
                    {n}
                  </Link>
                )}
              </span>
            ))}
            {page < totalPages && (
              <Link prefetch={false} href={pageHref(page + 1)} className="btn btn-outline px-4" rel="next">
                {t('articles.next')} →
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
