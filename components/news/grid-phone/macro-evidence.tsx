'use client';

/**
 * "Field evidence" on Gas reserves, drawn for the phone (2026-11-12).
 *
 * Replaces the hosted desktop PetrobanglaMacroGasSection. Reads exactly what
 * that panel reads: the Petrobangla bootstrap (index, live-week bundle, the
 * timeline summary), the archive day files, and the compute helpers in
 * lib/data/petrobangla. Every figure the desktop prints is here; the KPI
 * tooltips became bottom sheets, the Recharts composites became phone plots,
 * the toolbars and story tabs became pills, and the long explanations sit
 * behind info pills. Nothing is typed in by hand.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { formatNumber } from '@/lib/utils';
import { useGridTierAccess } from '@/hooks/useGridTierAccess';
import { PetrobanglaBootstrapProvider, usePetrobanglaBootstrap } from '@/components/news/power-grid/PetrobanglaBootstrap';
import {
  ARCHIVE_BASELINE_DATE, ARCHIVE_BASELINE_GAS, ARCHIVE_INSIGHTS, ARCHIVE_PEAK, ARCHIVE_START_DATE,
  FIELD_LIFELINE_META, MAJOR_FIELDS, PETROBANGLA_OFFICIAL_LABEL, PETROBANGLA_OFFICIAL_SITE,
} from '@/lib/data/petrobangla/constants';
import {
  computeArchiveKpis, computeArchiveKpisPreview, filterTimelineDays, getDistributionGrandTotal, getFieldGas, getRpgclGas,
  latestOkDate, movingAverage, powerFulfillmentPct, resolveArchiveGasDay, stressedPlants, worstPowerGapDays,
} from '@/lib/data/petrobangla/compute';
import { computeLiveWeekKpis, dayOverDayDelta, fieldSparklines, gasDayStart } from '@/lib/data/petrobangla/computeLiveWeek';
import {
  LIVE_WEEK_RANGE_OPTIONS, formatLiveWeekDate, isDateInLiveWeek, isLiveWeekRangeLocked, maxLiveWeekDaysForTier, sliceLiveWeekBundle,
} from '@/lib/data/petrobangla/getLiveWeek';
import { ARCHIVE_RANGE_PRESETS, filterTimelineByPreset, isArchivePresetLockedForTier, archivePresetGateLabel, type ArchiveRangePreset } from '@/lib/data/petrobangla/archiveRange';
import { loadArchiveDay, lookupIndexDay } from '@/lib/data/petrobangla/loadArchive';
import { isDateAllowedForTier, type GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import { COMPARE_FREE_BASELINE_DATE } from '@/lib/data/grid/public-sample-dates';
import type { AudienceMode, PetrobanglaDaily, PetrobanglaIndex, PetrobanglaTimelineDay } from '@/lib/data/petrobangla/types';
import '@/app/grid-phone-macro-evidence.css';
import { CompareView } from './macro-evidence-compare';
import { Prov, Section, useSheet } from './shared';
import { Cell, DataTable, Foot, InfoPill, KV, Key, Pills, Plot, TablePill, useSel, useSeriesColor } from './macro-kit';

const MODES: { id: AudienceMode; l: string }[] = [
  { id: 'simple', l: 'Simple' }, { id: 'analyst', l: 'Analyst' }, { id: 'investor', l: 'Investor' }, { id: 'researcher', l: 'Researcher' },
];
const RANGE_TITLE: Record<string, string> = { '1W': 'Rolling week', '1M': 'Rolling month', '6M': 'Rolling six months', '1Y': 'Rolling year', '3Y': 'Rolling three years', All: 'Full timeline' };
const RANGE_DESC: Record<string, string> = { '1W': 'Last 7 gas-days', '1M': 'Last 30 gas-days', '6M': 'Last 180 gas-days', '1Y': 'Last 365 gas-days', '3Y': 'Last 1,095 gas-days', All: 'Full archive timeline' };
const PERIOD: Record<number, [string, string]> = { 7: ['Week ending', '7-Day'], 30: ['Month ending', '30-Day'], 180: ['6-month period ending', '6-Month'], 365: ['Year ending', '1-Year'], 1095: ['3-year period ending', '3-Year'] };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const short = (iso: string) => { const [, m, d] = iso.split('-').map(Number); return `${d} ${MON[m - 1]}`; };
const monY = (iso: string) => { const [y, m] = iso.split('-').map(Number); return `${MON[m - 1]} ${String(y).slice(2)}`; };
const sgn = (v: number, dp = 1) => `${v >= 0 ? '+' : '−'}${formatNumber(Math.abs(v), dp)}`;
const f1 = (v: number) => formatNumber(v, 1);

type Props = { selectedDate: string; systemStatsDate: string; pgcbGasTotal: number };

export function MacroEvidence(props: Props) {
  return <PetrobanglaBootstrapProvider><Evidence {...props} /></PetrobanglaBootstrapProvider>;
}

function Evidence({ selectedDate, systemStatsDate, pgcbGasTotal }: Props) {
  const [mode, setMode] = useState<AudienceMode>('simple');
  return (
    <>
      <Section title="Field evidence" desc="Official Petrobangla daily reports — field, plant, and sector detail behind the reserve curve.">
        <p className="gpe-meta">
          {ARCHIVE_INSIGHTS.coverageDays.toLocaleString('en-US')} days since Jan 2020 · Gas-day 8:00 AM–8:00 AM{systemStatsDate ? ` · Grid ${systemStatsDate}` : ''}
        </p>
        <p className="gpm-pickl" style={{ marginTop: 12 }}>View as</p>
        <div className="gp-seg gpe-seg" role="tablist" aria-label="View as">
          {MODES.map((m) => <button key={m.id} type="button" role="tab" aria-selected={mode === m.id} className={mode === m.id ? 'is-on' : ''} onClick={() => setMode(m.id)}>{m.l}</button>)}
        </div>
      </Section>
      <LiveWindow selectedDate={selectedDate} pgcbGasTotal={pgcbGasTotal} mode={mode} />
      <Archive selectedDate={selectedDate} mode={mode} />
    </>
  );
}

/* ── rolling window (PetrobanglaLiveWeekPanel, unified) ──────────────────── */

