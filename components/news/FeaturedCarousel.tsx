'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArticlePlacementBadge } from '@/components/shared/ArticlePlacementBadge';
import type { TickerItem } from '@/components/news/LiveMarketTicker';
import { CategoryLabel } from '@/components/i18n/CategoryLabel';
import { useLocale } from '@/components/shared/LocaleProvider';
import { NoImage } from '@/components/shared/NoImage';
import { hasArticleImage } from '@/lib/article-image';
import { heroImageStyle } from '@/lib/hero-image';
import { formatSnapshotHeaderDate } from '@/lib/i18n/homepage-copy';

/** The site's category tints, as the chip above each photo wears them. */
function getCategoryBadgeClasses(cat: string): string {
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
}

/** The category's text tint alone — the subtle colouring the folio number and
 *  byline author wear, tying each column to its section without another chip. */
function getCategoryTextClass(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes('policy') || lower.includes('regulator')) return 'text-indigo-600 dark:text-indigo-400';
  if (lower.includes('generation')) return 'text-blue-600 dark:text-blue-400';
  if (lower.includes('fossil') || lower.includes('commodit') || lower.includes('gas') || lower.includes('lng')) return 'text-amber-600 dark:text-amber-400';
  if (lower.includes('renewable') || lower.includes('nuclear')) return 'text-emerald-600 dark:text-emerald-400';
  if (lower.includes('grid') || lower.includes('transmission')) return 'text-cyan-600 dark:text-cyan-400';
  if (lower.includes('distribution') || lower.includes('utilit')) return 'text-teal-600 dark:text-teal-400';
  if (lower.includes('consumer') || lower.includes('tariff')) return 'text-red-600 dark:text-red-400';
  if (lower.includes('market') || lower.includes('finance') || lower.includes('subsid')) return 'text-pink-600 dark:text-pink-400';
  if (lower.includes('international') || lower.includes('cross-border')) return 'text-indigo-600 dark:text-indigo-400';
  if (lower.includes('environment') || lower.includes('efficiency')) return 'text-teal-600 dark:text-teal-400';
  return 'text-muted-foreground';
}

/** How long each hero slide stays up before advancing. The progress bars in
 *  the rail animate over the same span — `featured-hero-progress` in
 *  globals.css is hard-coded to 6000ms, so change both or the fill lies. */
const AUTOPLAY_INTERVAL_MS = 6000;

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
  date?: string;
}

