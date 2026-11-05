'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { GridDailyData } from '@/lib/data/grid/types';
import { fmt } from './charts';

/** Opens the bottom sheet from anywhere in the app. */
export const SheetContext = createContext<(content: ReactNode | null) => void>(() => {});
export const useSheet = () => useContext(SheetContext);

const wdFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
const dmFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const iso = (d: string) => new Date(`${d}T00:00:00Z`);
export const wd = (d: string) => wdFmt.format(iso(d));
export const dm = (d: string) => dmFmt.format(iso(d));
export const longDate = (d: string) => longFmt.format(iso(d));
export const monthLabel = (key: string) => {
  const d = new Date(`${key}-01T00:00:00Z`);
  return `${d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })} '${String(d.getUTCFullYear()).slice(2)}`;
};

export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Worst published hour of load shedding; null when PGCB published no hourly shed column. */
export function maxShed(day: GridDailyData | null | undefined): number | null {
  const v = (day?.hourlyLoadData ?? []).map((h) => h.loadShed).filter(isNum);
  return v.length ? Math.max(...v) : null;
}

/** Whole hours only — the 19:30 sample is a 25th row, not a 25th hour. */
export const wholeHours = <T extends { time: string }>(rows: T[] | undefined) => (rows ?? []).filter((r) => r.time.endsWith(':00'));

