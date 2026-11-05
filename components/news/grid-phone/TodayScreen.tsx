'use client';

import { useState } from 'react';
import type { DailyPlantDetail, EnergyCurve, GridDailyData } from '@/lib/data/grid/types';
import { Bars, fmt, Legend, LineChart, Spark, StackArea } from './charts';
import { Delta, fuelPalette, isNum, maxShed, Prov, signed, Source, useSheet, wd, wholeHours } from './shared';
import { groupCurve } from './SupplyScreen';

type Metric = 'gen' | 'mix' | 'shed' | 'flow';

export function TodayScreen({
  date,
  day,
  prev,
  prevDate,
  week,
  weekDates,
  curve,
  plants,
}: {
  date: string;
  day: GridDailyData;
  prev: GridDailyData | null;
  prevDate: string | null;
  week: (GridDailyData | null)[];
  weekDates: string[];
  curve: EnergyCurve | null;
  plants: DailyPlantDetail | null;
}) {
  const open = useSheet();
  const s = day.systemStats;
  const [metric, setMetric] = useState<Metric>('gen');
  const [scrub, setScrub] = useState<{ eyebrow: string; big: number | null; unit?: string; sub: React.ReactNode } | null>(null);
  const hours = wholeHours(day.hourlyLoadData);
  const labels = hours.map((h) => h.time);
  const shed = maxShed(day);
  const pal = fuelPalette(day);
  const grouped = curve ? groupCurve(curve, true) : null;
  const ewic = day.ewicData && day.ewicData.rows?.length ? day.ewicData : null;
  const ewicTot = (r: { mw: (number | null)[] }) => (r.mw.every(isNum) ? (r.mw as number[]).reduce((a, v) => a + v, 0) : null);
  const ewicPeak = ewic ? Math.max(...ewic.rows.map(ewicTot).filter(isNum)) : null;
  const fcByHour = new Map((day.forecast?.hourly ?? []).map((h) => [h.time, h.generationMw]));

  const M: Record<Metric, { l: string; u: string; v: number | null; eyebrow: string; goodUp: boolean; card?: React.ReactNode; show: boolean }> = {
    gen: { l: 'Generation', u: 'MW', v: s.eveningPeakGen ?? null, eyebrow: `Evening peak${s.peakTimes?.eveningPeakGen ? ` · ${s.peakTimes.eveningPeakGen}` : ''}`, goodUp: true, show: true },
    mix: {
      l: 'Fuel mix', u: 'MW', v: s.eveningPeakGen ?? null, eyebrow: 'By fuel, hour by hour · drag to read', goodUp: true, show: !!grouped,
      card: (() => {
        const tot = (day.generationData ?? []).reduce((a, g) => a + (isNum(g.gen) ? g.gen : 0), 0);
        const top = [...(day.generationData ?? [])].sort((a, b) => b.gen - a.gen)[0];
        return top && tot ? <>{((top.gen / tot) * 100).toFixed(0)}<small>% {top.name.toLowerCase()}</small></> : '—';
      })(),
    },
    shed: { l: 'Load shed', u: 'MW', v: shed, eyebrow: 'Worst hour of load shedding', goodUp: false, show: true },
    flow: { l: 'East–West', u: 'MW', v: ewicPeak, eyebrow: 'Power sent across the Jamuna, busiest hour', goodUp: true, show: !!ewic },
  };
  const m = M[metric];
  const prevV: Record<Metric, number | null> = {
    gen: prev?.systemStats.eveningPeakGen ?? null,
    mix: prev?.systemStats.eveningPeakGen ?? null,
    shed: maxShed(prev),
    flow: prev?.ewicData?.rows?.length ? Math.max(...prev.ewicData.rows.map(ewicTot).filter(isNum)) : null,
  };

  const head = scrub ?? { eyebrow: m.eyebrow, big: m.v, sub: <Delta cur={m.v} prev={prevV[metric]} goodUp={m.goodUp} vs={prevDate ? wd(prevDate) : undefined} /> };

  let chart: React.ReactNode = null;
  let legend: React.ReactNode = null;
  if (metric === 'gen') {
    const gen = hours.map((h) => (isNum(h.generation) ? h.generation : null));
    const dem = hours.map((h) => (isNum(h.demand) ? h.demand : null));
    const fc = hours.map((h) => fcByHour.get(h.time) ?? null);
    const hasDemandCurve = dem.filter(isNum).length > 2;
    chart = (
      <LineChart
        ariaLabel="Generation, demand and forecast by hour"
        labels={labels}
        height={180}
        series={[
          { values: gen, color: 'var(--gp-primary)', fill: true },
          { values: hasDemandCurve ? dem : labels.map(() => null), color: 'var(--gp-demand)', width: 2 },
          { values: fc, color: 'var(--gp-fc)', dash: true, width: 1.5 },
        ]}
        band={hasDemandCurve ? { upper: 1, lower: 0, color: 'var(--gp-bad)' } : undefined}
        onScrub={(i) => {
          if (i == null) return setScrub(null);
          const h = hours[i];
          const f = fcByHour.get(h.time);
          setScrub({
            eyebrow: `At ${h.time}`,
            big: h.generation,
            sub: (
              <span>
                {isNum(h.demand) ? `Demand ${fmt(h.demand)}` : 'Demand not published for this hour'}
                {isNum(f) ? ` · forecast ${fmt(f)}` : ''}
                {isNum(h.loadShed) && h.loadShed > 0 ? <b style={{ color: 'var(--gp-bad)' }}> · {fmt(h.loadShed)} shed</b> : null}
              </span>
            ),
          });
        }}
      />
    );
    legend = (
      <Legend
        items={[
          { label: 'Generation', color: 'var(--gp-primary)', line: true },
          ...(hasDemandCurve ? [{ label: 'Demand', color: 'var(--gp-demand)', line: true }] : []),
          ...(fcByHour.size ? [{ label: 'PGCB forecast', color: 'var(--gp-fc)', line: true }] : []),
          ...(hasDemandCurve ? [{ label: 'Unmet demand', color: 'var(--gp-bad)' }] : []),
        ]}
      />
    );
  } else if (metric === 'mix' && grouped) {
    chart = (
      <StackArea
        ariaLabel="Generation by fuel, hour by hour"
        labels={grouped.labels}
        groups={grouped.groups.map((g) => ({ name: g, color: pal[g] }))}
        rows={grouped.rows}
        height={180}
        onScrub={(i) => {
          if (i == null) return setScrub(null);
          const r = grouped.rows[i];
          const order = grouped.groups.map((g, k) => [g, r[k]] as const).sort((a, b) => b[1] - a[1]);
          setScrub({ eyebrow: `At ${grouped.labels[i]}`, big: r.reduce((a, v) => a + v, 0), sub: order.slice(0, 3).map(([g, v]) => `${g} ${fmt(v)}`).join(' · ') });
        }}
      />
    );
    legend = <Legend items={grouped.groups.map((g) => ({ label: g, color: pal[g] }))} />;
  } else if (metric === 'shed') {
    const vals = hours.map((h) => (isNum(h.loadShed) ? h.loadShed : null));
    const published = hours.filter((h) => isNum(h.loadShed)).length;
    chart = published ? (
      <Bars ariaLabel="Load shedding by hour" values={vals} labels={hours.map((h, i) => (i % 6 === 0 ? h.time : ''))} color="var(--gp-bad)" height={140} />
    ) : (
      <div className="gp-empty" style={{ height: 140 }}>This report publishes load shedding for the evening peak only.</div>
    );
    legend = published ? (
      <Legend
        items={[
          { label: `${hours.filter((h) => isNum(h.loadShed) && h.loadShed > 0).length} of ${published} published hours had cuts`, color: 'var(--gp-bad)' },
          ...(isNum(s.totalEnergyUnserved) ? [{ label: `${fmt(s.totalEnergyUnserved, 2)} MKWh not supplied`, color: 'transparent' }] : []),
        ]}
      />
    ) : null;
  } else if (metric === 'flow' && ewic) {
    const cols = ['var(--gp-primary)', '#a855f7', 'var(--gp-demand)'];
    chart = (
      <LineChart
        ariaLabel="East-West interconnector flow by corridor"
        labels={ewic.rows.map((r) => r.time)}
        height={180}
        min={0}
        series={ewic.corridors.map((_, k) => ({ values: ewic.rows.map((r) => r.mw[k] ?? null), color: cols[k % 3], width: 2, fill: k === 0 }))}
        onScrub={(i) => {
          if (i == null) return setScrub(null);
          const r = ewic.rows[i];
          setScrub({ eyebrow: `At ${r.time}`, big: ewicTot(r), sub: ewic.corridors.map((c, k) => `${c.split('-')[0]} ${fmt(r.mw[k])}`).join(' · ') });
        }}
      />
    );
    legend = <Legend items={ewic.corridors.map((c, k) => ({ label: c.replace('-', '–'), color: cols[k % 3], line: true }))} />;
  }

  const sparks: Record<Metric, (number | null)[]> = {
    gen: hours.map((h) => h.generation ?? null),
    mix: grouped ? grouped.rows.map((r) => r[0]) : [],
    shed: hours.map((h) => h.loadShed ?? null),
    flow: ewic ? ewic.rows.map(ewicTot) : [],
  };
  const sparkColor: Record<Metric, string> = { gen: 'var(--gp-primary)', mix: pal.Coal, shed: 'var(--gp-bad)', flow: '#a855f7' };

  const ps = plants?.plants ?? [];
  const ran = ps.filter((p) => isNum(p.eveningPeakMw) && p.eveningPeakMw > 0).length;
  const outages = day.dailyOutages ?? [];

  type Tile = { k: string; l: string; v: (d: GridDailyData | null) => number | null; u: string; dp: number; goodUp: boolean; prefix?: string; prov: 'P' | 'D'; note?: string };
  const tiles: Tile[] = [
    { k: 'energy', l: 'Energy generated', v: (d) => d?.systemStats.totalEnergyGen ?? null, u: 'MKWh', dp: 1, goodUp: true, prov: 'P' },
    { k: 'unserved', l: 'Energy not supplied', v: (d) => d?.systemStats.totalEnergyUnserved ?? null, u: 'MKWh', dp: 2, goodUp: false, prov: 'P' },
    { k: 'unit', l: 'Cost per unit', v: (d) => d?.systemStats.avgProductionCost ?? null, u: 'Tk/kWh', dp: 2, goodUp: false, prov: 'P' },
    { k: 'cost', l: 'Cost of the day', v: (d) => (isNum(d?.systemStats.totalDailyCost) ? d!.systemStats.totalDailyCost! / 1e7 : null), u: 'Cr', dp: 0, goodUp: false, prefix: '৳', prov: 'D', note: 'PGCB prints the day’s fuel cost in taka; shown here in crore (÷ 10 million).' },
  ];
  const openWeek = (t: Tile) => {
    const vals = week.map((d) => t.v(d));
    open(<WeekSheet title={t.l} unit={t.u} dp={t.dp} prefix={t.prefix} dates={weekDates} values={vals} current={weekDates.indexOf(date)} />);
  };

  const fc = day.forecast;
  return (
    <div className="gp-screen">
      <section className="gp-card" aria-label="Headline">
        <div className="gp-eyebrow">
          <span>{head.eyebrow}</span>
          {shed == null ? null : shed > 0 ? <span className="gp-pill bad">● {fmt(shed)} MW short</span> : <span className="gp-pill good">● Demand met</span>}
        </div>
        <div className="gp-big">
          {fmt(head.big)}
          <small>{m.u}</small>
        </div>
        <div className="gp-sub">{head.sub}</div>
        <div className="gp-chart">{chart}</div>
        {legend}
        <div className="gp-metrics" role="tablist" aria-label="Chart">
          {(Object.keys(M) as Metric[]).filter((k) => M[k].show).map((k) => (
            <button key={k} role="tab" aria-selected={k === metric} className={`gp-m${k === metric ? ' is-on' : ''}`} onClick={() => { setMetric(k); setScrub(null); }}>
              <div className="gp-m__l">{M[k].l}</div>
              <div className="gp-m__v">{M[k].card ?? <>{fmt(M[k].v)}<small>{M[k].u}</small></>}</div>
              <div className="gp-m__s"><Spark values={sparks[k]} color={sparkColor[k]} height={24} /></div>
            </button>
          ))}
        </div>
        <Source>PGCB daily report · NLDC hourly sheet</Source>
      </section>

      <div className="gp-pills">
        {isNum(s.maxTemp) && <span className="gp-pill">🌡 {s.maxTemp}°C Dhaka</span>}
        <span className={`gp-pill${outages.length > 40 ? ' warn' : ''}`}>⚠ {outages.length} outages logged</span>
        {ps.length > 0 && <span className="gp-pill">⚙ {ran} of {ps.length} plants ran at peak</span>}
        {isNum(s.totalGasSuppliedPower) && <span className="gp-pill">🔥 {fmt(s.totalGasSuppliedPower)} MMCFD gas burned for power</span>}
      </div>

      <div className="gp-tiles">
        {tiles.map((t) => (
          <div key={t.k} className="gp-tile" role="button" tabIndex={0} onClick={() => openWeek(t)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openWeek(t)}>
            <span className="gp-tile__l">{t.l}<Prov kind={t.prov} note={t.note} /></span>
            <span>
              <div className="gp-tile__v">{t.prefix && isNum(t.v(day)) ? t.prefix : ''}{fmt(t.v(day), t.dp)}<small>{t.u}</small></div>
              <Delta cur={t.v(day)} prev={t.v(prev)} goodUp={t.goodUp} dp={t.dp} vs={prevDate ? wd(prevDate) : undefined} />
            </span>
          </div>
        ))}
      </div>

      {outages.length > 0 && (
        <section className="gp-card">
          <div className="gp-h">Outages today <span>{outages.length} in PGCB’s log</span></div>
          {outages.slice(0, 4).map((o, i) => <OutageRow key={i} o={o} />)}
          {outages.length > 4 && (
            <button className="gp-more" onClick={() => open(<><h3>Outages</h3><p className="gp-sheet__sub">{s.date} · {outages.length} entries, as PGCB logged them</p>{outages.map((o, i) => <OutageRow key={i} o={o} />)}</>)}>
              See all {outages.length}
            </button>
          )}
        </section>
      )}

      {fc && (isNum(fc.maxGenEveningMw) || isNum(fc.totalEnergyGenMkwh)) && (
        <section className="gp-card">
          <div className="gp-h">Against PGCB’s forecast <span>signed difference</span></div>
          <div className="gp-tiles" style={{ margin: 0 }}>
            {isNum(fc.maxGenEveningMw) && isNum(s.eveningPeakGen) && (
              <div className="gp-tile gp-tile--plain">
                <span className="gp-tile__l">Evening peak<Prov kind="D" note="Actual evening-peak generation minus PGCB’s forecast for it. A difference, not a score." /></span>
                <div className="gp-tile__v">{signed(s.eveningPeakGen - fc.maxGenEveningMw)}<small>MW</small></div>
                <span className="gp-delta flat">{fmt(s.eveningPeakGen)} vs {fmt(fc.maxGenEveningMw)} forecast</span>
              </div>
            )}
            {isNum(fc.totalEnergyGenMkwh) && isNum(s.totalEnergyGen) && (
              <div className="gp-tile gp-tile--plain">
                <span className="gp-tile__l">Energy<Prov kind="D" note="Energy generated minus PGCB’s forecast of it." /></span>
                <div className="gp-tile__v">{signed(s.totalEnergyGen - fc.totalEnergyGenMkwh, 1)}<small>MKWh</small></div>
                <span className="gp-delta flat">{fmt(s.totalEnergyGen, 1)} vs {fmt(fc.totalEnergyGenMkwh, 1)} forecast</span>
              </div>
            )}
          </div>
          <Source>Forecast issued {fc.issuedOn}{fc.issuedAt ? ` at ${fc.issuedAt}` : ''} · {fc.issuedIn}</Source>
        </section>
      )}
    </div>
  );
}

