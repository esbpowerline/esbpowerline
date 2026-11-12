'use client';

/**
 * Technical Information → Grid Projects (ongoing, upcoming, completed).
 *
 * The desktop pages three large cards at a time. A phone list shows each
 * project's name, partner, dates, progress and total cost in the row, and
 * opens the whole record (objectives, scope, the cost split, the director's
 * contacts, source and update stamp) in the bottom sheet.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { ongoingProjectsData, type OngoingProjectItem } from '@/lib/data/infrastructure/projects-ongoing';
import { upcomingProjectsData, type UpcomingProjectItem } from '@/lib/data/infrastructure/projects-upcoming';
import { completedProjectsData } from '@/lib/data/infrastructure/projects-completed';
import { getUpcomingProjectStatusInfo, renderProjectCost } from '@/components/news/power-grid/shared';
import { Prov, Section, useSheet } from './shared';
import { Runs } from './technical-common';
import { PROJECTS } from './technical-data';

export type ProjectKind = 'ongoing' | 'upcoming' | 'completed';
type Completed = (typeof completedProjectsData)[number];
type Any = OngoingProjectItem | UpcomingProjectItem | Completed;
const DATA: Record<ProjectKind, Any[]> = { ongoing: ongoingProjectsData, upcoming: upcomingProjectsData, completed: completedProjectsData };
const PAGE = 8;
const pct = (s: string) => Math.max(0, Math.min(100, parseFloat(s.replace(/%/g, '')) || 0));
const isOngoing = (p: Any): p is OngoingProjectItem => typeof (p as OngoingProjectItem).status === 'object';

/** renderProjectCost is the desktop's formatter (Lakh → Crore line included); the wrapper only restyles it. */
const Cost = ({ label, value }: { label: string; value: string | undefined | null }) => (
  <div className="gpt-cost"><span>{label}</span>{renderProjectCost(value)}</div>
);

function Progress({ label, value, tone }: { label: string; value: string; tone: 'good' | 'primary' }) {
  return (
    <div className="gpt-prog">
      <div><span>{label}</span><b>{value}</b></div>
      <div className="gp-meter" aria-hidden><div style={{ width: `${pct(value)}%`, background: tone === 'good' ? 'var(--gp-good)' : 'var(--gp-primary)' }} /></div>
    </div>
  );
}

