'use client';

/**
 * The Overview KPI strip, six tiles, on the phone: each tile shows its figure,
 * its comparison against the last week and (where PGCB filed one) the forecast;
 * tapping it opens the same briefing the desktop hover panel carries — every
 * row with its P/D mark, the audit caveat and the source citation.
 */

import { PEAK_SERVED_HINT, PEAK_SERVED_NOTE, peakDemandEqualsGeneration } from '@/lib/data/grid/peak-served';
import type { ReactNode } from 'react';
import { peakDeficitAtDemand, useGridOverviewContext } from '@/hooks/useGridOverviewContext';
import { forecastStatesAvailability } from '@/lib/data/grid/forecast-curve';
import { formatWindow, petrobanglaGasDay } from '@/lib/data/grid/observation-window';
import { renewableGridSharePct, totalCapacityRenewables } from '@/lib/data/companies/sreda';
import { fmt } from './charts';
import { usePhone } from './context';
import { isNum, Section, Stat, useSheet } from './shared';
import { BriefRows, dayLabel, SourceRef, WeekBars, type BRow } from './today-util';

type Polarity = 'up-good' | 'down-good' | 'neutral';

/**
 * "▲ 1.2% vs 7-day avg". Hidden without a baseline; "level" inside half a percent.
 * With `absBelow`, a baseline under that magnitude is compared in MW instead:
 * Peak Deficit read "▼100.0%" on 18 Nov 2026 for 0 MW against a 1.4 MW mean.
 */
function Trend({ cur, base, days, polarity, absBelow }: { cur: number | null | undefined; base: number | null | undefined; days: number; polarity: Polarity; absBelow?: number }) {
  if (!isNum(cur) || !isNum(base)) return null;
  const absolute = absBelow != null && Math.abs(base) < absBelow;
  if (!absolute && base === 0) return null;
  const diff = cur - base;
  const pct = absolute ? 0 : (diff / Math.abs(base)) * 100;
  const vs = <span style={{ color: 'var(--gp-muted)', fontWeight: 400 }}> vs {days}-day avg</span>;
  if (absolute ? Math.abs(diff) < 0.5 : Math.abs(pct) < 0.5) return <span className="gp-delta flat">→ level{vs}</span>;
  const up = diff > 0;
  const cls = polarity === 'neutral' ? 'flat' : (polarity === 'up-good' ? up : !up) ? 'good' : 'bad';
  return (
    <span className={`gp-delta ${cls}`}>
      {up ? '▲' : '▼'} {absolute ? `${fmt(Math.round(Math.abs(diff)))} MW` : `${Math.abs(pct).toFixed(1)}%`}{vs}
    </span>
  );
}

/**
 * "forecast 17,360 · outturn +186 MW", grey on purpose: a forecast miss is never graded.
 * `available`: PGCB's Probable Maximum Generation sits above its forecast demand, so it
 * states availability — 13,732 against 13,670 on 23 Nov 2026, which printed "outturn
 * −620 MW" for capacity never asked to run. Named as such, with no delta.
 */
function ForecastHint({ forecastMw, actualMw, available = false }: { forecastMw: number | null | undefined; actualMw: number | null | undefined; available?: boolean }) {
  if (!isNum(forecastMw)) return null;
  if (available) return <span style={{ display: 'block' }}>stated available {fmt(Math.round(forecastMw))} MW</span>;
  const gap = isNum(actualMw) ? Math.round(actualMw - forecastMw) : null;
  return (
    <span style={{ display: 'block' }}>
      forecast {fmt(Math.round(forecastMw))}
      {gap != null && ` · outturn ${gap >= 0 ? '+' : '−'}${fmt(Math.abs(gap))} MW`}
    </span>
  );
}

const PGCB = 'https://www.pgcb.gov.bd/';
const PETRO = 'https://www.petrobangla.org.bd/';

