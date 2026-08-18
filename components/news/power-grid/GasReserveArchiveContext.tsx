'use client';

import { Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';

interface Props {
  gridDate: string;
  archiveDate: string;
  exact: boolean;
  summary?: string | null;
  peakGas?: number;
  peakDate?: string;
  lowGas?: number;
  lowDate?: string;
  declinePct: number;
}

export function GasReserveArchiveContext({
  gridDate,
  archiveDate,
  exact,
  summary,
  peakGas,
  peakDate,
  lowGas,
  lowDate,
  declinePct,
}: Props) {
  return (
    <div className="gas-reserve-archive-context">
      <div className="gas-reserve-archive-context__head">
        <span className={cn('gas-reserve-archive-context__pill', exact && 'gas-reserve-archive-context__pill--sync')}>
          <Calendar className="h-3 w-3 shrink-0" />
          {exact ? `Grid date ${gridDate}` : `Nearest gas-day ${archiveDate}`}
          {exact && <span className="text-emerald-600 dark:text-emerald-400">Synced</span>}
        </span>
      </div>
      <div className="gas-reserve-archive-context__stats">
        {peakGas != null && peakDate && (
          <div className="gas-reserve-archive-context__stat-card gas-reserve-archive-context__stat-card--peak">
            <TrendingUp className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <div>
              <span className="gas-reserve-archive-context__stat-label">Archive peak<GridProvenanceTag kind="D" className="ml-1.5" /></span>
              <span className="gas-reserve-archive-context__stat-value text-sky-500">{formatNumber(peakGas, 0)} MMCFD</span>
              <span className="gas-reserve-archive-context__stat-date">{peakDate}</span>
            </div>
          </div>
        )}
        {lowGas != null && lowDate && (
          <div className="gas-reserve-archive-context__stat-card gas-reserve-archive-context__stat-card--low">
            <TrendingDown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <div>
              <span className="gas-reserve-archive-context__stat-label">Archive low<GridProvenanceTag kind="D" className="ml-1.5" /></span>
              <span className="gas-reserve-archive-context__stat-value text-amber-500">{formatNumber(lowGas, 0)} MMCFD</span>
              <span className="gas-reserve-archive-context__stat-date">{lowDate}</span>
            </div>
          </div>
        )}
        <div className="gas-reserve-archive-context__stat-card gas-reserve-archive-context__stat-card--decline">
          <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <div>
            <span className="gas-reserve-archive-context__stat-label">Since Jan 2020<GridProvenanceTag kind="D" className="ml-1.5" /></span>
            <span className="gas-reserve-archive-context__stat-value text-red-500">−{Math.abs(declinePct).toFixed(1)}%</span>
            <span className="gas-reserve-archive-context__stat-date">National output</span>
          </div>
        </div>
      </div>
      {summary && (
        <p className="gas-reserve-archive-context__summary">{summary}</p>
      )}
    </div>
  );
}