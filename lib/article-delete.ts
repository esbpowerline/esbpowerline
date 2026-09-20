/**
 * When deleting an article needs a typed confirmation, and what counts as one.
 *
 * Deleting a draft costs its author the draft. Deleting a live article takes a
 * URL away from readers who may have it open, linked or indexed — the same
 * action with a consequence outside the newsroom. So a live article asks for
 * the phrase to be typed out, which is friction that cannot be clicked
 * through by muscle memory the way an "Are you sure?" can.
 *
 * Both the dialog and the server action import from here. If the client
 * decided when to ask and the server decided when to require, the two would
 * drift and the check would quietly become decorative — the server is the one
 * that enforces, and it must ask the same question the reader was asked.
 */

/** The words an editor types to delete something the public can see. */
export const DELETE_PHRASE = 'delete this article';

/**
 * Statuses that are reachable by a reader right now.
 *
 * `SCHEDULED` is deliberately not here: it is not public yet, and deleting one
 * removes something nobody has seen. `ARCHIVED` and `TRASH` already 404.
 */
export const LIVE_STATUSES = ['PUBLISHED'] as const;

export function isLiveStatus(status: string | null | undefined): boolean {
  return LIVE_STATUSES.includes(status as (typeof LIVE_STATUSES)[number]);
}

/** A live article needs the phrase; a draft does not. */
export function requiresDeletePhrase(status: string | null | undefined): boolean {
  return isLiveStatus(status);
}

/**
 * Does what someone typed match the phrase they were asked for?
 *
 * Case and surrounding or repeated whitespace are forgiven — the gate exists
 * to make the act deliberate, not to test typing. The words themselves, in
 * order, are not forgiven.
 *
 * Exported generically because the dialog enables its button with the same
 * comparison the server enforces with. A dialog that judged "close enough"
 * differently would either block a correct phrase or promise one that the
 * server then rejects.
 */
export function matchesPhrase(input: string | null | undefined, phrase: string): boolean {
  if (typeof input !== 'string') return false;
  const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalise(input) === normalise(phrase);
}

export function matchesDeletePhrase(input: string | null | undefined): boolean {
  return matchesPhrase(input, DELETE_PHRASE);
}

/**
 * The one place that answers "may this deletion proceed?".
 *
 * Returns `null` when it may, or the reason it may not — so a caller cannot
 * accidentally treat a refusal as a pass by ignoring a boolean.
 */
export function deleteRefusalReason(
  status: string | null | undefined,
  confirmation: string | null | undefined,
): string | null {
  if (!requiresDeletePhrase(status)) return null;
  if (matchesDeletePhrase(confirmation)) return null;
  return `This article is live. Type "${DELETE_PHRASE}" to confirm.`;
}
