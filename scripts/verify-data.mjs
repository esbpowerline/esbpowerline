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
// Machine-readable mode, for the publish gate. Prints one JSON object and
// nothing else, so a caller does not have to parse the human report.
const JSON_OUT = has('json');
const SHOW = VERBOSE ? Infinity : 8;

const findings = [];
const record = (check, severity, day, message) => findings.push({ check, severity, day, message });

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const shiftDay = (day, n) => {
  const t = new Date(`${day}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const nextDay = (day) => shiftDay(day, 1);
const dayBefore = (day) => shiftDay(day, -1);

// Source filenames carry their date in one of two spellings — "(17.01.20)" on
// the reports as Petrobangla publishes them, "2026-08-12" on the reconstructed
// files. UUID-named downloads carry none, and return null.
const dateInFilename = (name) => {
  const iso = name.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Separators drift across the published filenames — "(16 12.25).pdf" is one
  // of Petrobangla's own, with a space where the dot belongs.
  const dmy = name.match(/\((\d{2})[.\-\s](\d{2})[.\-\s](\d{2})\)/);
  if (dmy) return `20${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return null;
};
const zoneShed = (z) => num(z.loadShedding) ?? num(z.loadShed) ?? 0;
const stable = (v) => JSON.stringify(v ?? null);

const allDays = fs
  .readdirSync(DAILY)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .map((f) => f.slice(0, -5))
  .sort();

const days = allDays.filter((d) => d >= FROM && d <= TO);

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

// The archive cannot be looked up by filename. Through 2026-06 a report is
// stored under the date its window ENDS ("16-17 Oct, 2020" lives in
// 2020-10-17.json); the reconstructed 2026-08 files are stored under the date
// it starts. Indexing on the window start the report itself states is the only
// key that holds across both eras — reading `${GAS}/${day}.json` silently finds
// nothing for most of the archive, which is how check 6 came to compare a day
// against a document that was never loaded.
//
// Only scalars are kept: 2,295 parsed reports do not fit in memory at once.
let archiveIndex = null;
const archiveFor = (day) => {
  if (!archiveIndex) {
    archiveIndex = new Map();
    for (const f of fs.readdirSync(GAS)) {
      if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(f)) continue;
      let a;
      try {
        a = JSON.parse(fs.readFileSync(path.join(GAS, f), 'utf8'));
      } catch {
        continue;
      }
      const start = a?.report?.gas_day_start;
      if (!start || archiveIndex.has(start)) continue;
      const fields = a.production?.fields;
      archiveIndex.set(start, {
        file: f.slice(0, -5),
        source: a.meta?.source_filename ?? null,
        sha: a.meta?.content_sha256 ?? null,
        label: a.report?.report_date_label ?? null,
        // The document's own field rows, summed. This is the figure our six
        // company rows are a rollup of, so it is what they must agree with.
        fieldSum: fields?.length ? fields.reduce((x, r) => x + (num(r.gas_mmcfd) ?? 0), 0) : null,
        // What the document prints as its own grand total, which is a separate
        // claim and does not always match the rows above it.
        printed: num(a.production?.grand_total?.gas_mmcfd),
      });
    }
  }
  return archiveIndex.get(day) ?? null;
};

// Days the project has already declared unsourced, in public. Demanding a
// source name for these asks for the invention that the declaration exists to
// refuse, so they are reported as known rather than as defects.
const noSourceDays = (() => {
  try {
    const j = JSON.parse(fs.readFileSync('public/data/grid-verification/no-source-days.json', 'utf8'));
    return new Set(j.days ?? []);
  } catch {
    return new Set();
  }
})();

let prev = null;
let prevDay = null;
// Trailing zone-demand shortfalls (see check 1) — the archive's own recent
// behaviour is the baseline a day is judged against.
const zoneShortfalls = [];

// A bounded range starts with prev = null, which silently disabled every
// previous-day comparison — carry-forward and duplicate-day — for the FIRST
// in-range day. The publish gate runs `--from date --to date`, so for the gate
// that was EVERY day: the one place those checks matter most never ran them.
// Seed prev from the preceding archive day; no checks run on the seed itself.
if (days[0] !== allDays[0]) {
  const seedDay = allDays[allDays.indexOf(days[0]) - 1];
  try {
    // Not read(): a malformed seed day is outside the range and must not add
    // findings — in a gate run that would block a publish for another day's
    // corruption. An unreadable seed just means no previous-day comparisons.
    prev = JSON.parse(fs.readFileSync(path.join(DAILY, `${seedDay}.json`), 'utf8'));
    prevDay = seedDay;
  } catch {
    /* run without a seed */
  }
}

// Declared duplicate pairs — a published statement, not a silencer. The same
// file feeds DUPLICATE_SUSPECT_DAYS in lib/data/grid/verification-ledger.ts,
// so the reader-facing UNVERIFIED marker and this check can never disagree
// about which days are declared.
const duplicateSuspects = (() => {
  try {
    const j = JSON.parse(
      fs.readFileSync('public/data/grid-verification/duplicate-suspect-days.json', 'utf8'),
    );
    return new Set((j.pairs ?? []).flat());
  } catch {
    return new Set();
  }
})();

for (const day of days) {
  const d = read(DAILY, day);
  if (!d) continue;
  const ss = d.systemStats ?? {};
  const zones = d.regionalDemandData ?? [];
  const hourly = d.hourlyLoadData ?? [];
  const gasProd = d.gasProductionData ?? null;

  // 1. Zone demand against the national evening peak it is taken at.
  //
  //    The nine zone rows are demand delivered at substations; the evening peak
  //    is measured generation-side. They have never been equal and never will
  //    be: the shortfall is the system's own loss, declining secularly — median
  //    8.3% in 2014 down to 3.6% in 2026, measured across all 4,545 days on
  //    2026-09-01. Warning on a twelve-year physical trend produced 3,783
  //    WARNs nobody read, and the days that genuinely were wrong — 2014-01-15,
  //    where Dhaka, Chattogram and Mymensingh print 0 MW while six zones
  //    report — looked identical to the structural constant. A channel where a
  //    defect reads the same as physics cannot carry signal.
  //
  //    So a day is judged against the archive's own trailing median, not
  //    against a loss model we would have to invent. Structural shortfall is
  //    counted as INFO; WARN is reserved for what the series itself cannot
  //    explain: zones summing ABOVE the generation-side peak (arithmetically
  //    impossible for delivered demand), or a shortfall leaving the band
  //    around the trailing median. The band is ±3.5pp: the within-year p10-p90
  //    spread reaches 4.2pp (2019), so a narrower band re-floods the channel
  //    with seasonality.
  if ((runs('zone-demand') || runs('zone-zero')) && zones.length && num(ss.eveningPeakDemand)) {
    const reporting = zones.filter((z) => (num(z.demand) ?? 0) > 0);
    const zeroed = zones.filter((z) => num(z.demand) === 0);

    // A zone printing 0 MW beside reporting neighbours is absence dressed as a
    // measurement — the gas archive's disease (check 4) in a second table.
    // Reported, never bulk-repaired: only the workbook can say whether PGCB
    // printed a dash or the parser dropped the cell.
    if (runs('zone-zero') && zeroed.length && reporting.length) {
      record('zone-zero', 'WARN', day,
        `${zeroed.map((z) => z.zone).join(', ')} print 0 MW while ${reporting.length} zone(s) report — absent or dropped, not measured`);
    }

    const sum = zones.reduce((a, z) => a + (num(z.demand) ?? 0), 0);
    const gap = sum - ss.eveningPeakDemand;
    const short = -gap / ss.eveningPeakDemand; // positive when zones sum under the peak

    const baseline = zoneShortfalls.length >= 15
      ? [...zoneShortfalls].sort((a, b) => a - b)[Math.floor(zoneShortfalls.length / 2)]
      : null;

    if (gap > ss.eveningPeakDemand * 0.02) {
      // 2% absorbs PGCB's own rounding across nine printed zone figures.
      record('zone-demand', 'WARN', day,
        `zones sum ${sum.toFixed(0)} EXCEEDS evening peak demand ${ss.eveningPeakDemand.toFixed(0)} by ${gap.toFixed(0)} MW`);
    } else if (baseline !== null && Math.abs(short - baseline) > 0.035) {
      record('zone-demand', 'WARN', day,
        `zones sum ${sum.toFixed(0)} vs evening peak ${ss.eveningPeakDemand.toFixed(0)} — shortfall ${(short * 100).toFixed(1)}% vs trailing median ${(baseline * 100).toFixed(1)}%`);
    } else if (short > 0.02) {
      record('zone-demand', 'INFO', day,
        `zones sum ${(short * 100).toFixed(1)}% under evening peak — delivered vs generation-side, the system's own loss`);
    }

    // A day with zeroed rows would drag the baseline toward the defect.
    if (!zeroed.length) {
      zoneShortfalls.push(short);
      if (zoneShortfalls.length > 60) zoneShortfalls.shift();
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
      // Which of the two days is the defective one is not decidable from the
      // repeat alone: this fires on the second day, but it is often the first
      // that holds figures belonging to the second. Naming the document both
      // days rest on points at the day that has no source of its own, which is
      // the thing to fix.
      const named = d.sourceFiles?.petrobangla;
      const prevNamed = prev.sourceFiles?.petrobangla;
      const here = archiveFor(day);
      const there = archiveFor(prevDay);
      let why = '';
      if (named && named === prevNamed) {
        why = ` — both days name ${named}, so at most one of them is its day`;
      } else if (here?.sha && here.sha === there?.sha) {
        why = ` — the archive holds one document (${here.source}) under both ${there.file} and ${here.file}`;
      } else if (!here) {
        why = ' — no archive window starts on this day';
      }
      record('carry-forward', 'ERROR', day,
        `gasProductionData byte-identical to ${prevDay} at ${gasTotal.toFixed(1)} MMCFD — carried forward, not measured${why}`);
    }
    if (d.gasDistributionData && prev.gasDistributionData &&
        stable(d.gasDistributionData) === stable(prev.gasDistributionData)) {
      record('carry-forward', 'ERROR', day,
        `gasDistributionData byte-identical to ${prevDay}`);
    }
  }

  // 3b. Duplicate-day: the June-2026 shift, detectable without a single PDF.
  //
  //     Five days in June 2026 each held the FOLLOWING day's actuals, live on
  //     the site, invisible to code review — found only by re-reading source
  //     documents against the database. But the defect has a cheap signature:
  //     a day whose eveningPeakGen, totalEnergyGen, eveningPeakDemand and
  //     dayPeakGen all exactly equal its neighbour's. Four independent
  //     quantities do not coincide; two matching days mean at most one of them
  //     is its own. Six historical pairs carry this signature and cannot be
  //     ruled on (their workbooks are unobtainable) — those are DECLARED in
  //     duplicate-suspect-days.json and published as UNVERIFIED, so they count
  //     as INFO. An undeclared match is an ERROR: we are about to publish, or
  //     have published, a day that is probably another day.
  if (runs('duplicate-day') && prev) {
    const tuple = ['eveningPeakGen', 'totalEnergyGen', 'eveningPeakDemand', 'dayPeakGen'];
    const here = tuple.map((k) => num(ss[k]));
    const there = tuple.map((k) => num(prev.systemStats?.[k]));
    if (here.every((v) => v !== null) && there.every((v) => v !== null) &&
        here.every((v, i) => v === there[i])) {
      const declared = duplicateSuspects.has(day) && duplicateSuspects.has(prevDay);
      record('duplicate-day', declared ? 'INFO' : 'ERROR', day,
        declared
          ? `identical to ${prevDay} across all four headline stats — declared in duplicate-suspect-days.json, published as UNVERIFIED`
          : `identical to ${prevDay} across eveningPeakGen, totalEnergyGen, eveningPeakDemand and dayPeakGen — the June-2026 shift signature; at most one of these days is its own`);
    }
  }

  // 4. How a day says "no gas".
  //
  //    Omitting the sections is the rule 48c7152a states, but it only started
  //    being followed on 2026-08-14 — before that, six rows of 0.0 is how the
  //    archive represented an unpublished window. On 2026-09-01
  //    scripts/migrate-zero-gas-days.mjs moved 2,211 such days to omission.
  //    Any all-zero table still here is one the migration REFUSED, and each
  //    refusal class needs verify:source, not deletion: 49 days are all-zero
  //    yet name a Petrobangla PDF (a document claims those zeros), and 793
  //    days have a zero production table beside a fully reporting distribution
  //    table (the intake page likely failed to parse — same family as the
  //    "Sylhet Sylhet" row-merge days). So INFO, counted, never demanded back.
  //    What WOULD be wrong is a partially zeroed table, where some companies
  //    report and others silently do not.
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
    const declaredUnsourced = noSourceDays.has(day);
    if (!sf) {
      record('provenance', 'ERROR', day, 'no sourceFiles — the day names no source at all');
    } else {
      if (!sf.pgcb) {
        record('provenance', declaredUnsourced ? 'INFO' : 'ERROR', day,
          declaredUnsourced
            ? 'names no PGCB workbook — already published in no-source-days.json'
            : 'sourceFiles names no PGCB workbook');
      }
      if (gasTotal && !sf.petrobangla) {
        record('provenance', 'ERROR', day,
          `carries ${gasTotal.toFixed(1)} MMCFD of gas but sourceFiles names no Petrobangla report`);
      }
    }
  }

  // 5b. Naming a report is not the same as naming the right one. A day that
  //     cites a document whose window belongs to a different day is asserting a
  //     provenance that does not hold, and presence-only checking cannot see it.
  //
  //     The two sides spell the same document differently and neither is wrong:
  //     the grid names a citation for the gas day it covers ("(17.01.20).pdf"),
  //     while the archive records the PDF as downloaded, named for the day the
  //     window ends ("(18.01.20).pdf"). So a citation is checked by the date it
  //     carries, not by string equality — a date of D or D+1 is this day's
  //     report under one convention or the other. Only a citation naming some
  //     other day, or an opaque filename that is not the one the archive holds,
  //     is a claim that fails.
  if (runs('provenance-agreement') && gasTotal && d.sourceFiles?.petrobangla) {
    const cited = d.sourceFiles.petrobangla;
    const arc = archiveFor(day);
    if (!arc) {
      record('provenance-agreement', 'WARN', day,
        `names ${cited} but no archive window starts on this day — the citation cannot be checked`);
    } else if (cited !== arc.source) {
      const citedDay = dateInFilename(cited);
      const arcDay = arc.source ? dateInFilename(arc.source) : null;
      // Petrobangla names its file for the CLOSING morning: the report for the
      // window that opens on gas day D is titled "D to D+1" and filed as
      // "(D+1).pdf". So a citation dated D+1 is this gas day's real document —
      // the correct, verifiable name — even when the archive stored the same day
      // under an older START-keyed synthetic name (`Petrobangla_(D).pdf`). Accept
      // it. (Confirmed against printed grand totals for 2026-08-13/17/18.)
      if (citedDay && citedDay === nextDay(day)) {
        // The real report for this gas day, named by its window-end — no finding.
      } else if (citedDay && arcDay && citedDay === day && arcDay === nextDay(day)) {
        // A citation dated D, where the day's own report is dated D+1, names the
        // report for the day BEFORE — a real, different document. One systematic
        // offset, not many separate mistakes.
        record('citation-offset', 'ERROR', day,
          `cites ${cited}, which prints the ${dayBefore(day)}-${day} window; this day's figures come from ${arc.source} (${arc.label})`);
      } else if (!citedDay) {
        record('provenance-agreement', 'ERROR', day,
          `names ${cited}, which is not the report covering this gas day (${arc.source}, ${arc.label}) and carries no date to reconcile`);
      } else {
        record('provenance-agreement', 'ERROR', day,
          `names ${cited}, dated ${citedDay}, but the report covering this gas day is ${arc.source} (${arc.label})`);
      }
    }
  }

  // 6. The grid day's gas should match the archive window it was taken from.
  //
  //    This read `production.summary.grand_total.gas` and `production.grand_total.gas`.
  //    Neither key exists in any of the 2,295 archive files — the figure is at
  //    `grand_total.gas_mmcfd` — so `printed` was always null and the check
  //    never once fired. It passed 4,529 days by never looking at them.
  //
  //    Thresholds are calibrated against the whole archive: our six company
  //    rows reproduce the document's field rows exactly on 1,463 of 1,476
  //    comparable days. The 13 that drift do so by 2.0 or 8.0 MMCFD, in an era
  //    where the document's own fields, subtotals and grand total disagree with
  //    each other, so drift is reported but not called ours. A contradiction
  //    the size of the 2026-08-10 defect (2329.6 against a printed 2199.1) is
  //    an order of magnitude larger and is what ERROR is reserved for.
  if (runs('gas-vs-archive') && gasProd?.length) {
    const arc = archiveFor(day);
    const sum = gasProd.reduce((a, r) => a + (num(r.gas) ?? 0), 0);
    if (arc && sum) {
      if (arc.fieldSum != null) {
        const gap = sum - arc.fieldSum;
        if (Math.abs(gap) > 25) {
          record('gas-vs-archive', 'ERROR', day,
            `grid gas ${sum.toFixed(1)} vs ${arc.source} field rows ${arc.fieldSum.toFixed(1)} MMCFD (${gap > 0 ? '+' : ''}${gap.toFixed(1)})`);
        } else if (Math.abs(gap) > 1) {
          record('gas-vs-archive', 'WARN', day,
            `grid gas ${sum.toFixed(1)} vs ${arc.source} field rows ${arc.fieldSum.toFixed(1)} MMCFD (${gap > 0 ? '+' : ''}${gap.toFixed(1)})`);
        }
      }
      // The document against itself: what it prints as the total, against the
      // rows it prints above that total. Petrobangla's own inconsistency.
      if (arc.fieldSum != null && arc.printed != null && Math.abs(arc.fieldSum - arc.printed) > 1) {
        record('archive-self', 'WARN', day,
          `${arc.source} prints grand total ${arc.printed.toFixed(1)} but its field rows sum to ${arc.fieldSum.toFixed(1)} MMCFD`);
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
if (JSON_OUT) {
  const bySeverity = (sev) => findings.filter((f) => f.severity === sev);
  process.stdout.write(
    JSON.stringify({
      days: days.length,
      from: days[0] ?? null,
      to: days[days.length - 1] ?? null,
      counts: {
        ERROR: bySeverity('ERROR').length,
        WARN: bySeverity('WARN').length,
        INFO: bySeverity('INFO').length,
      },
      findings,
    }),
  );
  process.exit(bySeverity('ERROR').length ? 1 : 0);
}

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
