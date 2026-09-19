'use client';


import dynamic from 'next/dynamic';
import { useEffect, useId, useState, useRef, RefObject, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, Activity, Cable, TrendingUp, FileText, BarChart3, MapPin, Droplet, Globe, Sun,
  ChevronLeft, ChevronRight, ChevronDown, Check, Info, Network, CheckSquare, Calendar, RotateCcw, History, Factory,
  AlertTriangle
} from 'lucide-react';
import { cn, formatNumber, formatUnitRate, formatBdtAmount } from '@/lib/utils';
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
import { GRID_DEMO_DATE } from '@/lib/data/grid/public-sample-dates';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { axisTickStyle } from '@/lib/data/grid/chart-axis';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { isoDateToLegacy } from '@/lib/data/grid/date-utils';
import { pendingDays, isBeyondToday, type PendingDay } from '@/lib/data/grid/pending-days';
import { backlogBadge } from '@/lib/data/grid/backlog-badge';
import { PendingDayPanel, FutureDatePanel, AbsentFiguresStrip } from '@/components/news/power-grid/PendingDayPanel';
import { UnitCostBadge } from '@/components/news/power-grid/UnitCostBadge';
import { useUnitCostAuthentication, type UnitCostFact } from '@/components/news/power-grid/useUnitCostAuthentication';
import { EnergyCurveChart } from '@/components/news/power-grid/EnergyCurveChart';
import { LoadCurveCanvas } from '@/components/news/power-grid/LoadCurveCanvas';
import { InterconnectorCanvas } from '@/components/news/power-grid/InterconnectorCanvas';
import { totalCapacityRenewables } from '@/lib/data/companies/sreda';
import { macroTariffData } from '@/lib/data/macro/tariff';

