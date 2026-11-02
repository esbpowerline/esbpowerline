'use client';

/**
 * The two "Pricing & Drivers" chart cards, extracted verbatim from
 * MacroTrendsTab when its screen-reader data tables pushed it past the size
 * ratchet. Presentational only: the data slice, the chart theme and the
 * ready flag arrive as props exactly as the JSX read them from scope.
 */

import { useChartAnimation } from './useChartAnimation';
import { Globe, TrendingUp } from 'lucide-react';
import {
  Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ChartTheme } from '@/hooks/useChartTheme';
import { chartGridProps } from '@/lib/data/grid/chart-axis';
import type { macroEconomicData } from '@/lib/data/macro/economics';
import { SERIES_COLORS, SERIES_UNMAPPED } from '@/lib/data/grid/chart-palette';
import {
  GRID_EXPLORER_CHART_MARGIN,
  GRID_Y_AXIS_WIDTH,
  GridRechartsLegend,
} from '@/components/news/PowerGridChartUI';
import { GridCardFooter, GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';

type MacroEconomicRows = typeof macroEconomicData;

interface CardProps {
  chartTheme: ChartTheme;
  data: MacroEconomicRows;
  chartsReady: boolean;
}

export function MacroPressureCard({ chartTheme, data, chartsReady }: CardProps) {
  const animate = useChartAnimation();
  return (
                <div className="grid-explorer-chart-card card">
                  <div className="grid-explorer-chart-card__head">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <h3 className="grid-explorer-chart-card__title">Macro Pressure Variables (2021 - 2026)</h3>
                        <p className="grid-explorer-chart-card__sub">Devaluation of BDT/USD vs. National Inflation Rate (CPI %) — <span className="text-primary font-semibold text-xs">Tracked since 2021</span></p>
                      </div>
                    </div>
                    <span className="grid-explorer-chip">Macro Factors</span>
                  </div>
      
                  <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                    {chartsReady ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart role="img" aria-label="Macro Pressure Variables (2021 - 2026), chart" accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.dual} tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={(v) => `${v} Tk`} />
                          <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.dual} tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                  <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                    <span>Macro Variables {d.year}</span>
                                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Economy</span>
                                  </div>
                                  <div className="space-y-2 text-[11px] md:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Exchange Rate:</span>
                                      <span className="font-bold text-primary tabular-nums">{d.exchangeRate.toFixed(2)} BDT/USD</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Inflation Rate (CPI):</span>
                                      <span className="font-bold text-amber-500 tabular-nums">{d.inflation.toFixed(2)}%</span>
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
                          <Bar isAnimationActive={animate} yAxisId="left" dataKey="exchangeRate" name="USD Exchange Rate (BDT)" fill={chartTheme.primary} radius={[4, 4, 0, 0]} maxBarSize={25} />
                          <Line isAnimationActive={animate} yAxisId="right" type="monotone" dataKey="inflation" name="Inflation Rate (%)" stroke={SERIES_COLORS.peakGeneration} strokeWidth={3} dot={{ fill: SERIES_COLORS.peakGeneration, r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="grid-explorer-skeleton" />
                    )}
                  </div>
      <ChartDataTable
        caption="Macro Pressure Variables (2021 - 2026), chart"
        categoryHeader='Year'
        categories={data.map((d) => d.year)}
        series={[
          { label: "USD Exchange Rate (BDT)", values: columnOf(data, 'exchangeRate') },
          { label: "Inflation Rate (%)", values: columnOf(data, 'inflation') },
        ]}
      />
      
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
      
  );
}

export function FuelImportCostCard({ chartTheme, data, chartsReady }: CardProps) {
  const animate = useChartAnimation();
  return (
                <div className="grid-explorer-chart-card card">
                  <div className="grid-explorer-chart-card__head">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Globe className="h-5 w-5 shrink-0 text-amber-500" />
                      <div className="min-w-0">
                        <h3 className="grid-explorer-chart-card__title">Global Fuel Commodity Import Costs</h3>
                        <p className="grid-explorer-chart-card__sub">Spot LNG (USD/MMBtu) vs. Import Coal (USD/Metric Ton) — <span className="text-primary font-semibold text-xs">Tracked since 2021</span></p>
                      </div>
                    </div>
                    <span className="grid-explorer-chip">Import Costs</span>
                  </div>
      
                  <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4">
                    {chartsReady ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart role="img" aria-label="Global Fuel Commodity Import Costs, chart" accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
                          <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.dual} tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={(v) => `${v} $/MMBtu`} />
                          <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.dual} tick={{ fontSize: 11, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} domain={[0, 'auto']} tickFormatter={(v) => `${v} $/t`} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                                  <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                                    <span>Fuel Import Cost {d.year}</span>
                                    <span className="text-[9px] uppercase font-bold text-purple-500 tracking-wider">Commodities</span>
                                  </div>
                                  <div className="space-y-2 text-[11px] md:text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground text-purple-400 font-medium">Spot LNG (R-LNG):</span>
                                      <span className="font-bold text-purple-500 tabular-nums">${d.spotLng.toFixed(2)} / MMBtu</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground text-slate-400">Imported Coal (CIF):</span>
                                      <span className="font-bold text-slate-400 tabular-nums">${d.importCoal.toFixed(2)} / Ton</span>
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
                          <Area isAnimationActive={animate} yAxisId="left" type="monotone" dataKey="spotLng" name="Spot LNG (USD/MMBtu)" stroke={SERIES_COLORS.powerBudget} fill="rgba(168, 85, 247, 0.15)" strokeWidth={2} />
                          <Line isAnimationActive={animate} yAxisId="right" type="monotone" dataKey="importCoal" name="Import Coal (USD/Ton)" stroke={SERIES_UNMAPPED.light} strokeWidth={2.5} dot={{ fill: SERIES_UNMAPPED.light, r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="grid-explorer-skeleton" />
                    )}
                  </div>
      <ChartDataTable
        caption="Global Fuel Commodity Import Costs, chart"
        categoryHeader='Year'
        categories={data.map((d) => d.year)}
        series={[
          { label: "Spot LNG (USD/MMBtu)", values: columnOf(data, 'spotLng') },
          { label: "Import Coal (USD/Ton)", values: columnOf(data, 'importCoal') },
        ]}
      />
      
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
  );
}
