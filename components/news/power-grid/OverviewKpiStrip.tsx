'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Activity, Droplet, Sun, Zap } from 'lucide-react';
import { TakaIcon } from '@/components/news/power-grid/shared';
import {
  DailyBadge,
  GridDataBadge,
  GridKpiCell,
  GridKpiStrip,
  GridKpiTooltipAudit,
  GridKpiTooltipBody,
  GridKpiTooltipRef,
  GridKpiTooltipRow,
} from '@/components/news/power-grid/GridExplorerUI';
import { formatNumber } from '@/lib/utils';
import { sredaRenewablesData, renewableGridSharePct } from '@/lib/data/companies/sreda';
import type { GridDailyData, GridSystemStats } from '@/lib/data/grid/types';

type KpiId = 'gen' | 'demand' | 'gas' | 'renew' | 'cost';

/** MW with fixed 2-decimal en-IN grouping (e.g. 1,512.75) */
const fmtMw = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const renewableCapacity = (tech: string) =>
  sredaRenewablesData.find((r) => r.tech === tech)?.capacity ?? 0;

// SREDA registry is static module data; derive the breakdown so it reconciles with the headline total.
const SOLAR_CAPACITY = renewableCapacity('Solar PV');
const HYDRO_CAPACITY = renewableCapacity('Hydroelectric');
const WIND_CAPACITY = renewableCapacity('Wind Energy');
const BIO_CAPACITY = renewableCapacity('Biogas Power') + renewableCapacity('Biomass Energy');

export interface OverviewKpiStripProps {
  systemStats: GridSystemStats;
  generationData: GridDailyData['generationData'];
  totalGasSupply: number;
  /** False when the day's Petrobangla tables are absent, so 0 means "no report" not "no gas". */
  hasGasProductionData: boolean;
  importedLngGas: number;
  importedLngPct: number;
  chevronGas: number;
  chevronPct: number;
  tullowGas: number;
  tullowPct: number;
  stateFieldsGas: number;
  stateFieldsPct: number;
  totalCondensate: number;
  tooltipDate: string;
  avgCostPerKwh: number;
  totalCapacityRenewables: number;
}

