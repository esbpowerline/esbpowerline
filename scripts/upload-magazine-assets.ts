/**
 * Mirror the demo issue's rendered artwork into Supabase storage.
 *
 * Why this exists: the artwork was staged on the Raspberry Pi (nginx on :8090)
 * and served over plain HTTP from a Tailscale-only hostname. On the deployed
 * site that fails twice over — an http:// image on an https:// page is blocked
 * as mixed content, and next.config.ts's CSP `img-src` never listed that
 * origin — so the cover, all 48 thumbnails and the reader were blank for every
 * visitor. The Supabase host is already allowed by that CSP.
 *
 *   npx tsx scripts/upload-magazine-assets.ts            # mirror, skip unchanged
 *   npx tsx scripts/upload-magazine-assets.ts --force    # re-upload everything
 *
 * Source defaults to the Pi and is overridable with ESB_MAGAZINE_SOURCE_BASE,
 * so this can be re-run from anywhere the artwork is reachable.
 *
 * The 102 MB PDF is deliberately NOT mirrored: the `media` bucket carries a
 * 10 MB per-object limit and the free plan caps a standard upload at 50 MB.
 * It stays on the Pi — see MAGAZINE_PDF_URL in lib/magazine-demo-issue.ts.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// The service-role key lives in .env, not .env.local. Load both, .env.local
// first so a local override still wins (dotenv does not overwrite).
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SOURCE_BASE = (process.env.ESB_MAGAZINE_SOURCE_BASE || 'http://esb-pi:8090/vol001-issue01').replace(/\/+$/, '');
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'media';
const PREFIX = 'magazine/vol001-issue01';
const PAGE_COUNT = 48;
const FORCE = process.argv.includes('--force');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (checked .env.local then .env).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pad = (n: number) => String(n).padStart(2, '0');

/** Every object the page needs, in the same relative layout the Pi serves. */
const ASSETS = [
  'cover.jpg',
  ...Array.from({ length: PAGE_COUNT }, (_, i) => `pages/page-${pad(i + 1)}.jpg`),
  ...Array.from({ length: PAGE_COUNT }, (_, i) => `thumbs/page-${pad(i + 1)}.jpg`),
];

/** Existing object sizes, so a re-run is cheap and idempotent. */
async function existingSizes(dir: string) {
  const sizes = new Map<string, number>();
  const { data, error } = await supabase.storage.from(BUCKET).list(dir, { limit: 1000 });
  if (error || !data) return sizes;
  for (const o of data) {
    const size = (o.metadata as { size?: number } | null)?.size;
    if (typeof size === 'number') sizes.set(o.name, size);
  }
  return sizes;
}

async function main() {
  console.log(`source ${SOURCE_BASE}`);
  console.log(`target ${supabaseUrl}/storage/v1/object/public/${BUCKET}/${PREFIX}`);

  const known = new Map<string, number>();
  for (const dir of ['', 'pages', 'thumbs']) {
    const sizes = await existingSizes(dir ? `${PREFIX}/${dir}` : PREFIX);
    for (const [name, size] of sizes) known.set(dir ? `${dir}/${name}` : name, size);
  }

  let uploaded = 0;
  let skipped = 0;
  let bytes = 0;

  for (const asset of ASSETS) {
    const res = await fetch(`${SOURCE_BASE}/${asset}`);
    if (!res.ok) {
      // A missing page is the finding, not something to paper over: half an
      // issue rendered is worse than a reader that refuses to open.
      console.error(`FAIL ${asset} — source returned ${res.status}`);
      process.exit(1);
    }
    const body = Buffer.from(await res.arrayBuffer());

    if (!FORCE && known.get(asset) === body.byteLength) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase.storage.from(BUCKET).upload(`${PREFIX}/${asset}`, body, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '31536000',
    });
    if (error) {
      console.error(`FAIL ${asset} — ${error.message}`);
      process.exit(1);
    }
    uploaded += 1;
    bytes += body.byteLength;
    process.stdout.write(`\r  uploaded ${uploaded}/${ASSETS.length - skipped}   `);
  }

  console.log(`\ndone — ${uploaded} uploaded (${(bytes / 1024 / 1024).toFixed(1)} MB), ${skipped} unchanged`);
}

main();
