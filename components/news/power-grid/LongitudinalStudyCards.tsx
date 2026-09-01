'use client';

/**
 * The four longitudinal-study chart cards, extracted verbatim from
 * `LongitudinalStudy.tsx` when its size budget could not absorb the
 * screen-reader data tables. Presentational only: every figure, colour and
 * label is exactly what the parent rendered inline before the split. Data
 * processing, the hover readout and its P/D provenance logic stay in the
 * parent and arrive here as props — the tooltip is passed as a finished
 * element so the provenance decision is made in exactly one file.
 *
 * Each card pairs its chart with a `ChartDataTable` exposing the plotted
 * points. The tables print the drawn values — including the apportioned
 * voltage split the footers already disclose — and print "not published"
 * where a value is null, never a zero.
 */

import React from 'react';
import {
  AreaChart, Area, LineChart, Line, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  GridChartFrame,
  GRID_CHART_MARGIN,
  GRID_Y_AXIS_WIDTH,
  gridChartAxisTick,
  gridChartSplitUnitTick,
  gridChartXAxisProps,
} from '@/components/news/PowerGridChartUI';
import { Activity, Layers, TrendingUp, BarChart3 } from 'lucide-react';
import {
  GridCardFooter,
  GridExplanationBlock,
} from '@/components/news/power-grid/GridExplorerUI';
import {
  ChartDataTable,
  columnOf,
} from '@/components/news/power-grid/ChartDataTable';
import { chartGridProps } from '@/lib/data/grid/chart-axis';
import { SERIES_COLORS, CHART_INK } from '@/lib/data/grid/chart-palette';

/** One processed study row. Kept loose on purpose: the parent's rows are the
 *  study dataset plus its derived columns, and this file must not re-state
 *  (and thereby fork) that shape. */
type StudyRow = Record<string, unknown>;

interface CardProps {
  chartTheme: any;
  /** The rows actually plotted — already sliced by the parent's paywall
   *  truncation, so the table below the chart matches the drawing exactly. */
  rows: readonly StudyRow[];
  /** The parent's <CustomTooltip …/> element, provenance marks included. */
  tooltip: React.ReactElement;
}

const fiscalYears = (rows: readonly StudyRow[]) =>
  rows.map((r) => String(r.Fiscal_Year ?? ''));

/** Network Evolution by Voltage — three-line ckm chart. */
export function VoltageEvolutionCard({ chartTheme, rows, tooltip }: CardProps) {
  return (
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
          { id: '400', label: '400kV Ultra-High', color: SERIES_COLORS.kv400, variant: 'line' },
          { id: '230', label: '230kV Corridor', color: SERIES_COLORS.kv230, variant: 'line' },
          { id: '132', label: '132kV Corridor', color: SERIES_COLORS.kv132, variant: 'line' },
        ]}
      >
        <LineChart role="img" aria-label="Network Evolution by Voltage Level, chart" accessibilityLayer={false} data={rows as StudyRow[]} margin={GRID_CHART_MARGIN.legend}>
            <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
            <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'Fiscal_Year' })} />
            <YAxis width={GRID_Y_AXIS_WIDTH.splitUnit} tick={gridChartSplitUnitTick(chartTheme, 'ckm')} axisLine={false} tickLine={false} tickMargin={6} domain={[0, 'auto']} allowDecimals={false} />
            <Tooltip content={tooltip} />
            <Line type="monotone" dataKey="Transmission_400kV_ckm" name="400kV Ultra-High" stroke={SERIES_COLORS.kv400} strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="Transmission_230kV_ckm" name="230kV Corridor" stroke={SERIES_COLORS.kv230} strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="Transmission_132kV_ckm" name="132kV Corridor" stroke={SERIES_COLORS.kv132} strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </GridChartFrame>
      {/* The plotted points, for readers the line cannot serve. Nine of these
          fifteen years carry an apportioned split, as the footer states. */}
      <ChartDataTable
        caption="Network evolution by voltage level: transmission circuit kilometers per fiscal year. The 400/230/132 kV split is PGCB-published for six of these years and apportioned from the published total for the rest."
        categoryHeader="Fiscal year"
        categories={fiscalYears(rows)}
        decimals={0}
        series={[
          { label: '400kV Ultra-High', unit: 'ckm', values: columnOf(rows, 'Transmission_400kV_ckm') },
          { label: '230kV Corridor', unit: 'ckm', values: columnOf(rows, 'Transmission_230kV_ckm') },
          { label: '132kV Corridor', unit: 'ckm', values: columnOf(rows, 'Transmission_132kV_ckm') },
        ]}
      />

      {/* Card Explanation Block — the shared one, so this card's prose folds
          away on a narrow card exactly as it does on every other. */}
      <GridExplanationBlock
        className="mt-1.5 pt-3 border-t-0"
        what={
          <ul className="list-disc pl-4 space-y-1">
            <li><strong style={{ color: SERIES_COLORS.kv400 }}>400kV (Ultra-High Voltage Backbone):</strong> The backbone transmission lines built to import electricity (e.g., cross-border interconnections) and evacuate power from mega-generation stations (e.g., Payra, Rampal, Rooppur). This was zero prior to FY2014.</li>
            <li><strong style={{ color: SERIES_COLORS.kv230 }}>230kV Corridor:</strong> Regional transmission corridors linking major generation hubs to city gate stations.</li>
            <li><strong style={{ color: SERIES_COLORS.kv132 }}>132kV Corridor:</strong> Municipal transmission corridors delivering power to distribution grids. It remains the largest network by total physical length.</li>
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
  );
}

