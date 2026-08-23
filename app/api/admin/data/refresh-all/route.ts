import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import type { DataFeed } from '@prisma/client';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { runPythonJson } from '@/lib/data/ingest-runner.server';
import { getIngestCoverage } from '@/lib/data/grid/ingest-coverage.server';
import { planLocalPublish, isReadable } from '@/lib/data/publish-local';
import { writeRelease } from '@/lib/data/release-write';
import { RELEASE_CACHE_TAG, feedCacheTag } from '@/lib/data/releases.server';
import { revalidateDataRelease } from '@/lib/revalidate-tags';
import { revalidatePath } from 'next/cache';
import { refreshSredaSnapshot } from '@/lib/data/sreda/refresh.server';

/**
 * One-stop refresh: find what the site is missing, fetch it from the
 * publishers, run the full chain, and put the result on the live site.
 *
 * The panel already had every piece as a separate button — run the chain for a
 * day, publish a day, refresh SREDA — which left the operator to answer "which
 * day?" and to remember the order. This route asks `getIngestCoverage` that
 * question instead: any recent day with no grid file, plus any recent day
 * whose gas columns are blank (Petrobangla files a window the morning after it
 * closes, so yesterday's gas routinely arrives a run later).
 *
 * For each pending day it runs `run_daily_ingest.py` — whose extractor uses a
 * held source copy when one exists and otherwise downloads from the
 * publishers' own channels (PGCB's ERP report portal, Petrobangla's report
 * listing) — then publishes what the chain wrote, then refreshes SREDA's HTML
 * snapshot. BPDB publishes no daily file this pipeline ingests; its figures
 * reach the site through PGCB's workbook, which reprints them.
 *
 * A day whose sources are not up yet is reported as "not published yet", not
 * as a failure: PGCB posts the workbook for energy day E on the morning of
 * E+1, and running this button earlier than that is normal, not wrong.
 *
 * Local-only: the chain shells out to Python and writes public/data.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 800;

/** Only chase gaps this many days back; older holes are deliberate backfill work. */
const DEFAULT_LOOKBACK_DAYS = 4;
/** Hard cap on chain runs per click, so one request stays bounded. */
const MAX_DAYS_PER_RUN = 5;

type IngestReport = {
  ok: boolean;
  date: string;
  steps: Array<{ step: string; ok: boolean; seconds: number; detail?: string }>;
  artifacts: { grid: boolean; curve: boolean; plants: boolean; gas: boolean };
  note?: string | null;
};

type DayOutcome = {
  date: string;
  reason: 'missing-day' | 'missing-gas';
  status: 'ingested' | 'source-pending' | 'partial' | 'failed';
  detail: string;
  steps?: IngestReport['steps'];
  publish?: { published: number; unchanged: number; failed: number };
};

