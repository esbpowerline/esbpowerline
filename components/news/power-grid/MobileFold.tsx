'use client';

/**
 * <MobileFold title="How to read this chart">…prose…</MobileFold>
 *
 * Folds explanatory prose behind a 44px disclosure row below 1024px and leaves
 * it completely alone on desktop.
 *
 *   >= 1024px  children render as-is: the <details> is `display: contents`, the
 *              summary row is hidden, no wrapper box, no padding. Desktop is identical.
 *   <  1024px  a collapsed disclosure, styled like the target's "How to read this
 *              chart" row (tinted pill, chevron). The prose is never removed, only folded.
 *
 * Props
 *   title        row label (string / node)
 *   defaultOpen  start expanded on phone/tablet (default false)
 *   className    extra class on the <details>
 *
 * Hydration: the server always renders `open` (so no-JS readers and desktop get
 * the prose). Until the effect below has run, CSS hides the body on <1024px so
 * a phone does not flash the long text; then it closes the details once and
 * re-opens it whenever the viewport grows to desktop. All rules are in
 * app/grid-explorer-charts.css (.ge-fold).
 */

import { useEffect, useRef, type ReactNode } from 'react';
import '@/app/grid-explorer-charts.css';

export function MobileFold({
  title,
  children,
  defaultOpen = false,
  className = '',
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = (initial: boolean) => {
      if (mq.matches) el.open = true;
      else if (initial) el.open = defaultOpen;
    };
    sync(true);
    el.setAttribute('data-ge-ready', '');
    const onChange = () => sync(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [defaultOpen]);

  return (
    <details ref={ref} className={`ge-fold ${className}`.trim()} open>
      <summary className="ge-fold__summary">
        <span>{title}</span>
        <span className="ge-fold__chev" aria-hidden="true">›</span>
      </summary>
      <div className="ge-fold__body">{children}</div>
    </details>
  );
}

export default MobileFold;
