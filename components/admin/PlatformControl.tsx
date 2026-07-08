'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/utils/supabase/auth-context';
import { useAdminChangeQueue } from '@/components/admin/AdminChangeQueueProvider';
import { toast } from 'sonner';
import {
  Sparkles, ChevronDown, RefreshCw, Settings,
  FileText, Pin, Star, Layers, Inbox, MessageSquare,
  Check, RotateCcw, Send, Clock, Eye,
} from 'lucide-react';
import { cn, formatEditorialTimestamp } from '@/lib/utils';
import { can } from '@/lib/constants';
import {
  AdminDropdownBackdrop,
  AdminDropdownPanel,
  AdminDropdownTrigger,
  useAdminDropdown,
} from '@/components/admin/AdminDropdown';
import {
  getAdminDeskSnapshot,
  revalidatePublicSite,
} from '@/lib/actions/platform';
import {
  approveReviewSubmission,
  dismissReviewNotice,
  returnReviewSubmission,
} from '@/lib/actions/review-workflow';
import { AdminReviewNoteDialog } from '@/components/admin/AdminReviewNoteDialog';

type DeskSnapshot = Awaited<ReturnType<typeof getAdminDeskSnapshot>>;
type ReviewItem = DeskSnapshot['reviewQueue'][number];

const STAT_ITEMS = [
  { key: 'inReview' as const, label: 'Review', title: 'Awaiting admin review' },
  { key: 'draft' as const, label: 'Draft', title: 'Draft articles' },
  { key: 'published' as const, label: 'Live', title: 'Published articles' },
  { key: 'scheduled' as const, label: 'Sched', title: 'Scheduled articles' },
];

const EMPTY: DeskSnapshot = {
  published: 0,
  featured: 0,
  pinned: 0,
  draft: 0,
  inReview: 0,
  scheduled: 0,
  settingsCount: 0,
  carouselMode: 'managed',
  reviewCount: 0,
  pendingComments: 0,
  reviewQueue: [],
};

type ReviewAction = 'approve' | 'publish' | 'return';

