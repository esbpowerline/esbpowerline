import { describe, expect, it } from 'vitest';
import {
  findMatches,
  nextMatch,
  replacementOrder,
  flattenSpans,
  type TextSpan,
} from '@/lib/editor-find-replace';

/**
 * The arithmetic that can silently corrupt a story. A replacement changes the
 * length of the text after it, so the order these ranges are applied in is not
 * a detail.
 */

// Two paragraphs as ProseMirror would report them: each text run knows the
// document position it starts at, and the positions are not contiguous because
// the node boundaries take up room.
const SPANS: TextSpan[] = [
  { from: 1, text: 'Petrobangla raised LNG imports.' },
  { from: 40, text: 'Petrobangla said the LNG terminal is back.' },
];

describe('findMatches', () => {
  it('finds every occurrence, in document order', () => {
    const m = findMatches(SPANS, 'LNG');
    expect(m).toHaveLength(2);
    expect(m[0].from).toBeLessThan(m[1].from);
  });

  it('maps a match to the right document position', () => {
    const [first] = findMatches(SPANS, 'Petrobangla');
    expect(first.from).toBe(1);
    expect(first.to).toBe(1 + 'Petrobangla'.length);
  });

  it('is case-insensitive by default and exact on request', () => {
    expect(findMatches(SPANS, 'petrobangla')).toHaveLength(2);
    expect(findMatches(SPANS, 'petrobangla', { caseSensitive: true })).toHaveLength(0);
  });

  it('can match whole words only', () => {
    const spans = [{ from: 1, text: 'gas and gasworks and gas.' }];
    expect(findMatches(spans, 'gas')).toHaveLength(3);
    expect(findMatches(spans, 'gas', { wholeWord: true })).toHaveLength(2);
  });

  it('returns nothing for an empty query rather than every position', () => {
    expect(findMatches(SPANS, '')).toEqual([]);
  });

  it('does not hang on a query of regex metacharacters', () => {
    const spans = [{ from: 1, text: 'a (b) c [d] e.*f' }];
    expect(findMatches(spans, '(b)')).toHaveLength(1);
    expect(findMatches(spans, '.*')).toHaveLength(1);
  });

  it('never returns a match spanning two runs', () => {
    // "imports.Petrobangla" exists only in the flattened string, not the doc.
    expect(findMatches(SPANS, 'imports.Petrobangla')).toEqual([]);
  });
});

describe('nextMatch', () => {
  const matches = findMatches(SPANS, 'Petrobangla');

  it('takes the first match at or after the cursor', () => {
    expect(nextMatch(matches, 0)).toEqual(matches[0]);
    expect(nextMatch(matches, 2)).toEqual(matches[1]);
  });

  it('wraps to the top past the last match', () => {
    expect(nextMatch(matches, 9999)).toEqual(matches[0]);
  });

  it('returns null when there is nothing to find', () => {
    expect(nextMatch([], 0)).toBeNull();
  });
});

describe('replacementOrder', () => {
  it('orders back to front so earlier edits cannot shift later ranges', () => {
    const ordered = replacementOrder(findMatches(SPANS, 'Petrobangla'));
    expect(ordered[0].from).toBeGreaterThan(ordered[1].from);
  });

  it('applied in that order, every replacement lands on its own text', () => {
    // A single run, so this can be simulated as a plain string edit.
    const text = 'gas, gas and more gas';
    const spans = [{ from: 0, text }];
    let out = text;
    for (const m of replacementOrder(findMatches(spans, 'gas'))) {
      out = out.slice(0, m.from) + 'LNG' + out.slice(m.to);
    }
    expect(out).toBe('LNG, LNG and more LNG');
  });

  it('front to front would corrupt it — the reason the order exists', () => {
    const text = 'gas, gas and more gas';
    const spans = [{ from: 0, text }];
    let out = text;
    // Deliberately wrong order, to pin why the right one matters.
    for (const m of findMatches(spans, 'gas')) {
      out = out.slice(0, m.from) + 'LNG supply' + out.slice(m.to);
    }
    expect(out).not.toBe('LNG supply, LNG supply and more LNG supply');
  });

  it('leaves the document untouched when nothing matches', () => {
    expect(replacementOrder(findMatches(SPANS, 'nothing here'))).toEqual([]);
  });
});

describe('flattenSpans', () => {
  it('concatenates the runs and records where each began', () => {
    const { text, map } = flattenSpans(SPANS);
    expect(text.startsWith('Petrobangla raised')).toBe(true);
    expect(map[0]).toEqual({ start: 0, from: 1 });
    expect(map[1].from).toBe(40);
  });
});
