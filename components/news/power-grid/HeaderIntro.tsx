'use client';

import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Page intro paragraph for the Grid Explorer header. Below 768px the full text
 * stays in the DOM (SEO) but is clamped to two lines with a 44px "More" toggle;
 * from 768px up the paragraph is unclamped and the toggle is hidden, so tablets
 * and desktop render as before. See "Page header" in app/grid-explorer-mobile.css.
 */
export function HeaderIntro({ heading, children, className }: { heading: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      {/* Heading and toggle share one 44px row on phones; display:contents from 768px. */}
      <div className="ge-intro__row">
        {heading}
        <button
          type="button"
          className="ge-intro__toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Less' : 'More'}
        </button>
      </div>
      <p id={id} className={cn(className, 'ge-intro', open && 'is-open')}>
        {children}
      </p>
    </>
  );
}
