'use client';

/**
 * The SREDA half of the Renewables tab: the national register of renewable
 * capacity as a standing stock (not a day's output), read from the latest
 * snapshot independent of the open day. Technology totals, the national
 * capacity mix, capacity by year, the project register, owning organisations,
 * SREDA's own reconciliation, the carbon projection and a units glossary.
 */

import { useEffect, useMemo, useState } from 'react';
import { fetchDataJson } from '@/lib/data/runtime-data.client';
import { sredaAvailableDates } from '@/lib/data/sreda/available-dates';
import type { SredaDailyData, SredaProjectRegister, SredaYearTable } from '@/lib/data/sreda/types';
import { fmt } from './charts';
import { isNum, Prov, Row, Section, Skeleton } from './shared';
import { Absent, Check, How, KV, Note, Pill, Ref, ShowMore, Verdict, useNote } from './supply-bits';

const NDRE = 'https://ndre.sreda.gov.bd/';
const f3 = (v: number) => fmt(v, 3);
const int = (v: number) => v.toLocaleString('en-US');
const STATUS_RUNNING = 'Completed & Running';
const REGISTER_PAGE_SIZE = 30;
const STATUS_TONE: Record<string, 'good' | 'info' | 'viol' | 'warn' | 'bad' | undefined> = {
  'Completed & Running': 'good',
  'Implementation Ongoing': 'info',
  'Under Maintenance': 'viol',
  'Under Planning': 'warn',
  'Obsolete System/Plant': undefined,
  'Rejected from Planning/Implementation': 'bad',
};
const ORG_FULL_NAME: Record<string, string> = {
  BPDB: 'Bangladesh Power Development Board',
  NWPGCL: 'North-West Power Generation Company Limited',
  EGCB: 'Electricity Generation Company of Bangladesh',
  BREB: 'Bangladesh Rural Electrification Board',
  WZPDCL: 'West Zone Power Distribution Company Limited',
  DESCO: 'Dhaka Electric Supply Company Limited',
  NESCO: 'Northern Electric Supply Company Limited',
  DPDC: 'Dhaka Power Distribution Company Limited',
  IDCOL: 'Infrastructure Development Company Limited',
  BADC: 'Bangladesh Agricultural Development Corporation',
  BMDA: 'Barind Multipurpose Development Authority',
  RDA: 'Rural Development Academy',
  DAE: 'Department of Agricultural Extension',
  BARD: 'Bangladesh Academy for Rural Development',
  BARI: 'Bangladesh Agricultural Research Institute',
  BRRI: 'Bangladesh Rice Research Institute',
};

