'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_STUDIES, findEventStudyForDate } from '@/lib/data/analysis/event-registry';

/**
 * The event-study door, in the Grid Explorer's date row and nowhere else.
 *
 * An event study is a reading OF this archive, not a section beside it, so it
 * is entered from the date control rather than from the site nav — a reader
 * standing on 13 August 2026 is one click from the account of why that day
 * looks the way it does, and deep-links straight to that day's row.
 *
 * It lives in its own file because `component-size.test.ts` refused the
 * alternative: the explorer was 24 lines over its 3,487-line budget with this
 * inline, and the budget's whole purpose is to make "extract a sub-view" the
 * cheaper option. That test is the reason this component exists.
 *
 * `event-registry.ts` type-imports the study engine rather than importing it,
 * so nothing here pulls the analysis modules into the explorer's chunk.
 */
export function EventStudyDateLink({ selectedDate }: { selectedDate: string }) {
  const study = findEventStudyForDate(selectedDate);
  // A day inside no study opens the grid of all of them, not whichever study
  // happened to be declared first.
  if (!study && EVENT_STUDIES.length === 0) return null;

  return (
    <div className="w-full sm:w-auto">
      <Link
        prefetch={false}
        href={study ? `/analysis/${study.slug}#day-${selectedDate}` : '/analysis'}
        /*
          Always carries the accent, never transparent.
          Sitting between Latest and the Year/Month/Day dropdowns — all of them
          outlined neutrals — a transparent control read as a fifth piece of
          date machinery and nobody would think to press it. Violet is the
          analysis identity here and appears nowhere else in the explorer, so
          the one control that leaves the archive for a reading of it does not
          look like the controls that move around inside it.

          The hue is CATEGORICAL_SLOTS[6] from chart-palette.ts, which has been
          through that file's CVD and contrast validation, so this adds no
          unvalidated colour to the product.
        */
        className={cn(
          'grid-explorer-control group w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold shadow-sm transition-colors',
          study
            ? 'border-[hsl(249_48%_52%)] bg-[hsl(249_48%_52%)] text-white hover:bg-[hsl(249_54%_46%)] dark:border-[hsl(249_58%_58%)] dark:bg-[hsl(249_58%_58%)] dark:hover:bg-[hsl(249_58%_52%)]'
            : 'border-[hsl(249_48%_52%)]/35 bg-[hsl(249_48%_52%)]/10 text-[hsl(249_48%_40%)] hover:bg-[hsl(249_48%_52%)]/16 dark:border-[hsl(247_70%_78%)]/30 dark:bg-[hsl(247_70%_78%)]/12 dark:text-[hsl(247_70%_82%)] dark:hover:bg-[hsl(247_70%_78%)]/20',
        )}
        title={
          study
            ? `${selectedDate} falls inside a documented event: ${study.title}`
            : 'Event studies built from this archive'
        }
      >
        <History
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            study ? 'text-white' : 'text-[hsl(249_48%_46%)] dark:text-[hsl(247_70%_82%)]',
          )}
        />
        {/* "Event Study", matching the label the page itself wears in its hero
            kicker. The tooltip above stays plural — it describes the set of
            studies built from this archive, which is a different statement. */}
        <span className="whitespace-nowrap">{study ? `In: ${study.title}` : 'Event Study'}</span>
      </Link>
    </div>
  );
}
