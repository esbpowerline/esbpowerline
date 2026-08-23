import 'server-only';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { scrapeSredaDailySnapshot } from '@/lib/data/sreda/ingest-sreda';
import { getLatestSredaDaily } from '@/lib/data/sreda/daily-loader.server';
import { publishRelease } from '@/lib/actions/data-releases';

/**
 * Scrape SREDA's live snapshot and publish it if it changed.
 *
 * Shared by the standalone "Refresh from SREDA" button and the one-stop
 * "Refresh data" run, so the two cannot drift. Callers must already have
 * checked `data.publish` — `publishRelease` re-checks the session anyway.
 */

export type SredaRefreshResult =
  | { ok: true; unchanged: boolean; date: string; lastUpdate: string | null; totalRenewableMw?: number | null; reGridSharePct?: number | null; message?: string }
  | { ok: false; error: string; status: number };

export async function refreshSredaSnapshot(): Promise<SredaRefreshResult> {
  const snapshot = await scrapeSredaDailySnapshot();
  if (!snapshot) {
    return {
      ok: false,
      error: 'SREDA returned nothing usable — the site may be down or its layout changed.',
      status: 502,
    };
  }

  const current = await getLatestSredaDaily();
  if (current && current.lastUpdate === snapshot.lastUpdate) {
    return {
      ok: true,
      unchanged: true,
      date: snapshot.date,
      lastUpdate: snapshot.lastUpdate,
      message: `SREDA has not updated since ${snapshot.lastUpdate}; nothing to publish.`,
    };
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
    return { ok: false, error: res.error ?? 'Publishing the SREDA snapshot failed.', status: 500 };
  }

  return {
    ok: true,
    unchanged: false,
    date: snapshot.date,
    lastUpdate: snapshot.lastUpdate,
    totalRenewableMw: snapshot.totalRenewableMw,
    reGridSharePct: snapshot.reGridSharePct,
  };
}
