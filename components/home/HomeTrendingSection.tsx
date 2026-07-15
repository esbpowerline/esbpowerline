'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { CategoryLabel } from '@/components/i18n/CategoryLabel';
import { NoImage } from '@/components/shared/NoImage';
import { useLocale } from '@/components/shared/LocaleProvider';
import { hasArticleImage } from '@/lib/article-image';
import type { PublicArticleCard } from '@/lib/category-types';
import { formatArticleDate } from '@/lib/utils';
import { heroImageStyle } from '@/lib/hero-image';
import { resolveDisplayTitle } from '@/lib/editorial-limits';

function formatTrendingTime(date: string, locale: 'en' | 'bn') {
  return formatArticleDate(date).replace('Published on ', '');
}

function TrendingListItem({
  article,
  rank,
  compact = false,
  showTime = false,
}: {
  article: PublicArticleCard;
  rank: number;
  compact?: boolean;
  showTime?: boolean;
}) {
  const { locale, t } = useLocale();
  const timeAgo = showTime ? formatTrendingTime(article.date, locale) : null;

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={`home-trending-item group flex gap-3 ${compact ? 'py-2.5' : 'py-2.5 first:pt-0 last:pb-0'}`}
    >
      <span
        className={`home-trending-item__rank shrink-0 ${rank === 1 ? 'home-trending-item__rank--hot' : ''}`}
        aria-hidden
      >
        {rank.toString().padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className={`home-trending-item__title font-medium leading-snug group-hover:text-primary transition-colors ${
            compact ? 'text-[13px] home-trending-item__title--compact' : 'text-sm'
          }`}
        >
          {resolveDisplayTitle(article.title, article.shortTitle)}
        </h3>
        <p className="home-trending-item__meta text-xs text-muted-foreground mt-0.5 truncate">
          <CategoryLabel name={article.category} />
          {showTime && timeAgo ? <> · {timeAgo}</> : null}
          {' · '}
          {article.views.toLocaleString()} {t('common.views')}
        </p>
      </div>
    </Link>
  );
}

const TRENDING_WAVE_MS = 5500;

