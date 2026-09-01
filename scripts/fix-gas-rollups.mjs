/**
 * Repair grid days whose six-company gas rollup drops a field.
 *
 * The daily report's `gasProductionData` is a six-row rollup of the Petrobangla
 * document's field table. On 14 days it does not add up to the document it was
 * rolled up from — 11 days short by 2.0 MMcfd, two by 8.1, one by 8.0.
 *
 * 2020-09-26 is the worked example, and it was the last unresolved `verify:data`
 * ERROR in the archive. Its BGFCL, BAPEX, Chevron, Tullow and RPGCL rows all
 * reconcile exactly against the document's own field rows. Its SGFL row is
 * 101.4 where the fields sum to 109.5 — short by precisely Beanibazar's 8.1.
 * One field, silently absent from one company's subtotal, and the day's national
 * total with it.
 *
 * The grouping below is not invented: it is read off days where the rollup and
 * the document agree exactly. On 2026-07-02, BGFCL 478.8 = Titas + Habiganj +
 * Bakhrabad + Narsingdi + Meghna to the decimal, Chevron 887.9 is the CHEVRON
 * rows less Bangora, and Tullow 31.1 is Bangora alone.
 *
 *   node scripts/fix-gas-rollups.mjs           # report
 *   node scripts/fix-gas-rollups.mjs --write   # apply
 *
 * SAFETY: a day is only touched when every one of its six rows can be
 * reconstructed from the document's fields, when exactly the short rows differ,
 * and when the corrected total then equals the document's field sum. A day with
 * an unrecognised field name, or one where the arithmetic does not close, is
 * reported and left alone — a rollup that cannot be derived must not be guessed.
 */
import fs from 'node:fs';
import path from 'node:path';

const DAILY = 'public/data/daily';
const GAS = 'public/data/petrobangla/daily';
const WRITE = process.argv.includes('--write');
const EPS = 0.35; // six one-decimal rows compound to 0.3 of legal rounding

/** Field -> company, read off days where rollup and document agree exactly. */
const FIELD_COMPANY = new Map(
  Object.entries({
    Titas: 'BGFCL', Habiganj: 'BGFCL', Bakhrabad: 'BGFCL', Narsingdi: 'BGFCL', Meghna: 'BGFCL',
    Sylhet: 'SGFL', 'Kailashtila #1 (Silicagel)': 'SGFL', 'Kailashtila #2 (MSTE)': 'SGFL',
    Rashidpur: 'SGFL', Beanibazar: 'SGFL',
    Salda: 'BAPEX', Fenchuganj: 'BAPEX', Shahbazpur: 'BAPEX', Semutung: 'BAPEX',
    Sundalpur: 'BAPEX', Srikail: 'BAPEX', Begumganj: 'BAPEX', Rupganj: 'BAPEX',
    Jalalabad: 'CHEVRON', Maulavibazar: 'CHEVRON', Bibiyana: 'CHEVRON',
    Bangora: 'TULLOW',
    'R-LNG Terminal': 'RPGCL',
  }),
);

/** The rollup row each company writes to, matched on the stored label's prefix. */
const ROW_PREFIX = {
  BGFCL: 'BGFCL', SGFL: 'SGFL', BAPEX: 'BAPEX',
  CHEVRON: 'Chevron', TULLOW: 'Tullow', RPGCL: 'RPGCL',
};

const gasByStart = new Map();
for (const file of fs.readdirSync(GAS)) {
  if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(file)) continue;
  try {
    const a = JSON.parse(fs.readFileSync(path.join(GAS, file), 'utf8'));
    const start = a?.report?.gas_day_start;
    if (start && !gasByStart.has(start)) gasByStart.set(start, a.production?.fields ?? []);
  } catch {
    /* a malformed archive day is not this script's business */
  }
}

const fixed = [];
const skipped = [];

for (const file of fs.readdirSync(DAILY).sort()) {
  if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(file)) continue;
  const day = file.slice(0, -5);

  const fields = gasByStart.get(day);
  if (!fields?.length) continue;

  const full = path.join(DAILY, file);
  const raw = fs.readFileSync(full, 'utf8');
  const stored = JSON.parse(raw);
  const rows = stored.gasProductionData ?? [];
  if (!rows.length) continue;

  const storedSum = rows.reduce((a, r) => a + (r.gas ?? 0), 0);
  if (storedSum === 0) continue; // absent window, not a rollup fault

  const docSum = fields.reduce((a, f) => a + (f.gas_mmcfd ?? 0), 0);
  if (Math.abs(docSum - storedSum) <= EPS) continue;

  // Reconstruct every company from the document's own rows.
  const byCompany = {};
  const unknown = new Set();
  for (const f of fields) {
    const company = FIELD_COMPANY.get(String(f.field));
    if (!company) {
      unknown.add(String(f.field));
      continue;
    }
    byCompany[company] = (byCompany[company] ?? 0) + (f.gas_mmcfd ?? 0);
  }

  if (unknown.size) {
    skipped.push(`${day}  unrecognised field(s): ${[...unknown].join(', ')} — left alone`);
    continue;
  }

  const corrections = [];
  let ok = true;
  for (const row of rows) {
    const key = Object.keys(ROW_PREFIX).find((k) => row.company.startsWith(ROW_PREFIX[k]));
    if (!key || byCompany[key] === undefined) {
      ok = false;
      break;
    }
    const want = +byCompany[key].toFixed(1);
    if (Math.abs((row.gas ?? 0) - want) > EPS) corrections.push({ row, from: row.gas, to: want });
  }

  if (!ok) {
    skipped.push(`${day}  rollup rows do not map onto the document's companies — left alone`);
    continue;
  }

  const corrected = rows.reduce(
    (a, r) => a + (corrections.find((c) => c.row === r)?.to ?? r.gas ?? 0),
    0,
  );
  if (Math.abs(corrected - docSum) > EPS) {
    skipped.push(
      `${day}  corrected total ${corrected.toFixed(1)} still misses the document's ${docSum.toFixed(1)} — left alone`,
    );
    continue;
  }

  fixed.push(
    `${day}  ${corrections
      .map((c) => `${c.row.company.split(' ')[0]} ${c.from} -> ${c.to}`)
      .join('; ')}   (total ${storedSum.toFixed(1)} -> ${corrected.toFixed(1)})`,
  );

  if (WRITE) {
    // Surgical, like the citation repair: rewrite only the numbers that move,
    // so a one-field correction stays a one-line diff.
    let out = raw;
    for (const c of corrections) {
      const label = JSON.stringify(c.row.company);
      const at = out.indexOf(label);
      if (at < 0) continue;
      const gasAt = out.indexOf('"gas"', at);
      if (gasAt < 0) continue;
      const m = /"gas":\s*(-?[\d.]+)/.exec(out.slice(gasAt, gasAt + 60));
      if (!m) continue;
      out = out.slice(0, gasAt) + `"gas": ${c.to}` + out.slice(gasAt + m[0].length);
    }
    fs.writeFileSync(full, out);
  }
}

console.log(`\n${fixed.length} day(s) whose rollup can be reconciled with its document:`);
for (const line of fixed) console.log('  ' + line);
if (skipped.length) {
  console.log(`\n${skipped.length} left alone:`);
  for (const line of skipped.slice(0, 15)) console.log('  ' + line);
  if (skipped.length > 15) console.log(`  … ${skipped.length - 15} more`);
}
console.log(WRITE ? '\nWritten.' : '\nDry run — pass --write to apply.');
