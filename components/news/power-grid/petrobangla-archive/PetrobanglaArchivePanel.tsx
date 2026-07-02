'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  computeArchiveKpis,
  latestOkDate,
  resolveArchiveGasDay,
} from '@/lib/data/petrobangla/compute';
import { loadArchiveDay } from '@/lib/data/petrobangla/loadArchive';
import { usePetrobanglaBootstrap } from '../PetrobanglaBootstrap';
import { ARCHIVE_INSIGHTS, ARCHIVE_START_DATE } from '@/lib/data/petrobangla/constants';
import type { AudienceMode, PetrobanglaDaily } from '@/lib/data/petrobangla/types';
import {
  ArchiveInsightCallout,
  ArchiveSyncNotice,
  AudienceModeToggle,
  PetrobanglaOfficialSourceLink,
} from './PetrobanglaArchiveShared';
import { ArchiveBadge, GasExplanationBlock, GasSourceFooter } from '../GasTabShared';
import { GasReserveArchiveContext } from '../GasReserveArchiveContext';
import { GasReserveArchiveViewTabs, type ArchiveStoryView } from '../GasReserveArchiveViewTabs';
import { PetrobanglaArchiveKpiStrip } from './PetrobanglaArchiveKpiStrip';
import { PetrobanglaArchiveNationalTimeline } from './PetrobanglaArchiveNationalTimeline';
import { PetrobanglaArchiveFieldCards } from './PetrobanglaArchiveFieldCards';
import { PetrobanglaArchivePowerGap } from './PetrobanglaArchivePowerGap';
import { PetrobanglaArchiveSectorDistribution } from './PetrobanglaArchiveSectorDistribution';
import { PetrobanglaArchiveCompare } from './PetrobanglaArchiveCompare';

interface PetrobanglaArchivePanelProps {
  /** Grid backlog date (year/month/day selector at top of explorer) */
  selectedDate: string;
  systemStatsDate?: string;
  mode?: AudienceMode;
  hideAudienceToggle?: boolean;
  /** Embedded inside the unified macro depletion card — no nested card chrome */
  unified?: boolean;
  depletionEmbed?: boolean;
}

