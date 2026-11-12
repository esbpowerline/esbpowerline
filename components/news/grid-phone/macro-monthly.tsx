'use client';

/**
 * PGCB Monthly Archives: pick a month, read its headline figures, fuel mix and
 * zone peaks, then the long monthly trend. The seventeen-sheet detail under it
 * is still the desktop panel (macro-hosted.tsx).
 */

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { getLatestMonthlyDateKey, type PgcbMonthlySeriesRecord } from '@/lib/data/companies/pgcb';
import { usePgcbMonthlyEvents, usePgcbMonthlyRecord, usePgcbMonthlySeries } from '@/lib/data/companies/usePgcbMonthly';
import { PGCB_MONTHLY_VERIFICATION, staleRowsFor, monthLabel } from '@/lib/data/pgcb-monthly-verification';
import { REGIONAL_ZONE_COLORS } from '@/components/news/PowerGridChartUI';
import { SERIES_UNMAPPED } from '@/lib/data/grid/chart-palette';
import { StackBar } from './charts';
import { Prov, Section } from './shared';
import { Cell, InfoPill, useFuelColor, type MacroWindow } from './macro-kit';
import { MonthlyTrend } from './macro-monthly-trend';
import { HostedMonthlyDetail } from './macro-hosted';

const fuelName = (k: string) => (k === 'hfo' ? 'Furnace Oil (HFO)' : k === 'import' ? 'India Imports' : k.charAt(0).toUpperCase() + k.slice(1));