export function useSreda() {
  const [sreda, setSreda] = useState<SredaDailyData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    const latest = [...sredaAvailableDates].sort().pop();
    if (!latest) {
      setState('error');
      return;
    }
    fetchDataJson<SredaDailyData>(`sreda/daily/${latest}.json`)
      .then((res) => {
        if (!alive) return;
        const j = res.ok ? res.data : null;
        setSreda(j);
        setState(j ? 'ready' : 'error');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, []);
  return { sreda, state };
}

const SrcLink = ({ href, children, upd }: { href: string; children: React.ReactNode; upd?: string }) => (
  <span>
    Source: <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    {upd ? <> · SREDA last update: {upd}</> : null}
  </span>
);

export function SredaCards({ sreda, state }: { sreda: SredaDailyData | null; state: 'loading' | 'ready' | 'error' }) {
  if (state === 'loading') return <Skeleton heights={[260, 220]} />;
  if (state === 'error' || !sreda) {
    return (
      <Section title="SREDA register unavailable">
        <Absent>No SREDA snapshot could be loaded. Nothing is shown rather than figures from an earlier date under today’s heading.</Absent>
      </Section>
    );
  }
  return (
    <>
      <TechCard sreda={sreda} />
      <MixCard sreda={sreda} />
      <YearCard sreda={sreda} />
      {sreda.projectRegisters?.length ? <RegisterCard sreda={sreda} /> : null}
      {sreda.organisationTables?.length ? <OrgCards sreda={sreda} /> : null}
      <ReconCard sreda={sreda} />
      {sreda.carbonEstimates?.length ? <CarbonCard sreda={sreda} /> : null}
    </>
  );
}

/* ── Installed Capacity by Technology ── */
function TechCard({ sreda }: { sreda: SredaDailyData }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const rows = sreda.technologyBreakdown ?? [];
  const tot = sreda.technologyTotals;
  const grouped = useMemo(() => {
    const order: string[] = [];
    const m = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!m.has(r.source)) {
        m.set(r.source, []);
        order.push(r.source);
      }
      m.get(r.source)!.push(r);
    }
    return order.map((source) => ({ source, rows: m.get(source)! }));
  }, [rows]);
  const sum = (rs: typeof rows, k: 'quantity' | 'offGridMwp' | 'onGridMwp' | 'totalMwp') => rs.reduce((a, r) => a + r[k], 0);
  return (
    <Section
      title="Installed Capacity by Technology"
      desc={<>SREDA National Database of Renewable Energy — as published {sreda.lastUpdate}</>}
      meta={grouped.length ? `${rows.length} technologies` : undefined}
      source={<SrcLink href="https://ndre.sreda.gov.bd/index.php?id=8" upd={sreda.lastUpdate}>SREDA NDRE — Technology wise Generation</SrcLink>}
    >
      {grouped.length === 0 ? (
        <Absent>SREDA’s technology-wise page could not be read for this snapshot.</Absent>
      ) : (
        <>
          <div className="gp-rows">
            {grouped.map((g) => {
              const on = open.has(g.source);
              return (
                <div key={g.source}>
                  <button type="button" className="gps-grp" aria-expanded={on} onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(g.source)) n.delete(g.source); else n.add(g.source); return n; })}>
                    <span className="gps-grp__c">›</span>
                    <div className="gp-row__main">
                      <div className="gp-row__name">{g.source}<Prov kind="D" note="Sum of SREDA’s technology rows beneath it." /></div>
                      <div className="gp-row__sub">{g.rows.length} technolog{g.rows.length === 1 ? 'y' : 'ies'} · {int(sum(g.rows, 'quantity'))} installations</div>
                    </div>
                    <div className="gp-row__val"><b>{f3(sum(g.rows, 'totalMwp'))}</b><small>MWp</small></div>
                  </button>
                  {on &&
                    g.rows.map((r) => (
                      <div key={r.technology} className="gp-row gp-row--nosw gps-kid">
                        <div className="gp-row__main">
                          <div className="gp-row__name gp-row__name--wrap">{r.technology}</div>
                          <div className="gp-row__sub">{int(r.quantity)} installations<Prov kind="P" /> · off-grid {f3(r.offGridMwp)}<Prov kind="P" /> · on-grid {f3(r.onGridMwp)}<Prov kind="P" /> MWp</div>
                        </div>
                        <div className="gp-row__val"><b>{f3(r.totalMwp)}</b><small>MWp</small></div>
                      </div>
                    ))}
                </div>
              );
            })}
            {tot && (
              <Row
                name={<>SREDA published total<Prov kind="P" /></>}
                sub={`${int(tot.quantity)} installations · off-grid ${f3(tot.offGridMwp)} · on-grid ${f3(tot.onGridMwp)} MWp`}
                value={<>{f3(tot.totalMwp)}</>}
                small="MWp"
              />
            )}
          </div>
          <How title="Installations vs MWp: how to read this">
            <p style={{ marginTop: 0 }}><b>Installations</b> is a count, not a capacity: 6,037,583 solar home systems sit beside 14 solar parks, so the columns cannot be ranked against each other. <b>MWp</b> is peak DC capacity as SREDA reports it — not the MW used for grid capacity and output. Each source row sums the SREDA-published technology rows beneath it — tap a source to expand or collapse them.</p>
          </How>
        </>
      )}
    </Section>
  );
}

