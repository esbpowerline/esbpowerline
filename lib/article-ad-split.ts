/**
 * Where the in-article ad slot falls in an article body.
 *
 * Two ways it can be decided, in this order:
 *
 * 1. **The editor placed it.** A marker inserted from the toolbar
 *    (`<div class="article-ad-slot">`) says exactly where the break belongs.
 *    The desk knows which paragraph the story can stand a break after; an
 *    automatic midpoint does not.
 * 2. **Otherwise, the midpoint**, as it always was.
 *
 * Either way the cut lands **between** top-level elements, because the page
 * renders the two halves into separate containers. Splitting the string on
 * `</p>` did not: the sanitiser allows `table`, `figure`, `ul`, `ol` and
 * `blockquote`, and a `<p>` inside a `<td>` is an equally good `</p>` to split
 * on. When the midpoint fell there the first half ended with an unclosed
 * `<table>` and the second opened with an orphan `</table>`, and the browser
 * repaired both into something that was not the table the desk wrote — on one
 * published article that silently dropped three of a five-row table
 * (2026-09-20).
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
 *
 * A marker the editor placed ignores this: if they asked for a break there,
 * the story is long enough for one.
 */
export const AD_MIN_PARAGRAPHS = 3;

/** The class the editor's marker carries. Shared with the TipTap node. */
export const AD_SLOT_CLASS = 'article-ad-slot';

/** Elements that never open a scope, so they must not change the depth. */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;

/** The marker as TipTap writes it, empty or self-closed, attributes in any order. */
const AD_MARKER_RE = new RegExp(
  `<div[^>]*class="[^"]*\\b${AD_SLOT_CLASS}\\b[^"]*"[^>]*>\\s*</div>|<div[^>]*class="[^"]*\\b${AD_SLOT_CLASS}\\b[^"]*"[^>]*/>`,
  'i',
);

/**
 * Remove every marker: it is an instruction, never content.
 *
 * Exported because a caller that gets `null` back — a body too short to carry
 * a slot, with a marker in it anyway — still has to render that body, and the
 * marker would reach the page as a stray empty div.
 */
export function stripAdSlotMarkers(html: string): string {
  return stripMarkers(html);
}

function stripMarkers(html: string): string {
  return html.replace(new RegExp(AD_MARKER_RE.source, 'gi'), '');
}

export interface ArticleAdSplit {
  first: string;
  second: string;
  /** True when the editor placed the break, false when it was chosen for them. */
  placed: boolean;
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
  // 1. An editor's marker wins, and is consumed: it is an instruction about
  //    layout, not something a reader should ever see.
  const marker = AD_MARKER_RE.exec(sanitizedHtml);
  if (marker) {
    // Every marker is stripped, not just the one we split on. The toolbar
    // disables itself once a slot exists, but pasted copy can carry another,
    // and a leftover marker renders on the page as an empty div.
    const first = stripMarkers(sanitizedHtml.slice(0, marker.index));
    const second = stripMarkers(sanitizedHtml.slice(marker.index + marker[0].length));
    // A marker dropped at the very top or bottom would put the ad outside the
    // story, which is not an in-article slot; fall through to the midpoint.
    if (first.trim() && second.trim()) return { first, second, placed: true };
  }

  const withoutMarker = stripMarkers(sanitizedHtml);
  const boundaries = topLevelBoundaries(withoutMarker);
  // The last boundary is the end of the body; cutting there puts the ad after
  // everything, which is not an in-article slot.
  const candidates = boundaries.filter((offset) => offset < withoutMarker.length);
  if (boundaries.length < AD_MIN_PARAGRAPHS || candidates.length === 0) return null;

  // Nearest the middle by block count, which is where the old rule aimed.
  const target = Math.floor(boundaries.length / 2);
  const chosen = candidates[Math.min(target, candidates.length) - 1] ?? candidates[0];

  const first = withoutMarker.slice(0, chosen);
  const second = withoutMarker.slice(chosen);
  if (!first.trim() || !second.trim()) return null;
  return { first, second, placed: false };
}
