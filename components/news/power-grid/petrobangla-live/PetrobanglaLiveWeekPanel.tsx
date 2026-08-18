'use client';

import { useEffect, useMemo, useState } from 'react';
import { Droplet, Loader2, Lock } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { computeLiveWeekKpis } from '@/lib/data/petrobangla/computeLiveWeek';
import { getDistributionGrandTotal, getRpgclGas } from '@/lib/data/petrobangla/compute';
import {
  formatLiveWeekDate,
  isDateInLiveWeek,
  isLiveWeekRangeLocked,
  LIVE_WEEK_RANGE_OPTIONS,
  maxLiveWeekDaysForTier,
  sliceLiveWeekBundle,
  type LiveWeekPreset,
} from '@/lib/data/petrobangla/getLiveWeek';
import { useGridTierAccess } from '@/hooks/useGridTierAccess';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import { GridDataLockedGate } from '@/components/news/power-grid/GridDataLockedGate';
import { usePetrobanglaBootstrap } from '../PetrobanglaBootstrap';
import type { AudienceMode } from '@/lib/data/petrobangla/types';
import {
  ArchiveInsightCallout,
  AudienceModeToggle,
  PetrobanglaOfficialSourceLink,
} from '../petrobangla-archive/PetrobanglaArchiveShared';
import { GasExplanationBlock, GasSourceFooter, LiveBadge } from '../GasTabShared';
import { MacroGasWeekSummary } from '../MacroGasSectionChrome';
import { PbLiveKpiStrip, type PeriodKpis } from './pbLiveKpiStrip';
import { PbLiveTimeline } from './pbLiveTimeline';
import { PbLiveFieldSnapshot } from './pbLiveFieldSnapshot';
import { PbLivePlantStress } from './pbLivePlantStress';
import { PbLiveDayCompare } from './pbLiveDayCompare';

interface Props {
  selectedDate: string;
  pgcbGasTotal?: number;
  mode?: AudienceMode;
  hideAudienceToggle?: boolean;
  /** Embedded inside the unified macro depletion card — no nested card chrome */
  unified?: boolean;
  /** Nested directly under the reserves depletion chart in the left column */
  underChart?: boolean;
  /** Stretch content to fill balanced triad column */
  fillColumn?: boolean;
  rangeDays?: LiveWeekPreset;
  onRangeDaysChange?: (days: LiveWeekPreset) => void;
}

