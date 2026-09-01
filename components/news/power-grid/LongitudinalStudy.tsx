'use client';

import React, { useMemo } from 'react';
import { longitudinalStudyData } from '@/lib/data/macro/longitudinal-study';
import { formatChartTooltipValue } from '@/components/news/PowerGridChartUI';
import { formatNumber } from '@/lib/utils';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import {
  VoltageEvolutionCard,
  CumulativeBuildoutCard,
  ExpansionPaceCard,
  IndexedTrajectoriesCard,
} from '@/components/news/power-grid/LongitudinalStudyCards';

/**
 * Which series on these four charts is somebody else's figure and which is ours.
 *
 * Everything keyed here is arithmetic performed in this file or in the study
 * dataset — an index against a base year, or a year-on-year difference. None of
 * it appears in any PGCB, BPDB or Ministry of Finance publication as printed.
 */
const DERIVED_KEYS: Record<string, 'D'> = {
  Budget_Index: 'D',
  Generation_Index: 'D',
  Demand_Index: 'D',
  Transmission_Index: 'D',
  Generation_Added_MW: 'D',
  Transmission_Added_ckm: 'D',
};

/**
 * The three voltage series, which are P in some years and D in others.
 *
 * PGCB prints the 400/230/132 kV split for six of the fifteen fiscal years in
 * this study. For the other nine only the network total is published, and the
 * split drawn here is that total apportioned on the last known mix. So the mark
 * cannot be set once for the series: it is set per point, from the year the
 * reader is actually hovering, and the legend leaves it unstated rather than
 * claiming one letter for both cases.
 */
const VOLTAGE_KEYS = new Set([
  'Transmission_400kV_ckm',
  'Transmission_230kV_ckm',
  'Transmission_132kV_ckm',
]);

