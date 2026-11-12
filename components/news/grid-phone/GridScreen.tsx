'use client';

/**
 * Grid: the network view — demand and shedding by zone, the outage log,
 * generation by zone and the East–West interconnector (desktop "Regional
 * Grid"), plus the Technical Information reference hosted whole as Network.
 */

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { usePhone } from './context';
import '@/app/grid-phone-grid.css';
import { EwicSection } from './grid-ewic';
import { OutageLog } from './grid-outages';
import { ZoneDemand, ZoneGeneration, ZoneKpis } from './grid-zones';
import { Empty, Skeleton } from './shared';

const TechnicalInfoTab = dynamic(() => import('@/components/news/power-grid/TechnicalInfoTab').then((m) => m.TechnicalInfoTab), {
  ssr: false,
  loading: () => <Skeleton heights={[120, 420]} />,
});

/** `view` is set by the app's section strip (Regional Grid / Technical Info); see SupplyScreen. */
export function GridScreen({ view: controlled }: { view?: 'zones' | 'network' } = {}) {
  const p = usePhone();
  const [own, setView] = useState<'zones' | 'network'>('zones');
  const view = controlled ?? own;
  return (
    <div className="gp-screen">
      {!controlled && (
        <div className="gp-seg gp-seg--sticky" role="tablist" aria-label="Grid view">
          {([['zones', 'Zones & flows'], ['network', 'Network']] as const).map(([id, l]) => (
            <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => setView(id)}>{l}</button>
          ))}
        </div>
      )}
      {view === 'zones' && <ZonesView />}
      {view === 'network' && (
        <div className="gp-host grid-explorer">
          <TechnicalInfoTab selectedDate={p.date} tierLockRequired={null} onTryDemo={() => {}} />
        </div>
      )}
    </div>
  );
}

function ZonesView() {
  const { day, date } = usePhone();
  if (date < '2013-12-31') {
    return (
      <Empty
        title="Zone-wise Demand & Load-Shedding Data"
        why={<>No official records are available for the selected date. Zone-wise demand and load-shedding tracking officially started on December 31, 2013.<br />Official Backlog Start Date: December 31, 2013</>}
      />
    );
  }
  const hasZones = (day.regionalDemandData ?? []).length > 0;
  return (
    <>
      {hasZones ? (
        <>
          <ZoneKpis day={day} />
          <ZoneDemand day={day} />
        </>
      ) : (
        <Empty title="Demand and load-shedding by zone" why="This day’s report prints no zone demand table." />
      )}
      <OutageLog day={day} />
      <ZoneGeneration day={day} />
      <EwicSection day={day} />
    </>
  );
}
