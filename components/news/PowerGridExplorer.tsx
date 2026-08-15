'use client';


import dynamic from 'next/dynamic';
import { useEffect, useId, useState, useRef, RefObject, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, Activity, Cable, TrendingUp, FileText, BarChart3, MapPin, DollarSign, Database, Droplet, Globe, Sun,
  Search, ChevronLeft, ChevronRight, ChevronDown, Check, Info, Map, Network, CheckSquare, Calendar, RotateCcw, History, Landmark, Factory, ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { substationsData } from '@/lib/data/infrastructure/substations';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Line, CartesianGrid, Area, ComposedChart,
} from 'recharts';
import { cn, formatNumber, formatUnitRate, formatBdtAmount } from '@/lib/utils';
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
  GridChartFrame,
  GridRechartsLegend,
  GRID_CHART_MARGIN,
  GRID_EXPLORER_CHART_MARGIN,
  GRID_X_AXIS_PADDING,
  GRID_Y_AXIS_WIDTH,
  BDT_TO_CRORE,
  REGIONAL_ZONE_COLORS,
  formatAxisCrore,
  formatAxisMw,
  formatAxisMwCompact,
  formatAxisMmcfd,
  formatPgcbMonthlyTick,
  gridChartAxisTick,
  gridChartSplitUnitTick,
  gridChartXAxisProps,
  gridChartYAxisProps,
  GridRechartsTooltip,
  useNarrowChartCard,
} from '@/components/news/PowerGridChartUI';
import type { GridDailyData } from '@/lib/data/grid/types';
import { shouldUseArchiveFallback } from '@/lib/data/grid/daily-access';
import {
  getCachedDailyReport,
  peekLatestCachedReport,
  resolveInitialDailyReport,
  seedDailyReportCache,
  setCachedDailyReport,
} from '@/lib/data/grid/daily-cache';
import { availableDates, getLatestAvailableDate, isDateAvailable } from '@/lib/data/grid/available-dates';
import { GRID_DEMO_DATE } from '@/lib/data/grid/public-sample-dates';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { TIME_AXIS_PROPS, axisTickStyle, wholeHourTicks } from '@/lib/data/grid/chart-axis';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { isoDateToLegacy } from '@/lib/data/grid/date-utils';
import { getLatestMonthlyDateKey } from '@/lib/data/companies/pgcb';
import {
  usePgcbMonthlyEvents,
  usePgcbMonthlyRecord,
  usePgcbMonthlySeries,
} from '@/lib/data/companies/usePgcbMonthly';
import { PgcbMonthlyDetail } from '@/components/news/power-grid/PgcbMonthlyDetail';
import { UnitCostBadge } from '@/components/news/power-grid/UnitCostBadge';
import { useUnitCostAuthentication, type UnitCostFact } from '@/components/news/power-grid/useUnitCostAuthentication';
import { EnergyCurveChart } from '@/components/news/power-grid/EnergyCurveChart';
import { bpdbAuditedFinancials } from '@/lib/data/companies/bpdb';
import { totalCapacityRenewables } from '@/lib/data/companies/sreda';
import { ongoingProjectsData } from '@/lib/data/infrastructure/projects-ongoing';
import { upcomingProjectsData } from '@/lib/data/infrastructure/projects-upcoming';
import { completedProjectsData } from '@/lib/data/infrastructure/projects-completed';
import { macroTariffData } from '@/lib/data/macro/tariff';
import { macroGasData } from '@/lib/data/macro/gas';
import { macroEconomicData, petrobanglaAuditedFinancials } from '@/lib/data/macro/economics';
import { globalVsDomesticData, historicalExchangeRates } from '@/lib/data/macro/fuel-prices';

import { macroInfrastructureData } from '@/lib/data/macro/infrastructure';
import { nationalBudgetData } from '@/lib/data/macro/budget';
import { systemLossData } from '@/lib/data/macro/system-loss';
import {
  PGCB_MONTHLY_VERIFICATION,
  staleRowsFor,
  monthLabel,
} from '@/lib/data/pgcb-monthly-verification';
import { CustomDropdown, TakaIcon, getUpcomingProjectStatusInfo, renderProjectCost } from '@/components/news/power-grid/shared';
import { OverviewKpiStrip } from '@/components/news/power-grid/OverviewKpiStrip';
import {
  GenerationKpiStrip,
  ImportsKpiStrip,
  RegionalKpiStrip,
  StationsKpiStrip,
} from '@/components/news/power-grid/TabKpiStrips';
import { PowerStationsTab } from '@/components/news/power-grid/PowerStationsTab';
import { BpdbAccountsPanel } from '@/components/news/power-grid/BpdbAccountsPanel';
import { DailyBadge, GridCardFooter, GridProvenanceTag, GridSourceFiles, MonthlyBadge } from '@/components/news/power-grid/GridExplorerUI';
import { GridDataTable, type GridTableDensity } from '@/components/news/power-grid/GridDataTable';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { GridExplorerUrlSyncer } from '@/components/news/power-grid/GridExplorerUrlSyncer';
import type { GridExplorerUrlBoot } from '@/lib/grid-explorer-url';
import { MethodologyReconciliationBanner } from '@/components/news/power-grid/MethodologyReconciliationBanner';
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
const GasReserveDepletionTab = dynamic(
  () => import('@/components/news/power-grid/GasReserveDepletionTab').then((m) => m.GasReserveDepletionTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" /> },
);
const LongitudinalStudyCharts = dynamic(
  () => import('@/components/news/power-grid/LongitudinalStudy').then((m) => m.LongitudinalStudyCharts),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-80 rounded-2xl" /> },
);
// Ships ~5 MB of per-check detail across six months, one month file at a time,
// so it must not be in the initial bundle.
const PublishedVsDerivedTab = dynamic(
  () => import('@/components/news/power-grid/PublishedVsDerivedTab').then((m) => m.PublishedVsDerivedTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" /> },
);

const RenewablesTab = dynamic(
  () => import('@/components/news/power-grid/RenewablesTab').then((m) => m.RenewablesTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" /> },
);

interface GridLineItem {
  name: string;
  status: string;
  capacity: string;
  owner: string;
  load: number;
}

interface PowerGridExplorerProps {
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

/**
 * Stands in for the cost chart on days whose report carries no per-fuel
 * "Production Cost (Tk.)" block. Roughly half the archive is in that state: the
 * archive rebuild nulls the split rather than guess it when no source workbook
 * is confirmed for the day. The day's own total is still measured, so show it —
 * the absence is in the breakdown, not in the cost.
 */
function GridUnpublishedCostNote({ totalDailyCostBdt }: { totalDailyCostBdt?: number | null }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-6 rounded-xl border border-dashed border-border/60 bg-muted/10">
      <Info className="h-5 w-5 text-muted-foreground/70" />
      <p className="text-sm font-semibold text-foreground">Per-fuel cost not published for this day</p>
      <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
        PGCB&apos;s report for this date carries no production-cost breakdown by fuel.
        {totalDailyCostBdt
          ? ` The published day total — ${formatBdtAmount(totalDailyCostBdt / 10000000)} Cr Tk. — is shown above.`
          : ''}
      </p>
    </div>
  );
}

/**
 * Tooltip for Brent Crude vs. Retail Diesel.
 *
 * Lifted out of the card so the wide chart and the two narrow ones share one
 * definition. The card renders a different element tree below
 * GRID_DUAL_AXIS_MIN_WIDTH, and a tooltip copied into each tree is a tooltip
 * that drifts: every field here — the exchange rate, the derived Tk/L
 * equivalent, the subsidy gap and both provenance tags — has to survive the
 * split, and sharing the component is what makes that true by construction
 * rather than by review.
 */
function GridBrentDieselTooltip({
  active,
  payload,
  exchangeRates,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: { year: string; globalOil: number; bdDiesel: number } }>;
  exchangeRates: Record<string, number>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const exRate = exchangeRates[d.year] || 122.0;
  // 1 bbl = 158.987 L
  const brentBdtL = (d.globalOil * exRate) / 158.987;
  const difference = d.bdDiesel - brentBdtL;
  return (
    <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
      <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
        <span>Benchmark Oil Price ({d.year})</span>
        <span className="text-[9px] uppercase font-bold text-blue-500 tracking-wider">Oil</span>
      </div>
      <div className="space-y-2 text-[11px] md:text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Brent Crude:</span>
          <span className="font-bold text-blue-500">${d.globalOil.toFixed(2)} / Bbl</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Exchange Rate:</span>
          <span className="font-semibold text-foreground">{exRate.toFixed(2)} Tk/$</span>
        </div>
        <div className="flex justify-between border-t border-border/20 pt-1">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Brent Cost (Tk/L equivalent):</span>
          <span className="font-bold text-blue-400">{brentBdtL.toFixed(2)} Tk/L</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />BD Retail Diesel:</span>
          <span className="font-bold text-emerald-500">{d.bdDiesel.toFixed(2)} Tk/L</span>
        </div>
        <div className="flex justify-between border-t border-border/20 pt-1 border-dashed">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Margin / Subsidy Gap:</span>
          <span className={cn("font-bold", difference >= 0 ? "text-emerald-500" : "text-destructive")}>
            {difference >= 0 ? `+${difference.toFixed(2)} Tk/L (Premium)` : `${difference.toFixed(2)} Tk/L (Subsidized)`}
          </span>
        </div>
      </div>
      <div className="mt-2.5 pt-1.5 border-t border-border/30 text-[8px] text-muted-foreground leading-normal font-medium">
        <strong>Formula:</strong> <code>(Brent USD * Exchange Rate) / 158.987 L</code>
      </div>
      <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
        <div><strong>Series from:</strong> OPEC Bulletin, World Bank Pink Sheet, BPC</div>
        <div><strong>Ref:</strong> <a href="https://bpc.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BPC Pricing Gazettes</a></div>
      </div>
    </div>
  );
}

/**
 * Brent Crude vs. Retail Diesel.
 *
 * A card rather than inline JSX because the macro tab's body is an IIFE, and
 * the width observer this needs is a hook. Extracting it is also what keeps the
 * diff in this file small.
 *
 * Wide, it is the chart it has always been: one plot, two value axes, one
 * legend. At or below GRID_DUAL_AXIS_MIN_WIDTH the same two series are drawn as
 * two stacked plots, each with the single axis its own unit needs. Measured at
 * 393px the combined chart plotted 194px of a 352px card (55.2%); split, each
 * plot gets the full width back.
 *
 * Nothing is dropped to buy that. Both series are still drawn, both axes still
 * carry their unit, the year axis is repeated under each plot rather than
 * shared so neither chart depends on the other being read first, and the
 * tooltip is one shared component so all five of its fields and both
 * provenance tags are identical in either layout. The legend becomes a caption
 * per plot — one series each, which the brief prefers to a legend.
 */
function GridBrentDieselCard({
  data,
  exchangeRates,
  chartTheme,
  ready,
}: {
  data: ReadonlyArray<{ year: string; globalOil: number; bdDiesel: number }>;
  exchangeRates: Record<string, number>;
  chartTheme: ChartTheme;
  ready: boolean;
}) {
  const [cardRef, isNarrow] = useNarrowChartCard();

  const tooltip = (
    <Tooltip
      content={({ active, payload }) => (
        <GridBrentDieselTooltip
          active={active}
          payload={payload as unknown as React.ComponentProps<typeof GridBrentDieselTooltip>['payload']}
          exchangeRates={exchangeRates}
        />
      )}
    />
  );

  const xAxis = (
    <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
  );

  return (
    <div ref={cardRef} className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head">
        <div>
          <h3 className="grid-explorer-chart-card__title">Brent Crude vs. Retail Diesel</h3>
        <p className="grid-explorer-chart-card__sub">Brent Crude (USD/Bbl) vs. Domestic Retail Diesel (Tk/L) — <span className="text-primary font-semibold text-xs">Tracked since 1975</span></p>
        </div>
        <span className="grid-explorer-chip bg-blue-500/5 text-blue-500 border-blue-500/10">Petroleum</span>
      </div>

      {!ready ? (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
          <div className="grid-explorer-skeleton" />
        </div>
      ) : isNarrow ? (
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p className="grid-explorer-chart-caption">
              <span className="grid-explorer-chart-caption__swatch" style={{ background: '#3b82f6' }} />
              Brent Crude ($/bbl)
            </p>
            <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                  {xAxis}
                  <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `$${v}`} />
                  {tooltip}
                  <Line type="monotone" dataKey="globalOil" name="Brent Crude ($/bbl)" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="grid-explorer-chart-caption">
              <span className="grid-explorer-chart-caption__swatch" style={{ background: '#10b981' }} />
              BD Retail Diesel (Tk/L)
            </p>
            <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                  {xAxis}
                  <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} />
                  {tooltip}
                  <Area type="monotone" dataKey="bdDiesel" name="BD Retail Diesel (Tk/L)" fill="#10b981" fillOpacity={0.05} stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
              <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `$${v}`} label={{ value: 'Brent Crude ($/bbl)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '9px', fill: chartTheme.axisTick } }} />
              <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} label={{ value: 'Retail Diesel (Tk/L)', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: '9px', fill: chartTheme.axisTick } }} />
              {tooltip}
              <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="globalOil" name="Brent Crude ($/bbl)" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} />
              <Area yAxisId="right" type="monotone" dataKey="bdDiesel" name="BD Retail Diesel (Tk/L)" fill="#10b981" fillOpacity={0.05} stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Card Metadata Footer */}
      <GridCardFooter>
        <span>Source: OPEC Bulletin Historical Spot Prices &amp; <a href="https://bpc.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPC Official Pricing Gazettes</a></span>
        <span>As published. Not independently audited.</span>
        <span className="font-medium">Reporting Period: Global Comparison (1975 - 2026)</span>
      </GridCardFooter>
    </div>
  );
}

/** Tooltip for Global LNG Benchmark vs. Gas Tariff. Shared by both layouts for
 *  the same reason as the Brent one — see GridBrentDieselTooltip. */
function GridLngTariffTooltip({
  active,
  payload,
  exchangeRates,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: { year: string; globalGas: number; bdGas: number } }>;
  exchangeRates: Record<string, number>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const exRate = exchangeRates[d.year] || 122.0;
  // 1 MMBtu = 28.3 CM (Cubic Meters)
  const globalGasBdtCm = (d.globalGas * exRate) / 28.3;
  const difference = d.bdGas - globalGasBdtCm;
  return (
    <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
      <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
        <span>Benchmark Gas Price ({d.year})</span>
        <span className="text-[9px] uppercase font-bold text-violet-500 tracking-wider">Gas</span>
      </div>
      <div className="space-y-2 text-[11px] md:text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Global LNG (US/JKM):</span>
          <span className="font-bold text-violet-500">${d.globalGas.toFixed(2)} / MMBtu</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Exchange Rate:</span>
          <span className="font-semibold text-foreground">{exRate.toFixed(2)} Tk/$</span>
        </div>
        <div className="flex justify-between border-t border-border/20 pt-1">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Global Gas (Tk/CM equivalent):</span>
          <span className="font-bold text-violet-400">{globalGasBdtCm.toFixed(2)} Tk/CM</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />BD Avg Gas Tariff:</span>
          <span className="font-bold text-amber-500">{d.bdGas.toFixed(2)} Tk/CM</span>
        </div>
        <div className="flex justify-between border-t border-border/20 pt-1 border-dashed">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Subsidization Gap:</span>
          <span className={cn("font-bold", difference >= 0 ? "text-emerald-500" : "text-destructive")}>
            {difference >= 0 ? `+${difference.toFixed(2)} Tk/CM` : `${difference.toFixed(2)} Tk/CM (Subsidized)`}
          </span>
        </div>
      </div>
      <div className="mt-2.5 pt-1.5 border-t border-border/30 text-[8px] text-muted-foreground leading-normal font-medium">
        <strong>Formula:</strong> <code>(Global LNG USD * Exchange Rate) / 28.3 CM</code>
      </div>
      <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
        <div><strong>Series from:</strong> World Bank Pink Sheet, JKM Index, Petrobangla</div>
        <div><strong>Ref:</strong> <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Petrobangla Audited Reports</a></div>
      </div>
    </div>
  );
}

/**
 * Global LNG Benchmark vs. Gas Tariff — the second dual-axis card on
 * macro/global, split on the same terms as GridBrentDieselCard. Measured 204px
 * of a 362px card (56.4%) combined.
 */
function GridLngTariffCard({
  data,
  exchangeRates,
  chartTheme,
  ready,
}: {
  data: ReadonlyArray<{ year: string; globalGas: number; bdGas: number }>;
  exchangeRates: Record<string, number>;
  chartTheme: ChartTheme;
  ready: boolean;
}) {
  const [cardRef, isNarrow] = useNarrowChartCard();

  const tooltip = (
    <Tooltip
      content={({ active, payload }) => (
        <GridLngTariffTooltip
          active={active}
          payload={payload as unknown as React.ComponentProps<typeof GridLngTariffTooltip>['payload']}
          exchangeRates={exchangeRates}
        />
      )}
    />
  );

  const xAxis = (
    <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
  );

  return (
    <div ref={cardRef} className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head">
        <div>
          <h3 className="grid-explorer-chart-card__title">Global LNG Benchmark vs. Gas Tariff</h3>
        <p className="grid-explorer-chart-card__sub">Global Gas/LNG (USD/MMBtu) vs. BD Avg Tariff (Tk/CM) — <span className="text-primary font-semibold text-xs">Tracked since 2010</span></p>
        </div>
        <span className="grid-explorer-chip bg-violet-500/5 text-violet-500 border-violet-500/10">Natural Gas</span>
      </div>

      {!ready ? (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
          <div className="grid-explorer-skeleton" />
        </div>
      ) : isNarrow ? (
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p className="grid-explorer-chart-caption">
              <span className="grid-explorer-chart-caption__swatch" style={{ background: '#8b5cf6' }} />
              Global LNG ($/MMBtu)
            </p>
            <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                  {xAxis}
                  <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `$${v}`} />
                  {tooltip}
                  <Line type="monotone" dataKey="globalGas" name="Global LNG ($/MMBtu)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="grid-explorer-chart-caption">
              <span className="grid-explorer-chart-caption__swatch" style={{ background: '#f59e0b' }} />
              BD Avg Gas Tariff (Tk/CM)
            </p>
            <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                  {xAxis}
                  <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} />
                  {tooltip}
                  <Area type="monotone" dataKey="bdGas" name="BD Avg Gas Tariff (Tk/CM)" fill="#f59e0b" fillOpacity={0.05} stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
              <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `$${v}`} label={{ value: 'Global LNG ($/MMBtu)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '9px', fill: chartTheme.axisTick } }} />
              <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} label={{ value: 'BD Avg Gas Tariff (Tk/CM)', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: '9px', fill: chartTheme.axisTick } }} />
              {tooltip}
              <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="globalGas" name="Global LNG ($/MMBtu)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 3 }} />
              <Area yAxisId="right" type="monotone" dataKey="bdGas" name="BD Avg Gas Tariff (Tk/CM)" fill="#f59e0b" fillOpacity={0.05} stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Card Metadata Footer */}
      <GridCardFooter>
        <span>Source: World Bank Pink Sheets &amp; <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Petrobangla Annual Reports</a></span>
        <span>As published. Not independently audited.</span>
        <span className="font-medium">Reporting Period: Global Comparison (2010 - 2026)</span>
      </GridCardFooter>
    </div>
  );
}

export function PowerGridExplorer({
  initialLines,
  urlBoot,
  prefetchedDailyReports,
  serverLatestDate,
  runtimeDates,
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
  
  // Date Selection States
  const availableDatesList = useMemo<string[]>(() => {
    const valid = /^(201[1-9]|202[0-9])-\d{2}-\d{2}$/;
    const merged = new Set(availableDates.filter((d) => valid.test(String(d))));
    for (const d of runtimeDates ?? []) {
      if (valid.test(d)) merged.add(d);
    }
    return [...merged].sort();
  }, [runtimeDates]);

  const latestDate = gridAccess.latestDate || serverLatestDate || getLatestAvailableDate() || '2026-07-03';
  const bootDate = urlBoot?.date ?? latestDate;

  useMemo(() => {
    if (prefetchedDailyReports) seedDailyReportCache(prefetchedDailyReports);
    return null;
  }, [prefetchedDailyReports]);

  const [selectedDate, setSelectedDate] = useState<string>(bootDate);
  const [tierLockRequired, setTierLockRequired] = useState<ReturnType<typeof gridAccess.requiredTierForDate> | null>(null);
  const [activeData, setActiveData] = useState<GridDailyData | null>(() =>
    resolveInitialDailyReport(bootDate, latestDate, prefetchedDailyReports),
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

  // Helper to get color-shifting backlog badge styles (psychological timeline)
  const getBacklogBadgeStyles = useCallback((selected: string, latest: string) => {
    try {
      const selDate = new Date(selected);
      const latDate = new Date(latest);
      const diffTime = latDate.getTime() - selDate.getTime();
      if (diffTime <= 0) {
        return {
          className: "bg-primary/10 text-primary border border-primary/20",
          text: "Latest"
        };
      }
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate text representation
      let text = '';
      if (diffDays < 30) {
        text = `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'} Ago`;
      } else if (diffDays < 365) {
        const diffMonths = Math.round(diffDays / 30.4);
        text = `${diffMonths} ${diffMonths === 1 ? 'Month' : 'Months'} Ago`;
      } else {
        const diffYears = (diffDays / 365).toFixed(1);
        text = `${diffYears} Years Ago`;
      }

      // Determine subtle color classes based on age
      if (diffDays < 90) { // < 3 months (Recent)
        return {
          className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          text
        };
      }
      if (diffDays < 365) { // < 1 year (Short-term)
        return {
          className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20",
          text
        };
      }
      if (diffDays < 1095) { // 1 - 3 years (Medium-term)
        return {
          className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
          text
        };
      }
      if (diffDays < 2555) { // 3 - 7 years (Deep)
        return {
          className: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
          text
        };
      }
      // > 7 years (Deep Historical Abyss)
      return {
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold",
        text
      };
    } catch {
      return {
        className: "bg-muted text-muted-foreground",
        text: "Archive"
      };
    }
  }, []);

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
    if (gridAccess.canAccessDate(isoDate)) {
      setTierLockRequired(null);
      setSelectedDate(isoDate);
      return;
    }
    setTierLockRequired(gridAccess.requiredTierForDate(isoDate));
    setSelectedDate(isoDate);
  }, [gridAccess]);

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
        locked: !gridAccess.canAccessDate(iso),
      };
    });
  }, [daysForMonth, selectedYear, selectedMonth, gridAccess]);

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
          setIsDataMissing(false);
        } else if (!result.ok && result.status === 403) {
          setTierLockRequired(gridAccess.requiredTierForDate(selectedDate));
          setIsDataMissing(false);
        } else if (!result.ok && shouldUseArchiveFallback(result.status ?? null)) {
          const { getArchiveFallback } = await import('@/lib/data/grid/archive-fallback');
          const fallback = getArchiveFallback(selectedDate);
          const stale = getCachedDailyReport(selectedDate);
          if (fallback) {
            setCachedDailyReport(selectedDate, fallback);
            setActiveData(fallback);
            setIsDataMissing(false);
          } else if (stale) {
            setActiveData(stale);
            setIsDataMissing(false);
          } else {
            setActiveData(null);
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
            setIsDataMissing(false);
          } else {
            setActiveData(null);
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

  // Ongoing & Upcoming Projects states & filters
  const [projectType, setProjectType] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectPartnerFilter, setProjectPartnerFilter] = useState('all');
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const partnerDropdownRef = useRef<HTMLDivElement>(null);
  const [projectPage, setProjectPage] = useState(1);
  const projectsPerPage = 3;

  // Reset page when projectType changes
  useEffect(() => {
    setProjectPage(1);
  }, [projectType]);

  // Combined Projects filtering logic
  const filteredProjects = (projectType === 'ongoing' ? ongoingProjectsData : upcomingProjectsData).filter((proj) => {
    const matchesSearch = proj.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                          proj.objectives.some(o => o.toLowerCase().includes(projectSearch.toLowerCase())) ||
                          proj.scope.some(s => s.toLowerCase().includes(projectSearch.toLowerCase())) ||
                          ('director' in proj ? proj.director.toLowerCase().includes(projectSearch.toLowerCase()) : false);
    const matchesPartner = projectPartnerFilter === 'all' ||
                           (projectPartnerFilter === 'N/A' && proj.partner === 'N/A') ||
                           (projectPartnerFilter !== 'N/A' && proj.partner.toLowerCase().includes(projectPartnerFilter.toLowerCase()));
    return matchesSearch && matchesPartner;
  });

  const paginatedProjects = filteredProjects.slice(
    (projectPage - 1) * projectsPerPage,
    projectPage * projectsPerPage
  );

  const totalProjectPages = Math.ceil(filteredProjects.length / projectsPerPage);

  // Completed Projects states & filters
  const [completedSearch, setCompletedSearch] = useState('');
  const [completedPartnerFilter, setCompletedPartnerFilter] = useState('all');
  const [isCompletedPartnerDropdownOpen, setIsCompletedPartnerDropdownOpen] = useState(false);
  const completedPartnerDropdownRef = useRef<HTMLDivElement>(null);
  const [completedPage, setCompletedPage] = useState(1);
  const completedPerPage = 3;

  // Combined Completed Projects filtering logic
  const filteredCompletedProjects = completedProjectsData.filter((proj) => {
    const matchesSearch = proj.name.toLowerCase().includes(completedSearch.toLowerCase()) ||
                          proj.objectives.some(o => o.toLowerCase().includes(completedSearch.toLowerCase())) ||
                          proj.scope.some(s => s.toLowerCase().includes(completedSearch.toLowerCase()));
    const matchesPartner = completedPartnerFilter === 'all' ||
                           (completedPartnerFilter === 'N/A' && proj.partner === 'N/A') ||
                           (completedPartnerFilter !== 'N/A' && proj.partner.toLowerCase().includes(completedPartnerFilter.toLowerCase()));
    return matchesSearch && matchesPartner;
  });

  const paginatedCompletedProjects = filteredCompletedProjects.slice(
    (completedPage - 1) * completedPerPage,
    completedPage * completedPerPage
  );

  const totalCompletedProjectPages = Math.ceil(filteredCompletedProjects.length / completedPerPage);

  const [activeTab, setActiveTab] = useState<'overview' | 'gen' | 'gas' | 'imports' | 'renewables' | 'transmission' | 'regional' | 'macro' | 'plants'>(
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
    setActiveTab(tabId);
    if (tabScrollTimerRef.current) clearTimeout(tabScrollTimerRef.current);
    tabScrollTimerRef.current = setTimeout(() => {
      tabScrollTimerRef.current = null;
      triggerScrollToElement('grid-status-overview-header');
    }, 50);
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
  const [reportsCompany, setReportsCompany] = useState<'bpdb' | 'petrobangla'>('bpdb');
  const chartsReady = Boolean(activeData);
  const macroChartsReady = true;
  const pieGenerationData = useMemo(
    () => generationData.filter((d) => Number(d.gen) > 0 && Number.isFinite(Number(d.gen))),
    [generationData],
  );
  const hasGenerationChartData = pieGenerationData.length > 0;

  const nationalBudgetMergedData = useMemo(() => {
    const infraByYear = Object.fromEntries(
      macroInfrastructureData.map((row) => [row.fiscal_year, row]),
    );
    return nationalBudgetData.map((budgetRow) => ({
      ...budgetRow,
      ...(infraByYear[budgetRow.fiscal_year] ?? {}),
    }));
  }, []);

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

  // Shedding is drawn on this card's own right-hand axis rather than in a
  // separate panel below it, so the deficit sits under the hours that produced
  // it. Sharing the generation axis would flatten it onto the floor, so the
  // right axis carries its true scale and prints its own ticks in the shedding
  // colour — the reader can see which axis a mark belongs to and read its
  // value off it.
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
  const [pricingCompareYear, setPricingCompareYear] = useState<string>('FY 2020');
  const [hoveredCostIndex, setHoveredCostIndex] = useState<number | null>(null);
  const [hoveredZoneIndex, setHoveredZoneIndex] = useState<number | null>(null);

  // PGCB Monthly Archives States.
  // The archive is fetched on demand rather than bundled, so it only downloads
  // once Macro Trends is opened. `pgcbMonthlyData` is the chart/KPI series;
  // per-month detail comes from usePgcbMonthlyRecord below.
  const { series: pgcbMonthlyData, loading: pgcbMonthlyLoading } = usePgcbMonthlySeries(activeTab === 'macro');
  const [selectedMonthlyKey, setSelectedMonthlyKey] = useState<string>('');
  const latestMonthlyKey = getLatestMonthlyDateKey(pgcbMonthlyData);

  // Land on the newest month once the archive arrives, without clobbering a pick.
  useEffect(() => {
    if (!selectedMonthlyKey && latestMonthlyKey) setSelectedMonthlyKey(latestMonthlyKey);
  }, [selectedMonthlyKey, latestMonthlyKey]);

  const { record: selectedMonthlyRecord } = usePgcbMonthlyRecord(
    selectedMonthlyKey,
    activeTab === 'macro',
  );

  // The outage log is bigger than the rest of the month combined, so it waits
  // for an explicit click rather than loading with the month.
  const [monthlyEventsOpen, setMonthlyEventsOpen] = useState(false);
  const { events: monthlyEvents, loading: monthlyEventsLoading } = usePgcbMonthlyEvents(
    selectedMonthlyKey,
    monthlyEventsOpen,
  );
  useEffect(() => {
    setMonthlyEventsOpen(false);
  }, [selectedMonthlyKey]);

  const [monthlyTrendMetric, setMonthlyTrendMetric] = useState<'peaks' | 'energy' | 'fuels'>('peaks');
  const [selectedFuelTrend, setSelectedFuelTrend] = useState<'gas' | 'coal' | 'hfo' | 'diesel' | 'import'>('gas');
  const pgcbFuelTrendData = useMemo(
    () =>
      pgcbMonthlyData.map((row) => ({
        ...row,
        fuelTrendMkwh: row.generation_by_fuel[selectedFuelTrend] ?? 0,
      })),
    [pgcbMonthlyData, selectedFuelTrend],
  );
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isFuelDropdownOpen, setIsFuelDropdownOpen] = useState(false);

  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const fuelDropdownRef = useRef<HTMLDivElement>(null);

  /**
   * The fuel-trend selector uses its own short keys ('import', 'diesel') rather
   * than the names PGCB publishes, so they are folded onto the canonical name
   * before lookup. Colours themselves come from `chart-palette` — this used to
   * be a second, independently drifting copy of the fuel palette.
   */
  const getFuelColor = (fuel: string) => {
    const TREND_KEY_TO_FUEL: Record<string, string> = {
      import: 'Imports',
      imports: 'Imports',
      diesel: 'HSD (Diesel)',
      hsd: 'HSD (Diesel)',
    };
    const key = fuel.toLowerCase();
    const canonical =
      TREND_KEY_TO_FUEL[key] ?? fuel.charAt(0).toUpperCase() + fuel.slice(1).toLowerCase();
    // HFO is an initialism, so title-casing it would miss the map.
    return chartTheme.fuel(key === 'hfo' ? 'HFO' : canonical);
  };

  const getFuelLabel = (fuel: string) => {
    const labels: Record<string, string> = {
      gas: 'Gas',
      coal: 'Coal',
      hfo: 'Furnace Oil (HFO)',
      diesel: 'Diesel',
      import: 'India Imports',
      hydro: 'Hydro',
      solar: 'Solar',
      wind: 'Wind',
    };
    return labels[fuel.toLowerCase()] ?? fuel;
  };

  // Substation & Transmission Tab States
  const [transSubTab, setTransSubTab] = useState<'transmission' | 'lines' | 'substations' | 'projects' | 'completed_projects' | 'grid_net' | 'geo_map' | 'opgw_map' | 'opgw_lease'>('transmission');
  const [isTransDropdownOpen, setIsTransDropdownOpen] = useState(false);
  const transDropdownRef = useRef<HTMLDivElement>(null);

  const [isVoltageDropdownOpen, setIsVoltageDropdownOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

  const voltageDropdownRef = useRef<HTMLDivElement>(null);
  const zoneDropdownRef = useRef<HTMLDivElement>(null);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

  const [subSearch, setSubSearch] = useState('');
  const debouncedSubSearch = useDebouncedValue(subSearch);
  const [subVoltageFilter, setSubVoltageFilter] = useState<string>('all');
  const [subZoneFilter, setSubZoneFilter] = useState<string>('all');
  const [subOwnerFilter, setSubOwnerFilter] = useState<string>('all');
  const [subPage, setSubPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [subTableDensity, setSubTableDensity] = useState<GridTableDensity>('comfortable');
  const [subFiltersOpen, setSubFiltersOpen] = useState(false);
  const zones = ['Dhaka', 'Khulna', 'Barishal', 'Cumilla', 'Sylhet', 'Rajshahi', 'Chattogram', 'Rangpur', 'Mymensingh'];
  const owners = ['POWER GRID', 'APSCL', 'BIFPCL', 'RNPP', 'Bulk', 'BPDB', 'DESCO', 'DPDC', 'MoST', 'DMTCL'];

  const voltageOptions = [
    { label: 'All Voltage Classes', value: 'all' },
    { label: '400 kV', value: '400kV' },
    { label: '230 kV', value: '230kV' },
    { label: '132 kV', value: '132kV' },
    { label: '230/33 kV', value: '230/33kV' },
    { label: '132/33 kV', value: '132/33kV' },
  ];

  const zoneOptions = [
    { label: 'All Operation Zones', value: 'all' },
    ...zones.map((z) => ({ label: z, value: z })),
  ];

  const ownerOptions = [
    { label: 'All Owners', value: 'all' },
    ...owners.map((o) => ({ label: o, value: o })),
  ];

  // Click outside listener for all custom dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (transDropdownRef.current && !transDropdownRef.current.contains(target)) {
        setIsTransDropdownOpen(false);
      }
      if (voltageDropdownRef.current && !voltageDropdownRef.current.contains(target)) {
        setIsVoltageDropdownOpen(false);
      }
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(target)) {
        setIsZoneDropdownOpen(false);
      }
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(target)) {
        setIsOwnerDropdownOpen(false);
      }
      if (dailyYearDropdownRef.current && !dailyYearDropdownRef.current.contains(target)) {
        setIsDailyYearDropdownOpen(false);
      }
      if (dailyMonthDropdownRef.current && !dailyMonthDropdownRef.current.contains(target)) {
        setIsDailyMonthDropdownOpen(false);
      }
      if (dailyDayDropdownRef.current && !dailyDayDropdownRef.current.contains(target)) {
        setIsDailyDayDropdownOpen(false);
      }
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(target)) {
        setIsPartnerDropdownOpen(false);
      }
      if (completedPartnerDropdownRef.current && !completedPartnerDropdownRef.current.contains(target)) {
        setIsCompletedPartnerDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(target)) {
        setIsYearDropdownOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(target)) {
        setIsMonthDropdownOpen(false);
      }
      if (fuelDropdownRef.current && !fuelDropdownRef.current.contains(target)) {
        setIsFuelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabGlowColors: Record<typeof activeTab, { blob1: string; blob2: string; blob3: string }> = {
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
    id: 'overview' | 'gen' | 'gas' | 'imports' | 'renewables' | 'transmission' | 'regional' | 'macro' | 'plants' | 'pricing';
    label: string;
    icon: any;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'gen', label: 'Generation & Cost', icon: Zap },
    { id: 'gas', label: 'Gas & LNG Supply', icon: Droplet },
    { id: 'imports', label: 'C/B Imports', icon: Globe },
    { id: 'regional', label: 'Regional Grid', icon: Cable },
    // Named for the subject, not the publisher, like every other tab here. The
    // source is still SREDA alone — the agencies its tables name (BPDB, NWPGCL,
    // EGCB, BREB, IDCOL…) are the owners SREDA attributes capacity to, not
    // second publishers — so attribution stays on each card, where a reader
    // checking a figure looks, rather than in the tab bar.
    { id: 'renewables', label: 'Renewables', icon: Sun },
    { id: 'plants', label: 'Power Stations', icon: Factory },
    { id: 'transmission', label: 'Technical Information', icon: Activity },
    { id: 'macro', label: 'Macro Trends', icon: TrendingUp },
  ] as const;

  /** Daily PGCB tabs where gross vs net fuel/cost reconciliation applies */
  const methodologyTabIds = ['overview', 'gen', 'gas', 'imports'] as const;
  const showMethodologyForActiveTab = (methodologyTabIds as readonly string[]).includes(activeTab);

  useEffect(() => {
    if (!showMethodologyForActiveTab) {
      setIsMethodologyBannerExpanded(false);
    }
  }, [showMethodologyForActiveTab]);

  const substationRowKey = (sub: (typeof substationsData)[number]) =>
    `${sub.sn}:${sub.voltage}:${sub.name}`;

  // Substation Filtering Logic
  const filteredSubstations = substationsData.filter((sub) => {
    const q = debouncedSubSearch.toLowerCase();
    const matchesSearch = sub.name.toLowerCase().includes(q) ||
                          sub.circle.toLowerCase().includes(q);
    const matchesVoltage = subVoltageFilter === 'all' || sub.voltage === subVoltageFilter;
    const matchesZone = subZoneFilter === 'all' || sub.zone === subZoneFilter;
    const matchesOwner = subOwnerFilter === 'all' || sub.owner === subOwnerFilter;
    return matchesSearch && matchesVoltage && matchesZone && matchesOwner;
  });

  const totalSubCapacityMva = filteredSubstations.reduce((sum, sub) => {
    const val = parseFloat(sub.capacity.replace(/,/g, ''));
    if (sub.capacity.includes('MW') || isNaN(val)) return sum;
    return sum + val;
  }, 0);

  const paginatedSubstations = filteredSubstations.slice(
    (subPage - 1) * itemsPerPage,
    subPage * itemsPerPage
  );

  const totalSubPages = Math.ceil(filteredSubstations.length / itemsPerPage);

  // Reset page to 1 when filters change
  useEffect(() => {
    setSubPage(1);
  }, [debouncedSubSearch, subVoltageFilter, subZoneFilter, subOwnerFilter]);

  // Overview calculations
  const totalGenMkwhr = generationData.reduce((sum, item) => sum + item.gen, 0);
  const totalCostBdt = generationData.reduce((sum, item) => sum + (item.cost ?? 0), 0);

  // --- East-West Interconnector -------------------------------------------
  // Absent on every layout before the EWIC sheet existed, so every consumer
  // below is written to fall away rather than render an empty frame.
  const ewic = ewicData ?? null;
  const ewicChartData = useMemo(
    () =>
      (ewic?.rows ?? []).map((r) => {
        const point: Record<string, string | number | null> = { time: r.time };
        r.mw.forEach((v, i) => { point[`c${i}`] = v; });
        return point;
      }),
    [ewic],
  );
  // Exports only: the day's transfer is what crossed, and pairing it with a
  // zero import line would imply the two net off.
  const ewicTotalMkwh = ewic?.totals?.export != null ? ewic.totals.export / 1e6 : null;
  const ewicShareOfGen =
    ewicTotalMkwh != null && totalGenMkwhr > 0 ? (ewicTotalMkwh / totalGenMkwhr) * 100 : null;
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
  // Tk/KWh it implies is not, and no longer derived here: one average across
  // three separate commercial agreements reads as a price Bangladesh pays, or
  // as one supplier's tariff, and the report supports neither.
  const importsCost = generationData.find((g) => g.name === 'Imports')?.cost ?? null;
  const importsEnergyMkwh = generationData.find((g) => g.name === 'Imports')?.gen ?? null;
  const avgCostPerKwh = totalCostBdt / (totalGenMkwhr * 1000000);
  // What stands behind each per-fuel unit rate: a second agency's independent
  // arithmetic, a flat administered tariff, or only the one publisher.
  const unitCostAuth = useUnitCostAuthentication(selectedDate);

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
        <div className={cn("absolute top-[5%] left-[10%] w-[35rem] h-[35rem] rounded-full blur-[120px] grid-glow-blob-1 transition-colors duration-1000", glow.blob1)} />
        <div className={cn("absolute bottom-[15%] right-[5%] w-[30rem] h-[30rem] rounded-full blur-[130px] grid-glow-blob-2 transition-colors duration-1000", glow.blob2)} />
        <div className={cn("absolute top-[45%] left-[45%] w-[38rem] h-[38rem] rounded-full blur-[140px] grid-glow-blob-3 transition-colors duration-1000", glow.blob3)} />
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
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Grid Status Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center flex-wrap gap-1">
            Active reporting date: <span className="font-semibold text-primary">{systemStats.date}</span>
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
                  <Info className="h-3.5 w-3.5" />
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
        avgCostPerKwh={avgCostPerKwh}
        totalCapacityRenewables={totalCapacityRenewables}
        isoDate={selectedDate}
      />
