'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  computeArchiveKpis,
  computeArchiveKpisPreview,
  latestOkDate,
  resolveArchiveGasDay,
} from '@/lib/data/petrobangla/compute';
import {
  filterTimelineByPreset,
  type ArchiveRangePreset,
} from '@/lib/data/petrobangla/archiveRange';
import { loadArchiveDay, lookupIndexDay } from '@/lib/data/petrobangla/loadArchive';
import { usePetrobanglaBootstrap } from '../PetrobanglaBootstrap';
import { ARCHIVE_INSIGHTS, ARCHIVE_PEAK, ARCHIVE_START_DATE } from '@/lib/data/petrobangla/constants';
import type { AudienceMode, PetrobanglaDaily } from '@/lib/data/petrobangla/types';
import {
  ArchiveInsightCallout,
  ArchiveRangeToolbar,
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

const TIMELINE_VIEWS = new Set<ArchiveStoryView>(['timeline', 'fields', 'power-gap', 'sectors']);

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
  const {
    index,
    timeline,
    archiveLoading,
    timelineLoading,
    error: bootstrapError,
    ensureTimeline,
  } = usePetrobanglaBootstrap();
  const [selectedDay, setSelectedDay] = useState<PetrobanglaDaily | null>(null);
  const [internalMode, setInternalMode] = useState<AudienceMode>('simple');
  const mode = modeProp ?? internalMode;
  const [activeView, setActiveView] = useState<ArchiveStoryView>('timeline');
  const [rangePreset, setRangePreset] = useState<ArchiveRangePreset>('1W');
  const [showMa, setShowMa] = useState(false);
  const chartsReady = true;
  const error = bootstrapError;

  const archiveResolution = useMemo(() => {
    if (!index) return { resolved: null as string | null, exact: false };
    return resolveArchiveGasDay(selectedDate, index);
  }, [index, selectedDate]);

  const latestArchiveDate = index ? latestOkDate(index) : '';

  useEffect(() => {
    if (TIMELINE_VIEWS.has(activeView)) {
      void ensureTimeline();
    }
  }, [activeView, ensureTimeline]);

  useEffect(() => {
    if (mode === 'analyst') setShowMa(true);
  }, [mode]);

  useEffect(() => {
    void loadArchiveDay(selectedDate, { allowPartial: true }).catch(() => {});
  }, [selectedDate]);

  useEffect(() => {
    const archiveDate = archiveResolution.resolved;
    if (!archiveDate) {
      setSelectedDay(null);
      return;
    }
    let cancelled = false;
    setSelectedDay(null);
    loadArchiveDay(archiveDate, { allowPartial: mode === 'analyst' })
      .then((d) => {
        if (!cancelled) setSelectedDay(d);
      })
      .catch(() => {
        if (!cancelled) setSelectedDay(null);
      });
    return () => {
      cancelled = true;
    };
  }, [archiveResolution.resolved, mode]);

  const rangeEnd = archiveResolution.resolved ?? '';

  const chartRangeDays = useMemo(() => {
    if (!timeline || !rangeEnd) return [];
    return filterTimelineByPreset(timeline.days, rangePreset, rangeEnd, { decimate: true });
  }, [timeline, rangePreset, rangeEnd]);

  const fieldRangeDays = useMemo(() => {
    if (!timeline || !rangeEnd) return [];
    return filterTimelineByPreset(timeline.days, rangePreset, rangeEnd, { decimate: false, maxPoints: 800 });
  }, [timeline, rangePreset, rangeEnd]);

  const shellClass = unified ? '' : 'grid-explorer-chart-card card p-8';

  if (archiveLoading) {
    return (
      <div className={cn('flex items-center justify-center gap-3 min-h-[120px]', shellClass)}>
        <Loader2 className={cn('animate-spin text-primary', unified ? 'h-5 w-5' : 'h-6 w-6')} />
        <span className="text-sm text-muted-foreground">
          Loading field archive index…
        </span>
      </div>
    );
  }

  if (error || !index) {
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

  const archiveDate = archiveResolution.resolved;
  const indexDay = lookupIndexDay(archiveDate);
  const kpis = selectedDay
    ? computeArchiveKpis(selectedDay)
    : indexDay
      ? computeArchiveKpisPreview(indexDay)
      : null;
  const kpisPreview = !selectedDay && !!indexDay;
  const peakAnchor = timeline?.peak ?? ARCHIVE_PEAK;

  const anchorLine = (
    <>
      <strong>Verified anchors:</strong> Peak {`${peakAnchor.gas.toFixed(1)} MMCFD (${peakAnchor.date})`}
      {timeline?.low ? (
        <> · Low {timeline.low.gas.toFixed(1)} MMCFD ({timeline.low.date})</>
      ) : null}
      {' '}· Jan 2020 {ARCHIVE_INSIGHTS.jan2020Baseline.gas} MMCFD → Jun 2026 {ARCHIVE_INSIGHTS.jun2026Latest.gas} MMCFD ({ARCHIVE_INSIGHTS.nationalDecline.pct}%).
    </>
  );

  const body = (
    <div className={cn('gas-reserve-archive-panel', !unified && 'p-4', depletionEmbed && 'gas-reserve-archive-panel--embed')}>
      {unified ? (
        <GasReserveArchiveContext
          gridDate={selectedDate}
          archiveDate={archiveDate}
          exact={archiveResolution.exact}
          summary={selectedDay?.meta.agent_summary}
          peakGas={peakAnchor.gas}
          peakDate={peakAnchor.date}
          lowGas={timeline?.low?.gas}
          lowDate={timeline?.low?.date}
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
          {selectedDay?.meta.agent_summary && (
            <p className="text-[11px] text-muted-foreground italic leading-relaxed">
              {selectedDay.meta.agent_summary}
            </p>
          )}
          <ArchiveInsightCallout>{anchorLine}</ArchiveInsightCallout>
        </>
      ) : null}

        <div className="gas-reserve-archive-kpi-row">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Petrobangla Gas Analytics
            </span>
            <sup className="text-sky-500 font-extrabold text-[9px] select-none">
              since 2020
            </sup>
          </div>
          {kpis ? (
            <div className="grid-explorer-kpi-strip relative z-30 !grid-cols-2 md:!grid-cols-3 xl:!grid-cols-6">
              <PetrobanglaArchiveKpiStrip
                kpis={kpis}
                mode={mode}
                archiveDate={archiveDate}
                gridDate={selectedDate}
                exactMatch={archiveResolution.exact}
                peakGas={peakAnchor.gas}
                peakDate={peakAnchor.date}
                preview={kpisPreview}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 min-h-[4.5rem] px-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              Loading archive index…
            </div>
          )}
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
            timeline && !timelineLoading ? (
              <PetrobanglaArchiveNationalTimeline
                timeline={timeline}
                rangeDays={chartRangeDays}
                preset={rangePreset}
                chartsReady={chartsReady}
                showMa={showMa}
                embedded
                compact={unified}
                rangeToolbar={
                  <ArchiveRangeToolbar
                    preset={rangePreset}
                    onPresetChange={setRangePreset}
                    mode={mode}
                    showMaToggle={true}
                    showMa={showMa}
                    onToggleMa={() => setShowMa((v) => !v)}
                  />
                }
                onClose={() => setRangePreset('1W')}
              />
            ) : (
              <div className="flex items-center justify-center gap-3 min-h-[16rem] rounded-xl border border-border/40 bg-muted/10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading national timeline…</span>
              </div>
            )
          )}
          {activeView === 'fields' && (
            timeline && !timelineLoading ? (
              <PetrobanglaArchiveFieldCards
                rangeDays={fieldRangeDays}
                preset={rangePreset}
                latestDay={selectedDay}
                mode={mode}
                embedded
                compact={unified}
                rangeToolbar={
                  <ArchiveRangeToolbar
                    preset={rangePreset}
                    onPresetChange={setRangePreset}
                    mode={mode}
                  />
                }
                onClose={() => setRangePreset('1W')}
              />
            ) : (
              <div className="flex items-center justify-center gap-3 min-h-[12rem] text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading field lifelines…
              </div>
            )
          )}
          {activeView === 'power-gap' && (
            timeline && !timelineLoading ? (
              <PetrobanglaArchivePowerGap
                rangeDays={chartRangeDays}
                preset={rangePreset}
                selectedDay={selectedDay}
                mode={mode}
                chartsReady={chartsReady}
                embedded
                compact={unified}
                rangeToolbar={
                  <ArchiveRangeToolbar
                    preset={rangePreset}
                    onPresetChange={setRangePreset}
                    mode={mode}
                  />
                }
                onClose={() => setRangePreset('1W')}
              />
            ) : (
              <div className="flex items-center justify-center gap-3 min-h-[12rem] text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading power gap view…
              </div>
            )
          )}
          {activeView === 'sectors' && (
            timeline && !timelineLoading ? (
              <PetrobanglaArchiveSectorDistribution
                rangeDays={chartRangeDays}
                preset={rangePreset}
                chartsReady={chartsReady}
                embedded
                compact={unified}
                rangeToolbar={
                  <ArchiveRangeToolbar
                    preset={rangePreset}
                    onPresetChange={setRangePreset}
                    mode={mode}
                  />
                }
                onClose={() => setRangePreset('1W')}
              />
            ) : (
              <div className="flex items-center justify-center gap-3 min-h-[12rem] text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading sector distribution…
              </div>
            )
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
              what="Full Petrobangla archive with field-level production, plant intake/offtake, sector allocation, and national timeline since January 2020. Five story views — timeline, field lifelines, power gas gap, sector distribution, and day compare — all keyed to the grid date selector."
              insight={`National gas fell from ${ARCHIVE_INSIGHTS.jan2020Baseline.gas} MMCFD (Jan 2020) to ~${ARCHIVE_INSIGHTS.jun2026Latest.gas} MMCFD (${ARCHIVE_INSIGHTS.jun2026Latest.date}), a ${Math.abs(ARCHIVE_INSIGHTS.nationalDecline.pct)}% decline while LNG share expanded. Power-sector fulfillment collapsed from ${ARCHIVE_INSIGHTS.powerFulfillmentCollapse.from}% to ${ARCHIVE_INSIGHTS.powerFulfillmentCollapse.to}%, signalling structural rationing.`}
            />
            <GasSourceFooter
              source={
                <>
                  <PetrobanglaOfficialSourceLink /> · {ARCHIVE_INSIGHTS.coverageDays.toLocaleString()} verified gas-days
                </>
              }
              attribution="As published. Not independently audited."
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