'use client';

import type { ReactNode } from 'react';
import { Activity, Droplet, Flame, Layers, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { LiveWeekKpis } from '@/lib/data/petrobangla/types';
import {
  GridKpiLabel,
  GridSinceBadge,
  LiveBadge,
} from '@/components/news/power-grid/GridExplorerUI';

function PbLiveKpiCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  valueClassName,
  hint,
}: {
  icon: typeof Droplet;
  iconClassName?: string;
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  hint: ReactNode;
}) {
  return (
    <div className="grid-explorer-kpi stat group">
      <Icon className={cn('grid-explorer-kpi__icon', iconClassName)} />
      <div>
        <GridKpiLabel>{label}</GridKpiLabel>
        <div className={cn('grid-explorer-kpi__value', valueClassName)}>{value}</div>
        <p className="text-[9px] text-muted-foreground mt-1">{hint}</p>
      </div>
    </div>
  );
}

export function PbLiveKpiStrip({ kpis, showAll }: { kpis: LiveWeekKpis; showAll: boolean }) {
  const fulfillmentClass = kpis.powerFulfillmentPct < 45 ? 'text-red-500' : 'text-amber-500';

  return (
    <>
      <PbLiveKpiCard
        icon={Droplet}
        iconClassName="text-sky-500"
        label={
          <>
            Latest National Gas
            <LiveBadge />
            <GridSinceBadge />
          </>
        }
        value={formatNumber(kpis.latestGas, 1)}
        hint={
          <>
            {kpis.latestLabel}
            {kpis.latestGasDelta != null && (
              <span className={kpis.latestGasDelta >= 0 ? ' text-emerald-500' : ' text-red-500'}>
                {' '}
                {kpis.latestGasDelta >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(kpis.latestGasDelta), 1)} vs prior day
              </span>
            )}
          </>
        }
      />

      {showAll && (
        <>
          <PbLiveKpiCard
            icon={Activity}
            iconClassName="text-primary"
            label={
              <>
                7-Day Average Gas
                <LiveBadge />
                <GridSinceBadge />
              </>
            }
            value={formatNumber(kpis.weekAvgGas, 0)}
            hint="Weekly official average MMCFD"
          />

          <PbLiveKpiCard
            icon={Flame}
            iconClassName={fulfillmentClass}
            label={
              <>
                Power Fulfillment
                <LiveBadge />
                <GridSinceBadge />
              </>
            }
            value={`${kpis.powerFulfillmentPct.toFixed(1)}%`}
            valueClassName={fulfillmentClass}
            hint={`${formatNumber(kpis.powerSupply, 1)} of ${formatNumber(kpis.powerDemand, 1)} MMCFD to plants`}
          />

          <PbLiveKpiCard
            icon={Layers}
            iconClassName="text-purple-500"
            label={
              <>
                LNG Dependency
                <LiveBadge />
                <GridSinceBadge />
              </>
            }
            value={`${kpis.lngSharePct.toFixed(1)}%`}
            hint={`${formatNumber(kpis.lngGasMmcfd, 1)} MMCFD imported`}
          />

          <PbLiveKpiCard
            icon={TrendingUp}
            iconClassName="text-amber-500"
            label={
              <>
                Week Volatility
                <LiveBadge />
                <GridSinceBadge />
              </>
            }
            value={formatNumber(kpis.weekVolatility, 1)}
            hint={`Range ${formatNumber(kpis.weekMinGas, 0)}–${formatNumber(kpis.weekMaxGas, 0)} MMCFD`}
          />
        </>
      )}
    </>
  );
}