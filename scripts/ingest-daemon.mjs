/**
 * The scheduled runner the pipeline never had.
 *
 * `/api/cron/ingest` returns 503 on Vercel by design — the Python chain exceeds
 * serverless compute limits — so ingestion has been a person running a script
 * on one Windows machine, and the commit history shows what that produces: days
 * arriving in batches rather than daily, while the site carries pulsing live
 * indicators over them.
 *
 * This closes the loop on any always-on host that has the repo and Python: a
 * Pi, a NAS, a spare box, a container. It does one thing on a timer — ask
 * whether the archive is behind, and if it is, run the same ingest the operator
 * would have run by hand, verify the result, and stop on anything unexpected.
 *
 *   node scripts/ingest-daemon.mjs              # run one pass and exit
 *   node scripts/ingest-daemon.mjs --watch      # stay up, one pass every 6h
 *   node scripts/ingest-daemon.mjs --dry-run    # report what it would do
 *
 * Deliberately NOT a publisher. It brings days onto disk and verifies them;
 * putting them on the site stays a decision a person makes, because that is the
 * step the review gate guards. What it removes is the part that was only ever
 * mechanical — noticing that a day is missing.
 *
 * Under systemd, launchd, Task Scheduler or cron, prefer the single-pass form
 * on a schedule over `--watch`; the supervisor then owns restart and logging.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const WATCH = process.argv.includes('--watch');
const DRY = process.argv.includes('--dry-run');
const INTERVAL_MS = 6 * 60 * 60 * 1000;

const DAILY_DIR = path.join(process.cwd(), 'public', 'data', 'daily');
const BST_OFFSET_MS = 6 * 60 * 60 * 1000;

const log = (...args) => console.log(`[ingest-daemon ${new Date().toISOString()}]`, ...args);

function latestStoredDay() {
  const days = fs
    .readdirSync(DAILY_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.slice(0, -5))
    .sort();
  return days.length ? days[days.length - 1] : null;
}

/** PGCB publishes day D on the morning of D+1, so yesterday is the newest possible. */
function newestPossibleDay() {
  const bstNow = new Date(Date.now() + BST_OFFSET_MS);
  return new Date(bstNow.getTime() - 86_400_000).toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

async function run(cmd, args) {
  log('$', cmd, args.join(' '));
  // execFile without a shell cannot resolve `npm` on Windows, where the
  // executable is `npm.cmd`; the first scheduled pass on the operator's machine
  // died with "spawn npm ENOENT" while logging that it was leaving things as
  // they were. The fix was described in 3a2ee9f7b but never actually landed —
  // that commit replaced this function's body with a truncated `log(` and left
  // the file unparseable, so the daemon has not run since 2026-09-01.
  //
  // `shell` is set only on win32 and only for npm. Every argument reaching here
  // is built in this file, never from input, but the shell is still avoided
  // wherever it is not needed.
  const isWindowsNpm = process.platform === 'win32' && /^npm(\.cmd)?$/.test(cmd);
  const { stdout, stderr } = await execFileAsync(isWindowsNpm ? 'npm.cmd' : cmd, args, {
    cwd: process.cwd(),
    maxBuffer: 32 * 1024 * 1024,
    timeout: 20 * 60 * 1000,
    ...(isWindowsNpm ? { shell: true } : {}),
  });
  if (stderr?.trim()) log('stderr:', stderr.trim().slice(0, 2000));
  return stdout;
}

async function onePass() {
  const latest = latestStoredDay();
  const expected = newestPossibleDay();

  if (!latest) {
    log('no archive on disk — refusing to guess a start date. Ingest one day by hand first.');
    return;
  }

  const behind = daysBetween(latest, expected);
  log(`newest stored ${latest}; newest publishable ${expected}; ${behind} day(s) behind`);

  if (behind <= 0) {
    log('up to date, nothing to do');
    return;
  }
  if (DRY) {
    log(`dry run — would ingest ${behind} day(s) from ${latest} forward`);
    return;
  }

  // The same chain the operator runs by hand. Bounded to the missing window so
  // a long outage does not turn one pass into an unbounded backfill.
  const MAX_DAYS_PER_PASS = 7;
  if (behind > MAX_DAYS_PER_PASS) {
    log(
      `${behind} days behind, which is more than one pass should take on its own. ` +
        `Ingesting ${MAX_DAYS_PER_PASS} and leaving the rest for the next pass.`,
    );
  }

  try {
    // `runIngestionPipeline` already walks back up to eight days looking for
    // the newest workbook it can find, so it catches up on its own; the pass
    // just needs to be invoked. It takes an ingest lock, so overlapping runs
    // from a scheduler are safe.
    for (let i = 0; i < Math.min(behind, MAX_DAYS_PER_PASS); i++) {
      const before = latestStoredDay();
      await run('npm', ['run', 'ingest:run']);
      if (latestStoredDay() === before) {
        log('pipeline landed no new day — the source has nothing further yet');
        break;
      }
    }
  } catch (err) {
    log('ingest failed:', err.message?.slice(0, 500) ?? err);
    log('leaving the archive as it was; a partial day is worse than a missing one');
    return;
  }

  // Verify what landed. An ERROR here is the archive asserting something no
  // source stated, and the publish gate would refuse it anyway — better to know
  // now, in the log, than at the moment someone tries to publish.
  try {
    const out = await run('node', ['scripts/verify-data.mjs', '--from', latest, '--to', expected, '--json']);
    const report = JSON.parse(out.trim());
    log(
      `verify: ${report.counts.ERROR} ERROR, ${report.counts.WARN} WARN, ${report.counts.INFO} INFO ` +
        `over ${report.days} day(s)`,
    );
    if (report.counts.ERROR) {
      for (const f of report.findings.filter((x) => x.severity === 'ERROR')) {
        log(`  ERROR ${f.day} ${f.check}: ${f.message}`);
      }
      log('these days will be refused by the publish gate until they are resolved');
    }
  } catch (err) {
    log('verify could not run:', err.message?.slice(0, 300) ?? err);
  }

  log(`done; newest stored is now ${latestStoredDay()}`);
}

async function main() {
  await onePass();
  if (!WATCH) return;
  log(`watching — next pass in ${INTERVAL_MS / 3_600_000}h`);
  setInterval(() => {
    onePass().catch((err) => log('pass threw:', err));
  }, INTERVAL_MS);
}

main().catch((err) => {
  log('fatal:', err);
  process.exitCode = 1;
});
