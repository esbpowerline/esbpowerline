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

  // Null where P1 leaves the total-generation cell empty. Averaging a null to
  // zero would print "0 MW" for a day that plainly generated.
  const dailyGenAvgMw =
    systemStats.totalEnergyGen == null ? null : mkwhToAvgMw(systemStats.totalEnergyGen);
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
        value={dailyGenAvgMw == null ? '— MW' : `${formatNumber(Math.round(dailyGenAvgMw))} MW`}
        active={activeKpiTooltip === 'gen'}
        // PGCB publishes the day's energy in MKWh; the MW on the face of this
        // tile is that energy averaged across 24 hours, which is ours.
        provenance="D"
        onToggle={() => toggleKpiTooltip('gen')}
        tooltipTitle="Generation Briefing"
        tooltipIcon={Zap}
        tooltipAccent="text-primary"
        width="sm"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="P"
            label="Total Energy Gen:"
            value={systemStats.totalEnergyGen == null ? 'not published for this day' : `${systemStats.totalEnergyGen.toFixed(2)} MKWh`}
          />
          <GridKpiTooltipRow
            provenance="P"
            label="Max Peak Gen:"
            value={systemStats.maxGen == null ? '—' : `${formatNumber(Math.round(systemStats.maxGen))} MW`}
          />
          <GridKpiTooltipRow
            provenance="P"
            label="Min Base Gen:"
            value={systemStats.minGen == null ? '—' : `${formatNumber(Math.round(systemStats.minGen))} MW`}
          />
          <GridKpiTooltipRow
            provenance="P"
            label="Unserved (Load Shed):"
            value={
              systemStats.totalEnergyUnserved == null || unservedAvgMw == null
                ? '—'
                : `${systemStats.totalEnergyUnserved.toFixed(2)} MKWh · ${formatNumber(Math.round(unservedAvgMw))} MW`
            }
            valueClass="text-destructive"
          />
          <GridKpiTooltipAudit>As published by PGCB. Not audited.</GridKpiTooltipAudit>
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
        provenance="P"
        onToggle={() => toggleKpiTooltip('demand')}
        tooltipTitle="Demand Briefing"
        tooltipIcon={Activity}
        tooltipAccent="text-amber-500"
        widthClass="w-72 md:w-[19rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="P"
            label="Evening Peak Demand:"
            value={`${formatNumber(Math.round(systemStats.eveningPeakDemand))} MW`}
          />
          <GridKpiTooltipRow
            provenance="P"
            label="Day Peak Demand:"
            value={
              systemStats.dayPeakDemand == null
                ? '—'
                : `${formatNumber(Math.round(systemStats.dayPeakDemand))} MW`
            }
          />
          <GridKpiTooltipRow provenance="D" label="Peak Deficit Shedding:" value={`${formatNumber(Math.max(0, Math.round(systemStats.eveningPeakDemand - systemStats.eveningPeakGen)))} MW`} valueClass="text-destructive" />
          <GridKpiTooltipRow
            provenance="P"
            label="Max System Temp:"
            value={systemStats.maxTemp == null ? '—' : `${systemStats.maxTemp.toFixed(1)} °C`}
          />
          <GridKpiTooltipAudit>As published by PGCB. Not audited.</GridKpiTooltipAudit>
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
        // Petrobangla publishes a row per company; the national total is our sum
        // of them, so the headline is ours even though every input is theirs.
        provenance="D"
        onToggle={() => toggleKpiTooltip('gas')}
        tooltipTitle="Gas Supply Briefing"
        tooltipIcon={Droplet}
        tooltipAccent="text-sky-500"
        width="lg"
      >
        <GridKpiTooltipBody>
          {hasGasProductionData ? (
            <>
              <GridKpiTooltipRow provenance="D" label="Total Gas Supply:" value={`${formatNumber(totalGasSupply, 1)} MMCFD`} />
              <GridKpiTooltipRow
                provenance="P"
                label="Imported LNG:"
                value={`${formatNumber(importedLngGas, 1)} MMCFD (${importedLngPct.toFixed(1)}%)`}
              />
              <GridKpiTooltipRow
                provenance="P"
                label="Chevron IOC Supply:"
                value={`${formatNumber(chevronGas, 1)} MMCFD (${chevronPct.toFixed(1)}%)`}
              />
              {tullowGas > 0 && (
                <GridKpiTooltipRow
                  provenance="P"
                  label="Tullow IOC Supply:"
                  value={`${formatNumber(tullowGas, 1)} MMCFD (${tullowPct.toFixed(1)}%)`}
                />
              )}
              {/* BGFCL + SGFL + BAPEX added together — Petrobangla lists them
                  separately and states no "state fields" line. */}
              <GridKpiTooltipRow
                provenance="D"
                label="State Field Output:"
                value={`${formatNumber(stateFieldsGas, 1)} MMCFD (${stateFieldsPct.toFixed(1)}%)`}
              />
              <GridKpiTooltipRow provenance="D" label="Total Condensate:" value={`${formatNumber(totalCondensate, 1)} BBL`} />
              <GridKpiTooltipAudit>As published by Petrobangla. Not audited.</GridKpiTooltipAudit>
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
        provenance="P"
        onToggle={() => toggleKpiTooltip('renew')}
        tooltipTitle="Clean Energy Briefing"
        tooltipIcon={Sun}
        tooltipAccent="text-yellow-500"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow provenance="P" label="Solar Capacity:" value={`${fmtMw(SOLAR_CAPACITY)} MW`} />
          <GridKpiTooltipRow provenance="P" label="Hydro Capacity:" value={`${fmtMw(HYDRO_CAPACITY)} MW`} />
          <GridKpiTooltipRow provenance="P" label="Wind Capacity:" value={`${fmtMw(WIND_CAPACITY)} MW`} />
          {/* Biogas and Biomass are two SREDA lines added together. */}
          <GridKpiTooltipRow provenance="D" label="Biogas & Biomass:" value={`${fmtMw(BIO_CAPACITY)} MW`} />
          <GridKpiTooltipRow provenance="D" label="Renewable Share:" value={`~${renewableGridSharePct.toFixed(1)}% of Installed`} valueClass="text-primary" />
          {/* The registry does not move with the date picker, so the tooltip
              says so once rather than letting a daily-looking tile imply it. */}
          <GridKpiTooltipAudit>As listed by SREDA — a standing registry, not a daily reading. Not audited.</GridKpiTooltipAudit>
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
        provenance="P"
        onToggle={() => toggleKpiTooltip('cost')}
        tooltipTitle="Fuel & Import Bills"
        tooltipIcon={TakaIcon}
        tooltipAccent="text-emerald-500"
        widthClass="w-[18.5rem] md:w-[21rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="P"
            label="Total Daily Cost:"
            value={`${(systemStats.totalDailyCost / 10000000).toFixed(2)} Crore BDT`}
          />
          {/* A day whose report carries no production-cost block has no unit
              rate to show. "0.00 Tk/KWh" would read as free electricity. */}
          <GridKpiTooltipRow
            provenance="D"
            label="Average Bulk Cost:"
            value={hasPublishedFuelCost ? `${avgCostPerKwh.toFixed(3)} Tk/KWh` : '—'}
            valueClass="text-primary"
          />
          <GridKpiTooltipRow provenance="D" label="HFO Generation Cost:" value={fuelUnitRate('HFO')} valueClass="text-destructive" />
          <GridKpiTooltipRow provenance="D" label="Hydro Generation Cost:" value={fuelUnitRate('Hydro')} valueClass="text-emerald-500" />
          <GridKpiTooltipRow provenance="D" label="Cross-Border Imports:" value={fuelUnitRate('Imports')} />
          <GridKpiTooltipAudit>As published by PGCB, restating BPDB fuel economics. Not audited.</GridKpiTooltipAudit>
          <GridKpiTooltipRef refLabel="PGCB Daily Report (P1)" refHref="https://www.pgcb.gov.bd/" dateLabel={`Date: ${systemStats.date}`} />
        </GridKpiTooltipBody>
      </GridKpiCell>
    </GridKpiStrip>
  );
});