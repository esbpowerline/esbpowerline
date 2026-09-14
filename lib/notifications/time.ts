/**
 * Dhaka wall-clock formatting for notifications.
 *
 * Every instant in ESB is stored as UTC — `GridHourlyObservation.observedAt` is a
 * `timestamp without time zone` holding a UTC instant, Prisma returns `Date`s.
 * Bangladesh runs on UTC+06:00 with no daylight saving (observation-window.ts
 * applies the same offset uniformly), so the wall clock is the instant plus six
 * hours, read in UTC.
 *
 * This is done by arithmetic rather than `toLocaleString(…, { timeZone })` on
 * purpose. The machine's own zone never enters: on 2026-09-14 a health check
 * read these timestamps through node-pg on a +06:00 laptop and printed every
 * hour six hours early, which looked exactly like a stalled capture.
 */

export const DHAKA_OFFSET_MINUTES = 6 * 60;
export const DHAKA_ZONE_LABEL = 'BST';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function wall(instant: Date): Date {
  return new Date(instant.getTime() + DHAKA_OFFSET_MINUTES * 60_000);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "20:15" */
export function dhakaTime(instant: Date): string {
  const w = wall(instant);
  return `${pad(w.getUTCHours())}:${pad(w.getUTCMinutes())}`;
}

/** "14 Sep" */
export function dhakaDay(instant: Date): string {
  const w = wall(instant);
  return `${w.getUTCDate()} ${MONTHS[w.getUTCMonth()]}`;
}

/** "14 Sep, 20:15" */
export function dhakaDateTime(instant: Date): string {
  return `${dhakaDay(instant)}, ${dhakaTime(instant)}`;
}

/** "2026-09-14": the Dhaka calendar date an instant falls on. */
export function dhakaDateKey(instant: Date): string {
  const w = wall(instant);
  return `${w.getUTCFullYear()}-${pad(w.getUTCMonth() + 1)}-${pad(w.getUTCDate())}`;
}

/** "14 Sep 2026" from an ISO calendar date, with no instant involved. */
export function formatIsoDay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
