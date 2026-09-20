import { describe, expect, it } from 'vitest';
import { actionIsUseful, usefulActions, type StatusBulkAction } from '@/lib/article-bulk-actions';

/**
 * A control that does nothing is worse than a missing one.
 *
 * My Drafts shipped with a bulk "Draft" button that moved drafts to draft —
 * noticed immediately, and fairly, as nonsense. The same fault was in the row
 * menu and everywhere else the table is used: a published story offered
 * "Publish", an archived one offered "Archive". Every action was drawn
 * regardless of what it was pointed at.
 */

const ALL: StatusBulkAction[] = ['publish', 'schedule', 'draft', 'archive', 'trash'];

describe('actions that would change nothing are not offered', () => {
  it('does not offer Draft to drafts', () => {
    expect(actionIsUseful('draft', ['DRAFT'])).toBe(false);
    expect(actionIsUseful('draft', ['DRAFT', 'DRAFT', 'DRAFT'])).toBe(false);
  });

  it('does not offer Publish to published, or Archive to archived', () => {
    expect(actionIsUseful('publish', ['PUBLISHED'])).toBe(false);
    expect(actionIsUseful('archive', ['ARCHIVED'])).toBe(false);
    expect(actionIsUseful('schedule', ['SCHEDULED'])).toBe(false);
  });

  it('still offers everything else to a draft', () => {
    expect(usefulActions(ALL, ['DRAFT'])).toEqual(['publish', 'schedule', 'archive', 'trash']);
  });
});

describe('a mixed selection', () => {
  it('offers an action that has work to do on any one of them', () => {
    // Two drafts and a published story: Draft is still useful, because it
    // moves the published one. Requiring it to change ALL of them would hide
    // an action that does exactly what the editor intends.
    expect(actionIsUseful('draft', ['DRAFT', 'DRAFT', 'PUBLISHED'])).toBe(true);
    expect(actionIsUseful('publish', ['DRAFT', 'PUBLISHED'])).toBe(true);
  });

  it('hides it only when every one is already there', () => {
    expect(actionIsUseful('publish', ['PUBLISHED', 'PUBLISHED'])).toBe(false);
  });
});

describe('the trash is its own world', () => {
  it('offers restore and permanent delete only to trashed rows', () => {
    expect(actionIsUseful('restore', ['TRASH'])).toBe(true);
    expect(actionIsUseful('delete_permanent', ['TRASH'])).toBe(true);
    expect(actionIsUseful('restore', ['DRAFT'])).toBe(false);
    expect(actionIsUseful('delete_permanent', ['DRAFT', 'PUBLISHED'])).toBe(false);
  });

  it('offers nothing else to a selection that is only trash', () => {
    expect(usefulActions(ALL, ['TRASH'])).toEqual([]);
  });

  it('ignores trashed rows when judging the rest', () => {
    // A selection of a trashed row and a draft still offers Publish, for the
    // draft — and still does not offer Draft, because the only row Draft
    // could touch is already one.
    expect(actionIsUseful('publish', ['TRASH', 'DRAFT'])).toBe(true);
    expect(actionIsUseful('draft', ['TRASH', 'DRAFT'])).toBe(false);
  });

  it('offers permanent delete even though it is not a transition', () => {
    // It removes rather than moves, so it can never be redundant.
    expect(actionIsUseful('delete_permanent', ['TRASH', 'TRASH'])).toBe(true);
  });
});

describe('nothing selected', () => {
  it('offers nothing at all', () => {
    for (const action of [...ALL, 'restore', 'delete_permanent'] as StatusBulkAction[]) {
      expect(actionIsUseful(action, [])).toBe(false);
    }
  });
});

describe('a status the rule has not met', () => {
  it('is treated as actionable rather than silently hidden', () => {
    // IN_REVIEW is real today; a future status must not vanish from the
    // toolbar because nobody listed it. Offering too much is recoverable;
    // an editor who cannot find Publish is stuck.
    expect(actionIsUseful('publish', ['IN_REVIEW'])).toBe(true);
    expect(actionIsUseful('draft', ['IN_REVIEW'])).toBe(true);
    expect(actionIsUseful('trash', ['SOMETHING_NEW'])).toBe(true);
  });
});
