import { describe, expect, it } from 'vitest';
import {
  DELETE_PHRASE,
  deleteRefusalReason,
  isLiveStatus,
  matchesDeletePhrase,
  matchesPhrase,
  requiresDeletePhrase,
} from '@/lib/article-delete';

/**
 * The gate on deleting an article.
 *
 * A draft deletes on a confirm. A live article has to be typed out, because
 * the consequence reaches past the newsroom: a URL a reader has open, linked
 * or bookmarked stops working. `deleteArticle` reads the status from the
 * database rather than from the caller, so these rules cannot be skipped by a
 * client that lies about what it is deleting — but they still have to be the
 * same rules the dialog showed, which is why both import from one module.
 */

describe('which articles need the phrase', () => {
  it('asks for it on a live article', () => {
    expect(isLiveStatus('PUBLISHED')).toBe(true);
    expect(requiresDeletePhrase('PUBLISHED')).toBe(true);
  });

  it('does not ask on anything a reader cannot reach', () => {
    // SCHEDULED is included deliberately: it is not public yet, so deleting
    // one takes nothing away from anybody.
    for (const status of ['DRAFT', 'SCHEDULED', 'IN_REVIEW', 'ARCHIVED', 'TRASH']) {
      expect(requiresDeletePhrase(status)).toBe(false);
    }
  });

  it('does not ask on a status it has never heard of', () => {
    // A new status must not silently inherit the gate; it must be added to
    // LIVE_STATUSES on purpose. The inverse — a new PUBLIC status that skips
    // the gate — is caught by review, not by a default nobody chose.
    expect(requiresDeletePhrase('SOMETHING_NEW')).toBe(false);
    expect(requiresDeletePhrase(null)).toBe(false);
    expect(requiresDeletePhrase(undefined)).toBe(false);
  });
});

describe('matching the phrase', () => {
  it('accepts the phrase as written', () => {
    expect(matchesDeletePhrase(DELETE_PHRASE)).toBe(true);
  });

  it('forgives capitals and stray whitespace, not words', () => {
    expect(matchesDeletePhrase('Delete This Article')).toBe(true);
    expect(matchesDeletePhrase('  delete this article  ')).toBe(true);
    expect(matchesDeletePhrase('delete  this   article')).toBe(true);
    expect(matchesDeletePhrase('DELETE THIS ARTICLE')).toBe(true);
  });

  it('rejects anything that is not the phrase', () => {
    for (const bad of [
      '',
      '   ',
      'delete',
      'delete article',
      'delete this',
      'delete this article now',
      'please delete this article',
      'deletethisarticle',
      'delete-this-article',
      'delete this artcle',
    ]) {
      expect(matchesDeletePhrase(bad)).toBe(false);
    }
  });

  it('rejects a non-string without throwing', () => {
    // A form field can arrive as undefined, and a refusal must not become a
    // 500 that a caller retries.
    expect(matchesDeletePhrase(null)).toBe(false);
    expect(matchesDeletePhrase(undefined)).toBe(false);
    expect(matchesDeletePhrase(1234 as unknown as string)).toBe(false);
  });

  it('is the same comparison the dialog enables its button with', () => {
    expect(matchesPhrase('Delete This Article', DELETE_PHRASE)).toBe(true);
    expect(matchesPhrase('nope', DELETE_PHRASE)).toBe(false);
  });
});

describe('the decision the server acts on', () => {
  it('lets a draft through with no confirmation at all', () => {
    expect(deleteRefusalReason('DRAFT', undefined)).toBeNull();
    expect(deleteRefusalReason('SCHEDULED', '')).toBeNull();
  });

  it('refuses a live article with no confirmation', () => {
    const reason = deleteRefusalReason('PUBLISHED', undefined);
    expect(reason).toBeTruthy();
    // The message has to name the phrase, or the editor is told to type
    // something without being told what.
    expect(reason).toContain(DELETE_PHRASE);
  });

  it('refuses a live article with the wrong confirmation', () => {
    expect(deleteRefusalReason('PUBLISHED', 'delete')).toBeTruthy();
    expect(deleteRefusalReason('PUBLISHED', 'yes')).toBeTruthy();
  });

  it('lets a live article through with the phrase', () => {
    expect(deleteRefusalReason('PUBLISHED', DELETE_PHRASE)).toBeNull();
    expect(deleteRefusalReason('PUBLISHED', ' Delete This Article ')).toBeNull();
  });

  it('returns a reason rather than a boolean', () => {
    // A caller that writes `if (deleteRefusalReason(...))` gets the refusal;
    // one that forgets to check gets a string it cannot mistake for a pass.
    expect(typeof deleteRefusalReason('PUBLISHED', null)).toBe('string');
    expect(deleteRefusalReason('DRAFT', null)).toBeNull();
  });
});
