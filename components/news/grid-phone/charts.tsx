'use client';

/**
 * Charts for the phone Grid Explorer.
 *
 * The first version drew into a fixed 360-unit viewBox with
 * preserveAspectRatio="none" and a fixed pixel height. That stretched every
 * glyph sideways on a 412px phone and squashed the plot to a strip whatever
 * the screen — the classic "chart as a ribbon" look. Now each chart measures
 * its container (ResizeObserver) and draws in real pixels: text is never
 * scaled, the height follows the width (aspect + clamp), the y-axis labels sit
 * inside the plot above their gridlines so the data runs edge to edge, and the
 * axis uses nice round steps.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const fmt = (n: number | null | undefined, dp = 0) =>
  n == null || !Number.isFinite(n)
    ? '—'
    : n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Width of the element, tracked. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useIso(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

/** Round axis steps: 1, 2, 2.5, 5 × 10^n. */
export function niceTicks(min: number, max: number, count = 4) {
  if (!(max > min)) return { lo: min - 1, hi: max + 1, ticks: [min] };
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
  return { lo, hi, ticks };
}

function tickLabel(v: number, step: number) {
  if (Math.abs(v) >= 1000 && step >= 500) return `${+(v / 1000).toFixed(step >= 1000 ? 0 : 1)}k`;
  return v.toLocaleString('en-US', { maximumFractionDigits: step < 1 ? 2 : step < 10 ? 1 : 0 });
}

/** Which x positions get a label: whole six-hour marks for a day, else ~5 even picks. */
function xLabelIdx(labels: string[], width: number) {
  const n = labels.length;
  if (n <= 1) return [0];
  const hourly = labels.every((l) => /^\d{2}:\d{2}$/.test(l));
  if (hourly) {
    const marks = labels.map((l, i) => (/^(00|06|12|18):00$/.test(l) ? i : -1)).filter((i) => i >= 0);
    if (marks.length >= 3) return marks;
  }
  const k = Math.max(2, Math.min(6, Math.floor(width / 70)));
  return Array.from(new Set(Array.from({ length: k }, (_, j) => Math.round((j * (n - 1)) / (k - 1)))));
}

export type LineSeries = {
  values: (number | null)[];
  color: string;
  fill?: boolean;
  fillOpacity?: number;
  dash?: boolean;
  width?: number;
  label?: string;
};

type Frame = { w: number; h: number; l: number; r: number; t: number; b: number };

function Axes({ f, ticks, y, labels, x, idx, step }: { f: Frame; ticks: number[]; y: (v: number) => number; labels: string[]; x: (i: number) => number; idx: number[]; step: number }) {
  return (
    <g aria-hidden>
      {ticks.map((v, k) => (
        <g key={k}>
          <line x1={f.l} x2={f.w - f.r} y1={y(v)} y2={y(v)} className={k === 0 ? 'gp-base' : 'gp-grid'} />
          {k > 0 && f.l === 0 && (
            <text x={0} y={y(v) - 4} className="gp-tick">
              {tickLabel(v, step)}
            </text>
          )}
          {f.l > 0 && (
            <text x={f.l - 6} y={y(v) + 4} textAnchor="end" className="gp-tick gp-tick--out">
              {tickLabel(v, step)}
            </text>
          )}
        </g>
      ))}
      {idx.map((i, k) => (
        <text key={k} x={x(i)} y={f.h - 4} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'} className="gp-tick">
          {labels[i]}
        </text>
      ))}
    </g>
  );
}

function useScrub(n: number, f: Frame | null, onScrub?: (i: number | null) => void) {
  const svg = useRef<SVGSVGElement | null>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const pick = (clientX: number) => {
    const el = svg.current;
    if (!el || !f || n < 2) return;
    const r = el.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.round(((clientX - r.left - f.l) / (f.w - f.l - f.r)) * (n - 1))));
    setIdx(i);
    onScrub?.(i);
  };
  const end = () => {
    setIdx(null);
    onScrub?.(null);
  };
  return {
    svg,
    idx,
    handlers: {
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
    },
  };
}

/** Height from width: `aspect` × width, clamped. */
const heightFor = (w: number, aspect: number, min: number, max: number) => Math.round(Math.max(min, Math.min(max, w * aspect)));