</GridLockedContent>

      {/* Flat Tab Navigation */}
      <div className="grid-explorer-tabs mt-6 mb-4" role="tablist" aria-label="Grid reports views">
        {tabs.map((t) => {
          const TabIcon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTabClick(t.id)}
              className={cn('explorer-tab', active && 'active')}
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
                <Activity className="h-5 w-5 text-primary animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <span className="text-xs font-semibold text-primary tracking-wide animate-pulse">Loading Grid Data...</span>
            </div>
          </div>
        )}

        {isDataMissing && !activeData && (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4 animate-pulse">
                <Info className="h-8 w-8 text-amber-500" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-2">
                {isDateAvailable(selectedDate)
                  ? 'Report file not loaded yet'
                  : 'Report has not been released for this day yet'}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                {isDateAvailable(selectedDate)
                  ? `The ${selectedDate} PGCB daily report is in our catalog but could not be fetched — it may still be syncing to the site mirror. Petrobangla field data may load separately below.`
                  : `The daily grid status report and Petrobangla production telemetry for ${selectedDate} have not been finalized or published by PGCB/NLDC.`}
              </p>
              {selectedDate !== latestDate && (
                <button
                  type="button"
                  onClick={() => selectAccessibleDate(latestDate)}
                  className="grid-explorer-control mb-4 px-4 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
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
                  <div className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/10 leading-relaxed">
                    Peak Gen: {formatNumber(latestCachedReport.systemStats.eveningPeakGen, 1)} MW / Demand:{' '}
                    {formatNumber(latestCachedReport.systemStats.eveningPeakDemand, 1)} MW / Energy:{' '}
                    {latestCachedReport.systemStats.totalEnergyGen == null ? '—' : formatNumber(latestCachedReport.systemStats.totalEnergyGen, 1)} MKWh
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isDataMissing && activeTab === 'overview' && (
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
                <Info className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-2">PGCB Grid Overview Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                No official records are available for the selected date. PGCB data tracking officially started on December 31, 2013.
              </p>
              <div className="mt-4 text-[10px] text-muted-foreground">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          {methodologyBanner}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generation Pie Chart */}
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head">
              <div>
                <h3 className="grid-explorer-chart-card__title">Daily Generation Mix Snapshot<DailyBadge /></h3>
                {/* The total here is our sum of the fuel rows, not PGCB's own
                    headline figure — the two are different numbers, which is
                    what the reconciliation banner above exists to explain. */}
                <p className="grid-explorer-chart-card__sub">Energy share by fuel type (Total: {totalGenMkwhr.toFixed(1)} MKWh <GridProvenanceTag kind="D" />) • <span className="text-primary font-semibold text-xs">{coverageLabel('fuelMix')}</span></p>
              </div>
              <span className="grid-explorer-chip">Fuel Type</span>
            </div>

            <div className="grid-explorer-mix-stack" aria-hidden>
              {generationData.map((item, i) => {
                const width = totalGenMkwhr > 0 ? (item.gen / totalGenMkwhr) * 100 : 0;
                const dimmed = hoveredIndex !== null && hoveredIndex !== i;
                return (
                  <div
                    key={item.name}
                    className={cn('grid-explorer-mix-stack__seg', dimmed && 'grid-explorer-mix-stack__seg--dim')}
                    style={{ width: `${width}%`, backgroundColor: chartTheme.fuel(item.name) }}
                  />
                );
              })}
            </div>

            <div className="grid-explorer-donut-wrap">
              {!chartsReady ? (
                <div className="grid-explorer-skeleton min-h-[12.5rem] w-[12.5rem] rounded-full mx-auto" aria-hidden />
              ) : !hasGenerationChartData ? (
                <div className="grid-explorer-chart-empty min-h-[12.5rem]" role="status">
                  <div className="grid-explorer-chart-empty__title">No generation data</div>
                  <p>No fuel mix recorded for this reporting date.</p>
                </div>
              ) : (
                <PieChart width={200} height={200} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={pieGenerationData}
                    dataKey="gen"
                    nameKey="name"
                    cx={100}
                    cy={100}
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                    onMouseEnter={(_, i) => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {pieGenerationData.map((entry, idx) => {
                      const dimmed = hoveredIndex !== null && hoveredIndex !== idx;
                      return (
                        <Cell
                          key={idx}
                          fill={chartTheme.fuel(entry.name)}
                          fillOpacity={dimmed ? 0.3 : 1}
                          style={{ transition: 'fill-opacity 200ms ease' }}
                        />
                      );
                    })}
                  </Pie>
                  <GridRechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload;
                      const pct = ((row.gen / totalGenMkwhr) * 100).toFixed(2);
                      return (
                        <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                          <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                            <span>{row.name} Share</span>
                            <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Operational Mix</span>
                          </div>
                          <div className="space-y-2 text-[11px] md:text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Energy Output:</span>
                              <span className="font-bold text-foreground">{row.gen.toFixed(2)} MKWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />System Share:</span>
                              <span className="font-bold text-foreground">{pct}%</span>
                            </div>
                          </div>
                          {/* The denominator is our sum of the fuel rows, not
                              PGCB's headline — say which total the share is of. */}
                          <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                            Share = this fuel&apos;s published energy ÷ the sum of the published fuel rows, calculated here.
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                            <div><strong>Source:</strong> <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PGCB Daily Operations Report</a>, zone-wise generation summary</div>
                            <div>Reproduced as published. Not audited by ESB PowerLine.</div>
                          </div>
                        </div>
                      );
                    }}

                  />
                  <g className="pointer-events-none select-none">
                    <text
                      x={100}
                      y={92}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-foreground font-sans font-bold"
                      style={{ fontSize: '24px', letterSpacing: '-0.02em' }}
                    >
                      {totalGenMkwhr.toFixed(0)}
                    </text>
                    <text
                      x={100}
                      y={114}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-muted-foreground font-sans font-semibold uppercase"
                      style={{ fontSize: '10px', letterSpacing: '0.1em' }}
                    >
                      MKWh Gen
                    </text>
                  </g>
                </PieChart>
              )}
            </div>

            {/* Custom Legend */}
            <div className="grid-chart-legend">
              {pieGenerationData.map((item, i) => {
                const dimmed = hoveredIndex !== null && hoveredIndex !== i;
                return (
                  <button
                    key={item.name}
                    type="button"
                    className={cn('grid-chart-legend__item', dimmed && 'grid-chart-legend__item--dim')}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <span className="grid-chart-legend__swatch" style={{ backgroundColor: chartTheme.fuel(item.name) }} />
                    <span className="grid-chart-legend__name">{item.name}</span>
                    {/* The share is ours; the MKWh beside it is PGCB's own row. */}
                    <span className="grid-chart-legend__meta">{((item.gen / totalGenMkwhr) * 100).toFixed(1)}% <GridProvenanceTag kind="D" /></span>
                    <span className="grid-chart-legend__val">{item.gen.toFixed(1)} MKWh <GridProvenanceTag kind="P" /></span>
                  </button>
                );
              })}
            </div>

            {/* Card Metadata Footer */}
            <GridCardFooter>
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, zone-wise generation summary</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>Per-fuel energy as published; total and shares are ours. Not independently audited.</span>
              <span className="font-medium">Reporting Date: {systemStats.date}</span>
            </GridCardFooter>
          </div>

          {/* Cost Bar Chart */}
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head">
              <div>
                <h3 className="grid-explorer-chart-card__title">Daily Fuel &amp; Import Cost<DailyBadge /></h3>
                {/* The bars are PGCB's published per-fuel costs; this header adds
                    them up, which is not the same as PGCB's own "Total :" row —
                    on 08 Aug 2026 the two differ by 3 Tk. */}
                <p className="grid-explorer-chart-card__sub">Cost in Crore BDT by fuel type ({hasPublishedFuelCost ? <>Total: {formatBdtAmount(totalCostBdt / 10000000)} Cr Tk. <GridProvenanceTag kind="D" /></> : 'per-fuel split not published for this day'}) • <span className="text-primary font-semibold text-xs">{coverageLabel('fuelCost')}</span></p>
              </div>
              <span className="grid-explorer-chip">Cost Analysis</span>
            </div>

            <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
              {!hasPublishedFuelCost ? (
                <GridUnpublishedCostNote totalDailyCostBdt={systemStats.totalDailyCost} />
              ) : chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart accessibilityLayer={false} data={dailyCostChartData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                    <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                    <XAxis
                      {...gridChartXAxisProps(chartTheme, { dataKey: 'name' })}
                      tick={{ fontSize: 11, fill: chartTheme.axisTick, dy: 4 }}
                    />
                    <YAxis
                      width={GRID_Y_AXIS_WIDTH.single}
                      tick={{ fontSize: 11, fill: chartTheme.axisTick }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={4}
                      domain={[0, 'auto']}
                      allowDecimals={false}
                      tickFormatter={formatAxisCrore}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0].payload;
                        const cr = formatBdtAmount(row.cost / 10000000);
                        return (
                          <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                            <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                              <span>{row.name} Daily Cost</span>
                              {/* Was "Financial Audit" — nothing here is audited. */}
                              <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Published Cost</span>
                            </div>
                            <div className="space-y-2 text-[11px] md:text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Total Daily Cost:</span>
                                <span className="font-bold text-foreground">{cr} Crore Tk</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Average Unit Rate:</span>
                                <span className="font-bold text-foreground">{formatUnitRate(row.unitCost)} Tk/KWh</span>
                              </div>
                            </div>
                            {/* The old note stated the calculation backwards — cost
                                was said to be derived from a unit rate, when the
                                cost is what PGCB publishes and the rate is what we
                                divide out of it. */}
                            <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                              PGCB publishes this fuel&apos;s cost and its generation. Unit rate = cost ÷ (gen × 10⁶), calculated here.
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                              <div><strong>Source:</strong> <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PGCB daily report</a>, &ldquo;Cost of the Consumed Fuel&rdquo; block</div>
                              <div>Restates BPDB fuel economics. Not audited by ESB PowerLine.</div>
                            </div>
                          </div>
                        );
                      }}
                      cursor={{ fill: chartTheme.hoverFill, radius: 8 }}
                    />
                    <Bar
                      dataKey="costCrore"
                      name="Daily Cost (Cr Tk)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    >
                      {dailyCostChartData.map((entry, idx) => {
                        const isDimmed = hoveredCostIndex !== null && hoveredCostIndex !== idx;
                        return (
                          <Cell
                            key={idx}
                            fill={chartTheme.fuel(entry.name)}
                            fillOpacity={isDimmed ? 0.35 : 1}
                            style={{ transition: 'fill-opacity 200ms ease', cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredCostIndex(idx)}
                            onMouseLeave={() => setHoveredCostIndex(null)}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid-explorer-skeleton" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 pb-4 border-t border-border/50">
              <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center min-h-[5.5rem] text-center">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-snug inline-flex items-center gap-1">
                  Avg Production Cost <GridProvenanceTag kind="D" />
                </div>
                {/* Published total cost ÷ published headline generation. Note the
                    KPI strip's "Average Bulk Cost" divides by the summed fuel
                    rows instead, so the two rates differ where those disagree. */}
                <div className="text-2xl font-bold mt-1.5 text-primary tabular-nums leading-none">
                  {formatUnitRate(systemStats.avgProductionCost)}{' '}
                  <span className="text-xs font-medium text-muted-foreground">Tk/KWh</span>
                </div>
              </div>
              <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center min-h-[5.5rem] text-center">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-snug inline-flex items-center gap-1">
                  Total Gas to Power <GridProvenanceTag kind="P" />
                </div>
                <div className="text-2xl font-bold mt-1.5 text-sky-500 tabular-nums leading-none">
                  {systemStats.totalGasSuppliedPower.toFixed(2)}{' '}
                  <span className="text-xs font-medium text-muted-foreground">MMCFD</span>
                </div>
              </div>
            </div>

            {/* Card Metadata Footer */}
            <GridCardFooter className="mt-0 pt-4">
              {/* Every figure on this card is read from PGCB's daily report. The
                  footer used to credit BPDB's reports and BPC's fuel gazettes,
                  neither of which this pipeline opens, and name auditors whose
                  reports it has never seen. */}
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, production-cost block and gas-supplied line</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>Restates BPDB fuel economics. Unit rates are ours. Not independently audited.</span>
              <span className="font-medium">Reporting Date: {systemStats.date}</span>
            </GridCardFooter>
          </div>
        </div>

        {/* 24-Hour System Load Curve */}
        <div className="grid-explorer-chart-card card">
          <div className="grid-explorer-chart-card__head">
            <div>
              <h3 className="grid-explorer-chart-card__title">24-Hour System Load Curve<DailyBadge /></h3>
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
            <span className="grid-explorer-chip bg-destructive/10 text-destructive border-destructive/20">NLDC SCADA Curve</span>
          </div>

          <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-tall">
            {hourlyLoadData.length === 0 ? (
              // Reports before 2018 carry no load-curve sheet. Drawing empty
              // axes would imply a flat or missing grid rather than an
              // unpublished measurement.
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-6">
                <p className="text-sm font-semibold text-muted-foreground">No load curve published for this day</p>
                <p className="text-xs text-muted-foreground/80 max-w-md">
                  PGCB&apos;s report for {systemStats.date} does not include the half-hourly NLDC load-curve
                  sheet. Daily totals and peaks above are unaffected.
                </p>
              </div>
            ) : chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart accessibilityLayer={false} data={hourlyLoadData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                  <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                  <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'time' })} />
                  <YAxis yAxisId="left" width={34} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} allowDecimals={false} tickFormatter={formatAxisMwCompact}
                    /* Above the axis, not rotated inside it: turned on its side the unit
                       costs horizontal width the plot needs, and height is the one
                       thing a phone chart has to spare. */
                    label={{ value: 'MW', position: 'top', offset: 6, style: { fontSize: 9, fill: chartTheme.axisTick, textAnchor: 'start' } }} />
                  {/* The shedding axis is tinted in the shedding colour so it is
                      obvious which marks it measures — the left axis serves
                      generation and demand, which are the same measurement in the
                      same units and share a scale honestly. */}
                  {showShedding && (
                    <YAxis
                      yAxisId="shed"
                      orientation="right"
                      width={38}
                      tick={{ fontSize: 10, fill: chartTheme.destructive }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={4}
                      domain={[0, shedAxis.max]}
                      ticks={shedAxis.ticks}
                      allowDecimals={false}
                      tickFormatter={formatAxisMwCompact}
                    />
                  )}
                  <Tooltip
                    // Recharts draws a band cursor once a Bar is on the chart and a
                    // vertical rule otherwise, and the two take different props —
                    // a fill on the rule would leave the hovered hour unmarked.
                    cursor={showShedding
                      ? { fill: chartTheme.gridStroke, opacity: 0.2 }
                      : { stroke: chartTheme.gridStroke, strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      const peakIndicator = peakDemandTime && d.time === peakDemandTime ? ' (Peak Hour)' : '';
                      return (
                        <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                          <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                            <span>Grid Profile at {d.time}{peakIndicator}</span>
                            {/* Muted rather than amber: amber is the demand series
                                now that the panel is colour-matched, and a source
                                badge in a series colour reads as a fourth reading. */}
                            <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-wider">NLDC Telemetry</span>
                          </div>
                          {/* Every label and value here is painted from the same
                              constants the marks and the legend use, so the panel
                              names a series in the colour the reader just hovered.
                              An unpublished figure stays muted: colouring the words
                              "not published" as if they were a reading would give a
                              measurement the weight of one that exists. */}
                          <div className="space-y-2 text-[11px] md:text-xs">
                            <div className="flex justify-between">
                              <span className="inline-flex items-center gap-1" style={{ color: LOAD_CURVE_COLORS.generation }}><GridProvenanceTag kind="P" />Actual Gen:</span>
                              <span className="font-bold" style={{ color: LOAD_CURVE_COLORS.generation }}>{formatNumber(Math.round(d.generation))} MW</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="inline-flex items-center gap-1" style={{ color: LOAD_CURVE_COLORS.demand }}><GridProvenanceTag kind="P" />System Demand:</span>
                              {d.demand == null ? (
                                <span className="font-medium text-muted-foreground">not published for this hour</span>
                              ) : (
                                <span className="font-bold" style={{ color: LOAD_CURVE_COLORS.demand }}>{formatNumber(Math.round(d.demand))} MW</span>
                              )}
                            </div>
                            <div className="flex justify-between">
                              <span className="inline-flex items-center gap-1" style={{ color: chartTheme.destructive }}><GridProvenanceTag kind="P" />Load Shedding:</span>
                              {d.loadShed == null ? (
                                <span className="font-medium text-muted-foreground">not published for this hour</span>
                              ) : (
                                <span className="font-bold" style={{ color: chartTheme.destructive }}>{formatNumber(Math.round(d.loadShed))} MW</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                            {curveIsHourly
                              ? 'All three figures are published for this hour on PGCB’s hourly demand, generation and load-shed sheet.'
                              : sheddingIsHourly
                                ? 'Generation and load shedding are logged hourly on this layout; PGCB publishes demand for the evening peak hour alone.'
                                : 'Generation is logged hourly. PGCB reports demand and load shedding at the evening peak hour only on this layout.'}
                            {/* Only where bars were actually drawn — on a day with
                                nothing shed there is no second axis to point at. */}
                            {showShedding && ' Shedding is read against the right-hand axis.'}
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                            <div><strong>Source:</strong> <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PGCB NLDC Daily Curve Sheet</a></div>
                            <div><strong>Telemetry:</strong> NLDC SCADA System Real-time Integrator</div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <GridRechartsLegend
                    verticalAlign="top"
                    height={36}
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                    colorResolver={(value) => {
                      if (value === 'Generation') return LOAD_CURVE_COLORS.generation;
                      if (value.startsWith('Demand') || value.startsWith('Peak Demand')) return LOAD_CURVE_COLORS.demand;
                      if (value.includes('Load Shedding')) return chartTheme.destructive;
                      return 'inherit';
                    }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="generation" name="Generation" stroke={LOAD_CURVE_COLORS.generation} fill={LOAD_CURVE_COLORS.generation} fillOpacity={0.15} strokeWidth={2.5} />
                  {/* Shedding sits on the right-hand axis, under the hours that
                      produced it, rather than in a panel of its own below the card.
                      It is drawn after the generation area so the bars stay crisp
                      instead of showing through it, and before the demand line so
                      the line — the series the deficit is measured against — is
                      never occluded by a bar. The legend names the axis, because a
                      bar and a curve on one plot at different scales is only honest
                      if the reader is told which scale each one is on. */}
                  {showShedding && (
                    <Bar
                      yAxisId="shed"
                      dataKey="loadShed"
                      name={sheddingIsHourly ? 'Load shedding' : 'Peak load shedding'}
                      fill={chartTheme.destructive}
                      fillOpacity={0.45}
                      stroke={chartTheme.destructive}
                      strokeWidth={1}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={15}
                      activeBar={<ShedActiveBar />}
                    />
                  )}
                  {curveIsHourly ? (
                    // Every hour carries a figure, so demand is the second
                    // measured curve it is — and the gap between the two lines
                    // is the deficit the bars beneath measure directly.
                    <Line yAxisId="left" type="monotone" dataKey="demand" name="Demand" stroke={LOAD_CURVE_COLORS.demand} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  ) : (
                    // Demand exists for one hour only, so it renders as a single
                    // marked point rather than a series interpolated across the
                    // evening. Shedding may still be hourly on the same day — the
                    // bars are named for what they actually are, because calling a
                    // 23-hour series "Peak" misreads the chart for the reader.
                    <Line yAxisId="left" type="monotone" dataKey="demand" name="Peak Demand (published)" stroke={LOAD_CURVE_COLORS.demand} strokeWidth={0} connectNulls={false} dot={{ r: 5, fill: LOAD_CURVE_COLORS.demand, stroke: LOAD_CURVE_COLORS.demand }} activeDot={{ r: 7 }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid-explorer-skeleton" />
            )}
          </div>

          {/* Load shedding used to be drawn here, in a panel of its own beneath
              the card. It now shares the plot above on a right-hand axis, so the
              deficit reads against the hour and the curve that produced it
              instead of against a second copy of the x-axis. The scale argument
              that put it down here is answered by the axis itself: the ticks on
              the right state shedding's own MW, tinted in its own colour. */}
          {showShedding && chartsReady && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load shedding</span>
              {' '}is read against the right-hand axis — on the generation scale it would be
              a flat line on the floor.
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
                {/* The right-hand axis and the shedding bars only exist on days
                    that shed something, so the prose names them only then — a day
                    PGCB reports as nil is described by its own sentence rather than
                    pointed at an axis the reader cannot see. */}
                {curveIsHourly ? (
                  <p className="leading-relaxed">The <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.generation }}>Actual Generation</span> and <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.demand }}>Demand</span> curves are read from PGCB&apos;s hourly demand, generation and load-shed sheet, which states each figure for every hour it publishes. {showShedding
                    ? <><span className="font-semibold" style={{ color: chartTheme.destructive }}>Load Shedding</span> is PGCB&apos;s own third column on that sheet — the demand the grid could not meet and disconnected — and not this card subtracting one curve from the other. The two are close but not the same measurement: where load is shed, the gap between the curves runs a few per cent above the figure PGCB publishes, so the bars are drawn from the published column, against the right-hand axis.</>
                    : <>The two curves meet at every hour, because this report states no load shedding in any hour of this day.</>}</p>
                ) : sheddingIsHourly ? (
                  <p className="leading-relaxed">The <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.generation }}>Actual Generation</span> curve is read from PGCB&apos;s hourly station log, which carries a national total and a shortage figure at every hourly stamp{showShedding
                    ? <>; the <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load Shedding</span> bars are that shortage column, drawn against the right-hand axis on their own scale.</>
                    : <>, and records no shortage in any hour of this day.</>} That sheet publishes no demand column, so <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.demand }}>Demand</span> is the evening-peak figure from the report&apos;s front page and appears as a single marked point rather than a curve.</p>
                ) : (
                  <p className="leading-relaxed">The hourly <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.generation }}>Actual Generation</span> curve is the NLDC load-curve sheet, logged every half hour. <span className="font-semibold" style={{ color: LOAD_CURVE_COLORS.demand }}>Total Demand</span>{showShedding
                    ? <> and the <span className="font-semibold" style={{ color: chartTheme.destructive }}>Load Shedding Deficit</span> are published for the evening peak hour only on this report&apos;s layout, so they appear as single marks rather than continuous lines — the deficit as a bar against the right-hand axis.</>
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
                      <span className="font-bold text-destructive">{formatNumber(Math.round(worstShed.loadShed ?? 0))} MW</span> unserved
                      {shedTotalMwh > 0 && (
                        <> — around <span className="font-bold text-foreground">{formatNumber(Math.round(shedTotalMwh))} MWh</span> across the day, taking each hourly figure as the rate for that hour.</>
                      )}
                    </>
                  ) : curveIsHourly || sheddingIsHourly ? (
                    ' No load shedding was recorded in any published hour of this day.'
                  ) : peakRow && peakRow.demand != null ? (
                    <>
                      {' '}At the evening peak (<span className="font-semibold text-primary">{peakRow.time} Hr</span>) PGCB reported demand of <span className="font-bold text-foreground">{formatNumber(Math.round(peakRow.demand))} MW</span>
                      {peakRow.loadShed != null && peakRow.loadShed > 0 ? (
                        <> against <span className="font-bold text-destructive">{formatNumber(Math.round(peakRow.loadShed))} MW</span> of load shedding.</>
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
      </div>
      </GridLockedContent> )
    )}

      {!isDataMissing && activeTab === 'gen' && (
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
                <Info className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-2">PGCB Fuel Mix &amp; Generation Cost Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                No official records are available for the selected date. PGCB generation and cost data tracking officially started on December 31, 2013.
              </p>
              <div className="mt-4 text-[10px] text-muted-foreground">
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
                    <th className="text-left">Daily Cost (Crore Tk) <GridProvenanceTag kind="P" /></th>
                    <th className="text-left">Cost Share <GridProvenanceTag kind="D" /></th>
                    <th className="text-left">Cost intensity <GridProvenanceTag kind="D" /></th>
                    <th className="text-left">Unit Cost (Tk/KWh) <GridProvenanceTag kind="D" /></th>
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
                  No agency publishes a Tk/KWh rate. PGCB publishes a production cost in Taka
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
                    its own control totals, and the rate derived from those agrees. Across the
                    first half of 2026 this held for gas and coal on every day both agencies
                    published, and for imports on all but one.
                  </li>
                  <li>
                    <UnitCostBadge fact={{ status: 'administered' } as UnitCostFact} className="ml-0" />{' '}
                    a flat rate the publisher applies rather than measures — PGCB prints Wind at
                    14.7100 Tk/KWh on every day of 2026 and Hydro at 0.1000 on all but one, so
                    these are tariffs, not daily costs.
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
          <div className="grid-explorer-chart-card card p-4 space-y-4">
            <div className="grid-explorer-chart-card__head">
              <div>
                <h3 className="grid-explorer-chart-card__title">Daily Operational Milestones<DailyBadge /></h3>
                <p className="grid-explorer-chart-card__sub">Key metrics on system margin, load shedding demand, and gas-to-power allocations • <span className="text-primary font-semibold text-xs">{coverageLabel('fuelMix')}</span></p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Load-Shedding &amp; Demand</div>
                {/* All three are printed by PGCB's P1 sheet. */}
                <div className="grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Peak Demand:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left">{systemStats.eveningPeakDemand.toFixed(1)} MW</span>
                  <span>Peak Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left">{systemStats.eveningPeakGen.toFixed(1)} MW</span>
                  <span>Unserved Energy:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-semibold text-destructive text-left">
                    {systemStats.totalEnergyUnserved == null ? '—' : `${systemStats.totalEnergyUnserved.toFixed(2)} MKWh`}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Daily System Margins</div>
                {/*
                  All three are printed. Max and min generation are PGCB's own
                  stated extremes for the day, not the load curve's — its stated
                  minimum is the 08:00 reading, which is not always the curve's
                  trough — and the temperature comes from the reported-day block,
                  never the "probable" forecast beside it.
                */}
                <div className="grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Max Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left">
                    {systemStats.maxGen == null ? '—' : `${systemStats.maxGen.toFixed(1)} MW`}
                  </span>
                  <span>Min Generation:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left">
                    {systemStats.minGen == null ? '—' : `${systemStats.minGen.toFixed(1)} MW`}
                  </span>
                  <span>Max Temp:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-semibold text-foreground text-left">
                    {systemStats.maxTemp == null ? '—' : `${systemStats.maxTemp.toFixed(1)} °C`}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gas-to-Power</div>
                {/*
                  Gas supplied and gas cost are printed by PGCB — the MMCFD
                  figure is PGCB's own "Total Gas Supplied", not Petrobangla's
                  production total, which is a different measure of a different
                  thing. The unit rate is the quotient of the two, which no
                  agency prints.
                */}
                <div className="grid grid-cols-2 gap-y-2 text-xs leading-relaxed">
                  <span>Gas Supplied:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left">{systemStats.totalGasSuppliedPower.toFixed(1)} MMCFD</span>
                  <span>Gas Cost:<GridProvenanceTag kind="P" className="ml-1" /></span>
                  <span className="font-bold text-foreground text-left">
                    {(() => {
                      const c = generationData.find(g => g.name === 'Gas')?.cost;
                      return c == null ? '—' : `${(c / 10000000).toFixed(2)} Crore Tk`;
                    })()}
                  </span>
                  <span>Gas Unit Cost:<GridProvenanceTag kind="D" className="ml-1" /></span>
                  <span className="font-semibold text-primary text-left">
                    {(() => {
                      const u = generationData.find(g => g.name === 'Gas')?.unitCost;
                      return u == null ? '—' : `${u.toFixed(2)} Tk/KWh`;
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

      {!isDataMissing && activeTab === 'gas' && (
        <div className="grid-explorer-panel space-y-6">
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

      {!isDataMissing && activeTab === 'imports' && (
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
                <Info className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-2">Cross-Border Power Imports Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                No official records are available for the selected date. PGCB import data tracking officially started on December 31, 2013.
              </p>
              <div className="mt-4 text-[10px] text-muted-foreground">
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

          {methodologyBanner}
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
              <Globe className="h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <h3 className="grid-explorer-chart-card__title">Cross-Border Power Imports Tracker<DailyBadge /></h3>
                  <p className="grid-explorer-chart-card__sub">Real-time import allocations and daily power trade (Report: {systemStats.date}) • <span className="text-primary font-semibold text-xs">{coverageLabel('borderImports')}</span></p>
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
                    <th className="text-left">Peak Capacity Served (MW)<GridProvenanceTag kind="P" className="ml-1" /></th>
                    {/*
                      The blended-rate column is deliberately not here. PGCB
                      prices imports as one line covering Bheramara, Adani and
                      Tripura together, so any Tk/KWh from it is a single average
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
                      rate, which put the SAME Tk/KWh against Bheramara, Adani
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

            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl mt-5 text-xs text-muted-foreground leading-relaxed space-y-2">
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

      {!isDataMissing && activeTab === 'renewables' && (
        <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}>
          <RenewablesTab
            isoDate={selectedDate}
            generationData={generationData}
            systemStats={systemStats}
            sourceFiles={sourceFiles}
          />
        </GridLockedContent>
      )}

      {!isDataMissing && activeTab === 'plants' && (
        <div className="space-y-6">
          <StationsKpiStrip isoDate={selectedDate} systemStats={systemStats} sourceFiles={sourceFiles} />
          <PowerStationsTab isoDate={selectedDate} systemStats={systemStats} sourceFiles={sourceFiles} />
        </div>
      )}

      {!isDataMissing && activeTab === 'transmission' && (
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
                <Info className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-2">PGCB Transmission Grid Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                No official records are available for the selected date. PGCB transmission outages and substation tracking officially started on December 31, 2013.
              </p>
              <div className="mt-4 text-[10px] text-muted-foreground">
                Official Backlog Start Date: December 31, 2013
              </div>
            </div>
          </div>
        ) : ( <GridLockedContent variant="micro" locked={tierLockRequired !== null} requiredTier={tierLockRequired as any} selectedDate={selectedDate} onTryDemo={() => setSelectedDate(DEMO_DATE)}><div className="grid-explorer-panel space-y-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Mobile/Tablet Sub-tab Navigation */}
            <div className="lg:hidden w-full relative z-40 bg-card border border-border/60 p-3 rounded-2xl shadow-sm">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
                Select Section
              </label>
              <div className="relative">
                <select
                  value={
                    transSubTab === 'projects'
                      ? (projectType === 'ongoing' ? 'projects_ongoing' : 'projects_upcoming')
                      : transSubTab
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'projects_ongoing') {
                      setTransSubTab('projects');
                      setProjectType('ongoing');
                    } else if (val === 'projects_upcoming') {
                      setTransSubTab('projects');
                      setProjectType('upcoming');
                    } else {
                      setTransSubTab(val as any);
                    }
                  }}
                  className="w-full appearance-none px-4 py-3 pr-10 text-xs font-semibold rounded-xl border border-border/40 bg-muted/20 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {[
                    {
                      group: "Grid Infrastructure",
                      items: [
                        { id: 'transmission', label: 'Power Transmission' },
                        { id: 'lines', label: 'Transmission Line Information' },
                        { id: 'substations', label: 'Substation Information' }
                      ]
                    },
                    {
                      group: "Grid Projects",
                      items: [
                        { id: 'projects_ongoing', label: 'Ongoing Projects' },
                        { id: 'projects_upcoming', label: 'Upcoming Projects' },
                        { id: 'completed_projects', label: 'Completed Projects' }
                      ]
                    },
                    {
                      group: "Maps & Diagrams",
                      items: [
                        { id: 'grid_net', label: 'National Grid Network Diagram' },
                        { id: 'geo_map', label: 'Geographical Grid Map' }
                      ]
                    },
                    {
                      group: "Optical Fiber (OPGW)",
                      items: [
                        { id: 'opgw_map', label: 'OPGW Fiber Network Map' },
                        { id: 'opgw_lease', label: 'Optical Fiber Leasing' }
                      ]
                    }
                  ].map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Desktop Left Sidebar Navigation */}
            <div className="hidden lg:block lg:col-span-3 space-y-4 lg:sticky lg:top-24 bg-card border border-border/60 p-4 rounded-2xl shadow-sm">
              <div className="pb-3 border-b border-border/40">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Technical Information
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Power Grid Infrastructure &amp; Projects
                </p>
              </div>

              {[
                {
                  group: "Grid Infrastructure",
                  colorClass: "text-sky-500",
                  items: [
                    { id: 'transmission', label: 'Power Transmission', icon: Activity, activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-sky-500/5 hover:text-sky-600 dark:hover:text-sky-400" },
                    { id: 'lines', label: 'Transmission Line Information', icon: Cable, activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-sky-500/5 hover:text-sky-600 dark:hover:text-sky-400" },
                    { id: 'substations', label: 'Substation Information', icon: Database, activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-sky-500/5 hover:text-sky-600 dark:hover:text-sky-400" }
                  ]
                },
                {
                  group: "Grid Projects",
                  colorClass: "text-muted-foreground",
                  items: [
                    { id: 'projects_ongoing', label: 'Ongoing Projects', icon: TrendingUp, activeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-amber-500/5 hover:text-amber-600 dark:hover:text-amber-400" },
                    { id: 'projects_upcoming', label: 'Upcoming Projects', icon: Activity, activeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400" },
                    { id: 'completed_projects', label: 'Completed Projects', icon: CheckSquare, activeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400" }
                  ]
                },
                {
                  group: "Maps & Diagrams",
                  colorClass: "text-indigo-500",
                  items: [
                    { id: 'grid_net', label: 'National Grid Network Diagram', icon: Network, activeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-indigo-500/5 hover:text-indigo-600 dark:hover:text-indigo-400" },
                    { id: 'geo_map', label: 'Geographical Grid Map', icon: MapPin, activeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-indigo-500/5 hover:text-indigo-600 dark:hover:text-indigo-400" }
                  ]
                },
                {
                  group: "Optical Fiber (OPGW)",
                  colorClass: "text-purple-500",
                  items: [
                    { id: 'opgw_map', label: 'OPGW Fiber Network Map', icon: Map, activeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400" },
                    { id: 'opgw_lease', label: 'Optical Fiber Leasing', icon: DollarSign, activeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-sm font-semibold", hoverClass: "hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400" }
                  ]
                }
              ].map((g, idx) => (
                <div key={g.group} className={cn("space-y-1.5", idx > 0 && "pt-3 border-t border-border/30")}>
                  <h4 className={cn("text-[10px] font-bold uppercase tracking-widest px-2", g.colorClass)}>
                    {g.group}
                  </h4>
                  <div className="space-y-0.5">
                    {g.items.map((t) => {
                      const SubIcon = t.icon;
                      const active = t.id === 'projects_ongoing'
                        ? (transSubTab === 'projects' && projectType === 'ongoing')
                        : t.id === 'projects_upcoming'
                        ? (transSubTab === 'projects' && projectType === 'upcoming')
                        : transSubTab === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (t.id === 'projects_ongoing') {
                              setTransSubTab('projects');
                              setProjectType('ongoing');
                            } else if (t.id === 'projects_upcoming') {
                              setTransSubTab('projects');
                              setProjectType('upcoming');
                            } else {
                              setTransSubTab(t.id as any);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition-all duration-150 border text-left",
                            active
                              ? t.activeClass
                              : cn("border-transparent text-muted-foreground", t.hoverClass)
                          )}
                        >
                          <SubIcon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-current" : "text-muted-foreground group-hover:text-current")} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-9 space-y-6">

          {/*
            Provenance note for the whole tab. This section is a standing asset
            register, not a daily reading: it does not move with the date picker,
            so a reader could otherwise take these figures for the selected day's.
          */}
          <div className="p-3.5 rounded-2xl bg-muted/10 border border-border/30 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">What P and D mean here.</strong>{' '}
              <GridProvenanceTag kind="P" /> marks a figure PGCB states in its own
              publication, quoted as written.{' '}
              <GridProvenanceTag kind="D" /> marks one computed here — on this tab that
              is only ever a count of the records held or a total summed from the rows
              shown, never an estimate. These are <strong className="text-foreground">standing
              infrastructure figures, not daily readings</strong>: they carry the date PGCB
              states for them and do not change with the reporting date selected above.
            </span>
          </div>

          {/* Sub-tab 1: Power Transmission */}
          {transSubTab === 'transmission' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Core Operating Function Card */}
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent border-primary/25 relative overflow-hidden">
                {/* Visual grid pattern background decoration */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <div className="space-y-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0">
                      <Activity className="h-6 w-6 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground">Power Transmission</h3>
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                          Core Grid Function
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-foreground font-medium leading-relaxed">
                        PGCB does not generate electricity and does not sell it to you. It
                        owns the wires in between: it collects power from the stations that
                        make it and carries it to the companies that deliver it to homes and
                        businesses. It earns a fee per unit carried — a toll for use of the
                        road, not a price for the goods — and the regulator, BERC, sets that
                        fee rather than PGCB.
                      </p>
                      <details className="group/jargon">
                        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1.5">
                          <ChevronDown className="h-3 w-3 transition-transform group-open/jargon:rotate-180" />
                          PGCB&apos;s exact wording
                        </summary>
                        <p className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-primary/40 pl-3 mt-2">
                        The main operating function of Power Grid is wheeling of energy from BPDB power stations and Generation Companies to Distribution entities utilizing transmission network. Power Grid gets its energy wheeling charge from its clients(distribution entities) at the rate fixed by Bangladesh Electricity Regulatory Commission (BERC).
                        </p>
                      </details>
                    </div>
                  </div>

                  {/* Wheeling Workflow Visualization */}
                  <div className="space-y-4 pt-5 border-t border-border/30">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">How power reaches you</h4>
                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      {/* Step 1 */}
                      <div className="group p-5 rounded-2xl bg-muted/15 border border-border/30 hover:border-primary/20 hover:bg-muted/20 transition-all flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted-foreground/10 px-2.5 py-0.5 rounded-full">Step 1: Generation</span>
                            <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
                          </div>
                          <h5 className="text-sm font-bold text-foreground">Power Generation Plants</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Power stations burn gas or coal, or catch sun and wind, and make electricity. State-owned and private plants both feed the same grid.
                          </p>
                        </div>
                        <div className="border-t border-border/20 pt-2 mt-4 text-[10px] text-muted-foreground font-medium">
                          Gas, coal, furnace oil, solar, and imported power
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="group p-5 rounded-2xl bg-primary/5 border border-primary/25 hover:border-primary/40 hover:bg-primary/10 transition-all flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">Step 2: Transmission</span>
                            <Cable className="h-4 w-4 text-primary" />
                          </div>
                          <h5 className="text-sm font-bold text-foreground">High-Voltage Wheeling Grid</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            This is PGCB. It raises the voltage to <strong className="text-foreground">400,000, 230,000 or 132,000 volts</strong> so the power can cross the country without most of it being lost as heat along the way.
                          </p>
                        </div>
                        <div className="border-t border-primary/20 pt-2 mt-4 text-[10px] text-primary font-semibold">
                          The toll PGCB charges is set by the regulator
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="group p-5 rounded-2xl bg-muted/15 border border-border/30 hover:border-primary/20 hover:bg-muted/20 transition-all flex flex-col justify-between relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted-foreground/10 px-2.5 py-0.5 rounded-full">Step 3: Distribution</span>
                            <Globe className="h-4 w-4 text-emerald-500" />
                          </div>
                          <h5 className="text-sm font-bold text-foreground">Distribution Entities (Clients)</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            The voltage is brought back down at a substation and handed to your local utility, which runs the last stretch of cable to your meter.
                          </p>
                        </div>
                        <div className="border-t border-border/20 pt-2 mt-4 text-[10px] text-muted-foreground font-medium">
                          Your bill comes from one of these: DPDC, DESCO, BREB/PBS, WZPDCO, NESCO
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Asset History and Standing Comparison */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Historical Takeover */}
                <div className="grid-explorer-chart-card card p-6 bg-gradient-to-b from-card to-muted/5 border-border/40 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="grid-explorer-chart-card__head">
                      <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                        <FileText className="h-5 w-5 shrink-0" />
                      </div>
                      <div>
                        <h3 className="grid-explorer-chart-card__title">Where PGCB Started</h3>
                        <p className="grid-explorer-chart-card__sub">What PGCB started with, handed over from BPDB and DESA</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-amber-500/50 pl-3">
                        "The Power Grid took over about 2497 circuit km of 230 kV lines, 4236 circuit km 27.3 circuit km (Others) of 132 kV lines, 6 nos of 230/132 kV Substation and 63 nos of 132/33 kV substations from BPDB and DESA in different phases."
                      </p>

                      <div className="grid gap-2.5 mt-4 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited 230 kV Transmission Lines</span>
                          <span className="text-xs font-bold text-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border/40">about 2497 circuit km</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited 132 kV Transmission Lines</span>
                          <div className="text-left">
                            <span className="text-xs font-bold text-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border/40">4236 circuit km</span>
                            <span className="block text-[9px] text-muted-foreground mt-1">Plus 27.3 circuit km (Others)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited 230/132 kV Substations</span>
                          <span className="text-xs font-bold text-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border/40">6 nos</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited 132/33 kV Substations</span>
                          <span className="text-xs font-bold text-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border/40">63 nos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <GridCardFooter className="mt-4">
                    <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — corporate profile</span>
                    <span>Quoted verbatim from PGCB&apos;s own statement. Not independently audited.</span>
                    <span className="font-medium">Reporting Period: Takeover from BPDB &amp; DESA</span>
                  </GridCardFooter>
                </div>

                {/* Standing Assets up to June, 2026 */}
                <div className="grid-explorer-chart-card card p-6 bg-gradient-to-b from-card to-muted/5 border-border/40 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="grid-explorer-chart-card__head">
                      <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                        <TrendingUp className="h-5 w-5 shrink-0" />
                      </div>
                      <div>
                        <h3 className="grid-explorer-chart-card__title">The Grid Today</h3>
                        <p className="grid-explorer-chart-card__sub">What PGCB owns and runs, as at June 2026</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-foreground leading-relaxed">
                        PGCB now runs <strong>18,816 km of high-voltage line</strong> — the
                        long-distance wires that carry power from the plants to your city,
                        before any local pole or street cable. It hands that power over at{' '}
                        <strong>259 substations</strong>, the sites that step the voltage
                        down so it can be used.
                      </p>

                      <details className="group/quote">
                        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1.5">
                          <ChevronDown className="h-3 w-3 transition-transform group-open/quote:rotate-180" />
                          PGCB&apos;s exact wording
                        </summary>
                        <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-sky-500/50 pl-3 mt-2">
                          &ldquo;Transmission lines of the company up to June, 2026 are stood at 3,282 ckt km 27.8 ckt km (Others) of 400 kV lines, 5,423 circuit km 27.3 circuit km (Others) of 230 kV lines, 9,687 circuit km and 369 circuit km (Others) of 132 kV lines and 1 nos of 400 kV Station, 11 nos of 400/230kV substation, 5 nos of 400/132kV substation, 36 nos of 230/132 kV substation, 3 nos of 230/33 KV substation and 151 nos of 132/33 kV substations.&rdquo;
                        </p>
                      </details>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-1">
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />400 kV — the motorways</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">3,282 km</span>
                          <span className="text-[9px] text-muted-foreground">Plus 27.8 km run by others</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />230 kV — the trunk roads</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">5,423 km</span>
                          <span className="text-[9px] text-muted-foreground">Plus 27.3 km run by others</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30 col-span-2">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />132 kV — the main roads</span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">9,687 km</span>
                          <span className="text-[9px] text-muted-foreground">Plus 369 km run by others</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Highest-voltage sites</span>
                          <span className="text-[10px] font-bold text-foreground block mt-0.5 leading-tight">1 × 400 kV station</span>
                          <span className="text-[9px] text-muted-foreground">11 step 400→230 kV, 5 step 400→132 kV</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/30">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Handover sites</span>
                          <span className="text-[10px] font-bold text-foreground block mt-0.5 leading-tight">36 step 230→132 kV</span>
                          <span className="text-[9px] text-muted-foreground">2 step 230→33 kV, 150 step 132→33 kV</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <GridCardFooter className="mt-4">
                    <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — corporate profile</span>
                    <span>
                      Figures read from PGCB&apos;s page by two independent parsers, which
                      agreed on all 20 checked values. One caveat, and it is PGCB&apos;s
                      own: the paragraph quoted above says <strong className="text-foreground">3</strong>{' '}
                      230/33 kV and <strong className="text-foreground">151</strong> 132/33 kV
                      substations, while the table further down the same page says{' '}
                      <strong className="text-foreground">2</strong> and{' '}
                      <strong className="text-foreground">150</strong>. The tiles follow the
                      table, because that is the version PGCB&apos;s own totals add up to.
                    </span>
                    <span className="font-medium">Standing as at: June 2026</span>
                  </GridCardFooter>
                </div>
              </div>

              {/* Takeover vs. Standing Comparative Table */}
              <div className="grid-explorer-chart-card card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Then vs Now</h3>
                </div>
                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table text-xs">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="py-2.5 text-left text-foreground font-bold">Infrastructure Class</th>
                        <th className="py-2.5 text-left text-foreground font-bold">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inherited (Takeover from BPDB &amp; DESA)</span>
                        </th>
                        <th className="py-2.5 text-left text-foreground font-bold">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Standing (Up to June, 2026)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">400 kV Transmission Lines</td>
                        <td className="py-2 text-muted-foreground">—</td>
                        <td className="py-2 text-foreground font-medium">3,282 ckt km <span className="text-[10px] text-muted-foreground block">Plus 27.8 ckt km (Others)</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">230 kV Transmission Lines</td>
                        <td className="py-2 text-foreground font-medium">about 2497 circuit km</td>
                        <td className="py-2 text-foreground font-medium">5,423 circuit km <span className="text-[10px] text-muted-foreground block">Plus 27.3 circuit km (Others)</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">132 kV Transmission Lines</td>
                        <td className="py-2 text-foreground font-medium">4236 circuit km <span className="text-[10px] text-muted-foreground block">Plus 27.3 circuit km (Others)</span></td>
                        <td className="py-2 text-foreground font-medium">9,687 circuit km <span className="text-[10px] text-muted-foreground block">Plus 369 circuit km (Others)</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">400 kV Stations / Substations</td>
                        <td className="py-2 text-muted-foreground">—</td>
                        <td className="py-2 text-foreground font-medium">
                          <span className="block">1 nos of 400 kV Station</span>
                          <span className="block text-[10px] text-muted-foreground">11 nos of 400/230kV substation</span>
                          <span className="block text-[10px] text-muted-foreground">5 nos of 400/132kV substation</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">230 kV Substations</td>
                        <td className="py-2 text-foreground font-medium">6 nos of 230/132 kV Substation</td>
                        <td className="py-2 text-foreground font-medium">
                          <span className="block">36 nos of 230/132 kV substation</span>
                          <span className="block text-[10px] text-muted-foreground">2 nos of 230/33 KV substation</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-2 font-semibold text-foreground">132/33 kV Substations</td>
                        <td className="py-2 text-foreground font-medium">63 nos of 132/33 kV substations</td>
                        <td className="py-2 text-foreground font-medium">150 nos of 132/33 kV substations</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <GridCardFooter className="mt-4">
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — corporate profile</span>
                  <span>
                    Both columns restate PGCB&apos;s own figures side by side. No growth
                    rate or difference is computed, so every cell here is P; the
                    &ldquo;—&rdquo; marks a class PGCB does not state for that period, not a zero.
                  </span>
                  <span className="font-medium">Reporting Period: Takeover &rarr; June 2026</span>
                </GridCardFooter>
              </div>

              {/* Callout box for projects */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xs text-foreground font-semibold leading-normal">
                  PGCB is building more lines and substations — the projects are listed under Grid Projects in the menu.
                </p>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Jargon, translated
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">kV (Kilovolt)</strong>
                    1,000 volts. Pushing power at high voltage is like using a wider pipe — less is wasted as heat on a long journey, which is why the grid steps voltage up to travel and back down to deliver.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">ckt km (Circuit Kilometers)</strong>
                    Length of wire, not length of route. One tower line often carries two circuits, so a 10 km stretch of towers counts as 20 circuit km.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">MVA (Megavolt-Ampere)</strong>
                    The size rating of a substation — roughly how much power it can pass at once. Think of it as the width of the doorway, not how much actually walks through.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Nos (Numbers)</strong>
                    Just “number of”. PGCB writes “11 nos” where we would write “11”.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">BERC / BPDB</strong>
                    BERC is the regulator that sets prices. BPDB is the state power company that generates and buys electricity.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Transmission Line Information */}
          {transSubTab === 'lines' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Column 1: Transmission Line stats */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Transmission Line Info Card */}
                  <div className="grid-explorer-chart-card card h-full flex flex-col justify-between">
                    <div>
                      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                        <Cable className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <h3 className="grid-explorer-chart-card__title">Transmission Line as on: June, 2026</h3>
                          <p className="grid-explorer-chart-card__sub">How much high-voltage wire exists, by voltage class</p>
                        </div>
                      </div>

                      <div className="grid-explorer-table-wrap">
                        <table className="grid-explorer-table text-xs">
                          <thead>
                            <tr className="border-b border-border/40">
                              <th className="py-2 text-left">Voltage Class</th>
                              <th className="py-2 text-left">
                                <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Main Capacity</span>
                              </th>
                              <th className="py-2 text-left">
                                <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Others</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2.5 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                400kV
                              </td>
                              <td className="py-2.5 text-left tabular-nums font-bold text-foreground">3,282 Circuit km</td>
                              <td className="py-2.5 text-left tabular-nums text-muted-foreground">27.8 Circuit km (Others)</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2.5 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                230kV
                              </td>
                              <td className="py-2.5 text-left tabular-nums font-bold text-foreground">5,423 Circuit km</td>
                              <td className="py-2.5 text-left tabular-nums text-muted-foreground">27.3 Circuit km (Others)</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2.5 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                132kV
                              </td>
                              <td className="py-2.5 text-left tabular-nums font-bold text-foreground">9,687 Circuit km</td>
                              <td className="py-2.5 text-left tabular-nums text-muted-foreground">369 Circuit km (Others)</td>
                            </tr>
                            <tr className="border-t border-border/60 font-bold bg-muted/20">
                              <td className="py-3 pl-3">Total Line</td>
                              <td className="py-3 text-left tabular-nums text-primary pr-3" colSpan={2}>18,816 Circuit km</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Last Five Years Achievement */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="grid-explorer-chart-card card h-full flex flex-col justify-between">
                    <div>
                      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                        <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
                        <div>
                          <h3 className="grid-explorer-chart-card__title">Last Five years achievement</h3>
                          <p className="grid-explorer-chart-card__sub">Major projects and capacities commissioned recently</p>
                        </div>
                      </div>

                      <div className="grid-explorer-table-wrap">
                        <table className="grid-explorer-table text-xs">
                          <thead>
                            <tr className="border-b border-border/40">
                              <th className="py-2 text-left">Infrastructure Item</th>
                              <th className="py-2 text-left">Verbatim Capacity / Length</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/10">
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">400/230kV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">9 Nos. 13,100 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">400/132 kV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">4 Nos. 2,990 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">230/132kV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">10 Nos: 7,550 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">230/33KV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">1 Nos 280 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold">132/33kV Substation</td>
                              <td className="py-2 text-left tabular-nums text-foreground font-bold">38 Nos. 7,647 MVA</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold text-emerald-500">400kV Transmission Line</td>
                              <td className="py-2 text-left tabular-nums text-emerald-500 font-bold">2,124.77 Circuit km</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold text-emerald-500">230kV Transmission Line</td>
                              <td className="py-2 text-left tabular-nums text-emerald-500 font-bold">1,481.94 Circuit km</td>
                            </tr>
                            <tr className="hover:bg-muted/5 transition-colors">
                              <td className="py-2 font-semibold text-emerald-500">132kV Transmission Line</td>
                              <td className="py-2 text-left tabular-nums text-emerald-500 font-bold">1,249.874 Circuit km</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Substation Capacity details (Full width) */}
                <div className="lg:col-span-12">
                  <div className="grid-explorer-chart-card card p-6">
                    <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border pb-3 mb-4">
                      <Database className="h-5 w-5 text-indigo-500 shrink-0" />
                      <div>
                        <h3 className="grid-explorer-chart-card__title">Substation as on: June, 2026</h3>
                        <p className="grid-explorer-chart-card__sub">Comprehensive capacity aggregates across all operation nodes</p>
                      </div>
                    </div>

                    <div className="grid-explorer-table-wrap">
                      <table className="grid-explorer-table text-xs">
                        <thead>
                          <tr className="border-b border-border/40">
                            <th className="py-2 text-left">Substation / Station Class</th>
                            <th className="py-2 text-left">Count / Quantity</th>
                            <th className="py-2 text-left">Main Capacity / Rating</th>
                            <th className="py-2 text-left">Others (Quantity &amp; Capacity)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">400kV HVDC Station</td>
                            <td className="py-2.5 text-foreground">1 Nos.</td>
                            <td className="py-2.5 text-left font-medium text-foreground">2x500MW HVDC Back to Back station</td>
                            <td className="py-2.5 text-left text-muted-foreground">—</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">400/230kV Substation</td>
                            <td className="py-2.5 text-foreground">11 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">16,180 MVA</td>
                            <td className="py-2.5 text-left font-medium text-muted-foreground">3 Nos. 2730 MVA (Others)</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">400/132 kV Substation</td>
                            <td className="py-2.5 text-foreground">5 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">4,590 MVA</td>
                            <td className="py-2.5 text-left text-muted-foreground">—</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">230/132kV Substation</td>
                            <td className="py-2.5 text-foreground">36 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">24,725 MVA</td>
                            <td className="py-2.5 text-left font-medium text-muted-foreground">1 Nos. 250 MVA (Others)</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">230/33KV Substation</td>
                            <td className="py-2.5 text-foreground">2 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">700 MVA</td>
                            <td className="py-2.5 text-left font-medium text-muted-foreground">4 Nos. 1,050 MVA (Others)</td>
                          </tr>
                          <tr className="hover:bg-muted/5 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">132/33kV Substation</td>
                            <td className="py-2.5 text-foreground">150 Nos.</td>
                            <td className="py-2.5 text-left font-bold text-foreground">33,627 MVA</td>
                            <td className="py-2.5 text-left font-medium text-muted-foreground">46 Nos. 7,661 MVA (Others)</td>
                          </tr>
                          
                          {/* Summary Row 1: Overall Capacity */}
                          <tr className="border-t border-border/50 bg-primary/5 font-semibold text-foreground">
                            <td className="py-3 pl-3 text-primary font-bold">Overall Capacity</td>
                            <td className="py-3 font-bold" colSpan={2}>259 Nos.</td>
                            <td className="py-3 text-left font-bold text-primary pr-3">91,512 MVA</td>
                          </tr>
                          
                          {/* Summary Row 2: Dispatch Capacity */}
                          <tr className="bg-emerald-500/5 font-semibold text-foreground">
                            <td className="py-3 pl-3 text-emerald-500 font-bold" colSpan={2}>Dispatch Capacity at 33kV level</td>
                            <td className="py-3 text-left font-bold text-emerald-500 pr-3" colSpan={2}>
                              36267.21 MW <span className="text-[10px] text-muted-foreground font-normal">(Including all organizations)</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Jargon, translated
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">kV (Kilovolt)</strong>
                    1,000 volts. Higher voltage travels further with less waste.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Circuit km (ckt km)</strong>
                    Length of wire rather than length of route — a tower line carrying two circuits counts twice.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">MVA / MW</strong>
                    Two different things that both sound like size. MVA rates what a substation can pass; MW measures power actually flowing. They cannot be added together.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">HVDC Station</strong>
                    A converter station. Bangladesh’s grid and India’s run out of step with each other, so power is turned into DC and back to cross between them.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Others Capacity</strong>
                    Lines and substations on the network that someone other than PGCB owns. Listed separately so PGCB’s own assets are not overstated.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Substation Information */}
          {transSubTab === 'substations' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Header Card Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Text Description */}
                <div className="grid-explorer-chart-card card p-6 lg:col-span-2 bg-gradient-to-r from-indigo-500/5 via-primary/5 to-transparent border-indigo-500/20 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shrink-0">
                        <Database className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-foreground">National Grid Substation Database</h3>
                          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                            Last Updated: Sunday, May 24, 2026 at 02:12 PM
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Every substation on the national grid — the sites where voltage is stepped down and power changes hands. Search or filter the list below.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Key Stats Quick View Card */}
                <div className="grid-explorer-chart-card card p-6 lg:col-span-1 bg-muted/10 border-border/30 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Substation Database Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        {/*
                          Counts register rows, and the register lists one row per
                          transformer bank, not per station — Payra appears twice, once
                          for its 2x325 bank and once for its 2x80/120. Calling the
                          result "Stations" overstated the fleet: 260 rows cover 227
                          distinct stations. Labelled for what it actually counts.
                        */}
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Register Entries</span>
                        <div className="text-sm font-bold text-foreground tabular-nums">{filteredSubstations.length} Rows</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Filtered Capacity</span>
                        <div className="text-sm font-bold text-primary tabular-nums">{formatNumber(totalSubCapacityMva)} MVA</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Unique Zones</span>
                        <div className="text-sm font-bold text-foreground tabular-nums">9 Zones</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Grid Circle Groups</span>
                        <div className="text-sm font-bold text-emerald-500 tabular-nums">HVDC &amp; Circles</div>
                      </div>
                    </div>
                  </div>
                  <GridCardFooter className="mt-4">
                    <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB substation register</a></span>
                    <span>
                      Each substation is listed as PGCB states it; the counts and the
                      capacity total are ours, computed over whatever the filters above
                      currently select — so they move as you filter and are not PGCB
                      totals. <strong className="text-foreground">The register lists one row per
                      transformer bank, not per station</strong>, so its 260 rows cover 227
                      distinct stations; the row count is shown as rows rather than as a
                      station count for that reason.{' '}
                      <strong className="text-foreground">Filtered Capacity sums only the
                      MVA-rated transformers</strong>: the HVDC back-to-back blocks are rated in
                      MW, a different quantity, and adding them to an MVA total would be
                      arithmetic on mismatched units, so they are excluded.{' '}
                      <strong className="text-foreground">This station list is the April 2026
                      collection and has not been re-collected since.</strong> Summed whole it
                      comes to 89,155 MVA, which matched PGCB&apos;s April total exactly; PGCB
                      has since published 91,512 MVA for June, so the list now trails the
                      summary tables above by 2,357 MVA.
                    </span>
                    <span className="font-medium">Register as at: April 2026</span>
                  </GridCardFooter>
                </div>
              </div>

              {/* Substation Rating Categories Breakdown Table */}
              <div className="grid-explorer-chart-card card">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <Database className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Substation Assets &amp; Capacity</h3>
                    <p className="grid-explorer-chart-card__sub">Active substations and transformer ratings as of June 2026</p>
                  </div>
                </div>

                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table">
                    <thead>
                      <tr>
                        <th>Rating / Type</th>
                        <th className="text-left">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Quantity</span>
                        </th>
                        <th className="text-left">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Capacity (MVA)</span>
                        </th>
                        <th className="text-left">
                          <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Others Capacity</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-semibold">400 kV HVDC Back-to-Back</td>
                        <td className="text-left tabular-nums font-medium text-foreground">1 Station</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">2x500 MW</td>
                        <td className="text-left text-muted-foreground">—</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">400/230 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">11 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">16,180 MVA</td>
                        <td className="text-left tabular-nums text-muted-foreground">3 Nos. (2,730 MVA)</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">400/132 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">5 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">4,590 MVA</td>
                        <td className="text-left text-muted-foreground">—</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">230/132 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">36 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">24,725 MVA</td>
                        <td className="text-left tabular-nums text-muted-foreground">1 Nos. (250 MVA)</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">230/33 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">2 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">700 MVA</td>
                        <td className="text-left tabular-nums text-muted-foreground">4 Nos. (1,050 MVA)</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">132/33 kV Substations</td>
                        <td className="text-left tabular-nums font-medium text-foreground">150 Nos.</td>
                        <td className="text-left tabular-nums font-semibold text-foreground">33,627 MVA</td>
                        <td className="text-left tabular-nums text-muted-foreground">46 Nos. (7,661 MVA)</td>
                      </tr>
                      <tr className="border-t border-border/80 font-bold bg-muted/20">
                        <td className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Overall Substation Capacity</td>
                        <td className="text-left tabular-nums text-primary">259 Stations</td>
                        <td className="text-left tabular-nums text-primary" colSpan={2}>91,512 MVA</td>
                      </tr>
                      <tr className="font-bold bg-muted/10">
                        <td className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Dispatch Capacity (33kV level)</td>
                        <td className="text-left tabular-nums text-emerald-500 font-extrabold" colSpan={3}>38,733 MW</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <GridCardFooter className="mt-4">
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — substation assets</span>
                  <span>
                    Every row here is PGCB&apos;s, including the Overall line, which PGCB
                    prints itself — so it is marked P rather than as our sum. Adding the
                    rows up gives 259 stations, matching exactly, and{' '}
                    <strong className="text-foreground">91,513 MVA against the 91,512 PGCB
                    prints</strong> — a 1 MVA difference in PGCB&apos;s own arithmetic, shown
                    as published rather than quietly corrected. The HVDC back-to-back
                    station sits outside the MVA total: it is rated 2&times;500 MW, a
                    different quantity that cannot be added to an MVA figure.
                  </span>
                  <span className="font-medium">Assets as at: June 2026</span>
                </GridCardFooter>
              </div>

              {/* Substation Filters */}
              <div className={cn('grid-explorer-filter-panel p-4 bg-card border border-border/60 rounded-2xl z-40 relative', subFiltersOpen && 'is-open')}>
                <button
                  type="button"
                  className="grid-explorer-filter-panel__toggle"
                  aria-expanded={subFiltersOpen}
                  onClick={() => setSubFiltersOpen((o) => !o)}
                >
                  <span>Filter substations</span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', subFiltersOpen && 'rotate-180')} />
                </button>
                <div className="grid-explorer-filter-panel__body mt-4 sm:mt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="search"
                      placeholder="Search substation name..."
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      className="grid-explorer-control w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-muted/20 text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <CustomDropdown
                    value={subVoltageFilter}
                    onChange={setSubVoltageFilter}
                    options={voltageOptions}
                    placeholder="All Voltage Classes"
                    isOpen={isVoltageDropdownOpen}
                    setIsOpen={setIsVoltageDropdownOpen}
                    dropdownRef={voltageDropdownRef}
                  />

                  <CustomDropdown
                    value={subZoneFilter}
                    onChange={setSubZoneFilter}
                    options={zoneOptions}
                    placeholder="All Operation Zones"
                    isOpen={isZoneDropdownOpen}
                    setIsOpen={setIsZoneDropdownOpen}
                    dropdownRef={zoneDropdownRef}
                  />

                  <CustomDropdown
                    value={subOwnerFilter}
                    onChange={setSubOwnerFilter}
                    options={ownerOptions}
                    placeholder="All Owners"
                    isOpen={isOwnerDropdownOpen}
                    setIsOpen={setIsOwnerDropdownOpen}
                    dropdownRef={ownerDropdownRef}
                  />
                </div>
              </div>

              {/* Substations Table */}
              <div className="grid-explorer-chart-card card">
                <div className="flex items-center justify-end gap-2 px-4 pt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Density</span>
                  {(['comfortable', 'compact'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSubTableDensity(d)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all duration-150 capitalize',
                        subTableDensity === d
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-muted/10 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/30',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <p className="grid-explorer-table-scroll-hint sm:hidden px-4" role="note">
                  Swipe horizontally to see all columns
                </p>
                <GridDataTable
                  stickyHeader
                  stickyFirstCol
                  density={subTableDensity}
                  empty={paginatedSubstations.length === 0}
                  emptyMessage="No substations match your filter criteria."
                  aria-label="National grid substation registry"
                  footer={
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Show:</span>
                        <div className="flex gap-1.5">
                          {[25, 50, 100].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setItemsPerPage(size);
                                setSubPage(1);
                              }}
                              className={cn(
                                'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all duration-150',
                                itemsPerPage === size
                                  ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                                  : 'bg-muted/10 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/30',
                              )}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">per page</span>
                      </div>

                      <span className="text-xs text-muted-foreground text-center">
                        Page <strong className="text-foreground">{totalSubPages === 0 ? 0 : subPage}</strong> of <strong className="text-foreground">{totalSubPages}</strong> ({filteredSubstations.length} total stations)
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={subPage === 1}
                          onClick={() => setSubPage((p) => Math.max(p - 1, 1))}
                          className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-muted-foreground focus:outline-none"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={subPage === totalSubPages || totalSubPages === 0}
                          onClick={() => setSubPage((p) => Math.min(p + 1, totalSubPages))}
                          className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-muted-foreground focus:outline-none"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  }
                >
                  <table className="grid-explorer-table">
                    <thead>
                      <tr>
                        <th>SN</th>
                        <th>Substation Name</th>
                        <th>Voltage Class</th>
                        <th>Operation Zone</th>
                        <th>Transformer Detail</th>
                        <th className="text-right">Total Capacity</th>
                        <th>Ownership</th>
                        <th>Grid Circle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSubstations.map((sub) => (
                        <tr key={substationRowKey(sub)} className="hover:bg-muted/5 transition-colors">
                          <td className="font-semibold text-muted-foreground tabular-nums">{sub.sn}</td>
                          <td className="font-semibold text-foreground" title={sub.name}>
                            <span className="grid-explorer-table__truncate">{sub.name}</span>
                          </td>
                          <td>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold',
                              sub.voltage === '400kV' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              sub.voltage === '230kV' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              sub.voltage === '132kV' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                              'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
                            )}>
                              {sub.voltage}
                            </span>
                          </td>
                          <td>{sub.zone}</td>
                          <td className="font-mono text-xs">{sub.transformer}</td>
                          <td className="text-right font-medium tabular-nums text-foreground">{sub.capacity}</td>
                          <td>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                              sub.owner === 'POWER GRID' ? 'bg-primary/10 text-primary' :
                              sub.owner === 'Bulk' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-muted text-muted-foreground',
                            )}>
                              {sub.owner}
                            </span>
                          </td>
                          <td>{sub.circle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </GridDataTable>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Jargon, translated
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">MVA (Megavolt-Ampere)</strong>
                    Apparent power capacity rating of the step-down transformers operating inside the substation.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">kV (Kilovolt Class)</strong>
                    Substation connection voltage (e.g. 132/33 kV steps down 132kV grid line to 33kV distribution feeder).
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Transformer Code</strong>
                    System operators designate transformer units (e.g. T-1, TR-2) for maintenance tracking.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Owner Groups</strong>
                    Entities managing the station (e.g. POWER GRID / PGCB, APSCL, BPDB utilities).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 4: Ongoing / Upcoming Projects */}
          {transSubTab === 'projects' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Header block */}
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {projectType === 'ongoing' ? 'Ongoing Projects' : 'Upcoming Projects'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {projectType === 'ongoing' 
                      ? 'Detailed status tracking of PGCB high-voltage grid upgrades, river crossings, and transmission line projects.'
                      : 'Planned high-voltage grid expansions, battery energy storage systems (BESS), and power transmission line projects in the pipeline.'}
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full shrink-0 font-mono inline-flex items-center gap-1">
                  <GridProvenanceTag kind="D" />
                  {projectType === 'ongoing' ? ongoingProjectsData.length : upcomingProjectsData.length} Projects under tracking
                </span>
              </div>

              {/* Project Type Toggle Pills */}
              <div className="flex items-center gap-2 p-1 bg-muted/20 border border-border/30 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setProjectType('ongoing')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none border border-transparent",
                    projectType === 'ongoing'
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/10 border-amber-600/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Ongoing Projects ({ongoingProjectsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectType('upcoming')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none border border-transparent",
                    projectType === 'upcoming'
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/10 border-red-600/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Upcoming Projects ({upcomingProjectsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransSubTab('completed_projects');
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none text-muted-foreground hover:text-foreground"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Completed Projects ({completedProjectsData.length})
                </button>
              </div>

              {/* Filters & Search */}
              <div className="p-4 bg-card border border-border/60 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-40">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search project name, objective, partner..."
                    value={projectSearch}
                    onChange={(e) => {
                      setProjectSearch(e.target.value);
                      setProjectPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="relative" ref={partnerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs md:text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground hover:bg-muted/30 hover:border-primary/30 focus:outline-none focus:border-primary/50 transition-all duration-150 font-medium shadow-sm"
                  >
                    <span className="truncate">Partner: {projectPartnerFilter === 'all' ? 'All Development Partners' : projectPartnerFilter}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150", isPartnerDropdownOpen && "rotate-180")} />
                  </button>
                  {isPartnerDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 z-[100] animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin">
                      <button
                        type="button"
                        onClick={() => { setProjectPartnerFilter('all'); setIsPartnerDropdownOpen(false); setProjectPage(1); }}
                        className={cn("w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold select-none text-left", projectPartnerFilter === 'all' ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
                      >
                        <span>All Development Partners</span>
                        {projectPartnerFilter === 'all' && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {['EXIM Bank of India', 'World Bank', 'ADB', 'AIIB', 'JICA', 'EDCF', 'KfW', 'Exim Bank China (G to G)', 'Indian LoC', 'N/A'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setProjectPartnerFilter(p); setIsPartnerDropdownOpen(false); setProjectPage(1); }}
                          className={cn("w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold select-none text-left", projectPartnerFilter === p ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
                        >
                          <span>{p}</span>
                          {projectPartnerFilter === p && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 gap-6">
                {paginatedProjects.map((proj, idx) => {
                  const isOngoing = 'status' in proj && typeof proj.status === 'object';
                  
                  if (isOngoing) {
                    const oProj = proj as any;
                    const physicalVal = parseFloat(oProj.status.physical.replace(/%/g, ''));
                    const financialVal = parseFloat(oProj.status.financial.replace(/%/g, ''));
                    
                    return (
                      <div key={idx} className="card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group border-border/40 hover:border-primary/30 transition-all duration-300 animate-in fade-in-50 duration-200">
                        {/* Title & Status */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{oProj.name}</h4>
                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span className="px-2 py-0.5 font-semibold bg-muted text-muted-foreground border border-border/60 rounded-full">
                                Partner: {oProj.partner}
                              </span>
                              <span className="px-2 py-0.5 font-semibold bg-primary/5 text-primary border border-primary/15 rounded-full">
                                Duration: {oProj.duration}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress Bars */}
                          <div className="flex items-center gap-6 shrink-0 bg-muted/10 p-3.5 rounded-2xl border border-border/20">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-8 text-[10px] font-bold text-foreground">
                                <span>Physical Progress</span>
                                <span className="text-primary font-mono">{oProj.status.physical}</span>
                              </div>
                              <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${physicalVal}%` }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-8 text-[10px] font-bold text-foreground">
                                <span>Financial Progress</span>
                                <span className="text-emerald-500 font-mono">{oProj.status.financial}</span>
                              </div>
                              <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${financialVal}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Objectives & Scope */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs border-t border-border/40 pt-4">
                          <div className="space-y-2">
                            <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Objectives</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                              {oProj.objectives.map((obj: string, i: number) => (
                                <li key={i}>{obj}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Scope of Work</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                              {oProj.scope.map((scp: string, i: number) => (
                                <li key={i}>{scp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Cost Grid */}
                        <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total Project Cost</span>
                            {renderProjectCost(oProj.cost.total)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">GOB Contribution</span>
                            {renderProjectCost(oProj.cost.gob)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Project Aid (PA)</span>
                            {renderProjectCost(oProj.cost.pa)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">PGCB Funding</span>
                            {renderProjectCost(oProj.cost.pgcb)}
                          </div>
                        </div>

                        {/* Footer: Contacts & Meta */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4 text-[10px] text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span><strong>Project Director:</strong> {oProj.director}</span>
                            <span>•</span>
                            <span>
                              <strong>Office:</strong> {oProj.office}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Mobile:</strong> <a href={`tel:${oProj.mobile}`} className="text-primary hover:underline font-medium">{oProj.mobile}</a>
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Email:</strong> <a href={`mailto:${oProj.email}`} className="text-primary hover:underline font-medium">{oProj.email}</a>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 text-[9px] uppercase tracking-wider font-semibold">
                            <span>Source: {oProj.source}</span>
                            <span>Updated: {oProj.lastUpdated}</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const uProj = proj as any;
                    const statusInfo = getUpcomingProjectStatusInfo(uProj.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={idx} className="card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group border-border/40 hover:border-primary/30 transition-all duration-300 animate-in fade-in-50 duration-200">
                        {/* Title & Status */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{uProj.name}</h4>
                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span className="px-2 py-0.5 font-semibold bg-muted text-muted-foreground border border-border/60 rounded-full">
                                Partner: {uProj.partner}
                              </span>
                              <span className="px-2 py-0.5 font-semibold bg-primary/5 text-primary border border-primary/15 rounded-full">
                                Duration: {uProj.duration}
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Badge & Status Details */}
                          <div className="flex items-center gap-3 shrink-0 bg-muted/10 p-3.5 rounded-2xl border border-border/20 max-w-xs md:max-w-md">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <StatusIcon className="h-3.5 w-3.5 text-primary" />
                                <span className={cn("px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider", statusInfo.bgColor, statusInfo.textColor)}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug font-medium">
                                {uProj.status}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Objectives & Scope */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs border-t border-border/40 pt-4">
                          <div className="space-y-2">
                            <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Objectives</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                              {uProj.objectives.map((obj: string, i: number) => (
                                <li key={i}>{obj}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Scope of Work</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                              {uProj.scope.map((scp: string, i: number) => (
                                <li key={i}>{scp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Cost Grid */}
                        <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total Project Cost</span>
                            {renderProjectCost(uProj.cost.total)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Project Aid (PA)</span>
                            {renderProjectCost(uProj.cost.pa)}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Development Partner</span>
                            <div className="font-bold text-foreground">{uProj.partner}</div>
                          </div>
                        </div>

                        {/* Footer: Contacts & Meta (Omitted Director details) */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4 text-[10px] text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-md border border-border/20">
                              Upcoming Pipeline Project
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 text-[9px] uppercase tracking-wider font-semibold">
                            <span>Source: {uProj.source}</span>
                            <span>Updated: {uProj.lastUpdated}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {filteredProjects.length === 0 && (
                  <div className="card p-12 text-center text-muted-foreground text-sm border-dashed border-border/60">
                    No {projectType} projects found matching the filters or search query.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalProjectPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <p className="text-[11px] text-muted-foreground">
                    Showing <span className="font-medium">{(projectPage - 1) * projectsPerPage + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(projectPage * projectsPerPage, filteredProjects.length)}</span> of{" "}
                    <span className="font-medium">{filteredProjects.length}</span> {projectType} projects
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={projectPage === 1}
                      onClick={() => setProjectPage(projectPage - 1)}
                      className="p-1.5 border border-border/40 rounded-lg bg-card/65 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-xs font-semibold text-foreground">
                      Page {projectPage} of {totalProjectPages}
                    </div>
                    <button
                      type="button"
                      disabled={projectPage === totalProjectPages}
                      onClick={() => setProjectPage(projectPage + 1)}
                      className="p-1.5 border border-border/40 rounded-lg bg-card/65 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <GridCardFooter>
                <span>Source: PGCB project documents, cited per project on each card above</span>
                <span>
                  Every project&apos;s name, partner, cost, duration and status is as the
                  source document states it. The counts are ours — they count the records
                  held here. {projectType === 'ongoing'
                    ? 'Checked against PGCB’s live ongoing-projects list on 13 Aug 2026: all 13 match, with nothing on their list missing here and nothing here absent from theirs.'
                    : 'PGCB publishes no upcoming-projects list on its site, so unlike the ongoing and completed registers these 7 cannot be reconciled against a live PGCB page.'}
                </span>
                <span className="font-medium">Registry: {projectType === 'ongoing' ? 'Ongoing' : 'Upcoming'} projects</span>
              </GridCardFooter>
            </div>
          )}

          {/* Sub-tab: Completed Projects */}
          {transSubTab === 'completed_projects' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Header block */}
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    Completed Projects
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive registry of successfully completed high-voltage transmission lines, substations, and grid network infrastructure projects.
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full shrink-0 font-mono inline-flex items-center gap-1">
                  <GridProvenanceTag kind="D" />
                  {completedProjectsData.length} Completed Projects
                </span>
              </div>

              {/* Project Type Toggle Pills */}
              <div className="flex items-center gap-2 p-1 bg-muted/20 border border-border/30 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setTransSubTab('projects');
                    setProjectType('ongoing');
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none text-muted-foreground hover:text-foreground"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Ongoing Projects ({ongoingProjectsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransSubTab('projects');
                    setProjectType('upcoming');
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none text-muted-foreground hover:text-foreground"
                >
                  <Activity className="h-3.5 w-3.5" />
                  Upcoming Projects ({upcomingProjectsData.length})
                </button>
                <button
                  type="button"
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-2 select-none border border-transparent bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 border-emerald-600/20"
                  )}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Completed Projects ({completedProjectsData.length})
                </button>
              </div>

              {/* Filters & Search */}
              <div className="p-4 bg-card border border-border/60 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-40">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search completed project name, objective, scope..."
                    value={completedSearch}
                    onChange={(e) => {
                      setCompletedSearch(e.target.value);
                      setCompletedPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="relative" ref={completedPartnerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCompletedPartnerDropdownOpen(!isCompletedPartnerDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs md:text-sm bg-muted/20 border border-border/40 rounded-xl text-foreground hover:bg-muted/30 hover:border-primary/30 focus:outline-none focus:border-primary/50 transition-all duration-150 font-medium shadow-sm"
                  >
                    <span className="truncate">Partner: {completedPartnerFilter === 'all' ? 'All Development Partners' : completedPartnerFilter}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150", isCompletedPartnerDropdownOpen && "rotate-180")} />
                  </button>
                  {isCompletedPartnerDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 z-[100] animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin">
                      <button
                        type="button"
                        onClick={() => { setCompletedPartnerFilter('all'); setIsCompletedPartnerDropdownOpen(false); setCompletedPage(1); }}
                        className={cn("w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold select-none text-left", completedPartnerFilter === 'all' ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
                      >
                        <span>All Development Partners</span>
                        {completedPartnerFilter === 'all' && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {['ADB', 'IDB', 'World Bank', 'JICA', 'EDCF', 'KfW', 'DANIDA', 'PGCB', 'N/A'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setCompletedPartnerFilter(p); setIsCompletedPartnerDropdownOpen(false); setCompletedPage(1); }}
                          className={cn("w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold select-none text-left", completedPartnerFilter === p ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40")}
                        >
                          <span>{p}</span>
                          {completedPartnerFilter === p && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 gap-6">
                {paginatedCompletedProjects.map((proj, idx) => (
                  <div key={idx} className="card p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group border-border/40 hover:border-primary/30 transition-all duration-300 animate-in fade-in-50 duration-200">
                    {/* Title & Status */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h4 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{proj.name}</h4>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className="px-2 py-0.5 font-semibold bg-muted text-muted-foreground border border-border/60 rounded-full">
                            Partner: {proj.partner}
                          </span>
                          <span className="px-2 py-0.5 font-semibold bg-primary/5 text-primary border border-primary/15 rounded-full">
                            Duration: {proj.duration}
                          </span>
                        </div>
                      </div>
                      
                      {/* Completed status badge */}
                      <div className="flex items-center gap-3 shrink-0 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            Completed Project
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Objectives & Scope */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs border-t border-border/40 pt-4">
                      <div className="space-y-2">
                        <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Objectives</h5>
                        {proj.objectives.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                            {proj.objectives.map((obj, i) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic">No objectives detailed.</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-bold text-foreground uppercase tracking-wider text-[9px] text-primary">Scope of Work</h5>
                        <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                          {proj.scope.map((scp, i) => (
                            <li key={i}>{scp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Cost Grid */}
                    <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total Project Cost</span>
                        {renderProjectCost(proj.cost.total)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">GOB Contribution</span>
                        {renderProjectCost(proj.cost.gob)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Project Aid (PA)</span>
                        {renderProjectCost(proj.cost.pa)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase">PGCB Funding</span>
                        {renderProjectCost(proj.cost.pgcb)}
                      </div>
                    </div>

                    {/* Footer: Contacts & Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-4 text-[10px] text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-md border border-border/20">
                          Successfully Commissioned
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-[9px] uppercase tracking-wider font-semibold">
                        <span>Source: {proj.source}</span>
                        <span>Updated: {proj.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCompletedProjects.length === 0 && (
                  <div className="card p-12 text-center text-muted-foreground text-sm border-dashed border-border/60">
                    No completed projects found matching the filters or search query.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalCompletedProjectPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <p className="text-[11px] text-muted-foreground">
                    Showing <span className="font-medium">{(completedPage - 1) * completedPerPage + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(completedPage * completedPerPage, filteredCompletedProjects.length)}</span> of{" "}
                    <span className="font-medium">{filteredCompletedProjects.length}</span> completed projects
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={completedPage === 1}
                      onClick={() => setCompletedPage(completedPage - 1)}
                      className="p-1.5 border border-border/40 rounded-lg bg-card/65 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-xs font-semibold text-foreground">
                      Page {completedPage} of {totalCompletedProjectPages}
                    </div>
                    <button
                      type="button"
                      disabled={completedPage === totalCompletedProjectPages}
                      onClick={() => setCompletedPage(completedPage + 1)}
                      className="p-1.5 border border-border/40 rounded-lg bg-card/65 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <GridCardFooter>
                <span>Source: PGCB project documents, cited per project on each card above</span>
                <span>
                  Each completed project is described as its source document states it;
                  the count is ours. Checked against PGCB&apos;s live completed-projects
                  list on 13 Aug 2026: <strong className="text-foreground">50 of these 51
                  appear on it, and none of theirs is missing here.</strong> The one
                  exception is the Western Grid Network Development Project (kfW,
                  completed June 2022), which PGCB&apos;s current list does not carry. It is
                  kept rather than dropped — a project finishing is not a reason to erase
                  it — but it stands on our record alone.
                </span>
                <span className="font-medium">Registry: Completed projects</span>
              </GridCardFooter>
            </div>
          )}

          {/* Sub-tab 5: National Grid Network Diagram */}
          {transSubTab === 'grid_net' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent border-primary/25 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0">
                      <Network className="h-6 w-6 animate-pulse" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">National Grid Network Diagram</h3>
                          <p className="text-sm text-muted-foreground">Schematic mapping of grid interconnectivity across Bangladesh</p>
                        </div>
                        <a
                          href="/pdf/national_grid_network.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start sm:self-center px-4 py-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    This official schematic diagram depicts the complete topology of the Bangladesh electricity transmission network, mapping the electrical connections between power generation stations, high-voltage transmission lines (400 kV, 230 kV, and 132 kV), and grid substations.
                  </p>

                  {/* Interactive Embed */}
                  <div className="w-full rounded-2xl overflow-hidden border border-border/40 bg-card/50 shadow-2xl relative mt-2 flex flex-col">
                    <iframe
                      src="/pdf/national_grid_network.pdf#toolbar=1&navpanes=0&scrollbar=1"
                      className="w-full h-[420px] sm:h-[650px] border-none"
                      title="National Grid Network Diagram"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Diagram Key &amp; Technical Footnote
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Line Voltages</strong>
                    Red lines represent 400 kV circuits; blue/amber lines show 230 kV and 132 kV circuits respectively.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Substation Nodes</strong>
                    Circles represent grid substations. Solid lines entering/leaving circles represent active bus bar feeders.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Asynchronous Interface</strong>
                    High-Voltage Direct Current (HVDC) station links at borders are represented as block interface icons.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Document Details</strong>
                    Published officially by PGCB (Power Grid Company of Bangladesh) System Operations &amp; Planning Division.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 5: Geographical Grid Map */}
          {transSubTab === 'geo_map' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-teal-500/5 via-primary/5 to-transparent border-teal-500/20 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-400 border border-teal-500/20 shrink-0">
                      <MapPin className="h-6 w-6 animate-pulse" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Geographical Grid Map</h3>
                          <p className="text-sm text-muted-foreground">Geographic layout and physical routing of national transmission lines</p>
                        </div>
                        <a
                          href="/pdf/geo_map.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start sm:self-center px-4 py-2 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl hover:bg-teal-500/20 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    This geographical map projects all high-voltage pylon paths and transmission line routing across the physical terrain of Bangladesh. It details grid line runs crossing major rivers (such as Padma and Jamuna) and the locations of substations relative to regional load centers.
                  </p>

                  {/* Interactive Embed */}
                  <div className="w-full rounded-2xl overflow-hidden border border-border/40 bg-card/50 shadow-2xl relative mt-2 flex flex-col">
                    <iframe
                      src="/pdf/geo_map.pdf#toolbar=1&navpanes=0&scrollbar=1"
                      className="w-full h-[420px] sm:h-[650px] border-none"
                      title="Geographical Grid Map"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-teal-400" /> Mapping &amp; Geography Footnote
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Physical Routing</strong>
                    Traces the geographical paths of pylons. Crucial for understanding regional grid vulnerability to natural hazards (e.g. floods, cyclones).
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">River Crossings</strong>
                    Includes details of special high-tension long-span river-crossing towers engineered across active delta rivers.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Scale Projection</strong>
                    Geospatial representations conform to official national grid system projections.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Data Sources</strong>
                    Sourced from PGCB Engineering and Survey Departments.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 6: OPGW Fiber Network Map */}
          {transSubTab === 'opgw_map' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-purple-500/5 via-primary/5 to-transparent border-purple-500/20 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20 shrink-0">
                      <Map className="h-6 w-6 animate-pulse" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">OPGW Fiber Network Map</h3>
                          <p className="text-sm text-muted-foreground">National Optical Ground Wire (OPGW) telecommunication backbone network</p>
                        </div>
                        <a
                          href="/pdf/opgw_map.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start sm:self-center px-4 py-2 text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Optical Ground Wire (OPGW) is a dual-functioning cable. It acts as a conventional shield wire at the top of transmission towers to protect lines from lightning strikes, while containing optical fibers used for PGCB's protection signaling, SCADA telemetry, and commercial telecommunication leases.
                  </p>

                  {/* Interactive Embed */}
                  <div className="w-full rounded-2xl overflow-hidden border border-border/40 bg-card/50 shadow-2xl relative mt-2 flex flex-col">
                    <iframe
                      src="/pdf/opgw_map.pdf#toolbar=1&navpanes=0&scrollbar=1"
                      className="w-full h-[420px] sm:h-[650px] border-none"
                      title="OPGW Fiber Network Map"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-purple-400" /> OPGW &amp; Telecom Footnote
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">OPGW (Optical Ground Wire)</strong>
                    A ground/shield wire containing optical fiber cores. Installed on pylon tops for dual lightning shielding and high-speed data transmission.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">SCADA &amp; Telemetry</strong>
                    Optic lines provide real-time connection from grid stations to the National Load Dispatch Center (NLDC) for remote data monitoring.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Commercial Leasing</strong>
                    PGCB leases spare fiber capacity (dark fiber cores) to telecom operators, ISP companies, and state agencies.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Planning Source</strong>
                    Published officially by PGCB Telecommunications Division.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 7: Optical Fiber Leasing */}
          {transSubTab === 'opgw_lease' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Introduction Card */}
              <div className="grid-explorer-chart-card card p-6 bg-gradient-to-r from-emerald-500/5 via-primary/5 to-transparent border-emerald-500/25 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <div className="space-y-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 shrink-0">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">Optical Fiber Leasing</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Power Grid Bangladesh PLC (Power Grid) is responsible to transmit high voltage power across the whole country. Previously Power Grid used earth wire/ground wire to protect the transmission line from thundering. Before 2008, Power Grid used analog PLC (Power Line Carriers) based technology for telecommunication, SCADA (Supervisory Control and Data Acquisition) and power transmission system protection. After 2008, Power Grid adopted new optical fiber based communication technology replacing the prevalent ground wire by modern OPGW (Optical Ground Wire) with modern digital communication system for reliable and faster telecommunication, SCADA and system protection.
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-emerald-500/40 pl-3">
                    Till June 2026, Power Grid has installed around 11,876 km of OPGW across the country along with its high voltage transmission lines. Besides Power Grid's own needs, the unused optical fibers are being leased out to local telecommunication operator according to approved lease rate and standard contract document with a view to developing national telecommunication infrastructure.
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Stats Summary Column */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Licensing & Networks */}
                  <div className="grid-explorer-chart-card card p-6">
                    <div className="grid-explorer-chart-card__head mb-4 border-b border-border/40 pb-3">
                      <Network className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <h4 className="font-bold text-foreground">Licensing &amp; Leasing Agreements</h4>
                        <p className="text-xs text-muted-foreground">National regulatory and partner allocations</p>
                      </div>
                    </div>
                    <ul className="space-y-3.5 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>
                          <strong>NTTN Licensing:</strong> Power Grid has obtained NOFTTN (Nationwide Optical Fiber Telecommunication Transmission Network) license in 2005 which was later transformed into NTTN (Nationwide Telecommunication Transmission Network) license in 2014.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>
                          <GridProvenanceTag kind="P" className="me-1" />
                          <strong>Partner Organizations:</strong> Total 10 (ten) organizations including other NTTN license holders and Mobile network operators are using Power Grid's OPGW-based optical fiber under leasing agreement.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>
                          <GridProvenanceTag kind="P" className="me-1" />
                          <strong>Capacity Leased:</strong> Total 22,611.66 KM (22,611.66 x 2=45,223.33 Core-km) of optical fiber core has been leased till June 2026.
                          <span className="block text-[10px] text-muted-foreground/80 mt-1">
                            Quoted as PGCB writes it, including the arithmetic: 22,611.66 &times; 2
                            is 45,223.32, not the 45,223.33 printed. The figure is left as
                            published rather than silently corrected.
                          </span>
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Backbone & Internet Capacity */}
                  <div className="grid-explorer-chart-card card p-6">
                    <div className="grid-explorer-chart-card__head mb-4 border-b border-border/40 pb-3">
                      <Globe className="h-5 w-5 text-emerald-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-foreground">Transmission Network &amp; Backbone Capacity</h4>
                        <p className="text-xs text-muted-foreground">Dhaka – Kuakata – Benapole route deployment stats</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-xs text-muted-foreground">
                      <p>
                        With the aim of delivering internet services to the people of the country through Power Grid's robust and highly available fiber network, Power Grid has established a data transmission network with <strong>9.6 / 13.2 Tbps</strong> backbone capacity (operational capacity: 800 Gbps) along the Dhaka–Kuakata–Benapole route.
                      </p>
                      <div className="p-3 bg-muted/10 border border-border/30 rounded-xl flex items-center justify-between">
                        <span>Leased Data Capacity (Dec 2025)</span>
                        <span className="font-bold text-foreground">200 Gbps <span className="text-[10px] text-muted-foreground font-normal">(To International Internet Gateway (IIG) operators)</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commercial Pricing Column */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Pricing Card */}
                  <div className="grid-explorer-chart-card card p-6 bg-gradient-to-b from-card to-emerald-500/5 border-emerald-500/20 flex flex-col justify-between min-h-[15rem]">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-foreground uppercase tracking-wider text-xs">Dark Fiber Lease Rate</h4>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Effective: 01.01.2026</span>
                        <div className="text-2xl font-black text-foreground tabular-nums flex items-baseline gap-1">
                          Tk. 5.40
                          <span className="text-xs font-normal text-muted-foreground">/ Core / Meter / Month</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                          Monthly Recurring Charge (MRC) including Tax &amp; excluding VAT.
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-border/40 pt-3 mt-4 text-[10px] text-emerald-500 font-semibold flex justify-between items-center">
                      <span>Annual Increment</span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-500">Tk. 0.20 / Year</span>
                    </div>
                  </div>

                  {/* Contacts details Card */}
                  <div className="grid-explorer-chart-card card p-6 space-y-4">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">OFCL Contact Details</h4>
                    <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                      <div>
                        <strong className="text-foreground block font-bold">Superintending Engineer</strong>
                        Optical Fiber Commercial Leasing (OFCL)
                      </div>
                      <div>
                        <strong className="text-foreground block font-bold">Office Address:</strong>
                        Level-10, Grid Bhaban, Avenue-3, Jahurul Islam City, Aftabnagar, Badda, Dhaka-1212.
                      </div>
                      <div className="border-t border-border/20 pt-2.5">
                        <strong className="text-foreground block font-bold">Email Query:</strong>
                        <a href="mailto:se.ofcl@pgcb.gov.bd" className="text-primary hover:underline font-semibold">se.ofcl@pgcb.gov.bd</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Glossary Footnote */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Jargon, translated
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-[10px] text-muted-foreground leading-relaxed">
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Core-km</strong>
                    Fibre length multiplied by how many strands run through it. 10 km of cable carrying 2 strands is 20 core-km.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Tbps / Gbps</strong>
                    Internet speed. 1 Tbps is a thousand times 1 Gbps — roughly the capacity of a national backbone versus a large office.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">NTTN / NTTN License</strong>
                    The licence that lets a company rent out long-distance fibre to phone and internet providers. PGCB holds one.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">Dark Optical Fiber</strong>
                    Spare fibre strands with no signal running through them. PGCB rents them out and the tenant lights them up with their own equipment.
                  </div>
                  <div>
                    <strong className="text-foreground block font-bold mb-0.5">SCADA / PLC</strong>
                    SCADA is the control-room system operators watch the grid through. PLC was the old way of sending those signals down the power lines themselves.
                  </div>
                </div>
              </div>

              <GridCardFooter>
                <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> — Optical Fiber Commercial Leasing</span>
                <span>
                  Fiber lengths, partner counts, backbone capacity and the lease rate are
                  quoted as PGCB publishes them. Nothing on this page is computed here.
                </span>
                <span className="font-medium">Stated as at: June 2026 &middot; rate effective 01.01.2026</span>
              </GridCardFooter>
            </div>
          )}
            </div>
          </div>
        </div>
        </GridLockedContent> )
      )}

      {!isDataMissing && activeTab === 'regional' && (
        selectedDate < '2013-12-31' ? (
          <div className="grid-explorer-panel space-y-6">
            <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
                <Info className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-2">Zone-wise Demand &amp; Load-Shedding Data</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                No official records are available for the selected date. Zone-wise demand and load-shedding tracking officially started on December 31, 2013.
              </p>
              <div className="mt-4 text-[10px] text-muted-foreground">
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
                        <td data-label="Evening demand" className="text-left tabular-nums font-medium">{formatNumber(rd.demand)}</td>
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
                                  className="h-full bg-amber-500 rounded"
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
                      <td data-label="Evening demand" className="text-left tabular-nums text-primary">{formatNumber(totalRegionalDemand)}</td>
                      <td data-label="Load-shedding" className="text-left tabular-nums text-destructive">{formatNumber(totalRegionalLoadShed)}</td>
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
                  <h3 className="grid-explorer-chart-card__title">NLDC Daily Outage Log<DailyBadge /></h3>
                  <p className="grid-explorer-chart-card__sub">Major event log of yesterday's grid outages • <span className="text-primary font-semibold text-xs">{coverageLabel('outages')}</span></p>
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
                  <div>
                    <h3 className="grid-explorer-chart-card__title">East-West Interconnector Transfer<DailyBadge /></h3>
                    <p className="grid-explorer-chart-card__sub">
                      Hourly flow across the three corridors joining the western and eastern grids
                      {ewicTotalMkwh != null ? (
                        <> • {ewicTotalMkwh.toFixed(2)} MKWh transferred <GridProvenanceTag kind="P" />
                          {ewicShareOfGen != null ? <> · {ewicShareOfGen.toFixed(1)}% of national generation <GridProvenanceTag kind="D" /></> : null}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="grid-explorer-chip">EWIC</span>
                </div>

                {/* The sheet's own footnote defines the sign, and the whole card
                    is unreadable without it — so it is stated, not buried. */}
                <p className="text-[11px] text-muted-foreground mb-3">
                  Positive MW is flow from <strong>West to East</strong>; negative is East to West.
                </p>

                <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={ewicChartData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                      {/* Whole hours only, thinned by measured gap — a 24-hour
                          axis has to survive a 393px screen without its labels
                          running into each other. */}
                      <XAxis
                        dataKey="time"
                        tick={axisTickStyle(chartTheme.axisTick)}
                        ticks={wholeHourTicks(ewicChartData.map((r) => String(r.time ?? '')))}
                        {...TIME_AXIS_PROPS}
                      />
                      <YAxis tick={{ fontSize: 11, fill: chartTheme.axisTick }} width={52} label={{ value: 'MW', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: chartTheme.axisTick } }} />
                      <GridRechartsTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="p-4 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs w-72 max-w-[calc(100vw-2rem)] select-none bg-card">
                              <div className="font-bold border-b border-border/40 pb-1.5 mb-2">{label}</div>
                              <div className="space-y-1.5">
                                {payload.map((s: { dataKey?: unknown; color?: string; name?: string; value?: number }) => (
                                  <div key={String(s.dataKey)} className="flex justify-between gap-3">
                                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: s.color }} />
                                      {s.name}
                                    </span>
                                    <span className="font-bold tabular-nums">{formatNumber(Math.round(Number(s.value)))} MW</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-border/30 text-[9px] text-muted-foreground italic">
                                Read from the report&apos;s EWIC sheet as published.
                              </div>
                            </div>
                          );
                        }}
                      />
                      {ewic.corridors.map((name, i) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={`c${i}`}
                          name={name}
                          stroke={chartTheme.categorical(i)}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                          isAnimationActive={false}
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend always present, in the same order as the lines, so a
                    corridor is never identified by colour alone. */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {ewic.corridors.map((name, i) => (
                    <span key={name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: chartTheme.categorical(i) }} />
                      {name}
                    </span>
                  ))}
                </div>

                {/* Per-circuit metered energy. Ranked, and labelled in place —
                    six bars do not need a second colour scale to be read. */}
                <div className="mt-5 pt-4 border-t border-border/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Metered energy by circuit <GridProvenanceTag kind="P" />
                  </h4>
                  <div className="space-y-1.5">
                    {ewicCircuitBars.map((c) => (
                      <div key={c.circuit} className="flex items-center gap-3 text-[11px]">
                        <span className="w-44 shrink-0 text-muted-foreground truncate">{c.circuit}</span>
                        <span className="flex-1 h-3 rounded-sm bg-muted/30 overflow-hidden">
                          <span className="block h-full rounded-sm" style={{ width: `${c.pct}%`, background: chartTheme.categorical(c.corridorIndex) }} />
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

          {/* Key Transmission Lines */}
          <div className="w-full">
            <div className="grid-explorer-chart-card card">
              <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                <Cable className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h3 className="grid-explorer-chart-card__title">Transmission Grid Assets</h3>
                    <p className="grid-explorer-chart-card__sub">Major transmission line parameters and load status — <span className="text-primary font-semibold text-xs">Tracked since 2014</span></p>
                </div>
              </div>
              <div className="grid-explorer-table-wrap">
                <table className="grid-explorer-table grid-explorer-table--stack">
                  <thead>
                    <tr>
                      <th>Line Asset</th>
                      <th>Owner</th>
                      <th>Capacity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/*
                      The "Load Status" column is gone: its 74/82/90% figures
                      were seeded, not published — no agency reports per-line
                      loading, so this table no longer shows any.
                    */}
                    {(initialLines ?? []).map((line: any, idx: number) => (
                      <tr key={idx}>
                        <td className="font-semibold">{line.name}</td>
                        <td data-label="Owner">{line.owner}</td>
                        <td data-label="Capacity" className="tabular-nums font-medium">{line.capacity}</td>
                        <td data-label="Status" className="text-xs text-muted-foreground">{line.status}</td>
                      </tr>
                    ))}
                    {(initialLines ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                          No transmission line records are loaded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                PGCB publishes no per-line load telemetry, so none is shown here.
              </div>

              {/* Card Metadata Footer */}
              <GridCardFooter>
                <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Grid Bangladesh PLC</a> &mdash; transmission line register (standing, not a daily file)</span>
                <span className="font-medium">Line records as supplied to this page</span>
              </GridCardFooter>
            </div>
          </div>
        </div>
        </GridLockedContent> )
      )}

      {!isDataMissing && activeTab === 'macro' && (() => {
        const allowedYears = gridAccess.isStaff || gridAccess.tier === 'plan_999' ? null : (gridAccess.isMember || gridAccess.tier === 'plan_499' ? 5 : 2);
        const isTruncated = allowedYears !== null;
        
        const truncate = <T extends readonly any[]>(arr: T, itemsPerYear: number = 1): T => {
          if (!isTruncated) return arr;
          return arr.slice(-(allowedYears * itemsPerYear)) as unknown as T;
        };

        const localPgcbMonthlyData = truncate(pgcbMonthlyData, 12);
        const localMacroEconomicData = truncate(macroEconomicData, 1);
        const localBpdbAuditedFinancials = truncate(bpdbAuditedFinancials, 1);
        const localMacroTariffData = truncate(macroTariffData, 1);
        const localMacroGasData = truncate(macroGasData, 1);
        const localPetrobanglaAuditedFinancials = truncate(petrobanglaAuditedFinancials, 1);
        const localGlobalVsDomesticData = truncate(globalVsDomesticData, 1);
        const localHistoricalExchangeRates = historicalExchangeRates;
        const localMacroInfrastructureData = truncate(macroInfrastructureData, 1);
        const budgetLimit = allowedYears === 5 ? 6 : 5;
        const localNationalBudgetMergedData = isTruncated ? nationalBudgetMergedData.slice(-budgetLimit) : nationalBudgetMergedData;
        const allowedYearsSystemLoss = gridAccess.isStaff || gridAccess.tier === 'plan_999' ? null : 5;
        const localSystemLossData = allowedYearsSystemLoss === null ? systemLossData : systemLossData.slice(0, allowedYearsSystemLoss);
        const glanceIndicators = [
          {
            label: "Installed Capacity",
            value: "33,092 MW",
            desc: "Includes captive & renewable energy",
            Icon: Zap,
            iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            tooltipTitle: "Official Installed Grid Capacity",
            tooltipDesc: "Total utility-scale grid-connected capacity monitored by BPDB is 26,300 MW, supplemented by 3,500 MW captive industrial plants and 3,292 MW of renewable capacity (including off-grid solar home systems and grid-tied solar).",
            highlightLabel: "Grid-Tied vs. Off-Grid:",
            highlightValue: "85% Utility-Scale"
          },
          {
            label: "Peak Generation",
            value: "17,201 MW",
            valueColor: "text-primary",
            desc: "Recorded on May 20, 2026",
            Icon: Activity,
            iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
            tooltipTitle: "National Grid Peak Load Record",
            tooltipDesc: "Verified maximum instantaneous active power generation delivered by public & private generators to the national grid during the summer peak load window. Monitored by PGCB's National Load Despatch Centre (NLDC).",
            highlightLabel: "SCADA Verified Peak:",
            highlightValue: "17,201 MW"
          },
          {
            label: "Active Power Plants",
            value: "137 Plants",
            desc: "0 retired/expired plants",
            Icon: Landmark,
            iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            tooltipTitle: "BPDB Contracted Power Plants",
            tooltipDesc: "Official count of grid-tied power stations under active Power Purchase Agreements (PPA) with the BPDB. Comprises 62 public units, 66 Independent Power Producers (IPPs), and 9 Rental/Quick Rental units.",
            highlightLabel: "PPA Active Units:",
            highlightValue: "137 Operational"
          },
          {
            label: "Import Capacity",
            value: "2,696 MW",
            desc: "Cross-border grid connection",
            Icon: Globe,
            iconColor: "text-sky-500 bg-sky-500/10 border-sky-500/20",
            tooltipTitle: "Cross-Border Interconnection",
            tooltipDesc: "Consolidated importing capability via cross-border transmission networks. Includes Bheramara HVDC (1,000 MW), Adani Power Godda link (1,496 MW), and Tripura radial link (200 MW).",
            highlightLabel: "HVDC Interconnectors:",
            highlightValue: "2 Active Links"
          },
          {
            label: "Transmission Lines",
            value: "18,152 ckt km",
            desc: "High-voltage grid network",
            Icon: Cable,
            iconColor: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
            tooltipTitle: "PGCB Transmission Network Asset",
            tooltipDesc: "Consolidated circuit kilometers of high-voltage transmission lines operated exclusively by PGCB: 400kV lines (approx. 2,100 ckt km), 230kV lines (approx. 4,300 ckt km), and 132kV lines (approx. 11,752 ckt km).",
            highlightLabel: "National Grid Backbone:",
            highlightValue: "100% PGCB Managed"
          },
          {
            label: "Substation Capacity",
            value: "91,242 MVA",
            desc: "Grid substation network",
            Icon: BarChart3,
            iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
            tooltipTitle: "Grid Transformation Capacity",
            tooltipDesc: "Total installed transformer capacity across PGCB transmission grid substations. Includes 400kV, 230kV, and 132kV primary transformer ratings measured in Megavolt-Amperes (MVA).",
            highlightLabel: "PGCB Transformer Assets:",
            highlightValue: "91,242 MVA"
          },
          {
            label: "Distribution Lines",
            value: "658,563 km",
            desc: "Electrified lines (May 2026)",
            Icon: Network,
            iconColor: "text-violet-500 bg-violet-500/10 border-violet-500/20",
            tooltipTitle: "Distribution Network Grid Length",
            tooltipDesc: "Aggregated distribution line lengths (33kV, 11kV, and 0.4kV networks) operated by utilities. The Bangladesh Rural Electrification Board (BREB) holds the largest share with over 530,000 km of lines.",
            highlightLabel: "BREB Share:",
            highlightValue: "80.5% of Lines"
          },
          {
            label: "Consumer Base",
            value: "49.94 Million",
            desc: "49,941,000 links (May 2026)",
            Icon: Database,
            iconColor: "text-teal-500 bg-teal-500/10 border-teal-500/20",
            tooltipTitle: "Official Registered Accounts",
            tooltipDesc: "Aggregated live electricity meters across all six distribution utilities. The consumer base grew by 8.4% annually, driven by rural grid expansion under the 'Electricity for All' initiative.",
            highlightLabel: "Active Connections:",
            highlightValue: "49,941,000 Accounts"
          },
          {
            label: "Electricity Access",
            value: "100.0%",
            desc: "Share of population connected",
            Icon: Sun,
            iconColor: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
            tooltipTitle: "National Electrification Ratio",
            tooltipDesc: "Official government declaration certifying universal electricity access. Accomplished through grid extensions by BREB and off-grid Solar Home Systems (SHS) deployed by IDCOL in remote island regions.",
            highlightLabel: "Off-Grid Solar Coverage:",
            highlightValue: "8% of Population"
          },
          {
            label: "Per Capita Gen.",
            value: "661 kWh",
            desc: "FY 2024-25, inc. captive & RE",
            Icon: TrendingUp,
            iconColor: "text-orange-500 bg-orange-500/10 border-orange-500/20",
            tooltipTitle: "Annual Per Capita Energy Metric",
            tooltipDesc: "Calculated by dividing total annual gross generation (including captive industrial and renewable generation) by the national population estimate, serving as a primary indicator of economic productivity.",
            highlightLabel: "FY 2024-25 Actual:",
            highlightValue: "661 kWh / person"
          },
          {
            label: "Irrigation Pumps",
            value: "498,000",
            desc: "Agriculture connections",
            Icon: Droplet,
            iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
            tooltipTitle: "Agricultural Grid Connections",
            tooltipDesc: "Dedicated power connections for seasonal crop watering (Boro season). Monitored under agricultural tariff subsidies to ensure food security. Peak demand occurs from February to April.",
            highlightLabel: "Peak Agricultural Load:",
            highlightValue: "Demands up to 2,500 MW"
          },
          {
            label: "ADP Allocation",
            value: "18,409.52 Cr",
            desc: "FY 2025-26 budget",
            Icon: DollarSign,
            iconColor: "text-lime-600 dark:text-lime-400 bg-lime-500/10 border-lime-500/20",
            tooltipTitle: "National Development Budget",
            tooltipDesc: "Capital expenditure allocation under the Annual Development Programme (ADP) specifically earmarked for the Power Division. Funded by government resources and foreign development partners (JICA, ADB, WB).",
            highlightLabel: "ADP Earmark:",
            highlightValue: "18,409.52 Crore BDT"
          }
        ];
        
        const visibleMonths = isTruncated ? allowedYears * 12 : pgcbMonthlyData.length;
        const hiddenPercentage = Math.max(0, Math.round((1 - (visibleMonths / Math.max(pgcbMonthlyData.length, visibleMonths))) * 100));
        
        const activeAllowedYears = macroSubTab === 'system_loss' ? 5 : allowedYears;
        const totalItemsCount = macroSubTab === 'system_loss' ? systemLossData.length : pgcbMonthlyData.length;
        const visibleItemsCount = macroSubTab === 'system_loss' ? 5 : (isTruncated ? allowedYears * 12 : pgcbMonthlyData.length);
        const activeHiddenPercentage = Math.max(0, Math.round((1 - (visibleItemsCount / Math.max(totalItemsCount, visibleItemsCount))) * 100));

        return (
        <div className="grid-explorer-panel space-y-6">
          {isTruncated && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-start gap-3">
                <History className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-500">Historical Preview Mode</h4>
                  <p className="text-[11.5px] text-muted-foreground mt-1">
                    You are viewing a {activeAllowedYears}-year preview of the macro trends. {gridAccess.isMember ? 'Upgrade your plan' : 'Subscribe'} to unlock the full historical backlog (you are missing {activeHiddenPercentage}% of the data spanning 15+ years).
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Sub-tab Navigation */}
          <div id="macro-subtabs-nav" className="flex flex-wrap gap-1.5 border-b border-border/40 pb-3">
            {[
              { id: 'overview', label: 'Macro Overview', icon: BarChart3 },
              { id: 'budget', label: 'National Budget & Infra', icon: Landmark },
              { id: 'monthly', label: 'PGCB Monthly Archives', icon: FileText },
              { id: 'pricing', label: 'Pricing & Drivers', icon: TrendingUp },
              { id: 'global', label: 'Global vs. Domestic', icon: Globe },
              { id: 'reports', label: 'Annual Reports', icon: FileText },
              { id: 'reserves', label: 'Gas Reserve Depletion', icon: Database },
              { id: 'system_loss', label: 'Sector Glance & Losses', icon: Activity },
              { id: 'insights', label: 'Analyst & Investor Insights', icon: DollarSign },
              { id: 'verification', label: 'Published vs Derived', icon: ShieldCheck }
            ].map((t) => {
              const SubIcon = t.icon;
              const active = macroSubTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSubTabClick(t.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-150",
                    active
                      ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                      : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <SubIcon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/*
            One key for the whole Macro Trends section. These tabs are annual and
            multi-year series rather than daily readings, so the thing a reader
            most needs to know is which agency stated a figure and which numbers
            we worked out from theirs.
          */}
          {macroSubTab !== 'verification' && (
            <div className="p-3.5 rounded-2xl bg-muted/10 border border-border/30 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
              <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">What P and D mean here.</strong>{' '}
                <GridProvenanceTag kind="P" /> is a figure stated in an official
                publication and reproduced unchanged — from any government body, not
                only the energy agencies: Ministry of Finance budget lines, Power Cell
                loss statistics, BERC tariff orders, BPC fuel prices, Bangladesh Bank
                exchange rates, SREDA registries, alongside PGCB, Petrobangla and BPDB.{' '}
                <GridProvenanceTag kind="D" /> is one worked out from those: a gap
                between two published figures, a share of a total, a currency
                conversion.{' '}
                <strong className="text-foreground">One exception worth knowing:</strong>{' '}
                on Global vs. Domestic the world benchmark series come from
                international bodies and commodity indexes — the World Bank, OPEC, IRENA
                and the JKM gas index — rather than from any government. They are marked
                P because they are published rather than calculated here, but they are
                not Bangladeshi official statistics and are not verified by one.
                These are <strong className="text-foreground">annual and multi-year
                series</strong>, not daily readings, so they carry the period their
                source covers and do not move with the date selected above.
              </span>
            </div>
          )}

          {/* Sub-tab: National Budget */}
          {macroSubTab === 'budget' && (
            <div className="space-y-6 grid-explorer-subpanel">
              
              {/* National Budget & Infrastructure Growth */}
              <div className="grid-explorer-chart-card card">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <Landmark className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">National Budget vs Capacity &amp; Peak Generation</h3>
                    <p className="grid-explorer-chart-card__sub">Power sector fiscal allocation (Crore Tk) plotted against installed capacity and peak generation (MW) — <span className="text-primary font-semibold text-xs">Tracked since 2011</span></p>
                  </div>
                  <span className="grid-explorer-chip bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ml-auto">FY 2011 - 2027</span>
                </div>

                <GridChartFrame
                  className="mt-4"
                  legend={[
                    { id: 'budget', label: 'Power Budget (Cr Tk)', color: '#a855f7', variant: 'bar' },
                    { id: 'cap', label: 'Installed Cap. (MW)', color: '#06b6d4', variant: 'line' },
                    { id: 'peak', label: 'Peak Gen. (MW)', color: '#f97316', variant: 'line' },
                  ]}
                >
                  <ComposedChart
                    accessibilityLayer={false}
                    data={localNationalBudgetMergedData}
                    margin={GRID_CHART_MARGIN.dualAxis}
                    barCategoryGap="18%"
                  >
                        <defs>
                          <linearGradient id="budget-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="fiscal_year"
                          tick={gridChartAxisTick(chartTheme)}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                          minTickGap={14}
                          padding={GRID_X_AXIS_PADDING}
                        />
                        <YAxis
                          yAxisId="left"
                          width={GRID_Y_AXIS_WIDTH.splitUnitDual}
                          tick={gridChartSplitUnitTick(chartTheme, 'Cr')}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={6}
                          domain={[0, 'auto']}
                          allowDecimals={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          width={GRID_Y_AXIS_WIDTH.splitUnitDual}
                          tick={gridChartSplitUnitTick(chartTheme, 'MW')}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={6}
                          domain={[0, 'auto']}
                          allowDecimals={false}
                        />
                        
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 select-none bg-card">
                                <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-3 flex items-center justify-between gap-2">
                                  <span>{d.fiscal_year} Financials</span>
                                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />{d.percentage}% of Budget</span>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fiscal Allocation</div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-[#a855f7] inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Power &amp; Energy Budget:</span>
                                      <span className="font-bold text-[#a855f7]">{d.power_energy_allocation_crore_tk} Cr Tk</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-1">
                                      <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Total National Budget:</span>
                                      <span className="font-bold text-foreground">{d.total_budget_crore_tk} Cr Tk</span>
                                    </div>
                                  </div>
                                  <div className="border-t border-border/40 pt-3">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Grid Infrastructure</div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Installed Capacity:</span>
                                      <span className="font-bold text-[#06b6d4]">{d.installed_capacity_mw} MW</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-1">
                                      <span>Peak Generation:</span>
                                      <span className="font-bold text-[#f97316]">{d.peak_generation_mw} MW</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar yAxisId="left" dataKey="power_energy_allocation_crore_tk" name="Power Budget (Cr Tk)" fill="url(#budget-grad)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                        <Line yAxisId="right" type="monotone" dataKey="installed_capacity_mw" name="Installed Cap. (MW)" stroke="#06b6d4" strokeWidth={2.5} dot={{ stroke: '#06b6d4', strokeWidth: 2, fill: '#ffffff', r: 3.5 }} activeDot={{ r: 5 }} />
                        <Line yAxisId="right" type="monotone" dataKey="peak_generation_mw" name="Peak Gen. (MW)" stroke="#f97316" strokeWidth={2.5} dot={{ stroke: '#f97316', strokeWidth: 2, fill: '#ffffff', r: 3.5 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </GridChartFrame>
                
                <div className="grid-explorer-chart-note bg-muted/10 p-4 text-xs text-muted-foreground space-y-2">
                  <p><strong>What is being shown?</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-[#a855f7]">Power Sector Budget (Crore Tk):</strong> The total fiscal allocation dedicated specifically to the Ministry of Power, Energy and Mineral Resources each fiscal year.</li>
                    <li><strong className="text-[#06b6d4]">Installed Capacity</strong> vs <strong className="text-[#f97316]">Peak Generation (MW)</strong>: The physical manifestation of those budgets—showing how much total capacity was built versus how much was actually utilized during peak hours.</li>
                  </ul>
                  <p className="mt-2 pt-2 border-t border-border/30">
                    <strong>Analytical Insight:</strong> While fiscal allocation to the power sector has historically risen, the proposed FY2026-27 budget allocation dropped sharply to 17,345 Crore Tk (~1.85% of total national budget). This contraction signals a major policy pivot: the government is shifting focus away from massive capacity expansions to reviewing existing power purchase agreements (PPAs), reducing subsidies, and eliminating high capacity payments for underutilized plants.
                  </p>
                </div>

                {/* Card Metadata Footer */}
                <GridCardFooter>
                  <span>Source: <a href="https://www.mof.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Ministry of Finance</a> &amp; <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Reports</a></span>
                  <span>
                    Every figure here is published — budget allocations and their share of
                    the national budget by the Ministry of Finance, capacity and peak
                    generation by BPDB. Nothing on this chart is computed by us; the two
                    series are simply drawn on one pair of axes so the fiscal and physical
                    build-out can be read together. Not independently audited.
                  </span>
                  <span className="font-medium">Data compiled from FY 2010-11 to FY 2026-27</span>
                </GridCardFooter>
              </div>

              {/* Historical Pricing Analysis Section (Moved from Gen tab) */}
              <div className="grid-explorer-chart-card card">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Historical Pricing &amp; Tariff Comparison</h3>
                    <p className="grid-explorer-chart-card__sub">Analyze the exact BPDB weighted average bulk tariff vs average generation &amp; procurement cost — <span className="text-primary font-semibold text-xs">Tracked since 2010</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60 text-xs bg-muted/10 border border-border/40 mx-4 mt-4 mb-2 rounded-xl shadow-sm overflow-visible">
                  {[
                    {
                      Icon: Zap,
                      iconColor: "text-primary",
                      label: "Current Bulk:",
                      value: `${localMacroTariffData[localMacroTariffData.length - 1].tariff.toFixed(2)} Tk/KWh`,
                      valueColor: "text-primary",
                      tooltipTitle: "BERC Approved",
                      tooltipDesc: "The latest official wholesale bulk tariff set by the Bangladesh Energy Regulatory Commission (BERC) for utility distribution.",
                      highlightLabel: "Official Rate",
                      highlightValue: `${localMacroTariffData[localMacroTariffData.length - 1].tariff.toFixed(2)} Tk/KWh`,
                      highlightStyles: "bg-primary/10 text-primary border-primary/20",
                      roundedClasses: "rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none"
                    },
                    {
                      Icon: History,
                      iconColor: "text-orange-500",
                      label: "2010 Baseline:",
                      value: `${localMacroTariffData[0].tariff.toFixed(2)} Tk/KWh`,
                      valueColor: "text-orange-600 dark:text-orange-400",
                      tooltipTitle: "Historical Anchor",
                      tooltipDesc: "The earliest recorded BERC bulk tariff in our dataset, establishing the historical cost baseline from March 2010.",
                      highlightLabel: "Initial Rate",
                      highlightValue: `${localMacroTariffData[0].tariff.toFixed(2)} Tk/KWh`,
                      highlightStyles: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
                      roundedClasses: ""
                    },
                    {
                      Icon: TrendingUp,
                      iconColor: "text-destructive",
                      label: "True Gen Cost:",
                      value: `${formatUnitRate(systemStats.avgProductionCost)} Tk/KWh`,
                      valueColor: "text-foreground",
                      tooltipTitle: "Real Production Cost",
                      tooltipDesc: "BPDB's current blended per-unit generation and procurement cost, factoring in fuel prices and IPP capacity payments.",
                      highlightLabel: "Tariff Deficit",
                      highlightValue: `${(systemStats.avgProductionCost - localMacroTariffData[localMacroTariffData.length - 1].tariff).toFixed(2)} Tk Gap`,
                      highlightStyles: "bg-destructive/10 text-destructive border-destructive/20",
                      roundedClasses: "rounded-b-xl sm:rounded-r-xl sm:rounded-bl-none"
                    }
                  ].map((stat, idx) => (
                    <div key={idx} className={`flex items-center justify-center gap-2 cursor-help group relative px-4 py-3.5 hover:bg-muted/20 transition-colors duration-200 ${stat.roundedClasses}`}>
                      <stat.Icon className={`h-4 w-4 ${stat.iconColor} transition-colors duration-200 group-hover:opacity-90`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors duration-200 leading-none mt-0.5">
                        {stat.label}
                      </span>
                      <div className="text-primary font-semibold text-xs mt-0.5 select-none">Tracked since 2010</div>
                      <span className={`font-bold leading-none mt-0.5 ${stat.valueColor}`}>
                        {stat.value}
                      </span>
                      
                      {/* Custom Tooltip */}
                      <div 
                        className="absolute text-card-foreground border border-border/80 p-4 md:p-5 rounded-2xl shadow-2xl z-[110] w-[17.5rem] md:w-80 left-1/2 -translate-x-1/2 top-[calc(100%+12px)] pointer-events-none bg-card transition-all duration-200 ease-out opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
                        style={{ backgroundColor: 'hsl(var(--card))' }}
                      >
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-t border-l border-border/80 z-[-1]" style={{ backgroundColor: 'hsl(var(--card))' }} />
                        <div className={`font-bold text-xs uppercase tracking-wider ${stat.iconColor} border-b border-border/60 pb-1.5 mb-2 flex items-center gap-1.5 text-left`}>
                          <stat.Icon className="h-3.5 w-3.5" /> {stat.tooltipTitle}
                        </div>
                        <div className="text-[11px] leading-relaxed text-muted-foreground font-medium whitespace-normal text-left">
                          {stat.tooltipDesc}
                          <div className={`mt-3 p-2.5 rounded-lg font-semibold border flex justify-between items-center ${stat.highlightStyles}`}>
                            <span>{stat.highlightLabel}</span>
                            <span className="text-xs">{stat.highlightValue}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <GridChartFrame
                  className="mt-4"
                  legend={[
                    { id: 'tariff', label: 'Bulk Tariff (Tk/kWh)', color: chartTheme.primary, variant: 'bar' },
                    { id: 'cost', label: 'BPDB Gen. Cost (Tk/kWh)', color: chartTheme.destructive, variant: 'line' },
                  ]}
                >
                  <ComposedChart accessibilityLayer={false} data={localMacroTariffData} margin={GRID_CHART_MARGIN.legend} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="year"
                          tick={gridChartAxisTick(chartTheme)}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                          minTickGap={16}
                          padding={GRID_X_AXIS_PADDING}
                        />
                        <YAxis
                          width={GRID_Y_AXIS_WIDTH.single}
                          tick={gridChartAxisTick(chartTheme)}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={4}
                          tickFormatter={(v) => `${v} Tk`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            const deficit = (d.cost - d.tariff).toFixed(2);
                            return (
                              <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-80 select-none bg-card">
                                <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                  <span>{d.year} Financials</span>
                                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Deficit Gap</span>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between flex-col mb-2">
                                    <span className="text-muted-foreground font-semibold">Approved Bulk Tariff (BPDB to Utilities):</span>
                                    <span className="font-bold text-foreground mt-0.5">{d.tariff.toFixed(2)} Tk/KWh</span>
                                  </div>
                                  <div className="flex justify-between flex-col mb-2">
                                    <span className="text-muted-foreground font-semibold">Total Generation &amp; Procurement Cost:</span>
                                    <span className="font-bold text-foreground mt-0.5">{d.cost.toFixed(2)} Tk/KWh</span>
                                  </div>
                                  <div className="flex justify-between border-t border-border/30 pt-2 mt-2">
                                    <span className="text-destructive font-semibold">BPDB Unit Deficit / Subsidy Reqd:</span>
                                    <span className="font-bold text-destructive">{deficit} Tk/KWh</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="tariff" name="Bulk Tariff (Tk/kWh)" fill={chartTheme.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
                        <Line type="monotone" dataKey="cost" name="BPDB Gen. Cost (Tk/kWh)" stroke={chartTheme.destructive} strokeWidth={2.5} dot={{ fill: chartTheme.destructive, r: 3.5 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </GridChartFrame>
                <div className="grid-explorer-chart-note bg-muted/10 p-4 text-xs text-muted-foreground space-y-2">
                  <p><strong>What is being shown?</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-destructive">BPDB Generation &amp; Procurement Cost:</strong> The actual per-unit (kWh) cost incurred by BPDB. This includes the cost of fuel (gas, coal, HFO, LNG), cross-border electricity imports, operational/maintenance costs, and <strong>capacity charges</strong> paid to Independent Power Producers (IPPs) and Rental plants.</li>
                    <li><strong className="text-primary">Weighted Avg Bulk Tariff:</strong> The BERC-approved wholesale rate at which BPDB sells this electricity to distribution companies like DPDC, DESCO, REB, NESCO, and WZPDCL.</li>
                  </ul>
                  <p className="mt-2 pt-2 border-t border-border/30 font-medium">
                    <strong>Analytical Insight:</strong> The gap between the average generation cost and the bulk wholesale tariff represents a structural deficit. Because BPDB sells power at a wholesale loss, this per-unit deficit must be directly subsidized by the Ministry of Finance to keep retail consumer prices lower. This widening deficit is unsustainable, placing a massive subsidy burden (estimated at 35k-40k Crore BDT annually) on the national treasury, highlighting that wholesale tariffs must either rise or the grid must phase out expensive IPP capacity charges to regain financial viability.
                  </p>
                </div>

                {/* Card Metadata Footer */}
                <GridCardFooter>
                  <span>Source: <a href="https://www.berc.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BERC Tariff Orders</a> &amp; <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Reports</a></span>
                  <span>As published. Not independently audited.</span>
                  <span className="font-medium">Reporting Period: FY 2010 - FY 2024</span>
                </GridCardFooter>
              </div>

              {/* Comprehensive Macro-Economic Study */}
              <div className="mt-8">
                <LongitudinalStudyCharts chartTheme={chartTheme} isTruncated={isTruncated} allowedYears={allowedYears} />
              </div>
            </div>
          )}

          {/* Sub-tab 1: Macro Overview */}
          {macroSubTab === 'overview' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Wholesale Tariff vs. Unit Production Cost */}
                <div className="grid-explorer-chart-card card">
                  <div className="grid-explorer-chart-card__head">
                    <div>
                      <h3 className="grid-explorer-chart-card__title">Wholesale Tariff vs. Unit Production Cost</h3>
                    <p className="grid-explorer-chart-card__sub">Audit history showing growing BPDB cost gap (Tk/KWh) — <span className="text-primary font-semibold text-xs">Tracked since 2010</span></p>
                    </div>
                    <span className="grid-explorer-chip">Bulk Tariff Gap</span>
                  </div>

                  <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                    {macroChartsReady ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart accessibilityLayer={false} data={localMacroTariffData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                          <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                          <XAxis {...gridChartXAxisProps(chartTheme)} tick={{ fontSize: 11, fill: chartTheme.axisTick, dy: 4 }} />
                          <YAxis {...gridChartYAxisProps(chartTheme, { tickFormatter: (v) => `${v} Tk` })} tick={{ fontSize: 11, fill: chartTheme.axisTick }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              const deficit = (d.cost - d.tariff).toFixed(2);
                              return (
                                <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                  <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                    <span>{d.year} Financials</span>
                                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Deficit Gap</span>
                                  </div>
                                  <div className="space-y-2 text-[11px] md:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Wholesale Bulk Tariff:</span>
                                      <span className="font-bold text-foreground">{d.tariff.toFixed(2)} Tk/KWh</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Unit Production Cost:</span>
                                      <span className="font-bold text-foreground">{d.cost.toFixed(2)} Tk/KWh</span>
                                    </div>
                                    <div className="flex justify-between border-t border-border/30 pt-1">
                                      <span className="text-destructive font-semibold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Unit Deficit:</span>
                                      <span className="font-bold text-destructive">{deficit} Tk/KWh</span>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                                    Calculation: Unit Deficit = Average Production Cost − Bulk Wholesale Tariff
                                  </div>
                                  <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                                    <div><strong>Source:</strong> <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BPDB Annual Audits</a> &amp; BERC Notifications</div>
                                    <div>As published. Not independently audited.</div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <GridRechartsLegend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="tariff" name="Bulk Wholesale Tariff" fill={chartTheme.primary} radius={[4, 4, 0, 0]} maxBarSize={30} />
                          <Line dataKey="cost" name="Average Generation Cost" stroke={chartTheme.destructive} strokeWidth={3} dot={{ fill: chartTheme.destructive, r: 4 }} activeDot={{ r: 6 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="grid-explorer-skeleton" />
                    )}
                  </div>

                  {/* Card Explanation Block */}
                  <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
                    <p><strong>What is being shown?</strong></p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-primary">Bulk Wholesale Tariff:</strong> The BERC-approved rate at which BPDB sells power to distribution utilities (DESCO, DPDC, etc.).</li>
                      <li><strong className="text-destructive">Average Generation Cost:</strong> The total blended per-unit generation and procurement cost, including capacity charges.</li>
                    </ul>
                    <p className="mt-2 pt-2 border-t border-border/30">
                      <strong>Analytical Insight:</strong> The widening gap between bulk tariff and actual production cost has resulted in massive structural deficits for BPDB. This trend is highly unsustainable and highlights the critical need to either rationalize power purchase costs (by phasing out liquid fuel plants) or adjust wholesale tariffs to reduce the fiscal subsidy burden on the government.
                    </p>
                  </div>

                  {/* Card Metadata Footer */}
                  <GridCardFooter>
                    <span>Source: <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Accounts &amp; Audit Reports</a></span>
                    <span>
                      Both the tariff and the unit cost are BPDB&apos;s own published
                      figures. The deficit between them is ours — a subtraction, shown
                      so the gap can be read directly rather than eyeballed off the
                      two lines. Not independently audited.
                    </span>
                    <span className="font-medium">Reporting Period: FY 2020 - FY 2026 Financial Audits</span>
                  </GridCardFooter>
                </div>

                {/* LNG Dependency Area Chart */}
                <div className="grid-explorer-chart-card card">
                  <div className="grid-explorer-chart-card__head">
                    <div>
                      <h3 className="grid-explorer-chart-card__title">Gas Supply Transition: Domestic vs. Imported LNG</h3>
                    <p className="grid-explorer-chart-card__sub">Historical shift towards imported liquefied natural gas (MMCFD) — <span className="text-primary font-semibold text-xs">Tracked since 2000</span></p>
                    </div>
                    <span className="grid-explorer-chip">LNG Reliance</span>
                  </div>

                  {macroChartsReady ? (
                  <GridChartFrame
                    className="mt-4"
                    legend={[
                      { id: 'domestic', label: 'Domestic gas', color: '#0ea5e9', variant: 'area' },
                      { id: 'lng', label: 'Imported LNG', color: '#a855f7', variant: 'area' },
                    ]}
                  >
                    <ComposedChart accessibilityLayer={false} data={localMacroGasData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                          <XAxis {...gridChartXAxisProps(chartTheme)} tick={{ fontSize: 11, fill: chartTheme.axisTick, dy: 4 }} />
                          <YAxis
                            {...gridChartYAxisProps(chartTheme, {
                              splitUnit: 'MMCFD',
                              domain: [0, 'auto'],
                              width: GRID_Y_AXIS_WIDTH.splitUnit,
                            })}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              const total = d.domestic + d.lng;
                              const domesticPct = total > 0 ? ((d.domestic / total) * 100).toFixed(1) : '0';
                              const lngPct = total > 0 ? ((d.lng / total) * 100).toFixed(1) : '0';
                              return (
                                <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                  <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                    <span>Gas Supply {d.year}</span>
                                    <span className="text-[9px] uppercase font-bold text-purple-500 tracking-wider">LNG Reliance</span>
                                  </div>
                                  <div className="space-y-2 text-[11px] md:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Domestic Fields:</span>
                                      <span className="font-bold text-foreground">{d.domestic} MMCFD <span className="text-muted-foreground font-normal">({domesticPct}% D)</span></span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Imported LNG (R-LNG):</span>
                                      <span className="font-bold text-foreground">{d.lng} MMCFD <span className="text-muted-foreground font-normal">({lngPct}% D)</span></span>
                                    </div>
                                    <div className="flex justify-between border-t border-border/30 pt-1">
                                      <span className="text-primary font-bold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Total Grid Supply:</span>
                                      <span className="font-bold text-primary">{total} MMCFD</span>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                                    Calculation: LNG Reliance % = (LNG / Total Supply) * 100
                                  </div>
                                  <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                                    <div><strong>Source:</strong> <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Petrobangla Annual Reports</a></div>
                                    <div>As published. Not independently audited.</div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Area type="monotone" dataKey="domestic" name="Domestic Gas (MMCFD)" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.22} strokeWidth={2} legendType="none" />
                          <Area type="monotone" dataKey="lng" name="Imported LNG (MMCFD)" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.28} strokeWidth={2} legendType="none" />
                        </ComposedChart>
                  </GridChartFrame>
                  ) : (
                    <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                      <div className="grid-explorer-skeleton" />
                    </div>
                  )}

                  {/* Card Explanation Block */}
                  <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
                    <p><strong>What is being shown?</strong></p>
                    <p className="leading-relaxed">This chart shows the volume (MMCFD) of natural gas supplied to the grid from local fields versus imported Liquefied Natural Gas (LNG) since 2018.</p>
                    <p className="leading-relaxed"><strong>Analytical Insight:</strong> The visual depicts a major structural dependency shift: domestic gas production is stagnant or declining, while imported LNG share is rising to meet energy demand. Because imported LNG is purchased at volatile global spot prices (linked to Brent oil and Platts JKM), this shift directly exposes Bangladesh's power generation costs to global commodity shocks and foreign exchange reserves pressure.</p>
                  </div>

                  {/* Card Metadata Footer */}
                  <GridCardFooter>
                    <span>Source: <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Petrobangla Audited Balance Sheets &amp; Daily MIS Reports</a></span>
                    <span>
                      Domestic and LNG volumes are Petrobangla&apos;s. The total and the two
                      share percentages are ours, summed and divided from those volumes.
                      Not independently audited.
                    </span>
                    <span className="font-medium">Reporting Period: Historical Reserves Log (2018 - 2026)</span>
                  </GridCardFooter>
                </div>
              </div>

              {/* Reserves and Capacity Charges Audit info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-5 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">Petrobangla Natural Gas Reserves<GridProvenanceTag kind="P" /></div>
                  <div className="space-y-1">
                    <div className="text-xl font-bold text-foreground">7.63 Tcf Remaining</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Of the original 29.74 Tcf recoverable gas reserves, 22.11 Tcf has already been extracted.
                      This is the audited balance at 1 January 2026. The Gas Reserve Depletion
                      panel carries it forward day by day from the daily reports, so it shows a
                      lower figure for today — the same reserve, counted to a later date.
                    </p>
                  </div>
                </div>

                <div className="card p-5 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">Capacity Charge Drag<GridProvenanceTag kind="P" /></div>
                  <div className="space-y-1">
                    <div className="text-xl font-bold text-destructive">~40% of Wholesale Costs</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Audited financial statements indicate that over 40% of BPDB's average bulk purchase rate goes directly toward paying capacity charges to idle or underutilized private IPPs.
                    </p>
                  </div>
                </div>

                <div className="card p-5 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">State Subsidy Burden<GridProvenanceTag kind="D" /></div>
                  <div className="space-y-1">
                    <div className="text-xl font-bold text-foreground">~35k-40k Crore BDT / Year</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Due to the Tk 4.52 per unit wholesale cost gap (average Tk 12.91 generation cost vs Tk 8.39 bulk tariff), the Ministry of Finance issues massive annual treasury transfers to cover the deficit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Metadata Footer */}
              <GridCardFooter>
                <span>Source: <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Petrobangla Hydrocarbon Unit</a> &amp; <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">BPDB Annual Financials</a></span>
                <span>
                  Reserve and capacity-charge figures are as the audits state them. The
                  subsidy card is ours: the Tk 4.52 gap is Tk 12.91 generation cost less
                  Tk 8.39 bulk tariff, and the annual range follows from it. Note that this
                  cost is BPDB&apos;s <em>bulk purchase</em> rate across the year, not the daily
                  production cost shown on the Overview tab — the two measure different
                  things and should not be compared directly. Not independently audited.
                </span>
                <span>Reporting Period: Macro Analysis (2026 Audit Reports)</span>
              </GridCardFooter>
            </div>
          )}

          {/* Sub-tab: PGCB Monthly Archives */}
          {macroSubTab === 'monthly' && pgcbMonthlyLoading && pgcbMonthlyData.length === 0 && (
            <div className="space-y-6 grid-explorer-subpanel" aria-busy="true">
              <div className="grid-explorer-skeleton h-24 rounded-2xl" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="grid-explorer-skeleton h-28 rounded-2xl" />
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="grid-explorer-skeleton h-80 rounded-2xl" />
                <div className="grid-explorer-skeleton h-80 rounded-2xl" />
              </div>
            </div>
          )}

          {macroSubTab === 'monthly' && !(pgcbMonthlyLoading && pgcbMonthlyData.length === 0) && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/*
                What the two-parser check found on this archive. Stated up front
                because the interesting result is not the pass — it is the nine
                rows PGCB dated to an earlier month.
              */}
              <div className="p-3.5 rounded-2xl border border-border/40 bg-muted/[0.06] text-[11px] leading-relaxed text-muted-foreground flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">How these months were checked.</strong>{' '}
                  Every headline figure is read twice from PGCB&apos;s own report — once by
                  fixed column position, once by finding the item&apos;s label and taking the
                  number beside it. The two share no column knowledge, so a layout change
                  breaks one and a reworded label breaks the other.{' '}
                  <strong className="text-foreground">
                    All {PGCB_MONTHLY_VERIFICATION.figuresCompared} figures agreed, none disagreed
                  </strong>{' '}
                  — across the {PGCB_MONTHLY_VERIFICATION.monthsWithLocalSource} of{' '}
                  {PGCB_MONTHLY_VERIFICATION.monthsInArchive} months whose source report is held
                  here. The remaining months are shown as published but have not been
                  re-read this way.
                </span>
              </div>
              {/* Month/Year Selection Control Panel */}
              {(() => {
                const currentMonthlyData = localPgcbMonthlyData.find(d => d.date_key === selectedMonthlyKey) || localPgcbMonthlyData[localPgcbMonthlyData.length - 1];

                // The period pickers list the WHOLE archive, not just the tier's window, so a
                // visitor can see how far the data actually goes. Periods outside their window
                // render greyed via `locked` and are inert until they upgrade.
                const unlockedKeys = new Set(localPgcbMonthlyData.map(d => d.date_key));
                const availableYears = Array.from(new Set(pgcbMonthlyData.map(d => d.year))).sort((a, b) => b - a);
                const availableMonths = pgcbMonthlyData.filter(d => d.year === currentMonthlyData?.year);

                const yearOptions = availableYears.map(y => ({
                  label: String(y),
                  value: String(y),
                  locked: !pgcbMonthlyData.some(d => d.year === y && unlockedKeys.has(d.date_key)),
                }));
                const monthOptions = availableMonths.map(d => ({
                  label: d.month,
                  value: d.month,
                  locked: !unlockedKeys.has(d.date_key),
                }));
                // Regional supply is per-month detail, so it comes from the month's own
                // file rather than the series. Guarded against showing the previous
                // month's zones while a newly picked month is still loading.
                const regionalRecord =
                  selectedMonthlyRecord && selectedMonthlyRecord.date_key === currentMonthlyData?.date_key
                    ? selectedMonthlyRecord
                    : null;
                const regionalChartData = regionalRecord
                  ? Object.entries(regionalRecord.regional_supply)
                      .map(([key, value]) => ({
                        key,
                        name: key.charAt(0).toUpperCase() + key.slice(1),
                        value,
                        color: REGIONAL_ZONE_COLORS[key.toLowerCase()] ?? '#94a3b8',
                      }))
                      .sort((a, b) => b.value - a.value)
                  : [];
                const regionalTotalMw = regionalChartData.reduce((sum, row) => sum + row.value, 0);
                return (
                  <>
                    <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-2xl shadow-sm relative z-50">
                      <div className="max-w-2xl">
                        <h4 className="text-sm font-bold text-foreground">Select Operating Period</h4>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          <strong className="text-primary font-bold">PGCB Monthly Operating Data:</strong> This archive contains official, authenticated monthly reports from the Power Grid Company of Bangladesh (PGCB) from 2013 to 2026. Explore peak generation records, demand curves, fuel mix metrics, and regional maximum power flows.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 self-start md:self-center">
                        <div className="w-32 relative z-50">
                          <CustomDropdown
                            value={String(currentMonthlyData?.year)}
                            onChange={(val) => {
                              const newYear = parseInt(val);
                              // Locked years stay inert — jump to that year's first unlocked month.
                              const firstMonth = localPgcbMonthlyData.find(d => d.year === newYear);
                              if (firstMonth) setSelectedMonthlyKey(firstMonth.date_key);
                            }}
                            options={yearOptions}
                            placeholder="Year"
                            isOpen={isYearDropdownOpen}
                            setIsOpen={setIsYearDropdownOpen}
                            dropdownRef={yearDropdownRef}
                            icon={<Calendar className="h-3.5 w-3.5 text-primary shrink-0" />}
                            prefixLabel="Year:"
                            layout="grid"
                            gridColumns={3}
                            menuWidth="12rem"
                            noBackground={true}
                            hideDecorationsOnSelect={true}
                          />
                        </div>

                        <div className="w-44 relative z-50">
                          <CustomDropdown
                            value={currentMonthlyData?.month}
                            onChange={(val) => {
                              const targetData = localPgcbMonthlyData.find(d => d.year === currentMonthlyData?.year && d.month === val);
                              if (targetData) setSelectedMonthlyKey(targetData.date_key);
                            }}
                            options={monthOptions}
                            placeholder="Month"
                            isOpen={isMonthDropdownOpen}
                            setIsOpen={setIsMonthDropdownOpen}
                            dropdownRef={monthDropdownRef}
                            icon={<FileText className="h-3.5 w-3.5 text-primary shrink-0" />}
                            prefixLabel="Month:"
                            layout="grid"
                            gridColumns={3}
                            menuWidth="18rem"
                            noBackground={true}
                            hideDecorationsOnSelect={true}
                            align="right"
                          />
                        </div>
                      </div>
                    </div>

                    {/*
                      On nine months PGCB dated a headline figure to an earlier
                      month, meaning that row was never refreshed for the report
                      it appears in. The figure is genuinely published, so it is
                      shown and still marked P — but a reader taking it as this
                      month's maximum would be wrong, so say so where it is read.
                    */}
                    {(() => {
                      const stale = staleRowsFor(selectedMonthlyKey);
                      if (!stale.length) return null;
                      return (
                        <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] text-[11px] leading-relaxed flex items-start gap-2.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">
                            <strong className="text-foreground">
                              PGCB did not refresh {stale.length === 1 ? 'a figure' : 'these figures'} for this month.
                            </strong>{' '}
                            {stale.map((r, i) => (
                              <span key={r.field}>
                                {i > 0 ? ' ' : ''}
                                Its{' '}
                                {r.field === 'max_evening_peak_gen'
                                  ? 'maximum evening peak generation'
                                  : 'maximum evening peak demand'}{' '}
                                of {formatNumber(r.value)} MW is stamped by PGCB with a date in{' '}
                                <strong className="text-foreground">{monthLabel(r.occurred)}</strong>.
                              </span>
                            ))}{' '}
                            The figure below is what PGCB published, reproduced unchanged — but it
                            describes the earlier month, not this one. Every other item in the
                            report is dated correctly.
                          </span>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between items-center text-center">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider inline-flex items-center gap-1">
                          Max Peak Generation
                          <GridProvenanceTag kind="P" />
                        </div>
                        <div className="text-primary font-semibold text-xs mt-0.5 select-none">Tracked since 2014</div>
                        <div className="text-2xl font-bold mt-1 text-primary tabular-nums">
                          {currentMonthlyData ? formatNumber(currentMonthlyData.max_evening_peak_gen) : 0} <span className="text-xs font-medium text-muted-foreground">MW</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">Evening peak generation recorded</p>
                      </div>

                      <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between items-center text-center">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider inline-flex items-center gap-1">Estimated Peak Demand<GridProvenanceTag kind="P" /></div>
                        <div className="text-primary font-semibold text-xs mt-0.5 select-none">Tracked since 2014</div>
                        <div className="text-2xl font-bold mt-1 text-foreground tabular-nums">
                          {currentMonthlyData ? formatNumber(currentMonthlyData.max_evening_peak_demand) : 0} <span className="text-xs font-medium text-muted-foreground">MW</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">System operational peak demand</p>
                      </div>

                      <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between items-center text-center">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider inline-flex items-center gap-1">Peak Deficit / Load Shed<GridProvenanceTag kind="D" /></div>
                        <div className="text-primary font-semibold text-xs mt-0.5 select-none">Tracked since 2014</div>
                        <div className="text-2xl font-bold mt-1 text-destructive tabular-nums">
                          {currentMonthlyData && currentMonthlyData.max_evening_peak_demand > currentMonthlyData.max_evening_peak_gen
                            ? formatNumber(Math.round(currentMonthlyData.max_evening_peak_demand - currentMonthlyData.max_evening_peak_gen))
                            : 0}{' '}
                          <span className="text-xs font-medium text-muted-foreground">MW</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">Peak capacity deficit gap</p>
                      </div>

                      <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between items-center text-center">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider inline-flex items-center gap-1">Total Net Energy<GridProvenanceTag kind="P" /></div>
                        <div className="text-primary font-semibold text-xs mt-0.5 select-none">Tracked since 2014</div>
                        <div className="text-2xl font-bold mt-1 text-amber-500 tabular-nums">
                          {currentMonthlyData ? formatNumber(currentMonthlyData.total_net_generation, 1) : 0}{' '}
                          <span className="text-xs font-medium text-muted-foreground">MKWh<sup className="text-[9px] font-bold ml-0.5">r</sup></span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">Monthly total energy generation</p>
                      </div>
                    </div>

                    {/* Fuel and Regional supply details */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      
                      {/* Fuel Mix Card */}
                      <div className="grid-explorer-chart-card card">
                        <div className="mb-4">
                          <h3 className="grid-explorer-chart-card__title">Energy Fuel Mix<MonthlyBadge /></h3>
                    <div className="text-primary font-semibold text-xs mt-0.5 select-none">Tracked since 2014</div>
                          <p className="grid-explorer-chart-card__sub text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            Net generation by fuel source in {currentMonthlyData?.month} {currentMonthlyData?.year} (MKWh)
                          </p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                          {/* Left Column: Chart */}
                          <div className="lg:col-span-6 flex items-center justify-center w-full min-w-0">
                            <div className="grid-explorer-donut-wrap grid-explorer-donut-wrap--centered !mb-0 w-full">
                              {macroChartsReady ? (
                                <PieChart width={200} height={200} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                  <Pie
                                    data={
                                      currentMonthlyData
                                        ? Object.entries(currentMonthlyData.generation_by_fuel)
                                            .map(([name, val]) => ({
                                              name: name.toUpperCase(),
                                              value: val,
                                              color: getFuelColor(name)
                                            }))
                                            .filter(d => d.value > 0)
                                        : []
                                    }
                                    cx={100}
                                    cy={100}
                                    innerRadius={55}
                                    outerRadius={82}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {(currentMonthlyData
                                      ? Object.entries(currentMonthlyData.generation_by_fuel)
                                          .map(([name, val]) => ({
                                            name: name.toUpperCase(),
                                            value: val,
                                            color: getFuelColor(name)
                                          }))
                                          .filter(d => d.value > 0)
                                      : []
                                    ).map((entry, idx) => (
                                      <Cell key={`cell-${idx}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (!active || !payload?.length) return null;
                                      const data = payload[0].payload;
                                      const total = currentMonthlyData ? currentMonthlyData.total_net_generation : 1;
                                      const pct = (data.value / total) * 100;
                                      return (
                                        <div className="p-3 text-card-foreground border border-border/80 rounded-xl shadow-lg bg-card/95 backdrop-blur-md text-xs z-50">
                                          <div className="font-bold mb-1.5 flex items-center gap-1.5 border-b border-border/40 pb-1">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                                            <span>{data.name}</span>
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex justify-between gap-4">
                                              <span className="text-muted-foreground">Generation:</span>
                                              <span className="font-bold text-foreground tabular-nums">{formatNumber(data.value, 1)} MKWh</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                              <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Share of Mix:</span>
                                              <span className="font-bold text-primary tabular-nums">{pct.toFixed(1)}%</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }}
                
                                  />
                                  <g className="pointer-events-none select-none">
                                    <text
                                      x={100}
                                      y={92}
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      className="fill-foreground font-sans font-bold"
                                      style={{ fontSize: '24px', letterSpacing: '-0.02em' }}
                                    >
                                      {currentMonthlyData ? formatNumber(currentMonthlyData.total_net_generation, 0) : '0'}
                                    </text>
                                    <text
                                      x={100}
                                      y={114}
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      className="fill-muted-foreground font-sans font-semibold uppercase"
                                      style={{ fontSize: '9.5px', letterSpacing: '0.1em' }}
                                    >
                                      MKWh Net
                                    </text>
                                  </g>
                                </PieChart>
                              ) : (
                                <div className="grid-explorer-skeleton" />
                              )}
                            </div>
                          </div>

                          {/* Right Column: Fuel Mix Table */}
                          <div className="lg:col-span-6 grid-explorer-table-wrap">
                            <table className="w-full text-[11px] leading-relaxed">
                              <thead>
                                <tr className="border-b border-border/40 text-muted-foreground text-left">
                                  <th className="pb-2 font-bold">Fuel Type</th>
                                  <th className="pb-2 text-left font-bold">
                                    <span className="inline-flex items-center gap-1">MKWh<GridProvenanceTag kind="P" /></span>
                                  </th>
                                  <th className="pb-2 text-left font-bold">
                                    <span className="inline-flex items-center gap-1">Share %<GridProvenanceTag kind="D" /></span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/20 text-foreground">
                                {currentMonthlyData &&
                                  Object.entries(currentMonthlyData.generation_by_fuel)
                                    .map(([name, val]) => {
                                      const total = currentMonthlyData.total_net_generation || 1;
                                      const pct = (val / total) * 100;
                                      return { name, val, pct, color: getFuelColor(name) };
                                    })
                                    .filter(d => d.val > 0)
                                    .sort((a, b) => b.val - a.val)
                                    .map((f, idx) => (
                                      <tr key={idx} className="hover:bg-muted/10">
                                        <td className="py-2.5 flex items-center gap-1.5 font-medium">
                                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                                          <span className="capitalize">{f.name === 'hfo' ? 'Furnace Oil (HFO)' : f.name === 'import' ? 'India Imports' : f.name}</span>
                                        </td>
                                        <td className="py-2.5 text-left tabular-nums font-semibold">{formatNumber(f.val, 1)}</td>
                                        <td className="py-2.5 text-left tabular-nums text-muted-foreground">{f.pct.toFixed(1)}%</td>
                                      </tr>
                                    ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Regional Peak Supply Card */}
                      <div className="grid-explorer-chart-card card">
                        <div className="mb-4">
                          <h3 className="grid-explorer-chart-card__title">Regional Maximum Peak Supply<MonthlyBadge /></h3>
                    <p className="grid-explorer-chart-card__sub">
                            Substation peak loads served by grid zone in {currentMonthlyData?.month} {currentMonthlyData?.year} (MW)
                           — <span className="text-primary font-semibold text-xs">Tracked since 2014</span></p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                          {/* Left Column: Chart */}
                          <div className="lg:col-span-6 w-full min-w-0">
                            <div className="grid-explorer-chart-area grid-explorer-chart-area--lg grid-explorer-chart-area--split !min-h-[16rem] !h-[16rem] mt-16">
                              {macroChartsReady ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    accessibilityLayer={false}
                                    data={regionalChartData}
                                    margin={GRID_EXPLORER_CHART_MARGIN.default}
                                    onMouseLeave={() => setHoveredZoneIndex(null)}
                                  >
                                    <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 11, fill: chartTheme.axisTick, dy: 4 }}
                                      axisLine={false}
                                      tickLine={false}
                                      padding={GRID_X_AXIS_PADDING}
                                    />
                                    <YAxis
                                      {...gridChartYAxisProps(chartTheme, { splitUnit: 'MW' })}
                                      width={GRID_Y_AXIS_WIDTH.single}
                                      domain={[0, 'auto']}
                                      allowDecimals={false}
                                    />
                                    <Bar
                                      dataKey="value"
                                      radius={[6, 6, 0, 0]}
                                      maxBarSize={32}
                                    >
                                      {regionalChartData.map((entry, index) => {
                                        const isDimmed = hoveredZoneIndex !== null && hoveredZoneIndex !== index;
                                        return (
                                          <Cell
                                            key={entry.key}
                                            fill={entry.color}
                                            fillOpacity={isDimmed ? 0.35 : 1}
                                            style={{ transition: 'fill-opacity 200ms ease', cursor: 'pointer' }}
                                            onMouseEnter={() => setHoveredZoneIndex(index)}
                                            onMouseLeave={() => setHoveredZoneIndex(null)}
                                          />
                                        );
                                      })}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="grid-explorer-skeleton" />
                              )}
                            </div>
                          </div>

                          {/* Right Column: Regional Table */}
                          <div className="lg:col-span-6 w-full grid-explorer-table-wrap">
                            <table className="w-full text-[11px] leading-relaxed">
                              <thead>
                                <tr className="border-b border-border/40 text-muted-foreground text-left">
                                  <th className="pb-2 font-bold">Grid Zone</th>
                                  <th className="pb-2 text-left font-bold">
                                    <span className="inline-flex items-center gap-1">Peak Load (MW)<GridProvenanceTag kind="P" /></span>
                                  </th>
                                  <th className="pb-2 text-left font-bold">
                                    <span className="inline-flex items-center gap-1">Share %<GridProvenanceTag kind="D" /></span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/20 text-foreground">
                                {regionalChartData.map((z, idx) => {
                                  const pct = regionalTotalMw > 0 ? (z.value / regionalTotalMw) * 100 : 0;
                                  const isDimmed = hoveredZoneIndex !== null && hoveredZoneIndex !== idx;
                                  return (
                                    <tr
                                      key={z.key}
                                      className={`hover:bg-muted/10 transition-opacity duration-200 ${isDimmed ? 'opacity-35' : 'opacity-100'}`}
                                      onMouseEnter={() => setHoveredZoneIndex(idx)}
                                      onMouseLeave={() => setHoveredZoneIndex(null)}
                                    >
                                      <td className="py-1.5 flex items-center gap-1.5 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                                        <span>{z.name}</span>
                                      </td>
                                      <td className="py-1.5 text-left tabular-nums font-semibold">{formatNumber(z.value)}</td>
                                      <td className="py-1.5 text-left tabular-nums text-muted-foreground">{pct.toFixed(1)}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Historical Long-term Trend Chart */}
              <div className="grid-explorer-chart-card card">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:pr-4">
                  <div>
                    <h3 className="grid-explorer-chart-card__title">PGCB 13-Year Historical Growth Trends<MonthlyBadge /></h3>
                    <p className="grid-explorer-chart-card__sub">Grid operational metrics charted monthly from 2013 to 2026 — the plotted values are PGCB&apos;s own <GridProvenanceTag kind="P" />, the month-on-month changes in the tooltip are ours <GridProvenanceTag kind="D" /> • <span className="text-primary font-semibold text-xs">Tracked since January 2013</span></p>
                  </div>
                  
                  {/* Selector Controls for Chart */}
                  <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5 self-start sm:self-center shrink-0 w-full sm:w-auto relative z-50">
                    <button
                      type="button"
                      onClick={() => setMonthlyTrendMetric('peaks')}
                      className={cn(
                        TREND_TOGGLE_CLASS,
                        monthlyTrendMetric === 'peaks'
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-transparent border-border/40 text-muted-foreground hover:bg-muted/10 hover:border-primary/30"
                      )}
                    >
                      Grid Peaks (MW)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonthlyTrendMetric('energy')}
                      className={cn(
                        TREND_TOGGLE_CLASS,
                        monthlyTrendMetric === 'energy'
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-transparent border-border/40 text-muted-foreground hover:bg-muted/10 hover:border-primary/30"
                      )}
                    >
                      Energy (MKWh)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonthlyTrendMetric('fuels')}
                      className={cn(
                        TREND_TOGGLE_CLASS,
                        monthlyTrendMetric === 'fuels'
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-transparent border-border/40 text-muted-foreground hover:bg-muted/10 hover:border-primary/30"
                      )}
                    >
                      Fuel Trends
                    </button>

                    {monthlyTrendMetric === 'fuels' && (
                      <div className={cn(TREND_CONTROL_SIZE, 'relative z-50')}>
                        <CustomDropdown
                          value={selectedFuelTrend}
                          onChange={(val: any) => setSelectedFuelTrend(val)}
                          options={[
                            { label: 'Gas', value: 'gas' },
                            { label: 'Coal', value: 'coal' },
                            { label: 'Furnace Oil (HFO)', value: 'hfo' },
                            { label: 'Diesel', value: 'diesel' },
                            { label: 'Imports', value: 'import' }
                          ]}
                          placeholder="Select Fuel"
                          isOpen={isFuelDropdownOpen}
                          setIsOpen={setIsFuelDropdownOpen}
                          dropdownRef={fuelDropdownRef}
                          icon={<Zap className="h-3.5 w-3.5 text-primary shrink-0" />}
                          prefixLabel="Fuel:"
                          noBackground={true}
                          hideDecorationsOnSelect={true}
                          align="right"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid-explorer-chart-area mt-4 grid-explorer-chart-area--h-taller">
                  {macroChartsReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {monthlyTrendMetric === 'peaks' ? (
                        <ComposedChart accessibilityLayer={false} data={localPgcbMonthlyData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                          <XAxis
                            dataKey="date_key"
                            tick={{ fontSize: 9, fill: chartTheme.axisTick }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatPgcbMonthlyTick}
                          />
                          <YAxis
                            width={GRID_Y_AXIS_WIDTH.single}
                            tick={{ fontSize: 10, fill: chartTheme.axisTick }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={4}
                            domain={[0, 'auto']}
                            allowDecimals={false}
                            tickFormatter={formatAxisMw}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              
                              // YoY calculation
                              const prevData = localPgcbMonthlyData.find(m => m.year === d.year - 1 && m.month === d.month);
                              const genYoY = prevData && prevData.max_evening_peak_gen > 0
                                ? ((d.max_evening_peak_gen - prevData.max_evening_peak_gen) / prevData.max_evening_peak_gen) * 100
                                : null;
                              const demandYoY = prevData && prevData.max_evening_peak_demand > 0
                                ? ((d.max_evening_peak_demand - prevData.max_evening_peak_demand) / prevData.max_evening_peak_demand) * 100
                                : null;
                                
                              const deficit = d.max_evening_peak_demand > d.max_evening_peak_gen
                                ? Math.round(d.max_evening_peak_demand - d.max_evening_peak_gen)
                                : 0;
                              const deficitPct = d.max_evening_peak_demand > 0 ? (deficit / d.max_evening_peak_demand) * 100 : 0;
                              
                              return (
                                <div className="p-4 text-card-foreground border border-border rounded-2xl shadow-xl bg-card/95 backdrop-blur-md text-xs min-w-[240px] z-50">
                                  <div className="font-bold mb-2 border-b border-border/40 pb-1.5 flex justify-between items-center gap-4">
                                    <span className="text-sm">{d.month} {d.year}</span>
                                    <span className="text-[10px] uppercase font-extrabold text-primary">Grid Peak</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <div className="flex justify-between gap-4 items-center">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Max Generation:</span>
                                        <span className="font-bold text-primary tabular-nums">{formatNumber(d.max_evening_peak_gen)} MW</span>
                                      </div>
                                      {genYoY !== null && (
                                        <div className="text-left text-[10px]">
                                          <span className="text-muted-foreground mr-1">YoY:</span>
                                          <span className={cn("font-semibold", genYoY >= 0 ? "text-emerald-500" : "text-destructive")}>
                                            {genYoY >= 0 ? "+" : ""}{genYoY.toFixed(1)}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex justify-between gap-4 items-center">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Peak Demand:</span>
                                        <span className="font-bold text-foreground tabular-nums">{formatNumber(d.max_evening_peak_demand)} MW</span>
                                      </div>
                                      {demandYoY !== null && (
                                        <div className="text-left text-[10px]">
                                          <span className="text-muted-foreground mr-1">YoY:</span>
                                          <span className={cn("font-semibold", demandYoY >= 0 ? "text-emerald-500" : "text-destructive")}>
                                            {demandYoY >= 0 ? "+" : ""}{demandYoY.toFixed(1)}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="border-t border-border/30 pt-1.5">
                                      <div className="flex justify-between gap-4 items-center">
                                        <span className="text-destructive font-semibold">Deficit Gap:</span>
                                        <span className="font-bold text-destructive tabular-nums">
                                          {formatNumber(deficit)} MW
                                        </span>
                                      </div>
                                      {deficit > 0 && (
                                        <div className="text-left text-[10px]">
                                          <span className="text-muted-foreground mr-1">Deficit Share:</span>
                                          <span className="font-semibold text-destructive">{deficitPct.toFixed(1)}%</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Alert Banner */}
                                    <div className={cn(
                                      "mt-2 p-1.5 rounded-lg text-[10px] font-semibold text-center border",
                                      deficit > 1000
                                        ? "bg-destructive/10 border-destructive/20 text-destructive"
                                        : deficit > 0
                                          ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                    )}>
                                      {deficit > 1000
                                        ? "⚠️ Severe Load Shedding Alert"
                                        : deficit > 0
                                          ? "⚠️ Moderate Load Shedding Alert"
                                          : "✅ Stable Grid Capacity"}
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                          <Area type="monotone" dataKey="max_evening_peak_demand" name="Estimated Peak Demand" stroke="#f97316" fill="rgba(249, 115, 22, 0.05)" strokeWidth={1.5} />
                          <Line type="monotone" dataKey="max_evening_peak_gen" name="Maximum Peak Generation" stroke={chartTheme.primary} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                        </ComposedChart>
                      ) : monthlyTrendMetric === 'energy' ? (
                        <ComposedChart accessibilityLayer={false} data={localPgcbMonthlyData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                          <XAxis
                            dataKey="date_key"
                            tick={{ fontSize: 9, fill: chartTheme.axisTick }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatPgcbMonthlyTick}
                          />
                          <YAxis
                            width={GRID_Y_AXIS_WIDTH.single}
                            tick={{ fontSize: 10, fill: chartTheme.axisTick }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={4}
                            domain={[0, 'auto']}
                            allowDecimals={false}
                            tickFormatter={(v) => `${v} MKWh`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              
                              // YoY calculation
                              const prevData = localPgcbMonthlyData.find(m => m.year === d.year - 1 && m.month === d.month);
                              const energyYoY = prevData && prevData.total_net_generation > 0
                                ? ((d.total_net_generation - prevData.total_net_generation) / prevData.total_net_generation) * 100
                                : null;
                                
                              // Average dispatch computation
                              const daysInMonth = (month: string, year: number) => {
                                const m = month.toLowerCase();
                                if (['january', 'march', 'may', 'july', 'august', 'october', 'december'].includes(m)) return 31;
                                if (['april', 'june', 'september', 'november'].includes(m)) return 30;
                                if (m === 'february') return year % 4 === 0 ? 29 : 28;
                                return 30;
                              };
                              const days = daysInMonth(d.month, d.year);
                              const avgMW = (d.total_net_generation * 1000) / (days * 24);
                              
                              return (
                                <div className="p-4 text-card-foreground border border-border rounded-2xl shadow-xl bg-card/95 backdrop-blur-md text-xs min-w-[240px] z-50">
                                  <div className="font-bold mb-2 border-b border-border/40 pb-1.5 flex justify-between items-center gap-4">
                                    <span className="text-sm">{d.month} {d.year}</span>
                                    <span className="text-[10px] uppercase font-extrabold text-amber-500">Energy Net</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <div className="flex justify-between gap-4 items-center">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Total Generation:</span>
                                        <span className="font-bold text-amber-500 tabular-nums">{formatNumber(d.total_net_generation, 1)} MKWh</span>
                                      </div>
                                      {energyYoY !== null && (
                                        <div className="text-left text-[10px]">
                                          <span className="text-muted-foreground mr-1">YoY Growth:</span>
                                          <span className={cn("font-semibold", energyYoY >= 0 ? "text-emerald-500" : "text-destructive")}>
                                            {energyYoY >= 0 ? "+" : ""}{energyYoY.toFixed(1)}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="border-t border-border/30 pt-1.5">
                                      <div className="flex justify-between gap-4 items-center">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Avg continuous dispatch:</span>
                                        <span className="font-bold text-foreground tabular-nums">{formatNumber(Math.round(avgMW))} MW</span>
                                      </div>
                                      <div className="text-[9px] text-muted-foreground mt-0.5">
                                        Calculated across {days} operational days
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                          <Area type="monotone" dataKey="total_net_generation" name="Total Monthly Energy Generation (MKWh)" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.1)" strokeWidth={2.5} />
                        </ComposedChart>
                      ) : (
                        <ComposedChart accessibilityLayer={false} data={pgcbFuelTrendData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                          <XAxis
                            dataKey="date_key"
                            tick={{ fontSize: 9, fill: chartTheme.axisTick }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatPgcbMonthlyTick}
                          />
                          <YAxis
                            width={GRID_Y_AXIS_WIDTH.single}
                            tick={{ fontSize: 10, fill: chartTheme.axisTick }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={4}
                            domain={[0, 'auto']}
                            allowDecimals={false}
                            tickFormatter={(v) => `${v} MKWh`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              const fuelVal = d.fuelTrendMkwh ?? 0;
                              
                              // YoY calculation
                              const prevData = localPgcbMonthlyData.find(m => m.year === d.year - 1 && m.month === d.month);
                              const prevFuelVal = prevData ? (prevData.generation_by_fuel[selectedFuelTrend] || 0) : 0;
                              const fuelYoY = prevFuelVal > 0
                                ? ((fuelVal - prevFuelVal) / prevFuelVal) * 100
                                : null;
                                
                              const share = d.total_net_generation > 0 ? (fuelVal / d.total_net_generation) * 100 : 0;
                              const fuelLabel = getFuelLabel(selectedFuelTrend);
                              
                              return (
                                <div className="p-4 text-card-foreground border border-border rounded-2xl shadow-xl bg-card/95 backdrop-blur-md text-xs min-w-[240px] z-50">
                                  <div className="font-bold mb-2 border-b border-border/40 pb-1.5 flex justify-between items-center gap-4">
                                    <span className="text-sm">{d.month} {d.year}</span>
                                    <span className="text-[10px] uppercase font-extrabold" style={{ color: getFuelColor(selectedFuelTrend) }}>
                                      {selectedFuelTrend}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <div className="flex justify-between gap-4 items-center">
                                        <span className="text-muted-foreground capitalize">{fuelLabel}:</span>
                                        <span className="font-bold tabular-nums" style={{ color: getFuelColor(selectedFuelTrend) }}>
                                          {formatNumber(fuelVal, 1)} MKWh
                                        </span>
                                      </div>
                                      {fuelYoY !== null && (
                                        <div className="text-left text-[10px]">
                                          <span className="text-muted-foreground mr-1">YoY Growth:</span>
                                          <span className={cn("font-semibold", fuelYoY >= 0 ? "text-emerald-500" : "text-destructive")}>
                                            {fuelYoY >= 0 ? "+" : ""}{fuelYoY.toFixed(1)}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="border-t border-border/30 pt-1.5">
                                      <div className="flex justify-between gap-4 items-center">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Share of Month Mix:</span>
                                        <span className="font-bold text-foreground tabular-nums">{share.toFixed(1)}%</span>
                                      </div>
                                      <div className="flex justify-between gap-4 items-center mt-1">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Total Month Net:</span>
                                        <span className="font-bold text-foreground/80 tabular-nums">{formatNumber(d.total_net_generation, 1)} MKWh</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                          <Line
                            type="monotone"
                            dataKey="fuelTrendMkwh"
                            name={`${getFuelLabel(selectedFuelTrend)} Generation Trend (MKWh)`}
                            stroke={getFuelColor(selectedFuelTrend)}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        </ComposedChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid-explorer-skeleton" />
                  )}
                </div>

                <GridCardFooter>
                  <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Monthly System Operation Reports</a></span>
                  {/*
                    The exact monthly report this view was read from. Most months
                    are held as a text conversion of PGCB's workbook rather than
                    the workbook itself, and the extension says which — so the
                    filename is shown as-is instead of being tidied into a name
                    the archive does not actually hold.
                  */}
                  {(() => {
                    const src = pgcbMonthlyData.find((d) => d.date_key === selectedMonthlyKey)
                      ?? pgcbMonthlyData[pgcbMonthlyData.length - 1];
                    return src?.filename ? (
                      <GridSourceFiles
                        files={[{ label: 'PGCB monthly report', name: src.filename }]}
                      />
                    ) : null;
                  })()}
                  <span>
                    Peaks, demand, per-fuel energy and regional peak loads are PGCB&apos;s
                    published monthly figures. The deficit, every share percentage and the
                    month-on-month changes are ours, worked out from those. Each figure was
                    read twice from the source report by two independent parsers; all 247
                    checked agreed.
                  </span>
                  {/* Derived from the archive so it can't drift as months are ingested. */}
                  {pgcbMonthlyData.length > 0 && (
                    <span>
                      Data Period: {pgcbMonthlyData[0].month} {pgcbMonthlyData[0].year} -{' '}
                      {pgcbMonthlyData[pgcbMonthlyData.length - 1].month}{' '}
                      {pgcbMonthlyData[pgcbMonthlyData.length - 1].year} ({pgcbMonthlyData.length} Consecutive Reports)
                    </span>
                  )}
                </GridCardFooter>
              </div>

              {/* Everything beyond the headline figures, from the source workbook's
                  other 17 sheets. Only months that have been re-parsed carry it. */}
              {selectedMonthlyRecord?.detail && selectedMonthlyRecord.date_key === selectedMonthlyKey
                ? (() => {
                    const detail = selectedMonthlyRecord.detail!;
                    const [y, m] = selectedMonthlyKey.split('-').map(Number);
                    const prev = new Date(Date.UTC(y, m - 2, 1));
                    const prevMonthLabel = `${prev.toLocaleString('en-US', {
                      month: 'long',
                      timeZone: 'UTC',
                    })} ${prev.getUTCFullYear()}`;
                    return (
                      <PgcbMonthlyDetail
                        detail={detail}
                        monthLabel={`${detail.month} ${detail.year}`}
                        prevMonthLabel={prevMonthLabel}
                        events={monthlyEvents}
                        eventsLoading={monthlyEventsLoading}
                        eventsOpened={monthlyEventsOpen}
                        onLoadEvents={() => setMonthlyEventsOpen(true)}
                      />
                    );
                  })()
                : null}
            </div>
          )}

          {/* Sub-tab 2: Pricing & Drivers */}
          {macroSubTab === 'pricing' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="p-4 bg-muted/20 border border-border/40 rounded-xl text-xs text-muted-foreground flex flex-col gap-2">
                <div>
                  <strong>Exchange Rate Sensitivity:</strong> Imported energy commodities (Spot LNG, Coal, Heavy Fuel Oil) are denominated in US Dollars (USD). Therefore, the exchange rate of the Bangladesh Taka (BDT) is a direct multiplier on the domestic cost of power generation.
                </div>
                <div className="pt-1.5 border-t border-border/30">
                  A 40%+ devaluation of the BDT since 2021 has automatically increased fuel costs even when global commodity prices remain constant.
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Inflation & Exchange Rate Drivers */}
                <div className="grid-explorer-chart-card card">
                  <div className="grid-explorer-chart-card__head">
                    <div>
                      <h3 className="grid-explorer-chart-card__title">Macro Pressure Variables (2021 - 2026)</h3>
                    <p className="grid-explorer-chart-card__sub">Devaluation of BDT/USD vs. National Inflation Rate (CPI %) — <span className="text-primary font-semibold text-xs">Tracked since 2021</span></p>
                    </div>
                    <span className="grid-explorer-chip">Macro Factors</span>
                  </div>

                  <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                    {macroChartsReady ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart accessibilityLayer={false} data={localMacroEconomicData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.dual} tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={(v) => `${v} Tk`} />
                          <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.dual} tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                  <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                    <span>Macro Variables {d.year}</span>
                                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Economy</span>
                                  </div>
                                  <div className="space-y-2 text-[11px] md:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Exchange Rate:</span>
                                      <span className="font-bold text-primary">{d.exchangeRate.toFixed(2)} BDT/USD</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inflation Rate (CPI):</span>
                                      <span className="font-bold text-amber-500">{d.inflation.toFixed(2)}%</span>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                                    Source Data: Weighted Average Interbank Exchange Rate &amp; Consumer Price Index
                                  </div>
                                  <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                                    <div><strong>Source:</strong> <a href="https://www.bb.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bangladesh Bank</a> &amp; BBS Databases</div>
                                    <div>As published. Not independently audited.</div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                          <Bar yAxisId="left" dataKey="exchangeRate" name="USD Exchange Rate (BDT)" fill={chartTheme.primary} radius={[4, 4, 0, 0]} maxBarSize={25} />
                          <Line yAxisId="right" type="monotone" dataKey="inflation" name="Inflation Rate (%)" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="grid-explorer-skeleton" />
                    )}
                  </div>

                  {/* Card Explanation Block */}
                  <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
                    <p><strong>What is being shown?</strong></p>
                    <p className="leading-relaxed">This chart shows the year-on-year weighted average interbank exchange rate (BDT per USD) plotted against the national CPI inflation rate since 2021.</p>
                    <p className="leading-relaxed"><strong>Analytical Insight:</strong> The rapid rise in the exchange rate (from ~85 Tk in 2021 to 122 Tk in 2026) shows a severe depreciation (~43%) of the BDT. This currency devaluation acts as a direct multiplier on imported fuel costs, triggering high domestic inflation. It signals that energy security in Bangladesh is heavily coupled with foreign exchange reserve stability.</p>
                  </div>

                  {/* Card Metadata Footer */}
                  <GridCardFooter>
                    <span>Source: <a href="https://www.bb.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Bangladesh Bank Interbank Weighted Average Statistics</a> &amp; <a href="http://bbs.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BBS Inflation Database</a></span>
                    <span>As published. Not independently audited.</span>
                    <span className="font-medium">Reporting Period: Macro-Economic Tracker (2010 - 2026)</span>
                  </GridCardFooter>
                </div>

                {/* Spot LNG vs Coal Import Price Trends */}
                <div className="grid-explorer-chart-card card">
                  <div className="grid-explorer-chart-card__head">
                    <div>
                      <h3 className="grid-explorer-chart-card__title">Global Fuel Commodity Import Costs</h3>
                    <p className="grid-explorer-chart-card__sub">Spot LNG (USD/MMBtu) vs. Import Coal (USD/Metric Ton) — <span className="text-primary font-semibold text-xs">Tracked since 2021</span></p>
                    </div>
                    <span className="grid-explorer-chip">Import Costs</span>
                  </div>

                  <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                    {macroChartsReady ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart accessibilityLayer={false} data={localMacroEconomicData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.dual} tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={(v) => `${v} $/MMBtu`} />
                          <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.dual} tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={(v) => `${v} $/t`} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                  <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                    <span>Fuel Import Cost {d.year}</span>
                                    <span className="text-[9px] uppercase font-bold text-purple-500 tracking-wider">Commodities</span>
                                  </div>
                                  <div className="space-y-2 text-[11px] md:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground text-purple-400 font-medium">Spot LNG (R-LNG):</span>
                                      <span className="font-bold text-purple-500">${d.spotLng.toFixed(2)} / MMBtu</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground text-slate-400">Imported Coal (CIF):</span>
                                      <span className="font-bold text-slate-400">${d.importCoal.toFixed(2)} / Ton</span>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                                    Indices: Platts JKM Spot Gas LNG &amp; Newcastle Thermal Coal Price Index
                                  </div>
                                  <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                                    <div><strong>Source:</strong> Petrobangla LNG Division / BPDB Coal Purchase audits</div>
                                    <div>As published. Not independently audited.</div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                          <Area yAxisId="left" type="monotone" dataKey="spotLng" name="Spot LNG (USD/MMBtu)" stroke="#a855f7" fill="rgba(168, 85, 247, 0.15)" strokeWidth={2} />
                          <Line yAxisId="right" type="monotone" dataKey="importCoal" name="Import Coal (USD/Ton)" stroke="#94a3b8" strokeWidth={2.5} dot={{ fill: '#94a3b8', r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="grid-explorer-skeleton" />
                    )}
                  </div>

                  {/* Card Explanation Block */}
                  <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
                    <p><strong>What is being shown?</strong></p>
                    <p className="leading-relaxed">This chart compares global Spot LNG prices (USD/MMBtu, left axis) against Newcastle imported coal prices (USD/Ton, right axis) from 2021 to 2026.</p>
                    <p className="leading-relaxed"><strong>Analytical Insight:</strong> The charts capture the extreme volatility of spot LNG compared to imported coal. The massive price spike in 2022 highlights the vulnerability of relying on global energy spot markets, whereas coal offers relatively more stable pricing, though still high. This shows the necessity of transitioning towards longer-term contracts rather than relying on spot imports.</p>
                  </div>

                  {/* Card Metadata Footer */}
                  <GridCardFooter>
                    <span>Source: <a href="https://www.opec.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">OPEC Bulletin Daily Spot Prices</a> &amp; <a href="https://www.spglobal.com/commodityinsights/en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Platts JKM LNG Assessments</a> / BPC Accounts</span>
                    <span>As published. Not independently audited.</span>
                    <span className="font-medium">Reporting Period: Global Indexes (2010 - 2026)</span>
                  </GridCardFooter>
                </div>
              </div>

              {/* Retail pricing table */}
              <div className="grid-explorer-chart-card card">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Retail Fuel &amp; Macro Pricing Benchmarks</h3>
                    <p className="grid-explorer-chart-card__sub">Historical correlation between BDT devaluation and retail petroleum price hikes — <span className="text-primary font-semibold text-xs">Tracked since 2010</span></p>
                  </div>
                </div>

                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table text-xs">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th className="text-left">Retail Diesel (Tk/L)</th>
                        <th className="text-left">Retail Octane (Tk/L)</th>
                        <th className="text-left">Spot LNG (USD/MMBtu)</th>
                        <th className="text-left">Import Coal (USD/Ton)</th>
                        <th className="text-left">Exchange Rate (BDT/USD)</th>
                        <th className="text-left">Inflation Rate (CPI %)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localMacroEconomicData.map((d, idx) => (
                        <tr key={idx}>
                          <td className="font-semibold">{d.year}</td>
                          <td className="text-left tabular-nums">{d.retailDiesel.toFixed(2)} Tk</td>
                          <td className="text-left tabular-nums">{d.retailOctane.toFixed(2)} Tk</td>
                          <td className="text-left tabular-nums">${d.spotLng.toFixed(2)}</td>
                          <td className="text-left tabular-nums">${d.importCoal.toFixed(2)}</td>
                          <td className="text-left tabular-nums font-semibold text-primary">{d.exchangeRate.toFixed(2)} Tk</td>
                          <td className="text-left tabular-nums font-semibold text-amber-500">{d.inflation.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Card Metadata Footer */}
                <GridCardFooter>
                  <span>Source: <a href="https://bpc.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPC Retail Gazettes</a> &amp; <a href="https://www.bb.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Bangladesh Bank Databases</a></span>
                  <span>As published. Not independently audited.</span>
                  <span className="font-medium">Reporting Period: Historical Macro Pricing Benchmarks (2010 - 2026)</span>
                </GridCardFooter>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Annual Reports (Audited Statements) */}
          {macroSubTab === 'reports' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/*
                A published figure stays P even when it does not add up — that is a
                defect in the source, disclosed, not a reason to restate its
                provenance. Same treatment as PGCB's 1 MVA total error and its
                prose-vs-table contradiction elsewhere in this explorer.
              */}
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] text-[11px] leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">These accounts do not reconcile against themselves.</strong>{' '}
                  For BPDB, revenue plus subsidy minus cost should equal the stated profit or
                  loss; it does on 4 of 11 years. FY24 is out by 8,100 crore and FY26 by
                  9,700 crore. The figures are shown exactly as published rather than adjusted
                  to balance, which is why they still carry{' '}
                  <GridProvenanceTag kind="P" /> — a published figure stays published even when
                  it is wrong. Read the profit or loss line as stated, not as the other three
                  columns imply.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReportsCompany('bpdb')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all",
                      reportsCompany === 'bpdb'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    BPDB Power Audited Statements
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportsCompany('petrobangla')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all",
                      reportsCompany === 'petrobangla'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    Petrobangla Gas Audited Statements
                  </button>
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Audited Financial History</span>
              </div>

              {reportsCompany === 'bpdb' ? (
                <div className="space-y-6">
                  {/* BPDB Audited chart */}
                  <div className="grid-explorer-chart-card card">
                    <div className="grid-explorer-chart-card__head">
                      <div>
                        <h3 className="grid-explorer-chart-card__title">BPDB Annual Cost, Revenue &amp; Subsidy Profile (Crore BDT)</h3>
                    <p className="grid-explorer-chart-card__sub">Historical audited gap showing rising purchase costs vs treasury transfers — <span className="text-primary font-semibold text-xs">Tracked since 2010</span></p>
                      </div>
                    </div>

                    <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
                      {macroChartsReady ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart accessibilityLayer={false} data={localBpdbAuditedFinancials} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                            <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                            <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                            <YAxis width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={formatAxisCrore} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                    <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                      <span>BPDB {d.year} Financials</span>
                                      <span className="text-[9px] md:text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Audited Ledger</span>
                                    </div>
                                    <div className="space-y-2 text-[11px] md:text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Operating Revenue:</span>
                                        <span className="font-bold text-foreground">{formatNumber(d.revenue)} Crore Tk</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-destructive inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Gen &amp; Purchase Cost:</span>
                                        <span className="font-bold text-destructive">{formatNumber(d.cost)} Crore Tk</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-emerald-500 inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Government Subsidy:</span>
                                        <span className="font-bold text-emerald-500">{formatNumber(d.subsidy)} Crore Tk</span>
                                      </div>
                                      <div className="flex justify-between border-t border-border/30 pt-1">
                                        <span className="text-destructive font-bold inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Net Profit/Loss:</span>
                                        <span className="font-bold text-destructive">{formatNumber(d.loss)} Crore Tk</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                                      Formula: Net Profit/Loss = (Revenue + Subsidy) - Generation &amp; Purchase Cost
                                    </div>
                                    <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                                      <div><strong>Source:</strong> <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BPDB Annual Financial Report</a></div>
                                      <div>As published. Not independently audited.</div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="revenue" name="Operating Revenue" fill="#0ea5e9" stackId="a" radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Bar dataKey="subsidy" name="Govt Subsidy" fill="#10b981" stackId="a" radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Bar dataKey="cost" name="Gen &amp; Purchase Cost" fill="#f97316" radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Line type="monotone" dataKey="loss" name="Net Loss (after subsidy)" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="grid-explorer-skeleton" />
                      )}
                    </div>

                    {/* Card Metadata Footer */}
                    <GridCardFooter>
                      <span>Source: <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Financial Reports</a></span>
                      <span>As published. Not independently audited.</span>
                      <span className="font-medium">Reporting Period: Audited Accounts (FY 2010 - FY 2026)</span>
                    </GridCardFooter>
                  </div>

                  {/* BPDB table */}
                  <div className="grid-explorer-chart-card card">
                    <div className="grid-explorer-table-wrap">
                      <table className="grid-explorer-table text-xs">
                        <thead>
                          <tr>
                            <th>Fiscal Year</th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Operating Revenue (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Generation &amp; Purchase Cost (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Govt Subsidy Received (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Net Profit / Loss (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {localBpdbAuditedFinancials.map((d, idx) => (
                            <tr key={idx}>
                              <td className="font-semibold">{d.year}</td>
                              <td className="text-left tabular-nums">{formatNumber(d.revenue)}</td>
                              <td className="text-left tabular-nums text-destructive">{formatNumber(d.cost)}</td>
                              <td className="text-left tabular-nums text-emerald-500 font-semibold">{formatNumber(d.subsidy)}</td>
                              <td className="text-left tabular-nums font-bold text-destructive">{formatNumber(d.loss)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Card Metadata Footer */}
                    <GridCardFooter>
                      <span>Source: <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Financial Reports</a></span>
                      <span>As published. Not independently audited.</span>
                      <span className="font-medium">Reporting Period: Audited Financial Statements (FY 2010 - FY 2026)</span>
                    </GridCardFooter>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Petrobangla Audited Chart */}
                  <div className="grid-explorer-chart-card card">
                    <div className="grid-explorer-chart-card__head">
                      <div>
                        <h3 className="grid-explorer-chart-card__title">Petrobangla Annual Revenue &amp; LNG Import Costs</h3>
                    <p className="grid-explorer-chart-card__sub">Audited historical financials illustrating LNG import cost burden (Crore BDT) — <span className="text-primary font-semibold text-xs">Tracked since 2010</span></p>
                      </div>
                    </div>

                    <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
                      {macroChartsReady ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart accessibilityLayer={false} data={localPetrobanglaAuditedFinancials} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                            <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                            <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                            <YAxis width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={formatAxisCrore} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                const profitLabel = d.netProfit >= 0 ? 'Net Profit' : 'Net Loss';
                                const profitColorClass = d.netProfit >= 0 ? 'text-emerald-500 font-semibold' : 'text-destructive font-semibold';
                                return (
                                  <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                    <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                      <span>Petrobangla {d.year} Financials</span>
                                      <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Audited Ledger</span>
                                    </div>
                                    <div className="space-y-2 text-[11px] md:text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Gas Sales Revenue:</span>
                                        <span className="font-bold text-foreground">{formatNumber(d.revenue)} Crore Tk</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-purple-400 font-medium inline-flex items-center gap-1"><GridProvenanceTag kind="P" />LNG Import Payments:</span>
                                        <span className="font-bold text-purple-500">{formatNumber(d.lngCost)} Crore Tk</span>
                                      </div>
                                      <div className="flex justify-between border-t border-border/30 pt-1">
                                        <span className="text-muted-foreground">{profitLabel}:</span>
                                        <span className={profitColorClass}>{formatNumber(d.netProfit)} Crore Tk</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                                      Formula: Net Income/Loss = Operating Revenue - Operational &amp; LNG Import Costs
                                    </div>
                                    <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                                      <div><strong>Source:</strong> <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Petrobangla Audited Balance Sheets</a></div>
                                      <div>As published. Not independently audited.</div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="revenue" name="Gas Sales Revenue" fill="#0ea5e9" radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Bar dataKey="lngCost" name="LNG Import Cost" fill="#a855f7" radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Line type="monotone" dataKey="netProfit" name="Net Income / Loss" stroke="#eab308" strokeWidth={3} dot={{ fill: '#eab308', r: 4 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="grid-explorer-skeleton" />
                      )}
                    </div>

                    {/* Card Metadata Footer */}
                    <GridCardFooter>
                      <span>Source: <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Petrobangla Audited Financial Accounts</a></span>
                      <span>As published. Not independently audited.</span>
                      <span className="font-medium">Reporting Period: Audited Balance Sheets (FY 2010 - FY 2026)</span>
                    </GridCardFooter>
                  </div>

                  {/* Petrobangla table */}
                  <div className="grid-explorer-chart-card card">
                    <div className="grid-explorer-table-wrap">
                      <table className="grid-explorer-table text-xs">
                        <thead>
                          <tr>
                            <th>Fiscal Year</th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Gas Sales Revenue (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">LNG Import Costs (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Net Profit / Loss (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {localPetrobanglaAuditedFinancials.map((d, idx) => (
                            <tr key={idx}>
                              <td className="font-semibold">{d.year}</td>
                              <td className="text-left tabular-nums">{formatNumber(d.revenue)}</td>
                              <td className="text-left tabular-nums text-purple-500">{formatNumber(d.lngCost)}</td>
                              <td className={cn("text-left tabular-nums font-bold", d.netProfit > 0 ? "text-emerald-500" : "text-destructive")}>
                                {formatNumber(d.netProfit)}
                              </td>
                              <td className="text-right">
                                {d.year === 'FY 18' ? (
                                  <a href="/annual-reports/financials" target="_blank" className="text-xs text-primary hover:underline font-semibold flex items-center justify-end gap-1">
                                    <FileText className="w-3 h-3" />
                                    View Full Report
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-xs italic">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Card Metadata Footer */}
                    <GridCardFooter>
                      <span>Source: <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Petrobangla Audited Financial Accounts</a></span>
                      <span>As published. Not independently audited.</span>
                      <span className="font-medium">Reporting Period: Audited Accounts Summary (FY 2010 - FY 2026)</span>
                    </GridCardFooter>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab: Global vs. Domestic Pricing Comparisons */}
          {macroSubTab === 'global' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground flex flex-col gap-2">
                <div>
                  <strong className="text-foreground">Global Benchmark Comparison:</strong> Energy cost volatility in Bangladesh is structurally linked to global commodity indexes. This dashboard tracks global benchmark pricing (Brent Crude, World Bank Gas/JKM indexes, and IRENA Solar LCOE) against domestic retail tariffs since 1975, highlighting historical subsidy periods and cost de-linkages.
                </div>
                <div className="pt-1.5 border-t border-border/30">
                  Values are converted to BDT equivalents based on historical weighted interbank exchange rates. Click citations inside tooltips to view official verified publications.
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Chart 1: Oil vs Diesel */}
                <GridBrentDieselCard
                  data={localGlobalVsDomesticData}
                  exchangeRates={localHistoricalExchangeRates}
                  chartTheme={chartTheme}
                  ready={macroChartsReady}
                />

                {/* Chart 2: Gas vs Tariff */}
                <GridLngTariffCard
                  data={localGlobalVsDomesticData.filter(x => parseInt(x.year) >= 2010)}
                  exchangeRates={localHistoricalExchangeRates}
                  chartTheme={chartTheme}
                  ready={macroChartsReady}
                />
              </div>

              {/* Chart 3: Solar LCOE vs feed in tariff */}
              <div className="grid-explorer-chart-card card max-w-full">
                <div className="grid-explorer-chart-card__head">
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff</h3>
                    <p className="grid-explorer-chart-card__sub">Global Average Solar LCOE vs. Domestic Solar Contracts (Tk/KWh) — <span className="text-primary font-semibold text-xs">Tracked since 2015</span></p>
                  </div>
                  <span className="grid-explorer-chip bg-teal-500/5 text-teal-500 border-teal-500/10">Solar Energy</span>
                </div>

                <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
                  {macroChartsReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart accessibilityLayer={false} data={localGlobalVsDomesticData.filter(x => parseInt(x.year) >= 2015)} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                        <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                        <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            const exRate = localHistoricalExchangeRates[d.year] || 122.0;
                            // globalSolar LCOE is in cents/kWh, convert to BDT: cents * exRate / 100
                            const globalSolarBdt = (d.globalSolar * exRate) / 100;
                            const premium = d.bdSolar - globalSolarBdt;
                            return (
                              <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                  <span>Solar PV Benchmarks ({d.year})</span>
                                  <span className="text-[9px] uppercase font-bold text-teal-500 tracking-wider">Solar</span>
                                </div>
                                <div className="space-y-2 text-[11px] md:text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Global Solar LCOE:</span>
                                    <span className="font-bold text-teal-500">{d.globalSolar.toFixed(2)} US Cents/KWh</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Exchange Rate:</span>
                                    <span className="font-semibold text-foreground">{exRate.toFixed(2)} Tk/$</span>
                                  </div>
                                  <div className="flex justify-between border-t border-border/20 pt-1">
                                    <span className="text-muted-foreground">Global Solar (Tk/KWh equivalent):</span>
                                    <span className="font-bold text-teal-400">{globalSolarBdt.toFixed(2)} Tk/KWh</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">BD Solar Contract Tariff:</span>
                                    <span className="font-bold text-rose-500">{d.bdSolar.toFixed(2)} Tk/KWh</span>
                                  </div>
                                  <div className="flex justify-between border-t border-border/20 pt-1 border-dashed">
                                    <span className="text-muted-foreground">Domestic Contract Premium:</span>
                                    <span className={cn("font-bold", premium >= 0 ? "text-rose-500" : "text-emerald-500")}>
                                      {premium >= 0 ? `+${premium.toFixed(2)} Tk/KWh (Premium)` : `${premium.toFixed(2)} Tk/KWh`}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2.5 pt-1.5 border-t border-border/30 text-[8px] text-muted-foreground leading-normal font-medium">
                                  <strong>Formula:</strong> <code>(Global LCOE Cents * Exchange Rate) / 100</code>
                                </div>
                                <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                                  <div><strong>Series from:</strong> IRENA renewable costs, SREDA solar registry, BPDB planning</div>
                                  <div><strong>Ref:</strong> <a href="http://www.renewableenergy.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SREDA Databases</a></div>
                                </div>
                              </div>
                            );
                          }}
                        />
                            <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="globalSolarBdt" name="Global Solar LCOE (Tk/KWh)" stroke="#14b8a6" strokeWidth={2.5} dot={{ fill: '#14b8a6', r: 3 }} />
                        <Line type="monotone" dataKey="bdSolar" name="BD Solar Tariff (Tk/KWh)" stroke="#f43f5e" strokeWidth={2.5} dot={{ fill: '#f43f5e', r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid-explorer-skeleton" />
                  )}
                  </div>

                  {/* Card Metadata Footer */}
                  <GridCardFooter>
                    <span>Source: IRENA Renewable Cost Databases &amp; BPDB Power Purchase Agreements (PPAs)</span>
                    <span>As published. Not independently audited.</span>
                    <span className="font-medium">Reporting Period: Global Cost Comparison (2015 - 2026)</span>
                  </GridCardFooter>
                </div>
              </div>
            )}

          {macroSubTab === 'reserves' && (
            <GasReserveDepletionTab
              selectedDate={selectedDate}
              systemStatsDate={systemStats?.date || 'Jun 2026'}
              pgcbGasTotal={totalGasSupply}
              chartsReady={macroChartsReady}
            />
          )}

          {macroSubTab === 'system_loss' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/* Power Sector at a Glance */}
              <div className="grid-explorer-chart-card card p-6">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border pb-3 mb-4 flex flex-col items-center text-center">
                  <Landmark className="h-6 w-6 text-primary mb-2" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title text-lg font-bold">Power Sector at a Glance</h3>
                    <p className="grid-explorer-chart-card__sub text-xs text-muted-foreground">Official key indicators of grid capacity, consumer base, transmission, and performance</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {glanceIndicators.map((stat, idx) => {
                    const Icon = stat.Icon;
                    return (
                      <div key={idx} className="p-4 bg-muted/10 border border-border/30 rounded-2xl flex items-center justify-center gap-3.5 hover:bg-muted/15 transition-all duration-200 shadow-sm group relative cursor-help">
                        <div className={`h-9 w-9 flex items-center justify-center rounded-xl ${stat.iconColor} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5 text-left font-medium">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                          <div className={`text-base font-bold ${stat.valueColor || 'text-foreground'}`}>{stat.value}</div>
                          <div className="text-[9px] text-muted-foreground leading-normal">{stat.desc}</div>
                        </div>

                        {/* Custom Tooltip */}
                        <div 
                          className="absolute text-card-foreground border border-border/80 p-4 md:p-5 rounded-2xl shadow-2xl z-[110] w-[17.5rem] md:w-80 left-1/2 -translate-x-1/2 top-[calc(100%+12px)] pointer-events-none bg-card transition-all duration-200 ease-out opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
                          style={{ backgroundColor: 'hsl(var(--card))' }}
                        >
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-t border-l border-border/80 z-[-1]" style={{ backgroundColor: 'hsl(var(--card))' }} />
                          <div className={`font-bold text-xs uppercase tracking-wider ${stat.iconColor.split(' ')[0]} border-b border-border/60 pb-1.5 mb-2 flex items-center gap-1.5 text-left`}>
                            <Icon className="h-3.5 w-3.5" /> {stat.tooltipTitle}
                          </div>
                          <div className="text-[11px] leading-relaxed text-muted-foreground font-medium whitespace-normal text-left">
                            {stat.tooltipDesc}
                            <div className="mt-3 p-2.5 rounded-lg font-semibold border border-border/40 flex justify-between items-center bg-muted/5">
                              <span className="text-[10px] text-muted-foreground uppercase">{stat.highlightLabel}</span>
                              <span className="text-xs font-bold text-foreground">{stat.highlightValue}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Distribution System Loss */}
                  <div className="col-span-2 md:col-span-4 p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/[0.03] to-transparent border border-amber-500/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 hover:border-amber-500/50 transition-all duration-300 shadow-md relative overflow-hidden group cursor-help">
                    {/* Glowing background blur bubble */}
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-300 pointer-events-none" />
                    
                    <div className="text-[10.5px] font-extrabold text-amber-500 uppercase tracking-widest">Distribution System Loss Target</div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight tabular-nums drop-shadow-sm">
                      7.35%
                    </div>
                    <div className="text-[9.5px] text-muted-foreground font-medium leading-normal max-w-[480px]">
                      Official FY 2025-26 performance target (evaluated up to April 2026)
                    </div>

                    {/* Custom Tooltip */}
                    <div 
                      className="absolute text-card-foreground border border-border/80 p-4 md:p-5 rounded-2xl shadow-2xl z-[110] w-[17.5rem] md:w-80 left-1/2 -translate-x-1/2 top-[calc(100%+12px)] pointer-events-none bg-card transition-all duration-200 ease-out opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
                      style={{ backgroundColor: 'hsl(var(--card))' }}
                    >
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-t border-l border-border/80 z-[-1]" style={{ backgroundColor: 'hsl(var(--card))' }} />
                      <div className="font-bold text-xs uppercase tracking-wider text-amber-500 border-b border-border/60 pb-1.5 mb-2 flex items-center gap-1.5 text-left">
                        <Activity className="h-3.5 w-3.5" /> Target Distribution Loss
                      </div>
                      <div className="text-[11px] leading-relaxed text-muted-foreground font-medium whitespace-normal text-left">
                        The official government performance contract target for utility-level power line distribution system losses (BPDB, BREB, DPDC, DESCO, WZPDCO, NESCO).
                        <div className="mt-3 p-2.5 rounded-lg font-semibold border border-border/40 flex justify-between items-center bg-muted/5">
                          <span className="text-[10px] text-muted-foreground uppercase">Target Deadline:</span>
                          <span className="text-xs font-bold text-foreground">June 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Metadata Footer */}
                <GridCardFooter className="mt-6">
                  <span>Source: <a href="https://powerdivision.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Ministry of Power, Energy and Mineral Resources (Power Division)</a></span>
                  <span className="font-medium">Last Updated: Sunday, June 14, 2026 at 03:39 PM</span>
                </GridCardFooter>
              </div>

              {/* Year-wise System Loss Chart */}
              <div className="grid-explorer-chart-card card p-6">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border pb-3 mb-4">
                  <Activity className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Historical System Loss Trends (T&amp;D)</h3>
                    <p className="grid-explorer-chart-card__sub">Long-term reduction curves in transmission, distribution, and overall system loss — <span className="text-primary font-semibold text-xs">Tracked since 2001</span></p>
                  </div>
                  <span className="grid-explorer-chip bg-primary/10 text-primary border-primary/20 ml-auto text-[10px] font-bold">Last Updated: Wednesday, Sep 17, 2025 at 06:01 PM</span>
                </div>

                <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                  {chartsReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={[...localSystemLossData].reverse()}
                        margin={{ top: 10, right: 5, left: -5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="fiscal_year"
                          tick={{ fontSize: 9, fill: chartTheme.axisTick }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          width={GRID_Y_AXIS_WIDTH.single}
                          tick={{ fontSize: 10, fill: chartTheme.axisTick }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={4}
                          domain={[0, 30]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="p-4 md:p-5 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs md:text-sm leading-relaxed w-80 max-w-[calc(100vw-2rem)] select-none bg-card space-y-3">
                                <div className="font-bold text-foreground border-b border-border/40 pb-1.5 flex items-center justify-between gap-2">
                                  <span>FY {d.fiscal_year} Loss Analysis</span>
                                  <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Power Cell</span>
                                </div>
                                
                                {/* Overall Metrics */}
                                <div className="space-y-1.5 text-[11px] md:text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Transmission Loss:
                                    </span>
                                    <span className="font-bold text-emerald-500 tabular-nums">{d.transmission.toFixed(2)}%</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                      Distribution Loss:
                                    </span>
                                    <span className="font-bold text-purple-500 tabular-nums">{d.distribution.toFixed(2)}%</span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-border/30 pt-1.5">
                                    <span className="text-destructive font-bold flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                      Total T&amp;D Loss:
                                    </span>
                                    <span className="font-bold text-destructive tabular-nums bg-destructive/5 px-1.5 py-0.5 rounded">{d.total_td.toFixed(2)}%</span>
                                  </div>
                                </div>

                                {/* Utility-wise Breakdown */}
                                <div className="border-t border-border/40 pt-2 space-y-1.5">
                                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Utility Distribution Loss</div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] tabular-nums">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground font-semibold">BPDB:</span>
                                      <span className="text-foreground font-bold">{d.bpdb.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground font-semibold">REB:</span>
                                      <span className="text-foreground font-bold">{d.reb.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground font-semibold">DPDC:</span>
                                      <span className="text-foreground font-bold">{d.dpdc.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground font-semibold">DESCO:</span>
                                      <span className="text-foreground font-bold">{d.desco.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between col-span-2 sm:col-span-1">
                                      <span className="text-muted-foreground font-semibold">WZPDCO:</span>
                                      <span className="text-foreground font-bold">{d.wzpdco !== null ? `${d.wzpdco.toFixed(2)}%` : '—'}</span>
                                    </div>
                                    <div className="flex justify-between col-span-2 sm:col-span-1">
                                      <span className="text-muted-foreground font-semibold">NESCO:</span>
                                      <span className="text-foreground font-bold">{d.nesco !== null ? `${d.nesco.toFixed(2)}%` : '—'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <GridRechartsLegend
                          verticalAlign="top"
                          height={36}
                          iconSize={8}
                          wrapperStyle={{ fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="total_td" name="Total T&amp;D Loss" stroke={chartTheme.destructive} fill={chartTheme.destructive} fillOpacity={0.06} strokeWidth={2.5} />
                        <Line type="monotone" dataKey="distribution" name="Distribution Loss" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="transmission" name="Transmission Loss" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid-explorer-skeleton" />
                  )}
                </div>

                {/* Card Explanation Block */}
                <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2 mt-4 rounded-xl">
                  <p><strong>Overview and Trends:</strong></p>
                  <p className="leading-relaxed">
                    Bangladesh has made significant strides in upgrading its grid performance over the last two decades. The total <strong className="text-foreground">Transmission &amp; Distribution (T&amp;D) system loss</strong> dropped from a peak of <strong className="text-foreground">27.97% in FY 2001-02</strong> to <strong className="text-foreground">{systemLossData[0].total_td}% in FY {systemLossData[0].fiscal_year}</strong>.
                  </p>
                  <p className="leading-relaxed">
                    This rationalization was driven primarily by massive investments in prepaid metering, distribution substation reinforcement, and the conversion of low-voltage overhead lines to underground circuits in urban pockets. Technical transmission loss (high-voltage line resistance) has remained stable between <strong className="text-foreground">2.6% and 4.0%</strong> during this period.
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <div className="grid-explorer-chart-card card p-6">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border pb-3 mb-4">
                  <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Year-wise System Loss Statistics</h3>
                    <p className="grid-explorer-chart-card__sub">Audit-verified utility-wise and overall grid system loss records — <span className="text-primary font-semibold text-xs">Tracked since 2001</span></p>
                  </div>
                </div>

                <div className="grid-explorer-table-wrap">
                  <table className="grid-explorer-table text-xs text-center">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-2.5 text-center">FY</th>
                        <th className="py-2.5 text-center">BPDB</th>
                        <th className="py-2.5 text-center">REB</th>
                        <th className="py-2.5 text-center">DPDC</th>
                        <th className="py-2.5 text-center">DESCO</th>
                        <th className="py-2.5 text-center">WZPDCO</th>
                        <th className="py-2.5 text-center">NESCO</th>
                        <th className="py-2.5 text-center font-bold text-purple-600 dark:text-purple-400">
                          <span className="inline-flex items-center gap-1">Distribution<GridProvenanceTag kind="P" /></span>
                        </th>
                        <th className="py-2.5 text-center font-semibold text-emerald-500">
                          <span className="inline-flex items-center gap-1">Transmission<GridProvenanceTag kind="P" /></span>
                        </th>
                        <th className="py-2.5 text-center font-bold text-destructive">
                          <span className="inline-flex items-center gap-1">Total T&amp;D<GridProvenanceTag kind="P" /></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10 font-medium tabular-nums text-foreground">
                      {localSystemLossData.map((d) => (
                        <tr key={d.fiscal_year} className="hover:bg-muted/5 transition-colors">
                          <td className="py-2.5 font-bold text-foreground">{d.fiscal_year}</td>
                          <td className="py-2.5">{d.bpdb.toFixed(2)}%</td>
                          <td className="py-2.5">{d.reb.toFixed(2)}%</td>
                          <td className="py-2.5">{d.dpdc.toFixed(2)}%</td>
                          <td className="py-2.5">{d.desco.toFixed(2)}%</td>
                          <td className="py-2.5">{d.wzpdco !== null ? `${d.wzpdco.toFixed(2)}%` : '—'}</td>
                          <td className="py-2.5">{d.nesco !== null ? `${d.nesco.toFixed(2)}%` : '—'}</td>
                          <td className="py-2.5 text-purple-600 dark:text-purple-400 font-semibold">{d.distribution.toFixed(2)}%</td>
                          <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">{d.transmission.toFixed(2)}%</td>
                          <td className="py-2.5 text-destructive font-bold bg-destructive/5">{d.total_td.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <GridCardFooter className="mt-4">
                  <span>Source: <a href="http://www.powercell.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Power Cell, Ministry of Power, Energy and Mineral Resources</a></span>
                  <span>
                    Every column is Power Cell&apos;s own published figure, the Total T&amp;D
                    included — it is not our sum of the two columns beside it, and would not
                    match one: losses compound rather than add, so 7.38% distribution and
                    3.04% transmission give a 10.13% total, not 10.42%.
                  </span>
                  <span>Report Period: Year-wise Consolidated Audit (FY 2002 - FY 2025)</span>
                </GridCardFooter>
              </div>
            </div>
          )}

          {macroSubTab === 'verification' && <PublishedVsDerivedTab latestGridDay={latestDate} />}

          {macroSubTab === 'insights' && (
            <div className="space-y-6 grid-explorer-subpanel">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-muted-foreground flex flex-col gap-2">
                <div>
                  <strong className="text-primary font-bold">Analyst &amp; Investor Advisory:</strong> This advisory panel integrates audited financial statements, central bank weighted exchange rate data, and Petrobangla production filings to isolate critical financial clues, cash-flow risks, and industrial utilization metrics for energy sector analysts and public equity investors.
                </div>
                <div className="text-[11px] leading-relaxed border-t border-primary/20 pt-2">
                  <strong className="text-foreground">Read the D tags on this tab more cautiously than elsewhere.</strong>{' '}
                  On the other Macro tabs D means a plain calculation from a published
                  figure. Several numbers here are <em>estimates</em> — ranges and
                  approximations drawn from sector reporting rather than computed from a
                  single stated source. They carry D because they are ours, not because
                  the arithmetic can be retraced. Anything marked{' '}
                  <GridProvenanceTag kind="P" /> is a published figure as usual.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
                    <DollarSign className="h-5 w-5 text-amber-500" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">Listed IPPs Receivables &amp; Working Capital Risk</h4>
                      <p className="text-[10px] text-muted-foreground">Analysis for Summit Power, Baraka, United Power equity holders</p>
                    </div>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />BPDB Arrears Payment Aging:</span>
                      <span className="font-semibold text-destructive">150 - 180 Days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Est. System Outstanding Arrears:</span>
                      <span className="font-semibold text-foreground">~26,500 Crore BDT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Working Capital Interest Rate:</span>
                      <span className="font-semibold text-foreground">12.5% - 14.5% (Weighted Average)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/90 leading-relaxed pt-1.5 border-t border-border/20">
                      <strong>Analytical Insight:</strong> Due to BPDB&apos;s treasury deficit, payment aging to private Independent Power Producers (IPPs) has inflated from 60 days to over 150 days. Listed IPPs carry heavy receivables on their balance sheets, forcing reliance on high-interest working capital loans (up to 14.5% in 2026), which compresses net profit margins and dilutes dividend payout capacity.
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-border/20 text-[10px] text-muted-foreground/80 flex flex-wrap justify-between gap-x-2 gap-y-1">
                    <span>Source: <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Finance Reports</a></span>
                    <span>As published. Not independently audited.</span>
                    <span className="font-medium">Reporting Date: Jun 2026</span>
                  </div>
                </div>

                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
                    <Globe className="h-5 w-5 text-sky-500" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">Forex Exposure &amp; Currency Devaluation Burden</h4>
                      <p className="text-[10px] text-muted-foreground">Macro-economic impact on national fuel imports</p>
                    </div>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />6-Year Devaluation Trend (BDT/USD):</span>
                      <span className="font-semibold text-destructive">+43.70% (84.90 to 122.00)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Dollar-Denominated Gas Reliance:</span>
                      <span className="font-semibold text-foreground">~73.2% of supply (IOCs + LNG)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Est. Daily Currency Surcharge:</span>
                      <span className="font-semibold text-foreground">1.8 Crore BDT / Tk-devaluation</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/90 leading-relaxed pt-1.5 border-t border-border/20">
                      <strong>Analytical Insight:</strong> With over 73.2% of national gas supply linked to USD pricing (comprising Chevron IOC fields at ~35.1% and RPGCL LNG terminals at ~38.1%), devaluations increase BDT wholesale costs. Each 1 BDT depreciation against the USD inflates daily imported fuel overheads by ~1.8 Crore BDT, driving the structural deficit at BPDB and Petrobangla.
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-border/20 text-[10px] text-muted-foreground/80 flex flex-wrap justify-between gap-x-2 gap-y-1">
                    <span>Source: <a href="https://www.bb.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Bangladesh Bank Exchange Stats</a></span>
                    <span>Rates as published by Bangladesh Bank. Not independently verified.</span>
                    <span className="font-medium">Reporting Date: Jun 2026</span>
                  </div>
                </div>

                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
                    <Activity className="h-5 w-5 text-rose-500" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">Industrial Gas Shortage &amp; Corporate Earnings Clues</h4>
                      <p className="text-[10px] text-muted-foreground">Earnings impact on listed steel, cement, and textile mills</p>
                    </div>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />National Gas Deficit:</span>
                      <span className="font-semibold text-destructive">30.33% (~1,150 MMCFD short)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Industrial Zone Plant Utilization:</span>
                      <span className="font-semibold text-foreground">55% - 70% (Pressure drop below 2 psi)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Operating Margin Impact (bps):</span>
                      <span className="font-semibold text-destructive">-300 to -450 bps</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/90 leading-relaxed pt-1.5 border-t border-border/20">
                      <strong>Analytical Insight:</strong> Listed manufacturing giants (e.g. BSRM, GPH Ispat, LafargeHolcim) face pressure drops in industrial grids. Running factories at only 55-70% utilization forces the purchase of expensive alternative fuels (LPG and Diesel), compressing operating margins by up to 450 bps and directly impacting listed industrial earnings.
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-border/20 text-[10px] text-muted-foreground/80 flex flex-wrap justify-between gap-x-2 gap-y-1">
                    <span>Source: <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Petrobangla Bulletins</a></span>
                    <span>As published. Not independently audited.</span>
                    <span className="font-medium">Reporting Date: Jun 2026</span>
                  </div>
                </div>

                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
                    <Zap className="h-5 w-5 text-emerald-500" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">Grid Capacity Margin &amp; Overcapacity Charges</h4>
                      <p className="text-[10px] text-muted-foreground">The operational driver of the national power subsidy</p>
                    </div>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Installed National Grid Capacity:</span>
                      <span className="font-semibold text-foreground">28,420 MW</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Peak Daily Grid Load (Evening):</span>
                      <span className="font-semibold text-foreground">16,154.41 MW</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Surplus Unutilized Capacity:</span>
                      <span className="font-semibold text-amber-500">43.16% (12,266 MW idle)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/90 leading-relaxed pt-1.5 border-t border-border/20">
                      <strong>Analytical Insight:</strong> Bangladesh operates with a surplus capacity of 43.16%. While providing base-load security, it triggers contractually binding &quot;capacity charges&quot; paid to idle private power plants. These structural capacity charges cost the state an estimated 1.88 Crore BDT daily, driving BPDB&apos;s 39,000 Crore BDT operating subsidy requirement.
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-border/20 text-[10px] text-muted-foreground/80 flex flex-wrap justify-between gap-x-2 gap-y-1">
                    <span>Source: <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Financials</a></span>
                    <span>As published. Not independently audited.</span>
                    <span className="font-medium">Reporting Date: Jun 2026</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        );
      })()}
      </div>

      {/* Footer / Notes */}
      <div className="mt-8 p-4 bg-muted/10 border border-border/30 rounded-2xl text-[10px] text-muted-foreground/80 leading-relaxed space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-3">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-bold text-foreground">Data Reporting Standards &amp; Attributions</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground/70 text-[9.5px]">
            <span>Report Period: <span className="font-semibold text-foreground">{systemStats.date}</span></span>
            <span>·</span>
            <span>All data scraped from verified official daily publications.</span>
          </div>
        </div>

        {/*
          The documents behind this day, named. "Source: PGCB Daily Report" is an
          attribution; the filename is what lets a reader request the same file
          and check the figure themselves.
        */}
        {(sourceFiles?.pgcb || sourceFiles?.petrobangla) && (
          <div className="pt-2.5 border-t border-border/20">
            <GridSourceFiles
              files={[
                { label: 'PGCB', name: sourceFiles?.pgcb },
                { label: 'Petrobangla', name: sourceFiles?.petrobangla },
              ]}
            />
            {!sourceFiles?.petrobangla && (
              <span className="ml-2 text-[10px] text-muted-foreground/70">
                No Petrobangla gas report is held for this day.
              </span>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="font-semibold text-foreground text-[10.5px]">Backlog Reactivity &amp; Updates</div>
            <div className="space-y-1 text-muted-foreground/75">
              <div className="flex items-start gap-1.5">
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md shrink-0 mt-0.5">Daily</span>
                <span>Data updates daily, fully reactive to daily backlog selections.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-md shrink-0 mt-0.5">Monthly</span>
                <span>Data updates monthly (SREDA installed capacity is static/monthly and unaffected by daily backlog, while actual renewable generation output updates daily).</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="font-semibold text-foreground text-[10.5px]">Source Directories</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground/90 font-semibold">
              <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">PGCB/NLDC Operations</a>
              <span>·</span>
              <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Petrobangla Reports</a>
              <span>·</span>
              <a href="http://www.renewableenergy.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">SREDA Database</a>
              <span>·</span>
              <a href="https://bpc.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">BPC Pricing</a>
            </div>
            <div className="text-[9.5px] text-muted-foreground/60 border-t border-border/10 pt-1.5">
              Sources: BPDB, PGCB, SREDA, BERC, Petrobangla. Figures are indicative and editor-managed unless noted. Member downloads are logged for reference.
            </div>
          </div>
        </div>
      </div>
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">National Power Grid Audit Report</h1>
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
          <div className="text-lg font-bold text-foreground mt-1">{formatUnitRate(systemStats.avgProductionCost)} Tk/KWh</div>
        </div>
      </div>

      {/* Section 1: Daily Generation Mix & Fuel Audits */}
      <div className="space-y-4 page-break-inside-avoid">
        <h2 className="text-lg font-bold border-b border-border pb-1.5 flex items-center gap-1.5 text-primary">
          <Zap className="h-4 w-4" /> 1. Daily Generation Mix & Fuel Audits
        </h2>
        <table className="print-report-table w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="text-left py-1.5 px-2 font-bold">Fuel Type</th>
              <th className="text-right py-1.5 px-2 font-bold">Output (MKWh)</th>
              <th className="text-right py-1.5 px-2 font-bold">Daily Cost (BDT)</th>
              <th className="text-right py-1.5 px-2 font-bold">Unit Cost (Tk/KWh)</th>
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
          <Droplet className="h-4 w-4" /> 2. Gas Distribution & LNG Supply
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
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Power and Industry Distribution</h3>
            <table className="print-report-table w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-1.5 px-2">Distributor</th>
                  <th className="text-right py-1.5 px-2">Power (MMCFD)</th>
                  <th className="text-right py-1.5 px-2">Industry / Other</th>
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
          <Cable className="h-4 w-4" /> 3. Regional Grid Performance & Outage Logs
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

      {/* Section 4: Infrastructure Assets & Planning Tracker */}
      <div className="space-y-4 page-break-inside-avoid">
        <h2 className="text-lg font-bold border-b border-border pb-1.5 flex items-center gap-1.5 text-primary">
          <Database className="h-4 w-4" /> 4. Infrastructure Assets & Planning Tracker
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Transmission Grid Assets</h3>
            <table className="print-report-table w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-1.5 px-2">Line Asset</th>
                  <th className="text-left py-1.5 px-2">Owner</th>
                  <th className="text-right py-1.5 px-2">Capacity</th>
                  <th className="text-right py-1.5 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {/*
                  No hardcoded fallback. This used to fall back to four invented
                  lines — including load factors of 74%, 82% and 90% that no
                  source publishes — beneath a "PGCB System Operations & NLDC"
                  attribution, so an empty dataset produced a sourced-looking
                  table of figures nobody had measured. An empty tracker is a
                  true statement about what we hold; that was not. The same
                  three percentages then resurfaced from the DB seed, so the
                  Load column itself is now gone: no agency publishes per-line
                  loading, and this table no longer shows any.
                */}
                {(initialLines ?? []).map((line: any, idx: number) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1 px-2 font-medium">{line.name}</td>
                    <td className="py-1 px-2">{line.owner}</td>
                    <td className="text-right py-1 px-2 tabular-nums">{line.capacity}</td>
                    <td className="text-right py-1 px-2 text-muted-foreground">{line.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(initialLines ?? []).length === 0 && (
              <div className="text-[9px] text-muted-foreground mt-1 px-1 italic">
                No transmission asset records are loaded for this report.
              </div>
            )}
            <div className="text-[8px] text-muted-foreground mt-1 px-1">
              Source: PGCB System Operations &amp; NLDC National Grid Map
            </div>
          </div>

          {/*
            "Upcoming Generation Projects" removed 2026-08-11. It listed four
            projects — "SREDA 1800 MW Solar+Wind (Tender, Q3 2026)", Matarbari
            Phase-2, a Payra expansion and a BREB programme — with statuses and
            dates hardcoded in this file, carrying no source line and traceable
            to no publication. SREDA's own database publishes 14 solar parks
            totalling 745.25 MWp, so the headline figure contradicted the agency
            it named. A project pipeline belongs here only once it is read from
            something a reader can check.
          */}
        </div>
      </div>

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
                  <div>Net System Cost = Total Net Energy Generated (MKWh) × Avg Production Cost (Tk/KWh) × 10,000,000</div>
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
                  <div>Gross Cost = Sum of [Individual Fuel Gross Generation (MKWh) × Estimated Fuel Unit Rate (Tk/KWh) × 1,000,000]</div>
                  <div className="text-muted-foreground mt-1 text-[9px]">※ Reflected directly in the fuel/import cost breakdown bars.</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 text-[11px] leading-relaxed space-y-1 text-muted-foreground/80">
              <p className="font-semibold text-foreground">Why do the values differ?</p>
              <p>
                PGCB's daily grid reports list Net System generation separately from Gross Station generation. The difference is the <strong>Grid Dispatch Loss &amp; Aux overhead</strong>. For instance, on July 24, 2024, Gross Generation was <strong>345.90 MKWh</strong> (leading to a gross cost of 217.24 Crore Tk.), while Net Grid Dispatch was <strong>315.27 MKWh</strong> (representing a net cost of 174.2 Crore Tk. under PGCB's bulk system average tariff of 5.526 Tk/KWh).
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