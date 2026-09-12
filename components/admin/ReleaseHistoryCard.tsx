'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Check, ChevronDown, History, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AdminCard, AdminTableShell } from '@/components/admin/AdminUI';
import type { ReleaseRevisionRow } from '@/lib/data/release-history.server';

/**
 * The publication history, made visible.
 *
 * Every publish, correction, revoke and restore writes an append-only
 * DataReleaseRevision row; this card is the reviewer's view of that ledger.
 * The reason column is the point: a correction whose reason is a defaulted
 * "payload replaced" is a prompt to write better reasons, not a decoration.
 */

// The status colours: publish is fine, a correction wants a look, a revoke is
// bad, and a restore is the accent. Raw Tailwind hues before, sky among them.
const KIND_STYLE: Record<string, string> = {
  PUBLISH: 'text-[hsl(var(--staff-ok))] border-[hsl(var(--staff-ok)/0.3)]',
  CORRECT: 'text-[hsl(var(--staff-warn))] border-[hsl(var(--staff-warn)/0.3)]',
  REVOKE: 'text-[hsl(var(--staff-bad))] border-[hsl(var(--staff-bad)/0.3)]',
  RESTORE: 'text-[hsl(var(--staff-accent))] border-[hsl(var(--staff-accent)/0.3)]',
};

function when(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Dhaka',
  }).format(d);
}

