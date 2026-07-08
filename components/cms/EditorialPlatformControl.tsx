'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from '@/utils/supabase/auth-context';
import {
  Bell, ChevronDown, CheckCircle2, X, MessageSquare, UserCog, FileWarning, Tags,
} from 'lucide-react';
import { cn, formatEditorialTimestamp } from '@/lib/utils';
import {
  AdminDropdownBackdrop,
  AdminDropdownPanel,
  AdminDropdownTrigger,
  useAdminDropdown,
} from '@/components/admin/AdminDropdown';
import { getEditorialWorkspaceSnapshot } from '@/lib/actions/platform';
import { acknowledgeAllNotices, acknowledgeNotice } from '@/lib/actions/notices';
import { dismissDeskNotices, getDeskDismissedIds } from '@/lib/desk-session';
import { toast } from 'sonner';

type Snapshot = Awaited<ReturnType<typeof getEditorialWorkspaceSnapshot>>;
type UploadPeriod = 'day' | 'week' | 'month';
type UploadScope = 'mine' | 'newsroom';

const EMPTY: Snapshot = {
  notices: [],
  uploadStats: { mine: { day: 0, week: 0, month: 0 }, newsroom: null },
  pendingComments: 0,
  trashCount: 0,
  canReview: false,
  canModerate: false,
};

const NOTICE_ICONS = {
  REVISION_REQUEST: FileWarning,
  REVIEW_SUBMISSION: FileWarning,
  REVIEW_APPROVED: CheckCircle2,
  CONTENT_REMOVED: FileWarning,
  CATEGORY_CHANGED: Tags,
  ADMIN_NOTE: UserCog,
} as const;

const NOTICE_LABELS: Record<string, string> = {
  REVISION_REQUEST: 'Revision requested',
  REVIEW_SUBMISSION: 'Submitted for review',
  REVIEW_APPROVED: 'Admin approved',
  CONTENT_REMOVED: 'Content update',
  CATEGORY_CHANGED: 'Category changed',
  ADMIN_NOTE: 'Editorial / admin note',
};

