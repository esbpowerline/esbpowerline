'use client';

import { useEffect, useMemo, useState } from 'react';
import { Droplet, Loader2, Lock } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { computeLiveWeekKpis } from '@/lib/data/petrobangla/computeLiveWeek';
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
import { PbLiveKpiStrip } from './pbLiveKpiStrip';
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
}

export function PetrobanglaLiveWeekPanel({
  selectedDate,
  pgcbGasTotal,
  mode: modeProp,
  hideAudienceToggle = false,
  unified = false,
  underChart = false,
  fillColumn = false,
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
  const [rangeDays, setRangeDays] = useState<LiveWeekPreset>(7);

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

  const weekInsight = unified
    ? `Week ending ${formatLiveWeekDate(kpis.latestDate)}: ${formatNumber(kpis.weekAvgGas, 0)} MMCFD average · ${kpis.powerFulfillmentPct.toFixed(0)}% power fulfillment · ${kpis.lngSharePct.toFixed(0)}% LNG · Bibiyana ${formatNumber(kpis.bibiyanaGas, 0)} MMCFD.`
    : `Week ending ${formatLiveWeekDate(kpis.latestDate)}: National gas averaged ~${formatNumber(kpis.weekAvgGas, 0)} MMCFD with ${formatNumber(kpis.weekVolatility, 1)} MMCFD daily swing. Power plants demanded ~${formatNumber(kpis.powerDemand, 0)} MMCFD but received ~${formatNumber(kpis.powerSupply, 0)} — ${kpis.powerFulfillmentPct.toFixed(0)}% fulfillment. LNG supplied ~${kpis.lngSharePct.toFixed(0)}% of all gas. Bibiyana held at ~${formatNumber(kpis.bibiyanaGas, 0)} MMCFD on ${kpis.bibiyanaWells} wells.`;

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
        <MacroGasWeekSummary kpis={kpis} />
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
          Grid date {selectedDate} is outside this week — see Daily archive below.
        </p>
      )}

      {showKpiStrip && (
        <div
          className={cn(
            'grid-explorer-kpi-strip',
            showAllKpis ? '!grid-cols-2 md:!grid-cols-3 xl:!grid-cols-5' : '!grid-cols-1 max-w-xs',
          )}
        >
          <PbLiveKpiStrip kpis={kpis} showAll={showAllKpis} />
        </div>
      )}

      <div className="flex justify-center w-full">
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
            {formatNumber(pgcbGasTotal, 1)} MMCFD (grid) · {formatNumber(kpis.latestGas, 1)} MMCFD (fields) — different reporting layers.
          </p>
        )}
      </div>

      {!unified && (
        <>
          <GasExplanationBlock
            className="rounded-xl border border-border/30"
            what="Rolling seven official Petrobangla gas-days: national supply, power-sector demand vs allocation, LNG share, Bibiyana output, and plant stress. Analyst and Researcher modes unlock field sparklines, plant tables, and day-over-day compare."
            insight="Short-term volatility in this window often precedes rationing decisions. When power fulfillment drops while LNG share rises, the system is leaning on expensive imports without fully covering electricity-sector demand — a pattern visible across the 2024–2026 archive."
          />
          <GasSourceFooter
            source={
              <>
                <PetrobanglaOfficialSourceLink /> · daily gas intake/offtake reports
              </>
            }
            auditedBy="Petrobangla Production &amp; Marketing Division"
            reportingPeriod={`Live week ending ${kpis.latestDate} · gas-day 8:00 AM → 8:00 AM`}
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