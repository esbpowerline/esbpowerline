/**
 * Put the four interconnector columns back where NLDC printed them, for the
 * hours the generation page carried Rooppur's column before the parser knew it.
 *
 * Around 2026-11-19 NLDC's generation page gained a নিউক্লিয়ার column between
 * Wind and Bheramara (15 cells a row, was 14). The parser read by position, so
 * every row from then on stored Rooppur under Bheramara, Bheramara under
 * Tripura, Tripura under Adani and Adani under Nepal — 25 Nov 09:00 stored
 * Bheramara 0 and Nepal 827 where NLDC printed Bheramara 867, Adani 827 and
 * Nepal 0. The parser is fixed (live-grid-parse.ts, 2026-11-25); this repairs
 * the rows written before it was.
 *
 * NO REFETCH: every page is held whole in SourceDocument.rawGzip, so the right
 * value is a pure function of evidence already stored (as reparse-nldc-nulls.ts
 * does). Only the four shifted columns are written, and only where the stored
 * value differs from the reparse. A plain UPDATE, not the ingest's COALESCE —
 * the stored values are wrong, not merely missing.
 *
 * Every repaired hour is then checked against PGCB's separate India and Nepal
 * import pages (INDIA_IMPORT / NEPAL_IMPORT series), which carry the same
 * actuals independently; disagreements are printed, never "fixed".
 *
 *   npx tsx --conditions react-server scripts/repair-nldc-nuclear-shift.ts            # dry run
 *   npx tsx --conditions react-server scripts/repair-nldc-nuclear-shift.ts --apply
 */
import { gunzipSync } from 'node:zlib';
import { prisma } from '@/lib/prisma';
import { parseNldcGenerationHtml } from '@/lib/data/grid/live-grid-parse';

const COLS = ['bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw'] as const;
type Col = (typeof COLS)[number];
const SINCE = new Date('2026-11-15T00:00:00+06:00');
const num = (v: unknown) => (v == null ? null : Number(v));

async function main() {
  const apply = process.argv.includes('--apply');
  const docs = await prisma.sourceDocument.findMany({
    where: {
      publisher: 'PGCB',
      rawGzip: { not: null },
      sourceUrl: { contains: 'view_generations' },
      windowEnd: { gte: SINCE },
    },
    orderBy: { fetchedAt: 'asc' },
    select: { id: true, rawGzip: true, fetchedAt: true },
  });

  // Later documents win: the newest page holding an hour is the one the
  // ingest last wrote from.
  const parsed = new Map<number, Record<Col, number | null>>();
  for (const d of docs) {
    for (const r of parseNldcGenerationHtml(gunzipSync(Buffer.from(d.rawGzip!)).toString('utf8'))) {
      const at = new Date(`${r.at}+06:00`);
      if (!Number.isFinite(at.getTime()) || at < SINCE) continue;
      parsed.set(at.getTime(), { bheramaraMw: r.bheramaraMw, tripuraMw: r.tripuraMw, adaniMw: r.adaniMw, nepalMw: r.nepalMw });
    }
  }

  const stored = await prisma.gridHourlyObservation.findMany({
    where: { series: 'GENERATION', observedAt: { gte: SINCE } },
    select: { id: true, observedAt: true, bheramaraMw: true, tripuraMw: true, adaniMw: true, nepalMw: true },
    orderBy: { observedAt: 'asc' },
  });
  const imports = await prisma.gridHourlyObservation.findMany({
    where: { series: { in: ['INDIA_IMPORT', 'NEPAL_IMPORT'] }, observedAt: { gte: SINCE } },
    select: { series: true, observedAt: true, bheramaraMw: true, tripuraMw: true, adaniMw: true, nepalMw: true },
  });
  const india = new Map(imports.filter((r) => r.series === 'INDIA_IMPORT').map((r) => [r.observedAt.getTime(), r]));
  const nepal = new Map(imports.filter((r) => r.series === 'NEPAL_IMPORT').map((r) => [r.observedAt.getTime(), r]));

  let changed = 0, first: Date | null = null, last: Date | null = null, crossOk = 0, crossBad = 0, crossNone = 0;
  const badSamples: string[] = [];
  for (const row of stored) {
    const want = parsed.get(row.observedAt.getTime());
    if (!want) continue;
    const diff = COLS.some((c) => num(row[c]) !== want[c]);
    // Independent check of the repaired values against the import pages.
    const i = india.get(row.observedAt.getTime());
    const n = nepal.get(row.observedAt.getTime());
    if (i || n) {
      const agrees =
        (!i || (num(i.bheramaraMw) === want.bheramaraMw && num(i.tripuraMw) === want.tripuraMw && num(i.adaniMw) === want.adaniMw)) &&
        (!n || num(n.nepalMw) === want.nepalMw);
      if (agrees) crossOk += 1;
      else {
        crossBad += 1;
        if (badSamples.length < 5) badSamples.push(`${row.observedAt.toISOString()} gen=${JSON.stringify(want)} india=${i ? [i.bheramaraMw, i.tripuraMw, i.adaniMw].join('/') : '-'} nepal=${n ? n.nepalMw : '-'}`);
      }
    } else crossNone += 1;
    if (!diff) continue;
    changed += 1;
    first ??= row.observedAt;
    last = row.observedAt;
    if (apply) {
      await prisma.gridHourlyObservation.update({ where: { id: row.id }, data: want });
    }
  }

  console.log(`documents reparsed       ${docs.length}`);
  console.log(`generation rows checked  ${stored.length}`);
  console.log(`rows ${apply ? 'repaired' : 'to repair'}         ${changed}${first ? `  (${first.toISOString()} .. ${last!.toISOString()})` : ''}`);
  console.log(`against import pages     ${crossOk} agree, ${crossBad} disagree, ${crossNone} with no import row`);
  for (const s of badSamples) console.log(`  disagree ${s}`);
  if (!apply) console.log('\ndry run — nothing written. Re-run with --apply.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