function LiveWindow({ selectedDate, pgcbGasTotal, mode }: { selectedDate: string; pgcbGasTotal: number; mode: AudienceMode }) {
  const { tier } = useGridTierAccess();
  const { liveWeek: bundle, liveWeekLoading, ensureLiveWeekDays, timeline, timelineLoading, ensureTimeline } = usePetrobanglaBootstrap();
  const [rangeDays, setRangeDays] = useState(7);
  const sc = useSeriesColor();
  const open = useSheet();
  const rangeLocked = isLiveWeekRangeLocked(rangeDays, tier);
  const opt = LIVE_WEEK_RANGE_OPTIONS.find((o) => o.days === rangeDays);
  const rl = opt?.label ?? '1W';

  useEffect(() => {
    if (rangeDays <= 30) {
      if (!bundle || rangeLocked || bundle.days.length >= rangeDays) return;
      void ensureLiveWeekDays(rangeDays);
    } else if (!timeline && !rangeLocked) void ensureTimeline();
  }, [bundle, rangeDays, ensureLiveWeekDays, timeline, ensureTimeline, rangeLocked]);

  const activeBundle = useMemo(() => {
    if (!bundle?.days.length) return null;
    const want = rangeLocked ? maxLiveWeekDaysForTier(tier) : Math.min(30, rangeDays);
    return sliceLiveWeekBundle(bundle, Math.min(want, bundle.days.length));
  }, [bundle, rangeDays, rangeLocked, tier]);
  const tlDays = useMemo(() => {
    if (!timeline?.days.length) return [];
    const want = rangeLocked ? maxLiveWeekDaysForTier(tier) : rangeDays;
    return timeline.days.slice(-Math.min(want, timeline.days.length));
  }, [timeline, rangeDays, rangeLocked, tier]);

  // The desktop's period aggregation (PetrobanglaLiveWeekPanel.tsx periodKpis), same arithmetic.
  const rows = useMemo(() => {
    if (tlDays.length) return tlDays.map((d) => ({ date: d.date, total_gas: d.total_gas, power_demand: d.power_demand, power_supply: d.power_supply, lng_gas: d.lng_gas }));
    return (activeBundle?.days ?? []).map((d) => {
      const gt = getDistributionGrandTotal(d);
      return { date: gasDayStart(d), total_gas: d.production.grand_total.gas_mmcfd, power_demand: gt.power_demand_mmcfd as number | null, power_supply: gt.power_supply_mmcfd as number | null, lng_gas: getRpgclGas(d.production.fields) };
    });
  }, [tlDays, activeBundle]);
  const period = useMemo(() => {
    if (!rows.length) return null;
    let tg = 0, pd = 0, ps = 0, lg = 0, mn = Infinity, mx = -Infinity;
    for (const d of rows) {
      tg += d.total_gas ?? 0; pd += d.power_demand ?? 0; ps += d.power_supply ?? 0; lg += d.lng_gas ?? 0;
      if (d.total_gas != null && d.total_gas < mn) mn = d.total_gas;
      if (d.total_gas != null && d.total_gas > mx) mx = d.total_gas;
    }
    return { avgGas: tg / rows.length, avgFulfillment: pd > 0 ? (ps / pd) * 100 : 0, avgLngShare: tg > 0 ? (lg / tg) * 100 : 0, volatility: mx === -Infinity ? 0 : mx - mn, daysCount: rows.length };
  }, [rows]);

  // The plot: rangeDays <= 30 reads the bundle, longer reads the timeline (PbLiveTimeline).
  const series = useMemo(() => {
    const src = rangeDays <= 30
      ? (activeBundle?.days ?? []).map((d) => { const gt = getDistributionGrandTotal(d); return { date: gasDayStart(d), total: d.production.grand_total.gas_mmcfd as number | null, demand: gt.power_demand_mmcfd as number | null, supply: gt.power_supply_mmcfd as number | null }; })
      : tlDays.map((d) => ({ date: d.date, total: d.total_gas as number | null, demand: d.power_demand, supply: d.power_supply }));
    const step = Math.max(1, Math.ceil(src.length / 90));
    return src.filter((_, i) => (src.length - 1 - i) % step === 0);
  }, [rangeDays, activeBundle, tlDays]);
  const [sel, setSel] = useSel(series.length);

  const head = (
    <>
      <Pills label="Live window" items={LIVE_WEEK_RANGE_OPTIONS.map((o) => `${o.label}${isLiveWeekRangeLocked(o.days, tier) ? ' · plan' : ''}`)} sel={Math.max(0, LIVE_WEEK_RANGE_OPTIONS.findIndex((o) => o.days === rangeDays))} onSel={(k) => setRangeDays(LIVE_WEEK_RANGE_OPTIONS[k].days)} />
    </>
  );
  const title = RANGE_TITLE[rl] ?? 'Rolling week';
  const sub = mode === 'simple' ? `${RANGE_DESC[rl]} — national supply vs power plant allocation`
    : mode === 'investor' ? `${rl} volatility — power fulfillment and LNG share drive fuel-cost risk`
      : mode === 'researcher' ? `Rolling window with raw JSON links — ${rl} preset view`
        : `Rolling gas-days (${rl}) — sparklines, plant stress, and day-over-day compare`;

  if (!bundle || (rangeDays > 30 && !timeline && timelineLoading)) {
    return <Section title={title} desc={sub} meta={<span className="gpe-latest">Latest</span>}>{head}<div className="gp-skel" style={{ height: 260, marginTop: 12 }} /><p className="gpe-note">{rangeDays <= 30 ? 'Loading recent gas-days…' : 'Loading national timeline…'}</p></Section>;
  }
  if (!activeBundle) return <Section title={title} desc={sub}>{head}<div className="gp-empty">Latest-week data unavailable. Run sync_petrobangla_live.py to refresh.</div></Section>;
  if (rangeDays > 30 && !timeline) return <Section title={title} desc={sub}>{head}<div className="gp-empty">Timeline data unavailable.</div></Section>;

  const k = computeLiveWeekKpis(activeBundle);
  const latest = activeBundle.days[activeBundle.days.length - 1];
  const inWeek = isDateInLiveWeek(selectedDate, activeBundle);
  const [periodLabel, prefix] = PERIOD[rangeDays] ?? ['Archive period ending', 'All-Time'];
  const avgGas = period ? period.avgGas : k.weekAvgGas;
  const ful = period ? period.avgFulfillment : k.powerFulfillmentPct;
  const lngS = period ? period.avgLngShare : k.lngSharePct;
  const showAnalyst = mode === 'analyst' || mode === 'researcher';
  const showInvestor = mode === 'investor' || mode === 'analyst';
  const cur = series[sel];
  const weekInsight = `${periodLabel} ${formatLiveWeekDate(k.latestDate)}: ${formatNumber(k.weekAvgGas, 0)} MMCFD average · ${k.powerFulfillmentPct.toFixed(0)}% power fulfillment · ${k.lngSharePct.toFixed(0)}% LNG · Bibiyana ${formatNumber(k.bibiyanaGas, 0)} MMCFD.`;
  const cNat = sc('domesticGas');
  const cDem = 'var(--gp-bad)';
  const cSup = 'var(--gp-good)';

  return (
    <Section title={title} desc={sub} meta={<span className="gpe-latest">Latest</span>}>
      {head}
      <div className="gp-stats" style={{ marginTop: 12 }}>
        <Cell label="Latest national gas" prov="P" value={f1(k.latestGas)} unit="MMCFD" tone="primary"
          detail={<>{k.latestLabel}{k.latestGasDelta != null && <b className={k.latestGasDelta >= 0 ? 'gpe-up' : 'gpe-down'}> {k.latestGasDelta >= 0 ? '▲' : '▼'} {f1(Math.abs(k.latestGasDelta))}</b>}</>} />
        <Cell label={`${prefix} average`} prov="D" value={formatNumber(avgGas, 0)} unit="MMCFD" detail={`to ${formatLiveWeekDate(k.latestDate)}`} />
        <Cell label={`${prefix} power fulfillment`} prov="D" value={`${ful.toFixed(0)}%`} tone={ful < 45 ? 'bad' : 'warn'} detail={period ? `avg over ${period.daysCount} days` : `${formatNumber(k.powerSupply, 0)} of ${formatNumber(k.powerDemand, 0)} MMCFD`} />
        <Cell label={`${prefix} LNG share`} prov="D" value={`${lngS.toFixed(0)}%`} detail="imported gas in mix" />
        <Cell label="Bibiyana" prov="P" value={formatNumber(k.bibiyanaGas, 0)} unit="MMCFD" detail={`${k.bibiyanaWells} wells active`} />
        {mode !== 'simple' && period && <Cell label={`${prefix} volatility`} prov="D" value={f1(period.volatility)} unit="MMCFD" detail="Max/Min spread across period" />}
      </div>
      {mode !== 'simple' && period && (
        <div className="gpm-kvs">
          <KV label={`${prefix} avg gas`} prov="D" value={`${formatNumber(period.avgGas, 0)} MMCFD`} sub={`${period.daysCount}-day official average`} />
          <KV label={`${prefix} power fulfillment`} prov="D" value={`${period.avgFulfillment.toFixed(1)}%`} sub="Average supply vs demand over period" />
          <KV label={`${prefix} LNG share`} prov="D" value={`${period.avgLngShare.toFixed(1)}%`} sub="Average imported LNG share over period" />
        </div>
      )}
      {!inWeek && selectedDate >= ARCHIVE_START_DATE && <div className="gpm-notice gpe-gap">Grid date {selectedDate} is outside this range — see the daily archive below.</div>}
      {rangeDays <= 30 && liveWeekLoading && !rangeLocked && bundle.days.length < rangeDays && <p className="gpe-note">Loading {rangeDays}-day window…</p>}

      {rangeLocked ? (
        <div className="gpm-notice gpe-gap"><b>{rl} needs a higher plan</b>Showing the {activeBundle.days.length} gas-days your access covers.</div>
      ) : null}
      {cur && (
        <div className="gpm-kvs">
          <KV label={<b>{short(cur.date)} {cur.date.slice(0, 4)}</b>} value="" />
          <KV sw={cNat} label="National gas" prov="P" value={cur.total != null ? `${f1(cur.total)} MMCFD` : '—'} />
          <KV sw={cDem} label="Power demand" prov="P" value={cur.demand != null ? `${f1(cur.demand)} MMCFD` : '—'} />
          <KV sw={cSup} label="Power supply" prov="P" value={cur.supply != null ? `${f1(cur.supply)} MMCFD` : '—'} />
        </div>
      )}
      <Plot ariaLabel="National gas, power demand and power supply, MMCFD" labels={series.map((d) => (rangeDays <= 30 ? short(d.date) : monY(d.date)))} sel={sel} onSel={setSel}
        series={[{ kind: 'area', values: series.map((d) => d.supply), color: cSup, width: 1.5 }, { kind: 'line', values: series.map((d) => d.demand), color: cDem, width: 1.5 }, { kind: 'line', values: series.map((d) => d.total), color: cNat, width: 2.5 }]} />
      <Key items={[{ label: 'National gas', color: cNat, line: true }, { label: 'Power demand', color: cDem, line: true }, { label: 'Power supply', color: cSup }]} />

      {pgcbGasTotal > 0 && (
        <p className="gpe-note"><strong>PGCB vs Petrobangla:</strong> {f1(pgcbGasTotal)} MMCFD (grid)<Prov kind="P" /> · {f1(k.latestGas)} MMCFD (fields)<Prov kind="P" /> — different reporting layers.</p>
      )}

      <div className="gpm-pills">
        {showInvestor || showAnalyst ? (
          <>
            <FieldSnapshotPill bundle={activeBundle} latest={latest} spark={showAnalyst} />
            <PlantStressPill latest={latest} />
          </>
        ) : null}
        {showAnalyst && <button type="button" className="gpm-info" onClick={() => open(<DayCompareSheet bundle={activeBundle} />)}><span aria-hidden>Δ</span>Day-over-day</button>}
        {mode === 'researcher' && (
          <button type="button" className="gpm-info" onClick={() => open(<><h3>Raw daily JSON</h3><p className="gp-sheet__sub">One file per gas-day in this window</p><div className="gpe-files">{activeBundle.index_entries.map((e) => <a key={e.date} href={`/data/petrobangla/daily/${e.json_file}`}>{e.json_file}</a>)}</div></>)}>
            <span aria-hidden>{'{}'}</span>Raw JSON files
          </button>
        )}
        <InfoPill label="About this window" sub={title}>
          <p>{weekInsight}</p>
          <p>{rangeDays > 3000
            ? 'Full archive of official Petrobangla gas-days: national supply, power-sector demand vs allocation, LNG share, Bibiyana output, and plant stress. Analyst and Researcher modes unlock field sparklines, plant tables, and day-over-day compare.'
            : `Rolling ${rangeDays}-day official Petrobangla gas-days window: national supply, power-sector demand vs allocation, LNG share, Bibiyana output, and plant stress. Analyst and Researcher modes unlock field sparklines, plant tables, and day-over-day compare.`}</p>
          <p>Short-term volatility in this window often precedes rationing decisions. When power fulfillment drops while LNG share rises, the system is leaning on expensive imports without fully covering electricity-sector demand — a pattern visible across the 2024–2026 archive.</p>
        </InfoPill>
      </div>
      <Foot>
        <span><a href={PETROBANGLA_OFFICIAL_SITE}>{PETROBANGLA_OFFICIAL_LABEL}</a> · daily gas intake/offtake reports</span>
        <span>{periodLabel} {k.latestDate} · gas-day 8:00 AM → 8:00 AM · As published. Not independently audited.</span>
      </Foot>
    </Section>
  );
}

