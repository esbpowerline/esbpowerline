'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { Zap, Activity, Leaf, Gauge, Flame, Cable, Sun, TrendingUp } from 'lucide-react';
import { isSimulatedTelemetryEnabled } from '@/lib/telemetry-mode';
import { useLocale } from '@/components/shared/LocaleProvider';
import { localizeEnergyStatLabel } from '@/lib/i18n/homepage-copy';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import {
  DAILY_SNAPSHOT_LABELS,
  POWER_UNIT,
  type DailySnapshotLabel,
} from '@/lib/data/grid/home-snapshot-core';

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

interface Stat {
  label: string;
  value: number;
  unit: string;
  isDecimal?: boolean;
  icon: any;
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

const initial: Stat[] = [
  { label: 'Current Demand', value: 16740, unit: POWER_UNIT, icon: 'Activity' },
  { label: 'Peak Generation', value: 16181, unit: POWER_UNIT, icon: 'Zap' },
  { label: 'Peak Today', value: 16741, unit: POWER_UNIT, icon: 'TrendingUp' },
  { label: 'Daily Generation', value: 14788, unit: POWER_UNIT, icon: 'TrendingUp' },
  { label: 'Load Shedding', value: 0, unit: POWER_UNIT, icon: 'Activity' },
  { label: 'Energy Unserved', value: 89, unit: POWER_UNIT, icon: 'Gauge' },
  { label: 'Fuel Cost', value: 6.5, unit: 'Tk/kWh', isDecimal: true, icon: 'Gauge' },
  { label: 'Gas Supply', value: 2610, unit: 'MMcfd', icon: 'Flame' },
  { label: 'Coal Generation', value: 5383, unit: POWER_UNIT, icon: 'Flame' },
  { label: 'Grid Import', value: 2570, unit: POWER_UNIT, icon: 'Cable' },
  { label: 'RE Installed', value: 1806, unit: POWER_UNIT, icon: 'Sun' },
  { label: 'RE Grid Share', value: 5.56, unit: '%', isDecimal: true, icon: 'Leaf' },
];

const TARGET_ORDER: Record<DailySnapshotLabel, number> = Object.fromEntries(
  DAILY_SNAPSHOT_LABELS.map((label, index) => [label, index]),
) as Record<DailySnapshotLabel, number>;

function snapshotLabelOrder(label: string): number {
  return (TARGET_ORDER as Record<string, number>)[label] ?? 99;
}

function mergeSnapshotStats(incoming?: Stat[]): Stat[] {
  const incomingMap = new Map<string, Stat>();
  if (incoming && incoming.length > 0) {
    for (const s of incoming) {
      if (s && s.label && s.label in TARGET_ORDER) {
        incomingMap.set(s.label, s);
      }
    }
  }

  const result: Stat[] = [];
  for (const item of initial) {
    const matched = incomingMap.get(item.label);
    if (matched) {
      result.push({
        ...item,
        value: typeof matched.value === 'number' ? matched.value : item.value,
        unit: matched.unit || item.unit,
        isDecimal: typeof matched.isDecimal === 'boolean' ? matched.isDecimal : item.isDecimal,
      });
    } else {
      result.push({ ...item });
    }
  }
  return result;
}

function sortStats(stats: Stat[]): Stat[] {
  return [...stats].sort((a, b) => {
    const orderA = snapshotLabelOrder(a.label);
    const orderB = snapshotLabelOrder(b.label);
    return orderA - orderB;
  });
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
  initialStats?: Stat[];
  compact?: boolean;
  fillHeight?: boolean;
  variant?: 'default' | 'segment';
}) {
  const { locale, t } = useLocale();
  const [stats, setStats] = useState<Stat[]>(() => {
    const raw = mergeSnapshotStats(initialStats);
    const sorted = sortStats(raw);
    return sorted.map(s => {
      const iconKey = typeof s.icon === 'string' ? s.icon : 'Zap';
      const style = ICON_STYLES[iconKey] || ICON_STYLES.Zap;
      return {
        ...s,
        icon: typeof s.icon === 'string' ? (IconMap[s.icon] || Zap) : s.icon,
        iconClass: s.iconClass ?? style.color,
        iconBgClass: s.iconBgClass ?? style.bg,
        hoverBgClass: style.hoverBg,
        hoverTextClass: style.hoverText,
      };
    });
  });

  const simulateLive = isSimulatedTelemetryEnabled();

  useEffect(() => {
    if (!simulateLive) return;

    const interval = setInterval(() => {
      setStats(prev => prev.map((s) => {
        if (s.label === 'Current Demand' || s.label === 'Peak Today' || s.label === 'Peak Generation') {
          const variation = (Math.random() - 0.5) * 120;
          const next = Math.max(12000, s.value + variation);
          return { ...s, value: Math.round(next) };
        }
        if (s.label === 'Fuel Cost') {
          const variation = (Math.random() - 0.5) * 0.04;
          const next = Math.max(5.5, Math.min(7.5, s.value + variation));
          return { ...s, value: parseFloat(next.toFixed(2)) };
        }
        return s;
      }));
    }, 24000);
    return () => clearInterval(interval);
  }, [simulateLive]);

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
        const Icon = s.icon;
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
                label={simulateLive ? t('energy.simulated') : t('energy.indicative')}
                alwaysShow
                variant="chrome"
                side="top"
              >
                <span className="relative flex h-1.5 w-1.5 cursor-help">
                  {simulateLive && (s.label === 'Current Demand' || s.label === 'Peak Today' || s.label === 'Peak Generation' || s.label === 'Fuel Cost') ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground/20 dark:bg-muted-foreground/10" />
                  )}
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
                    {s.isDecimal
                      ? s.value.toFixed(
                          s.label === 'Fuel Cost' ? 2 : s.label === 'Energy Unserved' ? 2 : 1,
                        )
                      : formatNumber(Math.round(s.value))}
                    {' '}
                    <span className="energy-dashboard__stat-unit font-bold text-muted-foreground/90 uppercase tracking-wider">
                      {s.unit}
                    </span>
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
                  {s.isDecimal ? s.value.toFixed(1) : formatNumber(Math.round(s.value))}
                  {' '}
                  <span className="font-bold uppercase tracking-wider text-sm align-baseline font-normal text-muted-foreground">
                    {s.unit}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
