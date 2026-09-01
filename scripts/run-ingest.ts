/**
 * Run the ingestion pipeline once, from the command line.
 *
 * `runIngestionPipeline()` is the whole chain — walk back up to eight days for
 * a PGCB workbook, download, parse, fold in gas and SREDA, sync — and until now
 * it could only be reached through `/api/cron/ingest`, which returns 503 on
 * Vercel by design because the Python leg exceeds serverless compute limits.
 * That left the pipeline reachable only from a dev server on the operator's own
 * machine, which is why days arrive in batches.
 *
 * This gives it a headless entry point, so a scheduler on any always-on host
 * can run it. `scripts/ingest-daemon.mjs` is that scheduler.
 *
 *   npm run ingest:run
 */
import { runIngestionPipeline } from '../lib/cron/energy-ingest';

async function main() {
  const started = Date.now();
  const result = await runIngestionPipeline();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log(
    JSON.stringify({
      ok: result.ok,
      pgcb: result.pgcb,
      gas: result.gas,
      sreda: result.sreda,
      dbSync: result.dbSync,
      seconds: Number(seconds),
    }),
  );

  // A pipeline that ran but landed nothing is not a success, and a scheduler
  // needs to be able to tell the difference from its exit code alone.
  process.exitCode = result.ok ? 0 : 1;
}

main().catch((err) => {
  console.error('[run-ingest] failed:', err);
  process.exitCode = 1;
});
