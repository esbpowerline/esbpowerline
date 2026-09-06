'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ImageOff,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface MagazineFlipBookProps {
  /**
   * Every page of the issue, in printed order. When empty the reader refuses to
   * open rather than showing stand-in artwork.
   */
  pages?: string[];
  /** Page thumbnails for the picker. Falls back to the full-size pages. */
  thumbs?: string[];
  /** Page index (0-based) to open at, so a thumbnail can jump straight there. */
  startPage?: number;
  isOpen: boolean;
  onClose: () => void;
  /** Printed on the reader's header, e.g. "Vol 001 · Issue 01". */
  issueLabel?: string;
  title?: string;
}

/**
 * A reader that behaves like a bound magazine.
 *
 * Three things had to be true before it stopped feeling like a slideshow, and
 * each was a separate rewrite:
 *
 * 1. **One leaf animates, ever.** The spread underneath is two plain images and
 *    a single sheet moves over it. An earlier version rotated all 24 leaves on a
 *    z-index ladder; the one before that was hardcoded to eight files. Five
 *    images are in the DOM now whether the issue is 48 pages or 480.
 *
 * 2. **The sheet rolls; it does not pivot.** Paper bends. A single `rotateY` is
 *    a rigid board on a hinge, and no amount of easing hides that. The turning
 *    leaf is built from `STRIPS` vertical slices nested inside one another, each
 *    rotated a few degrees more than its parent — because transforms accumulate
 *    down the chain, the slices stay joined and approximate a cylinder. The bend
 *    grows towards the outer edge (`bendAt`) and peaks mid-turn, so the page
 *    curls up off the spread, rolls over, and settles flat.
 *
 * 3. **Progress is driven, not declared, and never round-trips through React.**
 *    A CSS transition only knows its endpoints, so it cannot shade a sheet
 *    through its arc. The rAF loop writes transforms and shading straight to the
 *    DOM through refs; React renders the sheet's structure when a turn starts
 *    and again when it ends, and not once in between. That is what keeps 12
 *    slices smooth on a mid-range laptop.
 *
 * You can also grab the page: drag and the sheet tracks your pointer, release
 * past a third and it completes, otherwise it falls back.
 *
 * Pagination follows print convention: the cover stands alone, then 2-3, 4-5,
 * and a final even page alone. Narrow screens read one page at a time, which
 * changes the arithmetic but not the model — see `layoutFor`.
 */

/** A full turn at rest. Drags finish proportionally faster. */
const TURN_MS = 900;
const PAGE_ASPECT = 587 / 803;
const SOUND_KEY = 'esb:magazine:page-sound';
const MOTION_KEY = 'esb:magazine:page-roll';
const ZOOM_STEPS = [1, 1.45, 2] as const;

/** Fraction of a page you must drag before releasing completes the turn. */
const COMMIT_AT = 0.32;

/**
 * Slices the turning sheet is bent into. Twelve is where the silhouette stops
 * looking faceted; past that the extra nodes cost more than they show.
 */
const STRIPS = 12;

/** Degrees of bend across the whole sheet at the peak of a turn. */
const CURL_DEGREES = 52;

/**
 * How the bend is distributed from spine to outer edge.
 *
 * Quadratic, so the half nearest the binding stays almost flat and the outer
 * edge does most of the curling — which is how a held page actually behaves,
 * and why a linear distribution reads as a tube rather than as paper.
 */
const bendAt = (u: number) => u * u;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

interface Turn {
  /** 1 turns forward (right to left), -1 turns back. */
  dir: 1 | -1;
  dragging: boolean;
}

interface Layout {
  /** 1-based page numbers, or null where the book shows no page. */
  baseLeft: number | null;
  baseRight: number | null;
  leafFront: number | null;
  leafBack: number | null;
}

/**
 * Which page numbers sit where, for a given position and in-flight turn.
 *
 * `pos` is a spread index in two-page mode and a 0-based page index in one-page
 * mode. Working this out in one place is what lets both modes share a single
 * animation, pointer handler and shading path.
 */
