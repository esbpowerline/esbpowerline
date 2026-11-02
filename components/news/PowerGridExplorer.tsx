'use client';


import dynamic from 'next/dynamic';
import { useEffect, useId, useState, useRef, RefObject, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, Activity, Cable, TrendingUp, FileText, BarChart3, MapPin, Droplet, Globe, Sun,
  ChevronLeft, ChevronRight, ChevronDown, Check, Info, Network, Calendar, RotateCcw, History, Factory,
  AlertTriangle
} from 'lucide-react';
import { cn, formatNumber, formatUnitRate } from '@/lib/utils';
import { useBelowDesktop } from '@/components/news/power-grid/useTapToRead';
import { EventStudyDateLink } from '@/components/news/power-grid/EventStudyDateLink';
import { useChartTheme, type ChartTheme } from '@/hooks/useChartTheme';
import {
  LOAD_CURVE_COLORS as LOAD_CURVE_PALETTE,
  FUEL_DISPLAY_ORDER,
  canonicalFuelName,
  pick,
  type ChartMode,
} from '@/lib/data/grid/chart-palette';
import {
  GridLiveBadge,
  GridStatusBadge,
  GRID_CHART_MARGIN,
  GRID_X_AXIS_PADDING,
  BDT_TO_CRORE,
  formatAxisMw,
  formatAxisMwCompact,
  gridChartAxisTick,
  gridChartYAxisProps,
} from '@/components/news/PowerGridChartUI';
import type { GridDailyData } from '@/lib/data/grid/types';
import { shouldUseArchiveFallback } from '@/lib/data/grid/daily-access';
import {
  getCachedDailyReport,
  peekLatestCachedReport,
  resolveInitialDailyReport,
  resolveInitialDailyReportEntry,
  seedDailyReportCache,
  setCachedDailyReport,
} from '@/lib/data/grid/daily-cache';
import { availableDates, getLatestAvailableDate, isDateAvailable } from '@/lib/data/grid/available-dates';
import { axisTickStyle } from '@/lib/data/grid/chart-axis';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { isoDateToLegacy } from '@/lib/data/grid/date-utils';
import { pendingDays, isBeyondToday, type PendingDay } from '@/lib/data/grid/pending-days';
import { backlogBadge } from '@/lib/data/grid/backlog-badge';
import { PendingDayPanel, FutureDatePanel, AbsentFiguresStrip } from '@/components/news/power-grid/PendingDayPanel';
import { useUnitCostAuthentication } from '@/components/news/power-grid/useUnitCostAuthentication';
import { totalCapacityRenewables } from '@/lib/data/companies/sreda';

