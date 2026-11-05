'use client';

import { useEffect, useState } from 'react';
import '@/app/grid-phone-gas.css';
import type { GasDistributionItem, GasProductionItem, GridDailyData } from '@/lib/data/grid/types';
import type { DistributionCompany, PetrobanglaDaily, ProductionField } from '@/lib/data/petrobangla/types';
import { fetchDailyReport } from '@/lib/data/grid/daily-loader.client';
import { loadArchiveDay, loadArchiveIndex } from '@/lib/data/petrobangla/loadArchive';
import { resolveArchiveGasDay, getDistributionGrandTotal } from '@/lib/data/petrobangla/compute';
import { cleanFieldName, PRODUCER_COLORS, DISTRIBUTOR_COLORS } from '@/components/news/power-grid/PetrobanglaSectionDetail';
import { fmt } from './charts';
import { isNum, Prov, Row, Stat } from './shared';

/**
 * The desktop Gas tab reads its two summary tables from the day payload
 * (gasProductionData / gasDistributionData) and its detail from the Petrobangla
 * archive day that resolves for the selected date (exact, else the nearest
 * earlier). When the payload's gas rows are all zero — the shape the site uses
 * for "Petrobangla has not filed yet" — it falls back to the nearest report's
 * rows. This hook reproduces exactly that, so both views print the same figures.
 */
export type GasFeed = {
  archive: PetrobanglaDaily | null;
  gasDay: string | null;
  /** 'loading' until the archive index and day have answered; 'none' when no parsed day resolves. */
  status: 'loading' | 'ready' | 'none';
  prod: GasProductionItem[];
  dist: GasDistributionItem[];
  fallback: boolean;
  totalGas: number;
  totalCond: number;
};

export function useGasFeed(date: string, day: GridDailyData): GasFeed {
  const [archive, setArchive] = useState<PetrobanglaDaily | null>(null);
  const [gasDay, setGasDay] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'none'>('loading');
  const [fb, setFb] = useState<{ production: GasProductionItem[]; distribution: GasDistributionItem[] } | null>(null);

  useEffect(() => {
    let live = true;
    setArchive(null); setGasDay(null); setStatus('loading');
    loadArchiveIndex()
      .then((index) => {
        const { resolved } = resolveArchiveGasDay(date, index);
        if (!resolved) { if (live) setStatus('none'); return null; }
        if (live) setGasDay(resolved);
        return loadArchiveDay(resolved);
      })
      .then((d) => { if (d && live) { setArchive(d); setStatus('ready'); } })
      .catch(() => { if (live) setStatus('none'); });
    return () => { live = false; };
  }, [date]);

  const rows = day.gasProductionData ?? [];
  const hasGas = rows.some((g) => (g.gas ?? 0) > 0);

  useEffect(() => {
    if (hasGas || !gasDay || gasDay === date) { setFb(null); return; }
    let live = true;
    fetchDailyReport(gasDay).then((res) => {
      if (!live) return;
      const g = res.ok ? res.data.gasProductionData ?? [] : [];
      setFb(g.some((x) => (x.gas ?? 0) > 0) ? { production: g, distribution: res.ok ? res.data.gasDistributionData ?? [] : [] } : null);
    });
    return () => { live = false; };
  }, [hasGas, gasDay, date]);

  const prod = fb?.production ?? rows;
  const dist = fb?.distribution ?? day.gasDistributionData ?? [];
  return {
    archive, gasDay, status, prod, dist, fallback: !!fb,
    totalGas: prod.reduce((s, g) => s + (g.gas ?? 0), 0),
    totalCond: prod.reduce((s, g) => s + (g.condensate ?? 0), 0),
  };
}

