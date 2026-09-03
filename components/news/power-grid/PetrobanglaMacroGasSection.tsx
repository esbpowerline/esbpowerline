'use client';

import { useMemo, useState } from 'react';
import { Database } from 'lucide-react';
import type { AudienceMode } from '@/lib/data/petrobangla/types';
import { ARCHIVE_INSIGHTS } from '@/lib/data/petrobangla/constants';
import { PetrobanglaArchivePanel } from './petrobangla-archive/PetrobanglaArchivePanel';
import { PetrobanglaLiveWeekPanel, LiveWeekRangeToolbar } from './petrobangla-live/PetrobanglaLiveWeekPanel';
import { PetrobanglaBootstrapProvider, usePetrobanglaBootstrap } from './PetrobanglaBootstrap';
import { AudienceModeToggle, PetrobanglaOfficialSourceLink } from './petrobangla-archive/PetrobanglaArchiveShared';
import { GasExplanationBlock, GasSourceFooter, LatestBadge } from './GasTabShared';
import { MacroGasInnerSection } from './MacroGasSectionChrome';
import { LIVE_WEEK_RANGE_OPTIONS, type LiveWeekPreset } from '@/lib/data/petrobangla/getLiveWeek';

interface Props {
  selectedDate: string;
  systemStatsDate: string;
  pgcbGasTotal?: number;
  embedded?: boolean;
  hideLiveWeek?: boolean;
  audienceMode?: AudienceMode;
  onAudienceModeChange?: (mode: AudienceMode) => void;
}

export function PetrobanglaMacroGasSection({
  selectedDate,
  systemStatsDate,
  pgcbGasTotal,
  embedded = false,
  hideLiveWeek = false,
  audienceMode: audienceModeProp,
  onAudienceModeChange,
}: Props) {
  const [internalMode, setInternalMode] = useState<AudienceMode>('simple');
  const audienceMode = audienceModeProp ?? internalMode;
  const setAudienceMode = onAudienceModeChange ?? setInternalMode;

  const [rangeDays, setRangeDays] = useState<LiveWeekPreset>(7);

  const rangeOption = LIVE_WEEK_RANGE_OPTIONS.find((o) => o.days === rangeDays);
  const rangeLabel = rangeOption ? rangeOption.label : '1W';

  const rangeTitleMap: Record<string, string> = {
    '1W': 'Rolling week',
    '1M': 'Rolling month',
    '6M': 'Rolling six months',
    '1Y': 'Rolling year',
    '3Y': 'Rolling three years',
    'All': 'Full timeline',
  };
  const blockTitle = rangeTitleMap[rangeLabel] ?? 'Rolling week';

  const rangeDescriptionMap: Record<string, string> = {
    '1W': 'Last 7 gas-days',
    '1M': 'Last 30 gas-days',
    '6M': 'Last 180 gas-days',
    '1Y': 'Last 365 gas-days',
    '3Y': 'Last 1,095 gas-days',
    'All': 'Full archive timeline',
  };
  const rangeDesc = rangeDescriptionMap[rangeLabel] ?? 'Last 7 gas-days';

  const shellClass = embedded
    ? 'card gas-reserve-evidence'
    : 'grid-explorer-chart-card card pt-4 border-t border-border/40';

  return (
    <section className={shellClass}>
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border gas-reserve-evidence__head">
        <Database className="h-5 w-5 text-sky-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="grid-explorer-chart-card__title">Field evidence</h3>
          <p className="grid-explorer-chart-card__sub max-w-2xl">
            Official Petrobangla daily reports — field, plant, and sector detail behind the reserve curve.
          </p>
          <p className="gas-reserve-evidence__meta">
            {ARCHIVE_INSIGHTS.coverageDays.toLocaleString()} days since Jan 2020
            <span className="text-border">·</span>
            Gas-day 8:00 AM–8:00 AM
            {systemStatsDate && (
              <>
                <span className="text-border">·</span>
                Grid {systemStatsDate}
              </>
            )}
          </p>
        </div>
        <div className="gas-reserve-evidence__mode shrink-0">
          <span className="gas-reserve-evidence__mode-label">View as</span>
          <AudienceModeToggle mode={audienceMode} onChange={setAudienceMode} />
        </div>
      </div>

      <PetrobanglaBootstrapProvider>
      <div className="gas-reserve-evidence__body">
        {!hideLiveWeek && (
          <MacroGasInnerSection
            icon={Database}
            title={blockTitle}
            badge={<LatestBadge />}
            subtitle={
              audienceMode === 'simple'
                ? `${rangeDesc} — national supply vs power plant allocation`
                : audienceMode === 'investor'
                  ? `${rangeLabel} volatility — power fulfillment and LNG share drive fuel-cost risk`
                  : audienceMode === 'researcher'
                    ? `Rolling window with raw JSON links — ${rangeLabel} preset view`
                    : `Rolling gas-days (${rangeLabel}) — sparklines, plant stress, and day-over-day compare`
            }
            toolbar={
              <LiveWeekRangeToolbar
                rangeDays={rangeDays}
                setRangeDays={setRangeDays}
              />
            }
          >
            <PetrobanglaLiveWeekPanel
              selectedDate={selectedDate}
              pgcbGasTotal={pgcbGasTotal}
              mode={audienceMode}
              rangeDays={rangeDays}
              onRangeDaysChange={setRangeDays}
              unified
            />
          </MacroGasInnerSection>
        )}

        <PetrobanglaArchivePanel
          selectedDate={selectedDate}
          systemStatsDate={systemStatsDate}
          mode={audienceMode}
          unified
          depletionEmbed={embedded}
        />

        <div className="gas-reserve-evidence__notes">
          <MacroGasFieldEvidenceNote />
          <GasSourceFooter
            source={<PetrobanglaOfficialSourceLink />}
            attribution="As published. Not independently audited."
            reportingPeriod={`Field archive · grid date ${selectedDate}`}
          />
        </div>
      </div>
      </PetrobanglaBootstrapProvider>
    </section>
  );
}

/**
 * The fulfilment share used to be the fixed phrase "roughly 40%". Measured over
 * the archive it is 38.0% across the last year but 33.0% across the last 30
 * days, so the fixed wording quietly overstated a falling number. Read live.
 *
 * Must sit inside PetrobanglaBootstrapProvider — the hook throws without it.
 */
function MacroGasFieldEvidenceNote() {
  const { timeline } = usePetrobanglaBootstrap();
  const pct = useMemo(() => {
    const rows = (timeline?.days ?? []).filter(
      (d) => d.parse_status === 'ok' && !d.quarantined && d.power_fulfillment_pct,
    );
    if (rows.length < 30) return null;
    const last30 = rows.slice(-30);
    return last30.reduce((sum, d) => sum + (d.power_fulfillment_pct ?? 0), 0) / last30.length;
  }, [timeline]);

  return (
    <GasExplanationBlock
      what={<>Seven-day live window plus full archive from January 2020. Use the date selector above to inspect any gas-day — field output, plant allocation, and sector splits. • <span className="text-primary font-semibold text-xs">Tracked since Jan 2020</span></>}
      insight={`Domestic output is declining, LNG is filling the gap, and power plants receive ${
        pct != null ? `about ${pct.toFixed(0)}%` : 'well under half'
      } of the gas they ask for, averaged over the last 30 gas-days — the pattern the reserve depletion curve projects forward.`}
    />
  );
}
