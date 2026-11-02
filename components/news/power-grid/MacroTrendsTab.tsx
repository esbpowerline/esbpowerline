'use client';

/**
 * Macro Trends — the ten-sub-tab long-run section, split out of
 * PowerGridExplorer so its ~2,800 lines (and the macro data tables baked into
 * them) load only when the tab is opened. The parent keeps `macroSubTab`
 * because the URL syncer reads it; everything else macro-owned lives here.
 */

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Zap, Activity, Cable, TrendingUp, FileText, BarChart3, DollarSign, Database,
  Globe, ChevronDown, Check, Info, Network, Calendar, History, Landmark,
  ShieldCheck, AlertTriangle, Droplet, Factory, Sun,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Line, CartesianGrid, Area, ComposedChart,
} from 'recharts';
import { cn, formatNumber, formatUnitRate, formatBdtAmount } from '@/lib/utils';
import { type ChartTheme } from '@/hooks/useChartTheme';
import type { GridDailyData } from '@/lib/data/grid/types';
import { axisTickStyle, chartGridProps } from '@/lib/data/grid/chart-axis';
import { getLatestMonthlyDateKey } from '@/lib/data/companies/pgcb';
import {
  usePgcbMonthlyEvents,
  usePgcbMonthlyRecord,
  usePgcbMonthlySeries,
} from '@/lib/data/companies/usePgcbMonthly';
import { PgcbMonthlyDetail } from '@/components/news/power-grid/PgcbMonthlyDetail';
import { bpdbAuditedFinancials, BPDB_FINANCIALS_COVERAGE_NOTE } from '@/lib/data/companies/bpdb';
import { macroTariffData, LATEST_BPDB_AUDIT, BERC_BULK_RANGE } from '@/lib/data/macro/tariff';
import { macroGasData } from '@/lib/data/macro/gas';
import { macroEconomicData, petrobanglaAuditedFinancials, PETROBANGLA_SERIES_COVERAGE_NOTE } from '@/lib/data/macro/economics';
import { globalVsDomesticData, historicalExchangeRates } from '@/lib/data/macro/fuel-prices';
import { macroInfrastructureData } from '@/lib/data/macro/infrastructure';
import { nationalBudgetData } from '@/lib/data/macro/budget';
import { systemLossData } from '@/lib/data/macro/system-loss';
import {
  PGCB_MONTHLY_VERIFICATION,
  staleRowsFor,
  monthLabel,
} from '@/lib/data/pgcb-monthly-verification';
import { CustomDropdown, TakaIcon } from '@/components/news/power-grid/shared';
import {
  GridChartFrame,
  GridRechartsLegend,
  GRID_CHART_MARGIN,
  GRID_EXPLORER_CHART_MARGIN,
  GRID_X_AXIS_PADDING,
  GRID_Y_AXIS_WIDTH,
  REGIONAL_ZONE_COLORS,
  gridChartSplitUnitTick,
  BDT_TO_CRORE,
  formatAxisCrore,
  formatAxisMw,
  formatAxisMmcfd,
  formatPgcbMonthlyTick,
  gridChartAxisTick,
  gridChartXAxisProps,
  gridChartYAxisProps,
  GridRechartsTooltip,
  useNarrowChartCard,
} from '@/components/news/PowerGridChartUI';
import { DailyBadge, GridCardFooter, GridProvenanceTag, GridSourceFiles, MonthlyBadge } from '@/components/news/power-grid/GridExplorerUI';
import { MobileFold } from '@/components/news/power-grid/MobileFold';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';
import { FuelImportCostCard, MacroPressureCard } from '@/components/news/power-grid/MacroPricingDriverCards';
import {
  SERIES_COLORS,
  SERIES_UNMAPPED,
  STATUS_COLORS,
  CHART_INK,
} from '@/lib/data/grid/chart-palette';

