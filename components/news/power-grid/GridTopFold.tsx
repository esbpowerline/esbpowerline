'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Folds the Overview KPI strip behind a one-line summary on phones, on every
 * tab except Overview.
 *
 * Why: the strip (hero + tiles + "What covers" + verification) sat above every
 * tab and cost ~2,100px of scrolling before a tab's own content began. On a
 * phone, off the Overview tab, the reader gets one 44px row naming the two
 * headline figures; a tap opens the full strip. Nothing is removed, only
 * folded. At >=768px, and whenever `collapse` is false, children render
 * exactly as before (the row is hidden by CSS; see "Top-block fold" in
 * app/grid-explorer-mobile.css).
 */
export function GridTopFold({
  collapse,
  summary,
  children,
}: {
  collapse: boolean;
  summary: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!collapse) return <>{children}</>;
  return (
    <div className="ge-topfold" data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="ge-topfold__row"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ge-topfold__text">{summary}</span>
        <span className="ge-topfold__cta">
          KPIs
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </span>
      </button>
      <div id={id} className="ge-topfold__body">
        {children}
      </div>
    </div>
  );
}
