'use client';

import { useState } from 'react';
import { CalendarClock, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GridObservationWindows } from '@/lib/data/grid/types';
import type { GridTabId, TabAvailability } from '@/lib/data/grid/tab-availability';
import {
  BST_OFFSET_LABEL,
  formatWindow,
  petrobanglaGasDay,
  pgcbEnergyDay,
  pgcbFiledAs,
  type ObservationWindow,
} from '@/lib/data/grid/observation-window';

/**
 * What "this day" means to each publisher on the page.
 *
 * The explorer has one date picker and every tab adopted its value silently,
 * which is not a small presentational shortcut: PGCB's energy day runs midnight
 * to midnight and Petrobangla's gas day runs 08:00 to 08:00, so the two share
 * only 16 of their 24 hours. The Overview strip used to stamp the PGCB date
 * onto the Petrobangla tile as its "Date:", which states something neither
 * publisher does — Petrobangla's PDF prints a RANGE ("16-17 Aug, 2026") and a
 * period ("8.00 to 8.00"), and the single date exists only in the filename.
 *
 * This row says what each window actually is, names the date each agency FILES
 * that document under so a reader can request it, and marks a source the
 * archive holds nothing for rather than leaving a silent blank.
 */

type Row = {
  publisher: string;
  unit: string;
  window: ObservationWindow;
  filedAs: string;
  publishedLabel?: string | null;
  sourceFile?: string | null;
  missing: boolean;
};

function buildRows(isoDate: string, windows?: GridObservationWindows, hasGas?: boolean): Row[] {
  const pgcbStored = windows?.pgcb;
  const pbStored = windows?.petrobangla;

  const rows: Row[] = [
    {
      publisher: 'PGCB',
      unit: 'Energy day',
      // The stored window is preferred so the page reproduces what was written
      // at ingest; the computed one is a fallback for days repaired before the
      // window field existed, not a second opinion.
      window: pgcbEnergyDay(isoDate, pgcbStored?.sourceFile ?? undefined),
      filedAs: pgcbStored?.filedAs ?? pgcbFiledAs(isoDate),
      sourceFile: pgcbStored?.sourceFile,
      missing: !pgcbStored?.sourceFile,
    },
  ];

  if (pbStored) {
    rows.push({
      publisher: 'Petrobangla',
      unit: 'Gas day',
      window: {
        publisher: 'Petrobangla',
        start: pbStored.start,
        end: pbStored.end,
        anchorDay: isoDate,
        publishedLabel: pbStored.publishedLabel ?? undefined,
        sourceFile: pbStored.sourceFile ?? undefined,
      },
      filedAs: pbStored.filedAs,
      publishedLabel: pbStored.publishedLabel,
      sourceFile: pbStored.sourceFile,
      missing: false,
    });
  } else {
    const w = petrobanglaGasDay(isoDate);
    rows.push({
      publisher: 'Petrobangla',
      unit: 'Gas day',
      window: w,
      filedAs: w.end!.slice(0, 10),
      publishedLabel: w.publishedLabel,
      missing: !hasGas,
    });
  }
  return rows;
}

export function GridDayWindows({
  isoDate,
  windows,
  hasGas,
  absentTabs,
  className,
}: {
  isoDate: string;
  windows?: GridObservationWindows;
  hasGas?: boolean;
  /** Tabs the day's report carries nothing for, with the source's reason. */
  absentTabs?: Array<{ id: GridTabId; label: string; reason: string }>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rows = buildRows(isoDate, windows, hasGas);

  return (
    <div
      className={cn(
        'mb-3 rounded-xl border border-border/25 bg-muted/5 overflow-hidden',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex min-h-11 items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="flex items-center gap-2 min-w-0">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-[11px] font-semibold text-muted-foreground leading-snug">
            <span className="sm:hidden">What &ldquo;{isoDate}&rdquo; covers</span>
            <span className="hidden sm:inline">
              What &ldquo;{isoDate}&rdquo; covers — each agency measures a different 24 hours
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border/20 bg-background/50 px-3 py-3 space-y-2.5">
          {rows.map((row) => (
            <div
              key={row.publisher}
              className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1 text-[11px]"
            >
              <div className="font-bold text-foreground flex items-center gap-1.5">
                {row.publisher}
                {row.missing && (
                  <AlertTriangle className="h-3 w-3 text-amber-500" aria-hidden />
                )}
              </div>
              <div className="text-muted-foreground leading-relaxed min-w-0">
                {row.missing ? (
                  <span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Nothing held for this day.
                    </span>{' '}
                    A {row.unit.toLowerCase()} would run{' '}
                    <span className="font-mono tabular-nums">
                      {formatWindow(row.window, { offset: false })}
                    </span>
                    ; no figures on this page come from {row.publisher}.
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{row.unit}:</span>{' '}
                    <span className="font-mono tabular-nums text-foreground">
                      {formatWindow(row.window, { offset: false })}
                    </span>
                    {row.publishedLabel && (
                      <>
                        {' · printed as '}
                        <span className="font-mono">{row.publishedLabel}</span>
                      </>
                    )}
                    {row.filedAs !== isoDate && (
                      <>
                        {' · filed by '}
                        {row.publisher} under{' '}
                        <span className="font-mono tabular-nums">{row.filedAs}</span>
                      </>
                    )}
                    {row.sourceFile && (
                      <div className="mt-0.5">
                        <code className="text-[10px] text-muted-foreground/80 break-all">
                          {row.sourceFile}
                        </code>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {absentTabs && absentTabs.length > 0 && (
            <div className="pt-2.5 border-t border-border/20 space-y-1.5">
              {/* Named for what the SOURCE did, not for what the page lacks.
                  "No data" reads as a measurement of zero; "this era's report
                  has no such sheet" is the claim the archive can actually
                  make, and it is a different one. */}
              <p className="text-[11px] font-semibold text-foreground">
                What this day&apos;s reports do not cover
              </p>
              <ul className="space-y-1">
                {absentTabs.map((tab) => (
                  <li key={tab.id} className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">{tab.label}</span>
                    {' — '}
                    {tab.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="pt-2 border-t border-border/20 text-[10px] text-muted-foreground/80 leading-relaxed">
            All times {BST_OFFSET_LABEL} (Bangladesh Standard Time). A record is shown on the
            calendar day its window <strong>opens</strong>, which is why the evening peak and the
            gas that fuelled it appear together — the peak falls inside the 08:00-to-08:00 gas
            day. The two windows overlap for 16 of their 24 hours, so a PGCB total and a
            Petrobangla total are not measurements of the same period and are not differenced
            anywhere on this page.
          </p>
        </div>
      )}
    </div>
  );
}
