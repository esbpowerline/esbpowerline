'use client';

import { useId } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  categoricalSlot,
  isKnownFuel,
  resolveFuelColor,
} from '@/lib/data/grid/chart-palette';
import { useChartTheme } from '@/hooks/useChartTheme';
import {
  GRID_EXPLORER_CHART_MARGIN,
  gridChartXAxisProps,
  gridChartYAxisProps,
} from '@/components/news/PowerGridChartUI';

/**
 * The event-study chart.
 *
 * Rebuilt to use the Grid Explorer's own chart chrome rather than Recharts
 * defaults — `useChartTheme`, `gridChartXAxisProps`, `gridChartYAxisProps`,
 * `GRID_EXPLORER_CHART_MARGIN`. The first version bypassed all of it and looked
 * like a different product sitting inside this one: heavier axes, the wrong
 * tick sizes, no split-unit labels, none of the explorer's restraint about
 * gridlines. Chart chrome is decided in one place on this site, and this file
 * is not that place.
 *
 * Three things carry the extra information the charts were missing:
 *
 *  - `capacityKey` draws the publisher's own printed capacity as a dashed
 *    reference. Petrobangla kept printing 1,100 MMCFD for the R-LNG terminal
 *    every day of the collapse, including the days it delivered 300. The
 *    delivered line alone shows a fall; the delivered line under the capacity
 *    the source still claims shows the size of the hole.
 *  - `markers` put the event's own inflection days on the axis, so a reader
 *    sees where the level shifted without cross-referencing the timeline.
 *  - `kind: 'bar'` for accumulated quantities. Energy unserved is an amount, not
 *    a rate, and a bar reads as an amount where a smoothed line reads as a
 *    trend that continues between the points.
 *
 * `connectNulls={false}` everywhere, unchanged and non-negotiable: a day the
 * publisher did not file must render as a break, never as a line drawn through
 * it. That is the same rule TimeMachineTab's 517-hour 2017 gap exists to defend.
 */

export type EventChartColor =
  | { kind: 'fuel'; name: string }
  | { kind: 'slot'; index: number };

export interface EventChartSeries {
  id: string;
  label: string;
  color: EventChartColor;
  /** 'area' for rates, 'bar' for accumulated amounts, 'line' for the rest. */
  kind?: 'area' | 'bar' | 'line';
  points: Array<{ date: string; value: number | null }>;
}

export interface EventChartMarker {
  date: string;
  label: string;
  /** Emphasised markers get a solid rule; the rest are hairlines. */
  strong?: boolean;
}