const GasReserveDepletionTab = dynamic(
  () => import('@/components/news/power-grid/GasReserveDepletionTab').then((m) => m.GasReserveDepletionTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" /> },
);
const LongitudinalStudyCharts = dynamic(
  () => import('@/components/news/power-grid/LongitudinalStudy').then((m) => m.LongitudinalStudyCharts),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-80 rounded-2xl" /> },
);
const PublishedVsDerivedTab = dynamic(
  () => import('@/components/news/power-grid/PublishedVsDerivedTab').then((m) => m.PublishedVsDerivedTab),
  { ssr: false, loading: () => <div className="grid-explorer-skeleton h-96 rounded-2xl" /> },
);

const TREND_CONTROL_SIZE = 'w-full sm:w-44 min-h-11';
const TREND_TOGGLE_CLASS = cn(
  TREND_CONTROL_SIZE,
  'flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 shadow-sm',
);

import {
  GridBrentDieselCard,
  GridLngTariffCard,
} from '@/components/news/power-grid/GlobalVsDomesticCards';

type GridAccessLike = {
  isStaff: boolean;
  isMember: boolean;
  tier: string | null | undefined;
};

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
type MacroSubTabId =
  | 'overview' | 'budget' | 'monthly' | 'pricing' | 'global'
  | 'reports' | 'reserves' | 'system_loss' | 'insights' | 'verification';

export function MacroTrendsTab({
  macroSubTab,
  handleSubTabClick,
  systemStats,
  totalGasSupply,
  selectedDate,
  latestDate,
  chartTheme,
  chartsReady,
  gridAccess,
}: {
  macroSubTab: MacroSubTabId;
  handleSubTabClick: (id: MacroSubTabId) => void;
  systemStats: GridDailyData['systemStats'] | null | undefined;
  totalGasSupply: number;
  selectedDate: string;
  latestDate: string;
  chartTheme: ChartTheme;
  chartsReady: boolean;
  gridAccess: GridAccessLike;
}) {
  const macroChartsReady = true;
  // Phone/tablet: the sub-tab bar is one swipeable row (CSS .ge-macro-subtabs);
  // bring the active chip into view so a deep link (?macro=system_loss) or a tap
  // near the edge never leaves the selected chip off-screen. Only scrolls the
  // bar horizontally, never the page.
  const subNavRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const nav = subNavRef.current;
    const chip = nav?.querySelector<HTMLElement>('[data-active="true"]');
    if (!nav || !chip || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [macroSubTab]);
  const [reportsCompany, setReportsCompany] = useState<'bpdb' | 'petrobangla'>('bpdb');
  const nationalBudgetMergedData = useMemo(() => {
    const infraByYear = Object.fromEntries(
      macroInfrastructureData.map((row) => [row.fiscal_year, row]),
    );
    return nationalBudgetData.map((budgetRow) => ({
      ...budgetRow,
      ...(infraByYear[budgetRow.fiscal_year] ?? {}),
    }));
  }, []);
  const [pricingCompareYear, setPricingCompareYear] = useState<string>('FY 2020');
  const [hoveredZoneIndex, setHoveredZoneIndex] = useState<number | null>(null);

  // PGCB Monthly Archives States.
  // The archive is fetched on demand rather than bundled, so it only downloads
  // once Macro Trends is opened. `pgcbMonthlyData` is the chart/KPI series;
  // per-month detail comes from usePgcbMonthlyRecord below.
  const { series: pgcbMonthlyData, loading: pgcbMonthlyLoading } = usePgcbMonthlySeries(true);
  const [selectedMonthlyKey, setSelectedMonthlyKey] = useState<string>('');
  const latestMonthlyKey = getLatestMonthlyDateKey(pgcbMonthlyData);

  // Land on the newest month once the archive arrives, without clobbering a pick.
  useEffect(() => {
    if (!selectedMonthlyKey && latestMonthlyKey) setSelectedMonthlyKey(latestMonthlyKey);
  }, [selectedMonthlyKey, latestMonthlyKey]);

  const { record: selectedMonthlyRecord } = usePgcbMonthlyRecord(selectedMonthlyKey, true);

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

  // Click outside listener for this tab's dropdowns.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
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

  return (() => {
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
            Icon: TakaIcon,
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
        <div className="grid-explorer-panel ge-macro space-y-6">
          {isTruncated && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-start gap-3">
                <History className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-500">Historical Preview Mode</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    You are viewing a {activeAllowedYears}-year preview of the macro trends. {gridAccess.isMember ? 'Upgrade your plan' : 'Subscribe'} to unlock the full historical backlog (you are missing {activeHiddenPercentage}% of the data spanning 15+ years).
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Sub-tab Navigation */}
          <div id="macro-subtabs-nav" ref={subNavRef} className="ge-macro-subtabs flex flex-wrap gap-1.5 border-b border-border/40 pb-3">
            {/* Sub-tab order mirrors the questions a reader brings to the
                long-run story, in sequence: what is the trend (Overview) →
                show me the measured history (Monthly Archives) → will the gas
                run out (Reserve Depletion — the sector's defining forward
                question, so it sits early, not buried) → what will power cost
                (Pricing) → how does that compare abroad (Global) → what is
                the state spending (Budget) → are the utilities solvent
                (Annual Reports) → the system-wide scorecard (Glance & Losses)
                → what the market reads into it (Insights) → and last, can
                these numbers be trusted (Published vs Derived). */}
            {[
              { id: 'overview', label: 'Macro Overview', icon: BarChart3 },
              { id: 'monthly', label: 'PGCB Monthly Archives', icon: FileText },
              { id: 'reserves', label: 'Gas Reserve Depletion', icon: Database },
              { id: 'pricing', label: 'Pricing & Drivers', icon: TrendingUp },
              { id: 'global', label: 'Global vs. Domestic', icon: Globe },
              { id: 'budget', label: 'National Budget & Infra', icon: Landmark },
              { id: 'reports', label: 'Annual Reports', icon: FileText },
              { id: 'system_loss', label: 'Sector Glance & Losses', icon: Activity },
              { id: 'insights', label: 'Analyst & Investor Insights', icon: TakaIcon },
              { id: 'verification', label: 'Published vs Derived', icon: ShieldCheck }
            ].map((t) => {
              const SubIcon = t.icon;
              const active = macroSubTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-active={active ? 'true' : undefined}
                  onClick={() => handleSubTabClick(t.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-150",
                    active
                      ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                      : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <SubIcon className="h-3.5 w-3.5 shrink-0" />
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
            <MobileFold title="What P and D mean here" className="ge-macro-pd-fold">
            <div className="p-3 rounded-2xl bg-muted/10 border border-border/30 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
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
            </MobileFold>
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
                    <p className="grid-explorer-chart-card__sub">Power sector fiscal allocation (Crore BDT) plotted against installed capacity and peak generation (MW) — <span className="text-primary font-semibold text-xs">Tracked since 2011</span></p>
                  </div>
                  <span className="grid-explorer-chip bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ml-auto">FY 2011 - 2027</span>
                </div>

                <GridChartFrame
                  className="mt-4"
                  legend={[
                    { id: 'budget', label: 'Power Budget (Cr Tk)', color: SERIES_COLORS.powerBudget, variant: 'bar' },
                    { id: 'cap', label: 'Installed Cap. (MW)', color: SERIES_COLORS.installedCapacity, variant: 'line' },
                    { id: 'peak', label: 'Peak Gen. (MW)', color: SERIES_COLORS.peakGeneration, variant: 'line' },
                  ]}
                >
                  <ComposedChart role="img" aria-label="National Budget vs Capacity and Peak Generation, chart"
                    accessibilityLayer={false}
                    data={localNationalBudgetMergedData}
                    margin={GRID_CHART_MARGIN.dualAxis}
                    barCategoryGap="18%"
                  >
                        <defs>
                          <linearGradient id="budget-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={SERIES_COLORS.powerBudget} stopOpacity={0.85} />
                            <stop offset="100%" stopColor={SERIES_COLORS.powerBudget} stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
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
                              <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 select-none bg-card">
                                <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-3 flex items-center justify-between gap-2">
                                  <span>{d.fiscal_year} Financials</span>
                                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider inline-flex items-center gap-1"><GridProvenanceTag kind="P" />{d.percentage}% of Budget</span>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Fiscal Allocation</div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="inline-flex items-center gap-1" style={{ color: SERIES_COLORS.powerBudget }}><GridProvenanceTag kind="P" />Power &amp; Energy Budget:</span>
                                      <span className="font-bold" style={{ color: SERIES_COLORS.powerBudget }}>{d.power_energy_allocation_crore_tk} Cr Tk</span>
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
                                      <span className="font-bold" style={{ color: SERIES_COLORS.installedCapacity }}>{d.installed_capacity_mw} MW</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-1">
                                      <span>Peak Generation:</span>
                                      <span className="font-bold" style={{ color: SERIES_COLORS.peakGeneration }}>{d.peak_generation_mw} MW</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar yAxisId="left" dataKey="power_energy_allocation_crore_tk" name="Power Budget (Cr Tk)" fill="url(#budget-grad)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                        <Line yAxisId="right" type="monotone" dataKey="installed_capacity_mw" name="Installed Cap. (MW)" stroke={SERIES_COLORS.installedCapacity} strokeWidth={2.5} dot={{ stroke: SERIES_COLORS.installedCapacity, strokeWidth: 2, fill: CHART_INK.surface.light, r: 3.5 }} activeDot={{ r: 5 }} />
                        <Line yAxisId="right" type="monotone" dataKey="peak_generation_mw" name="Peak Gen. (MW)" stroke={SERIES_COLORS.peakGeneration} strokeWidth={2.5} dot={{ stroke: SERIES_COLORS.peakGeneration, strokeWidth: 2, fill: CHART_INK.surface.light, r: 3.5 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </GridChartFrame>
                
                <MobileFold title="What is being shown?"><div className="grid-explorer-chart-note bg-muted/10 p-4 text-xs text-muted-foreground space-y-2">
                  <p><strong>What is being shown?</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong style={{ color: SERIES_COLORS.powerBudget }}>Power Sector Budget (Crore BDT):</strong> The total fiscal allocation dedicated specifically to the Ministry of Power, Energy and Mineral Resources each fiscal year.</li>
                    <li><strong style={{ color: SERIES_COLORS.installedCapacity }}>Installed Capacity</strong> vs <strong style={{ color: SERIES_COLORS.peakGeneration }}>Peak Generation (MW)</strong>: The physical manifestation of those budgets—showing how much total capacity was built versus how much was actually utilized during peak hours.</li>
                  </ul>
                  <p className="mt-2 pt-2 border-t border-border/30">
                    <strong>Analytical Insight:</strong> While fiscal allocation to the power sector has historically risen, the proposed FY2026-27 budget allocation dropped sharply to 17,345 Crore BDT (~1.85% of total national budget). This contraction signals a major policy pivot: the government is shifting focus away from massive capacity expansions to reviewing existing power purchase agreements (PPAs), reducing subsidies, and eliminating high capacity payments for underutilized plants.
                  </p>
                </div></MobileFold>

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
              <ChartDataTable
                caption="National Budget vs Capacity and Peak Generation, chart"
                categoryHeader="Fiscal year"
                categories={(localNationalBudgetMergedData).map((d) => String(d.fiscal_year))}
                series={[
                  { label: "Power Budget (Cr Tk)", values: columnOf(localNationalBudgetMergedData, 'power_energy_allocation_crore_tk') },
                  { label: "Installed Cap. (MW)", values: columnOf(localNationalBudgetMergedData, 'installed_capacity_mw') },
                  { label: "Peak Gen. (MW)", values: columnOf(localNationalBudgetMergedData, 'peak_generation_mw') },
                ]}
              />

              {/* Historical Pricing Analysis Section (Moved from Gen tab) */}
              <div className="grid-explorer-chart-card card">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Historical Pricing &amp; Tariff Comparison</h3>
                    <p className="grid-explorer-chart-card__sub">BPDB&apos;s audited cost of supply per unit against its average bulk tariff — <span className="text-primary font-semibold text-xs">BPDB annual reports</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60 text-xs bg-muted/10 border border-border/40 mx-4 mt-4 mb-2 rounded-xl shadow-sm overflow-visible">
                  {[
                    {
                      Icon: Zap,
                      iconColor: "text-primary",
                      label: "Bulk since 4 Jun 2026:",
                      value: `${BERC_BULK_RANGE} Tk/kWh`,
                      valueColor: "text-primary",
                      tooltipTitle: "BERC Order 2026/01",
                      tooltipDesc: "Since 4 June 2026 BERC fixes the bulk rate per distributor and per voltage (Reconsideration Order 2026/01, Appendix-ka), so there is no single national figure. Shown: the lowest to the highest rate in the order.",
                      highlightLabel: "Per utility & voltage",
                      highlightValue: `${BERC_BULK_RANGE} Tk/kWh`,
                      highlightStyles: "bg-primary/10 text-primary border-primary/20",
                      roundedClasses: "rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none"
                    },
                    {
                      Icon: History,
                      iconColor: "text-orange-500",
                      label: `Audited, FY ${LATEST_BPDB_AUDIT.fy}:`,
                      value: `${LATEST_BPDB_AUDIT.cost?.toFixed(2) ?? '—'} Tk/kWh`,
                      valueColor: "text-orange-600 dark:text-orange-400",
                      tooltipTitle: "BPDB Annual Report",
                      tooltipDesc: `BPDB's printed bulk supply cost per unit — generation plus power bought, per unit sold in bulk — for FY ${LATEST_BPDB_AUDIT.fy}, the latest year it has published. Beside it, the average bulk tariff BPDB printed for the same year.`,
                      highlightLabel: "Average bulk tariff",
                      highlightValue: `${LATEST_BPDB_AUDIT.tariff?.toFixed(2) ?? '—'} Tk/kWh`,
                      highlightStyles: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
                      roundedClasses: ""
                    },
                    {
                      Icon: TrendingUp,
                      iconColor: "text-destructive",
                      label: "Daily Fuel Cost:",
                      value: `${formatUnitRate(systemStats?.avgProductionCost ?? 0)} Tk/kWh`,
                      valueColor: "text-foreground",
                      tooltipTitle: "PGCB, latest day",
                      tooltipDesc: "PGCB's fuel cost per unit for the day shown — fuel only, with no capacity payments or purchased power, so it is not comparable with the audited cost or with a bulk tariff.",
                      highlightLabel: "Measure",
                      highlightValue: "Fuel only, daily",
                      highlightStyles: "bg-destructive/10 text-destructive border-destructive/20",
                      roundedClasses: "rounded-b-xl sm:rounded-r-xl sm:rounded-bl-none"
                    }
                  ].map((stat, idx) => (
                    <div key={idx} className={`flex items-center justify-center gap-2 cursor-help group relative px-4 py-3.5 hover:bg-muted/20 transition-colors duration-200 ${stat.roundedClasses}`}>
                      <stat.Icon className={`h-4 w-4 ${stat.iconColor} transition-colors duration-200 group-hover:opacity-90`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors duration-200 leading-none mt-0.5">
                        {stat.label}
                      </span>
                      <div className="text-primary font-semibold text-xs mt-0.5 select-none">As published</div>
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
                    { id: 'tariff', label: 'Avg Bulk Tariff (Tk/kWh)', color: chartTheme.primary, variant: 'bar' },
                    { id: 'cost', label: 'BPDB Supply Cost (Tk/kWh)', color: chartTheme.destructive, variant: 'line' },
                  ]}
                >
                  <ComposedChart role="img" aria-label="Historical Pricing and Tariff Comparison, chart" accessibilityLayer={false} data={localMacroTariffData} margin={GRID_CHART_MARGIN.legend} barCategoryGap="20%">
                        <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                            const deficit = d.cost == null || d.tariff == null ? null : (d.cost - d.tariff).toFixed(2);
                            return (
                              <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-80 select-none bg-card">
                                <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                  <span>{d.year} Financials</span>
                                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Deficit Gap</span>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between flex-col mb-2">
                                    <span className="text-muted-foreground font-semibold">Average Bulk Tariff (BPDB audit):</span>
                                    <span className="font-bold text-foreground mt-0.5 tabular-nums">{d.tariff == null ? 'not printed' : `${d.tariff.toFixed(2)} Tk/kWh`}</span>
                                  </div>
                                  <div className="flex justify-between flex-col mb-2">
                                    <span className="text-muted-foreground font-semibold">Bulk Supply Cost (BPDB audit):</span>
                                    <span className="font-bold text-foreground mt-0.5 tabular-nums">{d.cost == null ? '—' : `${d.cost.toFixed(2)} Tk/kWh`}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-border/30 pt-2 mt-2">
                                    <span className="text-destructive font-semibold">BPDB Unit Deficit / Subsidy Reqd:</span>
                                    <span className="font-bold text-destructive tabular-nums">{deficit == null ? '—' : `${deficit} Tk/kWh`}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="tariff" name="Avg Bulk Tariff (Tk/kWh)" fill={chartTheme.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
                        <Line type="monotone" dataKey="cost" name="BPDB Supply Cost (Tk/kWh)" stroke={chartTheme.destructive} strokeWidth={2.5} dot={{ fill: chartTheme.destructive, r: 3.5 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </GridChartFrame>
                <MobileFold title="What is being shown?"><div className="grid-explorer-chart-note bg-muted/10 p-4 text-xs text-muted-foreground space-y-2">
                  <p><strong>What is being shown?</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-destructive">BPDB Supply Cost:</strong> BPDB&apos;s printed cost per unit sold in bulk — its own generation plus power bought from IPPs, rentals and imports, including <strong>capacity charges</strong> — from each year&apos;s annual report.</li>
                    <li><strong className="text-primary">Average Bulk Tariff:</strong> what BPDB earned per unit sold to the distributors. BPDB prints it for FY 2022-23 only; other years are left blank rather than derived.</li>
                  </ul>
                  <p className="mt-2 pt-2 border-t border-border/30 font-medium">
                    <strong>Analytical Insight:</strong> In FY {LATEST_BPDB_AUDIT.fy} BPDB&apos;s supply cost was {LATEST_BPDB_AUDIT.cost?.toFixed(2) ?? '—'} Tk/kWh against an average bulk tariff of {LATEST_BPDB_AUDIT.tariff?.toFixed(2) ?? '—'}, and its accounts record a government subsidy of Tk {LATEST_BPDB_AUDIT.subsidyCrore == null ? '—' : formatNumber(LATEST_BPDB_AUDIT.subsidyCrore, 2)} crore for that year. Later years are not yet published by BPDB.
                  </p>
                </div></MobileFold>

                {/* Card Metadata Footer */}
                <GridCardFooter>
                  <span>Source: <a href="https://www.berc.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BERC Tariff Orders</a> &amp; <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Reports</a></span>
                  <span>As published. Not independently audited.</span>
                  <span className="font-medium">Reporting Period: FY 2016-17 – FY 2022-23 (BPDB annual reports)</span>
                </GridCardFooter>
              </div>
              <ChartDataTable
                caption="Historical Pricing and Tariff Comparison, chart"
                categoryHeader="Year"
                categories={(localMacroTariffData).map((d) => String(d.year))}
                series={[
                  { label: "Avg Bulk Tariff (Tk/kWh)", values: columnOf(localMacroTariffData, 'tariff') },
                  { label: "BPDB Supply Cost (Tk/kWh)", values: columnOf(localMacroTariffData, 'cost') },
                ]}
              />

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
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TakaIcon className="h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <h3 className="grid-explorer-chart-card__title">Wholesale Tariff vs. Unit Production Cost</h3>
                        <p className="grid-explorer-chart-card__sub">BPDB&apos;s audited supply cost against its bulk tariff (Tk/kWh) — <span className="text-primary font-semibold text-xs">BPDB annual reports</span></p>
                      </div>
                    </div>
                    <span className="grid-explorer-chip">Bulk Tariff Gap</span>
                  </div>

                  <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                    {macroChartsReady ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart role="img" aria-label="Wholesale Tariff vs. Unit Production Cost, chart" accessibilityLayer={false} data={localMacroTariffData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                          <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                          <XAxis {...gridChartXAxisProps(chartTheme)} tick={{ fontSize: 11, fill: chartTheme.axisTick, dy: 4 }} />
                          <YAxis {...gridChartYAxisProps(chartTheme, { tickFormatter: (v) => `${v} Tk` })} tick={{ fontSize: 11, fill: chartTheme.axisTick }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              const deficit = d.cost == null || d.tariff == null ? null : (d.cost - d.tariff).toFixed(2);
                              return (
                                <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                  <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                    <span>{d.year} Financials</span>
                                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Deficit Gap</span>
                                  </div>
                                  <div className="space-y-2 text-[11px] md:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Average Bulk Tariff:</span>
                                      <span className="font-bold text-foreground tabular-nums">{d.tariff == null ? 'not printed' : `${d.tariff.toFixed(2)} Tk/kWh`}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Bulk Supply Cost:</span>
                                      <span className="font-bold text-foreground tabular-nums">{d.cost == null ? '—' : `${d.cost.toFixed(2)} Tk/kWh`}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-border/30 pt-1">
                                      <span className="text-destructive font-semibold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Unit Deficit:</span>
                                      <span className="font-bold text-destructive tabular-nums">{deficit == null ? '—' : `${deficit} Tk/kWh`}</span>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                                    Calculation: Unit Deficit = Bulk Supply Cost − Average Bulk Tariff, only where BPDB printed both
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
                          <Bar dataKey="tariff" name="Average Bulk Tariff" fill={chartTheme.primary} radius={[4, 4, 0, 0]} maxBarSize={30} />
                          <Line dataKey="cost" name="Bulk Supply Cost" stroke={chartTheme.destructive} strokeWidth={3} dot={{ fill: chartTheme.destructive, r: 4 }} activeDot={{ r: 6 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="grid-explorer-skeleton" />
                    )}
                  </div>
                  <ChartDataTable
                    caption="Wholesale Tariff vs. Unit Production Cost, chart"
                    categoryHeader="Year"
                    categories={(localMacroTariffData).map((d) => String(d.year))}
                    series={[
                      { label: "Average Bulk Tariff", values: columnOf(localMacroTariffData, 'tariff') },
                      { label: "Bulk Supply Cost", values: columnOf(localMacroTariffData, 'cost') },
                    ]}
                  />

                  {/* Card Explanation Block */}
                  <MobileFold title="What is being shown?"><div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
                    <p><strong>What is being shown?</strong></p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-primary">Average Bulk Tariff:</strong> what BPDB earned per unit sold to the distributors, as BPDB printed it (FY 2022-23 only).</li>
                      <li><strong className="text-destructive">Bulk Supply Cost:</strong> BPDB&apos;s printed cost per unit sold in bulk, including power bought and capacity charges.</li>
                    </ul>
                    <p className="mt-2 pt-2 border-t border-border/30">
                      <strong>Analytical Insight:</strong> The widening gap between bulk tariff and actual production cost has resulted in massive structural deficits for BPDB. This trend is highly unsustainable and highlights the critical need to either rationalize power purchase costs (by phasing out liquid fuel plants) or adjust wholesale tariffs to reduce the fiscal subsidy burden on the government.
                    </p>
                  </div></MobileFold>

                  {/* Card Metadata Footer */}
                  <GridCardFooter>
                    <span>Source: <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Accounts &amp; Audit Reports</a></span>
                    <span>
                      Both the tariff and the unit cost are BPDB&apos;s own published
                      figures. The deficit between them is ours — a subtraction, shown
                      so the gap can be read directly rather than eyeballed off the
                      two lines. Not independently audited.
                    </span>
                    <span className="font-medium">Reporting Period: FY 2016-17 – FY 2022-23</span>
                  </GridCardFooter>
                </div>

                {/* LNG Dependency Area Chart */}
                <div className="grid-explorer-chart-card card">
                  <div className="grid-explorer-chart-card__head">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Droplet className="h-5 w-5 shrink-0 text-sky-500" />
                      <div className="min-w-0">
                        <h3 className="grid-explorer-chart-card__title">Gas Supply Transition: Domestic vs. Imported LNG</h3>
                        <p className="grid-explorer-chart-card__sub">Yearly mean of Petrobangla&rsquo;s daily reports (MMCFD) — <span className="text-primary font-semibold text-xs">2020 onwards, current year to date</span></p>
                      </div>
                    </div>
                    <span className="grid-explorer-chip">LNG Reliance</span>
                  </div>

                  {macroChartsReady ? (
                  <GridChartFrame
                    className="mt-4"
                    legend={[
                      { id: 'domestic', label: 'Domestic gas', color: SERIES_COLORS.domesticGas, variant: 'area' },
                      { id: 'lng', label: 'Imported LNG', color: SERIES_COLORS.powerBudget, variant: 'area' },
                    ]}
                  >
                    <ComposedChart role="img" aria-label="Gas Supply Transition: Domestic vs. Imported LNG, chart" accessibilityLayer={false} data={localMacroGasData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                                <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
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
                                    <div><strong>Source:</strong> <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Petrobangla daily gas reports</a></div>
                                    <div>Yearly mean of the days filed. As published. Not independently audited.</div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Area type="monotone" dataKey="domestic" name="Domestic Gas (MMCFD)" stackId="1" stroke={SERIES_COLORS.domesticGas} fill={SERIES_COLORS.domesticGas} fillOpacity={0.22} strokeWidth={2} legendType="none" />
                          <Area type="monotone" dataKey="lng" name="Imported LNG (MMCFD)" stackId="1" stroke={SERIES_COLORS.powerBudget} fill={SERIES_COLORS.powerBudget} fillOpacity={0.28} strokeWidth={2} legendType="none" />
                        </ComposedChart>
                  </GridChartFrame>
                  ) : (
                    <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                      <div className="grid-explorer-skeleton" />
                    </div>
                  )}

                  {/* Card Explanation Block */}
                  <MobileFold title="What is being shown?"><div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
                    <p><strong>What is being shown?</strong></p>
                    <p className="leading-relaxed">This chart shows the volume (MMCFD) of natural gas supplied from local fields versus imported Liquefied Natural Gas (LNG). Each year is the mean of the daily figures Petrobangla published that year, from 12 January 2020, when this archive begins; the current year runs to the newest report held.</p>
                    <p className="leading-relaxed"><strong>Analytical Insight:</strong> The visual depicts a major structural dependency shift: domestic gas production is stagnant or declining, while imported LNG share is rising to meet energy demand. Because imported LNG is purchased at volatile global spot prices (linked to Brent oil and Platts JKM), this shift directly exposes Bangladesh's power generation costs to global commodity shocks and foreign exchange reserves pressure.</p>
                  </div></MobileFold>

                  {/* Card Metadata Footer */}
                  <GridCardFooter>
                    <span>Source: <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Petrobangla daily gas reports</a></span>
                    <span>
                      Domestic and LNG volumes are Petrobangla&apos;s, stated daily. Each year is
                      their mean over the days it filed — a rate, not a total — and the shares
                      are ours, divided from those volumes. Not independently audited.
                    </span>
                    <span className="font-medium">Reporting Period: daily reports, 12 Jan 2020 onwards (current year to date)</span>
                  </GridCardFooter>
                </div>
                <ChartDataTable
                  caption="Gas Supply Transition: Domestic vs. Imported LNG, chart"
                  categoryHeader="Year"
                  categories={(localMacroGasData).map((d) => String(d.year))}
                  series={[
                    { label: "Domestic Gas (MMCFD)", values: columnOf(localMacroGasData, 'domestic') },
                    { label: "Imported LNG (MMCFD)", values: columnOf(localMacroGasData, 'lng') },
                  ]}
                />
              </div>

              {/* Reserves and Capacity Charges Audit info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 space-y-3">
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

                <div className="card p-4 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">Capacity Charge Drag<GridProvenanceTag kind="P" /></div>
                  <div className="space-y-1">
                    <div className="text-xl font-bold text-destructive">~40% of Wholesale Costs</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Audited financial statements indicate that over 40% of BPDB's average bulk purchase rate goes directly toward paying capacity charges to idle or underutilized private IPPs.
                    </p>
                  </div>
                </div>

                <div className="card p-4 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">State Subsidy, FY {LATEST_BPDB_AUDIT.fy}<GridProvenanceTag kind="P" /></div>
                  <div className="space-y-1">
                    <div className="text-xl font-bold text-foreground">{LATEST_BPDB_AUDIT.subsidyCrore == null ? '—' : `${formatNumber(LATEST_BPDB_AUDIT.subsidyCrore, 2)} Crore BDT`}</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      The government subsidy BPDB&apos;s own accounts record for the year, covering the gap between its supply cost ({LATEST_BPDB_AUDIT.cost?.toFixed(2) ?? '—'} Tk/kWh) and its average bulk tariff ({LATEST_BPDB_AUDIT.tariff?.toFixed(2) ?? '—'}).
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Metadata Footer */}
              <GridCardFooter>
                <span>Source: <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Petrobangla Hydrocarbon Unit</a> &amp; <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">BPDB Annual Financials</a></span>
                <span>
                  Reserve and capacity-charge figures are as the audits state them. The
                  subsidy is BPDB&apos;s own figure from its FY {LATEST_BPDB_AUDIT.fy} annual report (it replaced an estimate
                  of ours built on a superseded 8.39 bulk tariff on 2026-09-30). Note that this
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
<MobileFold title="How these months were checked">
              <div className="p-3 rounded-2xl border border-border/40 bg-muted/[0.06] text-[11px] leading-relaxed text-muted-foreground flex items-start gap-2.5">
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
                  {pgcbMonthlyData.length || PGCB_MONTHLY_VERIFICATION.monthsInArchive} months whose
                  source report is held here. The remaining months are shown as published but
                  have not been re-read this way.
                </span>
              </div>
              </MobileFold>
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
                        color: REGIONAL_ZONE_COLORS[key.toLowerCase()] ?? SERIES_UNMAPPED.light,
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
                        <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] text-[11px] leading-relaxed flex items-start gap-2.5">
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
                                <PieChart role="img" aria-label="Energy Fuel Mix, chart" width={200} height={200} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
                                      className="ge-donut-label fill-muted-foreground font-sans font-semibold uppercase"
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
                                  <BarChart role="img" aria-label="Regional Maximum Peak Supply, chart"
                                    accessibilityLayer={false}
                                    data={regionalChartData}
                                    margin={GRID_EXPLORER_CHART_MARGIN.default}
                                    onMouseLeave={() => setHoveredZoneIndex(null)}
                                  >
                                    <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                            <ChartDataTable
                              caption="Regional Maximum Peak Supply, chart"
                              categoryHeader="Zone"
                              categories={(regionalChartData).map((d) => String(d.name))}
                              series={[
                                { label: "Regional Maximum Peak Supply", unit: 'MW', values: columnOf(regionalChartData, 'value') },
                              ]}
                            />
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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <h3 className="grid-explorer-chart-card__title">PGCB 13-Year Historical Growth Trends<MonthlyBadge /></h3>
                      <p className="grid-explorer-chart-card__sub">Grid operational metrics charted monthly from 2013 to 2026 — the plotted values are PGCB&apos;s own <GridProvenanceTag kind="P" />, the month-on-month changes in the tooltip are ours <GridProvenanceTag kind="D" /> • <span className="text-primary font-semibold text-xs">Tracked since January 2013</span></p>
                    </div>
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
                        <ComposedChart role="img" aria-label="PGCB monthly peak demand and generation, chart" accessibilityLayer={false} data={localPgcbMonthlyData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                                          <span className="font-semibold text-destructive tabular-nums">{deficitPct.toFixed(1)}%</span>
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
                          <Area type="monotone" dataKey="max_evening_peak_demand" name="Estimated Peak Demand" stroke={SERIES_COLORS.peakGeneration} fill="rgba(249, 115, 22, 0.05)" strokeWidth={1.5} />
                          <Line type="monotone" dataKey="max_evening_peak_gen" name="Maximum Peak Generation" stroke={chartTheme.primary} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                        </ComposedChart>
                      ) : monthlyTrendMetric === 'energy' ? (
                        <ComposedChart role="img" aria-label="PGCB monthly energy generation, chart" accessibilityLayer={false} data={localPgcbMonthlyData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                          <Area type="monotone" dataKey="total_net_generation" name="Total Monthly Energy Generation (MKWh)" stroke={SERIES_COLORS.bdGasTariff} fill="rgba(245, 158, 11, 0.1)" strokeWidth={2.5} />
                        </ComposedChart>
                      ) : (
                        <ComposedChart role="img" aria-label="PGCB monthly generation by fuel, chart" accessibilityLayer={false} data={pgcbFuelTrendData} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                {/* One chart element, three metrics behind a toggle — the table follows the toggle
                    so it always describes the series that is actually drawn. */}
                <ChartDataTable
                  caption={
                    monthlyTrendMetric === 'peaks'
                      ? 'PGCB monthly peak demand and generation, chart'
                      : monthlyTrendMetric === 'energy'
                        ? 'PGCB monthly energy generation, chart'
                        : `PGCB monthly generation from ${selectedFuelTrend}, chart`
                  }
                  categoryHeader="Month"
                  categories={(monthlyTrendMetric === 'peaks' || monthlyTrendMetric === 'energy'
                    ? localPgcbMonthlyData
                    : pgcbFuelTrendData
                  ).map((d) => String(d.date_key))}
                  series={
                    monthlyTrendMetric === 'peaks'
                      ? [
                          { label: 'Estimated Peak Demand', unit: 'MW', values: columnOf(localPgcbMonthlyData, 'max_evening_peak_demand') },
                          { label: 'Maximum Peak Generation', unit: 'MW', values: columnOf(localPgcbMonthlyData, 'max_evening_peak_gen') },
                        ]
                      : monthlyTrendMetric === 'energy'
                        ? [{ label: 'Total Monthly Energy Generation', unit: 'MKWh', values: columnOf(localPgcbMonthlyData, 'total_net_generation') }]
                        : [{ label: `${selectedFuelTrend} generation`, unit: 'MKWh', values: columnOf(pgcbFuelTrendData, 'fuelTrendMkwh') }]
                  }
                />

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
                <MacroPressureCard chartTheme={chartTheme} data={localMacroEconomicData} chartsReady={macroChartsReady} />
                <FuelImportCostCard chartTheme={chartTheme} data={localMacroEconomicData} chartsReady={macroChartsReady} />
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
                  <span>Hand-entered and not yet checked against the gazettes; Kerosene and Petrol were removed on 2026-09-30 as filled-in rather than read.</span>
                  <span className="font-medium">Reporting Period: Historical Macro Pricing Benchmarks (2010 - 2026)</span>
                </GridCardFooter>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Annual Reports (Audited Statements) */}
          {macroSubTab === 'reports' && (
            <div className="space-y-6 grid-explorer-subpanel">
              {/*
                This banner used to say BPDB's accounts did not reconcile, and named
                FY24 and FY26 as the worst offenders. Both years were invented, and
                the series they sat in was replaced on 2026-10-04 by one derived from
                the audited reports — whose balance is computed here rather than read,
                so it reconciles by construction. Petrobangla's half is still the old
                shape: hand-typed, citing nothing, and not reconciling. Only it warns.
              */}
              {reportsCompany === 'petrobangla' ? (
                <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] text-[11px] leading-relaxed flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">These Petrobangla figures are hand-typed and name no document.</strong>{' '}
                    Revenue less LNG cost does not equal the stated net profit in any year shown,
                    and the series runs to FY 26 — years Petrobangla has not published. Read it as
                    unverified until its annual reports are attached, as BPDB&apos;s now are.
                  </span>
                </div>
              ) : null}

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
                    <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                      <Landmark className="h-5 w-5 shrink-0 text-emerald-500" />
                      <div className="min-w-0">
                        <h3 className="grid-explorer-chart-card__title">BPDB Annual Cost, Revenue &amp; Subsidy Profile (Crore BDT)</h3>
                        <p className="grid-explorer-chart-card__sub">The gap between what BPDB sells power for and what it costs to supply, against the treasury transfer that covers it — <span className="text-primary font-semibold text-xs">FY 2016-17 to FY 2022-23, as BPDB printed it</span></p>
                      </div>
                    </div>

                    <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
                      {macroChartsReady ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart role="img" aria-label="BPDB Annual Cost, Revenue and Subsidy Profile (Crore BDT), chart" accessibilityLayer={false} data={localBpdbAuditedFinancials} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                            <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                            <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                            <YAxis width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={formatAxisCrore} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                    <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                      <span>BPDB {d.year} Financials</span>
                                      <span className="text-[9px] md:text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Audited Ledger</span>
                                    </div>
                                    <div className="space-y-2 text-[11px] md:text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Energy Sales:</span>
                                        <span className="font-bold text-foreground tabular-nums">{d.revenue == null ? '—' : `${formatNumber(d.revenue, 2)} Crore BDT`}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-destructive inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Total Operating Expenses:</span>
                                        <span className="font-bold text-destructive tabular-nums">{formatNumber(d.cost, 2)} Crore BDT</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-emerald-500 inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Government Subsidy:</span>
                                        <span className="font-bold text-emerald-500 tabular-nums">{d.subsidy == null ? 'Not printed this year' : `${formatNumber(d.subsidy, 2)} Crore BDT`}</span>
                                      </div>
                                      <div className="flex justify-between border-t border-border/30 pt-1">
                                        <span className="font-bold inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Operating balance after subsidy:</span>
                                        <span className={cn("font-bold tabular-nums", d.loss == null ? "text-muted-foreground" : d.loss < 0 ? "text-destructive" : "text-emerald-500")}>{d.loss == null ? '—' : `${formatNumber(d.loss, 2)} Crore BDT`}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border/30 text-[9px] md:text-[10px] text-muted-foreground leading-normal italic font-medium">
                                      ESB PowerLine&apos;s arithmetic: (Energy Sales + Subsidy) − Total Operating Expenses. BPDB does not print it, and it is an operating balance — no interest, no other income. Blank where BPDB printed no subsidy.
                                    </div>
                                    <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
                                      <div><strong>Source:</strong> {d.sourceFile}, Comparative Statement of Budget and Achievement — <a href="https://www.bpdb.gov.bd/site/page/annual-report" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BPDB annual reports</a></div>
                                      <div>As published. Not independently audited.</div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="revenue" name="Energy Sales" fill={SERIES_COLORS.domesticGas} stackId="a" radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Bar dataKey="subsidy" name="Govt Subsidy" fill={SERIES_COLORS.retailDiesel} stackId="a" radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Bar dataKey="cost" name="Total Operating Expenses" fill={SERIES_COLORS.peakGeneration} radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Line type="monotone" dataKey="loss" name="Operating balance after subsidy" stroke={SERIES_COLORS.powerBudget} strokeWidth={3} dot={{ fill: SERIES_COLORS.powerBudget, r: 4 }} connectNulls={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="grid-explorer-skeleton" />
                      )}
                    </div>
      <ChartDataTable
        caption="BPDB Annual Cost, Revenue and Subsidy Profile (Crore BDT), chart"
        categoryHeader='Year'
        categories={localBpdbAuditedFinancials.map((d) => d.year)}
        series={[
          { label: "Energy Sales", values: columnOf(localBpdbAuditedFinancials, 'revenue') },
          { label: "Govt Subsidy", values: columnOf(localBpdbAuditedFinancials, 'subsidy') },
          { label: "Total Operating Expenses", values: columnOf(localBpdbAuditedFinancials, 'cost') },
          { label: "Operating balance after subsidy (derived)", values: columnOf(localBpdbAuditedFinancials, 'loss') },
        ]}
      />

                    {/* Card Metadata Footer */}
                    <GridCardFooter>
                      <span>Source: <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Financial Reports</a></span>
                      <span>As published. Not independently audited.</span>
                      <span className="font-medium">Reporting Period: FY 2016-17 – FY 2022-23. {BPDB_FINANCIALS_COVERAGE_NOTE}</span>
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
                              <span className="inline-flex items-center gap-1">Energy Sales (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Total Operating Expenses (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Govt Subsidy Received (Crore BDT)<GridProvenanceTag kind="P" /></span>
                            </th>
                            <th className="text-left">
                              <span className="inline-flex items-center gap-1">Operating balance after subsidy (Crore BDT)<GridProvenanceTag kind="D" /></span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {localBpdbAuditedFinancials.map((d, idx) => (
                            <tr key={idx}>
                              <td className="font-semibold">{d.year}</td>
                              <td className="text-left tabular-nums">{d.revenue == null ? '—' : formatNumber(d.revenue, 2)}</td>
                              <td className="text-left tabular-nums text-destructive">{formatNumber(d.cost, 2)}</td>
                              <td className="text-left tabular-nums text-emerald-500 font-semibold">{d.subsidy == null ? '—' : formatNumber(d.subsidy, 2)}</td>
                              <td className={cn("text-left tabular-nums font-bold", d.loss == null ? "" : d.loss < 0 ? "text-destructive" : "text-emerald-500")}>{d.loss == null ? '—' : formatNumber(d.loss, 2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Card Metadata Footer */}
                    <GridCardFooter>
                      <span>Source: <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB Annual Financial Reports</a></span>
                      <span>As published. Not independently audited.</span>
                      <span className="font-medium">Reporting Period: FY 2016-17 – FY 2022-23. {BPDB_FINANCIALS_COVERAGE_NOTE}</span>
                    </GridCardFooter>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Petrobangla Audited Chart */}
                  <div className="grid-explorer-chart-card card">
                    <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                      <Landmark className="h-5 w-5 shrink-0 text-violet-500" />
                      <div className="min-w-0">
                        <h3 className="grid-explorer-chart-card__title">Petrobangla Annual Revenue &amp; LNG Import Costs</h3>
                        <p className="grid-explorer-chart-card__sub">Gas sales against the LNG import bill (Crore BDT) — <span className="text-primary font-semibold text-xs">FY 2016-17 and FY 2017-18 only, unverified</span></p>
                      </div>
                    </div>

                    <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
                      {macroChartsReady ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart role="img" aria-label="Petrobangla Annual Revenue and LNG Import Costs, chart" accessibilityLayer={false} data={localPetrobanglaAuditedFinancials} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                            <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                            <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                            <YAxis width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={formatAxisCrore} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                const profitLabel = d.netProfit >= 0 ? 'Net Profit' : 'Net Loss';
                                const profitColorClass = d.netProfit >= 0 ? 'text-emerald-500 font-semibold' : 'text-destructive font-semibold';
                                return (
                                  <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                    <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                      <span>Petrobangla {d.year} Financials</span>
                                      <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Audited Ledger</span>
                                    </div>
                                    <div className="space-y-2 text-[11px] md:text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Gas Sales Revenue:</span>
                                        <span className="font-bold text-foreground tabular-nums">{formatNumber(d.revenue)} Crore BDT</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-purple-400 font-medium inline-flex items-center gap-1"><GridProvenanceTag kind="P" />LNG Import Payments:</span>
                                        <span className="font-bold text-purple-500 tabular-nums">{formatNumber(d.lngCost)} Crore BDT</span>
                                      </div>
                                      <div className="flex justify-between border-t border-border/30 pt-1">
                                        <span className="text-muted-foreground">{profitLabel}:</span>
                                        <span className={profitColorClass}>{formatNumber(d.netProfit)} Crore BDT</span>
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
                            <Bar dataKey="revenue" name="Gas Sales Revenue" fill={SERIES_COLORS.domesticGas} radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Bar dataKey="lngCost" name="LNG Import Cost" fill={SERIES_COLORS.powerBudget} radius={[2, 2, 0, 0]} maxBarSize={20} />
                            <Line type="monotone" dataKey="netProfit" name="Net Income / Loss" stroke={STATUS_COLORS.warning} strokeWidth={3} dot={{ fill: STATUS_COLORS.warning, r: 4 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="grid-explorer-skeleton" />
                      )}
                    </div>
      <ChartDataTable
        caption="Petrobangla Annual Revenue and LNG Import Costs, chart"
        categoryHeader='Year'
        categories={localPetrobanglaAuditedFinancials.map((d) => d.year)}
        series={[
          { label: "Gas Sales Revenue", values: columnOf(localPetrobanglaAuditedFinancials, 'revenue') },
          { label: "LNG Import Cost", values: columnOf(localPetrobanglaAuditedFinancials, 'lngCost') },
          { label: "Net Income / Loss", values: columnOf(localPetrobanglaAuditedFinancials, 'netProfit') },
        ]}
      />

                    {/* Card Metadata Footer */}
                    <GridCardFooter>
                      <span>Source: <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Petrobangla Audited Financial Accounts</a></span>
                      <span>As published. Not independently audited.</span>
                      <span className="font-medium">Reporting Period: FY 2016-17 – FY 2017-18. {PETROBANGLA_SERIES_COVERAGE_NOTE}</span>
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
                      <span className="font-medium">Reporting Period: FY 2016-17 – FY 2017-18. {PETROBANGLA_SERIES_COVERAGE_NOTE}</span>
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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sun className="h-5 w-5 shrink-0 text-teal-500" />
                    <div className="min-w-0">
                      <h3 className="grid-explorer-chart-card__title">Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff</h3>
                      <p className="grid-explorer-chart-card__sub">Global Average Solar LCOE vs. Domestic Solar Contracts (Tk/kWh) — <span className="text-primary font-semibold text-xs">Tracked since 2015</span></p>
                    </div>
                  </div>
                  <span className="grid-explorer-chip bg-teal-500/5 text-teal-500 border-teal-500/10">Solar Energy</span>
                </div>

                <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
                  {macroChartsReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart role="img" aria-label="Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff, chart" accessibilityLayer={false} data={localGlobalVsDomesticData.filter(x => parseInt(x.year) >= 2015)} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                        <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                              <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                  <span>Solar PV Benchmarks ({d.year})</span>
                                  <span className="text-[9px] uppercase font-bold text-teal-500 tracking-wider">Solar</span>
                                </div>
                                <div className="space-y-2 text-[11px] md:text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Global Solar LCOE:</span>
                                    <span className="font-bold text-teal-500 tabular-nums">{d.globalSolar.toFixed(2)} US Cents/KWh</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Exchange Rate:</span>
                                    <span className="font-semibold text-foreground tabular-nums">{exRate.toFixed(2)} Tk/$</span>
                                  </div>
                                  <div className="flex justify-between border-t border-border/20 pt-1">
                                    <span className="text-muted-foreground">Global Solar (Tk/kWh equivalent):</span>
                                    <span className="font-bold text-teal-400 tabular-nums">{globalSolarBdt.toFixed(2)} Tk/kWh</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">BD Solar Contract Tariff:</span>
                                    <span className="font-bold text-rose-500 tabular-nums">{d.bdSolar.toFixed(2)} Tk/kWh</span>
                                  </div>
                                  <div className="flex justify-between border-t border-border/20 pt-1 border-dashed">
                                    <span className="text-muted-foreground">Domestic Contract Premium:</span>
                                    <span className={cn("font-bold", premium >= 0 ? "text-rose-500" : "text-emerald-500")}>
                                      {premium >= 0 ? `+${premium.toFixed(2)} Tk/kWh (Premium)` : `${premium.toFixed(2)} Tk/kWh`}
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
                        <Line type="monotone" dataKey="globalSolarBdt" name="Global Solar LCOE (Tk/kWh)" stroke={SERIES_COLORS.transmissionIndex} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.transmissionIndex, r: 3 }} />
                        <Line type="monotone" dataKey="bdSolar" name="BD Solar Tariff (Tk/kWh)" stroke={STATUS_COLORS.critical} strokeWidth={2.5} dot={{ fill: STATUS_COLORS.critical, r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid-explorer-skeleton" />
                  )}
                  </div>
                  <ChartDataTable
                    caption="Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff, chart"
                    categoryHeader="Year"
                    categories={(localGlobalVsDomesticData.filter(x => parseInt(x.year) >= 2015)).map((d) => String(d.year))}
                    series={[
                      { label: "Global Solar LCOE (Tk/kWh)", values: columnOf(localGlobalVsDomesticData.filter(x => parseInt(x.year) >= 2015), 'globalSolarBdt') },
                      { label: "BD Solar Tariff (Tk/kWh)", values: columnOf(localGlobalVsDomesticData.filter(x => parseInt(x.year) >= 2015), 'bdSolar') },
                    ]}
                  />

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
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border flex flex-col items-center text-center">
                  <Landmark className="h-6 w-6 shrink-0 text-primary mb-2" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title text-lg font-bold">Power Sector at a Glance</h3>
                    <p className="grid-explorer-chart-card__sub text-xs text-muted-foreground">Official key indicators of grid capacity, consumer base, transmission, and performance</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {glanceIndicators.map((stat, idx) => {
                    const Icon = stat.Icon;
                    return (
                      <div key={idx} className="p-4 bg-muted/10 border border-border/30 rounded-2xl flex items-center justify-start gap-3 hover:bg-muted/15 transition-all duration-200 shadow-sm group relative cursor-help">
                        <div className={`h-9 w-9 flex items-center justify-center rounded-xl ${stat.iconColor} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                          <Icon className="h-4 w-4 shrink-0" />
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
                            <Icon className="h-3.5 w-3.5 shrink-0" /> {stat.tooltipTitle}
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
                        <Activity className="h-3.5 w-3.5 shrink-0" /> Target Distribution Loss
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
                  <span className="font-medium">Figures as entered by the desk on June 14, 2026 — not refreshed automatically</span>
                </GridCardFooter>
              </div>

              {/* Year-wise System Loss Chart */}
              <div className="grid-explorer-chart-card card p-6">
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
                  <Activity className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <h3 className="grid-explorer-chart-card__title">Historical System Loss Trends (T&amp;D)</h3>
                    <p className="grid-explorer-chart-card__sub">Long-term reduction curves in transmission, distribution, and overall system loss — <span className="text-primary font-semibold text-xs">Tracked since 2001</span></p>
                  </div>
                  <span className="grid-explorer-chip bg-primary/10 text-primary border-primary/20 ml-auto text-[10px] font-bold">Series as entered Sep 17, 2025</span>
                </div>

                <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                  {chartsReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart role="img" aria-label="Historical System Loss Trends (TandD), chart" accessibilityLayer={false}
                        data={[...localSystemLossData].reverse()}
                        margin={{ top: 10, right: 5, left: -5, bottom: 5 }}
                      >
                        <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                              <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-80 max-w-[calc(100vw-2rem)] select-none bg-card space-y-3">
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
                                      <span className="text-foreground font-bold tabular-nums">{d.bpdb.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground font-semibold">REB:</span>
                                      <span className="text-foreground font-bold tabular-nums">{d.reb.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground font-semibold">DPDC:</span>
                                      <span className="text-foreground font-bold tabular-nums">{d.dpdc.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground font-semibold">DESCO:</span>
                                      <span className="text-foreground font-bold tabular-nums">{d.desco.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between col-span-2 sm:col-span-1">
                                      <span className="text-muted-foreground font-semibold">WZPDCO:</span>
                                      <span className="text-foreground font-bold tabular-nums">{d.wzpdco !== null ? `${d.wzpdco.toFixed(2)}%` : '—'}</span>
                                    </div>
                                    <div className="flex justify-between col-span-2 sm:col-span-1">
                                      <span className="text-muted-foreground font-semibold">NESCO:</span>
                                      <span className="text-foreground font-bold tabular-nums">{d.nesco !== null ? `${d.nesco.toFixed(2)}%` : '—'}</span>
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
                        <Line type="monotone" dataKey="distribution" name="Distribution Loss" stroke={SERIES_COLORS.powerBudget} strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="transmission" name="Transmission Loss" stroke={SERIES_COLORS.retailDiesel} strokeWidth={2} dot={{ r: 2 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid-explorer-skeleton" />
                  )}
                </div>
                <ChartDataTable
                  caption="Historical System Loss Trends (TandD), chart"
                  categoryHeader="Fiscal year"
                  categories={([...localSystemLossData].reverse()).map((d) => String(d.fiscal_year))}
                  series={[
                    { label: "Total T&D Loss", values: columnOf([...localSystemLossData].reverse(), 'total_td') },
                    { label: "Distribution Loss", values: columnOf([...localSystemLossData].reverse(), 'distribution') },
                    { label: "Transmission Loss", values: columnOf([...localSystemLossData].reverse(), 'transmission') },
                  ]}
                />

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
                <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
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
                <div className="card p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
                    <TakaIcon className="h-5 w-5 shrink-0 text-amber-500" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">Listed IPPs Receivables &amp; Working Capital Risk</h4>
                      <p className="text-[10px] text-muted-foreground">Analysis for Summit Power, Baraka, United Power equity holders</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-xs">
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

                <div className="card p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
                    <Globe className="h-5 w-5 shrink-0 text-sky-500" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">Forex Exposure &amp; Currency Devaluation Burden</h4>
                      <p className="text-[10px] text-muted-foreground">Macro-economic impact on national fuel imports</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-xs">
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

                <div className="card p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
                    <Activity className="h-5 w-5 shrink-0 text-rose-500" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">Industrial Gas Shortage &amp; Corporate Earnings Clues</h4>
                      <p className="text-[10px] text-muted-foreground">Earnings impact on listed steel, cement, and textile mills</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-xs">
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

                <div className="card p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border/40">
                    <Zap className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground">Grid Capacity Margin &amp; Overcapacity Charges</h4>
                      <p className="text-[10px] text-muted-foreground">The operational driver of the national power subsidy</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-xs">
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
  })();
}
