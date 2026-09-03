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
import { POWER_UNIT } from '@/lib/data/grid/home-snapshot-core';
import { LIVE_BACKED_LABELS, mergeHomeSnapshot, type SnapshotSlot } from '@/lib/data/grid/home-snapshot-merge';

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

/** A merged slot plus the resolved lucide icon and its Tailwind classes. */
interface LocalStat extends SnapshotSlot {
  Icon: any;
  iconClass: string;
  iconBgClass: string;
}

/** "2026-08-24" out of an ISO date or datetime; null when the value is neither. */
function normalizeIsoDay(value: string | undefined | null): string | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.replace(/^"|"$/g, ''));
  return match ? match[1] : null;
}

/** "Aug 24" — day without the year, which the meta slot has no room for. */
function formatCompactDay(isoDay: string, locale: string): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** The slice of /api/data/live-grid this panel reads. */
type LiveGrid = {
  asOf: string;
  latest: {
    totalMw: number;
    demandMw: number | null;
    supplyMw: number | null;
    loadShedMw: number | null;
    byFuel: { coalMw: number };
    imports: { totalMw: number };
  };
  today: { maxDemandMw: number };
  /** buildLiveGridSnapshot's check: printed total === sum of fuels + imports. */
  reconciles?: boolean;
};

const LIVE_POLL_MS = 15 * 60 * 1000;

/**
 * NLDC posts hourly generation and demand/supply/load-shed pages on PGCB's
 * portal; /api/data/live-grid parses them behind a shared 10-minute cache.
 * This hook keeps the panel on the newest posted hour while the page is open.
 * On any failure it simply reports null and the tiles stay on the daily
 * figures — live is an upgrade, never a dependency.
 */
function useLiveGrid(): LiveGrid | null {
  const [live, setLive] = useState<LiveGrid | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/data/live-grid');
        if (!res.ok) return;
        const json = (await res.json()) as LiveGrid & { ok?: false };
        if (!cancelled && json?.asOf && json.latest) setLive(json);
      } catch {
        // Source down or offline — the daily tiles carry on.
      }
    }
    load();
    const interval = setInterval(load, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return live;
}

/**
 * The tiles whose label reads naturally as "right now", overlaid with the
 * newest NLDC hour. Everything else keeps its daily, report-anchored figure —
 * a daily total or an audited peak must not be silently swapped for a
 * different quantity just because a live number exists.
 */
/**
 * Must stay in agreement with `liveBacked` in `SNAPSHOT_SLOTS`: every label
 * this returns a figure for is marked live-backed there, and vice versa. The
 * survival rule reads `LIVE_BACKED_LABELS` off that spec, so a tile listed
 * there but missing from this switch would keep its slot forever waiting.
 */
function liveValueFor(label: string, live: LiveGrid): number | null {
  switch (label) {
    case 'Current Demand':
      return live.latest.demandMw;
    case 'Load Shedding':
      return live.latest.loadShedMw;
    case 'Peak Demand':
      return live.today.maxDemandMw;
    // Both of these come off the generation table, which is the table the
    // reconciliation covers. When the printed total stops matching its own
    // components, that table is mis-parsed or mis-published, so the tile
    // falls back to the daily report rather than showing a confident green
    // dot over a number we cannot vouch for. The demand-side tiles above
    // are unaffected -- they are parsed from the other page.
    case 'Coal Generation':
      return live.reconciles === false ? null : live.latest.byFuel.coalMw;
    case 'Grid Import':
      return live.reconciles === false ? null : live.latest.imports.totalMw;
    default:
      return null;
  }
}