function strokeFor(color: EventChartColor, mode: 'light' | 'dark'): string {
  if (color.kind === 'fuel' && isKnownFuel(color.name)) return resolveFuelColor(color.name, mode);
  return categoricalSlot(color.kind === 'slot' ? color.index : 0, mode);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "21 Jul" — the tooltip carries the full date, so the axis stays short. */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

function longDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export default function EventStudyChart({
  series,
  unit,
  baselineMean,
  /** A series drawn as a dashed reference rather than data — printed capacity. */
  capacity,
  markers = [],
  /** Shaded span, e.g. the ordinary days before the incident. */
  shade,
  height = 300,
}: {
  series: EventChartSeries[];
  unit: string;
  baselineMean?: number | null;
  capacity?: { id: string; label: string; points: Array<{ date: string; value: number | null }> };
  markers?: EventChartMarker[];
  shade?: { from: string; to: string; label: string };
  height?: number;
}) {
  const chartId = useId();
  const chartTheme = useChartTheme();
  const mode = chartTheme.mode;

  const byDate = new Map<string, Record<string, number | null | string>>();
  const put = (date: string, key: string, value: number | null) => {
    const row = byDate.get(date) ?? { date };
    row[key] = value;
    byDate.set(date, row);
  };
  for (const s of series) for (const p of s.points) put(p.date, s.id, p.value);
  if (capacity) for (const p of capacity.points) put(p.date, capacity.id, p.value);

  const data = [...byDate.values()].sort((a, b) => (String(a.date) < String(b.date) ? -1 : 1));
  const labelOf = (key: string) =>
    series.find((s) => s.id === key)?.label ?? (capacity?.id === key ? capacity.label : key);

  return (
    <div style={{ width: '100%', height }} aria-describedby={`${chartId}-desc`}>
      <span id={`${chartId}-desc`} className="sr-only">
        {series.map((s) => s.label).join(', ')} in {unit}, one point per day.
        {capacity ? ` Dashed line is ${capacity.label}.` : ''} Gaps are days the publisher did not
        file the figure.
      </span>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ ...GRID_EXPLORER_CHART_MARGIN.topLegend, top: 22 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.id} id={`${chartId}-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeFor(s.color, mode)} stopOpacity={0.28} />
                <stop offset="100%" stopColor={strokeFor(s.color, mode)} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={chartTheme.ink.gridline}
          />
          <XAxis {...gridChartXAxisProps(chartTheme, { dataKey: 'date', tickFormatter: shortDate, minTickGap: 26 })} />
          <YAxis {...gridChartYAxisProps(chartTheme, { splitUnit: unit })} />

          {/* The ordinary days before the break, shaded so the reader can see
              what the level was before there was an event to talk about. */}
          {shade && (
            <ReferenceArea
              x1={shade.from}
              x2={shade.to}
              fill={chartTheme.ink.axis}
              fillOpacity={0.1}
              // Bottom-left: the incident marker's own label sits top-left and
              // the two overlapped into "befothe break" at 1280px.
              label={{
                value: shade.label,
                position: 'insideBottomLeft',
                fontSize: 10,
                fill: chartTheme.ink.muted,
              }}
            />
          )}

          {typeof baselineMean === 'number' && (
            <ReferenceLine
              y={baselineMean}
              stroke={chartTheme.ink.muted}
              strokeDasharray="6 4"
              label={{
                value: `baseline mean ${baselineMean.toLocaleString('en-US', { maximumFractionDigits: 0 })} (derived)`,
                fontSize: 10,
                position: 'insideBottomRight',
                fill: chartTheme.ink.muted,
              }}
            />
          )}

          {markers.map((m) => (
            <ReferenceLine
              key={m.date}
              x={m.date}
              stroke={chartTheme.ink.muted}
              strokeOpacity={m.strong ? 0.85 : 0.35}
              strokeDasharray={m.strong ? undefined : '2 3'}
              label={
                m.strong
                  ? { value: m.label, fontSize: 10, position: 'top', fill: chartTheme.ink.muted, offset: 8 }
                  : undefined
              }
            />
          ))}

          {/* Printed capacity: a claim of the source's, drawn as a reference so
              it never reads as a measured series. */}
          {capacity && (
            <Line
              type="stepAfter"
              dataKey={capacity.id}
              stroke={chartTheme.ink.muted}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}

          {series.map((s) => {
            const color = strokeFor(s.color, mode);
            if (s.kind === 'bar') {
              return (
                <Bar
                  key={s.id}
                  dataKey={s.id}
                  fill={color}
                  fillOpacity={0.75}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              );
            }
            if (s.kind === 'area') {
              return (
                <Area
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${chartId}-${s.id})`}
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              );
            }
            return (
              <Line
                key={s.id}
                type="monotone"
                dataKey={s.id}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            );
          })}

          <Tooltip
            cursor={{ stroke: chartTheme.ink.axis, strokeDasharray: '3 3' }}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: `1px solid ${chartTheme.ink.gridline}`,
              borderRadius: 12,
              fontSize: 12,
            }}
            labelFormatter={(v) => longDate(String(v))}
            formatter={(value, name) => [
              `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 })} ${unit}`,
              labelOf(String(name)),
            ]}
          />
          {(series.length > 1 || capacity) && (
            <Legend
              formatter={(id: string) => labelOf(id)}
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              iconSize={9}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
