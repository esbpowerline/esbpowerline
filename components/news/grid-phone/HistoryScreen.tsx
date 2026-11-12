'use client';

/**
 * History: the long-range views. Trends is native; Macro Trends (ten sub-tabs)
 * and the Time Machine are the desktop explorer's own panels, hosted here
 * whole so nothing they publish is lost on a phone. They already carry the
 * phone layout from the 2026-11-02 mobile work (swipeable sub-tab row, folds,
 * tap-to-read charts). They are rendered inside `.grid-explorer` so the
 * explorer's stylesheets apply exactly as they do on the page.
 */

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { usePhone } from './context';
import { Skeleton } from './shared';
import { TrendsScreen } from './TrendsScreen';

const MacroTrendsTab = dynamic(() => import('@/components/news/power-grid/MacroTrendsTab').then((m) => m.MacroTrendsTab), { ssr: false, loading: () => <Skeleton heights={[120, 420]} /> });
const TimeMachineTab = dynamic(() => import('@/components/news/power-grid/TimeMachineTab'), { ssr: false, loading: () => <Skeleton heights={[120, 420]} /> });

type MacroId = 'overview' | 'budget' | 'monthly' | 'pricing' | 'global' | 'reports' | 'reserves' | 'system_loss' | 'insights' | 'verification';
type View = 'trends' | 'macro' | 'machine';

export function HistoryScreen({ initialView = 'trends', initialMacro = 'overview', view: controlled, onView }: { initialView?: View; initialMacro?: MacroId; view?: View; onView?: (v: View) => void }) {
  const p = usePhone();
  const chartTheme = useChartTheme();
  const [own, setOwn] = useState<View>(initialView);
  const view = controlled ?? own;
  const setView = (v: View) => { setOwn(v); onView?.(v); };
  const [macro, setMacro] = useState<MacroId>(initialMacro);
  // Petrobangla production as the desktop sums it for Macro (PowerGridExplorer.tsx:663).
  const totalGasSupply = (p.day.gasProductionData ?? []).reduce((a, g) => a + (g.gas || 0), 0);

  return (
    <div className="gp-screen">
      {!controlled && <div className="gp-seg gp-seg--sticky" role="tablist" aria-label="History view">
        {([['trends', 'Trends'], ['macro', 'Macro'], ['machine', 'Time machine']] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => setView(id)}>{l}</button>
        ))}
      </div>}
      {view === 'trends' && <TrendsScreen />}
      {view === 'macro' && (
        <div className="gp-host grid-explorer">
          <MacroTrendsTab
            macroSubTab={macro}
            handleSubTabClick={(id) => setMacro(id as MacroId)}
            systemStats={p.day.systemStats}
            totalGasSupply={totalGasSupply}
            selectedDate={p.date}
            latestDate={p.latestDate}
            chartTheme={chartTheme}
            chartsReady
            gridAccess={p.access as never}
          />
        </div>
      )}
      {view === 'machine' && (
        <div className="gp-host grid-explorer">
          <TimeMachineTab />
        </div>
      )}
    </div>
  );
}
