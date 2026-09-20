/**
 * Find and replace across a story body.
 *
 * The one thing every writer expects from a word processor and the editor did
 * not have. On a 1,500-word piece the only way to change a name, a spelling or
 * a unit everywhere was to read the whole thing and hope.
 *
 * The position arithmetic lives here, away from the editor, because it is the
 * part that can silently corrupt a document: a replacement changes the length
 * of the text after it, so applying matches front to back shifts every later
 * range out from under itself. Pure functions over a string and a position
 * map, so the rules can be tested without a browser or a ProseMirror document.
 */

export interface TextSpan {
  /** Document position where this run of text starts. */
  from: number;
  /** The text itself. */
  text: string;
}

export interface MatchRange {
  from: number;
  to: number;
}

export interface FindOptions {
  caseSensitive?: boolean;
  /** Match only whole words, as Word's "Find whole words only" does. */
  wholeWord?: boolean;
}

/**
 * Concatenate the document's text runs and remember where each one began, so a
 * match found in the flat string can be mapped back to document positions.
 */
export function flattenSpans(spans: TextSpan[]): { text: string; map: { start: number; from: number }[] } {
  let text = '';
  const map: { start: number; from: number }[] = [];
  for (const span of spans) {
    map.push({ start: text.length, from: span.from });
    text += span.text;
  }
  return { text, map };
}

/** The document position for an offset into the flattened text. */
function toDocPosition(offset: number, map: { start: number; from: number }[], text: string): number {
  let chosen = map[0];
  for (const entry of map) {
    if (entry.start <= offset) chosen = entry;
    else break;
  }
  if (!chosen) return offset;
  return chosen.from + (offset - chosen.start);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Every match of `query`, as document ranges, in document order.
 *
 * A match that straddles two text runs is skipped rather than guessed at:
 * runs are split by marks and nodes, so a "match" across the boundary of a
 * bold word and the paragraph after it is not one string in the document and
 * replacing it would fuse two nodes.
 */
export function findMatches(spans: TextSpan[], query: string, options: FindOptions = {}): MatchRange[] {
  if (!query) return [];
  const { caseSensitive = false, wholeWord = false } = options;
  const out: MatchRange[] = [];

  for (const span of spans) {
    const pattern = wholeWord ? `(?<![\\p{L}\\d])${escapeRe(query)}(?![\\p{L}\\d])` : escapeRe(query);
    const re = new RegExp(pattern, caseSensitive ? 'gu' : 'giu');
    let m: RegExpExecArray | null;
    while ((m = re.exec(span.text)) !== null) {
      out.push({ from: span.from + m.index, to: span.from + m.index + m[0].length });
      // A zero-length match would spin forever.
      if (m[0].length === 0) re.lastIndex += 1;
    }
  }

  return out.sort((a, b) => a.from - b.from);
}

/**
 * The match to jump to next, given where the cursor is.
 *
 * Wraps to the first match, which is what a reader expects and what every
 * word processor does; returns null only when there is nothing to find.
 */
export function nextMatch(matches: MatchRange[], cursor: number): MatchRange | null {
  if (matches.length === 0) return null;
  return matches.find((m) => m.from >= cursor) ?? matches[0];
}

/**
 * Ranges to replace, ordered back to front.
 *
 * Applying them in this order is the whole point: each replacement changes the
 * length of everything after it, so front-to-back would leave every later
 * range pointing at the wrong text. Back to front, no range is disturbed
 * before it is used.
 */
export function replacementOrder(matches: MatchRange[]): MatchRange[] {
  return [...matches].sort((a, b) => b.from - a.from);
}
