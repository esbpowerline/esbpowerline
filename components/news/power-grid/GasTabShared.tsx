'use client';

import type { ReactNode } from 'react';
import { Database, Droplet, History, Info, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AudienceMode } from '@/lib/data/petrobangla/types';
import {
  AudienceModeToggle,
  PetrobanglaOfficialSourceLink,
} from './petrobangla-archive/PetrobanglaArchiveShared';
import {
  ArchiveBadge,
  DailyBadge,
  GridExplanationBlock,
  GridSourceFooter,
  LiveBadge,
} from './GridExplorerUI';

export { ArchiveBadge, DailyBadge, LiveBadge };

/** Gas tab panels — thin alias preserving `reportingPeriod` prop name */
export function GasSourceFooter({
  source,
  auditedBy,
  reportingPeriod,
  className,
}: {
  source: React.ReactNode;
  auditedBy: string;
  reportingPeriod: string;
  className?: string;
}) {
  return (
    <GridSourceFooter
      source={source}
      auditedBy={auditedBy}
      reporting={reportingPeriod}
      className={className}
    />
  );
}

/** @deprecated Use GridExplanationBlock */
export const GasExplanationBlock = GridExplanationBlock;

export function GasSectorFootnote() {
  return (
    <div className="p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 text-sky-500" /> Gas Sector Acronyms &amp; Units
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-[10px] text-muted-foreground leading-relaxed">
        <div>
          <strong className="text-foreground block font-bold mb-0.5">MMCFD</strong>
          Million Standard Cubic Feet per Day. Standard unit of gas volume flow rate.
        </div>
        <div>
          <strong className="text-foreground block font-bold mb-0.5">BBL (Barrel of Oil)</strong>
          Standard unit of volume for crude oil and petroleum products (1 BBL = 42 US gallons or ~159 liters).
        </div>
        <div>
          <strong className="text-foreground block font-bold mb-0.5">LNG (Liquefied Natural Gas)</strong>
          Natural gas cooled to liquid state (-162°C) for shipping, then regasified back into the grid.
        </div>
        <div>
          <strong className="text-foreground block font-bold mb-0.5">BGFCL / SGFL / BAPEX</strong>
          National gas production state companies (Bangladesh Gas Fields, Sylhet Gas Fields, and BAPEX exploration).
        </div>
        <div>
          <strong className="text-foreground block font-bold mb-0.5">TGTDCL / BGDCL / KGDCL</strong>
          Gas distribution companies (Titas Gas, Bakhrabad Gas, and Karnaphuli Gas Distribution).
        </div>
        <div>
          <strong className="text-foreground block font-bold mb-0.5">RPGCL</strong>
          Rupantarita Prakritik Gas Company Limited, responsible for gas imports and LNG terminal operations.
        </div>
      </div>
    </div>
  );
}

const LAYER_PILLS = [
  { id: 'daily', label: 'Daily Snapshot', badge: DailyBadge, icon: Droplet, tone: 'text-sky-500' },
  { id: 'live', label: 'Live Week', badge: LiveBadge, icon: Layers, tone: 'text-emerald-500' },
  { id: 'archive', label: 'Field Archive', badge: ArchiveBadge, icon: History, tone: 'text-sky-600' },
] as const;

export function GasTabHero({
  systemStatsDate,
  audienceMode,
  onAudienceModeChange,
  showAudienceToggle = true,
  variant = 'gas',
}: {
  systemStatsDate: string;
  audienceMode: AudienceMode;
  onAudienceModeChange: (mode: AudienceMode) => void;
  showAudienceToggle?: boolean;
  variant?: 'gas' | 'macro';
}) {
  const isMacro = variant === 'macro';

  return (
    <div className="grid-explorer-gas-hero card">
      <div className="grid-explorer-gas-hero__head">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="grid-explorer-gas-hero__icon">
            <Database className="h-5 w-5 text-sky-500" />
          </div>
          <div className="min-w-0">
            <h2 className="grid-explorer-gas-hero__title">
              {isMacro ? 'Field Production Archive & Depletion Evidence' : 'Gas & LNG Intelligence Stack'}
            </h2>
            <p className="grid-explorer-gas-hero__sub">
              {isMacro ? (
                <>
                  Verified Petrobangla daily reports — rolling live week plus 2,000+ day archive — showing how domestic output, LNG imports, and power-sector rationing evolve as recoverable reserves shrink toward 2033–2037 exhaustion scenarios above.
                  Reporting window: <span className="text-sky-500 font-semibold">8:00 AM → 8:00 AM gas-day</span>
                  {systemStatsDate ? <> · Grid report <span className="font-semibold text-foreground">{systemStatsDate}</span></> : null}
                </>
              ) : (
                <>
                  Three official Petrobangla layers — PGCB daily tables, rolling 7-day live week, and a 2,000+ day field archive — unified under the grid date selector above.
                  Reporting window: <span className="text-sky-500 font-semibold">8:00 AM → 8:00 AM gas-day</span>
                  {systemStatsDate ? <> · Grid report <span className="font-semibold text-foreground">{systemStatsDate}</span></> : null}
                </>
              )}
            </p>
          </div>
        </div>
        {showAudienceToggle && (
          <div className="grid-explorer-gas-hero__modes shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Audience mode
            </span>
            <AudienceModeToggle mode={audienceMode} onChange={onAudienceModeChange} />
          </div>
        )}
      </div>

      <div className="grid-explorer-gas-layer-pills">
        {LAYER_PILLS.filter((layer) => !isMacro || layer.id !== 'daily').map((layer) => {
          const Badge = layer.badge;
          const Icon = layer.icon;
          return (
            <div key={layer.id} className="grid-explorer-gas-layer-pill">
              <Icon className={cn('h-3.5 w-3.5 shrink-0', layer.tone)} />
              <span className="font-semibold text-foreground">{layer.label}</span>
              <Badge />
            </div>
          );
        })}
      </div>

      <p className="grid-explorer-gas-hero__note">
        <Info className="h-3.5 w-3.5 text-sky-500 shrink-0 inline-block mr-1.5 -mt-px align-middle" />
        {isMacro ? (
          <>
            Tcf reserve forecasts above are basin-level estimates; this archive is day-by-day proof of declining field output and rising LNG dependency. Official reports from{' '}
            <PetrobanglaOfficialSourceLink className="text-[11px]" />.
          </>
        ) : (
          <>
            PGCB grid totals and Petrobangla field totals use different reporting layers. Daily tables mirror the PGCB daily record; Live Week and Archive are authoritative for field, plant, and sector detail from{' '}
            <PetrobanglaOfficialSourceLink className="text-[11px]" />.
          </>
        )}
      </p>
    </div>
  );
}

export function GasSectionRail({
  icon: Icon,
  title,
  subtitle,
  badge,
  id,
}: {
  icon: typeof Droplet;
  title: string;
  subtitle: string;
  badge: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="grid-explorer-gas-rail">
      <div className="grid-explorer-gas-rail__icon">
        <Icon className="h-4 w-4 text-sky-500" />
      </div>
      <div className="min-w-0">
        <h3 className="grid-explorer-gas-rail__title">
          {title}
          {badge}
        </h3>
        <p className="grid-explorer-gas-rail__sub">{subtitle}</p>
      </div>
    </div>
  );
}