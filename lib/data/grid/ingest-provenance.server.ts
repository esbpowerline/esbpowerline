import 'server-only';
import prisma from '@/lib/prisma';
import { cache } from 'react';
import type { DataFeed } from '@prisma/client';

/**
 * Who put each recent day on the site, and when.
 *
 * The coverage screen used to answer "is this day held?" by listing
 * `public/data/`. On the deployed admin panel that directory is stripped out of
 * the function bundle on purpose — `next.config.ts` excludes it from
 * `/admin/**` after it pushed a route past the 250 MB limit — so the listing is
 * always empty there and the strip showed a nearly blank month however much the
 * Pi had ingested. Worse, station detail and the fuel curve live under
 * `outputFileTracingExcludes['**']`, so they are absent from *every* function:
 * no day could ever read as complete, anywhere.
 *
 * The database has the answer already and is the same database the Pi writes
 * to. Every publish — the Pi's `publish-local.ts`, the panel's upload flow, the
 * one-stop refresh — upserts a `DataRelease` carrying `publishedAt` and a
 * `parserVersion` naming the caller. So the panel does not need the Pi to
 * report in: reading these rows *is* the channel, and a day ingested by hand
 * during Pi maintenance shows up in the same strip, labelled as yours.
 *
 * Deliberately scoped to the visible window (the strip's 45 days plus a little
 * slack) rather than every release row: the archive holds 4,556 days and the
 * screen shows six weeks.
 */

/** Per-day feeds the strip reports on, in the order a reader needs them. */
export const DAY_FEED_IDS = ['GRID_DAILY', 'GAS_DAILY', 'GRID_CURVE', 'GRID_PLANTS'] as const;
export type DayFeedId = (typeof DAY_FEED_IDS)[number];

/** Who ran the publish, as far as `parserVersion` records it. */
export type PublishActor = 'pi' | 'panel' | 'unknown';

export type ReleaseFact = {
  publishedAt: string;
  actor: PublishActor;
  /** The exact `parserVersion` string, for the tooltip's footnote. */
  parserVersion: string | null;
  sourceName: string | null;
};

/**
 * `parserVersion` values in use. The CLI one is what the Pi's runners call —
 * `pi-ingest.sh`, `pi-monthly.sh` and `pi-weekly.sh` all shell out to
 * `scripts/publish-local.ts`, which stamps `publish-local-cli/1`. The other
 * three are the admin routes. A value nobody recognises is reported as
 * unknown rather than guessed at: mislabelling who published a day is exactly
 * the sort of confident wrong answer this screen exists to avoid.
 */
const ACTOR_BY_PARSER: Readonly<Record<string, PublishActor>> = {
  'publish-local-cli/1': 'pi',
  'ingest_bridge/1': 'panel',
  'publish-local/1': 'panel',
  'refresh-all/1': 'panel',
};

export function actorFor(parserVersion: string | null | undefined): PublishActor {
  if (!parserVersion) return 'unknown';
  return ACTOR_BY_PARSER[parserVersion] ?? 'unknown';
}

export type RecentReleaseFacts = {
  /** `feed -> key -> fact`, for the keys inside the window. */
  byFeed: Record<string, Record<string, ReleaseFact>>;
  /** True when the database could not be read; the caller then falls back to disk. */
  degraded: boolean;
};

