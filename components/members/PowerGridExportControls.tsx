'use client';

import { useSession } from '@/utils/supabase/auth-context';
import Link from 'next/link';
import { GridExportDialog } from '@/components/members/GridExportDialog';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';

export function PowerGridExportControls({
  className = '',
  latestDate,
  earliestDate,
}: {
  className?: string;
  latestDate?: string;
  earliestDate?: string;
}) {
  const { status } = useSession();
  const signedIn = status === 'authenticated';

  if (status === 'loading') {
    return (
      <div className="h-9 w-full bg-muted/20 animate-pulse rounded-2xl" />
    );
  }

  if (signedIn && latestDate) {
    return (
      <GridExportDialog
        latestDate={latestDate}
        earliestDate={earliestDate ?? latestDate}
        className={className}
      />
    );
  }

  return (
    <Link
      href="/members/login?callbackUrl=/grid-explorer"
      className={cn(
        'btn btn-secondary custom-tooltip-trigger flex items-center justify-center gap-1.5 text-xs w-full py-2 hover:bg-secondary transition-colors',
        className
      )}
      data-tooltip="Member access required to download CSV data snapshots"
    >
      <Download className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">Login to download CSV</span>
    </Link>
  );
}

