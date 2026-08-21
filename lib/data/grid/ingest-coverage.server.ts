import 'server-only';

import { readdir, open } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { getPublishedKeys } from '@/lib/data/releases.server';
import { downloadStamp } from '@/lib/data/grid/export-datestamp';

/**
 * What the site holds, and what it is still missing.
 *
 * The ingest screen used to answer one question — "what is the next day?" — by
 * adding a day to the latest file on disk. That is the right answer only when
 * the archive has no holes, and it has 81 of them. An operator could not see
 * which days were absent, which were present but incomplete, or how far behind
 * the site had fallen, so the only way to find a gap was to notice a chart
 * looking wrong months later.
 *
 * Four artifacts make a published day, and they arrive from different places on
 * different schedules:
 *
 *   * `public/data/daily/{E}.json` — the grid day, from PGCB's workbook
 *   * `public/data/petrobangla/daily/…` — the gas day, from Petrobangla's PDF
 *   * `public/data/plants/{E}.json` — per-station detail
 *   * `public/data/pgcb-monthly/{YYYY-MM}.json` — the monthly report
 *
 * A day with the first and not the second publishes with its gas columns blank,
 * which is exactly the sort of quiet incompleteness this screen now names.
 */

const ISO_FILE = /^(\d{4}-\d{2}-\d{2})\.json$/;
const MONTH_FILE = /^(\d{4}-(?:0[1-9]|1[0-2]))\.json$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MS_DAY = 86_400_000;

const shift = (iso: string, days: number): string =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * MS_DAY).toISOString().slice(0, 10);

const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_DAY);

/** DD-MM-YYYY, the shape PGCB uses in its filenames. */
const ddmmyyyy = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};

