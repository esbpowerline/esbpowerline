/**
 * Compare every published release against the static file it overrides.
 *
 * Publishing now takes precedence over the shipped archive — that is what makes
 * a correction possible. The hazard is the mirror image: a release published
 * before a later deploy is now OLDER than the file it outranks, and switching
 * on precedence would quietly serve the stale copy.
 *
 * For each row this reports whether the release and the file agree, and if not,
 * which one the site would serve.
 *
 * Usage: npm run check:releases
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { resolveDatabaseUrl, createPgPoolConfig } from '../lib/prisma-database';
import { payloadChecksum } from '../lib/data/release-checksum';
import { dataPathFor, type DataFeedName } from '../lib/data/feed-paths';

async function main() {
  const pool = new Pool(createPgPoolConfig(resolveDatabaseUrl()));
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `select feed, key, checksum, "publishedAt", "revokedAt"
         from "DataRelease" order by feed, key`,
    );

    if (!rows.length) {
      console.log('No releases published.');
      return;
    }

    let same = 0;
    let differs = 0;
    let noFile = 0;

    for (const r of rows) {
      const label = `${String(r.feed).padEnd(24)} ${String(r.key).padEnd(12)}`;
      if (r.revokedAt) {
        console.log(`  ·  ${label} revoked`);
        continue;
      }

      const rel = dataPathFor(r.feed as DataFeedName, r.key as string);
      if (!rel) {
        console.log(`  ?  ${label} no path maps to this feed`);
        continue;
      }

      let raw: string;
      try {
        raw = await readFile(path.join(process.cwd(), 'public', 'data', ...rel.split('/')), 'utf8');
      } catch {
        // Nothing static to override — the normal case for a day published
        // after the last deploy.
        noFile++;
        console.log(`  +  ${label} runtime-only (no static file)`);
        continue;
      }

      const fileSum = payloadChecksum(JSON.parse(raw));
      if (fileSum === r.checksum) {
        same++;
        console.log(`  =  ${label} identical to the static file`);
      } else {
        differs++;
        const published = new Date(r.publishedAt).toISOString().slice(0, 10);
        console.log(
          `  !  ${label} DIFFERS from ${rel} — the site serves the release, published ${published}`,
        );
      }
    }

    console.log(`\n${same} identical, ${differs} differing, ${noFile} runtime-only`);
    if (differs) {
      console.log(
        'A differing row is only correct if the release is the NEWER copy. If the static file\n' +
          'has since been corrected, republish the day (npm run publish:local -- --date <day>)\n' +
          'or revoke the row so the archive serves it again.',
      );
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('check failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
