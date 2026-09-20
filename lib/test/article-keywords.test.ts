import { describe, expect, it } from 'vitest';
import { suggestArticleKeywords } from '@/lib/article-keywords';

/**
 * Suggested tags reach the reader: they render on the article and ship as
 * `keywords` in its JSON-LD and OpenGraph. The old extractor counted single
 * lowercased words, so an LNG story was tagged `gas`, `supply`, `said`.
 */

const LNG_STORY = {
  title: 'Petrobangla Raises LNG Imports as Domestic Gas Supply Falls',
  body: `
    <p>Petrobangla has increased regasified LNG intake after domestic gas supply
    fell below 2,000 MMCFD, according to the corporation.</p>
    <p>The RPGCL terminal at Moheshkhali returned to service on Tuesday, while
    PGCB reported load shedding of 1,200 MW at the evening peak.</p>
    <p>Officials said the gas crisis has forced a shift to furnace oil at several
    power plants, raising the capacity charge burden.</p>
  `,
};

describe('suggestArticleKeywords', () => {
  const tags = suggestArticleKeywords(LNG_STORY.title, LNG_STORY.body);

  it('recognises the sector entities the story names', () => {
    expect(tags).toContain('Petrobangla');
    expect(tags).toContain('LNG');
  });

  it('keeps canonical casing rather than lowercasing acronyms', () => {
    const joined = tags.join('|');
    expect(joined).not.toMatch(/\bpetrobangla\b/);
    expect(joined).not.toMatch(/\bpgcb\b/);
  });

  it('prefers a phrase to the bare words inside it', () => {
    // "load shedding" is a subject; "load" and "shedding" are not.
    expect(tags).toContain('Load shedding');
    expect(tags).not.toContain('Load');
    expect(tags).not.toContain('Shedding');
  });

  it('does not emit a term already inside a longer one it chose', () => {
    // Having taken "gas supply", it must not also offer "gas".
    if (tags.some((t) => /^gas supply$/i.test(t))) {
      expect(tags.some((t) => /^gas$/i.test(t))).toBe(false);
    }
  });

  it('ranks what the headline names above what only the body mentions', () => {
    const iLng = tags.indexOf('LNG');
    const iCapacity = tags.findIndex((t) => /capacity charge/i.test(t));
    expect(iLng).toBeGreaterThanOrEqual(0);
    if (iCapacity >= 0) expect(iLng).toBeLessThan(iCapacity);
  });

  it('emits no bare numbers, units or stopwords', () => {
    for (const t of tags) {
      expect(t, t).not.toMatch(/^\d/);
      expect(t.toLowerCase(), t).not.toBe('said');
      expect(t.toLowerCase(), t).not.toBe('according');
    }
  });

  it('respects the limit and returns no duplicates', () => {
    const five = suggestArticleKeywords(LNG_STORY.title, LNG_STORY.body, { limit: 5 });
    expect(five).toHaveLength(5);
    expect(new Set(five.map((t) => t.toLowerCase())).size).toBe(5);
  });

  it('returns nothing for an empty story rather than throwing', () => {
    expect(suggestArticleKeywords('', '')).toEqual([]);
    expect(suggestArticleKeywords('', '<p></p>')).toEqual([]);
  });

  it('strips markup and entities instead of tagging them', () => {
    const tagged = suggestArticleKeywords(
      'Grid Update',
      '<p>PGCB&nbsp;confirmed the&#8217;outage</p><script>alert(1)</script>',
    );
    expect(tagged.join('|')).not.toMatch(/script|alert|nbsp|8217/i);
  });

  it('finds a subject no list anticipated, if the story repeats it', () => {
    const tagsOut = suggestArticleKeywords(
      'Ashuganj Fertiliser Plant Halts Production',
      '<p>The Ashuganj fertiliser plant halted production.</p>'
        + '<p>Ashuganj fertiliser output has fallen for a third month.</p>'
        + '<p>Workers at the Ashuganj fertiliser site were sent home.</p>',
    );
    expect(tagsOut.join('|').toLowerCase()).toContain('ashuganj');
  });
});