export const signed = (n: number, dp = 0) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${fmt(Math.abs(n), dp)}`;

/**
 * Change against the previous day the reader can open. Colour says whether the
 * move is good for supply (more generation, less shedding) — never a grade of
 * anyone's forecast.
 */
export function Delta({ cur, prev, goodUp, dp = 0, unit = '', vs }: { cur: number | null; prev: number | null; goodUp: boolean; dp?: number; unit?: string; vs?: string }) {
  if (!isNum(cur) || !isNum(prev)) return null;
  const diff = cur - prev;
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : null;
  const cls = pct != null && Math.abs(pct) < 0.5 ? 'flat' : (goodUp ? diff >= 0 : diff <= 0) ? 'good' : 'bad';
  return (
    <span className={`gp-delta ${cls}`}>
      {diff >= 0 ? '▲' : '▼'} {fmt(Math.abs(diff), dp)}
      {unit}
      {pct != null ? ` (${Math.abs(pct).toFixed(1)}%)` : ''}
      {vs ? <span style={{ color: 'var(--gp-muted)', fontWeight: 400 }}> vs {vs}</span> : null}
    </span>
  );
}

const PROV: Record<'P' | 'D', { title: string; body: string }> = {
  P: { title: 'Published', body: 'This figure is printed in the source document exactly as shown.' },
  D: {
    title: 'Derived by ESB',
    body: 'We calculated this from published figures (a sum, a difference or a grouping). The source does not print it.',
  },
};

/** The site's P / D provenance mark, tappable on a phone. */
export function Prov({ kind, note }: { kind: 'P' | 'D'; note?: string }) {
  const open = useSheet();
  return (
    <button
      type="button"
      className="gp-prov"
      aria-label={PROV[kind].title}
      onClick={(e) => {
        e.stopPropagation();
        open(
          <>
            <h3>{PROV[kind].title}</h3>
            <p className="gp-sheet__sub">{PROV[kind].body}</p>
            {note ? <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{note}</p> : null}
          </>,
        );
      }}
    >
      <span>{kind}</span>
    </button>
  );
}

export function Source({ children }: { children: ReactNode }) {
  return <div className="gp-sec__foot">{children}</div>;
}

/** A surface on the page. Title row, optional one-line description, body, source footer. */
export function Section({ title, desc, meta, source, children, id }: { title?: ReactNode; desc?: ReactNode; meta?: ReactNode; source?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="gp-sec" id={id} aria-label={typeof title === 'string' ? title : undefined}>
      {(title || meta) && (
        <div className="gp-sec__head">
          <div>
            {title && <h2 className="gp-sec__title">{title}</h2>}
            {desc && <div className="gp-sec__desc">{desc}</div>}
          </div>
          {meta && <div className="gp-sec__meta">{meta}</div>}
        </div>
      )}
      {children}
      {source && <Source>{source}</Source>}
    </section>
  );
}

/** Keeps a P/D mark on the same line as the label's last word, so it never wraps alone. */
function withMark(label: ReactNode, mark: ReactNode) {
  if (!mark) return label;
  if (typeof label !== 'string') return <>{label}{mark}</>;
  const k = label.lastIndexOf(' ');
  return (
    <>
      {k > 0 ? label.slice(0, k + 1) : ''}
      <span style={{ whiteSpace: 'nowrap' }}>{k > 0 ? label.slice(k + 1) : label}{mark}</span>
    </>
  );
}

/** One cell of a hairline stat grid. */
export function Stat({ label, value, unit, prefix, dp = 0, detail, prov, note, onClick }: { label: ReactNode; value: number | null | undefined; unit?: string; prefix?: string; dp?: number; detail?: ReactNode; prov?: 'P' | 'D'; note?: string; onClick?: () => void }) {
  const inner = (
    <>
      <div className="gp-stat__l">{withMark(label, prov && <Prov kind={prov} note={note} />)}</div>
      <div className="gp-stat__v"><b>{isNum(value) && prefix ? prefix : ''}{fmt(value, dp)}</b>{unit && <small>{unit}</small>}</div>
      {detail != null && detail !== false && <div className="gp-stat__d">{detail}</div>}
    </>
  );
  return onClick ? (
    <div className="gp-stat" role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()} style={{ cursor: 'pointer' }}>{inner}</div>
  ) : (
    <div className="gp-stat">{inner}</div>
  );
}

/** A ruled list row: swatch · name + sub · value + small. */
export function Row({ sw, name, sub, value, small, meter, wrap, top, onClick, chevron }: { sw?: string; name: ReactNode; sub?: ReactNode; value?: ReactNode; small?: ReactNode; meter?: ReactNode; wrap?: boolean; top?: boolean; onClick?: () => void; chevron?: boolean }) {
  const cls = `gp-row${sw ? '' : ' gp-row--nosw'}${top ? ' gp-row--top' : ''}`;
  const body = (
    <>
      {sw && <span className="gp-sw" style={{ background: sw }} />}
      <div className="gp-row__main">
        <div className={`gp-row__name${wrap ? ' gp-row__name--wrap' : ''}`}>{name}</div>
        {sub && <div className="gp-row__sub">{sub}</div>}
      </div>
      <div className="gp-row__val">
        {value != null && <b>{value}{chevron && <span className="gp-chev"> ›</span>}</b>}
        {small != null && <small>{small}</small>}
      </div>
      {meter}
    </>
  );
  return onClick ? <button type="button" className={cls} onClick={onClick}>{body}</button> : <div className={cls}>{body}</div>;
}

/** Fuel colours — the day's own palette where it carries one. */
export function fuelPalette(day: GridDailyData | null | undefined): Record<string, string> {
  const p: Record<string, string> = { Gas: '#0ea5e9', Coal: '#64748b', HFO: '#f97316', HSD: '#ef4444', Hydro: '#06b6d4', Solar: '#eab308', Imports: '#a855f7', Wind: '#22c55e', Oil: '#f97316', Renewables: '#22c55e' };
  for (const g of day?.generationData ?? []) if (g.color) p[g.name] = g.color;
  return p;
}

export function fuelOf(label: string): string {
  if (/coal/i.test(label)) return 'Coal';
  if (/gas/i.test(label)) return 'Gas';
  if (/hvdc|import|nepal|tripura|adani|india/i.test(label)) return 'Imports';
  if (/hfo|furnace/i.test(label)) return 'HFO';
  if (/hsd|diesel|oil/i.test(label)) return 'HSD';
  if (/hydro/i.test(label)) return 'Hydro';
  if (/solar/i.test(label)) return 'Solar';
  if (/wind/i.test(label)) return 'Wind';
  return label;
}

export function Skeleton({ heights = [420, 180, 260] }: { heights?: number[] }) {
  return (
    <div className="gp-screen">
      {heights.map((h, i) => (
        <div key={i} className="gp-skel" style={{ height: h }} />
      ))}
    </div>
  );
}

export function Empty({ title, why }: { title?: string; why: ReactNode }) {
  return (
    <Section title={title}>
      <div className="gp-empty" style={{ minHeight: 96 }}>{why}</div>
    </Section>
  );
}
