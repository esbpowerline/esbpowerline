'use client';

/**
 * The long monthly trend: peaks, energy, or one fuel. The desktop's hover
 * tooltip becomes the rows under the plot; drag across the plot to move the
 * month they describe (it stays where the finger left it).
 */

import { useState } from 'react';
import { formatNumber } from '@/lib/utils';
import type { PgcbMonthlySeriesRecord } from '@/lib/data/companies/pgcb';
import { LineChart } from './charts';
import { monthLabel, Section } from './shared';
import { A, Foot, Key, KV, Readout, TablePill, useFuelColor, useSeriesColor } from './macro-kit';

type Metric = 'peaks' | 'energy' | 'fuels';
type FuelKey = 'gas' | 'coal' | 'hfo' | 'diesel' | 'import';
const FUELS: [FuelKey, string, string][] = [['gas', 'Gas', 'Gas'], ['coal', 'Coal', 'Coal'], ['hfo', 'Furnace Oil (HFO)', 'Furnace Oil (HFO)'], ['diesel', 'Diesel', 'Diesel'], ['import', 'Imports', 'India Imports']];

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
// The desktop tooltip's month length (MacroTrendsTab.tsx:1829), kept as written.
function daysInMonth(month: string, year: number) {
  const m = month.toLowerCase();
  if (['january', 'march', 'may', 'july', 'august', 'october', 'december'].includes(m)) return 31;
  if (['april', 'june', 'september', 'november'].includes(m)) return 30;
  if (m === 'february') return year % 4 === 0 ? 29 : 28;
  return 30;
}

