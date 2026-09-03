/**
 * The days the calendar has reached that the publishers have not filed yet.
 *
 * Every date bound in the Grid Explorer is anchored to `latestDate`, the newest
 * day actually held. That is right for access control and wrong for the reader:
 * on the morning of 4 September the newest held day is the 2nd or 3rd, the
 * picker stops there, and a reader who knows what day it is concludes the site
 * has stopped updating. It has not. PGCB files energy day D on the morning of
 * D+1, so the newest day that *can* exist is always yesterday, and today's is
 * still being measured.
 *
 * So the picker runs to today, and the days past the archive say who owes them
 * and when they are due. That is the same stance the homepage snapshot takes
 * with `HomeSnapshotStat.awaiting` (see home-snapshot-core.ts): hold the layout,
 * print no figure, name the upstream.
 *
 * The hard part is not generating the days. It is refusing to generate them
 * when they would lie. If ingestion has been broken for a week, listing six
 * "awaiting PGCB" days blames the publisher for our own outage — PGCB filed
 * those reports days ago. So pending days are offered only while the archive is
 * genuinely current, which is exactly the condition `assessFreshness` already
 * calls `'current'`: at most one day behind the newest day that can exist. Past
 * that the freshness note owns the message and this returns nothing.
 */
import { bstToday } from '@/lib/data/grid/ingest-freshness';

export type PendingStatus =
  /** The energy day is still running; it cannot have been filed by anyone. */
  | 'in-progress'
  /** The day is complete and its report is due, but has not appeared. */
  | 'awaiting';

export interface PendingDay {
  /** ISO date, BST. */
  readonly date: string;
  readonly status: PendingStatus;
  /** Who files it. */
  readonly publisher: 'PGCB';
  /** The morning the report is due, ISO. */
  readonly dueDate: string;
  /** One sentence for the reader, stating the publisher's own convention. */
  readonly note: string;
}

const DAY_MS = 86_400_000;

function shift(iso: string, days: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / DAY_MS);
}

/**
 * Days between the newest held day and today, or none when the archive is
 * behind. Never more than two entries: yesterday, whose report is due this
 * morning, and today, which is still being measured.
 */
export function pendingDays(latestHeld: string | null | undefined, now: Date = new Date()): PendingDay[] {
  if (!latestHeld) return [];
  const today = bstToday(now);
  // The newest day that can exist anywhere, publisher included.
  const newestPossible = shift(today, -1);

  const behind = daysBetween(latestHeld, newestPossible);
  // Ahead of the calendar, or so far behind that the gap is ours: say nothing
  // here. A negative value means the archive holds a day that has not finished,
  // which is a data problem and not something to paper over with a tile.
  if (behind < 0 || behind > 1) return [];

  const out: PendingDay[] = [];
  for (let d = shift(latestHeld, 1); d <= today; d = shift(d, 1)) {
    if (d === today) {
      out.push({
        date: d,
        status: 'in-progress',
        publisher: 'PGCB',
        dueDate: shift(d, 1),
        note:
          'This energy day is still running. PGCB measures midnight to midnight and files the report ' +
          'the following morning, so no figures exist for it yet — here or anywhere.',
      });
    } else {
      out.push({
        date: d,
        status: 'awaiting',
        publisher: 'PGCB',
        dueDate: shift(d, 1),
        note:
          'This energy day is complete and its report is due from PGCB. It has not been filed yet. ' +
          'The archive is current; the figures are not published.',
      });
    }
  }
  return out;
}

/**
 * A date the calendar has not reached. Only reachable by deep link — the picker
 * offers the catalog plus the pending days and nothing else — and before this
 * existed such a link rendered the ordinary empty shell, which invites the
 * reader to think a day exists and we mislaid it.
 */
export function isBeyondToday(isoDate: string, now: Date = new Date()): boolean {
  return isoDate > bstToday(now);
}

/** The pending entry for a date, or null when the date is not pending. */
export function pendingDayFor(
  isoDate: string,
  latestHeld: string | null | undefined,
  now: Date = new Date(),
): PendingDay | null {
  return pendingDays(latestHeld, now).find((p) => p.date === isoDate) ?? null;
}
