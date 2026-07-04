'use client';

import { useState } from 'react';
import { Database } from 'lucide-react';
import type { AudienceMode } from '@/lib/data/petrobangla/types';
import { ARCHIVE_INSIGHTS } from '@/lib/data/petrobangla/constants';
import { PetrobanglaArchivePanel } from './petrobangla-archive/PetrobanglaArchivePanel';
import { PetrobanglaLiveWeekPanel } from './petrobangla-live/PetrobanglaLiveWeekPanel';
import { PetrobanglaBootstrapProvider } from './PetrobanglaBootstrap';
import { AudienceModeToggle, PetrobanglaOfficialSourceLink } from './petrobangla-archive/PetrobanglaArchiveShared';
import { GasExplanationBlock, GasSourceFooter, LiveBadge } from './GasTabShared';
import { MacroGasInnerSection } from './MacroGasSectionChrome';

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
            title="This week"
            badge={<LiveBadge />}
            subtitle={
              audienceMode === 'simple'
                ? 'Last 7–30 gas-days — national supply vs power plant allocation'
                : audienceMode === 'investor'
                  ? 'Short-window volatility — power fulfillment and LNG share drive fuel-cost risk'
                  : audienceMode === 'researcher'
                    ? 'Rolling window with raw JSON links — 7 / 15 / 30 day presets'
                    : 'Rolling gas-days — sparklines, plant stress, and day-over-day compare'
            }
          >
            <PetrobanglaLiveWeekPanel
              selectedDate={selectedDate}
              pgcbGasTotal={pgcbGasTotal}
              mode={audienceMode}
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
          <GasExplanationBlock
            what={<>Seven-day live window plus full archive from January 2020. Use the date selector above to inspect any gas-day — field output, plant allocation, and sector splits. • <span className="text-primary font-semibold text-xs">Tracked since Jan 2020</span></>}
            insight="Domestic output is declining, LNG is filling the gap, and power plants receive roughly 40% of requested gas — the pattern the reserve depletion curve projects forward."
          />
          <GasSourceFooter
            source={<PetrobanglaOfficialSourceLink />}
            auditedBy="Petrobangla Production &amp; Marketing Division"
            reportingPeriod={`Field archive · grid date ${selectedDate}`}
          />
        </div>
      </div>
      </PetrobanglaBootstrapProvider>
    </section>
  );
}