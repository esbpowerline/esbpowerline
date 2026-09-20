/**
 * Which actions are worth offering for the articles in hand.
 *
 * The row menu and the bulk bar used to offer every action regardless of what
 * was selected, so My Drafts had a "Draft" button that moved drafts to draft,
 * a published story offered "Publish", and an archived one offered "Archive".
 * A control that does nothing is worse than a missing one: it teaches people
 * that the buttons here are decorative, and it hides the ones that work.
 *
 * The test is deliberately "would this change at least one of them?", not
 * "would this change all of them" — a mixed selection of two drafts and a
 * published story should still offer Draft, because it has work to do on one.
 */

export type StatusBulkAction =
  | 'publish'
  | 'schedule'
  | 'draft'
  | 'archive'
  | 'trash'
  | 'restore'
  | 'delete_permanent';

/** The status each action leaves an article in. */
const LANDS_IN: Record<StatusBulkAction, string | null> = {
  publish: 'PUBLISHED',
  schedule: 'SCHEDULED',
  draft: 'DRAFT',
  archive: 'ARCHIVED',
  trash: 'TRASH',
  restore: 'DRAFT',
  // Removal, not a transition: it is never redundant.
  delete_permanent: null,
};

/** Actions that only make sense on something already in the trash. */
const TRASH_ONLY = new Set<StatusBulkAction>(['restore', 'delete_permanent']);

/** Actions that make no sense on something in the trash — restore it first. */
const NOT_IN_TRASH = new Set<StatusBulkAction>(['publish', 'schedule', 'draft', 'archive', 'trash']);

/**
 * Would this action change anything for this set of statuses?
 *
 * An empty selection is false throughout: there is nothing to act on, and a
 * bulk bar with nothing selected is not shown anyway.
 */
export function actionIsUseful(action: StatusBulkAction, statuses: readonly string[]): boolean {
  if (statuses.length === 0) return false;

  const inTrash = statuses.filter((s) => s === 'TRASH');
  const live = statuses.filter((s) => s !== 'TRASH');

  if (TRASH_ONLY.has(action)) {
    if (inTrash.length === 0) return false;
    if (action === 'delete_permanent') return true;
    // `restore` lands in DRAFT, and everything in the trash is by definition
    // not a draft, so any trashed row makes it useful.
    return true;
  }

  if (NOT_IN_TRASH.has(action) && live.length === 0) return false;

  const target = LANDS_IN[action];
  if (target === null) return true;
  // Useful if at least one of the rows it would touch is not already there.
  return live.some((s) => s !== target);
}

/** The subset of `actions` worth showing for these statuses, in order. */
export function usefulActions(
  actions: readonly StatusBulkAction[],
  statuses: readonly string[],
): StatusBulkAction[] {
  return actions.filter((a) => actionIsUseful(a, statuses));
}
