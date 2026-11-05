'use client';

import { useState } from 'react';
import type { EnergyCurve, GridDailyData } from '@/lib/data/grid/types';
import { fmt, Legend, Meter, StackArea, StackBar } from './charts';
import { fuelPalette, isNum, Prov, Source } from './shared';

const GROUP_OF = (fuel: string): string | null => {
  if (/^shortage/i.test(fuel)) return null;
  if (/coal/i.test(fuel)) return 'Coal';
  if (/gas/i.test(fuel)) return 'Gas';
  if (/hvdc|nepal|tripura|adani|import/i.test(fuel)) return 'Imports';
  if (/hfo|hsd|oil|diesel/i.test(fuel)) return 'Oil';
  if (/hydro|solar|wind/i.test(fuel)) return 'Renewables';
  return null;
};
const ORDER = ['Coal', 'Gas', 'Imports', 'Oil', 'Renewables'];

/**
 * The NLDC energy curve folded into five fuel groups. A group is null at an
 * hour only when every fuel in it is unpublished there; the stack draws that
 * as nothing rather than inventing a value, and the readout prints a dash.
 */
export function groupCurve(curve: EnergyCurve, hourly = true) {
  const rows = curve.rows.filter((r) => !hourly || r.time.endsWith(':00'));
  const groups = ORDER.filter((g) => curve.fuels.some((f) => GROUP_OF(f) === g));
  const values: (number | null)[][] = rows.map((r) =>
    groups.map((g) => {
      let sum = 0;
      let any = false;
      curve.fuels.forEach((f, i) => {
        if (GROUP_OF(f) !== g) return;
        const v = r.mw[i];
        if (isNum(v)) {
          sum += v;
          any = true;
        }
      });
      return any ? sum : null;
    }),
  );
  return { labels: rows.map((r) => r.time), groups, raw: values, rows: values.map((r) => r.map((v) => v ?? 0)) };
}

