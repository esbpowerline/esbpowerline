'use client';

/**
 * What the year column can and cannot be trusted to mean.
 *
 * SREDA began operating on 22 May 2014, so every row dated before that is a
 * back-fill from somebody else's records — BPDB's for Kaptai, IDCOL's for the
 * solar home systems — rather than something the agency registered as it
 * happened. That is the mechanism behind the one row here that fails an
 * external check, and it is worth saying plainly next to the tables.
 *
 * The rows themselves stay exactly as published. Re-dating 130 MW of Kaptai
 * ourselves would put a number on the page that no source prints; naming the
 * disagreement costs the reader nothing and hides nothing.
 *
 * The share is computed, not typed: the denominator grows every year, so a
 * hardcoded "19%" would quietly become wrong.
 */

import { Info } from 'lucide-react';
import { GridProvenanceTag } from '@/components/news/power-grid/GridExplorerUI';
import type { SredaYearTable } from '@/lib/data/sreda/types';

/** 22 May 2014 — SREDA's first day. Rows dated earlier are reconstructed. */
const SREDA_FIRST_YEAR = 2014;

const SOURCES: { href: string; label: string }[] = [
  {
    href: 'https://sreda.gov.bd/site/page/e48dad3b-6e3a-41b4-ba4f-e57e5d75ecec/-',
    label: 'SREDA, on its own founding',
  },
  {
    href: 'https://en.banglapedia.org/index.php/Karnafuli_Hydropower_Station',
    label: 'Banglapedia, Karnafuli Hydropower Station',
  },
  {
    href: 'https://www.energytransitionbd.org/infrastructure/karnaphuli-230-mw-bpdb-hydropower-plant',
    label: 'Energy Transition BD, Karnaphuli 230 MW',
  },
  {
    href: 'https://www.tbsnews.net/bangladesh/energy/countrys-first-commercial-wind-power-plant-starts-production-810678',
    label: 'The Business Standard, first commercial wind plant',
  },
];

export function YearAttributionNote({ tables }: { tables: SredaYearTable[] }) {
  const rows = tables.flatMap((t) => t.rows);
  const total = rows.reduce((s, r) => s + r.capacityMwp, 0);
  // An unusable year counts as pre-agency too: it is the same back-fill, minus
  // even the year.
  const preAgency = rows
    .filter((r) => r.yearMalformed || Number(r.year) < SREDA_FIRST_YEAR)
    .reduce((s, r) => s + r.capacityMwp, 0);
  const share = total > 0 ? (preAgency / total) * 100 : 0;

  return (
    <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        What the year column means
        <GridProvenanceTag kind="D" />
      </p>

      <p className="text-[10px] leading-relaxed tabular-nums text-muted-foreground">
        {`SREDA began operating on 22 May 2014, so it did not record any of this as it happened before that date. ${preAgency.toFixed(
          1,
        )} MW — ${share.toFixed(
          1,
        )}% of the capacity in these two tables — is dated to a year the agency predates, reconstructed from other bodies’ records rather than registered at the time. It shows.`}
      </p>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        The 230 MW booked to <strong>1988</strong> is Kaptai, the country&rsquo;s only hydro station
        and the largest single row here. Its five units came on in three tranches &mdash; 2 &times;
        40 MW in 1962, 1 &times; 50 MW in 1982 and 2 &times; 50 MW in 1988 &mdash; so 100 MW belongs
        to the year shown and the other 130 MW arrived up to 26 years earlier. The capacity is right
        and matches SREDA&rsquo;s own hydro total; only the dating is wrong.
      </p>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        The 60 MW Cox&rsquo;s Bazar wind farm is reported both as entering commercial operation on 12
        October 2023 and as reaching full output on 8 March 2024, so whichever year it sits in is a
        choice between two published dates rather than a settled fact.
      </p>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Rows are left exactly as SREDA prints them. Sources for this note:{' '}
        {SOURCES.map((s, i) => (
          <span key={s.href}>
            {i > 0 ? '; ' : ''}
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {s.label}
            </a>
          </span>
        ))}
        . Retrieved 18 August 2026.
      </p>
    </div>
  );
}

export default YearAttributionNote;
