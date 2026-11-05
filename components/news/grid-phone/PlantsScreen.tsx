'use client';

import { useMemo, useState } from 'react';
import type { DailyPlantDetail, GridDailyData, PlantActual } from '@/lib/data/grid/types';
import { fmt, Meter } from './charts';
import { Empty, fuelOf, fuelPalette, isNum, Prov, Row, Section, Stat, useSheet } from './shared';

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
const short = (s: string) => s.replace(/\s+/g, ' ').trim();

export function PlantsScreen({ day, plants }: { day: GridDailyData; plants: DailyPlantDetail | null }) {
  const open = useSheet();
  const pal = fuelPalette(day);
  const list = useMemo(() => (plants?.plants ?? []).filter((p) => isNum(p.installedMw) && p.installedMw > 0), [plants]);

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
      energy: list.reduce((a, p) => a + (isNum(p.energyKwh) ? p.energyKwh : 0), 0),
      idle: Object.entries(idle).sort((a, b) => b[1] - a[1]),
      byFuel: Object.entries(byFuel).sort((a, b) => b[1].cap - a[1].cap),
    };
  }, [list]);

  if (!list.length) return <div className="gp-screen"><Empty title="Power stations" why="PGCB’s report for this day carries no station table." /></div>;

  const top = [...list].filter((p) => isNum(p.eveningPeakMw)).sort((a, b) => (b.eveningPeakMw ?? 0) - (a.eveningPeakMw ?? 0)).slice(0, 10);
  const off = list.filter((p) => p.eveningPeakMw === 0 && isNum(p.presentCapacityMw) && p.presentCapacityMw >= 100).sort((a, b) => (b.presentCapacityMw ?? 0) - (a.presentCapacityMw ?? 0));
  const idleMax = sums.idle[0]?.[1] ?? 1;

  return (
    <div className="gp-screen">
      <Section title="Capacity against what ran" meta={`${list.length} stations`} source={<>PGCB daily report · station table<Prov kind="D" note="Sums of every station’s installed, present and evening-peak figures. Stations PGCB left blank are excluded, never counted as zero." /></>}>
        <div className="gp-funnel">
          {([
            ['Installed', sums.installed, 'var(--gp-line)'],
            ['Available today', sums.present, 'hsl(var(--primary) / 0.35)'],
            ['Running at the evening peak', sums.peak, 'var(--gp-primary)'],
          ] as const).map(([l, v, c]) => (
            <div key={l} className="gp-funnel__row">
              <span>{l}</span>
              <b>{fmt(v)} <span className="gp-u">MW</span></b>
              <div className="gp-funnel__bar" style={{ width: `${(v / sums.installed) * 100}%`, background: c }} />
            </div>
          ))}
        </div>
        <div className="gp-stats gp-stats--3" style={{ marginTop: 16 }}>
          <Stat label="Idle but available" value={sums.present - sums.peak} unit="MW" />
          <Stat label="Stations running" value={sums.ran} unit={`of ${list.length}`} />
          <Stat label="Left blank" value={sums.blank} unit="stations" />
        </div>
      </Section>

      {sums.idle.length > 0 && (
        <Section title="Why capacity sat idle" desc="Available megawatts not running at the peak, by PGCB’s stated reason" source={<>Grouped from PGCB’s remarks column<Prov kind="D" note="Available capacity minus evening-peak output, per station, summed by the reason PGCB wrote beside it. Tap a reason for the stations and the exact remark." /></>}>
          <div className="gp-rows">
            {sums.idle.map(([k, v]) => (
              <Row
                key={k}
                sw={REASON_COLOR[k]}
                name={k}
                value={<>{fmt(v)} <span className="gp-u">MW</span></>}
                chevron
                meter={<Meter value={v} max={idleMax} color={REASON_COLOR[k]} />}
                onClick={() => open(<PlantList title={k} plants={list.filter((p) => reasonOf(p.remarks) === k && (idleOf(p) ?? 0) > 0)} pal={pal} idle />)}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Capacity by fuel" desc="Available against running at the peak" source="PGCB daily report · station table · sums">
        <div className="gp-rows">
          {sums.byFuel.map(([f, v]) => (
            <Row
              key={f}
              sw={pal[f] ?? '#94a3b8'}
              name={f}
              sub={`${v.n} stations`}
              value={<>{fmt(v.peak)} <span className="gp-u">MW</span></>}
              small={`of ${fmt(v.cap)} available`}
              meter={<Meter value={v.peak} max={v.cap || 1} color={pal[f] ?? '#94a3b8'} />}
            />
          ))}
        </div>
      </Section>

      <Section title="Biggest stations tonight" desc="Output at the evening peak against what was available">
        <div className="gp-rows">
          {top.map((p) => <PlantRow key={p.name} p={p} pal={pal} />)}
        </div>
        <button className="gp-more" onClick={() => open(<PlantList title="All stations" plants={list} pal={pal} search />)}>All {list.length} stations · search</button>
      </Section>

      {off.length > 0 && (
        <Section title="Large stations switched off" desc="100 MW or more available, nothing at the peak">
          <div className="gp-rows">
            {off.slice(0, 8).map((p) => <PlantRow key={p.name} p={p} pal={pal} idle />)}
          </div>
          {off.length > 8 && <button className="gp-more" onClick={() => open(<PlantList title="Large stations switched off" plants={off} pal={pal} idle />)}>All {off.length}</button>}
        </Section>
      )}
    </div>
  );
}

function PlantRow({ p, pal, idle }: { p: PlantActual; pal: Record<string, string>; idle?: boolean }) {
  const open = useSheet();
  const c = pal[fuelOf(p.fuel)] ?? '#94a3b8';
  const cap = p.presentCapacityMw ?? p.installedMw ?? 0;
  const remark = p.remarks && p.remarks !== '-' ? p.remarks : null;
  return (
    <Row
      top
      wrap
      sw={c}
      name={short(p.name)}
      sub={<>{p.fuel} · {p.producer}{remark ? <><br /><span className={`gp-tag ${/gas|fuel|coal/i.test(remark) ? 'warn' : 'bad'}`}>{remark}</span></> : null}</>}
      value={idle ? fmt(idleOf(p)) : fmt(p.eveningPeakMw)}
      small={idle ? 'MW idle' : `of ${fmt(cap)} MW`}
      meter={!idle && isNum(p.eveningPeakMw) && cap > 0 ? <Meter value={p.eveningPeakMw} max={cap} color={c} /> : undefined}
      onClick={() => open(<PlantDetail p={p} color={c} />)}
    />
  );
}

function PlantDetail({ p, color }: { p: PlantActual; color: string }) {
  return (
    <>
      <h3>{short(p.name)}</h3>
      <p className="gp-sheet__sub">{p.fuel} · {p.producer} · units {p.installedCapacity || '—'}</p>
      <div className="gp-stats gp-stats--first" style={{ margin: 0 }}>
        <Stat label="Installed" value={p.installedMw} unit="MW" prov="P" />
        <Stat label="Available today" value={p.presentCapacityMw} unit="MW" prov="P" />
        <Stat label="Evening peak" value={p.eveningPeakMw} unit="MW" prov="P" />
        <Stat label="Day peak" value={p.dayPeakMw} unit="MW" prov="P" detail={p.dayPeakMw == null ? 'not printed on this layout' : undefined} />
        <Stat label="Energy over the day" value={isNum(p.energyKwh) ? p.energyKwh / 1e6 : null} unit="MKWh" dp={2} prov="D" note="PGCB prints kWh; shown in millions." />
        <Stat label="Running at the peak" value={isNum(p.eveningPeakMw) && isNum(p.presentCapacityMw) && p.presentCapacityMw > 0 ? (p.eveningPeakMw / p.presentCapacityMw) * 100 : null} unit="% of available" prov="D" />
      </div>
      {p.remarks && p.remarks !== '-' && (
        <div className="gp-sec__foot" style={{ marginTop: 16 }}>
          <span className="gp-sw" style={{ background: color }} /> PGCB’s remark: <b style={{ color: 'var(--gp-on)' }}>{p.remarks}</b>
        </div>
      )}
    </>
  );
}

function PlantList({ title, plants, pal, idle, search }: { title: string; plants: PlantActual[]; pal: Record<string, string>; idle?: boolean; search?: boolean }) {
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
          <div className="gp-filter">
            {fuels.map((f) => (
              <button key={f} className={f === fuel ? 'is-on' : ''} onClick={() => setFuel(f)}>{f}</button>
            ))}
          </div>
        </>
      )}
      <div className="gp-rows" style={{ marginTop: 8 }}>
        {shown.map((p) => <PlantRow key={p.name} p={p} pal={pal} idle={idle} />)}
      </div>
    </>
  );
}