function FieldSnapshotPill({ bundle, latest, spark }: { bundle: NonNullable<ReturnType<typeof sliceLiveWeekBundle>>; latest: PetrobanglaDaily; spark: boolean }) {
  const open = useSheet();
  const sparks = fieldSparklines(bundle);
  const total = latest.production.grand_total.gas_mmcfd;
  const fields = [...latest.production.fields].sort((a, b) => b.gas_mmcfd - a.gas_mmcfd);
  const rows = fields.map((f) => {
    const s = sparks.get(f.field) ?? [];
    return [f.field, f.producing_wells, formatNumber(f.gas_mmcfd, 1), ...(spark ? [s.length > 1 ? <Spark key="s" values={s} /> : '—'] : []), formatNumber(f.capacity_mmcfd, 0), `${(total > 0 ? (f.gas_mmcfd / total) * 100 : 0).toFixed(1)}%`];
  });
  const head = [{ label: 'Field', text: true }, { label: <>Wells<Prov kind="P" /></> }, { label: <>Gas<Prov kind="P" /></>, unit: 'MMCFD' }, ...(spark ? [{ label: <>Trend<Prov kind="P" /></>, unit: 'window' }] : []), { label: <>Capacity<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>% total<Prov kind="D" /></> }];
  return (
    <button type="button" className="gpm-info" onClick={() => open(<><h3>Daily field snapshot</h3><p className="gp-sheet__sub">{latest.report.report_date_label} · every producing field, largest first</p><DataTable head={head} rows={rows} /></>)}>
      <span aria-hidden>≡</span>Field snapshot
    </button>
  );
}

function PlantStressPill({ latest }: { latest: PetrobanglaDaily }) {
  const plants = stressedPlants(latest).slice(0, 25);
  return (
    <TablePill label="Plant stress list" title="Plant stress list" sub={`${latest.report.report_date_label} · stations that asked for gas and got little or none — load-shedding in official numbers`}
      head={[{ label: 'Plant', text: true }, { label: 'DISCO', text: true }, { label: <>Demand<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Supply<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Gap<Prov kind="D" /></>, unit: 'MMCFD' }]}
      rows={plants.map((p) => [p.name, p.disco, f1(p.demand), <span key="s" className={p.supply === 0 ? 'gpe-down' : undefined}>{f1(p.supply)}</span>, <span key="g" className="gpe-down">{f1(p.demand - p.supply)}</span>])} />
  );
}

function DayCompareSheet({ bundle }: { bundle: NonNullable<ReturnType<typeof sliceLiveWeekBundle>> }) {
  const n = bundle.days.length;
  const [li, setLi] = useState(Math.max(0, n - 2));
  const [ri, setRi] = useState(Math.max(0, n - 1));
  const left = bundle.days[li];
  const right = bundle.days[ri];
  const counts = new Map<string, number>();
  bundle.index_entries.forEach((e) => counts.set(e.date_label, (counts.get(e.date_label) ?? 0) + 1));
  const lab = (e: (typeof bundle.index_entries)[number]) => ((counts.get(e.date_label) ?? 0) > 1 ? `${e.date_label} · ${e.date}` : e.date_label);
  const items = bundle.index_entries.map(lab);
  const d = left && right ? dayOverDayDelta(left, right) : null;
  return (
    <>
      <h3>Day-over-day (within window)</h3>
      <p className="gp-sheet__sub">Pick the two gas-days to compare</p>
      <p className="gpm-pickl">From</p>
      <Pills label="From day" items={items} sel={li} onSel={setLi} />
      <p className="gpm-pickl" style={{ marginTop: 10 }}>To</p>
      <Pills label="To day" items={items} sel={ri} onSel={setRi} />
      <div className="gpm-pills"><button type="button" className="gpm-info" onClick={() => { setLi(Math.max(0, n - 2)); setRi(n - 1); }}>Latest 2 days</button></div>
      {d && (
        <div className="gpm-kvs">
          <KV label="National gas Δ" prov="D" value={`${sgn(d.gasDelta)} MMCFD`} tone={d.gasDelta >= 0 ? 'good' : 'bad'} />
          <KV label="LNG Δ" prov="D" value={`${sgn(d.lngDelta)} MMCFD`} tone={d.lngDelta >= 0 ? 'good' : 'bad'} />
          <KV label="Bibiyana Δ" prov="D" value={`${sgn(d.bibiyanaDelta)} MMCFD`} tone={d.bibiyanaDelta >= 0 ? 'good' : 'bad'} />
          <KV label="Fulfillment Δ" prov="D" value={`${d.fulfillmentDelta >= 0 ? '+' : '−'}${Math.abs(d.fulfillmentDelta).toFixed(1)}pp`} tone={d.fulfillmentDelta >= 0 ? 'good' : 'bad'} />
          {d.topMovers.map((m) => <KV key={m.field} label={m.field} prov="D" value={`${sgn(m.delta)} MMCFD`} sub="top mover" />)}
        </div>
      )}
    </>
  );
}

