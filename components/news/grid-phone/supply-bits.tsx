'use client';

/** Small shared pieces for the Supply screen's three views. */

import type { ReactNode } from 'react';
import '@/app/grid-phone-supply.css';
import { fmt } from './charts';
import { isNum, Prov, useSheet } from './shared';

export const U = ({ children }: { children: ReactNode }) => <span className="gp-u">{children}</span>;

export type Kind = 'P' | 'D';

const Info = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

/** Opens a bottom sheet with a title and body. */
export function useNote() {
  const open = useSheet();
  return (title: ReactNode, body: ReactNode, sub?: ReactNode) =>
    open(
      <>
        <h3>{title}</h3>
        {sub ? <p className="gp-sheet__sub">{sub}</p> : <div style={{ height: 12 }} />}
        {body}
      </>,
    );
}

/** "How to read this" — prose lives in a sheet, never inline. */
export function How({ title, children, label = 'How to read this' }: { title: ReactNode; children: ReactNode; label?: string }) {
  const note = useNote();
  return (
    <button type="button" className="gps-how" onClick={() => note(title, children)}>
      <Info />
      {label}
    </button>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <p className="gps-note">{children}</p>;

/** Label (with mark) on the left, value on the right. */
export function KV({ label, kind, note, value, sub }: { label: ReactNode; kind?: Kind; note?: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="gps-kv">
      <span>
        {label}
        {kind && <Prov kind={kind} note={note} />}
      </span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export function Ref({ agency = 'PGCB Daily Report', part, date, file, url, urlLabel }: { agency?: string; part?: string; date?: string; file?: string | null; url?: string; urlLabel?: string }) {
  return (
    <div className="gps-ref">
      {agency}
      {part ? ` · ${part}` : ''}
      {date && (
        <>
          <br />Date: {date}
        </>
      )}
      {file && (
        <>
          <br />File: <code>{file}</code>
        </>
      )}
      {url && (
        <>
          <br />
          <a href={url} target="_blank" rel="noopener noreferrer">{urlLabel ?? url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
        </>
      )}
    </div>
  );
}

export type BriefRow = { kind: Kind; label: string; value: ReactNode; note?: string };

/** A KPI tile's briefing, as a sheet: marked rows, an audit paragraph, the citation. */
export function useBrief() {
  const note = useNote();
  return (b: { title: string; rows: BriefRow[]; audit: ReactNode; ref?: ReactNode }) =>
    note(
      b.title,
      <>
        {b.rows.map((r, i) => (
          <KV key={i} label={r.label} kind={r.kind} note={r.note} value={r.value} />
        ))}
        <Note>{b.audit}</Note>
        {b.ref}
      </>,
    );
}

/** Keeps the P/D mark on the label's last word so it never wraps alone. */
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

/** One cell of a hairline stat grid that can show text and opens a briefing. */
export function Tile({ label, prov, note, value, unit, detail, onClick }: { label: ReactNode; prov?: Kind; note?: string; value: ReactNode; unit?: string; detail?: ReactNode; onClick?: () => void }) {
  return (
    <div className="gp-stat" role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && onClick()} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="gp-stat__l">{withMark(label, prov && <Prov kind={prov} note={note} />)}</div>
      <div className="gp-stat__v">
        <b>{value}</b>
        {unit && <small>{unit}</small>}
      </div>
      {detail != null && detail !== false && <div className="gp-stat__d">{detail}</div>}
    </div>
  );
}

/** agrees / differs line, for the reconciliation boxes. */
export function Check({ title, ok, children }: { title: ReactNode; ok: boolean; children: ReactNode }) {
  return (
    <div className="gps-check">
      <div className="gps-check__t">
        <span className={ok ? 'gps-ok' : 'gps-warn'}>{ok ? '✓' : '!'}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

export function Verdict({ ok, delta, dp = 3 }: { ok: boolean; delta?: number; dp?: number }) {
  return <span className={ok ? 'gps-ok' : 'gps-warn'}>{ok ? ' agrees' : ` differs${isNum(delta) ? ` by ${fmt(Math.abs(delta), dp)}` : ''}`}</span>;
}

export function ShowMore({ shown, total, noun, expanded, onToggle }: { shown: number; total: number; noun: string; expanded: boolean; onToggle: () => void }) {
  if (total <= shown && !expanded) return null;
  return (
    <button type="button" className="gp-more" aria-expanded={expanded} onClick={onToggle}>
      {expanded ? `Show fewer ${noun}` : `Show all ${total} ${noun} (${total - shown} more)`}
    </button>
  );
}

export const Pill = ({ tone, children, onClick, title }: { tone?: 'good' | 'warn' | 'bad' | 'info' | 'viol'; children: ReactNode; onClick?: () => void; title?: string }) =>
  onClick ? (
    <button type="button" className={`gps-pill${tone ? ` gps-pill--${tone}` : ''}`} onClick={onClick} title={title}>{children}</button>
  ) : (
    <span className={`gps-pill${tone ? ` gps-pill--${tone}` : ''}`} title={title}>{children}</span>
  );

/** Source footer line with the "As published" disclaimer. */
export function Src({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const Chev = () => <span className="gp-chev"> ›</span>;

/** An empty state that says who owes the figure. */
export function Absent({ children }: { children: ReactNode }) {
  return <div className="gp-empty" style={{ minHeight: 96 }}>{children}</div>;
}
