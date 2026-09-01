/**
 * What `verify:source` knows about a day, in a shape the interface can show.
 *
 * The renewables tab tells readers plainly when a capacity figure is "dated to
 * a year the agency predates, reconstructed from other bodies' records rather
 * than registered at the time". That is exactly the right disclosure, and it
 * existed in one tab and nowhere else — while 52 of the 55 days that have been
 * verified against their source documents ran `parserVersion:
 * 2.0.0-reconstructed`, and no reader was told.
 *
 * The doctrine's promise is that a reader can tell a sourced figure from an
 * inferred one. This is the half of that promise the grid and gas sides were
 * not keeping.
 */

export type SourceVerdict =
  | 'INDICATOR'
  | 'VALUE'
  | 'HASH'
  | 'DRIFT'
  | 'SHAPE'
  | 'MATCH'
  | 'UNFETCHED';

export interface LedgerDay {
  day: string;
  verdict: SourceVerdict;
  parserVersion: string | null;
  gasVerified: boolean;
  hash: string | null;
  counts?: { indicator?: number; value?: number; shape?: number };
}

import duplicateSuspectDeclaration from '@/public/data/grid-verification/duplicate-suspect-days.json';

/**
 * Day-pairs whose figures are byte-identical to their neighbour across four
 * independent stats — eveningPeakGen, totalEnergyGen, eveningPeakDemand and
 * dayPeakGen all matching exactly. That is the signature of the confirmed
 * 2026-06-25..29 shift, where five published days each held the FOLLOWING day's
 * actuals and the workbooks proved it. These pairs cannot be proven either way:
 * PGCB does not serve workbooks this old and no local copy is known. At most one
 * day of each pair is its own day, and nobody can currently say which — so both
 * are marked, because silence is the one unacceptable outcome.
 *
 * The pairs live in duplicate-suspect-days.json — a published declaration also
 * read by verify-data's duplicate-day check, so the reader-facing UNVERIFIED
 * marker and the check can never disagree about which days are declared.
 * Remove a pair only when its workbook has been located and verify:source has
 * ruled which day it describes.
 */
export const DUPLICATE_SUSPECT_DAYS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    (duplicateSuspectDeclaration.pairs as [string, string][]).flatMap(([a, b]) => [
      [a, b],
      [b, a],
    ]),
  ),
);

export interface DayProvenance {
  /** The day this describes. */
  day: string;
  /** False when `verify:source` has never refetched this day at all. */
  verified: boolean;
  /**
   * Set to the partner day when this day's figures are byte-identical to a
   * neighbour's and the source workbook cannot be obtained to rule which of the
   * two is genuine.
   */
  duplicateSuspect: string | null;
  verdict: SourceVerdict | null;
  /** True when the parser that produced this day was a reconstruction. */
  reconstructed: boolean;
  parserVersion: string | null;
  /** True when the gas half was checked against its own source document. */
  gasVerified: boolean;
  /** One sentence a reader can act on. */
  summary: string;
}

const VERDICT_COPY: Record<SourceVerdict, string> = {
  INDICATOR:
    'A published figure on this day disagrees with the document it cites. Treat it as unconfirmed until it is resolved.',
  VALUE: 'A value on this day differs from the source document; the difference is recorded but not yet triaged.',
  HASH: 'The source document has changed since this day was parsed.',
  DRIFT:
    'Re-reading the source produced a different value somewhere that is not published on this page. The figures shown were not affected.',
  SHAPE:
    'Re-reading the source produced a different structure — a table present in one and not the other. The figures shown were not affected.',
  MATCH: 'Re-read from the source document and matched exactly.',
  UNFETCHED: 'The source document could not be refetched for checking.',
};

/**
 * Describe one day for the reader.
 *
 * Deliberately says "not yet checked" rather than nothing when a day is absent
 * from the ledger: 1.2% of the archive has been verified, and a reader is
 * entitled to know which side of that line the day in front of them is on.
 */
export function describeDayProvenance(day: string, entry: LedgerDay | undefined): DayProvenance {
  const duplicateSuspect = DUPLICATE_SUSPECT_DAYS[day] ?? null;
  const duplicateSentence = duplicateSuspect
    ? `This day's headline figures are identical to ${duplicateSuspect}'s — the signature of a filing shift. At most one of the two days is genuine, and the source workbook needed to rule on it is no longer served by PGCB.`
    : null;

  if (!entry) {
    return {
      day,
      verified: false,
      duplicateSuspect,
      verdict: null,
      reconstructed: false,
      parserVersion: null,
      gasVerified: false,
      summary: duplicateSentence
        ? `${duplicateSentence} Treat both days as unverified.`
        : 'This day has not been re-checked against its source document. The figures are as parsed from the report named above.',
    };
  }

  const reconstructed = Boolean(entry.parserVersion?.includes('reconstructed'));
  const parts = [VERDICT_COPY[entry.verdict] ?? 'Checked against its source document.'];
  if (duplicateSentence) parts.unshift(duplicateSentence);

  if (reconstructed) {
    parts.push(
      'It was read by a reconstructed parser — one rebuilt to handle a layout PGCB no longer publishes — rather than by a parser written against the live format.',
    );
  }
  if (!entry.gasVerified) {
    parts.push('The gas half of this day has not been confirmed against Petrobangla’s own document.');
  }

  return {
    day,
    verified: true,
    duplicateSuspect,
    verdict: entry.verdict,
    reconstructed,
    parserVersion: entry.parserVersion,
    gasVerified: entry.gasVerified,
    summary: parts.join(' '),
  };
}

/** True when a day's state warrants telling the reader before they read the figures. */
export function provenanceNeedsDisclosure(p: DayProvenance): boolean {
  return (
    !p.verified ||
    p.reconstructed ||
    p.duplicateSuspect !== null ||
    p.verdict === 'INDICATOR' ||
    p.verdict === 'HASH'
  );
}
