'use client';

import { useSession } from '@/utils/supabase/auth-context';
import { useEffect, useState, useTransition } from 'react';

import { FileDown, ArrowRight, Loader2, RefreshCw, Printer } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { getSavedSiteTheme, applySiteTheme, type SiteTheme } from '@/lib/site-theme';

export function MemberToolsPanel() {
  const { status } = useSession();
  const signedIn = status === 'authenticated';

  const [downloads, setDownloads] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  function fetchRecentDownloads() {
    if (!signedIn) return;
    startTransition(async () => {
      try {
        const res = await fetch('/api/members/recent-downloads', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setDownloads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load recent downloads:', err);
      }
    });
  }

  function handlePdfPrint(theme: SiteTheme) {
    if (typeof window === 'undefined') return;
    const currentTheme = getSavedSiteTheme();
    applySiteTheme(theme);
    setTimeout(() => {
      const restore = () => {
        applySiteTheme(currentTheme);
        window.removeEventListener('afterprint', restore);
      };
      window.addEventListener('afterprint', restore);
      window.print();
      setTimeout(restore, 2000);
    }, 300);
  }

  useEffect(() => {
    if (signedIn) {
      fetchRecentDownloads();
    }
  }, [signedIn]);

  // Listen to window custom event if we want to sync downloads from DownloadGridButton
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleSync = () => fetchRecentDownloads();
      window.addEventListener('esb-download-sync', handleSync);
      return () => window.removeEventListener('esb-download-sync', handleSync);
    }
  }, [signedIn]);

  if (!signedIn) return null;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 no-print border-t border-border/40 pt-6">
      {/* Downloads History Card */}
      <div className="w-full border border-border/40 bg-muted/10 rounded-xl p-4 space-y-2 text-left flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileDown className="h-4 w-4 text-primary" /> My Recent Exports
            </h4>
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <button
                type="button"
                onClick={fetchRecentDownloads}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                title="Refresh history"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {downloads.length === 0 ? (
            <p className="text-xs text-muted-foreground italic leading-relaxed py-2">
              No recent exports. Download a CSV snapshot above.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {downloads.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-xs p-2.5 hover:bg-muted/40 rounded-lg transition-colors border border-border/10"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-foreground truncate">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt))}
                    </p>
                  </div>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      className="text-primary hover:underline font-bold text-xs shrink-0 hover:text-primary-hover"
                    >
                      Fetch
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pt-3 border-t border-border/30 text-center">
          <Link
            href="/members/downloads"
            className="text-primary hover:underline text-xs font-bold flex items-center justify-center gap-1 transition-all"
          >
            All library downloads <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* PDF Export Card */}
      <div className="w-full border border-border/40 bg-muted/10 rounded-xl p-4 space-y-2 text-left flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
            <Printer className="h-4 w-4 text-primary" /> PDF Report Export
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Generate and download a beautifully formatted A4 audit report with all generation statistics, transmission assets, and financial metrics in your chosen layout theme.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePdfPrint('midnight')}
              className="btn btn-secondary text-xs py-2 px-1 justify-center text-center font-bold bg-blue-950/20 text-blue-400 hover:bg-blue-950/40 border-blue-900/30 transition-colors"
            >
              Midnight
            </button>
            <button
              type="button"
              onClick={() => handlePdfPrint('dark')}
              className="btn btn-secondary text-xs py-2 px-1 justify-center text-center font-bold bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900 border-zinc-800 transition-colors"
            >
              Charcoal
            </button>
            <button
              type="button"
              onClick={() => handlePdfPrint('white')}
              className="btn btn-secondary text-xs py-2 px-1 justify-center text-center font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300 transition-colors"
            >
              Light Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
