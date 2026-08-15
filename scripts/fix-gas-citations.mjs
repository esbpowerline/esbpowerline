/**
 * Repair the Petrobangla citation on the daily archive.
 *
 * `verify:data` reports two defects in `sourceFiles.petrobangla`. Both are about
 * which document a day names, and neither changes a published figure:
 *
 *   backfill — 41 days carry real gas and name no Petrobangla report at all.
 *   offset   — ~1,380 days name the report for the day BEFORE their figures.
 *
 * The offset comes from the report's own date convention. Petrobangla publishes
 * a file "(D+1).pdf" that prints the window "D to D+1", so that file is gas day
 * D's document. The archive stores it under D+1, and the daily builder took the
 * filename's date to be the gas day — which lands one day early, on a report
 * that exists and holds different figures. The PGCB citation on the same line
 * is unaffected: it already names its workbook correctly.
 *
 * A citation is only ever rewritten to a document that supports the numbers the
 * day already publishes. The guard is the archive window's own field rows: if
 * they do not sum to the day's gas total within GAS_TOLERANCE, the day is left
 * exactly as it is and reported as unresolved. Nothing here edits a figure.
 *
 * Files are patched as text rather than re-serialised: they are CRLF with no
 * trailing newline, and `core.autocrlf` is on, so a JSON round-trip would
 * rewrite all 4,529 of them instead of the ones that changed.
 *
 * Usage:
 *   node scripts/fix-gas-citations.mjs                  # dry run, both classes
 *   node scripts/fix-gas-citations.mjs --only backfill  # just the 41
 *   node scripts/fix-gas-citations.mjs --only offset    # just the ~1,380
 *   node scripts/fix-gas-citations.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';

const DAILY = 'public/data/daily';
const GAS = 'public/data/petrobangla/daily';

// Our six company rows are a rollup of the document's 23 field rows, so they
// agree to rounding. 1.0 MMCFD is ~0.04% of a typical day and comfortably above
// the observed spread; days that miss it are reported, never rewritten.
const GAS_TOLERANCE = 1.0;

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const arg = (n, f = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : f;
};
const APPLY = has('apply');
const ONLY = arg('only');
const runs = (n) => !ONLY || ONLY === n;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// Index the archive on the window start each report states. The filename is not
// a usable key: through 2026-06 a report is stored under the day its window
// ends, and only the reconstructed 2026-08 files under the day it starts.
const byGasDay = new Map();
for (const f of fs.readdirSync(GAS)) {
  if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(f)) continue;
  let a;
  try {
    a = JSON.parse(fs.readFileSync(path.join(GAS, f), 'utf8'));
  } catch {
    continue;
  }
  const start = a?.report?.gas_day_start;
  if (!start || byGasDay.has(start)) continue;
  const fields = a.production?.fields;
  byGasDay.set(start, {
    source: a.meta?.source_filename ?? null,
    label: a.report?.report_date_label ?? null,
    fieldSum: fields?.length ? fields.reduce((x, r) => x + (num(r.gas_mmcfd) ?? 0), 0) : null,
  });
}

const jsonString = (s) => JSON.stringify(s);

/** Insert or replace `"petrobangla": "<file>"` inside the sourceFiles object. */
const patch = (raw, source) => {
  const m = raw.match(/"sourceFiles"\s*:\s*\{([^}]*)\}/);
  if (!m) return null;
  const body = m[1];
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  let next;
  if (/"petrobangla"\s*:/.test(body)) {
    next = body.replace(/("petrobangla"\s*:\s*)"(?:[^"\\]|\\.)*"/, `$1${jsonString(source)}`);
  } else {
    // Match the indentation of the key already present, and follow the file's
    // own ordering, which puts pgcb first.
    const indent = body.match(/(?:\r?\n)([ \t]+)"/)?.[1] ?? '    ';
    const trimmedEnd = body.replace(/\s*$/, '');
    const closingIndent = body.match(/(?:\r?\n)([ \t]*)$/)?.[1] ?? '  ';
    next = `${trimmedEnd},${eol}${indent}"petrobangla": ${jsonString(source)}${eol}${closingIndent}`;
  }
  if (next === body) return null;
  return raw.slice(0, m.index) + `"sourceFiles": {${next}}` + raw.slice(m.index + m[0].length);
};

const days = fs
  .readdirSync(DAILY)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .map((f) => f.slice(0, -5))
  .sort();

const changed = { backfill: [], offset: [] };
const skipped = [];

for (const day of days) {
  const file = path.join(DAILY, `${day}.json`);
  const raw = fs.readFileSync(file, 'utf8');
  let d;
  try {
    d = JSON.parse(raw);
  } catch {
    continue;
  }

  const gas = d.gasProductionData?.length
    ? d.gasProductionData.reduce((x, r) => x + (num(r.gas) ?? 0), 0)
    : 0;
  if (!gas) continue;

  const cited = d.sourceFiles?.petrobangla ?? null;
  const arc = byGasDay.get(day);
  if (!arc?.source) {
    if (!cited) skipped.push([day, 'no archive window starts on this day']);
    continue;
  }
  if (cited === arc.source) continue;

  const kind = cited ? 'offset' : 'backfill';
  if (!runs(kind)) continue;

  // The guard: only cite a document whose own rows carry this day's figures.
  if (arc.fieldSum == null || Math.abs(gas - arc.fieldSum) > GAS_TOLERANCE) {
    skipped.push([
      day,
      `${arc.source} field rows ${arc.fieldSum?.toFixed(1) ?? 'n/a'} do not match published gas ${gas.toFixed(1)}`,
    ]);
    continue;
  }

  const next = patch(raw, arc.source);
  if (!next) {
    skipped.push([day, 'could not locate sourceFiles to patch']);
    continue;
  }
  if (APPLY) fs.writeFileSync(file, next);
  changed[kind].push([day, cited, arc.source]);
}

const show = (label, rows) => {
  if (!runs(label)) return;
  console.log(`\n${label}: ${rows.length} day(s)`);
  for (const [day, from, to] of rows.slice(0, 8)) {
    console.log(`  ${day}  ${from ? `${from}  ->  ` : '(none)  ->  '}${to}`);
  }
  if (rows.length > 8) console.log(`  … ${rows.length - 8} more`);
};

console.log(APPLY ? 'fix-gas-citations — APPLYING' : 'fix-gas-citations — dry run (pass --apply to write)');
show('backfill', changed.backfill);
show('offset', changed.offset);

if (skipped.length) {
  console.log(`\nleft unchanged: ${skipped.length} day(s)`);
  for (const [day, why] of skipped.slice(0, 12)) console.log(`  ${day}  ${why}`);
  if (skipped.length > 12) console.log(`  … ${skipped.length - 12} more`);
}

const total = changed.backfill.length + changed.offset.length;
console.log(`\n${APPLY ? 'rewrote' : 'would rewrite'} ${total} citation(s); no published figure is touched.`);