function OutageRow({ o }: { o: { time: string; plant: string; load: string; reason: string } }) {
  const text = `${o.plant} ${o.reason}`;
  const kind = /trip/i.test(text) ? ['Tripped', 'bad'] : /shut ?down|forced/i.test(text) ? ['Shutdown', 'bad'] : /maint|scheduled|s\/d/i.test(text) ? ['Planned', ''] : ['Outage', 'warn'];
  const mw = /(\d[\d,.]*)\s*MW/i.exec(o.load);
  const name = o.plant.replace(/\s+(Shutdown|Scheduled|Tripped|Forced).*/i, '').trim();
  return (
    <div className="gp-row gp-row--top">
      <div className="gp-row__main">
        <div className="gp-row__name gp-row__name--wrap">{name}</div>
        <div className="gp-row__sub">{o.time} <span className={`gp-tag ${kind[1]}`}>{kind[0]}</span>{o.reason && o.reason !== o.plant ? ` · ${o.reason.slice(0, 70)}` : ''}</div>
      </div>
      <div className="gp-row__val">{mw ? <>{mw[1]}<small>MW</small></> : null}</div>
    </div>
  );
}

export function WeekSheet({ title, unit, dp, prefix, dates, values, current }: { title: string; unit: string; dp: number; prefix?: string; dates: string[]; values: (number | null)[]; current: number }) {
  const [i, setI] = useState(current >= 0 ? current : values.length - 1);
  return (
    <>
      <h3>{title}</h3>
      <p className="gp-sheet__sub">Days you can open · tap a bar</p>
      <div className="gp-big" style={{ fontSize: 38 }}>{isNum(values[i]) && prefix ? prefix : ''}{fmt(values[i], dp)}<small>{unit}</small></div>
      <div className="gp-sub">{dates[i]}</div>
      <div className="gp-chart">
        <Bars ariaLabel={`${title} by day`} values={values} labels={dates.map(wd)} color="var(--gp-primary)" highlight={i} height={150} onPick={setI} />
      </div>
    </>
  );
}