/** Cumulative Grid Build-out — stacked area of the same three series. */
export function CumulativeBuildoutCard({ chartTheme, rows, tooltip }: CardProps) {
  return (
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
          { id: '132a', label: '132kV Base', color: SERIES_COLORS.kv132, variant: 'area' },
          { id: '230a', label: '230kV Main', color: SERIES_COLORS.kv230, variant: 'area' },
          { id: '400a', label: '400kV Ultra', color: SERIES_COLORS.kv400, variant: 'area' },
        ]}
      >
        <AreaChart role="img" aria-label="Cumulative Grid Build-out, chart" accessibilityLayer={false} data={rows as StudyRow[]} margin={GRID_CHART_MARGIN.legend}>
            <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
            <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'Fiscal_Year' })} />
            <YAxis width={GRID_Y_AXIS_WIDTH.splitUnit} tick={gridChartSplitUnitTick(chartTheme, 'ckm')} axisLine={false} tickLine={false} tickMargin={6} domain={[0, 'auto']} allowDecimals={false} />
            <Tooltip content={tooltip} />
            <Area type="monotone" dataKey="Transmission_132kV_ckm" name="132kV Base" stackId="1" stroke={SERIES_COLORS.kv132} fill={SERIES_COLORS.kv132} fillOpacity={0.3} isAnimationActive={false} />
            <Area type="monotone" dataKey="Transmission_230kV_ckm" name="230kV Main" stackId="1" stroke={SERIES_COLORS.kv230} fill={SERIES_COLORS.kv230} fillOpacity={0.4} isAnimationActive={false} />
            <Area type="monotone" dataKey="Transmission_400kV_ckm" name="400kV Ultra" stackId="1" stroke={SERIES_COLORS.kv400} fill={SERIES_COLORS.kv400} fillOpacity={0.5} isAnimationActive={false} />
        </AreaChart>
      </GridChartFrame>
      {/* Same three series as the stack draws them: per-band values, not the
          cumulative stack heights, which are a rendering artefact. */}
      <ChartDataTable
        caption="Cumulative grid build-out: transmission circuit kilometers by voltage band per fiscal year. The 400/230/132 kV split is PGCB-published for six of these years and apportioned from the published total for the rest."
        categoryHeader="Fiscal year"
        categories={fiscalYears(rows)}
        decimals={0}
        series={[
          { label: '132kV Base', unit: 'ckm', values: columnOf(rows, 'Transmission_132kV_ckm') },
          { label: '230kV Main', unit: 'ckm', values: columnOf(rows, 'Transmission_230kV_ckm') },
          { label: '400kV Ultra', unit: 'ckm', values: columnOf(rows, 'Transmission_400kV_ckm') },
        ]}
      />

      {/* Card Explanation Block */}
      <GridExplanationBlock
        className="mt-1.5 pt-3 border-t-0"
        what={
          <ul className="list-disc pl-4 space-y-1">
            <li><strong style={{ color: SERIES_COLORS.kv132 }}>132kV Base Grid:</strong> The regional transmission standard, delivering power to municipal substations. It remains the largest network by total physical length, starting from ~6,000 ckm in 2011.</li>
            <li><strong style={{ color: SERIES_COLORS.kv230 }}>230kV Main Grid:</strong> The primary inter-district transmission highway carrying medium loads between cities.</li>
            <li><strong style={{ color: SERIES_COLORS.kv400 }}>400kV Ultra Backbone:</strong> The modern bulk evacuation channels built since FY2014 to transport energy from remote mega power hubs and cross-border imports.</li>
          </ul>
        }
        insight={
          <>
            Although the total carrying capacity has nearly doubled (from 8,396 ckm in 2011 to 15,688 ckm in 2025), the grid remains structurally fragile. The high-capacity <strong style={{ color: SERIES_COLORS.kv400 }}>400kV Ultra Backbone</strong> accounts for only ~20% of the total network. Over 50% of power transport is still dependent on the older, lower-voltage <strong style={{ color: SERIES_COLORS.kv132 }}>132kV Base Grid</strong>. This reliance on low-voltage transmission over long distances leads to high technical system losses, line overloads, and localized grid instability when major power plants trip.
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
  );
}

