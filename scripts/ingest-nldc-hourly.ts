/**
 * Preserve NLDC's hourly generation and demand/load-shed series.
 *
 * PGCB publishes two paginated HTML pages on its ERP portal and keeps them for
 * very different lengths of time. Measured 2026-09-05:
 *
 *   generation      pages 1..~2036, oldest row 2015-04-17  (~103,000 hours)
 *   demand/supply   pages 1..~69,   oldest row ~2026-05    (~3,500 hours)
 *
 * The demand series rolls off after roughly 145 days. Nothing else in
 * Bangladesh keeps it. Until now ESB fetched it every ten minutes behind a
 * cache and discarded it (`live-grid.server.ts`), so the one party in a
 * position to archive it was throwing it away.
 *
 * This is the ingestion pattern the rest of the platform should follow, so it
 * is deliberately built out of what already exists rather than beside it:
 *
 *   - `SourceDocument` carries provenance — publisher, URL, sha256, fetch time,
 *     parser version, the gzipped bytes, ingest and validation state. It was
 *     already the repo's provenance table; it gained columns, not a rival.
 *   - The parsers are `parseNldcGenerationHtml` / `parseNldcDemandSupplyHtml`
 *     from `live-grid-parse.ts` — the same functions the live layer uses, with
 *     the same fixtures behind them. Reuse, never reimplement.
 *   - `GridHourlyObservation` is keyed `(series, observedAt)`, so a re-run
 *     updates an hour instead of duplicating it. Running this twice is a no-op.
 *
 * Two rules from the charter shape the storage:
 *
 *   - A blank cell is `null`, never `0`. Every figure column is nullable, and
 *     an hour NLDC printed with an empty column stores null for it. That is why
 *     this is a wide table and not the tall `Observation` shape, whose `value`
 *     is NOT NULL: there, absence can only be a missing row, which would make
 *     "NLDC printed nothing" and "we never fetched it" indistinguishable.
 *   - `observedAt` and `fetchedAt` are separate columns and never collapsed.
 *     The distance between them is how late the archive was, and it is not
 *     recoverable once lost.
 *
 * Usage:
 *   npx tsx scripts/ingest-nldc-hourly.ts --backfill              # everything
 *   npx tsx scripts/ingest-nldc-hourly.ts --backfill --series demand
 *   npx tsx scripts/ingest-nldc-hourly.ts --recent 3              # the poll
 *   npx tsx scripts/ingest-nldc-hourly.ts --report                # no fetching
 *   npx tsx scripts/ingest-nldc-hourly.ts --backfill --max-pages 20 --dry-run
 */
import https from 'node:https';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { prisma } from '@/lib/prisma';
import {
  parseNldcGenerationHtml,
  parseNldcDemandSupplyHtml,
} from '@/lib/data/grid/live-grid-parse';

/** Hours NLDC printed more than once inside one page, collapsed on the way in. */
let duplicateHours = 0;
/** Rows whose stamped date cannot be real. Counted, never quietly dropped. */
let implausibleDates = 0;

/**
 * The plausibility window for a stamped hour.
 *
 * NLDC's generation table carries a handful of rows whose year is malformed —
 * 0008, 0021, 0024, 0050, 0080, 0090 and 0093 appeared in the 2026-09-05
 * backfill, 7 rows in ~43,000 (0.016%). They parse cleanly as dates because the
 * cell really does hold four digits; they are simply not years.
 *
 * The rule is deterministic and stated rather than inferred: a row is canonical
 * only if its hour falls between the earliest date this archive could describe
 * and two days ahead of now (NLDC occasionally posts an hour slightly ahead of
 * the wall clock). Anything else is counted and excluded from the canonical
 * table — it is NOT repaired, and nothing is guessed about what the year was
 * meant to be. The evidence survives regardless: the page it came from is
 * stored whole in SourceDocument.rawGzip, so a better rule can be applied later
 * without refetching a page PGCB may no longer serve.
 */
const EARLIEST_PLAUSIBLE = Date.parse('2010-01-01T00:00:00+06:00');
const plausible = (d: Date) => {
  const t = d.getTime();
  return Number.isFinite(t) && t >= EARLIEST_PLAUSIBLE && t <= Date.now() + 2 * 86_400_000;
};

