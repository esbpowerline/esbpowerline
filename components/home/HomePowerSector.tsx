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

/**
 * A category row is PAGED, not scrolled.
 *
 * It used to be a strip that translated one card at a time under the hand —
 * the carousel every site has, and recognisable as such before a reader has
 * read a headline. Nothing about a horizontal strip suited what this row
 * actually is, either: three finished stories, then three more. There is no
 * continuum between card 3 and card 4 for a slide to express.
 *
 * So the trio is swapped in place. The three on screen lift out together, the
 * next three arrive column by column, and nothing travels sideways. It is the
 * same move the hero above makes, which is deliberate: two different rotation
 * idioms on one page read as two different sites.
 *
 * The drag survives — it is how a phone expects to change page — but it moves
 * nothing except a few pixels of elastic give, and what it commits is a page.
 */
function CategoryCarousel({ articles }: { articles: PublicArticleCard[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [isVisible, setIsVisible] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  // Which way the page went. The columns carry a small horizontal component
  // off it — the only thing that says forward from back when nothing slides.
  const [dir, setDir] = useState<1 | -1>(1);

  const perPage = windowWidth >= 1024 ? 3 : windowWidth >= 768 ? 2 : 1;
  const pageCount = Math.max(1, Math.ceil(articles.length / perPage));
  const pageIndexRef = useRef(page);
  const swapTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    pageIndexRef.current = page;
  }, [page]);

  /**
   * 440ms is the exit: a 320ms fade-and-lift plus the 60ms-per-column stagger
   * the last column waits out (`category-card-out` in globals.css). The swap
   * must not land while a column is still on its way out, so the two numbers
   * move together or not at all.
   */
  const goToPage = useCallback((next: number, explicitDir?: 1 | -1) => {
    const from = pageIndexRef.current;
    if (next === from) return;
    if (swapTimeout.current) clearTimeout(swapTimeout.current);
    setDir(explicitDir ?? (next < from ? -1 : 1));
    setIsSwapping(true);
    swapTimeout.current = setTimeout(() => {
      setPage(next);
      setIsSwapping(false);
    }, 440);
  }, []);

  // Wrapping is why the direction is passed explicitly: the last page to the
  // first is forward even though the index goes down.
  const nextPage = useCallback(() => {
    goToPage((pageIndexRef.current + 1) % pageCount, 1);
  }, [goToPage, pageCount]);

  const prevPage = useCallback(() => {
    goToPage((pageIndexRef.current - 1 + pageCount) % pageCount, -1);
  }, [goToPage, pageCount]);

  // Drag references. The gesture never re-renders the row: it writes the give
  // straight to the node, so a drag costs no React work at all.
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const offsetRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => setWindowWidth(window.innerWidth);
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
  }, []);

  // A narrower window fits fewer cards per page, so the page a reader is on
  // may stop existing. Clamping beats resetting to zero: they keep roughly the
  // stories they were looking at.
  useEffect(() => {
    setPage((prev) => Math.min(prev, pageCount - 1));
  }, [pageCount]);

  useEffect(
    () => () => {
      if (swapTimeout.current) clearTimeout(swapTimeout.current);
    },
    []
  );

  // Autoplay, paused while a finger is down. It wraps, so a row read to the end
  // starts again rather than dead-ending on its last page.
  useEffect(() => {
    if (pageCount < 2) return;
    const timer = setInterval(() => {
      if (isDraggingRef.current) return;
      nextPage();
    }, 6500);
    return () => clearInterval(timer);
  }, [pageCount, nextPage]);

  const setGive = (px: number) => {
    if (pageRef.current) {
      pageRef.current.style.transform = px === 0 ? '' : `translate3d(${px}px, 0, 0)`;
    }
  };

  const handleDragStart = (clientX: number) => {
    if (pageCount < 2) return;
    isDraggingRef.current = true;
    startXRef.current = clientX;
    lastXRef.current = clientX;
    lastTimeRef.current = performance.now();
    offsetRef.current = 0;
    velocityRef.current = 0;
    if (pageRef.current) pageRef.current.style.transition = 'none';
    containerRef.current?.setAttribute('data-dragging', 'true');
  };

  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const offset = clientX - startXRef.current;
    offsetRef.current = offset;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      // Smoothed: one frame's delta on a trackpad is noisy enough to read a
      // steady drag as a flick.
      const instant = (clientX - lastXRef.current) / dt;
      velocityRef.current = velocityRef.current * 0.7 + instant * 0.3;
      lastXRef.current = clientX;
      lastTimeRef.current = now;
    }

    // The row gives, it does not travel. The hand has to be answered — without
    // that the gesture feels ignored until it suddenly isn't — but the give is
    // damped hard and capped at 28px, because nothing here scrolls. What the
    // drag is aiming at is a page, and a row that followed the finger properly
    // would be promising a strip that does not exist.
    const give = Math.sign(offset) * Math.min(28, Math.abs(offset) * 0.28);
    setGive(give);
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    containerRef.current?.removeAttribute('data-dragging');

    if (pageRef.current) {
      pageRef.current.style.transition = 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)';
    }
    setGive(0);

    // Distance OR speed. 0.45 px/ms is about a deliberate flick and well clear
    // of the drift at the end of a slow drag, so a short sharp gesture is not
    // swallowed and a long slow one still counts even when it ends motionless.
    const offset = offsetRef.current;
    const velocity = velocityRef.current;
    const wantsNext = offset < -55 || velocity < -0.45;
    const wantsPrev = offset > 55 || velocity > 0.45;

    if (wantsNext && !wantsPrev) nextPage();
    else if (wantsPrev && !wantsNext) prevPage();

    offsetRef.current = 0;
    velocityRef.current = 0;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
  const onMouseUpOrLeave = () => handleDragEnd();
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
  const onTouchEnd = () => handleDragEnd();

  if (!articles || articles.length === 0) return null;

  // Only the page on screen is rendered. The strip mounted every card in the
  // row — up to 24 per category, images and all — and held them off-screen
  // behind `overflow: hidden`. Three is what a reader can see, so three is what
  // the browser is asked for.
  const pageArticles = articles.slice(page * perPage, page * perPage + perPage);
  const paged = pageCount > 1;

  return (
    <div className="relative group/carousel w-full">
      {/* Left Arrow Button */}
      {paged && page > 0 && (
        <button
          onClick={prevPage}
          className="absolute left-1 top-[var(--category-nav-seam)] -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-background/85 hover:bg-background border border-border/40 hover:border-border/80 flex items-center justify-center text-foreground hover:text-primary transition-all backdrop-blur-sm cursor-pointer opacity-100 pointer-events-auto shadow-md"
          aria-label="Previous stories"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        ref={containerRef}
        // Still clipped, though nothing scrolls any more. The server renders
        // the desktop trio (it cannot know the viewport), so on a phone the
        // three full-width cards sit side by side for the moment before
        // hydration narrows the page to one — unclipped, that is a horizontal
        // scrollbar on the whole document. The drag's give is clipped too,
        // which is what give should look like: a row moving inside a window.
        className={`category-grid-track overflow-hidden w-full select-none pb-4 pt-1 ${isVisible ? 'is-visible' : ''} ${
          isSwapping ? 'is-swapping' : ''
        }`}
        data-paged={paged ? 'true' : undefined}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div ref={pageRef} className="category-grid-page flex gap-6 py-2">
          {pageArticles.map((article, cardIndex) => (
            <div
              key={`${page}-${article.id}`}
              className="article-card-wrapper flex-shrink-0 w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] pointer-events-none flex flex-col h-full"
              // The column's place in the trio and the direction the page went.
              // Between them the stagger knows its order and its sign.
              style={
                {
                  userSelect: 'none',
                  '--card-i': cardIndex,
                  '--page-dir': dir,
                } as React.CSSProperties
              }
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

      {/* One dot per page — a real count now, rather than the three buckets the
          old strip mapped its slide index onto. */}
      {paged && (
        <div className="category-carousel-dots">
          {Array.from({ length: pageCount }, (_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              aria-label={`Stories ${idx * perPage + 1} to ${Math.min((idx + 1) * perPage, articles.length)}`}
              aria-current={idx === page ? 'true' : undefined}
              // The button is the bar itself, so the dots stay grouped in the
              // row's 6px gap rather than being pushed ~50px apart by their own
              // boxes. Tapping room comes from a pseudo-element that grows only
              // vertically (44px tall), which costs nothing visually. Width still
              // tracks the bar, so these sit under the 24px WCAG 2.5.8 target
              // minimum — a deliberate trade to keep the grouped look.
              className={`relative h-1.5 rounded-full transition-all duration-300 before:absolute before:left-0 before:right-0 before:-top-[19px] before:-bottom-[19px] before:content-[''] ${
                idx === page ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Right Arrow Button */}
      {paged && page < pageCount - 1 && (
        <button
          onClick={nextPage}
          className="absolute right-1 top-[var(--category-nav-seam)] -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-background/85 hover:bg-background border border-border/40 hover:border-border/80 flex items-center justify-center text-foreground hover:text-primary transition-all backdrop-blur-sm cursor-pointer opacity-100 pointer-events-auto shadow-md"
          aria-label="More stories"
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
          href="/articles"
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
      <div className="block md:hidden mb-12">
        <Link prefetch={false} href="/contact#advertising" className="rounded-2xl overflow-hidden relative group w-full block">
          <Image src="/images/promotions/007.png" alt="Advertisement" width={2184} height={480} className="w-full h-auto object-cover block" />
        </Link>
      </div>

      {/* 10 Vertical Categories Section */}
      <div className="category-feed-container border-t border-border/40">
        {categoriesWithArticles
          .filter((cat) => cat.articles.length >= MIN_CATEGORY_ARTICLES)
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
                      <Image src="/images/promotions/002.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover block" />
                    </Link>
                    <Link prefetch={false} href="/contact#advertising" className="rounded-2xl overflow-hidden relative group block">
                      <Image src="/images/promotions/002.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover block" />
                    </Link>
                    <Link prefetch={false} href="/contact#advertising" className="rounded-2xl overflow-hidden relative group block">
                      <Image src="/images/promotions/002.png" alt="Advertisement" width={994} height={480} className="w-full h-auto object-cover block" />
                    </Link>
                  </div>
                )}

                {/* 1 Large Full-Width Ad Space */}
                {(index === 4 || index === 10) && (
                  <Link prefetch={false} href="/contact#advertising" className="category-ad-block-1 rounded-2xl overflow-hidden relative group w-full block">
                    <Image src="/images/promotions/005.png" alt="Advertisement" width={3126} height={480} className="w-full h-auto object-cover block" />
                  </Link>
                )}
              </React.Fragment>
            );
          })}
      </div>
    </section>
  );
}