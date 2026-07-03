'use client';

import { useMemo, useState } from 'react';
import { Droplet, Loader2 } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { computeLiveWeekKpis } from '@/lib/data/petrobangla/computeLiveWeek';
import {
  formatLiveWeekDate,
  isDateInLiveWeek,
  LIVE_WEEK_COUNT,
  LIVE_WEEK_PRESETS,
  sliceLiveWeekBundle,
  type LiveWeekPreset,
} from '@/lib/data/petrobangla/getLiveWeek';
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
  const { liveWeek: bundle, loading } = usePetrobanglaBootstrap();
  const [internalMode, setInternalMode] = useState<AudienceMode>('simple');
  const mode = modeProp ?? internalMode;
  const chartsReady = true;
  const [rangeDays, setRangeDays] = useState<LiveWeekPreset>(7);

  const activeBundle = useMemo(() => {
    if (!bundle?.days.length) return null;
    return sliceLiveWeekBundle(bundle, rangeDays);
  }, [bundle, rangeDays]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center gap-3 min-h-[120px]', !unified && 'grid-explorer-chart-card card p-8')}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading gas-days…</span>
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

      <div className="gas-reserve-live-week-range" role="group" aria-label="Live window">
        {LIVE_WEEK_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setRangeDays(preset)}
            className={cn(
              'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle',
              rangeDays === preset && 'gas-reserve-archive-range__btn--active',
            )}
          >
            {preset}D
          </button>
        ))}
      </div>

      <div className={cn(fillColumn && 'gas-reserve-live-week__chart-wrap')}>
        <PbLiveTimeline
          bundle={activeBundle}
          chartsReady={chartsReady}
          highlightDate={inWeek ? selectedDate : undefined}
          compact={unified}
          fillHeight={fillColumn}
        />
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
            Latest {LIVE_WEEK_COUNT} Gas-Days
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