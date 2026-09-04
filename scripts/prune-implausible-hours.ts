/**
 * Remove NLDC hours whose stamped year cannot be real.
 *
 * The generation table carries a handful of rows with a malformed year — 0008,
 * 0021, 0024, 0050, 0080, 0090 and 0093 appeared in the 2026-09-05 backfill,
 * 7 rows in ~90,000 (0.008%). They parse cleanly because the cell genuinely
 * holds four digits; they are simply not years.
 *
 * This is not a repair. Nothing is guessed about what the year was meant to be,
 * and no value is altered. The rows are removed from the CANONICAL table and
 * counted, while the pages that carried them remain whole in
 * SourceDocument.rawGzip — so a better rule can be applied later without
 * refetching a page PGCB may no longer serve. The ingester applies the same
 * window going forward; this only cleans rows written before that guard existed.
 *
 *   npx tsx --conditions react-server scripts/prune-implausible-hours.ts
 *   npx tsx --conditions react-server scripts/prune-implausible-hours.ts --apply
 */
import { prisma } from '@/lib/prisma';

const EARLIEST = new Date('2010-01-01T00:00:00+06:00');

async function main() {
  const apply = process.argv.includes('--apply');
  const horizon = new Date(Date.now() + 2 * 86_400_000);

  const doomed = await prisma.gridHourlyObservation.findMany({
    where: { OR: [{ observedAt: { lt: EARLIEST } }, { observedAt: { gt: horizon } }] },
    select: { series: true, observedAt: true, sourceDocumentId: true },
    orderBy: { observedAt: 'asc' },
  });

  console.log(`rows outside [${EARLIEST.toISOString().slice(0, 10)}, now+2d]: ${doomed.length}`);
  for (const r of doomed) {
    console.log(`  ${r.series.padEnd(14)} ${r.observedAt.toISOString()}  (evidence kept: ${r.sourceDocumentId})`);
  }
  if (!doomed.length) return;

  if (!apply) {
    console.log('\nDRY RUN — nothing deleted. Re-run with --apply.');
    return;
  }
  const { count } = await prisma.gridHourlyObservation.deleteMany({
    where: { OR: [{ observedAt: { lt: EARLIEST } }, { observedAt: { gt: horizon } }] },
  });
  console.log(`\ndeleted ${count} canonical row(s); every source document retained`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
