'use client';

/**
 * Technical Information → Transmission Line Information and Substation
 * Information. The class tables become ruled rows; the 260-row register
 * becomes a searchable list that grows 25 at a time.
 */

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { substationsData } from '@/lib/data/infrastructure/substations';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Prov, Section } from './shared';
import { Foot, InfoPill, Jargon, Runs, VoltageBars } from './technical-common';
import { ASSETS, FIVE_YEARS, JARGON_LINES, JARGON_SUBSTATIONS, LINES, REGISTER, SUBS_JUNE, type SubClass } from './technical-data';

/** "9 Nos. 13,100 MVA" → count and capacity, split only for layout; both are printed as written. */
const splitNos = (s: string) => {
  const m = /^(\d+ Nos[.:]?)\s+(.+)$/.exec(s);
  return m ? { count: m[1], rest: m[2] } : { count: null, rest: s };
};

function ClassRows({ rows, cols, prov }: { rows: SubClass[]; cols: string[]; prov?: boolean }) {
  return (
    <div className="gpt-class">
      <div className="gpt-class__head">
        <span>{cols[0]}</span>
        <span>{cols[1]}{prov && <Prov kind="P" />}</span>
        <span>{cols[2].replace(/ \((\w+)\)$/, '')}{/\((\w+)\)$/.test(cols[2]) ? <> <span style={{ whiteSpace: 'nowrap' }}>({cols[2].match(/\((\w+)\)$/)![1]}){prov && <Prov kind="P" />}</span></> : prov && <Prov kind="P" />}</span>
      </div>
      {rows.map((r) => (
        <div key={r.cls} className="gpt-class__row">
          <b>{r.cls}</b>
          <span>{r.count}</span>
          <strong>{r.capacity}</strong>
          <small>{cols[3]}{prov && <Prov kind="P" />}: <em>{r.others ?? '—'}</em></small>
        </div>
      ))}
    </div>
  );
}

export function LinesView() {
  const subs = FIVE_YEARS.rows.filter((r) => /Substation/.test(r.label));
  const lines = FIVE_YEARS.rows.filter((r) => !/Substation/.test(r.label));
  return (
    <>
      <Section title={LINES.title} desc={LINES.sub}>
        <div className="gp-kicker"><span>{LINES.total.label}</span></div>
        <div className="gp-hero gp-hero--md"><b>{LINES.total.value.replace(' Circuit km', '')}</b><small>Circuit km</small></div>
        <div className="gpt-colnote"><span>{LINES.cols[1]}<Prov kind="P" /></span><span>{LINES.cols[2]}<Prov kind="P" /></span></div>
        <VoltageBars rows={LINES.rows} />
      </Section>

      <Section title={FIVE_YEARS.title} desc={<>{FIVE_YEARS.sub} · {FIVE_YEARS.cols[1]}</>}>
        <h3 className="gpt-h">Substations</h3>
        <div className="gpt-pairs">
          {subs.map((r) => {
            const s = splitNos(r.value);
            return (
              <div key={r.label} className="gpt-pair">
                <span>{r.label}</span>
                <div><b>{s.rest}</b>{s.count && <small>{s.count}</small>}</div>
              </div>
            );
          })}
        </div>
        <h3 className="gpt-h gpt-h--gap">Transmission lines</h3>
        <VoltageBars rows={lines} />
      </Section>

      <Section title={SUBS_JUNE.title} desc={SUBS_JUNE.sub}>
        <div className="gp-stats gp-stats--first">
          <div className="gp-stat">
            <div className="gp-stat__l">{SUBS_JUNE.overall.label}</div>
            <div className="gp-stat__v"><b>{SUBS_JUNE.overall.capacity.replace(' MVA', '')}</b><small>MVA</small></div>
            <div className="gp-stat__d">{SUBS_JUNE.overall.count}</div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat__l">{SUBS_JUNE.dispatch.label}</div>
            <div className="gp-stat__v"><b>{SUBS_JUNE.dispatch.value.replace(' MW', '')}</b><small>MW</small></div>
            <div className="gp-stat__d">{SUBS_JUNE.dispatch.note}</div>
          </div>
        </div>
        <ClassRows rows={SUBS_JUNE.rows} cols={SUBS_JUNE.cols} />
      </Section>
      <Jargon terms={JARGON_LINES} />
    </>
  );
}

const KV_CLS: Record<string, string> = { '400kV': 'is-400', '230kV': 'is-230', '132kV': 'is-132' };
const PAGE = 25;

