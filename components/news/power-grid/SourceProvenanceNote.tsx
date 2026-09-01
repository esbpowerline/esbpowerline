'use client';

import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import type { DayProvenance } from '@/lib/data/grid/verification-ledger';

/**
 * What re-reading this day's source document found — told to the reader.
 *
 * The renewables tab already does this for SREDA rows that predate the agency,
 * and it is the best disclosure in the product. The grid and gas sides had no
 * equivalent, while 52 of the 55 verified days had been read by a reconstructed
 * parser and 3 carried an INDICATOR verdict — a published figure known to
 * disagree with the document it cites.
 *
 * Three states, three different things to say, and the wording matters:
 *
 *   verified & clean       a quiet confirmation, no alarm
 *   reconstructed / drift  what was reconstructed and what it does not affect
 *   never checked          plainly that, because 1.2% of the archive has been
 *
 * Deliberately not hidden behind a hover. A reader deciding whether to cite a
 * figure needs this before they read it, not after they ask.
 */
export function SourceProvenanceNote({ provenance }: { provenance: DayProvenance }) {
  const alarming = provenance.verdict === 'INDICATOR' || provenance.verdict === 'HASH';
  const unchecked = !provenance.verified;

  const Icon = alarming ? ShieldAlert : unchecked ? ShieldQuestion : ShieldCheck;

  const tone = alarming
    ? 'border-rose-500/25 bg-rose-500/[0.04] text-rose-700 dark:text-rose-300'
    : unchecked
      ? 'border-border/30 bg-muted/10 text-muted-foreground'
      : 'border-emerald-500/20 bg-emerald-500/[0.03] text-muted-foreground';

  const heading = alarming
    ? 'This day disagrees with its source'
    : unchecked
      ? 'Not re-checked against the source document'
      : provenance.reconstructed
        ? 'Verified — read by a reconstructed parser'
        : 'Verified against the source document';

  return (
    <aside
      className={`mb-4 flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${tone}`}
      aria-label={`Source verification for ${provenance.day}`}
    >
      <Icon className="mt-[1px] h-3.5 w-3.5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold leading-tight">{heading}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{provenance.summary}</p>
      </div>
    </aside>
  );
}