export function PetrobanglaLiveWeekPanel({
  selectedDate,
  pgcbGasTotal,
  mode: modeProp,
  hideAudienceToggle = false,
  unified = false,
  underChart = false,
  fillColumn = false,
  rangeDays: rangeDaysProp,
  onRangeDaysChange,
}: Props) {
  const { tier } = useGridTierAccess();
  const {
    liveWeek: bundle,
    liveWeekLoading,
    ensureLiveWeekDays,
    timeline,
    timelineLoading,
    ensureTimeline,
  } = usePetrobanglaBootstrap();
  const [internalMode, setInternalMode] = useState<AudienceMode>('simple');
  const mode = modeProp ?? internalMode;
  const chartsReady = true;
  const [internalRangeDays, setInternalRangeDays] = useState<LiveWeekPreset>(7);
  const rangeDays = rangeDaysProp ?? internalRangeDays;
  const setRangeDays = onRangeDaysChange ?? setInternalRangeDays;

  const rangeLocked = isLiveWeekRangeLocked(rangeDays, tier);
  const rangeOption = LIVE_WEEK_RANGE_OPTIONS.find((o) => o.days === rangeDays);

  useEffect(() => {
    if (rangeDays <= 30) {
      if (!bundle || rangeLocked || bundle.days.length >= rangeDays) return;
      void ensureLiveWeekDays(rangeDays);
    } else {
      if (timeline || rangeLocked) return;
      void ensureTimeline();
    }
  }, [bundle, rangeDays, ensureLiveWeekDays, timeline, ensureTimeline, rangeLocked]);

  const activeBundle = useMemo(() => {
    if (!bundle?.days.length) return null;
    const want = rangeLocked ? maxLiveWeekDaysForTier(tier) : Math.min(30, rangeDays);
    return sliceLiveWeekBundle(bundle, Math.min(want, bundle.days.length));
  }, [bundle, rangeDays, rangeLocked, tier]);

  const activeTimelineDays = useMemo(() => {
    if (!timeline?.days.length) return [];
    const want = rangeLocked ? maxLiveWeekDaysForTier(tier) : rangeDays;
    return timeline.days.slice(-Math.min(want, timeline.days.length));
  }, [timeline, rangeDays, rangeLocked, tier]);

  const periodKpis: PeriodKpis | null = useMemo(() => {
    const days = activeTimelineDays.length ? activeTimelineDays : (activeBundle?.days.map(d => {
      const gt = getDistributionGrandTotal(d);
      return {
        date: d.report.report_date_end,
        total_gas: d.production.grand_total.gas_mmcfd,
        power_demand: gt.power_demand_mmcfd,
        power_supply: gt.power_supply_mmcfd,
        lng_gas: getRpgclGas(d.production.fields),
      }
    }) ?? []);

    if (!days.length) return null;

    let totalGas = 0;
    let powerDemand = 0;
    let powerSupply = 0;
    let lngGas = 0;
    let minGas = Infinity;
    let maxGas = -Infinity;

    for (const d of days) {
      totalGas += d.total_gas ?? 0;
      powerDemand += d.power_demand ?? 0;
      powerSupply += d.power_supply ?? 0;
      lngGas += d.lng_gas ?? 0;
      if (d.total_gas != null && d.total_gas < minGas) minGas = d.total_gas;
      if (d.total_gas != null && d.total_gas > maxGas) maxGas = d.total_gas;
    }

    const avgGas = totalGas / days.length;
    const avgFulfillment = powerDemand > 0 ? (powerSupply / powerDemand) * 100 : 0;
    const avgLngShare = totalGas > 0 ? (lngGas / totalGas) * 100 : 0;
    const volatility = maxGas === -Infinity ? 0 : maxGas - minGas;

    return {
      avgGas,
      avgFulfillment,
      avgLngShare,
      volatility,
      daysCount: days.length
    };
  }, [activeTimelineDays, activeBundle]);

  const isLoading = !bundle || (rangeDays > 30 && !timeline && timelineLoading);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center gap-3 min-h-[120px]', !unified && 'grid-explorer-chart-card card p-8')}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          {rangeDays <= 30 ? 'Loading recent gas-days…' : 'Loading national timeline…'}
        </span>
      </div>
    );
  }

  if (!activeBundle) {
    return (
      <div className={cn('text-center text-sm text-muted-foreground', unified ? 'py-6' : 'grid-explorer-chart-card card p-6')}>
        Live week data unavailable. Run sync_petrobangla_live.py to refresh.
      </div>
    );
  }

  if (rangeDays > 30 && !timeline) {
    return (
      <div className={cn('text-center text-sm text-muted-foreground', unified ? 'py-6' : 'grid-explorer-chart-card card p-6')}>
        Timeline data unavailable.
      </div>
    );
  }

  const kpis = computeLiveWeekKpis(activeBundle);
  const latest = activeBundle.days[activeBundle.days.length - 1];
  const inWeek = isDateInLiveWeek(selectedDate, activeBundle);
  const showAllKpis = mode !== 'simple';
  const showKpiStrip = !unified || mode !== 'simple';
  const showAnalyst = mode === 'analyst' || mode === 'researcher';
  const showInvestor = mode === 'investor' || mode === 'analyst';

  const rangePeriodLabel =
    rangeDays === 7
      ? 'Week ending'
      : rangeDays === 30
        ? 'Month ending'
        : rangeDays === 180
          ? '6-month period ending'
          : rangeDays === 365
            ? 'Year ending'
            : rangeDays === 1095
              ? '3-year period ending'
              : 'Archive period ending';

  const labelPrefix =
    rangeDays === 7
      ? '7-Day'
      : rangeDays === 30
        ? '30-Day'
        : rangeDays === 180
          ? '6-Month'
          : rangeDays === 365
            ? '1-Year'
            : rangeDays === 1095
              ? '3-Year'
              : 'All-Time';



  const weekInsight = unified
    ? `${rangePeriodLabel} ${formatLiveWeekDate(kpis.latestDate)}: ${formatNumber(kpis.weekAvgGas, 0)} MMCFD average · ${kpis.powerFulfillmentPct.toFixed(0)}% power fulfillment · ${kpis.lngSharePct.toFixed(0)}% LNG · Bibiyana ${formatNumber(kpis.bibiyanaGas, 0)} MMCFD.`
    : `${rangePeriodLabel} ${formatLiveWeekDate(kpis.latestDate)}: National gas averaged ~${formatNumber(kpis.weekAvgGas, 0)} MMCFD with ${formatNumber(kpis.weekVolatility, 1)} MMCFD daily swing. Power plants demanded ~${formatNumber(kpis.powerDemand, 0)} MMCFD but received ~${formatNumber(kpis.powerSupply, 0)} — ${kpis.powerFulfillmentPct.toFixed(0)}% fulfillment. LNG supplied ~${kpis.lngSharePct.toFixed(0)}% of all gas. Bibiyana held at ~${formatNumber(kpis.bibiyanaGas, 0)} MMCFD on ${kpis.bibiyanaWells} wells.`;

  const body = (
    <div
      className={cn(
        'space-y-3',
        !unified && !underChart && 'p-4',
        underChart && 'gas-reserve-live-week__body',
        fillColumn && 'gas-reserve-live-week__body--fill',
      )}
    >
      {unified ? (
        <MacroGasWeekSummary kpis={kpis} labelPrefix={labelPrefix} periodKpis={periodKpis} />
      ) : (
        <ArchiveInsightCallout>{weekInsight}</ArchiveInsightCallout>
      )}

      {!unified && (
        <p className="text-[11px] text-muted-foreground">
          Latest: <span className="font-semibold text-foreground">{formatLiveWeekDate(kpis.latestDate)}</span>
          <span className="text-muted-foreground ml-1">({kpis.latestLabel})</span>
        </p>
      )}

      {!inWeek && selectedDate >= '2020-01-11' && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          Grid date {selectedDate} is outside this range — see Daily archive below.
        </p>
      )}

      {showKpiStrip && periodKpis && (
        <div
          className={cn(
            'grid-explorer-kpi-strip',
            showAllKpis ? '!grid-cols-2 md:!grid-cols-4 xl:!grid-cols-4' : '!grid-cols-1 max-w-xs',
          )}
        >
          <PbLiveKpiStrip periodKpis={periodKpis} labelPrefix={labelPrefix} showAll={showAllKpis} />
        </div>
      )}

      {rangeDays <= 30 && liveWeekLoading && bundle && !rangeLocked && bundle.days.length < rangeDays && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          Loading {rangeDays}-day window…
        </p>
      )}
      {rangeDays > 30 && timelineLoading && !timeline && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          Loading national timeline…
        </p>
      )}

      <div className={cn('relative', fillColumn && 'gas-reserve-live-week__chart-wrap')}>
        <PbLiveTimeline
          bundle={rangeDays <= 30 ? activeBundle ?? undefined : undefined}
          timelineDays={rangeDays > 30 ? activeTimelineDays : undefined}
          chartsReady={chartsReady}
          highlightDate={inWeek ? selectedDate : undefined}
          compact={unified}
          fillHeight={fillColumn}
        />
        {rangeLocked && rangeOption && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/55 backdrop-blur-[2px] p-4">
            <GridDataLockedGate
              variant="inline"
              requiredTier={rangeOption.requiredTier}
              selectedDate={selectedDate}
              className="max-w-md"
              onClose={() => setRangeDays(7)}
            />
          </div>
        )}
      </div>

      {(showAnalyst || showInvestor) && (
        <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
          <PbLiveFieldSnapshot bundle={activeBundle} latest={latest} showSparklines={showAnalyst} />
          <PbLivePlantStress latest={latest} />
        </div>
      )}

      {showAnalyst && <PbLiveDayCompare bundle={activeBundle} />}

      {mode === 'researcher' && (
        <div className="flex flex-wrap gap-2 text-[10px]">
          {activeBundle.index_entries.map((entry) => (
            <a
              key={entry.date}
              href={`/data/petrobangla/daily/${entry.json_file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="grid-explorer-chip text-primary hover:underline"
            >
              {entry.json_file}
            </a>
          ))}
        </div>
      )}

      <div className={cn(fillColumn && 'mt-auto space-y-2 pt-2 border-t border-border/30')}>
        {unified && fillColumn && (
          <p className="text-[10px] text-muted-foreground leading-relaxed">{weekInsight}</p>
        )}
        {pgcbGasTotal != null && pgcbGasTotal > 0 && (
          <p
            className={cn(
              'text-[10px] text-muted-foreground',
              unified && !fillColumn ? 'px-3 py-2 rounded-lg bg-muted/20 border border-border/30' : '',
            )}
          >
            <span className="font-semibold text-foreground">PGCB vs Petrobangla:</span>{' '}
            <span className="tabular-nums">{formatNumber(pgcbGasTotal, 1)} MMCFD (grid)</span>
            <GridProvenanceTag kind="P" className="mx-1" />
            ·{' '}
            <span className="tabular-nums">{formatNumber(kpis.latestGas, 1)} MMCFD (fields)</span>
            <GridProvenanceTag kind="P" className="mx-1" />
            — different reporting layers.
          </p>
        )}
      </div>

      {!unified && (
        <>
          <GasExplanationBlock
            className="rounded-xl border border-border/30"
            what={rangeDays > 3000 
              ? "Full archive of official Petrobangla gas-days: national supply, power-sector demand vs allocation, LNG share, Bibiyana output, and plant stress. Analyst and Researcher modes unlock field sparklines, plant tables, and day-over-day compare."
              : `Rolling ${rangeDays}-day official Petrobangla gas-days window: national supply, power-sector demand vs allocation, LNG share, Bibiyana output, and plant stress. Analyst and Researcher modes unlock field sparklines, plant tables, and day-over-day compare.`
            }
            insight="Short-term volatility in this window often precedes rationing decisions. When power fulfillment drops while LNG share rises, the system is leaning on expensive imports without fully covering electricity-sector demand — a pattern visible across the 2024–2026 archive."
          />
          <GasSourceFooter
            source={
              <>
                <PetrobanglaOfficialSourceLink /> · daily gas intake/offtake reports
              </>
            }
            attribution="As published. Not independently audited."
            reportingPeriod={`${rangePeriodLabel} ${kpis.latestDate} · gas-day 8:00 AM → 8:00 AM`}
          />
        </>
      )}
    </div>
  );

if (unified) return body;

  return (
    <div className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
        <Droplet className="h-5 w-5 text-sky-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="grid-explorer-chart-card__title">
            Rolling Gas-Day Window
            <LiveBadge />
          </h3>
          <p className="grid-explorer-chart-card__sub">
            Latest official data:{' '}
            <span className="text-emerald-500 font-bold">{formatLiveWeekDate(kpis.latestDate)}</span>
            <span className="text-muted-foreground ml-1">({kpis.latestLabel})</span>
          </p>
        </div>
        {!hideAudienceToggle && <AudienceModeToggle mode={mode} onChange={setInternalMode} />}
      </div>
      {body}
    </div>
  );
}
export function LiveWeekRangeToolbar({
  rangeDays,
  setRangeDays,
}: {
  rangeDays: LiveWeekPreset;
  setRangeDays: (days: LiveWeekPreset) => void;
}) {
  const { tier } = useGridTierAccess();
  return (
    <div className="gas-reserve-archive-view-toolbar__controls flex flex-wrap items-center justify-center gap-3 w-full">
      <div className="gas-reserve-archive-range" role="group" aria-label="Live window">
        {LIVE_WEEK_RANGE_OPTIONS.map((opt) => {
          const locked = isLiveWeekRangeLocked(opt.days, tier);
          return (
            <button
              key={opt.days}
              type="button"
              onClick={() => setRangeDays(opt.days)}
              className={cn(
                'gas-reserve-archive-range__btn inline-flex items-center gap-1',
                rangeDays === opt.days && 'gas-reserve-archive-range__btn--active',
              )}
            >
              {opt.label}
              {locked && <Lock className="h-2.5 w-2.5 shrink-0 opacity-70" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

  