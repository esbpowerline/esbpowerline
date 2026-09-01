'use client';

/**
 * The Overview tab's "Daily Generation Mix Snapshot" card, moved out of
 * PowerGridExplorer verbatim when the chart gained its accessible name and
 * sr-only data table. Purely presentational: the hover state stays with the
 * parent (the mix stack, donut and legend all read it) and every figure
 * arrives through props exactly as the JSX read it in place.
 */

import { PieChart, Pie, Cell } from 'recharts';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChartTheme } from '@/hooks/useChartTheme';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { GridRechartsTooltip } from '@/components/news/PowerGridChartUI';
import { DailyBadge, GridCardFooter, GridProvenanceTag, GridSourceFiles } from '@/components/news/power-grid/GridExplorerUI';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';
import type { GridDailyData, GridGenerationItem, GridSystemStats } from '@/lib/data/grid/types';

export function GenerationMixCard({
  generationData,
  pieGenerationData,
  totalGenMkwhr,
  hasGenerationChartData,
  chartsReady,
  chartTheme,
  hoveredIndex,
  setHoveredIndex,
  sourceFiles,
  systemStats,
}: {
  generationData: GridGenerationItem[];
  /** `generationData` with the zero and non-finite rows dropped — what the donut plots. */
  pieGenerationData: GridGenerationItem[];
  /** Our sum of the fuel rows, not PGCB's headline — the two differ, and the copy says so. */
  totalGenMkwhr: number;
  hasGenerationChartData: boolean;
  chartsReady: boolean;
  chartTheme: ChartTheme;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  sourceFiles: GridDailyData['sourceFiles'];
  systemStats: GridSystemStats;
}) {
  return (
          <div className="grid-explorer-chart-card card">
            <div className="grid-explorer-chart-card__head">
              <div className="flex items-center gap-2.5 min-w-0">
                <Zap className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h3 className="grid-explorer-chart-card__title">Daily Generation Mix Snapshot<DailyBadge /></h3>
                  {/* The total here is our sum of the fuel rows, not PGCB's own
                      headline figure — the two are different numbers, which is
                      what the reconciliation banner above exists to explain. */}
                  <p className="grid-explorer-chart-card__sub">Energy share by fuel type (Total: {totalGenMkwhr.toFixed(1)} MKWh <GridProvenanceTag kind="D" />) • <span className="text-primary font-semibold text-xs">{coverageLabel('fuelMix')}</span></p>
                </div>
              </div>
              <span className="grid-explorer-chip">Fuel Type</span>
            </div>

            <div className="grid-explorer-mix-stack" aria-hidden>
              {generationData.map((item, i) => {
                // Quantised, not raw. The server and client reached this from
                // payloads serialised to different precision and emitted
                // "36.5784%" against "36.57842300028465%", which React reports
                // as a hydration mismatch and then leaves unpatched. Four
                // decimals is far below one device pixel on any display, so
                // nothing is lost by fixing the precision here.
                const width =
                  totalGenMkwhr > 0
                    ? Number(((item.gen / totalGenMkwhr) * 100).toFixed(4))
                    : 0;
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
                <PieChart role="img" aria-label="Daily Generation Mix Snapshot, chart" accessibilityLayer={false} width={200} height={200} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
                        <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
                          <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                            <span>{row.name} Share</span>
                            <span className="text-[9px] md:text-[10px] uppercase font-bold text-primary tracking-wider">Operational Mix</span>
                          </div>
                          <div className="space-y-2 text-[11px] md:text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Energy Output:</span>
                              <span className="font-bold text-foreground tabular-nums">{row.gen.toFixed(2)} MKWh</span>
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

            <ChartDataTable
              caption="Daily Generation Mix Snapshot, chart"
              categoryHeader="Fuel"
              categories={pieGenerationData.map((d) => d.name)}
              series={[
                { label: 'Energy Output', unit: 'MKWh', values: columnOf(pieGenerationData, 'gen') },
              ]}
            />

            {/* Custom Legend. Rendered only when there is a legend to draw and a
                denominator to divide by: on a day whose fuel rows are all zero
                the share is 0/0, and every row printed "NaN%". */}
            {pieGenerationData.length > 0 && totalGenMkwhr > 0 ? (
            <>
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
                    <span className="grid-chart-legend__meta">{((item.gen / totalGenMkwhr) * 100).toFixed(1)}%</span>
                    <span className="grid-chart-legend__val">{item.gen.toFixed(1)} MKWh</span>
                  </button>
                );
              })}
            </div>
            {/* The share is ours; the MKWh beside it is PGCB's own row — said
                once for the column rather than sixteen times down the legend.
                Two marks per row put a badge on every figure in the card's
                densest block, which is where the notation stops being read. */}
            <p className="grid-chart-legend__key">
              <span>Share <GridProvenanceTag kind="D" /></span>
              <span aria-hidden>·</span>
              <span>Energy <GridProvenanceTag kind="P" /></span>
            </p>
            </>
            ) : null}

            {/* Card Metadata Footer */}
            <GridCardFooter>
              <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — P1 sheet, zone-wise generation summary</span>
              {sourceFiles?.pgcb ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFiles.pgcb }]} /> : null}
              <span>Per-fuel energy as published; total and shares are ours. Not independently audited.</span>
              <span className="font-medium">Reporting Date: {systemStats.date}</span>
            </GridCardFooter>
          </div>
  );
}