function layoutFor(twoUp: boolean, pos: number, turn: Turn | null): Layout {
  if (twoUp) {
    const left = pos * 2;
    const right = pos * 2 + 1;
    if (!turn) return { baseLeft: left || null, baseRight: right, leafFront: null, leafBack: null };
    if (turn.dir === 1) {
      // The leaf lifts off the right and lands on the left, revealing pos+1.
      return { baseLeft: left || null, baseRight: right + 2, leafFront: right, leafBack: right + 1 };
    }
    return { baseLeft: left - 2 || null, baseRight: right, leafFront: left - 1, leafBack: left };
  }

  const page = pos + 1;
  if (!turn) return { baseLeft: null, baseRight: page, leafFront: null, leafBack: null };
  if (turn.dir === 1) {
    // One page at a time: the sheet leaves to the left and the next is beneath.
    return { baseLeft: null, baseRight: page + 1, leafFront: page, leafBack: page + 1 };
  }
  return { baseLeft: null, baseRight: page, leafFront: page - 1, leafBack: page };
}

/**
 * The page-turn sound, synthesised rather than downloaded.
 *
 * A hosted audio file would be one more asset that can 404 — which is exactly
 * what this component was repaired for — and would need its own CSP entry and
 * signed URL. Filtered noise costs nothing, ships in the bundle and never
 * expires. Brown-tilted noise under a sweeping bandpass is close enough to
 * paper dragging over paper.
 */
function usePageTurnSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    return () => {
      void contextRef.current?.close();
      contextRef.current = null;
      noiseRef.current = null;
    };
  }, []);

  return useCallback(
    (intensity = 1) => {
      if (!enabled || typeof window === 'undefined') return;

      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      try {
        const ctx = (contextRef.current ??= new Ctor());
        // Browsers start a context suspended until a gesture; every turn is one.
        if (ctx.state === 'suspended') void ctx.resume();

        if (!noiseRef.current) {
          const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
          const data = buffer.getChannelData(0);
          let last = 0;
          for (let i = 0; i < data.length; i += 1) {
            const white = Math.random() * 2 - 1;
            // Leaky integrator: tilts white noise towards brown, which reads as
            // paper rather than as static.
            last = (last + 0.02 * white) / 1.02;
            data[i] = last * 3.2 + white * 0.5;
          }
          noiseRef.current = buffer;
        }

        const now = ctx.currentTime;
        const source = ctx.createBufferSource();
        source.buffer = noiseRef.current;
        // Vary each turn; identical rustles start sounding synthetic fast.
        source.playbackRate.value = 0.85 + Math.random() * 0.3;

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 700;

        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.Q.value = 0.7;
        band.frequency.setValueAtTime(1100, now);
        band.frequency.exponentialRampToValueAtTime(5400, now + 0.3);
        band.frequency.exponentialRampToValueAtTime(1600, now + 0.55);

        const peak = 0.22 * Math.min(1, Math.max(0.25, intensity));
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.07);
        gain.gain.exponentialRampToValueAtTime(peak * 0.5, now + 0.26);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        source.connect(highpass).connect(band).connect(gain).connect(ctx.destination);
        source.start(now, Math.random() * 1.2, 0.65);
        source.stop(now + 0.65);
      } catch {
        // Audio is a garnish. A blocked context must never stop a page turning.
      }
    },
    [enabled],
  );
}

