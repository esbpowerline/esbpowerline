/**
 * Re-parse a day from its own source workbook and rewrite it if it is shifted.
 *
 * `verify:source`, once its sample was widened past the original 1.2%, found
 * that 2026-06-27, -28 and -29 hold the *following* day's actuals. The proof is
 * in the workbooks themselves: PGCB names a file for the morning it is
 * published, and every data sheet inside carries the previous day's date.
 *
 *   Daily Report 29-06-2026.xlsx
 *     Forecast sheet  -> 29-06-2026   (tomorrow's forecast)
 *     P1..P4, EWIC    -> 28-06-2026   (yesterday's actuals)
 *
 * So the workbook for energy day D is the one named D+1 — which is exactly what
 * these days *cite*. Their citations are right and their figures are one day
 * late: stored 2026-06-27 holds what the 29-06 workbook says about the 28th.
 * The tell is visible without any of this machinery — stored 2026-06-29 and
 * 2026-06-30 are byte-identical in their headline figures, one of seven such
 * pairs in 4,545 days.
 *
 *   node scripts/repair-shifted-days.mjs 2026-06-27 2026-06-28 2026-06-29
 *   node scripts/repair-shifted-days.mjs --write 2026-06-27 ...
 *
 * SAFETY: a day is only rewritten when the freshly parsed payload stamps the
 * day being repaired. If the parse comes back labelled anything else, the
 * source convention is not what this script assumes and it stops rather than
 * writing a second wrong answer over the first.
 *
 * This does NOT publish. It corrects the file on disk; putting it on the site
 * stays a decision a person makes, and the publish gate re-verifies it there.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const WRITE = process.argv.includes('--write');
const days = process.argv.slice(2).filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const PYTHON = process.env.PYTHON || 'python';
const DAILY = 'public/data/daily';

if (!days.length) {
  console.error('usage: node scripts/repair-shifted-days.mjs [--write] <YYYY-MM-DD> ...');
  process.exit(1);
}

/** "28 Jun 2026" -> "2026-06-28" */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function legacyToIso(label) {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(String(label ?? '').trim());
  if (!m) return null;
  const mi = MONTHS.indexOf(m[2]);
  if (mi < 0) return null;
  return `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const FIELDS = ['eveningPeakGen', 'eveningPeakDemand', 'dayPeakGen', 'dayPeakDemand', 'totalEnergyGen'];

for (const day of days) {
  const file = path.join(DAILY, `${day}.json`);
  if (!fs.existsSync(file)) {
    console.log(`${day}  no stored file — skipped`);
    continue;
  }

  let fetched;
  try {
    const { stdout } = await execFileAsync(
      PYTHON,
      ['scripts/ingest_bridge.py', '--fetch', '--date', day],
      { timeout: 240_000, maxBuffer: 64 * 1024 * 1024 },
    );
    fetched = JSON.parse(stdout);
  } catch (err) {
    console.log(`${day}  could not re-parse: ${err.message?.slice(0, 160)}`);
    continue;
  }

  const payload = fetched?.payload;
  if (!payload?.systemStats) {
    console.log(`${day}  bridge returned no payload — skipped`);
    continue;
  }

  const stamped = legacyToIso(payload.systemStats.date);
  if (stamped !== day) {
    console.log(
      `${day}  REFUSED: freshly parsed payload is stamped ${stamped ?? 'nothing'}, not ${day}. ` +
        'The source convention is not what this script assumes.',
    );
    continue;
  }

  const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  const diffs = FIELDS.filter((f) => stored.systemStats?.[f] !== payload.systemStats?.[f]).map(
    (f) => `${f}: ${stored.systemStats?.[f]} -> ${payload.systemStats?.[f]}`,
  );

  if (!diffs.length) {
    console.log(`${day}  already agrees with its source`);
    continue;
  }

  console.log(`${day}  ${diffs.length} headline field(s) differ:`);
  for (const d of diffs) console.log(`    ${d}`);

  if (WRITE) {
    // Keep the citation the stored file already carries — it was correct — and
    // take the figures from the re-parse.
    payload.sourceFiles = { ...payload.sourceFiles, ...stored.sourceFiles };

    // The half-hourly fuel curve is split out, exactly as the publish route
    // does it. Left inline it puts ~5.7 KB a day into every bundle that imports
    // the daily loader, which is why it was split out to begin with.
    const { energyCurveData, ...daily } = payload;
    if (energyCurveData) {
      const curveDir = path.join('public', 'data', 'curves');
      fs.mkdirSync(curveDir, { recursive: true });
      fs.writeFileSync(
        path.join(curveDir, `${day}.json`),
        `${JSON.stringify(energyCurveData, null, 2)}\n`,
      );
      console.log('    curve written to public/data/curves');
    }

    fs.writeFileSync(file, `${JSON.stringify(daily, null, 2)}\n`);
    console.log('    written');
  }
}

console.log(WRITE ? '\nWritten. Run verify:data, then publish through the admin panel.' : '\nDry run — pass --write to apply.');