/** A 7-to-30-point sparkline for a table cell. */
function Spark({ values }: { values: number[] }) {
  const w = 56, h = 16;
  const lo = Math.min(...values), hi = Math.max(...values);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * w).toFixed(1)},${(h - 1 - ((v - lo) / (hi - lo || 1)) * (h - 2)).toFixed(1)}`).join('');
  return <svg width={w} height={h} aria-hidden className="gpe-spark"><path d={d} fill="none" strokeWidth={1.5} /></svg>;
}

/* ── the daily archive (PetrobanglaArchivePanel, unified) ────────────────── */

type View = 'timeline' | 'fields' | 'power-gap' | 'sectors' | 'compare';
const VIEWS: { id: View; l: string }[] = [
  { id: 'timeline', l: 'Timeline' }, { id: 'fields', l: 'Fields' }, { id: 'power-gap', l: 'Power' }, { id: 'sectors', l: 'Sectors' }, { id: 'compare', l: 'Compare' },
];

function Archive({ selectedDate, mode }: { selectedDate: string; mode: AudienceMode }) {
  const { index, timeline, archiveLoading, timelineLoading, error, ensureTimeline } = usePetrobanglaBootstrap();
  const { tier } = useGridTierAccess();
  const [day, setDay] = useState<PetrobanglaDaily | null>(null);
  const [view, setView] = useState<View>('timeline');
  const [preset, setPreset] = useState<ArchiveRangePreset>('1W');
  const [showMa, setShowMa] = useState(false);
  const res = useMemo(() => (index ? resolveArchiveGasDay(selectedDate, index) : { resolved: null as string | null, exact: false }), [index, selectedDate]);
  useEffect(() => { if (view !== 'compare') void ensureTimeline(); }, [view, ensureTimeline]);
  useEffect(() => { if (mode === 'analyst') setShowMa(true); }, [mode]);
  useEffect(() => {
    const d = res.resolved;
    if (!d) { setDay(null); return; }
    let off = false;
    setDay(null);
    loadArchiveDay(d, { allowPartial: mode === 'analyst' }).then((x) => { if (!off) setDay(x); }).catch(() => { if (!off) setDay(null); });
    return () => { off = true; };
  }, [res.resolved, mode]);
  const end = res.resolved ?? '';
  const locked = isArchivePresetLockedForTier(preset, tier);
  const chartDays = useMemo(() => (timeline && end ? filterTimelineByPreset(timeline.days, preset, end, { decimate: true }) : []), [timeline, preset, end]);
  const fieldDays = useMemo(() => (timeline && end ? filterTimelineByPreset(timeline.days, preset, end, { decimate: false, maxPoints: 800 }) : []), [timeline, preset, end]);

  if (archiveLoading) return <Section title="Petrobangla gas analytics"><div className="gp-skel" style={{ height: 240 }} /><p className="gpe-note">Loading field archive index…</p></Section>;
  if (error || !index) return <Section title="Petrobangla gas analytics"><div className="gp-empty">Archive unavailable: {error ?? 'missing data'}</div></Section>;
  if (!res.resolved) return <Section title="Petrobangla gas analytics"><div className="gp-empty">No archive for <strong>{selectedDate}</strong>. Coverage starts {ARCHIVE_START_DATE} — use the date selector above.</div></Section>;

  const archiveDate = res.resolved;
  const idx = lookupIndexDay(archiveDate);
  const kpis = day ? computeArchiveKpis(day) : idx ? computeArchiveKpisPreview(idx) : null;
  const preview = !day && !!idx;
  const peak = timeline?.peak ?? ARCHIVE_PEAK;
  const latestArchive = latestOkDate(index);
  const presetPills = (
    <Pills label="Range" items={ARCHIVE_RANGE_PRESETS.map((p) => `${p === 'ALL' ? 'All' : p}${isArchivePresetLockedForTier(p, tier) ? ' · plan' : ''}`)} sel={ARCHIVE_RANGE_PRESETS.indexOf(preset)} onSel={(k) => setPreset(ARCHIVE_RANGE_PRESETS[k])} />
  );
  const loadingTl = !timeline || timelineLoading;

  return (
    <>
      <Section title={<>Petrobangla gas analytics <sup className="gpe-since">since 2020</sup></>} desc={res.exact ? <>Grid date {selectedDate} · <span className="gpe-up">Synced</span></> : <>Nearest gas-day {archiveDate}</>}>
        <div className="gpm-kvs gpm-kvs--flush gpe-ctx">
          <KV label="Archive peak" prov="D" value={`${formatNumber(peak.gas, 0)} MMCFD`} sub={peak.date} tone="primary" />
          <KV label="Archive low" prov="D" value={timeline?.low ? `${formatNumber(timeline.low.gas, 0)} MMCFD` : '…'} sub={timeline?.low ? timeline.low.date : 'loading timeline'} tone="warn" />
          <KV label="Since Jan 2020" prov="D" value={`−${Math.abs(ARCHIVE_INSIGHTS.nationalDecline.pct).toFixed(1)}%`} sub="National output" tone="bad" />
        </div>
        {day?.meta.agent_summary && <p className="gpe-note">{day.meta.agent_summary}</p>}
        {kpis ? <KpiGrid kpis={kpis} preview={preview} mode={mode} archiveDate={archiveDate} gridDate={selectedDate} exact={res.exact} peakGas={peak.gas} peakDate={peak.date} sourceFile={day?.meta?.source_filename ?? null} />
          : <p className="gpe-note">Loading archive index…</p>}
        <Foot>
          <span>Tap a figure for its breakdown and the report section it comes from.</span>
        </Foot>
      </Section>

      <Section title={VIEW_TITLE[view][0]} desc={view === 'timeline' && timeline ? `${timeline.ok_days.toLocaleString('en-US')} verified days — domestic vs LNG` : VIEW_TITLE[view][1]}>
        <div className="gp-seg gpe-seg" role="tablist" aria-label="Archive view">
          {VIEWS.map((v) => <button key={v.id} type="button" role="tab" aria-selected={view === v.id} className={view === v.id ? 'is-on' : ''} onClick={() => setView(v.id)}>{v.l}</button>)}
        </div>
        {view !== 'compare' && <div style={{ marginTop: 12 }}>{presetPills}</div>}
        {view !== 'compare' && locked && <div className="gpm-notice gpe-gap"><b>{archivePresetGateLabel(preset)}</b>This range needs a higher plan. <button type="button" className="gpe-link" onClick={() => setPreset('1W')}>Back to 1W</button></div>}
        {view !== 'compare' && !locked && loadingTl && <><div className="gp-skel" style={{ height: 220, marginTop: 12 }} /><p className="gpe-note">Loading national timeline…</p></>}
        {view === 'timeline' && !locked && !loadingTl && <TimelineView days={chartDays} showMa={showMa} onMa={() => setShowMa((v) => !v)} />}
        {view === 'fields' && !locked && !loadingTl && <FieldsView days={fieldDays} latestDay={day} mode={mode} />}
        {view === 'power-gap' && !locked && !loadingTl && <PowerView days={chartDays} day={day} mode={mode} />}
        {view === 'sectors' && !locked && !loadingTl && <SectorsView days={chartDays} />}
        {view === 'compare' && <CompareView index={index} latestDate={latestArchive} gridDate={selectedDate} mode={mode} />}
        <div className="gpm-pills">
          <InfoPill label="What this archive shows" sub="Field evidence">
            <p>Seven-day live window plus full archive from January 2020. Use the date selector above to inspect any gas-day — field output, plant allocation, and sector splits. Tracked since Jan 2020.</p>
            <FulfilNote />
            <p><strong>Verified anchors:</strong> Peak {peak.gas.toFixed(1)} MMCFD ({peak.date}){timeline?.low ? <> · Low {timeline.low.gas.toFixed(1)} MMCFD ({timeline.low.date})</> : null} · Jan 2020 {ARCHIVE_INSIGHTS.jan2020Baseline.gas} MMCFD → Jun 2026 {ARCHIVE_INSIGHTS.jun2026Latest.gas} MMCFD ({ARCHIVE_INSIGHTS.nationalDecline.pct}%).</p>
            <p>National gas fell from {ARCHIVE_INSIGHTS.jan2020Baseline.gas} MMCFD (Jan 2020) to ~{ARCHIVE_INSIGHTS.jun2026Latest.gas} MMCFD ({ARCHIVE_INSIGHTS.jun2026Latest.date}), a {Math.abs(ARCHIVE_INSIGHTS.nationalDecline.pct)}% decline while LNG share expanded. Power-sector fulfillment collapsed from {ARCHIVE_INSIGHTS.powerFulfillmentCollapse.from}% to {ARCHIVE_INSIGHTS.powerFulfillmentCollapse.to}%, signalling structural rationing.</p>
          </InfoPill>
        </div>
        <Foot>
          <span><a href={PETROBANGLA_OFFICIAL_SITE}>{PETROBANGLA_OFFICIAL_LABEL}</a> · {ARCHIVE_INSIGHTS.coverageDays.toLocaleString('en-US')} verified gas-days</span>
          <span>Field archive · grid date {selectedDate} · archive gas-day {archiveDate} · through {latestArchive}</span>
          <span>As published. Not independently audited.</span>
        </Foot>
      </Section>
    </>
  );
}

const VIEW_TITLE: Record<View, [string, string]> = {
  timeline: ['National timeline', 'Domestic vs LNG'],
  fields: ['Field lifeline cards', 'Major producers · archive sparklines'],
  'power-gap': ['Power sector gas gap', 'Grid-scale rationing'],
  sectors: ['Sector gas allocation', 'Power vs Fertilizer vs Others'],
  compare: ['Compare days', 'Pick any two gas-days · the later date follows the grid selector'],
};

/** The desktop footnote's live 30-day fulfilment share (PetrobanglaMacroGasSection.tsx MacroGasFieldEvidenceNote). */
function FulfilNote() {
  const { timeline } = usePetrobanglaBootstrap();
  const pct = useMemo(() => {
    const rows = (timeline?.days ?? []).filter((d) => d.parse_status === 'ok' && !d.quarantined && d.power_fulfillment_pct);
    if (rows.length < 30) return null;
    const l = rows.slice(-30);
    return l.reduce((s, d) => s + (d.power_fulfillment_pct ?? 0), 0) / l.length;
  }, [timeline]);
  return <p>Domestic output is declining, LNG is filling the gap, and power plants receive {pct != null ? `about ${pct.toFixed(0)}%` : 'well under half'} of the gas they ask for, averaged over the last 30 gas-days — the pattern the reserve depletion curve projects forward.</p>;
}

/* KPI grid: six figures, each opening its desktop tooltip as a sheet. */
function KpiGrid({ kpis, preview, mode, archiveDate, gridDate, exact, peakGas, peakDate, sourceFile }: {
  kpis: ReturnType<typeof computeArchiveKpis>; preview: boolean; mode: AudienceMode; archiveDate: string; gridDate: string; exact: boolean; peakGas: number; peakDate: string; sourceFile: string | null;
}) {
  const open = useSheet();
  const stressLabel = kpis.stressScore < 40 ? 'Moderate' : kpis.stressScore <= 65 ? 'Elevated' : 'Severe';
  const stressTone = kpis.stressColor === 'green' ? 'good' : kpis.stressColor === 'amber' ? 'warn' : 'bad';
  const short = Math.max(0, kpis.powerDemand - kpis.powerSupply);
  const domShare = kpis.totalGas > 0 ? (kpis.domesticGas / kpis.totalGas) * 100 : 0;
  const ref = (part: string) => <Foot><span>Petrobangla Daily Gas Intake/Offtake Report · {part}</span><span>Gas-day {archiveDate}{sourceFile ? ` · ${sourceFile}` : ''}</span></Foot>;
  const sheet = (title: string, body: ReactNode, note: string, part: string) => () => open(<><h3>{title}</h3><p className="gp-sheet__sub">Gas-day {archiveDate}</p><div className="gpm-kvs gpm-kvs--flush">{body}</div><p className="gpe-note">{note}</p>{ref(part)}</>);
  const pend = '…';
  return (
    <div className="gp-stats" style={{ marginTop: 12 }}>
      <Cell label="Supply stress" prov="D" value={preview ? pend : kpis.stressScore} tone={preview ? undefined : stressTone} detail={preview ? 'Loading field detail…' : stressLabel}
        onClick={sheet('Supply stress', <>
          <KV label="Stress score" prov="D" value={kpis.stressScore} tone={stressTone} />
          <KV label="Bibiyana / domestic" prov="D" value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}%`} />
          <KV label="Vs archive peak" prov="D" value={`${((kpis.totalGas / peakGas) * 100).toFixed(0)}% of ${formatNumber(peakGas, 0)}`} />
        </>, 'Weights: power gap 30% · domestic 25% · LNG 20% · Bibiyana 30% · vs peak 10%', 'I. Production — grand total')} />
      <Cell label="National gas" prov="P" value={f1(kpis.totalGas)} unit="MMCFD" detail={<>{kpis.totalGas < 2800 && <b className="gpe-down">▼ </b>}Δ baseline {kpis.totalGasDeltaBaseline >= 0 ? '+' : ''}{f1(kpis.totalGasDeltaBaseline)}</>}
        onClick={sheet('National gas', <>
          <KV label="Grand total" prov="P" value={`${f1(kpis.totalGas)} MMCFD`} />
          <KV label={`Vs ${ARCHIVE_BASELINE_DATE}`} prov="D" value={`${kpis.totalGasDeltaBaseline >= 0 ? '+' : ''}${f1(kpis.totalGasDeltaBaseline)} MMCFD`} tone={kpis.totalGasDeltaBaseline < 0 ? 'bad' : 'good'} />
          {kpis.totalGasDeltaYear != null && <KV label="Vs same day last year" prov="D" value={`${kpis.totalGasDeltaYear >= 0 ? '+' : ''}${f1(kpis.totalGasDeltaYear)} MMCFD`} />}
          {kpis.totalGasDeltaPeak != null && <KV label={`Vs peak (${peakDate})`} prov="D" value={`${kpis.totalGasDeltaPeak >= 0 ? '+' : ''}${f1(kpis.totalGasDeltaPeak)} MMCFD`} />}
          <KV label="Jan 2020 baseline" prov="P" value={`${f1(ARCHIVE_BASELINE_GAS)} MMCFD`} />
        </>, exact ? `Synced to grid date ${gridDate}` : `Nearest gas-day to ${gridDate}`, 'I. Production')} />
      <Cell label="Power fulfillment" prov="D" value={preview ? pend : `${kpis.powerFulfillmentPct.toFixed(1)}%`} tone={preview ? undefined : 'bad'} detail={preview ? 'Loading plant allocation…' : `Plants got ${f1(kpis.powerSupply)} of ${f1(kpis.powerDemand)} MMCFD`}
        onClick={sheet('Power fulfillment', <>
          <KV label="Fulfillment rate" prov="D" value={`${kpis.powerFulfillmentPct.toFixed(1)}%`} tone="bad" />
          <KV label="Plants received" prov="P" value={`${f1(kpis.powerSupply)} MMCFD`} />
          <KV label="Plants requested" prov="P" value={`${f1(kpis.powerDemand)} MMCFD`} />
          <KV label="Unmet demand" prov="D" value={`${f1(short)} MMCFD`} tone="bad" />
          <KV label="Jan 2020 benchmark" prov="D" value={`${ARCHIVE_INSIGHTS.jan2020Baseline.powerFulfillment}%`} />
          <KV label="Collapse since 2020" prov="D" value={`−${(ARCHIVE_INSIGHTS.jan2020Baseline.powerFulfillment - kpis.powerFulfillmentPct).toFixed(1)} pts`} />
        </>, 'Sector allocation from Petrobangla distribution summary', 'II. Distribution')} />
      <Cell label="LNG share" prov="D" value={preview ? pend : `${kpis.lngSharePct.toFixed(1)}%`} detail={preview ? 'Loading production mix…' : `${f1(kpis.lngGasMmcfd)} MMCFD imported`}
        onClick={sheet('LNG share', <>
          <KV label="Imported LNG (RPGCL)" prov="P" value={`${f1(kpis.lngGasMmcfd)} MMCFD`} />
          <KV label="Share of national mix" prov="D" value={`${kpis.lngSharePct.toFixed(1)}%`} />
          <KV label="Domestic fields" prov="D" value={`${f1(kpis.domesticGas)} MMCFD`} />
          <KV label="Domestic share" prov="D" value={`${domShare.toFixed(1)}%`} />
          <KV label="LNG ramp since 2020" prov="D" value={`${ARCHIVE_INSIGHTS.lngRamp.from} → ${ARCHIVE_INSIGHTS.lngRamp.to} MMCFD (+${ARCHIVE_INSIGHTS.lngRamp.pct}%)`} />
        </>, 'RPGCL terminals · regasified LNG counted separately from own-field gas', 'I. Production — RPGCL (R-LNG) rows')} />
      <Cell label="Domestic output" prov="P" value={preview ? pend : f1(kpis.domesticGas)} unit="MMCFD" detail={preview ? 'Loading field output…' : 'Own gas, excluding imports'}
        onClick={sheet('Domestic output', <>
          <KV label="Own-field production" prov="D" value={`${f1(kpis.domesticGas)} MMCFD`} />
          <KV label="Vs Jan 2020 domestic" prov="D" value={`${kpis.domesticDeltaBaseline >= 0 ? '+' : ''}${f1(kpis.domesticDeltaBaseline)} MMCFD`} tone={kpis.domesticDeltaBaseline < 0 ? 'bad' : undefined} />
          <KV label="Bibiyana field" prov="P" value={`${f1(kpis.bibiyanaGas)} MMCFD`} />
          <KV label="Bibiyana share" prov="D" value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}% of domestic`} />
          <KV label="National decline" prov="D" value={`${ARCHIVE_INSIGHTS.nationalDecline.pct}% since 2020`} tone="bad" />
        </>, 'All fields except RPGCL/LNG import terminals', 'I. Production — field rows')} />
      <Cell label="Active wells" prov="P" value={preview || kpis.activeWells == null ? pend : Math.round(kpis.activeWells)} detail={mode !== 'simple' && !preview ? `Bibiyana ${f1(kpis.bibiyanaGas)} (${kpis.bibiyanaDomesticSharePct.toFixed(0)}% domestic)` : preview ? 'Loading well counts…' : 'producing'}
        onClick={sheet('Active wells', <>
          <KV label="Producing wells" prov="P" value={kpis.activeWells == null ? pend : Math.round(kpis.activeWells)} />
          <KV label="Bibiyana output" prov="P" value={`${f1(kpis.bibiyanaGas)} MMCFD`} />
          <KV label="Bibiyana decline" prov="P" value={`${ARCHIVE_INSIGHTS.bibiyanaDecline.from} → ${ARCHIVE_INSIGHTS.bibiyanaDecline.to} MMCFD`} />
          <KV label="Bibiyana wells" prov="P" value={`${ARCHIVE_INSIGHTS.bibiyanaDecline.wells} active`} />
          <KV label="Concentration risk" prov="D" value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}% of domestic from one field`} tone={kpis.bibiyanaDomesticSharePct > 45 ? 'warn' : undefined} />
        </>, 'Fewer producing wells + falling field rates = structural depletion pressure', 'I. Production — producing-wells column')} />
    </div>
  );
}

