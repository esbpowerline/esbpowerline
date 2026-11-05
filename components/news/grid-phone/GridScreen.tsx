'use client';

/**
 * Grid: the network view — demand and shedding by zone, the outage log,
 * generation by zone and the East–West interconnector (desktop "Regional
 * Grid"), plus the Technical Information reference hosted whole as Network.
 */

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { usePhone } from './context';
import { Skeleton } from './shared';

const TechnicalInfoTab = dynamic(() => import('@/components/news/power-grid/TechnicalInfoTab').then((m) => m.TechnicalInfoTab), {
  ssr: false,
  loading: () => <Skeleton heights={[120, 420]} />,
});

export function GridScreen() {
  const p = usePhone();
  const [view, setView] = useState<'zones' | 'network'>('zones');
  return (
    <div className="gp-screen">
      <div className="gp-seg gp-seg--sticky" role="tablist" aria-label="Grid view">
        {([['zones', 'Zones & flows'], ['network', 'Network']] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => setView(id)}>{l}</button>
        ))}
      </div>
      {view === 'zones' && <ZonesView />}
      {view === 'network' && (
        <div className="gp-host grid-explorer">
          <TechnicalInfoTab selectedDate={p.date} tierLockRequired={null} onTryDemo={() => {}} />
        </div>
      )}
    </div>
  );
}

/** Built out by the Grid handler: Regional Grid parity (inventory "Regional Grid"). */
function ZonesView() {
  return <Skeleton heights={[300]} />;
}
