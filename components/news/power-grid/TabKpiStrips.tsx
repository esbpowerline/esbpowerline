'use client';

/**
 * KPI strips for the tabs that had none: Generation & Cost, C/B Imports,
 * Regional Grid and Power Stations.
 *
 * Every headline here is a cell the source report prints, or a count of its
 * rows. Where a figure is ours it carries D and the briefing says what was done
 * to the published numbers to get it. Nothing is estimated, carried forward or
 * filled in: a field the report leaves empty renders as an em dash, because a
 * missing reading and a reading of zero are different claims.
 *
 * Figures cross-checked against public/data/daily/2026-08-12.json and
 * public/data/plants/2026-08-12.json.
 */

import { useEffect, useRef, useState } from 'react';
import { Cable, Factory, Flame, Gauge, Globe, Layers, Plug, Timer, TrendingDown, Wallet, Zap } from 'lucide-react';
import {
  DailyBadge,
  GridKpiCell,
  GridKpiStrip,
  GridKpiTooltipAudit,
  GridKpiTooltipBody,
  GridKpiTooltipRef,
  GridKpiTooltipRow,
} from '@/components/news/power-grid/GridExplorerUI';
import { formatNumber } from '@/lib/utils';
import { fetchPlantDetail } from '@/lib/data/grid/plant-detail.client';
import { countBySector, SECTOR_LABEL } from '@/lib/data/grid/producer-sector';
import type { DailyPlantDetail, GridDailyData, GridSystemStats } from '@/lib/data/grid/types';

type SourceFiles = { pgcb?: string; petrobangla?: string };

const CRORE = 10000000;

/** Shared open/close behaviour for a strip's briefings. */
function useBriefing<T extends string>() {
  const [open, setOpen] = useState<T | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const toggle = (id: T) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setOpen((prev) => {
      const next = prev === id ? null : id;
      /* Touch (<1024px): tap toggles and a tap elsewhere closes; the 2s auto-hide is for hover/mouse only, it would close the panel before a phone reader finishes it or reaches its source link. */
      if (next && !(typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches)) {
        timer.current = setTimeout(() => {
          setOpen(null);
          timer.current = null;
        }, 2000);
      }
      return next;
    });
  };

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (stripRef.current && !stripRef.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  return { open, toggle, stripRef };
}

