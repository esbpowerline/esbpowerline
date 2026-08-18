'use client';

import { useEffect, useMemo, useState } from 'react';
import { Layers, Table2, LineChart } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import {
  GridCardFooter,
  GridExplanationBlock,
  GridProvenanceTag,
  GridSourceFiles,
} from '@/components/news/power-grid/GridExplorerUI';
import { GridChartExternalLegend } from '@/components/news/PowerGridChartUI';
import { buildEnergyCurveSeries, energyCurveShortage } from '@/lib/data/grid/energy-curve';
import { GenerationMixCanvas, MERIT_ORDER } from '@/components/news/power-grid/GenerationMixCanvas';
import { fetchEnergyCurve } from '@/lib/data/grid/energy-curve.client';
import type { ChartTheme } from '@/hooks/useChartTheme';
import type { EnergyCurve } from '@/lib/data/grid/types';

/**
 * Half-hourly generation by fuel, from the PGCB workbook's En-Curve sheet.
 *
 * The daily fuel mix elsewhere on this page is one number per fuel for the
 * whole day. This is the same split every half hour, so the shape of the day is
 * readable rather than its total: coal flat through the night, solar arriving
 * around six and gone by six, oil-fired plant called up for the evening peak.
 *
 * The sheet's own columns separate public from private plant and name each
 * import; those are folded into the eight fuels the rest of the page uses so
 * that a colour means the same thing everywhere, and the split is kept in the
 * tooltip. See `lib/data/grid/energy-curve.ts`.
 */
