'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { PlantActual } from '@/lib/data/grid/types';
import { countBySector, SECTOR_LABEL } from '@/lib/data/grid/producer-sector';
import { usePhone } from './context';
import { fmt, Meter } from './charts';
import { Empty, fuelOf, fuelPalette, isNum, Prov, Row, Section, Stat, useSheet } from './shared';
import { DeratingView, FuelProducerView, HourlyView, HowTo, mw, pct1, short, StationFoot, StationSheet, utilOf, type Ctx } from './plants-parts';
import '@/app/grid-phone-plants.css';

/**
 * PGCB's free-text remark, sorted into reasons a reader can scan. The grouping
 * is ours (marked D); the remark itself is always shown verbatim by the plant.
 */
function reasonOf(remark: string | null | undefined): string {
  const r = (remark ?? '').trim();
  if (!r || r === '-') return 'No reason given';
  if (/gas/i.test(r)) return 'Gas shortage';
  if (/coal/i.test(r)) return 'Coal shortage';
  if (/liquid|fuel|oil/i.test(r)) return 'Fuel shortage';
  if (/maint|overhaul|s\/d|shut/i.test(r)) return 'Maintenance';
  if (/contract|expired/i.test(r)) return 'Contract expired';
  if (/fgmo|reserve|low demand|standby/i.test(r)) return 'Held in reserve';
  if (/machine|problem|trip|fault|leak|damage|broken|compressor|boiler|turbine/i.test(r)) return 'Breakdown';
  return 'Other';
}
const REASON_COLOR: Record<string, string> = {
  'Gas shortage': '#0ea5e9', 'Coal shortage': '#64748b', 'Fuel shortage': '#f97316', Breakdown: 'var(--gp-bad)', Maintenance: '#94a3b8',
  'Held in reserve': '#22c55e', 'Contract expired': '#a855f7', 'No reason given': 'var(--gp-faint)', Other: 'var(--gp-faint)',
};
const idleOf = (p: PlantActual) => (isNum(p.presentCapacityMw) && isNum(p.eveningPeakMw) ? p.presentCapacityMw - p.eveningPeakMw : null);
const remarkOf = (r: string | null | undefined) => (r && r.trim() && r.trim() !== '-' ? r.trim() : null);

type View = 'overview' | 'stations' | 'fleet' | 'hourly' | 'derating';

export function PlantsScreen() {
  const { day, plants } = usePhone();
  const [view, setView] = useState<View>('overview');
  const [q, setQ] = useState('');
  const pal = fuelPalette(day);
  const all = plants?.plants ?? [];
  if (!plants || (!all.length && !plants.genlog && !plants.plantForecast)) {
    return (
      <div className="gp-screen">
        <Empty title={`No per-station detail published for ${day.systemStats.date}`} why="PGCB began including the station-level generation log with its 2025 reports. Earlier days publish system and zone totals only, which are shown on the other tabs." />
      </div>
    );
  }
  const ctx: Ctx = { day, detail: plants, pal };
  const tabs: [View, string][] = [['overview', 'Overview'], ['stations', 'Stations'], ['fleet', 'Fleet'], ['hourly', 'Hourly'], ['derating', 'Derating']];
  return (
    <div className="gp-screen">
      <div className="gp-seg gp-seg--sticky" role="tablist" aria-label="Plants view">
        {tabs.map(([id, l]) => (
          <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => setView(id)} style={{ padding: '0 2px', fontSize: 12 }}>{l}</button>
        ))}
      </div>
      {view === 'overview' && <Overview ctx={ctx} all={all} />}
      {view === 'stations' && (all.length ? <StationsView ctx={ctx} all={all} q={q} setQ={setQ} /> : <Empty title="Power station output" why="PGCB’s report for this day carries no station table." />)}
      {view === 'fleet' && (all.length ? <FuelProducerView ctx={ctx} plants={all} /> : <Empty title="Fuel and producer" why="PGCB’s report for this day carries no station table." />)}
      {view === 'hourly' && (plants.genlog ? <HourlyView ctx={ctx} q={q} setQ={setQ} /> : <Empty title="Hourly station log" why="PGCB’s generation log, with an hourly line per station, is not published for this day’s report layout." />)}
      {view === 'derating' && (plants.plantForecast ? <DeratingView ctx={ctx} plants={all} /> : <Empty title="Expected station derating" why="PGCB’s per-station availability projection is carried only by the 2025+ report layout." />)}
    </div>
  );
}