/** Formats ISO string into Asia/Dhaka YYYY-MM-DD date */
function dhakaDateKey(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function formatDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function ReleaseHistoryCard({ revisions }: { revisions: ReleaseRevisionRow[] }) {
  // 'last-7-days', 'all', or a specific YYYY-MM-DD string
  const [selectedFilter, setSelectedFilter] = useState<string>('last-7-days');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Group dates present in revisions with counts
  const { availableDates, dateCounts, sevenDaysCutoffIso } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of revisions) {
      const k = dhakaDateKey(r.publishedAt);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const sorted = [...counts.keys()].sort().reverse();

    // 7 days ago timestamp in ms
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      availableDates: sorted,
      dateCounts: counts,
      sevenDaysCutoffIso: cutoff,
    };
  }, [revisions]);

  const filteredRevisions = useMemo(() => {
    if (selectedFilter === 'last-7-days') {
      return revisions.filter((r) => r.publishedAt >= sevenDaysCutoffIso);
    }
    if (selectedFilter === 'all') {
      return revisions;
    }
    // Specific date key (YYYY-MM-DD)
    return revisions.filter((r) => dhakaDateKey(r.publishedAt) === selectedFilter);
  }, [revisions, selectedFilter, sevenDaysCutoffIso]);

  // Label to show on the custom trigger
  const triggerLabel = useMemo(() => {
    if (selectedFilter === 'last-7-days') return 'Last 7 days';
    if (selectedFilter === 'all') return `All recorded (${revisions.length})`;
    return formatDayLabel(selectedFilter);
  }, [selectedFilter, revisions.length]);

  return (
    // An AdminCard like every other panel on the page. It was a hand-built
    // `rounded-xl p-4` box with its own header row, so it sat at a different
    // radius, a different border weight and a different title size from the
    // cards directly above it.
    <AdminCard
      title="Publication history"
      icon={History}
      action={
        <div className="flex items-center gap-2">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'group inline-flex h-8 items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-2.5 text-[12px] font-medium shadow-sm backdrop-blur-sm transition',
                  'hover:border-border hover:bg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/60',
                  popoverOpen && 'border-primary/50 ring-1 ring-primary/40',
                )}
                aria-label="Filter publications by date"
              >
                <Calendar className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
                <span className="truncate">{triggerLabel}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
                    popoverOpen && 'rotate-180 text-foreground',
                  )}
                />
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={6}
              className="z-[250] w-60 rounded-xl border border-border/60 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md"
            >
              <div className="max-h-72 overflow-y-auto pr-0.5">
                {/* Quick Presets */}
                <div className="mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  Quick View
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilter('last-7-days');
                    setPopoverOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] transition',
                    selectedFilter === 'last-7-days'
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-foreground hover:bg-muted/70',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 opacity-70" />
                    Last 7 days
                  </span>
                  {selectedFilter === 'last-7-days' && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilter('all');
                    setPopoverOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] transition',
                    selectedFilter === 'all'
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-foreground hover:bg-muted/70',
                  )}
                >
                  <span>All recorded</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {revisions.length}
                  </span>
                </button>

                {availableDates.length > 0 && (
                  <>
                    <div className="my-1.5 border-t border-border/40" />
                    <div className="mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      By Specific Date
                    </div>

                    <div className="space-y-0.5">
                      {availableDates.map((dateKey) => {
                        const active = selectedFilter === dateKey;
                        const count = dateCounts.get(dateKey) ?? 0;
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => {
                              setSelectedFilter(dateKey);
                              setPopoverOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] transition',
                              active
                                ? 'bg-primary/10 font-semibold text-primary'
                                : 'text-foreground hover:bg-muted/70',
                            )}
                          >
                            <span className="tabular-nums">{formatDayLabel(dateKey)}</span>
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.2 text-[10.5px] tabular-nums font-mono',
                                active
                                  ? 'bg-primary/20 text-primary font-medium'
                                  : 'bg-muted/60 text-muted-foreground',
                              )}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {selectedFilter !== 'last-7-days' && (
            <button
              type="button"
              onClick={() => setSelectedFilter('last-7-days')}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/60 bg-background px-2.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Reset to last 7 days"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      }
    >
      <p className="mb-3 text-[11px] text-muted-foreground">
        Append-only ledger — every publish, correction, revoke and restore, with its reason.
      </p>

      {revisions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No revisions recorded yet, or the history is unreachable. Every publish from now on
          appears here with its reason and checksum chain.
        </p>
      ) : filteredRevisions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            No publications found for {selectedFilter === 'last-7-days' ? 'the last 7 days' : selectedFilter}.
          </p>
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className="mt-2 text-[11px] font-semibold text-primary underline-offset-4 hover:underline"
          >
            Show all recorded history ({revisions.length})
          </button>
        </div>
      ) : (
        <>
          {/* The shell's table, flush in the card — this page had three
              different table styles and this was the third. */}
          <AdminTableShell className="admin-table-shell--flush">
          <table className="w-full text-left text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr className="border-b border-border/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">When (BST)</th>
                <th className="py-1.5 pr-3 font-medium">Feed · key</th>
                <th className="py-1.5 pr-3 font-medium">Rev</th>
                <th className="py-1.5 pr-3 font-medium">Kind</th>
                <th className="py-1.5 pr-3 font-medium">Reason</th>
                <th className="py-1.5 font-medium">Checksum</th>
              </tr>
            </thead>
            <tbody>
              {filteredRevisions.map((r) => (
                <tr key={r.id} className="border-b border-border/20 align-top">
                  <td className="whitespace-nowrap py-1.5 pr-3 text-muted-foreground">
                    {when(r.publishedAt)}
                  </td>
                  <td className="whitespace-nowrap py-1.5 pr-3 font-medium">
                    {r.feed} <span className="text-muted-foreground">·</span> {r.key}
                    {r.current && (
                      <span className="ml-1.5 rounded border border-border/40 px-1 text-[9px] uppercase text-muted-foreground">
                        current
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3">{r.revision}</td>
                  <td className="py-1.5 pr-3">
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                        KIND_STYLE[r.kind] ?? 'text-muted-foreground border-border/40',
                      )}
                    >
                      {r.kind}
                    </span>
                  </td>
                  <td className="max-w-[26rem] py-1.5 pr-3 text-muted-foreground">{r.reason}</td>
                  <td className="whitespace-nowrap py-1.5 font-mono text-[10px] text-muted-foreground">
                    {r.previousChecksum ? `${r.previousChecksum.slice(0, 8)} → ` : ''}
                    {r.checksum.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </AdminTableShell>
          <p className="mt-2 text-[10.5px] text-muted-foreground">
            Showing {filteredRevisions.length} of {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
            {selectedFilter === 'last-7-days'
              ? ' from the last 7 days'
              : selectedFilter !== 'all'
                ? ` on ${formatDayLabel(selectedFilter)}`
                : ''}
          </p>
        </>
      )}
    </AdminCard>
  );
}
