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

/** How long each hero slide stays up before advancing. */
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

  /**
   * The hero shows two stories at once, so a slide is a PAIR, not an item.
   *
   * Five featured items therefore make three slides — A+B, C+D, E+A — and the
   * counter reads 1/3. The last pair wraps rather than leaving a hole: a hero
   * with one empty half looks broken, and repeating the lead is the least
   * surprising thing to put there.
   */
  const pairCount = Math.max(1, Math.ceil(featured.length / 2));

  const next = useCallback(() => {
    goTo((currentRef.current + 1) % pairCount);
  }, [pairCount, goTo]);

  const prev = useCallback(() => {
    goTo((currentRef.current - 1 + pairCount) % pairCount);
  }, [pairCount, goTo]);

  useEffect(() => {
    if (!isPlaying || isTransitioning) return;
    if (pairCount < 2) return;

    const timer = setInterval(next, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, isTransitioning, next, pairCount]);

  useEffect(() => {
    return () => {
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    };
  }, []);

  const leadIndex = (current * 2) % Math.max(1, featured.length);
  const secondIndex = (leadIndex + 1) % Math.max(1, featured.length);
  const currentItem = featured[leadIndex];
  // Never the same story twice. With an odd count the final pair wraps onto the
  // lead, and with a single featured item there is no second story at all.
  const secondaryItem = secondIndex === leadIndex ? undefined : featured[secondIndex];
  // The two stories on screen, in order. Both are rendered by the same markup,
  // so there is no longer a "lead" and a "second" to keep in step.
  const pairItems = [currentItem, secondaryItem].filter(Boolean) as FeaturedItem[];
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
            {/* Two equal stories.

                This was a lead-plus-sidebar for several rounds — a big
                headline beside a narrow rail — and every attempt to balance it
                ran into the same arithmetic: the lead had fewer rows than the
                rail and ~100px it could not fill, because every summary in the
                feed is two lines. Two identical cards have no such asymmetry.
                One shape, one type scale, one picture size; the only thing that
                differs is the story. */}
            <div className="featured-hero__pair">
              {pairItems.map((item, i) => (
                <Link
                  key={item.slug}
                  href={`/articles/${item.slug}`}
                  className={`featured-hero__story group ${isTransitioning ? 'is-swapping' : ''}`}
                >
                  <div className="featured-hero__story-image relative overflow-hidden rounded-xl">
                    {hasArticleImage(item.imageUrl) ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        priority={i === 0}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        // Top-anchored on purpose. Every banner here carries
                        // its headline in a strip at the foot of the image, and
                        // the frame below is short enough to cut that strip off
                        // — but only if the crop is taken from the top. The
                        // article's own panY would re-centre it and bring the
                        // words back, so filter and zoom are kept and the
                        // position is not.
                        style={{
                          ...heroImageStyle({ fitMode: 'fill', ...(item.heroMeta ?? {}) }),
                          objectPosition: 'center top',
                        }}
                        sizes="(max-width: 1023px) 100vw, 480px"
                      />
                    ) : (
                      <NoImage className="h-full w-full" />
                    )}
                  </div>

                  <div className="featured-hero__story-meta flex items-center gap-2 overflow-hidden">
                    <span
                      className={`featured-hero__category inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getCategoryBadgeClasses(item.category)}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
                      <CategoryLabel name={item.category} />
                    </span>
                    {item.isBreaking ? <ArticlePlacementBadge type="breaking" /> : null}
                  </div>

                  <h2 className="featured-hero__story-title">{item.title}</h2>

                  {item.excerpt ? (
                    <p className="featured-hero__story-deck">
                      {item.excerpt.replace(/\[&hellip;\]/g, '...').replace(/&hellip;/g, '...')}
                    </p>
                  ) : null}
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