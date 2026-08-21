import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { DataFeed } from '@prisma/client';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { writeRelease } from '@/lib/data/release-write';
import { planLocalPublish, isReadable } from '@/lib/data/publish-local';
import { isIsoDate, isIsoMonth } from '@/lib/data/feed-paths';
import { RELEASE_CACHE_TAG, feedCacheTag } from '@/lib/data/releases.server';
import { revalidateDataRelease } from '@/lib/revalidate-tags';

/**
 * Publish what the local ingest already produced.
 *
 * The collect/upload route publishes a payload parsed in the browser. It cannot
 * publish a day produced the usual way — by running the extractor and its chain
 * on this machine — and it never published the fuel curve or the station detail
 * at all, so a day pushed through it arrived on the site with an empty Energy
 * Curve and Power Stations tab.
 *
 * This reads whatever the chain wrote for the day and publishes all of it, so
 * "run the ingest, hit publish" leaves the live site where a deploy would have.
 * Nothing is parsed or rebuilt here: the files on disk are the artefact, already
 * checked by the ingest and by `verify:data`.
 *
 * Local-only by nature — it reads this machine's public/data, which is exactly
 * the intended workflow: process locally, publish to the live database.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

type Step = {
  artifact: string;
  key: string;
  status: 'published' | 'unchanged' | 'absent' | 'failed';
  detail?: string;
};

/** Pages that render grid or gas figures and are cached independently of the tags. */
function revalidateGridPages(): void {
  for (const p of ['/grid-explorer', '/', '/power-grid']) {
    try {
      revalidatePath(p);
    } catch {
      // A path that does not exist in this build is not worth failing a publish over.
    }
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Said plainly rather than as a generic 503: reading the files the local
  // ingest produced is the point, so this belongs on the operator's machine.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Publishing reads the files your local ingest produced, so it runs from the admin panel on your own machine (npm run dev). What it publishes is what the live site then serves.',
      },
      { status: 503 },
    );
  }

  let body: { date?: string; month?: string; includeAggregates?: boolean; force?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected a JSON body' }, { status: 400 });
  }

  const date = body.date ? String(body.date) : null;
  const month = body.month ? String(body.month) : null;

  if (!date && !month) {
    return NextResponse.json(
      { ok: false, error: 'Give a date (YYYY-MM-DD), a month (YYYY-MM), or both.' },
      { status: 400 },
    );
  }
  if (date && !isIsoDate(date)) {
    return NextResponse.json({ ok: false, error: `Invalid date: ${date}` }, { status: 400 });
  }
  if (month && !isIsoMonth(month)) {
    return NextResponse.json({ ok: false, error: `Invalid month: ${month}` }, { status: 400 });
  }

  const steps: Step[] = [];
  const touchedFeeds = new Set<DataFeed>();

  try {
    const artifacts = await planLocalPublish({
      date,
      month,
      includeAggregates: body.includeAggregates,
    });

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
        sourceName: artifact.relPath,
        parserVersion: 'publish-local/1',
        publishedById: session.user.id,
        force: body.force,
      });

      if (!res.ok) {
        steps.push({ artifact: artifact.feed, key: artifact.key, status: 'failed', detail: res.error });
        continue;
      }
      if (res.skipped === 'unchanged') {
        steps.push({ artifact: artifact.feed, key: artifact.key, status: 'unchanged', detail: artifact.relPath });
        continue;
      }
      touchedFeeds.add(artifact.feed as DataFeed);
      steps.push({ artifact: artifact.feed, key: artifact.key, status: 'published', detail: artifact.relPath });
    }

    // Invalidate once per feed at the end rather than per artifact: publishing a
    // day touches up to eleven rows and each tag expiry makes every reader
    // re-query, so doing it inline would thrash the cache mid-publish.
    for (const feed of touchedFeeds) {
      revalidateDataRelease(feedCacheTag(feed), RELEASE_CACHE_TAG);
    }
    if (touchedFeeds.size) revalidateGridPages();

    const failed = steps.filter((s) => s.status === 'failed');

    return NextResponse.json({
      ok: failed.length === 0,
      date,
      month,
      steps,
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
