'use client';

import Link from 'next/link';
import { Lock, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import { getLockedDateMessage } from '@/lib/membership/grid-access-messaging';

type GridDataLockedGateProps = {
  requiredTier: GridAccessTier;
  selectedDate: string;
  className?: string;
  variant?: 'overlay' | 'inline';
  onTryDemo?: () => void;
};

export function GridDataLockedGate({
  requiredTier,
  selectedDate,
  className,
  variant = 'overlay',
  onTryDemo,
}: GridDataLockedGateProps) {
  const msg = getLockedDateMessage(requiredTier, selectedDate);

  const card = (
    <div
      className={cn(
        'relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl',
        variant === 'overlay' && 'ring-1 ring-primary/20',
        className,
      )}
      role="dialog"
      aria-labelledby="grid-lock-title"
      aria-describedby="grid-lock-desc"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-amber-500/5" aria-hidden />
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl" aria-hidden />

      <div className="relative px-6 py-7 md:px-8 md:py-9 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-inner">
          <Lock className="h-6 w-6" strokeWidth={2.25} />
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          {msg.badge}
        </p>
        <h3 id="grid-lock-title" className="mt-2 text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {msg.headline}
        </h3>
        <p id="grid-lock-desc" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {msg.subheadline}
        </p>

        <div className="mt-5 space-y-2 rounded-xl border border-border/50 bg-muted/25 px-4 py-3 text-left text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Your access: </span>
            {msg.currentAccess}
          </p>
          <p className="font-medium text-foreground">{msg.upgradePrompt}</p>
        </div>

        {msg.showPaymentSoon && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-left text-xs text-amber-900 dark:text-amber-100">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">Payment coming soon</p>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-200/90">
                bKash, cards &amp; mobile banking checkout is being finalised. Choose a plan now — we&apos;ll notify you when billing opens.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={msg.primaryHref}
            className="btn btn-primary inline-flex items-center justify-center gap-2 text-sm"
          >
            {msg.primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {msg.secondaryLabel && msg.secondaryHref && (
            <Link href={msg.secondaryHref} className="btn btn-secondary text-sm">
              {msg.secondaryLabel}
            </Link>
          )}
        </div>
        {onTryDemo && (
          <div className="mt-4 pt-4 border-t border-border/50 text-center">
            <button
              onClick={onTryDemo}
              className="text-xs font-semibold text-primary hover:text-primary-hover underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all"
            >
              Test the Premium Features in our Interactive Demo Sandbox
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'inline') return card;

  return (
    <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      <div className="pointer-events-auto w-full">{card}</div>
    </div>
  );
}