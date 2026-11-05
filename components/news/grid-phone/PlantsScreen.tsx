'use client';

import { useMemo, useState } from 'react';
import type { DailyPlantDetail, GridDailyData, PlantActual } from '@/lib/data/grid/types';
import { fmt, Meter } from './charts';
import { fuelOf, fuelPalette, isNum, Prov, Source, useSheet } from './shared';

/**
 * PGCB's free-text remark, sorted into a handful of reasons a reader can scan.
 * The grouping is ours (marked D); the remark itself is always shown verbatim
 * beside the plant.
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
  'Held in reserve': '#22c55e', 'Contract expired': '#a855f7', 'No reason given': 'var(--gp-muted)', Other: 'var(--gp-muted)',
};

const short = (s: string) => s.replace(/\s+/g, ' ').trim();

export function PlantsScreen({ day, plants }: { day: GridDailyData; plants: DailyPlantDetail | null }) {
  const open = useSheet();
  const pal = fuelPalette(day);
  const list = useMemo(() => (plants?.plants ?? []).filter((p) => isNum(p.installedMw) && p.installedMw > 0), [plants]);

  const sums = useMemo(() => {
    const withPeak = list.filter((p) => isNum(p.eveningPeakMw));
    const withCap = list.filter((p) => isNum(p.presentCapacityMw));
    const idle: Record<string, number> = {};
    for (const p of list) {
      if (!isNum(p.presentCapacityMw) || !isNum(p.eveningPeakMw)) continue;
      const gap = p.presentCapacityMw - p.eveningPeakMw;
      if (gap > 0) idle[reasonOf(p.remarks)] = (idle[reasonOf(p.remarks)] ?? 0) + gap;
    }
    return {
      installed: list.reduce((a, p) => a + (p.installedMw ?? 0), 0),
      present: withCap.reduce((a, p) => a + (p.presentCapacityMw ?? 0), 0),
      peak: withPeak.reduce((a, p) => a + (p.eveningPeakMw ?? 0), 0),
      unpublishedPeak: list.length - withPeak.length,
      ran: withPeak.filter((p) => (p.eveningPeakMw ?? 0) > 0).length,
      idle: Object.entries(idle).sort((a, b) => b[1] - a[1]),
    };
  }, [list]);

  if (!list.length) {
    return (
      <div className="gp-screen">
        <div className="gp-card"><div className="gp-empty" style={{ minHeight: 120 }}>PGCB’s report for this day carries no station table.</div></div>
      </div>
    );
  }

  const top = [...list].filter((p) => isNum(p.eveningPeakMw)).sort((a, b) => (b.eveningPeakMw ?? 0) - (a.eveningPeakMw ?? 0)).slice(0, 10);
  const off = list.filter((p) => p.eveningPeakMw === 0 && isNum(p.presentCapacityMw) && p.presentCapacityMw >= 100).sort((a, b) => (b.presentCapacityMw ?? 0) - (a.presentCapacityMw ?? 0)).slice(0, 8);
  const idleMax = sums.idle[0]?.[1] ?? 1;

  return (
    <div className="gp-screen">
      <section className="gp-card">
        <div className="gp-h">Capacity against what ran <span>{list.length} stations</span></div>
        <div className="gp-funnel">
          {([
            ['Installed', sums.installed, 'var(--gp-line)'],
            ['Available today', sums.present, 'var(--gp-primaryC)'],
            ['Ran at evening peak', sums.peak, 'var(--gp-primary)'],
          ] as const).map(([l, v, c]) => (
            <div key={l} className="gp-funnel__row">
              <span>{l}</span>
              <b>{fmt(v)} MW</b>
              <div className="gp-funnel__bar" style={{ width: `${(v / sums.installed) * 100}%`, background: c }} />
            </div>
          ))}
        </div>
        <div className="gp-sub" style={{ marginTop: 10 }}>
          {fmt(sums.present - sums.peak)} MW available but not running · {sums.ran} of {list.length} stations produced at the peak
          {sums.unpublishedPeak ? ` · ${sums.unpublishedPeak} left blank by PGCB` : ''}
        </div>
        <Source>PGCB daily report · station table · totals<Prov kind="D" note="Sums of every station’s installed, present and evening-peak figures. Stations PGCB left blank are excluded, never counted as zero." /></Source>
      </section>

      {sums.idle.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Why capacity sat idle <span>MW available, not running</span></div>
          {sums.idle.map(([k, v]) => (
            <button key={k} className="gp-row" style={{ width: '100%', border: 0, borderTop: '1px solid var(--gp-line)', background: 'none', textAlign: 'left' }}
              onClick={() => open(<PlantList title={k} plants={list.filter((p) => reasonOf(p.remarks) === k && isNum(p.presentCapacityMw) && isNum(p.eveningPeakMw) && p.presentCapacityMw > p.eveningPeakMw)} pal={pal} idle />)}>
              <div className="gp-row__main">
                <div className="gp-row__name">{k}</div>
                <Meter value={v} max={idleMax} color={REASON_COLOR[k]} />
              </div>
              <div className="gp-row__val">{fmt(v)}<small>MW ›</small></div>
            </button>
          ))}
          <Source>Grouped from PGCB’s remarks column<Prov kind="D" note="Available capacity minus evening-peak output, per station, summed by the reason PGCB wrote beside it. Tap a reason to see the stations and the exact remark." /></Source>
        </section>
      )}

      <section className="gp-card">
        <div className="gp-h">Biggest stations tonight <span>MW at peak / available</span></div>
        {top.map((p) => <PlantRow key={p.name} p={p} pal={pal} />)}
        <button className="gp-more" onClick={() => open(<PlantList title="All stations" plants={list} pal={pal} search />)}>All {list.length} stations</button>
      </section>

      {off.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Large stations switched off <span>≥ 100 MW available</span></div>
          {off.map((p) => <PlantRow key={p.name} p={p} pal={pal} idle />)}
        </section>
      )}
    </div>
  );
}

function PlantRow({ p, pal, idle }: { p: PlantActual; pal: Record<string, string>; idle?: boolean }) {
  const c = pal[fuelOf(p.fuel)] ?? '#94a3b8';
  const cap = p.presentCapacityMw ?? p.installedMw ?? 0;
  const remark = p.remarks && p.remarks !== '-' ? p.remarks : null;
  return (
    <div className="gp-row gp-row--top">
      <span className="gp-sw" style={{ background: c, marginTop: 5 }} />
      <div className="gp-row__main">
        <div className="gp-row__name gp-row__name--wrap">{short(p.name)}</div>
        <div className="gp-row__sub">{p.fuel} · {p.producer}{remark ? <> · <span className={`gp-tag ${/gas|fuel|coal/i.test(remark) ? 'warn' : 'bad'}`}>{remark}</span></> : null}</div>
        {!idle && isNum(p.eveningPeakMw) && cap > 0 && <Meter value={p.eveningPeakMw} max={cap} color={c} />}
      </div>
      <div className="gp-row__val">
        {idle ? fmt(isNum(p.presentCapacityMw) && isNum(p.eveningPeakMw) ? p.presentCapacityMw - p.eveningPeakMw : null) : fmt(p.eveningPeakMw)}
        <small>{idle ? 'MW idle' : `of ${fmt(cap)}`}</small>
      </div>
    </div>
  );
}

function PlantList({ title, plants, pal, idle, search }: { title: string; plants: PlantActual[]; pal: Record<string, string>; idle?: boolean; search?: boolean }) {
  const [q, setQ] = useState('');
  const [fuel, setFuel] = useState('All');
  const fuels = ['All', ...Array.from(new Set(plants.map((p) => fuelOf(p.fuel))))];
  const shown = plants
    .filter((p) => (fuel === 'All' || fuelOf(p.fuel) === fuel) && (!q || `${p.name} ${p.producer}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (idle ? ((b.presentCapacityMw ?? 0) - (b.eveningPeakMw ?? 0)) - ((a.presentCapacityMw ?? 0) - (a.eveningPeakMw ?? 0)) : (b.eveningPeakMw ?? -1) - (a.eveningPeakMw ?? -1)));
  return (
    <>
      <h3>{title}</h3>
      <p className="gp-sheet__sub">{shown.length} stations</p>
      {search && (
        <>
          <input className="gp-search" placeholder="Search stations or owners" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="gp-pills" style={{ margin: '0 -16px 8px', padding: '0 16px' }}>
            {fuels.map((f) => (
              <button key={f} className={`gp-pill${f === fuel ? ' good' : ''}`} style={{ border: 0 }} onClick={() => setFuel(f)}>{f}</button>
            ))}
          </div>
        </>
      )}
      {shown.map((p) => <PlantRow key={p.name} p={p} pal={pal} idle={idle} />)}
    </>
  );
}
