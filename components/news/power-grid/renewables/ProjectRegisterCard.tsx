'use client';

/**
 * SREDA's RE Large Projects register (ndre.sreda.gov.bd/index.php?id=1).
 *
 * Its own component so it can hold its own filter and expand state. It was
 * previously an IIFE inside the tab, which forced that state up to the parent
 * because a hook cannot be called inside one.
 *
 * The register lists projects at every life stage, so **only "Completed &
 * Running" is installed capacity**. Solar Park lists 76 projects of which 14
 * are running; summing the table unfiltered would present a planning pipeline
 * as an installed fleet.
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Factory, Search } from 'lucide-react';
import { MobileFold } from '@/components/news/power-grid/MobileFold';
import { useBelowDesktop } from '@/components/news/power-grid/useTapToRead';
import { cn } from '@/lib/utils';
import { GridCardFooter, GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import {
  CountChip,
  OK_CLASS,
  REGISTER_INITIAL_ROWS,
  REGISTER_INITIAL_ROWS_SMALL,
  STATUS_RUNNING,
  ShowMoreRow,
  WARN_CLASS,
  fmt,
  statusClass,
  useExpandable,
} from '@/components/news/power-grid/renewables/shared';
import { SREDA_REGISTER_PAGE_SIZE } from '@/lib/data/sreda/parse-sreda-html';
import type {
  SredaProjectRegister,
  SredaReconciliation,
  SredaTechnologyRow,
} from '@/lib/data/sreda/types';

/**
 * Phone/tablet card for one register row: name + status, three key figures
 * (capacity, completion, agency), the rest (location, financing, SREDA id)
 * behind a tap. The 7-column table needed ~900px of width and a sideways swipe
 * to read a single project. Reuses the Power Stations card styles.
 */
