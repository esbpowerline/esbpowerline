'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
} from 'lucide-react';
import { playPageTurn, primePageTurnAudio } from './page-turn-sound';

interface MagazineFlipBookProps {
  /**
   * Every page of the issue, in printed order. When empty the reader refuses to
   * open rather than showing stand-in artwork.
   */
  pages?: string[];
  /** Small renders of the same pages, for the thumbnail strip. */
  thumbs?: string[];
  /** Page index (0-based) to open at, so a thumbnail can jump straight there. */
  startPage?: number;
  isOpen: boolean;
  onClose: () => void;
  /** Shown in the reader's title bar. */
  title?: string;
  issueLabel?: string;
}

/** Must match --flip-dur in globals.css. */
const FLIP_MS = 720;
const MUTE_KEY = 'esb.magazine.muted';
const ZOOM_STEPS = [1, 1.65, 2.5];

type Turn = { dir: 'next' | 'prev'; from: number; to: number };
type View = [string | null, string | null];

/**
 * Reader for a full issue.
 *
 * This replaced a 3D sheet-flip mockup that was wired to eight hardcoded
 * `/images/INNER00N.jpg` files and could not show a real issue at all: the
 * demo issue is 48 pages.
 *
 * The 2026-09-06 rebuild put the turn back, properly this time:
 *
 * - **A spread that fills the viewport.** It was two fixed 380px boxes, so a
 *   48-page magazine was read through a window barely wider than a paperback on
 *   a 27" screen. The stage is sized by aspect-ratio against whatever space the
 *   browser has and takes all of it.
 * - **A real page turn.** A double-sided leaf rotates about the spine — front
 *   face the page being left, back face the page arriving, both painted before
 *   it starts moving, with shading sweeping across as it goes. The spread
 *   underneath is already the destination, so the leaf lands on a page that is
 *   in place rather than triggering a second paint at the end.
 * - **Sound.** Synthesised, not sampled — see ./page-turn-sound.ts. Muting is
 *   remembered across sessions.
 * - **Every page reachable on a phone.** The old mobile branch rendered
 *   `right ?? left`, i.e. only the right half of each spread, so pages 2, 4,
 *   6 … could not be opened at all on a narrow screen. Narrow viewports now get
 *   a genuine one-page-at-a-time mode over the full page list.
 *
 * Pagination follows print convention: the cover stands alone on the right,
 * then even/odd spreads (2-3, 4-5 ...), and a final odd page stands alone.
 */
