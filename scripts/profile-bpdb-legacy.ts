/**
 * READ-ONLY profiler for the legacy BPDB corpus on W:.
 *
 * This tool reads and reports. It writes nothing anywhere — not to W:, not to
 * public/data, not to the database. It is not an importer and must never become
 * one; ingestion decisions come after this, from a human reading its output.
 *
 * The corpus is a PRIOR PARSE of unknown provenance. Its own `verified`,
 * `match_percentage` and `verification_log` fields are treated throughout as
 * LEGACY CLAIMS — recorded, counted, never believed. One file asserts
 * `verified: true, match_percentage: 100.0` over an empty `regions` object,
 * which is on its face a claim of perfect verification over nothing at all, so
 * the whole metadata family is suspect until its generator is found. It has not
 * been found: 47 parser files exist under bd-grid-backlog and none of them
 * writes these fields — `headers.py:396` only reads `verified` into a
 * fingerprint column. The code that produced them is not on W:.
 *
 *   npx tsx scripts/profile-bpdb-legacy.ts
 *   npx tsx scripts/profile-bpdb-legacy.ts --corpus generation
 *   npx tsx scripts/profile-bpdb-legacy.ts --era 2011-2014
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const W = 'W:/Grid-Explorer/BPDB';
const GEN = path.join(W, 'Daily Generation Backlog/JSONs');
const GEN_PDF = path.join(W, 'Daily Generation Backlog/PDFs');
const AREA = path.join(W, 'Area Wise Demand Backlog');
const MAXGEN = path.join(W, 'daily-max-generation');

/** BPDB's nine published zones. Anything else is reported, never corrected. */
const EXPECTED_ZONES = [
  'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Comilla',
  'Mymensingh', 'Sylhet', 'Barisal', 'Rangpur',
];

type Bag = Record<string, number>;
const bump = (b: Bag, k: string, n = 1) => { b[k] = (b[k] ?? 0) + n; };

const isoFromFilename = (f: string): string | null => {
  const m = /^(\d{2})-(\d{2})-(\d{4})\.json$/.exec(f);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
const isoFromStamp = (s: unknown): string | null => {
  if (typeof s !== 'string') return null;
  let m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s.trim());
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  return m ? s.trim() : null;
};

function listJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json'));
}

function pct(n: number, d: number) {
  return d ? `${((n / d) * 100).toFixed(2)}%` : '—';
}

function calendarGaps(dates: string[]): Array<{ from: string; to: string; days: number }> {
  const set = [...new Set(dates)].sort();
  const gaps: Array<{ from: string; to: string; days: number }> = [];
  for (let i = 1; i < set.length; i += 1) {
    const a = new Date(`${set[i - 1]}T00:00:00Z`).getTime();
    const b = new Date(`${set[i]}T00:00:00Z`).getTime();
    const d = Math.round((b - a) / 86_400_000) - 1;
    if (d > 0) gaps.push({ from: set[i - 1], to: set[i], days: d });
  }
  return gaps.sort((x, y) => y.days - x.days);
}

function sizeProfile(dir: string, files: string[]) {
  const sizes = files.map((f) => statSync(path.join(dir, f)).size).sort((a, b) => a - b);
  const at = (q: number) => sizes[Math.min(sizes.length - 1, Math.floor(sizes.length * q))] ?? 0;
  return {
    min: sizes[0] ?? 0, p10: at(0.1), median: at(0.5), p90: at(0.9), max: sizes[sizes.length - 1] ?? 0,
    tinyUnder2k: sizes.filter((s) => s < 2048).length,
  };
}

