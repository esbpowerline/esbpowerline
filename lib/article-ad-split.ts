/**
 * Where the in-article ad slot falls in an article body.
 *
 * The published page renders the two halves into separate containers, so the
 * cut has to land **between** top-level elements. Splitting the string on
 * `</p>` did not: the sanitiser allows `table`, `figure`, `ul`, `ol` and
 * `blockquote` (`sanitize-article-html.ts`), and a `<p>` inside a `<td>` is an
 * equally good `</p>` to split on. When the midpoint fell there the first half
 * ended with an unclosed `<table>` and the second opened with an orphan
 * `</table>`, and the browser repaired both into something that was not the
 * table the desk wrote (reported 2026-09-20).
 *
 * So the slot moves instead. This walks the markup tracking nesting depth,
 * collects the offsets where depth returns to zero — the only places a cut is
 * safe — and takes the one nearest the middle. A table, list or figure sitting
 * across the midpoint pushes the ad to whichever side is closer; it is never
 * cut open.
 *
 * One copy of the rule: the page and the CMS preview both call this, so the
 * preview shows the editor the break the reader will get.
 */

/**
 * Fewest top-level blocks a body needs before it is broken in half: a short
 * item is not worth interrupting.
 *
 * Three, which is what the old `</p>`-counting rule worked out to — it
 * compared a segment count that is one greater than the paragraph count,
 * because `'<p>a</p>'.split('</p>')` leaves a trailing empty segment. A
 * three-paragraph body has always carried a slot, and still does.
 */
export const AD_MIN_PARAGRAPHS = 3;

/** Elements that never open a scope, so they must not change the depth. */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;

export interface ArticleAdSplit {
  first: string;
  second: string;
}

/**
 * Offsets at which the markup can be cut without orphaning a tag: immediately
 * after every top-level element closes.
 */
function topLevelBoundaries(html: string): number[] {
  const boundaries: number[] = [];
  let depth = 0;
  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(html)) !== null) {
    const [full, closing, rawName, selfClosing] = match;
    const name = rawName.toLowerCase();
    if (VOID_TAGS.has(name) || selfClosing === '/') continue;
    if (closing === '/') {
      depth -= 1;
      // Never let malformed markup drive the depth negative: an unmatched
      // closing tag would otherwise make every later offset look top-level.
      if (depth <= 0) {
        depth = 0;
        boundaries.push(match.index + full.length);
      }
    } else {
      depth += 1;
    }
  }
  return boundaries;
}

/**
 * The two halves, or null when the body is too short to carry a slot or has
 * nowhere safe to put one.
 *
 * Takes the body as the page renders it — sanitised — so the structure counted
 * here is the structure the reader gets.
 */
export function splitBodyForAd(sanitizedHtml: string): ArticleAdSplit | null {
  const boundaries = topLevelBoundaries(sanitizedHtml);
  // The last boundary is the end of the body; cutting there puts the ad after
  // everything, which is not an in-article slot.
  const candidates = boundaries.filter((offset) => offset < sanitizedHtml.length);
  if (boundaries.length < AD_MIN_PARAGRAPHS || candidates.length === 0) return null;

  // Nearest the middle by block count, which is where the old rule aimed.
  const target = Math.floor(boundaries.length / 2);
  const chosen = candidates[Math.min(target, candidates.length) - 1] ?? candidates[0];

  const first = sanitizedHtml.slice(0, chosen);
  const second = sanitizedHtml.slice(chosen);
  if (!first.trim() || !second.trim()) return null;
  return { first, second };
}