export const OverviewKpiStrip = memo(function OverviewKpiStrip({
  systemStats,
  generationData,
  totalGasSupply,
  hasGasProductionData,
  importedLngGas,
  importedLngPct,
  chevronGas,
  chevronPct,
  tullowGas,
  tullowPct,
  stateFieldsGas,
  stateFieldsPct,
  totalCondensate,
  tooltipDate,
  avgCostPerKwh,
  totalCapacityRenewables,
}: OverviewKpiStripProps) {
  const [activeKpiTooltip, setActiveKpiTooltip] = useState<KpiId | null>(null);
  const kpiStripRef = useRef<HTMLDivElement>(null);
  const kpiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleKpiTooltip = (id: KpiId) => {
    if (kpiTimeoutRef.current) {
      clearTimeout(kpiTimeoutRef.current);
      kpiTimeoutRef.current = null;
    }
    setActiveKpiTooltip((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        kpiTimeoutRef.current = setTimeout(() => {
          setActiveKpiTooltip(null);
          kpiTimeoutRef.current = null;
        }, 2000);
      }
      return next;
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (kpiStripRef.current && !kpiStripRef.current.contains(event.target as Node)) {
        setActiveKpiTooltip(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Average power over the 24h day: 1 MKWh/day = 1000 MWh / 24h = 41.67 MW
  const mkwhToAvgMw = (mkwh: number) => (mkwh * 1000) / 24;
  // Fuel costs come from the source report or not at all, so a missing one is
  // rendered as an em dash rather than collapsing to zero.
  const hasPublishedFuelCost = generationData.some((g) => g.cost != null);
  const fuelUnitRate = (name: string) => {
    const rate = generationData.find((g) => g.name === name)?.unitCost;
    return rate == null ? '—' : `${rate.toFixed(2)} Tk/KWh`;
  };

  const dailyGenAvgMw = mkwhToAvgMw(systemStats.totalEnergyGen);
  const unservedAvgMw =
    systemStats.totalEnergyUnserved == null ? null : mkwhToAvgMw(systemStats.totalEnergyUnserved);

  return (
    <GridKpiStrip stripRef={kpiStripRef}>
      <GridKpiCell
        icon={Zap}
        label={
          <>
            Daily Generation
            <DailyBadge />
          </>
        }
        value={`${formatNumber(Math.round(dailyGenAvgMw))} MW`}
        active={activeKpiTooltip === 'gen'}
        onToggle={() => toggleKpiTooltip('gen')}
        tooltipTitle="Generation Briefing"
        tooltipIcon={Zap}
        tooltipAccent="text-primary"
        width="sm"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow label="Total Energy Gen:" value={`${systemStats.totalEnergyGen.toFixed(2)} MKWh`} />
          <GridKpiTooltipRow
            label="Max Peak Gen:"
            value={systemStats.maxGen == null ? '—' : `${formatNumber(Math.round(systemStats.maxGen))} MW`}
          />
          <GridKpiTooltipRow
            label="Min Base Gen:"
            value={systemStats.minGen == null ? '—' : `${formatNumber(Math.round(systemStats.minGen))} MW`}
          />
          <GridKpiTooltipRow
            label="Unserved (Load Shed):"
            value={
              systemStats.totalEnergyUnserved == null || unservedAvgMw == null
                ? '—'
                : `${systemStats.totalEnergyUnserved.toFixed(2)} MKWh · ${formatNumber(Math.round(unservedAvgMw))} MW`
            }
            valueClass="text-destructive"
          />
          <GridKpiTooltipAudit>Figures as published by PGCB</GridKpiTooltipAudit>
          <GridKpiTooltipRef
            refLabel="PGCB Daily Log"
            refHref="https://www.pgcb.gov.bd/"
            dateLabel={`Date: ${systemStats.date}`}
          />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Activity}
        iconClassName="text-amber-500"
        label={
          <>
            Peak Demand
            <DailyBadge />
          </>
        }
        value={`${formatNumber(Math.round(systemStats.eveningPeakDemand))} MW`}
        active={activeKpiTooltip === 'demand'}
        align="right"
        onToggle={() => toggleKpiTooltip('demand')}
        tooltipTitle="Demand Briefing"
        tooltipIcon={Activity}
        tooltipAccent="text-amber-500"
        widthClass="w-72 md:w-[19rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            label="Evening Peak Demand:"
            value={`${formatNumber(Math.round(systemStats.eveningPeakDemand))} MW`}
          />
          <GridKpiTooltipRow
            label="Day Peak Demand:"
            value={
              systemStats.dayPeakDemand == null
                ? '—'
                : `${formatNumber(Math.round(systemStats.dayPeakDemand))} MW`
            }
          />
          <GridKpiTooltipRow label="Peak Deficit Shedding:" value={`${formatNumber(Math.max(0, Math.round(systemStats.eveningPeakDemand - systemStats.eveningPeakGen)))} MW`} valueClass="text-destructive" />
          <GridKpiTooltipRow
            label="Max System Temp:"
            value={systemStats.maxTemp == null ? '—' : `${systemStats.maxTemp.toFixed(1)} °C`}
          />
          <GridKpiTooltipAudit>Audited by: NLDC System Operations</GridKpiTooltipAudit>
          <GridKpiTooltipRef
            refLabel="PGCB/NLDC SCADA"
            refHref="https://www.pgcb.gov.bd/"
            dateLabel={`Date: ${systemStats.date}`}
          />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Droplet}
        iconClassName="text-sky-500"
        label={
          <>
            Gas Supply
            <DailyBadge />
          </>
        }
        value={hasGasProductionData ? `${formatNumber(totalGasSupply, 1)} MMCFD` : '— MMCFD'}
        active={activeKpiTooltip === 'gas'}
        onToggle={() => toggleKpiTooltip('gas')}
        tooltipTitle="Gas Supply Briefing"
        tooltipIcon={Droplet}
        tooltipAccent="text-sky-500"
        width="lg"
      >
        <GridKpiTooltipBody>
          {hasGasProductionData ? (
            <>
              <GridKpiTooltipRow label="Total Gas Supply:" value={`${formatNumber(totalGasSupply, 1)} MMCFD`} />
              <GridKpiTooltipRow
                label="Imported LNG:"
                value={`${formatNumber(importedLngGas, 1)} MMCFD (${importedLngPct.toFixed(1)}%)`}
              />
              <GridKpiTooltipRow
                label="Chevron IOC Supply:"
                value={`${formatNumber(chevronGas, 1)} MMCFD (${chevronPct.toFixed(1)}%)`}
              />
              {tullowGas > 0 && (
                <GridKpiTooltipRow
                  label="Tullow IOC Supply:"
                  value={`${formatNumber(tullowGas, 1)} MMCFD (${tullowPct.toFixed(1)}%)`}
                />
              )}
              <GridKpiTooltipRow
                label="State Field Output:"
                value={`${formatNumber(stateFieldsGas, 1)} MMCFD (${stateFieldsPct.toFixed(1)}%)`}
              />
              <GridKpiTooltipRow label="Total Condensate:" value={`${formatNumber(totalCondensate, 1)} BBL`} />
              <GridKpiTooltipAudit>Audited by: MABS &amp; J Partners / CAG</GridKpiTooltipAudit>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Petrobangla has not published the production and distribution tables for this
              gas day yet. PGCB grid figures above are unaffected.
            </p>
          )}
          <GridKpiTooltipRef
            refLabel="Petrobangla Report"
            refHref="https://www.petrobangla.org.bd/"
            dateLabel={`Date: ${tooltipDate}`}
          />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Sun}
        iconClassName="text-yellow-500"
        label={
          <>
            Renewables Online
            <GridDataBadge cadence="monthly" />
          </>
        }
        value={`${totalCapacityRenewables.toFixed(1)} MW`}
        active={activeKpiTooltip === 'renew'}
        align="right"
        onToggle={() => toggleKpiTooltip('renew')}
        tooltipTitle="Clean Energy Briefing"
        tooltipIcon={Sun}
        tooltipAccent="text-yellow-500"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow label="Solar Capacity:" value={`${fmtMw(SOLAR_CAPACITY)} MW`} />
          <GridKpiTooltipRow label="Hydro Capacity:" value={`${fmtMw(HYDRO_CAPACITY)} MW`} />
          <GridKpiTooltipRow label="Wind Capacity:" value={`${fmtMw(WIND_CAPACITY)} MW`} />
          <GridKpiTooltipRow label="Biogas & Biomass:" value={`${fmtMw(BIO_CAPACITY)} MW`} />
          <div className="flex justify-between border-t border-border/20 pt-1">
            <span className="text-muted-foreground">Renewable Share:</span>
            <span className="font-bold text-primary">~{renewableGridSharePct.toFixed(1)}% of Installed</span>
          </div>
          <GridKpiTooltipAudit>Audited by: SREDA Policy Division</GridKpiTooltipAudit>
          <GridKpiTooltipRef
            refLabel="SREDA Database"
            refHref="http://www.renewableenergy.gov.bd/"
            dateLabel="Date: Jun 2026"
          />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={TakaIcon}
        iconClassName="text-emerald-500"
        label={
          <>
            Est. Fuel Cost
            <DailyBadge />
          </>
        }
        value={`${(systemStats.totalDailyCost / 10000000).toFixed(1)} Cr Tk.`}
        active={activeKpiTooltip === 'cost'}
        onToggle={() => toggleKpiTooltip('cost')}
        tooltipTitle="Fuel & Import Bills"
        tooltipIcon={TakaIcon}
        tooltipAccent="text-emerald-500"
        widthClass="w-[18.5rem] md:w-[21rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            label="Total Daily Cost:"
            value={`${(systemStats.totalDailyCost / 10000000).toFixed(2)} Crore BDT`}
          />
          {/* A day whose report carries no production-cost block has no unit
              rate to show. "0.00 Tk/KWh" would read as free electricity. */}
          <GridKpiTooltipRow
            label="Average Bulk Cost:"
            value={hasPublishedFuelCost ? `${avgCostPerKwh.toFixed(3)} Tk/KWh` : '—'}
            valueClass="text-primary"
          />
          <GridKpiTooltipRow label="HFO Generation Cost:" value={fuelUnitRate('HFO')} valueClass="text-destructive" />
          <GridKpiTooltipRow label="Hydro Generation Cost:" value={fuelUnitRate('Hydro')} valueClass="text-emerald-500" />
          <GridKpiTooltipRow label="Cross-Border Imports:" value={fuelUnitRate('Imports')} />
          <GridKpiTooltipAudit>Audited by: BPDB Audit Team &amp; CAG</GridKpiTooltipAudit>
          <GridKpiTooltipRef refLabel="BPC Gazettes" refHref="https://bpc.gov.bd/" dateLabel={`Date: ${systemStats.date}`} />
        </GridKpiTooltipBody>
      </GridKpiCell>
    </GridKpiStrip>
  );
});