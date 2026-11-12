'use client';

/**
 * History: the long-range views. Trends, Macro Trends (MacroScreen, ten
 * sub-tabs) and the Time Machine each have a phone screen of their own; the
 * few Macro panels not yet redrawn are hosted inside MacroScreen itself.
 */

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Skeleton } from './shared';
import { TrendsScreen } from './TrendsScreen';
import { MacroScreen, type MacroId } from './MacroScreen';

const TimeMachineScreen = dynamic(() => import('./TimeMachineScreen').then((m) => m.TimeMachineScreen), { ssr: false, loading: () => <Skeleton heights={[120, 420]} /> });

type View = 'trends' | 'macro' | 'machine';

export function HistoryScreen({ initialView = 'trends', initialMacro = 'overview', view: controlled, onView }: { initialView?: View; initialMacro?: MacroId; view?: View; onView?: (v: View) => void }) {
  const [own, setOwn] = useState<View>(initialView);
  const view = controlled ?? own;
  const setView = (v: View) => { setOwn(v); onView?.(v); };

  return (
    <div className="gp-screen">
      {!controlled && <div className="gp-seg gp-seg--sticky" role="tablist" aria-label="History view">
        {([['trends', 'Trends'], ['macro', 'Macro'], ['machine', 'Time machine']] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => setView(id)}>{l}</button>
        ))}
      </div>}
      {view === 'trends' && <TrendsScreen />}
      {view === 'macro' && <MacroScreen initial={initialMacro} />}
      {view === 'machine' && <TimeMachineScreen />}
    </div>
  );
}
