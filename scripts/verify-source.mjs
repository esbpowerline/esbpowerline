/**
 * Source-fidelity verification: refetch, reparse, diff against what we published.
 *
 * `verify:data` proves the archive is *self-consistent* — every day names a
 * source, no day repeats the one before it, the gas total agrees with the
 * parsed archive. None of that proves the published number matches the PDF.
 * If the parser misread a column, both sides are wrong and agree perfectly.
 *
 * This closes that gap the only way it can be closed: pull the document from
 * the publisher again, run it through the same parser, and diff the result
 * against the committed file. Two things make it trustworthy rather than
 * circular:
 *
 *   - The gas PDF is hashed. A matching `content_sha256` means the bytes we
 *     parsed are the bytes Petrobangla is serving today, not a lookalike.
 *   - The diff is over values, not summaries, so a column-shift shows up as a
 *     changed number rather than a plausible-looking total.
 *
 * Findings are split by what they cost you. `indicator` drift is a figure that
 * has actually been published on a card or a chart. `value` drift is a figure
 * that exists in the JSON but nobody has printed. `shape` is a section one
 * side has and the other does not, which is usually the parser growing a new
 * table rather than a defect.
 *
 * Verdicts, worst first:
 *   INDICATOR  a published indicator disagrees with the source. Fix now.
 *   HASH       the source document's bytes changed, or our stored hash is wrong.
 *   DRIFT      unpublished values disagree. Triage.
 *   SHAPE      sections differ but every shared value matches.
 *   MATCH      the source says exactly what we published.
 *   UNFETCHED  the publisher has no document for this day (or the fetch failed).
 *
 * Usage:
 *   npm run verify:source -- --from 2026-07-01 --to 2026-08-17
 *   npm run verify:source -- --date 2026-08-13 --verbose
 *   npm run verify:source -- --from 2020-01-12 --to 2026-06-30 --sample 300 --seed 42
 *   npm run verify:source -- --resume            # skip days already in the ledger
 *   npm run verify:source -- --indicators-only   # cheapest useful pass
 *
 * The ledger at verification/source-ledger.json is the audit evidence. Commit
 * it: a day verified in August is a day you do not have to refetch in December,
 * and the publisher may not still be serving that document by then.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

const DAILY = 'public/data/daily';
const GAS = 'public/data/petrobangla/daily';
const BRIDGE = 'scripts/ingest_bridge.py';

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const ONE_DAY = arg('date');
const FROM = ONE_DAY ?? arg('from', '0000-00-00');
const TO = ONE_DAY ?? arg('to', '9999-99-99');
const SAMPLE = Number(arg('sample', 0)) || 0;
const SEED = Number(arg('seed', 42));
const LEDGER = arg('out', 'verification/source-ledger.json');
const PYTHON = arg('python', process.env.PYTHON || 'python');
const TIMEOUT = Number(arg('timeout', 180)) * 1000;
const PAUSE = Number(arg('pause', 1500));
const VERBOSE = has('verbose');
const RESUME = has('resume');
const DRY = has('dry-run');
const INDICATORS_ONLY = has('indicators-only');
const SHOW = VERBOSE ? Infinity : 6;

// Sub-display noise. The cards round to whole MW and whole MMCFD, so a
// disagreement smaller than this cannot reach a reader and is almost always
// float reassociation in the parser rather than a misread figure.
const EPS_ABS = Number(arg('eps', 0.05));

// ── what the diff deliberately ignores ────────────────────────────────────
// Machine-specific or run-specific, and carrying no claim about the grid.
// `parser_version` is excluded because a refetch always stamps the current
// parser; the committed value is still recorded in the ledger so the 168
// `2.0.0-reconstructed` files stay findable.
const IGNORED = [
  /^sourceFiles(\.|$)/, // the bridge does not emit it; provenance is checked separately
  /^meta\.source_pdf$/,
  /^meta\.source_filename$/,
  /^meta\.parsed_at$/,
  /^meta\.parser_version$/,
  /^meta\.schema_version$/,
  /^meta\.agent_summary$/, // prose regenerated per run
  /^\$schema$/,
];
const ignored = (p) => IGNORED.some((re) => re.test(p));

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const shiftDay = (day, n) => {
  const t = new Date(`${day}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

// ── the figures that actually reach a reader ──────────────────────────────
// Drift anywhere else is a defect worth fixing; drift here is a defect that
// has already been printed. They are counted apart for that reason.
const indicators = (payload) => {
  const s = payload?.systemStats ?? {};
  const prod = payload?.gasProductionData ?? [];
  const lngRow = prod.find((r) => /RPGCL|R-LNG|LNG/i.test(r.company ?? ''));
  const gasTotal = prod.length ? prod.reduce((a, r) => a + (num(r.gas) ?? 0), 0) : null;
  const lng = lngRow ? num(lngRow.gas) : null;

  // The card quotes PGCB's printed load shed at the evening peak row, not
  // demand minus generation — the two disagree on PGCB's own sheet and the
  // printed figure is the one that is sourced.
  const curve = payload?.hourlyLoadData ?? [];
  const peakRow =
    curve.find((r) => num(r.generation) !== null && num(r.generation) === num(s.eveningPeakGen)) ??
    null;

  return {
    eveningPeakDemand: num(s.eveningPeakDemand),
    eveningPeakGen: num(s.eveningPeakGen),
    dayPeakDemand: num(s.dayPeakDemand),
    dayPeakGen: num(s.dayPeakGen),
    peakLoadShed: peakRow ? num(peakRow.loadShed) : null,
    totalEnergyGen: num(s.totalEnergyGen),
    totalGasSuppliedPower: num(s.totalGasSuppliedPower),
    totalDailyCost: num(s.totalDailyCost),
    gasTotalProduction: gasTotal,
    gasLng: lng,
    gasDomestic: gasTotal !== null && lng !== null ? gasTotal - lng : null,
  };
};

// ── diff ──────────────────────────────────────────────────────────────────
const diff = (a, b, base = '', out = []) => {
  if (ignored(base)) return out;

  const aNull = a === null || a === undefined;
  const bNull = b === null || b === undefined;
  if (aNull && bNull) return out;
  if (aNull !== bNull) {
    out.push({ path: base, kind: 'shape', published: a ?? null, source: b ?? null });
    return out;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      out.push({ path: base, kind: 'shape', published: typeof a, source: typeof b });
      return out;
    }
    if (a.length !== b.length) {
      out.push({ path: `${base}.length`, kind: 'shape', published: a.length, source: b.length });
    }
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff(a[i], b[i], `${base}[${i}]`, out);
    return out;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      diff(a[k], b[k], base ? `${base}.${k}` : k, out);
    }
    return out;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    const d = Math.abs(a - b);
    if (d > EPS_ABS) out.push({ path: base, kind: 'value', published: a, source: b, delta: b - a });
    return out;
  }

  if (a !== b) out.push({ path: base, kind: 'value', published: a, source: b });
  return out;
};

// ── committed-file lookup ─────────────────────────────────────────────────
const readJson = (p) => {
  try {
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  } catch {
    return null;
  }
};

// The gas archive cannot be looked up by filename. Through 2026-06 a report is
// stored under the date its window ENDS; the reconstructed files from 2026-07
// are stored under the date it starts. Only the window start the report itself
// states holds across both, so try both candidate filenames and keep the one
// whose own report_date_start is the day asked for.
const committedGasFor = (day) => {
  for (const cand of [day, shiftDay(day, 1)]) {
    const a = readJson(path.join(GAS, `${cand}.json`));
    if (a?.report?.report_date_start === day) return { file: `${cand}.json`, data: a };
  }
  return null;
};

// ── day selection ─────────────────────────────────────────────────────────
let days = fs
  .readdirSync(DAILY)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .map((f) => f.slice(0, -5))
  .filter((d) => d >= FROM && d <= TO)
  .sort();

const ledger = readJson(LEDGER) ?? { generated_at: null, eps: EPS_ABS, days: {} };
if (RESUME) days = days.filter((d) => !ledger.days[d]);

if (SAMPLE && SAMPLE < days.length) {
  // Deterministic sample: a stated seed makes the claim reproducible, which is
  // the whole point of sampling rather than eyeballing.
  let s = SEED >>> 0;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pool = [...days];
  const picked = [];
  while (picked.length < SAMPLE && pool.length) {
    picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  days = picked.sort();
}

if (!days.length) {
  console.error(
    `No days to verify in ${FROM}..${TO}${RESUME ? ' (all already in the ledger)' : ''}`,
  );
  process.exit(2);
}

if (DRY) {
  console.log(`${days.length} day(s) would be verified: ${days[0]} .. ${days[days.length - 1]}`);
  process.exit(0);
}

// ── fetch ─────────────────────────────────────────────────────────────────
const fetchDay = (day) =>
  new Promise((resolve) => {
    execFile(
      PYTHON,
      [BRIDGE, '--fetch', '--date', day],
      { timeout: TIMEOUT, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => {
        if (err && !stdout) return resolve({ ok: false, error: err.message });
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve({ ok: false, error: `unparseable bridge output: ${e.message}` });
        }
      },
    );
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── run ───────────────────────────────────────────────────────────────────
const results = [];
console.log(
  `\nverify:source — ${days.length} day(s), ${days[0]} .. ${days[days.length - 1]}` +
    `\nrefetching from PGCB ERP + Petrobangla; roughly ${Math.ceil(
      (days.length * (PAUSE + 20000)) / 60000,
    )} min\n`,
);

for (let i = 0; i < days.length; i++) {
  const day = days[i];
  process.stdout.write(`  [${String(i + 1).padStart(4)}/${days.length}] ${day} … `);

  const fetched = await fetchDay(day);
  if (!fetched?.ok) {
    const r = { day, verdict: 'UNFETCHED', note: fetched?.error ?? 'bridge returned ok:false' };
    results.push(r);
    ledger.days[day] = r;
    console.log(`UNFETCHED  ${String(r.note).slice(0, 70)}`);
    await sleep(PAUSE);
    continue;
  }

  const committed = readJson(path.join(DAILY, `${day}.json`));
  if (!committed) {
    const r = { day, verdict: 'UNFETCHED', note: 'no committed daily file to compare' };
    results.push(r);
    ledger.days[day] = r;
    console.log('UNFETCHED  nothing published for this day');
    await sleep(PAUSE);
    continue;
  }

  // The bridge zero-fills gasProductionData when Petrobangla has not served
  // the PDF, so an all-zero gas block means "not fetched", never "the source
  // says zero". Comparing it would read a missing document as a contradiction
  // and condemn a day the archive got right.
  const gasFetchedOk =
    Boolean(fetched.gasArchive) &&
    (fetched.payload?.gasProductionData ?? []).some((r) => (num(r.gas) ?? 0) > 0);

  // 1. published indicators
  const GAS_INDICATORS = ['gasTotalProduction', 'gasLng', 'gasDomestic', 'totalGasSuppliedPower'];
  const pubInd = indicators(committed);
  const srcInd = indicators(fetched.payload);
  const indDiffs = diff(pubInd, srcInd)
    .filter((d) => gasFetchedOk || !GAS_INDICATORS.some((k) => d.path.startsWith(k)))
    .map((d) => ({ ...d, kind: 'indicator' }));

  // 2. gas source bytes
  const gasCommitted = committedGasFor(day);
  const gasFetched = fetched.gasArchive;
  let hash = null;
  if (gasCommitted && gasFetched?.meta?.content_sha256) {
    hash = {
      committed: gasCommitted.data?.meta?.content_sha256 ?? null,
      source: gasFetched.meta.content_sha256,
      file: gasCommitted.file,
    };
    hash.match = hash.committed === hash.source;
  }

  // 3. everything else
  let bodyDiffs = [];
  if (!INDICATORS_ONLY) {
    bodyDiffs = diff(committed, fetched.payload).filter(
      (d) => gasFetchedOk || !/^gas(ProductionData|DistributionData)/.test(d.path),
    );
    if (gasCommitted && gasFetched) {
      bodyDiffs.push(
        ...diff(gasCommitted.data, gasFetched).map((d) => ({
          ...d,
          path: `gasArchive.${d.path}`,
        })),
      );
    }
  }

  const valueDiffs = bodyDiffs.filter((d) => d.kind === 'value');
  const shapeDiffs = bodyDiffs.filter((d) => d.kind === 'shape');

  const verdict = indDiffs.length
    ? 'INDICATOR'
    : hash && !hash.match
      ? 'HASH'
      : valueDiffs.length
        ? 'DRIFT'
        : shapeDiffs.length
          ? 'SHAPE'
          : 'MATCH';

  const r = {
    day,
    verdict,
    parserVersion: gasCommitted?.data?.meta?.parser_version ?? null,
    // False when Petrobangla served no PDF: the grid half of the day is
    // verified, the gas half is not. Recorded so a later run can pick these up
    // rather than the ledger implying the whole day was checked.
    gasVerified: gasFetchedOk,
    hash,
    counts: { indicator: indDiffs.length, value: valueDiffs.length, shape: shapeDiffs.length },
    indicatorDiffs: indDiffs,
    valueDiffs: valueDiffs.slice(0, 40),
    shapeDiffs: shapeDiffs.slice(0, 40),
  };
  results.push(r);
  ledger.days[day] = r;

  const tag =
    verdict === 'MATCH'
      ? 'MATCH'
      : `${verdict}  ind:${indDiffs.length} val:${valueDiffs.length} shape:${shapeDiffs.length}` +
        (hash && !hash.match ? ' hash:MISMATCH' : '');
  console.log(tag);

  // Written every day so an interrupted overnight run keeps everything it earned.
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  ledger.generated_at = new Date().toISOString();
  ledger.eps = EPS_ABS;
  fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));

  await sleep(PAUSE);
}

// ── report ────────────────────────────────────────────────────────────────
const order = { INDICATOR: 0, HASH: 1, DRIFT: 2, SHAPE: 3, MATCH: 4, UNFETCHED: 5 };
const groups = new Map();
for (const r of results) {
  if (!groups.has(r.verdict)) groups.set(r.verdict, []);
  groups.get(r.verdict).push(r);
}

console.log(`\n${'─'.repeat(72)}\nverify:source — ${results.length} day(s) checked\n`);

for (const [verdict, list] of [...groups].sort((a, b) => order[a[0]] - order[b[0]])) {
  console.log(`${verdict.padEnd(10)} ${String(list.length).padStart(5)} day(s)`);
  if (verdict === 'MATCH') {
    console.log('');
    continue;
  }
  for (const r of list.slice(0, SHOW)) {
    if (r.note) {
      console.log(`        ${r.day}  ${r.note}`);
      continue;
    }
    if (r.hash && !r.hash.match) {
      console.log(`        ${r.day}  gas PDF hash differs (${r.hash.file})`);
      console.log(`                 published ${r.hash.committed?.slice(0, 16)}`);
      console.log(`                 source    ${r.hash.source?.slice(0, 16)}`);
    }
    for (const d of r.indicatorDiffs.slice(0, VERBOSE ? Infinity : 4)) {
      console.log(`        ${r.day}  ${d.path}: published ${d.published} → source ${d.source}`);
    }
    for (const d of (r.valueDiffs ?? []).slice(0, VERBOSE ? Infinity : 3)) {
      console.log(`        ${r.day}  ${d.path}: ${d.published} → ${d.source}`);
    }
    for (const d of (r.shapeDiffs ?? []).slice(0, VERBOSE ? Infinity : 2)) {
      console.log(`        ${r.day}  ${d.path}: only one side has this`);
    }
  }
  if (list.length > SHOW) console.log(`        … ${list.length - SHOW} more (--verbose)`);
  console.log('');
}

const checked = results.filter((r) => r.verdict !== 'UNFETCHED').length;
const clean = (groups.get('MATCH') ?? []).length;
const bad = (groups.get('INDICATOR') ?? []).length + (groups.get('HASH') ?? []).length;

// With zero defects in n checked days, the upper bound on the true defect rate
// at 95% confidence — the familiar 3/n rule, stated exactly. Only meaningful
// when nothing failed, so it is printed only in that case.
const bound = checked ? 1 - Math.pow(0.05, 1 / checked) : null;

const gasUnverified = results.filter((r) => r.verdict !== 'UNFETCHED' && !r.gasVerified).length;

console.log(
  `${clean} MATCH   ${bad} published-figure defect(s)   ${results.length - checked} unfetchable`,
);
if (gasUnverified) {
  console.log(
    `${gasUnverified} day(s) had no Petrobangla PDF served — grid verified, gas still unverified.`,
  );
}
if (checked && !bad) {
  console.log(
    `\nNo published indicator disagreed with its source across ${checked} day(s).` +
      `\nAt 95% confidence the true defect rate is below ${(bound * 100).toFixed(2)}%.`,
  );
} else if (bad) {
  console.log('\nINDICATOR and HASH days are figures already printed. Fix these first.');
}
console.log(`\nLedger: ${LEDGER}`);
process.exit(bad ? 1 : 0);
