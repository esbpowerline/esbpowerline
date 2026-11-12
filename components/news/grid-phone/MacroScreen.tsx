'use client';

/**
 * Macro Trends, rebuilt for the phone (2026-11-12).
 *
 * Until now the phone hosted the desktop's MacroTrendsTab whole: Recharts
 * composites and desktop cards in 390px. This screen reads the SAME modules
 * the desktop reads (lib/data/macro/**, the PGCB monthly hooks, the BPDB
 * accounts) and applies the same tier window, and redraws each sub-tab for a
 * phone. Sub-tab order is the desktop's. Parts not yet redrawn stay hosted
 * (macro-hosted.tsx) so no figure is lost in the meantime.
 */

import { useEffect, useRef, useState } from 'react';
import '@/app/grid-phone-macro.css';
import { usePgcbMonthlySeries } from '@/lib/data/companies/usePgcbMonthly';
import { systemLossData } from '@/lib/data/macro/system-loss';
import { usePhone } from './context';
import { Prov } from './shared';
import { InfoPill, macroWindow } from './macro-kit';
import { MacroOverview } from './macro-overview';
import { MacroMonthly } from './macro-monthly';
import { MacroPricing } from './macro-pricing';
import { MacroLoss } from './macro-loss';
import { MacroGlobal } from './macro-global';
import { MacroBudget } from './macro-budget';
import { MacroReports } from './macro-reports';
import { MacroInsights } from './macro-insights';
import { HostedReserves, HostedVerification } from './macro-hosted';

export type MacroId = 'overview' | 'budget' | 'monthly' | 'pricing' | 'global' | 'reports' | 'reserves' | 'system_loss' | 'insights' | 'verification';

/** Desktop order and names; `short` is what fits a pill. */
const TABS: { id: MacroId; short: string; label: string }[] = [
  { id: 'overview', short: 'Overview', label: 'Macro Overview' },
  { id: 'monthly', short: 'Monthly archives', label: 'PGCB Monthly Archives' },
  { id: 'reserves', short: 'Gas reserves', label: 'Gas Reserve Depletion' },
  { id: 'pricing', short: 'Pricing & drivers', label: 'Pricing & Drivers' },
  { id: 'global', short: 'Global vs. domestic', label: 'Global vs. Domestic' },
  { id: 'budget', short: 'Budget & infra', label: 'National Budget & Infra' },
  { id: 'reports', short: 'Annual reports', label: 'Annual Reports' },
  { id: 'system_loss', short: 'Glance & losses', label: 'Sector Glance & Losses' },
  { id: 'insights', short: 'Investor insights', label: 'Analyst & Investor Insights' },
  { id: 'verification', short: 'Published vs derived', label: 'Published vs Derived' },
];

export function MacroScreen({ initial = 'overview' }: { initial?: MacroId }) {
  const p = usePhone();
  const [tab, setTab] = useState<MacroId>(initial);
  const win = macroWindow(p.access);
  const { series } = usePgcbMonthlySeries(true);
  const nav = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = nav.current;
    const chip = el?.querySelector<HTMLElement>('.is-on');
    if (el && chip) el.scrollTo({ left: chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [tab]);

  // The banner's arithmetic is the desktop's (MacroTrendsTab.tsx:436-439).
  const activeYears = tab === 'system_loss' ? 5 : win.allowedYears;
  const total = tab === 'system_loss' ? systemLossData.length : series.length;
  const visible = tab === 'system_loss' ? 5 : win.isTruncated ? (win.allowedYears as number) * 12 : series.length;
  const hiddenPct = Math.max(0, Math.round((1 - visible / Math.max(total, visible)) * 100));
  // Petrobangla production as the desktop sums it for Macro (PowerGridExplorer.tsx:663).
  const totalGasSupply = (p.day.gasProductionData ?? []).reduce((a, g) => a + (g.gas || 0), 0);

  return (
    <>
      <div className="gpm-tabs" role="tablist" aria-label="Macro Trends sections" ref={nav}>
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.label} title={t.label} className={tab === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>{t.short}</button>
        ))}
      </div>

      {win.isTruncated && (
        <div className="gpm-notice">
          <b>Historical Preview Mode</b>
          You are viewing a {activeYears}-year preview of the macro trends. {win.isMember ? 'Upgrade your plan' : 'Subscribe'} to unlock the full historical backlog (you are missing {hiddenPct}% of the data spanning 15+ years).
        </div>
      )}

      {tab !== 'verification' && (
        <div className="gpm-pills gpm-pills--top">
          <InfoPill label="What P and D mean here" sub={TABS.find((t) => t.id === tab)?.label}>
            <p>
              <Prov kind="P" /> is a figure stated in an official publication and reproduced unchanged — from any government body, not only the energy agencies: Ministry of Finance budget lines, Power Cell loss statistics, BERC tariff orders, BPC fuel prices, Bangladesh Bank exchange rates, SREDA registries, alongside PGCB, Petrobangla and BPDB.
            </p>
            <p>
              <Prov kind="D" /> is one worked out from those: a gap between two published figures, a share of a total, a currency conversion.
            </p>
            <p>
              <strong>One exception worth knowing:</strong> on Global vs. Domestic the world benchmark series come from international bodies and commodity indexes — the World Bank, OPEC, IRENA and the JKM gas index — rather than from any government. They are marked P because they are published rather than calculated here, but they are not Bangladeshi official statistics and are not verified by one.
            </p>
            <p>
              These are <strong>annual and multi-year series</strong>, not daily readings, so they carry the period their source covers and do not move with the date selected above.
            </p>
          </InfoPill>
        </div>
      )}

      {tab === 'overview' && <MacroOverview win={win} />}
      {tab === 'monthly' && <MacroMonthly win={win} />}
      {tab === 'reserves' && <HostedReserves selectedDate={p.date} systemStatsDate={p.day.systemStats?.date || 'Jun 2026'} pgcbGasTotal={totalGasSupply} />}
      {tab === 'pricing' && <MacroPricing win={win} />}
      {tab === 'global' && <MacroGlobal win={win} />}
      {tab === 'budget' && <MacroBudget win={win} />}
      {tab === 'reports' && <MacroReports win={win} />}
      {tab === 'system_loss' && <MacroLoss win={win} />}
      {tab === 'insights' && <MacroInsights />}
      {tab === 'verification' && <HostedVerification latestGridDay={p.latestDate} />}
    </>
  );
}
