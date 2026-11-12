'use client';

/**
 * PGCB's monthly workbook detail, drawn for the phone. Same `detail` block and
 * outage loader as the desktop's PgcbMonthlyDetail.tsx; every figure, label,
 * P/D mark and note it prints is here, re-laid as one card with sheet pills
 * (one per panel), ruled rows instead of boxed tiles, and a bottom sheet per
 * row instead of a wide table or a hover tooltip.
 */

import '@/app/grid-phone-macro-monthly.css';
import { useEffect, useState, type ReactNode } from 'react';
import type { PgcbCircleRow, PgcbMonthlyDetail, PgcbOutageEvent, PgcbSystemStat } from '@/lib/data/companies/pgcb';
import { Prov, Row, Section, useSheet } from './shared';
import { Cell, KV, Pills } from './macro-kit';
import { AssetPanel, Chg, FgmoPanel, L, OutagePanel, SERIES_A, SERIES_B, ShedPanel, Terms, f, pctChange } from './macro-monthly-detail-tables';

type View = 'rel' | 'shed' | 'owner' | 'area' | 'circle' | 'asset' | 'fgmo' | 'outage';

export function MacroMonthlyDetail({ detail, monthLabel, prevMonthLabel, events, eventsLoading, eventsOpened, onLoadEvents }: {
  detail: PgcbMonthlyDetail; monthLabel: string; prevMonthLabel: string;
  events: PgcbOutageEvent[]; eventsLoading: boolean; eventsOpened: boolean; onLoadEvents: () => void;
}) {
  const keyed = detail.system?.keyed ?? {};
  const views: { id: View; label: string }[] = [
    detail.system && { id: 'rel' as const, label: 'Reliability' },
    (detail.daily_load_shedding?.evening_peak?.length || detail.daily_load_shedding?.day_peak?.length) && { id: 'shed' as const, label: 'Load shed by zone' },
    detail.system && { id: 'owner' as const, label: 'By owner' },
    detail.area_supply_at_system_peak?.areas?.length && detail.area_max_load?.length && { id: 'area' as const, label: 'Area peaks' },
    (detail.unserved_energy || detail.tripping_outage) && { id: 'circle' as const, label: 'Grid circles' },
    (detail.substation_max_load?.length || detail.substation_voltage?.length || detail.transformer_loading?.length || detail.interruptions?.length) && { id: 'asset' as const, label: 'Substations' },
    detail.fgmo?.length && { id: 'fgmo' as const, label: 'FGMO' },
    (detail.outage_event_count ?? 0) > 0 && { id: 'outage' as const, label: 'Outage log' },
  ].filter(Boolean) as { id: View; label: string }[];
  const [sel, setSel] = useState(0);
  useEffect(() => { if (sel >= views.length) setSel(0); }, [sel, views.length]);
  const view = views[sel]?.id;
  const stale = detail.data_quality?.stale_current_month_figures ?? [];
  const STALE: Record<string, string> = {
    max_evening_peak_gen_mw: 'Maximum evening peak generation',
    max_evening_peak_demand_mw: 'Maximum evening peak demand',
    max_generation_mw: 'Maximum generation',
    max_load_shed_evening_mw: 'Maximum load shed at evening peak',
  };
  if (!views.length) return null;

  return (
    <Section title={`Month detail · ${monthLabel}`} desc={`Every sheet PGCB's workbook publishes for ${monthLabel}, one at a time`} meta="Monthly">
      {stale.length > 0 && (
        <div className="gpm-notice gpm-notice--in">
          <b>Source data note for {monthLabel}</b>
          PGCB&rsquo;s report prints {stale.length === 1 ? 'a figure' : `${stale.length} figures`} in the &ldquo;Current Month&rdquo; column carrying a date from an earlier month — the previous month&rsquo;s number appears to have been left in the cell. The published value is shown unchanged below, but it should not be read as {monthLabel}&rsquo;s own maximum.
          {stale.map((s) => <span key={s.key} style={{ display: 'block', marginTop: 4 }}><strong>{STALE[s.key] ?? s.key}</strong> {f(s.value, 2)} — dated {s.printed_date ?? '—'}</span>)}
        </div>
      )}
      <Pills items={views.map((v) => v.label)} sel={sel} onSel={setSel} label="Monthly sheets" />
      <div className="gpmd-body">
        {view === 'rel' && <Reliability keyed={keyed} prev={prevMonthLabel} monthLabel={monthLabel} />}
        {view === 'shed' && <ShedPanel detail={detail} monthLabel={monthLabel} />}
        {view === 'owner' && <Owner keyed={keyed} monthLabel={monthLabel} />}
        {view === 'area' && <AreaPeaks atPeak={detail.area_supply_at_system_peak!.areas} own={detail.area_max_load!} />}
        {view === 'circle' && <Circles detail={detail} prev={prevMonthLabel} />}
        {view === 'asset' && <AssetPanel detail={detail} monthLabel={monthLabel} />}
        {view === 'fgmo' && <FgmoPanel fgmo={detail.fgmo ?? []} />}
        {view === 'outage' && <OutagePanel events={events} loading={eventsLoading} expected={detail.outage_event_count ?? 0} opened={eventsOpened} onLoad={onLoadEvents} monthLabel={monthLabel} />}
      </div>
    </Section>
  );
}