export function PlatformControl() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { upsertChange } = useAdminChangeQueue();
  const { open, toggle, close } = useAdminDropdown();
  const [pending, startTransition] = useTransition();
  const [snapshot, setSnapshot] = useState<DeskSnapshot | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewItem | null>(null);

  const canEditSettings = session?.user?.role ? can(session.user.role, 'settings.edit') : false;
  const canReview = session?.user?.role ? can(session.user.role, 'article.review') : false;
  const canModerate = session?.user?.role ? can(session.user.role, 'comment.moderate_any') : false;

  const loadSnapshot = useCallback(async (silent = false) => {
    if (!silent) setLoadState('loading');
    try {
      const data = await getAdminDeskSnapshot();
      setSnapshot(data);
      setLoadState('ready');
    } catch {
      if (!silent) {
        setSnapshot(EMPTY);
        setLoadState('error');
      }
    }
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    if (loadState === 'idle') {
      loadSnapshot(false);
    }

    // Poll every 60s (was 15s) — skip entirely when tab is hidden
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadSnapshot(true);
    }, 60_000);

    // Refresh immediately when user returns to this tab
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden && loadState === 'ready') {
        loadSnapshot(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [session?.user, loadState, loadSnapshot]);

  useEffect(() => {
    if (open && session?.user && loadState === 'ready') {
      void loadSnapshot(true);
    }
  }, [open, session?.user, loadState, loadSnapshot]);

  function handleRevalidate() {
    if (!canEditSettings) return;
    startTransition(async () => {
      try {
        const res = await revalidatePublicSite();
        toast.success(`Public cache refreshed (${res.paths} routes)`);
        await loadSnapshot();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to refresh');
      }
    });
  }

  function openReviewAction(item: ReviewItem, action: ReviewAction) {
    if (!item.article) return;
    setReviewTarget(item);
    setReviewAction(action);
  }

  function closeReviewDialog() {
    setReviewAction(null);
    setReviewTarget(null);
  }

  async function handleReviewConfirm(note: string) {
    if (!reviewTarget?.article || !reviewAction) return;
    const articleId = reviewTarget.article.id;
    startTransition(async () => {
      try {
        if (reviewAction === 'return') {
          await returnReviewSubmission(articleId, note);
          toast.success('Returned to author', {
            description: 'Your notes were sent with the story for revision.',
          });
        } else {
          const res = await approveReviewSubmission(articleId, {
            note: note || undefined,
            publish: reviewAction === 'publish',
          });
          toast.success(
            res.published ? 'Approved and published' : 'Approved for publication',
            {
              description: res.published
                ? 'The story is now live on the site.'
                : 'The author can publish when ready.',
            },
          );
        }
        await dismissReviewNotice(reviewTarget.id);
        closeReviewDialog();
        await loadSnapshot();
      } catch (e: unknown) {
        toast.error('Review action failed', {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    });
  }

  const stats = snapshot ?? EMPTY;
  const badgeCount = stats.reviewCount + (canModerate && stats.pendingComments > 0 ? 1 : 0);

  return (
    <div className="relative hidden lg:block shrink-0">
      <AdminDropdownTrigger open={open} onClick={toggle} aria-label="Platform desk">
        <Sparkles className="h-3.5 w-3.5 text-rose-400 shrink-0" />
        <span className="admin-dropdown-trigger-label">Platform</span>
        {badgeCount > 0 && (
          <span className="admin-platform-badge">{badgeCount > 9 ? '9+' : badgeCount}</span>
        )}
        <ChevronDown className={cn('h-3 w-3 shrink-0 opacity-60 transition-transform duration-150', open && 'rotate-180')} />
      </AdminDropdownTrigger>

      {open && (
        <>
          <AdminDropdownBackdrop onClose={close} />
          <AdminDropdownPanel className="admin-platform-menu admin-platform-menu--desk">
            <div className="admin-platform-desk-header">
              <div>
                <div className="admin-platform-desk-title">Platform desk</div>
                <p className="admin-platform-desk-subtitle">Review queue, publishing health &amp; site controls</p>
              </div>
            </div>

            {loadState === 'loading' ? (
              <div className="admin-platform-loading">
                <span className="admin-platform-spinner" />
                Loading desk…
              </div>
            ) : (
              <>
                {loadState === 'error' && (
                  <p className="admin-platform-hint admin-platform-hint--warn">Could not load live counts — showing defaults.</p>
                )}

                <div className="admin-platform-stats admin-platform-stats--desk">
                  {STAT_ITEMS.map(({ key, label, title }) => (
                    <div key={key} title={title}>
                      <span>{stats[key]}</span>
                      <small>{label}</small>
                    </div>
                  ))}
                </div>

                {canModerate && stats.pendingComments > 0 && (
                  <Link href="/admin/comments" className="admin-platform-alert" onClick={close}>
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="admin-platform-alert__copy">
                      <span className="admin-platform-alert__title">Comments awaiting moderation</span>
                      <span className="admin-platform-alert__detail">Reader discussion needs a decision</span>
                    </span>
                    <span className="admin-platform-alert__count">{stats.pendingComments}</span>
                  </Link>
                )}

                <div className="admin-platform-section-label">Editorial review inbox</div>

                {stats.reviewQueue.length === 0 ? (
                  <div className="admin-platform-inbox-empty">
                    <Inbox className="h-7 w-7 text-muted-foreground/50" strokeWidth={1.5} />
                    <p className="admin-platform-inbox-empty__title">Inbox clear</p>
                    <p className="admin-platform-inbox-empty__text">
                      Editors submit drafts here for sign-off before publish.
                    </p>
                  </div>
                ) : (
                  <ul className="admin-platform-inbox">
                    {stats.reviewQueue.map((item) => (
                      <li key={item.id} className="admin-platform-review-card">
                        <div className="admin-platform-review-card__head">
                          <span className="admin-platform-review-card__type">Review request</span>
                          <time className="admin-platform-review-card__time" dateTime={item.createdAt}>
                            {formatEditorialTimestamp(item.createdAt)}
                          </time>
                        </div>
                        {item.article && (
                          <div className="admin-platform-review-card__title">{item.article.title}</div>
                        )}
                        <p className="admin-platform-review-card__message">{item.message}</p>
                        <div className="admin-platform-review-card__meta">
                          From {item.senderName}
                          {item.article?.category ? ` · ${item.article.category}` : ''}
                        </div>
                        {item.article && canReview && (
                          <div className="admin-platform-review-card__actions">
                            <Link
                              href={`/admin/articles?review=${item.article.id}`}
                              className="admin-platform-review-btn admin-platform-review-btn--ghost"
                              onClick={close}
                            >
                              <Eye className="h-3 w-3" />
                              Open
                            </Link>
                            <button
                              type="button"
                              className="admin-platform-review-btn admin-platform-review-btn--approve"
                              disabled={pending}
                              onClick={() => openReviewAction(item, 'approve')}
                            >
                              <Check className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              type="button"
                              className="admin-platform-review-btn admin-platform-review-btn--publish"
                              disabled={pending}
                              onClick={() => openReviewAction(item, 'publish')}
                            >
                              <Send className="h-3 w-3" />
                              Publish
                            </button>
                            <button
                              type="button"
                              className="admin-platform-review-btn admin-platform-review-btn--return"
                              disabled={pending}
                              onClick={() => openReviewAction(item, 'return')}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Return
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="admin-platform-divider" />

                <div className="admin-platform-section-label">Homepage carousel</div>
                <p className="admin-platform-hint">
                  Featured stories are served from published articles (breaking, featured, then latest).
                </p>

                <div className="admin-platform-divider" />

                <div className="admin-platform-actions admin-platform-actions--compact">
                  <button
                    type="button"
                    className="admin-platform-action"
                    onClick={handleRevalidate}
                    disabled={pending || !canEditSettings}
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5 shrink-0', pending && 'animate-spin')} />
                    <span>Refresh public cache</span>
                  </button>
                  <Link href="/admin/settings" className="admin-platform-action" onClick={close}>
                    <Settings className="h-3.5 w-3.5 shrink-0" />
                    <span>Site settings</span>
                  </Link>
                  <Link href="/admin/articles" className="admin-platform-action" onClick={close}>
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span>Content manager</span>
                  </Link>
                  {stats.scheduled > 0 && (
                    <Link href="/admin/articles" className="admin-platform-action" onClick={close}>
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{stats.scheduled} scheduled</span>
                    </Link>
                  )}
                </div>

                <div className="admin-platform-footer">
                  <div className="admin-platform-footer-icons" aria-hidden="true">
                    <Pin className="h-3 w-3" />
                    <Star className="h-3 w-3" />
                    <Layers className="h-3 w-3" />
                  </div>
                  <p className="admin-platform-footer-text">
                    {stats.featured} featured · {stats.pinned} pinned · Public site link is in the header
                  </p>
                </div>
              </>
            )}
          </AdminDropdownPanel>
        </>
      )}

      <AdminReviewNoteDialog
        open={!!reviewAction}
        action={reviewAction}
        articleTitle={reviewTarget?.article?.title}
        loading={pending}
        onClose={closeReviewDialog}
        onConfirm={handleReviewConfirm}
      />
    </div>
  );
}