/** Transmission Expansion Pace — dual-axis bar (ckm added) + line (MW added). */
export function ExpansionPaceCard({ chartTheme, rows, tooltip }: CardProps) {
  return (
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
          { id: 'grid', label: 'Grid Lines Added', color: SERIES_COLORS.kv230, variant: 'bar', provenance: 'D' },
          { id: 'gen', label: 'Gen Cap. Added', color: SERIES_COLORS.genCapacityAdded, variant: 'line', provenance: 'D' },
        ]}
      >
        <ComposedChart role="img" aria-label="Transmission Expansion Pace, chart" accessibilityLayer={false} data={rows as StudyRow[]} margin={GRID_CHART_MARGIN.dualAxis} barCategoryGap="18%">
            <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
            <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'Fiscal_Year' })} />
            <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.splitUnitDual} tick={gridChartSplitUnitTick(chartTheme, 'ckm')} axisLine={false} tickLine={false} tickMargin={6} domain={[0, 'auto']} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.splitUnitDual} tick={gridChartSplitUnitTick(chartTheme, 'MW')} axisLine={false} tickLine={false} tickMargin={6} domain={[0, 'auto']} allowDecimals={false} />
            <Tooltip content={tooltip} cursor={{ fill: chartTheme.gridStroke, opacity: 0.1 }} />
            <Bar yAxisId="left" dataKey="Transmission_Added_ckm" name="Grid Lines Added" fill={SERIES_COLORS.kv230} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            <Line yAxisId="right" type="monotone" dataKey="Generation_Added_MW" name="Gen Cap. Added" stroke={SERIES_COLORS.genCapacityAdded} strokeWidth={2.5} dot={{ stroke: SERIES_COLORS.genCapacityAdded, strokeWidth: 2, fill: CHART_INK.surface.light, r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </ComposedChart>
      </GridChartFrame>
      {/* Both series are differenced here from published totals — derived, as
          the legend's D marks and the footer say. */}
      <ChartDataTable
        caption="Transmission expansion pace: year-on-year additions, differenced here from PGCB and BPDB published totals. PGCB publishes the totals, not the additions."
        categoryHeader="Fiscal year"
        categories={fiscalYears(rows)}
        decimals={0}
        series={[
          { label: 'Grid Lines Added', unit: 'ckm', values: columnOf(rows, 'Transmission_Added_ckm') },
          { label: 'Gen Cap. Added', unit: 'MW', values: columnOf(rows, 'Generation_Added_MW') },
        ]}
      />

      {/* Card Explanation Block */}
      <GridExplanationBlock
        className="mt-1.5 pt-3 border-t-0"
        what={
          <ul className="list-disc pl-4 space-y-1">
            <li><strong style={{ color: SERIES_COLORS.kv230 }}>Grid Lines Added (ckm):</strong> Represents the net circuit-kilometers of transmission lines commissioned by PGCB in each fiscal year.</li>
            <li><strong style={{ color: SERIES_COLORS.genCapacityAdded }}>Gen Capacity Added (MW):</strong> Represents the net generation capacity added to the national grid in megawatts each fiscal year.</li>
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
  );
}

/** Long-term Trajectories — four FY2011=100 index lines. */
export function IndexedTrajectoriesCard({ chartTheme, rows, tooltip }: CardProps) {
  return (
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
          { id: 'budget', label: 'Budget Index', color: SERIES_COLORS.budgetIndex, variant: 'line', provenance: 'D' },
          { id: 'gen', label: 'Gen. Cap. Index', color: SERIES_COLORS.genCapacityIndex, variant: 'line', provenance: 'D' },
          { id: 'demand', label: 'Peak Demand Index', color: SERIES_COLORS.genCapacityAdded, variant: 'line', provenance: 'D' },
          { id: 'tx', label: 'Transmission Index', color: SERIES_COLORS.kv132, variant: 'dashed', provenance: 'D' },
        ]}
      >
        <LineChart role="img" aria-label="Long-term Trajectories (Indexed), chart" accessibilityLayer={false} data={rows as StudyRow[]} margin={GRID_CHART_MARGIN.legend}>
            <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
            <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'Fiscal_Year' })} />
            <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={gridChartAxisTick(chartTheme)} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} allowDecimals={false} tickFormatter={(v) => `${Math.round(v)}%`} />
            <Tooltip content={tooltip} />
            <Line type="monotone" dataKey="Budget_Index" name="Budget Index" stroke={SERIES_COLORS.budgetIndex} strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="Generation_Index" name="Gen. Cap. Index" stroke={SERIES_COLORS.genCapacityIndex} strokeWidth={2.5} dot={{ r: 3.5 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="Demand_Index" name="Peak Demand Index" stroke={SERIES_COLORS.genCapacityAdded} strokeWidth={2.5} dot={{ r: 3.5 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="Transmission_Index" name="Transmission Index" stroke={SERIES_COLORS.kv132} strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3.5 }} isAnimationActive={false} />
        </LineChart>
      </GridChartFrame>
      {/* Indexes computed in the parent; a year whose underlying figure was
          not published indexes to null and the table says so, not 0. */}
      <ChartDataTable
        caption="Long-term trajectories indexed to FY2011 = 100, calculated here from published figures. Index = (current value / FY2011 value) x 100."
        categoryHeader="Fiscal year"
        categories={fiscalYears(rows)}
        decimals={1}
        series={[
          { label: 'Budget Index', unit: '%', values: columnOf(rows, 'Budget_Index') },
          { label: 'Gen. Cap. Index', unit: '%', values: columnOf(rows, 'Generation_Index') },
          { label: 'Peak Demand Index', unit: '%', values: columnOf(rows, 'Demand_Index') },
          { label: 'Transmission Index', unit: '%', values: columnOf(rows, 'Transmission_Index') },
        ]}
      />

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
              <li><strong style={{ color: SERIES_COLORS.budgetIndex }}>Fiscal Allocation:</strong> The Power Division budget has skyrocketed by <strong className="tabular-nums">594.8%</strong>, representing massive capital injection.</li>
              <li><strong style={{ color: SERIES_COLORS.genCapacityIndex }}>Installed Generation:</strong> Total generation capacity has increased by <strong className="tabular-nums">380.0%</strong>, leading to substantial generation surplus.</li>
              <li><strong style={{ color: SERIES_COLORS.genCapacityAdded }}>Peak Demand:</strong> Peak load utilized by the grid grew by <strong className="tabular-nums">337.1%</strong>, demonstrating solid consumption demand.</li>
              <li><strong style={{ color: SERIES_COLORS.kv132 }}>Transmission Lines:</strong> The transmission network has lagged far behind, expanding by only <strong className="tabular-nums">186.8%</strong>. This gap explains why Bangladesh experiences load shedding and grid vulnerability despite having surplus generation capacity.</li>
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
  );
}
