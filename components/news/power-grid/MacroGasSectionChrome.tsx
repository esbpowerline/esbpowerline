'use client';

import type { ReactNode } from 'react';
import { Calendar, History, Layers } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { LiveWeekKpis } from '@/lib/data/petrobangla/types';
import { formatLiveWeekDate } from '@/lib/data/petrobangla/getLiveWeek';
import type { PeriodKpis } from './petrobangla-live/pbLiveKpiStrip';


export function MacroGasMetaChips({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2 mt-3">{children}</div>;
}

export function MacroGasMetaChip({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'sky' | 'emerald' | 'amber';
}) {
  const toneClass =
    tone === 'sky'
      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'
      : tone === 'emerald'
        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
        : tone === 'amber'
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
          : 'bg-muted/30 text-muted-foreground border-border/50';

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border', toneClass)}>
      {children}
    </span>
  );
}

export function MacroGasInnerSection({
  icon: Icon,
  title,
  badge,
  subtitle,
  toolbar,
  children,
}: {
  icon: typeof Layers;
  title: string;
  badge?: ReactNode;
  subtitle?: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid-explorer-macro-gas-block">
      <div className="grid-explorer-macro-gas-block__head flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2.5 items-start">
          <div className="grid-explorer-macro-gas-block__icon">
            <Icon className="h-4 w-4 text-sky-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h4 className="text-sm font-bold text-foreground">{title}</h4>
              {badge}
            </div>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
        </div>
        {toolbar && <div className="shrink-0">{toolbar}</div>}
      </div>
      <div className="grid-explorer-macro-gas-block__body">{children}</div>
    </section>
  );
}

export function MacroGasWeekSummary({
  kpis,
  labelPrefix,
  periodKpis,
}: {
  kpis: LiveWeekKpis;
  labelPrefix?: string;
  periodKpis?: PeriodKpis | null;
}) {
  // When a period aggregation is available, the period-labelled stats (average, fulfillment, LNG
  // share) must reflect the whole period — not the latest single day that `kpis` carries.
  const avgGas = periodKpis ? periodKpis.avgGas : kpis.weekAvgGas;
  const fulfillment = periodKpis ? periodKpis.avgFulfillment : kpis.powerFulfillmentPct;
  const lngShare = periodKpis ? periodKpis.avgLngShare : kpis.lngSharePct;
  const fulfillmentTone = fulfillment < 45 ? 'text-red-500' : 'text-amber-500';
  const deltaTone = (kpis.latestGasDelta ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500';

  return (
    <div className="grid-explorer-macro-gas-stat-row lg:grid-cols-5">
      <div className="grid-explorer-macro-gas-stat border-sky-500/25 bg-sky-500/5">
        <span className="grid-explorer-macro-gas-stat__label">Latest national gas</span>
        <span className="grid-explorer-macro-gas-stat__value">{formatNumber(kpis.latestGas, 1)}</span>
        <span className="grid-explorer-macro-gas-stat__hint">
          {kpis.latestLabel}
          {kpis.latestGasDelta != null && (
            <span className={cn(' font-semibold', deltaTone)}>
              {' '}
              {kpis.latestGasDelta >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(kpis.latestGasDelta), 1)}
            </span>
          )}
        </span>
      </div>
      <div className="grid-explorer-macro-gas-stat">
        <span className="grid-explorer-macro-gas-stat__label">{labelPrefix ? `${labelPrefix} average` : 'Week average'}</span>
        <span className="grid-explorer-macro-gas-stat__value">{formatNumber(avgGas, 0)}</span>
        <span className="grid-explorer-macro-gas-stat__hint">MMCFD · to {formatLiveWeekDate(kpis.latestDate)}</span>
      </div>
      <div className="grid-explorer-macro-gas-stat">
        <span className="grid-explorer-macro-gas-stat__label">{labelPrefix ? `${labelPrefix} Power fulfillment` : 'Power fulfillment'}</span>
        <span className={cn('grid-explorer-macro-gas-stat__value', fulfillmentTone)}>
          {fulfillment.toFixed(0)}%
        </span>
        <span className="grid-explorer-macro-gas-stat__hint">
          {periodKpis
            ? `avg over ${periodKpis.daysCount} days`
            : `${formatNumber(kpis.powerSupply, 0)} of ${formatNumber(kpis.powerDemand, 0)} MMCFD`}
        </span>
      </div>
      <div className="grid-explorer-macro-gas-stat">
        <span className="grid-explorer-macro-gas-stat__label">{labelPrefix ? `${labelPrefix} LNG share` : 'LNG share'}</span>
        <span className="grid-explorer-macro-gas-stat__value">{lngShare.toFixed(0)}%</span>
        <span className="grid-explorer-macro-gas-stat__hint">imported gas in mix</span>
      </div>
      <div className="grid-explorer-macro-gas-stat">
        <span className="grid-explorer-macro-gas-stat__label">Bibiyana</span>
        <span className="grid-explorer-macro-gas-stat__value">{formatNumber(kpis.bibiyanaGas, 0)}</span>
        <span className="grid-explorer-macro-gas-stat__hint">{kpis.bibiyanaWells} wells active</span>
      </div>
    </div>
  );
}

export function MacroGasArchiveDayBanner({
  gridDate,
  archiveDate,
  exact,
  agentSummary,
  peakGas,
  peakDate,
  lowGas,
  lowDate,
  declinePct,
}: {
  gridDate: string;
  archiveDate: string;
  exact: boolean;
  agentSummary?: string | null;
  peakGas?: number;
  peakDate?: string;
  lowGas?: number;
  lowDate?: string;
  declinePct: number;
}) {
  return (
    <div className="grid-explorer-macro-gas-day-banner space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <MacroGasMetaChip tone={exact ? 'emerald' : 'amber'}>
          <Calendar className="h-3 w-3" />
          {exact ? `Grid date ${gridDate} · synced` : `Gas-day ${archiveDate}`}
        </MacroGasMetaChip>
        {peakGas != null && peakDate && (
          <MacroGasMetaChip tone="sky">
            Peak {formatNumber(peakGas, 0)} MMCFD · {peakDate}
          </MacroGasMetaChip>
        )}
        {lowGas != null && lowDate && (
          <MacroGasMetaChip>
            Low {formatNumber(lowGas, 0)} MMCFD · {lowDate}
          </MacroGasMetaChip>
        )}
        <MacroGasMetaChip tone="amber">
          ↓ {Math.abs(declinePct).toFixed(1)}% since Jan 2020
        </MacroGasMetaChip>
      </div>
      {agentSummary && (
        <p className="text-[11px] text-muted-foreground leading-relaxed border-l-2 border-sky-500/40 pl-3">
          {agentSummary}
        </p>
      )}
    </div>
  );
}