/* ── National Installed Capacity Mix ── */
function MixCard({ sreda }: { sreda: SredaDailyData }) {
  const mix = sreda.generationMix ?? [];
  const shareSum = mix.reduce((a, m) => a + m.sharePct, 0);
  return (
    <Section
      title="National Installed Capacity Mix"
      desc="Every fuel SREDA counts towards national capacity, renewables among them"
      source={<SrcLink href="https://ndre.sreda.gov.bd/index.php?id=7" upd={sreda.lastUpdate}>SREDA NDRE — Electricity Generation Mix</SrcLink>}
    >
      {mix.length === 0 ? (
        <Absent>SREDA’s generation-mix page could not be read for this snapshot.</Absent>
      ) : (
        <>
          <div className="gp-rows">
            {mix.map((m) => {
              const re = /renewable/i.test(m.fuel);
              return (
                <Row
                  key={m.fuel}
                  name={<span style={re ? { color: 'var(--gp-primary)', fontWeight: 650 } : undefined}>{m.fuel}<Prov kind="P" /></span>}
                  sub={`${fmt(m.sharePct, 2)}% share`}
                  value={<>{int(m.capacityMw)} <span className="gp-u">MW</span></>}
                />
              );
            })}
            <Row
              name={<>SREDA published total<Prov kind="P" /></>}
              sub={<>Σ shares {fmt(shareSum, 2)}%<Prov kind="D" note="SREDA prints no total share; this is the sum of the share column." /></>}
              value={<>{int(sreda.totalInstalledMw)} <span className="gp-u">MW</span></>}
            />
          </div>
          <How title="MW vs MWp on this page">
            <p style={{ marginTop: 0 }}>This page states renewable capacity in <b>MW</b>; the technology page states the same quantity in <b>MWp</b>. SREDA uses both labels for it, and the two figures differ slightly — the reconciliation below reports that rather than picking one.</p>
          </How>
        </>
      )}
    </Section>
  );
}

/* ── Capacity Added by Year ── */
function YearTables({ table }: { table: SredaYearTable }) {
  const [all, setAll] = useState(false);
  const hasQ = table.rows.some((r) => r.quantity !== null);
  const malformed = table.rows.filter((r) => r.yearMalformed);
  const note = useNote();
  const shown = all ? table.rows : table.rows.slice(0, 6);
  return (
    <>
      <div className="gp-group-label">{table.category} <span style={{ fontWeight: 400 }}>{table.rows.length} years</span></div>
      <div className="gp-rows" style={{ marginTop: 4 }}>
        {shown.map((r) => (
          <Row
            key={`${table.category}-${r.year}`}
            name={<>{r.year}{r.yearMalformed && <> <Pill tone="warn" onClick={() => note('As printed', <p style={{ marginTop: 0 }}>SREDA’s year column carries this value as printed. It is not a usable year, and the row is left exactly as published rather than reassigned to a date.</p>)}>as printed</Pill></>}</>}
            sub={hasQ ? <>{r.quantity === null ? 'installations not stated' : `${int(r.quantity)} installations`}<Prov kind="P" /></> : undefined}
            value={<>{r.capacityPublished}<Prov kind="P" /></>}
          />
        ))}
      </div>
      <ShowMore shown={6} total={table.rows.length} noun="years" expanded={all} onToggle={() => setAll((v) => !v)} />
      {table.publishedTotalMwp !== null && (
        <div className="gp-rows" style={{ marginTop: 8 }}>
          <Row
            name="Total"
            sub={hasQ && table.publishedTotalQuantity != null ? <>{int(table.publishedTotalQuantity)} installations<Prov kind="P" /></> : undefined}
            // The mark sits after the figure, as on the year rows above, so the
            // total's digits share their right edge (it sat ~18px left with the mark on the name).
            value={<>{table.publishedTotalCapacity ?? `${fmt(table.publishedTotalMwp, 2)} ${table.publishedTotalUnit ?? 'MW'}`}<Prov kind="P" /></>}
          />
        </div>
      )}
      {malformed.length > 0 && (
        <Note>{`${malformed.length} row${malformed.length === 1 ? '' : 's'} in SREDA’s year column (${malformed.map((r) => r.year).join(', ')}) ${malformed.length === 1 ? 'is not a usable year' : 'are not usable years'}. Their capacity is counted in SREDA’s own total, so the rows are kept as printed rather than dropped or dated.`}</Note>
      )}
    </>
  );
}

