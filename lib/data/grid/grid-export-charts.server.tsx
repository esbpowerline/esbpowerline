import 'server-only';

import { Svg, G, Rect, Line, Polyline, Polygon, Circle, Path, Text } from '@react-pdf/renderer';
import { F, FB } from '@/lib/data/grid/grid-export-fonts.server';

/**
 * Editorial chart toolkit for the grid export report. Native react-pdf SVG —
 * no external libraries. Print-safe by construction: the second line series is
 * dashed (so B&W printing keeps series apart), every mark is direct-labelled,
 * and identity never rests on colour alone.
 */

const INK = '#111827';
const SECONDARY = '#475569';
const MUTED = '#94a3b8';
const HAIR = '#e5e7eb';
const BASELINE = '#cbd5e1';
export const SERIES_BLUE = '#2563eb';
export const SERIES_ORANGE = '#ea580c';
export const GOOD = '#16a34a';
export const CRITICAL = '#dc2626';

/** Line dash per series index — the B&W-print channel (solid / dashed / dotted). */
const SERIES_DASH: Array<string | undefined> = [undefined, '4 2.5', '1.2 2'];

/** Canonical fuel colours (match the site's Grid Explorer identities). */
export const FUEL_COLORS: Record<string, string> = {
  Gas: '#0ea5e9',
  Coal: '#64748b',
  HFO: '#f97316',
  Hydro: '#06b6d4',
  Solar: '#eab308',
  Imports: '#a855f7',
  'HSD (Diesel)': '#ef4444',
  Wind: '#14b8a6',
};

