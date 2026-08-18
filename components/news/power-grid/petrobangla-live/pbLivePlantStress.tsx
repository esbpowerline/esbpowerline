'use client';

import { formatNumber } from '@/lib/utils';
import { stressedPlants } from '@/lib/data/petrobangla/computeLiveWeek';
import type { PetrobanglaDaily } from '@/lib/data/petrobangla/types';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { LiveBadge } from './pbLiveShared';

export function PbLivePlantStress({ latest }: { latest: PetrobanglaDaily }) {
  const plants = stressedPlants(latest);

  return (
    <div className="space-y-3">
      <h4 className="grid-explorer-chart-card__title text-sm">
        Plant Stress List<LiveBadge />
      </h4>
      <p className="text-[11px] text-muted-foreground">
        Stations that asked for gas and got little or none — load-shedding in official numbers.
      </p>
      <div className="grid-explorer-table-wrap max-h-64 overflow-auto">
        <table className="grid-explorer-table text-xs">
          <thead>
            <tr>
              <th>Plant</th>
              <th>DISCO</th>
              <th className="text-left">Demand<GridProvenanceTag kind="P" className="ml-1" /></th>
              <th className="text-left">Supply<GridProvenanceTag kind="P" className="ml-1" /></th>
              <th className="text-left">Gap<GridProvenanceTag kind="D" className="ml-1" /></th>
            </tr>
          </thead>
          <tbody>
            {plants.slice(0, 25).map((p) => (
              <tr key={`${p.disco}-${p.name}`}>
                <td className="font-medium max-w-[160px] truncate" title={p.name}>{p.name}</td>
                <td>{p.disco}</td>
                <td className="text-left tabular-nums">{formatNumber(p.demand, 1)}</td>
                <td className={cnSupply(p.supply)}>{formatNumber(p.supply, 1)}</td>
                <td className="text-left tabular-nums text-red-500">{formatNumber(p.demand - p.supply, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cnSupply(s: number) {
  return s === 0 ? 'text-left tabular-nums text-red-500 font-bold' : 'text-left tabular-nums';
}