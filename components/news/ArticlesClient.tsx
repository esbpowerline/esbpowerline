'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { ArticleCard } from '@/components/news/ArticleCard';
import { localizeCategoryFields } from '@/lib/i18n/categories';
import { useLocale } from '@/components/shared/LocaleProvider';

interface ArticlesClientProps {
  categories: any[];
  allArticles: any[];
  locale: any;
}

export function ArticlesClient({ categories, allArticles, locale }: ArticlesClientProps) {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || undefined;
  const sort = searchParams.get('sort') || 'latest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const articles = useMemo(() => {
    let filtered = allArticles;

    if (categoryParam) {
      const match = categories.find((c) => c.slug === categoryParam);
      if (match) {
        filtered = filtered.filter((a) => a.category === match.name);
      }
    }

    if (sort === 'views') {
      return [...filtered].sort((a, b) => b.views - a.views);
    } else {
      return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [allArticles, categories, categoryParam, sort]);

  const perPage = 9;
  const totalPages = Math.ceil(articles.length / perPage);
  const paginatedArticles = articles.slice(0, currentPage * perPage);

  return (
    <>
      <div className="articles-page__filters mb-6 md:mb-8">
        <Link
          href={sort === 'views' ? '/articles?sort=views' : '/articles'}
          className={`category-pill ${!categoryParam ? 'active' : ''}`}
        >
          {t('common.all')}
        </Link>
        {categories.map((cat) => {
          const isActive = categoryParam === cat.slug;
          const href = sort === 'views'
            ? `/articles?category=${cat.slug}&sort=views`
            : `/articles?category=${cat.slug}`;
          const localized = localizeCategoryFields(locale, cat);
          return (
            <Link
              key={cat.id}
              href={href}
              className={`category-pill ${isActive ? 'active' : ''}`}
            >
              {localized.name}
            </Link>
          );
        })}
      </div>

      <div className="articles-editorial__main min-w-0">
        {paginatedArticles.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">{t('coverage.noArticles')}</p>
        ) : (
          <div className="articles-grid" id="articles-grid">
            {paginatedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.slug}
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

        {currentPage < totalPages && (
          <div className="mt-8 text-center">
            <Link
              href={`/articles?${new URLSearchParams({
                ...(categoryParam && { category: categoryParam }),
                ...(sort !== 'latest' && { sort }),
                page: String(currentPage + 1),
              })}`}
              className="btn btn-primary px-8"
              scroll={false}
            >
              {t('articles.loadMore')}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
