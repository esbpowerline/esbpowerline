import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { dataPathFor, SINGLETON, type DataFeedName } from '@/lib/data/feed-paths';

/**
 * Gather everything the local ingest wrote for a day, ready to publish.
 *
 * Kept apart from the route so the same set can be published from the admin
 * panel or from the command line right after the ingest chain finishes. The
 * chain writes six or seven files per day and only two of them were ever
 * published, which is why a published day used to arrive on the site with an
 * empty Energy Curve and Power Stations tab.
 */

/** Per-day artefacts, in the order a reader needs them. */
export const DAY_FEEDS: DataFeedName[] = [
  'GRID_DAILY',
  'GRID_CURVE',
  'GRID_PLANTS',
  'GAS_DAILY',
  'SREDA_DAILY',
];

/** Single-file artefacts the ingest chain may have rebuilt. */
export const AGGREGATE_FEEDS: DataFeedName[] = [
  'GAS_INDEX',
  'GAS_LIVE_WEEK',
  'GAS_TIMELINE',
  'GAS_RESERVE_MODEL',
  'GAS_RESERVE_SENSITIVITY',
  'PGCB_MONTHLY_SERIES',
];

export type Artifact =
  | { feed: DataFeedName; key: string; relPath: string; payload: unknown }
  | { feed: DataFeedName; key: string; relPath: string; absent: true }
  | { feed: DataFeedName; key: string; relPath: string; error: string };

export function isReadable(a: Artifact): a is Extract<Artifact, { payload: unknown }> {
  return 'payload' in a;
}

async function readArtifact(feed: DataFeedName, key: string, root: string): Promise<Artifact> {
  const relPath = dataPathFor(feed, key);
  if (!relPath) {
    return { feed, key, relPath: '(none)', error: `no path maps to ${feed}/${key}` };
  }

  const abs = path.join(root, 'public', 'data', ...relPath.split('/'));
  let raw: string;
  try {
    raw = await readFile(abs, 'utf8');
  } catch {
    // Not every day has every artefact. A day whose gas window Petrobangla has
    // not published yet simply has no gas file — a normal outcome, and one that
    // must read differently from a failure.
    return { feed, key, relPath, absent: true };
  }

  try {
    return { feed, key, relPath, payload: JSON.parse(raw) };
  } catch (error) {
    return {
      feed,
      key,
      relPath,
      error: `not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** Everything publishable for a day and/or a month, read from disk. */
export async function planLocalPublish(opts: {
  date?: string | null;
  month?: string | null;
  includeAggregates?: boolean;
  root?: string;
}): Promise<Artifact[]> {
  const root = opts.root ?? process.cwd();
  const out: Artifact[] = [];

  if (opts.date) {
    for (const feed of DAY_FEEDS) out.push(await readArtifact(feed, opts.date, root));
  }
  if (opts.month) {
    out.push(await readArtifact('PGCB_MONTHLY', opts.month, root));
    out.push(await readArtifact('PGCB_MONTHLY_EVENTS', opts.month, root));
  }
  // Aggregates are shared across days and rebuilt by the chain, so they travel
  // with whatever else is being published unless explicitly excluded.
  if (opts.includeAggregates !== false) {
    for (const feed of AGGREGATE_FEEDS) out.push(await readArtifact(feed, SINGLETON, root));
  }

  return out;
}