function YearCard({ sreda }: { sreda: SredaDailyData }) {
  const tables = sreda.yearWiseTables ?? [];
  const rows = tables.flatMap((t) => t.rows);
  const total = rows.reduce((s, r) => s + r.capacityMwp, 0);
  const pre = rows.filter((r) => r.yearMalformed || Number(r.year) < 2014).reduce((s, r) => s + r.capacityMwp, 0);
  const share = total > 0 ? (pre / total) * 100 : 0;
  return (
    <Section
      title="Capacity Added by Year"
      desc="When SREDA records each block of capacity as having come on"
      source={<SrcLink href="https://ndre.sreda.gov.bd/index.php?id=11" upd={sreda.lastUpdate}>SREDA NDRE — Year wise Generation</SrcLink>}
    >
      {tables.length === 0 ? (
        <Absent>SREDA’s year-wise pages could not be read for this snapshot.</Absent>
      ) : (
        <>
          {tables.map((t) => <YearTables key={t.category} table={t} />)}
          <How title="What the year column means" label="What the year column means">
            <p style={{ marginTop: 0 }}>
              SREDA began operating on 22 May 2014, so it did not record any of this as it happened before that date. {pre.toFixed(1)} MW — {share.toFixed(1)}% of the capacity in these two tables — is dated to a year the agency predates, reconstructed from other bodies’ records rather than registered at the time. It shows.<Prov kind="D" note="Capacity dated before 2014 (malformed years included) over the capacity in both tables." />
            </p>
            <p>The 230 MW booked to <b>1988</b> is Kaptai, the country’s only hydro station and the largest single row here. Its five units came on in three tranches — 2 × 40 MW in 1962, 1 × 50 MW in 1982 and 2 × 50 MW in 1988 — so 100 MW belongs to the year shown and the other 130 MW arrived up to 26 years earlier. The capacity is right and matches SREDA’s own hydro total; only the dating is wrong.</p>
            <p>The 60 MW Cox’s Bazar wind farm is reported both as entering commercial operation on 12 October 2023 and as reaching full output on 8 March 2024, so whichever year it sits in is a choice between two published dates rather than a settled fact.</p>
            <p>Rows are left exactly as SREDA prints them. Sources for this note:{' '}
              <a href="https://sreda.gov.bd/site/page/e48dad3b-6e3a-41b4-ba4f-e57e5d75ecec/-" target="_blank" rel="noopener noreferrer">SREDA, on its own founding</a>;{' '}
              <a href="https://en.banglapedia.org/index.php/Karnafuli_Hydropower_Station" target="_blank" rel="noopener noreferrer">Banglapedia, Karnafuli Hydropower Station</a>;{' '}
              <a href="https://www.energytransitionbd.org/infrastructure/karnaphuli-230-mw-bpdb-hydropower-plant" target="_blank" rel="noopener noreferrer">Energy Transition BD, Karnaphuli 230 MW</a>;{' '}
              <a href="https://www.tbsnews.net/bangladesh/energy/countrys-first-commercial-wind-power-plant-starts-production-810678" target="_blank" rel="noopener noreferrer">The Business Standard, first commercial wind plant</a>. Retrieved 18 August 2026.</p>
          </How>
        </>
      )}
    </Section>
  );
}