const axis = (days: { date: string }[]) => {
  const span = days.length > 1 ? (Date.parse(days[days.length - 1].date) - Date.parse(days[0].date)) / 864e5 : 0;
  return days.map((d) => (span <= 45 ? short(d.date) : monY(d.date)));
};

function TimelineView({ days, showMa, onMa }: { days: PetrobanglaTimelineDay[]; showMa: boolean; onMa: () => void }) {
  const sc = useSeriesColor();
  const cD = sc('domesticGas'), cL = sc('importedLng'), cT = 'var(--gp-on)', cM = 'var(--gp-faint)';
  const ma = useMemo(() => movingAverage(days.map((r) => r.total_gas), 7), [days]);
  const [sel, setSel] = useSel(days.length);
  const d = days[sel];
  if (!days.length) return <div className="gp-empty">No gas-days in this range.</div>;
  return (
    <>
      {d && (
        <div className="gpm-kvs">
          <KV label={<b>{d.date}</b>} value="" />
          <KV sw={cD} label="Domestic gas" prov="D" value={`${f1(d.domestic_gas)} MMCFD`} />
          <KV sw={cL} label="Imported LNG" prov="P" value={`${f1(d.lng_gas)} MMCFD`} />
          <KV sw={cT} label="Grand total" prov="P" value={`${f1(d.total_gas)} MMCFD`} />
          {showMa && <KV sw={cM} label="7-day MA" prov="D" value={`${f1(ma[sel])} MMCFD`} />}
        </div>
      )}
      <Plot ariaLabel="National gas: domestic and imported LNG, MMCFD" labels={axis(days)} sel={sel} onSel={setSel}
        series={[{ kind: 'area', values: days.map((r) => r.domestic_gas + r.lng_gas), color: cL, width: 1.5 }, { kind: 'area', values: days.map((r) => r.domestic_gas), color: cD, width: 2 }, { kind: 'line', values: days.map((r) => r.total_gas), color: cT, width: 1 }, ...(showMa ? [{ kind: 'line' as const, values: ma, color: cM, width: 2 }] : [])]} />
      <Key items={[{ label: 'Domestic gas', color: cD }, { label: 'Imported LNG (stacked)', color: cL }, { label: 'Grand total', color: cT, line: true }, ...(showMa ? [{ label: '7-day MA', color: cM, line: true }] : [])]} />
      <div className="gpm-pills">
        <button type="button" className={`gpm-info${showMa ? ' gpe-on' : ''}`} aria-pressed={showMa} onClick={onMa}><span aria-hidden>~</span>7-day MA {showMa ? 'on' : 'off'}</button>
        <TablePill label="All days" title="National timeline" sub="Every gas-day in the range, MMCFD" head={[{ label: 'Gas-day', text: true }, { label: <>Domestic<Prov kind="D" /></> }, { label: <>LNG<Prov kind="P" /></> }, { label: <>Total<Prov kind="P" /></> }, ...(showMa ? [{ label: <>7-day MA<Prov kind="D" /></> }] : [])]}
          rows={[...days].map((r, i) => [r.date, f1(r.domestic_gas), f1(r.lng_gas), f1(r.total_gas), ...(showMa ? [f1(ma[i])] : [])]).reverse()} />
      </div>
      <p className="gpe-note">Domestic fields vs imported LNG — LNG rising while domestic output falls is the long-term pattern.</p>
    </>
  );
}

