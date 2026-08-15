/**
 * Standing reconciliation over the published daily archive.
 *
 * The archive is 4,500+ days and nobody can eyeball it. Every real defect found
 * in it so far was caught the same way — by checking a figure against something
 * else that should agree with it, not by trusting the parser that produced it:
 *
 *   - 2026-08-14 shipped gas byte-identical to 08-13 because the extractor said
 *     "carried forward" and meant it. Caught by comparing consecutive days.
 *   - 396 vs 414 MW load shedding. Caught by summing the zones.
 *   - 2026-08-10 shipped 2329.6 MMCFD against a printed 2199.1. Caught by
 *     comparing the day against its own source.
 *
 * So this asserts the identities that must hold and prints the days that break
 * them. It is deliberately not a test suite: most findings are the source's own
 * inconsistencies, which are reported as published and must stay that way. The
 * severities separate "PGCB disagrees with itself" from "we corrupted this".
 *
 *   ERROR — the archive asserts something no source said. Fix these.
 *   WARN  — the source disagrees with itself. Report, never silently repair.
 *   INFO  — a known-incomplete day, e.g. grid published before its gas.
 *
 * Usage:
 *   npm run verify:data
 *   npm run verify:data -- --from 2026-08-01
 *   npm run verify:data -- --check carry-forward --verbose
 *   npm run verify:data -- --errors-only
 */
import fs from 'node:fs';
import path from 'node:path';

const DAILY = 'public/data/daily';
const GAS = 'public/data/petrobangla/daily';

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const FROM = arg('from', '0000-00-00');
const TO = arg('to', '9999-99-99');
const ONLY = arg('check');
const VERBOSE = has('verbose');
const ERRORS_ONLY = has('errors-only');
const SHOW = VERBOSE ? Infinity : 8;

const findings = [];
const record = (check, severity, day, message) => findings.push({ check, severity, day, message });

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const zoneShed = (z) => num(z.loadShedding) ?? num(z.loadShed) ?? 0;
const stable = (v) => JSON.stringify(v ?? null);

const days = fs
  .readdirSync(DAILY)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .map((f) => f.slice(0, -5))
  .filter((d) => d >= FROM && d <= TO)
  .sort();

if (!days.length) {
  console.error(`No days in range ${FROM}..${TO}`);
  process.exit(2);
}

