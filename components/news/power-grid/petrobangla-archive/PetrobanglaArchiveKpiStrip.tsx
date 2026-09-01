'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Droplet,
  Flame,
  Gauge,
  Layers,
} from 'lucide-react';
import {
  GridKpiTooltipAudit,
  GridKpiTooltipGasRef,
  GridKpiTooltipGrid,
  GridKpiTooltipGridRow,
  GridKpiTooltipPanel,
  GridProvenanceTag,
} from '@/components/news/power-grid/GridExplorerUI';
import { cn, formatNumber } from '@/lib/utils';
import { ARCHIVE_BASELINE_DATE, ARCHIVE_BASELINE_GAS, ARCHIVE_INSIGHTS, PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';
import type { ArchiveKpis, AudienceMode } from '@/lib/data/petrobangla/types';
import {
  SERIES_COLORS,
  SERIES_UNMAPPED,
  STATUS_COLORS,
  CHART_INK,
} from '@/lib/data/grid/chart-palette';

interface Props {
  kpis: ArchiveKpis;
  mode: AudienceMode;
  archiveDate: string;
  gridDate: string;
  exactMatch?: boolean;
  peakGas?: number;
  peakDate?: string;
  /** Index-only values while daily JSON loads */
  preview?: boolean;
  /** The PDF this gas-day was parsed from, named on each KPI it produced. */
  sourceFile?: string | null;
}

type KpiTooltipId = 'stress' | 'total' | 'power' | 'lng' | 'domestic' | 'wells';

export function PetrobanglaArchiveKpiStrip({
  kpis,
  mode,
  archiveDate,
  gridDate,
  exactMatch = true,
  peakGas,
  peakDate,
  preview = false,
  sourceFile,
}: Props) {
  const [activeTooltip, setActiveTooltip] = useState<KpiTooltipId | null>(null);
  const pending = <span className="text-muted-foreground/60 animate-pulse">…</span>;

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
          <div className="grid-explorer-kpi__label">Supply stress<GridProvenanceTag kind="D" className="ml-1.5" /></div>
          <div className={cn('grid-explorer-kpi__value', preview ? 'text-muted-foreground' : stressClass)}>
            {preview ? pending : kpis.stressScore}
          </div>
          <p className="text-[9px] text-muted-foreground mt-1 leading-snug">
            {preview ? 'Loading field detail…' : stressLabel}
          </p>
        </div>
        <GridKpiTooltipPanel
          loading={preview}
          title="Supply stress"
          icon={Gauge}
          accent={stressClass}
          active={activeTooltip === 'stress'}
        >
            <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <GridKpiTooltipGridRow label="Stress score" provenance="D" value={kpis.stressScore} valueClass={stressClass} dotColor={kpis.stressColor === 'green' ? STATUS_COLORS.good : kpis.stressColor === 'amber' ? STATUS_COLORS.warning : STATUS_COLORS.critical} />
            <GridKpiTooltipGridRow label="Power fulfillment" provenance="D" value={`${kpis.powerFulfillmentPct.toFixed(1)}%`} dotColor={STATUS_COLORS.critical} />
            <GridKpiTooltipGridRow label="Domestic share" provenance="D" value={`${domesticSharePct.toFixed(1)}%`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <GridKpiTooltipGridRow label="LNG import share" provenance="D" value={`${kpis.lngSharePct.toFixed(1)}%`} dotColor={PB_ARCHIVE_COLORS.lng} />
            <GridKpiTooltipGridRow
              label="Bibiyana / domestic" provenance="D"
              value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}%`}
            />
            {peakGas != null && (
              <GridKpiTooltipGridRow
                label="Vs archive peak" provenance="D"
                value={`${((kpis.totalGas / peakGas) * 100).toFixed(0)}% of ${formatNumber(peakGas, 0)}`}
              />
            )}
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            Weights: power gap 30% · domestic 25% · LNG 20% · Bibiyana 30% · vs peak 10%
          </div>
          <GridKpiTooltipGasRef refLabel="Petrobangla Daily Gas Intake/Offtake Report" part="I. Production — grand total" gasDay={archiveDate} sourceFile={sourceFile} />
        </GridKpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('total')}>
        <Droplet className="grid-explorer-kpi__icon text-sky-500 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">National gas<GridProvenanceTag kind="P" className="ml-1.5" /></div>
          <div className="grid-explorer-kpi__value">{formatNumber(kpis.totalGas, 1)}</div>
          <p className="text-[9px] text-muted-foreground mt-1">
            {kpis.totalGas < 2800 && <span className="text-red-500 font-bold">▼ </span>}
            Δ baseline {kpis.totalGasDeltaBaseline >= 0 ? '+' : ''}
            {formatNumber(kpis.totalGasDeltaBaseline, 1)} MMCFD
          </p>
        </div>
        <GridKpiTooltipPanel
          loading={preview}
          title="National gas"
          icon={Droplet}
          accent="text-sky-500"
          active={activeTooltip === 'total'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <GridKpiTooltipGridRow label="Grand total" provenance="P" value={`${formatNumber(kpis.totalGas, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <GridKpiTooltipGridRow
              label={`Vs ${ARCHIVE_BASELINE_DATE}`} provenance="D"
              value={`${kpis.totalGasDeltaBaseline >= 0 ? '+' : ''}${formatNumber(kpis.totalGasDeltaBaseline, 1)} MMCFD`}
              valueClass={kpis.totalGasDeltaBaseline < 0 ? 'text-red-500' : 'text-emerald-500'}
            />
            {kpis.totalGasDeltaYear != null && (
              <GridKpiTooltipGridRow
                label="Vs same day last year" provenance="D"
                value={`${kpis.totalGasDeltaYear >= 0 ? '+' : ''}${formatNumber(kpis.totalGasDeltaYear, 1)} MMCFD`}
              />
            )}
            {kpis.totalGasDeltaPeak != null && peakDate && (
              <GridKpiTooltipGridRow
                label={`Vs peak (${peakDate})`} provenance="D"
                value={`${kpis.totalGasDeltaPeak >= 0 ? '+' : ''}${formatNumber(kpis.totalGasDeltaPeak, 1)} MMCFD`}
              />
            )}
            <GridKpiTooltipGridRow label="Jan 2020 baseline" provenance="P" value={`${formatNumber(ARCHIVE_BASELINE_GAS, 1)} MMCFD`} />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            {exactMatch ? `Synced to grid date ${gridDate}` : `Nearest gas-day to ${gridDate}`}
          </div>
          <GridKpiTooltipGasRef refLabel="Petrobangla Daily Gas Intake/Offtake Report" part="I. Production" gasDay={archiveDate} sourceFile={sourceFile} />
        </GridKpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('power')}>
        <Flame className="grid-explorer-kpi__icon text-red-500 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">Power fulfillment<GridProvenanceTag kind="D" className="ml-1.5" /></div>
          <div className="grid-explorer-kpi__value">
            {preview ? pending : `${kpis.powerFulfillmentPct.toFixed(1)}%`}
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">
            {preview
              ? 'Loading plant allocation…'
              : `Plants got ${formatNumber(kpis.powerSupply, 1)} of ${formatNumber(kpis.powerDemand, 1)} MMCFD`}
          </p>
        </div>
        <GridKpiTooltipPanel
          loading={preview}
          title="Power fulfillment"
          icon={Flame}
          accent="text-red-500"
          align="right"
          active={activeTooltip === 'power'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <GridKpiTooltipGridRow label="Fulfillment rate" provenance="D" value={`${kpis.powerFulfillmentPct.toFixed(1)}%`} valueClass="text-red-500" dotColor={STATUS_COLORS.critical} />
            <GridKpiTooltipGridRow label="Plants received" provenance="P" value={`${formatNumber(kpis.powerSupply, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.powerSupply} />
            <GridKpiTooltipGridRow label="Plants requested" provenance="P" value={`${formatNumber(kpis.powerDemand, 1)} MMCFD`} dotColor={STATUS_COLORS.warning} />
            <GridKpiTooltipGridRow label="Unmet demand" provenance="D" value={`${formatNumber(powerShortfall, 1)} MMCFD`} valueClass="text-destructive" dotColor={PB_ARCHIVE_COLORS.shortage} />
            <GridKpiTooltipGridRow
              label="Jan 2020 benchmark" provenance="D"
              value={`${ARCHIVE_INSIGHTS.jan2020Baseline.powerFulfillment}%`}
            />
            <GridKpiTooltipGridRow
              label="Collapse since 2020" provenance="D"
              value={`−${(ARCHIVE_INSIGHTS.jan2020Baseline.powerFulfillment - kpis.powerFulfillmentPct).toFixed(1)} pts`}
            />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            Sector allocation from Petrobangla distribution summary
          </div>
          <GridKpiTooltipGasRef refLabel="Petrobangla Daily Gas Intake/Offtake Report" part="II. Distribution" gasDay={archiveDate} sourceFile={sourceFile} />
        </GridKpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('lng')}>
        <Layers className="grid-explorer-kpi__icon text-purple-500 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">LNG share<GridProvenanceTag kind="D" className="ml-1.5" /></div>
          <div className="grid-explorer-kpi__value">{preview ? pending : `${kpis.lngSharePct.toFixed(1)}%`}</div>
          <p className="text-[9px] text-muted-foreground mt-1">
            {preview ? 'Loading production mix…' : `${formatNumber(kpis.lngGasMmcfd, 1)} MMCFD imported`}
          </p>
        </div>
        <GridKpiTooltipPanel
          loading={preview}
          title="LNG share"
          icon={Layers}
          accent="text-purple-500"
          active={activeTooltip === 'lng'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <GridKpiTooltipGridRow label="Imported LNG (RPGCL)" provenance="P" value={`${formatNumber(kpis.lngGasMmcfd, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.lng} />
            <GridKpiTooltipGridRow label="Share of national mix" provenance="D" value={`${kpis.lngSharePct.toFixed(1)}%`} valueClass="text-purple-500" dotColor={PB_ARCHIVE_COLORS.lng} />
            <GridKpiTooltipGridRow label="Domestic fields" provenance="D" value={`${formatNumber(kpis.domesticGas, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <GridKpiTooltipGridRow label="Domestic share" provenance="D" value={`${domesticSharePct.toFixed(1)}%`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <GridKpiTooltipGridRow
              label="LNG ramp since 2020" provenance="D"
              value={`${ARCHIVE_INSIGHTS.lngRamp.from} → ${ARCHIVE_INSIGHTS.lngRamp.to} MMCFD (+${ARCHIVE_INSIGHTS.lngRamp.pct}%)`}
            />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            RPGCL terminals · regasified LNG counted separately from own-field gas
          </div>
          <GridKpiTooltipGasRef refLabel="Petrobangla Daily Gas Intake/Offtake Report" part="I. Production — RPGCL (R-LNG) rows" gasDay={archiveDate} sourceFile={sourceFile} />
        </GridKpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('domestic')}>
        <Activity className="grid-explorer-kpi__icon text-sky-600 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">Domestic output<GridProvenanceTag kind="P" className="ml-1.5" /></div>
          <div className="grid-explorer-kpi__value">{preview ? pending : formatNumber(kpis.domesticGas, 1)}</div>
          <p className="text-[9px] text-muted-foreground mt-1">
            {preview ? 'Loading field output…' : 'Own gas, excluding imports'}
          </p>
        </div>
        <GridKpiTooltipPanel
          loading={preview}
          title="Domestic output"
          icon={Activity}
          accent="text-sky-600"
          active={activeTooltip === 'domestic'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <GridKpiTooltipGridRow label="Own-field production" provenance="D" value={`${formatNumber(kpis.domesticGas, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <GridKpiTooltipGridRow
              label="Vs Jan 2020 domestic" provenance="D"
              value={`${kpis.domesticDeltaBaseline >= 0 ? '+' : ''}${formatNumber(kpis.domesticDeltaBaseline, 1)} MMCFD`}
              valueClass={kpis.domesticDeltaBaseline < 0 ? 'text-red-500' : undefined}
            />
            <GridKpiTooltipGridRow label="Bibiyana field" provenance="P" value={`${formatNumber(kpis.bibiyanaGas, 1)} MMCFD`} />
            <GridKpiTooltipGridRow
              label="Bibiyana share" provenance="D"
              value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}% of domestic`}
            />
            <GridKpiTooltipGridRow label="National decline" provenance="D" value={`${ARCHIVE_INSIGHTS.nationalDecline.pct}% since 2020`} valueClass="text-red-500" dotColor={PB_ARCHIVE_COLORS.shortage} />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            All fields except RPGCL/LNG import terminals
          </div>
          <GridKpiTooltipGasRef refLabel="Petrobangla Daily Gas Intake/Offtake Report" part="I. Production — field rows" gasDay={archiveDate} sourceFile={sourceFile} />
        </GridKpiTooltipPanel>
      </div>

      <div className={kpiShell} onClick={() => toggleTooltip('wells')}>
        <AlertTriangle className="grid-explorer-kpi__icon text-amber-500 shrink-0" />
        <div className="min-w-0">
          <div className="grid-explorer-kpi__label">Active wells<GridProvenanceTag kind="P" className="ml-1.5" /></div>
          <div className="grid-explorer-kpi__value">{preview || kpis.activeWells == null ? pending : Math.round(kpis.activeWells)}</div>
          {mode !== 'simple' && (
            <p className="text-[9px] text-muted-foreground mt-1">
              {preview
                ? 'Loading well counts…'
                : `Bibiyana ${formatNumber(kpis.bibiyanaGas, 1)} (${kpis.bibiyanaDomesticSharePct.toFixed(0)}% domestic)`}
            </p>
          )}
        </div>
        <GridKpiTooltipPanel
          loading={preview}
          title="Active wells"
          icon={AlertTriangle}
          accent="text-amber-500"
          align="right"
          active={activeTooltip === 'wells'}
        >
          <div className="grid-chart-tooltip__grid text-[11px] md:text-xs">
            <GridKpiTooltipGridRow label="Producing wells" provenance="P" value={kpis.activeWells == null ? pending : Math.round(kpis.activeWells)} dotColor={STATUS_COLORS.warning} />
            <GridKpiTooltipGridRow label="Bibiyana output" provenance="P" value={`${formatNumber(kpis.bibiyanaGas, 1)} MMCFD`} dotColor={PB_ARCHIVE_COLORS.domestic} />
            <GridKpiTooltipGridRow
              label="Bibiyana decline" provenance="P"
              value={`${ARCHIVE_INSIGHTS.bibiyanaDecline.from} → ${ARCHIVE_INSIGHTS.bibiyanaDecline.to} MMCFD`}
            />
            <GridKpiTooltipGridRow label="Bibiyana wells" provenance="P" value={`${ARCHIVE_INSIGHTS.bibiyanaDecline.wells} active`} />
            <GridKpiTooltipGridRow
              label="Concentration risk" provenance="D"
              value={`${kpis.bibiyanaDomesticSharePct.toFixed(0)}% of domestic from one field`}
              valueClass={kpis.bibiyanaDomesticSharePct > 45 ? 'text-amber-500' : undefined}
              dotColor={STATUS_COLORS.warning}
            />
          </div>
          <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold mt-2">
            Fewer producing wells + falling field rates = structural depletion pressure
          </div>
          <GridKpiTooltipGasRef refLabel="Petrobangla Daily Gas Intake/Offtake Report" part="I. Production — producing-wells column" gasDay={archiveDate} sourceFile={sourceFile} />
        </GridKpiTooltipPanel>
      </div>
    </>
  );
}