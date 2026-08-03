import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { scrapeSredaDailySnapshot } from '@/lib/data/sreda/ingest-sreda';
import { getLatestSredaDaily } from '@/lib/data/sreda/daily-loader.server';
import { publishRelease } from '@/lib/actions/data-releases';

/**
 * Refresh the SREDA renewables snapshot.
 *
 * SREDA is the third daily source behind the site — it supplies total renewable
 * capacity and RE share of grid to the homepage — but unlike PGCB and
 * Petrobangla it publishes no file to upload, only an HTML page. So this is a
 * button rather than a drop zone.
 *
 * Unlike the grid/gas ingest this needs no Python, so it works on the deployed
 * site as well as locally. The disk write is best-effort for the same reason:
 * on serverless the filesystem is read-only, and the release is what the site
 * actually serves.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(_request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'data.publish')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await scrapeSredaDailySnapshot();
    if (!snapshot) {
      return NextResponse.json(
        { ok: false, error: 'SREDA returned nothing usable — the site may be down or its layout changed.' },
        { status: 502 },
      );
    }

    const current = await getLatestSredaDaily();
    if (current && current.lastUpdate === snapshot.lastUpdate) {
      return NextResponse.json({
        ok: true,
        unchanged: true,
        date: snapshot.date,
        lastUpdate: snapshot.lastUpdate,
        message: `SREDA has not updated since ${snapshot.lastUpdate}; nothing to publish.`,
      });
    }

    // Keep the local backlog current where there is a writable disk, so the
    // static archive still grows for anyone reading files directly.
    try {
      const dir = path.join(process.cwd(), 'public', 'data', 'sreda', 'daily');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${snapshot.date}.json`), JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
    } catch {
      // Read-only filesystem on serverless — the release below is the source of truth.
    }

    const res = await publishRelease({
      feed: 'SREDA_DAILY',
      key: snapshot.date,
      payload: snapshot,
      sourceName: 'ndre.sreda.gov.bd',
      parserVersion: 'ingest-sreda/1',
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 500 });
    }

    for (const p of ['/', '/grid-explorer']) {
      try {
        revalidatePath(p);
      } catch {
        // A path missing from this build is not worth failing the refresh over.
      }
    }

    return NextResponse.json({
      ok: true,
      date: snapshot.date,
      lastUpdate: snapshot.lastUpdate,
      totalRenewableMw: snapshot.totalRenewableMw,
      reGridSharePct: snapshot.reGridSharePct,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: `SREDA refresh failed: ${message}` }, { status: 500 });
  }
}
