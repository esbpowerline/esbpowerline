'use client';

import { Database, Droplet, Info } from 'lucide-react';
import type { GasDistributionItem, GasProductionItem } from '@/lib/data/grid/types';
import { formatNumber } from '@/lib/utils';
import { GridLockedContent } from './GridLockedContent';
import { GridCardFooter } from './GridExplorerUI';

interface GasTabProps {
  selectedDate: string;
  systemStatsDate: string;
  gasProductionData: GasProductionItem[];
  gasDistributionData: GasDistributionItem[];
  totalGasSupply: number;
  totalCondensate: number;
  isLocked?: boolean;
  requiredTier?: string;
  onTryDemo?: () => void;
}

export function GasTab({
  selectedDate,
  systemStatsDate,
  gasProductionData,
  gasDistributionData,
  totalGasSupply,
  totalCondensate,
  isLocked,
  requiredTier,
  onTryDemo,
}: GasTabProps) {
  if (selectedDate < '2020-01-12') {
    return (
      <div className="grid-explorer-panel space-y-6">
        <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
            <Info className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-foreground mb-2">Petrobangla Gas Production &amp; Distribution Data</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            No official records are available for the selected date. Petrobangla gas production tracking officially started on January 12, 2020.
          </p>
          <div className="mt-4 text-[10px] text-muted-foreground">Official Backlog Start Date: January 12, 2020</div>
        </div>
      </div>
    );
  }

  if (!gasProductionData.length) {
    return (
      <div className="grid-explorer-panel space-y-6">
        <div className="grid-explorer-chart-card card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
            <Info className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-foreground mb-2">Petrobangla Gas &amp; LNG Supply</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            PGCB grid data is available for this date, but Petrobangla production and distribution tables are missing from the daily record. Re-run the official ingest when Petrobangla reports are online.
          </p>
        </div>
      </div>
    );
  }

  const totalActiveFields = gasProductionData.reduce((sum, item) => sum + (item.fields || 0), 0);
  const distPowerTotal = gasDistributionData.reduce((sum, item) => sum + item.power, 0);
  const distFertTotal = gasDistributionData.reduce((sum, item) => sum + item.fertilizer, 0);
  const distOthersTotal = gasDistributionData.reduce((sum, item) => sum + item.others, 0);
  const distGrandTotal = gasDistributionData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="grid-explorer-panel space-y-6">
      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Droplet className="h-5 w-5 text-sky-500 shrink-0" />
          <div>
            <h3 className="grid-explorer-chart-card__title">
              Daily Gas &amp; Condensate Production
              <sup className="text-emerald-500 font-extrabold text-[10px] ml-2 select-none">Daily</sup>
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Petrobangla Production &amp; Marketing Division Report •{' '}
              <span className="text-sky-500 font-semibold">Tracked since January 12, 2020</span>
            </p>
          </div>
        </div>

        <div className="grid-explorer-table-wrap">
          <GridLockedContent
            locked={isLocked || false}
            requiredTier={requiredTier as any}
            selectedDate={selectedDate}
            variant="micro"
            onTryDemo={onTryDemo}
          >
          <table className="grid-explorer-table">
            <thead>
              <tr>
                <th>Field / Company Operator</th>
                <th className="text-left">Active Fields/Wells</th>
                <th className="text-left">Gas Produced (MMCFD)</th>
                <th className="text-left">Condensate Produced (BBL)</th>
                <th className="text-left">National Gas Share</th>
              </tr>
            </thead>
            <tbody>
              {gasProductionData.map((gp, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{gp.company}</td>
                  <td className="text-left tabular-nums text-muted-foreground">{gp.fields || '—'}</td>
                  <td className="text-left tabular-nums font-medium">{gp.gas ? gp.gas.toFixed(1) : '-'}</td>
                  <td className="text-left tabular-nums">{gp.condensate !== undefined ? formatNumber(Math.round(gp.condensate)) : '-'}</td>
                  <td className="text-left tabular-nums text-muted-foreground">{gp.share !== undefined ? `${gp.share.toFixed(1)}%` : '-'}</td>
                </tr>
              ))}
              <tr className="border-t border-border/80 font-bold bg-muted/20">
                <td>Grand Total Production</td>
                <td className="text-left">{totalActiveFields} Fields</td>
                <td className="text-left text-primary">{formatNumber(totalGasSupply, 1)}</td>
                <td className="text-left">{formatNumber(totalCondensate, 1)}</td>
                <td className="text-left">100.0%</td>
              </tr>
            </tbody>
          </table>
          </GridLockedContent>
        </div>

        <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
          <p><strong>What is being shown?</strong></p>
          <p className="leading-relaxed">This table displays the daily gas volume (MMCFD) and associated condensate liquids (BBL) produced by local gas fields and foreign operators (Chevron, Tullow), alongside imported liquefied natural gas (LNG) regasified into the grid.</p>
          <p className="leading-relaxed"><strong>Analytical Insight:</strong> Chevron (operating the Bibiyana field) remains the dominant producer of natural gas in Bangladesh, supplying over 50% of domestic gas. The high dependency on a single field and company exposes the entire gas-to-power supply chain to operational vulnerability and highlights the urgency of expanding national exploration or gas import capacity.</p>
        </div>

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla Production Reports
            </a>
          </span>
          <span>Audited by: Petrobangla Production &amp; Marketing Division</span>
          <span className="font-medium">Reporting Period: Daily Field Snapshot (Date: {systemStatsDate})</span>
        </GridCardFooter>
      </div>

      <div className="grid-explorer-chart-card card">
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <Database className="h-5 w-5 text-sky-600 shrink-0" />
          <div>
            <h3 className="grid-explorer-chart-card__title">
              Sectorwise Gas Distribution
              <sup className="text-emerald-500 font-extrabold text-[10px] ml-2 select-none">Daily</sup>
            </h3>
            <p className="grid-explorer-chart-card__sub">
              Allocated supply (MMCFD) across regional gas distributors •{' '}
              <span className="text-sky-500 font-semibold">Tracked since January 12, 2020</span>
            </p>
          </div>
        </div>

        <div className="grid-explorer-table-wrap">
          <GridLockedContent
            locked={isLocked || false}
            requiredTier={requiredTier as any}
            selectedDate={selectedDate}
            variant="micro"
            onTryDemo={onTryDemo}
          >
          <table className="grid-explorer-table">
            <thead>
              <tr>
                <th>Distributor</th>
                <th className="text-left">Power Grid Supply</th>
                <th className="text-left">Fertilizer Supply</th>
                <th className="text-left">Industrial / Others</th>
                <th className="text-left">Total Gas Distributed</th>
              </tr>
            </thead>
            <tbody>
              {gasDistributionData.map((gd, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{gd.company}</td>
                  <td className="text-left tabular-nums">{gd.power.toFixed(1)}</td>
                  <td className="text-left tabular-nums">{gd.fertilizer.toFixed(1)}</td>
                  <td className="text-left tabular-nums text-muted-foreground">{gd.others.toFixed(1)}</td>
                  <td className="text-left tabular-nums font-semibold">{gd.total.toFixed(1)}</td>
                </tr>
              ))}
              <tr className="border-t border-border/80 font-bold bg-muted/20">
                <td>National Total Supply</td>
                <td className="text-left tabular-nums text-primary">{distPowerTotal.toFixed(1)}</td>
                <td className="text-left tabular-nums">{distFertTotal.toFixed(1)}</td>
                <td className="text-left tabular-nums">{distOthersTotal.toFixed(1)}</td>
                <td className="text-left tabular-nums text-primary">{distGrandTotal.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
          </GridLockedContent>
        </div>

        <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
          <p><strong>What is being shown?</strong></p>
          <p className="leading-relaxed">This table tracks the distribution of natural gas across different sectors (power grid generators, fertilizer plants, and industrial/domestic consumers) by regional distribution utilities.</p>
          <p className="leading-relaxed"><strong>Analytical Insight:</strong> Natural gas distribution is heavily skewed toward the power sector and industrial customers. Titas Gas (TGTDCL) remains the largest distributor by volume. Under gas supply shortages, fertilizer plants and industries are often rationed to prioritize power generation, illustrating the competing demands for limited gas supply.</p>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-muted/5 border border-border/30 space-y-2.5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-sky-500" /> Gas Sector Acronyms &amp; Units Footnote
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

        <GridCardFooter>
          <span>
            Source:{' '}
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
              Petrobangla Distribution Reports
            </a>
          </span>
          <span>Audited by: Distributor Billing Audits (TGTDCL, KGDCL, JGTDSL)</span>
          <span className="font-medium">Reporting Period: Daily Distribution Allocation (Date: {systemStatsDate})</span>
        </GridCardFooter>
      </div>
    </div>
  );
}