type SortKey = 'largest' | 'decline' | 'depleted';
function FieldsView({ days, latestDay, mode }: { days: PetrobanglaTimelineDay[]; latestDay: PetrobanglaDaily | null; mode: AudienceMode }) {
  const [sort, setSort] = useState<SortKey>('largest');
  const open = useSheet();
  const sc = useSeriesColor();
  // Same per-card arithmetic as PetrobanglaArchiveFieldCards.tsx.
  const cards = useMemo(() => MAJOR_FIELDS.map((name) => {
    const series = days.map((d) => ({ date: d.date, gas: d.major_fields?.[name] ?? 0 })).filter((p) => p.gas > 0);
    const current = series[series.length - 1]?.gas ?? 0;
    const peak = series.reduce((b, p) => (p.gas > b.gas ? p : b), { date: '', gas: 0 });
    const pctFromPeak = peak.gas > 0 ? ((current - peak.gas) / peak.gas) * 100 : 0;
    const lf = latestDay?.production.fields.find((f) => f.field === name);
    const wells = lf?.producing_wells ?? 0;
    const capacity = lf?.capacity_mmcfd ?? 0;
    const util = capacity > 0 ? (current / capacity) * 100 : 0;
    const isRpgcl = name === 'R-LNG Terminal';
    const dom = latestDay ? latestDay.production.fields.filter((f) => f.company_code !== 'RPGCL').reduce((s, f) => s + f.gas_mmcfd, 0) : 0;
    const risk = !isRpgcl && dom > 0 && name === 'Bibiyana' && current / dom > 0.25;
    const r30 = series.slice(-30);
    const recentAvg = r30.length ? r30.reduce((s, p) => s + p.gas, 0) / r30.length : 0;
    const trend30 = r30.length >= 2 ? r30[r30.length - 1].gas - r30[0].gas : 0;
    const decline30 = r30.length >= 2 && r30[0].gas > 0 ? (trend30 / r30[0].gas) * 100 : 0;
    return { name, series, current, peak, pctFromPeak, wells, capacity, util, isRpgcl, risk, recentAvg, trend30, decline30, meta: FIELD_LIFELINE_META[name] };
  }), [days, latestDay]);
  const sorted = [...cards].sort((a, b) => (sort === 'largest' ? b.current - a.current : sort === 'decline' ? a.decline30 - b.decline30 : a.pctFromPeak - b.pctFromPeak));
  const detail = mode !== 'simple';
  const insight = (m: (typeof cards)[number]['meta']) => (mode === 'researcher' ? m.researcher : mode === 'investor' ? m.investor : mode === 'analyst' ? m.analyst : m.simple);
  const cDom = sc('domesticGas'), cLng = sc('importedLng');
  const SORTS: [SortKey, string][] = [['largest', 'Largest producer'], ['decline', 'Fastest decline'], ['depleted', 'Most depleted']];
  return (
    <>
      <div style={{ marginTop: 10 }}><Pills label="Sort fields" items={SORTS.map((s) => s[1])} sel={SORTS.findIndex((s) => s[0] === sort)} onSel={(k) => setSort(SORTS[k][0])} /></div>
      <div className="gpe-fields">
        {sorted.map((c) => (
          <button key={c.name} type="button" className="gpe-field" onClick={() => open(
            <>
              <h3>{c.name}</h3>
              <p className="gp-sheet__sub">{c.meta.operator} · {c.meta.basin}</p>
              <p className="gpe-note" style={{ marginTop: 0 }}>{c.meta.role}</p>
              <p className="gpe-note">{insight(c.meta)}</p>
              <div className="gpm-kvs">
                <KV label="Latest" prov="P" value={`${f1(c.current)} MMCFD`} />
                <KV label="Peak in range" prov="D" value={`${formatNumber(c.peak.gas, 0)} MMCFD`} sub={c.peak.date} />
                <KV label="From peak" prov="D" value={`${c.pctFromPeak >= 0 ? '+' : ''}${c.pctFromPeak.toFixed(0)}%`} />
                <KV label="Producing wells" prov="P" value={c.wells} />
                <KV label="Capacity" prov="P" value={`${formatNumber(c.capacity, 0)} MMCFD`} />
                <KV label="Capacity utilisation" prov="D" value={`${c.util.toFixed(0)}%`} />
                <KV label="30-day average" prov="D" value={`${f1(c.recentAvg)} MMCFD`} />
                <KV label="30-day trend" prov="D" value={`${c.trend30 >= 0 ? '+' : ''}${f1(c.trend30)} MMCFD`} sub={`${c.decline30.toFixed(1)}%`} />
              </div>
              <p className="gpm-pickl" style={{ marginTop: 14 }}>Daily history</p>
              <DataTable head={[{ label: 'Date', text: true }, { label: <>Gas<Prov kind="P" /></>, unit: 'MMCFD' }]} rows={[...c.series].reverse().map((p) => [p.date, f1(p.gas)])} />
            </>,
          )}>
            <span className="gpe-field__n">{c.name}{c.isRpgcl && <em>LNG</em>}{c.risk && mode === 'investor' && <em className="is-bad">Risk</em>}</span>
            <Spark2 values={c.series.map((p) => p.gas)} color={c.isRpgcl ? cLng : cDom} />
            <b>{formatNumber(c.current, 0)}<small> MMCFD</small></b>
            <span className={`gpe-field__d${c.pctFromPeak < 0 ? ' gpe-down' : ''}`}>{c.pctFromPeak >= 0 ? '+' : ''}{c.pctFromPeak.toFixed(0)}% from peak ({formatNumber(c.peak.gas, 0)} · {c.peak.date})</span>
            {detail && <span className="gpe-field__d">{c.wells} wells · {c.util.toFixed(0)}% capacity util · 30d trend {c.trend30 >= 0 ? '+' : ''}{f1(c.trend30)} MMCFD</span>}
          </button>
        ))}
      </div>
      <div className="gpm-pills">
        <InfoPill label="Reading the field cards" sub="Field lifeline cards">
          <p><strong>Layman:</strong> Same wells, less gas over time means the underground reservoir is tiring.</p>
          <p><strong>Analyst note:</strong> Pair field cards with National Timeline and Power Gas Gap tabs to connect field decline to plant rationing.</p>
          <p><strong>Investor lens:</strong> Rising LNG share alongside falling domestic peaks signals structural import dependency — model fuel-cost pass-through accordingly.</p>
          <p><strong>Researcher:</strong> Raw daily JSON linked from archive footer · major_fields series in timeline-summary.json.</p>
          <p>Tap a field for its operator, basin, role, figures and full daily history.</p>
        </InfoPill>
      </div>
    </>
  );
}

