'use client';

import Link from 'next/link';
import { Shield, ChevronRight, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GridTierAccessState } from '@/hooks/useGridTierAccess';
import { getTierStatusMessage } from '@/lib/membership/grid-access-messaging';

type GridAccessBannerProps = {
  access: GridTierAccessState;
  totalArchiveDays?: number;
  className?: string;
};

const TIER_STYLES = {
  visitor: 'border-amber-500/30 bg-amber-500/5',
  member: 'border-emerald-500/30 bg-emerald-500/5',
  plan_499: 'border-primary/30 bg-primary/5',
  plan_999: 'border-emerald-500/25 bg-emerald-500/5',
} as const;

export function GridAccessBanner({ access, totalArchiveDays, className }: GridAccessBannerProps) {
  if (access.loading) {
    return (
      <div className={cn('h-16 animate-pulse rounded-2xl bg-muted/30', className)} />
    );
  }

  const { tier, earliestAllowedDate, latestDate, limits } = access;
  const status = getTierStatusMessage(tier, totalArchiveDays);
  const isFullAccess = tier === 'plan_999';

  const windowLabel = earliestAllowedDate
    ? `${earliestAllowedDate} → ${latestDate}`
    : `Full archive · through ${latestDate}`;

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3.5 md:px-5',
        TIER_STYLES[tier],
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
              isFullAccess
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-primary/25 bg-primary/10 text-primary',
            )}
          >
            {isFullAccess ? (
              <Unlock className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-bold text-foreground">{status.statusLabel}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                · {limits.shortLabel}
              </span>
              {!isFullAccess && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Older data locked
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/90">{status.accessWindow}</span>
              {' · '}
              <span className="font-mono text-[10px]">{windowLabel}</span>
            </p>
          </div>
        </div>

        {status.upgradeLine && status.upgradeHref && (
          <Link
            prefetch={false}
            href={status.upgradeHref}
            className="inline-flex shrink-0 items-center gap-1 self-start rounded-xl border border-primary/25 bg-background/70 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:self-center"
          >
            <span className="max-w-[14rem] sm:max-w-none">{status.upgradeLine}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}