/* ── overview ─────────────────────────────────────────────────────────── */

function Overview({ ctx, all }: { ctx: Ctx; all: PlantActual[] }) {
  const { day, pal } = ctx;
  const open = useSheet();
  const list = useMemo(() => all.filter((p) => isNum(p.installedMw) && p.installedMw > 0), [all]);
  const k = useMemo(() => {
    const rated = all.filter((p) => isNum(p.installedMw));
    const read = all.filter((p) => isNum(p.eveningPeakMw));
    return { rated, read, running: read.filter((p) => (p.eveningPeakMw ?? 0) > 0), still: read.filter((p) => p.eveningPeakMw === 0), installed: rated.reduce((a, p) => a + (p.installedMw ?? 0), 0) };
  }, [all]);
  const sectors = countBySector(all.map((p) => p.producer)).filter((s) => s.count > 0 || s.sector === 'government' || s.sector === 'private');
  const ss = day.systemStats;
  const brief = (title: string, rows: { k: string; v: string; m: 'P' | 'D' }[], audit: string) =>
    open(
      <>
        <h3>{title}</h3>
        <div className="gp-rows" style={{ marginTop: 12 }}>
          {rows.map((r) => <Row key={r.k} name={<>{r.k}<Prov kind={r.m} /></>} value={r.v} />)}
        </div>
        <p className="gp-note">{audit}</p>
        <p className="gp-note">PGCB Daily Report · Station-wise generation sheet{day.sourceFiles?.pgcb ? ` · ${day.sourceFiles.pgcb}` : ''} · Date {ss.date} · pgcb.gov.bd</p>
      </>,
    );
  const still5 = [...k.still].sort((a, b) => (b.installedMw ?? -1) - (a.installedMw ?? -1)).slice(0, 5);
  return (
    <>
      <Section title="Stations at a glance" desc="Tap a figure for its briefing" source="PGCB daily report · station-wise generation sheet">
        <div className="gp-stats gp-stats--first" style={{ margin: 0 }}>
          <Stat label="Stations listed" value={all.length} prov="P" onClick={() => brief('Fleet briefing', [
            { k: 'Rows on the sheet', v: String(all.length), m: 'P' }, { k: 'With a stated rating', v: String(k.rated.length), m: 'P' }, { k: 'With a peak reading', v: String(k.read.length), m: 'P' },
            ...sectors.map((s) => ({ k: SECTOR_LABEL[s.sector], v: String(s.count), m: 'D' as const })),
          ], 'A count of sheet rows, not the national fleet. Ownership is read from the producer code (PDB, APSCL, EGCB and similar are government; IPP, QRPP, RPP, SIPP private); BCPCL counts as a joint venture. The split is ours.')} />
          <Stat label="Generating at peak" value={k.running.length} unit={k.read.length ? `of ${k.read.length} read` : undefined} prov="D" note="Counted from the evening-peak column; empty cells are counted in neither total." onClick={() => brief('Dispatch briefing', [
            { k: 'Recorded above zero', v: String(k.running.length), m: 'D' }, { k: 'Recorded at zero', v: String(k.still.length), m: 'D' }, { k: 'Not read this day', v: String(all.length - k.read.length), m: 'P' },
          ], 'Counted from the evening-peak column; empty cells are counted in neither total.')} />
          <Stat label="Installed, listed" value={k.rated.length ? Math.round(k.installed) : null} unit="MW" detail={k.rated.length ? `across ${k.rated.length} stations` : undefined} prov="P" onClick={() => brief('Capacity briefing', [
            { k: 'Sum of stated ratings', v: `${mw(k.installed)} MW`, m: 'P' }, { k: 'Stations rated', v: `${k.rated.length} of ${all.length}`, m: 'P' }, { k: 'Running at evening peak', v: isNum(ss.eveningPeakGen) ? `${fmt(Math.round(ss.eveningPeakGen))} MW` : '—', m: 'P' },
          ], 'The ratings are the sheet’s own; the total is a floor if any station is unrated. The evening-peak column sums to the report’s peak generation.')} />
          <Stat label="Stood still" value={k.still.length} detail={k.read.length ? `${((k.still.length / k.read.length) * 100).toFixed(0)}% of stations read` : undefined} prov="D" note="Read at zero on the evening peak." onClick={() => brief('Idle stations', still5.length ? still5.map((p) => ({ k: short(p.name), v: isNum(p.installedMw) ? `${mw(p.installedMw)} MW idle` : 'no rating', m: 'P' as const })) : [{ k: 'None read at zero', v: '—', m: 'D' }], 'Read at zero on the evening peak, largest first (top five); the remarks are on each station. Idle is not the same as available.')} />
        </div>
      </Section>
      {list.length > 0 && <Funnel ctx={ctx} list={list} pal={pal} />}
    </>
  );
}