function LocalSnapshotDashboard({ initialStats, live, liveStamp }: { initialStats?: any[]; live: LiveGrid | null; liveStamp?: string | null }) {
  const { locale, t } = useLocale();
  // `mergeHomeSnapshot` folds the server's stats onto the twelve declared slots
  // and is the only thing that decides a tile's figure. It has no specimen
  // numbers to fall back to, so a tile nobody filed arrives here as null with
  // the owing source named, and renders as "— awaiting".
  const [stats, setStats] = useState<LocalStat[]>(() =>
    mergeHomeSnapshot(initialStats as never).map((slot) => {
      const style = ICON_STYLES[slot.icon] || ICON_STYLES.TrendingUp;
      return {
        ...slot,
        Icon: IconMap[slot.icon] || Zap,
        iconClass: style.color,
        iconBgClass: style.bg,
      };
    }),
  );

  const simulateLive = isSimulatedTelemetryEnabled();

  useEffect(() => {
    if (!simulateLive) return;

    const interval = setInterval(() => {
      setStats(prev => prev.map((s) => {
        // A tile carrying a real NLDC figure is never jittered — simulation
        // exists to suggest movement where no live source was available.
        if (live && liveValueFor(s.label, live) !== null) return s;
        // Nor is one whose source has not filed: there is no figure to move,
        // and `null + variation` is NaN.
        if (s.value === null) return s;
        if (s.label === 'Current Demand' || s.label === 'Peak Demand' || s.label === 'Peak Generation') {
          const variation = (Math.random() - 0.5) * 120;
          const next = Math.max(12000, s.value + variation);
          return { ...s, value: Math.round(next) };
        }
        if (s.label === 'Production Cost') {
          const variation = (Math.random() - 0.5) * 0.04;
          const next = Math.max(5.5, Math.min(7.5, s.value + variation));
          return { ...s, value: parseFloat(next.toFixed(2)) };
        }
        return s;
      }));
    }, 24000);
    return () => clearInterval(interval);
  }, [simulateLive, live]);

  return (
    <div className="grid grid-cols-2 gap-[1px] bg-border/65 w-full h-full auto-rows-fr rounded-xl overflow-hidden border border-border/65">
      {stats.map((s, i) => {
        const Icon = s.Icon;

        const liveVal = live ? liveValueFor(s.label, live) : null;
        const isLive = liveVal !== null;
        const displayValue = isLive ? liveVal : s.value;
        // Live wins over waiting: a tile the daily report has not filed can
        // still be carried by NLDC, and then it is not waiting for anything.
        const awaiting = isLive ? undefined : s.awaiting;
        const liveWhen = liveStamp ?? (live ? live.asOf.slice(11, 16) : '');
        const liveTip =
          locale === 'bn'
            ? `এনএলডিসি ঘণ্টাভিত্তিক · ${liveWhen} পর্যন্ত`
            : `NLDC hourly · as of ${liveWhen}`;
        const awaitingTip =
          locale === 'bn'
            ? `${awaiting} এখনও এই দিনের হিসাব প্রকাশ করেনি`
            : `${awaiting} has not published this day yet`;

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
                label={isLive ? liveTip : awaiting ? awaitingTip : simulateLive ? t('energy.simulated') : t('energy.indicative')}
                alwaysShow
                variant="chrome"
                side="top"
              >
                <span className="relative flex h-1.5 w-1.5 cursor-help">
                  {isLive ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </>
                  ) : simulateLive && (s.label === 'Current Demand' || s.label === 'Peak Demand' || s.label === 'Peak Generation' || s.label === 'Production Cost') ? (
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
                {displayValue === null ? (
                  // An em dash, in the muted weight the rest of the site uses
                  // for an unpublished figure. Deliberately not "0" and not the
                  // last day's number: the tile is holding a place, not
                  // reporting one.
                  <span className="text-muted-foreground/70">—</span>
                ) : s.isDecimal ? (
                  displayValue.toFixed(s.label === 'Production Cost' || s.label === 'Energy Unserved' ? 2 : 1)
                ) : (
                  formatNumber(Math.round(displayValue))
                )}
                {' '}
                <span
                  className={`font-bold uppercase tracking-wider text-[8px] md:text-[9px] ${
                    displayValue === null ? 'text-muted-foreground/50' : 'text-muted-foreground'
                  }`}
                >
                  {/* The source name does not fit: the tile is a twelfth of a
                      480px panel, and "AWAITING PETROBANGLA" ran past its right
                      edge and clipped mid-word. The word alone fits, and the
                      tooltip on the dot beside it names the source. */}
                  {displayValue === null && awaiting
                    ? locale === 'bn'
                      ? 'অপেক্ষমাণ'
                      : 'awaiting'
                    : s.unit}
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
  const live = useLiveGrid();
  const localizedSnapshotLabel = localizeSnapshotLabel(snapshotLabel, locale);
  const parts = localizedSnapshotLabel
    .split(/\s*•\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const [liveWord, ...agencies] = parts;
  const sourcesText = agencies.join(' • ');

  // With live tiles on the panel, a bare "Updated <daily date>" undersells the
  // hourly half and reads as stale next to a tile stamped with today's hour.
  // Name both cadences; without live data the old single stamp stands. The
  // year is dropped from the daily date in the two-stamp form — the line has
  // to fit the meta slot, and the year says nothing "Daily Aug 22" does not.
  // The hourly stamp used to print the time alone. Directly under "Daily
  // Aug 23" that reads as 23 Aug 21:00, when the reading is in fact the
  // 24th: NLDC's newest posted hour normally belongs to the day AFTER the
  // newest daily report, because a day's report is only published the next
  // morning. So name the day whenever the two cadences disagree -- or
  // whenever we cannot tell that they agree, the safe side of the ambiguity.
  const liveHour = live ? live.asOf.slice(11, 16) : null;
  const liveDay = live ? normalizeIsoDay(live.asOf) : null;
  const dailyDay = normalizeIsoDay(snapshotDate);
  const liveStamp =
    liveHour && liveDay && (!dailyDay || liveDay !== dailyDay)
      ? `${formatCompactDay(liveDay, locale)}, ${liveHour}`
      : liveHour;
  const compactHeaderDate = headerDate.replace(/,?\s*[\d০-৯]{4}\s*$/, '');

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
            {/* The meta line names the two cadences with their stamps, so the
                kicker stays short instead of repeating them and wrapping. */}
            <p className="home-snapshot-segment__kicker">
              {locale === 'bn' ? 'গ্রিড পরিসংখ্যান' : 'Grid telemetry'}
            </p>
          </div>
          <div className="home-snapshot-segment__meta">
            {liveHour ? (
              // Two stacked stamps, not one long line: the meta column cannot
              // shrink (nowrap + flex-shrink:0), so a single line overflowed
              // the card at tighter widths.
              <>
                <span className="home-snapshot-segment__updated">
                  {locale === 'bn' ? 'ঘণ্টাভিত্তিক ' : 'Hourly '}
                  <time dateTime={live!.asOf}>{liveStamp}</time>
                </span>
                <span className="home-snapshot-segment__updated">
                  {locale === 'bn' ? 'দৈনিক ' : 'Daily '}
                  <time dateTime={dailyDay ?? undefined}>{compactHeaderDate}</time>
                </span>
              </>
            ) : (
              <span className="home-snapshot-segment__updated">
                {locale === 'bn' ? 'আপডেট ' : 'Updated '}
                <time dateTime={dailyDay ?? undefined}>{headerDate}</time>
              </span>
            )}
            {/* The badge renders only while an NLDC hourly reading is actually
                loaded. It used to render unconditionally from the settings
                string, putting a pulsing "Live" over a panel where 7 of 12
                tiles are daily or standing-register figures (audit 2026-09-01). */}
            {live ? (
              <span className="home-snapshot-segment__live">
                <span className="home-snapshot-segment__live-dot" aria-hidden>
                  <span className="home-snapshot-segment__live-ping" />
                  <span className="home-snapshot-segment__live-core" />
                </span>
                {liveWord}
              </span>
            ) : null}
          </div>
        </header>

        <div className="home-snapshot-segment__body">
          <LocalSnapshotDashboard
            initialStats={snapshotStats as any[]}
            live={live}
            liveStamp={liveStamp}
          />
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
  const [, ...agencies] = parts;
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
          {/* No live chip here: this layout has no NLDC hourly wiring at all,
              so the pulsing live-word chip it used to show was a permanent live
              claim over daily figures (audit 2026-09-01). The UPDATED stamp
              above and the DATA sources footer below carry the honest story. */}
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
