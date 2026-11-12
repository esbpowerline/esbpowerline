'use client';

/**
 * Drawing parts for the phone Macro Trends screen.
 *
 * The desktop's macro charts are Recharts composites with hover tooltips and
 * two value axes. None of that reads at 390px, so the phone draws its own:
 * one plot, one axis, a year the reader taps and KEEPS (annual series have
 * 7-25 points, so a persistent pick beats a transient scrub), and the
 * desktop tooltip's fields set as ruled rows under the plot. A chart the
 * desktop draws on two axes becomes two short plots sharing one picked year.
 * Nothing here derives a figure; callers hand in the desktop's own values.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CHART_H, niceTicks } from './charts';
import { Prov, nb, nbDate, nbUnits, useSheet } from './shared';
import { useChartTheme } from '@/hooks/useChartTheme';
import { seriesColor, type SeriesName } from '@/lib/data/grid/chart-palette';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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

/** A picked index that defaults to the newest point and survives a shorter series. */
export function useSel(n: number): [number, (i: number) => void] {
  const [i, setI] = useState<number | null>(null);
  return [i == null || i >= n ? Math.max(0, n - 1) : i, setI];
}

export type PlotSeries = {
  kind: 'bar' | 'line' | 'area';
  /** null = not published: no mark, never a zero. */
  values: (number | null)[];
  color: string;
  /** Bars sharing a stack key pile up; different keys sit side by side. */
  stack?: string;
  width?: number;
};

const isN = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const compact = (v: number, step: number) =>
  Math.abs(v) >= 1000 && step >= 500 ? `${+(v / 1000).toFixed(step >= 1000 ? 0 : 1)}k` : v.toLocaleString('en-US', { maximumFractionDigits: step < 1 ? 2 : step < 10 ? 1 : 0 });

