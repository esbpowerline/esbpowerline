'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { Zap, Activity, Leaf, Gauge, Flame, Cable, Sun, TrendingUp } from 'lucide-react';
import { useLocale } from '@/components/shared/LocaleProvider';
import { localizeEnergyStatLabel } from '@/lib/i18n/homepage-copy';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import type { HomeSnapshotStat } from '@/lib/data/grid/home-snapshot-core';
import { mergeHomeSnapshot, type SnapshotSlot } from '@/lib/data/grid/home-snapshot-merge';

const IconMap: Record<string, any> = {
  Zap,
  Activity,
  Leaf,
  Gauge,
  Flame,
  Cable,
  Sun,
  TrendingUp,
};

/** A merged slot plus the resolved lucide icon and its Tailwind classes. */
interface Stat extends SnapshotSlot {
  Icon: any;
  iconClass?: string;
  iconBgClass?: string;
  hoverBgClass?: string;
  hoverTextClass?: string;
}

const ICON_STYLES: Record<
  string,
  { color: string; bg: string; hoverBg: string; hoverText: string }
> = {
  Zap: {
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/15 dark:border-emerald-400/20 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.12)] dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300',
    hoverBg: 'hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.05] hover:border-emerald-500/10',
    hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
  },
  Activity: {
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/15 dark:border-rose-400/20 shadow-[0_2px_8px_-2px_rgba(244,63,94,0.12)] dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300',
    hoverBg: 'hover:bg-rose-500/[0.04] dark:hover:bg-rose-500/[0.05] hover:border-rose-500/10',
    hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
  },
  Leaf: {
    color: 'text-teal-500 dark:text-teal-400',
    bg: 'bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-500/15 dark:border-teal-400/20 shadow-[0_2px_8px_-2px_rgba(20,184,166,0.12)] dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300',
    hoverBg: 'hover:bg-teal-500/[0.04] dark:hover:bg-teal-500/[0.05] hover:border-teal-500/10',
    hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
  },
  Gauge: {
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/15 dark:border-amber-400/20 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.12)] dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300',
    hoverBg: 'hover:bg-amber-500/[0.04] dark:hover:bg-amber-500/[0.05] hover:border-amber-500/10',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
  },
  Flame: {
    color: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/15 dark:border-violet-400/20 shadow-[0_2px_8px_-2px_rgba(139,92,246,0.12)] dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300',
    hoverBg: 'hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.05] hover:border-violet-500/10',
    hoverText: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
  },
  Cable: {
    color: 'text-cyan-500 dark:text-cyan-400',
    bg: 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/15 dark:border-cyan-400/20 shadow-[0_2px_8px_-2px_rgba(6,182,212,0.12)] dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300',
    hoverBg: 'hover:bg-cyan-500/[0.04] dark:hover:bg-cyan-500/[0.05] hover:border-cyan-500/10',
    hoverText: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
  },
  Sun: {
    color: 'text-yellow-500 dark:text-yellow-400',
    bg: 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/15 dark:border-yellow-400/20 shadow-[0_2px_8px_-2px_rgba(234,179,8,0.12)] dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300',
    hoverBg: 'hover:bg-yellow-500/[0.04] dark:hover:bg-yellow-500/[0.05] hover:border-yellow-500/10',
    hoverText: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
  },
  TrendingUp: {
    color: 'text-primary dark:text-primary-foreground',
    bg: 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 dark:border-primary/20 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.12)] dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300',
    hoverBg: 'hover:bg-primary/[0.04] dark:hover:bg-primary/[0.05] hover:border-primary/10',
    hoverText: 'group-hover:text-primary dark:group-hover:text-primary-foreground',
  },
};

/**
 * The specimen table that used to live here — "Current Demand: 16740",
 * "Gas Supply: 2610" and ten more — was the layout template, and any tile the
 * server did not supply fell through to it and rendered as fact. It is gone:
 * `mergeHomeSnapshot` owns the twelve slots, their order, their units and their
 * icons, and it has no number of its own to leak.
 */

/**
 * A published figure, or an em dash in the muted weight the site uses for one
 * nobody has filed. Deliberately not "0" and not the previous day's number: an
 * absent figure is not a zero, and the unit slot says "awaiting" so the tile
 * reads as a held place rather than a reported one.
 */
function StatValue({ stat, unitClass }: { stat: Stat; unitClass: string }) {
  const { locale } = useLocale();
  if (stat.value === null) {
    return (
      <>
        <span className="text-muted-foreground/70">—</span>{' '}
        <span className={`${unitClass} text-muted-foreground/50`}>
          {locale === 'bn' ? 'অপেক্ষমাণ' : 'awaiting'}
        </span>
      </>
    );
  }
  return (
    <>
      {stat.isDecimal
        ? stat.value.toFixed(stat.label === 'Production Cost' ? 2 : 1)
        : formatNumber(Math.round(stat.value))}{' '}
      <span className={unitClass}>{stat.unit}</span>
    </>
  );
}

function getLabelElements(label: string, locale: string) {
  const fullText = localizeEnergyStatLabel(label, locale as any);
  if (locale !== 'en') {
    return <span>{fullText}</span>;
  }

  // Shorten for mobile layout
  let shortText = fullText;
  shortText = shortText.replace(/Generation/g, 'GEN');
  shortText = shortText.replace(/Power/g, 'PWR');
  shortText = shortText.replace(/Frequency/g, 'FREQ');
  shortText = shortText.replace(/POWER/g, 'PWR');
  shortText = shortText.replace(/FREQUENCY/g, 'FREQ');

  if (shortText === fullText) {
    return <span>{fullText}</span>;
  }

  return (
    <>
      <span className="hidden md:inline">{fullText}</span>
      <span className="inline md:hidden">{shortText}</span>
    </>
  );
}

