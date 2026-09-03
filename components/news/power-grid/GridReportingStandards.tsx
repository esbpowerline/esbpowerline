'use client';

import { Info } from 'lucide-react';
import type { GridDailyData } from '@/lib/data/grid/types';
import { GridSourceFiles } from './GridExplorerUI';

/**
 * The attribution footer under every tab: the documents behind the day, how
 * often each family of figures changes, and where the publishers live.
 * Extracted from PowerGridExplorer.tsx on 2026-09-02 when the shell crossed
 * its line budget; the wording was rewritten the same day (no more
 * "scraped", "backlog reactivity" or "indicative and editor-managed").
 */
export function GridReportingStandards({
  date,
  sourceFiles,
}: {
  date: string;
  sourceFiles: GridDailyData['sourceFiles'] | undefined;
}) {
  return (
    <div className="mt-8 p-4 bg-muted/10 border border-border/30 rounded-2xl text-[10px] text-muted-foreground/80 leading-relaxed space-y-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-3">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-bold text-foreground">Data Reporting Standards &amp; Attributions</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground/70 text-[9.5px]">
          <span>Report Period: <span className="font-semibold text-foreground">{date}</span></span>
          <span>·</span>
          {/* Not "scraped": the figures are transcribed from the named
              documents, and the reader is told which ones below. */}
          <span>Every figure is transcribed from the official daily reports named below.</span>
        </div>
      </div>

      {/*
        The documents behind this day, named. "Source: PGCB Daily Report" is an
        attribution; the filename is what lets a reader request the same file
        and check the figure themselves.
      */}
      {(sourceFiles?.pgcb || sourceFiles?.petrobangla) && (
        <div className="pt-2.5 border-t border-border/20">
          <GridSourceFiles
            files={[
              { label: 'PGCB', name: sourceFiles?.pgcb },
              { label: 'Petrobangla', name: sourceFiles?.petrobangla },
            ]}
          />
          {!sourceFiles?.petrobangla && (
            <span className="ml-2 text-[10px] text-muted-foreground/70">
              No Petrobangla gas report is held for this day.
            </span>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          {/* Plain words. "Backlog reactivity" and "fully reactive to daily
              backlog selections" described the date picker in engineering
              jargon nobody outside the repo would parse. */}
          <div className="font-semibold text-foreground text-[10.5px]">How often each figure changes</div>
          <div className="space-y-1 text-muted-foreground/75">
            <div className="flex items-start gap-1.5">
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md shrink-0 mt-0.5">Daily</span>
              <span>PGCB and Petrobangla figures belong to the report day selected above and change with it.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-md shrink-0 mt-0.5">Register</span>
              <span>SREDA&rsquo;s installed renewable capacity is a standing register, updated when SREDA publishes rather than per day; renewable output on the day still comes from PGCB&rsquo;s report.</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="font-semibold text-foreground text-[10.5px]">Source Directories</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground/90 font-semibold">
            <a href="https://www.pgcb.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">PGCB/NLDC Operations</a>
            <span>·</span>
            <a href="https://www.petrobangla.org.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Petrobangla Reports</a>
            <span>·</span>
            <a href="http://www.renewableenergy.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">SREDA Database</a>
            <span>·</span>
            <a href="https://bpc.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">BPC Pricing</a>
          </div>
          <div className="text-[9.5px] text-muted-foreground/60 border-t border-border/10 pt-1.5">
            {/* "Indicative and editor-managed" contradicted every P mark on
                the page: the daily figures are the publishers' own, as filed.
                Only the Macro and Technical tabs carry desk-entered series,
                and those say so on their own cards. */}
            Sources: PGCB/NLDC, Petrobangla, SREDA, BPDB, BERC. Daily figures are reproduced as published; anything calculated here carries a D mark. Member downloads are logged for reference.
          </div>
        </div>
      </div>
    </div>
  );
}
