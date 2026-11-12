'use client';

/**
 * Technical Information → the three PGCB map documents and Optical Fiber
 * Leasing.
 *
 * The desktop embeds each PDF in a frame. A phone browser will not draw a PDF
 * inside a frame (Android Chrome shows an "Open" button, iOS the first page
 * only), so here the document opens in the system viewer, where it can be
 * pinched and panned at full resolution, and the key that explains it stays
 * on the page.
 */

import { FileText } from 'lucide-react';
import { Prov, Section } from './shared';
import { Foot, InfoPill, Jargon } from './technical-common';
import { JARGON_LEASE, LEASE, MAPS } from './technical-data';

export function MapView({ id }: { id: keyof typeof MAPS }) {
  const m = MAPS[id];
  return (
    <>
      <Section title={m.title} desc={m.sub}>
        <p className="gpt-lead gpt-lead--sm">{m.body}</p>
        <a className="gpt-doc" href={m.href} target="_blank" rel="noopener noreferrer">
          <span className="gpt-doc__sheet" aria-hidden>
            <svg viewBox="0 0 60 44" preserveAspectRatio="none">
              <path d="M4,34L16,20L27,27L39,10L56,18" />
              <path d="M16,20L20,38M39,10L44,36M27,27L44,36" />
              {[[4, 34], [16, 20], [27, 27], [39, 10], [56, 18], [20, 38], [44, 36]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} />)}
            </svg>
          </span>
          <span className="gpt-doc__txt">
            <b>Open PDF in New Tab</b>
            <small>{m.title} · PGCB document · pinch to zoom</small>
          </span>
          <FileText size={18} aria-hidden />
        </a>
      </Section>
      <Section title={m.keyTitle}>
        <div className="gpt-keys">
          {m.keys.map((k) => (
            <div key={k.term}>
              <b>{k.term}</b>
              <p>{k.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

export function LeaseView() {
  const L = LEASE;
  return (
    <>
      <Section title={L.title} desc={`${L.installedWhen} · OPGW along PGCB’s transmission lines`}>
        <div className="gp-kicker"><span>OPGW installed across the country · around</span></div>
        <div className="gp-hero gp-hero--md"><b>{L.installedKm.replace('around ', '').replace(' km', '')}</b><small>km</small></div>
        <p className="gpt-lead gpt-lead--sm">{L.installed}</p>
        <div className="gpt-pills">
          <InfoPill label="How PGCB came to own fibre" title="From ground wire to OPGW"><p>{L.history}</p></InfoPill>
        </div>
      </Section>

      <Section title={L.rate.title} meta={<span className="gp-tag">{L.rate.effective}</span>}>
        <div className="gp-hero gp-hero--md gpt-rate"><b>{L.rate.value}</b><small>{L.rate.per}</small></div>
        <p className="gpt-note">{L.rate.body}</p>
        <div className="gpt-pairs">
          <div className="gpt-pair"><span>{L.rate.incrementLabel}</span><div><b>{L.rate.increment}</b></div></div>
        </div>
      </Section>

      <Section title={L.licensing.title} desc={L.licensing.sub}>
        <div className="gp-stats gp-stats--first">
          <div className="gp-stat">
            <div className="gp-stat__l">Partner Organizations<Prov kind="P" /></div>
            <div className="gp-stat__v"><b>{L.licensing.partners.figure.split(' ')[0]}</b><small>{L.licensing.partners.figure.split(' ')[1]}</small></div>
            <div className="gp-stat__d">organizations lease PGCB fibre</div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat__l">Capacity Leased<Prov kind="P" /></div>
            <div className="gp-stat__v"><b>{L.licensing.leased.figure.replace(' KM', '')}</b><small>KM</small></div>
            <div className="gp-stat__d">{L.licensing.leased.core}</div>
          </div>
        </div>
        <div className="gpt-keys gpt-keys--ruled">
          <div><b>{L.licensing.nttn.term}</b><p>{L.licensing.nttn.body}</p></div>
          <div><b>{L.licensing.partners.term}</b><p>{L.licensing.partners.body}</p></div>
          <div><b>{L.licensing.leased.term}</b><p>{L.licensing.leased.body}</p><p className="gpt-warn">{L.licensing.leased.caveat}</p></div>
        </div>
      </Section>

      <Section title={L.backbone.title} desc={L.backbone.sub}>
        <div className="gp-stats gp-stats--first">
          <div className="gp-stat">
            <div className="gp-stat__l">Backbone capacity</div>
            <div className="gp-stat__v"><b>{L.backbone.capacity.replace(' Tbps', '')}</b><small>Tbps</small></div>
            <div className="gp-stat__d">{L.backbone.operational}</div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat__l">{L.backbone.leasedLabel}</div>
            <div className="gp-stat__v"><b>{L.backbone.leased.replace(' Gbps', '')}</b><small>Gbps</small></div>
            <div className="gp-stat__d">{L.backbone.leasedTo}</div>
          </div>
        </div>
        <p className="gpt-note gpt-note--ruled">{L.backbone.body[0]}<b>{L.backbone.body[1]}</b>{L.backbone.body[2]}</p>
      </Section>

      <Section title={L.contact.title}>
        <div className="gpt-keys">
          <div><b>{L.contact.who}</b><p>{L.contact.unit}</p></div>
          <div><b>{L.contact.addressLabel}</b><p>{L.contact.address}</p></div>
          <div><b>{L.contact.emailLabel}</b><p><a href={`mailto:${L.contact.email}`}>{L.contact.email}</a></p></div>
        </div>
        <Foot source={`Power Grid Bangladesh PLC — ${L.source}`} note={L.note} stamp={L.asAt} />
      </Section>
      <Jargon terms={JARGON_LEASE} />
    </>
  );
}
