'use client';

/**
 * Overview card 4 — the forecast. Two vintages behind one switch, as on the
 * desktop: the settled day (PGCB's projection against the audited outturn) and,
 * while a day is running, today against the projection PGCB filed that morning.
 * A difference is signed and nothing more; nothing here grades PGCB.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { compareForecastToLive, friendlyHour, minutesOfRow, type ForecastVsLive, type ForwardForecast, type LiveHourLike } from '@/lib/data/grid/forward-forecast';
import type { GridForecast } from '@/lib/data/grid/types';
import { fetchJsonDeduped } from '@/lib/data/json-request-dedupe';
import { fmt, Legend, niceTicks } from './charts';
import { usePhone } from './context';
import { isNum, Prov, Section, Stat, useSheet } from './shared';
import { dayLabel, Foot, Gap, HowTo, nextDay, useBox } from './today-util';

const POLL_MS = 15 * 60 * 1000;
type LiveGridResponse = { asOf?: string; today?: { date?: string }; hours?: LiveHourLike[] };
type Mode = 'today' | 'settled';

/** One hour on the curve, from either vintage. */
type CurveRow = { time: string; forecast: number | null; actual: number | null; before: boolean };

const mins = (t: string) => minutesOfRow(t);

/* ───────────────────────────── forecast curve ───────────────────────────── */

/**
 * Forecast against measured over a fixed 00:00–24:00 axis. Dashed and faded
 * before the issue time (those hours had already happened), solid after;
 * shaded between the curves where an hour was forecast ahead; a signed miss
 * strip underneath. Touch to read an hour; touch a blank part to clear.
 */
