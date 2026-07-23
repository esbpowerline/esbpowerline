'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function DownloadGridButton({ className = '', onDownloadSuccess }: { className?: string; onDownloadSuccess?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      try {
        // Latest-day, all datasets, as a single Excel workbook.
        const res = await fetch('/api/members/grid-export?format=xlsx&datasets=all');
        if (!res.ok) {
          throw new Error('Download failed');
        }
        const disposition = res.headers.get('Content-Disposition');
        const match = disposition ? /filename="?([^"]+)"?/.exec(disposition) : null;
        const filename = match ? match[1] : 'esb-grid-export.xlsx';
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success('Grid snapshot downloaded');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('esb-download-sync'));
        }
        if (onDownloadSuccess) {
          onDownloadSuccess();
        }
        router.refresh();
      } catch {
        toast.error('Could not download data package');
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={pending}
      className={cn('btn btn-primary flex items-center justify-center gap-1.5 text-xs w-full py-2', className)}
    >
      <Download className="h-3.5 w-3.5" />
      {pending ? 'Preparing…' : 'Download grid data (Excel)'}
    </button>
  );
}