export function EditorialPlatformControl() {
  const { data: session } = useSession();
  const { open, toggle, close } = useAdminDropdown();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [uploadPeriod, setUploadPeriod] = useState<UploadPeriod>('day');
  const [uploadScope, setUploadScope] = useState<UploadScope>('mine');
  const [pending, startTransition] = useTransition();

  const refreshDismissed = useCallback(() => {
    setDismissed(getDeskDismissedIds());
  }, []);

  const loadSnapshot = useCallback((silent = false) => {
    if (!silent) setLoadState('loading');
    startTransition(async () => {
      try {
        const data = await getEditorialWorkspaceSnapshot();
        setSnapshot(data);
        setLoadState('ready');
        refreshDismissed();
      } catch {
        if (!silent) {
          setSnapshot(EMPTY);
          setLoadState('error');
        }
      }
    });
  }, [refreshDismissed]);

  useEffect(() => {
    if (!session?.user) return;

    if (loadState === 'idle') {
      refreshDismissed();
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
        refreshDismissed();
        loadSnapshot(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [session?.user, loadState, loadSnapshot, refreshDismissed]);

  useEffect(() => {
    if (open && session?.user && loadState !== 'idle') {
      refreshDismissed();
      loadSnapshot(true);
    }
  }, [open, session?.user, loadSnapshot, refreshDismissed, loadState]);

  const stats = snapshot ?? EMPTY;

  const visibleNotices = useMemo(
    () => stats.notices.filter((n) => !dismissed.has(n.id)),
    [stats.notices, dismissed],
  );

  const uploadValue = useMemo(() => {
    const source = uploadScope === 'newsroom' && stats.uploadStats.newsroom
      ? stats.uploadStats.newsroom
      : stats.uploadStats.mine;
    return source[uploadPeriod];
  }, [stats.uploadStats, uploadPeriod, uploadScope]);

  const badgeCount = visibleNotices.length + (stats.canModerate && stats.pendingComments > 0 ? 1 : 0);

  function sessionHide(ids: string[]) {
    dismissDeskNotices(ids);
    refreshDismissed();
  }

  function handleMarkAllRead() {
    const ids = visibleNotices.map((n) => n.id);
    if (!ids.length) return;
    startTransition(async () => {
      try {
        await acknowledgeAllNotices();
        sessionHide(ids);
        toast.success('All notices marked read');
        loadSnapshot();
      } catch {
        toast.error('Could not mark notices read');
      }
    });
  }

  function handleClearNow() {
    const ids = visibleNotices.map((n) => n.id);
    if (!ids.length) return;
    sessionHide(ids);
    toast.success('Cleared for this session');
  }

  function handleDismissOne(id: string) {
    startTransition(async () => {
      try {
        await acknowledgeNotice(id);
        sessionHide([id]);
        setSnapshot((prev) => prev ? {
          ...prev,
          notices: prev.notices.filter((n) => n.id !== id),
        } : prev);
      } catch {
        sessionHide([id]);
      }
    });
  }

  return (
    <div className="relative shrink-0">
      <AdminDropdownTrigger open={open} onClick={toggle} aria-label="Editorial desk">
        <Bell className="h-3.5 w-3.5 text-sky-400 shrink-0" />
        <span className="admin-dropdown-trigger-label">Desk</span>
        {badgeCount > 0 && (
          <span className="editorial-desk-badge">{badgeCount > 9 ? '9+' : badgeCount}</span>
        )}
        <ChevronDown className={cn('h-3 w-3 shrink-0 opacity-60 transition-transform duration-150', open && 'rotate-180')} />
      </AdminDropdownTrigger>

      {open && (
        <>
          <AdminDropdownBackdrop onClose={close} />
          <AdminDropdownPanel className="admin-platform-menu editorial-desk-menu editorial-desk-menu--alerts">
            <div className="editorial-desk-menu__header">
              <div>
                <div className="editorial-desk-menu__title">Desk</div>
                <p className="editorial-desk-menu__subtitle">Reviews, admin notes &amp; your publish pace</p>
              </div>
            </div>

            <div className="editorial-desk-upload">
              <div className="editorial-desk-upload__stat">
                <span className="editorial-desk-upload__value">{uploadValue}</span>
                <span className="editorial-desk-upload__label">
                  stories published
                  {uploadScope === 'newsroom' ? ' · newsroom' : ' · yours'}
                </span>
              </div>
              <div className="editorial-desk-upload__periods" role="tablist" aria-label="Upload period">
                {(['day', 'week', 'month'] as UploadPeriod[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={uploadPeriod === p}
                    className={cn('editorial-desk-upload__period', uploadPeriod === p && 'editorial-desk-upload__period--active')}
                    onClick={() => setUploadPeriod(p)}
                  >
                    {p === 'day' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
                  </button>
                ))}
              </div>
              {stats.canReview && stats.uploadStats.newsroom && (
                <div className="editorial-desk-upload__scope">
                  <button
                    type="button"
                    className={cn('editorial-desk-upload__scope-btn', uploadScope === 'mine' && 'editorial-desk-upload__scope-btn--active')}
                    onClick={() => setUploadScope('mine')}
                  >
                    My stories
                  </button>
                  <button
                    type="button"
                    className={cn('editorial-desk-upload__scope-btn', uploadScope === 'newsroom' && 'editorial-desk-upload__scope-btn--active')}
                    onClick={() => setUploadScope('newsroom')}
                  >
                    Newsroom
                  </button>
                </div>
              )}
            </div>

            {loadState === 'loading' ? (
              <div className="admin-platform-loading">
                <span className="admin-platform-spinner" />
                Checking desk…
              </div>
            ) : (
              <>
                {loadState === 'error' && (
                  <p className="admin-platform-hint admin-platform-hint--warn px-0 mb-2">
                    Could not refresh desk items.
                  </p>
                )}

                {stats.canModerate && stats.pendingComments > 0 && (
                  <Link href="/cms/comments" className="editorial-desk-alert editorial-desk-alert--violet mb-2" onClick={close}>
                    <span className="editorial-desk-alert__icon">
                      <MessageSquare className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </span>
                    <span className="editorial-desk-alert__copy">
                      <span className="editorial-desk-alert__title">Comments to review</span>
                      <span className="editorial-desk-alert__detail">Reader discussion awaiting moderation</span>
                    </span>
                    <span className="editorial-desk-alert__count">{stats.pendingComments}</span>
                  </Link>
                )}

                {visibleNotices.length === 0 ? (
                  <div className="editorial-desk-clear">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500/80" strokeWidth={1.75} />
                    <p className="editorial-desk-clear__title">You&apos;re all caught up</p>
                    <p className="editorial-desk-clear__text">No unread reviews or admin notices right now.</p>
                  </div>
                ) : (
                  <ul className="editorial-desk-alerts editorial-desk-alerts--notices">
                    {visibleNotices.map((notice) => {
                      const Icon = NOTICE_ICONS[notice.type as keyof typeof NOTICE_ICONS] ?? Bell;
                      const href = notice.article
                        ? `/cms/articles/${notice.article.id}/edit`
                        : '/cms/notices';
                      return (
                        <li key={notice.id} className="editorial-desk-notice">
                          <Link href={href} className="editorial-desk-notice__body" onClick={close}>
                            <span className="editorial-desk-notice__icon">
                              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                            </span>
                            <span className="editorial-desk-notice__copy">
                              <span className="editorial-desk-notice__title">
                                {NOTICE_LABELS[notice.type] ?? notice.type}
                              </span>
                              {notice.article && (
                                <span className="editorial-desk-notice__article">{notice.article.title}</span>
                              )}
                              <span className="editorial-desk-notice__message">{notice.message}</span>
                              <span className="editorial-desk-notice__meta">
                                {notice.senderName} · {formatEditorialTimestamp(notice.createdAt)}
                              </span>
                            </span>
                          </Link>
                          <button
                            type="button"
                            className="editorial-desk-notice__dismiss"
                            aria-label="Dismiss notice"
                            disabled={pending}
                            onClick={() => handleDismissOne(notice.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="editorial-desk-footer editorial-desk-footer--actions">
                  <div className="editorial-desk-footer__buttons">
                    <button
                      type="button"
                      className="editorial-desk-footer__btn"
                      disabled={pending || visibleNotices.length === 0}
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      className="editorial-desk-footer__btn editorial-desk-footer__btn--muted"
                      disabled={visibleNotices.length === 0}
                      onClick={handleClearNow}
                    >
                      Clear now
                    </button>
                  </div>
                  <Link href="/cms/notices" className="editorial-desk-footer__link" onClick={close}>
                    View all notices →
                  </Link>
                </div>
              </>
            )}
          </AdminDropdownPanel>
        </>
      )}
    </div>
  );
}