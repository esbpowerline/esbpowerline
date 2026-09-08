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
// `@/lib/prisma` opens with `import 'server-only'`, which throws outside a
// React Server Component — so the usage documented above could not run at all
// under plain `npx tsx`, and this script has not executed since the 2026-09-05
// backfill. Every other script in this directory takes the same client from
// `prisma/client`; this one now does too, rather than depending on callers
// remembering `--conditions react-server` (which is how pi-weekly.sh gets
// around it for publish-local.ts).
import { createScriptPrismaClient } from '../prisma/client';
import {
  parseNldcGenerationHtml,
  parseNldcDemandSupplyHtml,
  parseNldcIndiaImportHtml,
  parseNldcNepalImportHtml,
  parsePgcbForecastHtml,
} from '@/lib/data/grid/live-grid-parse';

const prisma = createScriptPrismaClient();

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
const PARSER_VERSION = 'nldc-hourly@2026-09-07';

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
  // The two cross-border pages. Their actuals duplicate the generation table
  // (verified over 102 hours, 0 disagreements, 2026-09-07) and are stored
  // anyway as an independent check; what only they carry is NLDC's hourly
  // forecast per interconnector. See parseNldcIndiaImportHtml.
  INDIA_IMPORT: {
    url: 'https://erp.powergrid.gov.bd/w/generations/imported_power_india_bn',
    label: 'india imports',
  },
  NEPAL_IMPORT: {
    url: 'https://erp.powergrid.gov.bd/w/generations/imported_power_nepal_bn',
    label: 'nepal imports',
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
  if (series === 'INDIA_IMPORT') {
    // These pages carry no remark column — null, not '', so the row does not
    // claim NLDC printed an empty remark where it printed no cell at all.
    return parseNldcIndiaImportHtml(html).map((r) => ({
      observedAt: toInstant(r.at),
      remark: null,
      values: {
        bheramaraMw: r.bheramaraMw,
        bheramaraForecastMw: r.bheramaraForecastMw,
        tripuraMw: r.tripuraMw,
        tripuraForecastMw: r.tripuraForecastMw,
        adaniMw: r.adaniMw,
        adaniForecastMw: r.adaniForecastMw,
      },
    }));
  }
  if (series === 'NEPAL_IMPORT') {
    return parseNldcNepalImportHtml(html).map((r) => ({
      observedAt: toInstant(r.at),
      remark: null,
      values: { nepalMw: r.nepalMw, nepalForecastMw: r.nepalForecastMw },
    }));
  }
  return parseNldcDemandSupplyHtml(html).map((r) => ({
    observedAt: toInstant(r.at),
    remark: r.remark || null,
    values: { demandMw: r.demandMw, supplyMw: r.supplyMw, loadShedMw: r.loadShedMw },
  }));
}

/**
 * NLDC's own remark, mapped to a kind. Generation labels peaks in Bangla and
 * demand/supply in English; both are here. A remark that is present but not
 * recognised becomes UNCLASSIFIED rather than folding into REGULAR — a new
 * vocabulary at the source has to surface, not vanish into every average.
 */
function classify(remark: string | null): string {
  const t = (remark ?? '').trim();
  if (t === '' || t === '—' || t === '-' || /^n\/?a$/i.test(t)) return 'REGULAR';
  if (t === 'ডে পিক' || t === 'Day Peak') return 'DAY_PEAK';
  if (t === 'সন্ধ্যা পিক' || t === 'Evening Peak') return 'EVENING_PEAK';
  return 'UNCLASSIFIED';
}

const GEN_COMPONENTS = [
  'gasMw', 'liquidMw', 'coalMw', 'hydroMw', 'solarMw', 'windMw',
  'bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw',
] as const;

/**
 * Why this row may not be aggregated, or null when it may. The source value is
 * never touched — this records only how ESB reads what was published.
 *
 * Order matters. A row printing every component as zero beside a real total
 * would also trip the disagreement rule, and would then be blamed on the wrong
 * side: there it is the breakdown that is unusable, not the total.
 */
function exclusionFor(series: SeriesKey, values: Record<string, number | null>, total: number | null) {
  if (series !== 'GENERATION' || total === null) return null;
  const present = GEN_COMPONENTS.filter((c) => values[c] !== null && values[c] !== undefined);
  if (!present.length) return null;
  const sum = present.reduce((a, c) => a + (values[c] as number), 0);
  if (total > 0 && sum === 0) return 'BREAKDOWN_ALL_ZERO';
  // 20%: 94.4% of rows agree within 0.5%, so this is far outside anything
  // rounding explains and still forgiving of a genuinely odd hour.
  if (sum > 0 && Math.abs(total - sum) > 0.2 * Math.max(total, 1)) {
    return 'TOTAL_DISAGREES_WITH_COMPONENTS';
  }
  return null;
}