function Pick({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  const cur = options.find((o) => o.value === value);
  return (
    <label className={`gpt-pick${value !== 'all' ? ' is-on' : ''}`}>
      <span>{cur?.label ?? label}</span>
      <i aria-hidden>▾</i>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function SubstationsView() {
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q);
  const [voltage, setVoltage] = useState('all');
  const [zone, setZone] = useState('all');
  const [owner, setOwner] = useState('all');
  const [shown, setShown] = useState(PAGE);

  // The desktop's filter, term for term (TechnicalInfoTab: filteredSubstations).
  const rows = substationsData.filter((s) => {
    const k = dq.toLowerCase();
    return (s.name.toLowerCase().includes(k) || s.circle.toLowerCase().includes(k)) && (voltage === 'all' || s.voltage === voltage) && (zone === 'all' || s.zone === zone) && (owner === 'all' || s.owner === owner);
  });
  // MVA-rated transformers only: the HVDC blocks are rated in MW and are left out, as on the desktop.
  const mva = rows.reduce((sum, s) => {
    const v = parseFloat(s.capacity.replace(/,/g, ''));
    return s.capacity.includes('MW') || isNaN(v) ? sum : sum + v;
  }, 0);
  useEffect(() => setShown(PAGE), [rows.length]);
  const filtered = voltage !== 'all' || zone !== 'all' || owner !== 'all' || q !== '';

  return (
    <>
      <Section title={REGISTER.title} desc={REGISTER.body}>
        <p className="gpt-stamp">{REGISTER.tag}</p>
        <h3 className="gpt-h">{REGISTER.summaryTitle}</h3>
        <div className="gp-stats gp-stats--first">
          <div className="gp-stat">
            <div className="gp-stat__l">Register Entries<Prov kind="D" /></div>
            <div className="gp-stat__v"><b>{rows.length}</b><small>Rows</small></div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat__l">Filtered Capacity<Prov kind="D" /></div>
            <div className="gp-stat__v"><b>{formatNumber(mva)}</b><small>MVA</small></div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat__l">Unique Zones<Prov kind="D" /></div>
            <div className="gp-stat__v"><b>{REGISTER.zones.replace(' Zones', '')}</b><small>Zones</small></div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat__l">Grid Circle Groups</div>
            <div className="gp-stat__v gpt-statword"><b>{REGISTER.circles}</b></div>
          </div>
        </div>
        <div className="gpt-pills">
          <InfoPill label="How these are counted" title="About this register" sub={REGISTER.asAt}><p><Runs parts={REGISTER.note} /></p></InfoPill>
        </div>
        <Foot source={REGISTER.source} note={<>260 rows cover 227 distinct stations (one row per transformer bank). The list sums to 89,155 MVA; PGCB has since published 91,512 MVA for June, so it trails the summary by 2,357 MVA.</>} stamp={REGISTER.asAt} />
      </Section>

      <Section title={ASSETS.title} desc={ASSETS.sub}>
        <div className="gp-stats gp-stats--first">
          <div className="gp-stat">
            <div className="gp-stat__l">{ASSETS.overall.label}<Prov kind="P" /></div>
            <div className="gp-stat__v"><b>{ASSETS.overall.capacity.replace(' MVA', '')}</b><small>MVA</small></div>
            <div className="gp-stat__d">{ASSETS.overall.count}</div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat__l">{ASSETS.dispatch.label}<Prov kind="P" /></div>
            <div className="gp-stat__v"><b>{ASSETS.dispatch.value.replace(' MW', '')}</b><small>MW</small></div>
          </div>
        </div>
        <ClassRows rows={ASSETS.rows} cols={ASSETS.cols} prov />
        <div className="gpt-pills">
          <InfoPill label="PGCB’s arithmetic" title="About these totals" sub={ASSETS.asAt}><p><Runs parts={ASSETS.note} /></p></InfoPill>
        </div>
        <Foot source={`Power Grid Bangladesh PLC — ${ASSETS.source}`} note={<>Rows add up to 259 stations and <b>{ASSETS.note[1]}</b>; shown as published.</>} stamp={ASSETS.asAt} />
      </Section>

      <Section title="Substation register" desc={`${rows.length} of ${substationsData.length} rows${filtered ? ' match' : ''}`}>
        <input className="gp-search" type="search" placeholder="Search substation name..." aria-label="Search substation name or grid circle" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="gpt-picks">
          <Pick label="All Voltage Classes" value={voltage} onChange={setVoltage} options={REGISTER.voltages} />
          <Pick label="All Operation Zones" value={zone} onChange={setZone} options={[{ label: 'All Operation Zones', value: 'all' }, ...REGISTER.zoneList.map((z) => ({ label: z, value: z }))]} />
          <Pick label="All Owners" value={owner} onChange={setOwner} options={[{ label: 'All Owners', value: 'all' }, ...REGISTER.ownerList.map((o) => ({ label: o, value: o }))]} />
        </div>
        {rows.length === 0 ? (
          <div className="gp-empty gpt-none">{REGISTER.empty}</div>
        ) : (
          <div className="gpt-subs">
            {rows.slice(0, shown).map((s) => (
              <div key={`${s.sn}:${s.voltage}:${s.name}`} className="gpt-sub">
                <div className="gpt-sub__main">
                  <b><i>{s.sn}</i>{s.name}</b>
                  <span>{s.zone} zone · {s.circle} circle · {s.owner}</span>
                  <span>Transformer {s.transformer}</span>
                </div>
                <div className="gpt-sub__val">
                  <b>{s.capacity}</b>
                  <span className={`gpt-kv ${KV_CLS[s.voltage] ?? 'is-33'}`}>{s.voltage}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {rows.length > shown && (
          <button type="button" className="gp-more" onClick={() => setShown((n) => n + PAGE)}>
            Show {Math.min(PAGE, rows.length - shown)} more <span className="gp-u">· {shown} of {rows.length} substations</span>
          </button>
        )}
        <div className="gp-sec__foot gpt-foot"><span>Each row: {REGISTER.cols.join(' · ')}. Total Capacity is printed as the register gives it (MVA unless it says MW).</span></div>
      </Section>
      <Jargon terms={JARGON_SUBSTATIONS} />
    </>
  );
}