function PgcbRef({ part, sourceFiles, date }: { part: string; sourceFiles?: SourceFiles; date: string }) {
  return (
    <GridKpiTooltipRef
      refLabel="PGCB Daily Report"
      part={part}
      sourceFile={sourceFiles?.pgcb}
      refHref="https://www.pgcb.gov.bd/"
      dateLabel={`Date: ${date}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Generation & Cost                                                   */
/* ------------------------------------------------------------------ */

export function GenerationKpiStrip({
  systemStats,
  generationData,
  sourceFiles,
}: {
  systemStats: GridSystemStats;
  generationData: GridDailyData['generationData'];
  sourceFiles?: SourceFiles;
}) {
  const { open, toggle, stripRef } = useBriefing<'energy' | 'lead' | 'bill' | 'dear'>();

  const rows = generationData.filter((g) => typeof g.gen === 'number' && g.gen > 0);
  const totalRowGen = rows.reduce((s, g) => s + g.gen, 0);
  const leader = rows.reduce<(typeof rows)[number] | null>(
    (best, g) => (best == null || g.gen > best.gen ? g : best),
    null,
  );
  const leaderPct = leader && totalRowGen > 0 ? (leader.gen / totalRowGen) * 100 : null;

  // Only fuels the report priced. A fuel that ran with no cost cell is not the
  // cheapest thing on the grid, it is a fuel this report does not price.
  const priced = generationData.filter((g) => typeof g.unitCost === 'number' && g.unitCost > 0);
  const dearest = priced.reduce<(typeof priced)[number] | null>(
    (worst, g) => (worst == null || (g.unitCost ?? 0) > (worst.unitCost ?? 0) ? g : worst),
    null,
  );

  return (
    <GridKpiStrip stripRef={stripRef} className="grid-explorer-kpi-strip--four">
      <GridKpiCell
        icon={Zap}
        label={<>Energy Generated<DailyBadge /></>}
        value={systemStats.totalEnergyGen == null ? '—' : `${systemStats.totalEnergyGen.toFixed(2)} MKWh`}
        provenance="P"
        active={open === 'energy'}
        onToggle={() => toggle('energy')}
        tooltipTitle="Energy Briefing"
        tooltipIcon={Zap}
        tooltipAccent="text-primary"
        width="sm"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="P"
            label="Headline total:"
            value={systemStats.totalEnergyGen == null ? 'not published for this day' : `${systemStats.totalEnergyGen.toFixed(2)} MKWh`}
          />
          <GridKpiTooltipRow provenance="D" label="Sum of the fuel rows:" value={`${totalRowGen.toFixed(2)} MKWh`} />
          <GridKpiTooltipRow
            provenance="P"
            label="Energy demanded:"
            value={systemStats.totalEnergyDemand == null ? '—' : `${systemStats.totalEnergyDemand.toFixed(2)} MKWh`}
          />
          <GridKpiTooltipAudit>
            The headline is P1&rsquo;s own total. The fuel rows are summed separately and shown
            beside it because PGCB prints both and does not state that they must agree —
            where they differ, the difference is the report&rsquo;s, not a rounding of ours.
          </GridKpiTooltipAudit>
          <PgcbRef part="P1 sheet — daily energy total" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Layers}
        iconClassName="text-amber-500"
        label={<>Largest Source<DailyBadge /></>}
        value={leader == null ? '—' : leader.name}
        hint={
          leaderPct == null ? null : (
            <span className="text-muted-foreground">
              {leaderPct.toFixed(1)}% of the day&rsquo;s energy
            </span>
          )
        }
        // The fuel names and their energy are published; which one is largest,
        // and its share, are read off those rows.
        provenance="D"
        active={open === 'lead'}
        onToggle={() => toggle('lead')}
        tooltipTitle="Fuel Mix Briefing"
        tooltipIcon={Layers}
        tooltipAccent="text-amber-500"
        widthClass="w-[18.5rem] md:w-[21rem]"
      >
        <GridKpiTooltipBody>
          {rows
            .slice()
            .sort((a, b) => b.gen - a.gen)
            .slice(0, 5)
            .map((g) => (
              <GridKpiTooltipRow
                key={g.name}
                provenance="P"
                label={`${g.name}:`}
                value={`${g.gen.toFixed(2)} MKWh${totalRowGen > 0 ? ` · ${((g.gen / totalRowGen) * 100).toFixed(1)}%` : ''}`}
              />
            ))}
          <GridKpiTooltipAudit>
            Each fuel&rsquo;s energy is PGCB&rsquo;s figure. The percentages are those rows over
            their own sum, so they describe the published mix rather than the headline total.
          </GridKpiTooltipAudit>
          <PgcbRef part="P1 sheet — zone-wise generation summary" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Wallet}
        iconClassName="text-emerald-500"
        label={<>Fuel Bill<DailyBadge /></>}
        value={`${(systemStats.totalDailyCost / CRORE).toFixed(2)} Cr Tk.`}
        provenance="P"
        active={open === 'bill'}
        onToggle={() => toggle('bill')}
        tooltipTitle="Cost Briefing"
        tooltipIcon={Wallet}
        tooltipAccent="text-emerald-500"
        widthClass="w-[18.5rem] md:w-[21rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="P"
            label="Fuel &amp; import bill:"
            value={`${(systemStats.totalDailyCost / CRORE).toFixed(2)} Crore BDT`}
          />
          {/* D, not P. `avgProductionCost` is not P1's printed "Production Cost
              per KWHr" cell: parse_daily_reports.py:1890-1892 computes it as
              total_daily_cost / total_energy_gen and never reads the rate PGCB
              prints (types.ts:42 — "every surface must mark it D"). The row
              above IS published — it is P1's "Production Cost (Tk.)" total —
              which is what made the two easy to tag alike. OverviewKpiStrip
              carried the same mistake on its own tile and had it corrected;
              this second surface kept it until 2026-09-04. */}
          <GridKpiTooltipRow
            provenance="D"
            label="Avg production cost:"
            value={systemStats.avgProductionCost > 0 ? `${systemStats.avgProductionCost.toFixed(3)} Tk/kWh` : '—'}
          />
          <GridKpiTooltipAudit>
            Fuel and imports only. Capacity payments, debt service and O&amp;M are not on this
            report at all, so this is what the day&rsquo;s electricity cost to fuel, not what it
            cost to supply.
          </GridKpiTooltipAudit>
          <PgcbRef part="P1 sheet — production-cost block" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Flame}
        iconClassName="text-destructive"
        label={<>Costliest Fuel Run<DailyBadge /></>}
        value={dearest == null ? '—' : `${(dearest.unitCost ?? 0).toFixed(2)} Tk/kWh`}
        hint={dearest == null ? null : <span className="text-muted-foreground">{dearest.name}</span>}
        provenance="D"
        active={open === 'dear'}
        onToggle={() => toggle('dear')}
        tooltipTitle="Unit Rate Briefing"
        tooltipIcon={Flame}
        tooltipAccent="text-destructive"
        widthClass="w-[19rem] md:w-[21.5rem]"
      >
        <GridKpiTooltipBody>
          {priced
            .slice()
            .sort((a, b) => (b.unitCost ?? 0) - (a.unitCost ?? 0))
            .slice(0, 5)
            .map((g) => (
              <GridKpiTooltipRow
                key={g.name}
                provenance="D"
                label={`${g.name}:`}
                value={`${(g.unitCost ?? 0).toFixed(2)} Tk/kWh`}
              />
            ))}
          <GridKpiTooltipAudit>
            These are not published tariffs. Each is that fuel&rsquo;s cost divided by its own
            generation on this day, so a fuel that ran briefly can price high on a small
            denominator, and the import rate is a blended settlement figure rather than a
            contracted price. Fuels the report does not price are left out entirely rather
            than shown at zero.
          </GridKpiTooltipAudit>
          <PgcbRef part="P1 sheet — production-cost block" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>
    </GridKpiStrip>
  );
}

/* ------------------------------------------------------------------ */
/* Cross-border imports                                                */
/* ------------------------------------------------------------------ */

export function ImportsKpiStrip({
  systemStats,
  generationData,
  borderImportsData,
  sourceFiles,
}: {
  systemStats: GridSystemStats;
  generationData: GridDailyData['generationData'];
  borderImportsData: GridDailyData['borderImportsData'];
  sourceFiles?: SourceFiles;
}) {
  const { open, toggle, stripRef } = useBriefing<'energy' | 'link' | 'share' | 'bill'>();

  const importRow = generationData.find((g) => g.name === 'Imports');
  const importedMkwh = typeof importRow?.gen === 'number' ? importRow.gen : null;
  const importBill = typeof importRow?.cost === 'number' ? importRow.cost : null;

  const links = (borderImportsData ?? []).filter((l) => typeof l.energy === 'number');
  const linkSum = links.reduce((s, l) => s + (l.energy || 0), 0);
  // Unknown when any line's peak is: the unstated one may be the largest.
  const biggest = links.some((l) => l.peakFlow == null)
    ? null
    : links.reduce<(typeof links)[number] | null>(
        (best, l) => (best == null || (l.peakFlow ?? 0) > (best.peakFlow ?? 0) ? l : best),
        null,
      );
  const sharePct =
    importedMkwh != null && systemStats.totalEnergyGen
      ? (importedMkwh / systemStats.totalEnergyGen) * 100
      : null;

  return (
    <GridKpiStrip stripRef={stripRef} className="grid-explorer-kpi-strip--four">
      <GridKpiCell
        icon={Globe}
        label={<>Imported Energy<DailyBadge /></>}
        value={importedMkwh == null ? '—' : `${importedMkwh.toFixed(2)} MKWh`}
        provenance="P"
        active={open === 'energy'}
        onToggle={() => toggle('energy')}
        tooltipTitle="Import Briefing"
        tooltipIcon={Globe}
        tooltipAccent="text-primary"
        widthClass="w-[19rem] md:w-[21.5rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="P"
            label="Imports, fuel-mix row:"
            value={importedMkwh == null ? 'not published for this day' : `${importedMkwh.toFixed(2)} MKWh`}
          />
          <GridKpiTooltipRow provenance="D" label="Sum of the interconnectors:" value={`${linkSum.toFixed(2)} MKWh`} />
          <GridKpiTooltipAudit>
            PGCB prints imports twice — once as a fuel-mix row and once split across the
            interconnectors. The headline is the fuel-mix row; the sum of the links is shown
            beneath it so a disagreement between the two is visible rather than resolved here.
          </GridKpiTooltipAudit>
          <PgcbRef part="P1 sheet — fuel mix and interconnector rows" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Plug}
        iconClassName="text-amber-500"
        label={<>Largest Link<DailyBadge /></>}
        value={biggest?.peakFlow == null ? '—' : `${formatNumber(Math.round(biggest.peakFlow))} MW`}
        hint={biggest == null ? null : <span className="text-muted-foreground">{biggest.source}</span>}
        provenance="P"
        active={open === 'link'}
        onToggle={() => toggle('link')}
        tooltipTitle="Interconnector Briefing"
        tooltipIcon={Plug}
        tooltipAccent="text-amber-500"
        widthClass="w-[20rem] md:w-[22.5rem]"
      >
        <GridKpiTooltipBody>
          {links.map((l) => (
            <GridKpiTooltipRow
              key={l.source}
              provenance="P"
              label={`${l.source}:`}
              value={`${l.peakFlow == null ? 'peak not stated' : `${formatNumber(Math.round(l.peakFlow))} MW peak`} · ${(l.energy || 0).toFixed(2)} MKWh`}
            />
          ))}
          <GridKpiTooltipAudit>
            Each link&rsquo;s peak flow is PGCB&rsquo;s own figure. They are listed rather than
            added: the report does not state that these peaks occurred in the same hour, so a
            combined peak import would be a number no source supports.
          </GridKpiTooltipAudit>
          <PgcbRef part="P1 sheet — cross-border interconnector rows" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Gauge}
        iconClassName="text-violet-500"
        label={<>Share of Generation<DailyBadge /></>}
        value={sharePct == null ? '—' : `${sharePct.toFixed(1)}%`}
        hint={
          importedMkwh == null || systemStats.totalEnergyGen == null ? null : (
            <span className="text-muted-foreground">of {systemStats.totalEnergyGen.toFixed(0)} MKWh generated</span>
          )
        }
        provenance="D"
        active={open === 'share'}
        onToggle={() => toggle('share')}
        tooltipTitle="Dependence Briefing"
        tooltipIcon={Gauge}
        tooltipAccent="text-violet-500"
        width="sm"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow provenance="P" label="Imported:" value={importedMkwh == null ? '—' : `${importedMkwh.toFixed(2)} MKWh`} />
          <GridKpiTooltipRow
            provenance="P"
            label="Total generated:"
            value={systemStats.totalEnergyGen == null ? '—' : `${systemStats.totalEnergyGen.toFixed(2)} MKWh`}
          />
          <GridKpiTooltipAudit>
            Both figures are PGCB&rsquo;s; the percentage between them is ours. It is a share of
            energy across the whole day, not of capacity and not of the peak hour.
          </GridKpiTooltipAudit>
          <PgcbRef part="P1 sheet — fuel mix and daily total" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Wallet}
        iconClassName="text-emerald-500"
        label={<>Import Bill<DailyBadge /></>}
        value={importBill == null ? '—' : `${(importBill / CRORE).toFixed(2)} Cr Tk.`}
        provenance="P"
        active={open === 'bill'}
        onToggle={() => toggle('bill')}
        tooltipTitle="Import Cost Briefing"
        tooltipIcon={Wallet}
        tooltipAccent="text-emerald-500"
        widthClass="w-[19rem] md:w-[21.5rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow
            provenance="P"
            label="Cost of imported power:"
            value={importBill == null ? 'not published for this day' : `${(importBill / CRORE).toFixed(2)} Crore BDT`}
          />
          <GridKpiTooltipRow
            provenance="D"
            label="Implied rate:"
            value={
              importBill != null && importedMkwh
                ? `${(importBill / (importedMkwh * 1000000)).toFixed(2)} Tk/kWh`
                : '—'
            }
          />
          <GridKpiTooltipAudit>
            The bill is published. The implied rate is that bill over the imported energy — a
            blended settlement figure across every link, not a contracted tariff for any one of
            them, and not comparable to a per-plant rate.
          </GridKpiTooltipAudit>
          <PgcbRef part="P1 sheet — production-cost block" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>
    </GridKpiStrip>
  );
}

/* ------------------------------------------------------------------ */
/* Regional grid                                                       */
/* ------------------------------------------------------------------ */

export function RegionalKpiStrip({
  systemStats,
  regionalDemandData,
  sourceFiles,
  sourceLabel,
}: {
  systemStats: GridSystemStats;
  regionalDemandData: GridDailyData['regionalDemandData'];
  sourceFiles?: SourceFiles;
  sourceLabel: string;
}) {
  const { open, toggle, stripRef } = useBriefing<'zones' | 'shed' | 'worst' | 'clean'>();

  const zones = (regionalDemandData ?? []).filter((z) => typeof z.demand === 'number');
  const shedTotal = zones.reduce((s, z) => s + (z.loadShed || 0), 0);
  const demandTotal = zones.reduce((s, z) => s + (z.demand || 0), 0);
  const worst = zones.reduce<(typeof zones)[number] | null>((w, z) => {
    const zp = z.demand ? (z.loadShed || 0) / z.demand : 0;
    const wp = w && w.demand ? (w.loadShed || 0) / w.demand : -1;
    return zp > wp ? z : w;
  }, null);
  const worstPct = worst && worst.demand ? ((worst.loadShed || 0) / worst.demand) * 100 : null;
  const clean = zones.filter((z) => (z.loadShed || 0) === 0);

  return (
    <GridKpiStrip stripRef={stripRef} className="grid-explorer-kpi-strip--four">
      <GridKpiCell
        icon={Cable}
        label={<>Zones Reporting<DailyBadge /></>}
        value={`${zones.length}`}
        hint={<span className="text-muted-foreground">at the evening peak</span>}
        provenance="P"
        active={open === 'zones'}
        onToggle={() => toggle('zones')}
        tooltipTitle="Coverage Briefing"
        tooltipIcon={Cable}
        tooltipAccent="text-primary"
        width="sm"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow provenance="P" label="Zones in the table:" value={`${zones.length}`} />
          <GridKpiTooltipRow provenance="D" label="Demand across them:" value={`${formatNumber(Math.round(demandTotal))} MW`} />
          <GridKpiTooltipAudit>
            A count of the rows this day&rsquo;s zone table prints. Zones the report omits are
            absent here rather than shown at zero.
          </GridKpiTooltipAudit>
          <PgcbRef part={sourceLabel} sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={TrendingDown}
        iconClassName="text-destructive"
        label={<>Load Shed, All Zones<DailyBadge /></>}
        value={`${formatNumber(Math.round(shedTotal))} MW`}
        provenance="D"
        active={open === 'shed'}
        onToggle={() => toggle('shed')}
        tooltipTitle="Shedding Briefing"
        tooltipIcon={TrendingDown}
        tooltipAccent="text-destructive"
        widthClass="w-[19rem] md:w-[21.5rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow provenance="D" label="Summed across zones:" value={`${formatNumber(Math.round(shedTotal))} MW`} />
          <GridKpiTooltipRow
            provenance="D"
            label="Grid-wide severity:"
            value={demandTotal > 0 ? `${((shedTotal / demandTotal) * 100).toFixed(1)}%` : '—'}
          />
          <GridKpiTooltipAudit>
            Each zone&rsquo;s load-shed figure is published; the total is our sum of them. Every
            row is read at the same evening peak, so they add without mixing hours. The
            severity is the summed shed over the summed demand — not the average of the zone
            percentages, which weights a small zone like a large one.
          </GridKpiTooltipAudit>
          <PgcbRef part={sourceLabel} sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Timer}
        iconClassName="text-amber-500"
        label={<>Worst-hit Zone<DailyBadge /></>}
        value={worst == null ? '—' : worst.zone}
        hint={worstPct == null ? null : <span className="text-muted-foreground">{worstPct.toFixed(1)}% of its demand unserved</span>}
        provenance="D"
        active={open === 'worst'}
        onToggle={() => toggle('worst')}
        tooltipTitle="Severity Briefing"
        tooltipIcon={Timer}
        tooltipAccent="text-amber-500"
        widthClass="w-[19rem] md:w-[21.5rem]"
      >
        <GridKpiTooltipBody>
          {zones
            .slice()
            .sort((a, b) => (b.demand ? (b.loadShed || 0) / b.demand : 0) - (a.demand ? (a.loadShed || 0) / a.demand : 0))
            .slice(0, 4)
            .map((z) => (
              <GridKpiTooltipRow
                key={z.zone}
                provenance="D"
                label={`${z.zone}:`}
                value={z.demand ? `${(((z.loadShed || 0) / z.demand) * 100).toFixed(1)}% · ${formatNumber(Math.round(z.loadShed || 0))} MW` : '—'}
              />
            ))}
          <GridKpiTooltipAudit>
            Ranked by shed over that zone&rsquo;s own demand, so it names where the shortage bit
            hardest rather than where the most megawatts were cut. Both inputs are published;
            the ratio and the ranking are ours.
          </GridKpiTooltipAudit>
          <PgcbRef part={sourceLabel} sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Gauge}
        iconClassName="text-emerald-500"
        label={<>Zones Unaffected<DailyBadge /></>}
        value={`${clean.length} of ${zones.length}`}
        hint={
          clean.length ? (
            <span className="text-muted-foreground">{clean.map((z) => z.zone).join(', ')}</span>
          ) : (
            <span className="text-muted-foreground">every zone shed load</span>
          )
        }
        provenance="D"
        active={open === 'clean'}
        onToggle={() => toggle('clean')}
        tooltipTitle="Unaffected Zones"
        tooltipIcon={Gauge}
        tooltipAccent="text-emerald-500"
        widthClass="w-[19rem] md:w-[21.5rem]"
      >
        <GridKpiTooltipBody>
          {clean.length ? (
            clean.map((z) => (
              <GridKpiTooltipRow key={z.zone} provenance="P" label={`${z.zone}:`} value="0 MW shed" />
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              Every zone in this day&rsquo;s table shed some load.
            </p>
          )}
          <GridKpiTooltipAudit>
            Counts the rows whose published load-shed cell is zero. A zone missing from the
            table is not counted as unaffected — it is simply not reported.
          </GridKpiTooltipAudit>
          <PgcbRef part={sourceLabel} sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>
    </GridKpiStrip>
  );
}

/* ------------------------------------------------------------------ */
/* Power stations                                                      */
/* ------------------------------------------------------------------ */

export function StationsKpiStrip({
  isoDate,
  systemStats,
  sourceFiles,
}: {
  isoDate: string;
  systemStats: GridSystemStats;
  sourceFiles?: SourceFiles;
}) {
  const { open, toggle, stripRef } = useBriefing<'listed' | 'running' | 'installed' | 'idle'>();
  const [detail, setDetail] = useState<DailyPlantDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'absent'>('loading');

  useEffect(() => {
    let live = true;
    setState('loading');
    fetchPlantDetail(isoDate).then((d) => {
      if (!live) return;
      setDetail(d);
      setState(d?.plants?.length ? 'ready' : 'absent');
    });
    return () => {
      live = false;
    };
  }, [isoDate]);

  const plants = detail?.plants ?? [];
  const rated = plants.filter((p) => p.installedMw != null);
  const installed = rated.reduce((s, p) => s + (p.installedMw || 0), 0);
  // "Ran" means the sheet recorded output at the evening peak. A station with a
  // null reading is not counted either way — it is a station this sheet did not
  // read, which is not the same as a station that stood still.
  const read = plants.filter((p) => p.eveningPeakMw != null);
  const running = read.filter((p) => (p.eveningPeakMw || 0) > 0);
  const still = read.filter((p) => (p.eveningPeakMw || 0) === 0);
  // Ownership from the producer code on each row. Joint ventures, imports and
  // unrecognised codes are shown as themselves only when present, so the
  // rows always add up to the station count above them.
  const sectors = countBySector(plants.map((p) => p.producer)).filter(
    (s) => s.count > 0 || s.sector === 'government' || s.sector === 'private',
  );

  if (state === 'absent') return null;

  return (
    <GridKpiStrip stripRef={stripRef} className="grid-explorer-kpi-strip--four">
      <GridKpiCell
        icon={Factory}
        label={<>Stations Listed<DailyBadge /></>}
        value={state === 'loading' ? '—' : `${plants.length}`}
        provenance="P"
        active={open === 'listed'}
        onToggle={() => toggle('listed')}
        tooltipTitle="Fleet Briefing"
        tooltipIcon={Factory}
        tooltipAccent="text-primary"
        width="sm"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow provenance="P" label="Rows on the sheet:" value={`${plants.length}`} />
          <GridKpiTooltipRow provenance="P" label="With a stated rating:" value={`${rated.length}`} />
          <GridKpiTooltipRow provenance="P" label="With a peak reading:" value={`${read.length}`} />
          {sectors.map(({ sector, count }) => (
            <GridKpiTooltipRow key={sector} provenance="D" label={`${SECTOR_LABEL[sector]}:`} value={`${count}`} />
          ))}
          <GridKpiTooltipAudit>
            A count of the station rows this day&rsquo;s sheet prints, not of the national fleet.
            Stations the sheet omits are absent from every figure on this strip. Ownership is
            read from the producer code PGCB prints on each row (PDB, APSCL, EGCB&hellip; are
            government; IPP, QRPP, RPP, SIPP are private); PGCB publishes no ownership column,
            so the split is ours. Producers that are part state and part foreign, such as
            Payra&rsquo;s BCPCL, are counted as joint ventures rather than on either side. The
            split follows the code as printed: a station PGCB files under PDB counts as
            government, whoever else holds a share in it.
          </GridKpiTooltipAudit>
          <PgcbRef part="Station-wise generation sheet" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Zap}
        iconClassName="text-emerald-500"
        label={<>Generating at Peak<DailyBadge /></>}
        value={state === 'loading' ? '—' : `${running.length}`}
        hint={read.length ? <span className="text-muted-foreground">of {read.length} read</span> : null}
        provenance="D"
        active={open === 'running'}
        onToggle={() => toggle('running')}
        tooltipTitle="Dispatch Briefing"
        tooltipIcon={Zap}
        tooltipAccent="text-emerald-500"
        widthClass="w-[19rem] md:w-[21.5rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow provenance="D" label="Recorded above zero:" value={`${running.length}`} />
          <GridKpiTooltipRow provenance="D" label="Recorded at zero:" value={`${still.length}`} />
          <GridKpiTooltipRow provenance="P" label="Not read this day:" value={`${plants.length - read.length}`} />
          <GridKpiTooltipAudit>
            Counted from the sheet&rsquo;s evening-peak column. A station whose cell is empty is
            counted in neither total — an unread station and an idle one are different claims,
            and the sheet distinguishes them.
          </GridKpiTooltipAudit>
          <PgcbRef part="Station-wise generation sheet" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Gauge}
        iconClassName="text-violet-500"
        label={<>Installed, Listed<DailyBadge /></>}
        value={state === 'loading' || !rated.length ? '—' : `${formatNumber(Math.round(installed))} MW`}
        hint={rated.length ? <span className="text-muted-foreground">across {rated.length} stations</span> : null}
        provenance="P"
        active={open === 'installed'}
        onToggle={() => toggle('installed')}
        tooltipTitle="Capacity Briefing"
        tooltipIcon={Gauge}
        tooltipAccent="text-violet-500"
        widthClass="w-[19.5rem] md:w-[22rem]"
      >
        <GridKpiTooltipBody>
          <GridKpiTooltipRow provenance="P" label="Sum of stated ratings:" value={`${formatNumber(Math.round(installed))} MW`} />
          <GridKpiTooltipRow provenance="P" label="Stations rated:" value={`${rated.length} of ${plants.length}`} />
          <GridKpiTooltipRow
            provenance="P"
            label="Running at evening peak:"
            value={`${formatNumber(Math.round(systemStats.eveningPeakGen))} MW`}
          />
          <GridKpiTooltipAudit>
            The ratings are the sheet&rsquo;s own. Where stations carry no rating the total is a
            floor rather than a fleet capacity, and the count above says how many. This sheet&rsquo;s
            evening-peak column sums to the peak generation PGCB prints on P1, so the two sit on
            one basis.
          </GridKpiTooltipAudit>
          <PgcbRef part="Station-wise generation sheet" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>

      <GridKpiCell
        icon={Timer}
        iconClassName="text-muted-foreground"
        label={<>Stood Still<DailyBadge /></>}
        value={state === 'loading' ? '—' : `${still.length}`}
        hint={
          read.length ? (
            <span className="text-muted-foreground">
              {((still.length / read.length) * 100).toFixed(0)}% of stations read
            </span>
          ) : null
        }
        provenance="D"
        active={open === 'idle'}
        onToggle={() => toggle('idle')}
        tooltipTitle="Idle Stations"
        tooltipIcon={Timer}
        tooltipAccent="text-muted-foreground"
        widthClass="w-[19.5rem] md:w-[22rem]"
      >
        <GridKpiTooltipBody>
          {still
            .slice()
            .sort((a, b) => (b.installedMw || 0) - (a.installedMw || 0))
            .slice(0, 5)
            .map((p) => (
              <GridKpiTooltipRow
                key={p.name}
                provenance="P"
                label={`${p.name}:`}
                value={p.installedMw == null ? 'no rating' : `${formatNumber(Math.round(p.installedMw))} MW idle`}
              />
            ))}
          <GridKpiTooltipAudit>
            Stations the sheet read at zero on the evening peak, largest rating first. The sheet
            gives a remark for many of them — maintenance, no fuel, forced outage — which the
            table below carries in full. Idle is not the same as available.
          </GridKpiTooltipAudit>
          <PgcbRef part="Station-wise generation sheet" sourceFiles={sourceFiles} date={systemStats.date} />
        </GridKpiTooltipBody>
      </GridKpiCell>
    </GridKpiStrip>
  );
}
