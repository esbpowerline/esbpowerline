'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Zap,
  Scale,
  Flame,
  Sun,
  Cable,
  Building2,
  Lightbulb,
  TrendingUp,
  Globe,
  Leaf,
} from 'lucide-react';
import { SectorCoverage } from '@/components/news/SectorCoverage';
import { ArticleCard } from '@/components/news/ArticleCard';
import { useLocale } from '@/components/shared/LocaleProvider';
import type { PublicArticleCard, PublicCategory } from '@/lib/category-types';
import type { ResolvedCoverageSlot } from '@/lib/coverage-types';

// Map of category icon name to Lucide React component
const IconMap: Record<string, React.ComponentType<any>> = {
  Scale,
  Zap,
  Flame,
  Sun,
  Cable,
  Building2,
  Lightbulb,
  TrendingUp,
  Globe,
  Leaf,
};

type CategoryWithArticles = PublicCategory & {
  articles: PublicArticleCard[];
};

export function HomePowerSector({
  categoriesWithArticles,
  coverageSlots,
  pinnedArticles,
  featuredArticles = [],
}: {
  categoriesWithArticles: CategoryWithArticles[];
  coverageSlots: ResolvedCoverageSlot[];
  pinnedArticles: PublicArticleCard[];
  featuredArticles?: PublicArticleCard[];
}) {
  const { t } = useLocale();

  const categories = categoriesWithArticles.map(({ articles, ...cat }) => cat);

  return (
    <section className="home-block" aria-labelledby="home-power-sector-title">
      <div className="home-section-head flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <div className="section-kicker text-primary/80 mb-1.5">
            {t('coverage.allCoverage').toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary shrink-0" aria-hidden />
            <h2 id="home-power-sector-title" className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              {t('home.powerSector')}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{t('home.powerSectorSub')}</p>
        </div>
        <Link
          href="/articles"
          className="text-sm text-primary inline-flex items-center gap-1 hover:underline font-medium shrink-0"
        >
          {t('home.browseAllNews')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {/* Top-level Featured/Curation Articles (Editors' picks) */}
      <div className="mb-12">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Featured Coverage
        </div>
        <SectorCoverage
          hideHeader
          categories={categories}
          articles={featuredArticles}
          coverageSlots={coverageSlots}
          pinnedArticles={pinnedArticles}
        />
      </div>

      {/* 10 Vertical Categories Section */}
      <div className="space-y-12 border-t border-border/40 pt-12">
        {categoriesWithArticles
          .filter((cat) => cat.articles.length > 0)
          .map((cat, index) => {
            const IconComponent = (cat.icon && IconMap[cat.icon]) || Zap;
            return (
              <React.Fragment key={cat.id}>
                <div className="category-section">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: cat.color || '#3b82f6' }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                          {cat.name}
                          <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border/40">
                            {cat.articleCount}
                          </span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                      </div>
                    </div>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View All <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cat.articles.map((a) => (
                      <ArticleCard
                        key={a.id}
                        id={a.slug}
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
                        hideCategory={true}
                      />
                    ))}
                  </div>
                </div>

                {/* 3 Proportional Ad Spaces */}
                {(index === 1 || index === 7) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" suppressHydrationWarning>
                    <Link href="/advertising" className="rounded-2xl overflow-hidden relative group block" suppressHydrationWarning>
                      <Image src="/images/promotions/009.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover" suppressHydrationWarning />
                    </Link>
                    <Link href="/advertising" className="rounded-2xl overflow-hidden relative group hidden md:block" suppressHydrationWarning>
                      <Image src="/images/promotions/002.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover" suppressHydrationWarning />
                    </Link>
                    <Link href="/advertising" className="rounded-2xl overflow-hidden relative group hidden md:block" suppressHydrationWarning>
                      <Image src="/images/promotions/003.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover" suppressHydrationWarning />
                    </Link>
                  </div>
                )}

                {/* 1 Large Full-Width Ad Space */}
                {(index === 4 || index === 10) && (
                  <Link href="/advertising" className="rounded-2xl overflow-hidden relative group w-full block" suppressHydrationWarning>
                    <Image src="/images/promotions/005.png" alt="Advertisement" width={3126} height={480} className="w-full h-auto object-cover" suppressHydrationWarning />
                  </Link>
                )}
              </React.Fragment>
            );
          })}
      </div>
    </section>
  );
}