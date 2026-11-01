/**
 * World oil futures settlements → OilFuturesSettlement, once a day on the Pi.
 *
 *   npx tsx scripts/ingest-oil-settlements.ts            # last 3 months, upsert
 *   npx tsx scripts/ingest-oil-settlements.ts --dry-run  # fetch and print only
 *
 * For each series (lib/data/oil/futures.ts SERIES) it asks Yahoo's chart API
 * for the continuous front-month symbol and the next five named contracts,
 * keeps only sessions that have settled (`isSettled`), records which contract
 * the continuous series equalled on each day, and upserts one row per contract
 * per day. Three months each time, not one day: a run missed to a power cut is
 * caught up by the next, and the "vs month" baseline is always on hand.
 *
 * Runs on the Pi, not on Vercel, for the same reasons as every other source
 * here: Yahoo refuses many cloud addresses, and the card must read a stored
 * figure so that a re-download of an old day prints the same numbers.
 *
 * Yahoo's free data is for personal use. This feed is a trial; `source` on
 * every row is there so a licensed feed can replace it without a migration.
 *
 * A run that stores no settled session for a series fails (exit 1), whatever
 * else it did: a step that wrote nothing must not report success.
 */
import { createScriptPrismaClient } from '../prisma/client';
import {
  SERIES,
  candidateContracts,
  currentContract,
  isSettled,
  matchFront,
  nyDay,
  parseChart,
  round4,
  type ChartMeta,
  type DailyBar,
} from '../lib/data/oil/futures';

const DRY = process.argv.includes('--dry-run');
const UA = 'Mozilla/5.0 (X11; Linux aarch64) esbpowerline-ingest';

async function chart(symbol: string): Promise<{ bars: DailyBar[]; meta: ChartMeta | null }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=3mo&interval=1d`;
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (res.status === 404) return { bars: [], meta: null }; // a contract Yahoo does not list yet
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  return parseChart(await res.json());
}

async function main() {
  const now = Date.now();
  const today = nyDay(now);
  const prisma = DRY ? null : createScriptPrismaClient();
  let failed = 0;

  try {
    for (const s of SERIES) {
      const settled = (bars: DailyBar[]) => bars.filter((b) => isSettled(b.day, now));
      const cont = await chart(s.continuous);
      const continuous = settled(cont.bars);
      const contracts: Record<string, DailyBar[]> = {};
      const metas: Record<string, ChartMeta> = {};
      for (const sym of candidateContracts(s.root, today)) {
        const c = await chart(sym);
        const bars = settled(c.bars);
        if (bars.length) contracts[sym] = bars;
        if (c.meta) metas[sym] = c.meta;
      }
      const front = matchFront(continuous, contracts);
      // The latest settled day is the one a card prints. Its front is the
      // contract still being quoted, not whatever Yahoo's daily bar says on an
      // expiry day (see currentContract).
      const now_ = cont.meta && currentContract(cont.meta, metas);
      const lastDay = Object.values(contracts).flat().map((b) => b.day).sort().at(-1);
      if (now_ && lastDay && contracts[now_]?.some((b) => b.day === lastDay)) front[lastDay] = now_;
      const rows = Object.entries(contracts).flatMap(([contract, bars]) =>
        bars.map((b) => ({ contract, day: b.day, settle: round4(b.close), front: front[b.day] === contract })),
      );
      const latest = Object.keys(front).sort().at(-1);
      console.log(
        `${s.id}: ${Object.keys(contracts).length} contracts, ${rows.length} settlements, ` +
          `front on ${latest ?? '—'} = ${latest ? front[latest] : '—'}` +
          (continuous.length && !latest ? ' ! no contract matched the continuous series' : ''),
      );
      if (!rows.length || !latest) {
        failed++;
        continue;
      }
      if (!prisma) continue;
      // Write only what is new or has changed. The first capture on the Pi
      // upserted 1,152 rows one round-trip at a time and the runner's
      // ten-minute timeout cut it off part-way through heating oil; a normal
      // day adds four rows and moves one front flag.
      const fetchedAt = new Date(now);
      const held = await prisma.oilFuturesSettlement.findMany({
        where: { contract: { in: Object.keys(contracts) }, source: 'yahoo-chart' },
        select: { id: true, contract: true, tradeDate: true, settle: true, front: true },
      });
      const byKey = new Map(held.map((h) => [`${h.contract}|${h.tradeDate.toISOString().slice(0, 10)}`, h]));
      const fresh = rows.filter((r) => !byKey.has(`${r.contract}|${r.day}`));
      const moved = rows.filter((r) => {
        const h = byKey.get(`${r.contract}|${r.day}`);
        return h && (Number(h.settle) !== r.settle || h.front !== r.front);
      });
      if (fresh.length) {
        await prisma.oilFuturesSettlement.createMany({
          data: fresh.map((r) => ({
            series: s.id,
            contract: r.contract,
            tradeDate: new Date(`${r.day}T00:00:00Z`), // @db.Date goes in as UTC midnight
            settle: r.settle,
            front: r.front,
            fetchedAt,
          })),
          skipDuplicates: true,
        });
      }
      for (const r of moved) {
        await prisma.oilFuturesSettlement.update({
          where: { id: byKey.get(`${r.contract}|${r.day}`)!.id },
          data: { settle: r.settle, front: r.front, fetchedAt },
        });
      }
      console.log(`  ${s.id}: ${fresh.length} new, ${moved.length} changed, ${rows.length - fresh.length - moved.length} unchanged`);
    }
  } finally {
    await prisma?.$disconnect();
  }

  if (failed) {
    console.error(`${failed} series stored nothing`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
