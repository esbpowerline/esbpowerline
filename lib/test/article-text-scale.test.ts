import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every type size inside the article body must take the reader's multiplier.
 *
 * `ArticleTextSize` sets `--article-text-scale` on `.article-page-root`, and
 * the fluid type rules in section 4 of globals.css multiply their clamps by
 * it. A rule that sets a size and forgets the multiplier does not fail — it
 * simply sits still while everything around it moves, which reads as a bug in
 * the control rather than in the rule.
 *
 * It has happened twice. `.article-body table` was a flat `0.875rem`, so a
 * table held exactly 14px through all four steps while the paragraph beside
 * it went 17.10 -> 24.70 (measured at 1536 on 2026-09-20); figcaption had its
 * own clamp with the same omission. Both are fixed; this stops the third.
 */

const CSS = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

/** Section 4 — the block that owns article body type. */
function articleTypeBlock(): string {
  const start = CSS.indexOf('/* 4. Body Content Proportional Scaling');
  const end = CSS.indexOf('/* 5. Fluid Spacing between Header elements */', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return CSS.slice(start, end);
}

/**
 * Every `font-size` in the block, paired with the selector that set it.
 *
 * The declaration is isolated deliberately. Checking the whole rule body for
 * the variable passes a rule whose font-size forgot it but whose margin still
 * carries it — which is exactly the shape of the bug being guarded against,
 * and this test let that regression through on its first run.
 */
function fontSizes(block: string): { selector: string; value: string }[] {
  const out: { selector: string; value: string }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    // Strip any comment that ran up to the selector.
    const selector = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!selector) continue;
    for (const decl of m[2].split(';')) {
      const [prop, ...rest] = decl.split(':');
      if (prop.trim() === 'font-size') out.push({ selector, value: rest.join(':') });
    }
  }
  return out;
}

describe('reader text scale', () => {
  it('is applied to every font-size in the article body type block', () => {
    const found = fontSizes(articleTypeBlock());
    // Guard the guard: a parser that finds nothing would pass vacuously.
    expect(found.length).toBeGreaterThan(5);

    const missing = found
      // `inherit` and `1em` defer to an ancestor that is already scaled —
      // table cells take the table's size this way — so they satisfy the
      // rule without naming the variable. Any other literal does not.
      .filter((r) => !/^\s*(inherit|1em)\s*(!important)?\s*$/.test(r.value))
      .filter((r) => !r.value.includes('--article-text-scale'))
      .map((r) => `${r.selector} -> font-size:${r.value.trim()}`);

    expect(missing).toEqual([]);
  });

  it('covers the elements a story is actually made of', () => {
    const block = articleTypeBlock();
    // Not an exhaustive list — the guard above is. These are the ones that
    // carry the text a reader came for, and the two that were missed.
    for (const el of ['p', 'h2', 'h3', 'li', 'table']) {
      expect(
        block.includes(`.fluid-article-container .article-body ${el} {`) ||
          block.includes(`.fluid-article-container .article-body ${el},`),
      ).toBe(true);
    }
    expect(block).toContain('.fluid-article-container figcaption {');
  });

  it('leaves the article untouched when no choice has been made', () => {
    // Every use must carry the `, 1` fallback: an unset variable in a bare
    // calc() invalidates the whole declaration, which would drop the size
    // rather than default it.
    const uses = articleTypeBlock().match(/var\(--article-text-scale[^)]*\)/g) ?? [];
    expect(uses.length).toBeGreaterThan(5);
    for (const use of uses) expect(use).toBe('var(--article-text-scale, 1)');
  });
});
