import { describe, expect, it } from 'vitest';
import { splitBodyForAd, AD_MIN_PARAGRAPHS } from '@/lib/article-ad-split';

/**
 * The article page and the CMS preview must break the body at the same place,
 * and that place must never be inside an element. The two halves are rendered
 * into separate containers, so a cut inside a table leaves an unclosed
 * `<table>` in one and an orphan `</table>` in the other.
 */

const p = (n: number) =>
  Array.from({ length: n }, (_, i) => `<p>Paragraph ${i + 1}.</p>`).join('');

/** A table whose cells contain paragraphs — the shape that broke the old rule. */
const TABLE = [
  '<table><thead><tr><th><p>Station</p></th><th><p>MW</p></th></tr></thead>',
  '<tbody>',
  '<tr><td><p>Bibiyana</p></td><td><p>341</p></td></tr>',
  '<tr><td><p>Ghorashal</p></td><td><p>210</p></td></tr>',
  '<tr><td><p>Sirajganj</p></td><td><p>225</p></td></tr>',
  '</tbody></table>',
].join('');

/** Both halves must parse as balanced markup for the tags we care about. */
function balanced(html: string, tag: string): boolean {
  const open = (html.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length;
  const close = (html.match(new RegExp(`</${tag}>`, 'g')) ?? []).length;
  return open === close;
}

const MARKER = '<div class="article-ad-slot"></div>';

describe('splitBodyForAd — the marker the editor placed', () => {
  it('breaks exactly where the marker sits, and consumes it', () => {
    const body = `${p(2)}${MARKER}${p(4)}`;
    const split = splitBodyForAd(body)!;
    expect(split.placed).toBe(true);
    expect(split.first).toBe(p(2));
    expect(split.second).toBe(p(4));
    // The reader must never see the instruction.
    expect(split.first + split.second).not.toContain('article-ad-slot');
  });

  it('honours a marker in a body too short for the automatic rule', () => {
    const body = `<p>only one</p>${MARKER}<p>and two</p>`;
    const split = splitBodyForAd(body)!;
    expect(split.placed).toBe(true);
    expect(split.second).toContain('and two');
  });

  it('falls back to the midpoint when the marker is at the very start or end', () => {
    for (const body of [`${MARKER}${p(6)}`, `${p(6)}${MARKER}`]) {
      const split = splitBodyForAd(body)!;
      expect(split.placed).toBe(false);
      expect(split.first + split.second).not.toContain('article-ad-slot');
    }
  });

  it('splits at the first marker and leaves none behind', () => {
    // A second marker would otherwise reach the page as an empty div.
    const body = `${p(2)}${MARKER}${p(2)}${MARKER}${p(2)}`;
    const split = splitBodyForAd(body)!;
    expect(split.placed).toBe(true);
    expect(split.first).toBe(p(2));
    expect(split.first + split.second).not.toContain('article-ad-slot');
  });

  it('still refuses to cut a table open when no marker is present', () => {
    const body = p(2) + TABLE + p(2);
    const split = splitBodyForAd(body)!;
    expect(split.placed).toBe(false);
    expect(balanced(split.first, 'table')).toBe(true);
    expect(balanced(split.second, 'table')).toBe(true);
  });
});

describe('splitBodyForAd', () => {
  it('declines to break a body under the minimum', () => {
    for (let n = 0; n < AD_MIN_PARAGRAPHS; n += 1) {
      expect(splitBodyForAd(p(n)), `${n} paragraphs`).toBeNull();
    }
  });

  it('breaks a body at exactly the minimum, as the page always has', () => {
    expect(splitBodyForAd(p(AD_MIN_PARAGRAPHS))).not.toBeNull();
  });

  it('breaks a long body once, losing nothing', () => {
    const body = p(8);
    const split = splitBodyForAd(body)!;
    expect(split.first + split.second).toBe(body);
    expect(split.first).toContain('Paragraph 1.');
    expect(split.second).toContain('Paragraph 8.');
  });

  it('never cuts a table open, even when one sits across the middle', () => {
    // Two paragraphs, a table, two paragraphs: the midpoint by paragraph count
    // lands inside the table, which is what used to break it.
    const body = p(2) + TABLE + p(2);
    const split = splitBodyForAd(body)!;
    expect(split.first + split.second).toBe(body);
    for (const tag of ['table', 'thead', 'tbody', 'tr', 'td', 'th']) {
      expect(balanced(split.first, tag), `first half ${tag}`).toBe(true);
      expect(balanced(split.second, tag), `second half ${tag}`).toBe(true);
    }
    // The table survives whole, on one side.
    const whole = split.first.includes(TABLE) || split.second.includes(TABLE);
    expect(whole).toBe(true);
  });

  it('moves the slot past a list or figure rather than into it', () => {
    const list = '<ul><li><p>one</p></li><li><p>two</p></li><li><p>three</p></li></ul>';
    const figure = '<figure><img src="/x.png" alt="x"><figcaption><p>caption</p></figcaption></figure>';
    for (const block of [list, figure]) {
      const body = p(1) + block + p(1);
      const split = splitBodyForAd(body);
      if (split) {
        expect(split.first + split.second).toBe(body);
        for (const tag of ['ul', 'li', 'figure', 'figcaption']) {
          expect(balanced(split.first, tag), `first ${tag}`).toBe(true);
          expect(balanced(split.second, tag), `second ${tag}`).toBe(true);
        }
      }
    }
  });

  it('puts the break near the middle of a plain body', () => {
    const split = splitBodyForAd(p(10))!;
    const before = (split.first.match(/<p>/g) ?? []).length;
    const after = (split.second.match(/<p>/g) ?? []).length;
    expect(Math.abs(before - after)).toBeLessThanOrEqual(2);
  });

  it('never puts the slot after all the content', () => {
    const split = splitBodyForAd(p(6))!;
    expect(split.second.trim()).not.toBe('');
  });

  it('declines a body that is one indivisible block', () => {
    // A single table is not an article to interrupt; there is nowhere to cut.
    expect(splitBodyForAd(TABLE)).toBeNull();
  });

  it('is stable for a body with no markup at all', () => {
    expect(splitBodyForAd('just text, no markup')).toBeNull();
  });

  it('does not let stray closing tags create a false boundary', () => {
    const body = `${p(2)}</div>${p(2)}`;
    const split = splitBodyForAd(body);
    if (split) expect(split.first + split.second).toBe(body);
  });
});
