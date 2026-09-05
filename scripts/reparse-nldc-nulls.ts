/**
 * Restore "not reported" to the generation series, from evidence already held.
 *
 * The parser collapsed two different empty cells into one value. NLDC prints a
 * literal `0` for a measured zero and an EMPTY cell for a column it is not
 * reporting, and it uses both on the same row — 2015-05-03 23:00 carries `0`
 * for Tripura and nothing at all for Adani — two different cells on one row,
 * so the distinction is the source's own. Two layers collapsed them:
 * `Number('')` is `0` and passes `Number.isFinite`, and `adaniMw: adani ?? 0`
 * caught whatever survived. Both are fixed; this repairs the rows written
 * before they were.
 *
 * Measured against the held documents, the archive carried a figure in 84,895
 * canonical observations for Adani, 86,880 for Nepal, 73,572 for wind and
 * 21,897 for solar where the source printed none. Whether a blank means the
 * plant was absent, the meter was down, or NLDC simply did not publish that
 * column is NOT established by this evidence and is not decided here.
 *
 * NO REFETCH. Every page is stored whole in SourceDocument.rawGzip, so the
 * correct value is a pure function of evidence already on disk. That is the
 * entire reason the raw bytes are kept, and this is the first time it has paid
 * for itself: PGCB could stop serving 2015 tomorrow and this would still run.
 *
 * Only the eight nullable columns are touched. `totalMw`, `gasMw` and `coalMw`
 * are required by the parser and never blank in the held evidence, so they are
 * left alone rather than rewritten to the same values.
 *
 *   npx tsx --conditions react-server scripts/reparse-nldc-nulls.ts
 *   npx tsx --conditions react-server scripts/reparse-nldc-nulls.ts --apply
 */
import { gunzipSync } from 'node:zlib';
import { prisma } from '@/lib/prisma';
import { parseNldcGenerationHtml } from '@/lib/data/grid/live-grid-parse';

const COLS = [
  'liquidMw', 'hydroMw', 'solarMw', 'windMw',
  'bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw',
] as const;

const DHAKA = '+06:00';
const EARLIEST = Date.parse('2010-01-01T00:00:00+06:00');

async function main() {
  const apply = process.argv.includes('--apply');
  const before = await counts();

  let docs = 0, rowsSeen = 0, nulled = 0;
  const perCol: Record<string, number> = Object.fromEntries(COLS.map((c) => [c, 0]));
  const BATCH = 200;

  for (let skip = 0; ; skip += BATCH) {
    const page = await prisma.sourceDocument.findMany({
      where: { publisher: 'PGCB', rawGzip: { not: null }, sourceUrl: { contains: 'view_generations' } },
      orderBy: { id: 'asc' }, skip, take: BATCH, select: { rawGzip: true },
    });
    if (!page.length) break;

    for (const d of page) {
      docs += 1;
      const rows = parseNldcGenerationHtml(gunzipSync(Buffer.from(d.rawGzip!)).toString('utf8'));
      const fixes: Array<{ at: Date; vals: Array<number | null> }> = [];
      for (const r of rows) {
        const at = new Date(`${r.at}${DHAKA}`);
        if (!Number.isFinite(at.getTime()) || at.getTime() < EARLIEST) continue;
        rowsSeen += 1;
        const vals = COLS.map((c) => r[c] as number | null);
        if (!vals.some((v) => v === null)) continue;
        vals.forEach((v, i) => { if (v === null) perCol[COLS[i]] += 1; });
        nulled += 1;
        fixes.push({ at, vals });
      }
      if (apply && fixes.length) await writeFixes(fixes);
    }
    process.stderr.write(`\r  ${docs} documents, ${rowsSeen} rows, ${nulled} needing correction…`);
  }

  console.log(`\n\n  documents reparsed      ${docs.toLocaleString()}`);
  console.log(`  rows examined           ${rowsSeen.toLocaleString()}`);
  console.log(`  rows with an absence    ${nulled.toLocaleString()}`);
  console.log('\n  fabricated zeros by column (occurrences in evidence):');
  for (const c of COLS) console.log(`    ${c.padEnd(13)} ${perCol[c].toLocaleString().padStart(9)}`);

  if (!apply) {
    console.log('\n  DRY RUN — nothing written. Re-run with --apply.');
    return;
  }
  const after = await counts();
  console.log('\n  canonical non-null counts, before -> after:');
  for (const c of COLS) {
    const b = before[c] ?? 0, a = after[c] ?? 0;
    const mark = b === a ? '' : `   (${(b - a).toLocaleString()} corrected to NULL)`;
    console.log(`    ${c.padEnd(13)} ${b.toLocaleString().padStart(8)} -> ${a.toLocaleString().padStart(8)}${mark}`);
  }
}

async function counts(): Promise<Record<string, number>> {
  const r = await prisma.$queryRawUnsafe<Array<Record<string, bigint>>>(
    `SELECT ${COLS.map((c) => `COUNT("${c}") AS "${c}"`).join(', ')}
     FROM "GridHourlyObservation" WHERE "series" = 'GENERATION'`,
  );
  return Object.fromEntries(Object.entries(r[0]).map(([k, v]) => [k, Number(v)]));
}

/** Direct assignment, never COALESCE — the point is to write NULL over a 0. */
async function writeFixes(fixes: Array<{ at: Date; vals: Array<number | null> }>) {
  const params: unknown[] = [];
  const tuples = fixes.map((f) => {
    const start = params.length;
    params.push(f.at, ...f.vals);
    const casts = [`$${start + 1}::timestamp`, ...f.vals.map((_, i) => `$${start + i + 2}::decimal`)];
    return `(${casts.join(', ')})`;
  });
  const sql =
    `UPDATE "GridHourlyObservation" AS g SET ` +
    COLS.map((c) => `"${c}" = v.${c.toLowerCase()}`).join(', ') +
    ` FROM (VALUES ${tuples.join(', ')}) AS v(observed, ${COLS.map((c) => c.toLowerCase()).join(', ')})` +
    ` WHERE g."series" = 'GENERATION' AND g."observedAt" = v.observed`;
  await prisma.$executeRawUnsafe(sql, ...params);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
