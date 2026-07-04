'use client';

import { Activity, Droplet, Flame, Layers, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { LiveWeekKpis } from '@/lib/data/petrobangla/types';
import { LiveBadge } from './pbLiveShared';

export function PbLiveKpiStrip({ kpis, showAll }: { kpis: LiveWeekKpis; showAll: boolean }) {
  const fulfillmentClass = kpis.powerFulfillmentPct < 45 ? 'text-red-500' : 'text-amber-500';

  return (
    <>
      <div className="grid-explorer-kpi stat group">
        <Droplet className="grid-explorer-kpi__icon text-sky-500" />
        <div>
          <div className="grid-explorer-kpi__label">Latest National Gas<LiveBadge /><sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
          <div className="grid-explorer-kpi__value">{formatNumber(kpis.latestGas, 1)}</div>
          <p className="text-[9px] text-muted-foreground mt-1">
            {kpis.latestLabel}
            {kpis.latestGasDelta != null && (
              <span className={kpis.latestGasDelta >= 0 ? ' text-emerald-500' : ' text-red-500'}>
                {' '}
                {kpis.latestGasDelta >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(kpis.latestGasDelta), 1)} vs prior day
              </span>
            )}
          </p>
        </div>
      </div>

      {showAll && (
        <>
          <div className="grid-explorer-kpi stat group">
            <Activity className="grid-explorer-kpi__icon text-primary" />
            <div>
              <div className="grid-explorer-kpi__label">7-Day Average Gas<LiveBadge /><sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
              <div className="grid-explorer-kpi__value">{formatNumber(kpis.weekAvgGas, 0)}</div>
              <p className="text-[9px] text-muted-foreground mt-1">Weekly official average MMCFD</p>
            </div>
          </div>

          <div className="grid-explorer-kpi stat group">
            <Flame className={cn('grid-explorer-kpi__icon', fulfillmentClass)} />
            <div>
              <div className="grid-explorer-kpi__label">Power Fulfillment<LiveBadge /><sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
              <div className={cn('grid-explorer-kpi__value', fulfillmentClass)}>
                {kpis.powerFulfillmentPct.toFixed(1)}%
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                {formatNumber(kpis.powerSupply, 1)} of {formatNumber(kpis.powerDemand, 1)} MMCFD to plants
              </p>
            </div>
          </div>

          <div className="grid-explorer-kpi stat group">
            <Layers className="grid-explorer-kpi__icon text-purple-500" />
            <div>
              <div className="grid-explorer-kpi__label">LNG Dependency<LiveBadge /><sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
              <div className="grid-explorer-kpi__value">{kpis.lngSharePct.toFixed(1)}%</div>
              <p className="text-[9px] text-muted-foreground mt-1">{formatNumber(kpis.lngGasMmcfd, 1)} MMCFD imported</p>
            </div>
          </div>

          <div className="grid-explorer-kpi stat group">
            <TrendingUp className="grid-explorer-kpi__icon text-amber-500" />
            <div>
              <div className="grid-explorer-kpi__label">Week Volatility<LiveBadge /><sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
              <div className="grid-explorer-kpi__value">{formatNumber(kpis.weekVolatility, 1)}</div>
              <p className="text-[9px] text-muted-foreground mt-1">
                Range {formatNumber(kpis.weekMinGas, 0)}–{formatNumber(kpis.weekMaxGas, 0)} MMCFD
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}