export function LineChart({
  labels,
  series,
  aspect = 0.62,
  minH = 220,
  maxH = 360,
  axis = true,
  min: minIn,
  max: maxIn,
  band,
  onScrub,
  ariaLabel,
  marker,
}: {
  labels: string[];
  series: LineSeries[];
  aspect?: number;
  minH?: number;
  maxH?: number;
  axis?: boolean;
  min?: number;
  max?: number;
  band?: { upper: number; lower: number; color: string };
  onScrub?: (i: number | null) => void;
  ariaLabel: string;
  /** A labelled vertical rule, e.g. the hour a forecast was issued. */
  marker?: { index: number; label: string };
}) {
  const gid = useId().replace(/:/g, '');
  const { ref, w } = useWidth<HTMLDivElement>();
  const h = axis ? heightFor(w, aspect, minH, maxH) : minH;
  // A 30px label gutter: labels inside the plot collided with the line at the left edge.
  const f: Frame = { w, h, l: axis ? 30 : 0, r: 0, t: axis ? 10 : 3, b: axis ? 22 : 3 };
  const n = labels.length;
  const { svg, idx, handlers } = useScrub(n, w ? f : null, onScrub);
  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null && Number.isFinite(v)));
  const empty = n < 2 || all.length === 0;

  let body: ReactNode = null;
  if (w > 0 && !empty) {
    const dataMin = minIn ?? Math.min(...all);
    const dataMax = maxIn ?? Math.max(...all);
    const nt = axis ? niceTicks(dataMin, dataMax, h > 260 ? 5 : 4) : { lo: dataMin, hi: dataMax, ticks: [] as number[] };
    const lo = minIn ?? nt.lo;
    const hi = maxIn ?? nt.hi;
    const step = nt.ticks.length > 1 ? nt.ticks[1] - nt.ticks[0] : 1;
    const x = (i: number) => f.l + (i / (n - 1)) * (w - f.l - f.r);
    const y = (v: number) => f.t + (1 - (v - lo) / (hi - lo || 1)) * (h - f.t - f.b);
    const path = (vals: (number | null)[]) => {
      let d = '';
      let pen = false;
      vals.forEach((v, i) => {
        if (v == null || !Number.isFinite(v)) return void (pen = false);
        d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
      });
      return d;
    };
    let bandPath = '';
    if (band) {
      const up = series[band.upper]?.values ?? [];
      const dn = series[band.lower]?.values ?? [];
      if (up.length === n && up.every((v, i) => v != null && dn[i] != null)) {
        bandPath = up.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(Math.max(v as number, dn[i] as number))}`).join('');
        for (let i = n - 1; i >= 0; i--) bandPath += `L${x(i)},${y(dn[i] as number)}`;
        bandPath += 'Z';
      }
    }
    body = (
      <>
        <defs>
          {series.map((s, i) =>
            s.fill ? (
              <linearGradient key={i} id={`${gid}-${i}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={s.fillOpacity ?? 0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ) : null,
          )}
        </defs>
        {axis && <Axes f={f} ticks={nt.ticks} y={y} labels={labels} x={x} idx={xLabelIdx(labels, w)} step={step} />}
        {marker && marker.index >= 0 && marker.index < n && (
          <g aria-hidden>
            <line x1={x(marker.index)} x2={x(marker.index)} y1={f.t - 6} y2={h - f.b} className="gp-marker" />
            <text x={x(marker.index) + 4} y={f.t - 6} className="gp-tick gp-tick--strong">{marker.label}</text>
          </g>
        )}
        {bandPath && <path d={bandPath} fill={band!.color} opacity={0.45} />}
        {series.map((s, i) => {
          const d = path(s.values);
          if (!d) return null;
          return (
            <g key={i}>
              {s.fill && <path d={`${d}L${x(n - 1)},${h - f.b}L${x(0)},${h - f.b}Z`} fill={`url(#${gid}-${i})`} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dash ? '4 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {idx != null && (
          <g aria-hidden>
            <line x1={x(idx)} x2={x(idx)} y1={f.t - 6} y2={h - f.b} className="gp-cursor" />
            {series.map((s, i) => {
              const v = s.values[idx];
              return v == null ? null : <circle key={i} cx={x(idx)} cy={y(v)} r={4.5} fill={s.color} className="gp-dot" />;
            })}
          </g>
        )}
      </>
    );
  }
  return (
    <div ref={ref} className="gp-plot">
      {empty ? (
        <div className="gp-empty" style={{ height: Math.max(120, h * 0.6) }}>Not published for this day</div>
      ) : (
        <svg ref={svg} width={w} height={h} viewBox={`0 0 ${w || 1} ${h}`} className="gp-svg" role="img" aria-label={ariaLabel} {...handlers}>
          {body}
        </svg>
      )}
    </div>
  );
}

