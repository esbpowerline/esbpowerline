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
  isSettled,
  matchFront,
  nyDay,
  parseChart,
  type DailyBar,
} from '../lib/data/oil/futures';

const DRY = process.argv.includes('--dry-run');
const UA = 'Mozilla/5.0 (X11; Linux aarch64) esbpowerline-ingest';

async function chart(symbol: string): Promise<DailyBar[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=3mo&interval=1d`;
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (res.status === 404) return []; // a contract Yahoo does not list yet
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  return parseChart(await res.json()).bars;
}

async function main() {
  const now = Date.now();
  const today = nyDay(now);
  const prisma = DRY ? null : createScriptPrismaClient();
  let failed = 0;

  try {
    for (const s of SERIES) {
      const settled = (bars: DailyBar[]) => bars.filter((b) => isSettled(b.day, now));
      const continuous = settled(await chart(s.continuous));
      const contracts: Record<string, DailyBar[]> = {};
      for (const sym of candidateContracts(s.root, today)) {
        const bars = settled(await chart(sym));
        if (bars.length) contracts[sym] = bars;
      }
      const front = matchFront(continuous, contracts);
      const rows = Object.entries(contracts).flatMap(([contract, bars]) =>
        bars.map((b) => ({ contract, day: b.day, settle: b.close, front: front[b.day] === contract })),
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
      const fetchedAt = new Date(now);
      for (const r of rows) {
        const tradeDate = new Date(`${r.day}T00:00:00Z`); // @db.Date goes in as UTC midnight
        await prisma.oilFuturesSettlement.upsert({
          where: { contract_tradeDate_source: { contract: r.contract, tradeDate, source: 'yahoo-chart' } },
          create: { series: s.id, contract: r.contract, tradeDate, settle: r.settle, front: r.front, fetchedAt },
          update: { settle: r.settle, front: r.front, fetchedAt },
        });
      }
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
