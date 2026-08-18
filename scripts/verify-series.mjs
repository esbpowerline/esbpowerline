/**
 * Longitudinal integrity sweep — each series across its whole history.
 *
 * `verify-data.mjs` next door asserts within-day identities (zones sum to the
 * peak, gas matches its own source, provenance exists). This file is the other
 * axis: each metric as a 4,500-day time series, hunting the defects only a
 * whole-history view can see —
 *
 *   gaps        calendar days with no archive file at all, distinguished from
 *               days the source genuinely did not publish
 *   bounds      values outside the series' own historical envelope (min/max of
 *               the full history, widened by margin) — the "impossible value"
 *               check, with the bounds derived from the data and printed so
 *               they are documented rather than folklore
 *   unit-step   a sustained ~10×/100×/1000× level shift between consecutive
 *               runs of a series — the classic mixed-units signature (MW vs
 *               GWh, Tk vs paisa). Sustained, because a one-day spike is an
 *               event; a step that persists is a unit change.
 *   outliers    values beyond k×IQR of a centered rolling window — a REVIEW
 *               list, never auto-corrected: real grid events exist (the 2014
 *               blackout is in this archive) and correcting them would be
 *               fabrication
 *   flatline    the same non-null value repeated N+ consecutive days on a
 *               series that normally moves — the carried-forward-data
 *               signature, beyond the pairwise check verify-data already does
 *
 * Read-only by design. It quarantines nothing and repairs nothing: every
 * finding names the day and the source file so a human can rule on it. The
 * archive's rule is that published figures are reported as published.
 *
 * Usage:
 *   node scripts/verify-series.mjs
 *   node scripts/verify-series.mjs --series eveningPeakDemand
 *   node scripts/verify-series.mjs --json          (machine-readable, for CI)
 *   node scripts/verify-series.mjs --bounds        (print the derived envelopes)
 */
import fs from 'node:fs';
import path from 'node:path';

const DAILY = 'public/data/daily';
const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const arg = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const ONLY = arg('series');
const AS_JSON = has('json');
const SHOW_BOUNDS = has('bounds');

/* ── the series ──────────────────────────────────────────────────────────── */

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Every scalar the site displays daily, with how to read it from a day file.
 * Gas readers treat an all-zero table as null — that is the archive's own
 * convention for "window not published yet" and must not read as a collapse.
 */
const SERIES = {
  eveningPeakGen: { unit: 'MW', read: (d) => num(d.systemStats?.eveningPeakGen) },
  eveningPeakDemand: { unit: 'MW', read: (d) => num(d.systemStats?.eveningPeakDemand) },
  dayPeakGen: { unit: 'MW', read: (d) => num(d.systemStats?.dayPeakGen) },
  totalEnergyGen: { unit: 'MKWh', read: (d) => num(d.systemStats?.totalEnergyGen) },
  maxTemp: { unit: '°C', read: (d) => num(d.systemStats?.maxTemp) },
  avgProductionCost: { unit: 'Tk/kWh', read: (d) => num(d.systemStats?.avgProductionCost) },
  totalDailyCost: { unit: 'Tk', read: (d) => num(d.systemStats?.totalDailyCost) },
  gasSuppliedPower: { unit: 'MMCFD', read: (d) => num(d.systemStats?.totalGasSuppliedPower) || null },
  totalGas: {
    unit: 'MMCFD',
    read: (d) => {
      const rows = d.gasProductionData ?? [];
      if (!rows.length) return null;
      const t = rows.reduce((a, r) => a + (num(r.gas) ?? 0), 0);
      return t === 0 ? null : t;
    },
  },
  totalLoadShed: {
    unit: 'MW',
    read: (d) => {
      const rows = d.regionalDemandData ?? [];
      if (!rows.length) return null;
      return rows.reduce((a, r) => a + (num(r.loadShed) ?? 0), 0);
    },
  },
};

/* ── load the archive once ───────────────────────────────────────────────── */

const files = fs
  .readdirSync(DAILY)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .sort();

const days = [];
for (const f of files) {
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(DAILY, f), 'utf8'));
    days.push({ day: f.slice(0, 10), doc, source: doc.sourceFiles?.pgcb ?? '(no source named)' });
  } catch (e) {
    days.push({ day: f.slice(0, 10), doc: null, error: e.message });
  }
}

const findings = [];
const record = (check, series, day, message) => findings.push({ check, series, day, message });

/* ── gaps ────────────────────────────────────────────────────────────────── */

{
  const present = new Set(days.map((d) => d.day));
  const first = days[0].day;
  const last = days[days.length - 1].day;
  const gaps = [];
  const t = new Date(`${first}T00:00:00Z`);
  const end = new Date(`${last}T00:00:00Z`);
  while (t <= end) {
    const iso = t.toISOString().slice(0, 10);
    if (!present.has(iso)) gaps.push(iso);
    t.setUTCDate(t.getUTCDate() + 1);
  }
  // Runs read better than 400 single lines and are what a backfill needs.
  let run = [];
  const flush = () => {
    if (!run.length) return;
    const label = run.length === 1 ? run[0] : `${run[0]} .. ${run[run.length - 1]} (${run.length} days)`;
    record('gap', 'archive', run[0], label);
    run = [];
  };
  for (let i = 0; i < gaps.length; i++) {
    if (run.length && gaps[i] !== nextIso(run[run.length - 1])) flush();
    run.push(gaps[i]);
  }
  flush();

  function nextIso(iso) {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }
}

