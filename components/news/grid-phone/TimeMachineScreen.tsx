'use client';

/**
 * Time Machine, drawn for the phone.
 *
 * The questions put to the archive, the counts and the plan gate are the
 * desktop's own: everything stateful comes from useTimeMachine, which
 * TimeMachineTab also runs, so a period outside the reader's plan is marked
 * here exactly when it is marked there. This file only lays the answer out
 * for a thumb: series as a pill row, granularity as a segment, the range as
 * two date fields, and a reading that stays put after a tap.
 */

import { useEffect, useState } from 'react';
import '@/app/grid-phone-timemachine.css';
import { METRICS, STATE_LEGEND, strokeFor, useTimeMachine, type Point, type SeriesState } from '@/components/news/power-grid/useTimeMachine';
import { fmt } from './charts';
import { Prov, Section, Stat, useSheet } from './shared';
import { periodLabel, TimeMachineChart } from './timemachine-chart';

const PRESETS = [['30 days', 30], ['1 year', 365], ['5 years', 1826], ['All', 0]] as const;
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fieldFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const monFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const asDate = (t: string) => new Date(`${t.length === 7 ? `${t}-01` : t.slice(0, 10)}T00:00:00Z`);
const longPeriod = (t: string) => (/^\d{4}-\d{2}(-\d{2})?$/.test(t) ? (t.length === 7 ? monFmt : dayFmt).format(asDate(t)) : t);
const field = (t: string) => (t ? fieldFmt.format(asDate(t)) : '—');
const plain = (k: string) => k.replaceAll('_', ' ').toLowerCase();
const STATE_TAG: Record<SeriesState, string> = { REPORTED: 'Reported', DERIVED: 'Derived', ESTIMATED: 'Estimated', MISSING: 'Missing', RESTRICTED: 'Outside your plan' };

function DateField({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (v: string) => void }) {
  return (
    <label className="gptm-date">
      <span>{label}</span>
      <b>{field(value)}</b>
      <input type="date" aria-label={`${label} date`} value={value} min={min} max={max} onChange={(e) => e.target.value && onChange(e.target.value)} />
    </label>
  );
}

/** What the desktop tooltip says about one period, as a standing readout. */
function Reading({ p, unit }: { p: Point | null; unit: string }) {
  if (!p) return <div className="gptm-read" />;
  const gap = p.state === 'RESTRICTED' || p.value === null;
  return (
    <div className="gptm-read">
      <div className="gp-kicker">
        <span>{longPeriod(p.t)}</span>
        <span className={`gp-tag${p.state === 'RESTRICTED' ? ' gptm-tag--plan' : ''}`}>{p.value === null && p.state !== 'RESTRICTED' ? 'Missing' : STATE_TAG[p.state]}</span>
      </div>
      <div className="gp-hero gp-hero--md"><b>{gap ? '—' : fmt(p.value)}</b><small>{unit}</small></div>
      {p.state === 'RESTRICTED' ? (
        <p className="gptm-say gptm-say--plan"><b>Outside your plan.</b> ESB holds this period; your plan does not reach it, so it was not queried. This is not a gap in the archive.</p>
      ) : p.value === null ? (
        <p className="gptm-say"><b>Missing.</b> ESB queried this period and does not hold enough observations for it. Nothing is estimated in its place.</p>
      ) : (
        <p className="gptm-say">
          <Prov kind={p.state === 'REPORTED' ? 'P' : 'D'} />
          <b>{p.state === 'REPORTED' ? 'As published' : 'Mean of regular hours'}</b> · Coverage {p.coverage.observed} of {p.coverage.expected} regular observations{p.coverage.sufficient ? '' : ' — below the floor, so no value is stated'}.
        </p>
      )}
      {p.excluded && Object.keys(p.excluded).length > 0 && (
        <p className="gptm-say gptm-say--warn">{Object.entries(p.excluded).map(([k, v]) => <span key={k}>{v} row(s) set aside: {plain(k)}</span>)}</p>
      )}
    </div>
  );
}

