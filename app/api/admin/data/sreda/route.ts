import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { refreshSredaSnapshot } from '@/lib/data/sreda/refresh.server';

/**
 * Refresh the SREDA renewables snapshot.
 *
 * SREDA is the third daily source behind the site — it supplies total renewable
 * capacity and RE share of grid to the homepage — but unlike PGCB and
 * Petrobangla it publishes no file to upload, only an HTML page. So this is a
 * button rather than a drop zone.
 *
 * Unlike the grid/gas ingest this needs no Python, so it works on the deployed
 * site as well as locally. The scrape-and-publish itself lives in
 * `lib/data/sreda/refresh.server.ts`, shared with the one-stop refresh run.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(_request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await refreshSredaSnapshot();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    if (!result.unchanged) {
      for (const p of ['/', '/grid-explorer']) {
        try {
          revalidatePath(p);
        } catch {
          // A path missing from this build is not worth failing the refresh over.
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: `SREDA refresh failed: ${message}` }, { status: 500 });
  }
}
