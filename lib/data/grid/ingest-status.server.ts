import 'server-only';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { getPublishedKeys } from '@/lib/data/releases.server';
import { getRuntimeLatestDate } from '@/lib/data/grid/available-dates.server';

/**
 * What the ingest screen needs to tell an operator: what the site currently has,
 * which day is missing next, and the exact filename that produces it.
 *
 * Working this out by hand is where the mistakes live — PGCB names files a day
 * ahead of the energy day they describe, and the gas report lags the grid by a
 * further day, so "today's downloads" rarely means "today's data".
 */

const ISO_FILE_RE = /^(\d{4}-\d{2}-\d{2})\.json$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

async function latestFileDate(dir: string): Promise<string | null> {
  try {
    const names = await readdir(path.join(process.cwd(), 'public', 'data', ...dir.split('/')));
    const dates = names
      .map((n) => ISO_FILE_RE.exec(n)?.[1])
      .filter((d): d is string => Boolean(d))
      .sort();
    return dates.length ? dates[dates.length - 1] : null;
  } catch {
    return null;
  }
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** DD-MM-YYYY, the shape PGCB uses in its filenames. */
function ddmmyyyy(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

export type IngestStatus = {
  latestGridDay: string | null;
  latestGasDay: string | null;
  runtimePublished: string[];
  nextGridDay: string | null;
  /** PGCB names its workbook for the day *after* the energy day it describes. */
  expectedWorkbookName: string | null;
  /** The gas PDF whose 8am-8am window starts on the next grid day. */
  gasBehindBy: number | null;
};

export const getIngestStatus = cache(async (): Promise<IngestStatus> => {
  const [latestGridDay, latestGasFileDay, published, publishedGas] = await Promise.all([
    // Already runtime-aware: this merges published GRID_DAILY keys in.
    getRuntimeLatestDate(),
    latestFileDate('petrobangla/daily'),
    getPublishedKeys('GRID_DAILY'),
    getPublishedKeys('GAS_DAILY'),
  ]);

  // The gas side had no such merge, so a gas day published from the admin panel
  // left the banner reporting the last *deployed* day — and, through
  // `gasBehindBy`, an ingest gap that had already been filled.
  const gasDays = [latestGasFileDay, ...publishedGas.filter((k) => ISO_RE.test(k))].filter(
    (d): d is string => Boolean(d),
  );
  const latestGasDay = gasDays.length > 0 ? gasDays.sort()[gasDays.length - 1] : null;

  const nextGridDay = latestGridDay ? addDays(latestGridDay, 1) : null;

  const gasBehindBy =
    latestGridDay && latestGasDay
      ? Math.round(
          (Date.parse(`${latestGridDay}T00:00:00Z`) - Date.parse(`${latestGasDay}T00:00:00Z`)) / 86_400_000,
        )
      : null;

  return {
    latestGridDay,
    latestGasDay,
    runtimePublished: published,
    nextGridDay,
    expectedWorkbookName: nextGridDay ? `Daily Report ${ddmmyyyy(addDays(nextGridDay, 1))}.xlsx` : null,
    gasBehindBy,
  };
});