const FIGURE_COLUMNS = [
  'totalMw', 'gasMw', 'liquidMw', 'coalMw', 'hydroMw', 'solarMw', 'windMw',
  'bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw',
  'bheramaraForecastMw', 'tripuraForecastMw', 'adaniForecastMw', 'nepalForecastMw',
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
  const cols = ['series', 'observedAt', 'fetchedAt', 'sourceDocumentId', 'remark', 'parserVersion',
                'kind', 'excluded', ...FIGURE_COLUMNS];
  const params: unknown[] = [];
  const tuples = rows.map((r) => {
    const vals = [
      series, r.observedAt, fetchedAt, docId, r.remark, PARSER_VERSION,
      classify(r.remark), exclusionFor(series, r.values, r.values.totalMw ?? null),
      ...FIGURE_COLUMNS.map((c) => (c in r.values ? r.values[c] : null)),
    ];
    const start = params.length;
    params.push(...vals);
    // gen_random_uuid()::text for the id — the table's PK is a plain TEXT
    // column that Prisma normally fills with a cuid.
    return `(gen_random_uuid()::text, ${vals.map((_, i) => {
      const n = start + i + 1;
      if (i === 6) return `$${n}::"ObservationKind"`;
      if (i === 7) return `$${n}::"AggregationExclusion"`;
      return `$${n}`;
    }).join(', ')})`;
  });
  const updates = ['fetchedAt', 'sourceDocumentId', 'remark', 'parserVersion', 'kind', 'excluded']
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

/**
 * Walk a series' pages, newest first.
 *
 * `stopWhenUnchanged` is the poll's economy. NLDC's page 1 changes once an hour,
 * when a new row is printed; a poll that runs on the hour therefore finds it
 * unchanged most of the time, and identical bytes mean the same
 * `SourceDocument` — nothing to store and nothing new to upsert. Walking on to
 * pages 2 and 3 in that state costs two more fetches to re-derive rows already
 * held. So in poll mode an unchanged page 1 ends the walk immediately: the
 * common tick becomes one request per series and zero writes.
 *
 * It applies only to the FIRST page, and only in poll mode. Deeper pages are
 * routinely unchanged during a backfill — stopping there would abandon the rest
 * of the archive, which is the opposite of what a backfill is for.
 */
async function walk(series: SeriesKey, maxPages: number, dryRun: boolean, stopWhenUnchanged = false) {
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
      if (stopWhenUnchanged && page === 1 && r.reused) {
        console.log(`  ${label}: page 1 unchanged since the last poll — nothing new to store`);
        break;
      }
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

/**
 * PGCB's forecast board, captured beside the hourly series.
 *
 * Not a series: one page, one row, one day. It is here rather than in a runner
 * of its own because it is the same publisher on the same host, and the daily
 * polls are four fixed slots — a board posted between them would be read late,
 * and a board REPLACED between them would be read never. The page is 4 KB and
 * identical bytes are the same SourceDocument, so capturing it every hour costs
 * one request and, after the first tick of the day that sees it, zero writes.
 *
 * The stakes are the same as the demand series and are worth stating plainly:
 * the board is overwritten each morning and nothing else in Bangladesh keeps
 * it, so a forecast not captured on its own day cannot be recovered on any
 * later one. Two homepage tiles read it live.
 *
 * The line it prints deliberately matches the series format — `N pages, N rows,
 * N documents already held, N failed` — because pi-hourly.sh sums the `failed`
 * field across every line to decide whether a tick that exited 0 actually did
 * anything. A capture that reported in its own shape would fail silently, which
 * is precisely the bug that runner was written to close.
 */
const FORECAST_URL = 'https://erp.powergrid.gov.bd/w/forecasts/show_forecasts_bn';

async function captureForecastBoard(dryRun: boolean) {
  const t0 = Date.now();
  const done = (pages: number, rows: number, reused: number, failed: number) => {
    console.log(
      `  forecast board: ${pages} pages, ${rows} rows, ${reused} documents already held, ` +
        `${failed} failed, ${((Date.now() - t0) / 1000).toFixed(0)}s\n`,
    );
  };

  let bytes: Buffer;
  try {
    bytes = await fetchWithRetry(FORECAST_URL);
  } catch (e) {
    console.log(`  ! forecast board: ${e instanceof Error ? e.message : String(e)}`);
    done(0, 0, 0, 1);
    return;
  }

  const board = parsePgcbForecastHtml(bytes.toString('utf8'));
  if (!board) {
    // A page that fetched and yielded nothing IS the finding. The live layer
    // learned this the hard way when NLDC made a time cell responsive and a
    // silent parse failure published a fallback instead.
    console.log('  ! forecast board: fetched but no board parsed — the page may have changed shape');
    done(1, 0, 0, 1);
    return;
  }

  if (dryRun) {
    console.log(
      `  forecast board: ${board.date} forecast ${board.forecastDemand.dayPeakMw}/` +
        `${board.forecastDemand.eveningPeakMw}, ${board.previousDate} actual ` +
        `${board.previousGeneration.dayPeakMw}/${board.previousGeneration.eveningPeakMw}`,
    );
    done(1, 1, 0, 0);
    return;
  }

  const digest = sha256(bytes);
  const fetchedAt = new Date();
  const boardDate = new Date(`${board.date}T00:00:00${DHAKA_OFFSET}`);
  const previousDate = new Date(`${board.previousDate}T00:00:00${DHAKA_OFFSET}`);
  if (!plausible(boardDate)) {
    console.log(`  ! forecast board: implausible date ${board.date} — not stored`);
    done(1, 0, 0, 1);
    return;
  }

  try {
    const existing = await prisma.sourceDocument.findUnique({
      where: { publisher_contentSha256: { publisher: 'PGCB', contentSha256: digest } },
      select: { id: true },
    });
    const doc =
      existing ??
      (await prisma.sourceDocument.create({
        data: {
          publisher: 'PGCB',
          filename: `forecast board ${board.date}`,
          contentSha256: digest,
          sourceUrl: FORECAST_URL,
          rawGzip: gzipSync(bytes),
          rawByteLength: bytes.length,
          windowStart: previousDate,
          windowEnd: boardDate,
          fetchedAt,
          parserVersion: PARSER_VERSION,
          ingestStatus: 'PARSED',
          validationStatus: 'UNVALIDATED',
        },
        select: { id: true },
      }));

    const figures = {
      previousDate,
      fetchedAt,
      sourceDocumentId: doc.id,
      forecastDayPeakMw: board.forecastDemand.dayPeakMw,
      forecastEveningPeakMw: board.forecastDemand.eveningPeakMw,
      previousDayPeakMw: board.previousGeneration.dayPeakMw,
      previousEveningPeakMw: board.previousGeneration.eveningPeakMw,
      parserVersion: PARSER_VERSION,
    };
    await prisma.gridForecastBoard.upsert({
      where: { boardDate },
      create: { boardDate, ...figures },
      update: figures,
    });

    await crossCheckPreviousPeak(board);
    done(1, 1, existing ? 1 : 0, 0);
  } catch (e) {
    console.log(`  ! forecast board: ${e instanceof Error ? e.message : String(e)}`);
    done(1, 0, 0, 1);
  }
}

/**
 * The board's "yesterday actual" against our own capture of that day.
 *
 * PGCB states the previous day's peak generation independently of the hourly
 * table we scrape, so the two are a genuine cross-check on a figure the site
 * prints — the kind that has caught every real defect in this archive, because
 * it compares a number against something else that should agree with it rather
 * than trusting the parser that produced it. On 2026-09-08 they agreed exactly
 * (15,473 MW evening peak).
 *
 * REPORTED, NEVER REPAIRED. A disagreement is the source disagreeing with our
 * reading of the source, and the answer is a line in the log for a human, not a
 * correction written into either side.
 */
async function crossCheckPreviousPeak(board: ReturnType<typeof parsePgcbForecastHtml>) {
  if (!board) return;
  /* The board states two peaks for the previous day and our aggregate produces
     one number — the day's maximum — so the comparable quantity is the greater
     of the pair, not the evening figure alone. In Bangladesh the evening peak
     is almost always the day's maximum (on 2026-09-07: 14,230 day against
     15,473 evening), but "almost always" is not an identity, and matching the
     wrong one would manufacture a disagreement out of a definition. */
  const peaks = [
    board.previousGeneration.dayPeakMw,
    board.previousGeneration.eveningPeakMw,
  ].filter((v): v is number => v !== null);
  if (!peaks.length) return;
  const stated = Math.max(...peaks);

  const start = new Date(`${board.previousDate}T00:00:00${DHAKA_OFFSET}`);
  const end = new Date(start.getTime() + 86_400_000);
  const ours = await prisma.gridHourlyObservation.aggregate({
    where: { series: 'GENERATION', observedAt: { gte: start, lt: end }, excluded: null },
    _max: { totalMw: true },
  });
  const mine = ours._max.totalMw ? Number(ours._max.totalMw) : null;
  if (mine === null) return;

  const diff = mine - stated;
  if (Math.abs(diff) < 1) return;
  console.log(
    `  note: PGCB states ${board.previousDate} peak generation as ${stated} MW; ` +
      `our hourly capture maxes at ${mine} MW (${diff > 0 ? '+' : ''}${diff.toFixed(0)}). ` +
      'Reported, not reconciled.',
  );
}

/** The columns each series is actually capable of carrying. */
const SERIES_FIELDS: Record<SeriesKey, readonly string[]> = {
  GENERATION: [
    'totalMw', 'gasMw', 'liquidMw', 'coalMw', 'hydroMw', 'solarMw', 'windMw',
    'bheramaraMw', 'tripuraMw', 'adaniMw', 'nepalMw', 'loadShedMw',
  ],
  DEMAND_SUPPLY: ['demandMw', 'supplyMw', 'loadShedMw'],
  INDIA_IMPORT: [
    'bheramaraMw', 'bheramaraForecastMw', 'tripuraMw', 'tripuraForecastMw',
    'adaniMw', 'adaniForecastMw',
  ],
  NEPAL_IMPORT: ['nepalMw', 'nepalForecastMw'],
};

async function report() {
  for (const series of Object.keys(SERIES) as SeriesKey[]) {
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
  // `both` is kept as a spelling of "all of them" so the documented invocation
  // and anything already in the Pi's crontab keep working now that there are
  // four series rather than two.
  const ALIASES: Record<string, SeriesKey[]> = {
    generation: ['GENERATION'],
    demand: ['DEMAND_SUPPLY'],
    india: ['INDIA_IMPORT'],
    nepal: ['NEPAL_IMPORT'],
    imports: ['INDIA_IMPORT', 'NEPAL_IMPORT'],
  };
  const which = argv.includes('--series') ? argv[argv.indexOf('--series') + 1] : 'all';
  // `board` is not a series: one page, one row, one day. It is named here
  // rather than in ALIASES and selects nothing from the hourly walk.
  const boardOnly = which === 'board';
  const seriesList: SeriesKey[] = boardOnly ? [] : ALIASES[which] ?? (Object.keys(SERIES) as SeriesKey[]);
  if (argv.includes('--series') && !boardOnly && !ALIASES[which] && which !== 'all' && which !== 'both') {
    console.error(
      `unknown --series ${which}; expected one of ${Object.keys(ALIASES).join(', ')}, board, all`,
    );
    process.exit(2);
  }
  // Every invocation that walks the hourly pages also takes the board, so the
  // Pi's crontab line is untouched by its arrival, exactly as it was when the
  // two import pages were added.
  const wantsBoard = boardOnly || !argv.includes('--series') || which === 'all' || which === 'both';

  if (has('--report')) {
    await report();
    return;
  }

  const dryRun = has('--dry-run');
  const maxPages = has('--recent') ? val('--recent', 3) : val('--max-pages', 3000);
  console.log(
    `${dryRun ? 'DRY RUN — ' : ''}walking ${seriesList.length} series, up to ${maxPages} page(s) each` +
      `${wantsBoard ? ' + the forecast board' : ''}\n`,
  );

  const polling = has('--recent');
  for (const series of seriesList) {
    const t0 = Date.now();
    const r = await walk(series, maxPages, dryRun, polling);
    console.log(
      `  ${SERIES[series].label}: ${r.pagesFetched} pages, ${r.totalRows} rows, ` +
        `${r.reusedDocs} documents already held, ${r.failures.length} failed, ` +
        `${((Date.now() - t0) / 1000).toFixed(0)}s\n`,
    );
    if (r.failures.length) for (const f of r.failures.slice(0, 10)) console.log(`      ${f}`);
  }

  if (wantsBoard) await captureForecastBoard(dryRun);

  if (implausibleDates > 0) {
    console.log(`
  note: ${implausibleDates} row(s) carried an impossible year and were excluded from the canonical table; the pages holding them are stored whole`);
  }
  if (duplicateHours > 0) {
    console.log(`
  note: ${duplicateHours} hour(s) appeared more than once within a single page and were collapsed to the last occurrence`);
  }
  // The report runs five aggregate scans per series. That is worth it after a
  // backfill and pure waste on an hourly poll, where the runner only needs the
  // exit status, so the poll skips it.
  if (!dryRun && !polling) await report();

  /*
    One line the runner can act on, on the connection that is already open.

    This archive lives on a Supabase instance whose free tier stops at 500 MB,
    and the evidence layer is what grows: measured 2026-09-06 the database is
    142 MB, of which SourceDocument is 30 MB and GridHourlyObservation 72 MB.
    An hourly poll adds roughly one changed page per series per hour — about
    130 MB a year, almost all of it evidence — so the ceiling is somewhere
    around two and a half years away, not never. Printing the size every poll
    means the crossover announces itself in a log and an alert rather than
    being discovered when a write starts failing.
  */
  if (!dryRun) {
    const [{ mb }] = await prisma.$queryRawUnsafe<Array<{ mb: number }>>(
      `SELECT round(pg_database_size(current_database()) / 1048576.0, 1)::float8 AS mb`,
    );
    console.log(`db_size_mb=${mb}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