function ForecastCurve({ rows, issuedClock, nowMinutes, peakTime, aria }: { rows: CurveRow[]; issuedClock: string | null; nowMinutes?: number | null; peakTime?: string | null; aria: string }) {
  const { ref, w } = useBox<HTMLDivElement>();
  const [sel, setSel] = useState<number | null>(null);
  const issueM = issuedClock ? mins(issuedClock) : null;
  const L = 34;
  const R = 6;
  const T = 16;
  const h = Math.round(Math.max(230, Math.min(340, w * 0.62)));
  const B = 22;
  const strip = 44;
  const total = h + 8 + strip;
  const gen = rows.flatMap((r) => [r.forecast, r.actual]).filter(isNum);
  const body = (() => {
    if (!w || gen.length < 2) return null;
    const { lo, hi, ticks } = niceTicks(Math.min(...gen), Math.max(...gen), 4);
    const step = ticks.length > 1 ? ticks[1] - ticks[0] : 1;
    const x = (m: number) => L + (m / 1440) * (w - L - R);
    const y = (v: number) => T + (1 - (v - lo) / (hi - lo || 1)) * (h - T - B);
    const gap = (r: CurveRow) => (isNum(r.actual) && isNum(r.forecast) ? r.actual - r.forecast : null);
    const path = (pick: (r: CurveRow) => number | null, keep: (r: CurveRow) => boolean) => {
      let d = '';
      let pen = false;
      rows.forEach((r) => {
        const v = pick(r);
        if (!isNum(v) || !keep(r)) return void (pen = false);
        d += `${pen ? 'L' : 'M'}${x(mins(r.time)).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
      });
      return d;
    };
    // The forecast line stays continuous across the issue time; only its style changes.
    const fcPast = path((r) => r.forecast, (r) => r.before || (issueM != null && mins(r.time) <= issueM + 60));
    const fcAhead = path((r) => r.forecast, (r) => !r.before);
    const act = path((r) => r.actual, () => true);
    const scored = rows.filter((r) => !r.before && gap(r) != null);
    const maxErr = Math.max(1, ...scored.map((r) => Math.abs(gap(r) as number)));
    const bw = Math.max(3, Math.min(12, (w - L - R) / Math.max(rows.length, 1) - 3));
    const bands: ReactNode[] = [];
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1];
      const b = rows[i];
      if (a.before || b.before || gap(a) == null || gap(b) == null) continue;
      const ga = gap(a) as number;
      const gb = gap(b) as number;
      const short = ga + gb < 0;
      bands.push(
        <path
          key={i}
          d={`M${x(mins(a.time))},${y(a.actual as number)}L${x(mins(b.time))},${y(b.actual as number)}L${x(mins(b.time))},${y(b.forecast as number)}L${x(mins(a.time))},${y(a.forecast as number)}Z`}
          fill={short ? 'var(--gp-bad)' : 'var(--gp-primary)'}
          opacity={0.2}
        />,
      );
    }
    const peakM = peakTime ? mins(peakTime) : null;
    const peakRow = peakM != null ? rows.find((r) => mins(r.time) === peakM) : null;
    const selRow = sel != null ? rows[sel] : null;
    return (
      <>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={w - R} y1={y(t)} y2={y(t)} className="gp-grid" />
            <text x={L - 5} y={y(t) + 4} textAnchor="end" className="gp-tick gp-tick--out">
              {Math.abs(t) >= 1000 && step >= 500 ? `${+(t / 1000).toFixed(step >= 1000 ? 0 : 1)}k` : fmt(t)}
            </text>
          </g>
        ))}
        {[0, 6, 12, 18, 24].map((hr) => (
          <text key={hr} x={x(hr * 60)} y={h - 5} textAnchor={hr === 0 ? 'start' : hr === 24 ? 'end' : 'middle'} className="gp-tick gp-tick--out">
            {String(hr).padStart(2, '0')}:00
          </text>
        ))}
        {issueM != null && (
          <g aria-hidden>
            <rect x={L} y={T} width={Math.max(0, x(issueM) - L)} height={h - T - B} fill="var(--gp-surface2)" opacity={0.55} />
            <line x1={x(issueM)} x2={x(issueM)} y1={T - 4} y2={h - B} className="gp-marker" />
            <text x={x(issueM) + 4} y={T + 10} className="gp-tick gp-tick--out">forecast from {issuedClock}</text>
          </g>
        )}
        {nowMinutes != null && (
          <g aria-hidden>
            <rect x={x(nowMinutes)} y={T} width={Math.max(0, w - R - x(nowMinutes))} height={h - T - B} fill="var(--gp-surface2)" opacity={0.6} />
            <line x1={x(nowMinutes)} x2={x(nowMinutes)} y1={T - 4} y2={h - B} className="gp-marker" />
            <text x={x(nowMinutes) - 4} y={T + 10} textAnchor="end" className="gp-tick gp-tick--strong gp-tick--out">now</text>
          </g>
        )}
        {peakM != null && (
          <g aria-hidden>
            <line x1={x(peakM)} x2={x(peakM)} y1={T} y2={h - B} stroke="var(--gp-faint)" strokeDasharray="1 3" />
            <text x={x(peakM)} y={h - B - 5} textAnchor="middle" className="gp-tick gp-tick--out">evening peak</text>
            {peakRow && isNum(peakRow.forecast) && <circle cx={x(peakM)} cy={y(peakRow.forecast)} r={3.5} fill="var(--gp-fc)" className="gp-dot" />}
            {peakRow && isNum(peakRow.actual) && <circle cx={x(peakM)} cy={y(peakRow.actual)} r={3.5} fill="var(--gp-primary)" className="gp-dot" />}
          </g>
        )}
        {bands}
        {fcPast && <path d={fcPast} fill="none" stroke="var(--gp-fc)" strokeWidth={1.5} strokeDasharray="3 4" opacity={0.5} />}
        {fcAhead && <path d={fcAhead} fill="none" stroke="var(--gp-fc)" strokeWidth={1.75} strokeDasharray="5 3" />}
        {act && <path d={act} fill="none" stroke="var(--gp-primary)" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />}
        {selRow && (
          <g aria-hidden>
            <line x1={x(mins(selRow.time))} x2={x(mins(selRow.time))} y1={T - 4} y2={h + 8 + strip} className="gp-cursor" />
            {isNum(selRow.forecast) && <circle cx={x(mins(selRow.time))} cy={y(selRow.forecast)} r={4.5} fill="var(--gp-fc)" className="gp-dot" />}
            {isNum(selRow.actual) && <circle cx={x(mins(selRow.time))} cy={y(selRow.actual)} r={4.5} fill="var(--gp-primary)" className="gp-dot" />}
          </g>
        )}
        {/* signed miss strip */}
        <g transform={`translate(0 ${h + 8})`}>
          <text x={L - 5} y={12} textAnchor="end" className="gp-tick gp-tick--out">miss</text>
          <line x1={L} x2={w - R} y1={strip / 2} y2={strip / 2} className="gp-base" />
          {scored.map((r) => {
            const g = gap(r) as number;
            const bh = Math.max(1.5, (Math.abs(g) / maxErr) * (strip / 2 - 2));
            const half = !r.time.endsWith(':00');
            return (
              <rect
                key={r.time}
                x={x(mins(r.time)) - bw / 2}
                y={g >= 0 ? strip / 2 - bh : strip / 2}
                width={bw}
                height={bh}
                rx={2}
                fill={g < 0 ? 'var(--gp-bad)' : 'var(--gp-primary)'}
                stroke={half ? 'var(--gp-on)' : undefined}
                strokeWidth={half ? 0.75 : 0}
                opacity={selRow && selRow.time !== r.time ? 0.35 : 1}
              />
            );
          })}
        </g>
      </>
    );
  })();

  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const m = ((clientX - r.left - L) / (r.width - L - R)) * 1440;
    let best = -1;
    let bd = 60;
    rows.forEach((row, i) => {
      const d = Math.abs(mins(row.time) - m);
      if (d <= bd) {
        bd = d;
        best = i;
      }
    });
    setSel(best >= 0 ? best : null);
  };
  const s = sel != null ? rows[sel] : null;
  const g = s && isNum(s.actual) && isNum(s.forecast) ? s.actual - s.forecast : null;
  return (
    <div ref={ref} className="gp-plot" style={{ marginTop: 12 }}>
      <div className="gp-subline" style={{ minHeight: 38, marginTop: 0 }}>
        {s ? (
          <>
            <b>{s.time}</b>
            {s.before ? ' · already happened' : ''}
            <br />
            Forecast <b>{fmt(s.forecast)}</b> · Measured <b>{isNum(s.actual) ? fmt(s.actual) : 'not posted'}</b>
            {!s.before && g != null ? <> · Miss <Gap mw={g} /></> : null}
          </>
        ) : (
          'Touch the curve to read an hour'
        )}
      </div>
      {body ? (
        <svg
          width={w}
          height={total}
          viewBox={`0 0 ${w} ${total}`}
          className="gp-svg"
          role="img"
          aria-label={aria}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onPointerMove={(e) => e.buttons || e.pointerType === 'touch' ? pick(e.clientX, e.currentTarget) : undefined}
        >
          {body}
        </svg>
      ) : (
        <div className="gp-empty" style={{ height: 150 }}>Not published for this day</div>
      )}
      <Legend
        items={[
          { label: 'Forecast', color: 'var(--gp-fc)', dash: true },
          { label: 'Measured', color: 'var(--gp-primary)', line: true },
          { label: 'Grid fell short of forecast', color: 'var(--gp-bad)' },
          { label: 'Grid beat forecast', color: 'var(--gp-primary)' },
          ...(nowMinutes != null ? [{ label: 'Still ahead of now', color: 'var(--gp-surface2)' }] : []),
          ...(rows.some((r) => !r.time.endsWith(':00')) ? [{ label: '18:30 / 19:30 half-hour reading (outlined)', color: 'var(--gp-on)' }] : []),
        ]}
      />
    </div>
  );
}

/* ──────────────────────────── shared small bits ─────────────────────────── */

function WorkbookSplit({ name, filed, reports, projects, lit, feeds }: { name: string; filed: string; reports: string; projects: string; lit: 'reports' | 'projects'; feeds: string }) {
  return (
    <div className="gp-tsplit">
      <div className="gp-tsplit__name">{name}</div>
      <div className="gp-tsplit__note">{filed}</div>
      <div className="gp-tsplit__halves">
        <div className={lit === 'reports' ? 'is-lit' : ''}>{reports}</div>
        <div className={lit === 'projects' ? 'is-lit' : ''}>{projects}</div>
      </div>
      <div className="gp-tsplit__feeds">feeds → {feeds}</div>
    </div>
  );
}

function useDhakaClock() {
  const [now, setNow] = useState<{ minutes: number; hourKey: string; date: string } | null>(null);
  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
      const hh = Number(get('hour')) % 24;
      const mm = Number(get('minute'));
      const pad = (n: number) => String(n).padStart(2, '0');
      setNow({ minutes: hh * 60 + mm, hourKey: `${pad(hh)}:00`, date: `${get('year')}-${get('month')}-${get('day')}` });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ───────────────────────────── settled panel ────────────────────────────── */

type Cmp = { label: string; unit: string; forecast: number | null | undefined; actual: number | null | undefined; dp: number; note?: string };

function SettledPanel({ toggle }: { toggle: ReactNode }) {
  const { day } = usePhone();
  const open = useSheet();
  const fc = day.forecast as GridForecast;
  const s = day.systemStats;
  const hoursAll = day.hourlyLoadData ?? [];
  const issuedClock = fc.issuedAt ? fc.issuedAt.slice(11, 16) : null;
  const issuedHour = issuedClock ? Number(issuedClock.slice(0, 2)) : null;
  const lead = issuedHour == null ? null : Math.max(0, 20 - issuedHour);
  const actualBy = new Map(hoursAll.map((h) => [h.time, h]));
  const rows: CurveRow[] = (fc.hourly ?? []).map((r) => ({
    time: r.time,
    forecast: r.generationMw,
    actual: actualBy.get(r.time)?.generation ?? null,
    before: issuedHour != null && Number(r.time.slice(0, 2)) < issuedHour,
  }));
  const scored = rows.filter((r) => !r.before && isNum(r.actual) && isNum(r.forecast));
  const absMean = scored.length ? scored.reduce((a, r) => a + Math.abs((r.actual as number) - (r.forecast as number)), 0) / scored.length : null;
  const worst = scored.length ? scored.reduce((a, b) => (Math.abs((b.actual as number) - (b.forecast as number)) > Math.abs((a.actual as number) - (a.forecast as number)) ? b : a)) : null;
  const worstGap = worst ? (worst.actual as number) - (worst.forecast as number) : null;

  const cmp: Cmp[] = [
    { label: 'Peak generation, evening', unit: 'MW', forecast: fc.maxGenEveningMw, actual: s.eveningPeakGen, dp: 0 },
    { label: 'Peak demand, evening', unit: 'MW', forecast: fc.maxDemandEveningMw, actual: s.eveningPeakDemand, dp: 0 },
    { label: 'Peak demand, day', unit: 'MW', forecast: fc.maxDemandDayMw, actual: s.dayPeakDemand, dp: 0 },
    { label: 'Peak demand (undifferentiated)', unit: 'MW', forecast: fc.maxDemandMw, actual: s.eveningPeakDemand, dp: 0, note: 'The 2014 layout forecast a single peak demand without naming day or evening; the actual shown is the evening peak.' },
    { label: 'Total energy generated', unit: 'MKWh', forecast: fc.totalEnergyGenMkwh, actual: s.totalEnergyGen, dp: 2 },
    { label: 'Maximum temperature, Dhaka', unit: '°C', forecast: fc.maxTempC, actual: s.maxTemp, dp: 1, note: 'Published on the 2025 layout only.' },
  ].filter((r) => r.forecast != null || r.actual != null);
  if (!cmp.length && !rows.length) return null;

  const evening = cmp[0]?.label === 'Peak generation, evening' ? cmp[0] : null;
  const eveGap = evening && isNum(evening.forecast) && isNum(evening.actual) ? evening.actual - evening.forecast : null;
  const energy = cmp.find((c) => c.label === 'Total energy generated');
  const energyGap = energy && isNum(energy.forecast) && isNum(energy.actual) ? energy.actual - energy.forecast : null;
  const areas = fc.areaLoadShedMw ? Object.entries(fc.areaLoadShedMw).filter(([, mw]) => mw > 0) : [];
  const showShed = areas.length > 0 || fc.totalLoadShedMw != null || fc.areaLoadShedUnread || fc.shortageMw != null || fc.areaLoadShedMw != null;

  const diff = (c: Cmp) => {
    if (!isNum(c.forecast) || !isNum(c.actual)) return <span className="gp-gap nil">—</span>;
    const g = c.actual - c.forecast;
    const pct = c.forecast !== 0 ? (g / Math.abs(c.forecast)) * 100 : null;
    return (
      <>
        <Gap mw={g} dp={c.dp} />
        {pct != null && <small>{pct >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(1)}%</small>}
      </>
    );
  };

  const measures = () =>
    open(
      <>
        <h3>All forecast measures</h3>
        <p className="gp-sheet__sub">PGCB’s projection for {fc.targetDay} against the audited day · differences, not a score</p>
        <div className="gp-rows">
          {cmp.map((c) => (
            <div className="gp-tmeasure" key={c.label}>
              <div className="gp-tmeasure__name">{c.label} <span className="gp-u">{c.unit}</span></div>
              <div className="gp-tmeasure__cols">
                <div><small>Forecast <Prov kind="P" /></small><b>{isNum(c.forecast) ? fmt(c.forecast, c.dp) : '—'}</b></div>
                <div><small>Actual <Prov kind="P" /></small><b>{isNum(c.actual) ? fmt(c.actual, c.dp) : '—'}</b></div>
                <div><small>Difference <Prov kind="D" note="Actual minus forecast, signed. Not a grade." /></small><b>{diff(c)}</b></div>
              </div>
              {c.note && <div className="gp-tmeasure__note">{c.note}</div>}
            </div>
          ))}
        </div>
        {showShed && (
          <div className="gp-tsub">
            <h3>Load shedding expected at the evening peak <Prov kind="P" /></h3>
            {fc.areaLoadShedUnread ? (
              <p>The area breakdown on this report did not reconcile against its own stated total, so it is not shown. The total below is PGCB’s own.</p>
            ) : areas.length ? (
              <div className="gp-tchips">{areas.map(([z, mw]) => <span className="gp-tag" key={z}>{z} <b>{mw.toLocaleString('en-US')} MW</b></span>)}</div>
            ) : (
              <p>None forecast in any of the nine areas.</p>
            )}
            <p>
              {fc.totalLoadShedMw != null && <>Forecast total <b style={{ color: 'var(--gp-on)' }}>{fc.totalLoadShedMw.toLocaleString('en-US')} MW</b></>}
              {fc.reserveMw != null && <> · reserve expected at generation end <b style={{ color: 'var(--gp-on)' }}>{fc.reserveMw.toLocaleString('en-US')} MW</b></>}
              {fc.shortageMw != null && <> · shortage expected at generation end <b style={{ color: 'var(--gp-on)' }}>{fc.shortageMw.toLocaleString('en-US')} MW</b></>}
            </p>
          </div>
        )}
      </>,
    );

  const columns = () =>
    open(
      <>
        <h3>Where each column comes from</h3>
        <p className="gp-sheet__sub">One workbook carries two days</p>
        <WorkbookSplit name={fc.issuedIn} filed={issuedClock ? `generated ~${issuedClock} on ${dayLabel(fc.targetDay)}` : `filed on ${dayLabel(fc.targetDay)}`} reports={`actuals for ${dayLabel(fc.issuedOn)}`} projects={`projection for ${dayLabel(fc.targetDay)}`} lit="projects" feeds="the Forecast column" />
        <WorkbookSplit name={day.sourceFiles?.pgcb ?? 'The next morning’s report'} filed={`filed on ${dayLabel(nextDay(fc.targetDay))}`} reports={`actuals for ${dayLabel(fc.targetDay)}`} projects={`projection for ${dayLabel(nextDay(fc.targetDay))}`} lit="reports" feeds="the Actual column" />
      </>,
    );

  return (
    <Section
      title="Forecast against outturn"
      desc={
        <>
          PGCB’s projection for {fc.targetDay} <Prov kind="P" />
          {issuedClock ? <> issued at <b style={{ color: 'var(--gp-on)' }}>{issuedClock}</b> that morning — roughly {lead} hours before the evening peak, not a day ahead.</> : <> carried by the report for energy day {fc.issuedOn}; this layout prints no generation time, so the lead is unknown.</>}
        </>
      }
    >
      {toggle}
      <div className="gp-stats gp-stats--first">
        <Stat
          label="Evening peak vs forecast"
          value={eveGap}
          unit="MW"
          prov="D"
          note="Actual evening-peak generation minus PGCB’s forecast of it."
          detail={evening && isNum(evening.forecast) ? `${fmt(evening.actual)} actual · ${fmt(evening.forecast)} forecast${eveGap != null && evening.forecast ? ` (${eveGap >= 0 ? '+' : '−'}${Math.abs((eveGap / evening.forecast) * 100).toFixed(1)}%)` : ''}` : 'not forecast'}
        />
        {absMean != null ? (
          <Stat label="Average hourly miss" value={absMean} unit="MW" prov="D" note="Mean of |measured − forecast| over the hours forecast ahead of the clock." detail={worst && worstGap != null ? `widest at ${worst.time} (${worstGap >= 0 ? '+' : '−'}${fmt(Math.abs(worstGap))} MW)` : undefined} />
        ) : (
          <Stat label="Energy vs forecast" value={energyGap} unit="MKWh" dp={2} prov="D" note="Energy generated minus PGCB’s forecast of it." detail={energy && isNum(energy.forecast) ? `${fmt(energy.actual, 2)} actual · ${fmt(energy.forecast, 2)} forecast` : 'not forecast'} />
        )}
      </div>

      <button type="button" className="gp-thow" onClick={measures}>
        <span>All forecast measures</span>
        <span aria-hidden>›</span>
      </button>

      {rows.length > 0 && (
        <div className="gp-tsub">
          <h3>Forecast curve against the measured one</h3>
          <p>
            {absMean != null ? (
              <>Mean absolute miss <b style={{ color: 'var(--gp-on)' }}>{fmt(absMean)} MW</b> across {scored.length} forecast hours <Prov kind="D" note="Mean of |measured − forecast| over hours forecast ahead of the clock. Hours before the stamp are excluded." />{worst && worstGap != null ? <> · widest at {worst.time} ({worstGap >= 0 ? '+' : '−'}{fmt(Math.abs(worstGap))} MW)</> : null}</>
            ) : (
              'No hour was both forecast ahead of the clock and measured, so no miss is computed.'
            )}
          </p>
          <ForecastCurve rows={rows} issuedClock={issuedClock} peakTime={s.peakTimes?.eveningPeakGen ?? null} aria="PGCB's forecast generation curve against the measured one, hour by hour" />
        </div>
      )}

      <button type="button" className="gp-thow" onClick={columns}>
        <span>Where each column comes from</span>
        <span aria-hidden>›</span>
      </button>
      <HowTo title="What is being shown?" label="What is being shown?">
        <p>
          PGCB publishes two days in every daily report: the reported day’s actuals and a projection for the next. This card sets that projection against what the grid then did. The projection is issued at about 10:00 on the morning of the day it describes, so hours drawn faded in the curve had already happened when it was written — they are published figures rather than predictions, and are excluded from the mean miss above.
        </p>
        <p><b>Analytical insight.</b> A miss is shown as a signed difference and nothing more. PGCB forecasts a system it does not fully control — a plant trips, gas runs short, weather moves — so a gap is not in itself a failure of forecasting, and this page does not grade it as one. What the series does support is a question no single day answers: whether the misses lean consistently one way, and whether that lean shifts with the season or the fuel mix.</p>
      </HowTo>

      <Foot
        lead={<>Source: PGCB Daily Report — {fc.layout === 'scenario' ? 'the “Forecast Scenario” block' : 'the next-day block of the Forecast sheet'} in the report for {fc.issuedOn}</>}
        rest={[
          <>Read from: PGCB <code>{fc.issuedIn}</code></>,
          'As published by PGCB. Not audited.',
          fc.issuedFrom === 'erp-mirror' ? 'Workbook acquired from PGCB’s ERP portal' : null,
          fc.issuedFrom === 'converted-text' ? 'Read from a pre-converted text copy — no workbook is held for this day' : null,
          `Reporting Period: Projection for ${fc.targetDay}${issuedClock ? `, issued ${issuedClock} that day` : ''}`,
        ]}
      />
    </Section>
  );
}

/* ────────────────────────────── live panel ──────────────────────────────── */

function LivePanel({ cmp, forward, toggle }: { cmp: ForecastVsLive; forward: ForwardForecast; toggle: ReactNode }) {
  const open = useSheet();
  const clock = useDhakaClock();
  const issued = cmp.issuedClock;
  const dayIsOver = clock != null && clock.date > cmp.day;
  const now = clock && clock.date === cmp.day ? clock : null;
  const nowRow = now ? cmp.rows.find((r) => r.time === now.hourKey) ?? null : null;
  const latest = cmp.latestMatched;
  const rowsSorted = [...cmp.rows].reverse();
  const curveRows: CurveRow[] = cmp.rows.map((r) => ({ time: r.time, forecast: r.forecastGenMw, actual: r.actualGenMw, before: r.beforeIssue }));
  const peak = cmp.rows.reduce<{ t: string; v: number } | null>((b, r) => (isNum(r.forecastGenMw) && (!b || r.forecastGenMw > b.v) ? { t: r.time, v: r.forecastGenMw } : b), null);

  const table = () =>
    open(
      <>
        <h3>Hour by hour</h3>
        <p className="gp-sheet__sub">{cmp.day} · newest first · all forecast hours, including those still to come</p>
        <div className="gp-thead"><span>Hour</span><span>When</span><span>Forecast <Prov kind="P" /> · posted <Prov kind="P" /></span><span>Diff <Prov kind="D" /></span></div>
        <div className="gp-rows">
          {rowsSorted.map((r) => {
            const isNow = now != null && r.time === now.hourKey;
            const ahead = now != null && mins(r.time) > now.minutes;
            return (
              <div key={r.time} className={`gp-trow${isNow ? ' is-now' : ''}${!isNow && (ahead || r.beforeIssue) ? ' is-dim' : ''}`}>
                <b>{r.time}</b>
                <div>
                  {friendlyHour(r.time)}
                  <small>{isNow ? 'happening now' : ahead ? 'still to come' : r.beforeIssue ? 'before the forecast was filed' : r.actualGenMw != null ? 'posted' : 'due, not posted yet'}</small>
                </div>
                <div className="gp-trow__v">
                  {fmt(r.forecastGenMw)}
                  <small>{r.actualGenMw != null ? fmt(r.actualGenMw) : ahead ? 'awaiting' : 'not posted'}</small>
                </div>
                <div className="gp-trow__v">
                  <Gap mw={r.genGapMw} />
                  <small>demand <Gap mw={r.demandGapMw} /></small>
                </div>
              </div>
            );
          })}
        </div>
        <p className="gp-taudit">Forecast and posted generation are published (P); the differences are ours (D): posted minus forecast, signed, for generation and for demand.</p>
      </>,
    );

  return (
    <Section
      title={<>Today against forecast <span className="gp-tag good" style={{ verticalAlign: 2, marginLeft: 4 }}>Live</span></>}
      desc={
        <>
          PGCB’s projection for {cmp.day} <Prov kind="P" />
          {issued ? <> issued at <b style={{ color: 'var(--gp-on)' }}>{issued}</b> this morning</> : null}, against the {cmp.coverage.matched} hours NLDC has posted since. The day is not over and this is not the archive: these figures are replaced by the audited workbook tomorrow.
        </>
      }
    >
      {toggle}
      <div className="gp-stats gp-stats--first">
        <Stat
          label={dayIsOver ? 'This day has ended' : now ? `Right now · ${friendlyHour(now.hourKey)}` : 'Right now'}
          value={!dayIsOver && nowRow ? nowRow.genGapMw : null}
          unit={!dayIsOver && nowRow && nowRow.genGapMw != null ? 'MW' : undefined}
          prov="D"
          note="Posted generation minus PGCB’s forecast for this hour."
          detail={dayIsOver ? 'complete — Dhaka is into the following day; the audited workbook follows this morning' : now && nowRow ? (nowRow.actualGenMw != null ? `NLDC posted ${fmt(nowRow.actualGenMw)} MW against ${fmt(nowRow.forecastGenMw)} forecast` : `not posted yet · PGCB forecast ${fmt(nowRow.forecastGenMw)} MW`) : 'waiting for the clock'}
        />
        <Stat label={`Newest posted hour · ${latest ? friendlyHour(latest.time) : '—'}`} value={latest?.genGapMw ?? null} unit="MW" prov="D" note="Posted minus forecast for the newest hour that has both." detail={latest ? `${fmt(latest.forecastGenMw)} forecast, ${fmt(latest.actualGenMw)} posted` : undefined} />
        <Stat label="Mean gap so far" value={cmp.meanGenGapMw} unit="MW" dp={1} prov="D" note="Mean signed gap over hours forecast ahead of the clock. Hours before the stamp are excluded." detail={`across ${cmp.coverage.scored} hours forecast ahead of the clock`} />
        <Stat
          label="Day so far"
          value={cmp.coverage.matched}
          unit={`of ${cmp.coverage.forecastHours} hours in`}
          prov="D"
          note="Hours with both a forecast and a posted figure, out of the hours PGCB forecast."
          detail={cmp.coverage.matched > cmp.coverage.scored ? `${cmp.coverage.matched - cmp.coverage.scored} predate the ${issued ?? 'morning'} stamp, so they are recorded, not forecast` : 'every posted hour was forecast ahead of the clock'}
        />
      </div>

      <ForecastCurve rows={curveRows} issuedClock={issued} nowMinutes={now?.minutes ?? null} peakTime={peak?.t ?? null} aria="PGCB's forecast for today against the hours NLDC has posted" />

      <button type="button" className="gp-thow" onClick={table}>
        <span>Hour-by-hour table · {cmp.rows.length} hours</span>
        <span aria-hidden>›</span>
      </button>
      <HowTo title="What is being shown?" label="What is being shown?">
        <p>
          PGCB files a projection for the coming day inside the workbook it publishes each morning — hour by hour generation, demand and load shed. NLDC separately posts what the grid actually did, an hour at a time, on the same portal. This card holds the two against each other while the day is still running, matching only hours that belong to {cmp.day}. An hour PGCB projected but NLDC has not yet posted is left blank rather than filled with a zero.
        </p>
        <p>
          Hours before the {issued ?? 'morning'} stamp had already happened when the report was generated. They are drawn faded and unshaded, and kept out of the mean and the widest gap: PGCB published them, but they were never predictions. Everything after it is reported as a signed difference and left there — positive means the grid generated more than was projected for that hour, negative less. Nothing is scored, because PGCB projects a system it does not fully control. The audited figures arrive with tomorrow’s workbook and may differ from the hourly page.
        </p>
      </HowTo>
      <Foot
        lead={<>Read from: PGCB <code>{forward.issuedIn ?? 'forecast workbook'}</code> · NLDC hourly generation & demand pages</>}
        rest={[`Reporting Period: Projection for ${cmp.day}`]}
      />
    </Section>
  );
}

/* ───────────────────────────── the card ─────────────────────────────────── */

export function TodayForecast() {
  const { day } = usePhone();
  const [live, setLive] = useState<LiveGridResponse | null>(null);
  const [forward, setForward] = useState<ForwardForecast | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let liveJson: LiveGridResponse | null = null;
      try {
        const res = await fetchJsonDeduped<LiveGridResponse>('/api/data/live-grid');
        if (!res.ok) return;
        liveJson = res.data;
      } catch {
        return;
      }
      // The forecast to fetch follows the day NLDC is posting, not this phone's clock.
      const d = liveJson?.today?.date;
      if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
      let fwd: ForwardForecast | null = null;
      try {
        const res = await fetchJsonDeduped<ForwardForecast>(`/data/forecast/${d}.json`);
        if (!res.ok) return;
        fwd = res.data;
      } catch {
        return;
      }
      if (fwd?.targetDay !== d || cancelled) return;
      setLive(liveJson);
      setForward(fwd);
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const cmp = useMemo(() => compareForecastToLive(forward, live?.hours), [forward, live]);
  const fc = day.forecast ?? null;
  const settledDay = fc?.targetDay ?? day.systemStats.date ?? null;
  const hasLive = Boolean(forward && cmp && cmp.coverage.matched > 0);
  const caughtUp = hasLive && cmp!.day === nextDay(settledDay);
  const active: Mode = !hasLive ? 'settled' : (mode ?? (caughtUp ? 'today' : 'settled'));

  const toggle = hasLive ? (
    <div className="gp-seg gp-tmode" role="group" aria-label="Which day to compare">
      <button type="button" className={active === 'today' ? 'is-on' : ''} onClick={() => setMode('today')}>
        <span><span className="gp-live-dot" />{dayLabel(cmp!.day)} live</span>
        <small>NLDC hourly</small>
      </button>
      <button type="button" className={active === 'settled' ? 'is-on' : ''} onClick={() => setMode('settled')}>
        <span>{dayLabel(settledDay)} settled</span>
        <small>audited</small>
      </button>
    </div>
  ) : null;

  if (active === 'today' && cmp && forward) return <LivePanel cmp={cmp} forward={forward} toggle={toggle} />;
  if (fc) return <SettledPanel toggle={toggle} />;
  return null;
}
