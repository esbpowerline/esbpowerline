'use client';

/**
 * Technical Information → Power Transmission, drawn for the phone: what PGCB
 * does, the journey from plant to meter as a voltage profile, what it started
 * with, what it runs today, and the two side by side.
 */

import { Cable, Home, Zap } from 'lucide-react';
import { Prov, Section } from './shared';
import { Foot, InfoPill, Jargon, PairRows, Runs, VoltageBars } from './technical-common';
import { JARGON_TRANSMISSION, STARTED, THEN_NOW, TODAY, TRANSMISSION } from './technical-data';

const ICONS = [Zap, Cable, Home];

/**
 * "How power reaches you". The desktop sets three cards side by side; on a
 * phone the journey is one picture: the line sits low where power is made,
 * is lifted to the transmission voltages PGCB names, and comes back down at
 * the substation. Only the three voltages PGCB states are printed on it; the
 * low ends carry no figure because the page gives none.
 */
function Flow() {
  const t = TRANSMISSION;
  return (
    <div className="gpt-flow">
      <h3 className="gpt-h">{t.flowTitle}</h3>
      <div className="gpt-flow__pic" role="img" aria-label="Voltage is stepped up for transmission and back down for distribution">
        <div className="gpt-flow__volts"><b>{t.volts.join(' · ')}</b> volts</div>
        <svg viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden>
          <path className="gpt-flow__zone" d="M100,0H200V70H100Z" />
          <path className="gpt-flow__fill" d="M0,58H86C100,58 100,18 114,18H186C200,18 200,58 214,58H300V70H0Z" />
          <path className="gpt-flow__line" d="M0,58H86C100,58 100,18 114,18H186C200,18 200,58 214,58H300" />
          <path className="gpt-flow__pulse" d="M0,58H86C100,58 100,18 114,18H186C200,18 200,58 214,58H300" />
        </svg>
        <div className="gpt-flow__cols">
          {t.steps.map((s, i) => {
            const Icon = ICONS[i];
            return (
              <div key={s.step} className={i === 1 ? 'is-pgcb' : ''}>
                <Icon size={15} strokeWidth={2.2} aria-hidden />
                <span>{s.step.split(': ')[1]}</span>
              </div>
            );
          })}
        </div>
        <span className="gpt-flow__mark gpt-flow__mark--up">stepped up</span>
        <span className="gpt-flow__mark gpt-flow__mark--down">stepped down</span>
      </div>
      <ol className="gpt-steps">
        {t.steps.map((s, i) => (
          <li key={s.step} className={i === 1 ? 'is-pgcb' : ''}>
            <i aria-hidden>{i + 1}</i>
            <div>
              <small>{s.step}</small>
              <b>{s.title}</b>
              <p>{s.body}</p>
              <em>{s.foot}</em>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TransmissionView({ onProjects }: { onProjects: () => void }) {
  const t = TRANSMISSION;
  return (
    <>
      <Section title={t.title} meta={<span className="gp-tag">{t.tag}</span>}>
        <p className="gpt-lead">{t.lead}</p>
        <div className="gpt-pills">
          <InfoPill label="PGCB’s exact wording" sub="Quoted from PGCB’s corporate profile"><blockquote>{t.wording}</blockquote></InfoPill>
        </div>
        <Flow />
      </Section>

      <Section title={TODAY.title} desc={TODAY.sub}>
        <div className="gp-stats gp-stats--first gpt-today">
          <div className="gp-stat">
            <div className="gp-stat__l">PGCB now runs</div>
            <div className="gp-stat__v"><b>{TODAY.lineKm.replace(' km', '')}</b><small>km</small></div>
            <div className="gp-stat__d"><b>{TODAY.lineWhat}</b> — {TODAY.lineBody}</div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat__l">It hands that power over at</div>
            <div className="gp-stat__v"><b>{TODAY.subs.replace(' substations', '')}</b><small>substations</small></div>
            <div className="gp-stat__d">{TODAY.subsBody}</div>
          </div>
        </div>
        <VoltageBars rows={TODAY.lines} prov="P" />
        <PairRows rows={TODAY.sites} prov="P" />
        <p className="gpt-caveat">
          PGCB’s paragraph says <b>{TODAY.check[1]}</b> 230/33 kV and <b>{TODAY.check[3]}</b> 132/33 kV substations; its table says <b>{TODAY.check[5]}</b> and <b>{TODAY.check[7]}</b>. These figures follow the table.
        </p>
        <div className="gpt-pills">
          <InfoPill label="PGCB’s exact wording" sub="Quoted from PGCB’s corporate profile"><blockquote>{TODAY.quote}</blockquote></InfoPill>
          <InfoPill label="How this was checked" title="How these figures were checked"><p><Runs parts={TODAY.check} /></p></InfoPill>
        </div>
        <Foot source={`Power Grid Bangladesh PLC — ${TODAY.source}`} stamp={TODAY.asAt} />
      </Section>

      <Section title={STARTED.title} desc={STARTED.sub}>
        <PairRows rows={STARTED.rows} prov="P" />
        <div className="gpt-pills">
          <InfoPill label="PGCB’s exact wording" sub="Quoted from PGCB’s corporate profile"><blockquote>{STARTED.quote}</blockquote></InfoPill>
        </div>
        <Foot source={`Power Grid Bangladesh PLC — ${STARTED.source}`} note={STARTED.note} stamp={STARTED.period} />
      </Section>

      <Section title={THEN_NOW.title} desc={THEN_NOW.cols[0]}>
        <div className="gpt-tn">
          <div className="gpt-tn__head">
            <span>{THEN_NOW.cols[1]}<Prov kind="P" /></span>
            <span>{THEN_NOW.cols[2]}<Prov kind="P" /></span>
          </div>
          {THEN_NOW.rows.map((r) => (
            <div key={r.cls} className="gpt-tn__row">
              <h4>{r.cls}</h4>
              <div className={r.then ? '' : 'is-none'}>{r.then ? r.then.map((s, i) => (i ? <small key={s}>{s}</small> : <b key={s}>{s}</b>)) : <b>—</b>}</div>
              <div>{r.now.map((s, i) => (i ? <small key={s}>{s}</small> : <b key={s}>{s}</b>))}</div>
            </div>
          ))}
        </div>
        <Foot source={`Power Grid Bangladesh PLC — ${THEN_NOW.source}`} note={THEN_NOW.note} stamp={THEN_NOW.period} />
      </Section>

      <button type="button" className="gpt-callout" onClick={onProjects}>
        <span>{t.callout}</span>
        <b>Ongoing projects ›</b>
      </button>
      <Jargon terms={JARGON_TRANSMISSION} />
    </>
  );
}
