'use client';

import { useState } from 'react';
import type { EnergyCurve, GridDailyData } from '@/lib/data/grid/types';
import { fmt, Legend, Meter, StackArea, StackBar } from './charts';
import { fuelPalette, isNum, Prov, Row, Section } from './shared';

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
 * as nothing and the readout prints a dash.
 */
export function groupCurve(curve: EnergyCurve, hourly = true) {
  const rows = curve.rows.filter((r) => !hourly || r.time.endsWith(':00'));
  const groups = ORDER.filter((g) => curve.fuels.some((f) => GROUP_OF(f) === g));
  const raw: (number | null)[][] = rows.map((r) =>
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
  return { labels: rows.map((r) => r.time), groups, raw, rows: raw.map((r) => r.map((v) => v ?? 0)) };
}

const U = ({ children }: { children: React.ReactNode }) => <span className="gp-u">{children}</span>;

export function SupplyScreen({ day, curve }: { day: GridDailyData; curve: EnergyCurve | null }) {
  const base = fuelPalette(day);
  const pal: Record<string, string> = { ...base, Oil: base.HFO, Renewables: base.Wind };
  const g = curve ? groupCurve(curve) : null;
  const peakT = day.systemStats.peakTimes?.eveningPeakGen ?? '19:00';
  const peakIdx = g ? Math.max(0, g.labels.indexOf(peakT) >= 0 ? g.labels.indexOf(peakT) : g.labels.indexOf(`${peakT.slice(0, 2)}:00`)) : 0;
  const [i, setI] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const at = i ?? peakIdx;

  const mix = [...(day.generationData ?? [])].filter((m) => isNum(m.gen) && m.gen > 0).sort((a, b) => b.gen - a.gen);
  const mixTot = mix.reduce((a, m) => a + m.gen, 0);
  const unitMax = Math.max(...mix.map((m) => m.unitCost ?? 0), 1);
  const costTot = mix.reduce((a, m) => a + (isNum(m.cost) ? m.cost : 0), 0);

  const imports = day.borderImportsData ?? [];
  const impMax = Math.max(...imports.map((x) => x.peakFlow ?? 0), 1);
  const impEnergy = imports.reduce((a, x) => a + (isNum(x.energy) ? x.energy : 0), 0);

  const zones = [...(day.regionalDemandData ?? [])].sort((a, b) => b.demand - a.demand);
  const zMax = Math.max(...zones.map((z) => z.demand), 1);
  const zShed = zones.reduce((a, z) => a + (isNum(z.loadShed) ? z.loadShed : 0), 0);
  const zoneGen = [...(day.zoneGenerationData ?? [])].sort((a, b) => b.total - a.total);
  const zgMax = Math.max(...zoneGen.map((z) => z.total), 1);
  const zc = (k: string) => base[k] ?? '#94a3b8';

  const shown = g ? g.groups.filter((n) => !hidden.has(n)) : [];
  const shownIdx = g ? shown.map((n) => g.groups.indexOf(n)) : [];

  return (
    <div className="gp-screen">
      {g && (
        <Section title="Generation by fuel" desc="Hour by hour · drag to read any hour" source={<>NLDC load curve · Oil = HFO + HSD · Renewables = hydro + solar + wind<Prov kind="D" note="The curve publishes each fuel and sector separately; the five groups are our sums of them." /></>}>
          <div className="gp-kicker"><span>{i == null ? `Evening peak hour · ${g.labels[at]}` : g.labels[at]}</span></div>
          <div className="gp-hero gp-hero--md"><b>{fmt(g.raw[at].reduce<number>((a, v) => a + (v ?? 0), 0))}</b><small>MW</small></div>
          <StackArea ariaLabel="Generation by fuel group, hour by hour" labels={g.labels} groups={shown.map((n) => ({ name: n, color: pal[n] }))} rows={g.rows.map((r) => shownIdx.map((k) => r[k]))} onScrub={setI} />
          <Legend
            hidden={hidden}
            onToggle={(k) => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
            items={g.groups.map((n, k) => ({ key: n, color: pal[n], label: <>{n} <b className="num">{fmt(g.raw[at][k])}</b></> }))}
          />
        </Section>
      )}

      {mix.length > 0 && (
        <Section title="Energy and cost by fuel" meta={<>{fmt(mixTot, 1)} MKWh<br />৳{fmt(costTot / 1e7, 0)} crore</>} source={<>PGCB daily report · P1 fuel table<Prov kind="D" note="Each fuel’s share is its energy over the day’s total; crore = taka ÷ 10 million." /></>}>
          <StackBar parts={mix.map((m) => ({ key: m.name, value: m.gen, color: m.color }))} height={12} />
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {mix.map((m) => (
              <Row
                key={m.name}
                sw={m.color}
                name={m.name}
                sub={`${fmt(m.gen, 1)} MKWh · ${((m.gen / mixTot) * 100).toFixed(1)}% of energy`}
                value={<>{fmt(m.unitCost, 2)} <U>Tk/kWh</U></>}
                small={isNum(m.cost) ? `৳${fmt(m.cost / 1e7, 1)} crore` : 'cost not published'}
                meter={isNum(m.unitCost) ? <Meter value={m.unitCost} max={unitMax} color={m.color} /> : undefined}
              />
            ))}
          </div>
        </Section>
      )}

      {imports.length > 0 && (
        <Section title="Cross-border imports" meta={`${fmt(impEnergy, 2)} MKWh`} source="PGCB daily report · import sheet">
          <div className="gp-rows">
            {imports.map((x) => (
              <Row
                key={x.source}
                sw={base.Imports}
                name={x.source.replace(/\s*\(.*\)/, '')}
                sub={x.type.replace('C/B Interconnector', 'Interconnector')}
                value={<>{fmt(x.energy, 2)} <U>MKWh</U></>}
                small={isNum(x.peakFlow) ? `${fmt(x.peakFlow)} MW peak` : 'peak not published'}
                meter={isNum(x.peakFlow) ? <Meter value={x.peakFlow} max={impMax} color={base.Imports} /> : undefined}
              />
            ))}
          </div>
        </Section>
      )}

      {zones.length > 0 && (
        <Section
          title="Demand by zone"
          desc="At the evening peak"
          meta={zShed > 0 ? <span className="gp-tag bad">{fmt(zShed)} MW shed</span> : <span className="gp-tag good">no shedding</span>}
          source={
            <>
              {day.regionalDemandSource === 'bpdb-published' ? 'BPDB zone table' : day.regionalDemandSource === 'derived-served-plus-shed' ? 'Served + shed, from PGCB P3 and P1' : 'PGCB daily report · P1 zone table'}
              <Prov kind={day.regionalDemandSource === 'derived-served-plus-shed' ? 'D' : 'P'} />
            </>
          }
        >
          <div className="gp-rows">
            {zones.map((z) => (
              <Row
                key={z.zone}
                name={z.zone}
                value={<>{fmt(z.demand)} <U>MW</U></>}
                small={z.loadShed > 0 ? <span style={{ color: 'var(--gp-bad)', fontWeight: 600 }}>{fmt(z.loadShed)} MW shed{isNum(z.pct) && z.pct ? ` · ${fmt(z.pct, 1)}%` : ''}</span> : 'fully served'}
                meter={<Meter value={z.demand} max={zMax} color="var(--gp-primary)" />}
              />
            ))}
          </div>
        </Section>
      )}

      {zoneGen.length > 0 && (
        <Section title="Where power was made" desc="Energy generated in each zone, by fuel" meta="MKWh" source="PGCB daily report · P1 zone generation">
          <div className="gp-rows">
            {zoneGen.map((z) => {
              const fuels = Object.entries(z.fuels).filter(([, v]) => isNum(v) && v > 0.05).sort((a, b) => b[1] - a[1]);
              return (
                <Row
                  key={z.zone}
                  name={z.zone}
                  sub={fuels.slice(0, 3).map(([k, v]) => `${k} ${fmt(v, 1)}`).join(' · ')}
                  value={fmt(z.total, 1)}
                  meter={
                    <div style={{ gridColumn: '1 / -1', marginTop: 8, width: `${Math.max(3, (z.total / zgMax) * 100)}%` }}>
                      <StackBar parts={fuels.map(([k, v]) => ({ key: k, value: v, color: zc(k) }))} height={8} />
                    </div>
                  }
                />
              );
            })}
          </div>
          <Legend items={['Gas', 'Coal', 'HFO', 'HSD', 'Hydro', 'Solar', 'Wind', 'Imports'].filter((k) => zoneGen.some((z) => (z.fuels[k] ?? 0) > 0.05)).map((k) => ({ label: k, color: zc(k) }))} />
        </Section>
      )}
    </div>
  );
}
