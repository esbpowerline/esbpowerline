'use client';

import { useEffect, useRef } from 'react';

/**
 * The explorer's "pull the page to the tab's top" behaviour, lifted out of
 * PowerGridExplorer (which is on a line budget). Behaviour is documented at
 * each step below.
 */
export function useTabScroll() {
  const activeScrollIdRef = useRef<number | null>(null);
  const tabScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerScrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      if (activeScrollIdRef.current !== null) {
        cancelAnimationFrame(activeScrollIdRef.current);
        activeScrollIdRef.current = null;
      }

      const navbar = document.querySelector('.public-nav-bar');
      const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 0;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      // Phone/tablet: the sticky context bar sits under the navbar, so the
      // target must clear it too (0 on desktop, where the bar is display:none).
      const shellBar = document.querySelector('[data-ge-shell-bar]');
      const shellBarHeight = shellBar ? shellBar.getBoundingClientRect().height : 0;
      const targetY = elementPosition - navbarHeight - shellBarHeight - 24;
      
      const startY = window.scrollY;
      const difference = targetY - startY;

      // If already pixel-perfect target position, skip animation to avoid layout jitter
      if (Math.abs(difference) < 2) {
        return;
      }
      const duration = 420;
      const startTime = performance.now();

      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      };

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeInOutCubic(progress);
        
        window.scrollTo(0, startY + difference * ease);

        if (progress < 1) {
          activeScrollIdRef.current = requestAnimationFrame(step);
        } else {
          activeScrollIdRef.current = null;
        }
      };

      activeScrollIdRef.current = requestAnimationFrame(step);
    }
  };

  // True once the reader has picked a tab by hand. The navbar folds its
  // category ribbon for every hand-picked tab, Overview included, so each tab
  // click pulls the explorer to the same place; a first load on Overview keeps
  // the ribbon.
  const tabPickedRef = useRef(false);

  const scrollAfterTabPick = (tabId: string) => {
    tabPickedRef.current = true;
    // Same-tab clicks change no state, so the activeTab effect below would not
    // announce them; announce here as well.
    window.dispatchEvent(new CustomEvent('esb-grid-tab-change', { detail: { tab: tabId, picked: true } }));
    const foldsCategoryRibbon = !document.querySelector('.public-nav-bar__categories--folded');
    if (tabScrollTimerRef.current) clearTimeout(tabScrollTimerRef.current);
    // The navbar folds its category ribbon away once a tab is picked
    // (PublicNavbar, `gridImmersive`), which changes the navbar's height and so
    // the scroll target. `triggerScrollToElement` measures that height once and
    // animates against a fixed distance, so scrolling while the ribbon is still
    // folding lands short and then jumps as the document settles. Wait for the
    // 260ms fold when it is happening; keep the old 50ms when it is not. The
    // fold is itself the immediate feedback, so the wait does not read as lag.
    //
    // Then check again. Swapping panels can shorten the document for a moment
    // (a lazy panel shows a short skeleton first) and the browser clamps the
    // scroll position to the top when it does - after the first scroll has
    // already decided there was nothing to do. That was the "click the tab
    // twice" bug. The later passes are no-ops when the page is already in
    // place, and are dropped the moment the reader scrolls for themselves.
    let readerScrolled = false;
    const onReaderScroll = () => { readerScrolled = true; };
    const inputEvents = ['wheel', 'touchmove', 'keydown', 'mousedown'] as const;
    inputEvents.forEach((e) => window.addEventListener(e, onReaderScroll, { passive: true, once: true }));
    const first = foldsCategoryRibbon ? 300 : 50;
    const passes = [first, first + 550, first + 1300];
    const run = (i: number) => {
      tabScrollTimerRef.current = setTimeout(
        () => {
          tabScrollTimerRef.current = null;
          if (!readerScrolled) triggerScrollToElement('grid-status-overview-header');
          if (i + 1 < passes.length && !readerScrolled) run(i + 1);
          else inputEvents.forEach((e) => window.removeEventListener(e, onReaderScroll));
        },
        i === 0 ? passes[0] : passes[i] - passes[i - 1],
      );
    };
    run(0);
  };

  useEffect(() => {
    return () => {
      if (tabScrollTimerRef.current) clearTimeout(tabScrollTimerRef.current);
      if (activeScrollIdRef.current !== null) {
        cancelAnimationFrame(activeScrollIdRef.current);
      }
    };
  }, []);

  return { scrollAfterTabPick, tabPickedRef };
}