export function TimeMachineScreen() {
  const tm = useTimeMachine();
  const { metric, resolution, range, bounds, data, loading, error, unit, summary } = tm;
  const open = useSheet();
  const [sel, setSel] = useState<number | null>(null);
  const points = data?.points ?? [];
  useEffect(() => setSel(null), [data]);
  // Until a period is tapped, read the newest one that carries a figure (else simply the newest).
  let at = sel;
  if (at == null && points.length) {
    at = points.length - 1;
    for (let i = points.length - 1; i >= 0; i--) if (points[i].value !== null) { at = i; break; }
  }
  const label = METRICS.find((m) => m.id === metric)?.label ?? metric;

  const preset = (days: number) => {
    if (!bounds) return;
    let from = bounds.earliest;
    if (days) {
      const d = new Date(`${bounds.latest}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - days);
      const iso = d.toISOString().slice(0, 10);
      if (iso > from) from = iso;
    }
    tm.setRange({ from, to: bounds.latest });
  };
  const activePreset = (days: number) => {
    if (!bounds || range.to !== bounds.latest) return false;
    if (!days) return range.from === bounds.earliest;
    const d = new Date(`${bounds.latest}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - days);
    return range.from === d.toISOString().slice(0, 10);
  };

  const styles = () =>
    open(
      <>
        <h3>What the line styles mean</h3>
        <p className="gp-sheet__sub">Five states a period can be in. Only the first two carry a figure.</p>
        <dl className="gptm-defs">
          {STATE_LEGEND.map((s) => (
            <div key={s.state}>
              <dt><i className={`gptm-sw gptm-sw--${s.state.toLowerCase()}`} />{s.title}</dt>
              <dd>{s.detail.replace('on hover', 'when you tap a point')}</dd>
            </div>
          ))}
        </dl>
      </>,
    );

  return (
    <div className="gp-screen gptm">
      <Section
        title="Time Machine"
        desc={<>NLDC’s hourly archive{bounds && <> — {field(bounds.earliest)} to {field(bounds.latest)}</>}. Hours are reported as published; days and months are derived from them.</>}
      >
        <div className="gp-filter gptm-series" role="tablist" aria-label="Metric">
          {METRICS.map((m) => (
            <button key={m.id} role="tab" aria-selected={metric === m.id} className={metric === m.id ? 'is-on' : ''} onClick={() => tm.setMetric(m.id)}>{m.label}</button>
          ))}
        </div>

        <div className="gptm-range">
          <DateField label="From" value={range.from} min={bounds?.earliest} max={range.to} onChange={(v) => tm.setRange((r) => ({ ...r, from: v }))} />
          <i aria-hidden>→</i>
          <DateField label="To" value={range.to} min={range.from} max={bounds?.latest} onChange={(v) => tm.setRange((r) => ({ ...r, to: v }))} />
        </div>
        <div className="gptm-presets" aria-label="Quick ranges">
          {PRESETS.map(([l, d]) => (
            <button key={l} type="button" className={activePreset(d) ? 'is-on' : ''} disabled={!bounds} onClick={() => preset(d)}>{l}</button>
          ))}
        </div>
        <div className="gp-seg gptm-res" role="tablist" aria-label="Resolution">
          {([['day', 'Daily'], ['month', 'Monthly']] as const).map(([id, l]) => (
            <button key={id} role="tab" aria-selected={resolution === id} className={resolution === id ? 'is-on' : ''} onClick={() => tm.setResolution(id)}>{l}</button>
          ))}
        </div>

        {data?.restriction?.restricted && (
          <p className="gptm-notice gptm-notice--plan">
            <b>The archive holds this period.</b> Your plan reaches back to <b>{field(data.restriction.effective.from)}</b>; you asked from {field(data.restriction.requested.from)}. Everything earlier is marked <em>outside your plan</em> rather than missing — ESB has the data, this view does not reach it.
          </p>
        )}
        {error && <p className="gptm-notice gptm-notice--bad">{error}</p>}

        {points.length > 0 ? (
          <div className={loading ? 'gptm-body is-loading' : 'gptm-body'}>
            <Reading p={at != null ? points[at] : null} unit={unit} />
            <TimeMachineChart points={points} color={strokeFor(metric)} selected={at} onSelect={setSel} ariaLabel={`${label}, ${resolution === 'day' ? 'daily' : 'monthly'}, ${range.from} to ${range.to}`} />
            <div className="gp-hint">Tap or drag the chart to read a period{points.length > 1 ? ` · ${periodLabel(points[0].t, true)} to ${periodLabel(points[points.length - 1].t, true)}` : ''}</div>
          </div>
        ) : (
          <div className="gp-empty gptm-empty">{loading || (!data && !error) ? 'Loading the archive…' : 'No observations in this range.'}</div>
        )}

        <button type="button" className="gptm-legend" onClick={styles} aria-label="What the line styles mean">
          {STATE_LEGEND.map((s) => (
            <span key={s.state}><i className={`gptm-sw gptm-sw--${s.state.toLowerCase()}`} style={s.state === 'REPORTED' || s.state === 'DERIVED' ? { color: strokeFor(metric) } : undefined} />{s.title}</span>
          ))}
          <span className="gptm-legend__more">What these mean ›</span>
        </button>

        {summary && (
          <>
            <div className="gp-stats gp-stats--3 gptm-counts">
              <Stat label="Carry a figure" value={summary.present} detail={`of ${fmt(summary.total)} periods`} />
              <Stat label="Missing" value={summary.missing} detail="from the archive — shown as breaks" />
              <Stat label="Outside your plan" value={summary.restricted} detail="held, but not queried" />
            </div>
            {Object.entries(summary.excluded).map(([k, v]) => (
              <p key={k} className="gptm-say gptm-say--warn gptm-excluded">{fmt(v)} observation(s) excluded: {plain(k)}</p>
            ))}
          </>
        )}

        {data && (
          <div className="gp-sec__foot gptm-foot">
            <span>
              Aggregation {data.aggregation} · rules {data.rulesVersion} · {data.sources.map((s) => `${s.publisher} (${s.documents} documents)`).join(', ') || 'no source documents in range'}. Hours are reproduced as NLDC published them; daily and monthly figures are calculated here from regular hourly observations only, excluding day and evening peak stamps.
            </span>
          </div>
        )}
      </Section>
    </div>
  );
}
