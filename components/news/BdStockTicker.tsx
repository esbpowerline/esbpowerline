'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { TrendingDown, TrendingUp, LineChart } from 'lucide-react';
import type { DseTickerItem } from '@/lib/bd-stock-market';
import { DEFAULT_DSE_TICKER } from '@/lib/bd-stock-market';
import { useLocale } from '@/components/shared/LocaleProvider';
import { cn } from '@/lib/utils';

export function BdStockTicker({
  className,
  labelClassName,
}: {
  className?: string;
  labelClassName?: string;
}) {
  const { locale, t } = useLocale();
  const [items, setItems] = useState<DseTickerItem[]>(DEFAULT_DSE_TICKER);
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let cancelled = false;

    const checkMarketStatus = () => {
      const now = new Date();
      const dhakaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
      const day = dhakaTime.getDay();
      const hours = dhakaTime.getHours();
      const minutes = dhakaTime.getMinutes();
      
      const isOpenDay = day >= 0 && day <= 4; // Sun-Thu
      const timeInMins = hours * 60 + minutes;
      const isOpenTime = timeInMins >= 10 * 60 && timeInMins <= 14 * 60 + 30; // 10:00 to 14:30
      
      return isOpenDay && isOpenTime;
    };

    async function load() {
      const isOpen = checkMarketStatus();
      if (!cancelled) setMarketOpen(isOpen);
      
      if (!isOpen) return;

      try {
        const res = await fetch('/api/market/dse', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: DseTickerItem[] };
        if (!cancelled && data.items?.length) setItems(data.items);
      } catch {
        /* keep baseline */
      }
    }

    void load();
    intervalId = setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    const anim = trackRef.current.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-25%)' }
      ],
      {
        duration: 40000,
        iterations: Infinity,
        easing: 'linear'
      }
    );

    animationRef.current = anim;

    return () => {
      anim.cancel();
    };
  }, [items, locale]);

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

  const displayItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        label: locale === 'bn' ? item.nameBn : item.name,
      })),
    [items, locale],
  );

  return (
    <div
      className={cn(
        'market-ticker__row flex w-full min-w-0 items-center h-full min-h-8 text-[12px] md:text-[13px] group/ticker relative',
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {labelClassName ? (
        <div className={cn('shrink-0 flex items-center gap-2 relative z-10 bg-[var(--bg)] pr-2', labelClassName)}>
          <LineChart className="h-3.5 w-3.5 shrink-0 text-sky-500" />
          <span className="market-ticker-label__text">
            <span className="md:hidden">DSE</span>
            <span className="hidden md:inline">{t('ticker.dse')}</span>
          </span>
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {marketOpen ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-full w-full bg-rose-500"></span>
            )}
          </span>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5 border-r border-border/60 pr-3 text-muted-foreground relative z-10 bg-[var(--bg)]">
          <LineChart className="h-3.5 w-3.5 shrink-0 text-sky-500" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] md:text-[11px]">
            {t('ticker.dse')}
          </span>
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {marketOpen ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-full w-full bg-rose-500"></span>
            )}
          </span>
        </div>
      )}
      <div className="market-ticker__viewport mask-fade pl-2 md:pl-3 -mr-3 w-full overflow-hidden">
        <div
          ref={trackRef}
          className="market-ticker__track flex w-max items-center gap-6 pr-6 whitespace-nowrap"
        >
          {[...displayItems, ...displayItems].map((item, idx) => {
            const isPositive = item.change >= 0;
            return (
              <div key={`${item.id}-${idx}`} className="flex shrink-0 items-center gap-2 text-neutral-800 dark:text-neutral-200 transition-colors duration-150 hover:text-neutral-950 dark:hover:text-white">
                <span className="font-mono text-[10px] md:text-[11px] font-bold text-neutral-900 dark:text-neutral-50 bg-neutral-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700/60">
                  {item.symbol}
                </span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-50">{item.label}</span>
                <span className="font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                  ৳ {item.price.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-sm px-1 py-[0.5px] text-[9px] md:text-[9.5px] font-sans font-bold tracking-tight',
                    isPositive
                      ? 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                      : 'bg-rose-500/8 text-rose-600 dark:text-rose-400 border border-rose-500/15',
                  )}
                >
                  <span className="text-[7px] md:text-[7.5px] mr-[2px]">{isPositive ? '▲' : '▼'}</span>
                  {Math.abs(item.change)}%
                </span>
                <span className="ml-4 text-neutral-300 dark:text-neutral-700 select-none">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}