'use client';

import { useEffect, useRef, useState } from 'react';
import { Factory, Gauge, GitBranch } from 'lucide-react';
import {
  DailyBadge,
  GridKpiCell,
  GridKpiStrip,
  GridKpiTooltipAudit,
  GridKpiTooltipBody,
  GridKpiTooltipRef,
  GridKpiTooltipRow,
} from '@/components/news/power-grid/GridExplorerUI';
import { formatNumber } from '@/lib/utils';
import { loadArchiveDay, loadArchiveIndex } from '@/lib/data/petrobangla/loadArchive';
import { getDistributionGrandTotal, resolveArchiveGasDay } from '@/lib/data/petrobangla/compute';
import type { PetrobanglaDaily } from '@/lib/data/petrobangla/types';

type KpiId = 'diversity' | 'refinery' | 'pipeline';

interface Props {
  selectedDate: string;
}

const PIPELINE_SEGMENTS: Array<{ key: string; label: string }> = [
  { key: 'AB1', label: 'Ashuganj–Bakhrabad 1 (AB1):' },
  { key: 'AB2', label: 'Ashuganj–Bakhrabad 2 (AB2):' },
  { key: 'BB', label: 'Bakhrabad–Brahmanbaria (BB):' },
  { key: 'VS3', label: 'Valve Station 3 (VS3):' },
  { key: 'AM', label: 'Ashuganj–Monohardi (AM):' },
  { key: 'BD', label: 'Bakhrabad–Demra (BD):' },
];

const PRODUCT_ROWS: Array<{ key: keyof NonNullable<NonNullable<PetrobanglaDaily['sgfl']>['products']>; label: string; unit: string }> = [
  { key: 'ngl', label: 'NGL Feed:', unit: 'BBLD' },
  { key: 'lpg', label: 'LPG:', unit: 'Kg' },
  { key: 'ms', label: 'Petrol (MS):', unit: 'BBLD' },
  { key: 'octane', label: 'Octane:', unit: 'BBLD' },
  { key: 'kerosene', label: 'Kerosene:', unit: 'BBLD' },
  { key: 'diesel', label: 'Diesel:', unit: 'BBLD' },
  { key: 'hsd', label: 'HSD:', unit: 'BBLD' },
];

/**
 * Petrobangla-daily KPI cards for the Gas & LNG Supply tab — surfaces the
 * enriched report sections (diversity-adjusted demand, RPGCL refinery output,
 * NS-RA trunkline deliveries) for the archive gas-day matching the grid date.
 */