export function MonthlyTrend({ local, series, selectedKey }: { local: PgcbMonthlySeriesRecord[]; series: PgcbMonthlySeriesRecord[]; selectedKey: string }) {
  const sc = useSeriesColor();
  const fuelColor = useFuelColor();
  const [metric, setMetric] = useState<Metric>('peaks');
  const [fuel, setFuel] = useState<FuelKey>('gas');
  const [picked, setPicked] = useState<{ key: string; i: number } | null>(null);
  const n = local.length;
  if (!n) return null;
  // The picked month follows the period picker until the reader drags the plot.
  const base = Math.max(0, local.findIndex((d) => d.date_key === selectedKey));
  const i = picked && picked.key === selectedKey && picked.i < n ? picked.i : selectedKey ? base : n - 1;
  const d = local[i];
  const labels = local.map((m) => monthLabel(m.date_key));
  const prev = local.find((m) => m.year === d.year - 1 && m.month === d.month);
  const yoy = (now: number, then: number | undefined) => (then != null && then > 0 ? ((now - then) / then) * 100 : null);
  const tone = (v: number | null) => (v == null ? undefined : v >= 0 ? 'good' as const : 'bad' as const);
  const fc = fuelColor(fuel);
  const fuelLabel = FUELS.find((f) => f[0] === fuel)![2];
  const onScrub = (j: number | null) => { if (j != null) setPicked({ key: selectedKey, i: j }); };
  const marker = { index: i, label: labels[i] };
  const src = series.find((m) => m.date_key === selectedKey) ?? series[series.length - 1];

  let head = null, chart = null, key = null, rows = null, table = null;
  if (metric === 'peaks') {
    const genYoY = yoy(d.max_evening_peak_gen, prev?.max_evening_peak_gen);
    const demYoY = yoy(d.max_evening_peak_demand, prev?.max_evening_peak_demand);
    const deficit = d.max_evening_peak_demand > d.max_evening_peak_gen ? Math.round(d.max_evening_peak_demand - d.max_evening_peak_gen) : 0;
    const deficitPct = d.max_evening_peak_demand > 0 ? (deficit / d.max_evening_peak_demand) * 100 : 0;
    const alert = deficit > 1000 ? ['bad', 'Severe Load Shedding Alert'] : deficit > 0 ? ['warn', 'Moderate Load Shedding Alert'] : ['good', 'Stable Grid Capacity'];
    head = <Readout kicker={`${d.month} ${d.year} · Grid Peak`} value={formatNumber(d.max_evening_peak_gen)} unit="MW max generation" sub={<span className={`gp-tag ${alert[0]}`}>{alert[1]}</span>} />;
    chart = <LineChart ariaLabel="PGCB monthly peak demand and generation, chart" labels={labels} onScrub={onScrub} marker={marker} min={0}
      series={[{ values: local.map((m) => m.max_evening_peak_demand), color: sc('peakGeneration'), fill: true, fillOpacity: 0.08, width: 1.5 }, { values: local.map((m) => m.max_evening_peak_gen), color: 'var(--gp-primary)', width: 2.5 }]} />;
    key = <Key items={[{ label: 'Estimated Peak Demand', color: sc('peakGeneration'), line: true }, { label: 'Maximum Peak Generation', color: 'var(--gp-primary)', line: true }]} />;
    rows = (
      <>
        <KV label="Max Generation" prov="P" value={`${formatNumber(d.max_evening_peak_gen)} MW`} tone="primary" sub={genYoY != null && <>YoY: <span className={`gpm-t-${tone(genYoY)}`}>{pct(genYoY)}</span></>} />
        <KV label="Peak Demand" prov="P" value={`${formatNumber(d.max_evening_peak_demand)} MW`} sub={demYoY != null && <>YoY: <span className={`gpm-t-${tone(demYoY)}`}>{pct(demYoY)}</span></>} />
        <KV label="Deficit Gap" value={`${formatNumber(deficit)} MW`} tone="bad" sub={deficit > 0 && <>Deficit Share: {deficitPct.toFixed(1)}%</>} />
      </>
    );
    table = <TablePill label="All months" title="Monthly peaks" sub="MW, as PGCB printed them" head={['Month', 'Estimated Peak Demand', 'Maximum Peak Generation']} rows={[...local].reverse().map((m) => [m.date_key, formatNumber(m.max_evening_peak_demand), formatNumber(m.max_evening_peak_gen)])} />;
  } else if (metric === 'energy') {
    const eYoY = yoy(d.total_net_generation, prev?.total_net_generation);
    const days = daysInMonth(d.month, d.year);
    const avgMW = (d.total_net_generation * 1000) / (days * 24);
    const c = sc('bdGasTariff');
    head = <Readout kicker={`${d.month} ${d.year} · Energy Net`} value={formatNumber(d.total_net_generation, 1)} unit="MKWh" />;
    chart = <LineChart ariaLabel="PGCB monthly energy generation, chart" labels={labels} onScrub={onScrub} marker={marker} min={0} series={[{ values: local.map((m) => m.total_net_generation), color: c, fill: true, width: 2.5 }]} />;
    key = <Key items={[{ label: 'Total Monthly Energy Generation (MKWh)', color: c, line: true }]} />;
    rows = (
      <>
        <KV label="Total Generation" prov="P" value={`${formatNumber(d.total_net_generation, 1)} MKWh`} tone="warn" sub={eYoY != null && <>YoY Growth: <span className={`gpm-t-${tone(eYoY)}`}>{pct(eYoY)}</span></>} />
        <KV label="Avg continuous dispatch" prov="D" note="The month’s net generation spread evenly over every hour of the month." value={`${formatNumber(Math.round(avgMW))} MW`} sub={<>Calculated across {days} operational days</>} />
      </>
    );
    table = <TablePill label="All months" title="Monthly energy generation" sub="MKWh, as PGCB printed it" head={['Month', 'Total Monthly Energy Generation']} rows={[...local].reverse().map((m) => [m.date_key, formatNumber(m.total_net_generation, 1)])} />;
  } else {
    const val = d.generation_by_fuel[fuel] ?? 0;
    const prevVal = prev ? prev.generation_by_fuel[fuel] || 0 : 0;
    const fYoY = prevVal > 0 ? ((val - prevVal) / prevVal) * 100 : null;
    const share = d.total_net_generation > 0 ? (val / d.total_net_generation) * 100 : 0;
    head = <Readout kicker={`${d.month} ${d.year} · ${fuelLabel}`} value={formatNumber(val, 1)} unit="MKWh" />;
    chart = <LineChart ariaLabel="PGCB monthly generation by fuel, chart" labels={labels} onScrub={onScrub} marker={marker} min={0} series={[{ values: local.map((m) => m.generation_by_fuel[fuel] ?? 0), color: fc, width: 2.5 }]} />;
    key = <Key items={[{ label: `${fuelLabel} Generation Trend (MKWh)`, color: fc, line: true }]} />;
    rows = (
      <>
        <KV label={fuelLabel} value={`${formatNumber(val, 1)} MKWh`} sw={fc} sub={fYoY != null && <>YoY Growth: <span className={`gpm-t-${tone(fYoY)}`}>{pct(fYoY)}</span></>} />
        <KV label="Share of Month Mix" prov="D" note="This fuel’s generation over the month’s total net generation." value={`${share.toFixed(1)}%`} />
        <KV label="Total Month Net" prov="P" value={`${formatNumber(d.total_net_generation, 1)} MKWh`} />
      </>
    );
    table = <TablePill label="All months" title={`Monthly generation from ${fuel}`} sub="MKWh, as PGCB printed it" head={['Month', `${fuel} generation`]} rows={[...local].reverse().map((m) => [m.date_key, formatNumber(m.generation_by_fuel[fuel] ?? 0, 1)])} />;
  }

  return (
    <Section title="PGCB 13-Year Historical Growth Trends" desc={<>Grid operational metrics charted monthly from 2013 to 2026 — the plotted values are PGCB&apos;s own (P), the year-on-year changes below are ours (D) • Tracked since January 2013</>} meta="Monthly">
      <div className="gp-tabs" role="tablist">
        {([['peaks', 'Grid Peaks'], ['energy', 'Energy'], ['fuels', 'Fuel Trends']] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={metric === id} className={metric === id ? 'is-on' : ''} onClick={() => setMetric(id)}>{l}</button>
        ))}
      </div>
      {metric === 'fuels' && (
        <div className="gpm-years" style={{ marginBottom: 12 }} aria-label="Fuel">
          {FUELS.map(([k, l]) => <button key={k} type="button" aria-pressed={fuel === k} className={fuel === k ? 'is-on' : ''} onClick={() => setFuel(k)}>{l}</button>)}
        </div>
      )}
      {head}
      {chart}
      {key}
      <div className="gpm-hint">Drag across the plot to read another month</div>
      <div className="gpm-kvs">{rows}</div>
      <div className="gpm-pills">{table}</div>
      <Foot>
        <span>Source: <A href="https://www.pgcb.gov.bd/">PGCB Monthly System Operation Reports</A></span>
        {src?.filename && <span>Read from: PGCB monthly report <code>{src.filename}</code></span>}
        <span className="gp-note">Peaks, demand, per-fuel energy and regional peak loads are PGCB&apos;s published monthly figures. The deficit, every share percentage and the month-on-month changes are ours, worked out from those. Each figure was read twice from the source report by two independent parsers; all 247 checked agreed.</span>
        {series.length > 0 && <span>Data Period: {series[0].month} {series[0].year} - {series[series.length - 1].month} {series[series.length - 1].year} ({series.length} Consecutive Reports)</span>}
      </Foot>
    </Section>
  );
}
