import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * True while the browser is printing (or the page is in print media).
 *
 * Lets a print-only block stay out of the DOM on screen. `beforeprint` fires
 * before the print layout is computed, and `flushSync` renders the block in
 * time for it; `matchMedia('print')` covers engines/emulation that switch
 * media without the event (Playwright `emulateMedia`, some PDF paths).
 * False on the server and on first render, so hydration is unaffected.
 */
export function usePrintMode(): boolean {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('print');
    const on = () => flushSync(() => setPrinting(true));
    const off = () => setPrinting(mq.matches);
    const onMq = () => (mq.matches ? on() : off());
    if (mq.matches) setPrinting(true);
    window.addEventListener('beforeprint', on);
    window.addEventListener('afterprint', off);
    mq.addEventListener('change', onMq);
    return () => {
      window.removeEventListener('beforeprint', on);
      window.removeEventListener('afterprint', off);
      mq.removeEventListener('change', onMq);
    };
  }, []);
  return printing;
}
