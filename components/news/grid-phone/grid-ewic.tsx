'use client';

import { useMemo, useState } from 'react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { coverageLabel } from '@/lib/data/grid/coverage';
import type { GridDailyData } from '@/lib/data/grid/types';
import { fmt, Meter, StackArea } from './charts';
import { Fact, U } from './grid-common';
import { isNum, Prov, Row, Section, useSheet } from './shared';

export function EwicSection({ day }: { day: GridDailyData }) {
  const open = useSheet();
  const theme = useChartTheme();
  const ewic = day.ewicData;
  const [i, setI] = useState<number | null>(null);

  const m = useMemo(() => {
    if (!ewic) return null;
    const rows = ewic.rows;
    const sums = rows.map((r) => r.mw.reduce<number>((a, v) => a + (isNum(v) ? v : 0), 0));
    let peak = -1;
    sums.forEach((s, k) => { if (peak < 0 || Math.abs(s) > Math.abs(sums[peak])) peak = k; });
    const net = sums.reduce((a, s) => a + s, 0);
    return { rows, sums, peak, net };
  }, [ewic]);
  if (!ewic || !m) return null;

  const genMk = (day.generationData ?? []).reduce((a, g) => a + (isNum(g.gen) ? g.gen : 0), 0);
  const totalMk = isNum(ewic.totals?.export) ? ewic.totals.export / 1e6 : null;
  const exceeds = totalMk != null && genMk > 0 && totalMk > genMk;
  const share = totalMk != null && genMk > 0 && !exceeds ? (totalMk / genMk) * 100 : null;
  const at = i ?? Math.max(0, m.peak);
  const row = m.rows[at];
  const tot = m.sums[at];
  const colors = ewic.corridors.map((_, k) => theme.categorical(k));
  const bars = ewic.circuits
    .filter((c) => c.direction === 'Export' && (c.energyKwh ?? 0) > 0)
    .map((c) => ({ ...c, kwh: c.energyKwh ?? 0, ci: Math.max(0, ewic.corridors.findIndex((n) => c.circuit.startsWith(n))) }))
    .sort((a, b) => b.kwh - a.kwh);
  const bMax = Math.max(...bars.map((b) => b.kwh), 1);
  const peakRow = m.peak >= 0 ? m.rows[m.peak] : null;

  const corridorSheet = (ci: number) =>
    open(
      <>
        <h3>{ewic.corridors[ci]}</h3>
        <p className="gp-sheet__sub">Hourly flow and metered circuits · {day.systemStats.date}</p>
        <div className="gz-sheet-h">Circuits<Prov kind="P" /></div>
        <dl className="gz-dl">
          {ewic.circuits.filter((c) => c.circuit.startsWith(ewic.corridors[ci])).map((c) => (
            <div key={c.circuit + c.direction}>
              <dt>{c.circuit} · {c.direction}</dt>
              <dd>{isNum(c.energyKwh) ? <>{fmt(c.energyKwh / 1e6, 2)} <U>MKWh</U></> : '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="gz-sheet-h">Hourly MW<Prov kind="P" /></div>
        <dl className="gz-dl">
          {m.rows.map((r) => (
            <div key={r.time}><dt>{r.time}</dt><dd>{isNum(r.mw[ci]) ? <>{fmt(r.mw[ci])} <U>MW</U></> : '—'}</dd></div>
          ))}
        </dl>
      </>,
    );

  const how = () =>
    open(
      <>
        <h3>About the interconnector</h3>
        <p>Positive MW is flow from <b>West to East</b>; negative is East to West. Every reading in the archive so far has been positive — the western grid has exported to the eastern one on every hour on record, and Total Import has been zero on every day.</p>
        <p>The chart stacks the corridors; each corridor’s reading is published (P) and the sum is ours (D).</p>
        <div className="gz-sheet-h">Source</div>
        <p>
          PGCB Daily Report — EWIC sheet, East-West Interconnector Log.{day.sourceFiles?.pgcb ? <> Read from: PGCB {day.sourceFiles.pgcb}.</> : null}
          <br />Flows and circuit energy as published. The energy column is headed “MkWHr” and printed in kWh; converted here, not restated.
          <br />Reporting Date: {day.systemStats.date}.
          <br />{coverageLabel('borderImports')} (cross-border series).
        </p>
      </>,
    );

  return (
    <Section title="East-West interconnector" desc="Hourly flow across the three corridors joining the western and eastern grids" meta={<span className="gp-tag">EWIC</span>}>
      <div className="gp-stats gp-stats--3 gp-stats--first">
        <div className="gp-stat">
          <div className="gp-stat__l">Transferred<Prov kind="P" note="Total Export on the EWIC sheet, kWh converted to MKWh." /></div>
          <div className="gp-stat__v"><b>{totalMk == null ? '—' : fmt(totalMk, 2)}</b>{totalMk != null && <small>MKWh</small>}</div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat__l">Of generation<Prov kind="D" note="Transferred energy over the day’s national generation (sum of the PGCB fuel-mix rows)." /></div>
          <div className="gp-stat__v"><b>{share == null ? '—' : fmt(share, 1)}</b>{share != null && <small>%</small>}</div>
          {exceeds && <div className="gp-stat__d" style={{ color: 'var(--gp-warn)' }}>withheld: exceeds national generation</div>}
        </div>
        <div className="gp-stat">
          <div className="gp-stat__l">Peak<Prov kind="D" note="The hour at which the corridors together carry the most; PGCB’s P1 prints the same figure as Maximum Power Flow (W-E)." /></div>
          <div className="gp-stat__v"><b>{peakRow ? fmt(Math.abs(m.sums[m.peak])) : '—'}</b>{peakRow && <small>MW</small>}</div>
          {peakRow && <div className="gp-stat__d">at {peakRow.time}</div>}
        </div>
      </div>
      <div className="gz-line" style={{ marginTop: 12 }}>
        {m.net !== 0 && <span>Net flow {m.net > 0 ? 'west to east' : 'east to west'}<Prov kind="D" note="Sign of the sum of every corridor reading across all hours." /></span>}
        {exceeds && <span style={{ color: 'var(--gp-warn)' }}>· exceeds the day’s national generation — see the reconciliation note</span>}
      </div>

      <div className="gp-kicker"><span>{i == null ? `Peak hour · ${row?.time}` : row?.time}</span><span>Total<Prov kind="D" /></span></div>
      <div className="gp-hero gp-hero--md"><b>{fmt(Math.abs(tot))}</b><small>MW</small></div>
      <StackArea
        ariaLabel="East-West interconnector flow by corridor, hour by hour"
        labels={m.rows.map((r) => r.time)}
        groups={ewic.corridors.map((n, k) => ({ name: n, color: colors[k] }))}
        rows={m.rows.map((r) => r.mw.map((v) => (isNum(v) ? v : null)))}
        onScrub={setI}
      />
      <div className="gp-hint">Drag across the chart to read an hour</div>
      <div className="gp-rows" style={{ marginTop: 8 }}>
        {ewic.corridors.map((n, k) => {
          const v = row?.mw[k];
          return (
            <Row
              key={n}
              sw={colors[k]}
              name={<>{n}<Prov kind="P" /></>}
              wrap
              chevron
              value={isNum(v) ? <>{fmt(v)} <U>MW</U></> : '—'}
              small={isNum(v) && tot !== 0 ? `${fmt((v / tot) * 100)}% of total` : undefined}
              onClick={() => corridorSheet(k)}
            />
          );
        })}
      </div>

      {bars.length > 0 && (
        <>
          <div className="gz-sheet-h" style={{ marginTop: 20 }}>Metered energy by circuit<Prov kind="P" /></div>
          <div className="gp-rows">
            {bars.map((b) => (
              <Row
                key={b.circuit}
                sw={colors[b.ci]}
                name={b.circuit}
                value={<>{fmt(b.kwh / 1e6, 2)} <U>MKWh</U></>}
                onClick={() => corridorSheet(b.ci)}
                meter={<Meter value={b.kwh} max={bMax} color={colors[b.ci]} />}
              />
            ))}
          </div>
        </>
      )}

      {ewic.checks.length > 0 && (
        <div className="gz-warnbox">
          <b>Reconciliation note</b>
          {ewic.checks.map((c) => <p key={c.scope}>{c.message}</p>)}
        </div>
      )}
      <button type="button" className="gz-info" onClick={how}>How to read this, and the source</button>
    </Section>
  );
}
