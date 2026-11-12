'use client';

import { useState } from 'react';
import type { EnergyCurve } from '@/lib/data/grid/types';
import { isNum } from './shared';
import { FuelView } from './supply-fuel';
import { ImportsView } from './supply-imports';
import { RenewablesView } from './supply-renewables';

const GROUP_OF = (fuel: string): string | null => {
  if (/^shortage/i.test(fuel)) return null;
  if (/coal/i.test(fuel)) return 'Coal';
  if (/gas/i.test(fuel)) return 'Gas';
  if (/hvdc|nepal|tripura|adani|import/i.test(fuel)) return 'Imports';
  if (/hfo|hsd|oil|diesel/i.test(fuel)) return 'Oil';
  if (/hydro|solar|wind/i.test(fuel)) return 'Renewables';
  return null;
};
const ORDER = ['Coal', 'Gas', 'Imports', 'Oil', 'Renewables'];

/**
 * The NLDC energy curve folded into five fuel groups. A group is null at an
 * hour only when every fuel in it is unpublished there; the stack draws that
 * as nothing and the readout prints a dash.
 */
export function groupCurve(curve: EnergyCurve, hourly = true) {
  const rows = curve.rows.filter((r) => !hourly || r.time.endsWith(':00'));
  const groups = ORDER.filter((g) => curve.fuels.some((f) => GROUP_OF(f) === g));
  const raw: (number | null)[][] = rows.map((r) =>
    groups.map((g) => {
      let sum = 0;
      let any = false;
      curve.fuels.forEach((f, i) => {
        if (GROUP_OF(f) !== g) return;
        const v = r.mw[i];
        if (isNum(v)) {
          sum += v;
          any = true;
        }
      });
      return any ? sum : null;
    }),
  );
  return { labels: rows.map((r) => r.time), groups, raw, rows: raw.map((r) => r.map((v) => v ?? 0)) };
}

type View = 'fuel' | 'imports' | 'renewables';
const VIEWS: [View, string][] = [
  ['fuel', 'Fuel & cost'],
  ['imports', 'Imports'],
  ['renewables', 'Renewables'],
];

/**
 * `view`/`onView` let the app's section strip drive this screen (it lists the
 * desktop's own tab names, so Generation & Cost, C/B Imports and Renewables
 * are each one tap away). Driven that way the in-screen switch is redundant
 * and is not drawn.
 */
export function SupplyScreen({ view: controlled, onView }: { view?: View; onView?: (v: View) => void } = {}) {
  const [own, setOwn] = useState<View>('fuel');
  const view = controlled ?? own;
  const setView = (v: View) => { setOwn(v); onView?.(v); };
  return (
    <div className="gp-screen">
      {!controlled && (
        <div className="gp-seg gp-seg--sticky" role="tablist" aria-label="Supply view">
          {VIEWS.map(([id, l]) => (
            <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => setView(id)}>{l}</button>
          ))}
        </div>
      )}
      {view === 'fuel' && <FuelView />}
      {view === 'imports' && <ImportsView />}
      {view === 'renewables' && <RenewablesView />}
    </div>
  );
}