const read = (dir, day) => {
  const p = path.join(dir, `${day}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    record('unreadable', 'ERROR', day, `${dir}: ${e.message}`);
    return null;
  }
};

const runs = (name) => !ONLY || ONLY === name;

let prev = null;
let prevDay = null;

for (const day of days) {
  const d = read(DAILY, day);
  if (!d) continue;
  const ss = d.systemStats ?? {};
  const zones = d.regionalDemandData ?? [];
  const hourly = d.hourlyLoadData ?? [];
  const gasProd = d.gasProductionData ?? null;

  // 1. Zone demand should reconcile with the national evening peak it is taken at.
  if (runs('zone-demand') && zones.length && num(ss.eveningPeakDemand)) {
    const sum = zones.reduce((a, z) => a + (num(z.demand) ?? 0), 0);
    const gap = sum - ss.eveningPeakDemand;
    const pct = Math.abs(gap) / ss.eveningPeakDemand;
    // 2% absorbs PGCB's own rounding across nine printed zone figures.
    if (pct > 0.02) {
      record('zone-demand', 'WARN', day,
        `zones sum ${sum.toFixed(0)} vs evening peak demand ${ss.eveningPeakDemand.toFixed(0)} (${gap > 0 ? '+' : ''}${gap.toFixed(0)} MW, ${(pct * 100).toFixed(1)}%)`);
    }
  }

  // 2. demand = generation + shedding, on every published hourly row.
  //    PGCB breaks this constantly; it is reported, never repaired.
  if (runs('hourly-balance') && hourly.length) {
    let bad = 0;
    let worst = 0;
    for (const h of hourly) {
      const dem = num(h.demand), gen = num(h.generation), shed = num(h.loadShed) ?? 0;
      if (dem == null || gen == null) continue;
      const gap = dem - (gen + shed);
      if (Math.abs(gap) > 1) { bad++; worst = Math.max(worst, Math.abs(gap)); }
    }
    if (bad) {
      record('hourly-balance', 'WARN', day,
        `${bad}/${hourly.length} rows where demand != generation + shedding (worst ${worst.toFixed(0)} MW)`);
    }
  }

  const gasTotal = gasProd?.length ? gasProd.reduce((a, r) => a + (num(r.gas) ?? 0), 0) : null;
  const prevGasTotal = prev?.gasProductionData?.length
    ? prev.gasProductionData.reduce((a, r) => a + (num(r.gas) ?? 0), 0)
    : null;

  // 3. Gas identical to the day before means a failed fetch was carried forward
  //    and published as though it were this day's reading.
  //
  //    Only when the figures are real. Two consecutive all-zero days are
  //    byte-identical because both are empty, not because either was copied,
  //    and treating that as a finding produced ~3,000 false positives across
  //    the pre-2020 archive where all-zero IS the representation of "no gas".
  if (runs('carry-forward') && gasTotal && prevGasTotal) {
    if (stable(gasProd) === stable(prev.gasProductionData)) {
      record('carry-forward', 'ERROR', day,
        `gasProductionData byte-identical to ${prevDay} at ${gasTotal.toFixed(1)} MMCFD — carried forward, not measured`);
    }
    if (d.gasDistributionData && prev.gasDistributionData &&
        stable(d.gasDistributionData) === stable(prev.gasDistributionData)) {
      record('carry-forward', 'ERROR', day,
        `gasDistributionData byte-identical to ${prevDay}`);
    }
  }

  // 4. How a day says "no gas".
  //
  //    Omitting the sections is the rule 48c7152a states, but it only starts
  //    being followed on 2026-08-14 — before that, six rows of 0.0 is how the
  //    archive has always represented an unpublished window. That is a legacy
  //    convention, not a corrupted day, so it is INFO and counted rather than
  //    demanded back. What WOULD be wrong is a partially zeroed table, where
  //    some companies report and others silently do not.
  if (runs('zero-gas') && gasProd?.length) {
    const zeros = gasProd.filter((r) => (num(r.gas) ?? 0) === 0).length;
    if (zeros === gasProd.length) {
      record('zero-gas', 'INFO', day,
        `${gasProd.length} gas rows all zero — legacy form of "window not published"`);
    } else if (zeros > 0) {
      record('zero-gas', 'WARN', day,
        `${zeros}/${gasProd.length} gas rows zero while others report — partial table`);
    }
  }
  if (runs('zero-gas') && !gasProd) {
    record('zero-gas', 'INFO', day, 'gas sections omitted (awaiting the Petrobangla window)');
  }

  // 5. Provenance: a day carrying real gas figures must name where they came
  //    from. A day whose gas rows are all zero is naming nothing because there
  //    is nothing to name.
  if (runs('provenance')) {
    const sf = d.sourceFiles;
    if (!sf) {
      record('provenance', 'ERROR', day, 'no sourceFiles — the day names no source at all');
    } else {
      if (!sf.pgcb) record('provenance', 'ERROR', day, 'sourceFiles names no PGCB workbook');
      if (gasTotal && !sf.petrobangla) {
        record('provenance', 'ERROR', day,
          `carries ${gasTotal.toFixed(1)} MMCFD of gas but sourceFiles names no Petrobangla report`);
      }
    }
  }

  // 6. The grid day's gas should match the archive window it was taken from.
  if (runs('gas-vs-archive') && gasProd?.length) {
    const arc = read(GAS, day);
    const printed = num(arc?.production?.summary?.grand_total?.gas)
      ?? num(arc?.production?.grand_total?.gas);
    if (printed != null) {
      const sum = gasProd.reduce((a, r) => a + (num(r.gas) ?? 0), 0);
      if (Math.abs(sum - printed) > 5) {
        record('gas-vs-archive', 'ERROR', day,
          `grid gas ${sum.toFixed(1)} vs archive printed total ${printed.toFixed(1)} MMCFD`);
      }
    }
  }

  prev = d;
  prevDay = day;
}

// 7. A whole year of zone-shedding fields present and never non-zero is either
//    a real capacity-surplus era or a parser that never filled the column.
//    Either way nothing should be trained on it until it is resolved.
if (runs('shed-coverage')) {
  const byYear = new Map();
  for (const day of days) {
    const d = read(DAILY, day);
    const zones = d?.regionalDemandData ?? [];
    if (!zones.length) continue;
    const y = day.slice(0, 4);
    const r = byYear.get(y) ?? { withField: 0, nonZero: 0 };
    if (zones.some((z) => 'loadShedding' in z || 'loadShed' in z)) r.withField++;
    if (zones.some((z) => zoneShed(z) > 0)) r.nonZero++;
    byYear.set(y, r);
  }
  for (const [y, r] of [...byYear].sort()) {
    if (r.withField > 300 && r.nonZero === 0) {
      record('shed-coverage', 'WARN', y,
        `${r.withField} days carry the zone-shedding field and none is non-zero — confirm before treating as real`);
    }
  }
}

// ── report ────────────────────────────────────────────────────────────────
const order = { ERROR: 0, WARN: 1, INFO: 2 };
const shown = findings.filter((f) => !ERRORS_ONLY || f.severity === 'ERROR');
const groups = new Map();
for (const f of shown) {
  const k = `${f.severity}|${f.check}`;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(f);
}

console.log(`\nverify:data — ${days.length} days, ${days[0]} .. ${days[days.length - 1]}\n`);

if (!groups.size) {
  console.log('No findings.');
} else {
  for (const [k, list] of [...groups].sort((a, b) => {
    const [sa, ca] = a[0].split('|'), [sb, cb] = b[0].split('|');
    return order[sa] - order[sb] || ca.localeCompare(cb);
  })) {
    const [sev, check] = k.split('|');
    console.log(`${sev.padEnd(5)} ${check.padEnd(16)} ${String(list.length).padStart(5)} day(s)`);
    for (const f of list.slice(0, SHOW)) console.log(`        ${f.day}  ${f.message}`);
    if (list.length > SHOW) console.log(`        … ${list.length - SHOW} more (--verbose)`);
    console.log('');
  }
}

const errors = findings.filter((f) => f.severity === 'ERROR').length;
const warns = findings.filter((f) => f.severity === 'WARN').length;
const infos = findings.filter((f) => f.severity === 'INFO').length;
console.log(`${errors} ERROR   ${warns} WARN   ${infos} INFO`);
console.log(
  errors
    ? '\nERRORs are figures the archive asserts that no source stated. Fix them.'
    : '\nNo ERRORs: every day names its source, and no day repeats the one before it.',
);
process.exit(errors ? 1 : 0);
