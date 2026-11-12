'use client';

/**
 * The Time Machine's line, drawn for a phone.
 *
 * The rule the desktop chart is built around holds here unchanged: the line
 * BREAKS where no figure exists and nothing is joined across a gap (see
 * TimeMachineTab's header: the archive has a 517-hour outage in Jan-Feb 2017).
 * What a phone adds is that the gap is labelled where it happens instead of
 * only in a legend: a missing run carries a grey dashed rule on the baseline,
 * a run outside the reader's plan a tinted span with a dashed rule in the
 * plan colour. Neither touches the value scale, so neither can be read as a
 * figure. Tap or drag reads a period; the selection stays after the finger
 * lifts, because a phone has no hover to come back to.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { Point } from '@/components/news/power-grid/useTimeMachine';
import { CHART_H, niceTicks } from './charts';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-11-05` → `5 Nov`, `2026-11` → `Nov '26`; with `year`, days carry it too. */
export function periodLabel(t: string, year = false) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(t);
  if (!m) return t;
  const mon = MON[Number(m[2]) - 1] ?? m[2];
  if (!m[3]) return `${mon} '${m[1].slice(2)}`;
  return year ? `${Number(m[3])} ${mon} '${m[1].slice(2)}` : `${Number(m[3])} ${mon}`;
}

const tick = (v: number, step: number) =>
  Math.abs(v) >= 1000 && step >= 500 ? `${+(v / 1000).toFixed(step >= 1000 ? 0 : 1)}k` : v.toLocaleString('en-US', { maximumFractionDigits: step < 1 ? 2 : step < 10 ? 1 : 0 });

/** Contiguous runs of points matching `test`, as [first, last] index pairs. */
function runs(points: Point[], test: (p: Point) => boolean) {
  const out: [number, number][] = [];
  points.forEach((p, i) => {
    if (!test(p)) return;
    if (out.length && out[out.length - 1][1] === i - 1) out[out.length - 1][1] = i;
    else out.push([i, i]);
  });
  return out;
}