export function SupplyScreen({ day, curve }: { day: GridDailyData; curve: EnergyCurve | null }) {
  const base = fuelPalette(day);
  const pal: Record<string, string> = { ...base, Oil: base.HFO, Renewables: base.Wind };
  const g = curve ? groupCurve(curve) : null;
  // The evening peak can fall on the 19:30 sample, which the hourly view drops;
  // read the whole hour it falls in.
  const peakT = day.systemStats.peakTimes?.eveningPeakGen ?? '19:00';
  const peakIdx = g ? Math.max(0, g.labels.indexOf(peakT) >= 0 ? g.labels.indexOf(peakT) : g.labels.indexOf(`${peakT.slice(0, 2)}:00`)) : 0;
  const [i, setI] = useState<number | null>(null);
  const at = i ?? peakIdx;

  const mix = [...(day.generationData ?? [])].filter((m) => isNum(m.gen) && m.gen > 0).sort((a, b) => b.gen - a.gen);
  const mixTot = mix.reduce((a, m) => a + m.gen, 0);
  const unitMax = Math.max(...mix.map((m) => m.unitCost ?? 0), 1);

  const imports = day.borderImportsData ?? [];
  const impMax = Math.max(...imports.map((x) => x.peakFlow ?? 0), 1);

  const zones = [...(day.regionalDemandData ?? [])].sort((a, b) => b.demand - a.demand);
  const zMax = Math.max(...zones.map((z) => z.demand), 1);
  const zoneGen = [...(day.zoneGenerationData ?? [])].sort((a, b) => b.total - a.total);
  const zgMax = Math.max(...zoneGen.map((z) => z.total), 1);
  const zc = (k: string) => pal[k] ?? '#94a3b8';

  return (
    <div className="gp-screen">
      {g && (
        <section className="gp-card">
          <div className="gp-h">Generation by fuel <span>MW, hour by hour</span></div>
          <div className="gp-chart">
            <StackArea ariaLabel="Generation by fuel group, hour by hour" labels={g.labels} groups={g.groups.map((n) => ({ name: n, color: pal[n] }))} rows={g.rows} height={210} onScrub={setI} />
          </div>
          <div className="gp-readout">
            <span className="full">
              {i == null ? 'Evening peak hour · ' : ''}<b>{g.labels[at]}</b> · total{' '}
              <b>{fmt(g.raw[at].reduce<number>((a, v) => a + (v ?? 0), 0))} MW</b>
            </span>
            {g.groups.map((n, k) => (
              <span key={n}>
                <i className="gp-sw" style={{ display: 'inline-block', background: pal[n], marginRight: 5 }} />
                {n} <b>{fmt(g.raw[at][k])}</b>
              </span>
            ))}
          </div>
          <Source>NLDC load curve · Oil = HFO + HSD · Renewables = hydro + solar + wind<Prov kind="D" note="The curve publishes each fuel and sector separately; the five groups are our sums of them." /></Source>
        </section>
      )}

      {mix.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Energy and cost by fuel <span>Tk per kWh</span></div>
          <StackBar parts={mix.map((m) => ({ key: m.name, value: m.gen, color: m.color }))} height={12} />
          <div style={{ marginTop: 6 }}>
            {mix.map((m) => (
              <div key={m.name} className="gp-row">
                <span className="gp-sw" style={{ background: m.color }} />
                <div className="gp-row__main">
                  <div className="gp-row__name">{m.name} <span className="gp-row__sub" style={{ display: 'inline' }}>{fmt(m.gen, 1)} MKWh · {((m.gen / mixTot) * 100).toFixed(0)}%</span></div>
                  {isNum(m.unitCost) && <Meter value={m.unitCost} max={unitMax} color={m.color} />}
                </div>
                <div className="gp-row__val">
                  {fmt(m.unitCost, 2)}
                  <small>{isNum(m.cost) ? `৳${fmt(m.cost / 1e7, 0)} Cr` : 'cost not published'}</small>
                </div>
              </div>
            ))}
          </div>
          <Source>PGCB daily report · P1 fuel table · shares<Prov kind="D" note="Each fuel’s share is its energy over the day’s total; crore = taka ÷ 10 million." /></Source>
        </section>
      )}

      {imports.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Cross-border imports <span>energy · peak flow</span></div>
          {imports.map((x) => (
            <div key={x.source} className="gp-row">
              <div className="gp-row__main">
                <div className="gp-row__name">{x.source.replace(/\s*\(.*\)/, '')}</div>
                <div className="gp-row__sub">{x.type}</div>
                {isNum(x.peakFlow) && <Meter value={x.peakFlow} max={impMax} color={pal.Imports} />}
              </div>
              <div className="gp-row__val">
                {fmt(x.energy, 2)} <small>MKWh · {isNum(x.peakFlow) ? `${fmt(x.peakFlow)} MW peak` : 'peak not published'}</small>
              </div>
            </div>
          ))}
          <Source>PGCB daily report · import sheet</Source>
        </section>
      )}

      {zones.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Demand by zone <span>evening peak, MW</span></div>
          {zones.map((z) => (
            <div key={z.zone} className="gp-row">
              <div className="gp-row__main">
                <div className="gp-row__name">{z.zone}{z.loadShed > 0 ? <span className="gp-tag bad" style={{ marginLeft: 6 }}>−{fmt(z.loadShed)} shed</span> : null}</div>
                <Meter value={z.demand} max={zMax} color="var(--gp-primary)" />
              </div>
              <div className="gp-row__val">{fmt(z.demand)}</div>
            </div>
          ))}
          <Source>
            {day.regionalDemandSource === 'bpdb-published' ? 'BPDB zone table' : day.regionalDemandSource === 'derived-served-plus-shed' ? 'Served + shed, from PGCB P3 and P1' : 'PGCB daily report · P1 zone table'}
            <Prov kind={day.regionalDemandSource === 'derived-served-plus-shed' ? 'D' : 'P'} />
          </Source>
        </section>
      )}

      {zoneGen.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Where power was made <span>MKWh by zone</span></div>
          {zoneGen.map((z) => {
            const fuels = Object.entries(z.fuels).filter(([, v]) => isNum(v) && v > 0.05).sort((a, b) => b[1] - a[1]);
            return (
              <div key={z.zone} className="gp-row gp-row--top" style={{ padding: '10px 0' }}>
                <div className="gp-row__main">
                  <div className="gp-row__name">{z.zone}</div>
                  <div style={{ width: `${Math.max(4, (z.total / zgMax) * 100)}%`, marginTop: 6 }}>
                    <StackBar parts={fuels.map(([k, v]) => ({ key: k, value: v, color: zc(k) }))} height={9} />
                  </div>
                  <div className="gp-row__sub">{fuels.slice(0, 3).map(([k, v]) => `${k} ${fmt(v, 1)}`).join(' · ')}</div>
                </div>
                <div className="gp-row__val">{fmt(z.total, 1)}</div>
              </div>
            );
          })}
          <Legend items={['Gas', 'Coal', 'HFO', 'Hydro', 'Solar', 'Imports'].map((k) => ({ label: k, color: zc(k) }))} />
          <Source>PGCB daily report · P1 zone generation</Source>
        </section>
      )}
    </div>
  );
}