export function LongitudinalStudyCharts({ chartTheme, isTruncated = false, allowedYears = null }: { chartTheme: any; isTruncated?: boolean; allowedYears?: number | null }) {
  const data = longitudinalStudyData;

  // Base year (FY2011) parameters for indexing
  const baseYearData = data[0];
  const baseBudget = baseYearData.Power_Division_Budget_TkCr || 4914;
  const baseTransmission = baseYearData.Total_Transmission_ckm || 8396;
  const baseGeneration = baseYearData.Installed_Generation_MW || 7296;
  const baseDemand = baseYearData.Peak_Demand_MW || 4890;

  const processedData = useMemo(() => {
    const BASE_MIX = { v400: 0.022, v230: 0.326, v132: 0.652 };
    let lastMix: { v400: number; v230: number; v132: number } | null = null;

    return data.map((d: any, i: number) => {
      const prev = i > 0 ? data[i - 1] : null;
      const genAdded = prev && d.Installed_Generation_MW && prev.Installed_Generation_MW
        ? Math.max(0, d.Installed_Generation_MW - prev.Installed_Generation_MW)
        : 0;

      const hasVoltage =
        d.Transmission_400kV_ckm != null &&
        d.Transmission_230kV_ckm != null &&
        d.Transmission_132kV_ckm != null;

      let v400 = d.Transmission_400kV_ckm;
      let v230 = d.Transmission_230kV_ckm;
      let v132 = d.Transmission_132kV_ckm;

      if (hasVoltage) {
        lastMix = { v400: v400!, v230: v230!, v132: v132! };
      } else if (d.Total_Transmission_ckm && lastMix) {
        const lastTotal = lastMix.v400 + lastMix.v230 + lastMix.v132;
        const scale = lastTotal > 0 ? d.Total_Transmission_ckm / lastTotal : 1;
        v400 = lastMix.v400 * scale;
        v230 = lastMix.v230 * scale;
        v132 = lastMix.v132 * scale;
      } else if (d.Total_Transmission_ckm) {
        v400 = d.Total_Transmission_ckm * BASE_MIX.v400;
        v230 = d.Total_Transmission_ckm * BASE_MIX.v230;
        v132 = d.Total_Transmission_ckm * BASE_MIX.v132;
      }

      return {
        ...d,
        Transmission_400kV_ckm: v400,
        Transmission_230kV_ckm: v230,
        Transmission_132kV_ckm: v132,
        // Carried on the row so the hover readout can mark this year's voltage
        // figures for what they are, rather than the series being labelled once
        // for fifteen years that are not all the same kind of number.
        Voltage_Split_Published: hasVoltage,
        Generation_Added_MW: genAdded,
        Budget_Index: d.Power_Division_Budget_TkCr ? (d.Power_Division_Budget_TkCr / baseBudget) * 100 : null,
        Transmission_Index: d.Total_Transmission_ckm ? (d.Total_Transmission_ckm / baseTransmission) * 100 : null,
        Generation_Index: d.Installed_Generation_MW ? (d.Installed_Generation_MW / baseGeneration) * 100 : null,
        Demand_Index: d.Peak_Demand_MW ? (d.Peak_Demand_MW / baseDemand) * 100 : null,
      };
    });
  }, [data, baseBudget, baseTransmission, baseGeneration, baseDemand]);

  const sliceForLine = isTruncated ? Math.max(allowedYears ?? 2, 3) : processedData.length;
  const sliceForBar = isTruncated ? (allowedYears ?? 2) : processedData.length;

  const displayData3Years = processedData.slice(-sliceForLine);
  const displayData2Years = processedData.slice(-sliceForBar);

  const formatSeriesTooltipValue = (entry: { name?: string; value?: number | null }) => {
    const name = entry.name ?? '';
    const value = entry.value;
    if (name.includes('Index') || name.endsWith('(%)')) {
      return formatChartTooltipValue(value, { unit: '%', decimals: 1 });
    }
    if (name.includes('MW') || name.includes('Gen Cap')) {
      return formatChartTooltipValue(value, { unit: 'MW', decimals: 0 });
    }
    if (name.includes('ckm') || name.includes('Corridor') || name.includes('Ultra')) {
      return formatChartTooltipValue(value, { unit: 'ckm', decimals: 0 });
    }
    return formatChartTooltipValue(value, { decimals: 1 });
  };

  /** The P/D mark for one hovered row, or none where the answer is not clean. */
  const provenanceOf = (entry: any): 'P' | 'D' | null => {
    const key = String(entry?.dataKey ?? '');
    if (VOLTAGE_KEYS.has(key)) return entry?.payload?.Voltage_Split_Published ? 'P' : 'D';
    return DERIVED_KEYS[key] ?? null;
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
    title,
    unit,
    calculation,
    source,
  }: any) => {
    if (active && payload && payload.length) {
      return (
        /* Sized and set like the hand-drawn canvases' scrub readouts rather
           than like a dialog: same 0.7rem radius, same 11px body, same padding.
           At p-5/rounded-2xl/text-sm it was visibly a different component from
           the readout a reader had just been hovering two cards above. */
        <div className="p-3 text-card-foreground border border-border/80 rounded-xl shadow-xl text-[11px] leading-relaxed w-64 md:w-72 max-w-[calc(100vw-2rem)] select-none bg-card">
          <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2.5 flex items-center justify-between gap-2">
            <span className="tabular-nums">{label || 'Data Point'}</span>
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{title}</span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const kind = provenanceOf(entry);
              return (
                <div key={`item-${index}`} className="flex justify-between items-center gap-3">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1.5 min-w-0">
                    {kind ? <GridProvenanceTag kind={kind} /> : null}
                    <span className="truncate">{entry.name}</span>
                  </span>
                  <span className="font-bold tabular-nums shrink-0" style={{ color: entry.color }}>
                    {unit
                      ? `${entry.value != null ? formatNumber(Number(entry.value), unit === 'ckm' || unit === 'MW' ? 0 : 1) : 'N/A'} ${unit}`
                      : formatSeriesTooltipValue(entry)}
                  </span>
                </div>
              );
            })}
          </div>
          {calculation && (
            <div className="mt-2.5 pt-2 border-t border-border/30 text-[10px] text-muted-foreground leading-normal italic font-medium">
              {calculation}
            </div>
          )}
          {source && (
            <div className="mt-2 pt-1.5 border-t border-border/20 text-[9px] text-muted-foreground flex flex-col gap-0.5">
              {/*
                An `auditor` prop used to sit here, filled with CAG, IMED and
                PGCB committees on figures no audit report in this codebase
                covers. Removed rather than re-labelled: naming who published a
                figure is a claim we can support, naming who audited it is not.
              */}
              <div><strong>Source:</strong> {source}</div>
              <div>As published. Not independently audited.</div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  /* The card markup lives in LongitudinalStudyCards.tsx — extracted when the
     screen-reader data tables pushed this file past its size budget. Only the
     tooltip elements are built here, so the P/D provenance decision stays next
     to the code that computes the derived series it describes. */
  return (
    <div className="space-y-8">
      <VoltageEvolutionCard
        chartTheme={chartTheme}
        rows={displayData3Years}
        tooltip={
          <CustomTooltip
            title="Voltage Evolution"
            unit="ckm"
            source={<a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB System Statistics Division</a>}
          />
        }
      />
      <CumulativeBuildoutCard
        chartTheme={chartTheme}
        rows={displayData3Years}
        tooltip={
          <CustomTooltip
            title="Cumulative Capacity"
            unit="ckm"
            calculation="Stack: 132kV + 230kV + 400kV total circuit kilometers"
            source={<a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB System Planning Maps</a>}
          />
        }
      />
      <ExpansionPaceCard
        chartTheme={chartTheme}
        rows={displayData2Years}
        tooltip={
          <CustomTooltip
            title="Annual Physical Additions"
            calculation="Transmission Added = Total ckm (Current Year) - Total ckm (Previous Year) | Gen Capacity Added = Installed MW (Current) - Installed MW (Previous)"
            source={<a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB &amp; BPDB Progress Reports</a>}
          />
        }
      />
      <IndexedTrajectoriesCard
        chartTheme={chartTheme}
        rows={displayData2Years}
        tooltip={
          <CustomTooltip
            title="Growth Index (FY11=100)"
            unit="%"
            calculation="Index = (Current Value / FY2011 Value) * 100"
            source="Ministry of Finance Budget Briefs & PGCB / BPDB Reports"
          />
        }
      />
    </div>
  );
}
