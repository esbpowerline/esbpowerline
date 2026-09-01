'use client';

/**
 * The Overview tab's "Daily Fuel & Import Cost" card, moved out of
 * PowerGridExplorer verbatim when the chart gained its accessible name and
 * sr-only data table. Purely presentational: the hover state stays with the
 * parent and every figure arrives through props exactly as the JSX read it
 * in place.
 */

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { Info, Droplet } from 'lucide-react';
import { formatUnitRate, formatBdtAmount } from '@/lib/utils';
import type { ChartTheme } from '@/hooks/useChartTheme';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { chartGridProps } from '@/lib/data/grid/chart-axis';
import {
  GRID_EXPLORER_CHART_MARGIN,
  GRID_Y_AXIS_WIDTH,
  formatAxisCrore,
  gridChartXAxisProps,
} from '@/components/news/PowerGridChartUI';
import { TakaIcon } from '@/components/news/power-grid/shared';
import { DailyBadge, GridCardFooter, GridProvenanceTag, GridSourceFiles } from '@/components/news/power-grid/GridExplorerUI';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';
import type { GridDailyData, GridGenerationItem, GridSystemStats } from '@/lib/data/grid/types';

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
      <Info className="h-5 w-5 shrink-0 text-muted-foreground/70" />
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

export function DailyCostCard({
  dailyCostChartData,
  hasPublishedFuelCost,
  totalCostBdt,
  chartsReady,
  chartTheme,
  hoveredCostIndex,
  setHoveredCostIndex,
  sourceFiles,
  systemStats,
}: {
  /** The fuel rows carrying a published cost, with our Crore conversion attached — what the bars plot. */
  dailyCostChartData: (GridGenerationItem & { costCrore: number })[];
  hasPublishedFuelCost: boolean;
  /** Our sum of the per-fuel rows, not PGCB's own "Total :" line — the copy says so. */
  totalCostBdt: number;
  chartsReady: boolean;
  chartTheme: ChartTheme;
  hoveredCostIndex: number | null;
  setHoveredCostIndex: (index: number | null) => void;
  sourceFiles: GridDailyData['sourceFiles'];
  systemStats: GridSystemStats;
}) {
  return (
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head">
              <div className="flex items-center gap-2.5 min-w-0">
                <TakaIcon className="h-5 w-5 shrink-0 text-amber-500" />
                <div className="min-w-0">
                  <h3 className="grid-explorer-chart-card__title">Daily Fuel &amp; Import Cost<DailyBadge /></h3>
                  {/* The bars are PGCB's published per-fuel costs; this header adds
                      them up, which is not the same as PGCB's own "Total :" row —
                      on 08 Aug 2026 the two differ by 3 Tk. */}
                  <p className="grid-explorer-chart-card__sub">Cost in Crore BDT by fuel type ({hasPublishedFuelCost ? <>Total: {formatBdtAmount(totalCostBdt / 10000000)} Cr Tk. <GridProvenanceTag kind="D" /></> : 'per-fuel split not published for this day'}) • <span className="text-primary font-semibold text-xs">{coverageLabel('fuelCost')}</span></p>
                </div>
              </div>
              <span className="grid-explorer-chip">Cost Analysis</span>
            </div>

            <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
              {!hasPublishedFuelCost ? (
                <GridUnpublishedCostNote totalDailyCostBdt={systemStats.totalDailyCost} />
              ) : chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart role="img" aria-label="Daily Fuel and Import Cost, chart" accessibilityLayer={false} data={dailyCostChartData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                    <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
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
                          <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                            <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                              <span>{row.name} Daily Cost</span>
                              {/* Was "Financial Audit" — nothing here is audited. */}
                              <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Published Cost</span>
                            </div>
                            <div className="space-y-2 text-[11px] md:text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Total Daily Cost:</span>
                                <span className="font-bold text-foreground">{cr} Crore BDT</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Average Unit Rate:</span>
                                <span className="font-bold text-foreground tabular-nums">{formatUnitRate(row.unitCost)} Tk/KWh</span>
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

            <ChartDataTable
              caption="Daily Fuel and Import Cost, chart"
              categoryHeader="Fuel"
              categories={dailyCostChartData.map((d) => d.name)}
              series={[
                { label: 'Daily Cost', unit: 'Cr Tk', values: columnOf(dailyCostChartData, 'costCrore') },
              ]}
            />

            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 pb-4 border-t border-border/50">
              <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-1.5 min-h-[5.5rem] text-center">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-snug inline-flex items-center gap-1.5">
                  <TakaIcon className="h-4 w-4 shrink-0 text-primary" />
                  Avg Production Cost <GridProvenanceTag kind="D" />
                </div>
                {/* Published total cost ÷ published headline generation. Note the
                    KPI strip's "Average Bulk Cost" divides by the summed fuel
                    rows instead, so the two rates differ where those disagree. */}
                <div className="text-2xl font-bold text-primary tabular-nums leading-none">
                  {formatUnitRate(systemStats.avgProductionCost)}{' '}
                  <span className="text-xs font-medium text-muted-foreground">Tk/KWh</span>
                </div>
              </div>
              <div className="bg-muted/15 border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-1.5 min-h-[5.5rem] text-center">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-snug inline-flex items-center gap-1.5">
                  <Droplet className="h-4 w-4 shrink-0 text-sky-500" />
                  Total Gas to Power <GridProvenanceTag kind="P" />
                </div>
                <div className="text-2xl font-bold text-sky-500 tabular-nums leading-none">
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
  );
}