export function MacroMonthly({ win }: { win: MacroWindow }) {
  const { series, loading } = usePgcbMonthlySeries(true);
  const [key, setKey] = useState('');
  const latest = getLatestMonthlyDateKey(series);
  // Land on the newest month once the archive arrives, without clobbering a pick.
  useEffect(() => { if (!key && latest) setKey(latest); }, [key, latest]);
  const { record } = usePgcbMonthlyRecord(key, true);
  // The outage log is bigger than the rest of the month combined: it waits for a tap.
  const [eventsOpen, setEventsOpen] = useState(false);
  const { events, loading: eventsLoading } = usePgcbMonthlyEvents(key, eventsOpen);
  useEffect(() => { setEventsOpen(false); }, [key]);
  const fuelColor = useFuelColor();

  if (loading && series.length === 0) return <>{[96, 180, 260].map((h) => <div key={h} className="gp-skel" style={{ height: h }} aria-busy="true" />)}</>;

  const local = win.cut(series, 12);
  const cur: PgcbMonthlySeriesRecord | undefined = local.find((d) => d.date_key === key) || local[local.length - 1];
  // Pickers list the WHOLE archive so a visitor sees how far it goes; months outside the window are inert.
  const unlocked = new Set(local.map((d) => d.date_key));
  const years = Array.from(new Set(series.map((d) => d.year))).sort((a, b) => b - a);
  const months = series.filter((d) => d.year === cur?.year);
  const stale = staleRowsFor(key);

  const fuels = cur ? Object.entries(cur.generation_by_fuel).map(([name, val]) => ({ name, val, pct: (val / (cur.total_net_generation || 1)) * 100, color: fuelColor(name) })).filter((d) => d.val > 0).sort((a, b) => b.val - a.val) : [];
  // Zones come from the month's own file; never the previous month's while a new pick loads.
  const reg = record && record.date_key === cur?.date_key ? record : null;
  const zones = reg ? Object.entries(reg.regional_supply).map(([k, value]) => ({ k, name: k.charAt(0).toUpperCase() + k.slice(1), value, color: REGIONAL_ZONE_COLORS[k.toLowerCase()] ?? SERIES_UNMAPPED.light })).sort((a, b) => b.value - a.value) : [];
  const zoneTotal = zones.reduce((s, z) => s + z.value, 0);
  const zoneMax = Math.max(1, ...zones.map((z) => z.value));
  const period = cur ? `${cur.month} ${cur.year}` : '';
  const deficit = cur && cur.max_evening_peak_demand > cur.max_evening_peak_gen ? formatNumber(Math.round(cur.max_evening_peak_demand - cur.max_evening_peak_gen)) : 0;

  return (
    <>
      <Section title="Select Operating Period" desc={<><b>PGCB Monthly Operating Data:</b> This archive contains official, authenticated monthly reports from the Power Grid Company of Bangladesh (PGCB) from 2013 to 2026. Explore peak generation records, demand curves, fuel mix metrics, and regional maximum power flows.</>}>
        <p className="gpm-pickl">Year</p>
        <div className="gpm-years">
          {years.map((y) => {
            const first = local.find((d) => d.year === y);
            return <button key={y} type="button" disabled={!first} aria-pressed={cur?.year === y} className={cur?.year === y ? 'is-on' : ''} onClick={() => first && setKey(first.date_key)}>{y}</button>;
          })}
        </div>
        <p className="gpm-pickl" style={{ marginTop: 12 }}>Month</p>
        <div className="gpm-months" style={{ marginTop: 0 }}>
          {months.map((d) => (
            <button key={d.date_key} type="button" disabled={!unlocked.has(d.date_key)} aria-label={d.month} aria-pressed={cur?.date_key === d.date_key} className={cur?.date_key === d.date_key ? 'is-on' : ''} onClick={() => setKey(d.date_key)}>{d.month.slice(0, 3)}</button>
          ))}
        </div>
        <div className="gpm-pills">
          <InfoPill label="How these months were checked">
            <p>Every headline figure is read twice from PGCB&apos;s own report — once by fixed column position, once by finding the item&apos;s label and taking the number beside it. The two share no column knowledge, so a layout change breaks one and a reworded label breaks the other.</p>
            <p><strong>All {PGCB_MONTHLY_VERIFICATION.figuresCompared} figures agreed, none disagreed</strong> — across the {PGCB_MONTHLY_VERIFICATION.monthsWithLocalSource} of {series.length || PGCB_MONTHLY_VERIFICATION.monthsInArchive} months whose source report is held here. The remaining months are shown as published but have not been re-read this way.</p>
          </InfoPill>
        </div>
      </Section>

      {stale.length > 0 && (
        <div className="gpm-notice">
          <b>PGCB did not refresh {stale.length === 1 ? 'a figure' : 'these figures'} for this month.</b>
          {stale.map((r) => (
            <span key={r.field}>Its {r.field === 'max_evening_peak_gen' ? 'maximum evening peak generation' : 'maximum evening peak demand'} of {formatNumber(r.value)} MW is stamped by PGCB with a date in <strong>{monthLabel(r.occurred)}</strong>. </span>
          ))}
          The figure below is what PGCB published, reproduced unchanged — but it describes the earlier month, not this one. Every other item in the report is dated correctly.
        </div>
      )}

      <Section title={period} desc="Headline figures of the month" meta="Tracked since 2014">
        <div className="gp-stats">
          <Cell label="Max Peak Generation" prov="P" value={cur ? formatNumber(cur.max_evening_peak_gen) : 0} unit="MW" detail="Evening peak generation recorded" tone="primary" />
          <Cell label="Estimated Peak Demand" prov="P" value={cur ? formatNumber(cur.max_evening_peak_demand) : 0} unit="MW" detail="System operational peak demand" />
          <Cell label="Peak Deficit / Load Shed" prov="D" note="Estimated peak demand minus maximum peak generation, both as PGCB printed them for the month; zero when generation met demand." value={deficit} unit="MW" detail="Peak capacity deficit gap" tone="bad" />
          <Cell label="Total Net Energy" prov="P" value={cur ? formatNumber(cur.total_net_generation, 1) : 0} unit={<>MKWh<sup className="gpm-sup">r</sup></>} detail="Monthly total energy generation" tone="warn" />
        </div>
      </Section>

      <Section title="Energy Fuel Mix" desc={<>Net generation by fuel source in {period} (MKWh)</>} meta="Monthly">
        <div className="gp-hero gp-hero--md"><b>{cur ? formatNumber(cur.total_net_generation, 0) : '0'}</b><small>MKWh Net</small></div>
        <div style={{ margin: '10px 0 14px' }}><StackBar height={12} parts={fuels.map((f) => ({ key: f.name, value: f.val, color: f.color }))} /></div>
        <div className="gpm-shares">
          <div className="gpm-colhead"><span>Fuel Type</span><span>MKWh<Prov kind="P" /></span><span>Share<Prov kind="D" note="Each fuel’s generation over the month’s total net generation, as PGCB printed both." /></span></div>
          {fuels.map((f) => (
            <div key={f.name} className="gpm-share"><span><i style={{ background: f.color }} />{fuelName(f.name)}</span><b>{formatNumber(f.val, 1)}</b><em>{f.pct.toFixed(1)}%</em></div>
          ))}
        </div>
      </Section>

      <Section title="Regional Maximum Peak Supply" desc={<>Substation peak loads served by grid zone in {period} (MW) — Tracked since 2014</>} meta="Monthly">
        {zones.length ? (
          <div className="gpm-hbars">
            <div className="gpm-colhead"><span>Grid Zone</span><span /><span>MW<Prov kind="P" /></span><span>Share<Prov kind="D" note="Each zone’s peak load over the sum of the zones shown." /></span></div>
            {zones.map((z) => (
              <div key={z.k} className="gpm-hbar"><span>{z.name}</span><div><i style={{ width: `${(z.value / zoneMax) * 100}%`, background: z.color }} /></div><b>{formatNumber(z.value)}</b><em>{(zoneTotal > 0 ? (z.value / zoneTotal) * 100 : 0).toFixed(1)}%</em></div>
            ))}
          </div>
        ) : (
          <div className="gp-skel" style={{ height: 220 }} />
        )}
      </Section>

      <MonthlyTrend local={local} series={series} selectedKey={cur?.date_key ?? ''} />

      {record?.detail && record.date_key === key ? (() => {
        const [y, m] = key.split('-').map(Number);
        const prev = new Date(Date.UTC(y, m - 2, 1));
        return (
          <HostedMonthlyDetail detail={record.detail} monthLabel={`${record.detail.month} ${record.detail.year}`}
            prevMonthLabel={`${prev.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${prev.getUTCFullYear()}`}
            events={events} eventsLoading={eventsLoading} eventsOpened={eventsOpen} onLoadEvents={() => setEventsOpen(true)} />
        );
      })() : null}
    </>
  );
}
