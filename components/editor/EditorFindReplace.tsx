'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { X, ArrowDown, Replace, ReplaceAll, CaseSensitive, WholeWord } from 'lucide-react';
import {
  findMatches,
  nextMatch,
  replacementOrder,
  type MatchRange,
  type TextSpan,
} from '@/lib/editor-find-replace';

/**
 * Find and replace, the way a word processor does it.
 *
 * On a 1,500-word story the only way to change a name or a unit everywhere was
 * to read the whole piece and hope. The arithmetic lives in
 * `lib/editor-find-replace.ts`, tested on its own; this is the panel and the
 * transactions.
 *
 * Replace-all is a single transaction, so it is one step on the undo stack:
 * a writer who changes their mind gets their story back with one Ctrl-Z
 * rather than eleven.
 */

/** Every text run in the document, with the position it starts at. */
function textSpans(editor: Editor): TextSpan[] {
  const spans: TextSpan[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text) spans.push({ from: pos, text: node.text });
    return true;
  });
  return spans;
}

export function EditorFindReplace({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  // Bumped after every edit so the match list is recomputed against the new doc.
  const [revision, setRevision] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const matches: MatchRange[] = useMemo(
    () => findMatches(textSpans(editor), query, { caseSensitive, wholeWord }),
    // `revision` is the dependency that matters: the doc is mutable and is not
    // itself a valid dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, query, caseSensitive, wholeWord, revision],
  );

  const goToNext = useCallback(() => {
    const target = nextMatch(matches, editor.state.selection.to);
    if (!target) return;
    editor.chain().focus().setTextSelection({ from: target.from, to: target.to }).scrollIntoView().run();
  }, [editor, matches]);

  const replaceCurrent = useCallback(() => {
    const { from, to } = editor.state.selection;
    const onMatch = matches.some((m) => m.from === from && m.to === to);
    if (!onMatch) {
      goToNext();
      return;
    }
    editor.chain().focus().insertContentAt({ from, to }, replacement).run();
    setRevision((r) => r + 1);
  }, [editor, matches, replacement, goToNext]);

  const replaceAll = useCallback(() => {
    if (matches.length === 0) return;
    // One transaction, back to front: each edit shifts everything after it, so
    // front-to-back would land later replacements on the wrong text.
    const chain = editor.chain().focus();
    for (const m of replacementOrder(matches)) {
      chain.insertContentAt({ from: m.from, to: m.to }, replacement);
    }
    chain.run();
    setRevision((r) => r + 1);
  }, [editor, matches, replacement]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      goToNext();
    }
  };

  return (
    <div className="cms-find-replace" role="search" aria-label="Find and replace" onKeyDown={onKeyDown}>
      <div className="cms-find-replace__row">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find in story…"
          aria-label="Find"
          className="cms-find-replace__input"
        />
        <span className="cms-find-replace__count" aria-live="polite">
          {query ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}` : ''}
        </span>
        <button
          type="button"
          onClick={() => setCaseSensitive((v) => !v)}
          aria-pressed={caseSensitive}
          title="Match case"
          className={`cms-find-replace__toggle${caseSensitive ? ' is-on' : ''}`}
        >
          <CaseSensitive className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setWholeWord((v) => !v)}
          aria-pressed={wholeWord}
          title="Whole words only"
          className={`cms-find-replace__toggle${wholeWord ? ' is-on' : ''}`}
        >
          <WholeWord className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={goToNext} disabled={!matches.length} title="Find next" className="cms-find-replace__btn">
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onClose} title="Close" className="cms-find-replace__btn">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="cms-find-replace__row">
        <input
          type="text"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder="Replace with…"
          aria-label="Replace with"
          className="cms-find-replace__input"
        />
        <button type="button" onClick={replaceCurrent} disabled={!matches.length} className="cms-find-replace__action">
          <Replace className="h-3.5 w-3.5" /> Replace
        </button>
        <button type="button" onClick={replaceAll} disabled={!matches.length} className="cms-find-replace__action">
          <ReplaceAll className="h-3.5 w-3.5" /> All
        </button>
      </div>
    </div>
  );
}
