'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { DailyPlantDetail, GenLogStation, GridDailyData, PlantActual } from '@/lib/data/grid/types';
import { countBySector, SECTOR_LABEL, SECTOR_ORDER, producerSector } from '@/lib/data/grid/producer-sector';
import { fmt, Legend, LineChart, Meter } from './charts';
import { fuelOf, isNum, Prov, Row, Section, Stat, useSheet } from './shared';
import '@/app/grid-phone-plants.css';

/* ── shared helpers ───────────────────────────────────────────────────── */

export const short = (s: string) => s.replace(/\s+/g, ' ').trim();
const key = (s: string) => short(s).toLowerCase();
/** Max one decimal, dash for null — the desktop's formatMw. */
export const mw = (v: number | null | undefined) => (isNum(v) ? v.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '—');
export const pct1 = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`);
const isSolar = (f: string | null | undefined) => /solar/i.test(f ?? '');
const U = ({ children }: { children: ReactNode }) => <span className="gp-u">{children}</span>;
const remarkOf = (r: string | null | undefined) => (r && r.trim() && r.trim() !== '-' ? r.trim() : null);

export type Ctx = { day: GridDailyData; detail: DailyPlantDetail; pal: Record<string, string> };

/** Station evening peak against installed — withheld for Solar and for no rating. */
export function utilOf(p: { fuel?: string | null; installedMw: number | null; eveningPeakMw: number | null }): number | null {
  if (isSolar(p.fuel)) return null;
  return isNum(p.installedMw) && p.installedMw > 0 && isNum(p.eveningPeakMw) ? (p.eveningPeakMw / p.installedMw) * 100 : null;
}

export function StationFoot({ ctx, sheet = 'P2 sheet, per-station and per-unit table' }: { ctx: Ctx; sheet?: string }) {
  return (
    <>
      Source: PGCB Daily Report — {sheet}
      {ctx.day.sourceFiles?.pgcb ? <> · {ctx.day.sourceFiles.pgcb}</> : null} · Reported day {ctx.detail.date}
    </>
  );
}

/** Opens prose in a sheet — the phone's "How to read this". */
export function HowTo({ title, children }: { title: string; children: ReactNode }) {
  const open = useSheet();
  return (
    <button className="gp-more" style={{ height: 44 }} onClick={() => open(<><h3>{title}</h3><div style={{ marginTop: 12 }}>{children}</div></>)}>
      How to read this
    </button>
  );
}

type Agg = { key: string; n: number; installed: number | null; evening: number; other?: number };
export function aggregateBy(plants: PlantActual[], by: (p: PlantActual) => string): Agg[] {
  const m = new Map<string, Agg>();
  for (const p of plants) {
    const k = short(by(p) ?? '') || 'Not stated';
    const g = m.get(k) ?? { key: k, n: 0, installed: null, evening: 0 };
    g.n += 1;
    if (isNum(p.installedMw)) g.installed = (g.installed ?? 0) + p.installedMw;
    g.evening += p.eveningPeakMw || 0;
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => (b.installed ?? -1) - (a.installed ?? -1));
}

/* ── station detail sheet ─────────────────────────────────────────────── */

export function StationSheet({ p, ctx }: { p: PlantActual; ctx: Ctx }) {
  const c = ctx.pal[fuelOf(p.fuel)] ?? '#94a3b8';
  const gl = ctx.detail.genlog;
  const log = gl?.stations.find((s) => s.name === p.name) ?? gl?.stations.find((s) => key(s.name) === key(p.name));
  const fc = ctx.detail.plantForecast?.stations.find((s) => s.name === p.name) ?? ctx.detail.plantForecast?.stations.find((s) => key(s.name) === key(p.name));
  const u = utilOf(p);
  const remark = remarkOf(p.remarks);
  const [at, setAt] = useState<number | null>(null);
  const held = fc && isNum(fc.forecastEveningPeakMw) && isNum(fc.effectiveEveningPeakMw) ? fc.forecastEveningPeakMw - fc.effectiveEveningPeakMw : null;
  return (
    <>
      <h3>{short(p.name)}</h3>
      <p className="gp-sheet__sub">{p.fuel || 'Fuel not stated'} · {p.producer || 'Producer not stated'} · units {p.installedCapacity || '—'}</p>
      <div className="gp-stats gp-stats--first" style={{ margin: 0 }}>
        <Stat label="Installed" value={p.installedMw} unit="MW" dp={1} prov="P" />
        <Stat label="Present" value={p.presentCapacityMw} unit="MW" dp={1} prov="P" />
        <Stat label="Evening peak" value={p.eveningPeakMw} unit="MW" dp={1} prov="P" />
        <Stat label="Day peak" value={p.dayPeakMw} unit="MW" dp={1} prov="P" detail={p.dayPeakMw == null ? 'not printed on this layout' : undefined} />
        <Stat label="Day’s energy" value={isNum(p.energyKwh) ? p.energyKwh / 1000 : null} unit="MWh" dp={1} prov="P" note="PGCB prints kWh; shown here in MWh, as the desktop table does." />
        <Stat label="Evening peak ÷ installed" value={u} unit="%" dp={1} prov="D" note="Evening-peak output divided by installed capacity. Withheld for Solar (measured after sunset) and where there is no rating." detail={isSolar(p.fuel) ? 'not shown for Solar' : undefined} />
      </div>
      {remark && (
        <div className="gp-sec__foot" style={{ marginTop: 16 }}>
          <span className="gp-sw" style={{ background: c }} /> PGCB’s remark<Prov kind="P" />: <b style={{ color: 'var(--gp-on)' }}>{remark}</b>
        </div>
      )}

      <h4 style={{ margin: '24px 0 4px', fontSize: 15 }}>Hourly output</h4>
      {gl && log ? (
        <>
          <div className="gp-subline">{at != null ? <>{gl.hours[at]} · <b>{log.hourlyMw[at] == null ? 'blank' : `${fmt(log.hourlyMw[at])} MW`}</b></> : 'Drag across the line'}{log.capacityMw != null ? <> · capacity row {fmt(log.capacityMw)} MW</> : null}</div>
          <LineChart ariaLabel={`${p.name} hourly output`} labels={gl.hours} onScrub={setAt} minH={160} maxH={200} series={[{ values: log.hourlyMw, color: c, fill: true, width: 2 }]} min={0} />
          <p className="gp-note">A gap in the line is a cell PGCB left blank, not zero. NLDC generation log.</p>
        </>
      ) : (
        <p className="gp-note">{gl ? 'The generation log carries no line under this station’s name.' : 'No hourly generation log is published for this day.'}</p>
      )}

      <h4 style={{ margin: '24px 0 4px', fontSize: 15 }}>PGCB’s projection for this day</h4>
      {fc ? (
        <div className="gp-stats gp-stats--first" style={{ margin: 0 }}>
          <Stat label="Forecast available" value={fc.forecastEveningPeakMw} unit="MW" prov="P" />
          <Stat label="Effective available" value={fc.effectiveEveningPeakMw} unit="MW" prov="P" detail={held != null && held > 0.05 ? `held back ${fmt(held)} MW` : undefined} />
          <Stat label="Forecast day peak" value={fc.forecastDayPeakMw} unit="MW" prov="P" />
          <Stat label="Effective day peak" value={fc.effectiveDayPeakMw} unit="MW" prov="P" />
          {remarkOf(fc.remarks) && <div className="gp-stat" style={{ gridColumn: '1 / -1' }}><div className="gp-stat__l">PGCB’s reason<Prov kind="P" /></div><div className="gp-stat__d" style={{ fontSize: 14, color: 'var(--gp-on)' }}>{remarkOf(fc.remarks)}</div></div>}
        </div>
      ) : (
        <p className="gp-note">{ctx.detail.plantForecast ? 'The projection carries no line under this station’s name.' : 'No station projection is published for this day.'}</p>
      )}
    </>
  );
}

/* ── fuel + producer ──────────────────────────────────────────────────── */

export function FuelProducerView({ ctx, plants }: { ctx: Ctx; plants: PlantActual[] }) {
  const fuels = useMemo(() => aggregateBy(plants, (p) => p.fuel), [plants]);
  const prods = useMemo(() => aggregateBy(plants, (p) => p.producer), [plants]);
  const totals = useMemo(() => {
    const rated = plants.filter((p) => isNum(p.installedMw));
    return { n: plants.length, installed: rated.length ? rated.reduce((a, p) => a + (p.installedMw ?? 0), 0) : null, evening: plants.reduce((a, p) => a + (p.eveningPeakMw || 0), 0) };
  }, [plants]);
  const top = prods.length > 9 ? prods.slice(0, 8) : prods;
  const rest = prods.length > 9 ? prods.slice(8) : [];
  const restAgg: Agg | null = rest.length ? { key: `Other producers (${rest.length})`, n: rest.reduce((a, g) => a + g.n, 0), installed: rest.some((g) => g.installed != null) ? rest.reduce((a, g) => a + (g.installed ?? 0), 0) : null, evening: rest.reduce((a, g) => a + g.evening, 0) } : null;
  const rows = restAgg ? [...top, restAgg] : top;
  const sectors = useMemo(() => {
    const counts = countBySector(plants.map((p) => p.producer));
    return SECTOR_ORDER.map((s) => {
      const ps = plants.filter((p) => producerSector(p.producer) === s);
      const rated = ps.filter((p) => isNum(p.installedMw));
      return { s, n: ps.length, installed: rated.length ? rated.reduce((a, p) => a + (p.installedMw ?? 0), 0) : null, evening: ps.reduce((a, p) => a + (p.eveningPeakMw || 0), 0), shown: (counts.find((c) => c.sector === s)?.count ?? 0) > 0 || s === 'government' || s === 'private' };
    }).filter((x) => x.shown);
  }, [plants]);
  const maxEv = Math.max(1, ...prods.map((g) => g.evening));
  const srcD = 'Summed from the station rows. PGCB publishes no roll-up; every figure here is our sum or quotient.';
  return (
    <>
      <Section title="Fleet utilisation by fuel" meta={`${fuels.length} fuels`} desc="Evening-peak output against installed capacity, summed from the station rows" source={<StationFoot ctx={ctx} />}>
        <div className="gp-rows">
          {fuels.map((g) => {
            const u = isSolar(g.key) || g.installed == null || g.installed <= 0 ? null : (g.evening / g.installed) * 100;
            const c = ctx.pal[fuelOf(g.key)] ?? '#94a3b8';
            return (
              <Row key={g.key} sw={c} name={<>{g.key}<Prov kind="P" /></>} sub={<>{g.n} stations<Prov kind="D" note={srcD} /> · installed {mw(g.installed)} MW · peak {mw(g.evening)} MW</>} value={u == null ? '—' : pct1(u)} small={isSolar(g.key) ? 'after sunset' : 'utilisation'} wrap
                meter={u != null ? <Meter value={g.evening} max={g.installed ?? 1} color={c} /> : undefined} />
            );
          })}
        </div>
        <div className="gp-stats gp-stats--3" style={{ marginTop: 16 }}>
          <Stat label="All fuels" value={totals.n} unit="stations" prov="D" note={srcD} />
          <Stat label="Installed" value={totals.installed} unit="MW" prov="D" note={srcD} />
          <Stat label="Evening peak" value={totals.evening} unit="MW" prov="D" note={srcD} />
        </div>
        {fuels.some((g) => isSolar(g.key)) && <p className="gp-note">Solar: the evening peak is measured after sunset, so a solar station’s zero is a real reading — not idle capacity. No evening-peak utilisation is shown for Solar.</p>}
        <HowTo title="How these figures are derived">
          <p>PGCB publishes no fuel roll-up. Every figure here is our own sum or quotient of the station rows: station counts, installed capacity, evening-peak output, and utilisation (evening peak divided by installed capacity).</p>
          <p>Solar has no evening peak (the reading is taken after sunset), so no utilisation is shown for it. Utilisation is also withheld where no installed capacity is stated.</p>
        </HowTo>
      </Section>

      <Section title="Producer split" meta={`${rows.length} groups`} desc="Each producer’s share of the fleet’s evening-peak output" source={<StationFoot ctx={ctx} />}>
        <div className="gp-rows">
          {rows.map((g) => {
            const share = totals.evening > 0 ? (g.evening / totals.evening) * 100 : null;
            const other = g.key.startsWith('Other producers');
            return (
              <Row key={g.key} sw="var(--gp-primary)" name={<>{g.key}{other ? <Prov kind="D" note="The smaller producer groups, rolled up by us." /> : <Prov kind="P" />}</>} sub={<>{g.n} stations<Prov kind="D" note={srcD} /> · installed {mw(g.installed)} MW · peak {mw(g.evening)} MW</>} value={pct1(share)} small="of output" wrap
                meter={<Meter value={g.evening} max={maxEv} color="var(--gp-primary)" />} />
            );
          })}
        </div>
        <div className="gp-stats gp-stats--3" style={{ marginTop: 16 }}>
          <Stat label="All producers" value={totals.n} unit="stations" prov="D" note={srcD} />
          <Stat label="Installed" value={totals.installed} unit="MW" prov="D" note={srcD} />
          <Stat label="Evening peak" value={totals.evening} unit="MW" prov="D" note={srcD} detail={totals.evening > 0 ? '100.0% of output' : undefined} />
        </div>
        <HowTo title="How these figures are derived">
          <p>Producer labels are as PGCB prints them. Counts, installed sums and shares of the evening peak are ours; PGCB publishes no producer total. With more than nine groups, the largest eight are listed and the rest roll into one “Other producers” row.</p>
        </HowTo>
      </Section>

      <Section title="Public, private and joint ventures" desc="The producer code sorted into ownership — the grouping is ours" source={<StationFoot ctx={ctx} />}>
        <div className="gp-rows">
          {sectors.map((x) => (
            <Row key={x.s} sw={x.s === 'government' ? 'var(--gp-primary)' : x.s === 'private' ? '#f59e0b' : x.s === 'joint-venture' ? '#0ea5e9' : x.s === 'import' ? '#a855f7' : 'var(--gp-faint)'} name={<>{SECTOR_LABEL[x.s]}<Prov kind="D" note="Ownership is read from the producer code (PDB, APSCL, EGCB and similar are government; IPP, QRPP, RPP, SIPP private). BCPCL counts as a joint venture. The split is ours, not PGCB’s." /></>} sub={`${x.n} stations · installed ${mw(x.installed)} MW`} value={mw(x.evening)} small="MW at evening peak" />
          ))}
        </div>
        <HowTo title="How ownership is decided">
          <p>Ownership is read from the producer code, using the site’s producer-sector table: PDB, APSCL, EGCB and the other state generation companies are government; IPP, QRPP, RPP and SIPP are private; BCPCL, RNPL and similar partnerships count as joint ventures; cross-border supply is an import. Anything the table does not know is shown as not classified, never folded into a neighbour. The split is ours and it counts only the rows on the sheet, not the national fleet.</p>
        </HowTo>
      </Section>
    </>
  );
}

/* ── hourly log ───────────────────────────────────────────────────────── */

export function HourlyView({ ctx, q, setQ }: { ctx: Ctx; q: string; setQ: (s: string) => void }) {
  const gl = ctx.detail.genlog;
  const open = useSheet();
  const [mode, setMode] = useState<'station' | 'hour'>('station');
  const [sel, setSel] = useState<number>(-1); // -1 = national total
  const [hr, setHr] = useState(() => {
    const h = gl?.hours ?? [];
    const e = ctx.day.systemStats.peakTimes?.eveningPeakGen;
    const i = e ? h.findIndex((x) => x.startsWith(e.slice(0, 2))) : -1;
    return i >= 0 ? i : Math.max(0, h.length - 6);
  });
  const [at, setAt] = useState<number | null>(null);
  if (!gl) return null;
  const hours = gl.hours;
  const nat = gl.totals.national;
  const filtered = gl.stations.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));
  const cur: { name: string; values: (number | null)[]; cap: number | null } = sel >= 0 && gl.stations[sel] ? { name: gl.stations[sel].name, values: gl.stations[sel].hourlyMw, cap: gl.stations[sel].capacityMw } : { name: 'National Grid Total', values: nat ?? [], cap: null };
  const cell = (v: number | null) => (v == null ? '—' : v === 0 ? '·' : fmt(v));
  const legend = <p className="gp-note"><b>—</b> is a cell PGCB left blank; <b>·</b> is a published zero.</p>;

  const pick = () =>
    open(<StationPicker stations={gl.stations} onPick={(i) => { setSel(i); open(null); }} />);
  const matrix = () =>
    open(
      <>
        <h3>Hourly Station Log</h3>
        <p className="gp-sheet__sub">MW each hour{q ? ` · filtered to “${q}”` : ''} · swipe sideways, station names stay put</p>
        <div className="gp-mx">
          <table>
            <thead><tr><th>Station</th>{hours.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.name}><td>{short(s.name)}</td>{s.hourlyMw.map((v, i) => <td key={i} className={v == null || v === 0 ? 'is-nil' : ''}>{cell(v == null ? null : Math.round(v))}</td>)}</tr>
              ))}
              {nat && <tr className="is-total"><td>National Grid Total</td>{nat.map((v, i) => <td key={i}>{cell(v == null ? null : Math.round(v))}</td>)}</tr>}
            </tbody>
          </table>
        </div>
        {legend}
      </>,
    );

  const ranked = [...filtered].map((s) => ({ s, v: s.hourlyMw[hr] })).sort((a, b) => (b.v ?? -1) - (a.v ?? -1));

  return (
    <Section title="Hourly station log" meta={`${gl.stations.length} stations`} desc={`Output every hour for each station, from the NLDC generation log${q ? ' — filtered by your search' : ''}`} source={<StationFoot ctx={ctx} sheet="GenLog sheet, per-station generation log" />}>
      <div className="gp-seg" role="tablist" aria-label="Hourly log view">
        {([['station', 'One station'], ['hour', 'One hour']] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? 'is-on' : ''} onClick={() => setMode(id)}>{l}</button>
        ))}
      </div>
      <div className="gp-split">
        <input className="gp-search" type="search" placeholder="Filter stations" aria-label="Filter stations by name" value={q} onChange={(e) => setQ(e.target.value)} />
        {mode === 'station' && <button onClick={pick}>Pick station</button>}
      </div>

      {mode === 'station' ? (
        <>
          <div className="gp-kicker" style={{ marginTop: 16 }}><span>{short(cur.name)}</span>{cur.cap != null && <span>capacity row {fmt(cur.cap)} MW</span>}</div>
          <div className="gp-subline">{at != null ? <>{hours[at]} · <b>{cur.values[at] == null ? 'blank' : `${fmt(cur.values[at])} MW`}</b></> : 'Drag across the line for each hour'}</div>
          <LineChart ariaLabel={`${cur.name} hourly output`} labels={hours} onScrub={setAt} series={[{ values: cur.values, color: 'var(--gp-primary)', fill: true, width: 2.25 }]} min={0} />
          <div className="gp-cells">
            {hours.map((h, i) => (
              <div key={h} className={i === at ? 'is-cur' : ''}>{h}<b>{cell(cur.values[i] == null ? null : Math.round(cur.values[i] as number))}</b></div>
            ))}
          </div>
          {legend}
        </>
      ) : (
        <>
          <div className="gp-filter" role="tablist" aria-label="Hour">
            {hours.map((h, i) => <button key={h} role="tab" aria-selected={i === hr} className={i === hr ? 'is-on' : ''} onClick={() => setHr(i)}>{h}</button>)}
          </div>
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {nat && <Row name="National Grid Total" value={<>{nat[hr] == null ? '—' : fmt(nat[hr])} <U>MW</U></>} small={nat[hr] == null ? 'blank' : undefined} />}
            {ranked.map(({ s, v }) => (
              <Row key={s.name} name={short(s.name)} sub={s.capacityMw != null ? `capacity row ${fmt(s.capacityMw)} MW` : undefined} value={v == null ? '—' : v === 0 ? '·' : <>{fmt(v)} <U>MW</U></>} small={v == null ? 'blank' : v === 0 ? 'published zero' : undefined} />
            ))}
            {!ranked.length && <div className="gp-empty" style={{ minHeight: 64 }}>No station matches “{q}”.</div>}
          </div>
        </>
      )}
      <button className="gp-more" onClick={matrix}>Full hour-by-station table</button>
    </Section>
  );
}

function StationPicker({ stations, onPick }: { stations: GenLogStation[]; onPick: (i: number) => void }) {
  const [q, setQ] = useState('');
  return (
    <>
      <h3>Pick a station</h3>
      <p className="gp-sheet__sub">{stations.length} stations in the generation log</p>
      <input className="gp-search" type="search" placeholder="Search stations" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="gp-rows" style={{ marginTop: 8 }}>
        <Row name="National Grid Total" chevron onClick={() => onPick(-1)} />
        {stations.map((s, i) => (!q || s.name.toLowerCase().includes(q.toLowerCase())) && <Row key={s.name + i} name={short(s.name)} chevron onClick={() => onPick(i)} />)}
      </div>
    </>
  );
}

/* ── expected derating ────────────────────────────────────────────────── */

export function DeratingView({ ctx, plants }: { ctx: Ctx; plants: PlantActual[] }) {
  const f = ctx.detail.plantForecast;
  const [n, setN] = useState(15);
  const open = useSheet();
  const derated = useMemo(() => {
    if (!f) return [];
    return f.stations
      .filter((s) => isNum(s.forecastEveningPeakMw) && isNum(s.effectiveEveningPeakMw) && s.forecastEveningPeakMw - s.effectiveEveningPeakMw > 0.05)
      .map((s) => ({ ...s, held: (s.forecastEveningPeakMw as number) - (s.effectiveEveningPeakMw as number), actual: (plants.find((p) => p.name === s.name)?.eveningPeakMw ?? null) as number | null }))
      .sort((a, b) => b.held - a.held);
  }, [f, plants]);
  if (!f || !derated.length) return null;
  const pal = ctx.pal;
  return (
    <Section title="Expected station derating" meta={`${f.deratedStations} of ${f.stationCount}`} desc={<>What PGCB expected each station to be able to offer, against what it expected to be able to take — from the projection issued for this day<Prov kind="P" /></>}
      source={<>Source: PGCB Daily Report — the Forecast sheet’s per-station availability columns, in the report for {f.issuedOn} · {f.issuedIn}<br />As published by PGCB. Not audited. Projection for {f.targetDay}.</>}>
      <div className="gp-stats gp-stats--3">
        <Stat label="Forecast available" value={f.forecastAvailableEveningMw} unit="MW" prov="D" note="Sum of the stations’ forecast-available figures at the evening peak. PGCB prints no such total." />
        <Stat label="Effective available" value={f.effectiveAvailableEveningMw} unit="MW" prov="D" note="Sum of the stations’ effective-available figures at the evening peak. PGCB prints no such total." />
        <Stat label="Held back" value={f.deratedMwAtEveningPeak} unit="MW" prov="D" note="The sum of each derated station’s forecast minus effective at the evening peak." />
      </div>
      <p className="gp-note">Evening peak. These are station sums, not a system forecast, and are not differenced into a shortfall.</p>
      <div className="gp-rows" style={{ marginTop: 8 }}>
        {derated.slice(0, n).map((s) => {
          const p = plants.find((x) => x.name === s.name);
          return (
            <Row key={s.name} top wrap sw={pal[fuelOf(s.fuel ?? '')] ?? '#94a3b8'} name={short(s.name)}
              sub={<>{s.fuel ?? 'fuel not stated'} · forecast {fmt(s.forecastEveningPeakMw)} → effective {fmt(s.effectiveEveningPeakMw)} MW · actual {s.actual == null ? '—' : fmt(s.actual)} MW{remarkOf(s.remarks) ? <><br /><span className="gp-tag warn">{remarkOf(s.remarks)}</span></> : null}</>}
              value={`−${fmt(s.held)}`} small="MW held" chevron={!!p} onClick={p ? () => open(<StationSheet p={p} ctx={ctx} />) : undefined} />
          );
        })}
      </div>
      {derated.length > n && <button className="gp-more" onClick={() => setN(derated.length)}>Show all {derated.length}</button>}
      {derated.length > 15 && n >= derated.length && <button className="gp-more" onClick={() => setN(15)}>Show first 15</button>}
      <HowTo title="What is being shown">
        <p>PGCB prints two next-day projections for every station: what it is expected to be able to offer (forecast available), and what PGCB expects to be able to take from it (effective available). Only stations where effective is below forecast are listed, largest gap first, with PGCB’s own remark. “Actual” is the measured evening-peak output, joined to the station by its exact name; a dash means no station carries that name.</p>
        <p><b>Analytical insight.</b> The sums are not a system forecast and are not differenced into a shortfall: on some days the stations’ effective sum sits below both the system forecast and the delivered output. What this shows is which fuel the constraint sits in.</p>
      </HowTo>
    </Section>
  );
}
