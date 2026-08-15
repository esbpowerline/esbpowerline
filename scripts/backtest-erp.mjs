/**
 * Back-test the archive against PGCB's own hourly generation feed.
 *
 * Our daily archive is parsed from the ERP daily workbook. This page is a
 * different publication by the same body — hourly generation, load shed and
 * fuel split, rendered in Bengali numerals:
 *
 *   https://erp.powergrid.gov.bd/web/generations/view_generations_bn?page=N
 *
 * That makes it a genuinely independent check. Agreement means two PGCB
 * publications say the same thing and our parse sits between them; disagreement
 * is either a parse defect on our side or PGCB contradicting itself, and the
 * size and sign of the gap usually says which.
 *
 * Compares, per hour: generation (MW) and load shed (MW).
 *
 * Usage:
 *   node scripts/backtest-erp.mjs                # 3 pages (~6 days)
 *   node scripts/backtest-erp.mjs --pages 10
 *   node scripts/backtest-erp.mjs --pages 5 --tolerance 5 --verbose
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const PAGES = Number(arg('pages', 3));
const TOL = Number(arg('tolerance', 1));
const VERBOSE = argv.includes('--verbose');

const BASE = 'https://erp.powergrid.gov.bd/web/generations/view_generations_bn';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const BN = '০১২৩৪৫৬৭৮৯';
const deBn = (s) => s.replace(/[০-৯]/g, (c) => String(BN.indexOf(c)));
const strip = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const toNum = (s) => {
  const v = parseFloat(deBn(s).replace(/,/g, ''));
  return Number.isFinite(v) ? v : null;
};

// curl rather than node's fetch: node rejects this host's TLS chain here while
// curl accepts it, and the point of the exercise is to reach PGCB, not to argue
// with a certificate store.
function page(n) {
  const html = execFileSync(
    'curl',
    ['-s', '-L', '--max-time', '90', '-A', UA, `${BASE}?page=${n}`],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  if (!html || html.length < 1000) throw new Error(`page ${n}: ${html.length} bytes`);
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => strip(c[1])))
    .filter((r) => r.length > 10 && /^[০-৯]{2}-[০-৯]{2}-[০-৯]{4}$/.test(r[0]));
}

// Column order is positional: date, time, generation, shortfall, loadshed, then fuels.
const parse = (r) => ({
  date: deBn(r[0]).split('-').reverse().join('-'),   // DD-MM-YYYY -> YYYY-MM-DD
  time: deBn(r[1]).slice(0, 5),                      // HH:MM
  generation: toNum(r[2]),
  loadShed: toNum(r[4]),
});

const rows = [];
for (let p = 1; p <= PAGES; p++) {
  try {
    const got = page(p);
    rows.push(...got.map(parse));
    process.stderr.write(`  page ${p}: ${got.length} rows\n`);
  } catch (e) {
    process.stderr.write(`  page ${p}: ${e.message}\n`);
  }
}

const byDate = new Map();
for (const r of rows) {
  if (!byDate.has(r.date)) byDate.set(r.date, new Map());
  byDate.get(r.date).set(r.time, r);
}

console.log(`\nback-test vs PGCB hourly feed — ${rows.length} hourly rows, ${byDate.size} day(s)\n`);
console.log('DATE'.padEnd(12) + 'HRS'.padStart(4) + 'GEN match'.padStart(11) + 'worst ΔMW'.padStart(11) + 'SHED match'.padStart(12) + 'worst ΔMW'.padStart(11));
console.log('-'.repeat(61));

let anyDay = false;
for (const [date, hours] of [...byDate].sort()) {
  const p = path.join('public/data/daily', `${date}.json`);
  if (!fs.existsSync(p)) {
    console.log(date.padEnd(12) + String(hours.size).padStart(4) + '   not in our archive');
    continue;
  }
  anyDay = true;
  const ours = JSON.parse(fs.readFileSync(p, 'utf8')).hourlyLoadData ?? [];
  const mine = new Map(ours.map((h) => [String(h.time ?? h.hour ?? '').slice(0, 5), h]));

  let genOk = 0, genN = 0, genWorst = 0, shedOk = 0, shedN = 0, shedWorst = 0;
  const diffs = [];
  for (const [time, theirs] of hours) {
    const o = mine.get(time);
    if (!o) continue;
    if (theirs.generation != null && o.generation != null) {
      genN++;
      const d = Math.abs(theirs.generation - o.generation);
      if (d <= TOL) genOk++; else { genWorst = Math.max(genWorst, d); diffs.push(`${time} gen ours ${o.generation} vs PGCB ${theirs.generation} (Δ${d.toFixed(0)})`); }
    }
    if (theirs.loadShed != null && o.loadShed != null) {
      shedN++;
      const d = Math.abs(theirs.loadShed - o.loadShed);
      if (d <= TOL) shedOk++; else { shedWorst = Math.max(shedWorst, d); diffs.push(`${time} shed ours ${o.loadShed} vs PGCB ${theirs.loadShed} (Δ${d.toFixed(0)})`); }
    }
  }
  console.log(
    date.padEnd(12) + String(hours.size).padStart(4) +
    `${genOk}/${genN}`.padStart(11) + (genWorst ? genWorst.toFixed(0) : '-').padStart(11) +
    `${shedOk}/${shedN}`.padStart(12) + (shedWorst ? shedWorst.toFixed(0) : '-').padStart(11),
  );
  if (VERBOSE) for (const d of diffs.slice(0, 12)) console.log('    ' + d);
}

if (!anyDay) {
  console.log('\nNo overlapping days. The feed carries the most recent days; widen with --pages.');
}
console.log('\nGEN/SHED match = hours agreeing within ±' + TOL + ' MW. Times are matched on HH:MM.');
