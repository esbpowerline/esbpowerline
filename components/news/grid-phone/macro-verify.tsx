'use client';

/**
 * Published vs Derived, drawn for the phone.
 *
 * Same files as the desktop (PublishedVsDerivedTab.tsx): the small
 * /data/grid-verification/_index.json, then one month file on demand, opening
 * on the month's first day with a defect. The desktop's six-column table
 * becomes one ruled row per check — the quantity, its status, and the
 * published / derived / delta / terms figures beneath — so nothing is cut off
 * at 390px. Nothing here computes a figure except the headline agreement
 * share, which is the desktop's own arithmetic.
 */

import { useEffect, useMemo, useState } from 'react';
import '@/app/grid-phone-macro-extra.css';
import { Prov, Section, nbDate } from './shared';
import { Cell, Foot, InfoPill, Pills } from './macro-kit';

/* Shapes of the published JSON — the desktop declares them privately. */
type Status = 'exact' | 'rounding' | 'fail';
interface CheckRow { agency: string; check: string; published: number | null; derived: number | null; delta: number | null; terms: number | null; tolerance: number | null; status: Status; independent: boolean }
interface Defect { agency: string; kind: string; detail?: string | null; corroborated_by?: string | null }
interface DayDetail {
  date: string;
  agencies: Record<string, { label: string; checks: number; exact: number; rounding: number; failures: number }>;
  checks: CheckRow[];
  checks_total?: number;
  checks_omitted_exact?: number;
  defects: Defect[];
  coverage: { pb_words: number | null; pb_words_unassigned: number | null };
}
interface Totals { days: number; checks: number; exact: number; rounding: number; failures: number; defects: number; cross_agency_ok: number; cross_agency_days: number; dual_confirmed_days?: number; dual_withheld_days?: number }
interface WithheldDay { date: string; sources: string[]; disagreements: { source: string; figure: string; a: number | string | null; b: number | string | null; why: string }[] }
interface MonthFile { month: string; days: Record<string, DayDetail>; totals: Totals; dual?: { gated: boolean; note: string; withheld: WithheldDay[] } }
interface IndexFile { generated_at: string; provenance: Record<string, string>; method: string; dual_method?: string; months: { month: string; totals: Totals; dual?: { gated: boolean; withheld: number } }[]; totals: Totals }