/* ── Renewable Project Register ── */
function RegisterCard({ sreda }: { sreda: SredaDailyData }) {
  const registers = sreda.projectRegisters as SredaProjectRegister[];
  const [tech, setTech] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [all, setAll] = useState(false);
  const note = useNote();
  const active = registers.find((r) => r.technology === tech) ?? registers[0];
  const reconciliation = sreda.reconciliation ?? [];
  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of active.rows) m.set(r.status, (m.get(r.status) ?? 0) + 1);
    return [...m.entries()];
  }, [active]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active.rows.filter((r) => (status === 'all' || r.status === status) && (!q || `${r.projectName} ${r.location} ${r.agency} ${r.agencyFullName ?? ''} ${r.finance} ${r.sid}`.toLowerCase().includes(q)));
  }, [active, query, status]);
  const shown = all ? visible : visible.slice(0, 8);
  const running = active.rows.filter((r) => r.status === STATUS_RUNNING);
  const runningMwp = running.reduce((s, r) => s + r.capacityMwp, 0);
  const techRow = (sreda.technologyBreakdown ?? []).find((t) => t.technology === active.technology);
  const find = (marker: string) => reconciliation.find((c) => c.check.startsWith(`${active.technology}: `) && c.check.includes(marker));
  const countCheck = find('projects read');
  const capCheck = find('all projects sum');
  const runCheck = find('running projects in the register');
  const select = (t: string) => { setTech(t); setQuery(''); setStatus('all'); setAll(false); };
  const filtered = status !== 'all' || query.trim() !== '';
  return (
    <Section
      title="Renewable Project Register"
      desc="Each project SREDA lists, with the agency that built it, how it was financed and where it stands"
      meta={`${registers.reduce((s, r) => s + r.rows.length, 0)} projects`}
      source={<SrcLink href={active.sourceUrl} upd={sreda.lastUpdate}>SREDA NDRE — RE Large Projects</SrcLink>}
    >
      {registers.length > 1 && (
        <div className="gp-filter" style={{ marginTop: 0 }} role="group" aria-label="Technology">
          {registers.map((r) => (
            <button key={r.technology} className={r.technology === active.technology ? 'is-on' : ''} aria-pressed={r.technology === active.technology} onClick={() => select(r.technology)}>{r.technology} · {r.rows.length}</button>
          ))}
        </div>
      )}
      <div className="gp-filter" role="group" aria-label="Status">
        <button className={status === 'all' ? 'is-on' : ''} aria-pressed={status === 'all'} onClick={() => { setStatus('all'); setAll(false); }}>All statuses · {active.rows.length}</button>
        {byStatus.map(([s, c]) => (
          <button key={s} className={status === s ? 'is-on' : ''} aria-pressed={status === s} onClick={() => { setStatus(status === s ? 'all' : s); setAll(false); }}>{s} · {c}</button>
        ))}
      </div>
      <input className="gp-search" style={{ marginTop: 'var(--s3)' }} type="search" placeholder="Filter project, location, agency" aria-label="Filter projects" value={query} onChange={(e) => { setQuery(e.target.value); setAll(false); }} />
      {filtered && (
        <div className="gp-hint" style={{ textAlign: 'left' }}>
          Showing {visible.length} of {active.rows.length} projects.{' '}
          <button type="button" style={{ border: 0, background: 'none', color: 'var(--gp-primary)', fontWeight: 600, minHeight: 32, padding: 0 }} onClick={() => { setQuery(''); setStatus('all'); }}>Clear filters</button>
        </div>
      )}
      <div className="gp-rows" style={{ marginTop: 8 }}>
        {visible.length === 0 && <div className="gp-empty" style={{ margin: '0 var(--s4)', minHeight: 72 }}>No projects match this filter.</div>}
        {shown.map((r) => (
          <Row
            key={r.sid + r.projectName}
            name={r.projectName}
            wrap
            top
            sub={<>SREDA ID {r.sid} · {r.technology}<br />{r.location}<br />{r.agency} · {r.finance} · COD {r.completionDate}</>}
            value={r.capacityPublished}
            small={<Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill>}
            chevron
            onClick={() =>
              note(
                r.projectName,
                <>
                  <KV label="Status" kind="P" value={r.status} />
                  <KV label="Capacity" kind="P" value={r.capacityPublished} />
                  <KV label="Location" kind="P" value={r.location} />
                  <KV label="Agency" kind="P" value={r.agency} sub={r.agencyFullName ?? undefined} />
                  <KV label="Financing" kind="P" value={r.finance} sub={r.financeFullName ?? undefined} />
                  <KV label="Completion" kind="P" value={r.completionDate} sub="Commercial operation date as printed" />
                  <KV label="SREDA ID" value={`${r.sid} · ${r.technology}`} />
                </>,
              )
            }
          />
        ))}
      </div>
      <ShowMore shown={8} total={visible.length} noun="projects" expanded={all} onToggle={() => setAll((v) => !v)} />

      {(countCheck || capCheck || (techRow && runCheck)) && (
        <Check title="Reconciled against SREDA’s own figures" ok={[countCheck, capCheck, runCheck].every((c) => !c || c.ok)}>
          {countCheck && <KV label="Projects listed here" kind="D" value={<>{`${countCheck.computed} vs ${countCheck.published} in SREDA’s “System” headline`}<Prov kind="P" /> <Verdict ok={countCheck.ok} dp={0} /></>} />}
          {capCheck && <KV label={`All ${active.rows.length} projects sum`} kind="D" value={<>{`${f3(capCheck.computed)} vs ${active.publishedCapacity} headline`}<Prov kind="P" /> <Verdict ok={capCheck.ok} delta={capCheck.delta} /></>} />}
          {techRow && runCheck && <KV label={`${running.length} running project${running.length === 1 ? '' : 's'} sum`} kind="D" value={<>{`${f3(runningMwp)} vs ${f3(techRow.totalMwp)} MWp installed`}<Prov kind="P" /> <Verdict ok={runCheck.ok} delta={runCheck.delta} /></>} />}
        </Check>
      )}
      <How title="How to read this register">
        <p style={{ marginTop: 0 }}><b>Only “{STATUS_RUNNING}” projects are installed capacity.</b> The register lists every life stage — planning, construction, maintenance, retired, and applications rejected — and that capacity is never added to the totals elsewhere on this page. {active.technology} lists {active.rows.length} projects of which {running.length} {running.length === 1 ? 'is' : 'are'} running.</p>
        <p>The <b>Completion</b> column is SREDA’s commercial operation date. It is achieved only for a running project; on any other status it is a date SREDA records against the project, and can be in the past while the project is still under planning. It is shown as printed.</p>
        <p>{`The register is paginated at ${REGISTER_PAGE_SIZE} projects a page; ${active.pagesFetched === 1 ? 'this view is a single page' : `all ${active.pagesFetched} pages were read`}, and the count above is checked against SREDA’s own headline.`}</p>
      </How>
    </Section>
  );
}