export const keyOf = (label: string) => label.toUpperCase().split(/[\s(]/)[0];
export const prodColor = (label: string) => PRODUCER_COLORS[keyOf(label)]?.accent ?? 'var(--gp-primary)';
export const distColor = (label: string) => DISTRIBUTOR_COLORS[keyOf(label)]?.accent ?? 'var(--gp-primary)';

const num = (v: number | null | undefined, dp = 1) => (isNum(v) ? fmt(v, dp) : '—');
const pct = (v: number | null | undefined) => (isNum(v) ? `${v.toFixed(1)}%` : '—');

function Marks({ items }: { items: [string, 'P' | 'D'][] }) {
  return <div className="gpg-marks">{items.map(([l, k]) => <span key={l}>{l}<Prov kind={k} /></span>)}</div>;
}

export function ProductionSheet({ label, fields, grand, color }: { label: string; fields: ProductionField[]; grand: ProductionField | null; color: string }) {
  const sum = (p: (f: ProductionField) => number | null | undefined) => fields.reduce((a, f) => a + (isNum(p(f)) ? (p(f) as number) : 0), 0);
  const sumIfAny = (p: (f: ProductionField) => number | null | undefined) => (fields.some((f) => isNum(p(f))) ? sum(p) : null);
  const gasSum = sum((f) => f.gas_mmcfd);
  const capSum = sum((f) => f.capacity_mmcfd);
  const wells = sum((f) => f.producing_wells);
  const cond = sum((f) => f.condensate_bbld);
  const util = capSum > 0 ? (gasSum / capSum) * 100 : null;
  const subCap = isNum(grand?.capacity_mmcfd) && grand!.capacity_mmcfd > 0 ? (gasSum / grand!.capacity_mmcfd) * 100 : sumIfAny((f) => f.pct_of_total_capacity);
  const subProd = isNum(grand?.gas_mmcfd) && grand!.gas_mmcfd > 0 ? (gasSum / grand!.gas_mmcfd) * 100 : sumIfAny((f) => f.pct_of_total_production);
  const max = Math.max(...fields.map((f) => Math.max(f.capacity_mmcfd || 0, f.gas_mmcfd || 0)), 1);
  const note = 'Computed from the field rows below.';
  return (
    <>
      <h3>{label}</h3>
      <p className="gp-sheet__sub">Per-field detail · Petrobangla Section I, production</p>
      <div className="gp-stats gp-stats--3" style={{ marginBottom: 12 }}>
        <Stat label="Fields" value={fields.length} prov="D" note={note} />
        <Stat label="Wells" value={wells} prov="D" note={note} />
        <Stat label="Capacity" value={capSum} unit="MMCFD" prov="D" note={note} />
        <Stat label="Gas" value={gasSum} unit="MMCFD" dp={1} prov="D" note={note} />
        <Stat label="Utilization" value={util == null ? null : Math.round(util)} unit="%" prov="D" note="Gas divided by capacity, summed over the fields." />
      </div>
      <Marks items={[['Wells', 'P'], ['Capacity', 'P'], ['Gas', 'P'], ['Condensate', 'P'], ['Utilization', 'D'], ['% of grand total', 'P']]} />
      <div className="gp-rows" style={{ margin: '0 -16px' }}>
        {fields.map((f) => {
          const u = isNum(f.gas_mmcfd) && isNum(f.capacity_mmcfd) && f.capacity_mmcfd > 0 ? (f.gas_mmcfd / f.capacity_mmcfd) * 100 : null;
          const operator = cleanFieldName(f.field).toLowerCase() === 'bangora' ? 'TULLOW' : f.operator;
          return (
            <Row
              key={f.id || f.field}
              sw={color}
              wrap
              name={cleanFieldName(f.field)}
              sub={<>{operator ? `${operator} · ` : ''}{num(f.producing_wells, 0)} wells · capacity {num(f.capacity_mmcfd, 0)} · condensate {num(f.condensate_bbld)} BBLD<br />{u != null ? `${u.toFixed(0)}% utilised · ` : ''}{pct(f.pct_of_total_capacity)} of total capacity · {pct(f.pct_of_total_production)} of total production</>}
              value={<>{num(f.gas_mmcfd)} <span className="gp-u">MMCFD</span></>}
              meter={isNum(f.gas_mmcfd) ? <MeterBar v={f.gas_mmcfd} max={max} cap={f.capacity_mmcfd || undefined} color={color} /> : undefined}
            />
          );
        })}
        <Row
          wrap top
          name={<>Sub-Total <Prov kind="D" note="Gas, condensate, wells and capacity are summed over the rows above; the two percentages are the field-group gas over Petrobangla’s grand-total capacity and production, as Petrobangla computes its own subtotal lines." /></>}
          sub={<>{fmt(wells)} wells · capacity {fmt(capSum)} · condensate {fmt(cond, 1)} BBLD<br />{util != null ? `${util.toFixed(0)}% utilised · ` : ''}{pct(subCap)} of total capacity · {pct(subProd)} of total production</>}
          value={<>{fmt(gasSum, 1)} <span className="gp-u">MMCFD</span></>}
        />
      </div>
    </>
  );
}

import { Meter } from './charts';
function MeterBar({ v, max, cap, color }: { v: number; max: number; cap?: number; color: string }) {
  return <Meter value={v} max={max} cap={cap} color={color} />;
}

function Status({ supply, demand }: { supply: number | null | undefined; demand: number | null | undefined }) {
  if (supply === 0) return <span className="gp-tag bad">Shut down</span>;
  if (isNum(supply) && isNum(demand) && demand > 0) {
    const m = (supply / demand) * 100;
    return <span className={`gp-tag ${m < 60 ? 'warn' : 'good'}`}>{m.toFixed(0)}% met</span>;
  }
  return <span className="gp-tag">—</span>;
}

export function DistributionSheet({ label, c, color }: { label: string; c: DistributionCompany; color: string }) {
  const plants = c.power_plants ?? [];
  const online = plants.filter((p) => isNum(p.supply_mmcfd) && p.supply_mmcfd > 0).length;
  const cov = isNum(c.power_demand_mmcfd) && isNum(c.power_supply_mmcfd) && c.power_demand_mmcfd > 0 ? (c.power_supply_mmcfd / c.power_demand_mmcfd) * 100 : null;
  const fert = c.fertilizer;
  const powerMet = c.power_demand_mmcfd > 0 ? `${((c.power_supply_mmcfd / c.power_demand_mmcfd) * 100).toFixed(0)}% met` : '—';
  return (
    <>
      <h3>{label}</h3>
      <p className="gp-sheet__sub">Per-plant detail · Petrobangla Section II, distribution</p>
      <div className="gp-stats gp-stats--3" style={{ marginBottom: 12 }}>
        <Stat label="Plants" value={plants.length} prov="D" note="Count of the plant rows below." />
        <Stat label="Online" value={online} detail={`of ${plants.length}`} prov="D" note="Plants whose supply is above zero." />
        <Stat label="Coverage" value={cov == null ? null : Math.round(cov)} unit="%" prov="D" note="Power supply divided by power demand." />
        <Stat label="Power demand" value={c.power_demand_mmcfd} unit="MMCFD" dp={1} prov="P" />
        <Stat label="Power supply" value={c.power_supply_mmcfd} unit="MMCFD" dp={1} prov="P" />
        <Stat label="Total" value={c.total_mmcfd} unit="MMCFD" dp={1} prov="P" />
      </div>
      <Marks items={[['Demand', 'P'], ['Supply', 'P'], ['Status', 'D']]} />
      <div className="gp-rows" style={{ margin: '0 -16px' }}>
        {plants.map((p, i) => (
          <Row key={`${p.name}-${i}`} sw={color} wrap name={p.name} sub={`demand ${num(p.demand_mmcfd)}`} value={<>{num(p.supply_mmcfd)} <span className="gp-u">MMCFD</span></>} small={<Status supply={p.supply_mmcfd} demand={p.demand_mmcfd} />} />
        ))}
        <Row wrap top name={<>Power Sub-Total <Prov kind="D" note="Petrobangla’s power demand and supply for this distributor, with the share met worked out here." /></>} sub={`demand ${num(c.power_demand_mmcfd)}`} value={<>{num(c.power_supply_mmcfd)} <span className="gp-u">MMCFD</span></>} small={powerMet} />
        <Row wrap name={`Fertilizer${fert?.company ? ` (${fert.company})` : ''}`} sub={`demand ${num(fert?.demand_mmcfd)}`} value={<>{num(fert?.supply_mmcfd)} <span className="gp-u">MMCFD</span></>} small={<Status supply={fert?.supply_mmcfd} demand={fert?.demand_mmcfd} />} />
        <Row wrap name="Industrial / Others & Supplementary" sub="demand not published" value={<>{num(c.others_supplementary_mmcfd)} <span className="gp-u">MMCFD</span></>} />
        <Row wrap name={<>Company Total <Prov kind="P" /></>} value={<>{num(c.total_mmcfd)} <span className="gp-u">MMCFD</span></>} />
      </div>
    </>
  );
}

const SEGMENTS: [string, string][] = [
  ['AB1', 'Ashuganj–Bakhrabad 1 (AB1)'], ['AB2', 'Ashuganj–Bakhrabad 2 (AB2)'], ['BB', 'Bakhrabad–Brahmanbaria (BB)'],
  ['VS3', 'Valve Station 3 (VS3)'], ['AM', 'Ashuganj–Monohardi (AM)'], ['BD', 'Bakhrabad–Demra (BD)'],
];
const PRODUCTS: [keyof NonNullable<NonNullable<PetrobanglaDaily['sgfl']>['products']>, string, string][] = [
  ['ngl', 'NGL Feed', 'BBLD'], ['lpg', 'LPG', 'Kg'], ['ms', 'Petrol (MS)', 'BBLD'], ['octane', 'Octane', 'BBLD'],
  ['kerosene', 'Kerosene', 'BBLD'], ['diesel', 'Diesel', 'BBLD'], ['hsd', 'HSD', 'BBLD'],
];

export type Kpi = { id: string; name: string; sub: string; value: string; sheet: React.ReactNode };

function Cite({ gasDay, file }: { gasDay: string; file?: string | null }) {
  return (
    <div className="gpg-cite">
      Petrobangla Daily Gas Intake/Offtake Report · I. Production<br />
      Gas-day: {gasDay}<br />
      {file ? <>File {file}<br /></> : null}
      From <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer">petrobangla.org.bd</a>
    </div>
  );
}

/** The three Petrobangla KPI tiles. Each exists only when its own data does. */
export function gasKpis(day: PetrobanglaDaily, gasDay: string): Kpi[] {
  const out: Kpi[] = [];
  const file = day.meta?.source_filename ?? null;
  const dv = day.distribution?.diversity;
  const gt = getDistributionGrandTotal(day);
  const adj = dv?.power_demand_adjusted_mmcfd ?? null;
  const adjF = dv?.fertilizer_demand_adjusted_mmcfd ?? null;
  if (adj != null) {
    const gap = adj - gt.power_supply_mmcfd;
    const cov = adj > 0 ? (gt.power_supply_mmcfd / adj) * 100 : null;
    out.push({
      id: 'gap', name: 'Adjusted Power-Gas Gap', sub: 'Daily · demand after diversity factor, less supply',
      value: `${fmt(Math.max(0, gap), 1)} MMCFD`,
      sheet: (
        <>
          <h3>Diversity-Adjusted Demand</h3>
          <p className="gp-sheet__sub">Adjusted Power-Gas Gap · Daily</p>
          <div className="gpg-kv"><span>Raw plant demand</span><b>{fmt(gt.power_demand_mmcfd, 1)} MMCFD</b></div>
          <div className="gpg-kv"><span>Diversity factor</span><b>× {dv?.factor ?? '—'}</b></div>
          <div className="gpg-kv"><span>Realistic demand</span><b>{fmt(adj, 1)} MMCFD</b></div>
          <div className="gpg-kv"><span>Actual supply</span><b>{fmt(gt.power_supply_mmcfd, 1)} MMCFD</b></div>
          {cov != null && <div className="gpg-kv"><span>Coverage</span><b style={{ color: cov < 60 ? 'var(--gp-bad)' : 'var(--gp-good)' }}>{cov.toFixed(1)}%</b></div>}
          {adjF != null && <div className="gpg-kv"><span>Fertilizer (adj / supplied)</span><b>{fmt(adjF, 0)} / {fmt(gt.fertilizer_supply_mmcfd, 1)} MMCFD</b></div>}
          <p className="gpg-note">Petrobangla’s own diversity factor discounts simultaneous peak demand. The gap is shown as zero when supply exceeds the adjusted demand.</p>
          <Cite gasDay={gasDay} file={file} />
        </>
      ),
    });
  }
  const pr = day.sgfl?.products;
  const prRows = PRODUCTS.filter(([k]) => isNum(pr?.[k]));
  if (pr && prRows.length) {
    out.push({
      id: 'sgfl', name: 'SGFL Plant Output', sub: 'Daily · liquid fuels from condensate and NGL',
      value: isNum(pr.ms) ? `${fmt(pr.ms, 0)} BBLD MS` : isNum(pr.lpg) ? `${fmt(pr.lpg, 1)} Kg LPG` : '—',
      sheet: (
        <>
          <h3>SGFL Production (fractionation)</h3>
          <p className="gp-sheet__sub">SGFL Plant Output · Daily</p>
          {prRows.map(([k, l, u]) => <div className="gpg-kv" key={k}><span>{l}</span><b>{fmt(pr[k] as number, k === 'lpg' ? 2 : 1)} {u}</b></div>)}
          <p className="gpg-note">Condensate and NGL fractionated into liquid fuels at RPGCL/SGFL plants.</p>
          <Cite gasDay={gasDay} file={file} />
        </>
      ),
    });
  }
  const m = day.sgfl?.pipeline_metrics;
  const segs = SEGMENTS.filter(([k]) => isNum(m?.[k]));
  const total = day.sgfl?.pipeline_total ?? (segs.length ? segs.reduce((s, [k]) => s + (m?.[k] ?? 0), 0) : null);
  if (total != null && segs.length) {
    out.push({
      id: 'ns', name: 'N-S Trunkline Flow', sub: 'Daily · north-south pipeline deliveries',
      value: `${fmt(total, 1)} MMCFD`,
      sheet: (
        <>
          <h3>North-South Pipeline Deliveries</h3>
          <p className="gp-sheet__sub">N-S Trunkline Flow · Daily</p>
          {segs.map(([k, l]) => <div className="gpg-kv" key={k}><span>{l}</span><b>{fmt(m?.[k] ?? 0, 1)} MMCFD</b></div>)}
          <p className="gpg-note">GTCL trunkline segment deliveries from the NS-RA metering section.</p>
          <Cite gasDay={gasDay} file={file} />
        </>
      ),
    });
  }
  return out;
}

export const GLOSSARY: [string, string][] = [
  ['MMCFD', 'Million Standard Cubic Feet per Day. Standard unit of gas volume flow rate.'],
  ['BBL (Barrel of Oil)', 'Standard unit of volume for crude oil and petroleum products (1 BBL = 42 US gallons or ~159 liters).'],
  ['LNG (Liquefied Natural Gas)', 'Natural gas cooled to liquid state (-162°C) for shipping, then regasified back into the grid.'],
  ['BGFCL / SGFL / BAPEX', 'National gas production state companies (Bangladesh Gas Fields, Sylhet Gas Fields, and BAPEX exploration).'],
  ['TGTDCL / BGDCL / KGDCL', 'Gas distribution companies (Titas Gas, Bakhrabad Gas, and Karnaphuli Gas Distribution).'],
  ['RPGCL', 'Rupantarita Prakritik Gas Company Limited, responsible for gas imports and LNG terminal operations.'],
];

export function GlossarySheet() {
  return (
    <>
      <h3>Gas sector acronyms &amp; units</h3>
      <dl className="gpg-glossary" style={{ margin: 0 }}>
        {GLOSSARY.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </>
  );
}
