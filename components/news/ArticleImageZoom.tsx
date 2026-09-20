'use client';

import { useEffect } from 'react';

/**
 * Click a picture to enlarge it **in the story**, not over it.
 *
 * The first attempt at this was a lightbox — an overlay covering the page.
 * That is the thing the feature exists to avoid: the reader wanted a closer
 * look without leaving the paragraph they were in, and a modal takes them out
 * of the piece exactly as opening a new tab did (rebuilt 2026-09-20).
 *
 * So the image grows where it sits. Pictures sit at a proportion of the column
 * by default, which is the size a story is read at; clicking opens one to the
 * full column and clicking again puts it back. The text reflows around it, the
 * scroll position is kept so the picture does not jump out from under the
 * pointer, and nothing is ever covered.
 *
 * Delegated from the article root, because the body arrives as
 * `dangerouslySetInnerHTML` and there is no React element per image to bind to.
 */

const EXPANDED = 'article-img--expanded';

/** An image inside a link belongs to that link — the ad, chiefly. */
function isZoomable(img: HTMLImageElement): boolean {
  return !img.closest('a');
}

export function ArticleImageZoom({ rootSelector = '.article-page-root' }: { rootSelector?: string }) {
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
      img.setAttribute('title', expanded ? 'Click to shrink' : 'Click to enlarge');
      const after = img.getBoundingClientRect().top;
      window.scrollBy({ top: after - before, behavior: 'instant' as ScrollBehavior });
    };

    const onClick = (event: Event) => {
      const img = (event.target as HTMLElement | null)?.closest('img') as HTMLImageElement | null;
      if (!img || !root.contains(img) || !isZoomable(img)) return;
      event.preventDefault();
      toggle(img);
    };

    // Enter and Space, because a click target a keyboard cannot reach is not
    // a control.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const img = document.activeElement as HTMLElement | null;
      if (!(img instanceof HTMLImageElement) || !root.contains(img) || !isZoomable(img)) return;
      event.preventDefault();
      toggle(img);
    };

    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [rootSelector]);

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
      img.setAttribute('title', 'Click to enlarge');
      touched.push(img);
    }
    return () => {
      for (const img of touched) {
        img.classList.remove('article-img--zoomable', EXPANDED);
        img.removeAttribute('role');
        img.removeAttribute('tabindex');
        img.removeAttribute('aria-expanded');
        img.removeAttribute('title');
      }
    };
  }, [rootSelector]);

  return null;
}
