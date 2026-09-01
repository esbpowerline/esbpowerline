import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReleaseRevisionRow } from '@/lib/data/release-history.server';

/**
 * The publication history, made visible.
 *
 * Every publish, correction, revoke and restore writes an append-only
 * DataReleaseRevision row; this card is the reviewer's view of that ledger.
 * The reason column is the point: a correction whose reason is a defaulted
 * "payload replaced" is a prompt to write better reasons, not a decoration.
 */

const KIND_STYLE: Record<string, string> = {
  PUBLISH: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  CORRECT: 'text-amber-600 dark:text-amber-400 border-amber-500/30',
  REVOKE: 'text-rose-600 dark:text-rose-400 border-rose-500/30',
  RESTORE: 'text-sky-600 dark:text-sky-400 border-sky-500/30',
};

function when(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dhaka',
  }).format(d);
}

export function ReleaseHistoryCard({ revisions }: { revisions: ReleaseRevisionRow[] }) {
  return (
    <section className="rounded-xl border border-border/40 bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold">Publication history</h2>
        <span className="text-[11px] text-muted-foreground">
          append-only — a correction never overwrites what was published before it
        </span>
      </div>

      {revisions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No revisions recorded yet, or the history is unreachable. Every publish from now on
          appears here with its reason and checksum chain.
        </p>
      ) : (
        <div className="overflow-x-auto">
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
              {revisions.map((r) => (
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
        </div>
      )}
    </section>
  );
}
