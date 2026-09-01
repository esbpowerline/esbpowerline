import 'server-only';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  describeDayProvenance,
  type DayProvenance,
  type LedgerDay,
} from '@/lib/data/grid/verification-ledger';

/**
 * Read `verification/source-ledger.json` once per server process.
 *
 * The ledger is the only record of what `verify:source` found, and the audit's
 * observation about it was that it "is a file nobody is required to read". It
 * is read here so the interface can.
 *
 * Not in `public/`: this is the operator's evidence file, and the reader gets a
 * sentence derived from it, not the raw diffs.
 */

type Ledger = { generated_at?: string; days?: Record<string, LedgerDay> };

let cached: Ledger | null | undefined;
let cachedMtimeMs = -1;

function loadLedger(): Ledger | null {
  const file = path.join(process.cwd(), 'verification', 'source-ledger.json');

  // Keyed on the file's mtime rather than cached once per process. The ledger
  // is written by `verify:source`, a script that runs outside the app, so a
  // plain memo would hold whatever was on disk when the server booted — for as
  // long as the server lives. That is how a day repaired and re-verified at
  // 13:40 was still telling readers "this day disagrees with its source" at
  // 13:45: the figures were right and the disclosure over them was stale.
  let mtimeMs = -1;
  try {
    mtimeMs = existsSync(file) ? statSync(file).mtimeMs : -1;
  } catch {
    mtimeMs = -1;
  }

  if (cached !== undefined && mtimeMs === cachedMtimeMs) return cached;

  try {
    cached = mtimeMs >= 0 ? (JSON.parse(readFileSync(file, 'utf8')) as Ledger) : null;
  } catch {
    // A malformed ledger must not break the page. The reader is then told the
    // day has not been checked, which is the safe thing to say.
    cached = null;
  }
  cachedMtimeMs = mtimeMs;
  return cached;
}

/** Provenance for one day, always answerable — an unverified day says so. */
export function getDayProvenance(day: string): DayProvenance {
  return describeDayProvenance(day, loadLedger()?.days?.[day]);
}

/** How much of the archive has been re-checked, for the methodology note. */
export function getLedgerCoverage(): { verified: number; generatedAt: string | null } {
  const ledger = loadLedger();
  return {
    verified: ledger?.days ? Object.keys(ledger.days).length : 0,
    generatedAt: ledger?.generated_at ?? null,
  };
}

/**
 * A slim day→verdict map for the client.
 *
 * The ledger entries carry full diffs — every path that disagreed, with both
 * values — which is the operator's evidence and has no business crossing to a
 * browser. Three scalars per day is what the disclosure needs, and 55 of those
 * is under 4 KB.
 */
export function getLedgerSummaries(): Record<string, LedgerDay> {
  const days = loadLedger()?.days;
  if (!days) return {};
  const out: Record<string, LedgerDay> = {};
  for (const [day, entry] of Object.entries(days)) {
    out[day] = {
      day,
      verdict: entry.verdict,
      parserVersion: entry.parserVersion ?? null,
      gasVerified: Boolean(entry.gasVerified),
      hash: null,
    };
  }
  return out;
}
