'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bell, MessageSquare, Check, ExternalLink, Archive, X, Trash2 } from 'lucide-react';
import { acknowledgeNotice, resolveNotice, dismissNotice } from '@/lib/actions/notices';
import { trashNotice } from '@/lib/actions/editor-trash';
import { Button } from '@/components/ui/button';
import { cn, formatEditorialTimestamp } from '@/lib/utils';
import { CmsCard, CmsCardFooter, CmsTagCapsule } from '@/components/cms/CmsUI';

export type NoticeRow = {
  id: string;
  type: string;
  message: string;
  status: string;
  createdAt: string | Date;
  sender: { name: string };
  article?: { id: string; title: string; slug: string; status: string } | null;
  metadata?: unknown;
};

const TYPE_LABELS: Record<string, string> = {
  REVISION_REQUEST: 'Revision requested',
  REVIEW_SUBMISSION: 'Submitted for review',
  REVIEW_APPROVED: 'Admin approved',
  CONTENT_REMOVED: 'Content change',
  CATEGORY_CHANGED: 'Category update',
  ADMIN_NOTE: 'Editorial note',
};

const ARCHIVED_STATUSES = new Set(['RESOLVED', 'DISMISSED', 'ACKNOWLEDGED']);

function NoticeCard({
  notice,
  pending,
  onAction,
}: {
  notice: NoticeRow;
  pending: boolean;
  onAction: (id: string, action: 'ack' | 'resolve' | 'dismiss' | 'trash') => void;
}) {
  const meta = notice.metadata as { articleTitle?: string; fromCategory?: string; toCategory?: string } | null;
  const articleTitle = notice.article?.title ?? meta?.articleTitle;

  return (
    // A row of the card's list, not a bordered box inside the card; a pending
    // notice carries the accent rule down its left edge instead of a sky wash.
    <div className={cn('editorial-notice', notice.status === 'PENDING' && 'editorial-notice--pending')}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="h-3.5 w-3.5 text-[hsl(var(--staff-accent))] shrink-0" />
          <span className="font-semibold text-[13px]">
            {TYPE_LABELS[notice.type] ?? notice.type}
          </span>
          <span className="text-[10px] text-muted-foreground">
            from {notice.sender.name}
          </span>
        </div>
        <time className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums" dateTime={new Date(notice.createdAt).toISOString()}>
          {formatEditorialTimestamp(notice.createdAt)}
        </time>
      </div>

      {articleTitle && (
        <div className="text-[12px] font-medium mb-1 truncate">{articleTitle}</div>
      )}

      {meta?.fromCategory && meta?.toCategory && (
        <div className="text-[11px] text-muted-foreground mb-1">
          {meta.fromCategory} → {meta.toCategory}
        </div>
      )}

      <p className="text-[12px] text-muted-foreground leading-relaxed">{notice.message}</p>

      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        {notice.article && notice.type === 'REVISION_REQUEST' && notice.status !== 'DISMISSED' && (
          <Link href={`/cms/articles/${notice.article.id}/edit`}>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <ExternalLink className="h-3 w-3 mr-1" /> Open story
            </Button>
          </Link>
        )}
        {notice.status === 'PENDING' && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={pending} onClick={() => onAction(notice.id, 'ack')}>
            <Check className="h-3 w-3 mr-1" /> Acknowledge
          </Button>
        )}
        {notice.status !== 'RESOLVED' && notice.type === 'REVISION_REQUEST' && (
          <Button size="sm" className="h-7 text-xs" disabled={pending} onClick={() => onAction(notice.id, 'resolve')}>
            Mark resolved
          </Button>
        )}
        {notice.status !== 'DISMISSED' && (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" disabled={pending} onClick={() => onAction(notice.id, 'dismiss')}>
            <X className="h-3 w-3 mr-1" /> Dismiss
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-muted-foreground hover:text-[hsl(var(--staff-bad))]"
          disabled={pending}
          onClick={() => onAction(notice.id, 'trash')}
        >
          <Trash2 className="h-3 w-3 mr-1" /> Trash
        </Button>
      </div>
    </div>
  );
}

export function EditorialNoticesPanel({
  notices,
  fullPage = false,
}: {
  notices: NoticeRow[];
  fullPage?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showArchive, setShowArchive] = useState(false);

  const { active, archive } = useMemo(() => {
    const activeList: NoticeRow[] = [];
    const archiveList: NoticeRow[] = [];
    for (const notice of notices) {
      if (ARCHIVED_STATUSES.has(notice.status)) archiveList.push(notice);
      else activeList.push(notice);
    }
    return { active: activeList, archive: archiveList };
  }, [notices]);

  const pendingCount = active.filter((n) => n.status === 'PENDING').length;

  function run(id: string, action: 'ack' | 'resolve' | 'dismiss' | 'trash') {
    startTransition(async () => {
      try {
        if (action === 'ack') await acknowledgeNotice(id);
        else if (action === 'resolve') await resolveNotice(id);
        else if (action === 'trash') await trashNotice(id);
        else await dismissNotice(id);
        const title =
          action === 'ack'
            ? 'Notice marked as seen'
            : action === 'resolve'
              ? 'Notice resolved'
              : action === 'trash'
                ? 'Notice moved to trash'
                : 'Notice archived';
        toast.success(title, {
          description: 'Your editorial inbox has been updated.',
        });
        router.refresh();
      } catch (e: unknown) {
        toast.error('Could not update notice', {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    });
  }

  if (!notices.length && !fullPage) return null;

  const list = showArchive ? archive : active;
  const limit = fullPage ? 50 : 6;

  return (
    <CmsCard
      title={showArchive ? 'Notice archive' : 'Editorial notices'}
      icon={showArchive ? Archive : Bell}
      action={
        <div className="flex items-center gap-2">
          {!showArchive && pendingCount > 0 && (
            <CmsTagCapsule className="admin-tag-capsule--xs">{pendingCount} pending</CmsTagCapsule>
          )}
          {archive.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchive((v) => !v)}
              className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {showArchive ? '← Active notices' : `Archive (${archive.length})`}
            </button>
          )}
        </div>
      }
    >
      {list.length === 0 ? (
        <p className="text-[13px] text-muted-foreground py-2">
          {showArchive ? 'No archived notices yet.' : 'No active notices — you are caught up.'}
        </p>
      ) : (
        <div className="editorial-notice-list">
          {list.slice(0, limit).map((notice) => (
            <NoticeCard key={notice.id} notice={notice} pending={pending} onAction={run} />
          ))}
        </div>
      )}
      {fullPage && !showArchive && archive.length > 0 && (
        <CmsCardFooter>Dismissed and resolved notices move to the archive tab.</CmsCardFooter>
      )}
    </CmsCard>
  );
}