/** Generation corpus: per-unit records grouped by region. */
function profileGeneration(eraFilter?: (iso: string) => boolean) {
  const files = listJson(GEN);
  const schema: Bag = {}, claims: Bag = {}, quality: Bag = {}, zoneSeen: Bag = {}, unknownZone: Bag = {};
  const unitFields: Bag = {};
  const dates: string[] = [];
  const dateMismatch: string[] = [];
  const dupes: Bag = {};
  const perYearFilled: Bag = {}, perYearTotal: Bag = {};
  let units = 0, negatives = 0, implausible = 0, dupUnitNames = 0;

  for (const f of files) {
    const fileIso = isoFromFilename(f);
    if (!fileIso) { bump(quality, 'filename not dd-mm-yyyy'); continue; }
    if (eraFilter && !eraFilter(fileIso)) continue;
    bump(dupes, fileIso);
    dates.push(fileIso);
    const yr = fileIso.slice(0, 4);
    bump(perYearTotal, yr);

    let j: Record<string, unknown>;
    try { j = JSON.parse(readFileSync(path.join(GEN, f), 'utf8')); }
    catch (e) { bump(quality, 'unparseable json'); continue; }

    bump(schema, Object.keys(j).sort().join('|'));

    // The filename date is not evidence for the observation date.
    const stamp = isoFromStamp(j.date);
    if (!stamp) bump(quality, 'no usable internal date');
    else if (stamp !== fileIso) { bump(quality, 'filename date != internal date'); dateMismatch.push(`${f} -> ${stamp}`); }

    const regions = (j.regions ?? {}) as Record<string, unknown[]>;
    const nRegions = Object.keys(regions).length;
    const totals = j.calculated_totals as unknown[] | null;
    const hasData = nRegions > 0;
    if (hasData) bump(perYearFilled, yr);

    // LEGACY CLAIMS — counted, never believed.
    const verified = j.verified === true;
    const mp = typeof j.match_percentage === 'number' ? j.match_percentage : null;
    if (verified) bump(claims, 'verified=true');
    if (verified && !hasData) bump(claims, 'verified=true AND regions empty  <-- vacuous');
    if (mp === 100) bump(claims, 'match_percentage=100');
    if (mp === 100 && !hasData) bump(claims, 'match_percentage=100 AND no data  <-- vacuous');
    if (j.pdf_totals === null) bump(claims, 'pdf_totals null (nothing to match against)');
    if (verified && j.pdf_totals === null) bump(claims, 'verified=true WITHOUT pdf_totals  <-- unverifiable');
    if (j.pdf_downloaded === true) bump(claims, 'pdf_downloaded=true');
    if (j.pdf_link) bump(claims, 'has pdf_link');

    if (!hasData) { bump(quality, 'regions empty'); continue; }
    if (!Array.isArray(totals) || totals.length === 0) bump(quality, 'calculated_totals missing/empty');
    else if (totals.every((t) => Number(t) === 0)) bump(quality, 'calculated_totals all zero');

    const seenNames = new Set<string>();
    for (const [zone, rows] of Object.entries(regions)) {
      bump(zoneSeen, zone);
      if (!EXPECTED_ZONES.includes(zone)) bump(unknownZone, zone);
      if (!Array.isArray(rows)) { bump(quality, 'region value not an array'); continue; }
      for (const r of rows as Array<Record<string, unknown>>) {
        units += 1;
        for (const k of Object.keys(r)) bump(unitFields, k);
        const nm = String(r.name ?? '');
        if (nm && seenNames.has(`${zone}|${nm}`)) dupUnitNames += 1;
        seenNames.add(`${zone}|${nm}`);
        for (const k of ['installed_capacity_mw', 'derated_capacity_mw', 'actual_day_peak_mw', 'actual_eve_peak_mw']) {
          const v = r[k];
          if (v === null || v === undefined || v === '') bump(quality, `blank ${k}`);
          else if (typeof v === 'number') {
            if (v < 0) negatives += 1;
            // A single generating unit above 1,500 MW would exceed anything on
            // the Bangladeshi system; reported, never corrected.
            if (v > 1500) implausible += 1;
          }
        }
      }
    }
  }

  return { files: files.length, dates, dupes, schema, claims, quality, zoneSeen, unknownZone,
           unitFields, units, negatives, implausible, dupUnitNames, dateMismatch,
           perYearFilled, perYearTotal, sizes: sizeProfile(GEN, files) };
}