export function TimeMachineChart({ points, color, selected, onSelect, ariaLabel }: { points: Point[]; color: string; selected: number | null; onSelect: (i: number) => void; ariaLabel: string }) {
  const gid = useId().replace(/:/g, '');
  const box = useRef<HTMLDivElement | null>(null);
  const svg = useRef<SVGSVGElement | null>(null);
  const [w, setW] = useState(0);
  useIso(() => {
    const el = box.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const h = CHART_H;
  const L = 32;
  const T = 10;
  const B = 22;
  const plotW = Math.max(1, w - L);
  const base = h - B;
  // Each period owns a slot; its point sits in the middle, so a run's span has real width even for one period.
  const slot = plotW / Math.max(1, n);
  const x = (i: number) => L + (i + 0.5) * slot;
  const vals = points.map((p) => p.value).filter((v): v is number => v != null && Number.isFinite(v));
  const nt = vals.length ? niceTicks(Math.min(...vals), Math.max(...vals), 4) : null;
  const step = nt && nt.ticks.length > 1 ? nt.ticks[1] - nt.ticks[0] : 1;
  const y = (v: number) => (nt ? T + (1 - (v - nt.lo) / (nt.hi - nt.lo || 1)) * (base - T) : base);

  const pick = (clientX: number) => {
    const el = svg.current;
    if (!el || !n) return;
    const r = el.getBoundingClientRect();
    onSelect(Math.max(0, Math.min(n - 1, Math.floor((clientX - r.left - L) / slot))));
  };

  const has = (p: Point) => p.value != null && Number.isFinite(p.value);
  const valueRuns = runs(points, has);
  // A segment touching an ESTIMATED period is dotted; nothing produces one today, the style is reserved.
  const seg = (dotted: boolean) => {
    let d = '';
    for (let i = 0; i < n - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (!has(a) || !has(b)) continue;
      if ((a.state === 'ESTIMATED' || b.state === 'ESTIMATED') !== dotted) continue;
      d += `M${x(i).toFixed(1)},${y(a.value as number).toFixed(1)}L${x(i + 1).toFixed(1)},${y(b.value as number).toFixed(1)}`;
    }
    return d;
  };
  const area = valueRuns
    .filter(([a, b]) => b > a)
    .map(([a, b]) => {
      let d = '';
      for (let i = a; i <= b; i++) d += `${i === a ? 'M' : 'L'}${x(i).toFixed(1)},${y(points[i].value as number).toFixed(1)}`;
      return `${d}L${x(b).toFixed(1)},${base}L${x(a).toFixed(1)},${base}Z`;
    })
    .join('');
  const lone = valueRuns.filter(([a, b]) => a === b).map(([a]) => a);
  const missing = runs(points, (p) => p.state === 'MISSING');
  const restricted = runs(points, (p) => p.state === 'RESTRICTED');
  const k = Math.max(2, Math.min(5, Math.floor(plotW / 78)));
  const xIdx = n <= 1 ? [0] : Array.from(new Set(Array.from({ length: k }, (_, j) => Math.round((j * (n - 1)) / (k - 1)))));
  const long = n > 1 && points[0].t.slice(0, 4) !== points[n - 1].t.slice(0, 4);
  const sel = selected != null && selected < n ? points[selected] : null;

  return (
    <div ref={box} className="gp-plot">
      <svg
        ref={svg}
        width={w}
        height={h}
        viewBox={`0 0 ${w || 1} ${h}`}
        className="gp-svg"
        role="img"
        aria-label={ariaLabel}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e.clientX); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') pick(e.clientX); }}
      >
        {w > 0 && n > 0 && (
          <>
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <g aria-hidden>
              {nt ? (
                nt.ticks.map((v, i) => (
                  <g key={v}>
                    <line x1={L} x2={w} y1={y(v)} y2={y(v)} className={i === 0 ? 'gp-base' : 'gp-grid'} />
                    <text x={L - 6} y={y(v) + 4} textAnchor="end" className="gp-tick gp-tick--out">{tick(v, step)}</text>
                  </g>
                ))
              ) : (
                <line x1={L} x2={w} y1={base} y2={base} className="gp-base" />
              )}
              {xIdx.map((i) => (
                <text key={i} x={x(i)} y={h - 4} textAnchor={i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'} className="gp-tick">
                  {periodLabel(points[i].t, long)}
                </text>
              ))}
            </g>
            {restricted.map(([a, b]) => {
              const x0 = L + a * slot;
              const wd = (b - a + 1) * slot;
              return (
                <g key={`r${a}`} aria-hidden>
                  <rect x={x0} y={T} width={wd} height={base - T} className="gptm-plan" />
                  <line x1={x0} x2={x0 + wd} y1={base} y2={base} className="gptm-rule gptm-rule--plan" />
                  {wd > 118 && <text x={x0 + wd / 2} y={T + (base - T) / 2 + 4} textAnchor="middle" className="gptm-planlabel">Outside your plan</text>}
                </g>
              );
            })}
            {missing.map(([a, b]) => (
              <line key={`m${a}`} aria-hidden x1={L + a * slot + 1} x2={L + (b + 1) * slot - 1} y1={base} y2={base} className="gptm-rule gptm-rule--missing" />
            ))}
            {area && <path d={area} fill={`url(#${gid})`} />}
            <path d={seg(false)} fill="none" stroke={color} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
            <path d={seg(true)} fill="none" stroke={color} strokeWidth={2.25} strokeDasharray="1 5" strokeLinecap="round" />
            {lone.map((i) => (
              <circle key={i} cx={x(i)} cy={y(points[i].value as number)} r={3} fill={color} />
            ))}
            {sel && selected != null && (
              <g aria-hidden>
                <line x1={x(selected)} x2={x(selected)} y1={T - 6} y2={base} className="gp-cursor" />
                {has(sel) && <circle cx={x(selected)} cy={y(sel.value as number)} r={4.5} fill={color} className="gp-dot" />}
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
