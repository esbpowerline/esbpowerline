'use client';

import { useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Droplet,
  Flame,
  Gauge,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { ARCHIVE_BASELINE_DATE, ARCHIVE_BASELINE_GAS, ARCHIVE_INSIGHTS, PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';
import type { ArchiveKpis, AudienceMode } from '@/lib/data/petrobangla/types';

interface Props {
  kpis: ArchiveKpis;
  mode: AudienceMode;
  archiveDate: string;
  gridDate: string;
  exactMatch?: boolean;
  peakGas?: number;
  peakDate?: string;
}

type KpiTooltipId = 'stress' | 'total' | 'power' | 'lng' | 'domestic' | 'wells';

function KpiTooltipPanel({
  title,
  icon: Icon,
  accent,
  align = 'center',
  active,
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  align?: 'left' | 'center' | 'right';
  active: boolean;
  children: ReactNode;
}) {
  const pos =
    align === 'left'
      ? 'left-0 md:left-1/2 md:-translate-x-1/2'
      : align === 'right'
        ? 'right-0 md:left-1/2 md:-translate-x-1/2'
        : 'left-0 md:left-1/2 md:-translate-x-1/2';

  return (
    <div
      className={cn(
        'absolute text-card-foreground border border-border/80 p-4 md:p-5 rounded-2xl shadow-2xl z-[110] w-[18rem] md:w-[20rem] top-[calc(100%+12px)] pointer-events-none bg-card transition-all duration-200 ease-out opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto',
        pos,
        active && 'opacity-100 scale-100 translate-y-0 pointer-events-auto',
      )}
      style={{ backgroundColor: 'hsl(var(--card))' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-t border-l border-border/80 z-[-1]"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      />
      <div
        className={cn(
          'font-bold text-xs uppercase tracking-wider border-b border-border/60 pb-1.5 mb-2 flex items-center gap-1.5',
          accent,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function TooltipRow({
  label,
  value,
  valueClass,
  dotColor,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
  dotColor?: string;
}) {
  return (
    <>
      <span className="grid-chart-tooltip__label flex items-center gap-1.5">
        {dotColor && <span className="grid-chart-tooltip__dot shrink-0" style={{ background: dotColor }} />}
        {label}
      </span>
      <span className={cn('grid-chart-tooltip__value text-right', valueClass)} style={dotColor && !valueClass ? { color: dotColor } : undefined}>
        {value}
      </span>
    </>
  );
}

function TooltipFoot({ refLabel, date }: { refLabel: string; date: string }) {
  return (
    <div className="pt-1 flex justify-between text-[9px] text-muted-foreground border-t border-border/20">
      <span>
        Ref:{' '}
        <a
          href="https://www.petrobangla.org.bd/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {refLabel}
        </a>
      </span>
      <span>Gas-day {date}</span>
    </div>
  );
}

export function PetrobanglaArchiveKpiStrip({
  kpis,
  mode,
  archiveDate,
  gridDate,
  exactMatch = true,
  peakGas,
  peakDate,
}: Props) {
  const [activeTooltip, setActiveTooltip] = useState<KpiTooltipId | null>(null);

  const toggleTooltip = (id: KpiTooltipId) => {
    setActiveTooltip((prev) => (prev === id ? null : id));
  };

  const stressClass =
    kpis.stressColor === 'green'
      ? 'text-emerald-500'
      : kpis.stressColor === 'amber'
        ? 'text-amber-500'
        : 'text-red-500';

  const stressLabel =
    kpis.stressScore < 40 ? 'Moderate' : kpis.stressScore <= 65 ? 'Elevated' : 'Severe';

  const powerShortfall = Math.max(0, kpis.powerDemand - kpis.powerSupply);
  const domesticSharePct = kpis.totalGas > 0 ? (kpis.domesticGas / kpis.totalGas) * 100 : 0;

  const kpiShell = 'grid-explorer-kpi stat group hover:z-[100] cursor-pointer select-none min-w-0';

  return (
    <>
      <div className={kpiShell} onClick={() => toggleTooltip('stress')}>
        <Gauge className={cn('grid-explorer-kpi__icon shrink-0', stressClass)} />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">Supply stress<sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
          <div className={cn('grid-explorer-kpi__value', stressClass)}>{kpis.stressScore}</div>
          <p className="text-[9px] text-muted-foreground mt-1 leading-snug">{stressLabel}</p>
        </div>
        <KpiTooltipPanel
          title="Supply stress"
          icon={Gauge}
          accent={stressClass}
          active={activeTooltip === 'stress'}
        >
            <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <TooltipRow label="Stress score" value={kpis.stressScore} valueClass={stressClass} dotColor={kpis.stressColor === 'green' ? '#10b981' : kpis.stressColor === 'amber' ? '#f59e0b' : '#ef4444'} />
            <TooltipRow label="Power fulfillment" value={`${kpis.powerFulfillmentPct.toFixed(1)}%`} dotColor="#ef4444" />
            <TooltipRow label="Domestic share" value={`${domesticSharePct.toFixed(1)}%`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <TooltipRow label="LNG import share" value={`${kpis.lngSharePct.toFixed(1)}%`} dotColor={PB_ARCHIVE_COLORS.lng} />
            <TooltipRow
              label="Bibiyana / domestic"
              value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}%`}
            />
            {peakGas != null && (
              <TooltipRow
                label="Vs archive peak"
                value={`${((kpis.totalGas / peakGas) * 100).toFixed(0)}% of ${formatNumber(peakGas, 0)}`}
              />
            )}
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            Weights: power gap 30% · domestic 25% · LNG 20% · Bibiyana 30% · vs peak 10%
          </div>
          <TooltipFoot refLabel="Petrobangla Daily Report" date={archiveDate} />
        </KpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('total')}>
        <Droplet className="grid-explorer-kpi__icon text-sky-500 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">National gas<sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
          <div className="grid-explorer-kpi__value">{formatNumber(kpis.totalGas, 1)}</div>
          <p className="text-[9px] text-muted-foreground mt-1">
            {kpis.totalGas < 2800 && <span className="text-red-500 font-bold">▼ </span>}
            Δ baseline {kpis.totalGasDeltaBaseline >= 0 ? '+' : ''}
            {formatNumber(kpis.totalGasDeltaBaseline, 1)} MMCFD
          </p>
        </div>
        <KpiTooltipPanel
          title="National gas"
          icon={Droplet}
          accent="text-sky-500"
          active={activeTooltip === 'total'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <TooltipRow label="Grand total" value={`${formatNumber(kpis.totalGas, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <TooltipRow
              label={`Vs ${ARCHIVE_BASELINE_DATE}`}
              value={`${kpis.totalGasDeltaBaseline >= 0 ? '+' : ''}${formatNumber(kpis.totalGasDeltaBaseline, 1)} MMCFD`}
              valueClass={kpis.totalGasDeltaBaseline < 0 ? 'text-red-500' : 'text-emerald-500'}
            />
            {kpis.totalGasDeltaYear != null && (
              <TooltipRow
                label="Vs same day last year"
                value={`${kpis.totalGasDeltaYear >= 0 ? '+' : ''}${formatNumber(kpis.totalGasDeltaYear, 1)} MMCFD`}
              />
            )}
            {kpis.totalGasDeltaPeak != null && peakDate && (
              <TooltipRow
                label={`Vs peak (${peakDate})`}
                value={`${kpis.totalGasDeltaPeak >= 0 ? '+' : ''}${formatNumber(kpis.totalGasDeltaPeak, 1)} MMCFD`}
              />
            )}
            <TooltipRow label="Jan 2020 baseline" value={`${formatNumber(ARCHIVE_BASELINE_GAS, 1)} MMCFD`} />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            {exactMatch ? `Synced to grid date ${gridDate}` : `Nearest gas-day to ${gridDate}`}
          </div>
          <TooltipFoot refLabel="Petrobangla Production Division" date={archiveDate} />
        </KpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('power')}>
        <Flame className="grid-explorer-kpi__icon text-red-500 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">Power fulfillment<sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
          <div className="grid-explorer-kpi__value">{kpis.powerFulfillmentPct.toFixed(1)}%</div>
          <p className="text-[9px] text-muted-foreground mt-1">
            Plants got {formatNumber(kpis.powerSupply, 1)} of {formatNumber(kpis.powerDemand, 1)} MMCFD
          </p>
        </div>
        <KpiTooltipPanel
          title="Power fulfillment"
          icon={Flame}
          accent="text-red-500"
          align="right"
          active={activeTooltip === 'power'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <TooltipRow label="Fulfillment rate" value={`${kpis.powerFulfillmentPct.toFixed(1)}%`} valueClass="text-red-500" dotColor="#ef4444" />
            <TooltipRow label="Plants received" value={`${formatNumber(kpis.powerSupply, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.powerSupply} />
            <TooltipRow label="Plants requested" value={`${formatNumber(kpis.powerDemand, 1)} MMCFD`} dotColor="#f59e0b" />
            <TooltipRow label="Unmet demand" value={`${formatNumber(powerShortfall, 1)} MMCFD`} valueClass="text-destructive" dotColor={PB_ARCHIVE_COLORS.shortage} />
            <TooltipRow
              label="Jan 2020 benchmark"
              value={`${ARCHIVE_INSIGHTS.jan2020Baseline.powerFulfillment}%`}
            />
            <TooltipRow
              label="Collapse since 2020"
              value={`−${(ARCHIVE_INSIGHTS.jan2020Baseline.powerFulfillment - kpis.powerFulfillmentPct).toFixed(1)} pts`}
            />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            Sector allocation from Petrobangla distribution summary
          </div>
          <TooltipFoot refLabel="Petrobangla Sector Report" date={archiveDate} />
        </KpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('lng')}>
        <Layers className="grid-explorer-kpi__icon text-purple-500 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">LNG share<sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
          <div className="grid-explorer-kpi__value">{kpis.lngSharePct.toFixed(1)}%</div>
          <p className="text-[9px] text-muted-foreground mt-1">{formatNumber(kpis.lngGasMmcfd, 1)} MMCFD imported</p>
        </div>
        <KpiTooltipPanel
          title="LNG share"
          icon={Layers}
          accent="text-purple-500"
          active={activeTooltip === 'lng'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <TooltipRow label="Imported LNG (RPGCL)" value={`${formatNumber(kpis.lngGasMmcfd, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.lng} />
            <TooltipRow label="Share of national mix" value={`${kpis.lngSharePct.toFixed(1)}%`} valueClass="text-purple-500" dotColor={PB_ARCHIVE_COLORS.lng} />
            <TooltipRow label="Domestic fields" value={`${formatNumber(kpis.domesticGas, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <TooltipRow label="Domestic share" value={`${domesticSharePct.toFixed(1)}%`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <TooltipRow
              label="LNG ramp since 2020"
              value={`${ARCHIVE_INSIGHTS.lngRamp.from} → ${ARCHIVE_INSIGHTS.lngRamp.to} MMCFD (+${ARCHIVE_INSIGHTS.lngRamp.pct}%)`}
            />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            RPGCL terminals · regasified LNG counted separately from own-field gas
          </div>
          <TooltipFoot refLabel="Petrobangla RPGCL" date={archiveDate} />
        </KpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('domestic')}>
        <Activity className="grid-explorer-kpi__icon text-sky-600 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">Domestic output<sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
          <div className="grid-explorer-kpi__value">{formatNumber(kpis.domesticGas, 1)}</div>
          <p className="text-[9px] text-muted-foreground mt-1">Own gas, excluding imports</p>
        </div>
        <KpiTooltipPanel
          title="Domestic output"
          icon={Activity}
          accent="text-sky-600"
          active={activeTooltip === 'domestic'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <TooltipRow label="Own-field production" value={`${formatNumber(kpis.domesticGas, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <TooltipRow
              label="Vs Jan 2020 domestic"
              value={`${kpis.domesticDeltaBaseline >= 0 ? '+' : ''}${formatNumber(kpis.domesticDeltaBaseline, 1)} MMCFD`}
              valueClass={kpis.domesticDeltaBaseline < 0 ? 'text-red-500' : undefined}
            />
            <TooltipRow label="Bibiyana field" value={`${formatNumber(kpis.bibiyanaGas, 1)} MMCFD`} />
            <TooltipRow
              label="Bibiyana share"
              value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}% of domestic`}
            />
            <TooltipRow label="National decline" value={`${ARCHIVE_INSIGHTS.nationalDecline.pct}% since 2020`} valueClass="text-red-500" dotColor={PB_ARCHIVE_COLORS.shortage} />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            All fields except RPGCL/LNG import terminals
          </div>
          <TooltipFoot refLabel="Petrobangla Field Report" date={archiveDate} />
        </KpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('wells')}>
        <AlertTriangle className="grid-explorer-kpi__icon text-amber-500 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">Active wells<sup className="text-muted-foreground/60 font-medium text-[9px] ml-1.5 select-none lowercase">since 2020</sup></div>
          <div className="grid-explorer-kpi__value">{Math.round(kpis.activeWells)}</div>
          {mode !== 'simple' && (
            <p className="text-[9px] text-muted-foreground mt-1">
              Bibiyana {formatNumber(kpis.bibiyanaGas, 1)} ({kpis.bibiyanaDomesticSharePct.toFixed(0)}% domestic)
            </p>
          )}
        </div>
        <KpiTooltipPanel
          title="Active wells"
          icon={AlertTriangle}
          accent="text-amber-500"
          align="right"
          active={activeTooltip === 'wells'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <TooltipRow label="Producing wells" value={Math.round(kpis.activeWells)} dotColor="#f59e0b" />
            <TooltipRow label="Bibiyana output" value={`${formatNumber(kpis.bibiyanaGas, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <TooltipRow
              label="Bibiyana decline"
              value={`${ARCHIVE_INSIGHTS.bibiyanaDecline.from} → ${ARCHIVE_INSIGHTS.bibiyanaDecline.to} MMCFD`}
            />
            <TooltipRow label="Bibiyana wells" value={`${ARCHIVE_INSIGHTS.bibiyanaDecline.wells} active`} />
            <TooltipRow
              label="Concentration risk"
              value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}% of domestic from one field`}
              valueClass={kpis.bibiyanaDomesticSharePct > 45 ? 'text-amber-500' : undefined}
              dotColor="#f59e0b"
            />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            Fewer producing wells + falling field rates = structural depletion pressure
          </div>
          <TooltipFoot refLabel="Petrobangla Well Status" date={archiveDate} />
        </KpiTooltipPanel>
      </div>
    </>
  );
}