/* 1 · Load shedding & reliability */
function Reliability({ keyed, prev, monthLabel }: { keyed: Record<string, PgcbSystemStat>; prev: string; monthLabel: string }) {
  const { days_load_shed_evening: de, max_load_shed_evening_mw: mx, min_load_shed_evening_mw: mn, monthly_load_factor_pct: lf, days_load_shed_day: dd } = keyed;
  const vs = `vs ${prev}`;
  return (
    <>
      <p className="gpmd-lede">How often supply fell short in {monthLabel}, against {prev}</p>
      <div className="gp-stats">
        <Cell label="Days with load shed" prov="P" value={de ? f(de.value) : '—'} unit="evening peaks" tone="bad"
          detail={<>{dd ? <span className="gpmd-line">{f(dd.value)} day peaks affected</span> : null}<Chg change={de ? pctChange(de.value, de.prev_month) : null} suffix={vs} /></>} />
        <Cell label="Max load shed" prov="P" value={mx ? f(mx.value) : '—'} unit="MW" tone="bad"
          detail={<>{mx?.when ? <span className="gpmd-line">Peak shortfall on {mx.when}</span> : null}<Chg change={mx ? pctChange(mx.value, mx.prev_month) : null} suffix={vs} /></>} />
        <Cell label="Min load shed" prov="P" value={mn ? f(mn.value) : '—'} unit="MW"
          detail={<>{mn?.when ? <span className="gpmd-line">Best evening peak, {mn.when}</span> : null}<Chg change={mn ? pctChange(mn.value, mn.prev_month) : null} suffix={vs} /></>} />
        <Cell label="Monthly load factor" prov="P" value={lf ? lf.value.toFixed(2) : '—'} unit="%"
          detail={<><span className="gpmd-line">Average load against peak demand</span><Chg change={lf ? pctChange(lf.value, lf.prev_month) : null} goodWhen="up" suffix={vs} /></>} />
      </div>
      <div className="gpm-pills">
        <Terms items={[
          ['Load shedding', 'deliberately cutting supply to part of the country because generation cannot meet demand. It is rationing, not a fault.'],
          ['Days with load shed', `how many days that month needed a cut at the evening peak. ${de ? f(de.value) : '—'} means it happened on that many separate days.`],
          ['Max / min load shed', 'the largest and smallest cut made at any evening peak in the month — the worst and best evening.'],
          ['Load factor', 'average demand as a percentage of peak demand. High means demand stayed near its peak all month; low means a short spike over a quiet baseline.'],
        ]} />
      </div>
    </>
  );
}