export function TodayKpiStrip() {
  const { date, day, week, weekDates } = usePhone();
  const open = useSheet();
  const s = day.systemStats;
  const { capacity, baseline } = useGridOverviewContext(date, s);
  const days = baseline?.days ?? 0;
  const f = day.forecast ?? null;
  const gd = day.generationData ?? [];
  const files = day.sourceFiles;
  const cur = weekDates.indexOf(date);
  const dateLabel = `Date: ${s.date}`;
  const wk = (title: string, unit: string, dp: number, pick: (d: typeof day | null) => number | null, prefix?: string) => (
    <WeekBars title={title} unit={unit} dp={dp} prefix={prefix} dates={weekDates} values={week.map((d) => pick(d))} current={cur} />
  );
  const sheet = (title: string, body: ReactNode) => open(<><h3>{title}</h3><p className="gp-sheet__sub">{s.date}</p>{body}</>);
  const none = 'not published for this day';

  // ── derived figures, as the desktop strip computes them ──────────────────
  const avgMw = (mkwh: number | null) => (isNum(mkwh) ? (mkwh * 1000) / 24 : null);
  // Same instant enforced, as on the desktop strip: 20 Aug 2026 stamped demand at
  // 19:30 and generation at 21:00, and "at the same hour" printed 1,719 MW where
  // P4's 19:30 row gives 1,858. See peakDeficitAtDemand.
  const pd = peakDeficitAtDemand(s, day.hourlyLoadData);
  const deficit = pd.mw;
  const demand = s.eveningPeakDemand;
  const shedShare = deficit != null && isNum(demand) && demand > 0 ? (deficit / demand) * 100 : null;
  const genFcAvailable = forecastStatesAvailability(f);
  const installed = capacity?.installedMw ?? null;
  const idleMw = installed == null ? null : Math.max(0, installed - s.eveningPeakGen);
  const idlePct = installed && installed > 0 ? ((idleMw ?? 0) / installed) * 100 : null;
  const cost = isNum(s.totalDailyCost) && s.totalDailyCost > 0 ? s.totalDailyCost : null;
  const unit = isNum(s.avgProductionCost) && s.avgProductionCost > 0 ? s.avgProductionCost : null;
  const hasFuelCost = gd.some((g) => g.cost != null);
  const sumGen = gd.reduce((a, g) => a + (g.gen || 0), 0);
  const sumCost = gd.reduce((a, g) => a + (g.cost || 0), 0);
  const billPerKwh = sumGen > 0 ? sumCost / (sumGen * 1e6) : null;
  const unitGap = unit != null && hasFuelCost && billPerKwh != null ? Math.abs(unit - billPerKwh) : null;
  const fuelRate = (n: string) => {
    const r = gd.find((g) => g.name === n)?.unitCost;
    return r == null ? '—' : `${r.toFixed(2)} Tk/kWh`;
  };

  // gas, from the six Petrobangla company rows
  const gas = day.gasProductionData ?? [];
  const gasTotal = gas.reduce((a, g) => a + (g.gas || 0), 0);
  // A day with no gas window is written with the rows zeroed, so the sum, not the row count, decides.
  const hasGas = gas.length > 0 && gasTotal > 0;
  const find = (k: string) => gas.find((g) => g.company.toLowerCase().includes(k));
  const lng = (gas.find((g) => /rpgcl|lng/i.test(g.company))?.gas) ?? 0;
  const chev = find('chevron')?.gas ?? 0;
  const tul = find('tullow')?.gas ?? 0;
  const state = gas.filter((g) => /bgfcl|sgfl|bapex/i.test(g.company)).reduce((a, g) => a + g.gas, 0);
  const cond = gas.reduce((a, g) => a + (g.condensate || 0), 0);
  const pct = (v: number) => (gasTotal > 0 ? `${((v / gasTotal) * 100).toFixed(1)}%` : '—');
  const pbw = day.observationWindows?.petrobangla;
  const gasWindow = pbw
    ? `${pbw.publishedLabel ?? date} · ${formatWindow({ publisher: 'Petrobangla', start: pbw.start, end: pbw.end, anchorDay: date }, { offset: false })}`
    : `${petrobanglaGasDay(date).publishedLabel} · ${formatWindow(petrobanglaGasDay(date), { offset: false })}`;
  const gasDay = gasWindow.split(' · ')[0];

  const pub = 'As published by PGCB. Not audited.';

  return (
    <Section title="Headline figures" meta="Daily" source="Tap a figure for its briefing, the comparison and the source">
      <div className="gp-stats gp-stats--first">
        {/* 1 · evening peak generation */}
        <Stat
          label="Evening peak generation"
          value={s.eveningPeakGen}
          unit="MW"
          prov="P"
          detail={
            <>
              <Trend cur={s.eveningPeakGen} base={baseline?.peakSupply} days={days} polarity="up-good" />
              <ForecastHint forecastMw={f?.maxGenEveningMw} actualMw={s.eveningPeakGen} available={genFcAvailable} />
            </>
          }
          onClick={() =>
            sheet(
              'Supply briefing',
              <>
                <BriefRows
                  rows={[
                    { p: 'P', label: 'Evening peak gen', value: `${fmt(s.eveningPeakGen)} MW`, sub: s.peakTimes?.eveningPeakGen ? `at ${s.peakTimes.eveningPeakGen}` : undefined },
                    { p: 'P', label: 'Day peak gen', value: isNum(s.dayPeakGen) ? `${fmt(s.dayPeakGen)} MW` : '—', sub: s.peakTimes?.dayPeakGen ? `at ${s.peakTimes.dayPeakGen}` : undefined },
                    { p: 'D', label: '24-hour average', value: isNum(s.totalEnergyGen) ? `${fmt(avgMw(s.totalEnergyGen), 0)} MW` : '—', note: 'The day’s energy (MKWh × 1,000) divided by 24 hours.' },
                    { p: 'P', label: 'Total energy gen', value: isNum(s.totalEnergyGen) ? `${s.totalEnergyGen.toFixed(2)} MKWh` : none },
                    { p: 'P', label: 'Max generation of the day', value: isNum(s.maxGen) ? `${fmt(s.maxGen)} MW` : '—' },
                    { p: 'P', label: 'Min generation of the day', value: isNum(s.minGen) ? `${fmt(s.minGen)} MW` : '—' },
                    ...(isNum(f?.maxGenEveningMw) ? [{ p: 'P' as const, label: genFcAvailable ? 'PGCB’s same-morning stated available' : 'PGCB’s same-morning forecast', value: `${fmt(f!.maxGenEveningMw)} MW` }] : []),
                  ]}
                />
                <p className="gp-taudit">{pub}</p>
                <SourceRef label="PGCB Daily Report" part="P1 sheet" date={dateLabel} file={files?.pgcb} href={PGCB} />
                {wk('Evening peak generation', 'MW', 0, (d) => d?.systemStats.eveningPeakGen ?? null)}
              </>,
            )
          }
        />

        {/* 2 · evening peak demand */}
        <Stat
          label="Evening peak demand"
          value={s.eveningPeakDemand}
          unit="MW"
          prov="P"
          detail={
            <>
              <Trend cur={s.eveningPeakDemand} base={baseline?.peakDemand} days={days} polarity="neutral" />
              <ForecastHint forecastMw={f?.maxDemandEveningMw ?? f?.maxDemandMw} actualMw={s.eveningPeakDemand} />
              {peakDemandEqualsGeneration(s) && <span style={{ display: 'block' }}>{PEAK_SERVED_HINT}</span>}
            </>
          }
          onClick={() =>
            sheet(
              'Demand briefing',
              <>
                <BriefRows
                  rows={[
                    { p: 'P', label: 'Evening peak demand', value: isNum(demand) ? `${fmt(demand)} MW` : none, sub: isNum(demand) && s.peakTimes?.eveningPeakDemand ? `at ${s.peakTimes.eveningPeakDemand}` : undefined },
                    { p: 'P', label: 'Day peak demand', value: isNum(s.dayPeakDemand) ? `${fmt(s.dayPeakDemand)} MW` : '—' },
                    { p: 'P', label: 'Max temperature', value: isNum(s.maxTemp) ? `${s.maxTemp.toFixed(1)} °C` : '—' },
                    ...(isNum(f?.maxDemandEveningMw ?? f?.maxDemandMw) ? [{ p: 'P' as const, label: 'PGCB’s same-morning forecast', value: `${fmt(f!.maxDemandEveningMw ?? f!.maxDemandMw)} MW` }] : []),
                  ]}
                />
                {peakDemandEqualsGeneration(s) && <p className="gp-taudit">{PEAK_SERVED_NOTE}</p>}
                <p className="gp-taudit">{pub}</p>
                <SourceRef label="PGCB Daily Report" part="P1 sheet" date={dateLabel} file={files?.pgcb} href={PGCB} />
                {wk('Evening peak demand', 'MW', 0, (d) => d?.systemStats.eveningPeakDemand ?? null)}
              </>,
            )
          }
        />

        {/* 3 · peak deficit */}
        <Stat
          label="Peak deficit"
          value={deficit}
          unit="MW"
          prov="D"
          note="Evening-peak demand less generation at the same instant: P1’s evening-peak generation when both share a time stamp, otherwise the hourly reading at the demand stamp. Our subtraction; PGCB prints no deficit."
          detail={deficit == null ? (pd.note ?? undefined) : <Trend cur={deficit} base={baseline?.peakDeficit} days={days} polarity="down-good" absBelow={50} />}
          onClick={() =>
            sheet(
              'Shortfall briefing',
              <>
                <BriefRows
                  rows={[
                    { p: 'D', label: pd.at ? `At the demand peak (${pd.at})` : 'At the evening peak', value: deficit == null ? '—' : `${fmt(deficit)} MW`, bad: (deficit ?? 0) > 0, note: deficit == null ? pd.note ?? undefined : undefined },
                    ...(deficit != null && isNum(pd.generationMw) && pd.generationMw !== s.eveningPeakGen ? [{ p: 'P' as const, label: `Generation at ${pd.at} (P4)`, value: `${fmt(pd.generationMw)} MW` }] : []),
                    { p: 'D', label: 'Share of peak demand', value: shedShare == null ? '—' : `${shedShare.toFixed(1)}%` },
                    { p: 'P', label: 'Energy unserved (day)', value: isNum(s.totalEnergyUnserved) ? `${s.totalEnergyUnserved.toFixed(2)} MKWh` : none },
                    { p: 'D', label: 'That, averaged over 24h', value: isNum(s.totalEnergyUnserved) ? `${fmt(avgMw(s.totalEnergyUnserved), 0)} MW` : '—' },
                  ]}
                />
                <p className="gp-taudit">
                  The headline is evening-peak demand less generation at the same instant — P1’s pair when both share a time stamp, otherwise the hourly reading at the demand stamp, and a dash where there is none. PGCB’s own unserved-energy figure is the day’s total and is listed above beside it — the two measure different things and are not expected to match.
                </p>
                <SourceRef label="PGCB Daily Report" part="P1 sheet — demand, generation and unserved energy" date={dateLabel} file={files?.pgcb} href={PGCB} />
                {wk('Energy not supplied', 'MKWh', 2, (d) => d?.systemStats.totalEnergyUnserved ?? null)}
              </>,
            )
          }
        />

        {/* 4 · capacity idle */}
        <Stat
          label="Capacity idle"
          value={idlePct}
          unit="%"
          dp={1}
          prov="D"
          note="Installed ratings on the plant sheet less evening-peak generation, as a share of those ratings. Idle, not spare: derated or fuel-short plant counts as installed."
          detail={idleMw != null ? `${fmt(idleMw)} MW unused at peak` : 'no station sheet for this day'}
          onClick={() =>
            sheet(
              'Fleet utilisation',
              capacity ? (
                <>
                  <BriefRows
                    rows={[
                      { p: 'P', label: 'Installed (stations listed)', value: `${fmt(capacity.installedMw)} MW` },
                      { p: 'P', label: 'Running at evening peak', value: `${fmt(s.eveningPeakGen)} MW` },
                      { p: 'D', label: 'Idle at that moment', value: `${fmt(idleMw)} MW`, bad: true },
                      { p: 'P', label: 'Stations counted', value: fmt(capacity.stations) },
                      ...(capacity.stationsMissingCapacity > 0 ? [{ p: 'P' as const, label: 'Without a stated rating', value: `${capacity.stationsMissingCapacity} station${capacity.stationsMissingCapacity === 1 ? '' : 's'}` }] : []),
                      { p: 'P', label: 'Renewables registered', value: `${totalCapacityRenewables.toFixed(1)} MWp`, sub: `~${renewableGridSharePct.toFixed(1)}% of national, from SREDA` },
                    ]}
                  />
                  <p className="gp-taudit">
                    Both sides of this ratio are the plant sheet’s own columns — its evening-peak figures sum to the peak generation PGCB prints on P1. Capacity that is derated, under maintenance or short of fuel is counted as installed, so this is idle capacity, not spare capacity that could have run.
                  </p>
                  <SourceRef label="PGCB Daily Report" part="Station-wise generation sheet" date={dateLabel} file={files?.pgcb} href={PGCB} />
                </>
              ) : (
                <>
                  <p>This day’s report carries no station-wise sheet, so there is no installed rating to measure the peak against. The demand, supply and shedding figures beside it are unaffected.</p>
                  <SourceRef label="PGCB Daily Report" part="Station-wise generation sheet" date={dateLabel} file={files?.pgcb} href={PGCB} />
                </>
              ),
            )
          }
        />

        {/* 5 · gas supply */}
        <Stat
          label="Gas supply"
          value={hasGas ? gasTotal : null}
          unit="MMCFD"
          dp={1}
          prov="D"
          note="Petrobangla’s six company rows added together; the source states no national total line here. Not the power sector’s share."
          detail={
            hasGas ? (
              <>
                domestic {(((gasTotal - lng) / gasTotal) * 100).toFixed(1)}% · imported LNG {((lng / gasTotal) * 100).toFixed(1)}%
                <br />
                gas day {gasDay}
              </>
            ) : (
              <>
                awaiting Petrobangla
                {baseline?.lastGas ? ` · last filed ${fmt(baseline.lastGas.total, 1)} MMCFD on ${dayLabel(baseline.lastGas.date)}` : ''}
              </>
            )
          }
          onClick={() =>
            sheet(
              'Gas supply briefing',
              <>
                {hasGas ? (
                  <>
                    <BriefRows
                      rows={[
                        { p: 'D', label: 'Total gas supply', value: `${fmt(gasTotal, 1)} MMCFD` },
                        { p: 'P', label: 'Imported LNG', value: `${fmt(lng, 1)} MMCFD`, sub: pct(lng) },
                        { p: 'P', label: 'Chevron IOC supply', value: `${fmt(chev, 1)} MMCFD`, sub: pct(chev) },
                        ...(tul > 0 ? [{ p: 'P' as const, label: 'Tullow IOC supply', value: `${fmt(tul, 1)} MMCFD`, sub: pct(tul) }] : []),
                        { p: 'D', label: 'State field output', value: `${fmt(state, 1)} MMCFD`, sub: `${pct(state)} · BGFCL + SGFL + BAPEX` },
                        { p: 'D', label: 'Total condensate', value: `${fmt(cond, 1)} BBLD` },
                      ]}
                    />
                    <p className="gp-taudit">As published by Petrobangla. Not audited.</p>
                  </>
                ) : (
                  <p>Petrobangla has not published the production and distribution tables for this gas day yet. PGCB grid figures are unaffected.</p>
                )}
                <SourceRef label="Petrobangla Daily Gas & Condensate Production and Distribution Report" part="I. Production" date={`Gas day: ${gasWindow}`} file={files?.petrobangla} href={PETRO} />
              </>,
            )
          }
        />

        {/* 6 · production cost */}
        <Stat
          label="Production cost"
          value={cost == null ? null : cost / 1e7}
          unit="Cr BDT"
          dp={2}
          prov="P"
          detail={<Trend cur={cost} base={baseline?.dailyCost} days={days} polarity="down-good" />}
          onClick={() =>
            sheet(
              'Fuel & import bills',
              <>
                <BriefRows
                  rows={[
                    { p: 'P', label: 'Fuel bill for the day', value: cost == null ? none : `${(cost / 1e7).toFixed(2)} Crore BDT` },
                    { p: s.avgProductionCostStated ? 'P' : 'D', label: 'Production cost per kWh', value: unit == null ? none : `${unit.toFixed(3)} Tk/kWh`, note: s.avgProductionCostStated ? 'P1’s own “Production Cost per KWHr” (6.0848 Tk on 23 Nov 2026).' : 'This day’s report prints no per-kWh rate; the bill divided by the day’s energy.' },
                    ...(unitGap != null && unitGap >= 0.005 && billPerKwh != null ? [{ p: 'D' as const, label: 'Bill ÷ generation', value: `${billPerKwh.toFixed(3)} Tk/kWh` }] : []),
                    { p: 'D', label: 'Gas generation cost', value: fuelRate('Gas') },
                    { p: 'D', label: 'HFO generation cost', value: fuelRate('HFO'), bad: true },
                    { p: 'D', label: 'Cross-border imports', value: fuelRate('Imports') },
                  ]}
                />
                <p className="gp-taudit">
                  The headline is the production-cost total PGCB prints on P1, and the rate per kWh beneath it is P1’s own “Production Cost per KWHr”. PGCB prints no rate per fuel: the per-fuel rates are ours, each that fuel’s cost divided by its generation, not published tariffs, and the import rate in particular is a blended settlement figure rather than a contracted price, so read it as an indication.
                </p>
                <p className="gp-taudit">
                  Fuel and import bills only: capacity payments, debt service and O&amp;M appear nowhere on this report, so the true cost of running the grid is higher than any rate here. Restates BPDB fuel economics. Not audited.
                </p>
                <SourceRef label="PGCB Daily Report" part="P1 sheet — production-cost block" date={dateLabel} file={files?.pgcb} href={PGCB} />
                {wk('Fuel cost of the day', 'crore', 0, (d) => (isNum(d?.systemStats.totalDailyCost) && d!.systemStats.totalDailyCost > 0 ? d!.systemStats.totalDailyCost / 1e7 : null), '৳')}
              </>,
            )
          }
        />
      </div>
    </Section>
  );
}
