'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BarChart3, Zap, Activity, Leaf, Gauge, Flame, Cable, Sun, TrendingUp, Droplet
} from 'lucide-react';
import { EnergyDashboard } from '@/components/news/EnergyDashboard';
import { useLocale } from '@/components/shared/LocaleProvider';
import { formatSnapshotHeaderDate, localizeSnapshotLabel, localizeEnergyStatLabel } from '@/lib/i18n/homepage-copy';
import { formatNumber } from '@/lib/utils';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { POWER_UNIT } from '@/lib/data/grid/home-snapshot-core';
import { LIVE_BACKED_LABELS, mergeHomeSnapshot, type SnapshotSlot } from '@/lib/data/grid/home-snapshot-merge';
import { sourceSiteFor } from '@/lib/data/grid/source-sites';

const IconMap: Record<string, any> = {
  Zap,
  Activity,
  Leaf,
  Gauge,
  Flame,
  Cable,
  Sun,
  TrendingUp,
  // Hydro. Without this the tile fell back to Zap, which is the generation
  // icon — three tiles in a row wearing the same bolt.
  Droplet,
};

const ICON_STYLES: Record<string, { color: string; bg: string }> = {
  Zap: { color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  Activity: { color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10' },
  Leaf: { color: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-500/10' },
  Gauge: { color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10' },
  Flame: { color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10' },
  Droplet: { color: 'text-sky-500 dark:text-sky-400', bg: 'bg-sky-500/10' },
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
  /** PGCB's forecast board, or null when that page could not be read. */
  forecast?: {
    date: string;
    previousDate: string;
    forecastDemand: { dayPeakMw: number | null; eveningPeakMw: number | null };
    previousGeneration: { dayPeakMw: number | null; eveningPeakMw: number | null };
  } | null;
  latest: {
    totalMw: number;
    demandMw: number | null;
    supplyMw: number | null;
    loadShedMw: number | null;
    // Solar and wind are nullable and coal and gas are not, because NLDC has
    // printed the two thermal columns for the whole life of the page and added
    // the renewable ones later. Widening this to match the parser's own shape
    // is what lets the panel carry the fuels it was already receiving.
    byFuel: {
      gasMw: number;
      coalMw: number;
      liquidMw: number | null;
      hydroMw: number | null;
      solarMw: number | null;
      windMw: number | null;
    };
    imports: { totalMw: number | null };
  };
  // Nullable: these come from NLDC's demand/supply page, which can be absent or
  // re-laid-out while the generation page keeps working. `maxDemandMw` used to
  // fall back to the generation total, which put a different quantity under
  // this label. `maxGenerationMw` is the generation page's own maximum and is
  // deliberately not a stand-in for supply.
  today: { maxDemandMw: number | null; maxGenerationMw: number | null };
  /** buildLiveGridSnapshot's check: printed total === sum of fuels + imports. */
  reconciles?: boolean;
};

const LIVE_POLL_MS = 15 * 60 * 1000;

/**
 * The agency credits, as links to where each one publishes.
 *
 * Same font, weight and italic as before — the only added affordance is the
 * hover, because a footer of links that looks like a footer of links would
 * shout louder than a source line should. An agency `source-sites.ts` has no
 * URL for stays plain text: a guessed link is a fabricated citation.
 */
function SourceCredits({ text }: { text: string }) {
  const agencies = text.split(/\s*•\s*/).filter(Boolean);
  return (
    <span className="home-snapshot-segment__sources-text">
      {agencies.map((agency, idx) => {
        const href = sourceSiteFor(agency);
        const style = 'text-muted-foreground/90 font-medium italic';
        return (
          <span key={`${agency}-${idx}`}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${style} underline-offset-2 transition-colors hover:text-primary hover:underline`}
                title={`Open ${agency} — check these figures at the source`}
              >
                {agency}
              </a>
            ) : (
              <span className={style}>{agency}</span>
            )}
            {idx < agencies.length - 1 && (
              <span className="mx-1.5 text-primary/60 font-extrabold select-none">•</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * "23:00" as "11 PM", for the readers who do not think in 24-hour time.
 *
 * Derived from the same string the 24-hour stamp prints, so the two can never
 * disagree about the hour. Minutes are dropped when they are zero, which they
 * are for every NLDC row except the one evening-peak stamp a day.
 */
function to12Hour(hhmm: string): string | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = m[2];
  if (!Number.isFinite(hour) || hour > 23) return null;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return minute === '00' ? `${twelve} ${suffix}` : `${twelve}:${minute} ${suffix}`;
}

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
function pickPeak(
  pair: { dayPeakMw: number | null; eveningPeakMw: number | null } | undefined,
  phase: PeakPhase,
): number | null {
  if (!pair) return null;
  const wanted = phase === 'day' ? pair.dayPeakMw : pair.eveningPeakMw;
  const other = phase === 'day' ? pair.eveningPeakMw : pair.dayPeakMw;
  return wanted ?? other ?? null;
}

/**
 * Short forms for the narrow panel, stated rather than derived.
 *
 * The regex below ("Generation" -> "GEN") is not enough on its own: it leaves
 * "Current Demand" at fourteen characters and "Current Generation" at eleven,
 * and at a 1366 viewport the rail gives a tile about 113px for its label. An
 * 18-character uppercase label does not fit there at any size a reader would
 * thank us for — 9px was measured still clipping, and the size that would fit
 * is around 7.5px.
 *
 * Written out per label because a short form has to stay unambiguous inside
 * THIS panel. "GEN" alone belongs to none of Current, Gas and Coal Generation,
 * so the qualifier is what survives the trim, never the noun. The full label is
 * always one breakpoint away, and the tooltip names the source either way.
 */
const SHORT_LABELS: Record<string, string> = {
  'Current Demand': 'Demand now',
  'Current Supply': 'Supply now',
  'Current Generation': 'Gen now',
  'Forecast Demand': 'Demand fcst',
  'Load Shedding': 'Load shed',
  'Yesterday Peak Gen': 'Y-day peak',
  'Gas Generation': 'Gas gen',
  'Coal Generation': 'Coal gen',
  'Liquid Fuel': 'Liquid',
  Hydro: 'Hydro',
  'Grid Import': 'Import',
  'Solar + Wind': 'Solar+wind',
  'Gas Supply': 'Gas supply',
  'Production Cost': 'Cost',
};

/** Which of PGCB's two published peaks the dual tiles are showing. */
type PeakPhase = 'evening' | 'day';

/** The two tiles PGCB publishes a day peak AND an evening peak for. */
const DUAL_PEAK_LABELS = new Set(['Forecast Demand', 'Yesterday Peak Gen']);

function liveValueFor(label: string, live: LiveGrid, phase: PeakPhase = 'evening'): number | null {
  switch (label) {
    case 'Current Demand':
      return live.latest.demandMw;
    case 'Load Shedding':
      return live.latest.loadShedMw;
    // Supply as NLDC prints it for this hour, off the same row as demand and
    // load shed — so the three reconcile on the panel: 15,463 − 13,247 = 2,216
    // at 2026-09-07 12:00.
    case 'Current Supply':
      return live.latest.supplyMw;
    // Every case below comes off the generation table, which is the table the
    // reconciliation covers. When the printed total stops matching its own
    // components, that table is mis-parsed or mis-published, so the tile
    // falls back to the daily report rather than showing a confident green
    // dot over a number we cannot vouch for. The demand-side tiles above
    // are unaffected -- they are parsed from the other page.
    // The generation table's own printed total for this hour — not a maximum
    // derived across the window. It was `today.maxGenerationMw`, which is a
    // real figure but a different one: on 2026-09-07 the page printed 14,230 at
    // 12:00 while the tile showed 14,852, the day's high recorded at 00:00. The
    // panel's fuel tiles are all current-hour, and they sum to exactly the
    // printed total, so a reader adding them up found a 622 MW gap against the
    // headline. The headline is now the same hour as its own components.
    case 'Current Generation':
      return live.reconciles === false ? null : live.latest.totalMw;
    case 'Gas Generation':
      return live.reconciles === false ? null : live.latest.byFuel.gasMw;
    case 'Coal Generation':
      return live.reconciles === false ? null : live.latest.byFuel.coalMw;
    // Nullable where gas and coal are not: NLDC has printed the two thermal
    // columns for the whole life of the page and these two can be blank, so an
    // hour without them is absent rather than a grid running on neither.
    case 'Liquid Fuel':
      return live.reconciles === false ? null : live.latest.byFuel.liquidMw;
    case 'Hydro':
      return live.reconciles === false ? null : live.latest.byFuel.hydroMw;
    case 'Grid Import':
      return live.reconciles === false ? null : live.latest.imports.totalMw;
    // Solar and wind are summed over whichever of the two NLDC printed, never
    // over a blank read as zero: the wind column is present in 28.8% of stored
    // hours and solar in 78.8%, because both postdate most of the archive. An
    // hour carrying neither is absent -- not a grid running on no renewables.
    case 'Solar + Wind': {
      if (live.reconciles === false) return null;
      const parts = [live.latest.byFuel.solarMw, live.latest.byFuel.windMw].filter(
        (v): v is number => typeof v === 'number',
      );
      return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
    }
    // PGCB's forecast board publishes BOTH peaks for these two, and the tile
    // has room for one number, so it alternates between them on a 5s cycle
    // (see `peakPhase`). Evening leads because it is the system peak — the hour
    // the grid is judged on — and is what the tile shows if the flip is off.
    //
    // Falls back to the other peak rather than to a dash: if PGCB printed only
    // one of the pair, the tile shows the one that exists at every phase
    // instead of blinking to em-dash and back every five seconds. That is not a
    // substitution — both are the same quantity from the same row, and the
    // suffix beside the figure always says which one is on screen.
    //
    // Not gated on `reconciles` — that flag is about the generation table's
    // total against its own components, and neither of these comes from it.
    case 'Forecast Demand':
      return pickPeak(live.forecast?.forecastDemand, phase);
    case 'Yesterday Peak Gen':
      return pickPeak(live.forecast?.previousGeneration, phase);
    default:
      return null;
  }
}

function LocalSnapshotDashboard({
  initialStats,
  live,
  liveStamp,
  archiveDay,
}: {
  initialStats?: any[];
  live: LiveGrid | null;
  liveStamp?: string | null;
  /** The archive day the workbook-backed tiles belong to (Gas Supply, Cost). */
  archiveDay?: string | null;
}) {
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

  /*
    The dual-peak flip.

    PGCB publishes a day peak AND an evening peak for the forecast board's two
    rows, and a tile has room for one number. Rather than drop half of what the
    source stated, the two tiles alternate every five seconds, and the suffix
    beside the figure names which peak is on screen — the reader is never left
    guessing which of the two they are looking at.

    Off under `prefers-reduced-motion`, where the tile holds the evening peak.
    An unannounced number that changes itself is exactly what that preference is
    about, and nothing is lost: the tooltip states both peaks either way.

    Read once and then watched, because a reader can change the setting with the
    page open, and a panel that only checked at mount would keep flipping at
    someone who had just asked it to stop.
  */
  const [peakPhase, setPeakPhase] = useState<PeakPhase>('evening');
  const [flipEnabled, setFlipEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setFlipEnabled(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!flipEnabled) {
      setPeakPhase('evening');
      return;
    }
    const id = setInterval(
      () => setPeakPhase((p) => (p === 'evening' ? 'day' : 'evening')),
      5000,
    );
    return () => clearInterval(id);
  }, [flipEnabled]);

  /*
    The simulated-movement loop is gone.
    
    It jittered a tile every 24s "to suggest movement where no live source was
    available", skipping any tile the NLDC overlay had filled. But it did not
    skip a tile filled from the PGCB daily report, which is just as much a
    published figure — so Production Cost, read from `avgProductionCost`, was
    being moved. Worse, it was clamped by `Math.min(7.5, …)`: on 2026-09-06 the
    report states 7.548 Tk/kWh, the tile should read 7.55, and the panel showed
    7.50. A hard bound silently capped a real figure.
    
    It ran only under `NODE_ENV !== 'production'`, so the live site never showed
    an invented number. That is not much of a defence: development is where the
    panel is read while it is being changed, and a fabricated figure there is
    one that gets screenshotted and believed. It misled a review of this very
    panel today.
    
    Nothing is left for it to do in any case. Ten of the twelve tiles are
    live-backed, and the other two carry the daily report; a tile with no figure
    is null and was skipped already. Every value on this panel now comes from a
    source that published it.
  */

  return (
    <div className="grid grid-cols-2 gap-[1px] bg-border/65 w-full h-full auto-rows-fr rounded-xl overflow-hidden border border-border/65">
      {stats.map((s, i) => {
        const Icon = s.Icon;

        const liveVal = live ? liveValueFor(s.label, live, peakPhase) : null;
        // Only annotate a tile that is actually alternating: a dual tile where
        // PGCB printed just one of the pair shows that one at every phase, and
        // labelling it with the phase would name a peak it is not showing.
        const pair =
          s.label === 'Forecast Demand'
            ? live?.forecast?.forecastDemand
            : s.label === 'Yesterday Peak Gen'
              ? live?.forecast?.previousGeneration
              : undefined;
        const isFlipping =
          DUAL_PEAK_LABELS.has(s.label) &&
          pair?.dayPeakMw != null &&
          pair?.eveningPeakMw != null;
        const peakSuffix = isFlipping
          ? locale === 'bn'
            ? peakPhase === 'day'
              ? 'দিন'
              : 'সন্ধ্যা'
            : peakPhase === 'day'
              ? 'day'
              : 'evening'
          : null;
        const isLive = liveVal !== null;
        const displayValue = isLive ? liveVal : s.value;
        // Live wins over waiting: a tile the daily report has not filed can
        // still be carried by NLDC, and then it is not waiting for anything.
        const awaiting = isLive ? undefined : s.awaiting;
        const liveWhen = liveStamp ?? (live ? live.asOf.slice(11, 16) : '');
        /*
          The two forecast-board tiles do not wear the hourly tooltip.

          Ten of the twelve are NLDC's hourly pages and "NLDC hourly · as of
          10:00" is true of them. It is false of these two: they come from
          PGCB's daily forecast board, one is a forecast rather than a
          measurement, and neither has anything to do with the 10:00 hour. A
          tooltip is where a reader checks provenance, so a wrong one there is
          worse than none.

          It is also the only room on the tile for the DAY peak. The panel shows
          one number and the evening peak is the right one to show — it is the
          system peak, the hour the grid is judged on — but PGCB publishes both,
          and the one not shown belongs somewhere rather than nowhere.
        */
        const board = live?.forecast ?? null;
        /** Tiles fed by PGCB's daily board rather than NLDC's hourly pages. */
        const isBoardTile = DUAL_PEAK_LABELS.has(s.label);
        const boardTip = (() => {
          if (!board) return null;
          if (s.label === 'Forecast Demand') {
            const day = board.forecastDemand.dayPeakMw;
            return locale === 'bn'
              ? `পিজিসিবি পূর্বাভাস · ${board.date} · সন্ধ্যা পিক দেখানো হয়েছে${day !== null ? ` · দিনের পিক ${formatNumber(day)}` : ''}`
              : `PGCB forecast for ${board.date} · evening peak shown${day !== null ? ` · day peak ${formatNumber(day)} MW` : ''}`;
          }
          if (s.label === 'Yesterday Peak Gen') {
            const day = board.previousGeneration.dayPeakMw;
            return locale === 'bn'
              ? `পিজিসিবি · ${board.previousDate} এর প্রকৃত · সন্ধ্যা পিক${day !== null ? ` · দিনের পিক ${formatNumber(day)}` : ''}`
              : `PGCB actual for ${board.previousDate} · evening peak${day !== null ? ` · day peak ${formatNumber(day)} MW` : ''}`;
          }
          return null;
        })();
        const liveTip =
          boardTip ??
          (locale === 'bn'
            ? `এনএলডিসি ঘণ্টাভিত্তিক · ${liveWhen} পর্যন্ত`
            : `NLDC hourly · as of ${liveWhen}`);
        const awaitingTip =
          locale === 'bn'
            ? `${awaiting} এখনও এই দিনের হিসাব প্রকাশ করেনি`
            : `${awaiting} has not published this day yet`;

        const fullLabel = localizeEnergyStatLabel(s.label, locale as any);
        let shortLabel = fullLabel;
        if (locale === 'en') {
          shortLabel =
            SHORT_LABELS[s.label] ??
            shortLabel
              .replace(/Generation/g, 'GEN')
              .replace(/Power/g, 'PWR')
              .replace(/Frequency/g, 'FREQ')
              .replace(/POWER/g, 'PWR');
        }

        return (
          <div
            key={i}
            className="group relative flex flex-row items-center w-full h-full transition-all duration-200 px-3 md:px-4 py-2.5 bg-card hover:bg-muted/5 dark:hover:bg-white/[0.01]"
          >
            <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 z-20">
              <ModernTooltip
                /*
                  The header's "Daily" stamp shows the NEWEST daily date the
                  panel carries, which since the forecast board arrived is
                  today's. Gas Supply and Production Cost still come from the
                  archive day before it, so they state their own day here rather
                  than inherit one that is not theirs.
                */
                label={
                  isLive
                    ? liveTip
                    : awaiting
                      ? awaitingTip
                      : archiveDay
                        ? locale === 'bn'
                          ? `পিজিসিবি দৈনিক প্রতিবেদন · ${archiveDay}`
                          : `PGCB daily report for ${archiveDay}`
                        : t('energy.indicative')
                }
                alwaysShow
                variant="chrome"
                side="top"
              >
                {/* Three states, because the panel now carries three cadences.
                    
                    Emerald is NLDC's hourly feed — a figure that moves within
                    the hour a reader is looking at it. Rose is PGCB's forecast
                    board: live in the sense that it refreshes on its own, but
                    on a DAILY cadence, so a reader who reads a pulsing dot as
                    "this is the current hour" would be wrong about it. Grey is
                    a figure nobody has filed. Both live states pulse, because
                    both do update; the colour is what separates the cadence,
                    and the tooltip on the dot states it in words. */}
                <span className="relative flex h-1.5 w-1.5 cursor-help">
                  {isLive ? (
                    <>
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isBoardTile ? 'bg-rose-400' : 'bg-emerald-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          isBoardTile ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                      />
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground/20 dark:bg-muted-foreground/10" />
                  )}
                </span>
              </ModernTooltip>
            </span>

            <div className="flex flex-col min-w-0 flex-1 justify-center gap-1">
              {/* The icon rides INSIDE the label, at the label's own size.
                  
                  It was a flex sibling in a gutter: 13.5px of icon plus a 12px
                  gap, ~25px taken out of a label that carries `truncate` and is
                  the longest string on the tile. "Current Generation" and
                  "Yesterday Peak Gen" were losing their last characters to a
                  glyph sitting outside the text it names. At `1em` it scales
                  with the label at both breakpoints and costs the column only
                  its own width. */}
              <div className="home-snapshot-tile__label font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors duration-150 select-none leading-none truncate w-full text-[9px] md:text-[10px]">
                <Icon
                  aria-hidden
                  className={`inline-block h-[1em] w-[1em] mr-[0.45em] align-[-0.15em] shrink-0 transition-transform duration-200 group-hover:scale-110 ${s.iconClass}`}
                />
                <span className="home-snapshot-tile__label-full">{fullLabel}</span>
                <span className="home-snapshot-tile__label-short">{shortLabel}</span>
              </div>
              <div className="font-bold font-sans tabular-nums text-foreground/95 group-hover:text-primary transition-colors duration-150 leading-none whitespace-nowrap text-xs md:text-sm">
                {displayValue === null ? (
                  // An em dash, in the muted weight the rest of the site uses
                  // for an unpublished figure. Deliberately not "0" and not the
                  // last day's number: the tile is holding a place, not
                  // reporting one.
                  <span className="text-muted-foreground/70">—</span>
                ) : s.isDecimal ? (
                  displayValue.toFixed(s.label === 'Production Cost' ? 2 : 1)
                ) : (
                  formatNumber(Math.round(displayValue))
                )}
                {' '}
                <span
                  className={`font-bold uppercase tracking-wider text-[8px] md:text-[9px] ${
                    displayValue === null ? 'text-muted-foreground/50' : 'text-muted-foreground'
                  }`}
                >
                  {/* Which of the two peaks is on screen. Sits with the unit
                      rather than in the label, where a 10px uppercase string
                      already carries `truncate` and has no room for a suffix. */}
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
                {peakSuffix && displayValue !== null ? (
                  <span className="ml-1 font-semibold lowercase tracking-normal text-[8px] md:text-[9px] text-muted-foreground/75">
                    · {peakSuffix}
                  </span>
                ) : null}
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
  /*
    The "Daily" stamp names the newest daily date the panel carries.

    It used to be the archive day alone — the newest PGCB workbook — and that
    was the whole daily half. PGCB's forecast board is daily too and is a day
    ahead of the workbook by construction: it publishes today's forecast on
    today, while the workbook for today only appears tomorrow. Leaving the stamp
    on the workbook's day printed "Daily Sep 7" over a tile stating a forecast
    for Sep 8.

    So the stamp follows whichever is newer. The tiles that are still the
    workbook's — Gas Supply and Production Cost — name their own day in their
    tooltip rather than inherit this one, because on any day the board is ahead
    this stamp is not theirs.
  */
  const boardDay = live?.forecast?.date ?? null;
  const dailyShownDay = boardDay && (!dailyDay || boardDay > dailyDay) ? boardDay : dailyDay;
  const dailyShownLabel =
    dailyShownDay && dailyShownDay !== dailyDay
      ? formatCompactDay(dailyShownDay, locale)
      : compactHeaderDate;
  const liveHour12 = liveHour ? to12Hour(liveHour) : null;

  return (
    <section className="home-snapshot-segment" aria-labelledby="home-snapshot-title">
      <div className="home-snapshot-segment__card">
        <header className="home-snapshot-segment__head">
          <div className="home-snapshot-segment__title-block">
            <Link prefetch={false} href="/grid-explorer" className="home-snapshot-segment__title-link group">
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
              // Two stamps, two colours, because they are two cadences and the
              // panel already speaks that language: emerald is what a live tile
              // wears, so the hourly stamp wears it too, and the daily stamp
              // takes the slower colour. A reader can tell at a glance which
              // half of the panel a figure came from without reading a word.
              //
              // Daily first, so the long stamp sits under the short kicker
              // rather than beside the long title.
              //
              // This is a balance choice and NOT what prevents truncation — an
              // earlier version of this comment claimed it was, and that was
              // wrong. The header's two columns are shared by both rows, so the
              // width it needs is max(left items) + max(right items) whichever
              // row each sits on; swapping them moves whitespace around and
              // changes the total by nothing. What actually keeps the panel's
              // own name intact is the title column's `min-content` floor and
              // the container query that stacks the header when the panel is
              // genuinely too narrow — both in globals.css.
              //
              // The stamps keep their own colours, so which cadence is which
              // never depended on the order.
              <>
                <span className="home-snapshot-segment__updated home-snapshot-segment__updated--daily">
                  {locale === 'bn' ? 'দৈনিক ' : 'Daily '}
                  <time dateTime={dailyShownDay ?? undefined}>{dailyShownLabel}</time>
                </span>
                <span className="home-snapshot-segment__updated home-snapshot-segment__updated--hourly">
                  {locale === 'bn' ? 'ঘণ্টাভিত্তিক ' : 'Hourly '}
                  <time dateTime={live!.asOf}>{liveStamp}</time>
                  {liveHour12 ? (
                    <span className="home-snapshot-segment__clock12">({liveHour12})</span>
                  ) : null}
                </span>
              </>
            ) : (
              <span className="home-snapshot-segment__updated">
                {locale === 'bn' ? 'আপডেট ' : 'Updated '}
                <time dateTime={dailyDay ?? undefined}>{headerDate}</time>
              </span>
            )}
          </div>
        </header>

        <div className="home-snapshot-segment__body">
          <LocalSnapshotDashboard
            initialStats={snapshotStats as any[]}
            live={live}
            liveStamp={liveStamp}
            archiveDay={dailyDay}
          />
        </div>

        {sourcesText || live ? (
          <footer className="home-snapshot-segment__foot">
            {/* The badge sits with the sources, at their size, because that is
                what it is: a statement about where the figures came from. In
                the header it competed with the two cadence stamps for the meta
                column and pushed the tile grid down; here it costs no height
                the footer was not already spending.

                It renders only while an NLDC hourly reading is actually loaded.
                It used to render unconditionally from the settings string,
                putting a pulsing "Live" over a panel where most tiles were
                daily or standing-register figures (audit 2026-09-01). */}
            {live ? (
              <span className="home-snapshot-segment__live">
                <span className="home-snapshot-segment__live-dot" aria-hidden>
                  <span className="home-snapshot-segment__live-ping" />
                  <span className="home-snapshot-segment__live-core" />
                </span>
                {liveWord}
              </span>
            ) : null}
            <SourceCredits text={sourcesText} />
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
              {/* Same credits, same links. This is the non-segment layout; both
                  render sites go through SourceCredits so a new agency needs one
                  entry in source-sites.ts and nothing else. */}
              <SourceCredits text={sourcesText} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