function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return '';
  const abs = Math.abs(v);
  const digits = abs >= 1000 ? 0 : abs >= 10 ? 1 : 2;
  return v.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function trunc(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Rough text width at a given font size (Source Sans metrics ≈ 0.5em/char). */
const textW = (s: string, size: number) => s.length * size * 0.52;

// ---- Horizontal bar chart (categorical magnitude) --------------------------

export type BarDatum = { label: string; value: number; color?: string };

export function HBarChart({
  data,
  width = 768,
  unit = '',
  accent = SERIES_BLUE,
  showShare = false,
}: {
  data: BarDatum[];
  width?: number;
  unit?: string;
  accent?: string;
  showShare?: boolean;
}) {
  const rowH = 13;
  const gap = 5;
  const padY = 4;
  // Label gutter sized to the longest label — full names, no truncation mid-word.
  const labelW = Math.min(238, Math.max(90, Math.ceil(Math.max(...data.map((d) => textW(d.label, 6.8)))) + 6));
  const valueW = showShare ? 96 : 66;
  const plotX = labelW + 8;
  const plotW = Math.max(40, width - plotX - valueW);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  const height = padY * 2 + data.length * rowH + (data.length - 1) * gap;

  return (
    <Svg width={width} height={height}>
      {/* baseline spine */}
      <Line x1={plotX - 3} y1={padY} x2={plotX - 3} y2={height - padY} stroke={BASELINE} strokeWidth={0.75} />
      {data.map((d, i) => {
        const y = padY + i * (rowH + gap);
        const bw = Math.max(1, (d.value / max) * plotW);
        const share = (d.value / total) * 100;
        return (
          <G key={i}>
            <Text x={labelW} y={y + rowH * 0.7} textAnchor="end" style={{ fontFamily: F, fontSize: 6.8, fill: SECONDARY }}>
              {trunc(d.label, 44)}
            </Text>
            <Rect x={plotX} y={y + 2.5} width={bw} height={rowH - 5} fill={d.color ?? accent} rx={1.2} />
            <Text
              x={plotX + bw + 4}
              y={y + rowH * 0.7}
              textAnchor="start"
              style={{ fontFamily: FB, fontSize: 6.6, fill: INK }}
            >
              {fmtNum(d.value)}
            </Text>
            <Text
              x={plotX + bw + 4 + textW(fmtNum(d.value), 6.6) + 3}
              y={y + rowH * 0.7}
              textAnchor="start"
              style={{ fontFamily: F, fontSize: 6, fill: MUTED }}
            >
              {unit}{showShare ? ` · ${share.toFixed(1)}%` : ''}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}

// ---- Line chart (same-unit time series, 1–3 series) ------------------------

export type LineSeries = { name: string; color: string; values: number[] };

export function LineChart({
  series,
  xLabels,
  width = 768,
  height = 168,
  unit = '',
  annotateMax = false,
  fillBetween = false,
  gapLabel,
}: {
  series: LineSeries[];
  xLabels: string[];
  width?: number;
  height?: number;
  unit?: string;
  /** Ring + label on series[0]'s maximum point (auto-skipped when every point is labelled). */
  annotateMax?: boolean;
  /** Shade the area between series[0] and series[1] (requires 2 series). */
  fillBetween?: boolean;
  /** Name of the shaded gap (e.g. "deficit", "unserved gap"). */
  gapLabel?: string;
}) {
  const padL = 42;
  const padR = 86;
  const padT = 28;
  const padB = 20;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const n = xLabels.length;
  const all = series.flatMap((s) => s.values);
  const rawMax = Math.max(1, ...all);
  const rawMin = Math.min(0, ...all);
  const max = rawMax + (rawMax - rawMin) * 0.12;
  const min = rawMin;
  const span = max - min || 1;

  const xAt = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - ((v - min) / span) * plotH;

  const ticks = [0, 1 / 3, 2 / 3, 1].map((t) => min + t * span);
  const labelEvery = Math.max(1, Math.ceil(n / 7));

  // Direct value labels on every point for short series ("pricing on the dots").
  const labelAllPoints = n <= 12 && series.length <= 2;
  const showMaxAnnotation = annotateMax && !labelAllPoints;

  // Endpoint labels — push apart any pair that lands closer than 9pt (any series count).
  const endYs = series.map((s) => yAt(s.values[n - 1]));
  const endLabelYs = [...endYs];
  const order = endLabelYs.map((_, i) => i).sort((a, b) => endLabelYs[a] - endLabelYs[b]);
  for (let pass = 0; pass < 3; pass++) {
    for (let k = 1; k < order.length; k++) {
      const prev = order[k - 1];
      const cur = order[k];
      const gap = endLabelYs[cur] - endLabelYs[prev];
      if (gap < 9) {
        const push = (9 - gap) / 2;
        endLabelYs[prev] -= push;
        endLabelYs[cur] += push;
      }
    }
  }

  // Max annotation on series[0]
  let maxI = 0;
  if (showMaxAnnotation && series[0]) {
    series[0].values.forEach((v, i) => {
      if (v > series[0].values[maxI]) maxI = i;
    });
  }

  // Legend layout — cumulative x so items sit evenly regardless of name length.
  const legendItems: Array<{ name: string; color: string; dash?: string; isGap?: boolean }> = series.map((s, i) => ({
    name: s.name,
    color: s.color,
    dash: SERIES_DASH[i],
  }));
  if (gapLabel && fillBetween && series.length === 2) {
    legendItems.push({ name: gapLabel, color: series[0].color, isGap: true });
  }
  let legendX = padL;
  const legendPos = legendItems.map((it) => {
    const x = legendX;
    legendX += 16 + textW(it.name, 6.6) + 18;
    return x;
  });

  return (
    <Svg width={width} height={height}>
      {/* legend */}
      {legendItems.map((it, i) => (
        <G key={`lg${i}`}>
          {it.isGap ? (
            <Rect x={legendPos[i]} y={6.5} width={11} height={6} fill={it.color} fillOpacity={0.12} />
          ) : (
            <Line
              x1={legendPos[i]}
              y1={9.5}
              x2={legendPos[i] + 12}
              y2={9.5}
              stroke={it.color}
              strokeWidth={1.8}
              strokeDasharray={it.dash}
            />
          )}
          <Text x={legendPos[i] + 16} y={11.5} textAnchor="start" style={{ fontFamily: F, fontSize: 6.6, fill: SECONDARY }}>
            {it.name}
          </Text>
        </G>
      ))}
      {unit ? (
        <Text x={padL + plotW} y={11.5} textAnchor="end" style={{ fontFamily: F, fontSize: 6, fill: MUTED }}>
          {unit}
        </Text>
      ) : null}

      {/* gridlines + y ticks */}
      {ticks.map((t, i) => (
        <G key={`t${i}`}>
          <Line
            x1={padL}
            y1={yAt(t)}
            x2={padL + plotW}
            y2={yAt(t)}
            stroke={HAIR}
            strokeWidth={0.5}
            strokeDasharray={i === 0 ? undefined : '2 3'}
          />
          <Text x={padL - 4} y={yAt(t) + 2} textAnchor="end" style={{ fontFamily: F, fontSize: 6, fill: MUTED }}>
            {fmtNum(t)}
          </Text>
        </G>
      ))}

      {/* x labels */}
      {xLabels.map((lbl, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <Text key={`x${i}`} x={xAt(i)} y={height - 6} textAnchor="middle" style={{ fontFamily: F, fontSize: 5.8, fill: MUTED }}>
            {trunc(lbl, 10)}
          </Text>
        ) : null,
      )}

      {/* shaded gap between the two series */}
      {fillBetween && series.length === 2 && n > 1 ? (
        <Polygon
          points={[
            ...series[0].values.map((v, i) => `${xAt(i)},${yAt(v)}`),
            ...series[1].values.map((v, i) => `${xAt(n - 1 - i)},${yAt(series[1].values[n - 1 - i])}`),
          ].join(' ')}
          fill={series[0].color}
          fillOpacity={0.08}
        />
      ) : null}

      {/* series lines */}
      {series.map((s, si) => (
        <G key={si}>
          <Polyline
            points={s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={1.6}
            strokeDasharray={SERIES_DASH[si]}
          />
          {n <= 31 &&
            s.values.map((v, i) => <Circle key={i} cx={xAt(i)} cy={yAt(v)} r={1.5} fill={s.color} />)}
          {/* endpoint value */}
          <Text
            x={xAt(n - 1) + 5}
            y={endLabelYs[si] + 2}
            textAnchor="start"
            style={{ fontFamily: FB, fontSize: 6.6, fill: s.color }}
          >
            {fmtNum(s.values[n - 1])}
          </Text>
        </G>
      ))}

      {/* per-point value labels (short series) — upper value above, lower below,
          x-clamped so first/last labels never collide with axis numbers */}
      {labelAllPoints &&
        series.map((s, si) =>
          s.values.map((v, i) => {
            if (i === n - 1) return null; // endpoint already labelled at right
            let above = true;
            if (series.length === 2) {
              const other = series[1 - si].values[i];
              above = v >= other;
              if (v === other) above = si === 0;
            }
            const y = above ? yAt(v) - 4.5 : yAt(v) + 10;
            const halfW = textW(fmtNum(v), 5.6) / 2;
            const cx = Math.min(Math.max(xAt(i), padL + halfW + 2), padL + plotW - halfW - 2);
            return (
              <Text
                key={`pv${si}-${i}`}
                x={cx}
                y={Math.min(Math.max(y, padT + 4), padT + plotH + 8)}
                textAnchor="middle"
                style={{ fontFamily: F, fontSize: 5.6, fill: SECONDARY }}
              >
                {fmtNum(v)}
              </Text>
            );
          }),
        )}

      {/* max annotation (long series only) */}
      {showMaxAnnotation && series[0] && n > 1 ? (
        <G>
          <Circle cx={xAt(maxI)} cy={yAt(series[0].values[maxI])} r={3.2} stroke={series[0].color} strokeWidth={1} fill="none" />
          <Text
            x={Math.min(Math.max(xAt(maxI), padL + 34), padL + plotW - 34)}
            y={Math.max(yAt(series[0].values[maxI]) - 6, padT + 6)}
            textAnchor="middle"
            style={{ fontFamily: FB, fontSize: 6, fill: INK }}
          >
            {`peak ${fmtNum(series[0].values[maxI])} · ${trunc(xLabels[maxI], 10)}`}
          </Text>
        </G>
      ) : null}
    </Svg>
  );
}

// ---- Column chart (time-series magnitude / polarity) -----------------------

export function ColumnChart({
  data,
  width = 768,
  height = 158,
  unit = '',
  signColors = false,
  accent = SERIES_BLUE,
}: {
  data: BarDatum[];
  width?: number;
  height?: number;
  unit?: string;
  signColors?: boolean;
  accent?: string;
}) {
  const padL = 42;
  const padR = 14;
  const padT = 18;
  const padB = 22;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const n = data.length;
  const values = data.map((d) => d.value);
  const rawMax = Math.max(0, ...values);
  const rawMin = Math.min(0, ...values);
  const max = rawMax + (rawMax - rawMin) * 0.14;
  const min = rawMin - (rawMax - rawMin) * 0.05;
  const span = max - min || 1;
  const yAt = (v: number) => padT + plotH - ((v - min) / span) * plotH;
  const zeroY = yAt(0);

  const slot = plotW / n;
  const barW = Math.min(26, slot * 0.58);
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  return (
    <Svg width={width} height={height}>
      {/* sign legend — position above/below zero carries the sign in B&W */}
      {signColors ? (
        <G>
          <Rect x={padL} y={5} width={8} height={5} fill={GOOD} rx={1} />
          <Text x={padL + 11} y={9.5} style={{ fontFamily: F, fontSize: 6, fill: SECONDARY }}>profit (above zero)</Text>
          <Rect x={padL + 72} y={5} width={8} height={5} fill={CRITICAL} rx={1} />
          <Text x={padL + 83} y={9.5} style={{ fontFamily: F, fontSize: 6, fill: SECONDARY }}>loss (below zero)</Text>
        </G>
      ) : null}
      {unit ? (
        <Text x={padL + plotW} y={9.5} textAnchor="end" style={{ fontFamily: F, fontSize: 6, fill: MUTED }}>
          {unit}
        </Text>
      ) : null}
      <Line x1={padL} y1={zeroY} x2={padL + plotW} y2={zeroY} stroke={BASELINE} strokeWidth={0.75} />
      {data.map((d, i) => {
        const cx = padL + slot * i + slot / 2;
        const x = cx - barW / 2;
        const top = Math.min(yAt(d.value), zeroY);
        const bh = Math.max(1, Math.abs(yAt(d.value) - zeroY));
        const color = signColors ? (d.value >= 0 ? GOOD : CRITICAL) : d.color ?? accent;
        return (
          <G key={i}>
            <Rect x={x} y={top} width={barW} height={bh} fill={color} rx={1.2} />
            <Text
              x={cx}
              y={d.value >= 0 ? top - 2.5 : top + bh + 6}
              textAnchor="middle"
              style={{ fontFamily: F, fontSize: 5.8, fill: SECONDARY }}
            >
              {fmtNum(d.value)}
            </Text>
            {i % labelEvery === 0 || i === n - 1 ? (
              <Text x={cx} y={height - 7} textAnchor="middle" style={{ fontFamily: F, fontSize: 5.8, fill: MUTED }}>
                {trunc(d.label, 9)}
              </Text>
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
}

// ---- Donut chart (share-of-total identity) ---------------------------------

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

export function DonutChart({
  data,
  size = 112,
  thickness = 15,
  centerLabel,
  centerSub,
}: {
  data: BarDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  const r = (size - thickness) / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;
  const GAP_DEG = 2.5;

  let angle = -90;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const sweep = (d.value / total) * 360;
      const seg = { start: angle, sweep, color: d.color ?? SERIES_BLUE };
      angle += sweep;
      return seg;
    });

  return (
    <Svg width={size} height={size}>
      {segments.map((s, i) => {
        if (s.sweep >= 359.5) {
          return <Circle key={i} cx={cx} cy={cy} r={r} stroke={s.color} strokeWidth={thickness} fill="none" />;
        }
        const gap = s.sweep > GAP_DEG * 2 ? GAP_DEG / 2 : 0;
        const a0 = s.start + gap;
        const a1 = s.start + s.sweep - gap;
        const [x0, y0] = polar(cx, cy, r, a0);
        const [x1, y1] = polar(cx, cy, r, a1);
        const large = a1 - a0 > 180 ? 1 : 0;
        return (
          <Path
            key={i}
            d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
            stroke={s.color}
            strokeWidth={thickness}
            fill="none"
          />
        );
      })}
      {centerLabel ? (
        <Text x={cx} y={cy - 1} textAnchor="middle" style={{ fontFamily: FB, fontSize: 10.5, fill: INK }}>
          {centerLabel}
        </Text>
      ) : null}
      {centerSub ? (
        <Text x={cx} y={cy + 8} textAnchor="middle" style={{ fontFamily: F, fontSize: 5.5, fill: MUTED }}>
          {centerSub}
        </Text>
      ) : null}
    </Svg>
  );
}

// ---- Sparkline (tiny trend, no axes) ---------------------------------------

export function Sparkline({
  values,
  width = 64,
  height = 16,
  color = SERIES_BLUE,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * (width - 2) + 1},${height - 2 - ((v - min) / span) * (height - 4)}`)
    .join(' ');
  const last = values[values.length - 1];
  const lx = width - 1;
  const ly = height - 2 - ((last - min) / span) * (height - 4);
  return (
    <Svg width={width} height={height}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} />
      <Circle cx={lx} cy={ly} r={1.6} fill={color} />
    </Svg>
  );
}

// ---- Legend (standalone, kept for compatibility) ---------------------------

export function ChartLegend({ items }: { items: Array<{ name: string; color: string }> }) {
  return (
    <Svg width={768} height={12}>
      {items.map((it, i) => {
        const x = i * 110;
        return (
          <G key={i}>
            <Rect x={x} y={4} width={11} height={2.6} fill={it.color} rx={1.3} />
            <Text x={x + 15} y={9} textAnchor="start" style={{ fontFamily: F, fontSize: 6.5, fill: SECONDARY }}>
              {it.name}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}
