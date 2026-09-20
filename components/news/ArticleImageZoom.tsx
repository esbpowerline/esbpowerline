'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * Click a picture to enlarge it **in the story**, not over it.
 *
 * The first attempt at this was a lightbox — an overlay covering the page.
 * That is the thing the feature exists to avoid: the reader wanted a closer
 * look without leaving the paragraph they were in, and a modal takes them out
 * of the piece exactly as opening a new tab did (rebuilt 2026-09-20).
 *
 * So the image grows where it sits. Pictures sit at a proportion of the column
 * by default; clicking opens one as large as the screen usefully allows and
 * clicking again puts it back. The text reflows around it, the scroll position
 * is kept so the picture does not jump out from under the pointer, and nothing
 * is ever covered.
 *
 * Delegated from the article root, because the body arrives as
 * `dangerouslySetInnerHTML` and there is no React element per image to bind to.
 */

const EXPANDED = 'article-img--expanded';

/** An image inside a link belongs to that link — the ad, chiefly. */
function isZoomable(img: HTMLImageElement): boolean {
  return !img.closest('a');
}

interface Hint {
  top: number;
  left: number;
  expanded: boolean;
}

export function ArticleImageZoom({ rootSelector = '.article-page-root' }: { rootSelector?: string }) {
  /**
   * The hint is rendered, not a `title` attribute.
   *
   * `title` draws the operating system's own tooltip: a grey box in a font
   * that belongs to no site, after a delay nobody chose. This is the same
   * pill the rest of the site uses, and it appears where the pointer is.
   */
  const [hint, setHint] = useState<Hint | null>(null);

  const place = useCallback((img: HTMLImageElement) => {
    const r = img.getBoundingClientRect();
    setHint({
      top: r.top + window.scrollY + 12,
      left: r.left + window.scrollX + 12,
      expanded: img.classList.contains(EXPANDED),
    });
  }, []);

  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const toggle = (img: HTMLImageElement) => {
      // Where the picture sits relative to the viewport, so the same point
      // stays put once it changes size. Without this an image near the top of
      // the screen shoves the rest of the story down as it grows.
      const before = img.getBoundingClientRect().top;
      const expanded = img.classList.toggle(EXPANDED);
      img.setAttribute('aria-expanded', String(expanded));
      const after = img.getBoundingClientRect().top;
      window.scrollBy({ top: after - before, behavior: 'instant' as ScrollBehavior });
      place(img);
    };

    const imageUnder = (target: EventTarget | null): HTMLImageElement | null => {
      const img = (target as HTMLElement | null)?.closest('img') as HTMLImageElement | null;
      if (!img || !root.contains(img) || !isZoomable(img)) return null;
      return img;
    };

    const onClick = (event: Event) => {
      const img = imageUnder(event.target);
      if (!img) return;
      event.preventDefault();
      toggle(img);
    };

    const onOver = (event: Event) => {
      const img = imageUnder(event.target);
      if (img) place(img);
      else setHint(null);
    };

    const onOut = (event: Event) => {
      const to = (event as MouseEvent).relatedTarget as HTMLElement | null;
      if (!to || !imageUnder(to)) setHint(null);
    };

    // Enter and Space, because a click target a keyboard cannot reach is not
    // a control.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const img = document.activeElement;
      if (!(img instanceof HTMLImageElement) || !root.contains(img) || !isZoomable(img)) return;
      event.preventDefault();
      toggle(img);
    };

    root.addEventListener('click', onClick);
    root.addEventListener('mouseover', onOver);
    root.addEventListener('mouseout', onOut);
    window.addEventListener('scroll', () => setHint(null), { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('click', onClick);
      root.removeEventListener('mouseover', onOver);
      root.removeEventListener('mouseout', onOut);
      document.removeEventListener('keydown', onKey);
    };
  }, [rootSelector, place]);

  // Announce each picture as something you can open, and let a keyboard reach it.
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    const touched: HTMLImageElement[] = [];
    for (const img of [...root.querySelectorAll('img')] as HTMLImageElement[]) {
      if (!isZoomable(img)) continue;
      img.classList.add('article-img--zoomable');
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      img.setAttribute('aria-expanded', 'false');
      touched.push(img);
    }
    return () => {
      for (const img of touched) {
        img.classList.remove('article-img--zoomable', EXPANDED);
        img.removeAttribute('role');
        img.removeAttribute('tabindex');
        img.removeAttribute('aria-expanded');
      }
    };
  }, [rootSelector]);

  if (!hint || typeof document === 'undefined') return null;

  return createPortal(
    <span className="article-img-hint" style={{ top: hint.top, left: hint.left }} aria-hidden>
      {hint.expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
      {hint.expanded ? 'Click to shrink' : 'Click to enlarge'}
    </span>,
    document.body,
  );
}