export function StackArea({
  labels,
  groups,
  rows,
  aspect = 0.7,
  minH = 240,
  maxH = 380,
  onScrub,
  ariaLabel,
}: {
  labels: string[];
  groups: { name: string; color: string }[];
  /**
   * rows[i][g]. A null anywhere in a row makes that whole point a gap: with
   * one layer unpublished the stack's height is unknown, so nothing is drawn
   * there rather than a total that silently counts the gap as zero.
   */
  rows: (number | null)[][];
  aspect?: number;
  minH?: number;
  maxH?: number;
  onScrub?: (i: number | null) => void;
  ariaLabel: string;
}) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const h = heightFor(w, aspect, minH, maxH);
  // Labels sit in a left gutter here: over a filled stack they would vanish.
  const f: Frame = { w, h, l: 30, r: 0, t: 10, b: 22 };
  const n = rows.length;
  const { svg, idx, handlers } = useScrub(n, w ? f : null, onScrub);
  if (n < 2) return <div className="gp-empty" style={{ height: 160 }}>Not published for this day</div>;
  let body: ReactNode = null;
  if (w > 0) {
    const ok = rows.map((r) => r.every((v) => v != null && Number.isFinite(v)));
    const tot = rows.map((r, i) => (ok[i] ? r.reduce<number>((a, v) => a + (v as number), 0) : 0));
    const nt = niceTicks(0, Math.max(...tot, 1), h > 280 ? 5 : 4);
    const step = nt.ticks[1] - nt.ticks[0];
    const x = (i: number) => f.l + (i / (n - 1)) * (w - f.l);
    const y = (v: number) => f.t + (1 - v / nt.hi) * (h - f.t - f.b);
    // Contiguous runs of complete points; each run is drawn as its own band.
    const runs: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      if (!ok[i]) continue;
      if (runs.length && runs[runs.length - 1][1] === i - 1) runs[runs.length - 1][1] = i;
      else runs.push([i, i]);
    }
    const base = rows.map(() => 0);
    const paths = groups.map((g, gi) => {
      const top = rows.map((r, i) => base[i] + (ok[i] ? (r[gi] as number) : 0));
      let d = '';
      for (const [a0, a1] of runs) {
        const lo = a0 === a1 ? Math.max(0, a0 - 0.25) : a0;
        const hi = a0 === a1 ? Math.min(n - 1, a1 + 0.25) : a1;
        const xs = a0 === a1 ? [lo, hi] : Array.from({ length: a1 - a0 + 1 }, (_, k) => a0 + k);
        const at = (i: number) => Math.round(Math.min(Math.max(i, a0), a1));
        d += xs.map((i, k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(top[at(i)]).toFixed(1)}`).join('');
        for (let k = xs.length - 1; k >= 0; k--) d += `L${x(xs[k]).toFixed(1)},${y(base[at(xs[k])]).toFixed(1)}`;
        d += 'Z';
      }
      top.forEach((v, i) => (base[i] = v));
      return d ? <path key={g.name} d={d} fill={g.color} stroke="var(--gp-surface)" strokeWidth={0.6} /> : null;
    });
    body = (
      <>
        <Axes f={f} ticks={nt.ticks} y={y} labels={labels} x={x} idx={xLabelIdx(labels, w)} step={step} />
        {paths}
        {idx != null && <line x1={x(idx)} x2={x(idx)} y1={f.t - 6} y2={h - f.b} className="gp-cursor gp-cursor--on-fill" />}
      </>
    );
  }
  return (
    <div ref={ref} className="gp-plot">
      <svg ref={svg} width={w} height={h} viewBox={`0 0 ${w || 1} ${h}`} className="gp-svg" role="img" aria-label={ariaLabel} {...handlers}>
        {body}
      </svg>
    </div>
  );
}

export function Bars({
  values,
  labels,
  color,
  colors,
  highlight,
  height = 160,
  onPick,
  ariaLabel,
  valueLabels = false,
  dp = 0,
}: {
  /** null = not published: no bar, never a zero-height one. */
  values: (number | null)[];
  labels?: string[];
  color?: string;
  colors?: string[];
  highlight?: number | null;
  height?: number;
  onPick?: (i: number) => void;
  ariaLabel: string;
  /** Print each bar's value above it (for short series). */
  valueLabels?: boolean;
  dp?: number;
}) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const n = values.length;
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  const top = valueLabels ? 18 : 4;
  const bottom = labels ? 20 : 0;
  const H = height;
  let body: ReactNode = null;
  if (w > 0 && n) {
    const gap = n > 20 ? 2 : n > 10 ? 4 : 8;
    const bw = (w - gap * (n - 1)) / n;
    const max = Math.max(...nums, 1);
    const plotH = H - top - bottom;
    const every = labels ? Math.ceil((labels.filter(Boolean).length * 34) / w) || 1 : 1;
    body = values.map((v, i) => {
      const xi = i * (bw + gap);
      const hv = v == null || !Number.isFinite(v) ? null : Math.max(v > 0 ? 3 : 1.5, (v / max) * plotH);
      const on = highlight == null || highlight === i;
      return (
        <g key={i}>
          {hv != null && <rect x={xi} y={top + plotH - hv} width={bw} height={hv} rx={Math.min(4, bw / 3)} fill={colors?.[i] ?? color ?? 'currentColor'} opacity={on ? 1 : 0.3} />}
          {valueLabels && hv != null && on && (
            <text x={xi + bw / 2} y={top + plotH - hv - 5} textAnchor="middle" className="gp-tick gp-tick--strong">{fmt(v, dp)}</text>
          )}
          {labels?.[i] && i % every === 0 && (
            <text x={xi + bw / 2} y={H - 5} textAnchor="middle" className={`gp-tick${highlight === i ? ' gp-tick--strong' : ''}`}>{labels[i]}</text>
          )}
        </g>
      );
    });
  }
  return (
    <div ref={ref} className="gp-plot">
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w || 1} ${H}`}
        className="gp-svg"
        role="img"
        aria-label={ariaLabel}
        onClick={(e) => {
          if (!onPick || !n) return;
          const r = e.currentTarget.getBoundingClientRect();
          onPick(Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n))));
        }}
      >
        {body}
      </svg>
    </div>
  );
}