async function readRecentReleaseFacts(
  feeds: DataFeed[],
  fromKey: string,
): Promise<RecentReleaseFacts> {
  const byFeed: Record<string, Record<string, ReleaseFact>> = {};
  try {
    const rows = await prisma.dataRelease.findMany({
      // Keys are ISO dates or `YYYY-MM`, so a string comparison is a date
      // comparison and the index on (feed, key) serves it.
      where: { revokedAt: null, feed: { in: feeds }, key: { gte: fromKey } },
      select: { feed: true, key: true, publishedAt: true, parserVersion: true, sourceName: true },
      orderBy: [{ feed: 'asc' }, { key: 'asc' }],
    });
    for (const row of rows) {
      (byFeed[row.feed] ??= {})[row.key] = {
        publishedAt: row.publishedAt.toISOString(),
        actor: actorFor(row.parserVersion),
        parserVersion: row.parserVersion,
        sourceName: row.sourceName,
      };
    }
    return { byFeed, degraded: false };
  } catch (error) {
    // Fail soft, like every other release read (releases.server.ts). A database
    // blip must leave the screen reporting what the filesystem knows rather
    // than claiming the archive is empty.
    console.warn(
      `[ingest-provenance] release read failed, falling back to the filesystem: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return { byFeed, degraded: true };
  }
}

export const getRecentReleaseFacts = cache(
  (feeds: DataFeed[], fromKey: string): Promise<RecentReleaseFacts> =>
    readRecentReleaseFacts(feeds, fromKey),
);

/** The automations' own heartbeat, read from what each one writes. */
export type AutomationPulse = {
  /** Newest hour NLDC's capture has stored, ISO, or null if it has never run. */
  hourlyObservedAt: string | null;
  /** When that capture actually read the page. */
  hourlyFetchedAt: string | null;
  /** How many distinct hours landed in the last 24h — a healthy day is ~24. */
  hoursLast24: number;
  /** The forecast board PGCB is currently showing, as we hold it. */
  boardDate: string | null;
  boardFetchedAt: string | null;
  /** Newest release row of any kind, whoever wrote it. */
  lastPublishAt: string | null;
  lastPublishActor: PublishActor;
  degraded: boolean;
};

async function readAutomationPulse(): Promise<AutomationPulse> {
  const empty: AutomationPulse = {
    hourlyObservedAt: null,
    hourlyFetchedAt: null,
    hoursLast24: 0,
    boardDate: null,
    boardFetchedAt: null,
    lastPublishAt: null,
    lastPublishActor: 'unknown',
    degraded: true,
  };
  try {
    const since = new Date(Date.now() - 24 * 3_600_000);
    const [hourly, board, lastPublish, hourRows] = await Promise.all([
      prisma.gridHourlyObservation.findFirst({
        orderBy: { observedAt: 'desc' },
        select: { observedAt: true, fetchedAt: true },
      }),
      prisma.gridForecastBoard.findFirst({
        orderBy: { boardDate: 'desc' },
        select: { boardDate: true, fetchedAt: true },
      }),
      prisma.dataRelease.findFirst({
        where: { revokedAt: null },
        orderBy: { publishedAt: 'desc' },
        select: { publishedAt: true, parserVersion: true },
      }),
      // Distinct hours, not rows: each hour writes one row per series, so a
      // plain count would read four times healthier than the capture is. And
      // truncated to the hour, because NLDC sometimes posts a half-hour
      // reading as well — counting instants reported 25 hours in a day.
      prisma.$queryRaw<Array<{ hours: bigint }>>`
        select count(distinct date_trunc('hour', "observedAt")) as hours
          from "GridHourlyObservation"
         where "observedAt" >= ${since}
      `,
    ]);
    return {
      hourlyObservedAt: hourly?.observedAt.toISOString() ?? null,
      hourlyFetchedAt: hourly?.fetchedAt.toISOString() ?? null,
      hoursLast24: Number(hourRows[0]?.hours ?? 0),
      boardDate: board?.boardDate.toISOString().slice(0, 10) ?? null,
      boardFetchedAt: board?.fetchedAt.toISOString() ?? null,
      lastPublishAt: lastPublish?.publishedAt.toISOString() ?? null,
      lastPublishActor: actorFor(lastPublish?.parserVersion),
      degraded: false,
    };
  } catch (error) {
    console.warn(
      `[ingest-provenance] pulse read failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return empty;
  }
}

export const getAutomationPulse = cache(readAutomationPulse);