/* 3 · Generation by owner */
function Owner({ keyed, monthLabel }: { keyed: Record<string, PgcbSystemStat>; monthLabel: string }) {
  const open = useSheet();
  const owners = [
    { label: 'Generation Cos.', stat: keyed.net_generation_gencos_mkwh },
    { label: 'IPP', stat: keyed.net_generation_ipp_mkwh },
    { label: 'BPDB', stat: keyed.net_generation_bpdb_mkwh },
    { label: 'Rental', stat: keyed.net_generation_rental_mkwh },
    { label: 'REB', stat: keyed.net_generation_reb_mkwh },
  ].filter((o) => o.stat) as Array<{ label: string; stat: PgcbSystemStat }>;
  if (!owners.length) return <p className="gpmd-lede">This month&rsquo;s report lists no generation by owner.</p>;
  const total = owners.reduce((s, o) => s + o.stat.value, 0);
  const max = Math.max(...owners.map((o) => o.stat.value));
  const su = keyed.station_use_bpdb_mkwh;
  return (
    <>
      <p className="gpmd-lede">Net generation share, {monthLabel}</p>
      <div className="gpm-hbars">
        <div className="gpm-colhead"><span>Owner</span><span /><L k="P">MKWh</L><L k="D" note="Each owner's MKWh over the sum of the owners listed; PGCB prints no combined line.">Share</L></div>
        {owners.map((o) => (
          <button type="button" key={o.label} className="gpm-hbar gpmd-tap" onClick={() => open(<><h3>{o.label}</h3><p className="gp-sheet__sub">Net generation, {monthLabel}</p><div className="gpm-kvs">
            <KV label="Net generation" prov="P" value={`${f(o.stat.value, 1)} MKWh`} />
            <KV label="Share of net generation" prov="D" value={`${((o.stat.value / total) * 100).toFixed(1)}%`} />
            <KV label="Last month" prov="P" value={o.stat.prev_month != null ? `${f(o.stat.prev_month, 1)} MKWh` : '—'} />
          </div></>)}>
            <span>{o.label}</span><div><i style={{ width: `${(o.stat.value / max) * 100}%`, background: SERIES_A }} /></div><b>{f(o.stat.value, 1)}</b><em>{((o.stat.value / total) * 100).toFixed(1)}%</em>
          </button>
        ))}
      </div>
      <p className="gp-note">{su && `BPDB station use of ${f(su.value, 1)} MKWh is already deducted. `}Electricity imported from India is reported separately and is not counted in these shares.</p>
      <p className="gp-note"><Prov kind="P" /> Each owner&apos;s MKWh is PGCB&apos;s own published figure. <Prov kind="D" /> The percentage shares and the {f(total, 1)} MKWh they are taken against are ours — PGCB lists the owners separately and prints no combined line.</p>
      <div className="gpm-pills">
        <Terms items={[
          ['MKWh', `million kilowatt-hours — the energy actually produced over the month, not capacity. ${f(total, 1)} MKWh in total here.`],
          ['Net generation', 'output after the plant’s own consumption is subtracted, i.e. what reached the grid.'],
          ['Generation Cos.', 'state-owned generators such as NWPGCL, APSCL and EGCB.'],
          ['IPP', 'Independent Power Producers — privately owned plants selling to the grid under contract.'],
          ['BPDB', 'the Bangladesh Power Development Board’s own plants.'],
          ['REB / Rental', 'Rural Electrification Board plants, and short-term contracted rental capacity.'],
        ]} />
      </div>
    </>
  );
}