import { CustomDropdown } from '@/components/news/power-grid/shared';
import { OverviewKpiStrip } from '@/components/news/power-grid/OverviewKpiStrip';
import {
  GenerationKpiStrip,
  ImportsKpiStrip,
  RegionalKpiStrip,
  StationsKpiStrip,
} from '@/components/news/power-grid/TabKpiStrips';
import { PowerStationsTab } from '@/components/news/power-grid/PowerStationsTab';
import { BpdbAccountsPanel } from '@/components/news/power-grid/BpdbAccountsPanel';
import { DailyBadge, GridCardFooter, GridProvenanceTag, GridSourceFiles } from '@/components/news/power-grid/GridExplorerUI';
import { GridReportingStandards } from '@/components/news/power-grid/GridReportingStandards';
import { GenerationMixCard } from '@/components/news/power-grid/GenerationMixCard';
import { DailyCostCard } from '@/components/news/power-grid/DailyCostCard';
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
import { ForecastSection } from '@/components/news/power-grid/ForecastSection';
import { petrobanglaGasDay, formatWindow } from '@/lib/data/grid/observation-window';
import { tabAvailability, type GridTabId } from '@/lib/data/grid/tab-availability';
import { GridAccessBanner } from '@/components/news/power-grid/GridAccessBanner';
import { GridArchiveTeaser } from '@/components/news/power-grid/GridArchiveTeaser';
import { GridLockedContent } from '@/components/news/power-grid/GridLockedContent';
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
// Allowlisted in middleware via the same module, so the demo click is actually served.
const DEMO_DATE = GRID_DEMO_DATE;

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
      const targetY = elementPosition - navbarHeight - 24;
      
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
      <div className="grid-explorer relative print:hidden">
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
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">PGCB Grid Overview Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. PGCB data tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          {dayWindowStrip}
          {provenanceNote}
          {methodologyBanner}
        {/* 24-Hour System Load Curve — leads the tab. The KPI strip above has
            just told the reader the size of the deficit; the next question is
            when and for how long the shedding ran, and this is the only card
            that answers it. The mix and cost cards follow as "what ran". */}
        <div className="grid-explorer-chart-card card">
          <div className="grid-explorer-chart-card__head">
            <div className="flex items-center gap-2.5 min-w-0">
              <Activity className="h-5 w-5 shrink-0 text-destructive" />
              <div className="min-w-0">
                {/* Named for what the sheet is: P4 is "Hourly Demand, Generation & Load-Shed
                    Report" and the L-Curve is "DAILY GENERATION CURVE". "System Load
                    Curve" called a generation series a load series. */}
                <h3 className="grid-explorer-chart-card__title">24-Hour Generation, Demand &amp; Load-Shed<DailyBadge /></h3>
                <p className="grid-explorer-chart-card__sub">
                  {curveIsHourly
                    ? <>Generation, demand and load shedding for every hour PGCB publishes, from the NLDC hourly report (Date: {systemStats.date})</>
                    : sheddingIsHourly
                      ? <>Hourly generation and load shedding from the NLDC hourly report; demand as published for the evening peak hour (Date: {systemStats.date})</>
                      : <>Hourly generation from the NLDC load curve; demand and load shedding as published for the evening peak hour (Date: {systemStats.date})</>}
                  {' • '}<span className="text-primary font-semibold text-xs">
                    {coverageLabel(curveIsHourly || sheddingIsHourly ? 'hourlyShedding' : 'loadCurve')}
                  </span>
                </p>
              </div>
            </div>
            <span className="grid-explorer-chip bg-destructive/10 text-destructive border-destructive/20">NLDC SCADA Curve</span>
          </div>

          {/* No fixed height here. The load curve sizes itself — a plot of its
              own plus the key beneath it — and the shared chart-area class caps
              at 24rem, which is shorter than the two together. The overflow
              landed the key's hint line on top of the paragraph below the card. */}
          <div className="mt-4">
            {hourlyLoadData.length === 0 ? (
              // Reports before 2018 carry no load-curve sheet. Drawing empty
              // axes would imply a flat or missing grid rather than an
              // unpublished measurement.
              <div className="min-h-[16rem] flex flex-col items-center justify-center text-center gap-2 px-6">
                <p className="text-sm font-semibold text-muted-foreground">No load curve published for this day</p>
                <p className="text-xs text-muted-foreground/80 max-w-md">
                  PGCB&apos;s report for {systemStats.date} does not include the half-hourly NLDC load-curve
                  sheet. Daily totals and peaks above are unaffected.
                </p>
              </div>
            ) : chartsReady ? (
              <LoadCurveCanvas
                rows={hourlyLoadData as never}
                peaks={{
                  dayPeakGen: systemStats.dayPeakGen,
                  eveningPeakGen: systemStats.eveningPeakGen,
                  minGen: systemStats.minGen,
                  peakTimes: systemStats.peakTimes ?? null,
                }}
                generationColor={LOAD_CURVE_COLORS.generation}
                demandColor={LOAD_CURVE_COLORS.demand}
                shedColor={chartTheme.destructive}
                axisColor={chartTheme.axisTick}
                gridColor={chartTheme.gridStroke}
                reportDate={systemStats.date}
              />
            ) : (
              // Matches the figure it stands in for — canvas plus key — so the
              // card does not jump when the chart arrives.
              <div className="grid-explorer-skeleton h-[25.5rem] rounded-xl" />
            )}
          </div>

          {/* Shedding had its own right-hand axis here, with a note explaining
              that on the generation scale it would be "a flat line on the
              floor". The note was right and the axis was the wrong answer to
              it: two quantities that do not share a scale should not share a
              frame pretending they do. The curve now carries the shortfall as
              the band between demand and generation, and shedding's own
              published column runs as an intensity strip along the foot — no
              second axis, and nothing to apologise for. */}
          {showShedding && chartsReady && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              The band between the two curves is demand the grid did not meet.{' '}
              <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load shedding</span>
              {' '}below it is PGCB&apos;s own published figure for each hour, drawn against the
              worst hour of the day rather than a megawatt scale of its own.
            </p>
          )}

          {/* Card Explanation Block */}
          {(() => {
            // On the older layouts PGCB publishes demand and load shedding for
            // the evening peak hour only, so this reports that hour rather than
            // the maximum of a series that used to be filled in across
            // 18:00-23:00.
            const peakRow = hourlyLoadData.find((h) => h.demand != null || h.loadShed != null) ?? null;

            // Whole hours only. PGCB adds the evening-peak half hour (19:30) as
            // a 25th row — and on the pre-2019 layouts 18:30 as well — so a row
            // is not the same thing as an hour. Counting rows inflated both the
            // day's energy total and the hour tally: a 24-hour day with a 19:30
            // sample reported "shed in 25 of the 25 published hours", which is
            // one more hour than the day has. Every figure below is measured on
            // this list so the count, the denominator and the MWh total all
            // describe the same thing.
            const wholeHourRows = hourlyLoadData.filter((h) => h.time.endsWith(':00'));

            // With an hourly sheet the interesting figures are the day's own
            // extremes, not one nominated hour.
            const shedHours = wholeHourRows.filter((h) => (h.loadShed ?? 0) > 0);
            const worstShed = shedHours.length
              ? [...shedHours].sort((a, b) => (b.loadShed ?? 0) - (a.loadShed ?? 0))[0]
              : null;
            // A day total is only honest where the hours it sums are the day.
            // 71 archived days publish 23 hourly rows rather than 24, so the
            // figure is withheld there instead of being presented as the day.
            const shedTotalMwh =
              sheddingIsHourly && wholeHourRows.length >= 24
                ? wholeHourRows.reduce((sum, h) => sum + (h.loadShed ?? 0), 0)
                : 0;

            return (
              <div className="bg-muted/10 p-4 border border-border/40 rounded-xl text-xs text-muted-foreground space-y-2 mt-4">
                <p><strong>What is being shown?</strong></p>
                {/* The series names here are painted from LOAD_CURVE_COLORS rather
                    than from Tailwind's palette. text-amber-500 (#f59e0b) is not
                    the colour the demand line is drawn in (#eab308), so the prose
                    used to name a series in a shade the chart never uses. */}
                {/* The shedding strip only exists on days
                    that shed something, so the prose names them only then — a day
                    PGCB reports as nil is described by its own sentence rather than
                    pointed at an axis the reader cannot see. */}
                {curveIsHourly ? (
                  <>
                    <p className="leading-relaxed">
                      Everything on this chart comes from one sheet — PGCB&apos;s hourly demand,
                      generation and load-shed table — which states each figure for every hour it
                      publishes. Most days carry <strong>25 readings, not 24</strong>: the
                      twenty-four hours plus a half-hour sample at 19:30 taken across the
                      evening-peak window.
                    </p>
                    <dl className="grid-load-glossary">
                      <div>
                        <dt style={{ color: LOAD_CURVE_COLORS.generation }}>
                          Generation <GridProvenanceTag kind="P" />
                        </dt>
                        <dd>
                          The megawatts actually produced and delivered at that moment — the blue
                          mass. This is what the country <em>had</em>.
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: LOAD_CURVE_COLORS.demand }}>
                          Demand <GridProvenanceTag kind="P" />
                        </dt>
                        <dd>
                          What the country <em>asked for</em> — the dashed ceiling. PGCB publishes
                          this column, but it is not measured independently: across all 3,600 hourly
                          rows of 2026 it equals <em>generation + 1.045 × load shed</em>, to within
                          a megawatt. The 4.5% is a network-loss allowance — shedding is counted
                          where consumers are, generation where the plants are — so demand is
                          reconstructed on the generation side of the network rather than metered
                          at the door.
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: chartTheme.destructive }}>
                          Unmet demand <GridProvenanceTag kind="D" />
                        </dt>
                        <dd>
                          The shaded band between the two curves: demand minus generation. It is
                          the electricity the country asked for and did not get. This is our
                          subtraction, not a figure PGCB states &mdash; and because demand is built
                          from the shed column above, the band is the same quantity as the strip
                          below, 4.5% larger. It is drawn because a shortfall is easier to judge as
                          a gap between two lines than as a number in a table.
                        </dd>
                      </div>
                      {showShedding ? (
                        <div>
                          <dt style={{ color: chartTheme.destructive }}>
                            Load shed, by hour <GridProvenanceTag kind="P" />
                          </dt>
                          <dd>
                            PGCB&apos;s own third column, along the foot: load the grid deliberately
                            disconnected because it could not supply it. This is the published
                            figure and the one to quote. Bars are sized against the day&apos;s worst
                            hour, so the strip shows shape and severity rather than a second
                            megawatt scale. A flat grey stub means an hour PGCB reported as
                            <em> none</em>; a gap in the baseline means an hour it did not report
                            at all.
                          </dd>
                        </div>
                      ) : (
                        <div>
                          <dt style={{ color: chartTheme.destructive }}>Load shed, by hour</dt>
                          <dd>
                            Nothing to show: this report states no load shedding in any hour of this
                            day, which is why the two curves meet all the way across.
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt style={{ color: '#c98a1a' }}>19:30 sample</dt>
                        <dd>
                          The gold bar. PGCB takes one extra reading half an hour before the
                          evening-peak hour, so it sits closer to its neighbours than the rest.
                          It is a reading like any other, not a separate series &mdash; marked only
                          so its spacing does not read as a mistake.
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : sheddingIsHourly ? (
                  <p className="leading-relaxed">The <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.generation }}>Actual Generation</span> curve is read from PGCB&apos;s hourly station log, which carries a national total and a shortage figure at every hourly stamp{showShedding
                    ? <>; the <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load Shedding</span> strip along the foot is that shortage column, sized against the day's worst hour.</>
                    : <>, and records no shortage in any hour of this day.</>} That sheet publishes no demand column, so <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.demand }}>Demand</span> is the evening-peak figure from the report&apos;s front page and appears as a single marked point rather than a curve.</p>
                ) : (
                  <p className="leading-relaxed">The hourly <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.generation }}>Actual Generation</span> curve is the NLDC load-curve sheet, logged every half hour. <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.demand }}>Total Demand</span>{showShedding
                    ? <> and the <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load Shedding Deficit</span> are published for the evening peak hour only on this report&apos;s layout, so they appear as single marks rather than continuous lines, and the shortfall band is drawn only where both were measured.</>
                    : <> is published for the evening peak hour only on this report&apos;s layout, so it appears as a single marked point rather than a continuous line.</>}</p>
                )}
                <p className="leading-relaxed">
                  {/* Everything in this sentence is counted or summed here — PGCB
                      states the hourly figures, not the tallies drawn from them. */}
                  <strong>Operational Insights <GridProvenanceTag kind="D" /></strong>: The load curve illustrates the shape of generation across this day.
                  {(curveIsHourly || sheddingIsHourly) && worstShed ? (
                    <>
                      {' '}Load was shed in <span className="font-semibold text-primary">{shedHours.length} of the {wholeHourRows.length} published hours</span>, worst at{' '}
                      <span className="font-semibold text-primary">{worstShed.time} Hr</span> with{' '}
                      <span className="font-bold text-destructive tabular-nums">{formatNumber(Math.round(worstShed.loadShed ?? 0))} MW</span> unserved
                      {shedTotalMwh > 0 && (
                        <> — around <span className="font-bold text-foreground tabular-nums">{formatNumber(Math.round(shedTotalMwh))} MWh</span> across the day, taking each hourly figure as the rate for that hour.</>
                      )}
                    </>
                  ) : curveIsHourly || sheddingIsHourly ? (
                    ' No load shedding was recorded in any published hour of this day.'
                  ) : peakRow && peakRow.demand != null ? (
                    <>
                      {' '}At the evening peak (<span className="font-semibold text-primary tabular-nums">{peakRow.time} Hr</span>) PGCB reported demand of <span className="font-bold text-foreground">{formatNumber(Math.round(peakRow.demand))} MW</span>
                      {peakRow.loadShed != null && peakRow.loadShed > 0 ? (
                        <> against <span className="font-bold text-destructive tabular-nums">{formatNumber(Math.round(peakRow.loadShed))} MW</span> of load shedding.</>
                      ) : (
                        ' with no load shedding recorded.'
                      )}
                    </>
                  ) : (
                    ' This report does not publish an evening-peak demand or load-shedding figure.'
                  )}
                </p>
              </div>
            );
          })()}

          {/* Card Metadata Footer */}
          <GridCardFooter>
            <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P4 sheet, hourly generation, demand and load-shed columns</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
            <span>Hourly figures as published; hour counts and day totals are ours. Not independently audited.</span>
            <span className="font-medium">Reporting Period: 24-Hour SCADA Log (Date: {systemStats.date})</span>
          </GridCardFooter>
        </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generation Pie Chart — the card's JSX lives in GenerationMixCard,
              moved verbatim; hover state stays here because the mix stack,
              donut and legend all read it. */}
          <GenerationMixCard
            generationData={generationData}
            pieGenerationData={pieGenerationData}
            totalGenMkwhr={totalGenMkwhr}
            hasGenerationChartData={hasGenerationChartData}
            chartsReady={chartsReady}
            chartTheme={chartTheme}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            sourceFiles={sourceFiles}
            systemStats={systemStats}
          />

          {/* Cost Bar Chart — likewise DailyCostCard, moved verbatim. */}
          <DailyCostCard
            dailyCostChartData={dailyCostChartData}
            hasPublishedFuelCost={hasPublishedFuelCost}
            totalCostBdt={totalCostBdt}
            chartsReady={chartsReady}
            chartTheme={chartTheme}
            hoveredCostIndex={hoveredCostIndex}
            setHoveredCostIndex={setHoveredCostIndex}
            sourceFiles={sourceFiles}
            systemStats={systemStats}
          />
        </div>


        {/* Last card on the tab, deliberately.

            This led the tab at first, which was wrong twice over: it pushed
            every chart below the fold, and it put a projection ahead of the
            measurements it should be read against. A reader should see what
            the grid did — the load curve, the mix, the cost — and only then
            what was expected of it. Renders nothing on days whose issuing
            workbook is absent. */}
        {/* One card, two vintages: the running day checked against NLDC's
            hourly page, or the settled day checked against the audited
            workbook. The section picks the default and owns the switch; with
            no live half it renders the settled card exactly as before. */}
        <ForecastSection
          forecast={forecast}
          systemStats={systemStats}
          hourlyLoadData={hourlyLoadData}
          actualsFrom={sourceFiles?.pgcb}
          chartTheme={chartTheme}
        />
      </div>
      </GridLockedContent> )
    )}

      {!isDataMissing && !noDayToRender && activeTab === 'gen' && (
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">PGCB Fuel Mix &amp; Generation Cost Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. PGCB generation and cost data tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          <GenerationKpiStrip
            systemStats={systemStats}
            generationData={generationData}
            sourceFiles={sourceFiles}
          />

          {dayWindowStrip}
          {provenanceNote}
          {methodologyBanner}

          {/* The day's fuel mix as a shape rather than a total. Fetches its own
              data — ~5.7KB a day that would otherwise ride on every daily
              payload — and renders nothing on the days whose workbook carries
              no En-Curve sheet. */}
          <EnergyCurveChart
            isoDate={selectedDate}
            reportDate={systemStats.date}
            chartTheme={chartTheme}
            ready={chartsReady}
            sourceFile={sourceFiles?.pgcb}
          />

          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h3 className="grid-explorer-chart-card__title">Generation &amp; Production Cost Breakdown<DailyBadge /></h3>
                  <p className="grid-explorer-chart-card__sub">System performance data logged on {systemStats.date} • <span className="text-primary font-semibold text-xs">{coverageLabel('fuelMix')}</span></p>
              </div>
            </div>

            <p className="grid-explorer-table-scroll-hint sm:hidden mx-4" role="note">
              Swipe horizontally to see all columns
            </p>
            <div className="grid-explorer-table-wrap grid-explorer-table-wrap--sticky-col">
              <table className="grid-explorer-table">
                <thead>
                  <tr>
                    <th>Fuel / Source</th>
                    {/* Generation and cost are printed by PGCB. The unit rate is
                        not — no agency publishes a Tk/kWh figure — so it is the
                        quotient of the two columns to its left and is tagged D,
                        with a marker saying what independent evidence supports
                        that particular quotient. */}
                    <th className="text-left">Generation (MKWh) <GridProvenanceTag kind="P" /></th>
                    <th className="text-left">Generation Share <GridProvenanceTag kind="D" /></th>
                    <th className="text-left">Daily Cost (Crore BDT) <GridProvenanceTag kind="P" /></th>
                    <th className="text-left">Cost Share <GridProvenanceTag kind="D" /></th>
                    <th className="text-left">Cost intensity <GridProvenanceTag kind="D" /></th>
                    <th className="text-left">Unit Cost (Tk/kWh) <GridProvenanceTag kind="D" /></th>
                  </tr>
                </thead>
                <tbody>
                  {generationData.map((g, idx) => {
                    const genShare = ((g.gen / totalGenMkwhr) * 100).toFixed(2);
                    const costShare = g.cost == null ? null : ((g.cost / totalCostBdt) * 100).toFixed(2);
                    return (
                      <tr key={idx} className={cn(g.gen === 0 && 'opacity-40')}>
                        <td className="font-semibold flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                          {g.name}
                        </td>
                        <td className="text-left tabular-nums">{g.gen.toFixed(2)}</td>
                        <td className="text-left tabular-nums text-muted-foreground">{genShare}%</td>
                        <td className="text-left tabular-nums">{g.cost == null ? '—' : formatBdtAmount(g.cost / 10000000)}</td>
                        <td className="text-left tabular-nums text-muted-foreground">{costShare == null ? '—' : `${costShare}%`}</td>
                        {/*
                          Cost share divided by generation share. Above 1.0 the fuel
                          is taking more of the bill than of the electricity and is
                          pulling the system average up; below 1.0 it is pulling it
                          down. Unlike the rate beside it this compares fuels fairly,
                          because both halves are shares of the same two totals.
                        */}
                        <td className="text-left tabular-nums">
                          {(() => {
                            const gs = totalGenMkwhr > 0 ? g.gen / totalGenMkwhr : 0;
                            const cs = g.cost == null || totalCostBdt <= 0 ? null : g.cost / totalCostBdt;
                            if (cs == null || gs <= 0) return <span className="text-muted-foreground">—</span>;
                            const x = cs / gs;
                            return (
                              <span
                                className={cn(
                                  'font-semibold',
                                  x >= 1.5 && 'text-destructive',
                                  x < 1.5 && x > 1.05 && 'text-amber-600 dark:text-amber-500',
                                  x <= 0.95 && 'text-emerald-600 dark:text-emerald-500',
                                )}
                                title={`${(cs * 100).toFixed(2)}% of cost for ${(gs * 100).toFixed(2)}% of energy`}
                              >
                                {x.toFixed(2)}×
                              </span>
                            );
                          })()}
                        </td>
                        <td className="text-left tabular-nums font-mono text-sm">
                          {g.unitCost == null ? '—' : g.unitCost.toFixed(2)}
                          <UnitCostBadge fact={unitCostAuth.factFor(g.name, g.unitCost)} />
                        </td>
                      </tr>
                    );
                  })}
                  {/*
                    Every cell in this row is ours: the two totals are sums of
                    the rows above, the shares are those sums against
                    themselves, and the average is their quotient. PGCB does
                    publish its own energy total, so leaving the row unmarked
                    invited a reader to take our sum for theirs. The note below
                    the table reports how the two compare.
                  */}
                  <tr className="border-t border-border/80 font-bold bg-muted/20">
                    <td>Total System / Average<GridProvenanceTag kind="D" className="ml-1" /></td>
                    <td className="text-left tabular-nums">{totalGenMkwhr.toFixed(2)}</td>
                    <td className="text-left tabular-nums">100.00%</td>
                    <td className="text-left tabular-nums">{hasPublishedFuelCost ? (totalCostBdt / 10000000).toFixed(2) : '—'}</td>
                    <td className="text-left tabular-nums">{hasPublishedFuelCost ? '100.00%' : '—'}</td>
                    <td className="text-left tabular-nums">{hasPublishedFuelCost ? '1.00×' : '—'}</td>
                    <td className="text-left tabular-nums font-mono text-sm text-primary">{hasPublishedFuelCost ? formatUnitRate(avgCostPerKwh) : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/*
              The fuel rows and PGCB's own headline total are different cells of
              the same report, so they should agree. The band is half of the last
              digit PGCB prints, once per figure summed — taken from how the
              source states its numbers, not chosen.
            */}
            {systemStats.totalEnergyGen != null && (() => {
              const band = 0.005 * (generationData.length + 1);
              const delta = totalGenMkwhr - systemStats.totalEnergyGen;
              const ok = Math.abs(delta) <= band;
              return (
                <div className="mx-4 mt-3 p-3 rounded-lg border border-border/50 bg-muted/15 text-[11px]">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 tabular-nums">
                    <span className="text-muted-foreground">
                      {`Fuel rows sum${' '}`}
                      <GridProvenanceTag kind="D" />
                    </span>
                    <span>
                      {`${totalGenMkwhr.toFixed(2)} vs ${systemStats.totalEnergyGen.toFixed(2)} MKWh published by PGCB`}
                      <GridProvenanceTag kind="P" className="ml-1" />
                      <span
                        className={
                          ok
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold ml-2'
                            : 'text-amber-600 dark:text-amber-400 font-bold ml-2'
                        }
                      >
                        {ok ? 'agrees' : `differs by ${delta.toFixed(3)}`}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })()}

            {/*
              BPDB's own accounts, which price the same electricity over a
              financial year rather than a fuel bill over a day. Outside the
              unitCostAuth gate below on purpose: that gate waits on a
              per-fuel authentication fetch this panel does not use, and the
              contrast it draws is the whole reason the table needs context.
            */}

            {unitCostAuth.loaded && (
              <div className="mx-4 mb-4 text-[11px] leading-relaxed text-muted-foreground">
                {/*
                  The daily table is fuel-only because that is all PGCB publishes
                  daily. BPDB's own all-in cost — fuel plus capacity payments,
                  O&M and capital recovery — is published annually, and the gap
                  between the two is the part of the bill this table cannot see.
                  Stating it here stops the daily average being read as "what
                  electricity costs", which understates it by about a third.

                  Sourced from the annual series already on the Macro tab rather
                  than estimated. BERC's tariff orders would give the
                  authoritative split, but they are published as legacy
                  Bengali-encoded PDFs whose text extracts as mojibake, so they
                  are not machine-readable here today.
                */}
                {(() => {
                  const annual = macroTariffData[macroTariffData.length - 1];
                  const allIn = annual?.cost ?? null;
                  const fuelOnly = hasPublishedFuelCost && totalGenMkwhr > 0
                    ? totalCostBdt / (totalGenMkwhr * 1_000_000)
                    : null;
                  if (allIn == null || fuelOnly == null) return null;
                  const nonFuel = allIn - fuelOnly;
                  const pct = (nonFuel / allIn) * 100;
                  return (
                    <div className="mb-3 rounded-xl border border-border/50 bg-muted/15 p-3">
                      <p className="mb-2">
                        <strong className="text-foreground">
                          What this table cannot see: about {pct.toFixed(0)}% of the real bill.
                        </strong>{' '}
                        PGCB publishes a fuel cost daily; nobody publishes a daily all-in cost.
                        BPDB&apos;s own audited bulk cost — which adds capacity payments to
                        plants whether or not they run, O&amp;M and capital recovery — is
                        published annually.
                      </p>
                      <div className="grid grid-cols-3 gap-2 tabular-nums">
                        <div className="rounded-lg border border-border/40 bg-card/60 px-2.5 py-2">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Fuel only, today <GridProvenanceTag kind="D" />
                          </div>
                          <div className="text-base font-bold text-foreground">{fuelOnly.toFixed(2)}</div>
                          <div className="text-[9px] text-muted-foreground">Tk/kWh — the table above</div>
                        </div>
                        <div className="rounded-lg border border-border/40 bg-card/60 px-2.5 py-2">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            BPDB all-in <GridProvenanceTag kind="P" />
                          </div>
                          <div className="text-base font-bold text-foreground">{allIn.toFixed(2)}</div>
                          <div className="text-[9px] text-muted-foreground">Tk/kWh — {annual.year}, annual</div>
                        </div>
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-2.5 py-2">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Not in this table <GridProvenanceTag kind="D" />
                          </div>
                          <div className="text-base font-bold text-amber-600 dark:text-amber-500">
                            {nonFuel.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-muted-foreground">Tk/kWh of non-fuel cost</div>
                        </div>
                      </div>
                      <p className="mt-2">
                        The two are different periods — one day against a financial year — so the
                        gap is indicative of scale, not an exact decomposition of today. It is
                        shown because a reader taking {fuelOnly.toFixed(2)} Tk/kWh as the cost of
                        electricity would be understating it by roughly a third.
                      </p>
                    </div>
                  );
                })()}

                {/*
                  The rate invites a ranking it cannot support. Read naively the
                  table says "imports are cheap, solar is expensive, hydro is
                  free" — and a reader concludes the country should import more
                  and build less solar. Every step of that is wrong, and the
                  reasons are structural rather than arithmetic, so they are
                  stated beside the number rather than left to be inferred.
                */}
                <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
                  <p className="mb-1.5">
                    <strong className="text-foreground">
                      These rates are not comparable to each other, and do not rank the options.
                    </strong>{' '}
                    Each is a <em>fuel or purchase</em> cost divided by the energy that fuel
                    produced. It excludes what a plant costs whether or not it runs — capacity
                    payments to idle IPPs, capital recovery, O&amp;M — and excludes transmission
                    losses. Three consequences worth holding onto:
                  </p>
                  <ul className="space-y-1 ml-1">
                    <li>
                      <strong className="text-foreground">Solar and wind burn no fuel.</strong>{' '}
                      Their figure is the tariff paid under a power-purchase agreement, which is
                      capital recovery. Setting it against gas — a fuel bill that excludes the
                      gas plant&apos;s own capital — compares two different quantities. It does
                      not mean solar costs more to run; a solar plant costs almost nothing to run.
                    </li>
                    <li>
                      <strong className="text-foreground">Hydro is not free.</strong>{' '}
                      Kaptai has no fuel bill and is long since built, so its rate collapses
                      towards zero. It cannot be scaled: the dam is what it is, and the output
                      depends on rainfall.
                    </li>
                    <li>
                      <strong className="text-foreground">Imports cannot simply be increased.</strong>{' '}
                      The rate is contractual, and the volume is capped by what the
                      interconnectors can physically carry — the HVDC link, Adani and Tripura are
                      near their limits on most days. A low rate on a capped supply is not an
                      option to buy more of.
                    </li>
                  </ul>
                  <p className="mt-1.5">
                    The columns that <em>do</em> compare fairly are the two beside each other:
                    <strong className="text-foreground"> Generation Share against Cost Share</strong>.
                    A fuel taking a larger share of the bill than of the electricity is the one
                    raising the average — which is the question the rate column is usually being
                    asked, and cannot answer.
                  </p>
                </div>
                <p className="mb-1.5">
                  <strong className="text-foreground">How the unit cost is arrived at.</strong>{' '}
                  No agency publishes a Tk/kWh rate. PGCB publishes a production cost in Taka
                  and an energy total in MKWh for each fuel; the rate here is the first divided
                  by the second, which is why it is marked{' '}
                  <GridProvenanceTag kind="D" />. The marker beside each rate says what
                  independent evidence supports it:
                </p>
                {/*
                  Said plainly because a reader who checks the arithmetic will
                  otherwise think the rate is wrong: the Generation column is
                  rounded to two decimals for display, while the rate is computed
                  from the unrounded energy. Wind is the visible case — 0.31 MKWh
                  shown against 0.30624 actual, so dividing the two printed
                  columns gives 14.53 rather than the 14.71 stated.
                */}
                <p className="mb-1.5">
                  <strong className="text-foreground">Why the columns may not divide exactly.</strong>{' '}
                  The rate is computed from the energy PGCB publishes at full precision, while the
                  Generation column is rounded to two decimals to read cleanly. On small fuels the
                  two printed columns therefore divide to something slightly different — Wind shows
                  0.31 MKWh against an actual 0.30624 — so the rate shown is the more precise one,
                  not the one the visible columns produce.
                </p>
                <ul className="space-y-0.5 ml-1">
                  <li>
                    <UnitCostBadge fact={{ status: 'corroborated' } as UnitCostFact} className="ml-0" />{' '}
                    BPDB publishes the same cost and the same energy in a separate report with
                    its own control totals, and the rate derived from those agrees. Re-measured
                    across every witnessed day from 2025-01-01 to 2026-06-24: gas agrees on
                    274 of 274 days, coal on 274 of 274, imports on 273 of 274 — the exception
                    being 2026-04-03, where BPDB&rsquo;s own page overstates imported energy by
                    exactly 188.00 MKWh while PGCB&rsquo;s three interconnectors sum to its own
                    total.
                  </li>
                  {/*
                    This line used to read "Hydro at 0.1000 on all but one" day
                    of 2026. It is 0.1000 on 128 days and 3.8100 on 16 — the
                    unbroken run 2026-06-30 to 07-15 — so the claim was wrong by
                    fifteen days, and wrong in the direction that overstates our
                    confidence. A tally frozen in prose goes stale the moment the
                    archive grows, which is how it broke; the rates are named
                    here and the counts left to the table itself.
                  */}
                  <li>
                    <UnitCostBadge fact={{ status: 'administered' } as UnitCostFact} className="ml-0" />{' '}
                    a flat rate the publisher applies rather than measures. Through 2026 PGCB
                    prints Wind at 14.7100 Tk/kWh unchanged, and Hydro at 0.1000 except for
                    2026-06-30 to 07-15, when it stepped to 3.8100 and back. Rates that hold to
                    four decimals for weeks and then jump are tariffs in force, not daily costs.
                  </li>
                  <li>
                    <UnitCostBadge fact={{ status: 'disagreement' } as UnitCostFact} className="ml-0" />{' '}
                    both agencies state the inputs and they disagree by more than their printing
                    precision allows. Neither figure is altered.
                  </li>
                  <li>
                    <UnitCostBadge fact={{ status: 'published-only' } as UnitCostFact} className="ml-0" />{' '}
                    correctly derived, but only one agency publishes the inputs, so there is no
                    second witness.
                  </li>
                  <li>
                    <UnitCostBadge fact={{ status: 'awaiting-witness' } as UnitCostFact} className="ml-0" />{' '}
                    correctly derived, and the cross-check has not been run for this day yet. The
                    BPDB comparison is a periodic export
                    {unitCostAuth.witnessThrough ? ` covering days through ${unitCostAuth.witnessThrough}` : ''};
                    a day past that is unchecked, which is not the same as unconfirmed.
                  </li>
                </ul>
              </div>
            )}

            {/* Card Metadata Footer */}
            {/*
              Two corrections here. The generation and cost figures come from
              PGCB's daily report alone — BPDB is not a source for them, it is
              the second publisher whose independent figures corroborate the
              derived rate, which is a different claim. And the "Audited by BPDB
              Finance / CAG Audit Team" credit was removed: no audit report has
              been opened by anything in this pipeline, the same false crediting
              already stripped from the macro cards (see GridProvenanceTag).
            */}
            <GridCardFooter>
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, generation and production cost as published</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>Unit rate corroborated against <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Daily Reports</a>. Not audited.</span>
              <span className="font-medium">Reporting Date: {systemStats.date}</span>
            </GridCardFooter>
          </div>

          {/*
            BPDB's own accounts, which price the same electricity over a
            financial year rather than a fuel bill over a day. Its own card
            directly beneath the daily table on purpose: the contrast between
            the two is the whole reason the table needs context, and it carries
            a card's worth of figures rather than a footnote's.

            Outside the unitCostAuth gate below, which waits on a per-fuel
            authentication fetch this card does not use.
          */}
          <BpdbAccountsPanel
            dailyImportRate={generationData.find((g) => g.name === 'Imports')?.unitCost ?? null}
          />

          {/* Daily Milestones */}
          <div className="grid-explorer-chart-card card p-4">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <CheckSquare className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                {/* P1's own block heading. "Operational Milestones" and "System
                    Margins" were our names, and "margin" reads as reserve margin,
                    which nothing in the block is. */}
                <h3 className="grid-explorer-chart-card__title">Power Supply Scenario<DailyBadge /></h3>
                <p className="grid-explorer-chart-card__sub">PGCB&rsquo;s summary block as printed: generation extremes, temperature, unserved energy and gas supplied to power •<span className="text-primary font-semibold text-xs">{coverageLabel('fuelMix')}</span></p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Activity className="h-4 w-4 shrink-0 text-destructive" />
                  Load-Shedding &amp; Demand
                </div>
                {/* All three are printed by PGCB's P1 sheet. */}
                <div className="grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Peak Demand:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">{systemStats.eveningPeakDemand.toFixed(1)} MW</span>
                  <span>Peak Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">{systemStats.eveningPeakGen.toFixed(1)} MW</span>
                  <span>Unserved Energy:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-semibold text-destructive text-left tabular-nums">
                    {systemStats.totalEnergyUnserved == null ? '—' : `${systemStats.totalEnergyUnserved.toFixed(2)} MKWh`}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
                  Generation Extremes &amp; Temperature
                </div>
                {/*
                  All three are printed. Max and min generation are PGCB's own
                  stated extremes for the day, not the load curve's — its stated
                  minimum is the 08:00 reading, which is not always the curve's
                  trough — and the temperature comes from the reported-day block,
                  never the "probable" forecast beside it.
                */}
                <div className="grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Max Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">
                    {systemStats.maxGen == null ? '—' : `${systemStats.maxGen.toFixed(1)} MW`}
                  </span>
                  <span>Min Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">
                    {systemStats.minGen == null ? '—' : `${systemStats.minGen.toFixed(1)} MW`}
                  </span>
                  <span>Max Temp:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-semibold text-foreground text-left tabular-nums">
                    {systemStats.maxTemp == null ? '—' : `${systemStats.maxTemp.toFixed(1)} °C`}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Droplet className="h-4 w-4 shrink-0 text-sky-500" />
                  Gas-to-Power
                </div>
                {/*
                  Gas supplied and gas cost are printed by PGCB — the MMCFD
                  figure is PGCB's own "Total Gas Supplied", not Petrobangla's
                  production total, which is a different measure of a different
                  thing. The unit rate is the quotient of the two, which no
                  agency prints.
                */}
                <div className="grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Gas Supplied:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">{systemStats.totalGasSuppliedPower.toFixed(1)} MMCFD</span>
                  <span>Gas Cost:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left tabular-nums">
                    {(() => {
                      const c = generationData.find(g => g.name === 'Gas')?.cost;
                      return c == null ? '—' : `${(c / 10000000).toFixed(2)} Crore BDT`;
                    })()}
                  </span>
                  <span>Gas Unit Cost:<GridProvenanceTag kind="D" className="ml-1" /></span>
                  <span className="font-semibold text-primary text-left tabular-nums">
                    {(() => {
                      const u = generationData.find(g => g.name === 'Gas')?.unitCost;
                      return u == null ? '—' : `${u.toFixed(2)} Tk/kWh`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Metadata Footer */}
            {/*
              Every figure on this card is parsed from PGCB's P1 and reported-day
              Forecast block — including "Total Gas Supplied", which is PGCB's
              number rather than Petrobangla's, so the Petrobangla credit was
              wrong. The "Audited by NLDC Operators & Petrobangla Billing" line
              went with it: nothing here has opened an audit.
            */}
            <GridCardFooter>
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet and the reported-day Forecast block; Nepal from the En-Curve stack</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>As published by PGCB. Not audited.</span>
              <span className="font-medium">Reporting Period: System Summary (Date: {systemStats.date})</span>
            </GridCardFooter>
          </div>
        </div>
        </GridLockedContent> )
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
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">Cross-Border Power Imports Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. PGCB import data tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          <ImportsKpiStrip
            systemStats={systemStats}
            generationData={generationData}
            borderImportsData={borderImportsData}
            sourceFiles={sourceFiles}
          />

          {dayWindowStrip}
          {provenanceNote}
          {methodologyBanner}
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <Globe className="h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <h3 className="grid-explorer-chart-card__title">Cross-Border Power Imports Tracker<DailyBadge /></h3>
                  <p className="grid-explorer-chart-card__sub">Import allocations and power trade as filed for the day (Report: {systemStats.date}) • <span className="text-primary font-semibold text-xs">{coverageLabel('borderImports')}</span></p>
              </div>
            </div>

            <p className="grid-explorer-table-scroll-hint sm:hidden mx-4" role="note">
              Swipe horizontally to see all columns
            </p>
            <div className="grid-explorer-table-wrap grid-explorer-table-wrap--sticky-col">
              <table className="grid-explorer-table">
                <thead>
                  <tr>
                    <th>Import Source / Line</th>
                    {/* "C/B Interconnector (West)" and the rest are our own
                        labels for the lines, not a classification PGCB prints. */}
                    <th>Type<GridProvenanceTag kind="D" className="ml-1" /></th>
                    {/* Energy and peak are published per line in P1 — except
                        Nepal, whose row is derived from the half-hourly curve
                        and is marked on the row itself. */}
                    <th className="text-left">Daily Energy Imported (MKWh)<GridProvenanceTag kind="P" className="ml-1" /></th>
                    {/* P1 prints "Peak Hr Flow … MW at 21:00 hrs." — an instantaneous
                        flow at one hour. "Capacity Served" read as a capacity. */}
                    <th className="text-left">Peak Hour Flow (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                    {/*
                      The blended-rate column is deliberately not here. PGCB
                      prices imports as one line covering Bheramara, Adani and
                      Tripura together, so any Tk/kWh from it is a single average
                      over three separate commercial agreements at different
                      prices. Published as a rate it reads as "what Bangladesh
                      pays for imported power", or worse as one supplier's
                      tariff, and neither is something the report supports. The
                      cost PGCB does publish stays; the average it implies does
                      not.
                    */}
                    <th className="text-left">Cost (Cr Tk)<GridProvenanceTag kind="P" className="ml-1" /><span className="font-normal text-muted-foreground"> — all lines</span></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Energy and peak flow are published per line. Cost is not:
                      PGCB's production-cost table carries one "Import" figure
                      for all three interconnectors together.

                      Both derived columns used to be filled from that blended
                      rate, which put the SAME Tk/kWh against Bheramara, Adani
                      and Tripura on every day in the archive — three different
                      agreements shown at one price, in a column headed "Unit
                      Rate", where it reads as each line's contracted tariff.
                      The cost column was the same number times this row's
                      energy, so it carried nothing the energy column did not
                      already say while implying a per-line bill that PGCB has
                      never published. */}
                  {borderImportsData.map((bi, idx) => {
                    // PGCB's P1 interconnector block names three lines and not
                    // Nepal — parse_daily_reports says so in its own docstring —
                    // so the Nepal row's energy and peak come from the En-Curve's
                    // Nepal column instead: summed and halved for the day, and
                    // its maximum for the peak. Published and derived rows sit in
                    // the same columns, so the difference is marked on the row.
                    const derivedRow = /nepal/i.test(bi.source);
                    return (
                    <tr key={idx}>
                      <td className="font-semibold">
                        {bi.source}
                        {derivedRow && (
                          <span
                            className="ml-1.5 inline-block px-1.5 py-px rounded border text-[9px] font-bold align-middle bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            title="PGCB does not list this line in its production-cost interconnector block. Its energy and peak are computed here from the half-hourly generation curve PGCB publishes — the day's samples summed and halved, and their maximum."
                          >
                            from curve
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground">{bi.type}</td>
                      <td className="text-left tabular-nums font-semibold">
                        {bi.energy.toFixed(2)}
                        <GridProvenanceTag kind={derivedRow ? 'D' : 'P'} className="ml-1" />
                      </td>
                      <td className="text-left tabular-nums">
                        {formatNumber(Math.round(bi.peakFlow))}
                        <GridProvenanceTag kind={derivedRow ? 'D' : 'P'} className="ml-1" />
                      </td>
                      <td className="text-left tabular-nums text-muted-foreground" title="PGCB publishes one import cost covering all interconnectors, not a figure per line">—</td>
                    </tr>
                    );
                  })}
                  <tr className="border-t border-border/80 font-bold bg-muted/20">
                    <td>Total Grid Imports</td>
                    <td className="text-muted-foreground">National aggregate</td>
                    <td className="text-left tabular-nums text-primary">{borderImportsData.reduce((sum, i) => sum + i.energy, 0).toFixed(2)}</td>
                    <td className="text-left tabular-nums">{formatNumber(Math.round(borderImportsData.reduce((sum, i) => sum + i.peakFlow, 0)))}</td>
                    {/* The published import cost itself, not the line sum times
                        the blended rate. Those two disagree, because P1's fuel
                        table and the interconnector block state slightly
                        different import energy — 46.50 against 45.60 MKWh on
                        2026-08-08 — so recomputing produced a total that was
                        neither figure. A day whose report carries no
                        production-cost block still shows "—": a 0.00 total
                        reads as "imports were free". */}
                    <td className="text-left tabular-nums">
                      {importsCost == null ? '—' : `${(importsCost / 10000000).toFixed(2)} Cr`}
                      <GridProvenanceTag kind="P" className="ml-1" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl mt-4 text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                <strong>Why cost is shown once, and no rate at all:</strong> PGCB reports energy and peak
                flow for each interconnector, but prices imports as a single line in its production-cost
                table — one figure covering all of them. Bheramara, Adani Godda and Tripura are separate
                contracts at different prices, and the report does not say what those prices are. Dividing
                the one cost by the one energy would give a single average across all three, which is not
                the tariff of any of them, so no per-unit rate is published here.
                {importsEnergyMkwh != null && borderImportsData.length > 0 && (() => {
                  const lineSum = borderImportsData.reduce((sum, i) => sum + i.energy, 0);
                  // PGCB states import energy in two places and they disagree,
                  // which matters for reading the cost against the line total.
                  return Math.abs(lineSum - importsEnergyMkwh) > 0.05 ? (
                    <> The cost above covers the {importsEnergyMkwh.toFixed(2)} MKWh the fuel table
                    reports, which differs from the {lineSum.toFixed(2)} MKWh these lines add up to — PGCB
                    states import energy in two places and they do not always agree.</>
                  ) : null;
                })()}
              </p>
              <p>
                <strong>The lines:</strong> Adani Cross-Border Interconnector (Godda Coal Power) provides dedicated
                base-load supply directly to the northern grid interface. HVDC Bheramara is the main synchronous
                link with the Indian National Grid (NTPC/PowerGrid).
              </p>
            </div>

            {/* Card Metadata Footer */}
            <GridCardFooter>
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, import stats block; Nepal from the En-Curve stack</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>As published. Not independently audited.</span>
              <span className="font-medium">Reporting Period: Daily Interconnector Flow (Date: {systemStats.date})</span>
            </GridCardFooter>
          </div>
        </div>
        </GridLockedContent> )
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
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[22rem]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
                <Info className="h-8 w-8 shrink-0 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground">Zone-wise Demand &amp; Load-Shedding Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                No official records are available for the selected date. Zone-wise demand and load-shedding tracking officially started on December 31, 2013.
              </p>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          {/* The zone table is BPDB's on the days PGCB published none, so the
              strip names whichever sheet this day's rows actually came from. */}
          <RegionalKpiStrip
            systemStats={systemStats}
            regionalDemandData={regionalDemandData}
            sourceFiles={sourceFiles}
            sourceLabel={
              regionalDemandSource === 'bpdb-published'
                ? 'BPDB daily generation report — zone table'
                : 'P1 sheet — zone-wise demand and load-shed table'
            }
          />

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Regional Table */}
            <div className="grid-explorer-chart-card card lg:col-span-2">
              <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                <Cable className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h3 className="grid-explorer-chart-card__title">Zone-wise Demand &amp; Load-Shedding<DailyBadge /></h3>
                  {/* The hour is read from P1's own stamp rather than named in
                      prose. It genuinely varies (18:00–21:00 across verified
                      2025–26 days), which is why hardcoding one here was wrong
                      on most days; the sheet has always printed it. Omitted,
                      not guessed, on layouts that carry no stamp. */}
                  <p className="grid-explorer-chart-card__sub">
                    SCADA readings at the evening peak hour {regionalDemandSource === 'bpdb-published' ? 'BPDB' : 'PGCB'} reports for the day
                    {eveningPeakStamp ? (
                      <> — <span className="text-foreground font-semibold">{eveningPeakStamp} hr</span><GridProvenanceTag kind="P" className="ml-1" /></>
                    ) : null}
                    {' '}• <span className="text-primary font-semibold text-xs">{coverageLabel('regionalDemand')}</span>
                  </p>
                </div>
              </div>

              {/* Four columns, and the first is the zone name — so below 40rem
                  each zone becomes a labelled block instead of something to be
                  dragged sideways. */}
              <div className="grid-explorer-table-wrap">
                <table className="grid-explorer-table grid-explorer-table--stack">
                  <thead>
                    <tr>
                      <th>Grid Zone</th>
                      <th className="text-left">Evening Demand (MW)<GridProvenanceTag kind={regionalDemandSource === 'derived-served-plus-shed' ? 'D' : 'P'} className="ml-1" /></th>
                      <th className="text-left">Load-Shedding (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                      <th className="text-left">Shedding Severity<GridProvenanceTag kind="D" className="ml-1" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalDemandData.map((rd, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold">{rd.zone}</td>
                        {/* Unit on the cell, not only in the header: on a phone the
                            header is hidden and this read "6,259" beside "743 MW". */}
                        <td data-label="Evening demand" className="text-left tabular-nums font-medium">{formatNumber(rd.demand)} MW</td>
                        <td data-label="Load-shedding" className="text-left tabular-nums text-destructive font-semibold">
                          {rd.loadShed > 0 ? `${rd.loadShed} MW` : '0 MW'}
                        </td>
                        <td data-label="Severity" className="text-left tabular-nums">
                          {rd.loadShed > 0 ? (
                            <div className="flex items-center justify-start gap-1.5">
                              <span className="font-mono font-bold text-xs text-amber-500">{rd.pct}%</span>
                              <div className="w-12 h-2 rounded bg-muted overflow-hidden">
                                {/* Linear. This bar used to be drawn at pct x 4,
                                    so every zone at or above 25% shed painted
                                    full and the bar contradicted the number
                                    printed beside it. The footer states the
                                    method, so the drawing has to match it. */}
                                <div
                                  className="h-full bg-amber-500 rounded grid-bar-fill"
                                  style={{ width: `${Math.min(rd.pct, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-emerald-500 text-xs font-semibold">Clean (0%)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="is-total border-t border-border/80 font-bold bg-muted/20">
                      <td>Entire Grid Total<GridProvenanceTag kind="D" className="ml-1" /></td>
                      <td data-label="Evening demand" className="text-left tabular-nums text-primary">{formatNumber(totalRegionalDemand)} MW</td>
                      <td data-label="Load-shedding" className="text-left tabular-nums text-destructive">{formatNumber(totalRegionalLoadShed)} MW</td>
                      {/* Not the mean of the nine zone percentages — the
                          demand-weighted grid ratio. Labelled accordingly. */}
                      <td data-label="Severity" className="text-left tabular-nums text-primary">{avgRegionalPct}% grid-wide</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="px-4 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                {regionalDemandSource === 'bpdb-published' ? (
                  <>
                    <strong className="text-foreground">This day is BPDB&rsquo;s table, not PGCB&rsquo;s.</strong>{' '}
                    No PGCB report for this date is held, so the figures come from BPDB&rsquo;s own
                    published zone Demand / Supply / Load-shed table for the same evening peak —
                    a second publisher of the same reading, checked against BPDB&rsquo;s printed
                    total. Severity and the totals row are computed here.
                  </>
                ) : regionalDemandSource === 'derived-served-plus-shed' ? (
                  <>
                    On this day the demand figure is reconstructed as area served + load-shed
                    (no local copy of PGCB&rsquo;s printed Demand column yet) — a derived stand-in,
                    not the published cell. Load-shed is PGCB&rsquo;s own figure; severity and the
                    totals row are computed here.
                  </>
                ) : (
                  <>
                    Demand and load-shed are PGCB&rsquo;s own zone table, verified cell-for-cell
                    against the source workbooks across 2025 and 2026. Severity and the totals row
                    are computed here.
                  </>
                )}
              </div>

              {/* Card Metadata Footer */}
              {/* The method behind the only computed column on this card,
                  stated rather than left to be inferred from the D tag. */}
              <div className="px-4 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">How severity is calculated</span>
                <GridProvenanceTag kind="D" className="ml-1.5" />
                <span className="mx-1.5 text-muted-foreground/50">·</span>
                Shedding severity = that zone&rsquo;s load-shed ÷ its demand × 100, to one decimal.
                Demand is the full figure including the shed portion, so severity is the share of
                demand that went unserved; the bar is drawn to the same percentage. The final row
                divides the summed shed by the summed demand — a grid-wide ratio, which is not the
                same as averaging the nine zone percentages and will read lower when shedding
                falls on the smaller zones. Both inputs are published; neither publisher states a
                severity figure.
              </div>

              <GridCardFooter>
                {regionalDemandSource === 'bpdb-published' ? (
                  <span>Source: <a href="https://misc.bpdb.gov.bd/daily-generation-archive" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Daily Generation Report</a> — zone table</span>
                ) : (
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, zone-wise demand and load-shed table</span>
                )}
                {/* On BPDB-sourced days the PGCB workbook is not what produced this
                    table, so naming it would miscredit the figures. */}
                {regionalDemandSource !== 'bpdb-published' && sourceFiles?.pgcb ? (
                  <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} />
                ) : null}
                <span>As published. Not independently audited.</span>
                <span className="font-medium">Reporting Period: Evening Peak Load (Date: {systemStats.date})</span>
              </GridCardFooter>
            </div>

            {/* Daily Outage Log */}
            <div className="grid-explorer-chart-card card lg:col-span-1">
              <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                <FileText className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <h3 className="grid-explorer-chart-card__title">NLDC Outage Log<DailyBadge /></h3>
                  <p className="grid-explorer-chart-card__sub">Outage events as printed in the day&rsquo;s report ({systemStats.date}) •<span className="text-primary font-semibold text-xs">{coverageLabel('outages')}</span></p>
                  {/* Not uniformly P: PGCB prints ONE free-text description per
                      event, and the asset/cause split shown below is ours. */}
                  <p className="mt-1.5 text-[10px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <GridProvenanceTag kind="P" /> time, description, lost load
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GridProvenanceTag kind="D" /> split into asset and cause
                    </span>
                  </p>
                </div>
              </div>

              {/* Grows into whatever height the zone table beside it sets, rather
                  than stopping at a fixed 31.5rem and leaving the footer stranded
                  at the bottom of the stretched card. The basis keeps that height
                  when the card stands alone (one column on small screens), and
                  min-h-0 lets the scroll container shrink instead of forcing the
                  full list height. */}
              <div className="space-y-4 flex-[1_1_31.5rem] min-h-0 overflow-y-auto pr-1">
                {dailyOutages.map((o, idx) => (
                  <div key={idx} className="p-3 bg-muted/15 border border-border/30 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>{o.plant}</span>
                      <span className="text-muted-foreground font-mono font-normal">{o.time}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-muted-foreground">
                      <span>{o.reason}</span>
                      {/* `load` holds a published MW figure only when the report
                          prints one; otherwise the parser stores the literal
                          "HT Outage", which is a category, not a measurement,
                          and must not be styled like one. */}
                      {/\d/.test(o.load) ? (
                        <span className="font-semibold text-destructive whitespace-nowrap">
                          {o.load}
                          <GridProvenanceTag kind="P" className="ml-1" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70 whitespace-nowrap italic">
                          no load stated
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Metadata Footer */}
              <GridCardFooter>
                <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, NLDC daily outage log</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
                <span>Asset and cause are cut from PGCB&rsquo;s single event description; the wording is theirs.</span>
                <span className="font-medium">Reporting Period: 24-Hour Logs (Date: {systemStats.date})</span>
              </GridCardFooter>
            </div>

            {/* Zone-wise generation. The table above is what each zone was
                asked for; this is what it produced. The two are deliberately
                never divided into one another — demand there is MW at a single
                instant, generation here is MKWh across the whole day, and a
                self-sufficiency ratio built from the pair would be meaningless.
                Read side by side they still carry the point: Mymensingh's four
                MKWh against Barishal's sixty is the transmission task. */}
            {zoneGenerationData.length > 0 ? (
              <div className="grid-explorer-chart-card card lg:col-span-3">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <Factory className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Zone-wise Generation by Fuel<DailyBadge /></h3>
                    <p className="grid-explorer-chart-card__sub">
                      Energy generated inside each zone across the full day, in MKWh
                      {zoneGenNationalTotal > 0 ? <> • {zoneGenNationalTotal.toFixed(2)} MKWh national <GridProvenanceTag kind="P" /></> : null}
                    </p>
                  </div>
                  <span className="grid-explorer-chip">P1</span>
                </div>

                {/* Nine zones by eight fuels. Stacked whole that is 72
                    label/value pairs on a phone, half of them zero, so the
                    zeros drop out of the list and are named together on the
                    "No output" line below each zone — moved, not discarded. */}
                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table grid-explorer-table--stack-wide">
                    <thead>
                      <tr>
                        <th>Grid Zone</th>
                        {zoneGenFuels.map((fuel) => (
                          <th key={fuel} className="text-left whitespace-nowrap">
                            {/* The eight fuel hues cannot be told apart by colour
                                alone, so each is named here beside its swatch
                                rather than relying on a legend. */}
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                aria-hidden="true"
                                className="inline-block h-2 w-2 rounded-sm shrink-0"
                                style={{ backgroundColor: chartTheme.fuel(fuel) }}
                              />
                              {fuel}
                            </span>
                            <GridProvenanceTag kind="P" className="ml-1" />
                          </th>
                        ))}
                        <th className="text-left">Zone Total<GridProvenanceTag kind="P" className="ml-1" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneGenerationData.map((zg) => (
                        <tr key={zg.zone}>
                          <td className="font-semibold whitespace-nowrap">{zg.zone}</td>
                          {zoneGenFuels.map((fuel) => (
                            <td
                              key={fuel}
                              data-label={fuel}
                              className={cn(
                                'text-left tabular-nums',
                                zg.fuels[fuel]
                                  ? 'font-medium'
                                  : 'is-zero text-muted-foreground/60',
                              )}
                            >
                              {formatZoneEnergy(zg.fuels[fuel])}
                            </td>
                          ))}
                          <td data-label="Zone total" className="text-left tabular-nums font-semibold text-primary">{zg.total.toFixed(2)}</td>
                          {/* Phone only. Named rather than counted: "5 fuels at
                              zero" would be a summary, and this is the reading
                              PGCB published for each of them. */}
                          <td data-label="No output" className="grid-explorer-table__zeros">
                            {zoneGenFuels.filter((f) => !zg.fuels[f]).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                      <tr className="is-total border-t border-border/80 font-bold bg-muted/20">
                        <td>National Total</td>
                        {zoneGenFuels.map((fuel) => (
                          <td
                            key={fuel}
                            data-label={fuel}
                            className={cn(
                              'text-left tabular-nums',
                              zoneGenPublishedTotals[fuel] ? '' : 'is-zero',
                            )}
                          >
                            {formatZoneEnergy(zoneGenPublishedTotals[fuel])}
                          </td>
                        ))}
                        <td data-label="Zone total" className="text-left tabular-nums text-primary">{zoneGenNationalTotal.toFixed(2)}</td>
                        <td data-label="No output" className="grid-explorer-table__zeros">
                          {zoneGenFuels.filter((f) => !zoneGenPublishedTotals[f]).join(', ') || '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="px-4 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Every figure on this card is published</span>
                  <GridProvenanceTag kind="P" className="ml-1.5" />
                  <span className="mx-1.5 text-muted-foreground/50">·</span>
                  PGCB prints this table zone by zone and states its own National Total row, which is
                  the row shown here and the same one the fuel-mix chart is built from. The nine zone
                  rows sum to it, so the two are a check on each other rather than one being derived
                  from the other. A dash means the fuel has no column on this day&rsquo;s sheet; a
                  zero means the zone generated none. Figures under 0.01 MKWh are shown as
                  &lsquo;&lt;0.01&rsquo; rather than rounded to nothing.
                </div>

                <GridCardFooter>
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, zone-wise generation summary</span>
                  {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
                  <span>As published. Not independently audited.</span>
                  <span className="font-medium">Reporting Period: Full day (Date: {systemStats.date})</span>
                </GridCardFooter>
              </div>
            ) : null}

            {/* East-West Interconnector. Full width, and last: the two cards
                above are the two halves of each zone's day — what it was asked
                for, and what it generated — and this is the wire that carries
                the difference between the country's halves. A 24-hour series
                also reads better across the full width than in two thirds. */}
            {ewic ? (
              <div className="grid-explorer-chart-card card lg:col-span-3">
                <div className="grid-explorer-chart-card__head">
                  <div className="flex items-center gap-2.5 min-w-0">
                  <Cable className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <h3 className="grid-explorer-chart-card__title">East-West Interconnector Transfer<DailyBadge /></h3>
                    <p className="grid-explorer-chart-card__sub">
                      Hourly flow across the three corridors joining the western and eastern grids
                      {ewicTotalMkwh != null ? (
                        <> • {ewicTotalMkwh.toFixed(2)} MKWh transferred <GridProvenanceTag kind="P" />
                          {ewicShareOfGen != null ? <> · {ewicShareOfGen.toFixed(1)}% of national generation <GridProvenanceTag kind="D" /></> : null}
                          {ewicExceedsGeneration ? (
                            <span className="text-amber-600 dark:text-amber-500 font-semibold">
                              {' '}· exceeds the day&rsquo;s national generation — see the reconciliation note
                            </span>
                          ) : null}
                          {ewicNet ? <> · flowing {ewicNet.westToEast ? 'west to east' : 'east to west'}</> : null}
                          {ewicPeakSum ? <> · peak {formatNumber(Math.round(Math.abs(ewicPeakSum.mw)))} MW at {ewicPeakSum.time}<GridProvenanceTag kind="P" /></> : null}
                        </>
                      ) : null}
                    </p>
                  </div>
                  </div>
                  <span className="grid-explorer-chip">EWIC</span>
                </div>

                {/* The sheet's own footnote defines the sign, and the whole card
                    is unreadable without it — so it is stated, not buried. */}
                <p className="text-[11px] text-muted-foreground mb-3">
                  Positive MW is flow from <strong>West to East</strong>; negative is East to West.
                  Every reading in the archive so far has been positive — the western grid has
                  exported to the eastern one on every hour on record, and Total Import has been
                  zero on every day.
                </p>

                {/* Corridor names appear on the lanes and again on the bands
                    they label, so no separate legend is carried: a key exists to
                    stop a reader matching colours, and there is nothing here to
                    match. */}
                <InterconnectorCanvas
                  corridors={ewic.corridors}
                  rows={ewic.rows}
                  color={(i) => chartTheme.categorical(i)}
                  axisColor={chartTheme.axisTick}
                  gridColor={chartTheme.gridStroke}
                  reportDate={systemStats.date}
                />

                {/* Per-circuit metered energy. Ranked, and labelled in place —
                    six bars do not need a second colour scale to be read. */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Metered energy by circuit <GridProvenanceTag kind="P" />
                  </h4>
                  <div className="space-y-1.5">
                    {ewicCircuitBars.map((c) => (
                      <div key={c.circuit} className="flex items-center gap-3 text-[11px]">
                        <span className="w-44 shrink-0 text-muted-foreground truncate">{c.circuit}</span>
                        <span className="flex-1 h-3 rounded-sm bg-muted/30 overflow-hidden">
                          <span className="block h-full rounded-sm grid-bar-fill" style={{ width: `${c.pct}%`, background: chartTheme.categorical(c.corridorIndex) }} />
                        </span>
                        <span className="w-24 shrink-0 text-right font-semibold tabular-nums">{(c.energyKwh / 1e6).toFixed(2)} MKWh</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* A failed reconciliation is shown to the reader, not swallowed
                    — the same rule the gas Sub-Total gate follows. */}
                {ewic.checks.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
                    <div className="text-[11px] font-bold text-amber-500 mb-1">Reconciliation note</div>
                    {ewic.checks.map((c) => (
                      <p key={c.scope} className="text-[11px] text-muted-foreground leading-relaxed">{c.message}</p>
                    ))}
                  </div>
                ) : null}

                <GridCardFooter>
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — EWIC sheet, East-West Interconnector Log</span>
                  {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
                  <span>Flows and circuit energy as published. The energy column is headed &ldquo;MkWHr&rdquo; and printed in kWh; converted here, not restated.</span>
                  <span className="font-medium">Reporting Date: {systemStats.date}</span>
                </GridCardFooter>
              </div>
            ) : null}

          </div>

          {/*
            "Transmission Grid Assets" was removed here.

            It rendered `settings.gridLines` — four rows typed into the admin
            Settings form, with a hardcoded fallback — under a footer crediting
            "Power Grid Bangladesh PLC — transmission line register" and a link
            to pgcb.gov.bd. No such register is read by anything in this
            pipeline, so the card attributed hand-entered content to an agency
            that never supplied it, beside genuinely daily PGCB data, in a tab
            keyed to a date the card had no relationship with. Its subtitle also
            claimed "Tracked since 2014" for a list carrying no dates at all.

            The right fix would be a real source. There is not one: PGCB
            publishes no machine-readable line register, and nothing in the daily
            report carries per-line capacity or status. Rather than keep a card
            whose provenance cannot be stated truthfully, it is gone. The
            settings field and the admin editor are left in place, so this can
            return the day it has something behind it.
          */}
        </div>
        </GridLockedContent> )
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