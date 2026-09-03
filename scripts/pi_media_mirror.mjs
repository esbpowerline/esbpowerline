// Mirror the Supabase `media` bucket to a local directory — Pi weekly job.
//
// The first version listed the bucket over the Storage API with the anon key
// and reported "0 fetched, 0 already held" as success. The bucket is public,
// but public means public object READS — listing goes through storage.objects,
// where RLS is enabled with no anon policy, so the API answered an empty list
// and the mirror faithfully copied nothing while the bucket held 659 files
// (2026-09-03). Truth about what exists lives in Postgres, and the Pi already
// holds DATABASE_URL for publishing — so the listing comes from the database
// and each object is fetched over its public URL. No new secrets.
//
//   node scripts/pi_media_mirror.mjs <dest-dir>
//
// Exit codes: 0 mirrored (counts printed), 1 credentials/query failure,
// 2 mirror incomplete (fewer files held than the database names).
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const dest = process.argv[2];
if (!dest) {
  console.error('usage: pi_media_mirror.mjs <dest-dir>');
  process.exit(1);
}

// .env.local, not dotenv: this runs from bash with no loader in front of it.
const envFile = path.join(process.cwd(), '.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8').split('\n')
    .map((l) => l.match(/^([A-Z_]+)=("?)(.*)\2\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[3]]),
);
const dbUrl = env.DATABASE_URL;
const supaUrl = (env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
if (!dbUrl || !supaUrl) {
  console.error('media mirror: DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL missing from .env.local');
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
let rows;
try {
  await client.connect();
  ({ rows } = await client.query(
    `select name, (metadata->>'size')::bigint as size
       from storage.objects where bucket_id = 'media' order by name`,
  ));
  await client.end();
} catch (e) {
  console.error(`media mirror: database listing failed: ${e.message}`);
  process.exit(1);
}

// An empty bucket is a claim this site's history contradicts. Say so loudly
// rather than "mirroring" nothing.
if (rows.length === 0) {
  console.error('media mirror: database names ZERO objects in the media bucket — refusing to call that a mirror');
  process.exit(2);
}

let fetched = 0;
let kept = 0;
let failed = 0;
for (const { name, size } of rows) {
  const out = path.join(dest, name);
  try {
    if (fs.existsSync(out) && (size == null || fs.statSync(out).size === Number(size))) {
      kept += 1;
      continue;
    }
    const res = await fetch(`${supaUrl}/storage/v1/object/public/media/${encodeURI(name)}`, {
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (size != null && buf.length !== Number(size)) throw new Error(`size mismatch ${buf.length} != ${size}`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // Temp name + rename, so a power cut mid-download leaves no torn file
    // that a later run would trust by its size.
    const tmp = `${out}.part`;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, out);
    fetched += 1;
  } catch (e) {
    failed += 1;
    console.error(`  ! ${name}: ${e.message}`);
  }
}

console.log(`media mirror: ${fetched} fetched, ${kept} already held, ${failed} failed, ${rows.length} in bucket`);
process.exit(failed > 0 ? 2 : 0);