export function EnergyCurveChart({
  isoDate,
  reportDate,
  chartTheme,
  ready = true,
  sourceFile,
}: {
  isoDate: string;
  reportDate: string;
  chartTheme: ChartTheme;
  ready?: boolean;
  /** The workbook whose En-Curve sheet produced this stack. */
  sourceFile?: string | null;
}) {
  const [showTable, setShowTable] = useState(false);
  const [curve, setCurve] = useState<EnergyCurve | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetchEnergyCurve(isoDate).then((c) => {
      if (!live) return;
      setCurve(c);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [isoDate]);

  const series = useMemo(() => buildEnergyCurveSeries(curve ?? undefined), [curve]);
  // Shedding at the same half-hourly resolution, from the same sheet. Drawn
  // above the stack rather than in it — it is load that was cut, not fuel.
  const shortage = useMemo(() => energyCurveShortage(curve ?? undefined), [curve]);

  /**
   * Which fuels are PGCB's own column and which are our addition.
   *
   * The sheet splits public from private plant and names each import line; the
   * eight groups on this chart fold those together. A group that only ever drew
   * on one column is the published figure unchanged — Coal, Hydro, Wind, Solar
   * always, and a two-column group on a day when the second column is idle. A
   * group that summed two or more columns on any half hour is arithmetic, and
   * says so. Same rule the canvas readout applies row by row, so the key and
   * the hover cannot disagree.
   */
  const derivedFuel = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!series) return map;
    series.breakdown.forEach((entries, name) => {
      map.set(name, entries.some((e) => e.parts.length > 1));
    });
    return map;
  }, [series]);

  // Nothing at all while loading, rather than an empty frame that then vanishes
  // on the days — everything before mid-2018 — that publish no such sheet.
  if (loading || !series) return null;

  const { points, active, breakdown } = series;
  const peak = points.reduce(
    (best, p) => (p.total > best.total ? p : best),
    points[0],
  );

  return (
    <div className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <Layers className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="min-w-0">
            <h3 className="grid-explorer-chart-card__title">Generation Mix Through the Day</h3>
            <p className="grid-explorer-chart-card__sub">
              Every half hour, by fuel, as published in the NLDC daily energy curve (Date: {reportDate})
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="grid-explorer-chip inline-flex items-center gap-1.5 border-border/60 hover:bg-muted/40 transition-colors"
        >
          {showTable ? (
            <LineChart className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Table2 className="h-3.5 w-3.5 shrink-0" />
          )}
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>

      {showTable ? (
        // The table is not a fallback — it is how a reader checks a stacked
        // band they cannot separate by eye, and how the figures get copied.
        <div className="mt-4 overflow-x-auto max-h-[26rem]">
          <table className="grid-explorer-table w-full text-[11px]">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                <th className="text-left sticky left-0 bg-card">Time</th>
                {active.map((g) => (
                  <th key={g.name} className="text-right whitespace-nowrap px-2">
                    {g.name}{' '}
                    <GridProvenanceTag kind={derivedFuel.get(g.name) ? 'D' : 'P'} />
                  </th>
                ))}
                <th className="text-right whitespace-nowrap px-2">
                  Total <GridProvenanceTag kind="D" />
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.time}>
                  <td className="font-medium sticky left-0 bg-card">{p.time}</td>
                  {active.map((g) => (
                    <td key={g.name} className="text-right tabular-nums px-2">
                      {(p[g.name] as number) > 0 ? formatNumber(Math.round(p[g.name] as number)) : '·'}
                    </td>
                  ))}
                  <td className="text-right tabular-nums px-2 font-semibold">{formatNumber(Math.round(p.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          {ready ? (
            <GenerationMixCanvas
              points={points}
              active={active}
              breakdown={breakdown}
              shortage={shortage}
              fuelColor={(name) => chartTheme.fuel(name)}
              axisColor={chartTheme.axisTick}
              gridColor={chartTheme.gridStroke}
              shortageColor={chartTheme.destructive}
              reportDate={reportDate}
            />
          ) : (
            <div className="grid-explorer-skeleton h-[27rem] rounded-xl" />
          )}
        </div>
      )}

      {/* The key, in dispatch order top-down so it reads the same way the
          stack does. The bands also name themselves in place, so this exists
          for the thin ones that cannot hold a label rather than as the only
          way to identify a colour.

          It is the site's own legend component rather than a private row of
          swatches: this card drew 8px squares in muted grey while every other
          card on the page drew the shared glyph set at its own scale, so two
          legends sat one above the other in two visual languages. Now the only
          difference is which chart they belong to — and the shared one carries
          the P/D mark, which a bespoke row had no way to say. */}
      <GridChartExternalLegend
        items={[...active]
          .sort((a, b) => MERIT_ORDER.indexOf(b.name) - MERIT_ORDER.indexOf(a.name))
          .map((g) => ({
            id: `fuel-${g.name}`,
            label: g.name,
            color: chartTheme.fuel(g.name),
            variant: 'area' as const,
            provenance: (derivedFuel.get(g.name) ? 'D' : 'P') as 'P' | 'D',
          }))}
      />

      {/* The shared block rather than a private copy of it: on a phone this
          prose came to 281px against a plot of about 228px, and the shared one
          knows how to close itself there. */}
      <GridExplanationBlock
        className="mt-4 rounded-xl border border-border/40"
        insightLabel="Reading it:"
        what={
          <>
            PGCB logs national generation every half hour and splits it by fuel. The bands stack to
            the system total, so the height of the whole is the load curve and the height of each
            band is what that fuel was carrying at that moment. The report separates public from
            private plant and names each import line individually; those are grouped here into the
            same eight fuels used elsewhere on this page, and the underlying split is in the tooltip.
          </>
        }
        insight={
          <>
            generation peaked at{' '}
            <span className="font-semibold text-primary tabular-nums">{peak.time} Hr</span> with{' '}
            <span className="font-bold text-foreground tabular-nums">
              {formatNumber(Math.round(peak.total))} MW
            </span>{' '}
            <GridProvenanceTag kind="D" />{' '}
            across {active.length} fuel{active.length === 1 ? '' : 's'}. Bands that carried nothing
            all day are left out rather than drawn flat.
          </>
        }
      />

      <GridCardFooter>
        <span>Source: <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">PGCB Daily Report</a> — En-Curve sheet, half-hourly generation by fuel</span>
        {sourceFile ? <GridSourceFiles files={[{ label: 'PGCB', name: sourceFile }]} /> : null}
        <span>As published. Not independently audited.</span>
        <span className="font-medium">Reporting Date: {reportDate}</span>
      </GridCardFooter>
    </div>
  );
}
