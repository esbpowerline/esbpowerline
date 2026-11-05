'use client';

import { useState } from 'react';
import { coverageLabel } from '@/lib/data/grid/coverage';
import type { DailyOutageItem, GridDailyData } from '@/lib/data/grid/types';
import { Prov, Row, Section, useSheet } from './shared';

const hasLoad = (o: DailyOutageItem) => /\d/.test(o.load ?? '');
const text = (o: DailyOutageItem) => `${o.plant} ${o.full_desc ?? ''} ${o.reason}`;
const KINDS: { id: string; label: string; test: (o: DailyOutageItem) => boolean; note: string }[] = [
  { id: 'all', label: 'All', test: () => true, note: '' },
  { id: 'mw', label: 'MW stated', test: hasLoad, note: 'Entries whose printed lost-load cell contains a figure.' },
  { id: 'noload', label: 'No load stated', test: (o) => !hasLoad(o), note: 'Entries whose lost-load cell prints no figure (for example “HT Outage”).' },
  { id: 'sched', label: 'Scheduled', test: (o) => /scheduled/i.test(text(o)), note: 'Entries whose wording contains “Scheduled”.' },
  { id: 'rest', label: 'Restored', test: (o) => /restor/i.test(text(o)), note: 'Entries whose wording contains “restored”.' },
];

function OutageSheet({ o, day }: { o: DailyOutageItem; day: GridDailyData }) {
  return (
    <>
      <h3>{o.plant}</h3>
      <p className="gp-sheet__sub">{o.time} · {day.systemStats.date}</p>
      <dl className="gz-dl">
        <div><dt>Time<Prov kind="P" /></dt><dd>{o.time}</dd></div>
        <div><dt>Lost load<Prov kind="P" /></dt><dd style={hasLoad(o) ? { color: 'var(--gp-bad)' } : undefined}>{hasLoad(o) ? o.load : 'no load stated'}</dd></div>
      </dl>
      <div className="gz-sheet-h">Description as printed<Prov kind="P" /></div>
      <p style={{ margin: 0 }}>{o.full_desc || `${o.plant} — ${o.reason}`}</p>
      <div className="gz-sheet-h">Split into asset and cause<Prov kind="D" note="Asset and cause are cut from PGCB’s single event description by us; the wording is theirs." /></div>
      <dl className="gz-dl">
        <div><dt>Asset</dt><dd style={{ maxWidth: '70%' }}>{o.plant}</dd></div>
        <div><dt>Cause</dt><dd style={{ maxWidth: '70%', fontWeight: 500 }}>{o.reason}</dd></div>
      </dl>
    </>
  );
}

export function OutageLog({ day }: { day: GridDailyData }) {
  const open = useSheet();
  const [kind, setKind] = useState('all');
  const [all, setAll] = useState(false);
  const list = day.dailyOutages ?? [];
  const k = KINDS.find((x) => x.id === kind) ?? KINDS[0];
  const shown = list.filter(k.test);
  const vis = all ? shown : shown.slice(0, 5);
  const how = () =>
    open(
      <>
        <h3>About the outage log</h3>
        <p>Outage events as printed in the day’s report ({day.systemStats.date}). Time, description and lost load are published (P); the split into asset and cause is ours (D). Asset and cause are cut from PGCB’s single event description; the wording is theirs.</p>
        <div className="gz-sheet-h">Filters (D)</div>
        <p>The filter chips group entries by what their own text or load cell says; PGCB prints no category.</p>
        {KINDS.slice(1).map((x) => <p key={x.id} style={{ margin: '0 0 6px' }}><b>{x.label}:</b> {x.note}</p>)}
        <div className="gz-sheet-h">Source</div>
        <p>
          PGCB Daily Report — P1 sheet, NLDC daily outage log.{day.sourceFiles?.pgcb ? <> Read from: PGCB {day.sourceFiles.pgcb}.</> : null}
          <br />Reporting Period: 24-Hour Logs (Date: {day.systemStats.date}).
          <br />{coverageLabel('outages')}.
        </p>
      </>,
    );
  return (
    <Section
      title="NLDC outage log"
      desc={<>Outage events as printed in the day’s report · <Prov kind="P" /> time, description, lost load · <Prov kind="D" /> split into asset and cause</>}
      meta={`${list.length} ${list.length === 1 ? 'entry' : 'entries'}`}
    >
      {list.length === 0 ? (
        <div className="gp-empty" style={{ minHeight: 96 }}>This day’s report prints no outage entries.</div>
      ) : (
        <>
          <div className="gp-filter" role="group" aria-label="Filter outages">
            {KINDS.map((x) => {
              const n = list.filter(x.test).length;
              return (
                <button key={x.id} type="button" className={kind === x.id ? 'is-on' : ''} aria-pressed={kind === x.id} onClick={() => { setKind(x.id); setAll(false); }}>
                  {x.label} {n}
                </button>
              );
            })}
          </div>
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {vis.map((o, i) => (
              <Row
                key={`${o.time}-${o.plant}-${i}`}
                top
                wrap
                name={o.plant}
                sub={o.reason}
                value={o.time}
                small={hasLoad(o) ? <span style={{ color: 'var(--gp-bad)', fontWeight: 600 }}>{o.load}</span> : <i>no load stated</i>}
                onClick={() => open(<OutageSheet o={o} day={day} />)}
              />
            ))}
            {shown.length === 0 && <div className="gp-empty" style={{ minHeight: 72 }}>No entry matches this filter.</div>}
          </div>
          {shown.length > 5 && (
            <button type="button" className="gp-more" onClick={() => setAll((v) => !v)}>
              {all ? 'Show fewer' : `Show all ${shown.length}`}
            </button>
          )}
        </>
      )}
      <button type="button" className="gz-info" onClick={how}>How to read this, and the source</button>
    </Section>
  );
}
