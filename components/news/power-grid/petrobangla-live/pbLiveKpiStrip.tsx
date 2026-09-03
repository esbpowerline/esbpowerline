'use client';

import type { ReactNode } from 'react';
import { Activity, Droplet, Flame, Layers, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { LiveWeekKpis } from '@/lib/data/petrobangla/types';
import {
  GridKpiLabel,
  GridProvenanceTag,
  GridSinceBadge,
  LatestBadge,
  type GridProvenance,
} from '@/components/news/power-grid/GridExplorerUI';

function PbLiveKpiCard({
  icon: Icon,
  iconClassName,
  label,
  provenance,
  value,
  valueClassName,
  hint,
}: {
  icon: typeof Droplet;
  iconClassName?: string;
  label: ReactNode;
  provenance: GridProvenance;
  value: ReactNode;
  valueClassName?: string;
  hint: ReactNode;
}) {
  return (
    <div className="grid-explorer-kpi stat group">
      <Icon className={cn('grid-explorer-kpi__icon shrink-0', iconClassName)} />
      <div className="min-w-0">
        <GridKpiLabel>
          {label}
          <GridProvenanceTag kind={provenance} className="ml-1.5" />
        </GridKpiLabel>
        <div className={cn('grid-explorer-kpi__value', valueClassName)}>{value}</div>
        <p className="text-[9px] text-muted-foreground mt-1 leading-snug">{hint}</p>
      </div>
    </div>
  );
}

export interface PeriodKpis {
  avgGas: number;
  avgFulfillment: number;
  avgLngShare: number;
  volatility: number;
  daysCount: number;
}

export function PbLiveKpiStrip({
  periodKpis,
  labelPrefix,
  showAll,
}: {
  periodKpis: PeriodKpis;
  labelPrefix: string;
  showAll: boolean;
}) {
  const fulfillmentClass = periodKpis.avgFulfillment < 45 ? 'text-red-500' : 'text-amber-500';

  return (
    <>
      <PbLiveKpiCard
        icon={Activity}
        iconClassName="text-sky-500"
        label={
          <>
            {labelPrefix} Avg Gas
            <LatestBadge />
            <GridSinceBadge />
          </>
        }
        provenance="D"
        value={formatNumber(periodKpis.avgGas, 0)}
        hint={`${periodKpis.daysCount}-day official average MMCFD`}
      />

      {showAll && (
        <>
          <PbLiveKpiCard
            icon={Flame}
            iconClassName={fulfillmentClass}
            label={
              <>
                {labelPrefix} Power Fulfillment
                <LatestBadge />
                <GridSinceBadge />
              </>
            }
            provenance="D"
            value={`${periodKpis.avgFulfillment.toFixed(1)}%`}
            valueClassName={fulfillmentClass}
            hint="Average supply vs demand over period"
          />

          <PbLiveKpiCard
            icon={Layers}
            iconClassName="text-purple-500"
            label={
              <>
                {labelPrefix} LNG Share
                <LatestBadge />
                <GridSinceBadge />
              </>
            }
            provenance="D"
            value={`${periodKpis.avgLngShare.toFixed(1)}%`}
            hint="Average imported LNG share over period"
          />

          <PbLiveKpiCard
            icon={TrendingUp}
            iconClassName="text-amber-500"
            label={
              <>
                {labelPrefix} Volatility
                <LatestBadge />
                <GridSinceBadge />
              </>
            }
            provenance="D"
            value={formatNumber(periodKpis.volatility, 1)}
            hint="Max/Min spread across period"
          />
        </>
      )}
    </>
  );
}