'use client';

/**
 * The two global-versus-domestic price cards.
 *
 * Lifted out of `MacroTrendsTab.tsx`, which held them alongside seven other
 * sub-views in 3,400 lines — roughly a tenth of all the TSX in this project,
 * concentrated in one file. The audit's point about that file was not that it
 * contained a bug but that it is where a bug hides: F-01 happened because one
 * tile template lived in two files that drifted, and this is the place that
 * pattern was most likely to repeat unseen.
 *
 * These two were the clean seam. Everything else in that file is entangled
 * with the parent's state and needs a real refactor rather than a move.
 */

import { Droplet, DollarSign } from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn, formatNumber, formatUnitRate } from '@/lib/utils';
import { type ChartTheme } from '@/hooks/useChartTheme';
import { axisTickStyle, chartGridProps } from '@/lib/data/grid/chart-axis';
import { ChartDataTable, columnOf } from '@/components/news/power-grid/ChartDataTable';
import { SERIES_COLORS } from '@/lib/data/grid/chart-palette';
import { GridCardFooter, GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import {
  GRID_EXPLORER_CHART_MARGIN,
  GRID_Y_AXIS_WIDTH,
  GridRechartsLegend,
  useNarrowChartCard,
} from '@/components/news/PowerGridChartUI';

/**
 * Tooltip for Brent Crude vs. Retail Diesel.
 *
 * Lifted out of the card so the wide chart and the two narrow ones share one
 * definition. The card renders a different element tree below
 * GRID_DUAL_AXIS_MIN_WIDTH, and a tooltip copied into each tree is a tooltip
 * that drifts: every field here — the exchange rate, the derived Tk/L
 * equivalent, the subsidy gap and both provenance tags — has to survive the
 * split, and sharing the component is what makes that true by construction
 * rather than by review.
 */
function GridBrentDieselTooltip({
  active,
  payload,
  exchangeRates,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: { year: string; globalOil: number; bdDiesel: number } }>;
  exchangeRates: Record<string, number>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const exRate = exchangeRates[d.year] || 122.0;
  // 1 bbl = 158.987 L
  const brentBdtL = (d.globalOil * exRate) / 158.987;
  const difference = d.bdDiesel - brentBdtL;
  return (
    <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
      <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
        <span>Benchmark Oil Price ({d.year})</span>
        <span className="text-[9px] uppercase font-bold text-blue-500 tracking-wider">Oil</span>
      </div>
      <div className="space-y-2 text-[11px] md:text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Brent Crude:</span>
          <span className="font-bold text-blue-500 tabular-nums">${d.globalOil.toFixed(2)} / Bbl</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Exchange Rate:</span>
          <span className="font-semibold text-foreground tabular-nums">{exRate.toFixed(2)} Tk/$</span>
        </div>
        <div className="flex justify-between border-t border-border/20 pt-1">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Brent Cost (Tk/L equivalent):</span>
          <span className="font-bold text-blue-400 tabular-nums">{brentBdtL.toFixed(2)} Tk/L</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />BD Retail Diesel:</span>
          <span className="font-bold text-emerald-500 tabular-nums">{d.bdDiesel.toFixed(2)} Tk/L</span>
        </div>
        <div className="flex justify-between border-t border-border/20 pt-1 border-dashed">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Margin / Subsidy Gap:</span>
          <span className={cn("font-bold", difference >= 0 ? "text-emerald-500" : "text-destructive")}>
            {difference >= 0 ? `+${difference.toFixed(2)} Tk/L (Premium)` : `${difference.toFixed(2)} Tk/L (Subsidized)`}
          </span>
        </div>
      </div>
      <div className="mt-2.5 pt-1.5 border-t border-border/30 text-[8px] text-muted-foreground leading-normal font-medium">
        <strong>Formula:</strong> <code>(Brent USD * Exchange Rate) / 158.987 L</code>
      </div>
      <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
        <div><strong>Series from:</strong> OPEC Bulletin, World Bank Pink Sheet, BPC</div>
        <div><strong>Ref:</strong> <a href="https://bpc.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BPC Pricing Gazettes</a></div>
      </div>
    </div>
  );
}

export function GridBrentDieselCard({
  data,
  exchangeRates,
  chartTheme,
  ready,
}: {
  data: ReadonlyArray<{ year: string; globalOil: number; bdDiesel: number }>;
  exchangeRates: Record<string, number>;
  chartTheme: ChartTheme;
  ready: boolean;
}) {
  const [cardRef, isNarrow] = useNarrowChartCard();

  const tooltip = (
    <Tooltip
      content={({ active, payload }) => (
        <GridBrentDieselTooltip
          active={active}
          payload={payload as unknown as React.ComponentProps<typeof GridBrentDieselTooltip>['payload']}
          exchangeRates={exchangeRates}
        />
      )}
    />
  );

  const xAxis = (
    <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
  );

  return (
    <div ref={cardRef} className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head">
        <div className="flex items-center gap-2.5 min-w-0">
          <DollarSign className="h-5 w-5 shrink-0 text-blue-500" />
          <div className="min-w-0">
            <h3 className="grid-explorer-chart-card__title">Brent Crude vs. Retail Diesel</h3>
            <p className="grid-explorer-chart-card__sub">Brent Crude (USD/Bbl) vs. Domestic Retail Diesel (Tk/L) — <span className="text-primary font-semibold text-xs">Tracked since 1975</span></p>
          </div>
        </div>
        <span className="grid-explorer-chip bg-blue-500/5 text-blue-500 border-blue-500/10">Petroleum</span>
      </div>

      {!ready ? (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
          <div className="grid-explorer-skeleton" />
        </div>
      ) : isNarrow ? (
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p className="grid-explorer-chart-caption">
              <span className="grid-explorer-chart-caption__swatch" style={{ background: SERIES_COLORS.brent }} />
              Brent Crude ($/bbl)
            </p>
            <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart role="img" aria-label="Brent Crude vs. Retail Diesel, chart" accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                  {xAxis}
                  <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `$${v}`} />
                  {tooltip}
                  <Line type="monotone" dataKey="globalOil" name="Brent Crude ($/bbl)" stroke={SERIES_COLORS.brent} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.brent, r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="grid-explorer-chart-caption">
              <span className="grid-explorer-chart-caption__swatch" style={{ background: SERIES_COLORS.retailDiesel }} />
              BD Retail Diesel (Tk/L)
            </p>
            <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart role="img" aria-label="Brent Crude vs. Retail Diesel, chart" accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                  {xAxis}
                  <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} />
                  {tooltip}
                  <Area type="monotone" dataKey="bdDiesel" name="BD Retail Diesel (Tk/L)" fill={SERIES_COLORS.retailDiesel} fillOpacity={0.05} stroke={SERIES_COLORS.retailDiesel} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.retailDiesel, r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart role="img" aria-label="Brent Crude vs. Retail Diesel, chart" accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
              <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `$${v}`} label={{ value: 'Brent Crude ($/bbl)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '9px', fill: chartTheme.axisTick } }} />
              <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} label={{ value: 'Retail Diesel (Tk/L)', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: '9px', fill: chartTheme.axisTick } }} />
              {tooltip}
              <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="globalOil" name="Brent Crude ($/bbl)" stroke={SERIES_COLORS.brent} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.brent, r: 3 }} />
              <Area yAxisId="right" type="monotone" dataKey="bdDiesel" name="BD Retail Diesel (Tk/L)" fill={SERIES_COLORS.retailDiesel} fillOpacity={0.05} stroke={SERIES_COLORS.retailDiesel} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.retailDiesel, r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
      <ChartDataTable
        caption="Brent Crude vs. Retail Diesel, chart"
        categoryHeader='Year'
        categories={data.map((d) => d.year)}
        series={[
          { label: "Brent Crude ($/bbl)", values: columnOf(data, 'globalOil') },
          { label: "BD Retail Diesel (Tk/L)", values: columnOf(data, 'bdDiesel') },
        ]}
      />
        </div>
      )}
      {/* The same series a sighted reader gets from the line, for one who
          cannot. Rendered once per card, not once per breakpoint variant. */}
      <ChartDataTable
        caption="Brent crude against Bangladesh retail diesel, by year"
        categoryHeader="Year"
        categories={data.map((d) => d.year)}
        series={[
          { label: 'Brent crude', unit: 'USD per barrel', values: columnOf(data, 'globalOil') },
          { label: 'BD retail diesel', unit: 'Tk per litre', values: columnOf(data, 'bdDiesel') },
        ]}
      />

      {/* Card Metadata Footer */}
      <GridCardFooter>
        <span>Source: OPEC Bulletin Historical Spot Prices &amp; <a href="https://bpc.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">BPC Official Pricing Gazettes</a></span>
        <span>As published. Not independently audited.</span>
        <span className="font-medium">Reporting Period: Global Comparison (1975 - 2026)</span>
      </GridCardFooter>
    </div>
  );
}

