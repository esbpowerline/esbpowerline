/**
 * When a batch of stories may be scheduled, and for when.
 *
 * Scheduling is the one bulk action that carries a value rather than just a
 * verb, so it is the one that can be wrong in a way the others cannot: a time
 * in the past does not schedule anything, it publishes immediately, and a
 * publish nobody intended is much harder to take back than a draft nobody
 * intended. The rule lives here so the picker that offers the time and the
 * action that acts on it agree about what is acceptable.
 *
 * All instants are handled as the machine's local time, which is what
 * `datetime-local` gives the form and what `CmsDateTimePicker` produces.
 */

/**
 * How far in the past a chosen time may fall and still be taken as "now".
 *
 * A minute of slack, because a scheduled time is typed and then confirmed:
 * without it, picking 10:30 at 10:29:58 fails by the time the click lands.
 */
export const SCHEDULE_PAST_TOLERANCE_MS = 60_000;

export type ScheduleCheck = { ok: true; at: Date } | { ok: false; reason: string };

/**
 * Read a datetime-local string and say whether it can be scheduled.
 *
 * Returns the parsed instant on success rather than a boolean, so a caller
 * cannot validate one value and then write a different one.
 */
export function parseScheduleTime(
  value: string | null | undefined,
  now: Date = new Date(),
): ScheduleCheck {
  if (typeof value !== 'string' || !value.trim()) {
    return { ok: false, reason: 'Choose the date and time to publish.' };
  }
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) {
    return { ok: false, reason: 'That is not a valid date and time.' };
  }
  if (at.getTime() < now.getTime() - SCHEDULE_PAST_TOLERANCE_MS) {
    // Naming the consequence, not just the rule: an editor who meant to
    // backdate a publish needs to know this is not the way to do it.
    return {
      ok: false,
      reason: 'That time has passed. Pick a future time, or use Publish to put these live now.',
    };
  }
  return { ok: true, at };
}

/** A local datetime string for an `<input type="datetime-local">`. */
export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * A sensible time to open the picker on: the next round half hour.
 *
 * Opening on "now" invites a click that is already in the past by the time it
 * is confirmed, and offers a time nobody would choose deliberately.
 */
export function defaultScheduleTime(now: Date = new Date()): string {
  const at = new Date(now);
  at.setSeconds(0, 0);
  at.setMinutes(at.getMinutes() + (30 - (at.getMinutes() % 30)));
  return toDatetimeLocal(at);
}
