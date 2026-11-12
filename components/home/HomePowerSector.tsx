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
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsExpanded(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleInteraction = () => {
    if (!isExpanded) setIsExpanded(true);
  };

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
    // Get actual gap size based on fluid root font size (1.5rem = gap-6)
    const gap = 1.5 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    
    if (windowWidth >= 1024) {
      return -index * ((containerWidth - gap * 2) / 3 + gap);
    } else if (windowWidth >= 768) {
      return -index * ((containerWidth - gap) / 2 + gap);
    } else {
      return -index * (containerWidth + gap);
    }
  }, [windowWidth]);

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
  }, [maxIndex, visibleCount, articles.length, getBaseTranslate, currentIndex]);

  // Drag handlers
  const handleDragStart = (clientX: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
    currentTranslateRef.current = getBaseTranslate(currentIndex);
    dragOffsetRef.current = 0;

    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
    // The drag state lives in a ref, not in state, so the rail never re-renders
    // mid-gesture. The attribute is the only way the stylesheet can see it.
    containerRef.current?.setAttribute('data-dragging', 'true');
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
    containerRef.current?.removeAttribute('data-dragging');

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
  const displayArticles = isExpanded ? articles : articles.slice(0, visibleCount + 2);

  return (
    <div 
      className="category-carousel relative group/carousel w-full"
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
      onFocus={handleInteraction}
    >
      {/* Left Arrow Button */}
      {articles.length > visibleCount && currentIndex > 0 && (
        <button
          onClick={prevCard}
          className="absolute left-1 top-[var(--category-nav-seam)] -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-background/85 hover:bg-background border border-border/40 hover:border-border/80 flex items-center justify-center text-foreground hover:text-primary transition-all backdrop-blur-sm cursor-pointer opacity-100 pointer-events-auto shadow-md"
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
          {displayArticles.map((article) => (
            <div 
              key={article.id} 
              className="article-card-wrapper flex-shrink-0 w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] pointer-events-none flex flex-col h-full"
              style={{ userSelect: 'none' }}
              onDragStart={(e) => e.preventDefault()}
            >
              <div className="pointer-events-auto flex-1 flex flex-col">
                <ArticleCard
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
                // The button is the bar itself, so the three stay grouped in the
                // row's 6px gap rather than being pushed ~50px apart by their own
                // boxes. Tapping room comes from a pseudo-element that grows only
                // vertically (44px tall), which costs nothing visually. Width still
                // tracks the bar, so these sit under the 24px WCAG 2.5.8 target
                // minimum — a deliberate trade to keep the grouped look.
                className={`relative h-1.5 rounded-full transition-all duration-300 before:absolute before:left-0 before:right-0 before:-top-[19px] before:-bottom-[19px] before:content-[''] ${
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
          className="absolute right-1 top-[var(--category-nav-seam)] -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-background/85 hover:bg-background border border-border/40 hover:border-border/80 flex items-center justify-center text-foreground hover:text-primary transition-all backdrop-blur-sm cursor-pointer opacity-100 pointer-events-auto shadow-md"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/**
 * A category row needs enough stories to fill its carousel — one or two leaves a
 * half-empty shelf that reads as broken rather than sparse. Categories below
 * this are held back from the homepage feed until they have the copy to carry a
 * row; they remain reachable at /articles and on their own category page.
 */
const MIN_CATEGORY_ARTICLES = 3;

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

  /**
   * Phone only (below 768px): the category rows are shown one at a time, picked
   * from a row of pills, instead of ten rows stacked — at 390px the stack alone
   * was ~4,300px of the page. Every row stays in the document; app/home-phone.css
   * hides the unpicked ones under its phone media query and hides the pills
   * everywhere else, so from 768px up this state changes nothing a reader sees.
   * `null` means "the first row", which keeps the server render and the first
   * client render identical.
   */
  const feedCategories = categoriesWithArticles.filter((cat) => cat.articles.length >= MIN_CATEGORY_ARTICLES);
  const [phoneCategoryId, setPhoneCategoryId] = useState<string | null>(null);
  const activePhoneCategoryId = phoneCategoryId ?? (feedCategories[0] ? String(feedCategories[0].id) : null);

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
          prefetch={false}
          href="/articles/featured"
          className="text-sm text-primary inline-flex items-center gap-1 hover:underline font-medium shrink-0"
        >
          {t('home.browseAllNews')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {/* Top-level Featured/Curation Articles (Editors' picks). Margin stays
          modest because .category-feed-container already adds its own
          padding-top below — mb-12 here stacked with it into a ~80px void. */}
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
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
      <div className="hp-inline-ad block md:hidden mb-12">
        <Link prefetch={false} href="/contact#advertising" className="rounded-2xl overflow-hidden relative group w-full block">
          <Image src="/images/promotions/007.png" alt="Advertisement" width={2184} height={480} sizes="(max-width: 767px) 100vw, 0px" className="w-full h-auto object-cover block" />
        </Link>
      </div>

      {/* 10 Vertical Categories Section */}
      <div className="category-feed-container border-t border-border/40">
        <div className="hp-cat-pills" role="group" aria-label="News categories">
          {feedCategories.map((cat) => {
            const on = String(cat.id) === activePhoneCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                className={on ? 'is-on' : undefined}
                aria-pressed={on}
                onClick={(event) => {
                  setPhoneCategoryId(String(cat.id));
                  // Keep the picked pill in view: the row scrolls sideways.
                  event.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
                }}
              >
                <i aria-hidden style={{ backgroundColor: cat.color || '#3b82f6' }} />
                {cat.name}
                <span>{cat.articles.length}</span>
              </button>
            );
          })}
        </div>
        {feedCategories.map((cat, index) => {
            const IconComponent = (cat.icon && IconMap[cat.icon]) || Zap;
            return (
              <React.Fragment key={cat.id}>
                <div className="category-section" data-hp-on={String(cat.id) === activePhoneCategoryId ? '1' : undefined}>
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
                          {/* Count what this reader can actually open. cat.articleCount
                              is the all-locale total, so the English page was billing
                              25 English stories as "50" by counting the Bangla ones. */}
                          <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border/40">
                            {cat.articles.length}
                          </span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                      </div>
                    </div>
                    <Link
                      prefetch={false}
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
                  <div className="category-ad-block-3 grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6">
                    <Link prefetch={false} href="/contact#advertising" className="rounded-2xl overflow-hidden relative group block">
                      <Image src="/images/promotions/002.png" alt="Advertisement" width={994} height={480} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, 22vw" className="w-full h-auto object-cover block" />
                    </Link>
                    <Link prefetch={false} href="/contact#advertising" className="rounded-2xl overflow-hidden relative group block">
                      <Image src="/images/promotions/002.png" alt="Advertisement" width={994} height={480} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, 22vw" className="w-full h-auto object-cover block" />
                    </Link>
                    <Link prefetch={false} href="/contact#advertising" className="rounded-2xl overflow-hidden relative group block">
                      <Image src="/images/promotions/002.png" alt="Advertisement" width={994} height={480} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, 22vw" className="w-full h-auto object-cover block" />
                    </Link>
                  </div>
                )}

                {/* 1 Large Full-Width Ad Space */}
                {(index === 4 || index === 10) && (
                  <Link prefetch={false} href="/contact#advertising" className="category-ad-block-1 rounded-2xl overflow-hidden relative group w-full block">
                    <Image src="/images/promotions/005.png" alt="Advertisement" width={3126} height={480} sizes="(max-width: 1023px) 100vw, 66vw" className="w-full h-auto object-cover block" />
                  </Link>
                )}
              </React.Fragment>
            );
          })}
      </div>
    </section>
  );
}