export function MagazineFlipBook({
  pages = [],
  thumbs = [],
  startPage = 0,
  isOpen,
  onClose,
  title,
  issueLabel,
}: MagazineFlipBookProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  /**
   * The reader is portalled to <body>.
   *
   * It used to render where it sits in the tree, inside MagazinePageClient's
   * `relative z-10` wrapper — and `z-index: 10` on a positioned element opens a
   * stacking context, so the reader's own `z-index: 200` was only 200 *within*
   * that box. The site's fixed commodities strip (`.public-market-strip`,
   * z-index 50, a sibling of the whole page) therefore painted straight over
   * the reader's controls at the bottom of the screen. A fullscreen modal has
   * no business being ranked inside the layout it covers.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // A phone cannot show a legible two-page spread; below this it reads one page
  // at a time. Tracked live so a rotation re-lays-out rather than stranding the
  // reader in a mode the screen cannot carry.
  const [single, setSingle] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px), (max-aspect-ratio: 3/4)');
    const apply = () => setSingle(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  /** Each entry is what the two halves of the stage show. */
  const views = useMemo<View[]>(() => {
    if (pages.length === 0) return [];
    if (single) return pages.map((p) => [null, p] as View);
    const out: View[] = [[null, pages[0]]];
    for (let i = 1; i < pages.length; i += 2) out.push([pages[i] ?? null, pages[i + 1] ?? null]);
    return out;
  }, [pages, single]);

  /** Which view contains a given 0-based page index. */
  const viewForPage = useCallback(
    (page: number) => {
      if (single) return Math.max(0, Math.min(page, Math.max(pages.length - 1, 0)));
      return page <= 0 ? 0 : Math.floor((page - 1) / 2) + 1;
    },
    [single, pages.length],
  );

  /** The 0-based index of the first page a view shows. */
  const firstPageOfView = useCallback((v: number) => (single ? v : v === 0 ? 0 : v * 2 - 1), [single]);

  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const turning = useRef(false);

  const [muted, setMuted] = useState(false);
  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(MUTE_KEY) === '1');
    } catch {
      /* private mode: default to audible, which is the intended experience */
    }
  }, []);
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      try {
        window.localStorage.setItem(MUTE_KEY, m ? '0' : '1');
      } catch {
        /* nothing to persist to; the toggle still works for this session */
      }
      return !m;
    });
  }, []);

  const [zoom, setZoom] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showThumbs, setShowThumbs] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scale = ZOOM_STEPS[zoom];

  /* ---------------------------------------------------------------- turning */

  const go = useCallback(
    (delta: number) => {
      if (turning.current) return;
      const to = index + delta;
      if (to < 0 || to >= views.length) return;

      if (!muted) playPageTurn(1, delta < 0);
      // Zoom is per-spread: staying magnified across a turn lands the reader in
      // the middle of a page whose shape they have not seen.
      setZoom(0);
      setPan({ x: 0, y: 0 });

      if (reduceMotion) {
        setIndex(to);
        return;
      }
      turning.current = true;
      setTurn({ dir: delta > 0 ? 'next' : 'prev', from: index, to });
    },
    [index, views.length, muted, reduceMotion],
  );

  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);

  const jumpTo = useCallback(
    (view: number) => {
      if (turning.current || view === index) return;
      if (view < 0 || view >= views.length) return;
      if (!muted) playPageTurn(1, view < index);
      setZoom(0);
      setPan({ x: 0, y: 0 });
      setIndex(view);
    },
    [index, views.length, muted],
  );

  // Commit the turn when the animation finishes. The leaf covers the halves it
  // is moving between, so the swap underneath it is invisible.
  useEffect(() => {
    if (!turn) return;
    const id = window.setTimeout(() => {
      setIndex(turn.to);
      setTurn(null);
      turning.current = false;
    }, FLIP_MS);
    return () => window.clearTimeout(id);
  }, [turn]);

  /* ------------------------------------------------------------ open/close */

  const pageRef = useRef(0);
  useEffect(() => {
    if (!isOpen) return;
    pageRef.current = startPage;
    setIndex(viewForPage(startPage));
    setTurn(null);
    turning.current = false;
    setZoom(0);
    setPan({ x: 0, y: 0 });
    primePageTurnAudio();
    // viewForPage is deliberately out of the deps: a mode change is handled by
    // the effect below, which must not reset the reader back to startPage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, startPage]);

  useEffect(() => {
    pageRef.current = firstPageOfView(index);
  }, [index, firstPageOfView]);

  // Rotating a phone changes mode; hold the reader's place across it.
  useEffect(() => {
    if (!isOpen) return;
    setIndex(viewForPage(pageRef.current));
    setTurn(null);
    turning.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [single]);

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

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      if (navBar) navBar.style.display = '';
      window.removeEventListener('wheel', preventDefault);
      window.removeEventListener('touchmove', preventDefault);
    };
  }, [isOpen]);

  /* --------------------------------------------------------------- controls */

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void el.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          // In fullscreen the browser consumes Escape to exit; closing as well
          // would drop the reader on a single press.
          if (document.fullscreenElement) return;
          onClose();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          jumpTo(0);
          break;
        case 'End':
          jumpTo(views.length - 1);
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 't':
        case 'T':
          setShowThumbs((s) => !s);
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, next, prev, jumpTo, views.length, toggleMute, toggleFullscreen]);

  // Swipe. Only horizontal intent counts, so a vertical drag does not also turn
  // the page.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start || scale > 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (dx < 0) next();
    else prev();
  };

  // Drag to pan, once magnified.
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (scale === 1) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // Keep the neighbours decoded, so a turn never reveals a half-loaded page.
  useEffect(() => {
    if (!isOpen) return;
    const wanted = [index - 1, index + 1, index + 2]
      .filter((i) => i >= 0 && i < views.length)
      .flatMap((i) => views[i])
      .filter((src): src is string => Boolean(src));
    for (const src of wanted) {
      const img = new window.Image();
      img.src = src;
    }
  }, [index, views, isOpen]);

  if (!isOpen || !mounted) return null;

  // No pages means no issue to read. Saying so beats rendering placeholder art.
  if (views.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
        <div className="text-center text-zinc-300 max-w-sm">
          <BookOpen className="h-8 w-8 mx-auto mb-4 text-primary" />
          <p className="text-sm">This issue has no page images available to read.</p>
          <button onClick={onClose} className="btn btn-primary mt-6 px-6">Close</button>
        </div>
      </div>,
      document.body,
    );
  }

  /* --------------------------------------------------------------- geometry */

  const from = turn ? turn.from : index;
  const to = turn ? turn.to : index;
  const forward = turn?.dir === 'next';

  // What sits under the leaf: the half that is not moving stays put, the half
  // being uncovered already shows the destination.
  const baseLeft = turn ? (forward ? views[from][0] : views[to][0]) : views[index][0];
  const baseRight = turn ? (forward ? views[to][1] : views[from][1]) : views[index][1];

  /**
   * The leaf's two faces, in book order.
   *
   * Spread `from` is [A, B] and spread `to` is [C, D]. The physical sheet
   * between them carries B on one side and C on the other, so turning forward
   * shows B lifting and C landing; turning back is the same sheet going the
   * other way, which means it starts as the current spread's *left* page and
   * ends as the destination's *right* page. Getting this pair backwards makes
   * the reverse turn flash a page from two spreads away.
   */
  const leafFront = turn
    ? single
      ? forward
        ? views[from][1]
        : views[to][1]
      : forward
        ? views[from][1]
        : views[from][0]
    : null;
  const leafBack = turn ? (forward ? views[to][0] : views[to][1]) : null;

  const pageNo = (view: number, side: 0 | 1) => {
    if (single) return view + 1;
    if (view === 0) return side === 1 ? 1 : null;
    return side === 0 ? view * 2 : view * 2 + 1;
  };

  const leftNo = pageNo(index, 0);
  const rightNo = pageNo(index, 1);
  const label = single
    ? `Page ${index + 1}`
    : index === 0
      ? 'Cover'
      : views[index][1]
        ? `Pages ${leftNo}–${rightNo}`
        : `Page ${leftNo}`;

  const progress = views.length > 1 ? (index / (views.length - 1)) * 100 : 100;
  const thumbList = thumbs.length === pages.length ? thumbs : pages;

  const bookStyle: React.CSSProperties = {
    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
  };

  const face = (src: string | null, alt: string, blank?: 'end') => (
    <div className="flipbook-page">
      {src ? (
        // Plain img: these are served from Supabase storage at their printed
        // size, and the optimizer has nothing to add to a page render.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="flipbook-page__img" draggable={false} />
      ) : blank === 'end' ? (
        <div className="flipbook-page__blank">End of issue</div>
      ) : (
        <div className="flipbook-page__blank flipbook-page__blank--inner">
          <span className="flipbook-page__mark">ESB PowerLine</span>
          <span className="flipbook-page__markSub">Energy &amp; Power Portal</span>
        </div>
      )}
    </div>
  );

  const reader = (
    <div
      ref={shellRef}
      className="flipbook"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} — interactive reader` : 'Interactive reader'}
    >
      <button className="flipbook__scrim" onClick={onClose} aria-label="Close interactive reader" tabIndex={-1} />

      <div className="flipbook__bar flipbook__bar--top">
        <div className="flipbook__id">
          <BookOpen className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flipbook__title">{title ?? 'Interactive reader'}</div>
            {issueLabel ? <div className="flipbook__sub">{issueLabel}</div> : null}
          </div>
        </div>

        <div className="flipbook__tools">
          <button
            onClick={() => setShowThumbs((s) => !s)}
            className={`flipbook__tool${showThumbs ? ' is-on' : ''}`}
            aria-pressed={showThumbs}
            title="All pages (T)"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setZoom((z) => (z + 1) % ZOOM_STEPS.length);
              setPan({ x: 0, y: 0 });
            }}
            className={`flipbook__tool${scale > 1 ? ' is-on' : ''}`}
            title={scale > 1 ? 'Zoom out' : 'Zoom in'}
          >
            {scale > 1 ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <button onClick={toggleMute} className="flipbook__tool" aria-pressed={!muted} title="Page-turn sound (M)">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button onClick={toggleFullscreen} className="flipbook__tool" title="Fullscreen (F)">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={onClose} className="flipbook__tool flipbook__tool--close" aria-label="Close reader">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="flipbook__stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`flipbook__book${single ? ' flipbook__book--single' : ''}${scale > 1 ? ' is-zoomed' : ''}`}
          style={bookStyle}
        >
          {!single ? (
            <div className="flipbook__half flipbook__half--left">
              {face(baseLeft, leftNo ? `Page ${leftNo}` : 'Inside cover')}
            </div>
          ) : null}
          <div className="flipbook__half flipbook__half--right">
            {face(baseRight, rightNo ? `Page ${rightNo}` : 'Page', 'end')}
          </div>

          {/* The turning leaf. Both faces are painted before it starts moving. */}
          {turn ? (
            <div
              key={`${from}-${to}`}
              className={`flipbook-leaf flipbook-leaf--${forward ? 'next' : 'prev'}${single ? ' flipbook-leaf--single' : ''}`}
              aria-hidden="true"
            >
              <div className="flipbook-leaf__face flipbook-leaf__face--front">
                {face(leafFront, '')}
                <div className="flipbook-leaf__shade flipbook-leaf__shade--front" />
              </div>
              <div className="flipbook-leaf__face flipbook-leaf__face--back">
                {/* In single-page mode the reverse of the sheet is not a page we
                    hold an image of — it is the back of the one being turned. */}
                {single ? <div className="flipbook-page flipbook-page--verso" /> : face(leafBack, '')}
                <div className="flipbook-leaf__shade flipbook-leaf__shade--back" />
              </div>
            </div>
          ) : null}

          {/* Gutter shading. A spread with no shadow down the spine reads as two
              unrelated images side by side rather than one open magazine. */}
          {!single ? <div className="flipbook__gutter" aria-hidden="true" /> : null}

          {scale === 1 ? (
            <>
              <button
                className="flipbook__zone flipbook__zone--prev"
                onClick={prev}
                disabled={index === 0}
                aria-label="Previous page"
              />
              <button
                className="flipbook__zone flipbook__zone--next"
                onClick={next}
                disabled={index >= views.length - 1}
                aria-label="Next page"
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="flipbook__bar flipbook__bar--bottom">
        <div className="flipbook__nav">
          <button onClick={prev} disabled={index === 0} className="flipbook__arrow" aria-label="Previous page">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flipbook__meter">
            <div className="flipbook__count">
              {label} <span className="flipbook__of">of {pages.length}</span>
            </div>
            <div className="flipbook__track" aria-hidden="true">
              <div className="flipbook__fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={next}
            disabled={index >= views.length - 1}
            className="flipbook__arrow"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <p className="flipbook__hint">
          Click either page, swipe, or use &larr; &rarr;. <kbd>T</kbd> all pages &middot; <kbd>M</kbd> sound &middot;{' '}
          <kbd>F</kbd> fullscreen
        </p>
      </div>

      <div className={`flipbook__thumbs${showThumbs ? ' is-open' : ''}`} aria-hidden={!showThumbs}>
        <div className="flipbook__thumbsInner">
          {thumbList.map((src, i) => {
            const view = viewForPage(i);
            return (
              <button
                key={src}
                onClick={() => jumpTo(view)}
                className={`flipbook__thumb${view === index ? ' is-current' : ''}`}
                aria-label={`Go to page ${i + 1}`}
                tabIndex={showThumbs ? 0 : -1}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" draggable={false} />
                <span>{i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(reader, document.body);
}
