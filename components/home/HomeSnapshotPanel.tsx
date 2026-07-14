'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BarChart3, Zap, Activity, Leaf, Gauge, Flame, Cable, Sun, TrendingUp } from 'lucide-react';
import { EnergyDashboard } from '@/components/news/EnergyDashboard';
import { useLocale } from '@/components/shared/LocaleProvider';
import { formatSnapshotHeaderDate, localizeSnapshotLabel, localizeEnergyStatLabel } from '@/lib/i18n/homepage-copy';
import { formatNumber } from '@/lib/utils';
import { isSimulatedTelemetryEnabled } from '@/lib/telemetry-mode';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { DAILY_SNAPSHOT_LABELS, POWER_UNIT, type DailySnapshotLabel } from '@/lib/data/grid/home-snapshot-core';

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

const ICON_STYLES: Record<string, { color: string; bg: string }> = {
  Zap: { color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  Activity: { color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10' },
  Leaf: { color: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-500/10' },
  Gauge: { color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10' },
  Flame: { color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10' },
  Cable: { color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
  Sun: { color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
  TrendingUp: { color: 'text-primary dark:text-primary-foreground', bg: 'bg-primary/10' },
};

interface LocalStat {
  label: string;
  value: number;
  unit: string;
  isDecimal?: boolean;
  icon: any;
  iconClass?: string;
  iconBgClass?: string;
}

const initialStatsData: Omit<LocalStat, 'icon'>[] = [
  { label: 'Current Demand', value: 16740, unit: POWER_UNIT },
  { label: 'Peak Generation', value: 16181, unit: POWER_UNIT },
  { label: 'Peak Today', value: 16741, unit: POWER_UNIT },
  { label: 'Daily Generation', value: 14788, unit: POWER_UNIT },
  { label: 'Load Shedding', value: 0, unit: POWER_UNIT },
  { label: 'Energy Unserved', value: 89, unit: POWER_UNIT },
  { label: 'Fuel Cost', value: 6.5, unit: 'Tk/kWh', isDecimal: true },
  { label: 'Gas Supply', value: 2610, unit: 'MMcfd' },
  { label: 'Coal Generation', value: 5383, unit: POWER_UNIT },
  { label: 'Grid Import', value: 2570, unit: POWER_UNIT },
  { label: 'RE Installed', value: 1806, unit: POWER_UNIT },
  { label: 'RE Grid Share', value: 5.56, unit: '%', isDecimal: true },
];

const TARGET_ORDER: Record<DailySnapshotLabel, number> = Object.fromEntries(
  DAILY_SNAPSHOT_LABELS.map((label, index) => [label, index]),
) as Record<DailySnapshotLabel, number>;

function snapshotLabelOrder(label: string): number {
  return (TARGET_ORDER as Record<string, number>)[label] ?? 99;
}

function LocalSnapshotDashboard({ initialStats }: { initialStats?: any[] }) {
  const { locale, t } = useLocale();
  const [stats, setStats] = useState<any[]>(() => {
    const incomingMap = new Map<string, any>();
    if (initialStats && initialStats.length > 0) {
      for (const s of initialStats) {
        if (s && s.label && s.label in TARGET_ORDER) {
          incomingMap.set(s.label, s);
        }
      }
    }

    const merged = initialStatsData.map((item) => {
      const matched = incomingMap.get(item.label);
      return {
        ...item,
        value: matched && typeof matched.value === 'number' ? matched.value : item.value,
        unit: matched ? matched.unit || item.unit : item.unit,
        isDecimal: matched ? typeof matched.isDecimal === 'boolean' ? matched.isDecimal : item.isDecimal : item.isDecimal,
      };
    });

    const sorted = [...merged].sort((a, b) => snapshotLabelOrder(a.label) - snapshotLabelOrder(b.label));

    return sorted.map((s) => {
      const iconKey = s.label === 'Current Demand' || s.label === 'Load Shedding' ? 'Activity' :
                      s.label === 'Peak Generation' ? 'Zap' :
                      s.label === 'RE Grid Share' ? 'Leaf' :
                      s.label === 'Energy Unserved' || s.label === 'Fuel Cost' ? 'Gauge' :
                      s.label === 'Gas Supply' || s.label === 'Coal Generation' ? 'Flame' :
                      s.label === 'Grid Import' ? 'Cable' :
                      s.label === 'RE Installed' ? 'Sun' : 'TrendingUp';
      const style = ICON_STYLES[iconKey] || ICON_STYLES.TrendingUp;
      return {
        ...s,
        icon: IconMap[iconKey] || Zap,
        iconClass: style.color,
        iconBgClass: style.bg,
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
    <div className="grid grid-cols-2 gap-[1px] bg-border/65 w-full h-full auto-rows-fr rounded-xl overflow-hidden border border-border/65">
      {stats.map((s, i) => {
        const Icon = s.icon;
        
        const fullLabel = localizeEnergyStatLabel(s.label, locale as any);
        let shortLabel = fullLabel;
        if (locale === 'en') {
          shortLabel = shortLabel.replace(/Generation/g, 'GEN')
                                 .replace(/Power/g, 'PWR')
                                 .replace(/Frequency/g, 'FREQ')
                                 .replace(/POWER/g, 'PWR');
        }

        return (
          <div
            key={i}
            className="group relative flex flex-row items-center w-full h-full gap-3 transition-all duration-200 px-3 md:px-4 py-2.5 bg-card hover:bg-muted/5 dark:hover:bg-white/[0.01]"
          >
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

            <Icon className={`h-[11.25px] w-[11.25px] md:h-[13.5px] md:w-[13.5px] shrink-0 self-center transition-transform duration-200 group-hover:scale-110 ${s.iconClass}`} />
            
            <div className="flex flex-col min-w-0 flex-1 justify-center gap-1">
              <div className="font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors duration-150 select-none leading-none truncate w-full text-[9px] md:text-[10px]">
                <span className="hidden md:inline">{fullLabel}</span>
                <span className="inline md:hidden">{shortLabel}</span>
              </div>
              <div className="font-bold font-sans tabular-nums text-foreground/95 group-hover:text-primary transition-colors duration-150 leading-none whitespace-nowrap text-xs md:text-sm">
                {s.isDecimal
                  ? s.value.toFixed(s.label === 'Fuel Cost' || s.label === 'Energy Unserved' ? 2 : 1)
                  : formatNumber(Math.round(s.value))}
                {' '}
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[8px] md:text-[9px]">
                  {s.unit}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SnapshotSegment({
  snapshotStats,
  snapshotLabel,
  snapshotDate,
  headerDate,
}: {
  snapshotStats?: unknown;
  snapshotLabel: string;
  snapshotDate?: string;
  headerDate: string;
}) {
  const { locale, t } = useLocale();
  const localizedSnapshotLabel = localizeSnapshotLabel(snapshotLabel, locale);
  const parts = localizedSnapshotLabel
    .split(/\s*•\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const [liveWord, ...agencies] = parts;
  const sourcesText = agencies.join(' • ');

  return (
    <section className="home-snapshot-segment" aria-labelledby="home-snapshot-title">
      <div className="home-snapshot-segment__card">
        <header className="home-snapshot-segment__head">
          <div className="home-snapshot-segment__title-block">
            <Link href="/grid-explorer" className="home-snapshot-segment__title-link group">
              <BarChart3 className="home-snapshot-segment__icon" aria-hidden />
              <h2 id="home-snapshot-title" className="home-snapshot-segment__title">
                {t('home.systemSnapshot')}
              </h2>
              <ArrowUpRight
                className="home-snapshot-segment__title-arrow opacity-0 transition-opacity duration-200 group-hover:opacity-70"
                aria-hidden
              />
            </Link>
            <p className="home-snapshot-segment__kicker">
              {locale === 'bn' ? 'দৈনিক গ্রিড পরিসংখ্যান' : 'Daily grid telemetry'}
            </p>
          </div>
          <div className="home-snapshot-segment__meta">
            <span className="home-snapshot-segment__updated">
              {locale === 'bn' ? 'আপডেট ' : 'Updated '}
              <time dateTime={snapshotDate ?? headerDate}>{headerDate}</time>
            </span>
            <span className="home-snapshot-segment__live">
              <span className="home-snapshot-segment__live-dot" aria-hidden>
                <span className="home-snapshot-segment__live-ping" />
                <span className="home-snapshot-segment__live-core" />
              </span>
              {liveWord}
            </span>
          </div>
        </header>

        <div className="home-snapshot-segment__body">
          <LocalSnapshotDashboard initialStats={snapshotStats as any[]} />
        </div>

        {sourcesText ? (
          <footer className="home-snapshot-segment__foot">
            <span className="home-snapshot-segment__sources-text">
              {sourcesText.split(/\s*•\s*/).map((agency, idx, arr) => (
                <span key={idx}>
                  <span className="text-muted-foreground/90 font-medium italic">{agency}</span>
                  {idx < arr.length - 1 && (
                    <span className="mx-1.5 text-primary/60 font-extrabold select-none">•</span>
                  )}
                </span>
              ))}
            </span>
          </footer>
        ) : null}
      </div>
    </section>
  );
}

export function HomeSnapshotPanel({
  snapshotStats,
  snapshotLabel,
  snapshotDate,
  snapshotHeaderDate,
  layout = 'rail',
}: {
  snapshotStats?: unknown;
  snapshotLabel: string;
  snapshotDate?: string;
  snapshotHeaderDate?: string;
  layout?: 'rail' | 'segment';
}) {
  const { locale, t } = useLocale();
  const localizedSnapshotLabel = localizeSnapshotLabel(snapshotLabel, locale);
  const parts = localizedSnapshotLabel
    .split(/\s*•\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const [liveWord, ...agencies] = parts;
  const sourcesText = agencies.join(' • ');
  const headerDateToUse =
    snapshotHeaderDate ?? formatSnapshotHeaderDate(snapshotDate, locale);

  if (layout === 'segment') {
    return (
      <SnapshotSegment
        snapshotStats={snapshotStats}
        snapshotLabel={snapshotLabel}
        snapshotDate={snapshotDate}
        headerDate={headerDateToUse}
      />
    );
  }

  return (
    <section
      className="home-rail-panel home-block home-editorial__snapshot relative overflow-hidden bg-transparent flex flex-col gap-3 sm:gap-4"
      aria-labelledby="home-snapshot-title"
    >
      <div className="home-editorial__section-head flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <BarChart3 className="h-8 w-8 text-primary shrink-0" aria-hidden />
          <h2 id="home-snapshot-title" className="py-0.5 text-2xl md:text-3xl font-display font-extrabold tracking-tight text-foreground truncate leading-tight">
            {t('home.systemSnapshot')}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground select-none leading-none">
            {locale === 'bn' ? 'আপডেট: ' : 'UPDATED: '}{headerDateToUse}
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9.5px] md:text-[10px] font-display font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400 select-none transition-colors duration-300 shadow-[0_1px_2px_rgba(244,63,94,0.03)] leading-none mt-1.5">
            <span className="relative flex h-1.5 w-1.5 mr-0.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
            {liveWord}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-grow my-3">
        <EnergyDashboard initialStats={snapshotStats as never} compact fillHeight={false} />
      </div>

      {sourcesText && (
        <div className="flex-shrink-0 pt-3 border-t border-border/10 dark:border-border/20 mt-2 relative z-10">
          <div className="flex flex-col items-end w-full gap-0.5 text-[9px] xs:text-[10px] md:text-[11px] text-muted-foreground font-mono font-medium italic opacity-75 text-right">
            <div className="flex items-center justify-end gap-1 w-full whitespace-nowrap">
              <span className="font-semibold text-foreground/50 tracking-wider not-italic">{locale === 'bn' ? 'তথ্য সূত্র:' : 'DATA:'}</span>
              <span>{sourcesText}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
