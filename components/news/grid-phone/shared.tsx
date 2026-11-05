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
      {kind}
    </button>
  );
}

export function Source({ children }: { children: ReactNode }) {
  return <div className="gp-src">{children}</div>;
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

export function Skeleton({ heights = [300, 120, 200] }: { heights?: number[] }) {
  return (
    <>
      {heights.map((h, i) => (
        <div key={i} className="gp-skel" style={{ height: h }} />
      ))}
    </>
  );
}

export function Unavailable({ what, why }: { what: string; why: string }) {
  return (
    <div className="gp-card">
      <div className="gp-h">{what}</div>
      <div className="gp-empty" style={{ minHeight: 80 }}>{why}</div>
    </div>
  );
}