/* ── Owning organisations ── */
function OrgCards({ sreda }: { sreda: SredaDailyData }) {
  return (
    <>
      {(sreda.organisationTables ?? []).map((t) => (
        <Section key={t.category} title={t.category} desc="By implementing organisation, as attributed by SREDA" source={<SrcLink href={t.sourceUrl}>SREDA NDRE</SrcLink>}>
          <div className="gp-rows">
            {t.rows.map((o) => (
              <Row key={o.organisation} name={<>{o.organisation}<Prov kind="P" /></>} sub={ORG_FULL_NAME[o.organisation]} wrap value={o.capacityPublished} small={`${int(o.quantity)} units`} />
            ))}
            {t.publishedTotalMwp !== null && (
              <Row
                name={<>Total<Prov kind="P" /></>}
                value={t.publishedTotalCapacity ?? `${fmt(t.publishedTotalMwp, 2)} MWp`}
                small={t.publishedTotalQuantity != null ? `${int(t.publishedTotalQuantity)} units` : undefined}
              />
            )}
          </div>
        </Section>
      ))}
    </>
  );
}

/* ── Reconciliation of SREDA's own totals ── */
function ReconCard({ sreda }: { sreda: SredaDailyData }) {
  const checks = sreda.reconciliation ?? [];
  const failed = checks.filter((c) => !c.ok);
  const [showAll, setShowAll] = useState(false);
  const view = showAll || failed.length === 0 ? checks : failed;
  return (
    <Section
      title="Reconciliation of SREDA’s own totals"
      desc="Each published total recomputed from the rows above it, and compared where two SREDA pages state the same quantity"
      meta={checks.length ? <span className={failed.length ? 'gps-warn' : 'gps-ok'}>{checks.length - failed.length} agree · {failed.length} differ</span> : undefined}
      source={<span>Source: <a href={NDRE} target="_blank" rel="noopener noreferrer">SREDA NDRE</a> · Recomputed by ESB Power Line from SREDA’s published rows</span>}
    >
      {checks.length === 0 ? (
        <Absent>No reconciliation available for this snapshot.</Absent>
      ) : (
        <>
          <div className="gp-hint" style={{ textAlign: 'left', marginTop: 0 }}>
            {failed.length === 0 ? 'Every check agrees' : showAll ? `Showing all ${checks.length} checks` : `Showing the ${failed.length} that differ`}
          </div>
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {view.map((c, i) => (
              <Row
                key={i}
                name={c.check}
                wrap
                top
                sub={<>SREDA states {fmt(c.published, 3)}<Prov kind="P" /> · recomputed {fmt(c.computed, 3)}<Prov kind="D" /></>}
                value={<Pill tone={c.ok ? 'good' : 'warn'}>{c.ok ? 'agrees' : 'differs'}</Pill>}
                small={<>{c.delta > 0 ? '+' : c.delta < 0 ? '−' : '±'}{fmt(Math.abs(c.delta), 3)} · band ±{c.tolerance}<Prov kind="D" /></>}
              />
            ))}
          </div>
          {failed.length > 0 && (
            <button type="button" className="gp-more" onClick={() => setShowAll((v) => !v)}>{showAll ? 'Show only differences' : `Show all ${checks.length} checks`}</button>
          )}
          <How title="How the band is set">
            <p style={{ marginTop: 0 }}>
              The band is half of the last digit SREDA prints, once per figure summed — derived from how the source states its numbers, not chosen.
              {failed.length > 0 && <> <b style={{ color: 'var(--gp-warn)' }}>{failed.length} check{failed.length === 1 ? '' : 's'} differ</b> — two SREDA pages state a different figure for the same quantity on the same day. Both are shown as published. Neither has been adjusted to match the other, and no third figure has been invented to reconcile them.</>}
            </p>
          </How>
        </>
      )}
    </Section>
  );
}

