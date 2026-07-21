'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { ArticlePlacementBadge } from '@/components/shared/ArticlePlacementBadge';
import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { CategoryLabel } from '@/components/i18n/CategoryLabel';
import { useLocale } from '@/components/shared/LocaleProvider';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { NoImage } from '@/components/shared/NoImage';
import { hasArticleImage } from '@/lib/article-image';
import { heroImageStyle } from '@/lib/hero-image';
import { FeaturedCarouselFooter, type FeaturedCarouselFooterLabels } from '@/components/news/FeaturedCarouselFooter';

interface FeaturedItem {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  author: string;
  readTime: number;
  category: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  heroMeta?: any;
}

export function FeaturedCarousel({
  items,
  tickerItems,
  inBand = false,
  footerLabels,
}: {
  items?: FeaturedItem[];
  tickerItems?: TickerItem[];
  inBand?: boolean;
  footerLabels?: Pick<FeaturedCarouselFooterLabels, 'readStory' | 'browseAll'>;
}) {
  const { t } = useLocale();
  const featured: FeaturedItem[] = items ?? [];

  const getCategoryBadgeClasses = (cat: string): string => {
    const lower = cat.toLowerCase();
    if (lower.includes('policy') || lower.includes('regulator')) {
      return 'border-indigo-500/25 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5';
    }
    if (lower.includes('generation')) {
      return 'border-blue-500/25 text-blue-600 dark:text-blue-400 bg-blue-500/5';
    }
    if (lower.includes('fossil') || lower.includes('commodit') || lower.includes('gas') || lower.includes('lng')) {
      return 'border-amber-500/25 text-amber-600 dark:text-amber-400 bg-amber-500/5';
    }
    if (lower.includes('renewable') || lower.includes('nuclear')) {
      return 'border-emerald-500/25 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5';
    }
    if (lower.includes('grid') || lower.includes('transmission')) {
      return 'border-cyan-500/25 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5';
    }
    if (lower.includes('distribution') || lower.includes('utilit')) {
      return 'border-teal-500/25 text-teal-600 dark:text-teal-400 bg-teal-500/5';
    }
    if (lower.includes('consumer') || lower.includes('tariff')) {
      return 'border-red-500/25 text-red-600 dark:text-red-400 bg-red-500/5';
    }
    if (lower.includes('market') || lower.includes('finance') || lower.includes('subsid')) {
      return 'border-pink-500/25 text-pink-600 dark:text-pink-400 bg-pink-500/5';
    }
    if (lower.includes('international') || lower.includes('cross-border')) {
      return 'border-indigo-500/25 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5';
    }
    if (lower.includes('environment') || lower.includes('efficiency')) {
      return 'border-teal-500/25 text-teal-600 dark:text-teal-400 bg-teal-500/5';
    }
    return 'border-border text-muted-foreground bg-muted/5';
  };

  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentRef = useRef(current);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const goTo = useCallback((index: number) => {
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);

    setIsTransitioning(true);
    transitionTimeout.current = setTimeout(() => {
      setCurrent(index);
      
      setIsTransitioning(false);
    }, 200);
  }, []);

  const next = useCallback(() => {
    goTo((currentRef.current + 1) % featured.length);
  }, [featured.length, goTo]);

  const prev = useCallback(() => {
    goTo((currentRef.current - 1 + featured.length) % featured.length);
  }, [featured.length, goTo]);

  useEffect(() => {
    if (!isPlaying || isTransitioning) return;

      }, [isPlaying, isTransitioning, next]);

  useEffect(() => {
    return () => {
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    };
  }, []);

  const currentItem = featured[current];
  const shellClass = inBand ? '' : 'container container--shell';
  const sectionPad = inBand ? '' : ' py-4';

  const emptyCard = (
    <div className="featured-hero-card relative overflow-hidden rounded-2xl border border-border/40 p-12 text-center text-muted-foreground bg-muted/10">
      {t('carousel.noFeatured')}
    </div>
  );

  if (!currentItem) {
    return (
      <section className={`featured-hero-section w-full${sectionPad}`}>
        {inBand ? emptyCard : <div className={shellClass}>{emptyCard}</div>}
      </section>
    );
  }

  const storyProgress = (
    <div className="flex min-w-0 flex-1 items-center gap-1" role="tablist" aria-label="Featured stories">
      {featured.map((item, idx) => {
        const isActive = idx === current;
        const isPast = idx < current;
        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => { e.preventDefault(); goTo(idx); }}
            role="tab"
            className="featured-hero__progress-tab flex flex-1 items-center py-0"
            aria-label={`Story ${idx + 1}: ${item.title}`}
            aria-selected={isActive}
          >
            <span className="relative h-1 w-full overflow-hidden rounded-full bg-border/40">
              <span
                className={`absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30 ${
                  isPast ? 'w-full' : 'w-0'
                }`}
                style={
                  isActive
                    ? {
                        animation: `progressFill 7.5s linear forwards`,
                        animationPlayState: isPlaying && !isTransitioning ? 'running' : 'paused',
                      }
                    : undefined
                }
                onAnimationEnd={isActive ? () => next() : undefined}
              />
            </span>
          </button>
        );
      })}
    </div>
  );

  const heroCard = (
        <div
          className="featured-hero-card hero-dot-pattern relative overflow-hidden rounded-2xl border border-border/40"
          aria-roledescription="carousel"
          aria-label="Featured stories"
        >
          <div
            className={`featured-hero__body relative ${
              inBand ? 'py-0 featured-hero__body--band' : 'py-10 md:py-14'
            }`}
          >
            <div className="featured-hero__split">
              <div
                className={`featured-hero__content min-w-0 transition-opacity duration-200 ease-out ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="featured-hero__meta flex items-center gap-2 overflow-hidden">
                  <div
                    className={`featured-hero__category inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${getCategoryBadgeClasses(currentItem.category)}`}
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-75" />
                    <CategoryLabel name={currentItem.category} />
                  </div>
                  {currentItem.isFeatured ? <ArticlePlacementBadge type="featured" /> : null}
                  {currentItem.isBreaking ? <ArticlePlacementBadge type="breaking" /> : null}
                </div>

                <div className="featured-hero__title-slot">
                  <h1 className="featured-hero__title">{currentItem.title}</h1>
                </div>

                <div className="featured-hero__excerpt-slot">
                  <p className="featured-hero__excerpt text-lg leading-relaxed text-muted-foreground md:text-xl line-clamp-3">
                    {currentItem.excerpt ? currentItem.excerpt.replace(/\[&hellip;\]/g, '...').replace(/&hellip;/g, '...') : '\u00A0'}
                  </p>
                </div>

                <FeaturedCarouselFooter
                  slug={currentItem.slug}
                  labels={{
                    readStory: footerLabels?.readStory ?? t('carousel.readStory'),
                    browseAll: footerLabels?.browseAll ?? t('carousel.browseAll'),
                    minRead: t('carousel.minRead', { minutes: currentItem.readTime }),
                  }}
                  transport={
                    <div className="featured-hero__transport flex shrink-0 items-center ms-auto">
                      <div className="featured-hero__transport-controls group/transport flex min-w-0 items-center gap-1 opacity-45 transition-opacity duration-150 hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); prev(); }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                          aria-label={t('carousel.previous')}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <div className="featured-hero__progress-track flex min-w-[3.5rem] max-w-[5.5rem] flex-1 items-center">
                          {storyProgress}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); next(); }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                          aria-label={t('carousel.next')}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="featured-hero__counter shrink-0 font-mono font-medium tabular-nums text-muted-foreground">
                        {current + 1}/{featured.length}
                      </span>
                      <ModernTooltip
                        label={isPlaying ? t('carousel.pause') : t('carousel.play')}
                        hint={t('carousel.storiesMarkets')}
                        side="top"
                        fast
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setIsPlaying(!isPlaying); }}
                          className="featured-hero__play-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-45 transition-all duration-150 hover:bg-muted/50 hover:text-foreground hover:opacity-100 focus-visible:opacity-100"
                          aria-label={isPlaying ? t('carousel.pause') : t('carousel.play')}
                        >
                          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </button>
                      </ModernTooltip>
                    </div>
                  }
                />
              </div>

              <div className="featured-hero__image-wrap relative">
                <div className="featured-hero__image relative w-full overflow-hidden rounded-xl">
                  {featured.map((item, idx) =>
                    hasArticleImage(item.imageUrl) ? (
                      <Image
                        key={idx}
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        priority={idx === 0}
                        fetchPriority={idx === 0 ? "high" : "auto"}
                        className={`absolute inset-0 h-full w-full ${
                          idx === current ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                        }`}
                        style={heroImageStyle({ fitMode: 'fill', ...(item.heroMeta ?? {}) })}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div
                        key={idx}
                        className={`absolute inset-0 ${
                          idx === current ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                        }`}
                      >
                        <NoImage className="h-full w-full" />
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
  );

  return (
    <section className={`featured-hero-section w-full${sectionPad}`}>
      {inBand ? heroCard : <div className={shellClass}>{heroCard}</div>}
    </section>
  );
}