/** Area-wise demand: nine zones of demand and load shed. */
function profileArea() {
  const files = listJson(AREA);
  const schema: Bag = {}, claims: Bag = {}, quality: Bag = {}, zoneSeen: Bag = {};
  const dates: string[] = [];
  let zoneRows = 0, negatives = 0, sumMismatch = 0, reportedZero = 0;

  for (const f of files) {
    const fileIso = isoFromFilename(f);
    if (!fileIso) { bump(quality, 'filename not dd-mm-yyyy'); continue; }
    dates.push(fileIso);
    let j: Record<string, unknown>;
    try { j = JSON.parse(readFileSync(path.join(AREA, f), 'utf8')); }
    catch { bump(quality, 'unparseable json'); continue; }

    bump(schema, Object.keys(j).sort().join('|'));
    const stamp = isoFromStamp(j.date);
    if (stamp && stamp !== fileIso) bump(quality, 'filename date != internal date');

    if (j.verified === true) bump(claims, 'verified=true');
    if (j.verified === false) bump(claims, 'verified=false');
    if (typeof j.verification_log === 'string' && j.verification_log) bump(claims, 'has verification_log');

    const zones = (j.zones ?? []) as Array<Record<string, unknown>>;
    if (!Array.isArray(zones) || zones.length === 0) { bump(quality, 'zones empty'); continue; }
    if (zones.length !== 9) bump(quality, `zones_count != 9 (${zones.length})`);

    let sum = 0;
    for (const z of zones) {
      zoneRows += 1;
      bump(zoneSeen, String(z.zone_name ?? '(unnamed)'));
      const d = Number(z.demand_mw);
      if (Number.isFinite(d)) { sum += d; if (d < 0) negatives += 1; }
      else bump(quality, 'blank demand_mw');
      const ls = Number(z.load_shed_mw);
      if (Number.isFinite(ls) && ls < 0) negatives += 1;
    }
    const reported = Number(j.reported_total);
    if (!Number.isFinite(reported) || reported === 0) reportedZero += 1;
    else if (Math.abs(sum - reported) > 0.02 * Math.max(reported, 1)) sumMismatch += 1;
  }
  return { files: files.length, dates, schema, claims, quality, zoneSeen, zoneRows,
           negatives, sumMismatch, reportedZero, sizes: sizeProfile(AREA, files) };
}

