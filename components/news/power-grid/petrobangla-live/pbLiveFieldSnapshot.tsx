'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn, formatNumber } from '@/lib/utils';
import { fieldSparklines } from '@/lib/data/petrobangla/computeLiveWeek';
import { PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';
import type { PetrobanglaDaily, PetrobanglaLiveWeekBundle } from '@/lib/data/petrobangla/types';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { LiveBadge } from './pbLiveShared';

const HIGHLIGHT_FIELDS = new Set(['Bibiyana', 'R-LNG Terminal', 'Titas']);

export function PbLiveFieldSnapshot({
  bundle,
  latest,
  showSparklines,
}: {
  bundle: PetrobanglaLiveWeekBundle;
  latest: PetrobanglaDaily;
  showSparklines: boolean;
}) {
  const sparks = fieldSparklines(bundle);
  const fields = [...latest.production.fields].sort((a, b) => b.gas_mmcfd - a.gas_mmcfd);

  return (
    <div className="space-y-3">
      <h4 className="grid-explorer-chart-card__title text-sm">
        Daily Field Snapshot<LiveBadge />
      </h4>
      <div className="grid-explorer-table-wrap max-h-80 overflow-auto">
        <table className="grid-explorer-table text-xs">
          <thead>
            <tr>
              <th>Field</th>
              <th className="text-left">Wells<GridProvenanceTag kind="P" className="ml-1" /></th>
              <th className="text-left">Gas MMCFD<GridProvenanceTag kind="P" className="ml-1" /></th>
              {showSparklines && <th className="text-left w-24">7d<GridProvenanceTag kind="P" className="ml-1" /></th>}
              <th className="text-left">Capacity<GridProvenanceTag kind="P" className="ml-1" /></th>
              <th className="text-left">% Total<GridProvenanceTag kind="D" className="ml-1" /></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => {
              const series = (sparks.get(f.field) ?? []).map((v, i) => ({ i, v }));
              const pct = latest.production.grand_total.gas_mmcfd > 0
                ? (f.gas_mmcfd / latest.production.grand_total.gas_mmcfd) * 100
                : 0;
              const highlight = HIGHLIGHT_FIELDS.has(f.field);
              return (
                <tr key={f.id} className={cn(highlight && 'bg-sky-500/5')}>
                  <td className="font-semibold">{f.field}</td>
                  <td className="text-left tabular-nums">{f.producing_wells}</td>
                  <td className="text-left tabular-nums font-medium">{formatNumber(f.gas_mmcfd, 1)}</td>
                  {showSparklines && (
                    <td className="text-left">
                      <div className="h-6 w-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={series}>
                            <Line
                              type="monotone"
                              dataKey="v"
                              stroke={f.company_code === 'RPGCL' ? PB_ARCHIVE_COLORS.lng : PB_ARCHIVE_COLORS.domestic}
                              strokeWidth={1.5}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                  )}
                  <td className="text-left tabular-nums text-muted-foreground">{formatNumber(f.capacity_mmcfd, 0)}</td>
                  <td className="text-left tabular-nums">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}