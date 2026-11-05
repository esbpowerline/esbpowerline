'use client';

/**
 * Small SVG charts for the phone Grid Explorer. No chart library: each figure
 * is a few hundred bytes of path data, renders on the first paint, and takes a
 * finger drag (pointer events with capture) to read any point.
 *
 * Every chart draws into a 360-unit-wide viewBox stretched to the container,
 * so it fills a phone edge to edge without measuring the DOM.
 */

import { useId, useRef, useState, type ReactNode } from 'react';

const W = 360;

export const fmt = (n: number | null | undefined, dp = 0) =>
  n == null || !Number.isFinite(n)
    ? '—'
    : n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });

function tick(v: number, span: number) {
  if (span < 400) return Math.round(v).toLocaleString('en-US');
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v));
}

/** Pointer tracking shared by every scrubbable chart. */
function useScrub(n: number, padL: number, padR: number, onScrub?: (i: number | null) => void) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const pick = (clientX: number) => {
    const el = ref.current;
    if (!el || n < 2) return;
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - padL) / (W - padL - padR)) * (n - 1))));
    setIdx(i);
    onScrub?.(i);
  };
  const end = () => {
    setIdx(null);
    onScrub?.(null);
  };
  const handlers = {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      pick(e.clientX);
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.buttons || e.pointerType === 'mouse') pick(e.clientX);
    },
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end,
  };
  return { ref, idx, handlers };
}

export type LineSeries = {
  values: (number | null)[];
  color: string;
  fill?: boolean;
  fillOpacity?: number;
  dash?: boolean;
  width?: number;
};

