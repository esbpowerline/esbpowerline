import { describe, expect, it } from 'vitest';
import { IMAGE_ALIGNMENTS, type ImageAlignment } from '@/components/editor/TipTapEditor';

/**
 * Doing nothing to an image must not be a choice of full-bleed.
 *
 * The editor's `align` attribute defaulted to `full`, and `parseHTML` read an
 * image with no alignment class as `full` too — so the default was applied
 * twice over: every newly inserted image was stamped `article-img--full`, and
 * so was every older image the moment its article was opened and saved. Both
 * pictures in "Bangladesh's Energy Security Under Pressure" were found
 * full-bleed for that reason on 2026-09-20, which is how this was noticed.
 *
 * The contract now: `default` carries no class, so the base `.article-body
 * img` rule governs — 68% of the column, 62vh tall. Full width is something
 * an editor asks for.
 */

/** Mirrors the extension's own parse: first recognised class wins. */
function alignFromClasses(classes: string[]): ImageAlignment {
  const byClass = new Map<string, ImageAlignment>(
    (Object.entries(IMAGE_ALIGNMENTS) as [ImageAlignment, string][])
      .filter(([, cls]) => cls !== '')
      .map(([align, cls]) => [cls, align]),
  );
  for (const cls of classes) {
    const found = byClass.get(cls);
    if (found) return found;
  }
  return 'default';
}

describe('body image alignment', () => {
  it('has a default that carries no class', () => {
    expect(IMAGE_ALIGNMENTS.default).toBe('');
  });

  it('reads an unclassed image as unaligned, not as full-bleed', () => {
    expect(alignFromClasses([])).toBe('default');
    // The shapes a pasted or previously-published image actually arrives in.
    expect(alignFromClasses(['some-editor-class'])).toBe('default');
    expect(alignFromClasses(['article-img--zoomable'])).toBe('default');
  });

  it('still reads every alignment an editor can choose', () => {
    expect(alignFromClasses(['article-img--full'])).toBe('full');
    expect(alignFromClasses(['article-img--left'])).toBe('left');
    expect(alignFromClasses(['article-img--center'])).toBe('center');
    expect(alignFromClasses(['article-img--right'])).toBe('right');
  });

  it('gives every non-default alignment a class of its own', () => {
    const named = Object.entries(IMAGE_ALIGNMENTS).filter(([k]) => k !== 'default');
    expect(named.length).toBeGreaterThan(0);
    for (const [, cls] of named) expect(cls).toMatch(/^article-img--/);
    expect(new Set(named.map(([, c]) => c)).size).toBe(named.length);
  });
});
