'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import { CATEGORIES } from '@/lib/constants';
import { useLocale } from '@/components/shared/LocaleProvider';
import type { PublicArticleCard, PublicCategory } from '@/lib/category-types';
import type { ResolvedCoverageSlot } from '@/lib/coverage-types';

function getCategoryCount(categories: PublicCategory[]): number {
  return categories.length || CATEGORIES.length;
}

export function SectorCoverage({
  hideHeader = false,
  categories = [],
  articles = [],
  coverageSlots = [],
  pinnedArticles = [],
}: {
  hideHeader?: boolean;
  categories?: PublicCategory[];
  articles?: PublicArticleCard[];
  coverageSlots?: ResolvedCoverageSlot[];
  pinnedArticles?: PublicArticleCard[];
}) {
  const { t } = useLocale();
  const categoryCount = useMemo(() => getCategoryCount(categories), [categories]);
  const sectionLabel = t('coverage.allCoverage');
  const sectionDescription = t('coverage.allDescription', { count: categoryCount });

  const filteredArticles = useMemo(
    () => [...articles]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8),
    [articles]
  );

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.015em]">{t('coverage.title')}</h2>
            <div className="hidden sm:flex items-center text-[10px] px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
              <Zap className="h-3 w-3 mr-1" />
              {t('coverage.nCategories', { count: categoryCount })}
            </div>
          </div>
          <Link prefetch={false} href="/articles" className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
            {t('coverage.browseArchive')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {!hideHeader ? (
        <div className="mb-3 text-sm text-muted-foreground">{sectionDescription}</div>
      ) : null}

      <div className="home-article-grid">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((a) => (
            <ArticleCard
              key={a.id}
              id={a.slug}
              articleId={a.id}
              title={a.title}
              shortTitle={a.shortTitle}
              excerpt={a.excerpt}
              category={a.category}
              imageUrl={a.imageUrl}
              author={a.author}
              date={a.date}
              readTime={a.readTime}
              views={a.views}
              isFeatured={a.isFeatured}
              isBreaking={a.isBreaking}
              isPinned={a.isPinned}
              hideCategory={true}
            />
          ))
        ) : (
          <p className="text-muted-foreground col-span-full py-8 text-center">{t('coverage.noArticles')}</p>
        )}
      </div>

      <div className="mt-3 text-right">
        <Link
          prefetch={false}
          href="/articles"
          className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          {t('coverage.viewAllIn', { label: sectionLabel })} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}