function TrendingHeroRailWave({ trending }: { trending: PublicArticleCard[] }) {
  const { locale, t } = useLocale();
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const rotationAnchorRef = useRef(0);
  const rotationAnchorTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHovering = hovered !== null;
  const displayIndex = hovered ?? active;
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const getCycleRemainder = useCallback(() => {
    const elapsed = Date.now() - rotationAnchorTimeRef.current;
    return TRENDING_WAVE_MS - (elapsed % TRENDING_WAVE_MS);
  }, []);

  const applyElapsedSteps = useCallback(() => {
    const elapsed = Date.now() - rotationAnchorTimeRef.current;
    const steps = Math.floor(elapsed / TRENDING_WAVE_MS);
    if (steps === 0) return rotationAnchorRef.current;

    const newActive = (rotationAnchorRef.current + steps) % trending.length;
    rotationAnchorRef.current = newActive;
    rotationAnchorTimeRef.current += steps * TRENDING_WAVE_MS;
    setActive(newActive);
    return newActive;
  }, [trending.length]);

  const scheduleNext = useCallback(() => {
    clearTimer();
    if (hoveredRef.current !== null || trending.length <= 1) return;

    const remainder = getCycleRemainder();

    timerRef.current = setTimeout(() => {
      const newActive = (rotationAnchorRef.current + 1) % trending.length;
      rotationAnchorRef.current = newActive;
      rotationAnchorTimeRef.current = Date.now();
      setActive(newActive);
      scheduleNext();
    }, remainder);
  }, [clearTimer, getCycleRemainder, trending.length]);

  useEffect(() => {
    trending.forEach((item) => {
      if (hasArticleImage(item.imageUrl)) {
        const img = new window.Image();
        img.src = item.imageUrl;
      }
    });
  }, [trending]);

  useEffect(() => {
    rotationAnchorRef.current = 0;
    rotationAnchorTimeRef.current = Date.now();
    setActive(0);
    setHovered(null);
    hoveredRef.current = null;
    scheduleNext();
    return clearTimer;
  }, [trending.length, scheduleNext, clearTimer]);

  const handleQueueEnter = (index: number) => {
    clearTimer();
    hoveredRef.current = index;
    setHovered(index);
  };

  const handleQueueLeave = () => {
    applyElapsedSteps();
    hoveredRef.current = null;
    setHovered(null);
    scheduleNext();
  };

  const selectStory = (index: number) => {
    clearTimer();
    rotationAnchorRef.current = index;
    rotationAnchorTimeRef.current = Date.now();
    setActive(index);
    hoveredRef.current = null;
    setHovered(null);
    scheduleNext();
  };

  const article = trending[displayIndex];
  if (!article) return null;

  const timeAgo = formatTrendingTime(article.date, locale);

  return (
    <section
      className="home-trending-hero-rail flex flex-col h-full p-4 md:p-4.5 lg:p-5 rounded-2xl border border-border/40 bg-card shadow-sm lg:min-h-[var(--home-hero-band-card-h)] lg:h-[var(--home-hero-band-card-h)] lg:max-h-[var(--home-hero-band-card-h)] overflow-hidden relative"
      aria-labelledby="home-trending-title"
    >

      <div className="flex flex-col h-full justify-between relative z-10">
        <div className="flex-shrink-0 pb-3 border-b border-border/10 dark:border-border/20">
          <TrendingHeroRailHeader />
        </div>

        <div className="flex-grow flex flex-col justify-center min-h-0 my-3">
          <div className="home-trending-wave__stage">
            <Link
              key={`${article.slug}-${displayIndex}`}
              href={`/articles/${article.slug}`}
              className={`home-trending-wave__featured group${
                isHovering ? ' home-trending-wave__featured--instant' : ''
              }`}
            >
              {/* Kicker Row */}
              <div className="home-trending-wave__kicker">
                <div className="home-trending-wave__badge">
                  <Flame className="h-3 w-3" aria-hidden />
                  #{String(displayIndex + 1).padStart(2, '0')}
                </div>
                <CategoryLabel
                  name={article.category}
                  className="home-trending-wave__category section-category-label text-muted-foreground/80 truncate"
                />
              </div>

              {/* Article Image */}
              <div className="home-trending-wave__image">
                <div className="home-trending-wave__image-zoom absolute inset-0">
                  {hasArticleImage(article.imageUrl) && !failedImages[article.imageUrl] ? (
                    <Image
                      src={article.imageUrl}
                      alt=""
                      fill
                      quality={60}
                      style={heroImageStyle(article.heroMeta || undefined)}
                      sizes="(max-width: 768px) 100vw, 280px"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [article.imageUrl]: true }));
                      }}
                    />
                  ) : (
                    <NoImage className="h-full w-full" label={article.category} />
                  )}
                </div>
              </div>

              {/* Title, Excerpt, Meta */}
              <h3 className="home-trending-wave__title group-hover:text-primary transition-colors">
                {resolveDisplayTitle(article.title, article.shortTitle)}
              </h3>
              <p
                className="home-trending-wave__excerpt"
                style={{
                  WebkitLineClamp: 3,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  minHeight: 'calc(var(--text-ui-sm) * 1.35 * 3)',
                  maxHeight: 'calc(var(--text-ui-sm) * 1.35 * 3)',
                  overflow: 'hidden',
                }}
              >
                {article.excerpt ?? '\u00A0'}
              </p>
              <p className="home-trending-wave__meta flex items-center gap-1">
                <span>{timeAgo}</span>
                <span className="opacity-40" aria-hidden>·</span>
                <span>{article.views.toLocaleString()} {t('common.views')}</span>
                <span className="opacity-40" aria-hidden>·</span>
                <span>{article.readTime} {t('common.min')}</span>
              </p>
            </Link>
          </div>
        </div>

        <div className="flex-shrink-0 pt-3 border-t border-border/10 dark:border-border/20">
          <div
            className="home-trending-wave__queue"
            role="tablist"
            aria-label={t('home.trendingWeek')}
            onMouseLeave={handleQueueLeave}
          >
            {trending.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                role="tab"
                aria-selected={index === displayIndex}
                className={`home-trending-wave__queue-item${
                  index === displayIndex ? ' home-trending-wave__queue-item--active' : ''
                }`}
                onMouseEnter={() => handleQueueEnter(index)}
                onFocus={() => handleQueueEnter(index)}
                onClick={() => selectStory(index)}
              >
                <span className="home-trending-wave__queue-rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="home-trending-wave__queue-title">{resolveDisplayTitle(item.title, item.shortTitle)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArticlesTrendingRailItem({
  article,
  rank,
}: {
  article: PublicArticleCard;
  rank: number;
}) {
  const { locale, t } = useLocale();
  const timeAgo = formatTrendingTime(article.date, locale);
  const isLead = rank === 1;

  return (
    <li className={`articles-trending-rail__item${isLead ? ' articles-trending-rail__item--lead' : ''}`}>
      <Link href={`/articles/${article.slug}`} className="articles-trending-rail__link group">
        <span
          className={`articles-trending-rail__rank${isLead ? ' articles-trending-rail__rank--hot' : ''}`}
          aria-hidden
        >
          {rank.toString().padStart(2, '0')}
        </span>
        <span className="articles-trending-rail__copy">
          <span className="articles-trending-rail__title group-hover:text-primary transition-colors">
            {resolveDisplayTitle(article.title, article.shortTitle)}
          </span>
          <span className="articles-trending-rail__meta">
            <CategoryLabel name={article.category} />
            <span className="articles-trending-rail__meta-sep" aria-hidden>
              ·
            </span>
            <span>{timeAgo}</span>
            <span className="articles-trending-rail__meta-sep" aria-hidden>
              ·
            </span>
            <span>
              {article.views.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} {t('common.views')}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function ArticlesTrendingRail({ trending }: { trending: PublicArticleCard[] }) {
  const { t } = useLocale();

  if (trending.length === 0) {
    return (
      <section className="articles-trending-rail" aria-labelledby="articles-trending-title">
        <header className="articles-trending-rail__head">
          <p className="articles-trending-rail__kicker section-kicker">{t('home.trendingKicker')}</p>
          <div className="articles-trending-rail__title-row">
            <div className="articles-trending-rail__title-wrap">
              <TrendingUp className="articles-trending-rail__icon" aria-hidden />
              <h2 id="articles-trending-title" className="articles-trending-rail__heading">
                {t('home.trendingWeek')}
              </h2>
            </div>
          </div>
        </header>
        <p className="articles-trending-rail__empty">{t('home.noTrending')}</p>
      </section>
    );
  }

  return (
    <section className="articles-trending-rail" aria-labelledby="articles-trending-title">
      <header className="articles-trending-rail__head">
        <p className="articles-trending-rail__kicker section-kicker">{t('home.trendingKicker')}</p>
        <div className="articles-trending-rail__title-row">
          <div className="articles-trending-rail__title-wrap">
            <TrendingUp className="articles-trending-rail__icon" aria-hidden />
            <h2 id="articles-trending-title" className="articles-trending-rail__heading">
              {t('home.trendingWeek')}
            </h2>
          </div>
          <Link href="/articles" className="articles-trending-rail__view-all section-inline-link">
            {t('home.trendingViewAll')}
            <ArrowRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
          </Link>
        </div>
      </header>
      <ol className="articles-trending-rail__list">
        {trending.map((article, index) => (
          <ArticlesTrendingRailItem key={article.slug} article={article} rank={index + 1} />
        ))}
      </ol>
    </section>
  );
}

function TrendingHeroRailHeader() {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-between gap-2 min-w-0 w-full">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <TrendingUp className="h-5 w-5 text-primary shrink-0" aria-hidden />
        <h2
          id="home-trending-title"
          className="m-0 p-0 py-0.5 text-base md:text-lg font-display font-bold tracking-tight text-foreground truncate min-w-0 leading-tight"
        >
          {t('home.trendingWeek')}
        </h2>
      </div>
      <Link
        href="/articles"
        className="section-inline-link text-primary inline-flex items-center gap-0.5 hover:underline shrink-0 leading-none p-0 m-0 text-xs md:text-sm font-semibold"
      >
        {t('home.trendingViewAll')}
        <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
      </Link>
    </div>
  );
}

export function HomeTrendingSection({
  trending,
  layout = 'band',
}: {
  trending: PublicArticleCard[];
  layout?: 'band' | 'rail' | 'hero-rail';
}) {
  const { locale, t } = useLocale();
  const isRail = layout === 'rail';
  const isHeroRail = layout === 'hero-rail';

  const compactHeader = isRail || isHeroRail;

  const header = (
    <div
      className={`home-section-head flex items-center justify-between gap-2 ${
        compactHeader ? 'home-section-head--rail mb-0' : 'home-section-head--row flex-col sm:flex-row sm:items-end'
      }`}
    >
      <div className="home-section-head__title-wrap min-w-0 flex-1">
        <div className="section-kicker text-primary mb-1.5">
          {t('home.trendingKicker')}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <TrendingUp
            className={`text-primary shrink-0 ${compactHeader ? 'h-4 w-4' : 'h-6 w-6'}`}
            aria-hidden
          />
          <h2
            id="home-trending-title"
            className={`min-w-0 truncate font-display font-bold tracking-tight ${
              isHeroRail ? 'text-base' : compactHeader ? 'text-lg' : 'text-2xl md:text-3xl'
            }`}
          >
            {t('home.trendingWeek')}
          </h2>
        </div>
      </div>
      <Link
        href="/articles"
        className={`section-inline-link text-primary inline-flex items-center gap-1 hover:underline font-medium shrink-0 ${
          isHeroRail ? 'text-xs' : 'text-sm'
        }`}
      >
        {t('home.trendingViewAll')}
        <ArrowRight className="h-3 w-3" aria-hidden />
      </Link>
    </div>
  );

  if (isHeroRail) {
    if (trending.length === 0) {
      return (
        <section
          className="home-trending-hero-rail flex flex-col h-full p-4 md:p-4.5 lg:p-5 rounded-2xl border border-border/40 bg-card shadow-sm lg:min-h-[var(--home-hero-band-card-h)] lg:h-[var(--home-hero-band-card-h)] lg:max-h-[var(--home-hero-band-card-h)] overflow-hidden relative"
          aria-labelledby="home-trending-title"
        >
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex-shrink-0 pb-3 border-b border-border/10 dark:border-border/20">
              <TrendingHeroRailHeader />
            </div>
            <div className="flex-grow min-h-0 flex flex-col justify-center my-3">
              <p className="text-center text-sm text-muted-foreground/80">{t('home.noTrending')}</p>
            </div>
          </div>
        </section>
      );
    }

    return <TrendingHeroRailWave trending={trending} />;
  }

  if (isRail) {
    return <ArticlesTrendingRail trending={trending} />;
  }

  if (trending.length === 0) {
    return (
      <section className="container home-block" aria-labelledby="home-trending-title">
        {header}
        <p className="text-sm text-muted-foreground/80">{t('home.noTrending')}</p>
      </section>
    );
  }

  const [lead, ...rest] = trending;
  const leadTimeAgo = formatTrendingTime(lead.date, locale);

  return (
    <section className="container home-block" aria-labelledby="home-trending-title">
      {header}

      <div className="grid lg:grid-cols-12 gap-3 md:gap-4">
        <Link
          href={`/articles/${lead.slug}`}
          className="lg:col-span-5 group flex gap-3 md:gap-4 rounded-2xl border border-border bg-card p-3 md:p-4 hover:border-primary/30 transition-all relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true">
            <div className="absolute -top-[20%] -right-[20%] w-[12rem] h-[12rem] rounded-full bg-amber-500/5 blur-[40px]" />
            <div className="absolute -bottom-[20%] -left-[20%] w-[12rem] h-[12rem] rounded-full bg-primary/4 blur-[40px]" />
          </div>
          <div className="relative w-24 sm:w-28 md:w-32 shrink-0 aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            {hasArticleImage(lead.imageUrl) ? (
              <Image
                src={lead.imageUrl}
                alt=""
                fill
                quality={60}
                style={heroImageStyle(lead.heroMeta || undefined)}
                sizes="(max-width: 768px) 96px, 128px"
              />
            ) : (
              <NoImage className="h-full w-full" label={lead.category} />
            )}
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <span className="home-trending-item__rank home-trending-item__rank--lead mb-1.5" aria-hidden>
              01
            </span>
            <CategoryLabel
              name={lead.category}
              className="section-category-label text-muted-foreground/80 mb-1"
            />
            <h3 className="font-display font-bold text-base md:text-lg leading-snug tracking-tight group-hover:text-primary transition-colors">
              {resolveDisplayTitle(lead.title, lead.shortTitle)}
            </h3>
            <p className="text-xs text-muted-foreground/80 mt-1.5">
              {leadTimeAgo} · {lead.views.toLocaleString()} {t('common.views')}
            </p>
          </div>
        </Link>

        {rest.length > 0 ? (
          <div className="lg:col-span-7 flex flex-col justify-center rounded-2xl border border-border bg-card px-3 md:px-4 py-2 md:py-3 divide-y divide-border/50 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-40" aria-hidden="true">
              <div className="absolute -top-[30%] -left-[10%] w-[18rem] h-[18rem] rounded-full bg-primary/3 blur-[50px]" />
              <div className="absolute -bottom-[30%] -right-[10%] w-[18rem] h-[18rem] rounded-full bg-amber-500/3 blur-[50px]" />
            </div>
            {rest.map((article, index) => (
              <TrendingListItem key={article.slug} article={article} rank={index + 2} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}