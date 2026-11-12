'use client';

/**
 * Gas Reserve Depletion, drawn for the phone.
 *
 * Reads exactly what the desktop panel reads (GasReserveDepletionTab.tsx):
 * the reserve model and its sensitivity run through fetchDataJson, and the
 * benchmark list from lib/data/macro/reserveBenchmarks. Every figure comes
 * from those; the prose is the desktop's, with long passages moved behind
 * info pills. The desktop's trajectory canvas (two plots on one year axis:
 * the reserve balance above, production stacked by field below) is redrawn
 * here at card width, y labels inside the plot, with a tapped year read out
 * underneath instead of a hover. The "Field evidence" panel (live week and
 * archive) is still the desktop's, hosted, because it is a separate
 * multi-panel component with its own loaders.
 */

import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import '@/app/grid-phone-macro-reserves.css';
import { useChartTheme } from '@/hooks/useChartTheme';
import { fetchDataJson } from '@/lib/data/runtime-data.client';
import {
  RESERVE_MODEL_PATH, RESERVE_SENSITIVITY_PATH, fractionalYear, yearOf,
  type ReserveField, type ReserveModel, type ReserveSensitivity, type ReserveTrajectoryPoint,
} from '@/lib/data/macro/reserveModel';
import { RESERVE_BENCHMARKS } from '@/lib/data/macro/reserveBenchmarks';
import { niceTicks } from './charts';
import { Prov, Section, useSheet } from './shared';
import { Foot, InfoPill, KV, TablePill, useSeriesColor } from './macro-kit';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Desktop's retrieval date for the external sources (GasReserveDepletionTab.tsx:70). */
const RETRIEVED = '18 Aug 2026';
const gasDay = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const monthYear = (iso: string) => { const [y, m] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
const n0 = (v: number) => Math.round(v).toLocaleString('en-US');

const HostedFieldEvidence = dynamic(() => import('@/components/news/power-grid/PetrobanglaMacroGasSection').then((m) => m.PetrobanglaMacroGasSection), {
  ssr: false,
  loading: function Loading() { return <div className="gp-skel" style={{ height: 320 }} />; },
});

type Props = { selectedDate: string; systemStatsDate: string; pgcbGasTotal: number };

export function MacroReserves({ selectedDate, systemStatsDate, pgcbGasTotal }: Props) {
  const [model, setModel] = useState<ReserveModel | null>(null);
  const [sens, setSens] = useState<ReserveSensitivity | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchDataJson<ReserveModel>(RESERVE_MODEL_PATH)
      .then((r) => { if (!alive) return; if (r.ok) setModel(r.data); else setFailed(true); })
      .catch(() => { if (alive) setFailed(true); });
    fetchDataJson<ReserveSensitivity>(RESERVE_SENSITIVITY_PATH)
      .then((r) => { if (alive && r.ok) setSens(r.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!model) {
    return failed ? (
      <Section title="Gas Reserve Depletion">
        <div className="gp-empty" style={{ minHeight: 96 }}>The reserve model could not be loaded. Nothing is shown rather than a trajectory built from something else.</div>
      </Section>
    ) : <><div className="gp-skel" style={{ height: 360 }} /><div className="gp-skel" style={{ height: 420 }} /></>;
  }

  return (
    <>
      <Hero model={model} />
      <Trajectory model={model} />
      <Evidence model={model} sens={sens} />
      <Fields model={model} />
      <Checks model={model} />
      <Replacement model={model} />
      <Limits model={model} />
      <Sources model={model} />
      <div className="gp-host grid-explorer gpm-hosted">
        <HostedFieldEvidence selectedDate={selectedDate} systemStatsDate={systemStatsDate} pgcbGasTotal={pgcbGasTotal} embedded />
      </div>
    </>
  );
}

/* ── hero: the four figures, the confidence line, the view ladder ───────── */

function Hero({ model }: { model: ReserveModel }) {
  const h = model.headline;
  const halves = yearOf(model, h.years_until_rate_halves);
  const rrr = h.reserve_replacement_pct_latest;
  const needed = h.new_gas_needed_to_hold_flat_10y_bcf;
  const bibiyana = model.fields.find((f) => f.field === 'Bibiyana');
  const worst = model.validation.reduce((w, v) => (Math.abs(v.difference_pct) > Math.abs(w.difference_pct) ? v : w), model.validation[0]);
  const first = model.history.monthly_rate[0]?.month.slice(0, 4) ?? '2020';
  const cells: { l: string; v: string; u: string; d: string; tone?: string }[] = [
    { l: 'Left in producing fields', v: (model.reserve_pools_bcf.producing_now / 1000).toFixed(2), u: 'Tcf', d: `${(model.anchor.producing_remaining_bcf / 1000).toFixed(2)} Tcf booked on ${gasDay(model.anchor.as_of)}, less ${Math.round(model.now.drawn_since_anchor_bcf)} BCF metered since` },
    { l: 'Reserve replacement', v: rrr != null ? rrr.toFixed(0) : '—', u: '%', tone: rrr != null && rrr < 100 ? 'bad' : 'good', d: 'of what was produced was added back, latest full year. Below 100% an operator is living off its balance sheet' },
    { l: 'Output halves by', v: halves ? String(halves) : '—', u: '', tone: 'warn', d: `${n0(model.now.national_rate_mmcfd)} → ${n0(h.rate_in_5_years_mmcfd)} MMCFD in five years, if the booked reserve is right` },
    { l: 'New gas needed to hold flat', v: (needed / 1000).toFixed(2), u: 'Tcf', d: bibiyana ? `over ten years — ${(needed / bibiyana.remaining_now_bcf).toFixed(1)}× what is left in Bibiyana` : 'over ten years' },
  ];
  return (
    <Section title="Gas Reserve Depletion" meta={<span className="gpr-risk">Structural risk</span>} desc="Macro reserves">
      <p className="gpr-note gpr-note--top">Once a year Petrobangla says how much gas is left in each field. Every morning it says how much came out. Put the two together, field by field — {model.archive_days.toLocaleString()} daily reports against the reserve statement of {gasDay(model.anchor.as_of)}.</p>
      <div className="gp-stats">
        {cells.map((c) => (
          <div key={c.l} className={`gp-stat${c.tone ? ` gpm-is-${c.tone}` : ''}`}>
            <div className="gp-stat__l">{c.l}<Prov kind="D" /></div>
            <div className="gp-stat__v"><b>{c.v}{c.u === '%' ? '%' : ''}</b>{c.u && c.u !== '%' && <small>{c.u}</small>}</div>
            <div className="gp-stat__d">{c.d}</div>
          </div>
        ))}
      </div>
      <p className="gpr-confidence">
        Add up the daily reports and you get Petrobangla&apos;s own annual production figure back to within <b>{Math.abs(worst.difference_pct).toFixed(2)}%</b>, and the Hydrocarbon Unit&apos;s separately published total to within <b>0.10%</b>. Nothing in this model is tuned to make that happen. The checks are in the back-test card below.
      </p>
      <div className="gpm-pills">
        <InfoPill label="Which view answers which question" sub="Gas Reserve Depletion">
          <p><strong>1. This panel — what is left, and for how long.</strong> The only view that looks forward. Published reserves joined to measured production, field by field, and projected. Answers &ldquo;how long&rdquo;.</p>
          <p><strong>2. National Timeline — what has actually happened.</strong> Every gas-day since {first}, domestic against imported. No modelling at all. Answers &ldquo;is the decline real, and when did it start&rdquo;.</p>
          <p><strong>3. Field evidence — what happened this week.</strong> The operational view: field, plant and sector detail from the latest reports. Answers &ldquo;who is short of gas right now&rdquo;.</p>
        </InfoPill>
      </div>
    </Section>
  );
}

/* ── the trajectory, redrawn at card width ───────────────────────────────── */

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;
function useWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  useIso(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

const HORIZON = 15;
const STOCK_H = 150;
const RATE_H = 176;
const GAP = 18;
const AXIS = 18;

function Trajectory({ model }: { model: ReserveModel }) {
  const t = useChartTheme();
  const sc = useSeriesColor();
  const { ref, w } = useWidth();
  const [year, setYear] = useState<number | null>(null);
  const colors = { measured: t.primary, reserves: sc('bdGasTariff'), decline: t.destructive, flat: t.axisTick };
  const names = model.profile.fields;

  const g = useMemo(() => {
    if (!w) return null;
    const asOf = fractionalYear(model.as_of);
    const fm = model.profile.history[0]?.month;
    const x0 = (fm ? Number(fm.slice(0, 4)) : asOf) - 0.3;
    const x1 = asOf + HORIZON;
    const x = (yr: number) => ((yr - x0) / (x1 - x0)) * w;
    const inH = (p: ReserveTrajectoryPoint) => asOf + p.m / 12 <= x1 + 0.01;
    const anchors = model.history.anchors;
    const stockMax = Math.ceil((Math.max(...anchors.map((a) => a.producing_remaining_bcf), model.now.producing_remaining_bcf) / 1000) * 1.15 * 2) / 2;
    const net = (p: ReserveTrajectoryPoint) => (p.left - (p.over ?? 0)) / 1000;
    const resPts = model.trajectory.reserves_binding.filter(inH);
    const decPts = model.trajectory.decline_binding.filter(inH);
    const floor = Math.floor(Math.min(0, ...decPts.map(net)) * 2) / 2;
    const sT = 8;
    const yS = (v: number) => sT + STOCK_H - ((v - floor) / (stockMax - floor)) * STOCK_H;
    const px = (p: ReserveTrajectoryPoint) => x(asOf + p.m / 12).toFixed(1);
    const path = (pts: ReserveTrajectoryPoint[], v: (p: ReserveTrajectoryPoint) => number) => pts.map((p, i) => `${i ? 'L' : 'M'}${px(p)},${yS(v(p)).toFixed(1)}`).join('');
    const resLine = path(resPts, (p) => p.left / 1000);
    const decLine = path(decPts, net);
    const lastRes = resPts[resPts.length - 1];
    const resArea = lastRes ? `${resLine}L${px(lastRes)},${yS(0)}L${x(asOf)},${yS(0)}Z` : '';
    const band = resPts.length && decPts.length ? `M${resPts.map((p) => `${px(p)},${yS(p.left / 1000)}`).join('L')}L${[...decPts].reverse().map((p) => `${px(p)},${yS(net(p))}`).join('L')}Z` : '';
    const flatLine = path(model.trajectory.flat.filter(inH), (p) => p.left / 1000);
    const la = anchors[anchors.length - 1];
    const measured = la ? `M${x(fractionalYear(la.as_of))},${yS(la.producing_remaining_bcf / 1000)}L${x(asOf)},${yS(model.now.producing_remaining_bcf / 1000)}` : '';
    const st = niceTicks(floor, stockMax, 3).ticks.filter((v) => v >= floor && v <= stockMax);

    const rT = sT + STOCK_H + GAP;
    const hist = model.profile.history.map((h) => { const [yy, mm] = h.month.split('-').map(Number); return { year: yy + (mm - 0.5) / 12, v: h.v }; }).filter((c) => c.year >= x0);
    const fc = model.profile.forecast.map((f) => ({ year: asOf + f.m / 12, v: f.v })).filter((c) => c.year <= x1 + 0.01);
    const tot = (v: number[]) => v.reduce((s, n) => s + n, 0);
    const rateMax = Math.ceil((Math.max(...hist.map((c) => tot(c.v)), ...fc.map((c) => tot(c.v))) * 1.06) / 250) * 250;
    const yR = (v: number) => rT + RATE_H - (v / rateMax) * RATE_H;
    const wedge = (cols: { year: number; v: number[] }[], i: number) => {
      if (cols.length < 2) return '';
      const below = (c: { v: number[] }) => c.v.slice(0, i).reduce((s, n) => s + n, 0);
      return `M${cols.map((c) => `${x(c.year).toFixed(1)},${yR(below(c) + c.v[i]).toFixed(1)}`).join('L')}L${[...cols].reverse().map((c) => `${x(c.year).toFixed(1)},${yR(below(c)).toFixed(1)}`).join('L')}Z`;
    };
    const gap = fc.length ? `M${fc.map((c) => `${x(c.year).toFixed(1)},${yR(model.now.national_rate_mmcfd).toFixed(1)}`).join('L')}L${[...fc].reverse().map((c) => `${x(c.year).toFixed(1)},${yR(tot(c.v)).toFixed(1)}`).join('L')}Z` : '';
    const rt = niceTicks(0, rateMax, 3).ticks.filter((v) => v <= rateMax);
    const span = x1 - x0;
    let step = span > 13 ? 2 : 1;
    while ((step * w) / span < 40) step = step === 1 ? 2 : step === 2 ? 5 : step + 5;
    const yt: number[] = [];
    for (let y = Math.ceil(x0 / step) * step; y <= x1; y += step) yt.push(y);
    const H = rT + RATE_H + AXIS;
    return { asOf, x0, x1, x, yS, yR, sT, rT, H, st, rt, yt, resLine, decLine, resArea, band, flatLine, measured, anchors, hist, fc, tot, gap, rateMax,
      hist_w: names.map((_, i) => wedge(hist, i)), fc_w: names.map((_, i) => wedge(fc, i)) };
  }, [model, w, names]);

  const sel = year ?? (g ? g.asOf : null);
  const reading = useMemo(() => {
    if (!g || sel == null) return null;
    const past = sel <= g.asOf;
    const cols = past ? g.hist : g.fc;
    if (!cols.length) return null;
    const col = cols.reduce((b, c) => (Math.abs(c.year - sel) < Math.abs(b.year - sel) ? c : b), cols[0]);
    const months = Math.round((sel - g.asOf) * 12);
    const pick = (pts: ReserveTrajectoryPoint[]) => pts.reduce((b, p) => (Math.abs(p.m - months) < Math.abs(b.m - months) ? p : b), pts[0]);
    return { past, col, total: g.tot(col.v), res: past ? null : pick(model.trajectory.reserves_binding), dec: past ? null : pick(model.trajectory.decline_binding) };
  }, [g, sel, model]);

  const pickAt = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!g || !w) return;
    const r = e.currentTarget.getBoundingClientRect();
    const yr = g.x0 + ((e.clientX - r.left) / w) * (g.x1 - g.x0);
    setYear(Math.min(Math.max(yr, g.x0), g.x1));
  };

  const h = model.headline;
  const ylab = reading ? (reading.past ? monthYear(`${Math.floor(reading.col.year)}-${String(Math.round((reading.col.year % 1) * 12 + 0.5)).padStart(2, '0')}`) : `${Math.floor(reading.col.year)} (projected)`) : '';

  return (
    <Section title="Reserve depletion trajectory" desc={`Production stacked by field, history and forecast, with what is left above it · ${model.profile.named_share_pct}% of today's output is the six fields named`}>
      <div className="gpr-legend">
        <span><i className="is-line" style={{ background: colors.measured }} />Measured — published reserve, metered production<Prov kind="P" /></span>
        <span><i className="is-line" style={{ background: colors.reserves }} />Reserve left if the booked 2P holds<Prov kind="D" /></span>
        <span><i className="is-dash" style={{ borderColor: colors.decline }} />Reserve left if the measured decline holds<Prov kind="D" /></span>
        <span><i className="is-dash" style={{ borderColor: colors.flat }} />Straight-line answer (for contrast)<Prov kind="D" /></span>
      </div>
      <div ref={ref} className="gp-plot gpr-plot">
        {g && (
          <svg width={w} height={g.H} viewBox={`0 0 ${w} ${g.H}`} className="gp-svg" role="img" aria-label="Gas reserve depletion and field production profile" onPointerDown={pickAt} onPointerMove={(e) => e.buttons > 0 && pickAt(e)}>
            <rect x={g.x(g.asOf)} y={0} width={w - g.x(g.asOf)} height={g.rT + RATE_H} className="gpr-future" />
            {g.st.map((v) => (
              <g key={`s${v}`} aria-hidden>
                <line x1={0} x2={w} y1={g.yS(v)} y2={g.yS(v)} className={v === 0 ? 'gp-base' : 'gp-grid'} />
                <text x={2} y={g.yS(v) - 3} className="gp-tick gpr-in">{v} Tcf</text>
              </g>
            ))}
            {g.band && <path d={g.band} fill={colors.decline} opacity={0.1} />}
            {g.resArea && <path d={g.resArea} fill={colors.reserves} opacity={0.14} />}
            <path d={g.flatLine} fill="none" stroke={colors.flat} strokeWidth={1.25} strokeDasharray="2 3" />
            <path d={g.resLine} fill="none" stroke={colors.reserves} strokeWidth={2} />
            <path d={g.decLine} fill="none" stroke={colors.decline} strokeWidth={2} strokeDasharray="5 3" />
            <path d={g.measured} fill="none" stroke={colors.measured} strokeWidth={2.25} />
            {g.anchors.map((a) => <circle key={a.as_of} cx={g.x(fractionalYear(a.as_of))} cy={g.yS(a.producing_remaining_bcf / 1000)} r={3.5} fill={colors.measured} />)}

            {names.map((_, i) => <path key={`h${i}`} d={g.hist_w[i]} fill={t.categorical(i)} opacity={0.9} />)}
            {names.map((_, i) => <path key={`f${i}`} d={g.fc_w[i]} fill={t.categorical(i)} opacity={0.45} />)}
            {g.gap && <path d={g.gap} fill={colors.decline} opacity={0.12} />}
            {g.rt.map((v) => (
              <g key={`r${v}`} aria-hidden>
                <line x1={0} x2={w} y1={g.yR(v)} y2={g.yR(v)} className={v === 0 ? 'gp-base' : 'gp-grid'} />
              </g>
            ))}
            {g.rt.filter((v) => v > 0).map((v, k, a) => <text key={`rl${v}`} x={2} y={g.yR(v) - 3} className="gp-tick gpr-in">{v.toLocaleString('en-US')}{k === a.length - 1 ? ' MMCFD' : ''}</text>)}
            <line x1={g.x(g.asOf)} x2={g.x(g.asOf)} y1={0} y2={g.rT + RATE_H} className="gpr-now" />
            <text x={g.x(g.asOf) + 4} y={10} className="gp-tick gpr-in">Today</text>
            {sel != null && <line x1={g.x(sel)} x2={g.x(sel)} y1={0} y2={g.rT + RATE_H} className="gpr-cursor" />}
            {g.yt.map((y) => <text key={y} x={g.x(y)} y={g.H - 4} textAnchor="middle" className="gp-tick">{y}</text>)}
          </svg>
        )}
      </div>
      <div className="gpr-key">
        {names.map((n, i) => <span key={n}><i style={{ background: t.categorical(i) }} />{n}</span>)}
      </div>
      {reading && (
        <>
          <p className="gpm-sub">{ylab}</p>
          <div className="gpm-kvs gpm-kvs--flush">
            <KV label={reading.past ? 'National output, measured' : 'National output, projected'} prov={reading.past ? 'P' : 'D'} value={`${n0(reading.total)} MMCFD`} />
            {reading.res && <KV label="Reserve left, booked 2P holds" prov="D" sw={colors.reserves} value={`${(reading.res.left / 1000).toFixed(2)} Tcf`} />}
            {reading.dec && <KV label="Reserve left, measured decline holds" prov="D" sw={colors.decline} value={`${((reading.dec.left - (reading.dec.over ?? 0)) / 1000).toFixed(2)} Tcf`} />}
            {names.map((n, i) => <KV key={n} label={n} sw={t.categorical(i)} value={`${n0(reading.col.v[i] ?? 0)} MMCFD`} />)}
          </div>
          <p className="gpm-hint">Tap or drag across the chart to read any month.</p>
        </>
      )}
      <p className="gpm-sub">How to read the two forward edges</p>
      <div className="gpm-kvs gpm-kvs--flush">
        <KV label="If the booked 2P holds" sw={colors.reserves} value={`${n0(h.rate_in_5_years_mmcfd)} MMCFD`} sub={<>Take the reserve figures at face value. Any field whose current decline would produce more gas than it has booked must fall faster than it has been. National output goes {n0(model.now.national_rate_mmcfd)} → {n0(h.rate_in_5_years_mmcfd)} MMCFD in five years, and {n0(h.rate_in_10_years_mmcfd)} in ten.</>} />
        <KV label="If the measured decline holds" sw={colors.decline} value={`${n0(h.rate_in_5_years_at_measured_decline_mmcfd)} MMCFD`} sub={<>Take the production trend at face value instead: every field keeps falling at the rate it has been. Output holds up better — {n0(h.rate_in_5_years_at_measured_decline_mmcfd)} MMCFD in five years — but by year ten these fields have produced {Math.round(h.unbooked_gas_needed_by_10_years_bcf)} BCF that nobody has booked. Someone is going to have to find it, or revise it into the accounts.</>} />
        <KV label="The straight-line answer" sw={colors.flat} value={`${h.years_at_current_rate_no_decline ?? '—'} yr`} sub={<>Divide what is left by today&apos;s rate and you get {h.years_at_current_rate_no_decline} years at full output, then a cliff. It is the version you will read almost everywhere, it is on the chart as a faint dotted line for comparison, and no gas field in history has ever behaved like that.</>} />
      </div>
      <Foot>
        <span>Source: <a href="https://www.petrobangla.org.bd/" rel="noopener noreferrer">Petrobangla</a> — {model.anchor.table}, pp. {model.anchor.pages.join('–')}; daily gas reports {model.history.monthly_rate[0]?.month.slice(0, 4)}–present</span>
        <span>Files: {model.anchor.document} · {model.archive_days.toLocaleString()} daily gas reports</span>
        <span>Reserve and production figures as published <Prov kind="P" />; the balance, the fits and every projection are ours <Prov kind="D" />. Not independently audited, and not put to Petrobangla for comment.</span>
        <span>Model as of {gasDay(model.as_of)} · sources retrieved {RETRIEVED}</span>
      </Foot>
    </Section>
  );
}

/* ── method (sheet) and sensitivity ─────────────────────────────────────── */

function Evidence({ model, sens }: { model: ReserveModel; sens: ReserveSensitivity | null }) {
  const fitted = model.fields.filter((f) => f.decline_basis === 'exponential-fit');
  const held = model.fields.filter((f) => f.rate_now_mmcfd > 0 && f.decline_basis !== 'exponential-fit');
  const base = sens?.base.decline;
  const delta = (v: number, ref: number) => (ref ? `${v - ref > 0 ? '+' : ''}${Math.round(((v - ref) / ref) * 100)}%` : '—');
  const h = model.headline;
  return (
    <Section title="Method" desc="The documents, the decline law, and what is deliberately left out">
      <div className="gpr-steps">
        <Step n={1} title="What goes in" prov="P">
          <p><strong>{model.anchor.table}</strong> — {model.anchor.document.replace('.pdf', '')}, p{model.anchor.pages.join('–')}. Every one of the 29 discovered fields, with how much gas was there to begin with, how much has come out, and how much is left, as of {gasDay(model.anchor.as_of)}. Our reader of that table will not save a single number unless the rows add up to the printed subtotals, the subtotals add up to the printed grand total, and the BCF total matches the TCF total beside it.</p>
          <p><strong>The daily gas reports</strong> — {model.archive_days.toLocaleString()} of them since 2020, each listing what every field produced that day. The reserve table is the bank balance; this is the spending.</p>
          <p><strong>Two older reserve statements</strong> — the 2022-23 and 2023-24 Annual Reports. They are used to check the arithmetic, never to build it.</p>
          <p><strong>What is missing, and why the top of the chart starts later.</strong> Petrobangla has published reserve figures for years — the FY2020-21 report put 9.30 Tcf in the ground — but this archive only holds the field-wise statement from 2022-23 on, and a national total cannot be split back into fields. So the reserve line begins in 2023 while the production stack below it begins in 2020, where the daily reports begin. Finding the earlier statements would extend the top half; nothing about the projection would change, because it is anchored on the newest one.</p>
        </Step>
        <Step n={2} title="The pattern: Arps exponential decline" prov="D">
          <p>A field past plateau loses a roughly constant <em>fraction</em> of its rate each year, not a constant volume. That is the Arps decline curve with b=0, the standard form in reservoir engineering for a field on stable decline:</p>
          <p className="gpr-eq">q(t) = q&#8320; · e<sup>−D·t</sup></p>
          <p>In logs that is a straight line, so D comes out of a least-squares fit on each field&apos;s last 36 months. Every fit is shown with its R² in the field view, so you can see which ones are worth anything: {fitted.length} fields fit cleanly, {held.length} are flat, rising, or too noisy to fit and are simply held at today&apos;s rate. A decline you cannot fit is not a decline worth forecasting.</p>
        </Step>
        <Step n={3} title="Why there are two answers" prov="D">
          <p>An exponential decline from q&#8320; delivers q&#8320;/D in total. Setting that equal to a field&apos;s booked remaining reserve gives the decline its booking implies:</p>
          <p className="gpr-eq">D<sub>required</sub> = q&#8320; × 365.25 ÷ remaining reserve</p>
          <p>Comparing the two is the whole model. Titas is falling at 7.7% a year and its reserve implies 7.3% — two separate statements about the same rock, agreeing. Bibiyana is falling at 11.9% and its reserve implies 27.9%. Something there has to give, and rather than pick, the chart draws both endings.</p>
        </Step>
        <Step n={4} title="What is chosen, and what it is worth" prov="D">
          <p>Nothing here is tuned. There is no constant anywhere that scales the data to make it agree with anything — the reserve balance is a published number minus a measured one, and each field&apos;s decline is fitted to that field&apos;s own history. But a forecast still has choices in it, and the fair question is how much of the answer is ours rather than the data&apos;s. So we ran the model again with each choice changed (the sensitivity table on this card).</p>
          <p>Every variation lands <em>above</em> the published projection, so the version on the chart is the most conservative of them. And the whole spread is smaller than the gap between the chart&apos;s own two edges — which is the point: what is uncertain here is not our arithmetic, it is whether the booked reserves or the observed decline is the thing that gives.</p>
        </Step>
        <Step n={5} title="Not modelled">
          <ul>
            {model.method.not_modelled.map((n) => <li key={n}>{n}</li>)}
            <li>demand — this is a supply projection. What the country wants is a separate question, and letting a demand scenario set a reservoir&apos;s output is the mistake the previous version of this panel made.</li>
          </ul>
        </Step>
      </div>
      {sens && base && (
        <>
          <p className="gpm-sub">Sensitivity · output under the measured decline</p>
          <div className="gpm-kvs gpm-kvs--flush">
            <KV label="Published model" value={`${base.y5.toLocaleString('en-US')} → ${base.y10.toLocaleString('en-US')}`} sub="36-month window · R² 0.5 · exponential (Arps b=0) · 1 MMCFD floor" />
            {sens.variants.map((v) => (
              <KV key={v.variant} label={v.variant} value={`${v.decline.y5.toLocaleString('en-US')} → ${v.decline.y10.toLocaleString('en-US')}`} sub={<>{v.note} · {delta(v.decline.y10, base.y10)} vs published at +10 yr</>} />
            ))}
          </div>
          <p className="gpm-hint">MMCFD at +5 yr → +10 yr.</p>
          <p className="gpr-note">Across every variation output at +10 years runs {sens.spread.y10[0].toLocaleString('en-US')}–{sens.spread.y10[1].toLocaleString('en-US')} MMCFD, a spread of {sens.spread.y10_pct}%. The two edges of the chart are {Math.round(((h.rate_in_10_years_at_measured_decline_mmcfd - h.rate_in_10_years_mmcfd) / h.rate_in_10_years_mmcfd) * 100)}% apart at the same date. The reserve balance itself has no choices in it at all.</p>
          <div className="gpm-pills">
            <TablePill label="Sensitivity table" title="What each choice is worth" sub="Each modelling choice varied on its own; output under the measured-decline edge."
              head={['Choice', { label: 'Output at +5 yr', unit: 'MMCFD' }, { label: 'at +10 yr', unit: 'MMCFD' }, 'vs published']}
              rows={[['Published model', base.y5.toLocaleString('en-US'), base.y10.toLocaleString('en-US'), '—'], ...sens.variants.map((v) => [v.variant, v.decline.y5.toLocaleString('en-US'), v.decline.y10.toLocaleString('en-US'), delta(v.decline.y10, base.y10)])]} />
          </div>
        </>
      )}
    </Section>
  );
}

function Step({ n, title, prov, children }: { n: number; title: string; prov?: 'P' | 'D'; children: ReactNode }) {
  const open = useSheet();
  return (
    <button type="button" className="gpr-step" onClick={() => open(<><h3>{n}. {title}</h3><div style={{ height: 12 }} /><div className="gpm-prose">{children}</div></>)}>
      <span className="gpr-step__n">{n}</span>
      <span className="gpr-step__t">{title}{prov && <Prov kind={prov} />}</span>
      <span className="gp-chev" aria-hidden>›</span>
    </button>
  );
}

/* ── field by field ─────────────────────────────────────────────────────── */

function verdictOf(f: ReserveField): { label: string; tone: string } {
  if (f.beyond_published_reserve) return { label: 'past its booking', tone: 'bad' };
  if (f.decline_basis !== 'exponential-fit') return { label: 'no usable fit', tone: 'muted' };
  if (f.decline_required_by_2p_pct_yr == null) return { label: '—', tone: 'muted' };
  const r = f.decline_pct_yr / f.decline_required_by_2p_pct_yr;
  if (r < 0.6) return { label: 'booking needs a steeper fall', tone: 'warn' };
  if (r > 1.6) return { label: 'falling faster than booked', tone: 'primary' };
  return { label: 'consistent', tone: 'good' };
}

function Fields({ model }: { model: ReserveModel }) {
  const open = useSheet();
  const rows = model.fields.filter((f) => f.rate_now_mmcfd > 0);
  const top3 = rows.slice(0, 3).reduce((s, f) => s + f.share_of_national_pct, 0);
  const big = rows[0];
  const max = Math.max(...rows.map((f) => f.rate_now_mmcfd));
  const detail = (f: ReserveField) => {
    const v = verdictOf(f);
    open(<>
      <h3>{f.field}</h3>
      <p className="gp-sheet__sub">{f.section !== 'producing' ? 'Production suspended · ' : ''}<span className={`gpr-verdict is-${v.tone}`}>{v.label}</span></p>
      <div className="gpm-kvs gpm-kvs--flush">
        <KV label="Now (MMCFD)" prov="P" value={f.rate_now_mmcfd.toFixed(0)} />
        <KV label="Share of national output" value={`${f.share_of_national_pct.toFixed(1)}%`} />
        <KV label="Booked left (BCF)" prov="P" value={f.remaining_now_bcf > 0 ? f.remaining_now_bcf.toFixed(0) : 'nil'} />
        <KV label="Measured decline (%/yr)" prov="D" value={f.decline_basis === 'exponential-fit' ? f.decline_pct_yr.toFixed(1) : f.decline_basis === 'flat-or-rising-held-flat' ? 'flat/rising' : 'unfittable'} />
        <KV label="Fit (R²)" value={f.decline_basis === 'exponential-fit' && f.decline_r2 != null ? f.decline_r2.toFixed(2) : '—'} />
        <KV label="2P implies (%/yr)" prov="D" value={f.decline_required_by_2p_pct_yr != null ? f.decline_required_by_2p_pct_yr.toFixed(1) : '—'} />
      </div>
    </>);
  };
  return (
    <Section title="Field by field" desc={`All ${rows.length} producing fields, each measured against what it has booked`}>
      <p className="gpr-note gpr-note--top">Two numbers describe every field here, and they come from different places. What Petrobangla books as its remaining reserve, and what the daily meters say it is actually doing. Where the two line up, the forecast for that field is on solid ground. Where they pull apart, that gap is the story — and almost all of it sits in one field.</p>
      {big && (
        <div className="gp-stats">
          <div className="gp-stat"><div className="gp-stat__l">{big.field}, share of national output</div><div className="gp-stat__v"><b>{big.share_of_national_pct.toFixed(1)}%</b></div></div>
          <div className="gp-stat"><div className="gp-stat__l">Top three fields</div><div className="gp-stat__v"><b>{top3.toFixed(1)}%</b></div></div>
          <div className="gp-stat"><div className="gp-stat__l">{big.field} at today&apos;s rate</div><div className="gp-stat__v"><b>{big.years_left_at_current_rate ?? '—'}</b><small>yr</small></div></div>
          <div className="gp-stat"><div className="gp-stat__l">Fields carrying the other half</div><div className="gp-stat__v"><b>{rows.length - 3}</b></div></div>
        </div>
      )}
      <div className="gpr-fhead"><span>Field · reading</span><span>Now<Prov kind="P" /></span><span>Decline<Prov kind="D" /> / 2P<Prov kind="D" /></span></div>
      <div className="gpr-fields">
        {rows.map((f) => {
          const v = verdictOf(f);
          const fit = f.decline_basis === 'exponential-fit';
          return (
            <button key={f.field} type="button" className="gpr-field" onClick={() => detail(f)}>
              <span className="gpr-field__n">{f.field}{f.section !== 'producing' && <em> suspended</em>}<small className={`gpr-verdict is-${v.tone}`}>{v.label}</small></span>
              <span className="gpr-field__v"><b>{f.rate_now_mmcfd.toFixed(0)}</b><small>{f.share_of_national_pct.toFixed(1)}%</small></span>
              <span className="gpr-field__v"><b>{fit ? f.decline_pct_yr.toFixed(1) : f.decline_basis === 'flat-or-rising-held-flat' ? 'flat' : '—'}<span className="gpr-dim"> / {f.decline_required_by_2p_pct_yr != null ? f.decline_required_by_2p_pct_yr.toFixed(1) : '—'}</span></b><small>{f.remaining_now_bcf > 0 ? `${f.remaining_now_bcf.toFixed(0)} BCF left` : 'nil left'}</small></span>
              <span className="gpr-field__bar"><i style={{ width: `${(f.rate_now_mmcfd / max) * 100}%` }} /></span>
            </button>
          );
        })}
      </div>
      <p className="gpm-hint">MMCFD now · measured decline / decline the 2P booking implies, %/yr. Tap a field for its fit (R²).</p>
      {model.now.rate_from_fields_beyond_published_reserve_mmcfd > 0 && (
        <p className="gpr-note"><strong>{Math.round(model.now.rate_from_fields_beyond_published_reserve_mmcfd)} MMCFD is produced from fields booked at nil remaining reserve.</strong> Habiganj is the bulk of it: its cumulative production is printed as equal to its 2P reserve, and Petrobangla&apos;s own footnote on that table asks for the field to be re-evaluated. Their output is kept in the rate, where it is metered, and excluded from the reserve balance, where nothing published supports a figure.</p>
      )}
      <div className="gpm-pills">
        <TablePill label="Full field table" title="Field by field" sub="Producing fields. Now and booked left as published (P); declines derived (D)."
          head={['Field', { label: 'Now', unit: 'MMCFD' }, { label: 'Share', unit: '%' }, { label: 'Booked left', unit: 'BCF' }, { label: 'Measured decline', unit: '%/yr' }, { label: 'Fit', unit: 'R²' }, { label: '2P implies', unit: '%/yr' }, { label: 'Reading', text: true }]}
          rows={rows.map((f) => [f.section !== 'producing' ? `${f.field} (suspended)` : f.field, f.rate_now_mmcfd.toFixed(0), f.share_of_national_pct.toFixed(1), f.remaining_now_bcf > 0 ? f.remaining_now_bcf.toFixed(0) : 'nil', f.decline_basis === 'exponential-fit' ? f.decline_pct_yr.toFixed(1) : f.decline_basis === 'flat-or-rising-held-flat' ? 'flat/rising' : 'unfittable', f.decline_basis === 'exponential-fit' && f.decline_r2 != null ? f.decline_r2.toFixed(2) : '—', f.decline_required_by_2p_pct_yr != null ? f.decline_required_by_2p_pct_yr.toFixed(1) : '—', verdictOf(f).label])} />
      </div>
    </Section>
  );
}

/* ── checks ─────────────────────────────────────────────────────────────── */

const INDEPENDENCE: Record<string, { label: string; tone: string; note: string }> = {
  shared: { label: 'same source', tone: 'muted', note: 'Draws on the same Petrobangla documents this model does, so agreement confirms the reading, not the reading’s truth.' },
  publication: { label: 'separate publication', tone: 'primary', note: 'A different agency compiling from the same underlying meter readings — a check on our parsing and integration.' },
  method: { label: 'independent method', tone: 'good', note: 'Built by other people by other means; the strongest comparison available.' },
};
const BENCHMARK_INDEPENDENCE: Record<string, keyof typeof INDEPENDENCE> = {
  'hcu-annual': 'publication', 'hcu-remaining': 'publication', 'adviser-parliament': 'shared', 'petrobangla-director': 'shared',
  'bonikbarta-producing': 'shared', 'iepmp-2030': 'method', 'iepmp-2040': 'method', 'bapex-2039': 'method', 'badrul-imam': 'method',
};

function Checks({ model }: { model: ReserveModel }) {
  return (
    <>
      <Section title="The back-test" meta={<Prov kind="D" />} desc="Published production against this archive's sum">
        <p className="gpr-note gpr-note--top">Each reserve statement records how much gas Petrobangla charged against reserves that year. Adding up our daily reports over the same period gets the same answer — so we can carry the balance forward on measured production, with nothing tuned to make it land anywhere.</p>
        <div className="gpr-fhead gpr-fhead--4"><span>Fiscal year</span><span>Booked<Prov kind="P" /></span><span>Archive<Prov kind="D" /></span><span>Diff.</span></div>
        <div className="gpr-tbl">
          {model.validation.map((v, i) => {
            const rev = model.revisions[i];
            return (
              <div key={v.fiscal_year} className="gpr-tr">
                <b>{v.fiscal_year}</b><span>{v.published_production_bcf.toFixed(2)}</span><span>{v.measured_production_bcf.toFixed(2)}</span><span className="is-good">{v.difference_pct > 0 ? '+' : ''}{v.difference_pct.toFixed(2)}%</span>
                <small>Reserve replacement<Prov kind="D" /> {rev?.reserve_replacement_pct != null ? `${rev.reserve_replacement_pct.toFixed(0)}%` : '—'}</small>
              </div>
            );
          })}
        </div>
        <p className="gpm-hint">Production, BCF.</p>
        <p className="gpr-note">The reserve replacement ratio is reserves added against reserves produced. {model.revisions.map((r, i) => <span key={r.from}>{i > 0 ? ' ' : ''}{monthYear(r.from)}–{monthYear(r.to)}: 2P revised {r.reserve_revision_bcf > 0 ? '+' : ''}{Math.round(r.reserve_revision_bcf)} BCF against {Math.round(r.production_bcf)} BCF produced.</span>)} A revision larger than a year&apos;s production is why the remaining balance rose in FY2023-24 while the country burned gas — and why nothing here forecasts the next revision.</p>
      </Section>

      <Section title="Against everyone else who has published a number" desc="Comparison only, never an input">
        <p className="gpr-note gpr-note--top">None of these feeds the model. And a number agreeing with ours only counts for something if it came from somewhere else — so each one says how independent it really is.</p>
        <div className="gpr-bench">
          {RESERVE_BENCHMARKS.map((b) => {
            const ind = INDEPENDENCE[BENCHMARK_INDEPENDENCE[b.id] ?? 'shared'];
            return (
              <div key={b.id} className="gpr-b">
                <div className="gpr-b__h">
                  <b>{b.url ? <a href={b.url} rel="noopener noreferrer">{b.source}</a> : b.source}</b>
                  <span className={`gpr-verdict is-${ind.tone}`}>{ind.label}</span>
                </div>
                <div className="gpr-b__m">{b.asOf} · {b.verified ? 'primary source read' : `not read at source — ${b.via}`}</div>
                <div className="gpr-b__row"><span>Their figure<Prov kind="P" /></span><p>{b.claim}{b.quote && <em> “{b.quote}”</em>}</p></div>
                <div className="gpr-b__row"><span>This model<Prov kind="D" /></span><p><strong>{b.ours(model)}</strong> — {b.reading(model)}</p></div>
              </div>
            );
          })}
        </div>
        <p className="gpr-note">{INDEPENDENCE.method.note} {INDEPENDENCE.publication.note} {INDEPENDENCE.shared.note} The reserve-life figures in circulation — eight years, ten, twelve — all divide a stock by today&apos;s rate, and none survives contact with a decline curve: on this model output halves around {yearOf(model, model.headline.years_until_rate_halves)} with several Tcf still in the ground.</p>
      </Section>
    </>
  );
}

function Replacement({ model }: { model: ReserveModel }) {
  const sc = useSeriesColor();
  const mix = model.supply_mix ?? [];
  if (!mix.length) return null;
  const first = mix[0], last = mix[mix.length - 1], r = model.replacement;
  const max = Math.max(...mix.map((m) => m.domestic_mmcfd + m.rlng_mmcfd));
  const cD = sc('domesticGas'), cL = sc('powerBudget');
  return (
    <Section title="What is replacing it" meta={<Prov kind="P" />} desc="Domestic against imported gas, metered daily">
      <p className="gpr-note gpr-note--top">The same daily reports that meter the fields also meter the LNG terminals. While domestic output fell from {n0(first.domestic_mmcfd)} to {n0(last.domestic_mmcfd)} MMCFD, imported gas went from {n0(first.rlng_mmcfd)} to {n0(last.rlng_mmcfd)} — the share arriving by ship went from {first.import_share_pct}% to {last.import_share_pct}% in {Number(last.year) - Number(first.year)} years. None of this feeds the depletion model; it is the consequence of it, measured.</p>
      <div className="gpr-legend gpr-legend--row">
        <span><i style={{ background: cD }} />Domestic<Prov kind="P" /></span>
        <span><i style={{ background: cL }} />Imported (RLNG)<Prov kind="P" /></span>
        <span>Imported share<Prov kind="D" /></span>
      </div>
      <div className="gpr-mix">
        {mix.map((m) => (
          <div key={m.year} className="gpr-mix__r">
            <b>{m.year}</b>
            <div className="gpr-mix__bar">
              <i style={{ width: `${(m.domestic_mmcfd / max) * 100}%`, background: cD }} />
              <i style={{ width: `${(m.rlng_mmcfd / max) * 100}%`, background: cL }} />
            </div>
            <span>{n0(m.domestic_mmcfd)} + {n0(m.rlng_mmcfd)}</span>
            <em>{m.import_share_pct ?? '—'}%</em>
          </div>
        ))}
      </div>
      <p className="gpm-hint">MMCFD, yearly mean of metered days. Days metered per year are in the table.</p>
      <p className="gpr-note"><strong>And the hole still to fill: {n0(r.gap_10y_mmcfd.decline_binding)}–{n0(r.gap_10y_mmcfd.reserves_binding)} MMCFD by year ten</strong><Prov kind="D" /> — the shortfall against today&apos;s domestic output under the chart&apos;s two edges, drawn as the shaded band on the production plot. At the wider end that is {r.today_rlng_mmcfd ? `${(r.gap_10y_mmcfd.reserves_binding / r.today_rlng_mmcfd).toFixed(1)} times everything the LNG terminals import today` : 'more than the terminals import today'}. It is arithmetic on our own projection, not a forecast of imports: it says how much gas has to come from somewhere, not where from or at what price.</p>
      <div className="gpm-pills">
        <TablePill title="Domestic against imported gas, by year" sub="Domestic and imported as published (P); imported share derived (D)."
          head={['Year', { label: 'Domestic', unit: 'MMCFD' }, { label: 'Imported (RLNG)', unit: 'MMCFD' }, { label: 'Imported share', unit: '%' }, 'Days metered']}
          rows={mix.map((m) => [m.year, n0(m.domestic_mmcfd), n0(m.rlng_mmcfd), m.import_share_pct ?? '—', m.days])} />
      </div>
    </Section>
  );
}

function Limits({ model }: { model: ReserveModel }) {
  const notch = (model.anomalies ?? [])[0];
  const limits = [
    { q: 'What will the replacement cost?', a: 'Volumes only, here. A taka or dollar figure needs cargo prices this archive does not hold, and an LNG price forecast is not something the daily reports can support.' },
    { q: 'What if new gas is found?', a: `Not modelled. The panel says what it would take — ${(model.headline.new_gas_needed_to_hold_flat_10y_bcf / 1000).toFixed(2)} Tcf to hold output flat for a decade — but nothing here forecasts the offshore rounds, Bhola, or any discovery.` },
    { q: 'Can they not just drill more wells?', a: 'Infill drilling and workovers raise deliverability from the same reserve. That changes the shape of the curve, pulling gas forward, not the total underneath it — and the reserve constraint in this model still binds.' },
    { q: 'Why 2P and not proved reserves?', a: 'Because 2P is what Petrobangla publishes field by field. A 1P (proved only) basis would give a materially shorter runway; the statement does not break it out, so this model cannot either.' },
    { q: 'What does it mean for power cuts or tariffs?', a: 'Out of scope. This is a supply projection; what it does to generation, industry or prices depends on demand and policy, neither of which belongs in a reservoir model.' },
    { q: 'Has Petrobangla been asked to comment?', a: 'No. Every figure here comes from documents it published, and the arithmetic is set out in full so it can be checked — but nobody at Petrobangla has been shown this projection or responded to it.' },
  ];
  return (
    <Section title="What this panel does not answer" desc="Six questions a reader will reasonably have, and the honest position on each.">
      <div className="gpr-qa">
        {limits.map((l) => <div key={l.q}><b>{l.q}</b><p>{l.a}</p></div>)}
        {notch && <div><b>And the notch at {monthYear(notch.month)}?</b><p>A {Math.round(notch.drop_pct)}% fall for a single month on the production plot, back to normal by {monthYear(notch.recovered_by)}. A drop that reverses completely is demand or an outage, never depletion — the model detects it and the chart marks it, rather than leaving a reader to wonder whether the data is broken.</p></div>}
      </div>
    </Section>
  );
}

function Sources({ model }: { model: ReserveModel }) {
  const first = model.history.monthly_rate[0]?.month ?? '';
  const last = model.as_of;
  const primary = [
    { cite: `Petrobangla. ${model.anchor.table}. ${model.anchor.document.replace('.pdf', '')}, pp. ${model.anchor.pages.join('–')}.`, role: `Reserve anchor — remaining reserve by field, stated for ${gasDay(model.anchor.as_of)}. Totals re-derived from the rows before use.` },
    ...model.history.anchors.slice(0, -1).map((a) => ({ cite: a.document.startsWith('Petrobangla') ? `${a.document}.` : `Petrobangla. ${a.document}.`, role: `Back-test only — producing-section subtotal at ${gasDay(a.as_of)}. Its per-field cells render in a CID font whose digits do not extract, so only the printed subtotal is used.` })),
    { cite: `Petrobangla. Daily gas production reports, ${first.slice(0, 4)}–${last.slice(0, 4)}.`, role: `Production — ${model.archive_days.toLocaleString()} issues held in this archive, ${first} to ${last.slice(0, 7)}, each metering every field and the LNG terminals.` },
  ];
  const ext = RESERVE_BENCHMARKS.filter((b, i, all) => all.findIndex((x) => x.source === b.source) === i);
  return (
    <Section title="Sources" desc={`Everything this panel rests on, and whether we opened it ourselves. External sources retrieved ${RETRIEVED}.`}>
      <ol className="gpr-cites">
        {primary.map((c) => <li key={c.cite}><b>{c.cite}</b><span>{c.role}</span></li>)}
        {ext.map((b) => (
          <li key={b.id}>
            <b>{b.url ? <a href={b.url} rel="noopener noreferrer">{b.source}</a> : b.source}{b.asOf ? `. ${b.asOf}.` : '.'}</b>
            <span>Comparison only, never an input. {b.verified ? 'Primary source opened and read.' : `Not read at source — ${b.via}.`}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
