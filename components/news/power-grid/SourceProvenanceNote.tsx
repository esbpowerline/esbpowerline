'use client';

import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import type { DayProvenance } from '@/lib/data/grid/verification-ledger';
import '@/app/grid-explorer-charts.css';

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
  // A duplicate-suspect day outranks the quiet "not re-checked" state: its figures are
  // byte-identical to a neighbour's (the confirmed June-2026 shift signature) and the
  // workbook that could rule on it is no longer served. Louder than grey, short of the
  // rose reserved for a proven disagreement with a source.
  const suspect = provenance.duplicateSuspect !== null;
  const unchecked = !provenance.verified;

  const Icon = alarming ? ShieldAlert : suspect ? ShieldAlert : unchecked ? ShieldQuestion : ShieldCheck;

  const tone = alarming
    ? 'border-rose-500/25 bg-rose-500/[0.04] text-rose-700 dark:text-rose-300'
    : suspect
      ? 'border-amber-500/30 bg-amber-500/[0.05] text-amber-800 dark:text-amber-300'
      : unchecked
        ? 'border-border/30 bg-muted/10 text-muted-foreground'
        : 'border-emerald-500/20 bg-emerald-500/[0.03] text-muted-foreground';

  const heading = alarming
    ? 'This day disagrees with its source'
    : suspect
      ? `Unverified — identical to ${provenance.duplicateSuspect}`
      : unchecked
        ? 'Not re-checked against the source document'
        : provenance.reconstructed
          ? 'Verified — read by a reconstructed parser'
          : 'Verified against the source document';

  return (
    <>
      {/* Phone (<768px): one line, "<heading>   Source ›", with the long detail
          behind the tap. A native <details> closed by default, so there is no
          hydration state to get wrong; the desktop block below is hidden by CSS
          at that width and nothing is removed from the page. */}
      <details
        className={`ge-prov-phone ${tone}`}
        aria-label={`Source verification for ${provenance.day}`}
      >
        <summary>
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="ge-prov-phone__text">{heading}</span>
          <span className="ge-prov-phone__more">Source ›</span>
        </summary>
        <p className="ge-prov-phone__detail">{provenance.summary}</p>
      </details>

      <aside
        className={`ge-prov-desktop mb-4 flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${tone}`}
        aria-label={`Source verification for ${provenance.day}`}
      >
        <Icon className="mt-[1px] h-3.5 w-3.5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-tight">{heading}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{provenance.summary}</p>
        </div>
      </aside>
    </>
  );
}