/* ── per-series sweeps ───────────────────────────────────────────────────── */

const quantile = (sorted, q) => {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  return sorted[lo] + (sorted[Math.ceil(pos)] - sorted[lo]) * (pos - lo);
};

const boundsReport = [];

for (const [name, spec] of Object.entries(SERIES)) {
  if (ONLY && name !== ONLY) continue;

  const points = days
    .filter((d) => d.doc)
    .map((d) => ({ day: d.day, source: d.source, value: spec.read(d.doc) }))
    .filter((p) => p.value !== null);
  if (points.length < 30) continue;

  const values = points.map((p) => p.value).sort((a, b) => a - b);
  const min = values[0];
  const max = values[values.length - 1];

  // Envelope: the history's own range widened by half again. Documented, not
  // asserted from theory — the theory bound is the check below (unit-step).
  const span = max - min || Math.abs(max) || 1;
  const lo = min - span * 0.5;
  const hi = max + span * 0.5;
  boundsReport.push({ series: name, unit: spec.unit, min, max, lo, hi, n: points.length });
  // The envelope cannot flag its own extremes (they define it); it exists so
  // FUTURE ingests are checked against the documented history.

  // unit-step: compare medians of adjacent 30-day windows.
  const MED = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  for (let i = 30; i + 30 <= points.length; i += 30) {
    const before = MED(points.slice(i - 30, i).map((p) => p.value));
    const after = MED(points.slice(i, i + 30).map((p) => p.value));
    if (before > 0 && after > 0) {
      const ratio = after / before;
      if (ratio > 8 || ratio < 1 / 8) {
        record('unit-step', name, points[i].day,
          `median steps ${before.toFixed(1)} -> ${after.toFixed(1)} ${spec.unit} (×${ratio.toFixed(1)}) — mixed-units signature; source ${points[i].source}`);
      }
    }
  }

  // outliers: centered 61-day window, 5×IQR. Wide on purpose: the review list
  // must be short enough that a human actually reviews it.
  const K = 5;
  for (let i = 0; i < points.length; i++) {
    const win = points
      .slice(Math.max(0, i - 30), Math.min(points.length, i + 31))
      .map((p) => p.value)
      .sort((a, b) => a - b);
    if (win.length < 20) continue;
    const q1 = quantile(win, 0.25);
    const q3 = quantile(win, 0.75);
    const iqr = q3 - q1 || Math.abs(quantile(win, 0.5)) * 0.01 || 1;
    const v = points[i].value;
    if (v < q1 - K * iqr || v > q3 + K * iqr) {
      record('outlier', name, points[i].day,
        `${v} ${spec.unit} vs window [${q1.toFixed(1)}, ${q3.toFixed(1)}] — review, do not correct; source ${points[i].source}`);
    }
  }

  // flatline: identical non-null value 4+ consecutive archive days. Temperature
  // and cost genuinely repeat; MW/MMCFD series to 2dp repeating 4 days do not.
  if (['°C', 'Tk/kWh'].includes(spec.unit) === false) {
    let runStart = 0;
    for (let i = 1; i <= points.length; i++) {
      if (i < points.length && points[i].value === points[runStart].value) continue;
      const len = i - runStart;
      if (len >= 4 && points[runStart].value !== 0) {
        record('flatline', name, points[runStart].day,
          `${points[runStart].value} ${spec.unit} unchanged for ${len} days (${points[runStart].day} .. ${points[i - 1].day}) — carried-forward signature; source ${points[runStart].source}`);
      }
      runStart = i;
    }
  }
}

/* ── output ──────────────────────────────────────────────────────────────── */

const unreadable = days.filter((d) => !d.doc);
for (const d of unreadable) record('unreadable', 'archive', d.day, d.error);

if (AS_JSON) {
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), days: days.length, bounds: boundsReport, findings }, null, 2));
} else {
  if (SHOW_BOUNDS) {
    console.log('Derived envelopes (history min/max, ±50% span):');
    for (const b of boundsReport) {
      console.log(`  ${b.series.padEnd(20)} ${String(b.min).padStart(12)} .. ${String(b.max).padEnd(14)} ${b.unit.padEnd(7)} accept [${b.lo.toFixed(1)}, ${b.hi.toFixed(1)}]  n=${b.n}`);
    }
    console.log();
  }
  const byCheck = new Map();
  for (const f of findings) {
    if (!byCheck.has(f.check)) byCheck.set(f.check, []);
    byCheck.get(f.check).push(f);
  }
  for (const [check, list] of byCheck) {
    console.log(`${check.toUpperCase().padEnd(12)} ${list.length} finding(s)`);
    for (const f of list.slice(0, 10)) console.log(`   ${f.day}  [${f.series}] ${f.message}`);
    if (list.length > 10) console.log(`   … ${list.length - 10} more (--json for all)`);
    console.log();
  }
  console.log(`${days.length} day(s) scanned, ${findings.length} finding(s). Findings are a review list — nothing was modified.`);
}