/* 5 · Coincident vs own maximum */
const canon = (k: string) => ({ chittagong: 'chattogram', comilla: 'cumilla', barisal: 'barishal' } as Record<string, string>)[k.toLowerCase()] ?? k.toLowerCase();
function AreaPeaks({ atPeak, own }: { atPeak: Array<{ key: string; area: string; load_mw: number }>; own: Array<{ key: string; area: string; load_mw: number; date?: string | null; hour?: string | null }> }) {
  const open = useSheet();
  const byKey = new Map(own.map((a) => [canon(a.key), a]));
  const rows = atPeak.map((a) => {
    const o = byKey.get(canon(a.key));
    const ownMw = o?.load_mw ?? null;
    return { area: a.area, coincident: a.load_mw, own: ownMw, gap: ownMw === null ? null : Math.max(0, ownMw - a.load_mw), when: o ? [o.date, o.hour].filter(Boolean).join(' ') : null };
  }).sort((x, y) => (y.own ?? y.coincident) - (x.own ?? x.coincident));
  const scale = Math.max(...rows.map((r) => r.own ?? r.coincident), 1);
  const tc = rows.reduce((s, r) => s + r.coincident, 0);
  const to = rows.reduce((s, r) => s + (r.own ?? r.coincident), 0);
  const gap = to - tc;
  const widest = rows.reduce((b, r) => ((r.gap ?? 0) > (b.gap ?? 0) ? r : b), rows[0]);
  return (
    <>
      <p className="gpmd-lede">Two different peaks, often confused for each other</p>
      <div className="gp-stats gp-stats--3">
        <Cell label="Sum at system peak" prov="D" value={f(tc)} unit="MW" detail="all at once" />
        <Cell label="Sum of area peaks" prov="D" value={f(to)} unit="MW" detail="each at its own hour" />
        <Cell label="Diversity" prov="D" value={f(gap)} unit="MW" tone="warn" detail={`never needed together (${((gap / tc) * 100).toFixed(1)}%)`} />
      </div>
      <div className="gpm-key" style={{ marginTop: 12 }}>
        <span><i style={{ background: SERIES_A }} />Drawn at the national peak</span>
        <span><i style={{ background: SERIES_B }} />Extra at the area&rsquo;s own peak</span>
      </div>
      <p className="gp-note" style={{ marginTop: 4 }}>Bar length = the area&rsquo;s own maximum. Tap an area for its hour.</p>
      <div className="gpmd-areas">
        {rows.map((r) => {
          const o = r.own ?? r.coincident;
          const gp = r.coincident > 0 && r.gap !== null ? (r.gap / r.coincident) * 100 : null;
          return (
            <button type="button" key={r.area} className="gpmd-area" onClick={() => open(<><h3>{r.area}</h3><p className="gp-sheet__sub">Coincident load against the area&rsquo;s own maximum</p><div className="gpm-kvs">
              <KV label="Own peak" prov="P" value={`${f(o)} MW`} sub={r.when || undefined} />
              <KV label="At the national peak" prov="P" value={`${f(r.coincident)} MW`} />
              <KV label="More at its own peak" prov="D" value={r.gap === null ? '—' : `+${f(r.gap)} MW`} sub={gp !== null ? `${gp.toFixed(1)}% beyond its share of the national peak` : undefined} />
            </div></>)}>
              <div className="gpmd-area__t"><span>{r.area}</span><span><b>{f(o)}</b> MW{gp !== null && <em style={{ color: SERIES_B }}> +{f(r.gap)} ({gp.toFixed(1)}%)</em>}</span></div>
              <div className="gpmd-dual"><div style={{ width: `${(o / scale) * 100}%` }}><i style={{ width: `${o > 0 ? (r.coincident / o) * 100 : 0}%`, background: SERIES_A }} /><i style={{ flex: 1, background: SERIES_B }} /></div></div>
            </button>
          );
        })}
      </div>
      <p className="gp-note"><strong>Why the parts exceed the whole.</strong> The blue segment is what an area was drawing at the single instant the national peak occurred. The orange segment is the extra it reached at some other hour, on its own busiest day — so the two segments together are that area&rsquo;s own maximum. Because areas do not all peak at the same moment, adding up their individual maxima ({f(to)} MW) overstates what the grid must supply at once ({f(tc)} MW). That {f(gap)} MW difference is <strong>diversity</strong>, and it is real capacity the country never has to build.{widest?.gap ? <> <strong>{widest.area}</strong> is the most out of step this month, peaking {f(widest.gap)} MW above its national-peak draw.</> : null}</p>
      <p className="gp-note"><Prov kind="P" /> Both readings per area — what it drew at the national peak, and its own maximum with the date and hour it happened — are PGCB&apos;s published figures. <Prov kind="D" /> The two totals, the diversity between them and its percentage are ours. PGCB prints no combined figure for either column, and none for the gap; the whole comparison is arithmetic on their numbers.</p>
    </>
  );
}

