import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isBearerAuthorized } from '@/lib/api/cron-auth';
import { RELEASE_CACHE_TAG } from '@/lib/data/releases.server';
import { revalidateDataRelease } from '@/lib/revalidate-tags';
import { parseIsoDate } from '@/lib/data/grid/date-utils';

/**
 * The Pi calls this right after it publishes, so a published day reaches readers in
 * seconds rather than on the pages' own timers.
 *
 * `publish-local.ts` on the Pi writes DataRelease rows straight over SQL, and nothing
 * on Vercel hears about it, so until now a new day waited for each page to expire by
 * itself: up to 15 minutes for the homepage and /grid-explorer, and a full day for
 * /grid-explorer/[date]. That last one is the expensive case. On 2026-10-20 the page
 * for 2026-10-19 was requested about a minute before the 12:35 poll published it, and
 * the 404 it rendered was cached under `revalidate = 86400`. Day pages stay at a day on
 * purpose (4,548 of them are crawled), so the fix is a push from the Pi, not a shorter
 * timer for everyone.
 *
 * Under /api/cron so the middleware matcher skips it, like the other machine-called
 * routes. It has its own secret (REVALIDATE_SECRET), separate from CRON_SECRET: the Pi
 * should hold only what it needs, which is the power to expire caches, not to run crons.
 */

export const dynamic = 'force-dynamic';

const MAX_DATES = 14;

export async function POST(request: Request) {
  if (!process.env.REVALIDATE_SECRET?.trim()) {
    return NextResponse.json({ ok: false, error: 'REVALIDATE_SECRET is not configured' }, { status: 503 });
  }
  if (!isBearerAuthorized(request, process.env.REVALIDATE_SECRET)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { dates?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const asked = Array.isArray(body.dates) ? body.dates : [];
  const dates = [...new Set(asked.map((d) => parseIsoDate(String(d))).filter((d): d is string => !!d))].slice(0, MAX_DATES);
  if (asked.length && !dates.length) {
    return NextResponse.json({ ok: false, error: 'No valid YYYY-MM-DD dates given' }, { status: 400 });
  }

  // The release reads are cached under this tag; expire it first so the pages below
  // regenerate from the rows just written rather than from the cached ones.
  revalidateDataRelease(RELEASE_CACHE_TAG, RELEASE_CACHE_TAG);

  const paths = ['/', '/grid-explorer', '/power-grid', '/grid-explorer/archive'];
  for (const d of dates) paths.push(`/grid-explorer/${d}`, `/grid-explorer/archive/${d.slice(0, 4)}`);
  const done: string[] = [];
  for (const p of [...new Set(paths)]) {
    try {
      revalidatePath(p);
      done.push(p);
    } catch {
      // A path missing from this build is not worth failing the call over.
    }
  }
  return NextResponse.json({ ok: true, revalidated: done });
}
