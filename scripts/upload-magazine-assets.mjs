/**
 * Uploads one magazine issue's artwork to Supabase Storage.
 *
 * Replaces the Raspberry Pi (nginx on :8090) that used to serve these files.
 * The Pi was reachable only over Tailscale, so every page image and the PDF
 * 404'd for anyone off the tailnet — including the site itself once Tailscale
 * dropped. The Pi keeps its real job (daily/hourly log collection); it is no
 * longer in the path of anything a reader loads.
 *
 * The bucket is PRIVATE. The demo issue carries full-page mockup adverts for
 * real companies (see lib/magazine-demo-issue.ts), so the artwork must not be
 * fetchable by URL alone; the app mints short-lived signed URLs per render via
 * lib/magazine-assets.ts. Do not flip this bucket public.
 *
 * Usage:
 *   node scripts/upload-magazine-assets.mjs <renderedDir> <pdfPath> [issueSlug]
 *
 * <renderedDir> holds cover.jpg, pages/page-NN.jpg and thumbs/page-NN.jpg.
 * Re-running is safe: every object is uploaded with upsert.
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

config({ path: '.env.local' });
config();

const BUCKET = 'magazine';
const [renderedDir, pdfPath, issueSlug = 'vol001-issue01'] = process.argv.slice(2);

if (!renderedDir || !pdfPath) {
  throw new Error('Usage: node scripts/upload-magazine-assets.mjs <renderedDir> <pdfPath> [issueSlug]');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * 50 MB, which is this Supabase project's global per-object limit — asking for
 * more makes createBucket fail outright with "The object exceeded the maximum
 * allowed size". Raising it is a dashboard/plan change (Storage -> Settings),
 * not something this script can do. The print master PDF is ~102 MB and so
 * cannot be stored here; ship the web edition instead (see scripts/render-magazine-pdf.mjs).
 */
const FILE_SIZE_LIMIT = 50 * 1024 * 1024;

async function ensureBucket() {
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: ['image/jpeg', 'application/pdf'],
  });
  if (error && !/already exists/i.test(error.message)) throw error;

  // createBucket is a no-op when the bucket exists, so push the limits either way.
  const { error: updateError } = await admin.storage.updateBucket(BUCKET, {
    public: false,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: ['image/jpeg', 'application/pdf'],
  });
  if (updateError) throw updateError;
  console.log(`bucket "${BUCKET}" ready (private, limit ${(FILE_SIZE_LIMIT / 1024 / 1024) | 0} MB)`);
}

async function upload(localPath, objectPath, contentType) {
  const body = fs.readFileSync(localPath);
  const { error } = await admin.storage.from(BUCKET).upload(objectPath, body, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(`${objectPath}: ${error.message}`);
  return body.length;
}

/** Uploads with limited concurrency; Storage rate-limits large parallel bursts. */
async function uploadAll(jobs, concurrency = 6) {
  let done = 0;
  let bytes = 0;
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        bytes += await upload(job.local, job.object, job.type);
        done += 1;
        if (done % 12 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length}`);
      }
    }),
  );
  return bytes;
}

async function main() {
  await ensureBucket();

  const pagesDir = path.join(renderedDir, 'pages');
  const thumbsDir = path.join(renderedDir, 'thumbs');
  const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.jpg')).sort();
  const thumbFiles = fs.readdirSync(thumbsDir).filter((f) => f.endsWith('.jpg')).sort();

  if (pageFiles.length !== thumbFiles.length) {
    throw new Error(`page/thumb mismatch: ${pageFiles.length} pages vs ${thumbFiles.length} thumbs`);
  }

  const imageJobs = [
    { local: path.join(renderedDir, 'cover.jpg'), object: `${issueSlug}/cover.jpg`, type: 'image/jpeg' },
    ...pageFiles.map((f) => ({ local: path.join(pagesDir, f), object: `${issueSlug}/pages/${f}`, type: 'image/jpeg' })),
    ...thumbFiles.map((f) => ({ local: path.join(thumbsDir, f), object: `${issueSlug}/thumbs/${f}`, type: 'image/jpeg' })),
  ];

  console.log(`uploading ${imageJobs.length} images...`);
  const imageBytes = await uploadAll(imageJobs);

  const pdfObject = `${issueSlug}/${path.basename(pdfPath).toLowerCase().replace(/\s+/g, '-')}`;
  const pdfSize = fs.statSync(pdfPath).size;
  if (pdfSize > FILE_SIZE_LIMIT) {
    throw new Error(
      `${path.basename(pdfPath)} is ${(pdfSize / 1024 / 1024).toFixed(1)} MB, over this project's ` +
        `${FILE_SIZE_LIMIT / 1024 / 1024} MB per-object limit. Upload the web edition, or raise the ` +
        `global file size limit in the Supabase dashboard first.`,
    );
  }
  console.log(`uploading PDF (${(pdfSize / 1024 / 1024).toFixed(1)} MB) -> ${pdfObject}`);
  await upload(pdfPath, pdfObject, 'application/pdf');

  console.log('\ndone');
  console.log(`  images: ${imageJobs.length} objects, ${(imageBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  pdf:    ${pdfObject}, ${pdfSize.toLocaleString()} bytes`);
  console.log(`\nSet in .env.local if the slug or bucket differ from the defaults in lib/magazine-demo-issue.ts:`);
  console.log(`  MAGAZINE_ISSUE_SLUG=${issueSlug}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