export function PetrobanglaArchivePanel({
  selectedDate,
  systemStatsDate,
  mode: modeProp,
  hideAudienceToggle = false,
  unified = false,
  depletionEmbed = false,
}: PetrobanglaArchivePanelProps) {
  const { index, timeline, loading, error: bootstrapError } = usePetrobanglaBootstrap();
  const [selectedDay, setSelectedDay] = useState<PetrobanglaDaily | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [internalMode, setInternalMode] = useState<AudienceMode>('simple');
  const mode = modeProp ?? internalMode;
  const [activeView, setActiveView] = useState<ArchiveStoryView>('timeline');
  const chartsReady = true;
  const error = bootstrapError;

  const archiveResolution = useMemo(() => {
    if (!index) return { resolved: null as string | null, exact: false };
    return resolveArchiveGasDay(selectedDate, index);
  }, [index, selectedDate]);

  const latestArchiveDate = index ? latestOkDate(index) : '';

  useEffect(() => {
    const archiveDate = archiveResolution.resolved;
    if (!archiveDate) {
      setSelectedDay(null);
      return;
    }
    let cancelled = false;
    setDayLoading(true);
    loadArchiveDay(archiveDate, { allowPartial: mode === 'analyst' })
      .then((d) => {
        if (!cancelled) setSelectedDay(d);
      })
      .catch(() => {
        if (!cancelled) setSelectedDay(null);
      })
      .finally(() => {
        if (!cancelled) setDayLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [archiveResolution.resolved, mode]);

  const shellClass = unified ? '' : 'grid-explorer-chart-card card p-8';

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center gap-3 min-h-[120px]', shellClass)}>
        <Loader2 className={cn('animate-spin text-primary', unified ? 'h-5 w-5' : 'h-6 w-6')} />
        <span className="text-sm text-muted-foreground">
          Loading archive ({ARCHIVE_INSIGHTS.coverageDays.toLocaleString()} days)…
        </span>
      </div>
    );
  }

  if (error || !index || !timeline) {
    return (
      <div className={cn('text-center text-sm text-muted-foreground', shellClass || 'py-6')}>
        Archive unavailable: {error ?? 'missing data'}
      </div>
    );
  }

  if (!archiveResolution.resolved) {
    return (
      <div className={cn('flex flex-col items-center justify-center text-center', shellClass || 'py-8')}>
        <p className="text-xs text-muted-foreground max-w-md">
          No archive for <strong>{selectedDate}</strong>. Coverage starts {ARCHIVE_START_DATE} — use the date selector above.
        </p>
      </div>
    );
  }

  if (dayLoading || !selectedDay) {
    return (
      <div className={cn('flex items-center justify-center gap-3 min-h-[100px]', shellClass)}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading {archiveResolution.resolved}…</span>
      </div>
    );
  }

  const kpis = computeArchiveKpis(selectedDay, timeline, index);
  const archiveDate = archiveResolution.resolved;

  const anchorLine = (
    <>
      <strong>Verified anchors:</strong> Peak {timeline.peak ? `${timeline.peak.gas.toFixed(1)} MMCFD (${timeline.peak.date})` : '—'} ·
      Low {timeline.low ? `${timeline.low.gas.toFixed(1)} MMCFD (${timeline.low.date})` : '—'} ·
      Jan 2020 {ARCHIVE_INSIGHTS.jan2020Baseline.gas} MMCFD → Jun 2026 {ARCHIVE_INSIGHTS.jun2026Latest.gas} MMCFD ({ARCHIVE_INSIGHTS.nationalDecline.pct}%).
    </>
  );

  const body = (
    <div className={cn('gas-reserve-archive-panel', !unified && 'p-4', depletionEmbed && 'gas-reserve-archive-panel--embed')}>
      {unified ? (
        <GasReserveArchiveContext
          gridDate={selectedDate}
          archiveDate={archiveDate}
          exact={archiveResolution.exact}
          summary={selectedDay.meta.agent_summary}
          peakGas={timeline.peak?.gas}
          peakDate={timeline.peak?.date}
          lowGas={timeline.low?.gas}
          lowDate={timeline.low?.date}
          declinePct={ARCHIVE_INSIGHTS.nationalDecline.pct}
        />
      ) : null}

      {!unified ? (
        <>
          <ArchiveSyncNotice
            gridDate={selectedDate}
            archiveDate={archiveDate}
            exact={archiveResolution.exact}
            latestArchiveDate={latestArchiveDate}
          />
          {selectedDay.meta.agent_summary && (
            <p className="text-[11px] text-muted-foreground italic leading-relaxed">
              {selectedDay.meta.agent_summary}
            </p>
          )}
          <ArchiveInsightCallout>{anchorLine}</ArchiveInsightCallout>
        </>
      ) : null}

        <div className="gas-reserve-archive-kpi-row">
          <div className="grid-explorer-kpi-strip relative z-30 !grid-cols-2 md:!grid-cols-3 xl:!grid-cols-6">
            <PetrobanglaArchiveKpiStrip
              kpis={kpis}
              mode={mode}
              archiveDate={archiveDate}
              gridDate={selectedDate}
              exactMatch={archiveResolution.exact}
              peakGas={timeline.peak?.gas}
              peakDate={timeline.peak?.date}
            />
          </div>
        </div>

        {!unified && (
          <p className="text-[10px] text-muted-foreground/70">
            {archiveResolution.exact
              ? `Synced to grid date ${selectedDate}`
              : `Showing gas-day ${archiveDate} (nearest to ${selectedDate})`}
            {' '}· 8:00 AM → 8:00 AM
          </p>
        )}

        <div className="gas-reserve-archive-explorer">
          <GasReserveArchiveViewTabs active={activeView} onChange={setActiveView} />

          <div className="gas-reserve-archive-view-shell">
            <div className="gas-reserve-archive-view-shell__inner">
          {activeView === 'timeline' && (
            <PetrobanglaArchiveNationalTimeline timeline={timeline} mode={mode} chartsReady={chartsReady} embedded compact={unified} />
          )}
          {activeView === 'fields' && (
            <PetrobanglaArchiveFieldCards timeline={timeline} latestDay={selectedDay} mode={mode} embedded compact={unified} />
          )}
          {activeView === 'power-gap' && (
            <PetrobanglaArchivePowerGap timeline={timeline} selectedDay={selectedDay} mode={mode} chartsReady={chartsReady} embedded compact={unified} />
          )}
          {activeView === 'sectors' && (
            <PetrobanglaArchiveSectorDistribution timeline={timeline} chartsReady={chartsReady} embedded compact={unified} />
          )}
          {activeView === 'compare' && (
            <PetrobanglaArchiveCompare
              index={index}
              latestDate={latestArchiveDate}
              gridSelectedDate={selectedDate}
              mode={mode}
              embedded
              compact={unified}
            />
          )}
            </div>
          </div>
        </div>

        {!unified && (
          <>
            <GasExplanationBlock
              className="rounded-xl border border-border/30 -mx-0"
              what="Full Petrobangla archive with field-level production, plant intake/offtake, sector allocation, and national timeline since January 2020. Five story views — timeline, field lifelines, power gas gap, sector distribution, and day compare — all keyed to the grid date selector."
              insight={`National gas fell from ${ARCHIVE_INSIGHTS.jan2020Baseline.gas} MMCFD (Jan 2020) to ~${ARCHIVE_INSIGHTS.jun2026Latest.gas} MMCFD (${ARCHIVE_INSIGHTS.jun2026Latest.date}), a ${Math.abs(ARCHIVE_INSIGHTS.nationalDecline.pct)}% decline while LNG share expanded. Power-sector fulfillment collapsed from ${ARCHIVE_INSIGHTS.powerFulfillmentCollapse.from}% to ${ARCHIVE_INSIGHTS.powerFulfillmentCollapse.to}%, signalling structural rationing.`}
            />
            <GasSourceFooter
              source={
                <>
                  <PetrobanglaOfficialSourceLink /> · {ARCHIVE_INSIGHTS.coverageDays.toLocaleString()} verified gas-days
                </>
              }
              auditedBy="Petrobangla Production &amp; Marketing Division"
              reportingPeriod={`Archive gas-day ${archiveDate} · through ${latestArchiveDate}`}
            />
          </>
        )}
      </div>
  );

  if (unified) return body;

  return (
    <div className="grid-explorer-chart-card card">
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
        <Database className="h-5 w-5 text-sky-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="grid-explorer-chart-card__title">
            Petrobangla Daily Archive
            <ArchiveBadge />
          </h3>
          <p className="grid-explorer-chart-card__sub">
            Field &amp; plant-level official reports · {ARCHIVE_INSIGHTS.coverageDays.toLocaleString()} gas-days through{' '}
            <span className="text-sky-500 font-semibold">{latestArchiveDate}</span>
            {systemStatsDate ? <> · Grid report {systemStatsDate}</> : null}
          </p>
        </div>
        {!hideAudienceToggle && <AudienceModeToggle mode={mode} onChange={setInternalMode} />}
      </div>
      {body}
    </div>
  );
}