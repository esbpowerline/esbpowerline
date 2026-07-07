'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import { GridDataLockedGate } from '@/components/news/power-grid/GridDataLockedGate';

type GridLockedContentProps = {
  locked: boolean;
  requiredTier: GridAccessTier | null;
  selectedDate: string;
  children: ReactNode;
  className?: string;
  onTryDemo?: () => void;
  onClose?: () => void;
  variant?: 'full' | 'micro';
};

/**
 * Wraps grid explorer body — when locked, blurs content and shows the access gate overlay.
 */
export function GridLockedContent({
  locked,
  requiredTier,
  selectedDate,
  children,
  className,
  onTryDemo,
  onClose,
  variant = 'full',
}: GridLockedContentProps) {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'transition-all duration-500 ease-out',
          locked && 'pointer-events-none select-none blur-md brightness-[0.55] saturate-50',
        )}
        aria-hidden={locked || undefined}
      >
        {children}
      </div>

      {locked && requiredTier && variant === 'full' && (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-[55] bg-background/40 backdrop-blur-[2px]"
            aria-hidden
          />
          <GridDataLockedGate
            requiredTier={requiredTier}
            selectedDate={selectedDate}
            variant="overlay"
            onTryDemo={onTryDemo}
            onClose={onClose ?? onTryDemo}
          />
        </>
      )}

      {locked && requiredTier && variant === 'micro' && (
        <div className="absolute inset-0 z-[55] flex flex-col items-center justify-center p-4 bg-background/10">
          <a href="/members/subscription" className="btn btn-primary rounded-full px-6 py-2.5 shadow-2xl shadow-primary/20 flex items-center gap-2 border border-primary/30 text-sm font-semibold pointer-events-auto hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Upgrade to Unlock</span>
          </a>
        </div>
      )}
    </div>
  );
}