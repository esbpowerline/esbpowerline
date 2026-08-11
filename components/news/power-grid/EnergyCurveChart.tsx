'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { GridCardFooter } from '@/components/news/power-grid/GridExplorerUI';
import { buildEnergyCurveSeries } from '@/lib/data/grid/energy-curve';
import { fetchEnergyCurve } from '@/lib/data/grid/energy-curve.client';
import type { ChartTheme } from '@/hooks/useChartTheme';
import type { EnergyCurve } from '@/lib/data/grid/types';

// The card colour, so the hairline between stacked bands reads as a gap in both
// themes rather than as a line of its own.
const BAND_SEPARATOR = 'hsl(var(--card))';

/**
 * Half-hourly generation by fuel, from the PGCB workbook's En-Curve sheet.
 *
 * The daily fuel mix elsewhere on this page is one number per fuel for the
 * whole day. This is the same split every half hour, so the shape of the day is
 * readable rather than its total: coal flat through the night, solar arriving
 * around six and gone by six, oil-fired plant called up for the evening peak.
 *
 * The sheet's own columns separate public from private plant and name each
 * import; those are folded into the eight fuels the rest of the page uses so
 * that a colour means the same thing everywhere, and the split is kept in the
 * tooltip. See `lib/data/grid/energy-curve.ts`.
 */
export function EnergyCurveChart({
  isoDate,
  reportDate,
  chartTheme,
  ready = true,
}: {
  isoDate: string;
  reportDate: string;
  chartTheme: ChartTheme;
  ready?: boolean;
}) {
  const [showTable, setShowTable] = useState(false);
  const [curve, setCurve] = useState<EnergyCurve | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetchEnergyCurve(isoDate).then((c) => {
      if (!live) return;
      setCurve(c);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [isoDate]);

  const series = useMemo(() => buildEnergyCurveSeries(curve ?? undefined), [curve]);

  // Nothing at all while loading, rather than an empty frame that then vanishes
  // on the days — everything before mid-2018 — that publish no such sheet.
  if (loading || !series) return null;

  const { points, active, breakdown } = series;
  const peak = points.reduce(
    (best, p) => (p.total > best.total ? p : best),
    points[0],
  );

  return (
    <div className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head">
        <div>
          <h3 className="grid-explorer-chart-card__title">Generation Mix Through the Day</h3>
          <p className="grid-explorer-chart-card__sub">
            Every half hour, by fuel, as published in the NLDC daily energy curve (Date: {reportDate})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="grid-explorer-chip border-border/60 hover:bg-muted/40 transition-colors"
        >
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>

      {showTable ? (
        // The table is not a fallback — it is how a reader checks a stacked
        // band they cannot separate by eye, and how the figures get copied.
        <div className="mt-4 overflow-x-auto max-h-[26rem]">
          <table className="grid-explorer-table w-full text-[11px]">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                <th className="text-left sticky left-0 bg-card">Time</th>
                {active.map((g) => (
                  <th key={g.name} className="text-right whitespace-nowrap px-2">{g.name}</th>
                ))}
                <th className="text-right px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.time}>
                  <td className="font-medium sticky left-0 bg-card">{p.time}</td>
                  {active.map((g) => (
                    <td key={g.name} className="text-right tabular-nums px-2">
                      {(p[g.name] as number) > 0 ? formatNumber(Math.round(p[g.name] as number)) : '·'}
                    </td>
                  ))}
                  <td className="text-right tabular-nums px-2 font-semibold">{formatNumber(Math.round(p.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 !h-[24rem]">
          {ready ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart accessibilityLayer={false} data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: chartTheme.axisTick }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={6}
                  interval={3}
                />
                <YAxis
                  width={56}
                  tick={{ fontSize: 10, fill: chartTheme.axisTick }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={4}
                  domain={[0, 'auto']}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  content={({ active: on, payload }) => {
                    if (!on || !payload?.length) return null;
                    const row = payload[0].payload as Record<string, number | string>;
                    const time = String(row.time);
                    return (
                      <div className="p-4 text-card-foreground border border-border/80 rounded-2xl shadow-2xl text-xs w-72 max-w-[calc(100vw-2rem)] select-none bg-card">
                        <div className="font-bold border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
                          <span>Generation at {time}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatNumber(Math.round(row.total as number))} MW
                          </span>
                        </div>
                        <div className="space-y-1">
                          {[...active].reverse().map((g) => {
                            const mw = row[g.name] as number;
                            if (!mw) return null;
                            const parts = breakdown.get(g.name)?.find((b) => b.time === time)?.parts ?? [];
                            return (
                              <div key={g.name}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: g.color }} />
                                    {g.name}
                                  </span>
                                  <span className="font-semibold tabular-nums">{formatNumber(Math.round(mw))} MW</span>
                                </div>
                                {/* The sheet's own split, which the eight bands fold together. */}
                                {parts.length > 1 && (
                                  <div className="pl-3.5 text-[10px] text-muted-foreground/70 flex flex-wrap gap-x-2">
                                    {parts.map((p) => (
                                      <span key={p.label} className="tabular-nums">
                                        {p.label} {formatNumber(Math.round(p.mw))}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
                {active.map((g) => (
                  <Area
                    key={g.name}
                    type="monotone"
                    dataKey={g.name}
                    name={g.name}
                    stackId="fuel"
                    stroke={BAND_SEPARATOR}
                    // A hairline in the surface colour between bands: two of
                    // these hues sit close enough under deuteranopia that the
                    // boundary has to be drawn rather than inferred from the
                    // colour change.
                    strokeWidth={1}
                    fill={g.color}
                    fillOpacity={0.85}
                    isAnimationActive={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid-explorer-skeleton" />
          )}
        </div>
      )}

      {/* Legend, always present and in stack order (top band first), so identity
          never rests on colour alone. */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {[...active].reverse().map((g) => (
          <span key={g.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: g.color }} />
            {g.name}
          </span>
        ))}
      </div>

      <div className="bg-muted/10 p-4 border border-border/40 rounded-xl text-xs text-muted-foreground space-y-2 mt-4">
        <p><strong>What is being shown?</strong></p>
        <p className="leading-relaxed">
          PGCB logs national generation every half hour and splits it by fuel. The bands stack to the
          system total, so the height of the whole is the load curve and the height of each band is
          what that fuel was carrying at that moment. The report separates public from private plant
          and names each import line individually; those are grouped here into the same eight fuels
          used elsewhere on this page, and the underlying split is in the tooltip.
        </p>
        <p className="leading-relaxed">
          <strong>Reading it:</strong> generation peaked at{' '}
          <span className="font-semibold text-primary">{peak.time} Hr</span> with{' '}
          <span className="font-bold text-foreground">{formatNumber(Math.round(peak.total))} MW</span>{' '}
          across {active.length} fuel{active.length === 1 ? '' : 's'}. Bands that carried nothing all
          day are left out rather than drawn flat.
        </p>
      </div>

      <GridCardFooter>
        <span>Source: <span className="text-primary font-semibold">PGCB NLDC Daily Energy Curve (En-Curve)</span></span>
        <span>As published. Not independently audited.</span>
        <span className="font-medium">Reporting Date: {reportDate}</span>
      </GridCardFooter>
    </div>
  );
}