const Bullets = ({ title, items, none }: { title: string; items: string[]; none?: string }) => (
  <>
    <h4>{title}</h4>
    {items.length ? <ul>{items.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="gpt-muted">{none}</p>}
  </>
);

function Detail({ p, kind }: { p: Any; kind: ProjectKind }) {
  const up = kind === 'upcoming' ? (p as UpcomingProjectItem) : null;
  const og = isOngoing(p) ? p : null;
  const cost = p.cost as { total: string; gob?: string; pa?: string; pgcb?: string };
  return (
    <>
      <h3 className="gpt-proj__title">{p.name}</h3>
      <p className="gp-sheet__sub">Partner: {p.partner} · Duration: {p.duration}</p>
      <div className="gpt-sheet gpt-proj">
        {og && (
          <div className="gpt-progs">
            <Progress label="Physical Progress" value={og.status.physical} tone="good" />
            <Progress label="Financial Progress" value={og.status.financial} tone="primary" />
          </div>
        )}
        {up && <p className="gpt-status"><span className="gp-tag">{getUpcomingProjectStatusInfo(up.status).label}</span> {up.status}</p>}
        {kind === 'completed' && <p className="gpt-status"><span className="gp-tag good">Completed Project</span></p>}
        <Bullets title="Objectives" items={p.objectives} none="No objectives detailed." />
        <Bullets title="Scope of Work" items={p.scope} />
        <h4>Cost</h4>
        <div className="gpt-costs">
          <Cost label="Total Project Cost" value={cost.total} />
          {!up && <Cost label="GOB Contribution" value={cost.gob} />}
          <Cost label="Project Aid (PA)" value={cost.pa} />
          {!up && <Cost label="PGCB Funding" value={cost.pgcb} />}
          {up && <div className="gpt-cost"><span>Development Partner</span><div className="font-bold">{up.partner}</div></div>}
        </div>
        {og && (
          <p className="gpt-contact">
            <b>Project Director:</b> {og.director}<br />
            <b>Office:</b> {og.office}<br />
            <b>Mobile:</b> <a href={`tel:${og.mobile}`}>{og.mobile}</a><br />
            <b>Email:</b> <a href={`mailto:${og.email}`}>{og.email}</a>
          </p>
        )}
        {up && <p className="gpt-muted">Upcoming Pipeline Project</p>}
        {kind === 'completed' && <p className="gpt-muted">Successfully Commissioned</p>}
        <p className="gpt-muted">Source: {p.source} · Updated: {p.lastUpdated}</p>
      </div>
    </>
  );
}

export function ProjectsView({ kind, onKind }: { kind: ProjectKind; onKind: (k: ProjectKind) => void }) {
  const open = useSheet();
  const [q, setQ] = useState('');
  const [partner, setPartner] = useState('all');
  const [shown, setShown] = useState(PAGE);
  useEffect(() => { setQ(''); setPartner('all'); }, [kind]);
  const meta = PROJECTS[kind];
  const all = DATA[kind];
  const k = q.toLowerCase();
  // The desktop's two filters: text over name, objectives, scope (and director where one is named); partner by substring.
  const rows = all.filter((p) => {
    const text = p.name.toLowerCase().includes(k) || p.objectives.some((o) => o.toLowerCase().includes(k)) || p.scope.some((s) => s.toLowerCase().includes(k)) || (kind !== 'completed' && 'director' in p ? p.director.toLowerCase().includes(k) : false);
    const part = partner === 'all' || (partner === 'N/A' ? p.partner === 'N/A' : p.partner.toLowerCase().includes(partner.toLowerCase()));
    return text && part;
  });
  useEffect(() => setShown(PAGE), [rows.length, kind]);
  const partners = kind === 'completed' ? PROJECTS.completedPartners : PROJECTS.partners;
  const counts: [ProjectKind, string, number][] = [['ongoing', 'Ongoing', ongoingProjectsData.length], ['upcoming', 'Upcoming', upcomingProjectsData.length], ['completed', 'Completed', completedProjectsData.length]];
  let note: ReactNode;
  if (kind === 'completed') note = <Runs parts={PROJECTS.completedNote} />;
  else note = <>{PROJECTS.note} {PROJECTS[kind].check}</>;

  return (
    <Section title={meta.title} desc={meta.body}>
      <div className="gp-stats gp-stats--3 gp-stats--first gpt-kinds" role="tablist" aria-label="Project register">
        {counts.map(([id, l, n]) => (
          <button key={id} type="button" role="tab" aria-selected={kind === id} className={`gp-stat${kind === id ? ' is-on' : ''}`} onClick={() => onKind(id)}>
            <div className="gp-stat__l">{l}{kind === id && <Prov kind="D" note="A count of the project records held here." />}</div>
            <div className="gp-stat__v"><b>{n}</b></div>
            <div className="gp-stat__d">{id === 'completed' ? PROJECTS.completed.count : id === kind ? meta.count : 'Projects'}</div>
          </button>
        ))}
      </div>

      <input className="gp-search gpt-psearch" type="search" placeholder={meta.search} aria-label={meta.search} value={q} onChange={(e) => setQ(e.target.value)} />
      <label className={`gpt-pick gpt-pick--wide${partner !== 'all' ? ' is-on' : ''}`}>
        <span>Partner: {partner === 'all' ? PROJECTS.allPartners : partner}</span>
        <i aria-hidden>▾</i>
        <select aria-label="Development partner" value={partner} onChange={(e) => setPartner(e.target.value)}>
          <option value="all">{PROJECTS.allPartners}</option>
          {partners.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      {rows.length === 0 ? (
        <div className="gp-empty gpt-none">No {kind} projects found matching the filters or search query.</div>
      ) : (
        <div className="gpt-projs">
          {rows.slice(0, shown).map((p) => (
            <button key={p.name} type="button" className="gpt-projrow" onClick={() => open(<Detail p={p} kind={kind} />)}>
              <b>{p.name}</b>
              <span>Partner: {p.partner} · {p.duration}</span>
              {isOngoing(p) && (
                <div className="gpt-progs">
                  <Progress label="Physical" value={p.status.physical} tone="good" />
                  <Progress label="Financial" value={p.status.financial} tone="primary" />
                </div>
              )}
              {kind === 'upcoming' && <span className="gpt-status"><span className="gp-tag">{getUpcomingProjectStatusInfo((p as UpcomingProjectItem).status).label}</span> {(p as UpcomingProjectItem).status}</span>}
              <div className="gpt-projrow__foot">
                <Cost label="Total Project Cost" value={p.cost.total} />
                <em>Objectives, scope, cost split ›</em>
              </div>
            </button>
          ))}
        </div>
      )}
      {rows.length > shown && (
        <button type="button" className="gp-more" onClick={() => setShown((n) => n + PAGE)}>
          Show {Math.min(PAGE, rows.length - shown)} more <span className="gp-u">· {shown} of {rows.length} {kind} projects</span>
        </button>
      )}
      <div className="gp-sec__foot gpt-foot">
        <span>{PROJECTS.source.replace('on each card above', 'in each project’s detail')}</span>
        <span>{note}</span>
        <span className="gpt-foot__stamp">{meta.registry}</span>
      </div>
    </Section>
  );
}