/** Tooltip for Global LNG Benchmark vs. Gas Tariff. Shared by both layouts for
 *  the same reason as the Brent one — see GridBrentDieselTooltip. */
function GridLngTariffTooltip({
  active,
  payload,
  exchangeRates,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: { year: string; globalGas: number; bdGas: number } }>;
  exchangeRates: Record<string, number>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const exRate = exchangeRates[d.year] || 122.0;
  // 1 MMBtu = 28.3 CM (Cubic Meters)
  const globalGasBdtCm = (d.globalGas * exRate) / 28.3;
  const difference = d.bdGas - globalGasBdtCm;
  return (
    <div className="grid-hover-panel p-3.5 md:p-4 text-card-foreground text-xs md:text-sm leading-relaxed w-72 md:w-80 max-w-[calc(100vw-2rem)] select-none bg-card">
      <div className="font-bold text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between gap-2">
        <span>Benchmark Gas Price ({d.year})</span>
        <span className="text-[9px] uppercase font-bold text-violet-500 tracking-wider">Gas</span>
      </div>
      <div className="space-y-2 text-[11px] md:text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Global LNG (US/JKM):</span>
          <span className="font-bold text-violet-500 tabular-nums">${d.globalGas.toFixed(2)} / MMBtu</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />Exchange Rate:</span>
          <span className="font-semibold text-foreground tabular-nums">{exRate.toFixed(2)} Tk/$</span>
        </div>
        <div className="flex justify-between border-t border-border/20 pt-1">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Global Gas (Tk/CM equivalent):</span>
          <span className="font-bold text-violet-400 tabular-nums">{globalGasBdtCm.toFixed(2)} Tk/CM</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="P" />BD Avg Gas Tariff:</span>
          <span className="font-bold text-amber-500 tabular-nums">{d.bdGas.toFixed(2)} Tk/CM</span>
        </div>
        <div className="flex justify-between border-t border-border/20 pt-1 border-dashed">
          <span className="text-muted-foreground inline-flex items-center gap-1"><GridProvenanceTag kind="D" />Subsidization Gap:</span>
          <span className={cn("font-bold", difference >= 0 ? "text-emerald-500" : "text-destructive")}>
            {difference >= 0 ? `+${difference.toFixed(2)} Tk/CM` : `${difference.toFixed(2)} Tk/CM (Subsidized)`}
          </span>
        </div>
      </div>
      <div className="mt-2.5 pt-1.5 border-t border-border/30 text-[8px] text-muted-foreground leading-normal font-medium">
        <strong>Formula:</strong> <code>(Global LNG USD * Exchange Rate) / 28.3 CM</code>
      </div>
      <div className="mt-2 pt-1.5 border-t border-border/20 text-[8px] md:text-[9px] text-muted-foreground flex flex-col gap-0.5">
        <div><strong>Series from:</strong> World Bank Pink Sheet, JKM Index, Petrobangla</div>
        <div><strong>Ref:</strong> <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Petrobangla Audited Reports</a></div>
      </div>
    </div>
  );
}