function Spark2({ values, color }: { values: number[]; color: string }) {
  const w = 120, h = 28;
  if (values.length < 2) return <svg width={w} height={h} aria-hidden />;
  const lo = Math.min(...values), hi = Math.max(...values);
  const step = Math.max(1, Math.ceil(values.length / 120));
  const v = values.filter((_, i) => i % step === 0 || i === values.length - 1);
  const d = v.map((x, i) => `${i ? 'L' : 'M'}${((i / (v.length - 1)) * w).toFixed(1)},${(h - 2 - ((x - lo) / (hi - lo || 1)) * (h - 4)).toFixed(1)}`).join('');
  return <svg width={w} height={h} aria-hidden className="gpe-field__s"><path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" /></svg>;
}

function PowerView({ days, day, mode }: { days: PetrobanglaTimelineDay[]; day: PetrobanglaDaily | null; mode: AudienceMode }) {
  const rows = useMemo(() => filterTimelineDays(days).map((d) => ({ date: d.date, demand: d.power_demand ?? null, supply: d.power_supply ?? null, gap: d.power_demand == null || d.power_supply == null ? null : d.power_demand - d.power_supply, ful: d.power_fulfillment_pct ?? null })), [days]);
  const worst = worstPowerGapDays(filterTimelineDays(days), 10);
  const plants = day ? stressedPlants(day) : [];
  const [sel, setSel] = useSel(rows.length);
  const r = rows[sel];
  const cDem = 'var(--gp-bad)', cSup = 'var(--gp-good)', cGap = 'var(--gp-warn)', cFul = 'var(--gp-primary)';
  if (!rows.length) return <div className="gp-empty">No gas-days in this range.</div>;
  return (
    <>
      {r && (
        <div className="gpm-kvs">
          <KV label={<b>{r.date}</b>} value="" />
          <KV sw={cDem} label="Power demand" prov="P" value={r.demand != null ? `${f1(r.demand)} MMCFD` : '—'} />
          <KV sw={cSup} label="Power supply" prov="P" value={r.supply != null ? `${f1(r.supply)} MMCFD` : '—'} />
          <KV sw={cGap} label="Shortage" prov="D" value={r.gap != null ? `${f1(r.gap)} MMCFD` : '—'} tone="bad" />
          <KV sw={cFul} label="Fulfillment" prov="D" value={r.ful != null ? `${r.ful.toFixed(1)}%` : '—'} />
        </div>
      )}
      <Plot ariaLabel="Power sector gas demand, supply and shortage, MMCFD" labels={axis(rows)} sel={sel} onSel={setSel}
        series={[{ kind: 'area', values: rows.map((x) => x.gap), color: cGap, width: 1 }, { kind: 'line', values: rows.map((x) => x.demand), color: cDem, width: 2 }, { kind: 'line', values: rows.map((x) => x.supply), color: cSup, width: 2 }]} />
      <Key items={[{ label: 'Power demand', color: cDem, line: true }, { label: 'Power supply', color: cSup, line: true }, { label: 'Shortage (MMCFD)', color: cGap }]} />
      <p className="gpm-pickl" style={{ marginTop: 12 }}>Fulfillment %<Prov kind="D" /></p>
      <Plot height={110} ariaLabel="Power fulfillment, percent" labels={axis(rows)} sel={sel} onSel={setSel} tick={(v) => `${v}%`}
        series={[{ kind: 'line', values: rows.map((x) => x.ful), color: cFul, width: 2 }]} />
      <div className="gpm-pills">
        <TablePill label="Worst 10 days" title="Worst 10 days (gap)" sub="Largest power-sector shortfall in the range"
          head={[{ label: 'Date', text: true }, { label: <>Gap<Prov kind="D" /></>, unit: 'MMCFD' }, { label: <>Fulfillment<Prov kind="D" /></> }]}
          rows={worst.map((w) => [w.date, <span key="g" className="gpe-down">{f1(w.gap)}</span>, `${w.fulfillment.toFixed(1)}%`])} />
        <TablePill label="Stressed plants" title={`Stressed plants · ${day ? day.report.report_date_start : '—'}`} sub={plants.length ? 'Plants that got under half their gas, or none' : day ? 'No plant outages reported.' : 'Loading daily detail…'}
          head={[{ label: 'Plant', text: true }, { label: 'DISCO', text: true }, { label: <>Demand<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Supply<Prov kind="P" /></>, unit: 'MMCFD' }]}
          rows={plants.slice(0, mode === 'simple' ? 8 : 20).map((p) => [p.name, p.disco, f1(p.demand), <span key="s" className={p.supply === 0 ? 'gpe-down' : undefined}>{f1(p.supply)}</span>])} />
        <TablePill label="All days" title="Power sector gas gap" sub="Every gas-day in the range"
          head={[{ label: 'Gas-day', text: true }, { label: <>Demand<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Supply<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Shortage<Prov kind="D" /></>, unit: 'MMCFD' }, { label: <>Fulfil.<Prov kind="D" /></>, unit: '%' }]}
          rows={[...rows].reverse().map((x) => [x.date, x.demand != null ? f1(x.demand) : null, x.supply != null ? f1(x.supply) : null, x.gap != null ? f1(x.gap) : null, x.ful != null ? x.ful.toFixed(1) : null])} />
      </div>
      <p className="gpe-note">Power plants request gas and receive far less than demanded — below 50% fulfillment, load-shedding risk rises sharply.</p>
    </>
  );
}