function ProjectCard({ r }: { r: SredaProjectRegister['rows'][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="ge-plant-card">
      <button type="button" className="ge-plant-card__btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="ge-plant-card__top">
          <span className="ge-plant-card__name">{r.projectName}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
        </span>
        <span className="ge-rn-card__sub">
          <span className={`ge-rn-card__status rounded border font-bold ${statusClass(r.status)}`}>{r.status}</span>
        </span>
        <span className="ge-plant-card__figs">
          <span className="ge-plant-card__fig">
            <span className="ge-plant-card__lab">Capacity <GridProvenanceTag kind="P" /></span>
            <span className="ge-plant-card__val font-semibold">{r.capacityPublished}</span>
          </span>
          <span className="ge-plant-card__fig">
            <span className="ge-plant-card__lab">Completion <GridProvenanceTag kind="P" /></span>
            <span className="ge-plant-card__val">{r.completionDate || '—'}</span>
          </span>
          <span className="ge-plant-card__fig">
            <span className="ge-plant-card__lab">Agency <GridProvenanceTag kind="P" /></span>
            <span className="ge-plant-card__val">{r.agency || '—'}</span>
          </span>
        </span>
      </button>
      {open && (
        <dl className="ge-plant-card__more">
          <div><dt>Location <GridProvenanceTag kind="P" /></dt><dd>{r.location || '—'}</dd></div>
          <div>
            <dt>Financing <GridProvenanceTag kind="P" /></dt>
            <dd>
              {r.finance || '—'}
              {r.financeFullName && r.financeFullName !== r.finance ? ` — ${r.financeFullName}` : ''}
            </dd>
          </div>
          {r.agencyFullName && r.agencyFullName !== r.agency && (
            <div><dt>Agency (full name)</dt><dd>{r.agencyFullName}</dd></div>
          )}
          <div><dt>SREDA ID</dt><dd>{`${r.sid} · ${r.technology}`}</dd></div>
        </dl>
      )}
    </li>
  );
}

export function ProjectRegisterCard({
  registers,
  technologyBreakdown,
  reconciliation,
  lastUpdate,
}: {
  registers: SredaProjectRegister[];
  technologyBreakdown: SredaTechnologyRow[];
  reconciliation: SredaReconciliation[];
  lastUpdate: string;
}) {
  const [tech, setTech] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const small = useBelowDesktop();

  const active = registers.find((r) => r.technology === tech) ?? registers[0];

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of active.rows) m.set(r.status, (m.get(r.status) ?? 0) + 1);
    return [...m.entries()];
  }, [active]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active.rows.filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (!q ||
          `${r.projectName} ${r.location} ${r.agency} ${r.agencyFullName ?? ''} ${r.finance} ${r.sid}`
            .toLowerCase()
            .includes(q)),
    );
  }, [active, query, status]);

  const { shown, expanded, toggle, hidden } = useExpandable(visible, REGISTER_INITIAL_ROWS, REGISTER_INITIAL_ROWS_SMALL);

  const running = active.rows.filter((r) => r.status === STATUS_RUNNING);
  const runningMwp = running.reduce((s, r) => s + r.capacityMwp, 0);
  const techRow = technologyBreakdown.find((t) => t.technology === active.technology);

  const findCheck = (marker: string) =>
    reconciliation.find(
      (c) => c.check.startsWith(`${active.technology}: `) && c.check.includes(marker),
    );
  const countCheck = findCheck('projects read');
  const capCheck = findCheck('all projects sum');
  const runCheck = findCheck('running projects in the register');

  const select = (technology: string) => {
    setTech(technology);
    setQuery('');
    setStatus('all');
  };

  return (
    <div className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
        <Factory className="h-5 w-5 text-primary shrink-0" />
        <div>
          <h3 className="grid-explorer-chart-card__title">
            Renewable Project Register
            <CountChip>{registers.reduce((s, r) => s + r.rows.length, 0)} projects</CountChip>
          </h3>
          <p className="grid-explorer-chart-card__sub">
            Each project SREDA lists, with the agency that built it, how it was financed and where it
            stands
          </p>
        </div>
      </div>

      <div className="pt-3 flex flex-wrap gap-1.5 ge-rn-chips">
        {registers.map((r) => (
          <button
            key={r.technology}
            type="button"
            onClick={() => select(r.technology)}
            className={
              'px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ' +
              (r.technology === active.technology
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40')
            }
            aria-pressed={r.technology === active.technology}
          >
            {r.technology}
            <span className="ml-1.5 opacity-70">{r.rows.length}</span>
          </button>
        ))}
      </div>

      {/* Status chips double as filters: the counts are the point, and clicking
          one is the obvious way to act on them. */}
      <div className="pt-3 flex flex-wrap items-center gap-x-3 gap-y-2 ge-rn-filters">
        <div className="contents ge-rn-chips ge-rn-chips--status">
        <button
          type="button"
          onClick={() => setStatus('all')}
          className={
            'inline-flex items-center gap-1.5 text-[11px] rounded-lg px-1.5 py-0.5 border transition-colors ' +
            (status === 'all' ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-muted/30')
          }
          aria-pressed={status === 'all'}
        >
          <span className="px-1.5 py-px rounded border text-[10px] font-bold bg-muted text-muted-foreground border-border/50">
            {active.rows.length}
          </span>
          <span className="text-muted-foreground">All statuses</span>
        </button>
        {byStatus.map(([name, n]) => (
          <button
            key={name}
            type="button"
            onClick={() => setStatus(status === name ? 'all' : name)}
            className={
              'inline-flex items-center gap-1.5 text-[11px] rounded-lg px-1.5 py-0.5 border transition-colors ' +
              (status === name ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-muted/30')
            }
            aria-pressed={status === name}
          >
            <span className={`px-1.5 py-px rounded border text-[10px] font-bold ${statusClass(name)}`}>
              {n}
            </span>
            <span className="text-muted-foreground">{name}</span>
          </button>
        ))}
        </div>
        <div className="relative ml-auto w-full sm:w-60 ge-rn-search">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter project, location, agency"
            aria-label="Filter projects"
            className="w-full rounded-lg border border-border/60 bg-background py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {visible.length !== active.rows.length && (
        <p className="pt-2 text-[11px] text-muted-foreground">
          {`Showing ${visible.length} of ${active.rows.length} projects. `}
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setStatus('all');
            }}
            className="text-primary font-semibold hover:underline"
          >
            Clear filters
          </button>
        </p>
      )}

      {small ? (
        <div>
          <ul className="ge-plant-list">
            {shown.map((r) => (
              <ProjectCard key={`${r.sid}-${r.projectName}`} r={r} />
            ))}
          </ul>
          {visible.length === 0 && <p className="ge-plant-empty">No projects match this filter.</p>}
          {hidden > 0 && (
            <button type="button" className="ge-gas-show-all" onClick={toggle}>
              {expanded ? 'Show fewer' : `Show all ${visible.length} projects (${hidden} more)`}
            </button>
          )}
        </div>
      ) : (
      <div className="grid-explorer-table-wrap mt-3">
        <table className="grid-explorer-table">
          <thead>
            <tr>
              <th>Project</th>
              <th className="text-right">
                Capacity
                <GridProvenanceTag kind="P" className="ml-1" />
              </th>
              <th>
                Location
                <GridProvenanceTag kind="P" className="ml-1" />
              </th>
              <th>
                Agency
                <GridProvenanceTag kind="P" className="ml-1" />
              </th>
              <th>
                Financing
                <GridProvenanceTag kind="P" className="ml-1" />
              </th>
              <th>
                Completion
                <GridProvenanceTag kind="P" className="ml-1" />
              </th>
              <th>
                Status
                <GridProvenanceTag kind="P" className="ml-1" />
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={`${r.sid}-${r.projectName}`}>
                <td className="font-semibold max-w-[22rem]">
                  {r.projectName}
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    {`SREDA ID ${r.sid} · ${r.technology}`}
                  </span>
                </td>
                <td className="text-right tabular-nums align-top">{r.capacityPublished}</td>
                <td className="text-xs align-top">{r.location}</td>
                {/* SREDA prints these as abbreviations with the full name in an
                    abbr title; both are shown so the page reads without hovering. */}
                <td className="text-xs align-top">
                  {r.agency}
                  {r.agencyFullName && r.agencyFullName !== r.agency && (
                    <span className="block text-[10px] text-muted-foreground leading-tight">
                      {r.agencyFullName}
                    </span>
                  )}
                </td>
                <td className="text-xs text-muted-foreground align-top">
                  {r.finance}
                  {r.financeFullName && r.financeFullName !== r.finance && (
                    <span className="block text-[10px] leading-tight opacity-80">
                      {r.financeFullName}
                    </span>
                  )}
                </td>
                <td className="text-xs tabular-nums align-top">{r.completionDate}</td>
                <td className="align-top">
                  <span
                    className={`inline-block px-1.5 py-px rounded border text-[10px] font-bold whitespace-nowrap ${statusClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                  No projects match this filter.
                </td>
              </tr>
            )}
            <ShowMoreRow
              colSpan={7}
              expanded={expanded}
              hidden={hidden}
              total={visible.length}
              noun="projects"
              onToggle={toggle}
            />
          </tbody>
        </table>
      </div>
      )}

      {(countCheck || capCheck || (techRow && runCheck)) && (
        <div className="mt-3 p-3 rounded-lg border border-border/50 bg-muted/15 space-y-1">
          <div className="text-[11px] font-bold text-foreground mb-1 flex items-center gap-1.5">
            {[countCheck, capCheck, runCheck].every((c) => !c || c.ok) ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
            Reconciled against SREDA&rsquo;s own figures
          </div>

          {countCheck && (
            <div className="flex justify-between gap-3 text-[11px] tabular-nums">
              <span className="text-muted-foreground">
                Projects listed here
                <GridProvenanceTag kind="D" className="ml-1" />
              </span>
              <span>
                {`${countCheck.computed} vs ${countCheck.published} in SREDA’s “System” headline`}
                <GridProvenanceTag kind="P" className="ml-1" />
                <span className={countCheck.ok ? OK_CLASS : WARN_CLASS}>
                  {countCheck.ok ? 'agrees' : 'differs'}
                </span>
              </span>
            </div>
          )}

          {capCheck && (
            <div className="flex justify-between gap-3 text-[11px] tabular-nums">
              <span className="text-muted-foreground">
                {`All ${active.rows.length} projects sum`}
                <GridProvenanceTag kind="D" className="ml-1" />
              </span>
              <span>
                {`${fmt(capCheck.computed)} vs ${active.publishedCapacity} headline`}
                <GridProvenanceTag kind="P" className="ml-1" />
                <span className={capCheck.ok ? OK_CLASS : WARN_CLASS}>
                  {capCheck.ok ? 'agrees' : `differs by ${fmt(capCheck.delta)}`}
                </span>
              </span>
            </div>
          )}

          {techRow && runCheck && (
            <div className="flex justify-between gap-3 text-[11px] tabular-nums">
              <span className="text-muted-foreground">
                {`${running.length} running project${running.length === 1 ? '' : 's'} sum`}
                <GridProvenanceTag kind="D" className="ml-1" />
              </span>
              <span>
                {`${fmt(runningMwp)} vs ${fmt(techRow.totalMwp)} MWp installed`}
                <GridProvenanceTag kind="P" className="ml-1" />
                <span className={runCheck.ok ? OK_CLASS : WARN_CLASS}>
                  {runCheck.ok ? 'agrees' : `differs by ${fmt(runCheck.delta)}`}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      <MobileFold title="How to read this register">
      <div className="py-3 text-[11px] text-muted-foreground leading-relaxed space-y-1.5">
        <p>
          <strong>{`Only “${STATUS_RUNNING}” projects are installed capacity.`}</strong>{' '}
          {`The register lists every life stage — planning, construction, maintenance, retired, and applications rejected — and that capacity is never added to the totals elsewhere on this page. ${active.technology} lists ${active.rows.length} projects of which ${running.length} ${running.length === 1 ? 'is' : 'are'} running.`}
        </p>
        <p>
          The <strong>Completion</strong>{' '}
          column is SREDA&rsquo;s commercial operation date. It is achieved only for a running
          project; on any other status it is a date SREDA records against the project, and can be in
          the past while the project is still under planning. It is shown as printed.
        </p>
        <p>
          {`The register is paginated at ${SREDA_REGISTER_PAGE_SIZE} projects a page; ${
            active.pagesFetched === 1 ? 'this view is a single page' : `all ${active.pagesFetched} pages were read`
          }, and the count above is checked against SREDA’s own headline.`}
        </p>
      </div>
      </MobileFold>

      <GridCardFooter>
        <span>
          Source:{' '}
          <a
            href={active.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            SREDA NDRE — RE Large Projects
          </a>
        </span>
        <span className="font-medium">{`SREDA last update: ${lastUpdate}`}</span>
      </GridCardFooter>
    </div>
  );
}

export default ProjectRegisterCard;
