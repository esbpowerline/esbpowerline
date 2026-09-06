'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface MagazineFlipBookProps {
  coverUrl: string;
  /**
   * Every page of the issue, in printed order. When empty the reader refuses to
   * open rather than showing stand-in artwork.
   */
  pages?: string[];
  /** Page index (0-based) to open at, so a thumbnail can jump straight there. */
  startPage?: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Reader for a full issue.
 *
 * This replaced a 3D sheet-flip mockup that was wired to eight hardcoded
 * `/images/INNER00N.jpg` files and could not show a real issue at all: the
 * demo issue is 48 pages. The flip animation is in git history if it is ever
 * wanted back, but it cannot display an actual magazine without being
 * generalised past the fixed z-index ladder it was built on.
 *
 * Pagination follows print convention: the cover stands alone on the right,
 * then even/odd spreads (2-3, 4-5 ...), and a final odd page stands alone.
 */
export function MagazineFlipBook({
  coverUrl,
  pages = [],
  startPage = 0,
  isOpen,
  onClose,
}: MagazineFlipBookProps) {
  const sheets = useMemo(() => {
    if (pages.length === 0) return [] as Array<[string | null, string | null]>;
    const out: Array<[string | null, string | null]> = [[null, pages[0]]];
    for (let i = 1; i < pages.length; i += 2) {
      out.push([pages[i] ?? null, pages[i + 1] ?? null]);
    }
    return out;
  }, [pages]);

  /** Which spread contains a given 0-based page index. */
  const sheetForPage = useCallback((page: number) => (page <= 0 ? 0 : Math.floor((page - 1) / 2) + 1), []);

  const [sheet, setSheet] = useState(0);

  useEffect(() => {
    if (isOpen) setSheet(Math.min(sheetForPage(startPage), Math.max(sheets.length - 1, 0)));
  }, [isOpen, startPage, sheetForPage, sheets.length]);

  const next = useCallback(() => setSheet((s) => Math.min(s + 1, sheets.length - 1)), [sheets.length]);
  const prev = useCallback(() => setSheet((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    if (!isOpen) return;

    // Scroll lock + hide the sticky public nav. Preserved from the original
    // component: without it the page behind scrolls under the overlay.
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';

    const navBar = document.querySelector('.public-nav-bar') as HTMLElement | null;
    if (navBar) navBar.style.display = 'none';

    const preventDefault = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      if (navBar) navBar.style.display = '';
      window.removeEventListener('wheel', preventDefault);
      window.removeEventListener('touchmove', preventDefault);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, next, prev]);

  if (!isOpen) return null;

  // No pages means no issue to read. Saying so beats rendering placeholder art.
  if (sheets.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
        <div className="text-center text-zinc-300 max-w-sm">
          <BookOpen className="h-8 w-8 mx-auto mb-4 text-primary" />
          <p className="text-sm">This issue has no page images available to read.</p>
          <button onClick={onClose} className="btn btn-primary mt-6 px-6">Close</button>
        </div>
      </div>
    );
  }

  const [left, right] = sheets[sheet];
  const leftNo = sheet === 0 ? null : sheet * 2;
  const rightNo = sheet === 0 ? 1 : sheet * 2 + 1;

  const label =
    sheet === 0
      ? 'Cover'
      : right
        ? `Pages ${leftNo}–${rightNo}`
        : `Page ${leftNo}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-300 p-4 md:p-6 select-none overflow-hidden">
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 text-white text-xs font-semibold">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span>Interactive Preview</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors duration-200"
          aria-label="Close interactive reader"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative w-full max-w-5xl flex flex-col items-center justify-center z-10">

        {/* Desktop: two-page spread */}
        <div className="hidden md:flex items-stretch justify-center gap-0 shadow-2xl">
          <div className="relative w-[380px] aspect-[587/803] bg-[#161616] border-y border-l border-white/10 rounded-l-2xl overflow-hidden">
            {left ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={left} alt={`Page ${leftNo}`} className="w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <div className="text-xl font-bold uppercase tracking-widest mb-1 text-primary">ESB PowerLine</div>
                <div className="text-xs uppercase tracking-[2px] font-semibold">Energy &amp; Power Portal</div>
              </div>
            )}
            <button onClick={prev} className="absolute inset-0 cursor-w-resize" aria-label="Previous page" />
          </div>

          <div className="relative w-[380px] aspect-[587/803] bg-[#161616] border-y border-r border-white/10 rounded-r-2xl overflow-hidden">
            {right ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={right} alt={`Page ${rightNo}`} className="w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-xs uppercase tracking-widest">
                End of issue
              </div>
            )}
            <button onClick={next} className="absolute inset-0 cursor-e-resize" aria-label="Next page" />
          </div>
        </div>

        {/* Mobile: one page at a time */}
        <div className="flex md:hidden relative w-[290px] aspect-[587/803] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={right ?? left ?? coverUrl}
            alt={`Page ${right ? rightNo : leftNo}`}
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
            {label} of {pages.length}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            <button
              onClick={prev}
              disabled={sheet === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <span className="text-white text-sm font-medium tracking-wide tabular-nums">
              {label} <span className="text-zinc-500">of {pages.length}</span>
            </span>

            <button
              onClick={next}
              disabled={sheet >= sheets.length - 1}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next Page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <p className="text-zinc-400 text-xs mt-2 text-center max-w-sm hidden md:block">
            Click the right page to go forward, the left page to go back, or use the arrow keys.
          </p>
        </div>
      </div>
    </div>
  );
}
