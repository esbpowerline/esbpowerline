/**
 * Give every existing DataRelease its revision 1.
 *
 * Migration 0012 created the append-only history table; rows published before
 * the switch have no history row, so "what did we publish last Tuesday" cannot
 * be answered for them until this runs. Each release without revisions gets
 * exactly one: its current payload as revision 1, reason stating it is a
 * backfill — the history must never pretend it watched a publish it did not.
 *
 * Run AFTER `npm run db:migrate` has applied 0012.
 *
 *   node scripts/backfill-release-revisions.mjs           # report
 *   node scripts/backfill-release-revisions.mjs --write   # apply
 *
 * Idempotent: a release that already has any revision is left alone, so
 * re-running after a partial failure is safe.
 */
import { PrismaClient } from '@prisma/client';

const WRITE = process.argv.includes('--write');
const prisma = new PrismaClient();

const releases = await prisma.dataRelease.findMany({
  select: {
    id: true,
    feed: true,
    key: true,
    payload: true,
    checksum: true,
    revokedAt: true,
    publishedAt: true,
    publishedById: true,
    _count: { select: { revisions: true } },
  },
  orderBy: [{ feed: 'asc' }, { key: 'asc' }],
});

const pending = releases.filter((r) => r._count.revisions === 0);
const covered = releases.length - pending.length;

console.log(`${releases.length} release(s); ${covered} already have history; ${pending.length} to backfill`);

let written = 0;
for (const r of pending) {
  if (WRITE) {
    await prisma.dataReleaseRevision.create({
      data: {
        releaseId: r.id,
        revision: 1,
        payload: r.payload,
        checksum: r.checksum,
        previousChecksum: null,
        reason: 'backfill: pre-revision archive state — earlier corrections to this key were not witnessed',
        kind: r.revokedAt ? 'REVOKE' : 'PUBLISH',
        publishedById: r.publishedById,
        // The current row's publishedAt is the best available timestamp; for a
        // corrected key it is the LAST publish, and the history says so above.
        publishedAt: r.publishedAt,
      },
    });
    written++;
  } else {
    console.log(`  would backfill ${r.feed} ${r.key}${r.revokedAt ? ' (revoked)' : ''}`);
  }
}

if (WRITE) console.log(`${written} revision(s) written.`);
else if (pending.length) console.log('\nDry run — pass --write to apply.');

await prisma.$disconnect();