export function PetrobanglaGasKpiStrip({ selectedDate }: Props) {
  const [day, setDay] = useState<PetrobanglaDaily | null>(null);
  const [gasDay, setGasDay] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<KpiId | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDay(null);
    setGasDay(null);
    loadArchiveIndex()
      .then((index) => {
        const { resolved } = resolveArchiveGasDay(selectedDate, index);
        if (!resolved || cancelled) return null;
        setGasDay(resolved);
        return loadArchiveDay(resolved);
      })
      .then((d) => {
        if (d && !cancelled) setDay(d);
      })
      .catch(() => {
        /* quarantined or missing day — strip simply hides */
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const toggleTooltip = (id: KpiId) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveTooltip((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        timeoutRef.current = setTimeout(() => {
          setActiveTooltip(null);
          timeoutRef.current = null;
        }, 2000);
      }
      return next;
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stripRef.current && !stripRef.current.contains(event.target as Node)) {
        setActiveTooltip(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!day || !gasDay) return null;

  const diversity = day.distribution?.diversity;
  const gt = getDistributionGrandTotal(day);
  const adjPower = diversity?.power_demand_adjusted_mmcfd ?? null;
  const adjFert = diversity?.fertilizer_demand_adjusted_mmcfd ?? null;
  const powerGap = adjPower != null ? adjPower - gt.power_supply_mmcfd : null;
  const powerCoverage =
    adjPower != null && adjPower > 0 ? (gt.power_supply_mmcfd / adjPower) * 100 : null;

  const products = day.sgfl?.products;
  const hasProducts =
    products != null && PRODUCT_ROWS.some((r) => typeof products[r.key] === 'number');

  const metrics = day.sgfl?.pipeline_metrics;
  const segmentRows = PIPELINE_SEGMENTS.filter((s) => typeof metrics?.[s.key] === 'number');
  const pipelineTotal =
    day.sgfl?.pipeline_total ??
    (segmentRows.length
      ? segmentRows.reduce((sum, s) => sum + (metrics?.[s.key] ?? 0), 0)
      : null);

  const hasDiversity = powerGap != null;
  const hasPipeline = pipelineTotal != null && segmentRows.length > 0;
  if (!hasDiversity && !hasProducts && !hasPipeline) return null;

  const dateLabel = `Gas-day: ${gasDay}`;

  return (
    <GridKpiStrip stripRef={stripRef}>
      {hasDiversity && (
        <GridKpiCell
          icon={Gauge}
          iconClassName="text-amber-500"
          label={
            <>
              True Power-Gas Gap
              <DailyBadge />
            </>
          }
          value={`${formatNumber(Math.max(0, powerGap ?? 0), 1)} MMCFD`}
          active={activeTooltip === 'diversity'}
          onToggle={() => toggleTooltip('diversity')}
          tooltipTitle="Diversity-Adjusted Demand"
          tooltipIcon={Gauge}
          tooltipAccent="text-amber-500"
          width="lg"
        >
          <GridKpiTooltipBody>
            <GridKpiTooltipRow label="Raw plant demand:" value={`${formatNumber(gt.power_demand_mmcfd, 1)} MMCFD`} />
            <GridKpiTooltipRow label="Diversity factor:" value={`× ${diversity?.factor ?? '—'}`} />
            <GridKpiTooltipRow label="Realistic demand:" value={`${formatNumber(adjPower ?? 0, 1)} MMCFD`} />
            <GridKpiTooltipRow label="Actual supply:" value={`${formatNumber(gt.power_supply_mmcfd, 1)} MMCFD`} />
            {powerCoverage != null && (
              <GridKpiTooltipRow
                label="Coverage:"
                value={`${powerCoverage.toFixed(1)}%`}
                valueClass={powerCoverage < 60 ? 'text-destructive' : 'text-emerald-500'}
              />
            )}
            {adjFert != null && (
              <GridKpiTooltipRow
                label="Fertilizer (adj / supplied):"
                value={`${formatNumber(adjFert, 0)} / ${formatNumber(gt.fertilizer_supply_mmcfd, 1)} MMCFD`}
              />
            )}
            <GridKpiTooltipAudit>
              Petrobangla&apos;s own diversity factor discounts simultaneous peak demand
            </GridKpiTooltipAudit>
            <GridKpiTooltipRef
              refLabel="Petrobangla Daily Report"
              refHref="https://www.petrobangla.org.bd/"
              dateLabel={dateLabel}
            />
          </GridKpiTooltipBody>
        </GridKpiCell>
      )}

      {hasProducts && (
        <GridKpiCell
          icon={Factory}
          iconClassName="text-emerald-500"
          label={
            <>
              Refinery Output
              <DailyBadge />
            </>
          }
          value={
            typeof products?.ms === 'number'
              ? `${formatNumber(products.ms, 0)} BBLD MS`
              : `${formatNumber(products?.lpg ?? 0, 1)} Kg LPG`
          }
          active={activeTooltip === 'refinery'}
          onToggle={() => toggleTooltip('refinery')}
          tooltipTitle="RPGCL Fractionation Output"
          tooltipIcon={Factory}
          tooltipAccent="text-emerald-500"
          width="lg"
        >
          <GridKpiTooltipBody>
            {PRODUCT_ROWS.map((r) =>
              typeof products?.[r.key] === 'number' ? (
                <GridKpiTooltipRow
                  key={r.key}
                  label={r.label}
                  value={`${formatNumber(products[r.key] as number, r.key === 'lpg' ? 2 : 1)} ${r.unit}`}
                />
              ) : null,
            )}
            <GridKpiTooltipAudit>
              Condensate &amp; NGL fractionated into liquid fuels at RPGCL/SGFL plants
            </GridKpiTooltipAudit>
            <GridKpiTooltipRef
              refLabel="Petrobangla Daily Report"
              refHref="https://www.petrobangla.org.bd/"
              dateLabel={dateLabel}
            />
          </GridKpiTooltipBody>
        </GridKpiCell>
      )}

      {hasPipeline && (
        <GridKpiCell
          icon={GitBranch}
          iconClassName="text-sky-500"
          label={
            <>
              N-S Trunkline Flow
              <DailyBadge />
            </>
          }
          value={`${formatNumber(pipelineTotal ?? 0, 1)} MMCFD`}
          active={activeTooltip === 'pipeline'}
          align="right"
          onToggle={() => toggleTooltip('pipeline')}
          tooltipTitle="North-South Pipeline Deliveries"
          tooltipIcon={GitBranch}
          tooltipAccent="text-sky-500"
          width="lg"
        >
          <GridKpiTooltipBody>
            {segmentRows.map((s) => (
              <GridKpiTooltipRow
                key={s.key}
                label={s.label}
                value={`${formatNumber(metrics?.[s.key] ?? 0, 1)} MMCFD`}
              />
            ))}
            <GridKpiTooltipAudit>
              GTCL trunkline segment deliveries from the NS-RA metering section
            </GridKpiTooltipAudit>
            <GridKpiTooltipRef
              refLabel="Petrobangla Daily Report"
              refHref="https://www.petrobangla.org.bd/"
              dateLabel={dateLabel}
            />
          </GridKpiTooltipBody>
        </GridKpiCell>
      )}
    </GridKpiStrip>
  );
}
