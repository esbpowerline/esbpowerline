'use client';

import { useState } from 'react';
import type { PetrobanglaDaily } from '@/lib/data/petrobangla/types';
import { fmt, LineChart, Meter, StackBar } from './charts';
import { dm, Empty, isNum, Prov, Row, Section, Stat, wd } from './shared';

/**
 * Petrobangla's gas day — 08:00 on the energy day to 08:00 the next — anchored
 * to the energy day it opens on (observation-window.ts, L1). The grand total is
 * Petrobangla's printed total, never the sum of the field rows (rule 4: the two
 * routinely disagree and both stay as filed).
 */
export function GasScreen({ gas, week, weekDates }: { gas: PetrobanglaDaily | null; week: (PetrobanglaDaily | null)[]; weekDates: string[] }) {
  const [scrub, setScrub] = useState<number | null>(null);
  const [allFields, setAllFields] = useState(false);
  const [allPlants, setAllPlants] = useState(false);
  if (!gas) return <div className="gp-screen"><Empty title="Gas" why="Petrobangla has not filed the gas report for this day yet." /></div>;

  const total = gas.production?.grand_total?.gas_mmcfd ?? null;
  const weekVals = week.map((d) => d?.production?.grand_total?.gas_mmcfd ?? null);
  const shown = scrub != null ? weekVals[scrub] : total;
  const lng = (gas.production?.fields ?? []).filter((f) => /r-?lng/i.test(f.field)).reduce((a, f) => a + (isNum(f.gas_mmcfd) ? f.gas_mmcfd : 0), 0);

  const sum = gas.distribution?.summary?.grand_total ?? gas.distribution?.summary?.total_ ?? null;
  const parts = sum
    ? ([
        ['Power stations', sum.power_supply_mmcfd, sum.power_demand_mmcfd, 'var(--gp-primary)'],
        ['Fertiliser factories', sum.fertilizer_supply_mmcfd, sum.fertilizer_demand_mmcfd, '#22c55e'],
        ['Everyone else', sum.others_supplementary_mmcfd, null, '#94a3b8'],
      ] as const)
    : [];
  const partsTot = parts.reduce((a, p) => a + (isNum(p[1]) ? p[1] : 0), 0);

  const fields = (gas.production?.fields ?? []).filter((f) => isNum(f.gas_mmcfd) && f.gas_mmcfd > 0).sort((a, b) => b.gas_mmcfd - a.gas_mmcfd);
  const fMax = Math.max(...fields.map((f) => Math.max(f.capacity_mmcfd || 0, f.gas_mmcfd)), 1);
  const wells = fields.reduce((a, f) => a + (isNum(f.producing_wells) ? f.producing_wells : 0), 0);
  const cond = fields.reduce((a, f) => a + (isNum(f.condensate_bbld) ? f.condensate_bbld : 0), 0);

  const plants = (gas.distribution?.companies ?? [])
    .flatMap((c) => (c.power_plants ?? []).map((p) => ({ ...p, company: c.company })))
    .flatMap((p) => (isNum(p.demand_mmcfd) && p.demand_mmcfd > 0 && isNum(p.supply_mmcfd) ? [{ ...p, demand: p.demand_mmcfd, supply: p.supply_mmcfd, gap: p.demand_mmcfd - p.supply_mmcfd }] : []))
    .sort((a, b) => b.gap - a.gap);
  const starved = plants.filter((p) => p.supply === 0).length;

  return (
    <div className="gp-screen">
      <Section source={<>Petrobangla daily gas report · {gas.meta?.source_filename ?? 'PDF'}<Prov kind="P" /></>}>
        <div className="gp-kicker"><span>{scrub != null ? `Gas day opening ${wd(weekDates[scrub])} ${dm(weekDates[scrub])}` : `Gas day ${gas.report?.report_date_label ?? ''} · 08:00 to 08:00`}</span></div>
        <div className="gp-hero"><b>{fmt(shown, 1)}</b><small>MMCFD</small></div>
        <div className="gp-subline">Produced at home and imported as LNG — Petrobangla’s grand total</div>
        {weekVals.filter(isNum).length > 1 && (
          <LineChart ariaLabel="Gas supplied by day" labels={weekDates.map(wd)} series={[{ values: weekVals, color: '#0ea5e9', fill: true, width: 2.25 }]} aspect={0.45} minH={170} onScrub={setScrub} />
        )}
        <div className="gp-stats gp-stats--3" style={{ marginTop: 16 }}>
          <Stat label="Imported LNG" value={lng || null} unit="MMCFD" dp={1} prov="P" detail={isNum(total) && lng ? `${((lng / total) * 100).toFixed(0)}% of supply` : undefined} />
          <Stat label="Producing wells" value={wells || null} prov="D" note="Sum of each field’s producing wells as Petrobangla printed them." />
          <Stat label="Condensate" value={cond || null} unit="BBLD" prov="D" note="Sum of each field’s condensate output." />
        </div>
      </Section>

      {parts.length > 0 && (
        <Section title="Where it went" desc="Supplied against what each sector asked for" source={<>Petrobangla distribution summary<Prov kind="D" note="‘Got’ is supplied over demand, as Petrobangla printed both. ‘Everyone else’ is Petrobangla’s others-and-supplementary column: industry, homes, CNG and the rest." /></>}>
          <StackBar parts={parts.filter((p) => isNum(p[1])).map((p) => ({ key: p[0], value: p[1] as number, color: p[3] }))} height={12} />
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {parts.map(([l, sup, dem, c]) => (
              <Row
                key={l}
                sw={c}
                name={l}
                sub={isNum(dem) && dem > 0 ? `asked for ${fmt(dem, 1)} · got ${isNum(sup) ? Math.round((sup / dem) * 100) : '—'}%` : undefined}
                value={<>{fmt(sup, 1)} <span className="gp-u">MMCFD</span></>}
                small={isNum(sup) && partsTot ? `${((sup / partsTot) * 100).toFixed(0)}% of supply` : undefined}
              />
            ))}
          </div>
        </Section>
      )}

      {fields.length > 0 && (
        <Section title="Fields" desc="Output against capacity · the tick marks capacity" meta={`${fields.length} producing`} source="Petrobangla daily gas report · production table">
          <div className="gp-rows">
            {(allFields ? fields : fields.slice(0, 8)).map((f) => {
              const isLng = /r-?lng/i.test(f.field);
              return (
                <Row
                  key={f.id ?? f.field}
                  sw={isLng ? '#a855f7' : '#0ea5e9'}
                  name={isLng ? 'Imported LNG' : f.field}
                  sub={isLng ? 'R-LNG terminals' : `${f.producing_wells ?? '—'} wells${f.company ? ` · ${String(f.company).replace(/^\d+\.\s*/, '')}` : ''}`}
                  value={<>{fmt(f.gas_mmcfd, 1)}</>}
                  small={f.capacity_mmcfd ? `${Math.round((f.gas_mmcfd / f.capacity_mmcfd) * 100)}% of ${fmt(f.capacity_mmcfd)}` : 'capacity not printed'}
                  meter={<Meter value={f.gas_mmcfd} max={fMax} color={isLng ? '#a855f7' : '#0ea5e9'} cap={f.capacity_mmcfd || undefined} />}
                />
              );
            })}
          </div>
          {fields.length > 8 && <button className="gp-more" onClick={() => setAllFields((v) => !v)}>{allFields ? 'Show fewer' : `All ${fields.length} fields`}</button>}
        </Section>
      )}

      {plants.length > 0 && (
        <Section title="Power stations short of gas" desc="Gas each station got against what it asked for" meta={starved ? <span className="gp-tag bad">{starved} got none</span> : undefined} source="Petrobangla distribution · per-station demand and supply">
          <div className="gp-rows">
            {(allPlants ? plants : plants.slice(0, 8)).map((p) => (
              <Row
                key={`${p.company}-${p.name}`}
                name={p.name}
                sub={String(p.company ?? '').replace(/^\d+\.\s*/, '')}
                value={fmt(p.supply)}
                small={`of ${fmt(p.demand)} asked`}
                meter={<Meter value={p.supply} max={p.demand} color="#0ea5e9" />}
              />
            ))}
          </div>
          {plants.length > 8 && <button className="gp-more" onClick={() => setAllPlants((v) => !v)}>{allPlants ? 'Show fewer' : `All ${plants.length} stations`}</button>}
        </Section>
      )}
    </div>
  );
}