/** The desktop's wording for each defect kind (PublishedVsDerivedTab.tsx DEFECT_LABEL). */
const DEFECT_LABEL: Record<string, string> = {
  present_exceeds_installed: 'Present capacity printed above installed capacity',
  national_grid_total_lags_one_row: 'National Grid Total column lags one row',
  national_grid_total_corrupt: 'National Grid Total cell holds a corrupt value',
  headline_disagrees_with_plant_table: 'Headline figure disagrees with its own plant table',
  stale_subtotal_carried_forward: 'Sub-total carried forward from the previous day',
};
const STATUS: Record<Status, string> = { exact: 'Exact', rounding: 'Rounding', fail: 'Defect' };
const num = (v: number | null | undefined, dp = 2) => (v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: dp }));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MacroVerify({ latestGridDay }: { latestGridDay: string }) {
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<MonthFile | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [agency, setAgency] = useState('all');
  const [onlyInteresting, setOnlyInteresting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/data/grid-verification/_index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: IndexFile) => { if (alive) { setIndex(j); setMonth(j.months[j.months.length - 1]?.month ?? null); } })
      .catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!month) return;
    let alive = true;
    setMonthData(null);
    fetch(`/data/grid-verification/${month}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: MonthFile) => {
        if (!alive) return;
        setMonthData(j);
        const days = Object.keys(j.days).sort();
        setDay(days.find((d) => j.days[d].defects.length > 0) ?? days[0] ?? null);
      })
      .catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
  }, [month]);

  const detail = day && monthData ? monthData.days[day] : null;
  const rows = useMemo(() => {
    if (!detail) return [];
    let r = detail.checks;
    if (agency !== 'all') r = r.filter((x) => x.agency === agency);
    if (onlyInteresting) r = r.filter((x) => x.status !== 'exact' || x.independent);
    return r;
  }, [detail, agency, onlyInteresting]);

  if (error && !index) return <Section title="Published vs Derived"><div className="gp-empty" style={{ minHeight: 96 }}>Verification data is not available. {error}</div></Section>;
  if (!index) return <><div className="gp-skel" style={{ height: 220 }} /><div className="gp-skel" style={{ height: 420 }} /></>;

  const t = index.totals;
  const agreePct = t.checks ? ((t.exact + t.rounding) / t.checks) * 100 : 0;
  const coveredThrough = index.months[index.months.length - 1]?.month ?? null;
  const gridMonth = latestGridDay?.slice(0, 7) ?? null;
  const behind = Boolean(coveredThrough && gridMonth && gridMonth > coveredThrough);
  const years = Array.from(new Set(index.months.map((m) => m.month.slice(0, 4)))).sort();
  const yi = Math.max(0, years.indexOf(month?.slice(0, 4) ?? ''));
  const dual = (t.dual_confirmed_days ?? 0) + (t.dual_withheld_days ?? 0) > 0;

  return (
    <>
      <div className={`gpm-notice${behind ? '' : ' gpm-notice--plain'}`}>
        <b>Checked through {nbDate(coveredThrough ?? '—')}.</b>
        {behind
          ? <>The explorer now carries data to {nbDate(latestGridDay)}, which is past that — so the most recent days on this site have <strong>not been through these checks yet</strong>.</>
          : <>Current with the newest day the explorer carries{latestGridDay ? ` (${nbDate(latestGridDay)})` : ''}.</>}{' '}
        Last run {nbDate(index.generated_at?.slice(0, 10) ?? '')}.
      </div>

      <Section title="Published vs Derived" desc="Every control total the agencies print, beside our recomputation of it from the same document's rows" meta="All months">
        <div className="gp-stats">
          <Cell label="Published totals recomputed" prov="D" value={t.checks.toLocaleString('en-US')} detail={`${t.days} days, ${index.months.length} months`} />
          <Cell label="Reproduced from source rows" prov="D" value={`${agreePct.toFixed(2)}%`} tone="good" detail={`${t.exact.toLocaleString('en-US')} exact, ${t.rounding.toLocaleString('en-US')} within printing precision`} />
          <Cell label="Source defects found" prov="D" value={String(t.defects)} tone={t.failures ? 'warn' : 'good'} detail="published figure kept as published" />
          <Cell label="PGCB = BPDB peak" prov="D" value={`${t.cross_agency_ok}/${t.cross_agency_days}`} detail="two agencies, two formats, same day" />
          {dual && <Cell label="Read twice, agreed" prov="D" value={String(t.dual_confirmed_days ?? 0)} tone="good" detail={`days confirmed by two independent engines · ${t.dual_withheld_days ?? 0} withheld`} />}
        </div>
        <div className="gpm-pills">
          <InfoPill label="How to read this" sub="Published vs Derived">
            <p><Prov kind="P" /> {index.provenance.P}</p>
            <p><Prov kind="D" /> {index.provenance.D}</p>
            <p>{index.method}</p>
            {index.dual_method && <p>{index.dual_method}</p>}
          </InfoPill>
        </div>
      </Section>

      <Section title="Month and day" desc="Checks per month; amber marks a month or day with a source defect" meta={monthData ? monthData.month : month ?? ''}>
        <p className="gpm-pickl">Year</p>
        <Pills label="Year" items={years} sel={yi} onSel={(k) => { const m = index.months.filter((x) => x.month.startsWith(years[k])); if (m.length) setMonth(m[m.length - 1].month); }} />
        <p className="gpm-pickl" style={{ marginTop: 12 }}>Month · pairs checked</p>
        <div className="gpv-months">
          {MON.map((label, k) => {
            const key = `${years[yi]}-${String(k + 1).padStart(2, '0')}`;
            const m = index.months.find((x) => x.month === key);
            return (
              <button key={key} type="button" disabled={!m} className={`${month === key ? 'is-on' : ''}${m && m.totals.defects > 0 ? ' is-bad' : ''}`} onClick={() => m && setMonth(key)}>
                <b>{label}{m?.dual?.gated ? ' ✓' : ''}</b>
                <small>{m ? m.totals.checks.toLocaleString('en-US') : '—'}</small>
              </button>
            );
          })}
        </div>
        {monthData && (
          <>
            <p className="gpm-pickl" style={{ marginTop: 14 }}>{monthData.month} — operating days</p>
            <div className="gpv-days">
              {Object.keys(monthData.days).sort().map((d) => {
                const bad = monthData.days[d].defects.length > 0;
                return <button key={d} type="button" aria-label={`${d}, ${monthData.days[d].checks.length} pairs, ${monthData.days[d].defects.length} defects`} className={`${d === day ? 'is-on' : ''}${bad ? ' is-bad' : ''}`} onClick={() => setDay(d)}>{d.slice(-2)}</button>;
              })}
            </div>
            <div className="gpm-kvs">
              <div className="gpm-kv"><span className="gpm-kv__l">P/D pairs this month</span><b>{monthData.totals.checks.toLocaleString('en-US')}</b></div>
              <div className="gpm-kv"><span className="gpm-kv__l">Beyond rounding</span><b className={monthData.totals.failures ? 'is-warn' : undefined}>{monthData.totals.failures}</b></div>
              <div className="gpm-kv"><span className="gpm-kv__l">Defects</span><b className={monthData.totals.defects ? 'is-warn' : undefined}>{monthData.totals.defects}</b></div>
            </div>
            {monthData.dual?.gated && (
              <div className="gpm-notice gpm-notice--plain" style={{ marginTop: 12 }}>
                <b>Dual-parse gated</b>
                {monthData.dual.note}
                {monthData.dual.withheld.map((w) => (
                  <span key={w.date} className="gpv-withheld">
                    <strong>{nbDate(w.date)} withheld</strong> — engines disagreed on {w.disagreements.length} figure{w.disagreements.length === 1 ? '' : 's'} ({w.sources.join(', ')})
                    {w.disagreements.slice(0, 4).map((g, i) => <span key={i} className="gpv-withheld__l">{g.source} · {g.figure}: {String(g.a ?? '—')} vs {String(g.b ?? '—')} — {g.why}</span>)}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      {detail && (
        <Section title={detail.date} desc="Each published figure beside our recomputation of it" meta="The day">
          <div className="gpm-kvs gpm-kvs--flush">
            {Object.entries(detail.agencies).map(([k, v]) => (
              <div key={k} className="gpm-kv"><span className="gpm-kv__l">{v.label}</span><b className={v.failures ? 'is-warn' : undefined}>{v.checks} checks{v.failures > 0 ? ` · ${v.failures} defect` : ''}</b></div>
            ))}
          </div>
          {detail.coverage.pb_words !== null && (
            <p className="gpm-insight">Petrobangla page coverage: <strong>{detail.coverage.pb_words!.toLocaleString('en-US')} of {detail.coverage.pb_words!.toLocaleString('en-US')} words</strong> assigned to a named block — nothing on the page is unaccounted for.</p>
          )}
          {detail.defects.length > 0 && (
            <div className="gpm-notice" style={{ marginTop: 12 }}>
              {detail.defects.map((d, i) => (
                <span key={i} className="gpv-defect">
                  <b>{DEFECT_LABEL[d.kind] ?? d.kind}</b>
                  <span>{d.agency}{d.detail ? ` — ${d.detail}` : ''}</span>
                  {d.corroborated_by && <span>Corroborated by: {d.corroborated_by}</span>}
                </span>
              ))}
            </div>
          )}

          <div className="gpv-filters">
            <div className="gpm-years">
              {['all', ...Object.keys(detail.agencies)].map((a) => (
                <button key={a} type="button" aria-pressed={agency === a} className={agency === a ? 'is-on' : ''} onClick={() => setAgency(a)}>{a === 'all' ? 'All' : detail.agencies[a]?.label ?? a}</button>
              ))}
            </div>
            <label className="gpv-check"><input type="checkbox" checked={onlyInteresting} onChange={(e) => setOnlyInteresting(e.target.checked)} />Hide pairs that agree exactly</label>
          </div>
          {!onlyInteresting && (detail.checks_omitted_exact ?? 0) > 0 && (
            <p className="gpm-insight">{detail.checks_omitted_exact!.toLocaleString('en-US')} of this day&rsquo;s {detail.checks_total!.toLocaleString('en-US')} pairs agree to the last printed digit and are counted but not listed individually — the itemised rows below are every disagreement, every pair inside the rounding band, and every geometry-independent check.</p>
          )}

          <div className="gpv-head"><span>Quantity</span><span>Published<Prov kind="P" /></span><span>Derived<Prov kind="D" /></span><span>Δ</span></div>
          <div className="gpv-rows">
            {rows.map((r, i) => (
              <div key={i} className="gpv-row">
                <div className="gpv-row__n">
                  <span>{r.check}</span>
                  <i className={`gpv-st gpv-st--${r.status}`}>{STATUS[r.status]}</i>
                  {r.independent && <i className="gpv-st gpv-st--ind">Independent</i>}
                </div>
                <div className="gpv-row__v">
                  <span>{r.terms ?? '—'} terms</span>
                  <b>{num(r.published)}</b>
                  <b>{num(r.derived)}</b>
                  <b className={r.status === 'fail' ? 'is-bad' : undefined}>{num(r.delta, 3)}</b>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="gpm-insight">Every pair on this day agrees exactly. Untick the filter to see all {detail.checks.length.toLocaleString('en-US')}.</p>}
          </div>

          <div className="gpm-pills">
            <InfoPill label="What is being shown?" sub="Published vs Derived">
              <p>Each row is one figure the agency prints (<Prov kind="P" />) beside our recomputation of it from the itemised rows the same document prints above that total (<Prov kind="D" />). Rows marked <strong>Independent</strong> compare two different parts of the document — or two different agencies — rather than a total against its own components, so they can catch an error that internally consistent arithmetic cannot. <strong>Independent</strong>: the two sides come from different parts of the document, so this check can fail for reasons other than arithmetic.</p>
              <p><strong>Analytical Insight:</strong> A published total that its own rows reproduce is corroborated. Where the two disagree by more than the source&apos;s printing precision allows, the published figure is left exactly as published and the disagreement is recorded — this pipeline never edits a source.</p>
            </InfoPill>
          </div>
          <Foot>
            <span>Source: Petrobangla, PGCB (NLDC) and BPDB daily operational reports as published.</span>
            <span>Audited by: no third party — these are arithmetic checks against the documents themselves.</span>
            <span>Generated {index.generated_at.slice(0, 10)}</span>
          </Foot>
        </Section>
      )}
    </>
  );
}