export function MagazineFlipBook({
  pages = [],
  thumbs,
  startPage = 0,
  isOpen,
  onClose,
  issueLabel,
  title,
}: MagazineFlipBookProps) {
  const leafCount = Math.ceil(pages.length / 2);
  const thumbList = thumbs?.length ? thumbs : pages;

  const [twoUp, setTwoUp] = useState(true);
  const [pos, setPos] = useState(0);
  const [turn, _setTurn] = useState<Turn | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [reduceMotion, setReduceMotion] = useState(false);
  /**
   * Whether the sheet rolls, defaulting to the OS preference but overridable.
   *
   * `prefers-reduced-motion: reduce` is honoured — but it is a default, not a
   * verdict. On a machine with Windows animations switched off the reader
   * silently became a slideshow with no way back, and the person looking at it
   * had no reason to connect a blank-feeling page turn to an accessibility
   * setting three menus deep. Null means "follow the system".
   */
  const [rollPref, setRollPref] = useState<boolean | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [zoomStep, setZoomStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Progress lives in a ref, not in state. The rAF loop writes transforms
  // straight to these nodes, so a turn costs no React renders at all.
  const turnRef = useRef<Turn | null>(null);
  const progressRef = useRef(0);
  const posRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const bookRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const castRef = useRef<HTMLDivElement | null>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frontShadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backShadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragRef = useRef<{ x: number; moved: number; at: number } | null>(null);

  const setTurn = useCallback((value: Turn | null) => {
    turnRef.current = value;
    _setTurn(value);
  }, []);

  const rollOn = rollPref ?? !reduceMotion;
  const maxPos = twoUp ? leafCount : Math.max(pages.length - 1, 0);
  const zoom = ZOOM_STEPS[zoomStep];
  const playTurn = usePageTurnSound(soundOn);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    try {
      setSoundOn(window.localStorage.getItem(SOUND_KEY) !== 'off');
      const stored = window.localStorage.getItem(MOTION_KEY);
      if (stored === 'on' || stored === 'off') setRollPref(stored === 'on');
    } catch {
      // Private windows and blocked site data: the default stands.
    }
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 900px)');
    const apply = () => {
      setReduceMotion(motion.matches);
      setTwoUp(wide.matches);
    };
    apply();
    motion.addEventListener('change', apply);
    wide.addEventListener('change', apply);
    return () => {
      motion.removeEventListener('change', apply);
      wide.removeEventListener('change', apply);
    };
  }, []);

  /**
   * Writes one frame of the turn.
   *
   * The sheet's own hinge angle goes on the leaf; every slice then adds its
   * share of the bend, and each slice is shaded by how far it has rotated out
   * of the light. `Math.cos` of the accumulated angle is the whole lighting
   * model, and it is enough: a slice edge-on to the viewer goes dark, a slice
   * facing them stays bright, and the gradient between the two is what reads as
   * a roll rather than a fold.
   */
  const applyProgress = useCallback((p: number) => {
    const active = turnRef.current;
    if (!active) return;

    const hinge = active.dir === 1 ? -180 * p : -180 * (1 - p);
    const arc = Math.sin(Math.PI * p);
    const curl = CURL_DEGREES * arc;

    if (sheetRef.current) sheetRef.current.style.transform = `rotateY(${hinge}deg)`;
    if (castRef.current) castRef.current.style.opacity = String(arc * 0.72);

    for (let i = 0; i < STRIPS; i += 1) {
      const uPrev = i / STRIPS;
      const u = (i + 1) / STRIPS;
      const strip = stripRefs.current[i];
      if (strip) strip.style.transform = `rotateY(${curl * (bendAt(u) - bendAt(uPrev))}deg)`;

      // How this slice sits relative to the viewer, hinge and bend together.
      const facing = Math.abs(Math.cos(((hinge + curl * bendAt(u)) * Math.PI) / 180));
      const front = frontShadeRefs.current[i];
      const back = backShadeRefs.current[i];
      if (front) front.style.opacity = String(Math.min(0.82, (1 - facing) * 0.8 + p * 0.12));
      if (back) back.style.opacity = String(Math.min(0.82, (1 - facing) * 0.8 + (1 - p) * 0.12));
    }
  }, []);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => stopAnimation, [stopAnimation]);

  // A turn's opening frame: React has just created the sheet, so put it at the
  // progress the drag or animation already believes it is at.
  useEffect(() => {
    if (turn) applyProgress(progressRef.current);
  }, [turn, applyProgress]);

  /** Runs the in-flight turn to `to` (1 completes it, 0 abandons it). */
  const settle = useCallback(
    (to: 0 | 1) => {
      const active = turnRef.current;
      if (!active) return;

      const from = progressRef.current;
      const distance = Math.abs(to - from);
      if (to === 1) playTurn(0.45 + distance * 0.55);

      const finish = () => {
        progressRef.current = 0;
        if (to === 1) setPos((p) => p + active.dir);
        setTurn(null);
      };

      if (!rollOn || distance < 0.01) {
        finish();
        return;
      }

      const duration = Math.max(200, TURN_MS * distance);
      const started = performance.now();
      stopAnimation();

      const step = (now: number) => {
        const k = Math.min(1, (now - started) / duration);
        const p = from + (to - from) * easeInOut(k);
        progressRef.current = p;
        applyProgress(p);
        if (k < 1) {
          rafRef.current = requestAnimationFrame(step);
          return;
        }
        rafRef.current = null;
        finish();
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [applyProgress, playTurn, rollOn, setTurn, stopAnimation],
  );

  const beginTurn = useCallback(
    (dir: 1 | -1, dragging: boolean) => {
      if (turnRef.current) return false;
      const at = posRef.current;
      if (dir === 1 && at >= maxPos) return false;
      if (dir === -1 && at <= 0) return false;
      progressRef.current = 0;
      setTurn({ dir, dragging });
      return true;
    },
    [maxPos, setTurn],
  );

  const flip = useCallback(
    (dir: 1 | -1) => {
      if (beginTurn(dir, false)) settle(1);
    },
    [beginTurn, settle],
  );

  const jumpTo = useCallback(
    (page: number) => {
      stopAnimation();
      progressRef.current = 0;
      setTurn(null);
      setPos(Math.min(Math.max(twoUp ? (page <= 1 ? 0 : Math.floor(page / 2)) : page - 1, 0), maxPos));
      playTurn(0.5);
    },
    [maxPos, playTurn, setTurn, stopAnimation, twoUp],
  );

  const markFailed = useCallback((src: string) => setFailed((prev) => new Set(prev).add(src)), []);

  // Pointer drag. The sheet tracks the pointer across one page width, so a slow
  // drag holds it open mid-roll exactly where you left it.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom > 1 || turnRef.current) return;
      const rect = bookRef.current?.getBoundingClientRect();
      if (!rect) return;
      const forward = !twoUp || e.clientX - rect.left > rect.width / 2;
      if (!beginTurn(forward ? 1 : -1, true)) return;
      dragRef.current = { x: e.clientX, moved: 0, at: performance.now() };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [beginTurn, twoUp, zoom],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      const active = turnRef.current;
      if (!drag || !active?.dragging) return;
      const rect = bookRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pageWidth = twoUp ? rect.width / 2 : rect.width;
      const dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      const p = clamp01((active.dir === 1 ? -dx : dx) / pageWidth);
      progressRef.current = p;
      applyProgress(p);
    },
    [applyProgress, twoUp],
  );

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    const active = turnRef.current;
    dragRef.current = null;
    if (!drag || !active?.dragging) return;
    // A tap is a turn; only an actual drag gets judged on how far it went.
    if (drag.moved < 6) {
      settle(1);
      return;
    }
    const flung = drag.moved / Math.max(performance.now() - drag.at, 1) > 0.7;
    settle(progressRef.current > COMMIT_AT || flung ? 1 : 0);
  }, [settle]);

  const posForPage = useCallback(
    (page: number) => (twoUp ? (page <= 1 ? 0 : Math.floor(page / 2)) : Math.max(page - 1, 0)),
    [twoUp],
  );

  /** The page a reader would say they are on, used to survive a mode change. */
  const currentPage = twoUp ? Math.max(pos * 2, 1) : pos + 1;
  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Switching between one and two pages up must not lose the reader's place.
  useEffect(() => {
    setPos(Math.min(posForPage(currentPageRef.current), twoUp ? leafCount : Math.max(pages.length - 1, 0)));
  }, [twoUp, posForPage, leafCount, pages.length]);

  useEffect(() => {
    if (isOpen) setPos(Math.min(posForPage(startPage + 1), maxPos));
    // maxPos intentionally omitted: reopening should not re-seek on a resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, startPage, posForPage]);

  useEffect(() => {
    if (!isOpen) return;

    // Scroll lock + hide the sticky public nav. Preserved from the original
    // component: without it the page behind scrolls under the overlay.
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const navBar = document.querySelector('.public-nav-bar') as HTMLElement | null;
    if (navBar) navBar.style.display = 'none';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') flip(1);
      else if (e.key === 'ArrowLeft') flip(-1);
      else if (e.key === 'Home') jumpTo(1);
      else if (e.key === 'End') jumpTo(pages.length);
    };
    window.addEventListener('keydown', onKey);

    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (navBar) navBar.style.display = '';
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, [isOpen, onClose, flip, jumpTo, pages.length]);

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      try {
        window.localStorage.setItem(SOUND_KEY, on ? 'off' : 'on');
      } catch {
        // The preference is a convenience; failing to store it changes nothing.
      }
      return !on;
    });
  }, []);

  const toggleRoll = useCallback(() => {
    setRollPref((current) => {
      const next = !(current ?? !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      try {
        window.localStorage.setItem(MOTION_KEY, next ? 'on' : 'off');
      } catch {
        // The preference is a convenience; failing to store it changes nothing.
      }
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.requestFullscreen?.().catch(() => undefined);
  }, []);

  const layout = useMemo(() => layoutFor(twoUp, pos, turn), [twoUp, pos, turn]);

  const label = useMemo(() => {
    if (!twoUp) return `Page ${pos + 1}`;
    if (pos === 0) return 'Cover';
    const left = pos * 2;
    const right = pos * 2 + 1;
    return right <= pages.length ? `Pages ${left}–${right}` : `Page ${left}`;
  }, [pos, pages.length, twoUp]);

  if (!isOpen) return null;

  // No pages means no issue to read. Saying so beats rendering placeholder art.
  if (pages.length === 0) {
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

  const src = (page: number | null) => (page && page >= 1 && page <= pages.length ? pages[page - 1] : null);

  const Page = ({ page, side }: { page: number | null; side: 'left' | 'right' }) => {
    const url = src(page);
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#14161a]">
        {url && !failed.has(url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`Page ${page}`}
            className="h-full w-full object-contain"
            draggable={false}
            onError={() => markFailed(url)}
          />
        ) : url ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-zinc-500">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            <span className="text-[11px] uppercase tracking-widest">Page {page} unavailable</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[3px] text-zinc-700">
            {side === 'left' ? 'ESB PowerLine' : 'End of issue'}
          </div>
        )}

        {/* Gutter shadow. The bound edge of a real spread is always darker, and
            it is most of what stops two flat images reading as one flat image. */}
        <div
          className="pointer-events-none absolute inset-y-0 w-[14%]"
          style={{
            [side === 'left' ? 'right' : 'left']: 0,
            background:
              side === 'left'
                ? 'linear-gradient(to left, rgba(0,0,0,0.5), rgba(0,0,0,0.12) 45%, transparent)'
                : 'linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.12) 45%, transparent)',
          }}
        />
      </div>
    );
  };

  const frontUrl = src(layout.leafFront);
  const backUrl = src(layout.leafBack);
  /** A page whose image is missing cannot be sliced; fall back to a flat sheet. */
  const canRoll =
    rollOn && Boolean(frontUrl) && !failed.has(frontUrl ?? '') && (!backUrl || !failed.has(backUrl));

  /**
   * One slice of the rolling sheet, holding the next slice as its child.
   *
   * Each face paints its own vertical band of the page by blowing the image up
   * to `STRIPS` times the slice width and offsetting it — so the sheet is one
   * continuous picture across twelve independently rotated pieces. The back
   * face counts its slices from the other end, because a turned sheet meets the
   * spine on its opposite edge.
   */
  const buildStrip = (i: number): React.ReactNode => {
    if (i >= STRIPS) return null;
    const first = i === 0;
    const at = (n: number) => `${(n / (STRIPS - 1)) * 100}% 0`;
    const faceBase: React.CSSProperties = {
      position: 'absolute',
      // Overhang the right edge by a hair so neighbouring slices overlap. Without
      // it the sheet shows twelve hairline seams at the steepest part of the
      // roll, where the slices are most splayed. Less than a pixel of the image
      // is duplicated, which is invisible; the seams were not.
      inset: '0 -0.75px 0 0',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      backgroundColor: '#14161a',
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${STRIPS * 100}% 100%`,
    };

    return (
      <div
        key={i}
        ref={(el) => {
          stripRefs.current[i] = el;
        }}
        style={{
          position: 'absolute',
          top: 0,
          height: '100%',
          left: first ? 0 : '100%',
          width: first ? `${100 / STRIPS}%` : '100%',
          transformStyle: 'preserve-3d',
          transformOrigin: 'left center',
          willChange: 'transform',
        }}
      >
        <div style={{ ...faceBase, backgroundImage: `url("${frontUrl}")`, backgroundPosition: at(i) }}>
          <div
            ref={(el) => {
              frontShadeRefs.current[i] = el;
            }}
            style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0 }}
          />
        </div>

        <div
          style={{
            ...faceBase,
            transform: 'rotateY(180deg)',
            backgroundImage: backUrl ? `url("${backUrl}")` : undefined,
            backgroundPosition: at(STRIPS - 1 - i),
          }}
        >
          <div
            ref={(el) => {
              backShadeRefs.current[i] = el;
            }}
            style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0 }}
          />
        </div>

        {buildStrip(i + 1)}
      </div>
    );
  };

  const barButton =
    'grid h-9 w-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent';

  return (
    <div
      ref={shellRef}
      className="fixed inset-0 z-[200] flex flex-col bg-[#0a0b0d] text-white"
      style={{
        backgroundImage: 'radial-gradient(120% 90% at 50% 0%, #1b1f26 0%, #0a0b0d 55%, #06070a 100%)',
      }}
    >
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          {issueLabel ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/80">{issueLabel}</div>
          ) : null}
          <div className="truncate text-sm font-semibold text-white/90">{title ?? 'Interactive reader'}</div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            className={barButton}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute page turn sound' : 'Unmute page turn sound'}
          >
            {soundOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
          </button>
          <button
            onClick={toggleRoll}
            className={`${barButton} ${rollOn ? '' : 'opacity-45'}`}
            aria-pressed={rollOn}
            aria-label={rollOn ? 'Turn off the page roll animation' : 'Turn on the page roll animation'}
            title={rollOn ? 'Page roll on' : 'Page roll off — your system asks for reduced motion'}
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </button>
          <button onClick={toggleFullscreen} className={barButton} aria-label={isFullscreen ? 'Leave fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
          </button>
          <button onClick={onClose} className={barButton} aria-label="Close reader">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className={`relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-8 ${zoom > 1 ? 'overflow-auto' : 'overflow-hidden'}`}>
        <div
          className="relative"
          style={{
            width: `min(${twoUp ? 96 : 92}vw, calc((100vh - 190px) * ${(twoUp ? 2 : 1) * PAGE_ASPECT}))`,
            aspectRatio: `${(twoUp ? 2 : 1) * PAGE_ASPECT}`,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 260ms ease',
          }}
        >
          {/* The stack's own thickness. A book with pages left to read is
              visibly thicker on that side; this is the cheapest cue there is. */}
          {twoUp ? (
            <>
              <div
                className="pointer-events-none absolute inset-y-[1.5%] right-full rounded-l-sm bg-gradient-to-l from-zinc-400/70 to-zinc-700/10"
                style={{ width: `${1 + (pos / Math.max(maxPos, 1)) * 9}px` }}
              />
              <div
                className="pointer-events-none absolute inset-y-[1.5%] left-full rounded-r-sm bg-gradient-to-r from-zinc-400/70 to-zinc-700/10"
                style={{ width: `${1 + (1 - pos / Math.max(maxPos, 1)) * 9}px` }}
              />
            </>
          ) : null}

          <div
            ref={bookRef}
            className="absolute inset-0 flex touch-pan-y select-none"
            style={{ perspective: '2000px', perspectiveOrigin: '50% 50%' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {twoUp ? (
              <div className="relative h-full w-1/2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)]">
                <Page page={layout.baseLeft} side="left" />
              </div>
            ) : null}
            <div className={`relative h-full ${twoUp ? 'w-1/2' : 'w-full'} shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)]`}>
              <Page page={layout.baseRight} side="right" />
              {/* The shadow the rolling sheet throws on the page it reveals. */}
              {turn ? (
                <div
                  ref={castRef}
                  className="pointer-events-none absolute inset-0"
                  style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.8), transparent 62%)', opacity: 0 }}
                />
              ) : null}
            </div>

            {turn ? (
              <div
                ref={sheetRef}
                className={`absolute top-0 h-full ${twoUp ? 'left-1/2 w-1/2' : 'left-0 w-full'}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'left center',
                  zIndex: 20,
                  willChange: 'transform',
                }}
              >
                {canRoll ? (
                  buildStrip(0)
                ) : (
                  // Reduced motion, or artwork we could not load: turn it flat.
                  <>
                    <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                      <Page page={layout.leafFront} side="right" />
                    </div>
                    <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <Page page={layout.leafBack} side="left" />
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {twoUp ? (
            <div
              className="pointer-events-none absolute inset-y-0 left-1/2 z-[25] w-[26px] -translate-x-1/2"
              style={{
                background:
                  'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.45) 58%, rgba(0,0,0,0) 100%)',
              }}
            />
          ) : null}
        </div>

        <button
          onClick={() => flip(-1)}
          disabled={pos === 0}
          className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-3 text-white/70 backdrop-blur transition-all hover:bg-white/15 hover:text-white disabled:opacity-20 md:block"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => flip(1)}
          disabled={pos >= maxPos}
          className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-3 text-white/70 backdrop-blur transition-all hover:bg-white/15 hover:text-white disabled:opacity-20 md:block"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Page picker. Every page is reachable in one click, which is the whole
          point of a reader and is what the six-thumbnail teaser on the landing
          page deliberately stops trying to be. */}
      <div
        className="relative z-30 shrink-0 overflow-hidden border-t border-white/10 bg-black/40 backdrop-blur transition-[max-height,opacity] duration-300"
        style={{ maxHeight: pickerOpen ? 190 : 0, opacity: pickerOpen ? 1 : 0 }}
        aria-hidden={!pickerOpen}
      >
        <div className="flex gap-2.5 overflow-x-auto px-4 py-4">
          {thumbList.map((thumbSrc, index) => {
            const page = index + 1;
            const active = twoUp ? page === pos * 2 || page === pos * 2 + 1 : page === pos + 1;
            return (
              <button
                key={thumbSrc}
                type="button"
                onClick={() => jumpTo(page)}
                className="group shrink-0"
                aria-label={`Go to page ${page}`}
                aria-current={active}
              >
                <div
                  className={`w-[74px] overflow-hidden rounded border transition-all ${
                    active ? 'border-primary ring-2 ring-primary/40' : 'border-white/15 group-hover:border-white/50'
                  }`}
                  style={{ aspectRatio: `${PAGE_ASPECT}` }}
                >
                  {failed.has(thumbSrc) ? (
                    <div className="grid h-full w-full place-items-center bg-white/5 text-zinc-600">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbSrc}
                      alt={`Page ${page}`}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover"
                      onError={() => markFailed(thumbSrc)}
                    />
                  )}
                </div>
                <div className={`mt-1 text-center text-[10px] tabular-nums ${active ? 'text-primary' : 'text-white/45'}`}>
                  {page}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <footer className="relative z-30 flex shrink-0 items-center justify-center gap-1 px-3 py-3 sm:gap-2">
        <button onClick={() => jumpTo(1)} disabled={pos === 0} className={barButton} aria-label="First page">
          <ChevronsLeft className="h-[18px] w-[18px]" />
        </button>
        <button onClick={() => flip(-1)} disabled={pos === 0} className={barButton} aria-label="Previous page">
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>

        <div className="mx-1 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
          <span className="text-xs font-medium tabular-nums text-white/90">{label}</span>
          <span className="text-xs text-white/35">of {pages.length}</span>
        </div>

        <button onClick={() => flip(1)} disabled={pos >= maxPos} className={barButton} aria-label="Next page">
          <ChevronRight className="h-[18px] w-[18px]" />
        </button>
        <button onClick={() => jumpTo(pages.length)} disabled={pos >= maxPos} className={barButton} aria-label="Last page">
          <ChevronsRight className="h-[18px] w-[18px]" />
        </button>

        <div className="mx-1 h-5 w-px bg-white/10" />

        <button
          onClick={() => setPickerOpen((open) => !open)}
          className={`${barButton} ${pickerOpen ? 'bg-white/15 text-white' : ''}`}
          aria-pressed={pickerOpen}
          aria-label="Choose a page"
        >
          <LayoutGrid className="h-[18px] w-[18px]" />
        </button>
        <button onClick={() => setZoomStep((z) => Math.max(0, z - 1))} disabled={zoomStep === 0} className={barButton} aria-label="Zoom out">
          <ZoomOut className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={() => setZoomStep((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
          disabled={zoomStep === ZOOM_STEPS.length - 1}
          className={barButton}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-[18px] w-[18px]" />
        </button>
      </footer>

      <p className="pb-3 text-center text-[11px] text-white/30">
        <span className="hidden md:inline">Drag a page to turn it, or use the arrow keys.</span>
        <span className="md:hidden">Swipe a page to turn it.</span>
      </p>
    </div>
  );
}