export function EnergyDashboard({
  initialStats,
  compact = false,
  fillHeight = false,
  variant = 'default',
}: {
  initialStats?: HomeSnapshotStat[];
  compact?: boolean;
  fillHeight?: boolean;
  variant?: 'default' | 'segment';
}) {
  const { locale, t } = useLocale();
  const [stats, setStats] = useState<Stat[]>(() =>
    mergeHomeSnapshot(initialStats).map((slot) => {
      const style = ICON_STYLES[slot.icon] || ICON_STYLES.Zap;
      return {
        ...slot,
        Icon: IconMap[slot.icon] || Zap,
        iconClass: style.color,
        iconBgClass: style.bg,
        hoverBgClass: style.hoverBg,
        hoverTextClass: style.hoverText,
      };
    }),
  );

  /* The simulated-movement loop is gone here for the same reason it is gone
     from HomeSnapshotPanel: it moved figures that a source had published. This
     copy had no NLDC guard at all, so it would jitter every non-null tile,
     and its `Math.min(7.5, …)` clamp capped Production Cost below the 7.55
     the 2026-09-06 report states. Dev-only, and a fabricated figure in dev is
     still one that gets screenshotted and believed. */

  return (
    <div
      className={
        compact
          ? `energy-dashboard energy-dashboard--compact grid grid-cols-2 gap-3 sm:gap-4 w-full min-w-0 ${
              variant === 'segment' ? 'energy-dashboard--segment ' : ''
            }${fillHeight ? 'energy-dashboard--fill h-full auto-rows-fr flex-grow' : 'auto-rows-fr'}`
          : 'energy-dashboard grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5'
      }
    >
      {stats.map((s, i) => {
        const Icon = s.Icon;
        return (
          <div
            key={i}
            className={`energy-dashboard__stat group relative overflow-hidden flex transition-all duration-250 ${
              compact
                ? `flex-col justify-center text-left rounded-xl border border-border/30 bg-card hover:bg-muted/5 dark:hover:bg-white/[0.01] hover:border-primary/20 hover:shadow-sm min-w-0 min-h-[clamp(3.875rem,8vw+1rem,4.5rem)] ${
                    fillHeight ? 'px-2.5 py-2 h-full' : 'px-[clamp(0.5rem,2vw,1rem)] py-[clamp(0.6rem,2vw,1rem)]'
                  }`
                : 'stat flex-col items-center justify-center text-center px-3 pt-6 pb-5'
            }`}
          >
            {/* Live SCADA Radar Ping */}
            <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 z-20">
              <ModernTooltip
                label={
                  s.awaiting
                    ? locale === 'bn'
                      ? `${s.awaiting} এখনও এই দিনের হিসাব প্রকাশ করেনি`
                      : `${s.awaiting} has not published this day yet`
                    : t('energy.indicative')
                }
                alwaysShow
                variant="chrome"
                side="top"
              >
                <span className="relative flex h-1.5 w-1.5 cursor-help">
                  {/* No "simulated" state left to show — nothing on this panel
                      is simulated now. */}
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground/20 dark:bg-muted-foreground/10" />
                </span>
              </ModernTooltip>
            </span>

            {compact ? (
              <div className="energy-dashboard__stat-body flex flex-row items-center w-full min-w-0 h-full gap-[clamp(0.35rem,1.5vw,0.6rem)]">
                <Icon
                  className={`energy-dashboard__stat-icon shrink-0 transition-transform duration-200 group-hover:scale-110 ${s.iconClass ?? 'text-primary'}`}
                />
                <div className="energy-dashboard__stat-copy flex min-w-0 flex-1 flex-col justify-center gap-[clamp(0.1rem,1vw,0.3rem)]">
                  <div className="energy-dashboard__stat-label font-semibold uppercase tracking-wider text-muted-foreground/90 group-hover:text-foreground transition-colors duration-150 select-none leading-none truncate w-full">
                    {getLabelElements(s.label, locale)}
                  </div>
                  <div className="energy-dashboard__stat-value font-bold font-sans tabular-nums text-foreground/95 group-hover:text-primary transition-colors duration-150 leading-none whitespace-nowrap">
                    <StatValue
                      stat={s}
                      unitClass="energy-dashboard__stat-unit font-bold text-muted-foreground/90 uppercase tracking-wider"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Icon className={`shrink-0 transition-transform duration-200 group-hover:scale-105 h-6 w-6 mb-2 ${s.iconClass ?? 'text-primary'}`} />
                <div className="font-bold uppercase tracking-wider text-muted-foreground/90 group-hover:text-foreground transition-colors duration-150 text-center select-none leading-none max-w-full px-1 text-xs md:text-sm mb-1">
                  {localizeEnergyStatLabel(s.label, locale)}
                </div>
                <div className="font-bold font-sans tabular-nums text-foreground/90 group-hover:text-primary transition-colors duration-150 leading-none stat-value mt-1">
                  <StatValue
                    stat={s}
                    unitClass="font-bold uppercase tracking-wider text-sm align-baseline font-normal text-muted-foreground"
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