export function FeaturedCarousel({
  items,
  tickerItems,
  inBand = false,
}: {
  items?: FeaturedItem[];
  tickerItems?: TickerItem[];
  inBand?: boolean;
}) {
  const { t, locale } = useLocale();
  const featured: FeaturedItem[] = items ?? [];

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
      // 560ms matches the .is-swapping exit transition in globals.css — the
      // swap must not happen while the outgoing trio is still on its way out.
    }, 560);
  }, []);

  /**
   * The hero shows three stories at once, so a slide is a TRIO, not an item.
   *
   * Five featured items therefore make two slides — A+B+C, D+E+A — and the
   * last slide wraps rather than leaving holes: a hero with an empty column
   * looks broken, and repeating the lead is the least surprising thing to put
   * there.
   */
  const PER_SLIDE = 3;
  const slideCount = Math.max(1, Math.ceil(featured.length / PER_SLIDE));

  const next = useCallback(() => {
    goTo((currentRef.current + 1) % slideCount);
  }, [slideCount, goTo]);

  const prev = useCallback(() => {
    goTo((currentRef.current - 1 + slideCount) % slideCount);
  }, [slideCount, goTo]);

  useEffect(() => {
    if (!isPlaying || isTransitioning) return;
    if (slideCount < 2) return;

    const timer = setInterval(next, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, isTransitioning, next, slideCount]);

  useEffect(() => {
    return () => {
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    };
  }, []);

  // The three stories on screen, in order. Wrapping the last slide can land on
  // an index already used in the same slide, so the trio is de-duplicated: a
  // short feed shows two cards or one rather than the same story twice.
  const slideItems: FeaturedItem[] = [];
  if (featured.length > 0) {
    const seen = new Set<number>();
    for (let offset = 0; offset < PER_SLIDE; offset += 1) {
      const index = (current * PER_SLIDE + offset) % featured.length;
      if (seen.has(index)) break;
      seen.add(index);
      slideItems.push(featured[index]);
    }
  }
  const currentItem = slideItems[0];
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


  const heroCard = (
        <div
          className="featured-hero-card hero-dot-pattern relative overflow-hidden rounded-2xl border border-border/40"
          aria-roledescription="carousel"
          aria-label="Featured stories"
          // The visible controls are gone, so this is the only way left to stop
          // the rotation. Pausing on hover and focus covers both the reader who
          // is part-way through a headline and the one tabbing to a link.
          onMouseEnter={() => setIsPlaying(false)}
          onMouseLeave={() => setIsPlaying(true)}
          onFocusCapture={() => setIsPlaying(false)}
          onBlurCapture={() => setIsPlaying(true)}
        >
          <div
            className={`featured-hero__body relative ${
              inBand ? 'py-0 featured-hero__body--band' : 'py-10 md:py-14'
            }`}
          >
            {/* The rail names the section and shows where the rotation is.
                The bars are the autoplay made visible — each fills over the
                slide's six seconds, pauses with the hover pause, and is a
                button back to its slide. It also spends the band's spare
                height on something with a job, which is what the empty air
                above the trio never had.

                "Latest News", not "Featured": the hero carries the newest
                published stories (see fetchManagedCarouselItems), and the
                site's featured row is a different section — labelling this
                one Featured claimed a curation it does not have. */}
            <div className="featured-hero__rail">
              <span className="featured-hero__eyebrow">
                <span className="featured-hero__eyebrow-dot" aria-hidden />
                {t('nav.latestNews')}
              </span>
              {slideCount > 1 && (
                <div className="featured-hero__progress" role="tablist" aria-label="Featured slides">
                  {Array.from({ length: slideCount }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === current}
                      aria-label={`Slide ${i + 1} of ${slideCount}`}
                      className={`featured-hero__progress-bar ${i === current ? 'is-active' : ''} ${
                        isPlaying ? 'is-playing' : ''
                      }`}
                      onClick={() => goTo(i)}
                    >
                      <span className="featured-hero__progress-fill" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Three equal stories.

                This was a lead-plus-sidebar for several rounds — a big
                headline beside a narrow rail — and every attempt to balance it
                ran into the same arithmetic: the lead had fewer rows than the
                rail and ~100px it could not fill. Identical cards have no such
                asymmetry. One shape, one type scale, one picture size; the
                only thing that differs is the story. */}
            <div className="featured-hero__stories">
              {slideItems.map((item, i) => (
                <Link
                  prefetch={false}
                  // `current` is part of the key on purpose: a story that
                  // reappears on the next slide must still remount, or the
                  // entrance animation skips it and one card sits static
                  // while its neighbours arrive.
                  key={`${current}-${item.slug}`}
                  href={`/articles/${item.slug}`}
                  className={`featured-hero__story group ${isTransitioning ? 'is-swapping' : ''}`}
                  style={{ '--story-i': i } as React.CSSProperties}
                >
                  {/* One editorial column: chip and index, the whole artwork
                      at its full 16:9, the headline, and a byline pinned to
                      the column's foot. The category sits above the photo (on
                      the artwork first, moved off it by request); the deck
                      stays gone. */}
                  <div className="featured-hero__story-topline">
                    <span
                      className={`featured-hero__category inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getCategoryBadgeClasses(item.category)}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
                      <CategoryLabel name={item.category} />
                    </span>
                    {item.isBreaking ? <ArticlePlacementBadge type="breaking" /> : null}
                    {/* The slot number, set like a folio. Purely typographic —
                        it is what keeps three columns from reading as three
                        interchangeable tiles. */}
                    <span
                      className={`featured-hero__story-index ${getCategoryTextClass(item.category)}`}
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="featured-hero__story-image relative overflow-hidden rounded-xl">
                    {hasArticleImage(item.imageUrl) ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        priority={i === 0}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        style={heroImageStyle({ fitMode: 'fill', ...(item.heroMeta ?? {}) })}
                        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 420px"
                      />
                    ) : (
                      <NoImage className="h-full w-full" />
                    )}
                  </div>

                  <h2 className="featured-hero__story-title">
                    <span className="featured-hero__story-title-text">{item.title}</span>
                  </h2>

                  {/* Pinned to the column's foot by margin-top:auto, so the
                      band's spare height becomes the space between headline
                      and byline instead of dead air under the trio. */}
                  {/* Spread edge to edge so the row covers exactly the same
                      width as the picture above it: author at the photo's
                      left edge, read time at its right, the date between.
                      The tint sits on the date and read time — the byline's
                      facts — while the name stays plain; tried the other way
                      round first and the coloured name read as a link. */}
                  <div className="featured-hero__story-byline">
                    <span className="featured-hero__story-byline-author">
                      {t('carousel.byAuthor').replace('{author}', item.author)}
                    </span>
                    {/* Publication date, in the same short localized form the
                        snapshot header uses — publishedAt ?? createdAt, per
                        the mapper; never updatedAt (see homepage-content). */}
                    {item.date ? (
                      <span className={`whitespace-nowrap ${getCategoryTextClass(item.category)}`}>
                        {formatSnapshotHeaderDate(item.date, locale)}
                      </span>
                    ) : null}
                    <span className={`whitespace-nowrap ${getCategoryTextClass(item.category)}`}>
                      {t('carousel.minRead').replace('{minutes}', String(item.readTime))}
                    </span>
                  </div>
                </Link>
              ))}
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