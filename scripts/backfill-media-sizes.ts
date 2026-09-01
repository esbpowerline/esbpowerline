/**
 * One-shot: record `size` for media rows that never got one.
 *
 * This work used to happen inside `getMediaLibrary()`, on every render of the
 * media pages, across the whole library, in parallel — issuing a HEAD per row
 * and falling back to a full GET when the object carried no `content-length`.
 * It never converged, because a row whose fetch failed stayed null and was
 * retried on the next page view, and it was the largest single consumer of the
 * project's Supabase egress quota.
 *
 * New uploads record `size` at the moment they are stored
 * (`app/api/upload/route.ts` passes `file.size`), so only rows created before
 * that — or imported by a script — need this. Run it once:
 *
 *   npx tsx scripts/backfill-media-sizes.ts          # report only
 *   npx tsx scripts/backfill-media-sizes.ts --write  # persist
 *
 * HEAD only. If a HEAD carries no content-length the row is left alone and
 * reported; downloading the object to weigh it is what caused the problem.
 */
import prisma from '../lib/prisma';

const WRITE = process.argv.includes('--write');
/** Deliberately serial-ish: this is a maintenance task, not a page render. */
const CONCURRENCY = 4;

async function remoteSize(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) {
      console.warn(`  ${res.status} ${url}`);
      return null;
    }
    const len = res.headers.get('content-length');
    return len ? Number.parseInt(len, 10) || null : null;
  } catch (err) {
    console.warn(`  unreachable ${url}: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  const rows = await prisma.media.findMany({
    where: { OR: [{ size: null }, { size: 0 }] },
    select: { id: true, url: true, name: true },
  });

  console.log(`${rows.length} media rows without a recorded size.`);
  if (rows.length === 0) return;

  let resolved = 0;
  let unresolved = 0;

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (row) => {
        if (!row.url.startsWith('http')) {
          unresolved += 1;
          return;
        }
        const size = await remoteSize(row.url);
        if (size == null) {
          unresolved += 1;
          return;
        }
        resolved += 1;
        if (WRITE) {
          await prisma.media.update({ where: { id: row.id }, data: { size } });
        }
        console.log(`  ${(size / 1024).toFixed(0).padStart(7)} kB  ${row.name}`);
      }),
    );
  }

  console.log(
    `\n${resolved} resolved, ${unresolved} left alone.` +
      (WRITE ? ' Written.' : ' Dry run — pass --write to persist.'),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