/** Bars, lines and areas on one axis, in real pixels, with a persistent tapped column. */
export function Plot({ labels, series, sel, onSel, height = CHART_H, ariaLabel, max: maxIn, tick }: {
  labels: string[];
  series: PlotSeries[];
  sel?: number;
  onSel?: (i: number) => void;
  height?: number;
  ariaLabel: string;
  max?: number;
  tick?: (v: number) => string;
}) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const n = labels.length;
  // No y gutter: tick values sit inside the plot, over their gridline, so the
  // plot runs edge to edge in the card. T leaves room for the top tick's label.
  const L = 0, T = 16, B = 20;
  const pw = Math.max(0, w - L);
  const bw = n ? pw / n : 0;
  const cx = (i: number) => L + bw * (i + 0.5);
  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onSel || !n || !bw) return;
    const r = e.currentTarget.getBoundingClientRect();
    onSel(Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left - L) / bw))));
  };

  let body: ReactNode = null;
  if (w > 0 && n) {
    const bars = series.filter((s) => s.kind === 'bar');
    const keys = [...new Set(bars.map((s, k) => s.stack ?? `_${k}`))];
    const stackOf = (s: PlotSeries) => s.stack ?? `_${bars.indexOf(s)}`;
    const tops = keys.map((key) => labels.map((_, i) => bars.filter((s) => stackOf(s) === key).reduce((a, s) => a + Math.max(0, s.values[i] ?? 0), 0)));
    const all = [...tops.flat(), ...series.flatMap((s) => s.values.filter(isN))];
    const nt = niceTicks(Math.min(0, ...all), maxIn ?? Math.max(...all, 0), height > 150 ? 4 : 2);
    const hi = maxIn ?? nt.hi;
    const lo = nt.lo;
    const step = nt.ticks.length > 1 ? nt.ticks[1] - nt.ticks[0] : 1;
    const y = (v: number) => T + (1 - (v - lo) / (hi - lo || 1)) * (height - T - B);
    const gw = Math.min(26, (bw * 0.74) / Math.max(1, keys.length));
    const lw = Math.max(...labels.map((l) => l.length)) * 6.2 + 8;
    const every = Math.max(1, Math.ceil(lw / (bw || 1)));
    const acc = keys.map(() => labels.map(() => 0));
    const line = (vals: (number | null)[]) => {
      let d = '';
      let pen = false;
      vals.forEach((v, i) => {
        if (!isN(v)) return void (pen = false);
        d += `${pen ? 'L' : 'M'}${cx(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
      });
      return d;
    };
    body = (
      <>
        {sel != null && sel < n && <rect x={L + bw * sel} y={T - 6} width={bw} height={height - T - B + 6} rx={4} className="gpm-band" />}
        {nt.ticks.filter((v) => v <= hi).map((v) => (
          <g key={v} aria-hidden>
            <line x1={L} x2={w} y1={y(v)} y2={y(v)} className={v === 0 ? 'gp-base' : 'gp-grid'} />
            <text x={0} y={y(v) - 4} textAnchor="start" className="gp-tick gpm-ytick">{tick ? tick(v) : compact(v, step)}</text>
          </g>
        ))}
        {bars.map((s, k) => {
          const g = keys.indexOf(stackOf(s));
          const x0 = (i: number) => cx(i) - (gw * keys.length) / 2 + g * gw;
          return s.values.map((v, i) => {
            if (!isN(v) || v <= 0) return null;
            const base = acc[g][i];
            acc[g][i] += v;
            const yt = y(base + v);
            return <rect key={`${k}-${i}`} x={x0(i) + 0.75} y={yt} width={Math.max(1, gw - 1.5)} height={Math.max(1, y(base) - yt)} rx={Math.min(3, gw / 3)} fill={s.color} opacity={sel == null || sel === i ? 1 : 0.55} />;
          });
        })}
        {series.filter((s) => s.kind !== 'bar').map((s, k) => {
          const d = line(s.values);
          if (!d) return null;
          const first = s.values.findIndex(isN);
          const last = s.values.length - 1 - [...s.values].reverse().findIndex(isN);
          return (
            <g key={k}>
              {s.kind === 'area' && <path d={`${d}L${cx(last)},${y(Math.max(lo, 0))}L${cx(first)},${y(Math.max(lo, 0))}Z`} fill={s.color} opacity={0.12} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeLinejoin="round" strokeLinecap="round" />
              {n <= 26 && s.values.map((v, i) => (isN(v) ? <circle key={i} cx={cx(i)} cy={y(v)} r={sel === i ? 4.5 : n > 14 ? 1.75 : 2.5} fill={s.color} className={sel === i ? 'gp-dot' : undefined} /> : null))}
            </g>
          );
        })}
        {labels.map((l, i) => {
          // Every k-th label counting back from the newest; the picked column always shows its own
          // and silences neighbours it would collide with.
          const onGrid = (n - 1 - i) % every === 0;
          const show = sel === i || (onGrid && (sel == null || (n - 1 - sel) % every === 0 || Math.abs(sel - i) >= every));
          return show ? <text key={i} x={cx(i)} y={height - 5} textAnchor="middle" className={`gp-tick${sel === i ? ' gp-tick--strong' : ''}`}>{l}</text> : null;
        })}
      </>
    );
  }
  return (
    <div ref={ref} className="gp-plot gpm-plot">
      <svg width={w} height={height} viewBox={`0 0 ${w || 1} ${height}`} className="gp-svg" role="img" aria-label={ariaLabel} onPointerDown={pick} onPointerMove={(e) => e.buttons > 0 && pick(e)}>
        {body}
      </svg>
    </div>
  );
}

/** A kit stat cell whose figure arrives already formatted (the desktop's own formatter). */
export function Cell({ label, prov, note, value, unit, detail, tone, onClick }: { label: ReactNode; prov?: 'P' | 'D'; note?: string; value: ReactNode; unit?: ReactNode; detail?: ReactNode; tone?: 'bad' | 'good' | 'warn' | 'primary'; onClick?: () => void }) {
  return (
    <div className={`gp-stat${tone ? ` gpm-is-${tone}` : ''}`} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick}>
      <div className="gp-stat__l">{marked(label, prov && <Prov kind={prov} note={note} />)}</div>
      <div className="gp-stat__v"><b>{value}</b>{unit && <small>{unit}</small>}</div>
      <div className="gp-stat__d">{nb(detail)}</div>
    </div>
  );
}

/** Keeps a P/D mark on the line of the label's last word, so it never wraps alone. */
function marked(label: ReactNode, mark: ReactNode) {
  if (typeof label === 'string') label = nbDate(nbUnits(label));
  if (!mark || typeof label !== 'string') return <>{label}{mark}</>;
  const k = label.lastIndexOf(' ');
  return <>{k > 0 ? label.slice(0, k + 1) : ''}<span style={{ whiteSpace: 'nowrap' }}>{k > 0 ? label.slice(k + 1) : label}{mark}</span></>;
}

/** One ruled label/value line: the phone form of a desktop tooltip row. */
export function KV({ label, value, prov, note, tone, sw, sub }: { label: ReactNode; value: ReactNode; prov?: 'P' | 'D'; note?: string; tone?: 'good' | 'bad' | 'warn' | 'primary'; sw?: string; sub?: ReactNode }) {
  return (
    <div className="gpm-kv">
      <span className="gpm-kv__l">{sw && <i style={{ background: sw }} />}<span>{marked(nb(label), prov && <Prov kind={prov} note={note} />)}</span></span>
      <b className={tone ? `is-${tone}` : undefined}>{nb(value)}</b>
      {sub != null && sub !== false && <small>{nb(sub)}</small>}
    </div>
  );
}

/** A small pill that opens a long explanation in the bottom sheet. */
export function InfoPill({ label, title, sub, children }: { label: string; title?: string; sub?: string; children: ReactNode }) {
  const open = useSheet();
  return (
    <button type="button" className="gpm-info" onClick={() => open(<><h3>{title ?? label}</h3>{sub ? <p className="gp-sheet__sub">{sub}</p> : <div style={{ height: 12 }} />}<div className="gpm-prose">{children}</div></>)}>
      <span aria-hidden>i</span>{label}
    </button>
  );
}

/** A table column: a plain string is a numeric column; `unit` sits under the header, never in the cells. */
export type Col = string | { label: ReactNode; unit?: string; text?: boolean };

/**
 * The one table every macro sheet uses. First column is the row name, sticky
 * while the figures scroll sideways; every other column is right-aligned with
 * tabular figures so digits line up down the column; units live in the header.
 */
export function DataTable({ head, rows }: { head: Col[]; rows: ReactNode[][] }) {
  const cols = head.map((h) => (typeof h === 'object' && h !== null && 'label' in h ? h : { label: h as ReactNode }));
  const cls = (j: number) => (j === 0 ? 'gpm-td0' : cols[j]?.text ? 'gpm-tdt' : undefined);
  return (
    <div className="gpm-tablewrap">
      <table className="gpm-table">
        <thead>
          <tr>{cols.map((c, j) => <th key={j} scope="col" className={cls(j)}><span>{c.label}</span>{c.unit && <small>{c.unit}</small>}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row" className="gpm-td0">{c}</th> : <td key={j} className={cls(j)}>{c ?? '—'}</td>))}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

/** Title + subtitle + table, the content of a table sheet. */
export function TableSheet({ title, sub, head, rows, after }: { title: ReactNode; sub?: ReactNode; head: Col[]; rows: ReactNode[][]; after?: ReactNode }) {
  return (
    <>
      <h3>{title}</h3>
      {sub ? <p className="gp-sheet__sub">{sub}</p> : null}
      <DataTable head={head} rows={rows} />
      {after}
    </>
  );
}

/** Every row of a series, in the sheet: the desktop's data table. */
export function TablePill({ label = 'All years', title, sub, head, rows, after }: { label?: string; title: string; sub?: ReactNode; head: Col[]; rows: ReactNode[][]; after?: ReactNode }) {
  const open = useSheet();
  return (
    <button type="button" className="gpm-info" onClick={() => open(<TableSheet title={title} sub={sub} head={head} rows={rows} after={after} />)}>
      <span aria-hidden>≡</span>{label}
    </button>
  );
}

/** Source, method and period lines under a card: each on its own line, small. */
export function Foot({ children }: { children: ReactNode }) {
  return <div className="gpm-foot">{nb(children)}</div>;
}

/** A source link. Opens in the same tab: the reader is never pushed into a new one. */
export const A = ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>;

/** Kicker + figure, the head of a card whose plot answers to a tapped column. */
export function Readout({ kicker, tag, value, unit, sub, tone }: { kicker: ReactNode; tag?: ReactNode; value: ReactNode; unit?: ReactNode; sub?: ReactNode; tone?: 'bad' | 'good' }) {
  return (
    <>
      <div className="gp-kicker"><span>{nb(kicker)}</span>{tag}</div>
      <div className={`gp-hero gp-hero--md${tone ? ` gpm-${tone}` : ''}`}><b>{value}</b>{unit && <small>{unit}</small>}</div>
      {sub != null && <div className="gp-subline">{sub}</div>}
    </>
  );
}

/** A one-series caption over a short plot: swatch, name, the picked column's value. */
export function Cap({ color, label, prov, note, value }: { color: string; label: ReactNode; prov?: 'P' | 'D'; note?: string; value: ReactNode }) {
  return <div className="gpm-cap"><span><i style={{ background: color }} />{typeof label === 'string' ? nbUnits(label) : label}{prov && <Prov kind={prov} note={note} />}</span><b>{value}</b></div>;
}

/** A swipeable row of pills that keeps the picked one in view. */
export function Pills({ items, sel, onSel, label }: { items: string[]; sel: number; onSel: (i: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const on = el?.querySelector<HTMLElement>('.is-on');
    if (el && on) el.scrollTo({ left: on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2 });
  }, [sel]);
  return (
    <div className="gpm-years" ref={ref} aria-label={label}>
      {items.map((l, k) => <button key={l} type="button" aria-pressed={k === sel} className={k === sel ? 'is-on' : ''} onClick={() => onSel(k)}>{l}</button>)}
    </div>
  );
}

/** Swatch captions for a plot. */
export function Key({ items }: { items: { label: ReactNode; color: string; line?: boolean }[] }) {
  return (
    <div className="gpm-key">
      {items.map((it, i) => <span key={i}><i className={it.line ? 'is-line' : ''} style={{ background: it.color }} />{it.label}</span>)}
    </div>
  );
}

/** The desktop palette's validated colour for a named series, for the surface in use. */
export function useSeriesColor() {
  const { mode } = useChartTheme();
  return (name: SeriesName) => seriesColor(name, mode);
}

/** The desktop's fuel-key folding (MacroTrendsTab.tsx:229), so colours match its donut. */
export function useFuelColor() {
  const { fuel } = useChartTheme();
  return (key: string) => {
    const k = key.toLowerCase();
    const map: Record<string, string> = { import: 'Imports', imports: 'Imports', diesel: 'HSD (Diesel)', hsd: 'HSD (Diesel)' };
    return fuel(k === 'hfo' ? 'HFO' : map[k] ?? key.charAt(0).toUpperCase() + key.slice(1).toLowerCase());
  };
}

type AccessLike = { isStaff: boolean; isMember: boolean; tier: string | null | undefined };
export type MacroWindow = {
  /** null = the whole backlog. */
  allowedYears: number | null;
  isTruncated: boolean;
  isMember: boolean;
  full: boolean;
  /** The desktop's `truncate`: the last `allowedYears * perYear` rows. */
  cut: <T>(rows: readonly T[], perYear?: number) => T[];
};

/** The reader's history window, by exactly the desktop's rule (MacroTrendsTab.tsx:276). */
export function macroWindow(a: AccessLike): MacroWindow {
  const full = a.isStaff || a.tier === 'plan_999';
  const allowedYears = full ? null : a.isMember || a.tier === 'plan_499' ? 5 : 2;
  return {
    allowedYears,
    isTruncated: allowedYears !== null,
    isMember: a.isMember,
    full,
    cut: (rows, perYear = 1) => (allowedYears === null ? [...rows] : rows.slice(-(allowedYears * perYear))),
  };
}