/* ── Energy & Carbon — Projection ── */
function CarbonCard({ sreda }: { sreda: SredaDailyData }) {
  const rows = sreda.carbonEstimates ?? [];
  return (
    <Section
      title="Energy & Carbon — Projection"
      desc="Modelled projections published by SREDA, not metered generation"
      source={<SrcLink href="https://ndre.sreda.gov.bd/index.php?id=21" upd={sreda.lastUpdate}>SREDA NDRE — Energy Generation and Carbon Savings</SrcLink>}
    >
      <div className="gps-box"><b>These are estimates, including the “so far” column.</b> Read before using.</div>
      <How title="These are estimates: read before using" label="Why these are estimates">
        <p style={{ marginTop: 0 }}><b>These are estimates, including the “so far” column.</b> SREDA heads both of its column groups “Expected Energy Generation” — the figures are modelled from installed capacity and elapsed time, not measured at a meter. SREDA publishes neither the yield assumption nor the emission factor behind them, so they cannot be checked, and they are reproduced verbatim rather than recalculated. The metered renewable output is in the PGCB sections above.</p>
      </How>
      <div className="gp-rows" style={{ marginTop: 8 }}>
        {rows.map((r) => {
          const total = /^total$/i.test(r.technology);
          return (
            <div key={r.technology} className="gp-row gp-row--nosw" style={{ display: 'block', background: total ? 'var(--gp-surface2)' : undefined }}>
              <div className="gp-row__name" style={{ fontWeight: 650 }}>{r.technology}</div>
              <KV label="Installed" kind="P" value={r.installedCapacity} />
              <KV label="Expected over system life" kind="P" value={r.lifetimeEnergyExpected} />
              <KV label="Expected CO₂ avoided" kind="P" value={r.lifetimeCo2Expected} />
              <KV label="Expected so far" kind="P" value={r.tillTodayEnergyExpected} />
              <KV label="Expected CO₂ so far" kind="P" value={r.tillTodayCo2Expected} />
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── Units glossary ── */
export function UnitsGlossary() {
  const groups: { heading: string; items: { term: string; plain: string }[] }[] = [
    { heading: 'Power — how much at one moment', items: [
      { term: 'MW', plain: 'Megawatt. A rate, not an amount — how much electricity is flowing right now. One megawatt is a million watts, roughly the draw of a few hundred homes.' },
      { term: 'MWp', plain: 'Megawatt-peak. The most a solar array can produce under standard test conditions — full sun, cool panel. Real output is lower nearly all the time, so MWp and MW are not the same measure and are never added together here.' },
      { term: 'kWp', plain: 'Kilowatt-peak. One thousandth of a MWp. SREDA prints small installations this way in the same column as large ones, so 292.08 kWp sits beside 43.47 MWp and means far less.' },
    ] },
    { heading: 'Energy — how much over a period', items: [
      { term: 'kWh', plain: 'Kilowatt-hour — one bar of an electric heater running for an hour. Every unit below is a multiple of it.' },
      { term: 'MWh', plain: 'Megawatt-hour. One thousand kWh. SREDA uses it for its smallest categories.' },
      { term: 'MKWh', plain: 'Million kilowatt-hours — the unit PGCB uses for a day or a month of generation. Same size as a GWh.' },
      { term: 'GWh', plain: 'Gigawatt-hour. One thousand MWh, and equal to one MKWh.' },
      { term: 'TWh', plain: 'Terawatt-hour. One thousand GWh — about a month and a half of Bangladesh’s entire electricity generation.' },
    ] },
    { heading: 'Carbon', items: [
      { term: 'tCO₂', plain: 'Tonnes of carbon dioxide. Here it means emissions SREDA calculates were avoided by generating with renewables instead of fossil fuel.' },
      { term: 'k tCO₂ · M tCO₂', plain: 'Thousand and million tonnes of CO₂. SREDA abbreviates them this way in its own table.' },
    ] },
    { heading: 'Other terms', items: [
      { term: 'On-grid · Off-grid', plain: 'On-grid feeds the national network. Off-grid serves its own site only — a solar home system, an irrigation pump — and never reaches the grid, so it does not appear in PGCB’s generation figures.' },
      { term: 'Tk/kWh', plain: 'Taka per kilowatt-hour: what a unit of electricity cost to produce. No agency publishes this rate; it is cost divided by energy, which is why it is marked D.' },
      { term: 'Installations', plain: 'A count of separate systems, not capacity. Six million solar home systems and fourteen solar parks are both counts, and the two columns cannot be compared.' },
    ] },
  ];
  return (
    <Section title="Units on this page" desc="What each abbreviation means, in plain terms" source={<span>Definitions by ESB Power Line · <Prov kind="P" /> a figure the named agency publishes, reproduced unchanged · <Prov kind="D" /> a figure we calculated from published figures</span>}>
      <How title="Definitions: power, energy, carbon, other terms" label="Definitions: power, energy, carbon, other terms">
        {groups.map((g) => (
          <div key={g.heading}>
            <div className="gp-group-label" style={{ marginLeft: 0 }}>{g.heading}</div>
            {g.items.map((it) => (
              <KV key={it.term} label={<b style={{ color: 'var(--gp-on)' }}>{it.term}</b>} value="" sub={it.plain} />
            ))}
          </div>
        ))}
        <p><b>Where the marks go.</b> Every column that states something about a row carries <Prov kind="P" /> or <Prov kind="D" />. The first column of each table is the row’s own name — the station, technology, organisation, project or year it describes — and is left unmarked, because it identifies the row rather than asserting a figure about it. Chart series carry the mark in the legend.</p>
      </How>
    </Section>
  );
}

export { Ref };