export function StackBar({ parts, height = 10 }: { parts: { value: number; color: string; key: string }[]; height?: number }) {
  const tot = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  return (
    <div className="gp-stackbar" style={{ height, borderRadius: height / 2 }} aria-hidden>
      {parts.filter((p) => p.value > 0).map((p) => (
        <div key={p.key} style={{ flex: p.value / tot, background: p.color }} />
      ))}
    </div>
  );
}

export function Meter({ value, max, color, cap }: { value: number; max: number; color: string; cap?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="gp-meter" aria-hidden>
      <div style={{ width: `${pct}%`, background: color }} />
      {cap != null && max > 0 && <span className="gp-meter__cap" style={{ left: `${Math.min(100, (cap / max) * 100)}%` }} />}
    </div>
  );
}

/** Legend whose entries can switch a series off and on. */
export function Legend({ items, hidden, onToggle }: { items: { label: ReactNode; color: string; line?: boolean; dash?: boolean; key?: string }[]; hidden?: Set<string>; onToggle?: (key: string) => void }) {
  return (
    <div className="gp-legend">
      {items.map((it, i) => {
        const key = it.key ?? String(i);
        const off = hidden?.has(key);
        const sw = <i className={`${it.line ? 'is-line' : ''}${it.dash ? ' is-dash' : ''}`} style={{ background: it.dash ? undefined : it.color, color: it.color }} />;
        return onToggle ? (
          <button key={key} type="button" className={off ? 'is-off' : ''} aria-pressed={!off} onClick={() => onToggle(key)}>
            {sw}
            {it.label}
          </button>
        ) : (
          <span key={key}>
            {sw}
            {it.label}
          </span>
        );
      })}
    </div>
  );
}
