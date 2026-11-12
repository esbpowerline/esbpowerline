'use client';

/**
 * Field evidence → Compare. The desktop's two-day rule
 * (petrobangla-archive/PetrobanglaArchiveCompare.tsx): the later date follows
 * the grid selector, the earlier one defaults to two years back. Both dates can
 * be set to any held gas-day inside the desktop's bounds (first to last parsed
 * day), beside the presets; the field search and the markdown copy match the
 * desktop's, including its rule that an unknown travels as a dash.
 */

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/utils';
import { useGridTierAccess } from '@/hooks/useGridTierAccess';
import { ARCHIVE_BASELINE_DATE, ARCHIVE_START_DATE } from '@/lib/data/petrobangla/constants';
import { computeArchiveKpis, getFieldGas, getRpgclGas, powerFulfillmentPct, resolveArchiveGasDay } from '@/lib/data/petrobangla/compute';
import { loadArchiveDay } from '@/lib/data/petrobangla/loadArchive';
import { isDateAllowedForTier, type GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import { COMPARE_FREE_BASELINE_DATE } from '@/lib/data/grid/public-sample-dates';
import type { AudienceMode, PetrobanglaDaily, PetrobanglaIndex } from '@/lib/data/petrobangla/types';
import { Prov } from './shared';
import { InfoPill, KV, Pills, TablePill } from './macro-kit';

const sgn = (v: number, dp = 1) => `${v >= 0 ? '+' : '−'}${formatNumber(Math.abs(v), dp)}`;
const f1 = (v: number) => formatNumber(v, 1);

const RANK: Record<GridAccessTier, number> = { visitor: 0, member: 1, plan_499: 2, plan_999: 3 };
function reqTier(date: string, latest: string): GridAccessTier {
  if (date === COMPARE_FREE_BASELINE_DATE) return 'visitor';
  for (const t of ['visitor', 'member', 'plan_499'] as GridAccessTier[]) if (isDateAllowedForTier(date, t, latest)) return t;
  return 'plan_999';
}
function matchYear(year: string, right: string, ok: string[]): string {
  const [, m, d] = right.split('-');
  if (!m || !d) return ok[0] || COMPARE_FREE_BASELINE_DATE;
  const exact = `${year}-${m}-${d}`;
  if (ok.includes(exact)) return exact;
  const inYear = ok.filter((x) => x.startsWith(`${year}-`));
  if (!inYear.length) return ok[0] || COMPARE_FREE_BASELINE_DATE;
  const t = +m * 31 + +d;
  return inYear.reduce((best, x) => { const [, cm, cd] = x.split('-'); const [, bm, bd] = best.split('-'); return Math.abs(+cm * 31 + +cd - t) < Math.abs(+bm * 31 + +bd - t) ? x : best; }, inYear[0]);
}
/** A typed day the archive does not hold snaps to the nearest held one, never to a guess. */
function nearestOk(d: string, ok: string[]): string | null {
  if (!d || !ok.length) return null;
  if (ok.includes(d)) return d;
  const t = Date.parse(d);
  if (Number.isNaN(t)) return null;
  return ok.reduce((b, x) => (Math.abs(Date.parse(x) - t) < Math.abs(Date.parse(b) - t) ? x : b), ok[0]);
}

export function CompareView({ index, latestDate, gridDate, mode }: { index: PetrobanglaIndex; latestDate: string; gridDate: string; mode: AudienceMode }) {
  const { tier } = useGridTierAccess();
  const right0 = useMemo(() => resolveArchiveGasDay(gridDate, index).resolved ?? latestDate, [gridDate, index, latestDate]);
  const ok = useMemo(() => [...new Set(index.days.filter((d) => d.parse_status === 'ok').map((d) => d.date))].sort(), [index]);
  const [isDefault, setIsDefault] = useState(true);
  const [leftYear, setLeftYear] = useState(() => String(parseInt(right0.slice(0, 4), 10) - 2));
  const [leftOverride, setLeftOverride] = useState<string | null>(null);
  const [right, setRight] = useState(right0);
  const [L, setL] = useState<PetrobanglaDaily | null>(null);
  const [R, setR] = useState<PetrobanglaDaily | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => { setRight(right0); setLeftOverride(null); }, [right0]);
  const left = tier === 'visitor' && isDefault ? COMPARE_FREE_BASELINE_DATE : leftOverride ?? matchYear(leftYear, right, ok);
  const need = RANK[reqTier(left, latestDate)] > RANK[reqTier(right, latestDate)] ? reqTier(left, latestDate) : reqTier(right, latestDate);
  const locked = !isDefault && RANK[tier] < RANK[need];
  useEffect(() => {
    let off = false;
    if (locked) { setL(null); setR(null); setLoading(false); return; }
    setLoading(true);
    Promise.all([loadArchiveDay(left, { allowPartial: mode === 'analyst' }), loadArchiveDay(right, { allowPartial: mode === 'analyst' })])
      .then(([a, b]) => { if (!off) { setL(a); setR(b); } })
      .catch(() => { if (!off) { setL(null); setR(null); } })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [left, right, mode, locked]);
  const years = useMemo(() => Array.from(new Set(ok.map((d) => d.slice(0, 4)))).sort((a, b) => b.localeCompare(a)), [ok]);
  const yoy = `${+right.slice(0, 4) - 1}${right.slice(4)}`;
  const ri = ok.indexOf(right);
  const prev = ri > 0 ? ok[ri - 1] : null;
  const reset = () => { setLeftOverride(null); setLeftYear(String(parseInt(right0.slice(0, 4), 10) - 2)); setRight(right0); setIsDefault(true); };
  const presets: [string, () => void, boolean][] = [
    ['Day before', () => { if (prev) { setLeftOverride(prev); setIsDefault(false); } }, !!prev],
    ['Year before', () => { setLeftOverride(yoy); setIsDefault(false); }, ok.includes(yoy)],
    ['Jan 2020', () => { setLeftOverride(null); setLeftYear('2020'); setRight(right0); setIsDefault(false); }, true],
    [`${ARCHIVE_BASELINE_DATE.slice(0, 4)} baseline`, () => { setLeftOverride(ARCHIVE_BASELINE_DATE); setIsDefault(false); }, true],
    ['Reset', reset, true],
  ];
  const lo = ok[0] ?? ARCHIVE_START_DATE, hi = ok[ok.length - 1] ?? latestDate;
  const pickLeft = (v: string) => { const d = nearestOk(v, ok); if (d) { setLeftOverride(d); setIsDefault(false); } };
  const pickRight = (v: string) => { const d = nearestOk(v, ok); if (d) { setRight(d); setIsDefault(false); } };
  const k = (d: PetrobanglaDaily) => {
    const gas = d.production.grand_total.gas_mmcfd, lng = getRpgclGas(d.production.fields);
    return { gas, ful: powerFulfillmentPct(d), lngS: gas > 0 ? (lng / gas) * 100 : 0, bib: getFieldGas(d.production.fields, 'Bibiyana'), wells: d.production.grand_total.producing_wells || 0 };
  };
  const lk = L ? k(L) : null, rk = R ? k(R) : null;
  const lmap = useMemo(() => new Map((L?.production.fields ?? []).map((f) => [f.field, f.gas_mmcfd])), [L]);
  const movers = L && R ? R.production.fields.map((f) => ({ field: f.field, delta: f.gas_mmcfd - (lmap.get(f.field) ?? 0) })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5) : [];
  const fieldRows = L && R ? R.production.fields.slice(0, mode === 'simple' ? 8 : 99).map((f) => { const a = lmap.get(f.field); return [f.field, a != null ? f1(a) : null, f1(f.gas_mmcfd), a != null ? sgn(f.gas_mmcfd - a) : null]; }) : [];
  const ql = q.trim().toLowerCase();
  const found = R && ql ? R.production.fields.filter((f) => f.field.toLowerCase().includes(ql) || (f.company_code ?? "").toLowerCase().includes(ql)) : [];

  const copy = async () => {
    if (!L || !R) return;
    const a = computeArchiveKpis(L), b = computeArchiveKpis(R);
    // Pasted elsewhere: a figure neither day published travels as a dash, its delta is not computed (desktop copySummary).
    const cell = (v: number | null, dg = 1) => (v == null ? '—' : v.toFixed(dg));
    const delta = (x: number | null, y: number | null, dg = 1, suf = '') => (x == null || y == null ? '—' : `${(y - x).toFixed(dg)}${suf}`);
    const md = [
      '# Petrobangla Archive Comparison', '',
      `| Metric | ${left} | ${right} | Δ |`, '|--------|------------|------------|---|',
      `| National gas (MMCFD) | ${a.totalGas.toFixed(1)} | ${b.totalGas.toFixed(1)} | ${(b.totalGas - a.totalGas).toFixed(1)} |`,
      `| Power fulfillment | ${a.powerFulfillmentPct.toFixed(1)}% | ${b.powerFulfillmentPct.toFixed(1)}% | ${(b.powerFulfillmentPct - a.powerFulfillmentPct).toFixed(1)}pp |`,
      `| LNG share | ${a.lngSharePct.toFixed(1)}% | ${b.lngSharePct.toFixed(1)}% | ${(b.lngSharePct - a.lngSharePct).toFixed(1)}pp |`,
      `| Bibiyana (MMCFD) | ${a.bibiyanaGas.toFixed(1)} | ${b.bibiyanaGas.toFixed(1)} | ${(b.bibiyanaGas - a.bibiyanaGas).toFixed(1)} |`,
      `| Active wells | ${cell(a.activeWells, 0)} | ${cell(b.activeWells, 0)} | ${delta(a.activeWells, b.activeWells, 0)} |`,
      '', `Sources: /data/petrobangla/daily/${left}.json · /data/petrobangla/daily/${right}.json`,
    ].join('\n');
    try { await navigator.clipboard.writeText(md); toast.success('Comparison copied as markdown'); } catch { toast.error('Could not copy — the browser blocked clipboard access'); }
  };

  return (
    <>
      <div className="gpe-dates">
        <label><span>Earlier date</span><input type="date" min={lo} max={hi} value={left} onChange={(e) => pickLeft(e.target.value)} /></label>
        <span className="gpe-dates__to" aria-hidden>→</span>
        <label><span>Later date</span><input type="date" min={lo} max={hi} value={right} onChange={(e) => pickRight(e.target.value)} /></label>
      </div>
      <p className="gpm-pickl" style={{ marginTop: 12 }}>Earlier year</p>
      <Pills label="Earlier year" items={years} sel={Math.max(0, years.indexOf(left.slice(0, 4)))} onSel={(i) => { setLeftYear(years[i]); setLeftOverride(null); setIsDefault(false); }} />
      <div className="gpm-pills">{presets.map(([l, fn, on]) => <button key={l} type="button" className="gpm-info gpm-info--bare" disabled={!on} onClick={fn}>{l}</button>)}</div>
      <p className="gpe-cmp"><b>{left}</b> → <b>{right}</b><span>later date follows the grid selector · held days {lo} to {hi}</span></p>
      {locked && <div className="gpm-notice gpe-gap"><b>This comparison needs a higher plan</b>One of the two gas-days is outside your access window. <button type="button" className="gpe-link" onClick={reset}>Reset</button></div>}
      {loading && !locked && <><div className="gp-skel" style={{ height: 200, marginTop: 12 }} /><p className="gpe-note">Reconciling comparative day metrics…</p></>}
      {!loading && !locked && (!lk || !rk) && <div className="gp-empty">No comparative data loaded for the selected dates.</div>}
      {!loading && lk && rk && (
        <>
          <div className="gpe-cmpgrid">
            <span /><span>{left}</span><span>{right}</span><span>Δ<Prov kind="D" /></span>
            <CmpRow l="National gas" p="P" a={f1(lk.gas)} b={f1(rk.gas)} d={rk.gas - lk.gas} u="" />
            <CmpRow l="Fulfillment" p="D" a={`${lk.ful.toFixed(0)}%`} b={`${rk.ful.toFixed(0)}%`} d={rk.ful - lk.ful} u="pp" />
            <CmpRow l="LNG share" p="D" a={`${lk.lngS.toFixed(0)}%`} b={`${rk.lngS.toFixed(0)}%`} d={rk.lngS - lk.lngS} u="pp" />
            {mode !== 'simple' && <CmpRow l="Bibiyana" p="P" a={f1(lk.bib)} b={f1(rk.bib)} d={rk.bib - lk.bib} u="" />}
            {mode !== 'simple' && <CmpRow l="Active wells" p="P" a={String(lk.wells)} b={String(rk.wells)} d={rk.wells - lk.wells} u="" dp={0} />}
          </div>
          {mode !== 'simple' && <input type="search" className="gp-search gpe-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search production fields (e.g. Bibiyana, Titas)" aria-label="Search production fields" />}
          {ql ? (
            <>
              <p className="gpm-pickl" style={{ marginTop: 12 }}>{found.length} field{found.length === 1 ? '' : 's'} matching “{q.trim()}”</p>
              <div className="gpm-kvs gpm-kvs--flush">
                {found.map((f) => { const a = lmap.get(f.field); return <KV key={f.field} label={f.company_code ? `${f.field} · ${f.company_code}` : f.field} prov="P" value={`${f1(f.gas_mmcfd)} MMCFD`} sub={a != null ? `${sgn(f.gas_mmcfd - a)} vs ${left} (${f1(a)})` : `not reported on ${left}`} />; })}
              </div>
            </>
          ) : (
            <>
              <p className="gpm-pickl" style={{ marginTop: 14 }}>Top field movers<Prov kind="D" /></p>
              <div className="gpm-kvs gpm-kvs--flush">
                {movers.map((m) => <KV key={m.field} label={m.field} value={`${sgn(m.delta)} MMCFD`} tone={m.delta >= 0 ? 'good' : 'bad'} />)}
              </div>
            </>
          )}
          <div className="gpm-pills">
            <button type="button" className="gpm-info" onClick={copy}><span aria-hidden>⧉</span>Copy as markdown</button>
            <TablePill label="Every field" title="Field by field" sub={`${left} → ${right} · MMCFD`} head={[{ label: 'Field', text: true }, { label: <>{left.slice(0, 4)}<Prov kind="P" /></> }, { label: <>{right.slice(0, 4)}<Prov kind="P" /></> }, { label: <>Δ<Prov kind="D" /></> }]} rows={fieldRows} />
            <InfoPill label="About compare" sub="Compare days">
              <p>{mode === 'simple' ? 'Side-by-side gas comparison — national total, power fulfillment, and top fields.' : mode === 'analyst' ? 'Full analyst mode: compare inline deltas field by field, and use the year-before or day-before presets.' : mode === 'investor' ? 'Risk dashboard: watch power fulfillment, LNG import share, and Bibiyana concentration shift over time.' : 'Validation reconciliation status, copy-to-markdown exports, and raw telemetry field delta tracking.'}</p>
              <p>Sources: /data/petrobangla/daily/{left}.json · /data/petrobangla/daily/{right}.json</p>
            </InfoPill>
          </div>
        </>
      )}
    </>
  );
}

function CmpRow({ l, p, a, b, d, u, dp = 1 }: { l: string; p: 'P' | 'D'; a: string; b: string; d: number; u: string; dp?: number }) {
  return (
    <>
      <span className="gpe-cmpgrid__l">{l}<Prov kind={p} /></span><span>{a}</span><span>{b}</span>
      <b className={d >= 0 ? 'gpe-up' : 'gpe-down'}>{d >= 0 ? '+' : '−'}{dp ? Math.abs(d).toFixed(1) : Math.abs(d)}{u}</b>
    </>
  );
}
