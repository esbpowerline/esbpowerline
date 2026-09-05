'use client';

import { useId } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

/**
 * One event-study card's chart: daily points across the study window.
 *
 * `connectNulls={false}` on every line is the load-bearing choice, exactly as
 * in TimeMachineTab: a day the publisher did not file renders as a break, and
 * a chart that joined across it would draw a claim no source made. The series
 * arrive with their nulls intact from `buildEventStudy` — nothing upstream has
 * smoothed them.
 *
 * Colours come from chart-palette only. `{kind:'fuel'}` for the fuel series so
 * gas-fired generation wears the same colour it wears on every other chart on
 * the site; `{kind:'slot'}` for everything else, with slots chosen per card so
 * no frame repeats one.
 */

export type EventChartColor =
  | { kind: 'fuel'; name: string }
  | { kind: 'slot'; index: number };

export interface EventChartSeries {
  id: string;
  label: string;
  color: EventChartColor;
  points: Array<{ date: string; value: number | null }>;
}

function strokeFor(color: EventChartColor): string {
  if (color.kind === 'fuel' && isKnownFuel(color.name)) return resolveFuelColor(color.name);
  return categoricalSlot(color.kind === 'slot' ? color.index : 0);
}

/** "21 Jul" — enough on a 72-day axis; the tooltip carries the full date. */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d)} ${months[Number(m) - 1]}`;
}

export default function EventStudyChart({
  series,
  unit,
  /** Optional DERIVED reference: the baseline mean, drawn as a labelled line. */
  baselineMean,
  height = 260,
}: {
  series: EventChartSeries[];
  unit: string;
  baselineMean?: number | null;
  height?: number;
}) {
  const chartId = useId();
  // Merge to one row per date; a null stays null so recharts breaks the line.
  const byDate = new Map<string, Record<string, number | null | string>>();
  for (const s of series) {
    for (const p of s.points) {
      const row = byDate.get(p.date) ?? { date: p.date };
      row[s.id] = p.value;
      byDate.set(p.date, row);
    }
  }
  const data = [...byDate.values()].sort((a, b) =>
    String(a.date) < String(b.date) ? -1 : 1,
  );

  return (
    <div style={{ width: '100%', height }} aria-describedby={`${chartId}-desc`}>
      <span id={`${chartId}-desc`} className="sr-only">
        {series.map((s) => s.label).join(', ')} in {unit}, one point per day; gaps are days the
        publisher did not file the figure.
      </span>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 11 }}
            minTickGap={28}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={52}
            domain={['auto', 'auto']}
            className="text-muted-foreground"
          />
          <Tooltip
            labelFormatter={(v) => String(v)}
            // A null never reaches the tooltip as 0 — recharts omits the entry,
            // and the axis break already says the day is unfiled.
            formatter={(value, name) => [
              `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 })} ${unit}`,
              series.find((s) => s.id === String(name))?.label ?? String(name),
            ]}
          />
          {series.length > 1 && (
            <Legend
              formatter={(id: string) => series.find((s) => s.id === id)?.label ?? id}
              wrapperStyle={{ fontSize: 12 }}
            />
          )}
          {typeof baselineMean === 'number' && (
            <ReferenceLine
              y={baselineMean}
              strokeDasharray="6 4"
              className="stroke-muted-foreground/60"
              label={{ value: 'baseline mean (derived)', fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          {series.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              stroke={strokeFor(s.color)}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
