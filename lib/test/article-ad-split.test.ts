import { describe, expect, it } from 'vitest';
import { splitBodyForAd, AD_MIN_PARAGRAPHS } from '@/lib/article-ad-split';

/**
 * The article page and the CMS preview must break the body at the same place.
 * Before this was one function the preview rendered the body whole, so an
 * editor could not see that an ad slot lands in the middle of their copy.
 */

const p = (n: number) =>
  Array.from({ length: n }, (_, i) => `<p>Paragraph ${i + 1}.</p>`).join('');

describe('splitBodyForAd', () => {
  it('declines to break a body under the minimum', () => {
    for (let n = 0; n < AD_MIN_PARAGRAPHS; n += 1) {
      expect(splitBodyForAd(p(n)), `${n} paragraphs`).toBeNull();
    }
  });

  it('breaks a body at exactly the minimum, as the page always has', () => {
    // Three paragraphs qualify: the split leaves a trailing empty segment, so
    // the segment count is four. Pinned because it reads like an off-by-one.
    expect(splitBodyForAd(p(AD_MIN_PARAGRAPHS))).not.toBeNull();
  });

  it('breaks a long body once, losing nothing', () => {
    const body = p(8);
    const split = splitBodyForAd(body);
    expect(split).not.toBeNull();
    // Every paragraph survives, in order, on one side or the other.
    expect(split!.first + split!.second).toBe(body);
    expect(split!.first).toContain('Paragraph 1.');
    expect(split!.second).toContain('Paragraph 8.');
  });

  it('closes the first half rather than leaving a dangling tag', () => {
    const split = splitBodyForAd(p(6));
    expect(split!.first.endsWith('</p>')).toBe(true);
  });

  it('puts the break near the middle', () => {
    const split = splitBodyForAd(p(10));
    const before = (split!.first.match(/<p>/g) ?? []).length;
    const after = (split!.second.match(/<p>/g) ?? []).length;
    expect(Math.abs(before - after)).toBeLessThanOrEqual(1);
  });

  it('is stable for a body with no paragraph tags at all', () => {
    expect(splitBodyForAd('just text, no markup')).toBeNull();
  });
});