/** Bumped when the parse changes shape, so a row says which code produced it. */
const PARSER_VERSION = 'nldc-hourly@2026-09-05';

/** Dhaka is UTC+06:00 all year, no DST — observation-window.ts. */
const DHAKA_OFFSET = '+06:00';

const SERIES = {
  GENERATION: {
    url: 'https://erp.powergrid.gov.bd/w/generations/view_generations_bn',
    label: 'generation',
  },
  DEMAND_SUPPLY: {
    url: 'https://erp.powergrid.gov.bd/web/generations/view_demand_supply_loadshed_bn',
    label: 'demand/supply/load-shed',
  },
} as const;
type SeriesKey = keyof typeof SERIES;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

/**
 * Plain node:https, not fetch — erp.powergrid.gov.bd serves an incomplete
 * certificate chain, so Node's fetch fails UNABLE_TO_VERIFY_LEAF_SIGNATURE.
 * Verification is disabled for THIS request only, never globally, exactly as
 * live-grid.server.ts already does for the same host.
 */
function fetchPage(url: string, timeoutMs = 30_000): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': UA, Accept: 'text/html' }, rejectUnauthorized: false, timeout: timeoutMs },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`${url} answered ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error(`${url} timed out`)));
    req.on('error', reject);
  });
}

/** Safe retries: transient network failure must not end a 2,000-page walk. */
async function fetchWithRetry(url: string, attempts = 4): Promise<Buffer> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetchPage(url);
    } catch (e) {
      lastErr = e;
      // Linear, not exponential: this is a government portal on a slow link,
      // and hammering it faster after a timeout is the wrong instinct.
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

const toInstant = (localIso: string) => new Date(`${localIso}${DHAKA_OFFSET}`);
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');

type Row = {
  observedAt: Date;
  remark: string | null;
  values: Record<string, number | null>;
};

function rowsFor(series: SeriesKey, html: string): Row[] {
  if (series === 'GENERATION') {
    return parseNldcGenerationHtml(html).map((r) => ({
      observedAt: toInstant(r.at),
      remark: r.remark || null,
      values: {
        totalMw: r.totalMw,
        gasMw: r.gasMw,
        liquidMw: r.liquidMw,
        coalMw: r.coalMw,
        hydroMw: r.hydroMw,
        solarMw: r.solarMw,
        windMw: r.windMw,
        bheramaraMw: r.bheramaraMw,
        tripuraMw: r.tripuraMw,
        adaniMw: r.adaniMw,
        nepalMw: r.nepalMw,
        // The generation page's load-shed column is commented out in the
        // current layout, so this is genuinely null rather than zero.
        loadShedMw: r.loadShedMw,
      },
    }));
  }
  return parseNldcDemandSupplyHtml(html).map((r) => ({
    observedAt: toInstant(r.at),
    remark: r.remark || null,
    values: { demandMw: r.demandMw, supplyMw: r.supplyMw, loadShedMw: r.loadShedMw },
  }));
}

const FIGURE_COLUMNS = [
  'totalMw', 'gasMw', 'liquidMw', 'coalMw', 'hydroMw', 'solarMw', 'windMw',
  'bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw',
  'demandMw', 'supplyMw', 'loadShedMw',
] as const;

/**
 * One statement per page rather than one per row. 103,000 upserts over a pooled
 * connection to Tokyo at ~70 ms each would be two hours; batched by page it is
 * ~2,000 round trips. `ON CONFLICT (series, observedAt)` is what makes a re-run
 * idempotent, and COALESCE on the figure columns means a later page that
 * carries the same hour cannot blank a figure an earlier one recorded.
 */
async function upsertRows(series: SeriesKey, rows: Row[], docId: string, fetchedAt: Date) {
  const before = rows.length;
  rows = rows.filter((r) => plausible(r.observedAt));
  implausibleDates += before - rows.length;
  if (!rows.length) return 0;
  // NLDC repeats an hour within a single page — page 275 of the generation
  // archive carries one twice, and Postgres refuses a multi-row upsert that
  // touches the same conflict target more than once ("ON CONFLICT DO UPDATE
  // command cannot affect row a second time"). Collapse to the last occurrence
  // and count it, because a source repeating itself is a fact about the source
  // worth surfacing rather than a nuisance to swallow quietly.
  const byHour = new Map<number, Row>();
  for (const r of rows) byHour.set(r.observedAt.getTime(), r);
  const collapsed = rows.length - byHour.size;
  if (collapsed > 0) duplicateHours += collapsed;
  rows = [...byHour.values()];
  const cols = ['series', 'observedAt', 'fetchedAt', 'sourceDocumentId', 'remark', 'parserVersion', ...FIGURE_COLUMNS];
  const params: unknown[] = [];
  const tuples = rows.map((r) => {
    const vals = [
      series, r.observedAt, fetchedAt, docId, r.remark, PARSER_VERSION,
      ...FIGURE_COLUMNS.map((c) => (c in r.values ? r.values[c] : null)),
    ];
    const start = params.length;
    params.push(...vals);
    // gen_random_uuid()::text for the id — the table's PK is a plain TEXT
    // column that Prisma normally fills with a cuid.
    return `(gen_random_uuid()::text, ${vals.map((_, i) => `$${start + i + 1}`).join(', ')})`;
  });
  const updates = ['fetchedAt', 'sourceDocumentId', 'remark', 'parserVersion']
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .concat(FIGURE_COLUMNS.map((c) => `"${c}" = COALESCE(EXCLUDED."${c}", "GridHourlyObservation"."${c}")`))
    .join(', ');

  const sql =
    `INSERT INTO "GridHourlyObservation" ("id", ${cols.map((c) => `"${c}"`).join(', ')}) ` +
    `VALUES ${tuples.join(', ')} ` +
    `ON CONFLICT ("series", "observedAt") DO UPDATE SET ${updates}`;
  return prisma.$executeRawUnsafe(sql, ...params);
}

async function ingestPage(series: SeriesKey, page: number, dryRun: boolean) {
  const url = `${SERIES[series].url}?page=${page}`;
  const bytes = await fetchWithRetry(url);
  const html = bytes.toString('utf8');
  const rows = rowsFor(series, html);
  if (!rows.length) return { rows: 0, exhausted: true, reused: false };

  const digest = sha256(bytes);
  const fetchedAt = new Date();
  const observed = rows.map((r) => r.observedAt.getTime());
  if (dryRun) return { rows: rows.length, exhausted: false, reused: false };

  // Idempotency at the document level: identical bytes are the same document,
  // so a re-run does not store a second copy of the evidence.
  const existing = await prisma.sourceDocument.findUnique({
    where: { publisher_contentSha256: { publisher: 'PGCB', contentSha256: digest } },
    select: { id: true },
  });
  const doc =
    existing ??
    (await prisma.sourceDocument.create({
      data: {
        publisher: 'PGCB',
        filename: `${SERIES[series].label} page ${page}`,
        contentSha256: digest,
        sourceUrl: url,
        rawGzip: gzipSync(bytes),
        rawByteLength: bytes.length,
        windowStart: new Date(Math.min(...observed)),
        windowEnd: new Date(Math.max(...observed)),
        fetchedAt,
        parserVersion: PARSER_VERSION,
        ingestStatus: 'PARSED',
        validationStatus: 'UNVALIDATED',
      },
      select: { id: true },
    }));

  await upsertRows(series, rows, doc.id, fetchedAt);
  return { rows: rows.length, exhausted: false, reused: Boolean(existing) };
}

async function walk(series: SeriesKey, maxPages: number, dryRun: boolean) {
  let page = 1;
  let totalRows = 0;
  let pagesFetched = 0;
  let reusedDocs = 0;
  const failures: string[] = [];
  const label = SERIES[series].label;

  for (; page <= maxPages; page += 1) {
    try {
      const r = await ingestPage(series, page, dryRun);
      if (r.exhausted) {
        console.log(`  ${label}: page ${page} has no rows — archive exhausted`);
        break;
      }
      pagesFetched += 1;
      totalRows += r.rows;
      if (r.reused) reusedDocs += 1;
      if (page % 100 === 0 || page === 1) {
        console.log(`  ${label}: page ${page} … ${totalRows} rows so far`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failures.push(`page ${page}: ${msg}`);
      console.log(`  ! ${label}: page ${page} failed after retries — ${msg}`);
      // A single unreachable page must not abandon the rest of the archive.
      if (failures.length > 25) {
        console.log('  ! too many consecutive failures — stopping this series');
        break;
      }
    }
  }
  return { pagesFetched, totalRows, reusedDocs, failures };
}

/** The columns each series is actually capable of carrying. */
const SERIES_FIELDS: Record<SeriesKey, readonly string[]> = {
  GENERATION: [
    'totalMw', 'gasMw', 'liquidMw', 'coalMw', 'hydroMw', 'solarMw', 'windMw',
    'bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw', 'loadShedMw',
  ],
  DEMAND_SUPPLY: ['demandMw', 'supplyMw', 'loadShedMw'],
};

async function report() {
  for (const series of ['GENERATION', 'DEMAND_SUPPLY'] as SeriesKey[]) {
    const agg = await prisma.gridHourlyObservation.aggregate({
      where: { series },
      _count: { _all: true },
      _min: { observedAt: true },
      _max: { observedAt: true },
    });
    const n = agg._count._all;
    console.log(`\n${'='.repeat(64)}
${SERIES[series].label}
${'='.repeat(64)}`);
    if (!n) {
      console.log('  no observations stored');
      continue;
    }
    const min = agg._min.observedAt!;
    const max = agg._max.observedAt!;
    // Coverage is measured in CALENDAR DAYS, not hours. NLDC is not strictly
    // hourly: it posts an extra reading at :30 almost exactly once per day
    // (365 of them in every full year), which is the evening-peak stamp. An
    // hours-in-span denominator therefore undercounts the expected slots and
    // can report a negative gap — it did, at -3.5%, before this was corrected.
    // Both numbers come from ONE query so they share a date frame. Computing the
    // span in JavaScript from elapsed milliseconds and the coverage from
    // Postgres DATE() put them on different frames: with min at 19:00Z and max
    // at 17:00Z the final day is incomplete, floor() discarded it, and the
    // demand series reported 136 days covered "of 135 in span" — an absence of
    // -1 (-0.7%). That is the second time this metric printed a negative gap;
    // the first (-3.5%) came from an hours-in-span denominator against a source
    // that is not strictly hourly. A count and its denominator have to be
    // measured the same way or the difference between them means nothing.
    const days = await prisma.$queryRawUnsafe<Array<{ d: bigint; span: number; off: bigint }>>(
      `SELECT COUNT(DISTINCT DATE("observedAt"))::bigint AS d,
              (MAX(DATE("observedAt")) - MIN(DATE("observedAt")) + 1)::int AS span,
              COUNT(*) FILTER (WHERE EXTRACT(MINUTE FROM "observedAt") <> 0)::bigint AS off
       FROM "GridHourlyObservation" WHERE "series" = '${series}'`,
    );
    const daysCovered = Number(days[0]?.d ?? 0);
    const spanDays = Number(days[0]?.span ?? 0);
    const offHour = Number(days[0]?.off ?? 0);
    console.log(`  earliest observation     ${min.toISOString()}`);
    console.log(`  latest observation       ${max.toISOString()}`);
    console.log(`  unique observations      ${n.toLocaleString()}`);
    console.log(`  calendar days covered    ${daysCovered.toLocaleString()} of ${spanDays.toLocaleString()} in span`);
    console.log(`  days absent              ${(spanDays - daysCovered).toLocaleString()} (${(((spanDays - daysCovered) / spanDays) * 100).toFixed(1)}%)`);
    console.log(`  off-hour (:30) readings  ${offHour.toLocaleString()} — NLDC's evening-peak stamp, ~1/day`);

    // FIELD-LEVEL coverage: a row existing does not mean the source printed
    // every figure on it. This is the number that matters — a series can be
    // 100% present by row and still be missing a column entirely.
    const fields = SERIES_FIELDS[series];
    const cov = await prisma.$queryRawUnsafe<Array<Record<string, bigint>>>(
      `SELECT ${fields.map((c) => `COUNT("${c}") AS "${c}"`).join(', ')}
       FROM "GridHourlyObservation" WHERE "series" = '${series}'`,
    );
    console.log('\nfield                    non-null      of rows');
    for (const f of fields) {
      const v = Number(cov[0][f] ?? 0);
      const pct = ((v / n) * 100).toFixed(1).padStart(6);
      const bar = v === 0 ? '  (never printed)' : v === n ? '  complete' : '  PARTIAL';
      console.log(`    ${f.padEnd(22)} ${v.toLocaleString().padStart(9)}   ${pct}%${bar}`);
    }

    // Missing intervals, largest first — a run of absent hours is a different
    // fact from scattered single misses.
    const gaps = await prisma.$queryRawUnsafe<Array<{ gap_start: Date; gap_end: Date; hours: number }>>(
      `WITH ordered AS (
         SELECT "observedAt", LEAD("observedAt") OVER (ORDER BY "observedAt") AS nxt
         FROM "GridHourlyObservation" WHERE "series" = '${series}'
       )
       SELECT "observedAt" AS gap_start, nxt AS gap_end,
              (EXTRACT(EPOCH FROM (nxt - "observedAt")) / 3600)::int - 1 AS hours
       FROM ordered
       WHERE nxt IS NOT NULL AND nxt - "observedAt" > INTERVAL '1 hour'
       ORDER BY 3 DESC LIMIT 8`,
    );
    if (gaps.length) {
      console.log(`\nlargest missing intervals (${gaps.length} shown):`);
      for (const g of gaps) {
        console.log(`    ${g.gap_start.toISOString().slice(0, 16)} .. ${g.gap_end.toISOString().slice(0, 16)}  ${String(g.hours).padStart(6)} h`);
      }
    } else {
      console.log('\nno missing intervals — the series is contiguous');
    }
  }

  const docs = await prisma.sourceDocument.aggregate({
    where: { publisher: 'PGCB', sourceUrl: { not: null } },
    _count: { _all: true },
    _sum: { rawByteLength: true },
  });
  const gz = await prisma.$queryRawUnsafe<Array<{ gz: bigint | null }>>(
    `SELECT SUM(LENGTH("rawGzip"))::bigint AS gz FROM "SourceDocument" WHERE "rawGzip" IS NOT NULL`,
  );
  const gzBytes = Number(gz[0]?.gz ?? 0);
  const rawBytes = docs._sum.rawByteLength ?? 0;
  console.log(
    `
evidence: ${docs._count._all.toLocaleString()} source documents, ` +
      `${(rawBytes / 1_048_576).toFixed(1)} MB as served -> ` +
      `${(gzBytes / 1_048_576).toFixed(1)} MB stored gzipped ` +
      `(${rawBytes ? ((gzBytes / rawBytes) * 100).toFixed(0) : '?'}%)`,
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const has = (f: string) => argv.includes(f);
  const val = (f: string, d: number) => {
    const i = argv.indexOf(f);
    return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : d;
  };
  const which = argv.includes('--series') ? argv[argv.indexOf('--series') + 1] : 'both';
  const seriesList: SeriesKey[] =
    which === 'generation' ? ['GENERATION'] : which === 'demand' ? ['DEMAND_SUPPLY'] : ['GENERATION', 'DEMAND_SUPPLY'];

  if (has('--report')) {
    await report();
    return;
  }

  const dryRun = has('--dry-run');
  const maxPages = has('--recent') ? val('--recent', 3) : val('--max-pages', 3000);
  console.log(
    `${dryRun ? 'DRY RUN — ' : ''}walking ${seriesList.length} series, up to ${maxPages} page(s) each\n`,
  );

  for (const series of seriesList) {
    const t0 = Date.now();
    const r = await walk(series, maxPages, dryRun);
    console.log(
      `  ${SERIES[series].label}: ${r.pagesFetched} pages, ${r.totalRows} rows, ` +
        `${r.reusedDocs} documents already held, ${r.failures.length} failed, ` +
        `${((Date.now() - t0) / 1000).toFixed(0)}s\n`,
    );
    if (r.failures.length) for (const f of r.failures.slice(0, 10)) console.log(`      ${f}`);
  }

  if (implausibleDates > 0) {
    console.log(`
  note: ${implausibleDates} row(s) carried an impossible year and were excluded from the canonical table; the pages holding them are stored whole`);
  }
  if (duplicateHours > 0) {
    console.log(`
  note: ${duplicateHours} hour(s) appeared more than once within a single page and were collapsed to the last occurrence`);
  }
  if (!dryRun) await report();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