function SectorsView({ days }: { days: PetrobanglaTimelineDay[] }) {
  const sc = useSeriesColor();
  const rows = useMemo(() => filterTimelineDays(days).map((d) => ({ date: d.date, ps: d.power_supply ?? null, pd: d.power_demand ?? null, fs: d.fertilizer_supply ?? null, fd: d.fertilizer_demand ?? null, o: d.others_mmcfd ?? null })), [days]);
  const [sel, setSel] = useSel(rows.length);
  const r = rows[sel];
  const cP = 'var(--gp-good)', cF = 'var(--gp-warn)', cO = sc('domesticGas'), cD = 'var(--gp-bad)';
  if (!rows.length) return <div className="gp-empty">No gas-days in this range.</div>;
  const stackF = rows.map((x) => (x.ps == null && x.fs == null ? null : (x.ps ?? 0) + (x.fs ?? 0)));
  const stackO = rows.map((x, i) => (stackF[i] == null && x.o == null ? null : (stackF[i] ?? 0) + (x.o ?? 0)));
  return (
    <>
      {r && (
        <div className="gpm-kvs">
          <KV label={<b>{r.date}</b>} value="" />
          <KV sw={cP} label="Power supply" prov="P" value={r.ps != null ? `${f1(r.ps)} MMCFD` : '—'} />
          <KV sw={cF} label="Fertilizer supply" prov="P" value={r.fs != null ? `${f1(r.fs)} MMCFD` : '—'} sub={r.fd != null ? `demand ${f1(r.fd)}` : undefined} />
          <KV sw={cO} label="Others/Industry" prov="P" value={r.o != null ? `${f1(r.o)} MMCFD` : '—'} />
          <KV sw={cD} label="Power demand" prov="P" value={r.pd != null ? `${f1(r.pd)} MMCFD` : '—'} />
        </div>
      )}
      <Plot ariaLabel="Gas allocation by sector, stacked, MMCFD" labels={axis(rows)} sel={sel} onSel={setSel}
        series={[{ kind: 'area', values: stackO, color: cO, width: 1.5 }, { kind: 'area', values: stackF, color: cF, width: 1.5 }, { kind: 'area', values: rows.map((x) => x.ps), color: cP, width: 1.5 }, { kind: 'line', values: rows.map((x) => x.pd), color: cD, width: 2 }]} />
      <Key items={[{ label: 'Power supply', color: cP }, { label: 'Fertilizer supply', color: cF }, { label: 'Others/Industry', color: cO }, { label: 'Power demand', color: cD, line: true }]} />
      <div className="gpm-pills">
        <TablePill label="All days" title="Sector gas allocation" sub="Every gas-day in the range"
          head={[{ label: 'Gas-day', text: true }, { label: <>Power<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Fert.<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Fert. dem.<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Others<Prov kind="P" /></>, unit: 'MMCFD' }, { label: <>Power dem.<Prov kind="P" /></>, unit: 'MMCFD' }]}
          rows={[...rows].reverse().map((x) => [x.date, x.ps != null ? f1(x.ps) : null, x.fs != null ? f1(x.fs) : null, x.fd != null ? f1(x.fd) : null, x.o != null ? f1(x.o) : null, x.pd != null ? f1(x.pd) : null])} />
      </div>
    </>
  );
}
