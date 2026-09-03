'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/shared/LocaleProvider';
import { localizeTickerItem } from '@/lib/i18n/homepage-copy';
import { tickerDurationMs, TICKER_SPEED_FACTOR } from '@/lib/ticker-speed';

export interface TickerItem {
  id: string;
  name: string;
  /** Null where no quote has been supplied for the instrument. Never a specimen. */
  value: number | null;
  unit: string;
  /** The published daily delta. Null when unknown — not 0, which reads flat. */
  change: number | null;
  prefix: string;
  /** ISO day of the report the figure came from. Absent for admin-entered items. */
  asOf?: string | null;
}

/**
 * There is no default price list any more.
 *
 * Six were hard-coded here — LNG at $15.82/mmbtu, coal at $116.7/t, USD/BDT at
 * 123.50 — and rendered on the site chrome whenever no items were passed,
 * which is every request the settings row is empty. The comment beneath them
 * said the values were "real (derived server-side from the daily archives +
 * published prices)". They were neither derived nor published; they were
 * written by hand and then scrolled across the top of every page as market
 * data. A ticker with nothing to quote now renders nothing at all.
 */

export function LiveMarketTicker({
  initialItems: propItems,
  variant = 'chrome',
  playing = true,
  compact = false,
  className,
  labelClassName,
}: {
  initialItems?: TickerItem[];
  variant?: 'chrome' | 'card' | 'embedded';
  playing?: boolean;
  compact?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  const { locale, t } = useLocale();
  // Only instruments that actually carry a quote. An item with a null value
  // has nothing to say, and a scrolling bar of dashes says it badly.
  const sourceItems = useMemo(
    () => (propItems ?? []).filter((item) => typeof item.value === 'number'),
    [propItems],
  );
  const localizedSeed = useMemo(
    () => sourceItems.map((item) => localizeTickerItem(item, locale)),
    [sourceItems, locale],
  );

  // Values are whatever the caller supplied — server-derived from the daily
  // archives, or entered in Settings. Nothing is simulated client-side and
  // nothing is defaulted; the change % is a true daily delta or it is absent.
  const [items, setItems] = useState<TickerItem[]>(localizedSeed);
  // The label used to carry a green "market open" ping driven by a constant
  // `useState(true)` — a permanent live claim over once-a-day archive figures
  // (audit 2026-09-01). It now carries the report day the figures came from.
  const asOf = items.find((item) => item.asOf)?.asOf ?? null;

  useEffect(() => {
    setItems(localizedSeed);
  }, [localizedSeed]);

  const trackRef = React.useRef<HTMLDivElement>(null);
  const animationRef = React.useRef<Animation | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let anim: Animation | null = null;

    // Duration follows the measured width, so this holds a fixed px/s whatever
    // it is showing — deliberately 90% of the DSE ticker beside it, close enough
    // to read as the same system but not in lockstep with it.
    const start = () => {
      anim?.cancel();
      anim = track.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-25%)' }],
        {
          duration: tickerDurationMs(track.scrollWidth, TICKER_SPEED_FACTOR.commodities),
          iterations: Infinity,
          easing: 'linear',
        },
      );
      animationRef.current = anim;
      if (!playing) anim.pause();
    };

    start();

    // Fonts and locale swaps change the track width after first paint.
    const observer = new ResizeObserver(start);
    observer.observe(track);

    return () => {
      observer.disconnect();
      anim?.cancel();
    };
  }, [playing, locale, items]);

  const handleMouseEnter = () => {
    if (animationRef.current) {
      animationRef.current.playbackRate = 0.25;
    }
  };

  const handleMouseLeave = () => {
    if (animationRef.current) {
      animationRef.current.playbackRate = 1.0;
    }
  };



  const textSize = compact ? 'text-[12px] md:text-[13px]' : 'text-[13px] md:text-sm';
  const badgeSize = compact ? 'text-[10px] md:text-[11px]' : 'text-[11px] md:text-xs';
  const labelSize = compact ? 'text-[10px] md:text-[11px]' : 'text-[11px] md:text-xs';

  const renderItem = (item: TickerItem, idx: number) => {
    const change = item.change;
    const isPositive = (change ?? 0) >= 0;
    return (
      <div key={`${item.id}-${idx}`} className="flex shrink-0 items-center gap-2 text-neutral-800 dark:text-neutral-200 transition-colors duration-150 hover:text-neutral-950 dark:hover:text-white">
        <span className={cn('font-semibold text-neutral-900 dark:text-neutral-50', textSize)}>{item.name}</span>
        <span className={cn('font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-50', textSize)}>
          {item.prefix}
          {item.value?.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}
          {item.unit && <span className="ml-0.5 text-neutral-500 dark:text-neutral-400 font-normal">{item.unit}</span>}
        </span>
        {/* No delta badge without a delta. A green 0.0% reads as "unchanged
            today", which is a measurement, not a blank. */}
        {change !== null && (
          <span
            className={cn(
              'inline-flex items-center rounded-sm px-1 py-[0.5px] text-[9px] md:text-[9.5px] font-sans font-bold tracking-tight',
              isPositive
                ? 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                : 'bg-rose-500/8 text-rose-600 dark:text-rose-400 border border-rose-500/15',
            )}
          >
            <span className="text-[7px] md:text-[7.5px] mr-[2px]">{isPositive ? '▲' : '▼'}</span>
            {Math.abs(change)}%
          </span>
        )}
        <span className="ml-4 text-neutral-300 dark:text-neutral-700 select-none">•</span>
      </div>
    );
  };

  // Nothing to quote: no bar. A "COMMODITIES" label with a live green pulse and
  // an empty track beside it claims a feed that is not there.
  if (items.length === 0) return null;

  const track = (
    <div
      ref={trackRef}
      className={cn(
        'market-ticker__track flex w-max items-center whitespace-nowrap',
        textSize
      )}
    >
      {[...Array(4)].map((_, groupIndex) => (
        <div key={groupIndex} className="flex w-max shrink-0 items-center gap-6 md:gap-7 pr-6 md:pr-7">
          {items.map(renderItem)}
        </div>
      ))}
    </div>
  );

  const label = labelClassName ? (
    <div className={cn('shrink-0 flex items-center gap-2 relative z-10 bg-[var(--bg)] pr-2', labelClassName)}>
      <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500/10" />
      <span className="market-ticker-label__text">
        <span className="md:hidden">COMMODITIES</span>
        <span className="hidden md:inline">{t('ticker.commodities')}</span>
      </span>
      {asOf ? (
        <span
          className="font-mono text-[9px] font-semibold tracking-wide text-muted-foreground/70 whitespace-nowrap select-none"
          title="Figures from the named day's PGCB / Petrobangla daily reports — updated per ingest, not a live market feed"
        >
          {asOf}
        </span>
      ) : null}
    </div>
  ) : (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1.5 text-muted-foreground relative z-10 bg-[var(--bg)]',
        compact ? 'pr-2.5' : 'border-r border-border/60 pr-3',
      )}
    >
      <Zap className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
      <span className={cn('font-semibold uppercase tracking-[0.1em]', labelSize)}>
        {t('ticker.commodities')}
      </span>
      {asOf ? (
        <span
          className="font-mono text-[9px] font-semibold tracking-wide text-muted-foreground/70 whitespace-nowrap select-none"
          title="Figures from the named day's PGCB / Petrobangla daily reports — updated per ingest, not a live market feed"
        >
          {asOf}
        </span>
      ) : null}
    </div>
  );

  const marqueeRow = (
    <div
      className={cn(
        'market-ticker__row flex w-full min-w-0 items-center group/ticker relative',
        compact ? 'h-8' : 'h-9 md:h-10',
        textSize,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {label}
      <div className={cn('market-ticker__viewport mask-fade w-full overflow-hidden', compact ? 'pl-2 -mr-3' : 'pl-3 -mr-3')}>{track}</div>
    </div>
  );

  if (variant === 'embedded') {
    return marqueeRow;
  }

  return (
    <div
      className={cn(
        variant === 'chrome' ? 'w-full border-t border-border/40 bg-[var(--bg)]' : 'w-full py-1.5',
        className,
      )}
    >
      <div className="container px-4">
        {variant === 'chrome' ? (
          marqueeRow
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/40 bg-[var(--bg-elev)]/60 backdrop-blur-sm">
            <div className="px-4">{marqueeRow}</div>
          </div>
        )}
      </div>
    </div>
  );
}