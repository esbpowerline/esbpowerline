'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarClock, Check, FileEdit, Search, Send, Trash2, X } from 'lucide-react';
import { cmsToast } from '@/lib/cms-toast';
import { bulkOwnArticleAction } from '@/lib/actions/articles';
import type { MyDraft } from '@/lib/actions/articles';
import { AdminSecureActionDialog } from '@/components/admin/AdminSecureActionDialog';
import { AdminFormattedTime } from '@/components/admin/AdminFormattedTime';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * My Drafts — a writer's desk, not a newsroom console.
 *
 * The first version of this page reused the articles-desk table, and it was
 * the admin panel with two columns hidden: an author column and author
 * filter on a page showing one person's work, a status filter where every row
 * is a draft, a views count on stories nobody can see yet, flag toggles, and
 * "Return to author" pointed at yourself.
 *
 * What a writer actually needs from a list of their unfinished stories is:
 * which one was I last in, how far along is it, what is still stopping it
 * going out, and let me send several at once. That is this. The shared logic
 * is still shared — `bulkOwnArticleAction` for the writes, the same dialog
 * for scheduling — but the surface is its own.
 */
export function MyDraftsPanel({ drafts, canSchedule }: { drafts: MyDraft[]; canSchedule: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drafts;
    return drafts.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.category ?? '').toLowerCase().includes(q) ||
        (d.excerpt ?? '').toLowerCase().includes(q),
    );
  }, [drafts, query]);

  const visibleIds = useMemo(() => new Set(filtered.map((d) => d.id)), [filtered]);
  // Only what is on screen counts as selected, so a filter cannot hide rows
  // that a bulk action is about to touch.
  const activeIds = useMemo(
    () => Array.from(selected).filter((id) => visibleIds.has(id)),
    [selected, visibleIds],
  );
  const allVisibleSelected = filtered.length > 0 && activeIds.length === filtered.length;

  /** A draft with something missing cannot be published, so do not offer it. */
  const readyCount = useMemo(
    () => activeIds.filter((id) => drafts.find((d) => d.id === id)?.blockers.length === 0).length,
    [activeIds, drafts],
  );
  const blockedCount = activeIds.length - readyCount;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(filtered.map((d) => d.id)));
  }

  function run(action: 'publish' | 'schedule' | 'trash', scheduledAt?: string) {
    // Publishing and scheduling both validate, so a blocked draft is left
    // behind rather than failing the whole batch.
    const ids =
      action === 'trash'
        ? activeIds
        : activeIds.filter((id) => drafts.find((d) => d.id === id)?.blockers.length === 0);
    if (!ids.length) {
      cmsToast.error('Nothing to do', 'None of the selected drafts are ready.');
      return;
    }
    startTransition(async () => {
      try {
        const res = await bulkOwnArticleAction(ids, action, { scheduledAt });
        setSelected(new Set());
        setScheduleOpen(false);
        setTrashOpen(false);
        cmsToast.success(
          action === 'publish'
            ? `Published ${res.affected}`
            : action === 'schedule'
              ? `Scheduled ${res.affected}`
              : `Moved ${res.affected} to trash`,
          action === 'trash' ? 'Restore them from Editorial → Trash.' : undefined,
        );
        router.refresh();
      } catch (error) {
        cmsToast.error('Could not finish', error instanceof Error ? error.message : 'Please try again.');
      }
    });
  }

  if (drafts.length === 0) {
    return (
      <div className="my-drafts-empty">
        <FileEdit className="h-5 w-5" />
        <p>No drafts yet.</p>
        <Link href="/cms/articles/new" className="my-drafts-empty__cta">Start a story</Link>
      </div>
    );
  }

  return (
    <div className="my-drafts">
      <div className="my-drafts__toolbar">
        <div className="my-drafts__search">
          <Search className="h-3.5 w-3.5" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your drafts"
            className="my-drafts__search-input"
          />
        </div>
        <button type="button" className="my-drafts__selectall" onClick={toggleAll} disabled={!filtered.length}>
          {allVisibleSelected ? 'Clear selection' : `Select all ${filtered.length}`}
        </button>
      </div>

      {activeIds.length > 0 && (
        <div className="my-drafts__bulk">
          <div className="my-drafts__bulk-count">
            {activeIds.length} selected
            {/* Say why a count is smaller than the selection before the
                action runs, not after it quietly skips rows. */}
            {blockedCount > 0 && (
              <span className="my-drafts__bulk-note">
                · {blockedCount} not ready to publish
              </span>
            )}
          </div>
          <div className="my-drafts__bulk-actions">
            {readyCount > 0 && (
              <button type="button" className="my-drafts__bulk-btn" disabled={pending} onClick={() => run('publish')}>
                <Send className="h-3 w-3" /> Publish {readyCount}
              </button>
            )}
            {canSchedule && readyCount > 0 && (
              <button type="button" className="my-drafts__bulk-btn" disabled={pending} onClick={() => setScheduleOpen(true)}>
                <CalendarClock className="h-3 w-3" /> Schedule {readyCount}
              </button>
            )}
            <button
              type="button"
              className="my-drafts__bulk-btn my-drafts__bulk-btn--danger"
              disabled={pending}
              onClick={() => setTrashOpen(true)}
            >
              <Trash2 className="h-3 w-3" /> Move to trash
            </button>
            <button type="button" className="my-drafts__bulk-clear" onClick={() => setSelected(new Set())} disabled={pending}>
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>
      )}

      <ul className="my-drafts__list">
        {filtered.map((d) => {
          const checked = selected.has(d.id);
          return (
            <li key={d.id} className={cn('my-drafts__row', checked && 'my-drafts__row--selected')}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-label={`Select ${d.title}`}
                className="my-drafts__check"
                onClick={() => toggle(d.id)}
              >
                {checked && <Check className="h-3 w-3" />}
              </button>

              <div className="my-drafts__main">
                <Link href={`/cms/articles/${d.id}/edit`} className="my-drafts__title">
                  {d.title?.trim() || 'Untitled draft'}
                </Link>
                <div className="my-drafts__meta">
                  {d.category && <span className="my-drafts__cat">{d.category}</span>}
                  <span>{d.words.toLocaleString()} words</span>
                  <span>·</span>
                  <span>{d.readTime} min read</span>
                  <span>·</span>
                  <span>
                    Edited <AdminFormattedTime value={d.updatedAt} />
                  </span>
                </div>
              </div>

              {/* The whole point of a drafts list: what is still missing. */}
              <div className="my-drafts__state">
                {d.blockers.length === 0 ? (
                  <span className="my-drafts__ready">Ready to publish</span>
                ) : (
                  <span className="my-drafts__blocked" title={`Still needed: ${d.blockers.join(', ')}`}>
                    Needs {d.blockers.join(', ')}
                  </span>
                )}
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="my-drafts__none">No drafts match “{query}”.</li>
        )}
      </ul>

      {scheduleOpen && (
        <AdminSecureActionDialog
          open
          title={`Schedule ${readyCount} draft${readyCount === 1 ? '' : 's'}`}
          description="They go live automatically at the time you choose. The publish cron runs every 15 minutes, so a story goes out at or just after its time."
          confirmLabel="Schedule"
          variant="primary"
          requirePassword={false}
          requireDateTime
          dateTimeLabel="Go live at"
          loading={pending}
          onClose={() => !pending && setScheduleOpen(false)}
          onConfirm={({ scheduledAt }) => run('schedule', scheduledAt)}
        />
      )}

      {trashOpen && (
        <AdminSecureActionDialog
          open
          title={`Move ${activeIds.length} draft${activeIds.length === 1 ? '' : 's'} to trash`}
          description="You can restore them from Editorial → Trash until the retention window clears them."
          confirmLabel="Move to trash"
          variant="destructive"
          requirePassword={false}
          loading={pending}
          onClose={() => !pending && setTrashOpen(false)}
          onConfirm={() => run('trash')}
        />
      )}
    </div>
  );
}