function report(title: string, b: Bag, total?: number, limit = 14) {
  console.log(`\n  ${title}`);
  const rows = Object.entries(b).sort(([, a], [, c]) => c - a).slice(0, limit);
  if (!rows.length) { console.log('    (none)'); return; }
  for (const [k, v] of rows) {
    console.log(`    ${String(v).padStart(7)}  ${total ? pct(v, total).padStart(8) : '        '}  ${k}`);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const only = argv.includes('--corpus') ? argv[argv.indexOf('--corpus') + 1] : 'both';
  const eraArg = argv.includes('--era') ? argv[argv.indexOf('--era') + 1] : null;
  const era = eraArg
    ? (iso: string) => {
        const [a, b] = eraArg.split('-');
        const y = Number(iso.slice(0, 4));
        return y >= Number(a) && y <= Number(b);
      }
    : undefined;

  console.log('READ-ONLY profile of the legacy BPDB corpus on W:');
  console.log('Legacy verified/match_percentage fields are counted, never believed.\n');

  if (only === 'both' || only === 'generation') {
    const g = profileGeneration(era);
    const uniq = new Set(g.dates).size;
    console.log('='.repeat(72));
    console.log(`DAILY GENERATION BACKLOG${eraArg ? ` — era ${eraArg}` : ''}`);
    console.log('='.repeat(72));
    console.log(`  files                 ${g.files.toLocaleString()}`);
    console.log(`  in scope              ${g.dates.length.toLocaleString()}`);
    console.log(`  unique dates          ${uniq.toLocaleString()}`);
    console.log(`  duplicate dates       ${Object.values(g.dupes).filter((n) => n > 1).length}`);
    console.log(`  date range            ${[...g.dates].sort()[0]} .. ${[...g.dates].sort().at(-1)}`);
    console.log(`  unit rows parsed      ${g.units.toLocaleString()}`);
    console.log(`  local PDFs held       ${existsSync(GEN_PDF) ? readdirSync(GEN_PDF).length.toLocaleString() : 0}  (raw evidence)`);
    console.log(`  size bytes            min ${g.sizes.min} · p10 ${g.sizes.p10} · median ${g.sizes.median} · p90 ${g.sizes.p90} · max ${g.sizes.max}`);
    console.log(`  files under 2 KB      ${g.sizes.tinyUnder2k}`);
    report('schema variants (key sets)', g.schema, g.dates.length);
    report('LEGACY CLAIMS — recorded, not believed', g.claims, g.dates.length);
    report('quality findings', g.quality);
    report('regions seen', g.zoneSeen, undefined, 20);
    report('UNEXPECTED region labels', g.unknownZone);
    report('unit-level fields', g.unitFields, g.units);
    console.log(`\n  negatives ${g.negatives} · implausible (>1500 MW unit) ${g.implausible} · duplicate unit names ${g.dupUnitNames}`);
    if (g.dateMismatch.length) console.log(`  filename/internal date mismatches: ${g.dateMismatch.slice(0, 5).join(', ')}`);
    console.log('\n  coverage by year (files / with regions):');
    for (const y of Object.keys(g.perYearTotal).sort()) {
      const t = g.perYearTotal[y], f = g.perYearFilled[y] ?? 0;
      console.log(`    ${y}  ${String(t).padStart(4)} / ${String(f).padStart(4)}   ${pct(f, t)}`);
    }
    const gaps = calendarGaps(g.dates);
    console.log(`\n  calendar gaps: ${gaps.length}`);
    for (const gp of gaps.slice(0, 6)) console.log(`    ${gp.from} .. ${gp.to}   ${gp.days} day(s) absent`);
  }

  if (only === 'both' || only === 'area') {
    const a = profileArea();
    const uniq = new Set(a.dates).size;
    console.log(`\n${'='.repeat(72)}`);
    console.log('AREA-WISE DEMAND BACKLOG');
    console.log('='.repeat(72));
    console.log(`  files                 ${a.files.toLocaleString()}`);
    console.log(`  unique dates          ${uniq.toLocaleString()}`);
    console.log(`  date range            ${[...a.dates].sort()[0]} .. ${[...a.dates].sort().at(-1)}`);
    console.log(`  zone rows             ${a.zoneRows.toLocaleString()}`);
    console.log(`  size bytes            min ${a.sizes.min} · median ${a.sizes.median} · max ${a.sizes.max}`);
    report('schema variants (key sets)', a.schema, a.files);
    report('LEGACY CLAIMS', a.claims, a.files);
    report('quality findings', a.quality);
    report('zones seen', a.zoneSeen, undefined, 20);
    console.log(`\n  zone sum vs reported_total disagreement (>2%): ${a.sumMismatch.toLocaleString()}`);
    console.log(`  reported_total missing or zero:                 ${a.reportedZero.toLocaleString()}`);
    console.log(`  negative values:                                ${a.negatives}`);
    const gaps = calendarGaps(a.dates);
    console.log(`\n  calendar gaps: ${gaps.length}`);
    for (const gp of gaps.slice(0, 6)) console.log(`    ${gp.from} .. ${gp.to}   ${gp.days} day(s) absent`);
  }

  console.log('\nNothing was written. This tool is a profiler, not an importer.');
}

main();
