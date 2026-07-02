'use client';

import React from 'react';
import Link from 'next/link';
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`bg-muted/30 border border-border/40 rounded-2xl h-[120px] md:h-[160px] flex flex-col items-center justify-center text-muted-foreground/60 overflow-hidden relative group ${i > 1 ? 'hidden md:flex' : ''}`}>
                        <div className="absolute inset-0 -z-10 opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_50%,transparent_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:10px_10px]" />
                        <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Advertisement</span>
                        <span className="text-sm font-medium">Proportional Ad</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 1 Large Full-Width Ad Space */}
                {(index === 4 || index === 10) && (
                  <div className="bg-muted/30 border border-border/40 rounded-2xl h-[120px] md:h-[160px] flex flex-col items-center justify-center text-muted-foreground/60 overflow-hidden relative group w-full">
                    <div className="absolute inset-0 -z-10 opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_50%,transparent_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:10px_10px]" />
                    <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Advertisement</span>
                    <span className="text-sm font-medium">Large Ad Space</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
      </div>
    </section>
  );
}