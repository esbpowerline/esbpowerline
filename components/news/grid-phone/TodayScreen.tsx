'use client';

import { useState, type ReactNode } from 'react';
import type { GridDailyData } from '@/lib/data/grid/types';
import { Bars, fmt, Legend, LineChart, StackArea } from './charts';
import { Delta, fuelPalette, isNum, maxShed, Row, Section, Stat, useSheet, wd, wholeHours } from './shared';
import { groupCurve } from './SupplyScreen';
import { usePhone } from './context';

type Metric = 'gen' | 'mix' | 'shed' | 'flow';

export function TodayScreen() {
  const { date, day, prev, prevDate, week, weekDates, curve, plants } = usePhone();
  const open = useSheet();
  const s = day.systemStats;
  const vs = prevDate ? wd(prevDate) : undefined;
  const [metric, setMetric] = useState<Metric>('gen');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [scrub, setScrub] = useState<{ kicker: string; big: number | null; sub: ReactNode } | null>(null);
  const toggle = (k: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const hours = wholeHours(day.hourlyLoadData);
  const labels = hours.map((h) => h.time);
  const shed = maxShed(day);
  const pal = fuelPalette(day);
  const palG: Record<string, string> = { ...pal, Oil: pal.HFO, Renewables: pal.Wind };
  const grouped = curve ? groupCurve(curve, true) : null;
  const ewic = day.ewicData?.rows?.length ? day.ewicData : null;
  const ewicTot = (r: { mw: (number | null)[] }) => (r.mw.length && r.mw.every(isNum) ? (r.mw as number[]).reduce((a, v) => a + v, 0) : null);
  const ewicPeakOf = (d: GridDailyData | null) => {
    const v = (d?.ewicData?.rows ?? []).map(ewicTot).filter(isNum);
    return v.length ? Math.max(...v) : null;
  };
  const fcByHour = new Map((day.forecast?.hourly ?? []).map((h) => [h.time, h.generationMw]));

  const M: Record<Metric, { tab: string; unit: string; value: number | null; prev: number | null; kicker: string; goodUp: boolean; show: boolean }> = {
    gen: { tab: 'Generation', unit: 'MW', value: s.eveningPeakGen ?? null, prev: prev?.systemStats.eveningPeakGen ?? null, kicker: `Evening peak${s.peakTimes?.eveningPeakGen ? ` · ${s.peakTimes.eveningPeakGen}` : ''}`, goodUp: true, show: true },
    mix: { tab: 'Fuel mix', unit: 'MW', value: s.eveningPeakGen ?? null, prev: prev?.systemStats.eveningPeakGen ?? null, kicker: 'Generation by fuel', goodUp: true, show: !!grouped },
    shed: { tab: 'Load shed', unit: 'MW', value: shed, prev: maxShed(prev), kicker: 'Worst hour of load shedding', goodUp: false, show: true },
    flow: { tab: 'East–West', unit: 'MW', value: ewicPeakOf(day), prev: ewicPeakOf(prev), kicker: 'Across the Jamuna, busiest hour', goodUp: true, show: !!ewic },
  };
  const m = M[metric];
  const head = scrub ?? { kicker: m.kicker, big: m.value, sub: <Delta cur={m.value} prev={m.prev} goodUp={m.goodUp} vs={vs} /> };

  let chart: ReactNode = null;
  let legend: ReactNode = null;
  if (metric === 'gen') {
    const dem = hours.map((h) => (isNum(h.demand) ? h.demand : null));
    const hasDemand = dem.filter(isNum).length > 2;
    const series = [
      { key: 'gen', values: hours.map((h) => (isNum(h.generation) ? h.generation : null)), color: 'var(--gp-primary)', fill: true, width: 2.25 },
      { key: 'dem', values: hasDemand ? dem : labels.map(() => null), color: 'var(--gp-demand)', width: 2 },
      { key: 'fc', values: hours.map((h) => fcByHour.get(h.time) ?? null), color: 'var(--gp-fc)', dash: true, width: 1.5 },
    ];
    const vis = series.map((x) => (hidden.has(x.key) ? { ...x, values: x.values.map(() => null) } : x));
    chart = (
      <LineChart
        ariaLabel="Generation, demand and PGCB forecast by hour"
        labels={labels}
        series={vis}
        band={hasDemand && !hidden.has('gen') && !hidden.has('dem') ? { upper: 1, lower: 0, color: 'var(--gp-bad)' } : undefined}
        onScrub={(i) => {
          if (i == null) return setScrub(null);
          const h = hours[i];
          const f = fcByHour.get(h.time);
          setScrub({
            kicker: `${h.time} · generation`,
            big: h.generation,
            sub: (
              <>
                {isNum(h.demand) ? <>Demand <b>{fmt(h.demand)}</b></> : 'Demand not published'}
                {isNum(f) ? <> · forecast <b>{fmt(f)}</b></> : null}
                {isNum(h.loadShed) && h.loadShed > 0 ? <> · <b style={{ color: 'var(--gp-bad)' }}>{fmt(h.loadShed)} shed</b></> : null}
              </>
            ),
          });
        }}
      />
    );
    legend = (
      <Legend
        hidden={hidden}
        onToggle={toggle}
        items={[
          { key: 'gen', label: 'Generation', color: 'var(--gp-primary)', line: true },
          ...(hasDemand ? [{ key: 'dem', label: 'Demand', color: 'var(--gp-demand)', line: true }] : []),
          ...(fcByHour.size ? [{ key: 'fc', label: 'PGCB forecast', color: 'var(--gp-fc)', dash: true }] : []),
        ]}
      />
    );
  } else if (metric === 'mix' && grouped) {
    const groups = grouped.groups.filter((g) => !hidden.has(g));
    const idx = groups.map((g) => grouped.groups.indexOf(g));
    chart = (
      <StackArea
        ariaLabel="Generation by fuel group, hour by hour"
        labels={grouped.labels}
        groups={groups.map((g) => ({ name: g, color: palG[g] }))}
        rows={grouped.rows.map((r) => idx.map((k) => r[k]))}
        onScrub={(i) => {
          if (i == null) return setScrub(null);
          const raw = grouped.raw[i];
          const order = grouped.groups.map((g, k) => [g, raw[k]] as const).filter(([, v]) => isNum(v)).sort((a, b) => (b[1] as number) - (a[1] as number));
          setScrub({
            kicker: `${grouped.labels[i]} · all fuels`,
            big: raw.reduce<number>((a, v) => a + (v ?? 0), 0),
            sub: order.slice(0, 3).map(([g, v], k) => (
              <span key={g}>{k ? ' · ' : ''}{g} <b>{fmt(v)}</b></span>
            )),
          });
        }}
      />
    );
    legend = <Legend hidden={hidden} onToggle={toggle} items={grouped.groups.map((g) => ({ key: g, label: g, color: palG[g] }))} />;
  } else if (metric === 'shed') {
    const published = hours.filter((h) => isNum(h.loadShed)).length;
    chart = published ? (
      <div className="gp-plot">
        <Bars ariaLabel="Load shedding by hour" values={hours.map((h) => (isNum(h.loadShed) ? h.loadShed : null))} labels={hours.map((h) => (/^(00|06|12|18):00$/.test(h.time) ? h.time : ''))} color="var(--gp-bad)" height={220} />
      </div>
    ) : (
      <div className="gp-plot"><div className="gp-empty" style={{ height: 160 }}>This report publishes load shedding for the evening peak only.</div></div>
    );
    legend = published ? (
      <div className="gp-subline" style={{ marginTop: 12 }}>
        Cuts in <b>{hours.filter((h) => isNum(h.loadShed) && h.loadShed > 0).length}</b> of {published} published hours
        {isNum(s.totalEnergyUnserved) ? <> · <b>{fmt(s.totalEnergyUnserved, 2)}</b> MKWh not supplied</> : null}
      </div>
    ) : null;
  } else if (metric === 'flow' && ewic) {
    const cols = ['var(--gp-primary)', '#a855f7', 'var(--gp-demand)'];
    const keys = ewic.corridors.map((c) => `ewic:${c}`);
    chart = (
      <LineChart
        ariaLabel="East-West interconnector flow by corridor"
        labels={ewic.rows.map((r) => r.time)}
        min={0}
        series={ewic.corridors.map((_, k) => ({ values: hidden.has(keys[k]) ? ewic.rows.map(() => null) : ewic.rows.map((r) => r.mw[k] ?? null), color: cols[k % 3], width: 2 }))}
        onScrub={(i) => {
          if (i == null) return setScrub(null);
          const r = ewic.rows[i];
          setScrub({
            kicker: `${r.time} · all corridors`,
            big: ewicTot(r),
            sub: ewic.corridors.map((c, k) => (
              <span key={c}>{k ? ' · ' : ''}{c.split('-')[0]} <b>{fmt(r.mw[k])}</b></span>
            )),
          });
        }}
      />
    );
    legend = <Legend hidden={hidden} onToggle={toggle} items={ewic.corridors.map((c, k) => ({ key: keys[k], label: c.replace('-', ' → '), color: cols[k % 3], line: true }))} />;
  }

  const ps = (plants?.plants ?? []).filter((p) => isNum(p.installedMw) && p.installedMw > 0);
  const ran = ps.filter((p) => isNum(p.eveningPeakMw) && p.eveningPeakMw > 0).length;
  const outages = day.dailyOutages ?? [];

  type W = { l: string; v: (d: GridDailyData | null) => number | null; u: string; dp: number; prefix?: string };
  const week7 = (t: W) => () => open(<WeekSheet title={t.l} unit={t.u} dp={t.dp} prefix={t.prefix} dates={weekDates} values={week.map((d) => t.v(d))} current={weekDates.indexOf(date)} />);
  const at = (t?: string | null) => (t ? ` at ${t}` : '');

  const fc = day.forecast;
  const fcHours = (fc?.hourly ?? []).filter((h) => h.time.endsWith(':00'));
  const issuedHour = fc?.issuedAt ? Number(/T(\d{2})/.exec(fc.issuedAt)?.[1] ?? NaN) : NaN;

  return (
    <div className="gp-screen">
      <section className="gp-sec" aria-label="Headline">
        <div className="gp-tabs" role="tablist">
          {(Object.keys(M) as Metric[]).filter((k) => M[k].show).map((k) => (
            <button key={k} role="tab" aria-selected={k === metric} className={k === metric ? 'is-on' : ''} onClick={() => { setMetric(k); setScrub(null); setHidden(new Set()); }}>
              {M[k].tab}
            </button>
          ))}
        </div>
        <div className="gp-kicker">
          <span>{head.kicker}</span>
          {!scrub && shed != null && (shed > 0 ? <span className="gp-status bad">{fmt(shed)} MW short</span> : <span className="gp-status good">Demand met</span>)}
        </div>
        <div className="gp-hero"><b>{fmt(head.big)}</b><small>{m.unit}</small></div>
        <div className="gp-subline">{head.sub}</div>
        {chart}
        {legend}
        <div className="gp-sec__foot">PGCB daily report · NLDC hourly sheet{metric === 'mix' ? ' · fuel groups are our sums' : ''}</div>
      </section>

      <Section title="The day in numbers" meta={day.systemStats.date}>
        <div className="gp-stats gp-stats--first">
          <Stat label="Evening peak demand" value={s.eveningPeakDemand} unit="MW" prov="P" detail={<Delta cur={s.eveningPeakDemand ?? null} prev={prev?.systemStats.eveningPeakDemand ?? null} goodUp={false} vs={vs} />} onClick={week7({ l: 'Evening peak demand', v: (d) => d?.systemStats.eveningPeakDemand ?? null, u: 'MW', dp: 0 })} />
          <Stat label="Day peak generation" value={s.dayPeakGen} unit="MW" prov="P" detail={`highest before evening${at(s.peakTimes?.dayPeakGen)}`} onClick={week7({ l: 'Day peak generation', v: (d) => d?.systemStats.dayPeakGen ?? null, u: 'MW', dp: 0 })} />
          <Stat label="Energy generated" value={s.totalEnergyGen} unit="MKWh" dp={1} prov="P" detail={<Delta cur={s.totalEnergyGen ?? null} prev={prev?.systemStats.totalEnergyGen ?? null} goodUp dp={1} vs={vs} />} onClick={week7({ l: 'Energy generated', v: (d) => d?.systemStats.totalEnergyGen ?? null, u: 'MKWh', dp: 1 })} />
          <Stat label="Energy not supplied" value={s.totalEnergyUnserved} unit="MKWh" dp={2} prov="P" detail={<Delta cur={s.totalEnergyUnserved ?? null} prev={prev?.systemStats.totalEnergyUnserved ?? null} goodUp={false} dp={2} vs={vs} />} onClick={week7({ l: 'Energy not supplied', v: (d) => d?.systemStats.totalEnergyUnserved ?? null, u: 'MKWh', dp: 2 })} />
          <Stat label="Lowest generation" value={s.minGen} unit="MW" prov="P" detail={`overnight trough${at(s.peakTimes?.minGen)}`} onClick={week7({ l: 'Lowest generation', v: (d) => d?.systemStats.minGen ?? null, u: 'MW', dp: 0 })} />
          <Stat label="Hottest in Dhaka" value={s.maxTemp} unit="°C" dp={1} prov="P" onClick={week7({ l: 'Hottest in Dhaka', v: (d) => d?.systemStats.maxTemp ?? null, u: '°C', dp: 1 })} />
          <Stat label="Cost per unit" value={s.avgProductionCost} unit="Tk/kWh" dp={2} prov="P" detail={<Delta cur={s.avgProductionCost ?? null} prev={prev?.systemStats.avgProductionCost ?? null} goodUp={false} dp={2} vs={vs} />} onClick={week7({ l: 'Cost per unit', v: (d) => d?.systemStats.avgProductionCost ?? null, u: 'Tk/kWh', dp: 2 })} />
          <Stat label="Fuel cost of the day" value={isNum(s.totalDailyCost) ? s.totalDailyCost / 1e7 : null} unit="crore" prefix="৳" prov="D" note="PGCB prints the day’s fuel cost in taka; shown here in crore (÷ 10 million)." onClick={week7({ l: 'Fuel cost of the day', v: (d) => (isNum(d?.systemStats.totalDailyCost) ? d!.systemStats.totalDailyCost! / 1e7 : null), u: 'crore', dp: 0, prefix: '৳' })} />
          <Stat label="Gas burned for power" value={s.totalGasSuppliedPower} unit="MMCFD" prov="P" detail="the power sector’s share, not national supply" />
          <Stat label="Stations at the peak" value={ps.length ? ran : null} unit={ps.length ? `of ${ps.length}` : undefined} prov="D" note="Stations whose evening-peak output PGCB printed as more than zero, out of every station with installed capacity." />
        </div>
        <div className="gp-hint">Tap a figure for the last {weekDates.length} days</div>
      </Section>

      {outages.length > 0 && (
        <Section title="Outages" meta={`${outages.length} in PGCB’s log`}>
          <div className="gp-rows">
            {outages.slice(0, 5).map((o, i) => <OutageRow key={i} o={o} />)}
          </div>
          {outages.length > 5 && (
            <button
              className="gp-more"
              onClick={() =>
                open(
                  <>
                    <h3>Outages</h3>
                    <p className="gp-sheet__sub">{s.date} · {outages.length} entries, as PGCB logged them</p>
                    <div className="gp-rows">{outages.map((o, i) => <OutageRow key={i} o={o} />)}</div>
                  </>,
                )
              }
            >
              All {outages.length} outages
            </button>
          )}
        </Section>
      )}

      {fc && (
        <Section
          title="Against PGCB’s forecast"
          desc={`Issued ${fc.issuedOn}${fc.issuedAt ? ` at ${fc.issuedAt.slice(11, 16)}` : ''} · differences, not a score`}
          source={`PGCB daily report · forecast block · ${fc.issuedIn}`}
        >
          <div className="gp-stats gp-stats--first">
            <Stat label="Evening peak" value={isNum(fc.maxGenEveningMw) && isNum(s.eveningPeakGen) ? s.eveningPeakGen - fc.maxGenEveningMw : null} unit="MW" prov="D" note="Actual evening-peak generation minus PGCB’s forecast of it." detail={isNum(fc.maxGenEveningMw) ? `${fmt(s.eveningPeakGen)} actual · ${fmt(fc.maxGenEveningMw)} forecast` : 'not forecast'} />
            <Stat label="Energy" value={isNum(fc.totalEnergyGenMkwh) && isNum(s.totalEnergyGen) ? s.totalEnergyGen - fc.totalEnergyGenMkwh : null} unit="MKWh" dp={1} prov="D" note="Energy generated minus PGCB’s forecast of it." detail={isNum(fc.totalEnergyGenMkwh) ? `${fmt(s.totalEnergyGen, 1)} actual · ${fmt(fc.totalEnergyGenMkwh, 1)} forecast` : 'not forecast'} />
            {isNum(fc.maxDemandEveningMw) && <Stat label="Evening peak demand" value={isNum(s.eveningPeakDemand) ? s.eveningPeakDemand - fc.maxDemandEveningMw : null} unit="MW" prov="D" detail={`${fmt(s.eveningPeakDemand)} actual · ${fmt(fc.maxDemandEveningMw)} forecast`} />}
            {isNum(fc.maxTempC) && <Stat label="Hottest in Dhaka" value={isNum(s.maxTemp) ? s.maxTemp - fc.maxTempC : null} unit="°C" dp={1} prov="D" detail={`${fmt(s.maxTemp, 1)} actual · ${fmt(fc.maxTempC, 1)} forecast`} />}
          </div>
          {fcHours.length > 2 && (
            <>
              <LineChart
                ariaLabel="Forecast and measured generation by hour"
                labels={fcHours.map((h) => h.time)}
                aspect={0.5}
                minH={190}
                series={[
                  { values: fcHours.map((h) => hours.find((x) => x.time === h.time)?.generation ?? null), color: 'var(--gp-primary)', width: 2.25 },
                  { values: fcHours.map((h) => h.generationMw), color: 'var(--gp-fc)', dash: true, width: 1.5 },
                ]}
                marker={isNum(issuedHour) ? { index: fcHours.findIndex((h) => Number(h.time.slice(0, 2)) >= issuedHour), label: 'issued' } : undefined}
              />
              <Legend items={[{ label: 'Measured', color: 'var(--gp-primary)', line: true }, { label: 'Forecast', color: 'var(--gp-fc)', dash: true }]} />
            </>
          )}
        </Section>
      )}
    </div>
  );
}

function OutageRow({ o }: { o: { time: string; plant: string; load: string; reason: string } }) {
  const text = `${o.plant} ${o.reason}`;
  const kind = /trip/i.test(text) ? ['Tripped', 'bad'] : /shut ?down|forced/i.test(text) ? ['Shutdown', 'bad'] : /maint|scheduled|s\/d/i.test(text) ? ['Planned', ''] : ['Outage', 'warn'];
  const mw = /(\d[\d,.]*)\s*MW/i.exec(o.load);
  const name = o.plant.replace(/\s+(Shutdown|Scheduled|Tripped|Forced).*/i, '').replace(/\s+/g, ' ').trim();
  const reason = o.reason && !o.plant.includes(o.reason.slice(0, 20)) ? o.reason : null;
  return (
    <Row
      top
      wrap
      name={name}
      sub={
        <>
          <span className={`gp-tag ${kind[1]}`}>{kind[0]}</span> {o.time}
          {reason ? <><br />{reason}</> : null}
        </>
      }
      value={mw ? mw[1] : undefined}
      small={mw ? 'MW' : undefined}
    />
  );
}

export function WeekSheet({ title, unit, dp, prefix, dates, values, current }: { title: string; unit: string; dp: number; prefix?: string; dates: string[]; values: (number | null)[]; current: number }) {
  const [i, setI] = useState(current >= 0 ? current : values.length - 1);
  return (
    <>
      <h3>{title}</h3>
      <p className="gp-sheet__sub">The days you can open · tap a bar</p>
      <div className="gp-kicker"><span>{dates[i] ? `${wd(dates[i])} ${dates[i]}` : ''}</span></div>
      <div className="gp-hero gp-hero--md"><b>{isNum(values[i]) && prefix ? prefix : ''}{fmt(values[i], dp)}</b><small>{unit}</small></div>
      <div className="gp-plot">
        <Bars ariaLabel={`${title} by day`} values={values} labels={dates.map(wd)} color="var(--gp-primary)" highlight={i} height={200} onPick={setI} valueLabels dp={dp} />
      </div>
    </>
  );
}
