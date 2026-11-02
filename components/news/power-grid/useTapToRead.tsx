'use client';

/**
 * Tap-to-read for the Grid Explorer's hand-drawn charts.
 *
 * Why this exists: every canvas read its crosshair from `onPointerMove` and
 * cleared it on `onPointerLeave`. On a phone a finger produces one pointerdown,
 * a pointerup and an immediate pointerleave, so the readout either flashed and
 * vanished or (after the pointerdown "pin") stuck forever with no way to clear
 * it, and it floated over a 390px card where its 11rem panel ran off-screen.
 * The mouse behaviour was right and is kept byte for byte.
 *
 * ── API ────────────────────────────────────────────────────────────────────
 *
 *   const tap = useTapToRead<number>({
 *     hostRef,                 // ref to the element the pointer events bind to
 *     clearOnMiss?: boolean,   // pointAt() === null clears the cursor (default false: ignored)
 *   });
 *   // pointAt is passed at bind time, so the hook can be called before the chart's
 *   // model exists (the cursor is needed by the model; pointAt needs the model).
 *   const pointAt = useCallback((clientX: number): T | null => …, [model]);
 *
 *   <div ref={hostRef} {...tap.handlers(pointAt)}>…</div>
 *
 *   tap.cursor        T | null    the datum under the crosshair
 *   tap.setCursor     setState    use it for keyboard stepping (accepts an updater)
 *   tap.pinned        boolean     mouse: click-to-pin. touch: a finger is "holding" a reading
 *   tap.setPinned     setState
 *   tap.clear()       drop cursor + pin (Escape key, the readout's close ×)
 *
 *   Behaviour
 *   · mouse / pen hover : crosshair follows the pointer; leaving clears it unless pinned;
 *                         a click pins (unchanged from the old inline handlers).
 *   · touch             : pointerdown sets the crosshair and pins it; dragging a finger
 *                         sideways scrubs it (host needs `touch-action: pan-y`);
 *                         a tap ANYWHERE outside the host and outside any
 *                         `[data-chart-readout]` clears it. Vertical page scroll is left
 *                         alone (the browser sends pointercancel; the reading stays).
 *
 * ── The readout panel ──────────────────────────────────────────────────────
 *
 *   <ChartReadout className="load-curve__readout" style={{left, transform}} onClose={tap.clear}>
 *     …existing readout markup…
 *   </ChartReadout>
 *
 *   >= 768px  renders exactly the old absolutely-positioned div (className + style as given).
 *   <  768px  portals the same markup into <body> as a dark card docked to the bottom of
 *             the viewport (above the safe-area inset), 13px+ type, with a 44px close ×.
 *             The inline `style` is dropped there, so callers do not need to do anything.
 *             Styling lives in app/grid-explorer-charts.css (.ge-readout-sheet).
 *
 *   Hooks `useMediaQuery(query)` and `useBelowDesktop()` are exported for SVG charts
 *   that must pick a bigger font attribute on phones/tablets.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import '@/app/grid-explorer-charts.css';

/** matchMedia as external store: false on the server and on first hydration pass. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True below the 1024px desktop breakpoint (phone + tablet). */
export function useBelowDesktop(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

export function useTapToRead<T>({
  hostRef,
  clearOnMiss = false,
}: {
  hostRef: RefObject<HTMLElement | null>;
  clearOnMiss?: boolean;
}) {
  const [cursor, setCursor] = useState<T | null>(null);
  const [pinned, setPinned] = useState(false);
  const touching = useRef(false);

  const clear = useCallback(() => {
    setCursor(null);
    setPinned(false);
  }, []);

  const handlers = (pointAt: (clientX: number) => T | null) => {
    const apply = (clientX: number) => {
      const v = pointAt(clientX);
      if (v != null) setCursor(v);
      else if (clearOnMiss) setCursor(null);
    };
    const onPointerDown = (e: ReactPointerEvent) => {
      const v = pointAt(e.clientX);
      if (v == null) {
        if (clearOnMiss) clear();
        return;
      }
      setCursor(v);
      setPinned(true);
      touching.current = e.pointerType !== 'mouse';
    };
    const onPointerMove = (e: ReactPointerEvent) => {
      // A finger that is down scrubs even though the reading is pinned; a mouse
      // only follows while nothing is pinned (the original rule).
      if (e.pointerType !== 'mouse' && touching.current) {
        apply(e.clientX);
        return;
      }
      if (pinned) return;
      apply(e.clientX);
    };
    const onPointerUp = (e: ReactPointerEvent) => {
      if (e.pointerType !== 'mouse') touching.current = false;
    };
    const onPointerLeave = (e: ReactPointerEvent) => {
      // On touch, pointerleave arrives straight after pointerup; the pin is what
      // keeps the reading on screen, and an outside tap is what clears it.
      if (e.pointerType !== 'mouse') return;
      if (!pinned) setCursor(null);
    };
    return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onPointerLeave };
  };

  // Outside tap clears a touch reading. Mouse pins keep their old lifetime
  // (re-click, or Escape), so desktop behaviour is untouched.
  useEffect(() => {
    if (cursor == null || !pinned) return;
    const onDocDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const t = e.target as Element | null;
      if (!t) return;
      if (hostRef.current?.contains(t)) return;
      if (t.closest('[data-chart-readout]')) return;
      clear();
    };
    document.addEventListener('pointerdown', onDocDown, true);
    return () => document.removeEventListener('pointerdown', onDocDown, true);
  }, [cursor, pinned, hostRef, clear]);

  return {
    cursor,
    setCursor,
    pinned,
    setPinned,
    clear,
    handlers,
  };
}

/** The readout card. See the file header for the phone / desktop split. */
export function ChartReadout({
  className = '',
  style,
  onClose,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  onClose?: () => void;
  children: ReactNode;
}) {
  const phone = useMediaQuery('(max-width: 767px)');
  if (!phone) {
    return (
      <div className={className} style={style} data-chart-readout>
        {children}
      </div>
    );
  }
  return createPortal(
    <div className={`${className} ge-readout-sheet`} data-chart-readout role="status" aria-live="polite">
      {onClose && (
        <button type="button" className="ge-readout-close" onClick={onClose} aria-label="Close readout">
          ×
        </button>
      )}
      {children}
    </div>,
    document.body,
  );
}
