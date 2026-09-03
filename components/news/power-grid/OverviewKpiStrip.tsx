'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Activity, Droplet, Factory, TrendingDown, Zap } from 'lucide-react';
import { TakaIcon } from '@/components/news/power-grid/shared';
import {
  DailyBadge,
  GridKpiCell,
  GridKpiStrip,
  GridKpiTooltipAudit,
  GridKpiTooltipBody,
  GridKpiTooltipRef,
  GridKpiTooltipRow,
  GridKpiTrend,
} from '@/components/news/power-grid/GridExplorerUI';
import { formatNumber } from '@/lib/utils';
import { renewableGridSharePct } from '@/lib/data/companies/sreda';
import { useGridOverviewContext } from '@/hooks/useGridOverviewContext';
import type { GridDailyData, GridForecast, GridSystemStats } from '@/lib/data/grid/types';

type KpiId = 'gen' | 'demand' | 'gas' | 'shed' | 'capacity' | 'cost';

export interface OverviewKpiStripProps {
  systemStats: GridSystemStats;
  /** The documents this day was built from — named on each KPI it produced. */
  sourceFiles?: { pgcb?: string; petrobangla?: string };
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
  /** The Petrobangla gas window this day's gas figures cover, printed on the
   *  gas tile's source line. The PGCB date was there before, under a heading
   *  naming Petrobangla's report — a claim Petrobangla never makes. */
  gasWindowLabel: string;
  avgCostPerKwh: number;
  totalCapacityRenewables: number;
  /** Drives the capacity and trend lookups, which are keyed by day. */
  isoDate: string;
  /**
   * PGCB's same-morning projection for this day, when its issuing workbook is
   * held. Lets the two peak tiles say what PGCB called in advance — a signed
   * difference, never a grade, matching the Forecast against Outturn card.
   */
  forecast?: GridForecast | null;
}

/** "1 Sep" — short enough for a 10px hint line, explicit enough to date a figure. */
function formatGasDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * "forecast 17,360 · outturn +186 MW", under the trend line of a peak tile.
 *
 * Deliberately grey: the tile's trend colours movement against a baseline the
 * grid controls; a forecast miss is PGCB predicting a system it does not fully
 * control, and the outturn card this line points at refuses to grade that.
 * The KPI must not quietly grade it either.
 */
function ForecastHint({
  forecastMw,
  actualMw,
}: {
  forecastMw: number | null | undefined;
  actualMw: number | null | undefined;
}) {
  if (forecastMw == null || !Number.isFinite(forecastMw)) return null;
  const gap =
    actualMw != null && Number.isFinite(actualMw) ? Math.round(actualMw - forecastMw) : null;
  return (
    <span className="block mt-0.5">
      forecast {formatNumber(Math.round(forecastMw))}
      {gap != null && (
        <>
          {' · outturn '}
          {gap >= 0 ? '+' : '−'}
          {formatNumber(Math.abs(gap))} MW
        </>
      )}
    </span>
  );
}