export function LineChart({
  labels,
  series,
  height = 180,
  axis = true,
  min: minIn,
  max: maxIn,
  band,
  onScrub,
  ariaLabel,
}: {
  labels: string[];
  series: LineSeries[];
  height?: number;
  axis?: boolean;
  min?: number;
  max?: number;
  /** Shade between two series (upper above lower), e.g. demand over generation. */
  band?: { upper: number; lower: number; color: string };
  onScrub?: (i: number | null) => void;
  ariaLabel: string;
}) {
  const gid = useId().replace(/:/g, '');
  const H = height;
  const P = { t: 10, r: 8, b: axis ? 22 : 4, l: axis ? 36 : 4 };
  const n = labels.length;
  const { ref, idx, handlers } = useScrub(n, P.l, P.r, onScrub);
  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null && Number.isFinite(v)));
  if (n < 2 || all.length === 0) return <div className="gp-empty" style={{ height }}>No data for this day</div>;
  let min = minIn ?? Math.min(...all);
  let max = maxIn ?? Math.max(...all);
  const span0 = max - min || 1;
  if (minIn == null) min -= span0 * 0.08;
  if (maxIn == null) max += span0 * 0.06;
  const x = (i: number) => P.l + (i / (n - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - min) / (max - min || 1)) * (H - P.t - P.b);
  const path = (vals: (number | null)[]) => {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v == null || !Number.isFinite(v)) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  let bandPath = '';
  if (band) {
    const up = series[band.upper]?.values ?? [];
    const lo = series[band.lower]?.values ?? [];
    const ok = up.every((v, i) => v != null && lo[i] != null);
    if (ok && up.length === n) {
      bandPath = up.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(Math.max(v as number, lo[i] as number))}`).join('');
      for (let i = n - 1; i >= 0; i--) bandPath += `L${x(i)},${y(lo[i] as number)}`;
      bandPath += 'Z';
    }
  }
  const ticks = [0, 1, 2, 3].map((k) => min + ((max - min) * k) / 3);
  const xl = [0, Math.round((n - 1) / 2), n - 1];
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="gp-svg"
      style={{ height: H }}
      role="img"
      aria-label={ariaLabel}
      {...handlers}
    >
      <defs>
        {series.map((s, i) =>
          s.fill ? (
            <linearGradient key={i} id={`${gid}-${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={s.fillOpacity ?? 0.32} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ) : null,
        )}
      </defs>
      {axis &&
        ticks.map((v, k) => (
          <g key={k}>
            <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className="gp-grid" />
            <text x={P.l - 6} y={y(v) + 3.5} textAnchor="end" className="gp-tick">
              {tick(v, max - min)}
            </text>
          </g>
        ))}
      {axis &&
        xl.map((i, k) => (
          <text key={k} x={x(i)} y={H - 6} textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'} className="gp-tick">
            {labels[i]}
          </text>
        ))}
      {bandPath && <path d={bandPath} fill={band!.color} opacity={0.5} />}
      {series.map((s, i) => {
        const d = path(s.values);
        if (!d) return null;
        return (
          <g key={i}>
            {s.fill && <path d={`${d}L${x(n - 1)},${H - P.b}L${x(0)},${H - P.b}Z`} fill={`url(#${gid}-${i})`} />}
            <path
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 2.2}
              strokeDasharray={s.dash ? '5 4' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
      {idx != null && (
        <g>
          <line x1={x(idx)} x2={x(idx)} y1={P.t} y2={H - P.b} className="gp-cursor" />
          {series.map((s, i) => {
            const v = s.values[idx];
            return v == null ? null : <circle key={i} cx={x(idx)} cy={y(v)} r={4} fill={s.color} className="gp-dot" />;
          })}
        </g>
      )}
    </svg>
  );
}

export function StackArea({
  labels,
  groups,
  rows,
  height = 200,
  onScrub,
  ariaLabel,
}: {
  labels: string[];
  groups: { name: string; color: string }[];
  /** rows[i][g] = value of group g at point i */
  rows: number[][];
  height?: number;
  onScrub?: (i: number | null) => void;
  ariaLabel: string;
}) {
  const H = height;
  const P = { t: 8, r: 6, b: 22, l: 36 };
  const n = rows.length;
  const { ref, idx, handlers } = useScrub(n, P.l, P.r, onScrub);
  if (n < 2) return <div className="gp-empty" style={{ height }}>No fuel curve for this day</div>;
  const tot = rows.map((r) => r.reduce((a, v) => a + v, 0));
  const max = Math.max(...tot, 1) * 1.06;
  const x = (i: number) => P.l + (i / (n - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const base = rows.map(() => 0);
  const paths = groups.map((g, gi) => {
    const top = rows.map((r, i) => base[i] + (r[gi] ?? 0));
    let d = top.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    for (let i = n - 1; i >= 0; i--) d += `L${x(i).toFixed(1)},${y(base[i]).toFixed(1)}`;
    top.forEach((v, i) => (base[i] = v));
    return <path key={g.name} d={`${d}Z`} fill={g.color} opacity={0.92} />;
  });
  const ticks = [0, 1, 2, 3].map((k) => (max * k) / 3);
  const xl = [0, Math.round((n - 1) / 2), n - 1];
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="gp-svg" style={{ height: H }} role="img" aria-label={ariaLabel} {...handlers}>
      {ticks.map((v, k) => (
        <g key={k}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className="gp-grid" />
          <text x={P.l - 6} y={y(v) + 3.5} textAnchor="end" className="gp-tick">{tick(v, max)}</text>
        </g>
      ))}
      {xl.map((i, k) => (
        <text key={k} x={x(i)} y={H - 6} textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'} className="gp-tick">{labels[i]}</text>
      ))}
      {paths}
      {idx != null && <line x1={x(idx)} x2={x(idx)} y1={P.t} y2={H - P.b} className="gp-cursor" />}
    </svg>
  );
}

export function Bars({
  values,
  labels,
  color,
  colors,
  highlight,
  height = 120,
  onPick,
  ariaLabel,
}: {
  /** null = not published: no bar is drawn, never a zero-height one. */
  values: (number | null)[];
  labels?: string[];
  color?: string;
  colors?: string[];
  highlight?: number | null;
  height?: number;
  onPick?: (i: number) => void;
  ariaLabel: string;
}) {
  const H = height;
  const n = values.length;
  if (!n) return null;
  const gap = n > 16 ? 2 : 6;
  const bw = (W - gap * (n - 1)) / n;
  const max = Math.max(...values.filter((v): v is number => v != null && Number.isFinite(v)), 1);
  return (
    <svg
      viewBox={`0 0 ${W} ${H + (labels ? 18 : 0)}`}
      className="gp-svg"
      role="img"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!onPick) return;
        const r = e.currentTarget.getBoundingClientRect();
        onPick(Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n))));
      }}
    >
      {values.map((v, i) => {
        if (v == null || !Number.isFinite(v)) return null;
        const h = Math.max(v > 0 ? 3 : 1.5, (v / max) * H);
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={H - h}
            width={bw}
            height={h}
            rx={Math.min(5, bw / 2)}
            fill={colors?.[i] ?? color ?? 'currentColor'}
            opacity={highlight == null || highlight === i ? 1 : 0.35}
          />
        );
      })}
      {labels?.map((l, i) =>
        l ? (
          <text key={i} x={i * (bw + gap) + bw / 2} y={H + 14} textAnchor="middle" className="gp-tick">
            {l}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function Spark({ values, color, height = 26 }: { values: (number | null)[]; color: string; height?: number }) {
  const v = values.filter((x): x is number => x != null);
  if (v.length < 2) return <div style={{ height }} />;
  return (
    <LineChart
      labels={values.map((_, i) => String(i))}
      series={[{ values, color, fill: true, width: 1.8 }]}
      height={height}
      axis={false}
      ariaLabel=""
    />
  );
}

export function StackBar({ parts, height = 14 }: { parts: { value: number; color: string; key: string }[]; height?: number }) {
  const tot = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  return (
    <div className="gp-stackbar" style={{ height, borderRadius: height / 2 }}>
      {parts
        .filter((p) => p.value > 0)
        .map((p) => (
          <div key={p.key} style={{ flex: p.value / tot, background: p.color }} />
        ))}
    </div>
  );
}

export function Meter({ value, max, color, cap }: { value: number; max: number; color: string; cap?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="gp-meter">
      <div style={{ width: `${pct}%`, background: color }} />
      {cap != null && max > 0 && <span className="gp-meter__cap" style={{ left: `${Math.min(100, (cap / max) * 100)}%` }} />}
    </div>
  );
}

export function Legend({ items }: { items: { label: ReactNode; color: string; line?: boolean }[] }) {
  return (
    <div className="gp-legend">
      {items.map((it, i) => (
        <span key={i}>
          <i className={it.line ? 'is-line' : ''} style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