/* 4 · Grid circle reliability */
function Circles({ detail, prev }: { detail: PgcbMonthlyDetail; prev: string }) {
  const open = useSheet();
  const [m, setM] = useState<'unserved' | 'tripping'>(detail.unserved_energy ? 'unserved' : 'tripping');
  const src = m === 'unserved' ? detail.unserved_energy : detail.tripping_outage;
  const unit = m === 'unserved' ? 'MWh' : 'count';
  const dg = m === 'unserved' ? 1 : 0;
  const tot = src?.total && 'current' in src.total ? (src.total as PgcbCircleRow) : null;
  const sheet = (r: PgcbCircleRow, name: string) => open(<><h3>{name}</h3><p className="gp-sheet__sub">{m === 'unserved' ? 'Unserved energy (MWh)' : 'Tripping & outage incidents (count)'}</p><div className="gpm-kvs">
    <KV label="Tripping" prov="P" value={f(r.current.tripping, dg)} />
    <KV label="Emergency" prov="P" value={f(r.current.emergency, dg)} />
    <KV label="Scheduled" prov="P" value={f(r.current.scheduled, dg)} />
    <KV label={`Total (${unit})`} prov="P" value={f(r.current.total, dg)} />
    <KV label={prev} value={f(r.previous.total, dg)} />
    <KV label="Change" prov="D" value={pctChange(r.current.total, r.previous.total) == null ? '—' : <Chg change={pctChange(r.current.total, r.previous.total)} />} />
  </div></>);
  const line = (r: PgcbCircleRow, name: string, bold?: boolean) => (
    <Row key={name} name={bold ? <b>{name}</b> : name} sub={`Trip ${f(r.current.tripping, dg)} · Emerg ${f(r.current.emergency, dg)} · Sched ${f(r.current.scheduled, dg)}`}
      value={f(r.current.total, dg)} small={<Chg change={pctChange(r.current.total, r.previous.total)} />} onClick={() => sheet(r, name)} />
  );
  return (
    <>
      {detail.unserved_energy && detail.tripping_outage && (
        <div className="gp-seg" role="group" aria-label="Circle metric">
          <button type="button" className={m === 'unserved' ? 'is-on' : ''} onClick={() => setM('unserved')}>Unserved energy</button>
          <button type="button" className={m === 'tripping' ? 'is-on' : ''} onClick={() => setM('tripping')}>Tripping & outage</button>
        </div>
      )}
      <p className="gpmd-lede">{m === 'unserved' ? 'Energy that could not be delivered, by circle and cause' : 'Count of tripping and outage incidents, by circle and cause'}</p>
      <div className="gpm-colhead gpmd-colhead2"><span>Grid circle</span><span><L k="P">Total ({unit})</L> · <L k="D">vs {prev}</L></span></div>
      <div className="gp-rows">
        {(src?.circles ?? []).map((r) => line(r, r.circle))}
        {tot && line(tot, 'Total', true)}
      </div>
      <div className="gpm-pills">
        <Terms items={[
          ['Grid circle', 'PGCB’s maintenance regions for the transmission network. They do not line up exactly with the supply zones above.'],
          ['Unserved energy', 'electricity that could not be delivered, in megawatt-hours. Unlike load shedding this is caused by faults and maintenance, not by a supply shortfall.'],
          ['Tripping', 'equipment disconnecting itself automatically in response to a fault — unplanned.'],
          ['Emergency', 'an unplanned outage taken deliberately, e.g. to make an urgent repair.'],
          ['Scheduled', 'planned maintenance work. High scheduled numbers are usually a sign of upkeep, not of failure.'],
        ]} />
      </div>
    </>
  );
}
