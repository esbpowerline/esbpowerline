'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Click a picture in a story, see it whole, stay on the page.
 *
 * A reader who wants a closer look at a chart or a plant photo had two
 * choices: squint, or open the image in a new tab and lose their place. On a
 * site whose pictures are frequently tables and charts photographed from a
 * report, that is the difference between reading the evidence and taking our
 * word for it.
 *
 * Delegated rather than per-image: the body arrives as
 * `dangerouslySetInnerHTML`, so there is no React element to hang a handler
 * on. One listener on the article root catches both the hero and every body
 * image, and keeps working when the body changes.
 *
 * Deliberately not made into a gallery. One image, one step; a next/previous
 * pair would imply an ordering the desk never authored.
 */

interface Shot {
  src: string;
  alt: string;
  caption: string | null;
}

/** An image inside a link is that link's business — the ad, chiefly. */
function isClickable(img: HTMLImageElement): boolean {
  return !img.closest('a');
}

function captionFor(img: HTMLImageElement): string | null {
  const figure = img.closest('figure');
  const cap = figure?.querySelector('figcaption')?.textContent?.trim();
  if (cap) return cap;
  const credit = figure?.querySelector('.image-credit-overlay')?.textContent?.trim();
  return credit || null;
}

export function ArticleImageLightbox({ rootSelector = '.article-page-root' }: { rootSelector?: string }) {
  const [shot, setShot] = useState<Shot | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<Element | null>(null);

  const close = useCallback(() => {
    setShot(null);
    // Put the reader back where they were, not at the top of the document.
    if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
  }, []);

  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const img = target?.closest('img') as HTMLImageElement | null;
      if (!img || !root.contains(img)) return;
      if (!isClickable(img)) return;
      // `currentSrc` is the candidate the browser actually chose, so the
      // enlarged view is not a different file from the one on the page.
      const src = img.currentSrc || img.src;
      if (!src) return;
      event.preventDefault();
      lastFocused.current = document.activeElement;
      setShot({ src, alt: img.alt || '', caption: captionFor(img) });
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [rootSelector]);

  // Mark the images so they look clickable, and say so to a screen reader.
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    const imgs = [...root.querySelectorAll('img')] as HTMLImageElement[];
    const touched: HTMLImageElement[] = [];
    for (const img of imgs) {
      if (!isClickable(img)) continue;
      img.classList.add('article-image--zoomable');
      touched.push(img);
    }
    return () => touched.forEach((i) => i.classList.remove('article-image--zoomable'));
  }, [rootSelector]);

  useEffect(() => {
    if (!shot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    // Stop the page scrolling behind the overlay.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [shot, close]);

  if (!shot || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="article-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt || 'Enlarged image'}
      onClick={close}
    >
      <button ref={closeRef} type="button" className="article-lightbox__close" onClick={close} aria-label="Close image">
        <X className="h-5 w-5" />
      </button>
      <figure className="article-lightbox__figure" onClick={(e) => e.stopPropagation()}>
        {/* A plain img, not next/image: the source is whatever the page already
            loaded, frequently an optimizer URL, and re-optimising an optimized
            URL is both wasteful and occasionally lossy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shot.src} alt={shot.alt} className="article-lightbox__img" />
        {shot.caption && <figcaption className="article-lightbox__caption">{shot.caption}</figcaption>}
      </figure>
    </div>,
    document.body,
  );
}
