'use client';

/** Small pieces shared by the Today screen's cards. */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bars, fmt } from './charts';
import { isNum, Prov, Row, useSheet, wd, nb } from './shared';

/** "2026-08-24" -> "24 Aug". */
export function dayLabel(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export const nextDay = (iso: string | null | undefined) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
};

/** A signed difference, never graded as good or bad: short of / beyond the forecast. */
export function Gap({ mw, dp = 0, unit }: { mw: number | null | undefined; dp?: number; unit?: string }) {
  if (!isNum(mw)) return <span className="gp-gap nil">—</span>;
  const r = dp === 0 ? Math.round(mw) : mw;
  const cls = r === 0 ? 'nil' : r < 0 ? 'short' : 'over';
  return (
    <span className={`gp-gap ${cls}`}>
      {r > 0 ? '+' : r < 0 ? '−' : '±'}
      {fmt(Math.abs(r), dp)}
      {unit ? <span className="gp-u"> {unit}</span> : null}
    </span>
  );
}

/** Card footer: the first line stays, the rest folds behind Details. */
export function Foot({ lead, rest }: { lead: ReactNode; rest: ReactNode[] }) {
  const lines = rest.filter(Boolean);
  return (
    <div className="gp-sec__foot gp-tfoot">
      <div>{nb(lead)}</div>
      {lines.length > 0 && (
        <details>
          <summary>Details</summary>
          <ul>
            {lines.map((l, i) => (
              <li key={i}>{nb(l)}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** Opens prose in a sheet, behind a quiet "How to read this" button. */
export function HowTo({ title = 'How to read this', label = 'How to read this', children }: { title?: string; label?: string; children: ReactNode }) {
  const open = useSheet();
  return (
    <button type="button" className="gp-thow" onClick={() => open(<><h3>{title}</h3><div style={{ height: 8 }} />{children}</>)}>
      <span>{label}</span>
      <span aria-hidden>›</span>
    </button>
  );
}

/** A glossary entry for a how-to sheet. */
export function Term({ name, kind, color, children }: { name: ReactNode; kind?: 'P' | 'D'; color?: string; children: ReactNode }) {
  return (
    <div>
      <dt style={color ? { color } : undefined}>
        {name}
        {kind && <Prov kind={kind} />}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

export type BRow = { p: 'P' | 'D'; label: ReactNode; value: ReactNode; note?: string; bad?: boolean; sub?: ReactNode };

/** A ruled list of labelled figures, each with its P/D mark. */
export function BriefRows({ rows }: { rows: BRow[] }) {
  return (
    <div className="gp-rows">
      {rows.map((r, i) => (
        <Row
          key={i}
          wrap
          name={
            <>
              {r.label}
              <Prov kind={r.p} note={r.note} />
            </>
          }
          sub={r.sub}
          value={<span style={r.bad ? { color: 'var(--gp-bad)' } : undefined}>{r.value}</span>}
        />
      ))}
    </div>
  );
}

export function SourceRef({ label, part, date, file, href }: { label: string; part: string; date: string; file?: string | null; href: string }) {
  let host = href;
  try {
    host = new URL(href).host;
  } catch {}
  return (
    <div className="gp-tref">
      <b>{label}</b> · {part}
      <div>{date}</div>
      {file ? <div>File <code>{file}</code></div> : null}
      <div>From <a href={href} target="_blank" rel="noopener noreferrer">{host}</a></div>
    </div>
  );
}

/** Seven-day bars for one figure, inside a briefing sheet. */
export function WeekBars({ title, unit, dp, prefix, dates, values, current }: { title: string; unit: string; dp: number; prefix?: string; dates: string[]; values: (number | null)[]; current: number }) {
  const [i, setI] = useState(current >= 0 ? current : values.length - 1);
  if (!values.some(isNum)) return null;
  return (
    <>
      <div className="gp-tsub">
        <h3>{title}, last {dates.length} days</h3>
        <p>
          {dates[i] ? `${wd(dates[i])} ${dates[i]}` : ''} ·{' '}
          <b style={{ color: 'var(--gp-on)' }}>{isNum(values[i]) ? `${prefix ?? ''}${fmt(values[i], dp)} ${unit}` : 'not published'}</b>
        </p>
      </div>
      <Bars ariaLabel={`${title} by day`} values={values} labels={dates.map(wd)} color="var(--gp-primary)" highlight={i} height={170} onPick={setI} valueLabels dp={dp} />
    </>
  );
}

/** Measured width of an element, for hand-drawn SVG. */
export function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.floor(el.getBoundingClientRect().width)));
    ro.observe(el);
    setW(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}
