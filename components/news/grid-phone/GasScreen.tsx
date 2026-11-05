'use client';

import { useState } from 'react';
import type { PetrobanglaDaily } from '@/lib/data/petrobangla/types';
import { fmt, LineChart, Meter, StackBar } from './charts';
import { dm, isNum, Prov, Source, wd } from './shared';

/**
 * Petrobangla's gas day — 08:00 on the energy day to 08:00 the next — anchored
 * to the energy day it opens on (observation-window.ts, L1). Every figure is
 * Petrobangla's; the grand total is its printed total, never the sum of the
 * field rows (rule 4: the two routinely disagree and both stay as filed).
 */
export function GasScreen({ gas, week, weekDates }: { gas: PetrobanglaDaily | null; week: (PetrobanglaDaily | null)[]; weekDates: string[] }) {
  const [scrub, setScrub] = useState<number | null>(null);
  const [allFields, setAllFields] = useState(false);
  if (!gas) {
    return (
      <div className="gp-screen">
        <div className="gp-card"><div className="gp-empty" style={{ minHeight: 120 }}>Petrobangla has not filed the gas report for this day yet.</div></div>
      </div>
    );
  }
  const total = gas.production?.grand_total?.gas_mmcfd ?? null;
  const weekVals = week.map((d) => d?.production?.grand_total?.gas_mmcfd ?? null);
  const shown = scrub != null ? weekVals[scrub] : total;

  const sum = gas.distribution?.summary?.grand_total ?? gas.distribution?.summary?.total_ ?? null;
  const parts = sum
    ? ([
        ['Power plants', sum.power_supply_mmcfd, sum.power_demand_mmcfd, 'var(--gp-primary)'],
        ['Fertiliser factories', sum.fertilizer_supply_mmcfd, sum.fertilizer_demand_mmcfd, '#22c55e'],
        ['Everyone else', sum.others_supplementary_mmcfd, null, '#94a3b8'],
      ] as const)
    : [];
  const partsTot = parts.reduce((a, p) => a + (isNum(p[1]) ? p[1] : 0), 0);

  const fields = (gas.production?.fields ?? []).filter((f) => isNum(f.gas_mmcfd) && f.gas_mmcfd > 0).sort((a, b) => b.gas_mmcfd - a.gas_mmcfd);
  const fMax = Math.max(...fields.map((f) => Math.max(f.capacity_mmcfd || 0, f.gas_mmcfd)), 1);
  const plants = (gas.distribution?.companies ?? [])
    .flatMap((c) => (c.power_plants ?? []).map((p) => ({ ...p, company: c.company })))
    .flatMap((p) => (isNum(p.demand_mmcfd) && p.demand_mmcfd > 0 && isNum(p.supply_mmcfd) ? [{ ...p, demand: p.demand_mmcfd, supply: p.supply_mmcfd, gap: p.demand_mmcfd - p.supply_mmcfd }] : []))
    .sort((a, b) => b.gap - a.gap);

  return (
    <div className="gp-screen">
      <section className="gp-card">
        <div className="gp-eyebrow"><span>{scrub != null ? `Gas day opening ${dm(weekDates[scrub])}` : `Gas produced and imported · ${gas.report?.report_date_label ?? ''}`}</span></div>
        <div className="gp-big">{fmt(shown, 1)}<small>MMCFD</small></div>
        <div className="gp-sub">Petrobangla grand total, 08:00 to 08:00</div>
        {weekVals.filter(isNum).length > 1 && (
          <div className="gp-chart">
            <LineChart ariaLabel="Gas production by day" labels={weekDates.map(wd)} series={[{ values: weekVals, color: '#0ea5e9', fill: true }]} height={110} onScrub={setScrub} />
          </div>
        )}
        <Source>Petrobangla daily gas report · {gas.meta?.source_filename ?? 'PDF'}<Prov kind="P" /></Source>
      </section>

      {parts.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Where it went <span>supplied · asked for</span></div>
          <StackBar parts={parts.filter((p) => isNum(p[1])).map((p) => ({ key: p[0], value: p[1] as number, color: p[3] }))} height={12} />
          <div style={{ marginTop: 6 }}>
            {parts.map(([l, sup, dem, c]) => (
              <div key={l} className="gp-row">
                <span className="gp-sw" style={{ background: c }} />
                <div className="gp-row__main">
                  <div className="gp-row__name">{l}</div>
                  {isNum(dem) && dem > 0 && <div className="gp-row__sub">asked for {fmt(dem, 1)} · got {isNum(sup) ? Math.round((sup / dem) * 100) : '—'}%</div>}
                </div>
                <div className="gp-row__val">{fmt(sup, 1)}<small>{isNum(sup) && partsTot ? `${((sup / partsTot) * 100).toFixed(0)}% of supply` : ''}</small></div>
              </div>
            ))}
          </div>
          <Source>Petrobangla distribution summary · shares<Prov kind="D" note="‘Got’ is supplied over demand, as Petrobangla printed both. ‘Everyone else’ is Petrobangla’s others-and-supplementary column: industry, homes, CNG and the rest." /></Source>
        </section>
      )}

      {fields.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Fields <span>output · line = capacity</span></div>
          {(allFields ? fields : fields.slice(0, 8)).map((f) => (
            <div key={f.id ?? f.field} className="gp-row">
              <div className="gp-row__main">
                <div className="gp-row__name">{/r-?lng/i.test(f.field) ? <>Imported LNG <span className="gp-tag">R-LNG</span></> : f.field}</div>
                <Meter value={f.gas_mmcfd} max={fMax} color={/r-?lng/i.test(f.field) ? '#a855f7' : '#0ea5e9'} cap={f.capacity_mmcfd || undefined} />
              </div>
              <div className="gp-row__val">{fmt(f.gas_mmcfd, 1)}<small>{f.capacity_mmcfd ? `${Math.round((f.gas_mmcfd / f.capacity_mmcfd) * 100)}% of capacity` : `${f.producing_wells ?? '—'} wells`}</small></div>
            </div>
          ))}
          {fields.length > 8 && <button className="gp-more" onClick={() => setAllFields((v) => !v)}>{allFields ? 'Show fewer' : `All ${fields.length} fields`}</button>}
        </section>
      )}

      {plants.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Power stations short of gas <span>got · asked for</span></div>
          {plants.slice(0, 10).map((p) => (
            <div key={`${p.company}-${p.name}`} className="gp-row">
              <div className="gp-row__main">
                <div className="gp-row__name">{p.name}</div>
                <div className="gp-row__sub">{p.company}</div>
                <Meter value={p.supply} max={p.demand} color="#0ea5e9" />
              </div>
              <div className="gp-row__val">{fmt(p.supply)}<small>of {fmt(p.demand)}</small></div>
            </div>
          ))}
          <Source>Petrobangla distribution · per-station demand and supply</Source>
        </section>
      )}
    </div>
  );
}
