/**
 * Repoint each grid day's Petrobangla citation at the document it was actually
 * parsed from.
 *
 * `verify:data` reports 45 ERRORs of two shapes, and both are citation faults,
 * not figure faults:
 *
 *   citation-offset (42)       the day cites `petrobangla_<D>.pdf`, a synthetic
 *                              start-keyed name, while its figures came from
 *                              `Daily-Gas-Intake-Offtake-Report (<D+1>.pdf)`.
 *                              Petrobangla names a report for the morning the
 *                              gas day CLOSES, so the D-named file is a real,
 *                              different document — the day before's.
 *
 *   provenance-agreement (3)   the day names an opaque filename (a UUID, or a
 *                              bare `11-08-26.pdf`) that carries no date to
 *                              reconcile and is not the report for the window.
 *
 * The archive under `public/data/petrobangla/daily/` records, per gas day,
 * the `meta.source_filename` the parser actually read. That is the provenance
 * of record; the grid day's `sourceFiles.petrobangla` is a citation that
 * drifted from it.
 *
 * SAFETY: a citation is only rewritten when the grid day's own gas rows sum to
 * the archive entry's printed grand total. If they disagree, the day has a
 * figure problem rather than a naming one, and it is reported and left alone —
 * repointing the citation there would paper over the real fault.
 *
 *   node scripts/fix-gas-citations.mjs           # report
 *   node scripts/fix-gas-citations.mjs --write   # apply
 */
import fs from 'node:fs';
import path from 'node:path';

const DAILY = 'public/data/daily';
const GAS = 'public/data/petrobangla/daily';
const WRITE = process.argv.includes('--write');
/** Rows and printed total are both rounded in the source; allow the rounding. */
const TOLERANCE_MMCFD = 1.0;

const archive = new Map();
for (const file of fs.readdirSync(GAS)) {
  if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(file)) continue;
  let a;
  try {
    a = JSON.parse(fs.readFileSync(path.join(GAS, file), 'utf8'));
  } catch {
    continue;
  }
  const start = a?.report?.gas_day_start;
  if (!start || archive.has(start)) continue;
  archive.set(start, {
    source: a.meta?.source_filename ?? null,
    printed: typeof a.production?.grand_total?.gas_mmcfd === 'number'
      ? a.production.grand_total.gas_mmcfd
      : null,
  });
}

const dateInName = (name) => {
  const m = /\((\d{2})\.(\d{2})\.(\d{2})\)/.exec(name ?? '');
  return m ? `20${m[3]}-${m[2]}-${m[1]}` : null;
};

const fixed = [];
const skipped = [];
const mismatched = [];

for (const file of fs.readdirSync(DAILY).sort()) {
  if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(file)) continue;
  const day = file.slice(0, -5);

  let d;
  try {
    d = JSON.parse(fs.readFileSync(path.join(DAILY, file), 'utf8'));
  } catch {
    continue;
  }

  const cited = d.sourceFiles?.petrobangla;
  if (!cited) continue;

  const entry = archive.get(day);
  if (!entry?.source) {
    skipped.push(`${day}  no archive window opens on this day`);
    continue;
  }
  if (cited === entry.source) continue;

  // Already the real report, named by its window-end? Then it is correct.
  const citedDate = dateInName(cited);
  const nextDay = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8) + 1))
    .toISOString()
    .slice(0, 10);
  if (citedDate === nextDay) continue;

  const rows = d.gasProductionData ?? [];
  const sum = rows.reduce((a, r) => a + (r.gas ?? 0), 0);

  if (entry.printed == null || Math.abs(sum - entry.printed) > TOLERANCE_MMCFD) {
    mismatched.push(
      `${day}  rows sum ${sum.toFixed(1)} but ${entry.source} prints ${entry.printed ?? 'nothing'} — figures disagree, left alone`,
    );
    continue;
  }

  fixed.push(`${day}  ${cited}  ->  ${entry.source}   (${sum.toFixed(1)} MMcfd confirmed)`);

  if (WRITE) {
    // Surgical: replace the one string and leave every other byte alone.
    // Re-serialising the object reformats nested arrays, which would turn a
    // one-field correction into a 2 KB diff on each of 44 files and bury the
    // change nobody could then review.
    const full = path.join(DAILY, file);
    const raw = fs.readFileSync(full, 'utf8');
    const needle = JSON.stringify(cited);
    const at = raw.indexOf('"petrobangla"');
    const idx = at >= 0 ? raw.indexOf(needle, at) : -1;
    if (idx < 0) {
      console.error(`  ! ${day}: could not locate the citation string to replace`);
    } else {
      fs.writeFileSync(
        full,
        raw.slice(0, idx) + JSON.stringify(entry.source) + raw.slice(idx + needle.length),
      );
    }
  }
}

console.log(`\n${fixed.length} citations repointed at the document their figures came from:`);
for (const line of fixed) console.log('  ' + line);

if (mismatched.length) {
  console.log(`\n${mismatched.length} left alone — the figures, not the name, are the problem:`);
  for (const line of mismatched) console.log('  ' + line);
}
if (skipped.length) {
  console.log(`\n${skipped.length} skipped (no archive window):`);
  for (const line of skipped.slice(0, 10)) console.log('  ' + line);
  if (skipped.length > 10) console.log(`  … ${skipped.length - 10} more`);
}

console.log(WRITE ? '\nWritten.' : '\nDry run — pass --write to apply.');
