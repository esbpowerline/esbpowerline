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
import type { GridSystemStats } from '@/lib/data/grid/types';

type KpiId = 'gen' | 'demand' | 'gas' | 'renew' | 'cost';

export interface OverviewKpiStripProps {
  systemStats: GridSystemStats;
  totalGasSupply: number;
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
  totalGasSupply,
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
        value={`${systemStats.totalEnergyGen.toFixed(1)} MKWh`}
        active={activeKpiTooltip === 'gen'}
        onToggle={() => toggleKpiTooltip('gen')}
        tooltipTitle="Generation Briefing"
        tooltipIcon={Zap}
        tooltipAccent="text-primary"
        width="sm"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow label="Total Energy Gen:" value={`${systemStats.totalEnergyGen.toFixed(2)} MKWh`} />
          <GridKpiTooltipRow label="Max Peak Gen:" value={`${formatNumber(Math.round(systemStats.maxGen))} MW`} />
          <GridKpiTooltipRow label="Min Base Gen:" value={`${formatNumber(Math.round(systemStats.minGen))} MW`} />
          <GridKpiTooltipRow
            label="Unserved (Load Shed):"
            value={`${systemStats.totalEnergyUnserved.toFixed(2)} MKWh`}
            valueClass="text-destructive"
          />
          <GridKpiTooltipAudit>Calculation: Demand = Gen + Load Shed</GridKpiTooltipAudit>
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
          <GridKpiTooltipRow label="Day Peak Demand:" value={`${formatNumber(Math.round(systemStats.dayPeakDemand))} MW`} />
          <GridKpiTooltipRow label="Peak Deficit Shedding:" value="496 MW at 21:00" valueClass="text-destructive" />
          <GridKpiTooltipRow label="Max System Temp:" value={`${systemStats.maxTemp.toFixed(1)} °C`} />
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
            Gas Production
            <DailyBadge />
          </>
        }
        value={`${formatNumber(totalGasSupply, 1)} MMCFD`}
        active={activeKpiTooltip === 'gas'}
        onToggle={() => toggleKpiTooltip('gas')}
        tooltipTitle="Gas Supply Briefing"
        tooltipIcon={Droplet}
        tooltipAccent="text-sky-500"
        width="lg"
      >
        <GridKpiTooltipBody>
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
          <GridKpiTooltipRow label="Solar Capacity:" value="1,511.70 MW" />
          <GridKpiTooltipRow label="Hydro Capacity:" value="230.00 MW" />
          <GridKpiTooltipRow label="Wind Capacity:" value="62.00 MW" />
          <GridKpiTooltipRow label="Biogas & Biomass:" value="1.09 MW" />
          <div className="flex justify-between border-t border-border/20 pt-1">
            <span className="text-muted-foreground">Renewable Share:</span>
            <span className="font-bold text-primary">~7.24% of Mix</span>
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
          <GridKpiTooltipRow label="Average Bulk Cost:" value={`${avgCostPerKwh.toFixed(3)} Tk/KWh`} valueClass="text-primary" />
          <GridKpiTooltipRow label="HFO Generation Cost:" value="18.06 Tk/KWh" valueClass="text-destructive" />
          <GridKpiTooltipRow label="Hydro Generation Cost:" value="0.10 Tk/KWh" valueClass="text-emerald-500" />
          <GridKpiTooltipRow label="Cross-Border Imports:" value="6.34 Tk/KWh" />
          <GridKpiTooltipAudit>Audited by: BPDB Audit Team &amp; CAG</GridKpiTooltipAudit>
          <GridKpiTooltipRef refLabel="BPC Gazettes" refHref="https://bpc.gov.bd/" dateLabel={`Date: ${systemStats.date}`} />
        </GridKpiTooltipBody>
      </GridKpiCell>
    </GridKpiStrip>
  );
});