'use client';

import Link from 'next/link';
import { Lock, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GridTierAccessState } from '@/hooks/useGridTierAccess';
import { getTierStatusMessage } from '@/lib/membership/grid-access-messaging';

type GridArchiveTeaserProps = {
  access: GridTierAccessState;
  totalArchiveDays: number;
  onExploreLocked: () => void;
  className?: string;
};

export function GridArchiveTeaser({
  access,
  totalArchiveDays,
  onExploreLocked,
  className,
}: GridArchiveTeaserProps) {
  if (access.loading || access.tier === 'plan_999') return null;

  const status = getTierStatusMessage(access.tier, totalArchiveDays);

  return (
    <section
      className={cn(
        'relative mt-8 overflow-hidden rounded-2xl border border-dashed border-primary/30',
        className,
      )}
      aria-label="Historical archive preview"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-muted/40 via-primary/5 to-muted/40" aria-hidden />
      <div className="absolute inset-0 backdrop-blur-[6px]" aria-hidden />

      <div className="relative grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Historical archive
            </p>
            <h3 className="mt-1 text-base font-bold text-foreground md:text-lg">
              {totalArchiveDays.toLocaleString()} days of grid data — locked for you
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {status.upgradeLine}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          <button
            type="button"
            onClick={onExploreLocked}
            className="btn btn-secondary inline-flex items-center justify-center gap-2 text-sm"
          >
            <Calendar className="h-4 w-4" />
            Preview locked date
          </button>
          {status.upgradeHref && (
            <Link
              prefetch={false}
              href={status.upgradeHref}
              className="btn btn-primary inline-flex items-center justify-center gap-2 text-sm"
            >
              Unlock archive
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}