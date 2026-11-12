'use client';

/**
 * Technical Information, built for the phone.
 *
 * The desktop tab is a sidebar of ten pages over PGCB's standing asset
 * register. Here the sidebar is one swipeable pill row (its four groups kept
 * as small captions), and each page is redrawn from kit parts instead of
 * being hosted whole. It is reference data: nothing on it moves with the day
 * picker, which the strip under the pills says before any figure is read.
 */

import { useEffect, useRef, useState } from 'react';
import '@/app/grid-phone-technical.css';
import { usePhone } from './context';
import { Empty, Prov } from './shared';
import { InfoPill } from './technical-common';
import { BEFORE_2013, PD_NOTE } from './technical-data';
import { LinesView, SubstationsView } from './technical-assets';
import { LeaseView, MapView } from './technical-maps';
import { TransmissionView } from './technical-overview';
import { ProjectsView, type ProjectKind } from './technical-projects';

type Sec = 'transmission' | 'lines' | 'substations' | ProjectKind | 'grid_net' | 'geo_map' | 'opgw_map' | 'opgw_lease';

/** The desktop sidebar's groups and order; labels shortened to fit a pill, full names in aria-label. */
const NAV: { group: string; items: [Sec, string, string][] }[] = [
  { group: 'Grid Infrastructure', items: [['transmission', 'Transmission', 'Power Transmission'], ['lines', 'Lines', 'Transmission Line Information'], ['substations', 'Substations', 'Substation Information']] },
  { group: 'Grid Projects', items: [['ongoing', 'Ongoing', 'Ongoing Projects'], ['upcoming', 'Upcoming', 'Upcoming Projects'], ['completed', 'Completed', 'Completed Projects']] },
  { group: 'Maps & Diagrams', items: [['grid_net', 'Network diagram', 'National Grid Network Diagram'], ['geo_map', 'Geographical map', 'Geographical Grid Map']] },
  { group: 'Optical Fiber (OPGW)', items: [['opgw_map', 'Fiber map', 'OPGW Fiber Network Map'], ['opgw_lease', 'Fiber leasing', 'Optical Fiber Leasing']] },
];

export function TechnicalScreen() {
  const { date } = usePhone();
  const [sec, setSec] = useState<Sec>('transmission');
  const nav = useRef<HTMLDivElement | null>(null);
  // Keep the chosen pill in view when the section is changed from inside a page.
  useEffect(() => {
    nav.current?.querySelector<HTMLElement>('.is-on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [sec]);

  if (date < '2013-12-31') {
    return <Empty title={BEFORE_2013.title} why={<>{BEFORE_2013.why}<br />{BEFORE_2013.start}</>} />;
  }

  return (
    <div className="gpt">
      <div className="gpt-nav" ref={nav} role="tablist" aria-label="Technical information section">
        {NAV.map((g) => (
          <div key={g.group} className="gpt-nav__group">
            <span>{g.group}</span>
            <div>
              {g.items.map(([id, short, full]) => (
                <button key={id} type="button" role="tab" aria-selected={sec === id} aria-label={full} className={sec === id ? 'is-on' : ''} onClick={() => setSec(id)}>{short}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="gpt-standing">
        <span><b>Standing figures, not daily readings.</b> They carry the date PGCB states and do not change with the day picked above.</span>
        <InfoPill label="P and D" title={PD_NOTE.title.replace(/\.$/, '')}>
          <p><Prov kind="P" /> {PD_NOTE.p}</p>
          <p><Prov kind="D" /> {PD_NOTE.d}</p>
          <p>These are <b>{PD_NOTE.standing}</b>: {PD_NOTE.tail}</p>
        </InfoPill>
      </div>

      {sec === 'transmission' && <TransmissionView onProjects={() => setSec('ongoing')} />}
      {sec === 'lines' && <LinesView />}
      {sec === 'substations' && <SubstationsView />}
      {(sec === 'ongoing' || sec === 'upcoming' || sec === 'completed') && <ProjectsView kind={sec} onKind={setSec} />}
      {(sec === 'grid_net' || sec === 'geo_map' || sec === 'opgw_map') && <MapView id={sec} />}
      {sec === 'opgw_lease' && <LeaseView />}
    </div>
  );
}