export const OverviewKpiStrip = memo(function OverviewKpiStrip({
  systemStats,
  sourceFiles,
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
  gasWindowLabel,
  avgCostPerKwh,
  totalCapacityRenewables,
  isoDate,
  forecast,
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
    return rate == null ? '—' : `${rate.toFixed(2)} Tk/kWh`;
  };

  // Null where P1 leaves the total-generation cell empty. Averaging a null to
  // zero would print "0 MW" for a day that plainly generated.
  const dailyGenAvgMw =
    systemStats.totalEnergyGen == null ? null : mkwhToAvgMw(systemStats.totalEnergyGen);
  const unservedAvgMw =
    systemStats.totalEnergyUnserved == null ? null : mkwhToAvgMw(systemStats.totalEnergyUnserved);

  const { capacity, baseline } = useGridOverviewContext(isoDate, systemStats);

  // Demand and supply at the same instant, so the difference is the shortfall at
  // the moment the grid was most stretched. The strip used to headline the day's
  // energy averaged over 24 hours next to this peak; the two are not comparable,
  // and readers subtracted them anyway. The average now sits in the supply
  // briefing, named as an average.
  const peakDeficitMw = Math.max(
    0,
    Math.round(systemStats.eveningPeakDemand - systemStats.eveningPeakGen),
  );
  const shedSharePct =
    systemStats.eveningPeakDemand > 0
      ? (peakDeficitMw / systemStats.eveningPeakDemand) * 100
      : null;

  // Idle capacity is measured against the plant sheet's own installed ratings,
  // whose evening-peak column sums to the published peak generation above.
  const installedMw = capacity?.installedMw ?? null;
  const idleMw = installedMw == null ? null : Math.max(0, installedMw - systemStats.eveningPeakGen);
  const idlePct = installedMw && installedMw > 0 ? ((idleMw ?? 0) / installedMw) * 100 : null;

  // The strip carries published figures. `totalDailyCost` is P1's printed
  // "Production Cost (Tk.)" total row — a number PGCB states — so it is what
  // this tile headlines.
  //
  // `avgProductionCost` used to hold that slot, and it is NOT the printed
  // "Production Cost per KWHr" cell: parse_daily_reports.py:1890-1892 computes
  // it as total_daily_cost / total_energy_gen and never reads the rate PGCB
  // prints. The tile still claimed `provenance="P"` for it while its own
  // tooltip row underneath marked the same field D — the mark was corrected in
  // the label fidelity pass and the headline was not. The derived rate keeps
  // its place in the briefing below, under a D, where it can be read against
  // the bill it came from.
  const publishedDailyCost =
    typeof systemStats.totalDailyCost === 'number' && systemStats.totalDailyCost > 0
      ? systemStats.totalDailyCost
      : null;
  const derivedUnitCost =
    typeof systemStats.avgProductionCost === 'number' && systemStats.avgProductionCost > 0
      ? systemStats.avgProductionCost
      : null;
  const unitCostGap =
    derivedUnitCost != null && hasPublishedFuelCost
      ? Math.abs(derivedUnitCost - avgCostPerKwh)
      : null;

  // The page-level strip: its briefings drop over the tab content below, so it
  // must sit above any KPI strip rendered inside a tab.
  return (
    <GridKpiStrip
      stripRef={kpiStripRef}
      layer="page"
      className="grid-explorer-kpi-strip--six"
      // Peak Supply leads, paired with Peak Demand and Peak Deficit: the three
      // together are the day's whole story — what the grid had, what it was
      // asked for, and the gap between them. Capacity Idle, Gas Supply and Cost
      // of Power explain that story rather than tell it, so they fold.
      collapsibleAfter={3}
    >
      <GridKpiCell
        icon={Zap}
        label={
          <>
            {/* P1's own row, in full. "Peak Supply" invented a word the source
                never uses; "Peak Generation" was closer but still not what the
                sheet says, and it left the reader to guess which of the two
                peaks PGCB prints this is. The parser matches
                `^(day|evening)\s+peak\s+(generation|demand)` — this is the
                evening one, and the tile now says so. */}
            Evening Peak Generation
            <DailyBadge />
          </>
        }
        value={`${formatNumber(Math.round(systemStats.eveningPeakGen))} MW`}
        hint={
          <>
            <GridKpiTrend
              current={systemStats.eveningPeakGen}
              baseline={baseline?.peakSupply}
              days={baseline?.days ?? 0}
              polarity="up-good"
            />
            <ForecastHint
              forecastMw={forecast?.maxGenEveningMw}
              actualMw={systemStats.eveningPeakGen}
            />
          </>
        }
        active={activeKpiTooltip === 'gen'}
        // The evening peak as PGCB prints it, so it stands against the demand
        // tile at the same instant rather than across a different window.
        provenance="P"
        onToggle={() => toggleKpiTooltip('gen')}
        tooltipTitle="Supply Briefing"
        tooltipIcon={Zap}
        tooltipAccent="text-primary"
        width="sm"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="P"
            label="Evening Peak Gen:"
            value={`${formatNumber(Math.round(systemStats.eveningPeakGen))} MW`}
          />
          <GridKpiTooltipRow
            provenance="P"
            label="Day Peak Gen:"
            value={systemStats.dayPeakGen == null ? '—' : `${formatNumber(Math.round(systemStats.dayPeakGen))} MW`}
          />
          {/* The old headline. Kept, but named as the 24-hour average it is. */}
          <GridKpiTooltipRow
            provenance="D"
            label="24-Hour Average:"
            value={dailyGenAvgMw == null ? '—' : `${formatNumber(Math.round(dailyGenAvgMw))} MW`}
          />
          <GridKpiTooltipRow
            provenance="P"
            label="Total Energy Gen:"
            value={systemStats.totalEnergyGen == null ? 'not published for this day' : `${systemStats.totalEnergyGen.toFixed(2)} MKWh`}
          />
          <GridKpiTooltipRow
            provenance="P"
            label="Max Generation of the Day:"
            value={systemStats.maxGen == null ? '—' : `${formatNumber(Math.round(systemStats.maxGen))} MW`}
          />
          {/* P1's own row title. "Min Base Gen" implied baseload; the parser
              documents this as the 08:00 morning trough PGCB prints. */}
          <GridKpiTooltipRow
            provenance="P"
            label="Min Generation of the Day:"
            value={systemStats.minGen == null ? '—' : `${formatNumber(Math.round(systemStats.minGen))} MW`}
          />
          {/* PGCB called this number at ~10:00 the same morning, in the report
              named for this day — the full comparison is the Forecast against
              Outturn card at the end of this tab. */}
          {forecast?.maxGenEveningMw != null && (
            <GridKpiTooltipRow
              provenance="P"
              label="PGCB's same-morning forecast:"
              value={`${formatNumber(Math.round(forecast.maxGenEveningMw))} MW`}
            />
          )}
          {/* What went unserved has its own tile; repeating it here would put the
              same figure in two briefings a thumb apart. */}
          <GridKpiTooltipAudit>As published by PGCB. Not audited.</GridKpiTooltipAudit>
          <GridKpiTooltipRef
            refLabel="PGCB Daily Report"
            part="P1 sheet"
            sourceFile={sourceFiles?.pgcb}
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
            {/* P1's row, in full — the same reasoning as the generation tile
                beside it. The value is `eveningPeakDemand`. */}
            Evening Peak Demand
            <DailyBadge />
          </>
        }
        value={`${formatNumber(Math.round(systemStats.eveningPeakDemand))} MW`}
        hint={
          <>
            <GridKpiTrend
              current={systemStats.eveningPeakDemand}
              baseline={baseline?.peakDemand}
              days={baseline?.days ?? 0}
            />
            <ForecastHint
              forecastMw={forecast?.maxDemandEveningMw ?? forecast?.maxDemandMw}
              actualMw={systemStats.eveningPeakDemand}
            />
          </>
        }
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
          {/* The deficit this demand implies is the Peak Deficit tile's headline. */}
          <GridKpiTooltipRow
            provenance="P"
            label="Max Temperature:"
            value={systemStats.maxTemp == null ? '—' : `${systemStats.maxTemp.toFixed(1)} °C`}
          />
          {(forecast?.maxDemandEveningMw ?? forecast?.maxDemandMw) != null && (
            <GridKpiTooltipRow
              provenance="P"
              label="PGCB's same-morning forecast:"
              value={`${formatNumber(Math.round(forecast!.maxDemandEveningMw ?? forecast!.maxDemandMw!))} MW`}
            />
          )}
          <GridKpiTooltipAudit>As published by PGCB. Not audited.</GridKpiTooltipAudit>
          <GridKpiTooltipRef
            refLabel="PGCB Daily Report"
            part="P1 sheet"
            sourceFile={sourceFiles?.pgcb}
            refHref="https://www.pgcb.gov.bd/"
            dateLabel={`Date: ${systemStats.date}`}
          />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={TrendingDown}
        iconClassName="text-destructive"
        // "Load Shedding" named a figure this is not. The value is
        // eveningPeakDemand - eveningPeakGen, which is why it carries a D: PGCB
        // prints load shedding of its own, zone by zone, and on 2026-08-14 that
        // printed figure summed to 396 MW against the 414 MW this subtraction
        // gives. Two different measures reading as one contradiction, because
        // PGCB's own three columns do not reconcile — demand exceeds generation
        // plus shedding on every hourly row, which the ingest passes through as
        // published rather than forcing to balance. The name now says which of
        // the two this is.
        label={
          <>
            Peak Deficit
            <DailyBadge />
          </>
        }
        value={`${formatNumber(peakDeficitMw)} MW`}
        hint={
          <GridKpiTrend
            current={peakDeficitMw}
            baseline={baseline?.peakDeficit}
            days={baseline?.days ?? 0}
            polarity="down-good"
          />
        }
        active={activeKpiTooltip === 'shed'}
        // PGCB prints the demand and the generation; the shortfall between them
        // at the evening peak is our subtraction, not a figure they state.
        provenance="D"
        onToggle={() => toggleKpiTooltip('shed')}
        tooltipTitle="Shortfall Briefing"
        tooltipIcon={TrendingDown}
        tooltipAccent="text-destructive"
        widthClass="w-[19rem] md:w-[21rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="D"
            label="At the evening peak:"
            value={`${formatNumber(peakDeficitMw)} MW`}
            valueClass="text-destructive"
          />
          <GridKpiTooltipRow
            provenance="D"
            label="Share of peak demand:"
            value={shedSharePct == null ? '—' : `${shedSharePct.toFixed(1)}%`}
          />
          <GridKpiTooltipRow
            provenance="P"
            label="Energy unserved (day):"
            value={
              systemStats.totalEnergyUnserved == null
                ? 'not published for this day'
                : `${systemStats.totalEnergyUnserved.toFixed(2)} MKWh`
            }
          />
          <GridKpiTooltipRow
            provenance="D"
            label="That, averaged over 24h:"
            value={unservedAvgMw == null ? '—' : `${formatNumber(Math.round(unservedAvgMw))} MW`}
          />
          <GridKpiTooltipAudit>
            The headline is peak demand less peak generation at the same hour. PGCB&rsquo;s own
            unserved-energy figure is the day&rsquo;s total and is listed above beside it —
            the two measure different things and are not expected to match.
          </GridKpiTooltipAudit>
          <GridKpiTooltipRef
            refLabel="PGCB Daily Report"
            part="P1 sheet — demand, generation and unserved energy"
            sourceFile={sourceFiles?.pgcb}
            refHref="https://www.pgcb.gov.bd/"
            dateLabel={`Date: ${systemStats.date}`}
          />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Factory}
        iconClassName="text-violet-500"
        label={
          <>
            Capacity Idle
            <DailyBadge />
          </>
        }
        value={idlePct == null ? '—' : `${idlePct.toFixed(1)}%`}
        hint={
          idleMw == null ? null : (
            <span className="text-muted-foreground">
              {formatNumber(Math.round(idleMw))} MW unused at peak
            </span>
          )
        }
        active={activeKpiTooltip === 'capacity'}
        // Installed ratings and the evening-peak column come off the same plant
        // sheet; the ratio between them is ours.
        provenance="D"
        onToggle={() => toggleKpiTooltip('capacity')}
        tooltipTitle="Fleet Utilisation"
        tooltipIcon={Factory}
        tooltipAccent="text-violet-500"
        widthClass="w-[19.5rem] md:w-[22rem]"
      >
        <GridKpiTooltipBody>
          {capacity ? (
            <>
              <GridKpiTooltipRow
                provenance="P"
                label="Installed (stations listed):"
                value={`${formatNumber(Math.round(capacity.installedMw))} MW`}
              />
              <GridKpiTooltipRow
                provenance="P"
                label="Running at evening peak:"
                value={`${formatNumber(Math.round(systemStats.eveningPeakGen))} MW`}
              />
              <GridKpiTooltipRow
                provenance="D"
                label="Idle at that moment:"
                value={idleMw == null ? '—' : `${formatNumber(Math.round(idleMw))} MW`}
                valueClass="text-destructive"
              />
              <GridKpiTooltipRow provenance="P" label="Stations counted:" value={`${capacity.stations}`} />
              {capacity.stationsMissingCapacity > 0 && (
                <GridKpiTooltipRow
                  provenance="P"
                  label="Without a stated rating:"
                  value={`${capacity.stationsMissingCapacity} station${capacity.stationsMissingCapacity === 1 ? '' : 's'}`}
                />
              )}
              {/* SREDA's register, not PGCB's sheet: a different publisher on a
                  different basis (MWp peak DC), so it is named as its own line
                  rather than folded into the total above. */}
              <GridKpiTooltipRow
                provenance="P"
                label="Renewables registered:"
                value={`${totalCapacityRenewables.toFixed(1)} MWp · ~${renewableGridSharePct.toFixed(1)}% of national`}
              />
              <GridKpiTooltipAudit>
                Both sides of this ratio are the plant sheet&rsquo;s own columns — its evening-peak
                figures sum to the peak generation PGCB prints on P1. Capacity that is derated,
                under maintenance or short of fuel is counted as installed, so this is idle
                capacity, not spare capacity that could have run.
              </GridKpiTooltipAudit>
              <GridKpiTooltipRef
                refLabel="PGCB Daily Report"
                part="Station-wise generation sheet"
                sourceFile={sourceFiles?.pgcb}
                refHref="https://www.pgcb.gov.bd/"
                dateLabel={`Date: ${systemStats.date}`}
              />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              This day&rsquo;s report carries no station-wise sheet, so there is no installed
              rating to measure the peak against. The demand, supply and shedding figures
              beside it are unaffected.
            </p>
          )}
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
        // This was the one tile of the six with no second line at all, so it
        // read as a figure whose context had failed to load. All three states
        // say something now, because an empty slot beside five filled ones is
        // itself a claim.
        hint={
          !hasGasProductionData ? (
            // No trend is possible here — a percentage change needs both sides
            // and this day has no figure — but the week behind it is known, so
            // the last window on record is reported rather than nothing.
            //
            // Dated, and never as a bare number. An undated gas figure on a
            // tile whose own day has none is the substitution that put 2,366
            // MMcfd on 26 August and 856 on the 28th under one unchanged label.
            // The date is what makes this context instead of a stand-in.
            <span className="text-muted-foreground">
              awaiting Petrobangla
              {baseline?.lastGas && (
                <>
                  {' · last filed '}
                  {formatNumber(baseline.lastGas.total, 1)} MMCFD on{' '}
                  {formatGasDay(baseline.lastGas.date)}
                </>
              )}
            </span>
          ) : baseline?.gasSupply != null ? (
            // Counted over gas days, not over the whole window — for the same
            // filing lag, the mean routinely rests on fewer days than the five
            // other tiles, and the line says which.
            <GridKpiTrend
              current={totalGasSupply}
              baseline={baseline.gasSupply}
              days={baseline.gasDays}
              polarity="up-good"
            />
          ) : (
            <span className="text-muted-foreground">no earlier gas window to compare</span>
          )
        }
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
              <GridKpiTooltipRow provenance="D" label="Total Condensate:" value={`${formatNumber(totalCondensate, 1)} BBLD`} />
              <GridKpiTooltipAudit>As published by Petrobangla. Not audited.</GridKpiTooltipAudit>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Petrobangla has not published the production and distribution tables for this
              gas day yet. PGCB grid figures above are unaffected.
            </p>
          )}
          {/* The document's own title. "Daily Gas Intake/Offtake Report" is
              the PDF's file name, not what is printed on it. */}
          <GridKpiTooltipRef
            refLabel="Petrobangla Daily Gas & Condensate Production and Distribution Report"
            part="I. Production"
            sourceFile={sourceFiles?.petrobangla}
            refHref="https://www.petrobangla.org.bd/"
            dateLabel={`Gas day: ${gasWindowLabel}`}
          />
        </GridKpiTooltipBody>
      </GridKpiCell>

      {/* Renewables no longer take a slot of their own. SREDA's register is a
          standing figure that does not move with the date picker, so on a strip
          that reads as "this day" it was the one tile that never changed; its
          capacity now sits with the other capacity figures, under Capacity Idle. */}

      <GridKpiCell
        icon={TakaIcon}
        iconClassName="text-emerald-500"
        label={
          <>
            {/* P1's block title. "Cost of Power" was ours, and it named a rate
                while the tile now headlines the printed total. */}
            Production Cost
            <DailyBadge />
          </>
        }
        // The day's published fuel and import bill. Where the report omits the
        // production-cost block there is no total, and the tile prints a dash
        // rather than a zero — "0 Cr" would read as a day the grid ran for free.
        value={publishedDailyCost == null ? '—' : `${(publishedDailyCost / 10000000).toFixed(2)} Cr BDT`}
        hint={
          <GridKpiTrend
            current={publishedDailyCost}
            baseline={baseline?.dailyCost}
            days={baseline?.days ?? 0}
            polarity="down-good"
          />
        }
        active={activeKpiTooltip === 'cost'}
        provenance="P"
        onToggle={() => toggleKpiTooltip('cost')}
        tooltipTitle="Fuel & Import Bills"
        tooltipIcon={TakaIcon}
        tooltipAccent="text-emerald-500"
        widthClass="w-[18.5rem] md:w-[21rem]"
      >
        <GridKpiTooltipBody>
          {/* The headline, restated as the row it comes from. A day whose
              report carries no production-cost block has no total to show;
              "0.00 Crore" would read as a grid that ran for free. */}
          <GridKpiTooltipRow
            provenance="P"
            label="Fuel bill for the day:"
            value={
              publishedDailyCost == null
                ? 'not published for this day'
                : `${(publishedDailyCost / 10000000).toFixed(2)} Crore BDT`
            }
            valueClass="text-primary"
          />
          {/* The parenthetical said "(bill ÷ energy)". The note at the foot of
              this panel already explains that this rate is ours and how it is
              worked out, so the label repeated it a thumb away. */}
          <GridKpiTooltipRow
            provenance="D"
            label="Average production cost:"
            value={derivedUnitCost == null ? 'not published for this day' : `${derivedUnitCost.toFixed(3)} Tk/kWh`}
          />
          {/* Shown only when it disagrees with the published rate. Agreement is
              the normal case and a second identical number teaches nothing. */}
          {unitCostGap != null && unitCostGap >= 0.005 && (
            <GridKpiTooltipRow
              provenance="D"
              label="Bill ÷ generation:"
              value={`${avgCostPerKwh.toFixed(3)} Tk/kWh`}
            />
          )}
          <GridKpiTooltipRow provenance="D" label="Gas generation cost:" value={fuelUnitRate('Gas')} />
          <GridKpiTooltipRow provenance="D" label="HFO generation cost:" value={fuelUnitRate('HFO')} valueClass="text-destructive" />
          <GridKpiTooltipRow provenance="D" label="Cross-border imports:" value={fuelUnitRate('Imports')} />
          <GridKpiTooltipAudit>
            The headline is the production-cost total PGCB prints on P1. The average rate
            beneath it is ours — the bill divided by the day&rsquo;s energy, not the rate the
            report states. The per-fuel rates below are not published tariffs either: each is
            that fuel&rsquo;s cost divided by its generation, and the import rate in particular
            is a blended settlement figure rather than a contracted price, so read it as an
            indication.
            <br />
            Fuel and import bills only: capacity payments, debt service and O&amp;M appear
            nowhere on this report, so the true cost of running the grid is higher than any
            rate here. Restates BPDB fuel economics. Not audited.
          </GridKpiTooltipAudit>
          <GridKpiTooltipRef refLabel="PGCB Daily Report" part="P1 sheet — production-cost block" refHref="https://www.pgcb.gov.bd/" dateLabel={`Date: ${systemStats.date}`} sourceFile={sourceFiles?.pgcb} />
        </GridKpiTooltipBody>
      </GridKpiCell>
    </GridKpiStrip>
  );
});