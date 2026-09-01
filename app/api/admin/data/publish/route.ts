import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { DataFeed } from '@prisma/client';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { isIsoDate } from '@/lib/data/feed-paths';
import { runPythonJson } from '@/lib/data/ingest-runner.server';
import { planLocalPublish, isReadable } from '@/lib/data/publish-local';
import { writeRelease } from '@/lib/data/release-write';
import {
  verifyDayBeforePublish,
  describeBlockingFindings,
} from '@/lib/data/verify-gate.server';
import { RELEASE_CACHE_TAG, feedCacheTag } from '@/lib/data/releases.server';
import { revalidateDataRelease } from '@/lib/revalidate-tags';

/**
 * Publish the day the operator just reviewed: the parsed files, plus everything
 * else the day already has on disk, plus the aggregates they feed.
 *
 * Order matters. The reviewed payload is written to public/data first because
 * the aggregate builder reads that directory — and leaving it there also keeps
 * the local archive current for the next ingest, and lets a future commit fold
 * the day into the static archive so it stops costing a database read.
 *
 * What is then published is decided by `planLocalPublish`, the same reader the
 * publish-local route uses, rather than by a second hand-maintained list here.
 * The list this replaces covered GRID_DAILY and GAS_DAILY only: it wrote the
 * fuel curve to disk and never released it, and never mentioned the station
 * detail at all. Since both are fetched through the runtime manifest, a day
 * published from this screen arrived on the live site with an empty Energy
 * Curve and an empty Power Stations tab until the next deployment — the exact
 * failure the publish-local card was added to work around.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/** Pages that render grid or gas figures and are cached independently of the data tags. */
function revalidateGridPages(): void {
  for (const p of ['/grid-explorer', '/', '/power-grid']) {
    try {
      revalidatePath(p);
    } catch {
      // A path that does not exist in this build is not worth failing a publish over.
    }
  }
}

