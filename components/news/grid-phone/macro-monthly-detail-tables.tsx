'use client';

/**
 * The long sheets of the monthly detail (macro-monthly-detail.tsx): the daily
 * load-shed grid, the four substation tables, FGMO and the outage log. On the
 * desktop these are wide tables; here each is a list of ruled rows, searchable
 * and paged where the desktop is, with a bottom sheet holding a row's full record.
 */

import { useMemo, useState, type ReactNode } from 'react';
import type { PgcbDailyShedRow, PgcbFgmoPlant, PgcbMonthlyDetail, PgcbOutageEvent } from '@/lib/data/companies/pgcb';
import { Prov, Row, useSheet } from './shared';
import { Cell, InfoPill, KV, TableSheet } from './macro-kit';
import { SERIES_COLORS } from '@/lib/data/grid/chart-palette';

export const SERIES_A = SERIES_COLORS.installedCapacity;
export const SERIES_B = SERIES_COLORS.peakGeneration;

/** The desktop's formatter: a missing figure is a dash, never zero. */
export function f(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
export function pctChange(cur: number | null | undefined, prev: number | null | undefined): number | null {
  if (cur === null || cur === undefined || !prev) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}
/** Direction as a glyph and a word, never colour alone (desktop DeltaBadge). */
export function Chg({ change, goodWhen = 'down', suffix }: { change: number | null; goodWhen?: 'up' | 'down'; suffix?: string }) {
  if (change === null || !Number.isFinite(change)) return null;
  const flat = Math.abs(change) < 0.05;
  const good = goodWhen === 'up' ? change > 0 : change <= 0;
  return (
    <span className={`gp-delta ${flat ? 'flat' : good ? 'good' : 'bad'}`} style={{ whiteSpace: 'nowrap' }}>
      {flat ? '→' : change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%{suffix ? <span className="gpmd-mut"> {suffix}</span> : null}
    </span>
  );
}
/** Label + mark kept on one line. */
export const L = ({ children, k, note }: { children: ReactNode; k: 'P' | 'D'; note?: string }) => <span className="gpmd-nb">{children}<Prov kind={k} note={note} /></span>;
export function Terms({ items, label = 'Terms used here' }: { items: Array<[string, ReactNode]>; label?: string }) {
  return (
    <InfoPill label={label}>
      {items.map(([t, d]) => <p key={t}><strong>{t}</strong> — {d}</p>)}
    </InfoPill>
  );
}

const ZONES = [
  ['dhaka', 'Dhaka'], ['chattogram', 'Chattogram'], ['cumilla', 'Cumilla'], ['mymensingh', 'Mymensingh'], ['sylhet', 'Sylhet'],
  ['khulna', 'Khulna'], ['barishal', 'Barishal'], ['rajshahi', 'Rajshahi'], ['rangpur', 'Rangpur'],
] as const;
const PAGE = 25;

/** Desktop shedCellStyle: zero is its own green; magnitude on one rose ramp (sqrt). Null is not reported. */
function cell(v: number | null | undefined, max: number) {
  if (v == null) return 'var(--gp-surface2)';
  if (v <= 0 || max <= 0) return 'rgba(16, 185, 129, 0.18)';
  return `rgba(190, 18, 60, ${(0.15 + Math.min(1, Math.sqrt(v / max)) * 0.85).toFixed(3)})`;
}

function Strip({ vals, max }: { vals: (number | null | undefined)[]; max: number }) {
  return <div className="gpmd-strip" style={{ gridTemplateColumns: `repeat(${vals.length}, 1fr)` }}>{vals.map((v, i) => <i key={i} style={{ background: cell(v, max) }} />)}</div>;
}

export function ShedPanel({ detail, monthLabel }: { detail: PgcbMonthlyDetail; monthLabel: string }) {
  const open = useSheet();
  const ev = detail.daily_load_shedding?.evening_peak ?? [];
  const dp = detail.daily_load_shedding?.day_peak ?? [];
  const [peak, setPeak] = useState<'evening' | 'day'>(ev.length ? 'evening' : 'day');
  const rows: PgcbDailyShedRow[] = peak === 'evening' ? ev : dp;
  const label = peak === 'evening' ? 'Evening peak' : 'Day peak';
  const max = rows.reduce((m, r) => Math.max(m, ...ZONES.map(([k]) => r.zones?.[k] ?? 0)), 0);
  const totals = ZONES.map(([k, name]) => ({ k, name, total: rows.reduce((s, r) => s + (r.zones?.[k] ?? 0), 0) }));
  const monthTotal = totals.reduce((s, z) => s + z.total, 0);
  const zonesReported = rows.some((r) => ZONES.some(([k]) => r.zones?.[k] != null));
  const sysPeak = rows.reduce((m, r) => Math.max(m, r.load_shed_mw ?? 0), 0);
  const worst = totals.slice().sort((a, b) => b.total - a.total)[0];
  const day = (r: PgcbDailyShedRow) => String(Number(r.date.slice(8, 10)));
  const zoneSheet = (k: string, name: string, total: number) => open(
    <TableSheet title={`${name} · ${label.toLowerCase()}`} sub={`Megawatts shed each day, ${monthLabel}`}
      head={['Day', { label: <L k="P">Shed</L>, unit: 'MW' }, { label: 'Time', text: true }]}
      rows={rows.map((r) => { const v = r.zones?.[k]; return [day(r), v == null ? 'Not reported' : v > 0 ? f(v) : 'None', v && v > 0 ? r.time ?? '—' : '—']; })}
      after={<p className="gp-note" style={{ marginTop: 12 }}><Prov kind="D" /> Month total {f(total)} MW, summed across every {label.toLowerCase()} this month.</p>} />,
  );
  const allSheet = () => open(
    <TableSheet title={`All zones · ${label.toLowerCase()}`} sub={`System-wide load shed PGCB states for each day, ${monthLabel}`}
      head={['Day', { label: <L k="P">Shed</L>, unit: 'MW' }, { label: <L k="P">Gen</L>, unit: 'MW' }, { label: <L k="P">Demand</L>, unit: 'MW' }, { label: 'Time', text: true }]}
      rows={rows.map((r) => [day(r), r.load_shed_mw ? f(r.load_shed_mw) : 'None', f(r.generation_mw), f(r.demand_mw), r.time ?? '—'])} />,
  );
  if (!rows.length) return <p className="gpmd-lede">No daily load shedding recorded.</p>;
  return (
    <>
      {ev.length > 0 && dp.length > 0 && (
        <div className="gp-seg" role="group" aria-label="Peak">
          <button type="button" className={peak === 'evening' ? 'is-on' : ''} onClick={() => setPeak('evening')}>Evening peak</button>
          <button type="button" className={peak === 'day' ? 'is-on' : ''} onClick={() => setPeak('day')}>Day peak</button>
        </div>
      )}
      <p className="gpmd-lede">Megawatts shed each day at {peak} peak, {monthLabel}. Tap a zone for its daily figures.</p>
      {!zonesReported && sysPeak > 0 && <div className="gpm-notice gpm-notice--in">This month&apos;s report gives a system-wide load shed of up to {f(sysPeak)} MW but publishes no zone-by-zone breakdown. The zone rows below are blank because the figures were not reported — not because nothing was shed. Read the <strong>All zones</strong> row for what PGCB did record.</div>}
      {zonesReported && monthTotal === 0 && sysPeak === 0 && <p className="gp-note">PGCB&apos;s report records no load shedding at {label.toLowerCase()} on any day this month.</p>}
      <div className="gpm-colhead gpmd-shedhead"><L k="P">Zone</L><span>Day 1 → {rows.length}</span><span>Total MW</span><Prov kind="D" /></div>
      <div className="gpmd-shed">
        {totals.map((z) => (
          <button type="button" key={z.k} onClick={() => zoneSheet(z.k, z.name, z.total)}>
            <span>{z.name}</span><Strip vals={rows.map((r) => r.zones?.[z.k])} max={max} /><b>{f(z.total)}</b><i />
          </button>
        ))}
        <button type="button" className="is-all" onClick={allSheet}>
          <span><L k="P">All zones</L></span><Strip vals={rows.map((r) => r.load_shed_mw ?? 0)} max={Math.max(max, sysPeak)} /><b>{f(monthTotal)}</b><Prov kind="D" />
        </button>
      </div>
      <div className="gpmd-legend">
        <span><i style={{ background: 'rgba(16, 185, 129, 0.18)' }} />No shedding</span>
        <span>Less {[0.15, 0.36, 0.57, 0.78, 1].map((a) => <i key={a} style={{ background: `rgba(190, 18, 60, ${a})` }} />)} More</span>
        <span>Worst single cell {f(max)} MW · worst zone <b>{worst?.name}</b></span>
      </div>
      <p className="gp-note"><strong>How to read this.</strong> Each cell is one zone on one day, and the shade is the megawatts of demand that had to be cut in that zone at that day&rsquo;s peak — so a green cell means everyone who wanted power got it; the figures are in each zone&rsquo;s sheet. <strong>Evening peak</strong> is the daily maximum, usually around 7&ndash;9 pm; <strong>day peak</strong> is the midday maximum. The <em>Total</em> column is the sum of that zone&rsquo;s daily cuts across the month, which is why it can exceed any single day by a wide margin — it measures how <em>persistently</em> a zone was cut, not how deep the worst cut was.</p>
      <p className="gp-note"><Prov kind="P" /> Every zone cell, and the <strong>All zones</strong> row, is PGCB&apos;s own published figure — that row is the system-wide load shed the report states for each day, not the zone cells added up. <Prov kind="D" /> The <strong>Total</strong> column and the figure in the bottom corner are ours, summed across the month. Because the row and the column are measured separately, they need not agree: a month where PGCB reports system-wide shedding but no zone breakdown will show a populated row above empty cells.</p>
    </>
  );
}

function useSearch<T>(rows: T[], q: string, match: (r: T, q: string) => boolean) {
  return useMemo(() => { const s = q.trim().toLowerCase(); return s ? rows.filter((r) => match(r, s)) : rows; }, [rows, q, match]);
}
function More({ shown, total, onMore, noun }: { shown: number; total: number; onMore: () => void; noun: string }) {
  return <p className="gp-note gpmd-count">{shown} of {total} {noun}{shown < total && <> · <button type="button" className="gp-more" onClick={onMore}>Show {Math.min(PAGE, total - shown)} more</button></>}</p>;
}
const kvSheet = (open: (c: ReactNode) => void, title: string, sub: string, kvs: ReactNode) => open(<><h3>{title}</h3><p className="gp-sheet__sub">{sub}</p><div className="gpm-kvs">{kvs}</div></>);

const byLoad = (r: { substation: string }, q: string) => r.substation.toLowerCase().includes(q);
const byTx = (r: { substation: string; transformer: string | null }, q: string) => [r.substation, r.transformer].some((v) => v?.toLowerCase().includes(q));

export function AssetPanel({ detail, monthLabel }: { detail: PgcbMonthlyDetail; monthLabel: string }) {
  const open = useSheet();
  const load = useMemo(() => (detail.substation_max_load ?? []).slice().sort((a, b) => (b.load_mw ?? -1) - (a.load_mw ?? -1)), [detail.substation_max_load]);
  const volt = useMemo(() => detail.substation_voltage ?? [], [detail.substation_voltage]);
  const tx = useMemo(() => (detail.transformer_loading ?? []).slice().sort((a, b) => b.loading_pct - a.loading_pct), [detail.transformer_loading]);
  const intr = useMemo(() => (detail.interruptions ?? []).slice().sort((a, b) => (b.unserved_mwh ?? 0) - (a.unserved_mwh ?? 0)), [detail.interruptions]);
  const tabs = ([['load', 'Peak load', load.length], ['voltage', 'Voltage', volt.length], ['transformer', 'Transformers', tx.length], ['interruption', 'Interruptions', intr.length]] as const).filter((t) => t[2] > 0);
  const [v, setV] = useState<string>(tabs[0]?.[0] ?? 'load');
  const [q, setQ] = useState('');
  const [n, setN] = useState(PAGE);
  const fl = useSearch(load, q, byLoad), fv = useSearch(volt, q, byLoad), ft = useSearch(tx, q, byTx), fi = useSearch(intr, q, byLoad);
  const pick = (id: string) => { setV(id); setN(PAGE); };
  let list: ReactNode = null, total = 0, noun = '', foot: ReactNode = null, head: ReactNode = null;
  if (v === 'load') {
    total = fl.length; noun = 'substations';
    head = <><span>Substation · recorded at</span><L k="P">Peak MW</L></>;
    list = fl.slice(0, n).map((r) => <Row key={r.substation} name={r.substation} sub={r.when ?? '—'} value={f(r.load_mw, 1)} />);
  } else if (v === 'voltage') {
    total = fv.length; noun = 'readings';
    head = <><span>Substation · class · rated</span><L k="D">Min vs rated</L></>;
    list = fv.slice(0, n).map((r, i) => {
      const dev = r.rated_kv && r.min_kv ? ((r.min_kv - r.rated_kv) / r.rated_kv) * 100 : null;
      const bad = dev !== null && dev <= -10;
      return <Row key={`${r.substation}-${i}`} name={r.substation} sub={`${r.class ?? '—'} · rated ${f(r.rated_kv)} kV · max ${f(r.max_kv)} · min ${f(r.min_kv)}`} value={dev === null ? '—' : <span className={bad ? 'gpmd-bad' : 'gpmd-mut'}>{bad && '⚠ '}{dev.toFixed(1)}%</span>} chevron
        onClick={() => kvSheet(open, r.substation, `Voltage, ${monthLabel}`, <>
          <KV label="Class" value={r.class ?? '—'} /><KV label="Rated" prov="P" value={`${f(r.rated_kv)} kV`} />
          <KV label="Max" prov="P" value={`${f(r.max_kv)} kV`} sub={r.max_when ?? undefined} /><KV label="Min" prov="P" value={`${f(r.min_kv)} kV`} sub={r.min_when ?? undefined} />
          <KV label="Min vs rated" prov="D" value={dev === null ? '—' : `${dev.toFixed(1)}%`} tone={bad ? 'bad' : undefined} /></>)} />;
    });
    foot = <p className="gp-note">⚠ marks a minimum more than 10% below rated voltage.</p>;
  } else if (v === 'transformer') {
    total = ft.length; noun = 'transformers';
    head = <><span>Substation · transformer</span><L k="D">Loading</L></>;
    list = ft.slice(0, n).map((r, i) => (
      <Row key={`${r.substation}-${r.transformer}-${i}`} name={r.substation} sub={`${r.transformer ?? '—'} · ${f(r.capacity_mva)} MVA · ${f(r.mw)} MW`} value={<span className={r.loading_pct >= 80 ? 'gpmd-bad' : undefined}>{r.loading_pct >= 80 && '⚠ '}{r.loading_pct.toFixed(1)}%</span>} chevron
        onClick={() => kvSheet(open, r.substation, `${r.transformer ?? 'Transformer'}, ${monthLabel}`, <>
          <KV label="Transformer" value={r.transformer ?? '—'} /><KV label="Voltage level" value={r.voltage_level ?? '—'} />
          <KV label="Capacity" prov="P" value={`${f(r.capacity_mva)} MVA`} /><KV label="Peak" prov="P" value={`${f(r.mw)} MW`} sub={[r.date, r.hour].filter(Boolean).join(' ') || undefined} />
          <KV label="MVAr" value={f(r.mvar)} /><KV label="Loading" prov="D" value={`${r.loading_pct.toFixed(1)}%`} tone={r.loading_pct >= 80 ? 'bad' : undefined} /></>)} />
    ));
    foot = <p className="gp-note">⚠ marks transformers loaded at 80% or above.</p>;
  } else {
    total = fi.length; noun = 'interruptions';
    head = <><span>Substation · <L k="P">count</L> · <L k="P">duration</L></span><L k="P">Unserved MWh</L></>;
    list = fi.slice(0, n).map((r, i) => <Row key={`${r.substation}-${i}`} name={r.substation} sub={`${f(r.interruptions)} interruptions · ${r.duration ?? '—'}`} value={f(r.unserved_mwh, 1)} />);
  }
  return (
    <>
      <p className="gpmd-lede">Per-asset records published for {monthLabel}</p>
      <div className="gpm-years" aria-label="Asset table">
        {tabs.map(([id, l, c]) => <button key={id} type="button" aria-pressed={v === id} className={v === id ? 'is-on' : ''} onClick={() => pick(id)}>{l} ({c})</button>)}
      </div>
      <input type="search" className="gp-search gpmd-search" value={q} onChange={(e) => { setQ(e.target.value); setN(PAGE); }} placeholder="Search substation…" aria-label="Search substation" />
      <div className="gpm-colhead gpmd-colhead2">{head}</div>
      <div className="gp-rows">{list}</div>
      {foot}
      <More shown={Math.min(n, total)} total={total} noun={noun} onMore={() => setN((x) => x + PAGE)} />
      <div className="gpm-pills">
        <Terms items={[
          ['Substation', 'where transmission voltage is stepped down for distribution. Effectively the grid’s delivery point for a town or district.'],
          ['Peak load', 'the highest power that substation delivered at any moment in the month, with the timestamp it happened.'],
          ['Rated voltage', 'the level the substation is designed to run at. Grid voltage drifts with load, and a sustained drop damages equipment.'],
          ['Min vs rated', 'how far the lowest recorded voltage fell below rated. Beyond about −10% (flagged ⚠) is a serious under-voltage event.'],
          ['Transformer loading', 'peak throughput as a percentage of the transformer’s MVA rating. Above 80% (⚠) leaves little headroom for a fault elsewhere.'],
          ['Interruptions', 'how many times supply from that substation was cut, for how long in total, and the resulting unserved energy.'],
        ]} />
      </div>
    </>
  );
}

export function FgmoPanel({ fgmo }: { fgmo: PgcbFgmoPlant[] }) {
  const active = fgmo.filter((p) => p.days_active > 0);
  const cap = active.reduce((s, p) => s + (p.capacity_mw ?? 0), 0);
  const sorted = fgmo.slice().sort((a, b) => b.days_active - a.days_active);
  return (
    <>
      <p className="gpmd-lede">Plants able to respond automatically to frequency deviation — the grid&apos;s first line of defence</p>
      <div className="gp-stats">
        <Cell label="Plants listed" prov="D" value={f(fgmo.length)} />
        <Cell label="Active at least one day" prov="D" value={f(active.length)} />
        <Cell label="Capacity on FGMO" prov="D" value={f(cap)} unit="MW" />
        <Cell label="Full-month participation" prov="D" value={f(fgmo.filter((p) => p.days_active >= 28).length)} unit="plants" />
      </div>
      <div className="gpm-colhead gpmd-colhead2" style={{ marginTop: 12 }}><span>Plant · owner · fuel · <L k="P">MW</L></span><L k="P">Days on FGMO</L></div>
      <div className="gp-rows">
        {sorted.map((p, i) => <Row key={`${p.plant}-${i}`} name={p.plant} sub={`${p.owner ?? '—'} · ${p.fuel ?? '—'} · ${f(p.capacity_mw)} MW`} value={p.days_active} />)}
      </div>
      <p className="gp-note"><strong>Why this matters.</strong> Grid frequency must hold near 50 Hz. When a large plant trips, frequency falls within seconds — far too fast for an operator to react. Plants running in <strong>free governor mode</strong> sense the drop and raise output automatically, holding the system up until slower reserves arrive. A plant is listed here for every day it ran in that mode, so a low day count means the plant was available but not contributing that automatic response. The wider the participating capacity, the better the grid absorbs a sudden loss.</p>
    </>
  );
}

const byEvent = (e: PgcbOutageEvent, q: string) => [e.substation, e.equipment, e.cause, e.circle].some((v) => v?.toLowerCase().includes(q));

export function OutagePanel({ events, loading, expected, opened, onLoad, monthLabel }: { events: PgcbOutageEvent[]; loading: boolean; expected: number; opened: boolean; onLoad: () => void; monthLabel: string }) {
  const open = useSheet();
  const [q, setQ] = useState('');
  const [n, setN] = useState(PAGE);
  const fe = useSearch(events, q, byEvent);
  if (!opened) {
    return (
      <>
        <p className="gpmd-lede">Every recorded substation and transmission outage in {monthLabel}</p>
        <p className="gp-note">{f(expected)} individual outage events recorded this month — substation and transmission line, emergency and scheduled. Loaded separately because the log is larger than the rest of the month combined.</p>
        <button type="button" className="gp-more" onClick={onLoad}>Load {f(expected)} outage events</button>
      </>
    );
  }
  if (loading) return <div className="gp-skel" style={{ height: 260 }} />;
  return (
    <>
      <p className="gpmd-lede">Every recorded substation and transmission outage in {monthLabel}. Tap an event for its record.</p>
      <input type="search" className="gp-search gpmd-search" value={q} onChange={(e) => { setQ(e.target.value); setN(PAGE); }} placeholder="Search substation, cause…" aria-label="Search outages" />
      <div className="gpm-colhead gpmd-colhead2"><span>Substation · start · <L k="P">duration</L></span><L k="P">Unserved MWh</L></div>
      <div className="gp-rows">
        {fe.slice(0, n).map((e, i) => (
          <Row key={`${e.substation}-${e.start}-${i}`} name={e.substation} sub={<><span className="gpmd-nb">{e.start}</span> · {e.duration ?? '—'}{e.cause ? ` · ${e.cause}` : ''}</>} value={f(e.unserved_energy_mwh, 1)} chevron
            onClick={() => kvSheet(open, e.substation, `${e.kind.replace(/_/g, " ")} outage, ${monthLabel}`, <>
              <KV label="Circle" value={e.circle ?? '—'} /><KV label="Equipment" value={e.equipment ?? '—'} />
              <KV label="Start" value={e.start} /><KV label="Finish" value={e.finish ?? '—'} />
              <KV label="Duration" prov="P" value={e.duration ?? '—'} /><KV label="Type" value={e.type ?? '—'} />
              <KV label="Cause" value={e.cause ?? '—'} /><KV label="Unserved load" prov="P" value={e.unserved_load_mw != null ? `${f(e.unserved_load_mw, 1)} MW` : '—'} />
              <KV label="Unserved energy" prov="P" value={e.unserved_energy_mwh != null ? `${f(e.unserved_energy_mwh, 1)} MWh` : '—'} /></>)} />
        ))}
      </div>
      <More shown={Math.min(n, fe.length)} total={fe.length} noun="events" onMore={() => setN((x) => x + PAGE)} />
      <div className="gpm-pills">
        <Terms items={[
          ['Equipment', 'the specific asset that went out — a transformer, breaker or line bay — not the whole substation.'],
          ['Duration', 'how long it stayed out, as hours:minutes:seconds.'],
          ['Cause', 'as recorded by the operator on the day. Wording is theirs and is not standardised between circles.'],
          ['Unserved (MWh)', 'energy not delivered because of that one event. Several rows can share a cause when one fault takes out multiple units at once.'],
        ]} />
      </div>
    </>
  );
}