const MS_DAY = 86_400_000;
const shift = (iso: string, days: number): string =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * MS_DAY).toISOString().slice(0, 10);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'The refresh runs Python against the publishers’ files, so it runs on your machine (npm run dev). The publish step it ends with is what updates the live site.',
      },
      { status: 503 },
    );
  }

  let body: { lookbackDays?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // An empty body is the normal case — the button sends no options.
  }
  const lookback = Math.min(Math.max(Number(body.lookbackDays) || DEFAULT_LOOKBACK_DAYS, 1), 30);

  const coverage = await getIngestCoverage();
  const oldestChased = shift(coverage.newestPublishable, -(lookback - 1));

  // Which days need work, and why. A day can appear in both lists only in
  // theory (no grid file implies no gas check), so missing-day wins.
  const pending = new Map<string, DayOutcome['reason']>();
  for (const d of coverage.gasMissing) if (d >= oldestChased) pending.set(d, 'missing-gas');
  for (const a of coverage.awaiting) if (a.date >= oldestChased) pending.set(a.date, 'missing-day');

  const days = [...pending.keys()].sort().slice(-MAX_DAYS_PER_RUN);
  const outcomes: DayOutcome[] = [];
  const touchedFeeds = new Set<DataFeed>();

  for (const [i, date] of days.entries()) {
    const reason = pending.get(date)!;
    const run = await runPythonJson<IngestReport>(
      [path.join(process.cwd(), 'scripts', 'run_daily_ingest.py'), '--date', date, '--json'],
      { timeout: 700_000, label: `Ingest ${date}` },
    );

    if (!run.ok) {
      outcomes.push({ date, reason, status: 'failed', detail: run.error });
      continue;
    }

    const report = run.data;
    const collectFailed = report.steps.find((s) => s.step === 'extractor' && !s.ok);
    if (collectFailed && !report.artifacts.grid) {
      // The publisher has not posted this day's workbook yet — the normal state
      // for the newest day early in the morning, and worth saying plainly.
      outcomes.push({
        date,
        reason,
        status: 'source-pending',
        detail: 'PGCB has not published this day’s workbook yet — try again later.',
        steps: report.steps,
      });
      continue;
    }
    if (reason === 'missing-gas' && report.ok && !report.artifacts.gas) {
      // The chain ran cleanly but the gas window still is not out: Petrobangla
      // files a window the morning after it closes, sometimes later. Saying
      // "complete" here would report the very gap the run set out to fill.
      outcomes.push({
        date,
        reason,
        status: 'source-pending',
        detail: 'Petrobangla has not published this gas window yet — try again later.',
        steps: report.steps,
      });
      continue;
    }

    // Publish what the chain wrote. Aggregates (gas index, live week, timeline,
    // reserve model) are singletons rebuilt by the newest gas day, so they are
    // published once, with the last day of the run.
    const isLast = i === days.length - 1;
    const publishCounts = { published: 0, unchanged: 0, failed: 0 };
    try {
      const artifacts = await planLocalPublish({ date, includeAggregates: isLast });
      for (const artifact of artifacts) {
        if (!isReadable(artifact)) continue; // absent for this day — not an error
        const res = await writeRelease({
          feed: artifact.feed as DataFeed,
          key: artifact.key,
          payload: artifact.payload,
          sourceName: artifact.relPath,
          parserVersion: 'refresh-all/1',
          publishedById: session.user.id,
        });
        if (!res.ok) publishCounts.failed += 1;
        else if (res.skipped === 'unchanged') publishCounts.unchanged += 1;
        else {
          publishCounts.published += 1;
          touchedFeeds.add(artifact.feed as DataFeed);
        }
      }
    } catch (error) {
      publishCounts.failed += 1;
      outcomes.push({
        date,
        reason,
        status: 'partial',
        detail: `Chain ran, publish failed: ${error instanceof Error ? error.message : String(error)}`,
        steps: report.steps,
        publish: publishCounts,
      });
      continue;
    }

    const failedSteps = report.steps.filter((s) => !s.ok);
    outcomes.push({
      date,
      reason,
      status: report.ok && publishCounts.failed === 0 ? 'ingested' : 'partial',
      detail:
        report.ok && publishCounts.failed === 0
          ? `Chain complete; ${publishCounts.published} artefact(s) published, ${publishCounts.unchanged} already current.`
          : `${failedSteps.map((s) => s.step).join(', ') || 'publish'} failed — see steps.`,
      steps: report.steps,
      publish: publishCounts,
    });
  }

  // SREDA is an HTML scrape with its own change detection — always worth asking.
  let sreda: Awaited<ReturnType<typeof refreshSredaSnapshot>>;
  try {
    sreda = await refreshSredaSnapshot();
  } catch (error) {
    sreda = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }

  for (const feed of touchedFeeds) {
    revalidateDataRelease(feedCacheTag(feed), RELEASE_CACHE_TAG);
  }
  if (touchedFeeds.size || (sreda.ok && !sreda.unchanged)) {
    for (const p of ['/grid-explorer', '/', '/power-grid']) {
      try {
        revalidatePath(p);
      } catch {
        // A path missing from this build is not worth failing the refresh over.
      }
    }
  }

  const hardFailures = outcomes.filter((o) => o.status === 'failed' || o.status === 'partial');
  return NextResponse.json({
    ok: hardFailures.length === 0 && sreda.ok,
    checkedThrough: coverage.newestPublishable,
    upToDate: days.length === 0,
    days: outcomes,
    skippedOlderGaps:
      coverage.awaiting.filter((a) => a.date < oldestChased).length +
      coverage.gasMissing.filter((d) => d < oldestChased).length,
    sreda,
  });
}
