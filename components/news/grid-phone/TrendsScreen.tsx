'use client';

import { useState, type ReactNode } from 'react';
import { usePhone } from './context';
import { Bars, fmt, Legend, LineChart, StackArea } from './charts';
import type { MonthlyRow } from './useGridPhoneData';
import { isNum, monthLabel, Prov, Section, wd } from './shared';

type K = 'peak' | 'energy' | 'fuel' | 'gap';
const RANGES = [
  ['2 years', 24],
  ['5 years', 60],
  ['Since 2013', 0],
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

export function TrendsScreen() {
  const { monthly, week, weekDates, date } = usePhone();
  const [k, setK] = useState<K>('peak');
  const [range, setRange] = useState<number>(24);
  const [i, setI] = useState<number | null>(null);
  const [wi, setWi] = useState<number | null>(null);
  const rows = (monthly ?? []).filter((m) => /^\d{4}-\d{2}$/.test(m.date_key)).sort((a, b) => a.date_key.localeCompare(b.date_key));
  const shown = range ? rows.slice(-range) : rows;
  const labels = shown.map((m) => monthLabel(m.date_key));
  const at = i ?? shown.length - 1;
  const cur = shown[at];

  let kicker = '';
  let big: ReactNode = '—';
  let unit = '';
  let sub: ReactNode = null;
  let chart: ReactNode = null;
  let legend: ReactNode = null;
  if (cur) {
    const ml = monthLabel(cur.date_key);
    if (k === 'peak') {
      kicker = `Highest evening peak · ${ml}`;
      big = fmt(cur.max_evening_peak_gen);
      unit = 'MW';
      sub = <>Peak demand <b>{fmt(cur.max_evening_peak_demand)}</b> MW</>;
      chart = (
        <LineChart ariaLabel="Monthly peak generation and demand" labels={labels} onScrub={setI}
          series={[{ values: shown.map((m) => m.max_evening_peak_gen), color: 'var(--gp-primary)', fill: true, width: 2.25 }, { values: shown.map((m) => m.max_evening_peak_demand), color: 'var(--gp-demand)', width: 2 }]}
          band={{ upper: 1, lower: 0, color: 'var(--gp-bad)' }} />
      );
      legend = <Legend items={[{ label: 'Peak generation', color: 'var(--gp-primary)', line: true }, { label: 'Peak demand', color: 'var(--gp-demand)', line: true }, { label: 'Demand not met', color: 'var(--gp-bad)' }]} />;
    } else if (k === 'energy') {
      kicker = `Net generation · ${ml}`;
      big = fmt(cur.total_net_generation);
      unit = 'MKWh';
      chart = <LineChart ariaLabel="Monthly net generation" labels={labels} onScrub={setI} series={[{ values: shown.map((m) => m.total_net_generation), color: '#16a34a', fill: true, width: 2.25 }]} />;
    } else if (k === 'fuel') {
      const present = FUELS.filter(([key]) => shown.some((m) => isNum(m.generation_by_fuel?.[key]) && (m.generation_by_fuel![key] as number) > 0));
      const tot = (m: MonthlyRow) => present.reduce((a, [key]) => a + (m.generation_by_fuel?.[key] ?? 0), 0) || 1;
      const ranked = present.map(([key, l]) => [l, cur.generation_by_fuel?.[key] ?? null] as const).filter(([, v]) => isNum(v)).sort((a, b) => (b[1] as number) - (a[1] as number));
      kicker = `Largest fuel · ${ml}`;
      big = ranked[0] ? `${(((ranked[0][1] as number) / tot(cur)) * 100).toFixed(0)}%` : '—';
      unit = ranked[0] ? String(ranked[0][0]).toLowerCase() : '';
      sub = ranked.slice(1, 4).map(([l, v], j) => <span key={l}>{j ? ' · ' : ''}{l} <b>{(((v as number) / tot(cur)) * 100).toFixed(0)}%</b></span>);
      chart = <StackArea ariaLabel="Monthly generation by fuel" labels={labels} groups={present.map(([, l, c]) => ({ name: l, color: c }))} rows={shown.map((m) => present.map(([key]) => m.generation_by_fuel?.[key] ?? 0))} onScrub={setI} />;
      legend = <Legend items={present.map(([, l, c]) => ({ label: l, color: c }))} />;
    } else {
      const gap = shown.map((m) => (isNum(m.max_evening_peak_demand) && isNum(m.max_evening_peak_gen) ? m.max_evening_peak_demand - m.max_evening_peak_gen : null));
      kicker = `Peak demand above peak generation · ${ml}`;
      big = fmt(gap[at]);
      unit = 'MW';
      chart = <LineChart ariaLabel="Monthly gap between peak demand and peak generation" labels={labels} onScrub={setI} series={[{ values: gap, color: 'var(--gp-bad)', fill: true, width: 2.25 }]} />;
    }
  }

  const weekPeaks = week.map((d) => d?.systemStats.eveningPeakGen ?? null);
  const wsel = wi ?? weekDates.indexOf(date);
  return (
    <div className="gp-screen">
      <section className="gp-sec" aria-label="Monthly trends">
        <div className="gp-tabs" role="tablist">
          {([['peak', 'Peak'], ['energy', 'Energy'], ['fuel', 'Fuel mix'], ['gap', 'Shortfall']] as const).map(([key, l]) => (
            <button key={key} role="tab" aria-selected={k === key} className={k === key ? 'is-on' : ''} onClick={() => { setK(key); setI(null); }}>{l}</button>
          ))}
        </div>
        <div className="gp-kicker"><span>{kicker}</span></div>
        <div className="gp-hero"><b>{big}</b><small>{unit}</small></div>
        <div className="gp-subline">{sub}</div>
        {monthly ? chart : <div className="gp-skel" style={{ height: 240, marginTop: 16 }} />}
        {legend}
        <div className="gp-seg gp-seg--spaced">
          {RANGES.map(([l, n]) => (
            <button key={l} className={range === n ? 'is-on' : ''} onClick={() => { setRange(n); setI(null); }}>{l}</button>
          ))}
        </div>
        <div className="gp-sec__foot">
          PGCB monthly System Operation Report
          {k === 'gap' || k === 'fuel' ? <Prov kind="D" note={k === 'gap' ? 'Peak demand minus peak generation, both as PGCB printed them for the month. The two peaks need not fall on the same day.' : 'Each fuel’s share of the month’s generation by fuel, as PGCB printed it.'} /> : <Prov kind="P" />}
        </div>
      </section>

      {weekPeaks.filter(isNum).length > 1 && (
        <Section title="Evening peak, day by day" desc="Tap a bar" source="PGCB daily reports">
          <div className="gp-kicker"><span>{weekDates[wsel] ? `${wd(weekDates[wsel])} ${weekDates[wsel]}` : ''}</span></div>
          <div className="gp-hero gp-hero--md"><b>{fmt(weekPeaks[wsel])}</b><small>MW</small></div>
          <div className="gp-plot">
            <Bars ariaLabel="Evening peak by day" values={weekPeaks} labels={weekDates.map(wd)} color="var(--gp-primary)" highlight={wsel} height={180} onPick={setWi} />
          </div>
        </Section>
      )}
    </div>
  );
}
