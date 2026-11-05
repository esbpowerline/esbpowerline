'use client';

/**
 * "Generation Mix Through the Day" — the NLDC half-hourly energy curve, by fuel,
 * stacked in dispatch order, with the unserved-load band above the stack, a
 * megawatts / share-of-mix switch, a table view and a readable tap/drag readout.
 * Mirrors power-grid/EnergyCurveChart + GenerationMixCanvas.
 */

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { EnergyCurve, GridDailyData } from '@/lib/data/grid/types';
import { buildEnergyCurveSeries } from '@/lib/data/grid/energy-curve';
import { fmt, Legend, niceTicks } from './charts';
import { fuelPalette, isNum, Prov, Row, Section } from './shared';
import { How, Note, U } from './supply-bits';

const MERIT = ['Coal', 'Gas', 'Hydro', 'Imports', 'Wind', 'Solar', 'HFO', 'Oil (HFO+HSD)', 'HSD'];
const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function useW<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
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

const tickText = (v: number, mode: 'mw' | 'share') => (mode === 'share' ? `${v}%` : Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(v));

export function MixSection({ curve, day, date }: { curve: EnergyCurve | null; day: GridDailyData; date: string }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [mode, setMode] = useState<'mw' | 'share'>('mw');
  const [showShort, setShowShort] = useState(true);
  const [pin, setPin] = useState<number | null>(null);
  const gid = useId().replace(/:/g, '');
  const { ref, w } = useW<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pal = fuelPalette(day);

  const built = useMemo(() => {
    const s = buildEnergyCurveSeries(curve ?? undefined);
    if (!s || !curve) return null;
    const rank = (n: string) => {
      const k = MERIT.indexOf(n);
      return k < 0 ? 99 : k;
    };
    const active = [...s.active].sort((a, b) => rank(a.name) - rank(b.name));
    const si = curve.fuels.indexOf('Shortage');
    // Shortage as published: a blank stays blank (never read as zero).
    const short: (number | null)[] = curve.rows.map((r) => (si >= 0 && isNum(r.mw[si]) ? (r.mw[si] as number) : null));
    let peak = 0;
    s.points.forEach((p, i) => {
      if (p.total > s.points[peak].total) peak = i;
    });
    // A fuel is derived (D) if any half hour folded more than one source column.
    const derived = new Map<string, boolean>();
    for (const g of active) derived.set(g.name, (s.breakdown.get(g.name) ?? []).some((b) => b.parts.length > 1));
    return { s, active, short, peak, derived, hasShort: short.some((v) => isNum(v) && v > 0) };
  }, [curve]);

  if (!built) {
    return (
      <Section title="Generation Mix Through the Day" desc="Every half hour, by fuel" source="NLDC daily energy curve">
        <div className="gp-empty" style={{ minHeight: 96 }}>No NLDC energy curve is loaded for this day. The curve is a separate NLDC publication; some days carry none.</div>
      </Section>
    );
  }
  const { s, active, short, peak, derived, hasShort } = built;
  const pts = s.points;
  const n = pts.length;
  const at = pin ?? peak;
  const p = pts[at];
  const useShort = showShort && hasShort;
  const col = (name: string) => pal[name] ?? active.find((g) => g.name === name)?.color ?? '#94a3b8';

  // ── geometry ──
  const h = Math.round(Math.max(260, Math.min(380, w * 0.74)));
  const f = { l: 36, r: 4, t: 10, b: 22 };
  const val = (i: number, name: string) => (pts[i][name] as number) || 0;
  const tot = (i: number) => pts[i].total;
  const sh = (i: number) => (useShort && isNum(short[i]) ? (short[i] as number) : 0);
  const norm = (i: number, v: number) => (mode === 'share' ? (tot(i) > 0 ? (v / tot(i)) * 100 : 0) : v);
  let ceil = 1;
  for (let i = 0; i < n; i++) ceil = Math.max(ceil, norm(i, tot(i) + sh(i)));
  const nt = niceTicks(0, mode === 'share' ? Math.max(100, ceil) : ceil, 4);
  const x = (i: number) => f.l + (i / Math.max(1, n - 1)) * (w - f.l - f.r);
  const y = (v: number) => f.t + (1 - v / nt.hi) * (h - f.t - f.b);
  const base = new Array(n).fill(0) as number[];
  const areas = active.map((g) => {
    const top = pts.map((_, i) => base[i] + norm(i, val(i, g.name)));
    let d = top.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    for (let i = n - 1; i >= 0; i--) d += `L${x(i).toFixed(1)},${y(base[i]).toFixed(1)}`;
    top.forEach((v, i) => (base[i] = v));
    return <path key={g.name} d={`${d}Z`} fill={col(g.name)} stroke="var(--gp-surface)" strokeWidth={0.5} />;
  });
  let band: React.ReactNode = null;
  if (useShort) {
    const lo = pts.map((_, i) => norm(i, tot(i)));
    const hi = pts.map((_, i) => norm(i, tot(i) + sh(i)));
    let d = hi.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    for (let i = n - 1; i >= 0; i--) d += `L${x(i).toFixed(1)},${y(lo[i]).toFixed(1)}`;
    band = <path d={`${d}Z`} fill={`url(#${gid})`} stroke="var(--gp-bad)" strokeWidth={1} strokeDasharray="3 3" />;
  }
  const labelIdx = pts.map((q, i) => (/^(00|06|12|18):00$/.test(q.time) ? i : -1)).filter((i) => i >= 0);
  if (pts[n - 1] && !labelIdx.includes(n - 1) && pts[n - 1].time >= '23:00') labelIdx.push(n - 1);

  const pick = (clientX: number) => {
    const el = svgRef.current;
    if (!el || n < 2) return;
    const r = el.getBoundingClientRect();
    setPin(Math.max(0, Math.min(n - 1, Math.round(((clientX - r.left - f.l) / (r.width - f.l - f.r)) * (n - 1)))));
  };

  const stack = [...active].reverse();
  const parts = (name: string) => (s.breakdown.get(name)?.[at]?.parts ?? []) as { label: string; mw: number }[];
  const sAt = isNum(short[at]) ? (short[at] as number) : null;
  const sections = stack.filter((g) => val(at, g.name) > 0);

  return (
    <Section
      title="Generation Mix Through the Day"
      desc={<>Every half hour, by fuel, as published in the NLDC daily energy curve (Date: {date})</>}
      source={<span>Source: PGCB Daily Report — En-Curve sheet, half-hourly generation by fuel · {day.sourceFiles?.pgcb ? <code style={{ fontSize: 11 }}>{day.sourceFiles.pgcb}</code> : null} · As published. Not independently audited.</span>}
    >
      <div className="gp-seg" role="tablist" aria-label="Chart or table">
        {(['chart', 'table'] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'is-on' : ''} onClick={() => setView(v)}>{v === 'chart' ? 'Chart' : 'Table'}</button>
        ))}
      </div>

      {view === 'chart' && (
        <>
          <div className="gp-seg gp-seg--spaced" role="group" aria-label="Scale">
            {(['mw', 'share'] as const).map((m) => (
              <button key={m} aria-pressed={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => setMode(m)}>{m === 'mw' ? 'Megawatts' : 'Share of mix'}</button>
            ))}
          </div>
          {hasShort && (
            <button type="button" className="gps-switch" aria-pressed={showShort} onClick={() => setShowShort((v) => !v)} style={{ marginTop: 4 }}>
              <i />Show unserved load above the stack
            </button>
          )}
          <div className="gp-kicker" style={{ marginTop: 8 }}>
            <span>{p.time} Hr{pin == null ? ' · peak generation' : ''}</span>
          </div>
          <div className="gp-hero gp-hero--md">
            <b>{fmt(p.total)}</b>
            <small>MW</small>
            <Prov kind="D" note="The half-hour total is our sum of the fuel bands the curve prints." />
          </div>
          <div ref={ref} className="gp-plot">
            <svg ref={svgRef} width={w} height={h} viewBox={`0 0 ${w || 1} ${h}`} className="gp-svg" role="img" aria-label="Generation by fuel, half hour by half hour, stacked in dispatch order"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e.clientX); }}
              onPointerMove={(e) => { if (e.buttons || e.pointerType === 'mouse') pick(e.clientX); }}>
              <defs>
                <pattern id={gid} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="var(--gp-badC)" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--gp-bad)" strokeWidth="1.5" opacity="0.7" />
                </pattern>
              </defs>
              {w > 0 && (
                <>
                  <g aria-hidden>
                    {nt.ticks.map((v, k) => (
                      <g key={k}>
                        <line x1={f.l} x2={w - f.r} y1={y(v)} y2={y(v)} className={k === 0 ? 'gp-base' : 'gp-grid'} />
                        <text x={f.l - 6} y={y(v) + 4} textAnchor="end" className="gp-tick gp-tick--out">{tickText(v, mode)}</text>
                      </g>
                    ))}
                    {labelIdx.map((i) => (
                      <text key={i} x={x(i)} y={h - 4} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="gp-tick">{pts[i].time}</text>
                    ))}
                  </g>
                  {areas}
                  {band}
                  <line x1={x(at)} x2={x(at)} y1={f.t - 6} y2={h - f.b} className="gp-cursor gp-cursor--on-fill" />
                </>
              )}
            </svg>
          </div>
          <div className="gp-hint" style={{ textAlign: 'left' }}>Tap or drag to read any half hour.</div>

          <div className="gp-rows" style={{ marginTop: 8 }}>
            {sections.map((g) => {
              const pr = parts(g.name);
              const v = val(at, g.name);
              return (
                <Row
                  key={g.name}
                  sw={col(g.name)}
                  top
                  wrap
                  name={<>{g.name}<Prov kind={derived.get(g.name) ? 'D' : 'P'} note={derived.get(g.name) ? 'Some half hours fold more than one source column (public + private plant, or several interconnectors).' : undefined} /></>}
                  sub={pr.length > 1 ? pr.map((q) => `${q.label} ${fmt(q.mw)} MW`).join(' · ') : undefined}
                  value={<>{fmt(v)} <U>MW</U></>}
                  small={`${p.total > 0 ? ((v / p.total) * 100).toFixed(1) : '—'}% of the half hour`}
                />
              );
            })}
            {isNum(sAt) && sAt > 0 && (
              <Row
                name={<>Unserved load<Prov kind="P" /></>}
                wrap
                value={<>{fmt(sAt)} <U>MW</U></>}
                small={`${((sAt / (p.total + sAt)) * 100).toFixed(1)}% of load (generation + unserved)`}
              />
            )}
          </div>
          <Note>Shares are each fuel against the half-hour total <Prov kind="D" note="Each fuel’s MW over that half hour’s total." /> Stacked in dispatch order <Prov kind="D" note="The order is ours." /> — always-on plant at the foot, last-resort plant at the top.</Note>
          <Legend items={stack.map((g) => ({ label: <>{g.name}<Prov kind={derived.get(g.name) ? 'D' : 'P'} /></>, color: col(g.name) }))} />
          {useShort && <Legend items={[{ label: <>Unserved load<Prov kind="P" /></>, color: 'var(--gp-bad)', dash: true }]} />}
        </>
      )}

      {view === 'table' && (
        <div className="gps-tbl" role="region" aria-label="Generation by fuel, half-hourly table" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                {active.map((g) => (
                  <th key={g.name}>{g.name}<Prov kind={derived.get(g.name) ? 'D' : 'P'} /></th>
                ))}
                <th>Total<Prov kind="D" /></th>
              </tr>
            </thead>
            <tbody>
              {pts.map((q) => (
                <tr key={q.time}>
                  <td>{q.time}</td>
                  {active.map((g) => {
                    const v = q[g.name] as number;
                    return <td key={g.name}>{v > 0 ? Math.round(v).toLocaleString('en-US') : '·'}</td>;
                  })}
                  <td>{Math.round(q.total).toLocaleString('en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <How title="What is being shown?">
        <p>The half-hourly fuel split stacks to the system total. Public/private plant and the imports are grouped into eight fuels; the split behind each band is in the readout. Rows are MW.</p>
        <p><b>Reading it:</b> generation peaked at <b>{pts[peak].time} Hr</b> with <b>{fmt(pts[peak].total)} MW</b> across {active.length} fuel{active.length === 1 ? '' : 's'}; bands that carried nothing are left out.</p>
        <Note>Peak is the largest half-hour total <Prov kind="D" note="Maximum of our half-hour sums." /></Note>
        <Note>The unserved-load band is hatched and sits above the stack; it is never part of it. In share mode the ceiling grows to fit it.</Note>
      </How>
    </Section>
  );
}
