'use client';

import { useState } from 'react';
import type { GridDailyData } from '@/lib/data/grid/types';
import { Bars, fmt, Legend, LineChart, StackArea } from './charts';
import type { MonthlyRow } from './useGridPhoneData';
import { isNum, monthLabel, Prov, Source, wd } from './shared';

type K = 'peak' | 'energy' | 'fuel' | 'gap';
const RANGES = [
  ['2Y', 24],
  ['5Y', 60],
  ['All', 0],
] as const;
const FUELS: [string, string, string][] = [
  ['gas', 'Gas', '#0ea5e9'],
  ['coal', 'Coal', '#64748b'],
  ['import', 'Imports', '#a855f7'],
  ['hfo', 'HFO', '#f97316'],
  ['diesel', 'Diesel', '#ef4444'],
  ['hydro', 'Hydro', '#06b6d4'],
  ['solar', 'Solar', '#eab308'],
  ['wind', 'Wind', '#22c55e'],
];

export function TrendsScreen({ monthly, week, weekDates, date }: { monthly: MonthlyRow[] | null; week: (GridDailyData | null)[]; weekDates: string[]; date: string }) {
  const [k, setK] = useState<K>('peak');
  const [range, setRange] = useState<number>(24);
  const [i, setI] = useState<number | null>(null);
  const rows = (monthly ?? []).filter((m) => /^\d{4}-\d{2}$/.test(m.date_key)).sort((a, b) => a.date_key.localeCompare(b.date_key));
  const shown = range ? rows.slice(-range) : rows;
  const labels = shown.map((m) => monthLabel(m.date_key));
  const at = i ?? shown.length - 1;
  const cur = shown[at];

  let big: React.ReactNode = '—';
  let sub: React.ReactNode = null;
  let chart: React.ReactNode = null;
  let legend: React.ReactNode = null;
  if (cur) {
    if (k === 'peak') {
      big = <>{fmt(cur.max_evening_peak_gen)}<small>MW</small></>;
      sub = `Highest evening peak in ${monthLabel(cur.date_key)} · demand ${fmt(cur.max_evening_peak_demand)} MW`;
      chart = (
        <LineChart ariaLabel="Monthly peak generation and demand" labels={labels} height={200} onScrub={setI}
          series={[{ values: shown.map((m) => m.max_evening_peak_gen), color: 'var(--gp-primary)', fill: true }, { values: shown.map((m) => m.max_evening_peak_demand), color: 'var(--gp-demand)', width: 2 }]}
          band={{ upper: 1, lower: 0, color: 'var(--gp-bad)' }} />
      );
      legend = <Legend items={[{ label: 'Peak generation', color: 'var(--gp-primary)', line: true }, { label: 'Peak demand', color: 'var(--gp-demand)', line: true }, { label: 'Gap', color: 'var(--gp-bad)' }]} />;
    } else if (k === 'energy') {
      big = <>{fmt(cur.total_net_generation)}<small>MKWh</small></>;
      sub = `Net generation in ${monthLabel(cur.date_key)}`;
      chart = <LineChart ariaLabel="Monthly net generation" labels={labels} height={200} onScrub={setI} series={[{ values: shown.map((m) => m.total_net_generation), color: '#22c55e', fill: true }]} />;
    } else if (k === 'fuel') {
      const present = FUELS.filter(([key]) => shown.some((m) => isNum(m.generation_by_fuel?.[key]) && (m.generation_by_fuel![key] as number) > 0));
      const tot = (m: MonthlyRow) => present.reduce((a, [key]) => a + (m.generation_by_fuel?.[key] ?? 0), 0);
      const top = present.map(([key, l]) => [l, cur.generation_by_fuel?.[key] ?? null] as const).filter(([, v]) => isNum(v)).sort((a, b) => (b[1] as number) - (a[1] as number));
      big = top[0] ? <>{(((top[0][1] as number) / (tot(cur) || 1)) * 100).toFixed(0)}<small>% {String(top[0][0]).toLowerCase()}</small></> : '—';
      sub = `${monthLabel(cur.date_key)} · ${top.slice(1, 3).map(([l, v]) => `${l} ${(((v as number) / (tot(cur) || 1)) * 100).toFixed(0)}%`).join(' · ')}`;
      chart = <StackArea ariaLabel="Monthly generation by fuel" labels={labels} groups={present.map(([, l, c]) => ({ name: l, color: c }))} rows={shown.map((m) => present.map(([key]) => m.generation_by_fuel?.[key] ?? 0))} height={200} onScrub={setI} />;
      legend = <Legend items={present.map(([, l, c]) => ({ label: l, color: c }))} />;
    } else {
      const gap = shown.map((m) => (isNum(m.max_evening_peak_demand) && isNum(m.max_evening_peak_gen) ? m.max_evening_peak_demand - m.max_evening_peak_gen : null));
      big = <>{fmt(gap[at])}<small>MW</small></>;
      sub = `Peak demand above peak generation, ${monthLabel(cur.date_key)}`;
      chart = <LineChart ariaLabel="Monthly gap between peak demand and peak generation" labels={labels} height={200} onScrub={setI} series={[{ values: gap, color: 'var(--gp-bad)', fill: true }]} />;
    }
  }

  const weekPeaks = week.map((d) => d?.systemStats.eveningPeakGen ?? null);
  return (
    <div className="gp-screen">
      <section className="gp-card">
        <div className="gp-seg" role="tablist">
          {([['peak', 'Peak'], ['energy', 'Energy'], ['fuel', 'Fuel'], ['gap', 'Shortfall']] as const).map(([key, l]) => (
            <button key={key} role="tab" aria-selected={k === key} className={k === key ? 'is-on' : ''} onClick={() => { setK(key); setI(null); }}>{l}</button>
          ))}
        </div>
        <div className="gp-big">{big}</div>
        <div className="gp-sub">{sub}</div>
        <div className="gp-chart">{monthly ? chart : <div className="gp-skel" style={{ height: 200 }} />}</div>
        {legend}
        <div className="gp-seg" style={{ marginTop: 12, marginBottom: 0 }}>
          {RANGES.map(([l, n]) => (
            <button key={l} className={range === n ? 'is-on' : ''} onClick={() => { setRange(n); setI(null); }}>{l}</button>
          ))}
        </div>
        <Source>
          PGCB monthly System Operation Report{k === 'gap' || k === 'fuel' ? <Prov kind="D" note={k === 'gap' ? 'Peak demand minus peak generation, both as PGCB printed them for the month. The two peaks need not fall on the same day.' : 'Each fuel’s share of the month’s generation by fuel, as PGCB printed it.'} /> : <Prov kind="P" />}
        </Source>
      </section>

      {weekPeaks.filter(isNum).length > 1 && (
        <section className="gp-card">
          <div className="gp-h">Evening peak, day by day <span>MW</span></div>
          <Bars ariaLabel="Evening peak by day" values={weekPeaks} labels={weekDates.map(wd)} color="var(--gp-primary)" highlight={weekDates.indexOf(date)} height={120} />
          <Source>PGCB daily reports</Source>
        </section>
      )}
    </div>
  );
}