async function listDir(dir: string, re: RegExp): Promise<string[]> {
  try {
    const names = await readdir(path.join(process.cwd(), 'public', 'data', ...dir.split('/')));
    return names
      .map((n) => re.exec(n)?.[1])
      .filter((d): d is string => Boolean(d))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Which energy day each Petrobangla file actually covers.
 *
 * The filename cannot be trusted: 2,238 of the archive's files are named for
 * the day the report was FILED, which is the morning after the 08:00–08:00
 * window they describe, while the other 59 are named for the window's own
 * start. So each file is asked, by reading the first few kilobytes and lifting
 * `gas_day_start` out of them — it sits about 2 KB in, well inside one read,
 * and a full pass over 2,297 files costs a few seconds.
 *
 * `gas_day_start`, specifically, and not the `report_date_start` sitting beside
 * it: that one is the header Petrobangla prints on the PDF, and it is wrong on
 * 89 documents. Reading it instead loses 84 real days and invents four. See
 * `petrobangla-day.server.ts` for the full count.
 *
 * Memoised against the directory's shape so that cost is paid once and again
 * only when a file is added.
 */
let gasIndexCache: { signature: string; days: Set<string> } | null = null;

async function gasEnergyDays(): Promise<Set<string>> {
  const files = await listDir('petrobangla/daily', ISO_FILE);
  const signature = `${files.length}:${files[files.length - 1] ?? ''}`;
  if (gasIndexCache?.signature === signature) return gasIndexCache.days;

  const dir = path.join(process.cwd(), 'public', 'data', 'petrobangla', 'daily');
  const days = new Set<string>();

  await Promise.all(
    files.map(async (name) => {
      let handle;
      try {
        handle = await open(path.join(dir, `${name}.json`), 'r');
        const buf = Buffer.alloc(8192);
        const { bytesRead } = await handle.read(buf, 0, 8192, 0);
        const head = buf.subarray(0, bytesRead).toString('utf8');
        // Alternation would match whichever key came first in the byte stream,
        // and `report_date_start` is always the earlier one — so ask for the
        // window explicitly, and only fall back if it is genuinely absent.
        const m =
          /"gas_day_start"\s*:\s*"(\d{4}-\d{2}-\d{2})"/.exec(head) ??
          /"report_date_start"\s*:\s*"(\d{4}-\d{2}-\d{2})"/.exec(head);
        // A file that will not say which window it covers is not counted: a
        // guess here would report coverage the site does not have.
        if (m) days.add(m[1]);
      } catch {
        // Unreadable file: not coverage.
      } finally {
        await handle?.close();
      }
    }),
  );

  gasIndexCache = { signature, days };
  return days;
}

export type DatasetCoverage = {
  id: 'grid' | 'gas' | 'plants' | 'monthly';
  label: string;
  /** One line: what it is and what it feeds. */
  what: string;
  unit: 'days' | 'months';
  held: number;
  first: string | null;
  last: string | null;
  /** Slots inside the held span that are absent. */
  missingInside: number;
  /** The newest absences inside the span, newest first. */
  recentGaps: string[];
};

export type DayRow = {
  date: string;
  grid: boolean;
  gas: boolean;
  plants: boolean;
};

export type IngestCoverage = {
  /** The civil day in Dhaka — what "behind" is measured against. */
  today: string;
  /** The newest energy day whose sources PGCB will have posted by now. */
  newestPublishable: string;
  datasets: DatasetCoverage[];
  /** The last stretch of energy days, newest first, with what we hold for each. */
  recent: DayRow[];
  /** Days the site does not have at all, newest first, with their filenames. */
  awaiting: Array<{ date: string; workbook: string; gasFiledUnder: string }>;
  /** Days held with no gas: they publish with the gas columns blank. */
  gasMissing: string[];
  /** Days held with no station detail. */
  plantsMissing: string[];
  /** Months inside the monthly span with no report. */
  monthsMissing: string[];
  /** How many days behind `newestPublishable` the newest held day is. */
  daysBehind: number | null;
};

function gapsInside(held: string[], step: (iso: string, n: number) => string): string[] {
  if (held.length < 2) return [];
  const set = new Set(held);
  const out: string[] = [];
  for (let d = step(held[0], 1); d < held[held.length - 1]; d = step(d, 1)) {
    if (!set.has(d)) out.push(d);
  }
  return out;
}

const monthStep = (key: string, n: number): string => {
  const idx = Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1 + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
};

/** How many days back the per-day strip reaches. */
const RECENT_WINDOW = 45;

export const getIngestCoverage = cache(async (): Promise<IngestCoverage> => {
  const [gridFiles, plantFiles, monthFiles, gasDays, publishedGrid, publishedGas] =
    await Promise.all([
      listDir('daily', ISO_FILE),
      listDir('plants', ISO_FILE),
      listDir('pgcb-monthly', MONTH_FILE),
      gasEnergyDays(),
      getPublishedKeys('GRID_DAILY'),
      getPublishedKeys('GAS_DAILY'),
    ]);

  // A day published at runtime counts as held even though no file exists: that
  // is the whole point of the release layer, and a screen that ignored it would
  // send an operator to re-ingest a day already on the site.
  const grid = [...new Set([...gridFiles, ...publishedGrid.filter((k) => ISO.test(k))])].sort();
  for (const key of publishedGas) if (ISO.test(key)) gasDays.add(key);

  const gas = [...gasDays].sort();
  const plants = plantFiles;

  const today = downloadStamp().iso;
  // PGCB posts the workbook for energy day E on the morning of E+1, and
  // Petrobangla files E's gas window under E+1 as well. So the newest day whose
  // sources exist anywhere is yesterday.
  const newestPublishable = shift(today, -1);

  const gridSet = new Set(grid);
  const gasSet = new Set(gas);
  const plantSet = new Set(plants);

  const recent: DayRow[] = [];
  for (let i = 0; i < RECENT_WINDOW; i += 1) {
    const date = shift(newestPublishable, -i);
    recent.push({
      date,
      grid: gridSet.has(date),
      gas: gasSet.has(date),
      plants: plantSet.has(date),
    });
  }

  const latestGrid = grid[grid.length - 1] ?? null;
  const awaiting = recent
    .filter((r) => !r.grid)
    .map((r) => ({
      date: r.date,
      // The workbook is named for the publication date, a day after the energy
      // day it describes.
      workbook: `Daily Report ${ddmmyyyy(shift(r.date, 1))}.xlsx`,
      gasFiledUnder: shift(r.date, 1),
    }));

  const datasets: DatasetCoverage[] = [
    {
      id: 'grid',
      label: 'Grid day',
      what: 'PGCB’s daily workbook — peaks, generation by fuel, the load curve, outages.',
      unit: 'days',
      held: grid.length,
      first: grid[0] ?? null,
      last: latestGrid,
      missingInside: gapsInside(grid, shift).length,
      recentGaps: gapsInside(grid, shift).slice(-8).reverse(),
    },
    {
      id: 'gas',
      label: 'Gas day',
      what: 'Petrobangla’s 08:00–08:00 intake–offtake report — field production and offtake.',
      unit: 'days',
      held: gas.length,
      first: gas[0] ?? null,
      last: gas[gas.length - 1] ?? null,
      missingInside: gapsInside(gas, shift).length,
      recentGaps: gapsInside(gas, shift).slice(-8).reverse(),
    },
    {
      id: 'plants',
      label: 'Station detail',
      what: 'Per-station evening peak. Read locally and from releases; not in deployed bundles.',
      unit: 'days',
      held: plants.length,
      first: plants[0] ?? null,
      last: plants[plants.length - 1] ?? null,
      missingInside: gapsInside(plants, shift).length,
      recentGaps: gapsInside(plants, shift).slice(-8).reverse(),
    },
    {
      id: 'monthly',
      label: 'Monthly report',
      what: 'PGCB’s monthly document — substation max loads, interruptions, unserved energy.',
      unit: 'months',
      held: monthFiles.length,
      first: monthFiles[0] ?? null,
      last: monthFiles[monthFiles.length - 1] ?? null,
      missingInside: gapsInside(monthFiles, monthStep).length,
      recentGaps: gapsInside(monthFiles, monthStep).slice(-8).reverse(),
    },
  ];

  return {
    today,
    newestPublishable,
    datasets,
    recent,
    awaiting,
    gasMissing: recent.filter((r) => r.grid && !r.gas).map((r) => r.date),
    plantsMissing: recent.filter((r) => r.grid && !r.plants).map((r) => r.date),
    monthsMissing: gapsInside(monthFiles, monthStep).slice(-6).reverse(),
    daysBehind: latestGrid ? daysBetween(latestGrid, newestPublishable) : null,
  };
});
