'use client';

/**
 * Small pieces every Technical Information page shares: the info pill that
 * opens long wording in the bottom sheet, the jargon sheet, the source footer
 * and the voltage bars.
 */

import type { ReactNode } from 'react';
import { Prov, useSheet } from './shared';
import { PGCB_URL, type Pair, type Term } from './technical-data';

/** Alternating plain / bold runs, as the desktop footnotes are written. */
export function Runs({ parts }: { parts: string[] }) {
  return <>{parts.map((s, i) => (i % 2 ? <b key={i}>{s}</b> : <span key={i}>{s}</span>))}</>;
}

/** A pill that opens a longer explanation in the bottom sheet. */
export function InfoPill({ label, title, sub, children }: { label: string; title?: string; sub?: string; children: ReactNode }) {
  const open = useSheet();
  return (
    <button
      type="button"
      className="gpt-pill"
      onClick={() =>
        open(
          <>
            <h3>{title ?? label}</h3>
            {sub && <p className="gp-sheet__sub">{sub}</p>}
            <div className="gpt-sheet">{children}</div>
          </>,
        )
      }
    >
      <i aria-hidden>i</i>
      {label}
    </button>
  );
}

export function TermList({ terms }: { terms: Term[] }) {
  return (
    <dl className="gpt-terms">
      {terms.map((t) => (
        <div key={t.term}>
          <dt>{t.term}</dt>
          <dd>{t.body}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Jargon({ terms, title = 'Jargon, translated' }: { terms: Term[]; title?: string }) {
  const open = useSheet();
  return (
    <button type="button" className="gp-more gpt-jargon" onClick={() => open(<><h3>{title}</h3><p className="gp-sheet__sub">{terms.length} terms used on this page</p><TermList terms={terms} /></>)}>
      {title} <span className="gp-chev">›</span>
    </button>
  );
}

/** Source line, standing note and "as at" stamp: the desktop card footer. */
export function Foot({ source, link = true, note, stamp, children }: { source: string; link?: boolean; note?: ReactNode; stamp?: string; children?: ReactNode }) {
  return (
    <div className="gp-sec__foot gpt-foot">
      <span>
        Source: {link ? <a href={PGCB_URL} target="_blank" rel="noopener noreferrer">{source.split(' — ')[0]}</a> : source}
        {link && source.includes(' — ') ? ` — ${source.split(' — ')[1]}` : ''}
      </span>
      {note && <span>{note}</span>}
      {children}
      {stamp && <span className="gpt-foot__stamp">{stamp}</span>}
    </div>
  );
}

const num = (s: string) => {
  const m = /[0-9][0-9,]*(?:\.[0-9]+)?/.exec(s);
  return m ? parseFloat(m[0].replace(/,/g, '')) : null;
};
const KV = ['var(--gp-bad)', 'var(--gp-demand)', 'var(--gp-primary)'];

/**
 * One bar per voltage class, scaled against the longest. The bar length is
 * read from the printed figure only to draw it; the figure itself is shown as
 * printed, and "Others" stays a line of text because it is a different owner's
 * wire, not part of PGCB's bar.
 */
export function VoltageBars({ rows, prov, plusLabel }: { rows: Pair[]; prov?: 'P' | 'D'; plusLabel?: string }) {
  const vals = rows.map((r) => num(r.value));
  const max = Math.max(...vals.filter((v): v is number => v != null), 1);
  return (
    <div className="gpt-bars">
      {rows.map((r, i) => (
        <div key={r.label} className="gpt-bar">
          <div className="gpt-bar__top">
            <span>{r.label}{prov && <Prov kind={prov} />}</span>
            <b>{r.value}</b>
          </div>
          {vals[i] != null && <div className="gpt-bar__track" aria-hidden><i style={{ width: `${((vals[i] as number) / max) * 100}%`, background: KV[i % KV.length] }} /></div>}
          {r.plus && <div className="gpt-bar__plus">{plusLabel ? <em>{plusLabel}</em> : null}{r.plus}</div>}
        </div>
      ))}
    </div>
  );
}

/** Label left, printed figure right, optional smaller second line under the figure. */
export function PairRows({ rows, prov }: { rows: Pair[]; prov?: 'P' | 'D' }) {
  return (
    <div className="gpt-pairs">
      {rows.map((r) => (
        <div key={r.label} className="gpt-pair">
          <span>{r.label}{prov && <Prov kind={prov} />}</span>
          <div><b>{r.value}</b>{r.plus && <small>{r.plus}</small>}</div>
        </div>
      ))}
    </div>
  );
}