/**
 * Global LNG Benchmark vs. Gas Tariff — the second dual-axis card on
 * macro/global, split on the same terms as GridBrentDieselCard. Measured 204px
 * of a 362px card (56.4%) combined.
 */
export function GridLngTariffCard({
  data,
  exchangeRates,
  chartTheme,
  ready,
}: {
  data: ReadonlyArray<{ year: string; globalGas: number; bdGas: number }>;
  exchangeRates: Record<string, number>;
  chartTheme: ChartTheme;
  ready: boolean;
}) {
  const [cardRef, isNarrow] = useNarrowChartCard();

  const tooltip = (
    <Tooltip
      content={({ active, payload }) => (
        <GridLngTariffTooltip
          active={active}
          payload={payload as unknown as React.ComponentProps<typeof GridLngTariffTooltip>['payload']}
          exchangeRates={exchangeRates}
        />
      )}
    />
  );

  const xAxis = (
    <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
  );

  return (
    <div ref={cardRef} className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head">
        <div className="flex items-center gap-2.5 min-w-0">
          <Droplet className="h-5 w-5 shrink-0 text-violet-500" />
          <div className="min-w-0">
            <h3 className="grid-explorer-chart-card__title">Global LNG Benchmark vs. Gas Tariff</h3>
            <p className="grid-explorer-chart-card__sub">Global Gas/LNG (USD/MMBtu) vs. BD Avg Tariff (Tk/CM) — <span className="text-primary font-semibold text-xs">Tracked since 2010</span></p>
          </div>
        </div>
        <span className="grid-explorer-chip bg-violet-500/5 text-violet-500 border-violet-500/10">Natural Gas</span>
      </div>

      {!ready ? (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
          <div className="grid-explorer-skeleton" />
        </div>
      ) : isNarrow ? (
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p className="grid-explorer-chart-caption">
              <span className="grid-explorer-chart-caption__swatch" style={{ background: SERIES_COLORS.globalLng }} />
              Global LNG ($/MMBtu)
            </p>
            <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart role="img" aria-label="Global LNG Benchmark vs. Gas Tariff, chart" accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                  {xAxis}
                  <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `$${v}`} />
                  {tooltip}
                  <Line type="monotone" dataKey="globalGas" name="Global LNG ($/MMBtu)" stroke={SERIES_COLORS.globalLng} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.globalLng, r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="grid-explorer-chart-caption">
              <span className="grid-explorer-chart-caption__swatch" style={{ background: SERIES_COLORS.bdGasTariff }} />
              BD Avg Gas Tariff (Tk/CM)
            </p>
            <div className="grid-explorer-chart-area grid-explorer-chart-area--h-compact">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart role="img" aria-label="Global LNG Benchmark vs. Gas Tariff, chart" accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                  <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                  {xAxis}
                  <YAxis width={GRID_Y_AXIS_WIDTH.single} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} />
                  {tooltip}
                  <Area type="monotone" dataKey="bdGas" name="BD Avg Gas Tariff (Tk/CM)" fill={SERIES_COLORS.bdGasTariff} fillOpacity={0.05} stroke={SERIES_COLORS.bdGasTariff} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.bdGasTariff, r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-explorer-chart-area grid-explorer-chart-area--lg mt-4 grid-explorer-chart-area--h-standard">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart role="img" aria-label="Global LNG Benchmark vs. Gas Tariff, chart" accessibilityLayer={false} data={data} margin={GRID_EXPLORER_CHART_MARGIN.topLegend}>
              <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'left')} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `$${v}`} label={{ value: 'Global LNG ($/MMBtu)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '9px', fill: chartTheme.axisTick } }} />
              <YAxis yAxisId="right" orientation="right" width={GRID_Y_AXIS_WIDTH.wide} tick={{ fontSize: 10, fill: chartTheme.axisTick }} axisLine={false} tickLine={false} tickMargin={4} tickFormatter={(v) => `${v} Tk`} label={{ value: 'BD Avg Gas Tariff (Tk/CM)', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: '9px', fill: chartTheme.axisTick } }} />
              {tooltip}
              <GridRechartsLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="globalGas" name="Global LNG ($/MMBtu)" stroke={SERIES_COLORS.globalLng} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.globalLng, r: 3 }} />
              <Area yAxisId="right" type="monotone" dataKey="bdGas" name="BD Avg Gas Tariff (Tk/CM)" fill={SERIES_COLORS.bdGasTariff} fillOpacity={0.05} stroke={SERIES_COLORS.bdGasTariff} strokeWidth={2.5} dot={{ fill: SERIES_COLORS.bdGasTariff, r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
      <ChartDataTable
        caption="Global LNG Benchmark vs. Gas Tariff, chart"
        categoryHeader='Year'
        categories={data.map((d) => d.year)}
        series={[
          { label: "Global LNG ($/MMBtu)", values: columnOf(data, 'globalGas') },
          { label: "BD Avg Gas Tariff (Tk/CM)", values: columnOf(data, 'bdGas') },
        ]}
      />
        </div>
      )}
      <ChartDataTable
        caption="Global LNG benchmark against Bangladesh average gas tariff, by year"
        categoryHeader="Year"
        categories={data.map((d) => d.year)}
        series={[
          { label: 'Global LNG', unit: 'USD per MMBtu', values: columnOf(data, 'globalGas') },
          { label: 'BD average gas tariff', unit: 'Tk per cubic metre', values: columnOf(data, 'bdGas') },
        ]}
      />

      {/* Card Metadata Footer */}
      <GridCardFooter>
        <span>Source: World Bank Pink Sheets &amp; <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Petrobangla Annual Reports</a></span>
        <span>As published. Not independently audited.</span>
        <span className="font-medium">Reporting Period: Global Comparison (2010 - 2026)</span>
      </GridCardFooter>
    </div>
  );
}