function Funnel({ ctx, list, pal }: { ctx: Ctx; list: PlantActual[]; pal: Record<string, string> }) {
  const open = useSheet();
  const sums = useMemo(() => {
    const idle: Record<string, number> = {};
    const byFuel: Record<string, { cap: number; peak: number; n: number }> = {};
    for (const p of list) {
      const gap = idleOf(p);
      if (gap != null && gap > 0) idle[reasonOf(p.remarks)] = (idle[reasonOf(p.remarks)] ?? 0) + gap;
      const f = fuelOf(p.fuel);
      byFuel[f] ??= { cap: 0, peak: 0, n: 0 };
      byFuel[f].cap += p.presentCapacityMw ?? 0;
      byFuel[f].peak += p.eveningPeakMw ?? 0;
      byFuel[f].n += 1;
    }
    const withPeak = list.filter((p) => isNum(p.eveningPeakMw));
    return {
      installed: list.reduce((a, p) => a + (p.installedMw ?? 0), 0),
      present: list.reduce((a, p) => a + (p.presentCapacityMw ?? 0), 0),
      peak: withPeak.reduce((a, p) => a + (p.eveningPeakMw ?? 0), 0),
      blank: list.length - withPeak.length,
      ran: withPeak.filter((p) => (p.eveningPeakMw ?? 0) > 0).length,
      idle: Object.entries(idle).sort((a, b) => b[1] - a[1]),
      byFuel: Object.entries(byFuel).sort((a, b) => b[1].cap - a[1].cap),
    };
  }, [list]);
  const top = [...list].filter((p) => isNum(p.eveningPeakMw)).sort((a, b) => (b.eveningPeakMw ?? 0) - (a.eveningPeakMw ?? 0)).slice(0, 10);
  const off = list.filter((p) => p.eveningPeakMw === 0 && isNum(p.presentCapacityMw) && p.presentCapacityMw >= 100).sort((a, b) => (b.presentCapacityMw ?? 0) - (a.presentCapacityMw ?? 0));
  const idleMax = sums.idle[0]?.[1] ?? 1;
  return (
    <>
      <Section title="Capacity against what ran" meta={`${list.length} rated stations`} source={<>PGCB daily report · station table<Prov kind="D" note="Sums of every rated station’s installed, present and evening-peak figures. Stations PGCB left blank are excluded, never counted as zero." /></>}>
        <div className="gp-funnel">
          {([
            ['Installed', sums.installed, 'var(--gp-line)'],
            ['Available today', sums.present, 'hsl(var(--primary) / 0.35)'],
            ['Running at the evening peak', sums.peak, 'var(--gp-primary)'],
          ] as const).map(([l, v, c]) => (
            <div key={l} className="gp-funnel__row">
              <span>{l}</span>
              <b>{fmt(v)} <span className="gp-u">MW</span></b>
              <div className="gp-funnel__bar" style={{ width: `${sums.installed > 0 ? (v / sums.installed) * 100 : 0}%`, background: c }} />
            </div>
          ))}
        </div>
        <div className="gp-stats gp-stats--3" style={{ marginTop: 16 }}>
          <Stat label="Idle but available" value={sums.present - sums.peak} unit="MW" prov="D" note="Present capacity minus evening-peak output, over rated stations." />
          <Stat label="Stations running" value={sums.ran} unit={`of ${list.length}`} prov="D" />
          <Stat label="Left blank" value={sums.blank} unit="stations" prov="D" />
        </div>
      </Section>

      {sums.idle.length > 0 && (
        <Section title="Why capacity sat idle" desc="Available megawatts not running at the peak, by PGCB’s stated reason" source={<>Grouped from PGCB’s remarks column<Prov kind="D" note="Available capacity minus evening-peak output, per station, summed by the reason PGCB wrote beside it. Tap a reason for the stations and the exact remark." /></>}>
          <div className="gp-rows">
            {sums.idle.map(([k, v]) => (
              <Row key={k} sw={REASON_COLOR[k]} name={k} value={<>{fmt(v)} <span className="gp-u">MW</span></>} chevron meter={<Meter value={v} max={idleMax} color={REASON_COLOR[k]} />}
                onClick={() => open(<PlantList title={k} plants={list.filter((p) => reasonOf(p.remarks) === k && (idleOf(p) ?? 0) > 0)} ctx={ctx} idle />)} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Capacity by fuel" desc="Available against running at the peak" source="PGCB daily report · station table · sums">
        <div className="gp-rows">
          {sums.byFuel.map(([f, v]) => (
            <Row key={f} sw={pal[f] ?? '#94a3b8'} name={f} sub={`${v.n} stations`} value={<>{fmt(v.peak)} <span className="gp-u">MW</span></>} small={`of ${fmt(v.cap)} available`} meter={<Meter value={v.peak} max={v.cap || 1} color={pal[f] ?? '#94a3b8'} />} />
          ))}
        </div>
      </Section>

      <Section title="Biggest stations tonight" desc="Output at the evening peak against what was available">
        <div className="gp-rows">{top.map((p) => <PlantRow key={p.name} p={p} ctx={ctx} />)}</div>
        <button className="gp-more" onClick={() => open(<PlantList title="All stations" plants={list} ctx={ctx} search />)}>All {list.length} rated stations · search</button>
      </Section>

      {off.length > 0 && (
        <Section title="Large stations switched off" desc="100 MW or more available, nothing at the peak">
          <div className="gp-rows">{off.slice(0, 8).map((p) => <PlantRow key={p.name} p={p} ctx={ctx} idle />)}</div>
          {off.length > 8 && <button className="gp-more" onClick={() => open(<PlantList title="Large stations switched off" plants={off} ctx={ctx} idle />)}>All {off.length}</button>}
        </Section>
      )}
    </>
  );
}

/* ── the station table ────────────────────────────────────────────────── */

type SortKey = 'evening' | 'day' | 'energy' | 'installed' | 'present' | 'fuel' | 'producer' | 'name';
const SORTS: { k: SortKey; l: string; text?: boolean }[] = [
  { k: 'evening', l: 'Evening peak' }, { k: 'day', l: 'Day peak' }, { k: 'energy', l: 'Day’s energy' }, { k: 'installed', l: 'Installed MW' },
  { k: 'present', l: 'Present MW' }, { k: 'fuel', l: 'Fuel', text: true }, { k: 'producer', l: 'Producer', text: true }, { k: 'name', l: 'Station name', text: true },
];
const sortVal = (p: PlantActual, k: SortKey): number | string | null => {
  switch (k) {
    case 'evening': return p.eveningPeakMw;
    case 'day': return p.dayPeakMw;
    case 'energy': return isNum(p.energyKwh) ? p.energyKwh : null;
    case 'installed': return p.installedMw;
    case 'present': return p.presentCapacityMw;
    case 'fuel': return p.fuel ? p.fuel.toLowerCase() : null;
    case 'producer': return p.producer ? p.producer.toLowerCase() : null;
    default: return p.name.toLowerCase();
  }
};

function StationsView({ ctx, all, q, setQ }: { ctx: Ctx; all: PlantActual[]; q: string; setQ: (s: string) => void }) {
  const [key, setKey] = useState<SortKey>('evening');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [n, setN] = useState(25);
  const open = useSheet();
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const f = all.filter((p) => !needle || `${p.name} ${p.fuel} ${p.producer}`.toLowerCase().includes(needle));
    const sgn = dir === 'asc' ? 1 : -1;
    // Missing values sort last in both directions; ties break on name.
    return [...f].sort((a, b) => {
      const x = sortVal(a, key);
      const y = sortVal(b, key);
      if (x == null && y == null) return a.name.localeCompare(b.name);
      if (x == null) return 1;
      if (y == null) return -1;
      const c = typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number);
      return c !== 0 ? c * sgn : a.name.localeCompare(b.name);
    });
  }, [all, q, key, dir]);
  const pick = (k: SortKey) => {
    if (k === key) return setDir(dir === 'asc' ? 'desc' : 'asc');
    setKey(k);
    setDir(SORTS.find((s) => s.k === k)?.text ? 'asc' : 'desc');
    setN(25);
  };
  const tot = useMemo(() => {
    const hasDay = all.some((p) => p.dayPeakMw != null);
    const hasEn = all.some((p) => p.energyKwh != null);
    return { day: hasDay ? all.reduce((a, p) => a + (p.dayPeakMw || 0), 0) : null, evening: all.reduce((a, p) => a + (p.eveningPeakMw || 0), 0), energy: hasEn ? all.reduce((a, p) => a + (p.energyKwh || 0), 0) / 1000 : null };
  }, [all]);
  const ss = ctx.day.systemStats;
  const active = SORTS.find((s) => s.k === key)!;
  return (
    <Section title="Power station output" meta={`${rows.length} stations`} desc={`Capacity and actual output at both peaks, as published for ${ss.date}`} source={<StationFoot ctx={ctx} />}>
      <input className="gp-search" type="search" placeholder="Filter stations" aria-label="Filter stations by name, fuel or producer" value={q} onChange={(e) => { setQ(e.target.value); setN(25); }} />
      <div className="gp-filter" role="group" aria-label="Sort by">
        <button onClick={() => setDir(dir === 'asc' ? 'desc' : 'asc')} aria-label={`Direction ${dir === 'asc' ? 'ascending' : 'descending'}`}>{dir === 'asc' ? '↑ Low to high' : '↓ High to low'}</button>
        {SORTS.map((s) => <button key={s.k} className={s.k === key ? 'is-on' : ''} aria-pressed={s.k === key} onClick={() => pick(s.k)}>{s.l}</button>)}
      </div>
      {!q && (
        <div className="gp-stats gp-stats--3" style={{ marginTop: 16 }}>
          <Stat label="Day peak" value={tot.day} unit="MW" prov="D" note="Sum of the stations’ day-peak figures; a dash where the report publishes none." />
          <Stat label="Evening peak" value={tot.evening} unit="MW" prov="D" note="Sum of the stations’ evening-peak figures." />
          <Stat label="Day’s energy" value={tot.energy} unit="MWh" prov="D" note="Sum of the stations’ day energy, in MWh." />
        </div>
      )}
      <div className="gp-hint" style={{ textAlign: 'left' }}>Totals are all stations. Sorted by {active.l}, {dir === 'asc' ? 'low to high' : 'high to low'}; blanks last.</div>
      <div className="gp-rows" style={{ marginTop: 4 }}>
        {rows.slice(0, n).map((p) => <StationRow key={p.name} p={p} ctx={ctx} />)}
        {!rows.length && <div className="gp-empty" style={{ minHeight: 72 }}>No station matches “{q}”.</div>}
      </div>
      {rows.length > n && <button className="gp-more" onClick={() => setN(n + 25)}>Showing {n} of {rows.length} · show 25 more</button>}
      {rows.length > 25 && n >= rows.length && <button className="gp-more" onClick={() => setN(25)}>Show first 25</button>}
      <HowTo title="How the station totals reconcile">
        <p>
          Station totals reconcile with the system figures for this day: {tot.day != null ? <>{fmt(tot.day)} MW at day peak{isNum(ss.dayPeakGen) ? <> against a published {fmt(ss.dayPeakGen)} MW</> : null}, and </> : null}
          {fmt(tot.evening)} MW at evening peak against {isNum(ss.eveningPeakGen) ? `${fmt(ss.eveningPeakGen)} MW` : 'an unpublished figure'}
          {tot.energy != null ? <>, and {fmt(tot.energy / 1000, 2)} MKWh of energy{isNum(ss.totalEnergyGen) ? <> against a published {fmt(ss.totalEnergyGen, 2)} MKWh</> : null}</> : null}.
        </p>
        {tot.day == null && <p>This day’s figures come from the report’s per-station table, which publishes the evening peak and the day’s energy but no day peak.</p>}
        <p>The note always uses the full fleet, whatever the filter says. A dash is a cell PGCB left blank, never zero. Rows are dimmed when nothing ran at the peak, in the day or in energy.</p>
      </HowTo>
    </Section>
  );
}

/** Keeps a figure with its label when a sub line wraps. */
const N = ({ children }: { children: ReactNode }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;

function StationRow({ p, ctx }: { p: PlantActual; ctx: Ctx }) {
  const open = useSheet();
  const c = ctx.pal[fuelOf(p.fuel)] ?? '#94a3b8';
  const remark = remarkOf(p.remarks);
  const u = utilOf(p);
  const dim = p.eveningPeakMw === 0 && !p.dayPeakMw && !p.energyKwh;
  return (
    <div className={dim ? 'gp-dim' : undefined}>
      <Row top wrap sw={c} name={short(p.name)}
        sub={<>{p.fuel || '—'} · {p.producer || '—'}<br /><N>Inst {mw(p.installedMw)}</N> · <N>present {mw(p.presentCapacityMw)}</N> · <N>day {mw(p.dayPeakMw)} MW</N><br />{mw(isNum(p.energyKwh) ? p.energyKwh / 1000 : null)} MWh{u != null ? <> · {pct1(u)} of installed</> : null}{remark ? <><br /><span className="gp-tag warn">{remark}</span></> : null}</>}
        value={mw(p.eveningPeakMw)} small="MW evening peak" chevron onClick={() => open(<StationSheet p={p} ctx={ctx} />)} />
    </div>
  );
}

/* ── overview rows and lists ──────────────────────────────────────────── */

function PlantRow({ p, ctx, idle }: { p: PlantActual; ctx: Ctx; idle?: boolean }) {
  const open = useSheet();
  const c = ctx.pal[fuelOf(p.fuel)] ?? '#94a3b8';
  const cap = p.presentCapacityMw ?? p.installedMw ?? 0;
  const remark = remarkOf(p.remarks);
  return (
    <Row top wrap sw={c} name={short(p.name)}
      sub={<>{p.fuel} · {p.producer}{remark ? <><br /><span className={`gp-tag ${/gas|fuel|coal/i.test(remark) ? 'warn' : 'bad'}`}>{remark}</span></> : null}</>}
      value={idle ? fmt(idleOf(p)) : fmt(p.eveningPeakMw)} small={idle ? 'MW idle' : `of ${fmt(cap)} MW`}
      meter={!idle && isNum(p.eveningPeakMw) && cap > 0 ? <Meter value={p.eveningPeakMw} max={cap} color={c} /> : undefined}
      onClick={() => open(<StationSheet p={p} ctx={ctx} />)} />
  );
}

function PlantList({ title, plants, ctx, idle, search }: { title: string; plants: PlantActual[]; ctx: Ctx; idle?: boolean; search?: boolean }) {
  const [q, setQ] = useState('');
  const [fuel, setFuel] = useState('All');
  const fuels = ['All', ...Array.from(new Set(plants.map((p) => fuelOf(p.fuel))))];
  const shown = plants
    .filter((p) => (fuel === 'All' || fuelOf(p.fuel) === fuel) && (!q || `${p.name} ${p.producer}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (idle ? (idleOf(b) ?? 0) - (idleOf(a) ?? 0) : (b.eveningPeakMw ?? -1) - (a.eveningPeakMw ?? -1)));
  return (
    <>
      <h3>{title}</h3>
      <p className="gp-sheet__sub">{shown.length} stations</p>
      {search && (
        <>
          <input className="gp-search" type="search" placeholder="Search stations or owners" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="gp-filter">{fuels.map((f) => <button key={f} className={f === fuel ? 'is-on' : ''} onClick={() => setFuel(f)}>{f}</button>)}</div>
        </>
      )}
      <div className="gp-rows" style={{ marginTop: 8 }}>{shown.map((p) => <PlantRow key={p.name} p={p} ctx={ctx} idle={idle} />)}</div>
    </>
  );
}