import { CustomDropdown } from '@/components/news/power-grid/shared';
import { OverviewKpiStrip } from '@/components/news/power-grid/OverviewKpiStrip';
import {
  StationsKpiStrip,
} from '@/components/news/power-grid/TabKpiStrips';
import { PowerStationsTab } from '@/components/news/power-grid/PowerStationsTab';
import { GridReportingStandards } from '@/components/news/power-grid/GridReportingStandards';
import { GridExplorerUrlSyncer } from '@/components/news/power-grid/GridExplorerUrlSyncer';
import type { GridExplorerUrlBoot } from '@/lib/grid-explorer-url';
import { MethodologyReconciliationBanner } from '@/components/news/power-grid/MethodologyReconciliationBanner';
import { SourceProvenanceNote } from '@/components/news/power-grid/SourceProvenanceNote';
import { assessFreshness } from '@/lib/data/grid/ingest-freshness';
import {
  describeDayProvenance,
  provenanceNeedsDisclosure,
  type LedgerDay,
} from '@/lib/data/grid/verification-ledger';
import { GridDayWindows } from '@/components/news/power-grid/GridDayWindows';
import { petrobanglaGasDay, formatWindow } from '@/lib/data/grid/observation-window';
import { tabAvailability, type GridTabId } from '@/lib/data/grid/tab-availability';
import '@/app/grid-explorer-mobile.css';
import { GridExplorerMobileShell } from '@/components/news/power-grid/GridExplorerMobileShell';
import { GridAccessBanner } from '@/components/news/power-grid/GridAccessBanner';
import { GridTopFold } from '@/components/news/power-grid/GridTopFold';
import { GridArchiveTeaser } from '@/components/news/power-grid/GridArchiveTeaser';
import { GridLockedContent } from '@/components/news/power-grid/GridLockedContent';
import { OverviewPanel } from '@/components/news/power-grid/tabs/OverviewPanel';
import { GenerationPanel } from '@/components/news/power-grid/tabs/GenerationPanel';
import { ImportsPanel } from '@/components/news/power-grid/tabs/ImportsPanel';
import { RegionalPanel } from '@/components/news/power-grid/tabs/RegionalPanel';
import { DEMO_DATE } from '@/components/news/power-grid/tabs/shared';
const GridTopologyMap = dynamic(
  () => import('@/components/news/GridTopologyMap').then((m) => m.GridTopologyMap),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-[500px] rounded-2xl flex items-center justify-center border border-dashed"><span className="text-muted-foreground text-sm font-medium">Loading Network Map...</span></div> }
);
import { isDateAllowedForTier, subtractDaysFromIso } from '@/lib/data/grid/grid-tier-access';
import { useGridTierAccess } from '@/hooks/useGridTierAccess';
const GasTab = dynamic(
  () => import('@/components/news/power-grid/GasTab').then((m) => m.GasTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-64 rounded-2xl" /> },
);
// Ships ~5 MB of per-check detail across six months, one month file at a time,
// so it must not be in the initial bundle.

const RenewablesTab = dynamic(
  () => import('@/components/news/power-grid/RenewablesTab').then((m) => m.RenewablesTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" /> },
);

// ~2,100 lines of standing asset-register JSX that only the Technical
// Information tab reads — split so the main chunk stops carrying it.
const TechnicalInfoTab = dynamic(
  () => import('@/components/news/power-grid/TechnicalInfoTab').then((m) => m.TechnicalInfoTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" /> },
);

// The whole long-run section — ten sub-tabs, the macro data tables, and the
// monthly-archive machinery — loads only when Macro Trends is opened.
const MacroTrendsTab = dynamic(
  () => import('@/components/news/power-grid/MacroTrendsTab').then((m) => m.MacroTrendsTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" /> },
);

// Reads the hourly archive directly over /api/grid/history, so unlike every
// other tab it does not need the selected day to have loaded — and it carries a
// chart library plus eleven years of range handling, so it stays out of the
// initial chunk.
const TimeMachineTab = dynamic(() => import('@/components/news/power-grid/TimeMachineTab'), {
  ssr: false,
  loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" />,
});

interface GridLineItem {
  name: string;
  status: string;
  capacity: string;
  owner: string;
  load: number;
}

interface PowerGridExplorerProps {
  /**
   * Retained but unused since the Transmission Grid Assets card was removed —
   * the rows are hand-entered settings with no publishable source. Kept on the
   * props and in the admin editor so the card can return the day it has one.
   */
  initialLines?: GridLineItem[];
  urlBoot?: GridExplorerUrlBoot;
  prefetchedDailyReports?: Record<string, GridDailyData>;
  serverLatestDate?: string;
  /**
   * Days published from the admin panel since the last deploy. `availableDates`
   * is compiled into this bundle at build time and cannot know about them, so
   * the server passes them in and they are merged into the picker.
   */
  runtimeDates?: string[];
  /** verify:source verdicts by day, for the provenance disclosure. */
  verificationLedger?: Record<string, LedgerDay>;
}

/**
 * Shared sizing for the four controls above the 13-Year Growth Trends chart —
 * the three metric toggles and the fuel dropdown. Kept in one place so they
 * stay identical; `min-h-11` and `w-44` are what CustomDropdown already renders
 * at (via .grid-explorer-control), so the toggles match it rather than the
 * other way round.
 */
const TREND_CONTROL_SIZE = 'w-full sm:w-44 min-h-11';
const TREND_TOGGLE_CLASS = cn(
  TREND_CONTROL_SIZE,
  'flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 shadow-sm',
);

/**
 * The 24-Hour System Load Curve's three series, in one place. The legend, the
 * plotted marks, the hover panel and the prose beneath the card all read these,
 * so a colour cannot drift between where a series is drawn and where it is
 * named — which is how the hover panel ended up printing demand in the
 * foreground colour and the prose in amber while the line itself was yellow.
 * Shedding is the theme's own destructive colour, so it is resolved from
 * chartTheme at render time rather than fixed here.
 *
 * The two steps per series now come from `chart-palette`, which picks the one
 * that suits the surface being drawn on — the previous pair was fixed for the
 * dark card and carried onto the white one unchanged.
 */
function loadCurveColorsFor(mode: ChartMode) {
  return {
    generation: pick(LOAD_CURVE_PALETTE.generation, mode),
    demand: pick(LOAD_CURVE_PALETTE.demand, mode),
  } as const;
}

/**
 * The hovered load-shedding bar, marked the way the two curves mark the same
 * hour: a filled dot with a white ring, sat on top of the bar. Recharts hands
 * the active shape the bar's own geometry, so the bar is redrawn exactly as it
 * renders at rest and only the dot is added — hovering marks the hour, it does
 * not restyle the bar.
 */
function ShedActiveBar({ x = 0, y = 0, width = 0, height = 0, fill }: {
  x?: number; y?: number; width?: number; height?: number; fill?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={2} ry={2} fill={fill} fillOpacity={0.45} stroke={fill} strokeWidth={1} />
      <circle cx={x + width / 2} cy={y} r={5} fill={fill} stroke="#fff" strokeWidth={2} />
    </g>
  );
}

/** Short right-hand hints in the phone "Jump to section" sheet. */
const SECTION_HINTS: Record<string, string> = {
  overview: 'KPIs · 24-h curve',
  regional: 'zones · outages',
  gen: 'fuel mix · cost',
  gas: 'fields · LNG',
  plants: 'per station',
  imports: 'interconnectors',
  renewables: 'solar · wind · hydro',
  macro: 'long-run trends',
  transmission: 'lines · substations',
  timemachine: '11 years, hour by hour',
};



export function PowerGridExplorer({
  initialLines: _initialLines,
  urlBoot,
  prefetchedDailyReports,
  serverLatestDate,
  runtimeDates,
  verificationLedger,
}: PowerGridExplorerProps = {}) {
  const chartTheme = useChartTheme();
  // Resolved once per theme change so every reference below — marks, legend,
  // hover panel, prose — reads the same two strings.
  const LOAD_CURVE_COLORS = useMemo(
    () => loadCurveColorsFor(chartTheme.mode),
    [chartTheme.mode],
  );
  // The server knows the true newest day (bundled catalog ∪ runtime releases);
  // the hook's own bundled value would gate a freshly published day as locked.
  const gridAccess = useGridTierAccess(
    runtimeDates && runtimeDates.length > 0 ? runtimeDates[runtimeDates.length - 1] : serverLatestDate,
  );
  
  const latestDate = gridAccess.latestDate || serverLatestDate || getLatestAvailableDate() || '2026-07-03';

  // Days the calendar has reached that PGCB has not filed. `latestDate` stays
  // the newest day actually HELD — every tier bound is anchored to it and must
  // not move — so these are carried alongside rather than folded into it.
  // Empty whenever the archive is behind; see pending-days.ts for why.
  const pending = useMemo(() => pendingDays(latestDate), [latestDate]);
  const pendingByDate = useMemo(() => new Map(pending.map((p) => [p.date, p])), [pending]);

  // Date Selection States
  const availableDatesList = useMemo<string[]>(() => {
    const valid = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;
    const merged = new Set(availableDates.filter((d) => valid.test(String(d))));
    for (const d of runtimeDates ?? []) {
      if (valid.test(d)) merged.add(d);
    }
    // Without the pending days the picker stops at the newest day held, and a
    // reader who knows today's date reads that as a site that stopped updating.
    for (const p of pending) {
      if (valid.test(p.date)) merged.add(p.date);
    }
    return [...merged].sort();
  }, [runtimeDates, pending]);

  const bootDate = urlBoot?.date ?? latestDate;

  useMemo(() => {
    if (prefetchedDailyReports) seedDailyReportCache(prefetchedDailyReports);
    return null;
  }, [prefetchedDailyReports]);

  const [selectedDate, setSelectedDate] = useState<string>(bootDate);
  const pendingForSelected: PendingDay | null = pendingByDate.get(selectedDate) ?? null;
  // Deep links only; the picker cannot produce a date past today.
  const selectedIsFuture = isBeyondToday(selectedDate);
  // Everything the tab panels gate on. Both states replace them entirely.
  const noDayToRender = Boolean(pendingForSelected) || selectedIsFuture;
  // A pending day holds nothing, so there is nothing to gate: tier access is
  // about withholding published figures, and these are not published anywhere.
  // Wrapping rather than widening gridAccess keeps the paywall untouched.
  const canAccessDate = useCallback(
    (iso: string) => pendingByDate.has(iso) || gridAccess.canAccessDate(iso),
    [pendingByDate, gridAccess],
  );
  const [tierLockRequired, setTierLockRequired] = useState<ReturnType<typeof gridAccess.requiredTierForDate> | null>(null);
  const [activeData, setActiveData] = useState<GridDailyData | null>(() =>
    resolveInitialDailyReport(bootDate, latestDate, prefetchedDailyReports),
  );
  /**
   * The day `activeData` actually holds.
   *
   * `selectedDate` moves the instant the reader picks a date; the report for it
   * arrives a fetch later. Anything that pairs a figure on screen with a lookup
   * keyed by date has to use this, not the selection — otherwise it matches the
   * outgoing day's numbers against the incoming day's reference data. The
   * per-fuel unit-cost witness is the case that bit: for a moment it compared
   * the old day's rates to the new day's BPDB figures and marked gas, coal and
   * imports as "publishers disagree" on days where they agree exactly.
   */
  const [activeDataDate, setActiveDataDate] = useState<string | null>(
    () => resolveInitialDailyReportEntry(bootDate, latestDate, prefetchedDailyReports)?.date ?? null,
  );
  const [isLoadingDaily, setIsLoadingDaily] = useState<boolean>(
    () => !resolveInitialDailyReport(bootDate, latestDate, prefetchedDailyReports),
  );
  const latestCachedReport = useMemo(
    () => peekLatestCachedReport(latestDate) ?? (selectedDate === latestDate ? activeData : null),
    [latestDate, selectedDate, activeData],
  );
  const [isDataMissing, setIsDataMissing] = useState<boolean>(false);
  // Days for which no published source has been found — see
  // public/data/grid-verification/no-source-days.json. A day PGCB indexes but
  // that has not been downloaded is NOT in that file; this is only the days
  // nothing published can be located for.
  const [noSourceDays, setNoSourceDays] = useState<Set<string>>(new Set());
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [showMethodologyBanner, setShowMethodologyBanner] = useState(true);
  const [activeReconciliationTopic, setActiveReconciliationTopic] = useState<'gen' | 'cost' | null>(null);
  const [isMethodologyBannerExpanded, setIsMethodologyBannerExpanded] = useState(false);
  // Phones get one chip that opens the four date controls as a sheet; the row
  // itself is untouched and simply docks somewhere else below 40rem.
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  // Regional tab: below 1024px the NLDC outage log shows its first 5 events until expanded.
  const [showAllOutages, setShowAllOutages] = useState(false);
  const belowDesktop = useBelowDesktop();

  // Age badge for the active date. Extracted to lib/data/grid/backlog-badge.ts
  // when this file hit its size budget; the logic is unchanged.
  const getBacklogBadgeStyles = useCallback(
    (selected: string, latest: string) => backlogBadge(selected, latest, pendingByDate.get(selected)?.status ?? null),
    [pendingByDate],
  );

  const [isDailyYearDropdownOpen, setIsDailyYearDropdownOpen] = useState(false);
  const [isDailyMonthDropdownOpen, setIsDailyMonthDropdownOpen] = useState(false);
  const [isDailyDayDropdownOpen, setIsDailyDayDropdownOpen] = useState(false);

  const dailyYearDropdownRef = useRef<HTMLDivElement>(null);
  const dailyMonthDropdownRef = useRef<HTMLDivElement>(null);
  const dailyDayDropdownRef = useRef<HTMLDivElement>(null);

  // Split selectedDate (e.g. "2026-06-24") into year, month, day
  const [selectedYear, selectedMonth, selectedDay] = selectedDate.split('-');



  // Calculate options dynamically
  const selectAccessibleDate = useCallback((isoDate: string) => {
    if (canAccessDate(isoDate)) {
      setTierLockRequired(null);
      setSelectedDate(isoDate);
      return;
    }
    setTierLockRequired(gridAccess.requiredTierForDate(isoDate));
    setSelectedDate(isoDate);
  }, [gridAccess, canAccessDate]);

  useEffect(() => {
    let alive = true;
    fetch('/data/grid-verification/no-source-days.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.days) setNoSourceDays(new Set<string>(j.days));
      })
      .catch(() => {
        /* the notice simply does not appear if the index cannot be read */
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (gridAccess.loading) {
      if (isDateAllowedForTier(selectedDate, 'visitor', latestDate)) {
        setTierLockRequired(null);
      }
      return;
    }
    if (!gridAccess.canAccessDate(selectedDate)) {
      setTierLockRequired(gridAccess.requiredTierForDate(selectedDate));
    } else {
      setTierLockRequired(null);
    }
  }, [gridAccess, selectedDate, latestDate]);

  const years = useMemo(() => {
    return Array.from(new Set(availableDatesList.map(d => d.split('-')[0]))).sort((a, b) => b.localeCompare(a));
  }, [availableDatesList]);

  const yearOptions = useMemo(() => {
    return years.map((y) => {
      const datesInYear = availableDatesList.filter((d) => d.startsWith(`${y}-`));
      const hasAccessible = datesInYear.some((d) => gridAccess.canAccessDate(d));
      return { label: y, value: y, locked: !hasAccessible };
    });
  }, [years, availableDatesList, gridAccess]);

  const monthNames = useMemo(() => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], []);

  const monthsForYear = useMemo(() => {
    return Array.from(new Set(
      availableDatesList
        .filter(d => d.startsWith(selectedYear + '-'))
        .map(d => d.split('-')[1])
    )).sort((a, b) => a.localeCompare(b));
  }, [availableDatesList, selectedYear]);

  const monthOptions = useMemo(() => {
    return monthsForYear.map((m) => {
      const prefix = `${selectedYear}-${m}-`;
      const datesInMonth = availableDatesList.filter((d) => d.startsWith(prefix));
      const hasAccessible = datesInMonth.some((d) => gridAccess.canAccessDate(d));
      return {
        label: monthNames[parseInt(m, 10) - 1] || m,
        value: m,
        locked: !hasAccessible,
      };
    });
  }, [monthsForYear, availableDatesList, selectedYear, gridAccess, monthNames]);

  const daysForMonth = useMemo(() => {
    return Array.from(new Set(
      availableDatesList
        .filter(d => d.startsWith(selectedYear + '-' + selectedMonth + '-'))
        .map(d => d.split('-')[2])
    )).sort((a, b) => a.localeCompare(b));
  }, [availableDatesList, selectedYear, selectedMonth]);

  const dayOptions = useMemo(() => {
    return daysForMonth.map((d) => {
      const iso = `${selectedYear}-${selectedMonth}-${d}`;
      return {
        label: String(parseInt(d, 10)),
        value: d,
        locked: !canAccessDate(iso),
      };
    });
  }, [daysForMonth, selectedYear, selectedMonth, canAccessDate]);

  const handleYearChange = (newYear: string) => {
    const datesInYear = availableDatesList.filter((d) => d.startsWith(`${newYear}-`)).sort();
    if (datesInYear.length === 0) return;

    const months = Array.from(new Set(datesInYear.map((d) => d.split('-')[1]))).sort();
    let targetMonth = selectedMonth;
    if (!months.includes(targetMonth)) {
      targetMonth = months[months.length - 1];
    }

    const days = datesInYear
      .filter((d) => d.startsWith(`${newYear}-${targetMonth}-`))
      .map((d) => d.split('-')[2])
      .sort();
    if (days.length === 0) return;

    let targetDay = selectedDay;
    if (!days.includes(targetDay)) {
      targetDay = days[days.length - 1];
    }
    selectAccessibleDate(`${newYear}-${targetMonth}-${targetDay}`);
  };

  const handleMonthChange = (newMonth: string) => {
    const days = availableDatesList
      .filter((d) => d.startsWith(`${selectedYear}-${newMonth}-`))
      .map((d) => d.split('-')[2])
      .sort();
    if (days.length === 0) return;
    let targetDay = selectedDay;
    if (!days.includes(targetDay)) {
      targetDay = days[days.length - 1];
    }
    selectAccessibleDate(`${selectedYear}-${newMonth}-${targetDay}`);
  };

  const previewLockedArchiveDate = useCallback(() => {
    // One day past the tier's own window, so the sample is always locked. Hard-coded
    // day counts drift from GRID_TIER_LIMITS; derive them instead. The unlimited tier
    // has no locked date to preview, so it just lands deep in the archive.
    const { daysBack: windowDays } = gridAccess.limits;
    const daysBack = windowDays === null ? 365 * 6 : windowDays + 1;
    const sample = subtractDaysFromIso(latestDate, daysBack) ?? availableDatesList[0] ?? latestDate;
    selectAccessibleDate(sample);
  }, [gridAccess.limits, latestDate, availableDatesList, selectAccessibleDate]);

  const handleDayChange = (newDay: string) => {
    selectAccessibleDate(`${selectedYear}-${selectedMonth}-${newDay}`);
  };

  const fetchSeqRef = useRef(0);

  const visitorCanAccessSelected = isDateAllowedForTier(selectedDate, 'visitor', latestDate);

  // Dynamic Fetch Effect — stale-while-revalidate when date is already cached
  useEffect(() => {
    let isMounted = true;
    const requestSeq = ++fetchSeqRef.current;
    if (!selectedDate) return;

    // A pending day has no file to fetch and never will until PGCB files it.
    // Asking for it would 404 into the "could not be fetched" panel, which
    // blames the mirror for a report that does not exist yet.
    if (pendingByDate.has(selectedDate)) {
      setIsLoadingDaily(false);
      setIsDataMissing(false);
      setTierLockRequired(null);
      // Drop the previously selected day's payload. Leaving it in place would
      // render its figures under the pending day's date — the one mistake this
      // whole feature exists to avoid.
      setActiveData(null);
      setActiveDataDate(null);
      return;
    }

    if (gridAccess.loading && !visitorCanAccessSelected) return;

    if (!gridAccess.loading && !gridAccess.canAccessDate(selectedDate)) {
      setTierLockRequired(gridAccess.requiredTierForDate(selectedDate));
      setIsLoadingDaily(false);
      setIsDataMissing(false);
      return;
    }

    setTierLockRequired(null);
    const cached = getCachedDailyReport(selectedDate);
    if (cached) {
      setActiveData(cached);
      setActiveDataDate(selectedDate);
      setIsDataMissing(false);
      setIsLoadingDaily(false);
    } else {
      setIsLoadingDaily(true);
    }

    fetchDailyReport(selectedDate, { refresh: Boolean(cached) })
      .then(async (result) => {
        if (!isMounted || requestSeq !== fetchSeqRef.current) return;
        if (result.ok) {
          setActiveData(result.data);
          setActiveDataDate(selectedDate);
          setIsDataMissing(false);
        } else if (!result.ok && result.status === 403) {
          setTierLockRequired(gridAccess.requiredTierForDate(selectedDate));
          setIsDataMissing(false);
        } else if (!result.ok && shouldUseArchiveFallback(result.status ?? null)) {
          // No bundled fallback on the client any more: that chunk carried 31
          // full gated days to every browser (see daily-loader.client.ts).
          const stale = getCachedDailyReport(selectedDate);
          if (stale) {
            setActiveData(stale);
            setActiveDataDate(selectedDate);
            setIsDataMissing(false);
          } else {
            setActiveData(null);
            setActiveDataDate(null);
            setIsDataMissing(true);
          }
          if (result.status !== 404 && result.status !== 429) {
            console.warn(`Grid Data: ${result.error}`);
          } else if (result.status === 429) {
            console.warn('Rate limit reached (HTTP 429). Please slow down your requests.');
          }
        } else {
          const stale = getCachedDailyReport(selectedDate);
          if (stale) {
            setActiveData(stale);
            setActiveDataDate(selectedDate);
            setIsDataMissing(false);
          } else {
            setActiveData(null);
            setActiveDataDate(null);
            setIsDataMissing(true);
          }
          if (result.status !== 404 && result.status !== 429) {
            console.warn(`Grid Data: ${result.error}`);
          } else if (result.status === 429) {
            console.warn('Rate limit reached (HTTP 429). Please slow down your requests.');
          }
        }
      })
      .finally(() => {
        if (isMounted && requestSeq === fetchSeqRef.current) setIsLoadingDaily(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    selectedDate,
    gridAccess,
    visitorCanAccessSelected,
    pendingByDate,
  ]);

  const {
    systemStats,
    generationData,
    gasProductionData = [],
    gasDistributionData = [],
    borderImportsData = [],
    regionalDemandData = [],
    regionalDemandSource,
    // Zone x fuel from P1. Defaulted to [] so the card simply does not render
    // on the layouts whose P1 carries no such table.
    zoneGenerationData = [],
    // The workbook and gas PDF this day was built from, named exactly.
    sourceFiles,
    // What span of time each publisher's figures on this day actually cover.
    // Absent on days written before the field existed, in which case the page
    // reconstructs the windows from the anchor rule rather than going silent.
    observationWindows,
    // PGCB's projection FOR this day, published in the previous day's report.
    // Absent where that workbook is not held — about three quarters of the
    // archive — which is not the same as no shortfall having been expected.
    forecast,
    dailyOutages = [],
    hourlyLoadData = [],
    // Undefined, not [], on the layouts whose workbook carries no En-Curve
    // sheet — the chart renders nothing rather than an empty frame.
    energyCurveData,
    // Same for the interconnector: absent before the EWIC sheet existed.
    ewicData,
  } = activeData ?? {
    systemStats: {
      date: '',
      dayPeakGen: 0,
      eveningPeakGen: 0,
      dayPeakDemand: null,
      eveningPeakDemand: 0,
      minGen: null,
      maxGen: null,
      totalEnergyGen: 0,
      totalEnergyUnserved: null,
      totalEnergyDemand: null,
      maxTemp: null,
      totalGasSuppliedPower: 0,
      avgProductionCost: 0,
      totalDailyCost: 0,
    },
    generationData: [] as GridDailyData['generationData'],
    gasProductionData: [] as GridDailyData['gasProductionData'],
    gasDistributionData: [] as GridDailyData['gasDistributionData'],
    borderImportsData: [] as GridDailyData['borderImportsData'],
    regionalDemandData: [] as GridDailyData['regionalDemandData'],
    zoneGenerationData: [] as GridDailyData['zoneGenerationData'],
    dailyOutages: [] as GridDailyData['dailyOutages'],
    hourlyLoadData: [] as GridDailyData['hourlyLoadData'],
    energyCurveData: undefined as GridDailyData['energyCurveData'],
  };

  // Dynamic Gas Production & Supply calculations
  const safeGasProductionData = gasProductionData || [];
  const totalGasSupply = safeGasProductionData.reduce((sum, item) => sum + (item.gas || 0), 0);
  // A day can carry PGCB grid data while the matching Petrobangla report is not
  // out yet. Summing an empty table yields 0, which would render as a factual
  // "0.0 MMCFD" national gas supply — distinguish absent from genuinely zero.
  //
  // The row COUNT cannot make that distinction: a day without gas is written
  // with the six company rows zeroed, because the site keys its empty state off
  // their presence. So `length > 0` was true on exactly the days this guard
  // exists for, and 2026-08-08 published "0 MMCFD" as the national gas supply
  // on the day PGCB's report arrived and Petrobangla's had not. The country
  // has never produced zero gas; that figure can only mean "not published".
  const hasGasProductionData = safeGasProductionData.length > 0 && totalGasSupply > 0;
  const totalCondensate = safeGasProductionData.reduce((sum, item) => sum + (item.condensate || 0), 0);

  // Chevron IOC Supply
  const chevronItem = safeGasProductionData.find(item => item.company.toLowerCase().includes('chevron'));
  const chevronGas = chevronItem ? chevronItem.gas : 0;
  const chevronPct = totalGasSupply > 0 ? (chevronGas / totalGasSupply) * 100 : 0;

  // Tullow IOC Supply
  const tullowItem = safeGasProductionData.find(item => item.company.toLowerCase().includes('tullow'));
  const tullowGas = tullowItem ? tullowItem.gas : 0;
  const tullowPct = totalGasSupply > 0 ? (tullowGas / totalGasSupply) * 100 : 0;

  // Imported LNG (RPGCL)
  const rpgclItem = safeGasProductionData.find(item => item.company.toLowerCase().includes('rpgcl') || item.company.toLowerCase().includes('lng'));
  const importedLngGas = rpgclItem ? rpgclItem.gas : 0;
  const importedLngPct = totalGasSupply > 0 ? (importedLngGas / totalGasSupply) * 100 : 0;

  // State Field Output (BGFCL + SGFL + BAPEX)
  const stateFields = safeGasProductionData.filter(item => 
    item.company.toLowerCase().includes('bgfcl') || 
    item.company.toLowerCase().includes('sgfl') || 
    item.company.toLowerCase().includes('bapex')
  );
  const stateFieldsGas = stateFields.reduce((sum, item) => sum + item.gas, 0);
  const stateFieldsPct = totalGasSupply > 0 ? (stateFieldsGas / totalGasSupply) * 100 : 0;

  const tooltipDate = systemStats?.date && systemStats.date.split(' ').length === 3
    ? systemStats.date.split(' ').slice(1).join(' ')
    : (systemStats?.date || 'Jun 2026');

  // The Petrobangla tile used to carry `tooltipDate` — the PGCB date — under a
  // heading naming Petrobangla's report. That states something Petrobangla does
  // not: its PDF prints a RANGE and an 8:00-to-8:00 period, and its gas day
  // shares only 16 hours with PGCB's energy day. This is the window the figures
  // on that tile actually cover, taken from the archive where the day carries
  // one and reconstructed from the anchor rule where it does not.
  const gasWindow = observationWindows?.petrobangla;
  const gasWindowLabel = gasWindow
    ? `${gasWindow.publishedLabel ?? selectedDate} · ${formatWindow(
        {
          publisher: 'Petrobangla',
          start: gasWindow.start,
          end: gasWindow.end,
          anchorDay: selectedDate,
        },
        { offset: false },
      )}`
    : `${petrobanglaGasDay(selectedDate).publishedLabel} · ${formatWindow(
        petrobanglaGasDay(selectedDate),
        { offset: false },
      )}`;


  const [activeTab, setActiveTab] = useState<'overview' | 'gen' | 'gas' | 'imports' | 'renewables' | 'transmission' | 'regional' | 'macro' | 'plants' | 'timemachine'>(
    urlBoot?.tab ?? 'overview',
  );
  
  const activeScrollIdRef = useRef<number | null>(null);
  const tabScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerScrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      if (activeScrollIdRef.current !== null) {
        cancelAnimationFrame(activeScrollIdRef.current);
        activeScrollIdRef.current = null;
      }

      const navbar = document.querySelector('.public-nav-bar');
      const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 0;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      // Phone/tablet: the sticky context bar sits under the navbar, so the
      // target must clear it too (0 on desktop, where the bar is display:none).
      const shellBar = document.querySelector('[data-ge-shell-bar]');
      const shellBarHeight = shellBar ? shellBar.getBoundingClientRect().height : 0;
      const targetY = elementPosition - navbarHeight - shellBarHeight - 24;
      
      const startY = window.scrollY;
      const difference = targetY - startY;

      // If already pixel-perfect target position, skip animation to avoid layout jitter
      if (Math.abs(difference) < 2) {
        return;
      }
      const duration = 420;
      const startTime = performance.now();

      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      };

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeInOutCubic(progress);
        
        window.scrollTo(0, startY + difference * ease);

        if (progress < 1) {
          activeScrollIdRef.current = requestAnimationFrame(step);
        } else {
          activeScrollIdRef.current = null;
        }
      };

      activeScrollIdRef.current = requestAnimationFrame(step);
    }
  };

  // While the explorer is mounted, mark <html> so grid-explorer-mobile.css can
  // hide the fixed commodities ticker below 1024px (it sits over the bottom of
  // the screen where the thumb works). CSS-only otherwise.
  useEffect(() => {
    document.documentElement.classList.add('ge-active');
    return () => document.documentElement.classList.remove('ge-active');
  }, []);

  const handleTabClick = (tabId: typeof activeTab) => {
    const foldsCategoryRibbon = (tabId !== 'overview') !== (activeTab !== 'overview');
    setActiveTab(tabId);
    if (tabScrollTimerRef.current) clearTimeout(tabScrollTimerRef.current);
    // The navbar folds its category ribbon away on any tab but Overview
    // (PublicNavbar, `gridImmersive`), which changes the navbar's height and so
    // the scroll target. `triggerScrollToElement` measures that height once and
    // animates against a fixed distance, so scrolling while the ribbon is still
    // folding lands short and then jumps as the document settles. Wait for the
    // 260ms fold when it is happening; keep the old 50ms when it is not. The
    // fold is itself the immediate feedback, so the wait does not read as lag.
    tabScrollTimerRef.current = setTimeout(
      () => {
        tabScrollTimerRef.current = null;
        triggerScrollToElement('grid-status-overview-header');
      },
      foldsCategoryRibbon ? 300 : 50,
    );
  };

  useEffect(() => {
    return () => {
      if (tabScrollTimerRef.current) clearTimeout(tabScrollTimerRef.current);
      if (activeScrollIdRef.current !== null) {
        cancelAnimationFrame(activeScrollIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('esb-grid-tab-change', { detail: { tab: activeTab } }));
    }
  }, [activeTab]);

  const [macroSubTab, setMacroSubTab] = useState<'overview' | 'budget' | 'monthly' | 'pricing' | 'global' | 'reports' | 'reserves' | 'system_loss' | 'insights' | 'verification'>(
    urlBoot?.macro ?? 'overview',
  );
  
  const handleSubTabClick = (subTabId: typeof macroSubTab) => {
    setMacroSubTab(subTabId);
  };
  const chartsReady = Boolean(activeData);
  const macroChartsReady = true;
  const pieGenerationData = useMemo(
    () => generationData.filter((d) => Number(d.gen) > 0 && Number.isFinite(Number(d.gen))),
    [generationData],
  );
  const hasGenerationChartData = pieGenerationData.length > 0;


  const dailyCostChartData = useMemo(
    () =>
      generationData
        .filter((d) => (d.cost ?? 0) > 0)
        .map((d) => ({ ...d, costCrore: (d.cost ?? 0) / BDT_TO_CRORE })),
    [generationData],
  );

  // The hour of highest published demand — the argmax of measured points, not
  // of a synthesised profile. On the older layouts only one hour carries a
  // demand figure at all, so this is that hour.
  const peakDemandTime = useMemo(() => {
    const withDemand = hourlyLoadData.filter((h) => h.demand != null);
    if (!withDemand.length) return null;
    return [...withDemand].sort((a, b) => (b.demand ?? 0) - (a.demand ?? 0))[0]?.time ?? null;
  }, [hourlyLoadData]);

  // Whether this day's report states demand and shedding for every hour (the
  // P4 sheet) or for the evening peak alone (P1, on the layouts without a P4).
  // The chart draws continuous series in the first case and single marked
  // points in the second, because drawing a line through one point implies a
  // profile that was never measured.
  const curveIsHourly = useMemo(
    () => hourlyLoadData.length > 1
      && hourlyLoadData.filter((h) => h.demand != null).length === hourlyLoadData.length,
    [hourlyLoadData],
  );

  // Whether shedding is published hourly is a separate question from whether
  // demand is. PGCB's 2018-2024 YesterdayGen sheet carries a "Shortage" column
  // at every hourly stamp but no demand column, and the parser leaves demand
  // null rather than deriving it (scripts/parse_daily_reports.py:290-296).
  // Gating the shedding panel on `curveIsHourly` therefore hid a full published
  // shedding series on 1,274 days — 360 of them with load genuinely shed,
  // including the 2022 and 2023 crises — while the card told the reader the
  // report published an evening-peak figure only.
  const sheddingIsHourly = useMemo(
    () => hourlyLoadData.filter((h) => h.loadShed != null).length > 1,
    [hourlyLoadData],
  );

  // Shedding runs two orders of magnitude below generation — 30 MW against
  // 15,000 on a good hour — so on a shared axis the series is a flat line on
  // the floor. Its own axis is what makes the shape readable.
  const peakShedOfDay = useMemo(
    () => hourlyLoadData.reduce((mx, h) => Math.max(mx, h.loadShed ?? 0), 0),
    [hourlyLoadData],
  );

  // Shedding sits under the hours that produced it rather than in a separate
  // panel below the card. It has no axis of its own: on the generation scale it
  // would flatten onto the floor, and a second axis only hides that two
  // quantities do not share a scale. It runs as an intensity strip along the
  // foot of the plot instead, sized against the day's own worst hour.
  //
  // The headroom multiplier keeps the bars inside the bottom third of the plot
  // so they never climb through the load curves. It changes how tall the bars
  // are drawn, not what they say: the ticks beside them state the real MW.
  // Three times the day's worst hour, so the tallest bar reaches a third of the
  // plot and the load curves keep the rest of it.
  //
  // The ticks are placed by hand rather than left to Recharts, which would fill
  // the whole domain and print a round ceiling — 10.0k MW on a day that shed
  // 2,958. They stop at the day's own peak instead, so the topmost tick sits
  // exactly at the top of the tallest bar and every label names a value the
  // reader can actually find on the chart.
  const shedAxis = useMemo(() => {
    if (peakShedOfDay <= 0) return { max: 0, ticks: [0] };
    return {
      max: peakShedOfDay * 3,
      ticks: [0, Math.round(peakShedOfDay / 2), Math.round(peakShedOfDay)],
    };
  }, [peakShedOfDay]);
  const showShedding = peakShedOfDay > 0;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredCostIndex, setHoveredCostIndex] = useState<number | null>(null);


  // Click outside listener for all custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dailyYearDropdownRef.current && !dailyYearDropdownRef.current.contains(target)) {
        setIsDailyYearDropdownOpen(false);
      }
      if (dailyMonthDropdownRef.current && !dailyMonthDropdownRef.current.contains(target)) {
        setIsDailyMonthDropdownOpen(false);
      }
      if (dailyDayDropdownRef.current && !dailyDayDropdownRef.current.contains(target)) {
        setIsDailyDayDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabGlowColors: Record<typeof activeTab, { blob1: string; blob2: string; blob3: string }> = {
    timemachine: {
      blob1: 'bg-primary/5',
      blob2: 'bg-indigo-500/4',
      blob3: 'bg-slate-500/3',
    },
    overview: {
      blob1: 'bg-primary/5',
      blob2: 'bg-sky-500/4',
      blob3: 'bg-amber-500/3',
    },
    gen: {
      blob1: 'bg-primary/6',
      blob2: 'bg-blue-600/4',
      blob3: 'bg-cyan-500/3',
    },
    gas: {
      blob1: 'bg-sky-500/6',
      blob2: 'bg-cyan-600/4',
      blob3: 'bg-teal-500/3',
    },
    imports: {
      blob1: 'bg-purple-500/6',
      blob2: 'bg-indigo-600/4',
      blob3: 'bg-violet-500/3',
    },
    renewables: {
      blob1: 'bg-yellow-500/6',
      blob2: 'bg-amber-500/4',
      blob3: 'bg-orange-400/3',
    },
    transmission: {
      blob1: 'bg-blue-500/6',
      blob2: 'bg-sky-600/4',
      blob3: 'bg-indigo-500/3',
    },
    regional: {
      blob1: 'bg-slate-500/6',
      blob2: 'bg-zinc-500/4',
      blob3: 'bg-sky-500/3',
    },
    macro: {
      blob1: 'bg-emerald-500/6',
      blob2: 'bg-teal-500/4',
      blob3: 'bg-primary/3',
    },
    plants: {
      blob1: 'bg-sky-500/6',
      blob2: 'bg-indigo-500/4',
      blob3: 'bg-primary/3',
    },
  };

  const glow = tabGlowColors[activeTab] || tabGlowColors.overview;

  interface TabInfo {
    id: 'overview' | 'gen' | 'gas' | 'imports' | 'renewables' | 'transmission' | 'regional' | 'macro' | 'plants' | 'pricing' | 'timemachine';
    label: string;
    icon: any;
  }

  // Tab order follows the reader's question chain, not the data's provenance.
  // Twenty years of daily power coverage in Bangladesh asks the same questions
  // in the same order: how bad is the shortfall today (Overview) → where is it
  // worst, is my area shedding (Regional) → why, what fuel is short (Gas) →
  // what ran instead and at what cost (Generation) → which stations stood
  // idle (Power Stations) → are imports covering the gap (C/B Imports) → what
  // is the alternative (Renewables) → where is this all heading (Macro).
  // Technical Information is a standing reference, so it closes the bar.
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'regional', label: 'Regional Grid', icon: Cable },
    { id: 'gas', label: 'Gas & LNG Supply', icon: Droplet },
    { id: 'gen', label: 'Generation & Cost', icon: Zap },
    { id: 'plants', label: 'Power Stations', icon: Factory },
    { id: 'imports', label: 'C/B Imports', icon: Globe },
    // Named for the subject, not the publisher, like every other tab here. The
    // source is still SREDA alone — the agencies its tables name (BPDB, NWPGCL,
    // EGCB, BREB, IDCOL…) are the owners SREDA attributes capacity to, not
    // second publishers — so attribution stays on each card, where a reader
    // checking a figure looks, rather than in the tab bar.
    { id: 'renewables', label: 'Renewables', icon: Sun },
    { id: 'macro', label: 'Macro Trends', icon: TrendingUp },
    { id: 'transmission', label: 'Technical Information', icon: Activity },
  ] as const;

  /** Daily PGCB tabs where gross vs net fuel/cost reconciliation applies */
  const methodologyTabIds = ['overview', 'gen', 'gas', 'imports'] as const;
  const showMethodologyForActiveTab = (methodologyTabIds as readonly string[]).includes(activeTab);

  useEffect(() => {
    if (!showMethodologyForActiveTab) {
      setIsMethodologyBannerExpanded(false);
    }
  }, [showMethodologyForActiveTab]);


  // Overview calculations
  // The outage log runs to thirty-odd entries on a normal day and more on a bad
  // one. Paged like every other long list rather than left as a scroll well.

  const totalGenMkwhr = generationData.reduce((sum, item) => sum + item.gen, 0);
  const totalCostBdt = generationData.reduce((sum, item) => sum + (item.cost ?? 0), 0);

  // --- East-West Interconnector -------------------------------------------
  // Absent on every layout before the EWIC sheet existed, so every consumer
  // below is written to fall away rather than render an empty frame.
  const ewic = ewicData ?? null;
  // Exports only: the day's transfer is what crossed, and pairing it with a
  // zero import line would imply the two net off.
  const ewicTotalMkwh = ewic?.totals?.export != null ? ewic.totals.export / 1e6 : null;
  /**
   * A transfer between two halves of the same grid cannot exceed what the grid
   * generated. On 2026-06-25 PGCB prints Ishurdi-Ghorashal Ckt-2 at 2.9 billion
   * kWh against a MW curve that integrates to 3.99 million — a source defect the
   * sheet's own reconciliation catches at 0.00x — which totals to 2,964 MKWh
   * against a national day of 332. The figure is still shown, because it is what
   * the report says, but the derived share is withheld: dividing their bad
   * number by our good one to announce "892% of national generation" would be
   * our arithmetic asserting something physically impossible.
   */
  const ewicExceedsGeneration =
    ewicTotalMkwh != null && totalGenMkwhr > 0 && ewicTotalMkwh > totalGenMkwhr;
  const ewicShareOfGen =
    ewicTotalMkwh != null && totalGenMkwhr > 0 && !ewicExceedsGeneration
      ? (ewicTotalMkwh / totalGenMkwhr) * 100
      : null;
  /**
   * One direction for the day, so nothing on the card can contradict itself.
   *
   * Mean rather than peak: a corridor that spikes for one hour and idles for
   * twenty-three should not set the day's direction. The sign is honoured even
   * though no corridor in the archive has ever reported a negative reading,
   * because the day one does, this follows it rather than restating a
   * convention the data no longer supports. Lane widths and speeds inside the
   * crossing diagram are the canvas's own business — it has the rows.
   */
  const ewicNet = useMemo(() => {
    const rows = ewic?.rows ?? [];
    if (!rows.length) return null;
    const net = rows.reduce(
      (sum, r) => sum + r.mw.reduce((s: number, v) => s + (typeof v === 'number' ? v : 0), 0),
      0,
    );
    return net === 0 ? null : { westToEast: net > 0 };
  }, [ewic]);

  /**
   * The hour at which the corridors together carry the most.
   *
   * This is the figure PGCB itself prints on P1 as "Maximum Power Flow (W-E)" —
   * on 2026-08-15 the corridor sum peaks at 2,011 MW at 12:00 and P1 states
   * 2,011 MW, and the EWIC sheet's Total Export matches P1's "Energy Flow from
   * West to East" to the kWh. Two sheets, independently parsed, agreeing: that
   * is what establishes that "Export" here means west-to-east at all.
   */
  const ewicPeakSum = useMemo(() => {
    let best: { mw: number; time: string } | null = null;
    for (const r of ewic?.rows ?? []) {
      const sum = r.mw.reduce((acc: number, v) => acc + (typeof v === 'number' ? v : 0), 0);
      if (!best || Math.abs(sum) > Math.abs(best.mw)) best = { mw: sum, time: r.time };
    }
    return best;
  }, [ewic]);

  const ewicCircuitBars = useMemo(() => {
    const rows = (ewic?.circuits ?? []).filter((c) => c.direction === 'Export' && (c.energyKwh ?? 0) > 0);
    const max = Math.max(...rows.map((c) => c.energyKwh ?? 0), 0);
    return rows
      .map((c) => ({
        circuit: c.circuit,
        energyKwh: c.energyKwh ?? 0,
        pct: max > 0 ? ((c.energyKwh ?? 0) / max) * 100 : 0,
        // Both circuits of a corridor take that corridor's line colour, so the
        // bars and the curve above them name the same thing the same way.
        corridorIndex: Math.max(0, (ewic?.corridors ?? []).findIndex((n) => c.circuit.startsWith(n))),
      }))
      .sort((a, b) => b.energyKwh - a.energyKwh);
  }, [ewic]);
  // Summing nulls yields 0, which would read as "this day cost nothing to
  // generate" rather than "the report carries no production-cost block".
  const hasPublishedFuelCost = generationData.some((item) => item.cost != null);
  // PGCB prices imports as a single line in its production-cost table — one
  // figure covering every interconnector. The cost is published and shown; the
  // Tk/kWh it implies is not, and no longer derived here: one average across
  // three separate commercial agreements reads as a price Bangladesh pays, or
  // as one supplier's tariff, and the report supports neither.
  const importsCost = generationData.find((g) => g.name === 'Imports')?.cost ?? null;
  const importsEnergyMkwh = generationData.find((g) => g.name === 'Imports')?.gen ?? null;
  const avgCostPerKwh = totalCostBdt / (totalGenMkwhr * 1000000);
  // What stands behind each per-fuel unit rate: a second agency's independent
  // arithmetic, a flat administered tariff, or only the one publisher.
  //
  // Keyed to the day the rates on screen belong to, not the day selected — see
  // activeDataDate. Keying it to the selection made the badge compare the
  // outgoing day's rates against the incoming day's BPDB figures, which flashed
  // "publishers disagree" on days where they agree to four decimals.
  const unitCostAuth = useUnitCostAuthentication(activeDataDate);

  // The window strip sits above the methodology banner because it answers the
  // more basic question: the banner explains why two totals on one page differ,
  // and this explains what "this day" even means to each publisher. A reader
  // who has not been told the gas day is 08:00-to-08:00 cannot make sense of
  // either.
  // Which tabs have anything for THIS day. The bar renders all ten whatever
  // the date, and before this a reader on a 2015 day met several tabs that were
  // empty because that era's workbook has no such sheet — indistinguishable, on
  // screen, from a day on which nothing happened.
  // Only claim a tab is empty once the day's own report is in hand. On the
  // server pass `activeData` is whatever was prefetched — often the previous
  // selection or nothing — and computing availability from it published a
  // false "Petrobangla has nothing for this day" into the HTML for a day that
  // has 2,275 MMCFD of it. Absence has to be verified before it is asserted,
  // so until the payload matches the selection every tab renders unmarked.
  // True only when the payload in hand IS the selected day's: `activeData`
  // keeps the previous day while a new selection resolves. Governs the tab
  // availability map and, below, whether any figure may be printed at all.
  const figuresHeldForSelected = Boolean(activeData) && activeDataDate === selectedDate;
  const availability = figuresHeldForSelected ? tabAvailability(activeData) : null;

  // The same verdict the tab bar dims on, listed in full so a reader who never
  // clicks an empty tab still learns the day is thinner than the layout looks.
  const absentTabs = availability
    ? tabs
        .filter((t) => {
          const a = availability[t.id as GridTabId];
          return a && !a.hasData;
        })
        .map((t) => ({
          id: t.id as GridTabId,
          label: t.label,
          reason: availability[t.id as GridTabId]?.reason ?? 'Not published for this day.',
        }))
    : [];

  const dayWindowStrip = (
    <GridDayWindows
      isoDate={selectedDate}
      windows={observationWindows}
      hasGas={hasGasProductionData}
      absentTabs={absentTabs}
    />
  );

  // What re-reading this day's source found, said before the figures rather
  // than after. Shown only when there is something a reader should weigh:
  // a day never re-checked, one read by a reconstructed parser, or one whose
  // published figures are known to disagree with the document they cite.
  // How far behind the archive is. Ingestion is manual, so the newest day
  // held is not necessarily the newest day that exists — and the badge on it
  // says LATEST either way. State the lag rather than let the badge imply
  // there is none.
  const freshness = assessFreshness(latestDate ?? null);
  const provenance = describeDayProvenance(selectedDate, verificationLedger?.[selectedDate]);
  const provenanceNote = (
    <>
      {freshness?.note ? (
        <aside
          className={cn(
            'mb-4 flex items-start gap-2.5 rounded-xl border px-3 py-2.5',
            freshness.level === 'stale'
              ? 'border-amber-500/25 bg-amber-500/[0.04]'
              : 'border-border/30 bg-muted/10',
          )}
          aria-label="Archive freshness"
        >
          <Activity className="mt-[1px] h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold leading-tight">
              Archive is {freshness.daysBehind} days behind
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{freshness.note}</p>
          </div>
        </aside>
      ) : null}
      {provenanceNeedsDisclosure(provenance) ? (
        <SourceProvenanceNote provenance={provenance} />
      ) : null}
    </>
  );

  const methodologyBanner = showMethodologyBanner ? (
    <MethodologyReconciliationBanner
      expanded={isMethodologyBannerExpanded}
      onToggleExpanded={() => setIsMethodologyBannerExpanded((open) => !open)}
      onHide={() => setShowMethodologyBanner(false)}
      reportDate={systemStats.date}
      netEnergyGenMkwh={systemStats.totalEnergyGen ?? 0}
      grossEnergyGenMkwh={totalGenMkwhr}
      netDailyCostBdt={systemStats.totalDailyCost}
      grossDailyCostBdt={totalCostBdt}
    />
  ) : null;

  // Regional calculations
  const totalRegionalDemand = regionalDemandData.reduce((sum, rd) => sum + rd.demand, 0);
  const totalRegionalLoadShed = regionalDemandData.reduce((sum, rd) => sum + rd.loadShed, 0);
  const avgRegionalPct = totalRegionalDemand > 0 ? ((totalRegionalLoadShed / totalRegionalDemand) * 100).toFixed(1) : '0.0';

  // P1's own stamp for the hour the evening peak was measured. Not claimed on
  // BPDB-sourced days: that zone table is a different publisher's reading and
  // PGCB's stamp does not describe it.
  const eveningPeakStamp = regionalDemandSource === 'bpdb-published'
    ? null
    : systemStats.peakTimes?.eveningPeakDemand ?? null;

  // Zone-wise generation columns: the fuels this day actually published, in
  // FUEL_DISPLAY_ORDER so the sequence holds across report layouts. Driven from
  // the payload's own keys rather than filtering FUEL_DISPLAY_ORDER directly —
  // the archive writes 'HSD' where the palette keys on 'HSD (Diesel)', so
  // matching without canonicalising drops that column entirely.
  const zoneGenFuelOrder = FUEL_DISPLAY_ORDER as readonly string[];
  const zoneGenFuels = Array.from(
    new Set(zoneGenerationData.flatMap((zg) => Object.keys(zg.fuels))),
  ).sort((a, b) => {
    const rank = (name: string) => {
      const idx = zoneGenFuelOrder.indexOf(canonicalFuelName(name));
      // A fuel the order does not list sorts to the end rather than the front.
      return idx === -1 ? zoneGenFuelOrder.length : idx;
    };
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  const zoneGenNationalTotal = zoneGenerationData.reduce((sum, zg) => sum + zg.total, 0);
  // PGCB's own Total row, which is what `generationData` already holds. Used in
  // preference to summing the zone rows so the footer stays a published figure;
  // the sum is only the check on it.
  // A record, not a Map — `Map` is the lucide icon in this file's scope.
  const zoneGenPublishedTotals: Record<string, number> = Object.fromEntries(
    generationData.map((g) => [g.name, g.gen]),
  );
  // MKWh spans four orders of magnitude here (0.0016 Barishal solar to 75.6
  // Chattogram total). Rounding the small ones to 0.00 would print a published
  // non-zero as nothing, so they are floored to a visible marker instead.
  const formatZoneEnergy = (value: number | undefined) => {
    if (value === undefined) return '—';
    if (value === 0) return '0';
    if (value < 0.01) return '<0.01';
    return value.toFixed(2);
  };

  return (
    <>
      <GridExplorerUrlSyncer
        activeTab={activeTab}
        selectedDate={selectedDate}
        macroSubTab={macroSubTab}
        latestDate={latestDate}
      />
      <div className="grid-explorer ge-root relative print:hidden">
      {/* Phone/tablet context bar: day + section, sticky for the whole page.
          Reuses the existing date sheet; desktop keeps the tab row below. */}
      <GridExplorerMobileShell
        dateLabel={systemStats.date || isoDateToLegacy(selectedDate) || selectedDate}
        isLatest={selectedDate === latestDate}
        dateSheetOpen={isDateSheetOpen}
        onOpenDate={() => setIsDateSheetOpen(true)}
        sections={[
          ...tabs.map((t) => {
            const a = availability?.[t.id as GridTabId];
            return {
              id: t.id,
              label: t.label,
              icon: t.icon,
              hint: SECTION_HINTS[t.id] ?? '',
              empty: a ? !a.hasData : false,
              reason: a?.reason,
            };
          }),
          // The Time Machine has no desktop tab (it is reached by URL/links), so a
          // phone reader had no way in. It is a tenth row of the section sheet only;
          // the desktop tab bar above is unchanged.
          { id: 'timemachine', label: 'Time Machine', icon: History, hint: SECTION_HINTS.timemachine },
        ]}
        activeId={activeTab}
        onSelect={(id) => handleTabClick(id as typeof activeTab)}
      />

      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-3xl" aria-hidden="true">
        {/* Glow Blobs */}
        {/* Fixed offsets from the top, not percentages of the container's
            height. The wrapper is inset-0, so as each tab's content streamed
            in and the explorer grew, `top-[45%]` and `bottom-[15%]` moved
            the blobs down the page — Lighthouse scored it as a 0.128 layout
            shift on the flagship page (2026-09-02, SEO_FIX_LOG stage 7). */}
        <div className={cn("absolute top-8 left-[10%] w-[35rem] h-[35rem] rounded-full blur-[120px] grid-glow-blob-1 transition-colors duration-1000", glow.blob1)} />
        <div className={cn("absolute top-[70rem] right-[5%] w-[30rem] h-[30rem] rounded-full blur-[130px] grid-glow-blob-2 transition-colors duration-1000", glow.blob2)} />
        <div className={cn("absolute top-[38rem] left-[45%] w-[38rem] h-[38rem] rounded-full blur-[140px] grid-glow-blob-3 transition-colors duration-1000", glow.blob3)} />
      </div>

      <style>{`
        @keyframes grid-glow-float-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes grid-glow-float-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.05); }
          33% { transform: translate(-40px, 30px) scale(0.95); }
          66% { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes grid-glow-float-3 {
          0%, 100% { transform: translate(0px, 0px) scale(0.95); }
          33% { transform: translate(40px, 40px) scale(1.02); }
          66% { transform: translate(-30px, -30px) scale(0.98); }
        }
        .grid-glow-blob-1 {
          animation: grid-glow-float-1 25s infinite ease-in-out;
        }
        .grid-glow-blob-2 {
          animation: grid-glow-float-2 30s infinite ease-in-out;
        }
        .grid-glow-blob-3 {
          animation: grid-glow-float-3 35s infinite ease-in-out;
        }
        .grid-explorer .card {
          background-color: color-mix(in srgb, hsl(var(--card)) 94%, transparent) !important;
          border-color: hsl(var(--border) / 0.55) !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .grid-explorer .card:hover {
          border-color: hsl(var(--primary) / 0.25) !important;
          box-shadow: 0 12px 30px -10px hsl(var(--primary) / 0.08), var(--shadow-lg) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .grid-glow-blob-1,
          .grid-glow-blob-2,
          .grid-glow-blob-3 {
            animation: none !important;
          }
        }
      `}</style>

      <GridAccessBanner
        access={gridAccess}
        totalArchiveDays={availableDatesList.length}
        compactOnPhone={activeTab !== 'overview'}
        className="mb-4 relative z-50"
      />

      {/*
        Stated, not implied: on these days no published source has been found
        at all — nothing held here and nothing in PGCB's own archive index —
        so the figures below are shown as they stand, uncorroborated. Days the
        agency publishes but we have not yet downloaded are deliberately NOT
        in this set; that gap is ours, and calling it an absence of publication
        would be an assumption.
      */}
      {noSourceDays.has(selectedDate) && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 relative z-50">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            No published source has been found for {selectedDate}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            No daily report for this date is held here, and PGCB&rsquo;s published
            archive index carries no entry for it. Everything shown below is
            reproduced as it stands and has not been checked against a source
            document. Nothing has been assumed, reconstructed or carried over
            from a neighbouring day to fill the gap.
          </p>
        </div>
      )}

      {/* Date Selector Header */}
      {/* z-[60] beats the locked-panel overlay's z-[55]. This row is the stacking context
          for the date dropdowns, so their menus can never rise above whatever it sits at —
          at z-50 the open day menu rendered underneath the lock overlay. */}
      <div id="grid-status-overview-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 relative z-[60]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 shrink-0 text-primary" />
            Grid Status Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center flex-wrap gap-1">
            {/* A pending day has no payload, so systemStats.date is undefined
                and the header read "Active reporting date:" followed by
                nothing. Fall back to the selection itself. */}
            Active reporting date: <span className="font-semibold text-primary">{systemStats.date || isoDateToLegacy(selectedDate) || selectedDate}</span>
            {(() => {
              const badge = getBacklogBadgeStyles(selectedDate, latestDate);
              return (
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold ml-1 uppercase tracking-wider transition-all duration-300 inline-block align-middle", badge.className, tierLockRequired && 'opacity-50')}>
                  {badge.text}
                </span>
              );
            })()}
            {!showMethodologyBanner && showMethodologyForActiveTab && (
              <span className="relative group inline-flex items-center align-middle">
                <button
                  type="button"
                  onClick={() => {
                    setShowMethodologyBanner(true);
                    setIsMethodologyBannerExpanded(true);
                  }}
                  className="text-primary hover:text-primary-focus transition-colors ml-1.5 p-0.5 inline-flex items-center justify-center"
                  aria-label="Restore methodology banner"
                >
                  <Info className="h-3.5 w-3.5 shrink-0" />
                </button>
                {/* Theme-compliant Tooltip */}
                <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border border-border/80 text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-xl pointer-events-none opacity-0 scale-95 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 z-[100] whitespace-nowrap">
                  Restore Methodology Banner
                </span>
              </span>
            )}
          </p>
        </div>
        {/* Phone trigger. Four stacked full-width controls were most of the
            first screen; this is one line that says which day is on screen and
            opens the same controls when a reader actually wants to change it. */}
        <button
          type="button"
          onClick={() => setIsDateSheetOpen(true)}
          className="grid-explorer-date-chip"
          aria-expanded={isDateSheetOpen}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-bold">{systemStats.date || selectedDate}</span>
          {selectedDate === latestDate && <span className="grid-explorer-date-chip__tag">Latest</span>}
          <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>

        {/* Backdrop, phone only — a tap outside closes without hunting for an X. */}
        <div
          className={cn('grid-explorer-date-scrim', isDateSheetOpen && 'is-open')}
          onClick={() => setIsDateSheetOpen(false)}
          aria-hidden
        />

        <div className={cn('grid-explorer-date-dock', isDateSheetOpen && 'is-open')}>
          <div className="grid-explorer-date-dock__head">
            <span>Choose a reporting date</span>
            <button
              type="button"
              onClick={() => setIsDateSheetOpen(false)}
              className="grid-explorer-date-dock__close"
              aria-label="Close date picker"
            >
              Done
            </button>
          </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          {/* TODAY Reset Button — sized to match the Year control exactly */}
          <div className="w-full sm:w-28">
            <button
              type="button"
              onClick={() => selectAccessibleDate(latestDate)}
              className="grid-explorer-control w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-transparent hover:bg-muted/10 hover:border-primary/30 shadow-sm text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Latest</span>
            </button>
          </div>

          {/* The event-study door — its own file, because the size ratchet
              refused it inline (component-size.test.ts). */}
          <EventStudyDateLink selectedDate={selectedDate} />

          <div className="w-full sm:w-28 relative z-50">
            <CustomDropdown
              value={selectedYear}
              onChange={handleYearChange}
              options={yearOptions}
              placeholder="Year"
              isOpen={isDailyYearDropdownOpen}
              setIsOpen={setIsDailyYearDropdownOpen}
              dropdownRef={dailyYearDropdownRef}
              icon={<Calendar className="h-3.5 w-3.5 text-primary shrink-0" />}
              prefixLabel="Year:"
              layout="grid"
              gridColumns={3}
              menuWidth="12rem"
              noBackground={true}
              hideDecorationsOnSelect={true}
            />
          </div>

          <div className="w-full sm:w-36 relative z-50">
            <CustomDropdown
              value={selectedMonth}
              onChange={handleMonthChange}
              options={monthOptions}
              placeholder="Month"
              isOpen={isDailyMonthDropdownOpen}
              setIsOpen={setIsDailyMonthDropdownOpen}
              dropdownRef={dailyMonthDropdownRef}
              icon={<FileText className="h-3.5 w-3.5 text-primary shrink-0" />}
              prefixLabel="Month:"
              layout="grid"
              gridColumns={3}
              menuWidth="18rem"
              noBackground={true}
              hideDecorationsOnSelect={true}
            />
          </div>

          <div className="w-full sm:w-28 relative z-50">
            <CustomDropdown
              value={selectedDay}
              onChange={handleDayChange}
              options={dayOptions}
              placeholder="Day"
              isOpen={isDailyDayDropdownOpen}
              setIsOpen={setIsDailyDayDropdownOpen}
              dropdownRef={dailyDayDropdownRef}
              icon={<Activity className="h-3.5 w-3.5 text-primary shrink-0" />}
              prefixLabel="Day:"
              layout="grid"
              gridColumns={6}
              menuWidth="18rem"
              noBackground={true}
              hideDecorationsOnSelect={true}
              align="right"
            />
          </div>
        </div>
        </div>
      </div>

      <div className="min-h-[280px]">
      {/* KPI Strip */}
      {/* The page strip reads whatever payload is loaded. On a pending day
          there is none, and rendering it anyway prints this strip's fallbacks
          under a date nobody has measured. PendingDayPanel below carries the
          same six tiles with every figure a dash instead. */}
      {/* Nothing read for this day: the strip's zero-filled fallback printed
          "Evening Peak Gen: 0 MW" on a locked day (production, 2026-09-19).
          Dashes hold the layout instead — see AbsentFiguresStrip. */}
      {!pendingForSelected && !figuresHeldForSelected && (
        <AbsentFiguresStrip hint={tierLockRequired !== null ? 'locked for this plan' : 'loading'} />
      )}
      {!pendingForSelected && figuresHeldForSelected && (
      <GridLockedContent
        locked={tierLockRequired !== null}
        requiredTier={tierLockRequired as any}
        selectedDate={selectedDate}
        onTryDemo={() => setSelectedDate(DEMO_DATE)}
        variant="micro"
      >
      <GridTopFold
        collapse={activeTab !== 'overview'}
        summary={`${formatNumber(Math.round(systemStats.eveningPeakDemand))} MW evening peak · ${formatNumber(Math.max(0, Math.round(systemStats.eveningPeakDemand - systemStats.eveningPeakGen)))} MW deficit`}
      >
      <OverviewKpiStrip
        systemStats={systemStats}
        sourceFiles={sourceFiles}
        generationData={generationData}
        totalGasSupply={totalGasSupply}
        hasGasProductionData={hasGasProductionData}
        importedLngGas={importedLngGas}
        importedLngPct={importedLngPct}
        chevronGas={chevronGas}
        chevronPct={chevronPct}
        tullowGas={tullowGas}
        tullowPct={tullowPct}
        stateFieldsGas={stateFieldsGas}
        stateFieldsPct={stateFieldsPct}
        totalCondensate={totalCondensate}
        tooltipDate={tooltipDate}
        gasWindowLabel={gasWindowLabel}
        avgCostPerKwh={avgCostPerKwh}
        totalCapacityRenewables={totalCapacityRenewables}
        isoDate={selectedDate}
        forecast={forecast}
      />
      </GridTopFold>
</GridLockedContent>
      )}

      {/* Flat Tab Navigation */}
      <div className="grid-explorer-tabs mt-6 mb-4" role="tablist" aria-label="Grid reports views">
        {tabs.map((t) => {
          const TabIcon = t.icon;
          const active = activeTab === t.id;
          const avail = availability?.[t.id as GridTabId];
          const empty = avail ? !avail.hasData : false;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTabClick(t.id)}
              // Still clickable. A reader is entitled to open the tab and read
              // why it is empty; disabling it would hide the explanation behind
              // a control that does nothing.
              title={empty ? avail?.reason : undefined}
              className={cn('explorer-tab', active && 'active', empty && 'explorer-tab--empty')}
            >
              {/*
                The Renewables tab carried a "Monthly" badge from when it showed
                only SREDA's capacity register. It now leads with PGCB's daily
                per-fuel output and per-station table for the selected date, so
                the badge described the wrong cadence — and no other tab labels
                its cadence here.
              */}
              <TabIcon className="h-4 w-4 shrink-0" />
              <span>{t.label}</span>
              {empty && (
                <span className="explorer-tab__empty-dot" aria-hidden title={avail?.reason} />
              )}
              {empty && <span className="sr-only">— not published for this day</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="relative min-h-[400px]">
        {isLoadingDaily && !activeData && (
          <div className="grid-explorer-loading-overlay absolute inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-3 bg-card/60 px-6 py-4 rounded-2xl border border-border/50 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-150">
              <div className="relative">
                <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Activity className="h-5 w-5 shrink-0 text-primary animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <span className="text-xs font-semibold text-primary tracking-wide animate-pulse">Loading Grid Data...</span>
            </div>
          </div>
        )}

        {/* A day the calendar has reached and PGCB has not filed. Rendered
            before every other state and instead of the tab panels: there is
            nothing to draw, and the reader's question is why the newest day
            is not here. */}
        {pendingForSelected && <PendingDayPanel pending={pendingForSelected} />}
        {selectedIsFuture && <FutureDatePanel isoDate={selectedDate} />}

        {!noDayToRender && isDataMissing && !activeData && (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground animate-pulse">
                <Info className="h-8 w-8 shrink-0 text-amber-500" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                {isDateAvailable(selectedDate)
                  ? 'Report file not loaded yet'
                  : 'Report has not been released for this day yet'}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                {isDateAvailable(selectedDate)
                  ? `The ${selectedDate} PGCB daily report is in our catalog but could not be fetched — it may still be syncing to the site mirror. Petrobangla field data may load separately below.`
                  : `The daily grid status report and Petrobangla production telemetry for ${selectedDate} have not been finalized or published by PGCB/NLDC.`}
              </p>
              {selectedDate !== latestDate && (
                <button
                  type="button"
                  onClick={() => selectAccessibleDate(latestDate)}
                  className="grid-explorer-control px-4 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                >
                  View latest report ({isoDateToLegacy(latestDate) ?? latestDate})
                </button>
              )}
              {latestCachedReport?.systemStats && (
                <div className="bg-muted/10 p-4 rounded-xl border border-border/20 font-sans text-xs text-foreground max-w-md w-full text-left">
                  <div className="font-bold text-amber-500 uppercase tracking-wider text-[10px] mb-2">Latest Available Report:</div>
                  <div className="font-semibold text-foreground mb-1">
                    Date: {latestCachedReport.systemStats.date || isoDateToLegacy(latestDate) || latestDate}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/10 leading-relaxed tabular-nums">
                    Peak Gen: {formatNumber(latestCachedReport.systemStats.eveningPeakGen, 1)} MW / Demand:{' '}
                    {formatNumber(latestCachedReport.systemStats.eveningPeakDemand, 1)} MW / Energy:{' '}
                    {latestCachedReport.systemStats.totalEnergyGen == null ? '—' : formatNumber(latestCachedReport.systemStats.totalEnergyGen, 1)} MKWh
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isDataMissing && !noDayToRender && activeTab === 'overview' && (
        <OverviewPanel
          day={{ selectedDate, tierLockRequired, systemStats, hourlyLoadData, sourceFiles, generationData, forecast }}
          derived={{ curveIsHourly, sheddingIsHourly, showShedding, pieGenerationData, totalGenMkwhr, hasGenerationChartData, dailyCostChartData, hasPublishedFuelCost, totalCostBdt }}
          ui={{ chartsReady, LOAD_CURVE_COLORS, chartTheme, hoveredIndex, hoveredCostIndex }}
          actions={{ setSelectedDate, setHoveredIndex, setHoveredCostIndex }}
          slots={{ dayWindowStrip, provenanceNote, methodologyBanner }}
        />
      )}

      {!isDataMissing && !noDayToRender && activeTab === 'gen' && (
        <GenerationPanel
          day={{ selectedDate, tierLockRequired, systemStats, generationData, sourceFiles }}
          derived={{ totalGenMkwhr, totalCostBdt, unitCostAuth, hasPublishedFuelCost, avgCostPerKwh }}
          ui={{ chartTheme, chartsReady }}
          actions={{ setSelectedDate }}
          slots={{ dayWindowStrip, provenanceNote, methodologyBanner }}
        />
      )}

      {!isDataMissing && !noDayToRender && activeTab === 'gas' && (
        <div className="grid-explorer-panel space-y-6">
          {dayWindowStrip}
          {provenanceNote}
          {methodologyBanner}
          <GasTab
            selectedDate={selectedDate}
            systemStatsDate={systemStats?.date || 'Jun 2026'}
            gasProductionData={safeGasProductionData}
            gasDistributionData={gasDistributionData || []}
            totalGasSupply={totalGasSupply}
            totalCondensate={totalCondensate}
            isLocked={tierLockRequired !== null}
            requiredTier={tierLockRequired as any}
            onTryDemo={() => setSelectedDate(DEMO_DATE)}
          />
        </div>
      )}

      {!isDataMissing && !noDayToRender && activeTab === 'imports' && (
        <ImportsPanel
          day={{ selectedDate, tierLockRequired, systemStats, generationData, borderImportsData, sourceFiles }}
          derived={{ importsCost, importsEnergyMkwh }}
          actions={{ setSelectedDate }}
          slots={{ dayWindowStrip, provenanceNote, methodologyBanner }}
        />
      )}

      {!isDataMissing && !noDayToRender && activeTab === 'renewables' && (
        <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}>
          <RenewablesTab
            isoDate={selectedDate}
            generationData={generationData}
            systemStats={systemStats}
            sourceFiles={sourceFiles}
          />
        </GridLockedContent>
      )}

      {!isDataMissing && !noDayToRender && activeTab === 'plants' && (
        <div className="space-y-6">
          <StationsKpiStrip isoDate={selectedDate} systemStats={systemStats} sourceFiles={sourceFiles} />
          <PowerStationsTab isoDate={selectedDate} systemStats={systemStats} sourceFiles={sourceFiles} />
        </div>
      )}

      {!isDataMissing && !noDayToRender && activeTab === 'transmission' && (
        <TechnicalInfoTab
          selectedDate={selectedDate}
          tierLockRequired={tierLockRequired}
          onTryDemo={() => setSelectedDate(DEMO_DATE)}
        />
      )}

      {!isDataMissing && !noDayToRender && activeTab === 'regional' && (
        <RegionalPanel
          day={{ selectedDate, tierLockRequired, systemStats, regionalDemandData, sourceFiles, regionalDemandSource, dailyOutages, zoneGenerationData }}
          derived={{ eveningPeakStamp, totalRegionalDemand, totalRegionalLoadShed, avgRegionalPct, zoneGenNationalTotal, zoneGenFuels, formatZoneEnergy, zoneGenPublishedTotals, ewic, ewicTotalMkwh, ewicShareOfGen, ewicExceedsGeneration, ewicNet, ewicPeakSum, ewicCircuitBars }}
          ui={{ belowDesktop, showAllOutages, chartTheme }}
          actions={{ setSelectedDate, setShowAllOutages }}
        />
      )}

      {/* No `!isDataMissing && !noDayToRender` guard: the Time Machine reads the
          hourly table over its own API, so it still works on a day the archive
          has nothing for — which is exactly when a reader most wants to look
          around it. */}
      {activeTab === 'timemachine' && <TimeMachineTab />}

      {!isDataMissing && !noDayToRender && activeTab === 'macro' && (
        <MacroTrendsTab
          macroSubTab={macroSubTab}
          handleSubTabClick={handleSubTabClick}
          systemStats={systemStats}
          totalGasSupply={totalGasSupply}
          selectedDate={selectedDate}
          latestDate={latestDate}
          chartTheme={chartTheme}
          chartsReady={chartsReady}
          gridAccess={gridAccess}
        />
      )}
      </div>

      <GridReportingStandards date={systemStats.date} sourceFiles={sourceFiles} />
      </div>

      {tierLockRequired === null && (
        <GridArchiveTeaser
          access={gridAccess}
          totalArchiveDays={availableDatesList.length}
          onExploreLocked={previewLockedArchiveDate}
        />
      )}
    </div>

    {/* Print-Only Curated Report Document */}
    <div className="hidden print:block print-report space-y-10">
      {/* Report Header */}
      <div className="border-b-2 border-primary pb-4 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Bangladesh Energy Sector Briefing</div>
            {/* p, not h1: this print-only block still sits in the DOM on
                screen, and a second h1 in the document costs the page its
                single-heading structure for crawlers. Print styling is
                class-driven, so nothing visual changes on paper. */}
            <p className="text-3xl font-bold tracking-tight text-foreground mt-1">National Power Grid Audit Report</p>
            <p className="text-xs text-muted-foreground mt-1">Comprehensive grid performance analytics, fuel audits, and asset directories.</p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-foreground">ESB PowerLine Intelligence</div>
            <div className="text-muted-foreground mt-0.5 font-semibold text-primary">Classification: Member Executive Briefing</div>
            <div className="text-muted-foreground">Generated: {systemStats.date}</div>
          </div>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border/60 p-3 rounded-lg bg-muted/5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Evening Peak Demand</span>
          <div className="text-lg font-bold text-foreground mt-1">{formatNumber(Math.round(systemStats.eveningPeakDemand))} MW</div>
        </div>
        <div className="border border-border/60 p-3 rounded-lg bg-muted/5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Evening Peak Gen</span>
          <div className="text-lg font-bold text-foreground mt-1">{formatNumber(Math.round(systemStats.eveningPeakGen))} MW</div>
        </div>
        <div className="border border-border/60 p-3 rounded-lg bg-muted/5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Daily Generation</span>
          <div className="text-lg font-bold text-foreground mt-1">{systemStats.totalEnergyGen == null ? '—' : `${systemStats.totalEnergyGen.toFixed(1)} MKWh`}</div>
        </div>
        <div className="border border-border/60 p-3 rounded-lg bg-muted/5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Avg. Generation Cost</span>
          <div className="text-lg font-bold text-foreground mt-1">{formatUnitRate(systemStats.avgProductionCost)} Tk/kWh</div>
        </div>
      </div>

      {/* Section 1: Daily Generation Mix & Fuel Audits */}
      <div className="space-y-4 page-break-inside-avoid">
        <h2 className="text-lg font-bold border-b border-border pb-1.5 flex items-center gap-1.5 text-primary">
          <Zap className="h-4 w-4 shrink-0" /> 1. Daily Generation Mix & Fuel Audits
        </h2>
        <table className="print-report-table w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="text-left py-1.5 px-2 font-bold">Fuel Type</th>
              <th className="text-right py-1.5 px-2 font-bold">Output (MKWh)</th>
              <th className="text-right py-1.5 px-2 font-bold">Daily Cost (BDT)</th>
              <th className="text-right py-1.5 px-2 font-bold">Unit Cost (Tk/kWh)</th>
              <th className="text-right py-1.5 px-2 font-bold">System Share</th>
            </tr>
          </thead>
          <tbody>
            {generationData.map((item) => (
              <tr key={item.name} className="border-b border-border/40">
                <td className="py-1.5 px-2 font-medium">{item.name}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{item.gen.toFixed(2)}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{item.cost != null && item.cost > 0 ? formatNumber(item.cost) : '—'}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{item.unitCost != null && item.unitCost > 0 ? `${item.unitCost.toFixed(2)} Tk` : '—'}</td>
                <td className="text-right py-1.5 px-2 tabular-nums">{((item.gen / totalGenMkwhr) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="font-bold bg-muted/5 border-t border-border">
              <td className="py-1.5 px-2">Total System</td>
              <td className="text-right py-1.5 px-2 tabular-nums">{totalGenMkwhr.toFixed(2)}</td>
              <td className="text-right py-1.5 px-2 tabular-nums">{hasPublishedFuelCost ? formatNumber(totalCostBdt) : '—'}</td>
              <td className="text-right py-1.5 px-2 tabular-nums">{hasPublishedFuelCost ? `${formatUnitRate(totalCostBdt / (totalGenMkwhr * 1000000))} Tk` : '—'}</td>
              <td className="text-right py-1.5 px-2">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: Gas Distribution & LNG Supply */}
      <div className="space-y-4 page-break-inside-avoid">
        <h2 className="text-lg font-bold border-b border-border pb-1.5 flex items-center gap-1.5 text-primary">
          <Droplet className="h-4 w-4 shrink-0" /> 2. Gas Distribution & LNG Supply
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Daily Production by Operator</h3>
            <table className="print-report-table w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-1.5 px-2">Operator / Field</th>
                  <th className="text-right py-1.5 px-2">Gas (MMCFD)</th>
                  <th className="text-right py-1.5 px-2">Share</th>
                </tr>
              </thead>
              <tbody>
                {gasProductionData.map((gp, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1 px-2 font-medium">{gp.company}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{gp.gas.toFixed(1)}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{gp.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            {/* Petrobangla's distribution table has three supply columns: Power
                Plants, Fertilizer and "Others-Supl.". It publishes no industry
                split; calling the third column Industry claimed one. */}
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Power, Fertilizer and Others Distribution</h3>
            <table className="print-report-table w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-1.5 px-2">Distributor</th>
                  <th className="text-right py-1.5 px-2">Power (MMCFD)</th>
                  <th className="text-right py-1.5 px-2">Others (Suppl.)</th>
                  <th className="text-right py-1.5 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {gasDistributionData.map((gd, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1 px-2 font-medium">{gd.company}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{gd.power.toFixed(1)}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{gd.others.toFixed(1)}</td>
                    <td className="text-right py-1 px-2 tabular-nums font-semibold">{gd.total.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: Regional Grid Performance & Outages */}
      <div className="space-y-4 page-break-inside-avoid">
        <h2 className="text-lg font-bold border-b border-border pb-1.5 flex items-center gap-1.5 text-primary">
          <Cable className="h-4 w-4 shrink-0" /> 3. Regional Grid Performance & Outage Logs
        </h2>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">
              Zone-wise Demand &amp; Load-Shedding
              {/* The printed report must name the publisher too: on days with no
                  PGCB copy these are BPDB's figures. */}
              <span className="normal-case font-normal text-muted-foreground/80">
                {' '}— {regionalDemandSource === 'bpdb-published' ? 'BPDB' : 'PGCB'} published
                {regionalDemandSource === 'derived-served-plus-shed' ? ' (demand derived)' : ''}
              </span>
            </h3>
            <table className="print-report-table w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-1.5 px-2">Grid Zone</th>
                  <th className="text-right py-1.5 px-2">Demand (MW)</th>
                  <th className="text-right py-1.5 px-2">Load-Shedding (MW)</th>
                  <th className="text-right py-1.5 px-2">Shedding Share</th>
                </tr>
              </thead>
              <tbody>
                {regionalDemandData.map((rd, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1 px-2 font-medium">{rd.zone}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{formatNumber(rd.demand)}</td>
                    <td className="text-right py-1 px-2 tabular-nums text-destructive font-semibold">{rd.loadShed > 0 ? `${rd.loadShed} MW` : '0 MW'}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{rd.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="col-span-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">NLDC Outage Log (Yesterday)</h3>
            <div className="space-y-2 text-[9px]">
              {dailyOutages.slice(0, 6).map((o, idx) => (
                <div key={idx} className="p-2 border border-border/40 rounded bg-muted/5 space-y-0.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span className="truncate pr-1">{o.plant}</span>
                    <span className="font-mono text-muted-foreground font-normal shrink-0">{o.time}</span>
                  </div>
                  <div className="text-muted-foreground truncate">{o.reason}</div>
                  <div className="text-destructive font-semibold">{o.load}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/*
        Section 4, "Infrastructure Assets & Planning Tracker", was removed with
        the Transmission Grid Assets card it mirrored. Its one remaining table
        printed the same hand-entered `settings.gridLines` rows under a "Source:
        PGCB System Operations & NLDC National Grid Map" credit — a second false
        attribution for the same unsourced content, and worse here, because a
        printed report is the artefact a reader keeps and cites. Its sibling
        (hardcoded "Upcoming Generation Projects") had already gone for the same
        reason, leaving the section with nothing that could be sourced.
      */}

      {/* Data Methodology & Reconciliation Guide */}
      <div className="card mt-6 border border-border/60 bg-muted/5 rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
          className="w-full flex items-center justify-between p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted/15 transition-colors select-none"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary shrink-0" />
            Data Methodology &amp; Reconciliation Guide
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isMethodologyOpen && "rotate-180")} />
        </button>

        {isMethodologyOpen && (
          <div className="p-4 md:p-6 border-t border-border/40 text-xs text-muted-foreground/90 space-y-4 leading-relaxed bg-card text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Estimated Net Fuel Cost (KPI Card)
                </h4>
                <p>
                  The <strong>Est. Fuel Cost</strong> card at the top of the Grid Explorer displays the <strong>Net System Level Cost</strong>. This reflects the actual cost of bulk power injected and distributed to the national grid after accounting for generating station auxiliary consumption and grid transmission losses.
                </p>
                <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-1.5 font-mono text-[10px] md:text-xs text-foreground">
                  <div className="font-bold text-[10px] uppercase text-primary/80">Calculation Formula:</div>
                  <div>Net System Cost = Total Net Energy Generated (MKWh) × Avg Production Cost (Tk/kWh) × 10,000,000</div>
                  <div className="text-muted-foreground mt-1 text-[9px]">※ Excludes auxiliary consumption (~8-10%) and transmission losses (~3%).</div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Gross Production Cost Breakdown (Charts)
                </h4>
                <p>
                  The <strong>Daily Fuel &amp; Import Cost</strong> chart displays the <strong>Gross Production Cost</strong>. It aggregates the cost of fuel burned directly at the generator busbar and cross-border transactions at their individual unit rates.
                </p>
                <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-1.5 font-mono text-[10px] md:text-xs text-foreground">
                  <div className="font-bold text-[10px] uppercase text-emerald-500/80">Calculation Formula:</div>
                  <div>Gross Cost = Sum of [Individual Fuel Gross Generation (MKWh) × Estimated Fuel Unit Rate (Tk/kWh) × 1,000,000]</div>
                  <div className="text-muted-foreground mt-1 text-[9px]">※ Reflected directly in the fuel/import cost breakdown bars.</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 text-[11px] leading-relaxed space-y-1 text-muted-foreground/80">
              <p className="font-semibold text-foreground">Why do the values differ?</p>
              <p>
                PGCB's daily grid reports list Net System generation separately from Gross Station generation. The difference is the <strong>Grid Dispatch Loss &amp; Aux overhead</strong>. For instance, on July 24, 2024, Gross Generation was <strong>345.90 MKWh</strong> (leading to a gross cost of 217.24 Crore BDT), while Net Grid Dispatch was <strong>315.27 MKWh</strong> (representing a net cost of 174.2 Crore BDT under PGCB's bulk system average tariff of 5.526 Tk/kWh).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Report Footer */}
      <div className="border-t border-border/40 pt-4 text-[9px] text-muted-foreground flex justify-between">
        <span>Report Document ID: ESB-AUDIT-2026-Q2</span>
        <span>© 2026 ESB PowerLine Services. All rights reserved. Generated on secure member access session.</span>
      </div>
    </div>
  </>
  );
}