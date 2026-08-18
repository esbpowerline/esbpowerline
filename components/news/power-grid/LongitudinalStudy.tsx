'use client';

import React, { useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { longitudinalStudyData } from '@/lib/data/macro/longitudinal-study';
import {
  GridChartFrame,
  GRID_CHART_MARGIN,
  GRID_Y_AXIS_WIDTH,
  formatChartTooltipValue,
  gridChartAxisTick,
  gridChartSplitUnitTick,
  gridChartXAxisProps,
} from '@/components/news/PowerGridChartUI';
import { formatNumber } from '@/lib/utils';
import { Activity, Layers, TrendingUp, BarChart3 } from 'lucide-react';
import {
  GridCardFooter,
  GridExplanationBlock,
  GridProvenanceTag,
} from '@/components/news/power-grid/GridExplorerUI';
import { chartGridProps } from '@/lib/data/grid/chart-axis';

/**
 * Which series on these four charts is somebody else's figure and which is ours.
 *
 * Everything keyed here is arithmetic performed in this file or in the study
 * dataset — an index against a base year, or a year-on-year difference. None of
 * it appears in any PGCB, BPDB or Ministry of Finance publication as printed.
 */
const DERIVED_KEYS: Record<string, 'D'> = {
  Budget_Index: 'D',
  Generation_Index: 'D',
  Demand_Index: 'D',
  Transmission_Index: 'D',
  Generation_Added_MW: 'D',
  Transmission_Added_ckm: 'D',
};

/**
 * The three voltage series, which are P in some years and D in others.
 *
 * PGCB prints the 400/230/132 kV split for six of the fifteen fiscal years in
 * this study. For the other nine only the network total is published, and the
 * split drawn here is that total apportioned on the last known mix. So the mark
 * cannot be set once for the series: it is set per point, from the year the
 * reader is actually hovering, and the legend leaves it unstated rather than
 * claiming one letter for both cases.
 */
const VOLTAGE_KEYS = new Set([
  'Transmission_400kV_ckm',
  'Transmission_230kV_ckm',
  'Transmission_132kV_ckm',
]);

export function LongitudinalStudyCharts({ chartTheme, isTruncated = false, allowedYears = null }: { chartTheme: any; isTruncated?: boolean; allowedYears?: number | null }) {
  const data = longitudinalStudyData;

  // Base year (FY2011) parameters for indexing
  const baseYearData = data[0];
  const baseBudget = baseYearData.Power_Division_Budget_TkCr || 4914;
  const baseTransmission = baseYearData.Total_Transmission_ckm || 8396;
  const baseGeneration = baseYearData.Installed_Generation_MW || 7296;
  const baseDemand = baseYearData.Peak_Demand_MW || 4890;

  const processedData = useMemo(() => {
    const BASE_MIX = { v400: 0.022, v230: 0.326, v132: 0.652 };
    let lastMix: { v400: number; v230: number; v132: number } | null = null;

    return data.map((d: any, i: number) => {
      const prev = i > 0 ? data[i - 1] : null;
      const genAdded = prev && d.Installed_Generation_MW && prev.Installed_Generation_MW
        ? Math.max(0, d.Installed_Generation_MW - prev.Installed_Generation_MW)
        : 0;

      const hasVoltage =
        d.Transmission_400kV_ckm != null &&
        d.Transmission_230kV_ckm != null &&
        d.Transmission_132kV_ckm != null;

      let v400 = d.Transmission_400kV_ckm;
      let v230 = d.Transmission_230kV_ckm;
      let v132 = d.Transmission_132kV_ckm;

      if (hasVoltage) {
        lastMix = { v400: v400!, v230: v230!, v132: v132! };
      } else if (d.Total_Transmission_ckm && lastMix) {
        const lastTotal = lastMix.v400 + lastMix.v230 + lastMix.v132;
        const scale = lastTotal > 0 ? d.Total_Transmission_ckm / lastTotal : 1;
        v400 = lastMix.v400 * scale;
        v230 = lastMix.v230 * scale;
        v132 = lastMix.v132 * scale;
      } else if (d.Total_Transmission_ckm) {
        v400 = d.Total_Transmission_ckm * BASE_MIX.v400;
        v230 = d.Total_Transmission_ckm * BASE_MIX.v230;
        v132 = d.Total_Transmission_ckm * BASE_MIX.v132;
      }

      return {
        ...d,
        Transmission_400kV_ckm: v400,
        Transmission_230kV_ckm: v230,
        Transmission_132kV_ckm: v132,
        // Carried on the row so the hover readout can mark this year's voltage
        // figures for what they are, rather than the series being labelled once
        // for fifteen years that are not all the same kind of number.
        Voltage_Split_Published: hasVoltage,
        Generation_Added_MW: genAdded,
        Budget_Index: d.Power_Division_Budget_TkCr ? (d.Power_Division_Budget_TkCr / baseBudget) * 100 : null,
        Transmission_Index: d.Total_Transmission_ckm ? (d.Total_Transmission_ckm / baseTransmission) * 100 : null,
        Generation_Index: d.Installed_Generation_MW ? (d.Installed_Generation_MW / baseGeneration) * 100 : null,
        Demand_Index: d.Peak_Demand_MW ? (d.Peak_Demand_MW / baseDemand) * 100 : null,
      };
    });
  }, [data, baseBudget, baseTransmission, baseGeneration, baseDemand]);

  const sliceForLine = isTruncated ? Math.max(allowedYears ?? 2, 3) : processedData.length;
  const sliceForBar = isTruncated ? (allowedYears ?? 2) : processedData.length;

  const displayData3Years = processedData.slice(-sliceForLine);
  const displayData2Years = processedData.slice(-sliceForBar);

  const formatSeriesTooltipValue = (entry: { name?: string; value?: number | null }) => {
    const name = entry.name ?? '';
    const value = entry.value;
    if (name.includes('Index') || name.endsWith('(%)')) {
      return formatChartTooltipValue(value, { unit: '%', decimals: 1 });
    }
    if (name.includes('MW') || name.includes('Gen Cap')) {
      return formatChartTooltipValue(value, { unit: 'MW', decimals: 0 });
    }
    if (name.includes('ckm') || name.includes('Corridor') || name.includes('Ultra')) {
      return formatChartTooltipValue(value, { unit: 'ckm', decimals: 0 });
    }
    return formatChartTooltipValue(value, { decimals: 1 });
  };

  /** The P/D mark for one hovered row, or none where the answer is not clean. */
  const provenanceOf = (entry: any): 'P' | 'D' | null => {
    const key = String(entry?.dataKey ?? '');
    if (VOLTAGE_KEYS.has(key)) return entry?.payload?.Voltage_Split_Published ? 'P' : 'D';
    return DERIVED_KEYS[key] ?? null;
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
    title,
    unit,
    calculation,
    source,
  }: any) => {
    if (active && payload && payload.length) {
      return (
        /* Sized and set like the hand-drawn canvases' scrub readouts rather
           than like a dialog: same 0.7rem radius, same 11px body, same padding.
           At p-5/rounded-2xl/text-sm it was visibly a different component from
           the readout a reader had just been hovering two cards above. */
        <div className="p-3 text-card-foreground border border-border/80 rounded-xl shadow-xl text-[11px] leading-relaxed w-64 md:w-72 max-w-[calc(100vw-2rem)] select-none bg-card">
          <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2.5 flex items-center justify-between gap-2">
            <span className="tabular-nums">{label || 'Data Point'}</span>
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{title}</span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const kind = provenanceOf(entry);
              return (
                <div key={`item-${index}`} className="flex justify-between items-center gap-3">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1.5 min-w-0">
                    {kind ? <GridProvenanceTag kind={kind} /> : null}
                    <span className="truncate">{entry.name}</span>
                  </span>
                  <span className="font-bold tabular-nums shrink-0" style={{ color: entry.color }}>
                    {unit
                      ? `${entry.value != null ? formatNumber(Number(entry.value), unit === 'ckm' || unit === 'MW' ? 0 : 1) : 'N/A'} ${unit}`
                      : formatSeriesTooltipValue(entry)}
                  </span>
                </div>
              );
            })}
          </div>
          {calculation && (
            <div className="mt-2.5 pt-2 border-t border-border/30 text-[10px] text-muted-foreground leading-normal italic font-medium">
              {calculation}
            </div>
          )}
          {source && (
            <div className="mt-2 pt-1.5 border-t border-border/20 text-[9px] text-muted-foreground flex flex-col gap-0.5">
              {/*
                An `auditor` prop used to sit here, filled with CAG, IMED and
                PGCB committees on figures no audit report in this codebase
                covers. Removed rather than re-labelled: naming who published a
                figure is a claim we can support, naming who audited it is not.
              */}
              <div><strong>Source:</strong> {source}</div>
              <div>As published. Not independently audited.</div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">

      {/* Network Evolution by Voltage */}
      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <Layers className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
            <div className="min-w-0">
              <h3 className="grid-explorer-chart-card__title">Network Evolution by Voltage Level</h3>
              <p className="grid-explorer-chart-card__sub">Growth trajectories of ultra-high vs high voltage transmission corridors • <span className="text-primary font-semibold">Tracked since FY 2011</span></p>
            </div>
          </div>
          <span className="grid-explorer-chip bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Voltage Mix</span>
        </div>
        <GridChartFrame
          className="mt-4"
          legend={[
            { id: '400', label: '400kV Ultra-High', color: '#8b5cf6', variant: 'line' },
            { id: '230', label: '230kV Corridor', color: '#3b82f6', variant: 'line' },
            { id: '132', label: '132kV Corridor', color: '#10b981', variant: 'line' },
          ]}
        >
          <LineChart accessibilityLayer={false} data={displayData3Years} margin={GRID_CHART_MARGIN.legend}>
              <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
              <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'Fiscal_Year' })} />
              <YAxis width={GRID_Y_AXIS_WIDTH.splitUnit} tick={gridChartSplitUnitTick(chartTheme, 'ckm')} axisLine={false} tickLine={false} tickMargin={6} domain={[0, 'auto']} allowDecimals={false} />
              <Tooltip content={
                <CustomTooltip
                  title="Voltage Evolution"
                  unit="ckm"
                  source={<a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB System Statistics Division</a>}
                />
              } />
              <Line type="monotone" dataKey="Transmission_400kV_ckm" name="400kV Ultra-High" stroke="#8b5cf6" strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="Transmission_230kV_ckm" name="230kV Corridor" stroke="#3b82f6" strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="Transmission_132kV_ckm" name="132kV Corridor" stroke="#10b981" strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </GridChartFrame>

        {/* Card Explanation Block — the shared one, so this card's prose folds
            away on a narrow card exactly as it does on every other. */}
        <GridExplanationBlock
          className="mt-1.5 pt-3 border-t-0"
          what={
            <ul className="list-disc pl-4 space-y-1">
              <li><strong className="text-[#8b5cf6]">400kV (Ultra-High Voltage Backbone):</strong> The backbone transmission lines built to import electricity (e.g., cross-border interconnections) and evacuate power from mega-generation stations (e.g., Payra, Rampal, Rooppur). This was zero prior to FY2014.</li>
              <li><strong className="text-[#3b82f6]">230kV Corridor:</strong> Regional transmission corridors linking major generation hubs to city gate stations.</li>
              <li><strong className="text-[#10b981]">132kV Corridor:</strong> Municipal transmission corridors delivering power to distribution grids. It remains the largest network by total physical length.</li>
            </ul>
          }
          insight={
            <>
              The rapid growth of 400kV lines since 2014 reflects a major structural shift toward mega-capacity corridors to handle bulk coal power plants and cross-border imports. However, the slower expansion of regional 132kV networks creates local distribution bottlenecks, preventing generated power from efficiently reaching rural and industrial endpoints.
            </>
          }
        />

        {/* Card Metadata Footer */}
        <GridCardFooter>
          <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Annual Progress Reports</a></span>
          <span>Totals as published by PGCB. The 400/230/132 kV split is published for 6 of these 15 years; the remainder is apportioned here from the published total and marked D year by year in the readout.</span>
          <span className="font-medium">Reporting Period: FY 2011 - FY 2025</span>
        </GridCardFooter>
      </div>

      {/* Cumulative Grid Buildout */}
      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <Activity className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <div className="min-w-0">
              <h3 className="grid-explorer-chart-card__title">Cumulative Grid Build-out</h3>
              <p className="grid-explorer-chart-card__sub">Stacked area showing historical carrying capacity composition • <span className="text-primary font-semibold">Tracked since FY 2011</span></p>
            </div>
          </div>
          <span className="grid-explorer-chip bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Grid Composition</span>
        </div>
        <GridChartFrame
          className="mt-4"
          legend={[
            { id: '132a', label: '132kV Base', color: '#10b981', variant: 'area' },
            { id: '230a', label: '230kV Main', color: '#3b82f6', variant: 'area' },
            { id: '400a', label: '400kV Ultra', color: '#8b5cf6', variant: 'area' },
          ]}
        >
          <AreaChart accessibilityLayer={false} data={displayData3Years} margin={GRID_CHART_MARGIN.legend}>
              <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
              <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'Fiscal_Year' })} />
              <YAxis width={GRID_Y_AXIS_WIDTH.splitUnit} tick={gridChartSplitUnitTick(chartTheme, 'ckm')} axisLine={false} tickLine={false} tickMargin={6} domain={[0, 'auto']} allowDecimals={false} />
              <Tooltip content={
                <CustomTooltip
                  title="Cumulative Capacity"
                  unit="ckm"
                  calculation="Stack: 132kV + 230kV + 400kV total circuit kilometers"
                  source={<a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB System Planning Maps</a>}
                />
              } />
              <Area type="monotone" dataKey="Transmission_132kV_ckm" name="132kV Base" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} isAnimationActive={false} />
              <Area type="monotone" dataKey="Transmission_230kV_ckm" name="230kV Main" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} isAnimationActive={false} />
              <Area type="monotone" dataKey="Transmission_400kV_ckm" name="400kV Ultra" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} isAnimationActive={false} />
          </AreaChart>
        </GridChartFrame>

        {/* Card Explanation Block */}
        <GridExplanationBlock
          className="mt-1.5 pt-3 border-t-0"
          what={
            <ul className="list-disc pl-4 space-y-1">
              <li><strong className="text-[#10b981]">132kV Base Grid:</strong> The regional transmission standard, delivering power to municipal substations. It remains the largest network by total physical length, starting from ~6,000 ckm in 2011.</li>
              <li><strong className="text-[#3b82f6]">230kV Main Grid:</strong> The primary inter-district transmission highway carrying medium loads between cities.</li>
              <li><strong className="text-[#8b5cf6]">400kV Ultra Backbone:</strong> The modern bulk evacuation channels built since FY2014 to transport energy from remote mega power hubs and cross-border imports.</li>
            </ul>
          }
          insight={
            <>
              Although the total carrying capacity has nearly doubled (from 8,396 ckm in 2011 to 15,688 ckm in 2025), the grid remains structurally fragile. The high-capacity <strong className="text-[#8b5cf6]">400kV Ultra Backbone</strong> accounts for only ~20% of the total network. Over 50% of power transport is still dependent on the older, lower-voltage <strong className="text-[#10b981]">132kV Base Grid</strong>. This reliance on low-voltage transmission over long distances leads to high technical system losses, line overloads, and localized grid instability when major power plants trip.
            </>
          }
        />

        {/* Card Metadata Footer */}
        <GridCardFooter>
          <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Transmission System Studies</a></span>
          <span>Totals as published by PGCB. The 400/230/132 kV split is published for 6 of these 15 years; the remainder is apportioned here from the published total and marked D year by year in the readout.</span>
          <span className="font-medium">Reporting Period: FY 2011 - FY 2025</span>
        </GridCardFooter>
      </div>

      {/* Transmission Expansion Pace */}
      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <BarChart3 className="h-5 w-5 shrink-0 text-sky-500 mt-0.5" />
            <div className="min-w-0">
              <h3 className="grid-explorer-chart-card__title">Transmission Expansion Pace</h3>
              <p className="grid-explorer-chart-card__sub">New circuit km added to the national grid per year • <span className="text-primary font-semibold">Tracked since FY 2011</span></p>
            </div>
          </div>
          <span className="grid-explorer-chip bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">Expansion Rate</span>
        </div>
        <GridChartFrame
          className="mt-4"
          legend={[
            { id: 'grid', label: 'Grid Lines Added', color: '#3b82f6', variant: 'bar', provenance: 'D' },
            { id: 'gen', label: 'Gen Cap. Added', color: '#f97316', variant: 'line', provenance: 'D' },
          ]}
        >
          <ComposedChart accessibilityLayer={false} data={displayData2Years} margin={GRID_CHART_MARGIN.dualAxis} barCategoryGap="18%">
              <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
              <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'Fiscal_Year' })} />
              <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.splitUnitDual} tick={gridChartSplitUnitTick(chartTheme, 'ckm')} axisLine={false} tickLine={false} tickMargin={6} domain={[0, 'auto']} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.splitUnitDual} tick={gridChartSplitUnitTick(chartTheme, 'MW')} axisLine={false} tickLine={false} tickMargin={6} domain={[0, 'auto']} allowDecimals={false} />
              <Tooltip content={
                <CustomTooltip
                  title="Annual Physical Additions"
                  calculation="Transmission Added = Total ckm (Current Year) - Total ckm (Previous Year) | Gen Capacity Added = Installed MW (Current) - Installed MW (Previous)"
                  source={<a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB &amp; BPDB Progress Reports</a>}
                />
              } cursor={{ fill: chartTheme.gridStroke, opacity: 0.1 }} />
              <Bar yAxisId="left" dataKey="Transmission_Added_ckm" name="Grid Lines Added" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="Generation_Added_MW" name="Gen Cap. Added" stroke="#f97316" strokeWidth={2.5} dot={{ stroke: '#f97316', strokeWidth: 2, fill: '#ffffff', r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </ComposedChart>
        </GridChartFrame>

        {/* Card Explanation Block */}
        <GridExplanationBlock
          className="mt-1.5 pt-3 border-t-0"
          what={
            <ul className="list-disc pl-4 space-y-1">
              <li><strong className="text-[#3b82f6]">Grid Lines Added (ckm):</strong> Represents the net circuit-kilometers of transmission lines commissioned by PGCB in each fiscal year.</li>
              <li><strong className="text-[#f97316]">Gen Capacity Added (MW):</strong> Represents the net generation capacity added to the national grid in megawatts each fiscal year.</li>
            </ul>
          }
          insight={
            <>
              Comparing grid additions with generation additions exposes a massive decoupling. In peak years (e.g. FY2019 and FY2023), generation additions surged by 2,000+ MW while grid expansion remained cyclical and volatile. This structural delay forces the grid to bottleneck, stranding generation surplus at remote power hubs (like Payra and Rampal) because the corresponding transmission lines are not completed in time.
            </>
          }
        />

        {/* Card Metadata Footer */}
        <GridCardFooter>
          <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Project Audit Summaries</a></span>
          <span>Differenced here from PGCB&rsquo;s published totals. PGCB publishes the totals, not the year-on-year additions.</span>
          <span className="font-medium">Reporting Period: FY 2012 - FY 2025</span>
        </GridCardFooter>
      </div>

      {/* Indexed Trajectories */}
      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <TrendingUp className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
            <div className="min-w-0">
              <h3 className="grid-explorer-chart-card__title">Long-term Trajectories (Indexed)</h3>
              <p className="grid-explorer-chart-card__sub">Base Year FY2011 = 100 for true comparative percentage growth • <span className="text-primary font-semibold">Tracked since FY 2011</span></p>
            </div>
          </div>
          <span className="grid-explorer-chip bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">Index Baseline</span>
        </div>
        <GridChartFrame
          className="mt-4"
          legend={[
            { id: 'budget', label: 'Budget Index', color: '#f59e0b', variant: 'line', provenance: 'D' },
            { id: 'gen', label: 'Gen. Cap. Index', color: '#6366f1', variant: 'line', provenance: 'D' },
            { id: 'demand', label: 'Peak Demand Index', color: '#f97316', variant: 'line', provenance: 'D' },
            { id: 'tx', label: 'Transmission Index', color: '#10b981', variant: 'dashed', provenance: 'D' },
          ]}
        >
          <LineChart accessibilityLayer={false} data={displayData2Years} margin={GRID_CHART_MARGIN.legend}>
              <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
              <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'Fiscal_Year' })} />
              <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={gridChartAxisTick(chartTheme)} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} allowDecimals={false} tickFormatter={(v) => `${Math.round(v)}%`} />
              <Tooltip content={
                <CustomTooltip
                  title="Growth Index (FY11=100)"
                  unit="%"
                  calculation="Index = (Current Value / FY2011 Value) * 100"
                  source="Ministry of Finance Budget Briefs & PGCB / BPDB Reports"
                />
              } />
              <Line type="monotone" dataKey="Budget_Index" name="Budget Index" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="Generation_Index" name="Gen. Cap. Index" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3.5 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="Demand_Index" name="Peak Demand Index" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3.5 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="Transmission_Index" name="Transmission Index" stroke="#10b981" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3.5 }} isAnimationActive={false} />
          </LineChart>
        </GridChartFrame>

        {/* Card Explanation Block */}
        <GridExplanationBlock
          className="mt-1.5 pt-3 border-t-0"
          what={
            <div className="space-y-2">
              <p><strong>Structural Decoupling in the Power Sector</strong></p>
              <p className="leading-relaxed">
                This chart indexes all metrics to <strong>FY2011 = 100</strong> to compare their relative growth rates. It highlights a critical structural decoupling in Bangladesh&apos;s energy infrastructure:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong className="text-[#f59e0b]">Fiscal Allocation:</strong> The Power Division budget has skyrocketed by <strong className="tabular-nums">594.8%</strong>, representing massive capital injection.</li>
                <li><strong className="text-[#6366f1]">Installed Generation:</strong> Total generation capacity has increased by <strong className="tabular-nums">380.0%</strong>, leading to substantial generation surplus.</li>
                <li><strong className="text-[#f97316]">Peak Demand:</strong> Peak load utilized by the grid grew by <strong className="tabular-nums">337.1%</strong>, demonstrating solid consumption demand.</li>
                <li><strong className="text-[#10b981]">Transmission Lines:</strong> The transmission network has lagged far behind, expanding by only <strong className="tabular-nums">186.8%</strong>. This gap explains why Bangladesh experiences load shedding and grid vulnerability despite having surplus generation capacity.</li>
              </ul>
            </div>
          }
          insight={
            <>
              The indexed trajectories expose a severe mismatch in asset prioritization. While the fiscal budget grew 6-fold (594.8%) and generation capacity expanded by 380.0% (closely matching peak demand growth at 337.1%), the transmission network only expanded by 186.8%. This massive divergence indicates that capital allocation was heavily diverted toward paying capacity charges for underutilized private generators and fuel import subsidies, rather than building the necessary grid infrastructure to evacuate and distribute power safely.
            </>
          }
        />

        {/* Card Metadata Footer */}
        <GridCardFooter>
          <span>Source: <a href="https://www.mof.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">MOF Budget Briefs</a> &amp; <a href="https://www.bpdb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPDB/PGCB Statistics</a></span>
          <span>As published. Not independently audited.</span>
          <span className="font-medium">Reporting Period: FY 2011 - FY 2025 Baseline Study</span>
        </GridCardFooter>
      </div>

    </div>
  );
}
