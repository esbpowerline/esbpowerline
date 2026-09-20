/**
 * Where the in-article ad slot falls in an article body.
 *
 * The published page splits the sanitised body on `</p>` and drops the slot at
 * the midpoint. The CMS preview has to make the same cut or it answers the
 * wrong question: an editor looking at the preview could not see that a slot
 * lands in the middle of their copy, and the position moves as they write.
 *
 * One copy of the rule, because two would drift — the split lived only in the
 * page and the preview showed the body whole (2026-09-20).
 */

/**
 * Fewest paragraphs a body needs before it is broken in half: a short item is
 * not worth interrupting.
 *
 * Compared against the *segment* count, which is one more than the paragraph
 * count — `'<p>a</p><p>b</p>'.split('</p>')` leaves a trailing empty segment.
 * So `segments <= 3` is "fewer than three paragraphs", and a three-paragraph
 * body does get a slot. That off-by-one is the published page's long-standing
 * behaviour and is preserved deliberately; it is written down here because it
 * reads like a bug and is not.
 */
export const AD_MIN_PARAGRAPHS = 3;

export interface ArticleAdSplit {
  first: string;
  second: string;
}

/**
 * The two halves, or null when the body is too short to carry a slot.
 *
 * Takes the body as the page renders it — sanitised — so the paragraph count
 * is the one the reader gets, not the one the editor typed.
 */
export function splitBodyForAd(sanitizedHtml: string): ArticleAdSplit | null {
  const paragraphs = sanitizedHtml.split('</p>');
  if (paragraphs.length <= AD_MIN_PARAGRAPHS) return null;
  const middleIndex = Math.floor(paragraphs.length / 2);
  return {
    first: paragraphs.slice(0, middleIndex).join('</p>') + (middleIndex > 0 ? '</p>' : ''),
    second: paragraphs.slice(middleIndex).join('</p>'),
  };
}