type Step = {
  artifact: string;
  key: string;
  status: 'published' | 'unchanged' | 'absent' | 'failed';
  detail?: string;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (isServerless()) {
    return NextResponse.json(
      { ok: false, error: 'Publishing rebuilds aggregates with Python and must run on your machine.' },
      { status: 503 },
    );
  }

  const steps: Step[] = [];

  try {
    const body = (await request.json()) as {
      date?: string;
      grid?: unknown;
      gasArchive?: unknown;
      sourceGrid?: string;
      sourceGas?: string;
    };

    const date = String(body.date ?? '');
    if (!isIsoDate(date)) {
      return NextResponse.json({ ok: false, error: `Invalid date: ${date}` }, { status: 400 });
    }
    // A Petrobangla-only upload reviews and publishes the gas archive with no
    // grid payload at all — the bridge returns grid:null when no grid day is
    // held for the window. One of the two must exist for there to be anything
    // to publish.
    if (!body.grid && !body.gasArchive) {
      return NextResponse.json(
        { ok: false, error: 'Missing grid payload and gas archive — nothing to publish' },
        { status: 400 },
      );
    }

    const root = process.cwd();

    // 1 — reviewed payload to disk.
    //
    // The half-hourly fuel curve is split out first. It is ~5.7KB a day and the
    // daily directory is traced wholesale into every function that imports the
    // server loader, so leaving it inline puts it in bundles that never read it
    // — the same reason the station detail lives outside. It is fetched over
    // HTTP by the chart instead. See scripts/split_energy_curve.py.
    if (body.grid) {
      const { energyCurveData, ...gridPayload } = body.grid as Record<string, unknown>;
      if (energyCurveData) {
        const curveDir = path.join(root, 'public', 'data', 'curves');
        await mkdir(curveDir, { recursive: true });
        await writeFile(
          path.join(curveDir, `${date}.json`),
          JSON.stringify({ date, ...(energyCurveData as object) }),
          'utf8',
        );
      }

      const dailyDir = path.join(root, 'public', 'data', 'daily');
      await mkdir(dailyDir, { recursive: true });

      // `ingest_bridge.py` parses the workbook; it does not enrich. Three fields
      // are added afterwards by `scripts/daily_enrich.py` and by nothing in the
      // ingest chain, so re-publishing a day that has already been enriched would
      // overwrite it with a payload that simply lacks them — and the schema marks
      // all three optional, so it would validate, publish, and report success.
      //
      // The visible loss is `forecast`: the whole next-day block, 24 hourly rows,
      // is what Forecast vs Actual reads. Carry across whatever the day already
      // holds and the parse did not produce, and say so in the report.
      const ENRICHMENT_KEYS = ['sourceFiles', 'observationWindows', 'forecast'] as const;
      const dayFile = path.join(dailyDir, `${date}.json`);
      const preserved: string[] = [];
      try {
        const existing = JSON.parse(await readFile(dayFile, 'utf8')) as Record<string, unknown>;
        for (const key of ENRICHMENT_KEYS) {
          if (gridPayload[key] === undefined && existing[key] !== undefined) {
            gridPayload[key] = existing[key];
            preserved.push(key);
          }
        }
      } catch {
        // No day on disk yet — nothing to preserve, which is the normal case for
        // a genuinely new day.
      }
      if (preserved.length) {
        steps.push({
          artifact: 'enrichment preserved',
          key: date,
          status: 'unchanged',
          detail: `${preserved.join(', ')} kept from the day already on disk — the parser does not produce these`,
        });
      }

      await writeFile(dayFile, JSON.stringify(gridPayload, null, 2), 'utf8');
    }

    const hasGas = Boolean(body.gasArchive);
    if (hasGas) {
      // mkdir was missing here: on a checkout whose gas archive had never been
      // written, the whole publish failed at this line after the grid day had
      // already gone live.
      const gasDir = path.join(root, 'public', 'data', 'petrobangla', 'daily');
      await mkdir(gasDir, { recursive: true });
      await writeFile(
        path.join(gasDir, `${date}.json`),
        JSON.stringify(body.gasArchive, null, 2),
        'utf8',
      );
    }

    // 2 — rebuild the aggregates, which are derived purely from the gas archive
    // directory. Without a gas day there is nothing new to derive.
    if (hasGas) {
      const run = await runPythonJson<{ ok: boolean; error?: string; indexDays?: number }>(
        [path.join(root, 'scripts', 'build_aggregates.py'), '--date', date],
        { timeout: 540_000, label: 'Aggregate build' },
      );
      if (!run.ok) {
        return NextResponse.json({ ok: false, error: run.error, steps }, { status: run.status });
      }
      if (!run.data.ok) {
        return NextResponse.json({ ok: false, error: run.data.error, steps }, { status: 500 });
      }
      steps.push({
        artifact: 'aggregates rebuilt',
        key: date,
        status: 'published',
        detail: `${run.data.indexDays ?? '?'} index days`,
      });
    }

    // 3 — the review gate, enforced.
    //
    // `DataDraft.validation` is documented as the reconciliation output "the
    // reviewer must see before approving", and this route read the permission
    // and never read the validation — so no server-side condition existed under
    // which a publish could be refused for failing its own checks. It runs now,
    // against the files just written, and an ERROR stops the publish before a
    // single release row is upserted.
    //
    // Only ERROR blocks. A WARN means the source disagrees with itself, which
    // is a true fact about the document and must reach the site rather than be
    // withheld; INFO is an ordinary incomplete day.
    const verdict = await verifyDayBeforePublish(date);
    if (!verdict.ok) {
      if (!verdict.report) {
        // The gate could not run. Fail closed: an unverifiable publish is the
        // state this finding exists to prevent.
        steps.push({ artifact: 'verify:data', key: date, status: 'failed', detail: verdict.error });
        return NextResponse.json({ ok: false, error: verdict.error, steps }, { status: 500 });
      }
      const detail = describeBlockingFindings(verdict.blocking);
      steps.push({ artifact: 'verify:data', key: date, status: 'failed', detail });
      return NextResponse.json(
        {
          ok: false,
          date,
          error:
            `Publish refused — ${verdict.blocking.length} ERROR finding(s) from verify:data. ` +
            'An ERROR means the archive asserts something no source stated. Fix the day and re-publish.',
          findings: verdict.blocking,
          steps,
        },
        { status: 422 },
      );
    }
    steps.push({
      artifact: 'verify:data',
      key: date,
      status: 'published',
      detail: `0 ERROR, ${verdict.report.counts.WARN} WARN, ${verdict.report.counts.INFO} INFO`,
    });

    // 4 — publish every artefact the day has, not just the two that were parsed
    // in the browser. Absent ones are reported, not failed: a day whose gas
    // window Petrobangla has not filed yet simply has no gas file.
    const artifacts = await planLocalPublish({ date, includeAggregates: hasGas });
    const touchedFeeds = new Set<DataFeed>();

    for (const artifact of artifacts) {
      if (!isReadable(artifact)) {
        steps.push({
          artifact: artifact.feed,
          key: artifact.key,
          status: 'absent' in artifact ? 'absent' : 'failed',
          detail: 'error' in artifact ? artifact.error : artifact.relPath,
        });
        continue;
      }

      const res = await writeRelease({
        feed: artifact.feed as DataFeed,
        key: artifact.key,
        payload: artifact.payload,
        sourceName:
          artifact.feed === 'GRID_DAILY'
            ? body.sourceGrid ?? artifact.relPath
            : artifact.feed === 'GAS_DAILY'
              ? body.sourceGas ?? artifact.relPath
              : artifact.relPath,
        parserVersion: 'ingest_bridge/1',
        publishedById: session.user.id,
      });

      if (!res.ok) {
        steps.push({ artifact: artifact.feed, key: artifact.key, status: 'failed', detail: res.error });
        // The grid day is the one artefact worth stopping for: if it did not
        // land there is nothing for the rest of the day to attach to.
        if (artifact.feed === 'GRID_DAILY') {
          return NextResponse.json({ ok: false, error: res.error, steps }, { status: 500 });
        }
        continue;
      }

      if (res.skipped === 'unchanged') {
        steps.push({ artifact: artifact.feed, key: artifact.key, status: 'unchanged', detail: artifact.relPath });
        continue;
      }
      touchedFeeds.add(artifact.feed as DataFeed);
      steps.push({ artifact: artifact.feed, key: artifact.key, status: 'published', detail: artifact.relPath });
    }

    // Invalidate once per feed rather than per artifact: a day touches up to
    // eleven rows and each tag expiry makes every reader re-query.
    for (const feed of touchedFeeds) {
      revalidateDataRelease(feedCacheTag(feed), RELEASE_CACHE_TAG);
    }
    // Expiring the release tags refreshes the data, but the pages that render it
    // are ISR-cached (grid-explorer holds for 300s). Without this a publish would
    // not be visible for minutes — the opposite of "updates like an article".
    if (touchedFeeds.size) revalidateGridPages();

    const failed = steps.filter((s) => s.status === 'failed');

    return NextResponse.json({
      ok: failed.length === 0,
      date,
      steps,
      note: !body.grid
        ? 'Gas archive published alone. The grid day was not uploaded; its summary gains these figures when its workbook is ingested.'
        : hasGas
          ? undefined
          : 'Grid day published. No gas PDF supplied, so the gas archive and aggregates were not touched.',
      summary: {
        published: steps.filter((s) => s.status === 'published').length,
        unchanged: steps.filter((s) => s.status === 'unchanged').length,
        absent: steps.filter((s) => s.status === 'absent').length,
        failed: failed.length,
      },
      error: failed.length ? failed.map((f) => `${f.artifact}: ${f.detail}`).join('; ') : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: `Publish failed: ${message}`, steps }, { status: 500 });
  }
}
