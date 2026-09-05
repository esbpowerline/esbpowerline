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
  const fallback = EVENT_STUDIES[0];
  if (!study && !fallback) return null;

  return (
    <div className="w-full sm:w-auto">
      <Link
        href={study ? `/analysis/${study.slug}#day-${selectedDate}` : `/analysis/${fallback.slug}`}
        className={cn(
          'grid-explorer-control w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold shadow-sm',
          study
            ? 'bg-primary/10 border-primary/40 text-foreground hover:bg-primary/15'
            : 'bg-transparent text-foreground hover:bg-muted/10 hover:border-primary/30',
        )}
        title={
          study
            ? `${selectedDate} falls inside a documented event: ${study.title}`
            : 'Event studies built from this archive'
        }
      >
        <History className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="whitespace-nowrap">{study ? `In: ${study.title}` : 'Event studies'}</span>
      </Link>
    </div>
  );
}
