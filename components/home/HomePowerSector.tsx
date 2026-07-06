'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
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

function CategoryCarousel({ articles }: { articles: PublicArticleCard[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [isVisible, setIsVisible] = useState(false);

  // High-performance drag references (bypass React state updates during drag)
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentTranslateRef = useRef(0);
  const dragOffsetRef = useRef(0);

  const visibleCount = windowWidth >= 1024 ? 3 : windowWidth >= 768 ? 2 : 1;
  const maxIndex = Math.max(0, articles.length - visibleCount);
  const gap = 24; // px

  // Calculate base translation for a given index (without dragging offset)
  const getBaseTranslate = useCallback((index: number) => {
    if (index === 0) return 0;
    const container = containerRef.current;
    if (!container) return 0;
    const containerWidth = container.clientWidth;
    
    if (windowWidth >= 1024) {
      return -index * ((containerWidth - gap * 2) / 3 + gap);
    } else if (windowWidth >= 768) {
      return -index * ((containerWidth - gap) / 2 + gap);
    } else {
      return -index * (containerWidth + gap);
    }
  }, [windowWidth, gap]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (trackRef.current) {
        const base = getBaseTranslate(currentIndex);
        trackRef.current.style.transform = `translate3d(${base}px, 0px, 0px)`;
      }
    };
    
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [currentIndex, getBaseTranslate]);



  const nextCard = () => {
    if (currentIndex >= maxIndex) return;
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';
      const targetTranslate = getBaseTranslate(nextIdx);
      trackRef.current.style.transform = `translate3d(${targetTranslate}px, 0px, 0px)`;
    }
  };

  const prevCard = () => {
    if (currentIndex <= 0) return;
    const nextIdx = currentIndex - 1;
    setCurrentIndex(nextIdx);
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';
      const targetTranslate = getBaseTranslate(nextIdx);
      trackRef.current.style.transform = `translate3d(${targetTranslate}px, 0px, 0px)`;
    }
  };

  // Auto-swipe timer (disabled while dragging)
  useEffect(() => {
    if (articles.length <= visibleCount) return;

    const timer = setInterval(() => {
      if (isDraggingRef.current) return;
      setCurrentIndex((prev) => {
        let nextIdx = prev + 1;
        if (nextIdx > maxIndex) {
          nextIdx = 0;
        }
        if (trackRef.current) {
          trackRef.current.style.transition = 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';
          const targetTranslate = getBaseTranslate(nextIdx);
          trackRef.current.style.transform = `translate3d(${targetTranslate}px, 0px, 0px)`;
        }
        return nextIdx;
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [maxIndex, visibleCount, articles.length, getBaseTranslate]);

  // Drag handlers
  const handleDragStart = (clientX: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
    currentTranslateRef.current = getBaseTranslate(currentIndex);
    dragOffsetRef.current = 0;

    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  };

  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const offset = clientX - startXRef.current;
    dragOffsetRef.current = offset;

    const totalTranslate = currentTranslateRef.current + offset;
    
    const minBound = getBaseTranslate(maxIndex) - 80;
    const maxBound = 80;
    const boundedTranslate = Math.max(minBound, Math.min(maxBound, totalTranslate));

    trackRef.current.style.transform = `translate3d(${boundedTranslate}px, 0px, 0px)`;
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current || !trackRef.current) return;
    isDraggingRef.current = false;

    trackRef.current.style.transition = 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';

    const swipeThreshold = 60; // px
    let nextIndex = currentIndex;

    if (dragOffsetRef.current < -swipeThreshold && currentIndex < maxIndex) {
      nextIndex = currentIndex + 1;
    } else if (dragOffsetRef.current > swipeThreshold && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    setCurrentIndex(nextIndex);
    
    const targetTranslate = getBaseTranslate(nextIndex);
    trackRef.current.style.transform = `translate3d(${targetTranslate}px, 0px, 0px)`;
    
    dragOffsetRef.current = 0;
  };

  // Mouse event listeners
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    handleDragStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const onMouseUpOrLeave = () => {
    handleDragEnd();
  };

  // Touch event listeners
  const onTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  if (!articles || articles.length === 0) return null;

  const initialTranslate = getBaseTranslate(currentIndex);

  return (
    <div className="relative group/carousel w-full">
      {/* Left Arrow Button */}
      {articles.length > visibleCount && currentIndex > 0 && (
        <button
          onClick={prevCard}
          className="absolute -left-5 top-[40%] -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-background/85 hover:bg-background border border-border/40 hover:border-border/80 flex items-center justify-center text-foreground hover:text-primary transition-all backdrop-blur-sm cursor-pointer opacity-0 group-hover/carousel:opacity-100 pointer-events-none group-hover/carousel:pointer-events-auto hidden lg:flex"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Carousel Container */}
      <div 
        ref={containerRef}
        className={`category-grid-track overflow-hidden w-full select-none pb-4 pt-1 ${isVisible ? 'is-visible' : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ cursor: 'grab' }}
      >
        <div 
          ref={trackRef}
          className="flex gap-6 py-2 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translate3d(${initialTranslate}px, 0px, 0px)`, willChange: 'transform' }}
        >
          {articles.map((article) => (
            <div 
              key={article.id} 
              className="article-card-wrapper flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] pointer-events-none"
              style={{ userSelect: 'none' }}
              onDragStart={(e) => e.preventDefault()}
            >
              <div className="pointer-events-auto">
                <ArticleCard
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
                  isFeatured={article.isFeatured}
                  isBreaking={article.isBreaking}
                  hideCategory={true}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {articles.length > visibleCount && (
        <div className="category-carousel-dots">
          {[0, 1, 2].map((idx) => {
            let isActive = false;
            if (maxIndex > 0) {
              const ratio = currentIndex / maxIndex;
              if (idx === 0) isActive = ratio < 0.25;
              else if (idx === 2) isActive = ratio > 0.75;
              else isActive = ratio >= 0.25 && ratio <= 0.75;
            } else {
              isActive = idx === 0;
            }

            return (
              <button
                key={idx}
                onClick={() => {
                  let targetIdx = 0;
                  if (idx === 1) targetIdx = Math.round(maxIndex / 2);
                  else if (idx === 2) targetIdx = maxIndex;

                  setCurrentIndex(targetIdx);
                  if (trackRef.current) {
                    trackRef.current.style.transition = 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';
                    const targetTranslate = getBaseTranslate(targetIdx);
                    trackRef.current.style.transform = `translate3d(${targetTranslate}px, 0px, 0px)`;
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
                aria-label={`Go to section ${idx + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* Right Arrow Button */}
      {articles.length > visibleCount && currentIndex < maxIndex && (
        <button
          onClick={nextCard}
          className="absolute -right-5 top-[40%] -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-background/85 hover:bg-background border border-border/40 hover:border-border/80 flex items-center justify-center text-foreground hover:text-primary transition-all backdrop-blur-sm cursor-pointer opacity-0 group-hover/carousel:opacity-100 pointer-events-none group-hover/carousel:pointer-events-auto hidden lg:flex"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

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

      {/* Mobile Inline Ad block for 007.png */}
      <div className="block md:hidden mb-12" suppressHydrationWarning>
        <Link href="/advertising" className="rounded-2xl overflow-hidden relative group w-full block" suppressHydrationWarning>
          <Image src="/images/promotions/007.png" alt="Advertisement" width={2184} height={480} className="w-full h-auto object-cover block" suppressHydrationWarning />
        </Link>
      </div>

      {/* 10 Vertical Categories Section */}
      <div className="category-feed-container border-t border-border/40">
        {categoriesWithArticles
          .filter((cat) => cat.articles.length > 0)
          .map((cat, index) => {
            const IconComponent = (cat.icon && IconMap[cat.icon]) || Zap;
            return (
              <React.Fragment key={cat.id}>
                <div className="category-section">
                  <div className="category-section__header flex items-center justify-between">
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

                  <div>
                    <CategoryCarousel articles={cat.articles} />
                  </div>
                </div>

                {/* 3 Proportional Ad Spaces */}
                {(index === 1 || index === 7) && (
                  <div className="category-ad-block-3 grid grid-cols-1 md:grid-cols-3 gap-6" suppressHydrationWarning>
                    <Link href="/advertising" className="rounded-2xl overflow-hidden relative group block" suppressHydrationWarning>
                      <Image src="/images/promotions/009.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover block" suppressHydrationWarning />
                    </Link>
                    <Link href="/advertising" className="rounded-2xl overflow-hidden relative group hidden md:block" suppressHydrationWarning>
                      <Image src="/images/promotions/002.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover block" suppressHydrationWarning />
                    </Link>
                    <Link href="/advertising" className="rounded-2xl overflow-hidden relative group hidden md:block" suppressHydrationWarning>
                      <Image src="/images/promotions/003.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover block" suppressHydrationWarning />
                    </Link>
                  </div>
                )}

                {/* 1 Large Full-Width Ad Space */}
                {(index === 4 || index === 10) && (
                  <Link href="/advertising" className="category-ad-block-1 rounded-2xl overflow-hidden relative group w-full block" suppressHydrationWarning>
                    <Image src="/images/promotions/005.png" alt="Advertisement" width={3126} height={480} className="w-full h-auto object-cover block" suppressHydrationWarning />
                  </Link>
                )}
              </React.Fragment>
            );
          })}
      </div>
    </section>
  );
}