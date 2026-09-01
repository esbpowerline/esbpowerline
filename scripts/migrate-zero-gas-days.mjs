/**
 * Migrate the legacy "six rows of 0.0" gas convention to the modern omission rule.
 *
 * Before 2026-08-14 the archive represented an unpublished Petrobangla window as gas
 * tables full of explicit zeros. Zero is a claim — it says the measurement happened and
 * came out zero; 4,545 days of national gas production at 0.0 MMcfd is not a measurement,
 * it is a filing gap dressed as one. Commit 48c7152a set the rule (omit the sections;
 * verify-data reads omission as "awaiting the Petrobangla window") but only new days
 * followed it. verify:data counts the legacy days as `INFO zero-gas` — 3,055 of them at
 * the time this script was written. The homepage happens to know the zero convention;
 * the next consumer will not, and will read a national gas collapse.
 *
 * What this migrates: days where EVERY measurement column in EVERY row of BOTH gas
 * tables is exactly 0 (the `fields` column is a count of gas fields, not a measurement,
 * and is ignored). The sections are deleted; nothing else in the file changes.
 *
 * What this refuses, and why:
 *  - a partially zeroed table (some companies report, others 0) — that is the
 *    `WARN zero-gas` class: it may be a real partial filing and is not ours to decide;
 *  - an all-zero day that names a Petrobangla document in sourceFiles or
 *    observationWindows — a document exists claiming zeros, so deleting the table would
 *    erase a source's own statement; triage by reading the document instead;
 *  - a file whose spliced text does not parse back to exactly the original object minus
 *    the two keys.
 *
 * The edit is a textual splice of the two key blocks, not a reserialization: these files
 * were written by Python, whose json module prints integer-valued floats as `2661.0`.
 * JSON.stringify collapses that to `2661` on every such value in the file — a full
 * rewrite would bury the real change under thousands of cosmetic ones.
 *
 * Dry-run by default; --write applies. Reversal is `git checkout -- public/data/daily`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const ROOT = process.cwd();

const dates = JSON.parse(readFileSync(path.join(ROOT, 'lib', 'available-dates.json'), 'utf8'));
const days = Array.isArray(dates) ? dates : dates.dates;

// Every numeric measurement column must be exactly 0. `fields` counts gas fields per
// company (5 for BGFCL, 9 for BAPEX, ...) and is nonzero on legitimately empty days.
function tableAllZero(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.every((row) =>
    Object.entries(row).every(([key, value]) => {
      if (key === 'fields' || typeof value !== 'number') return true;
      return value === 0;
    }),
  );
}

function tableHasAnyValue(rows) {
  if (!Array.isArray(rows)) return false;
  return rows.some((row) =>
    Object.entries(row).some(
      ([key, value]) => key !== 'fields' && typeof value === 'number' && value !== 0,
    ),
  );
}

/**
 * Remove `"key": [ ... ],` from pretty-printed JSON text, whole lines, nothing else.
 * Returns null when the shape is not what it expects — the caller refuses the day.
 */
function spliceOutArrayKey(text, key) {
  const idx = text.indexOf(`"${key}"`);
  if (idx === -1) return text;

  const lineStart = text.lastIndexOf('\n', idx) + 1; // 0 if the key is on the first line
  const open = text.indexOf('[', idx);
  if (open === -1) return null;

  let depth = 0;
  let close = -1;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']' && --depth === 0) {
      close = i;
      break;
    }
  }
  if (close === -1) return null;

  let end = close + 1;
  if (text[end] === ',') end++;
  if (text[end] === '\r') end++;
  if (text[end] === '\n') end++;
  return text.slice(0, lineStart) + text.slice(end);
}

let migrated = 0;
let alreadyModern = 0;
let carriesGas = 0;
const refused = [];
const migratedDays = [];

for (const day of days) {
  const file = path.join(ROOT, 'public', 'data', 'daily', `${day}.json`);
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    continue; // a listed day with no static file is DataRelease-only — nothing to migrate
  }
  const d = JSON.parse(raw);

  const prod = d.gasProductionData;
  const dist = d.gasDistributionData;

  if (prod === undefined && dist === undefined) {
    alreadyModern++;
    continue;
  }
  if (tableHasAnyValue(prod) || tableHasAnyValue(dist)) {
    carriesGas++;
    continue;
  }

  const prodZero = prod === undefined || tableAllZero(prod);
  const distZero = dist === undefined || tableAllZero(dist);
  if (!prodZero || !distZero) {
    refused.push([day, 'gas table is neither all-zero nor carrying values — malformed rows']);
    continue;
  }

  if (d.sourceFiles?.petrobangla) {
    refused.push([day, `all-zero but sourceFiles names ${d.sourceFiles.petrobangla} — a document claims these zeros`]);
    continue;
  }
  if (d.observationWindows?.petrobangla) {
    refused.push([day, 'all-zero but observationWindows carries a Petrobangla window']);
    continue;
  }

  const afterProd = spliceOutArrayKey(raw, 'gasProductionData');
  const spliced = afterProd === null ? null : spliceOutArrayKey(afterProd, 'gasDistributionData');
  if (spliced === null) {
    refused.push([day, 'gas block not shaped as a whole-line array — will not guess at the splice']);
    continue;
  }

  // The proof: the spliced text must parse to exactly the original object minus the two
  // keys. Anything else — a swallowed comma, a bracket inside a company name, a second
  // occurrence of the key — fails here and the day is refused untouched.
  delete d.gasProductionData;
  delete d.gasDistributionData;
  let parsedBack;
  try {
    parsedBack = JSON.parse(spliced);
  } catch {
    refused.push([day, 'spliced text no longer parses — refused']);
    continue;
  }
  if (JSON.stringify(parsedBack) !== JSON.stringify(d)) {
    refused.push([day, 'spliced text parses to something other than the day minus its gas tables — refused']);
    continue;
  }

  if (WRITE) writeFileSync(file, spliced);
  migrated++;
  migratedDays.push(day);
}

console.log(`${migrated} day(s) hold all-zero gas tables with no Petrobangla source — sections ${WRITE ? 'removed' : 'would be removed'}`);
if (migratedDays.length) {
  console.log(`  range: ${migratedDays[0]} .. ${migratedDays[migratedDays.length - 1]}`);
}
console.log(`${carriesGas} day(s) carry real gas figures — untouched`);
console.log(`${alreadyModern} day(s) already omit the sections — untouched`);

if (refused.length) {
  console.log(`\n${refused.length} refused:`);
  for (const [day, why] of refused) console.log(`  ${day}  ${why}`);
}

if (!WRITE) console.log('\nDry run — pass --write to apply.');
