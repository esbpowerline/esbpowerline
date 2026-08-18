/**
 * Publish a day's ingested files to the live site, from the command line.
 *
 * The admin panel has the same button; this is for finishing the daily routine
 * in one place — run the ingest chain, then publish what it wrote, without
 * opening a browser. Both go through `writeRelease`, so the validation and the
 * key rules are identical.
 *
 * There is no session here, so `publishedById` is left null and the row records
 * `publish-local-cli` as its parser version. Cache invalidation is by the 60s
 * backstop in releases.server.ts rather than by tag — `unstable_cache` tags can
 * only be expired from inside the running server, and that file's comment
 * already anticipates rows written out of band.
 *
 * Usage:
 *   npm run publish:local -- --date 2026-08-19
 *   npm run publish:local -- --date 2026-08-19 --month 2026-07
 *   npm run publish:local -- --date 2026-08-19 --dry-run
 *   npm run publish:local -- --date 2026-08-19 --no-aggregates
 *
 * The `--conditions react-server` in that npm script is required: lib/prisma
 * is marked `server-only`, which throws under a plain node resolve.
 */
import type { DataFeed } from '@prisma/client';
import { planLocalPublish, isReadable } from '../lib/data/publish-local';
import {
  writeRelease,
  validateReleaseKey,
  validateReleasePayload,
} from '../lib/data/release-write';

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

async function main() {
  const date = arg('date');
  const month = arg('month');
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');

  if (!date && !month) {
    console.error('usage: tsx scripts/publish-local.ts --date YYYY-MM-DD [--month YYYY-MM] [--dry-run] [--force]');
    process.exit(2);
  }

  const artifacts = await planLocalPublish({
    date,
    month,
    includeAggregates: !process.argv.includes('--no-aggregates'),
  });

  let published = 0;
  let unchanged = 0;
  let absent = 0;
  let failed = 0;

  for (const a of artifacts) {
    if (!isReadable(a)) {
      if ('absent' in a) {
        absent++;
        console.log(`  ·  ${a.feed.padEnd(24)} ${a.key.padEnd(12)} not produced for this day`);
      } else {
        failed++;
        console.log(`  ✗  ${a.feed.padEnd(24)} ${a.key.padEnd(12)} ${a.error}`);
      }
      continue;
    }

    if (dryRun) {
      // Run the same checks the write would, so a dry run is evidence the
      // publish would succeed rather than just a list of filenames. The grid
      // daily schema is the one that can actually reject a payload.
      const keyError = validateReleaseKey(a.feed as DataFeed, a.key);
      const payloadError = keyError ? null : validateReleasePayload(a.feed as DataFeed, a.payload);
      if (keyError || payloadError) {
        failed++;
        console.log(`  ✗  ${a.feed.padEnd(24)} ${a.key.padEnd(12)} ${keyError ?? payloadError}`);
      } else {
        console.log(`  →  ${a.feed.padEnd(24)} ${a.key.padEnd(12)} would publish ${a.relPath}`);
      }
      continue;
    }

    const res = await writeRelease({
      feed: a.feed as DataFeed,
      key: a.key,
      payload: a.payload,
      sourceName: a.relPath,
      parserVersion: 'publish-local-cli/1',
      force,
    });

    if (!res.ok) {
      failed++;
      console.log(`  ✗  ${a.feed.padEnd(24)} ${a.key.padEnd(12)} ${res.error}`);
    } else if (res.skipped === 'unchanged') {
      unchanged++;
      console.log(`  =  ${a.feed.padEnd(24)} ${a.key.padEnd(12)} already current`);
    } else {
      published++;
      console.log(`  ✓  ${a.feed.padEnd(24)} ${a.key.padEnd(12)} ${a.relPath}`);
    }
  }

  console.log(
    `\n${dryRun ? 'dry run — nothing written. ' : ''}` +
      `published ${published}, unchanged ${unchanged}, not produced ${absent}, failed ${failed}`,
  );
  if (!dryRun && published > 0) {
    console.log('Live within a minute (releases.server.ts holds a 60s backstop on the key cache).');
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('publish failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
