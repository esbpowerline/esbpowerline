import Link from 'next/link';
import { Bookmark, Download, MessageSquare } from 'lucide-react';
import { AdminCard, AdminCardRow, AdminCardFooter } from '@/components/admin/AdminUI';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { UserMemberActivity } from '@/lib/actions/users';

export function MemberActivityPanel({ activity }: { activity: UserMemberActivity }) {
  return (
    // A card row: three cards of one height, balanced by count. The 3-column
    // card grid aligned them to the top, so a short "No downloads" card
    // stood beside a long comment list with a hole under it.
    <AdminCardRow>
      <AdminCard title="Saved items" icon={Bookmark} bodyClassName="admin-card-body--dense">
        {activity.savedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved articles or magazine issues.</p>
        ) : (
          <ul className="admin-dense-list">
            {activity.savedItems.map((item) => (
              <li key={item.id} className="text-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.itemType}
                </span>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.createdAt.toISOString())}</p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Comments" icon={MessageSquare} bodyClassName="admin-card-body--dense">
        {activity.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments posted.</p>
        ) : (
          <ul className="admin-dense-list">
            {activity.comments.map((comment) => (
              <li key={comment.id} className="text-sm admin-dense-list__item--bordered">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={comment.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt.toISOString())}
                  </span>
                </div>
                <p className="text-foreground/90 line-clamp-2">{comment.content}</p>
                {comment.articleSlug ? (
                  <Link href={`/admin/comments?status=${comment.status}`} className="admin-text-link text-[11px]">
                    Moderate →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <AdminCardFooter href="/admin/comments" className="admin-card-footer--link">
          Open comment queue →
        </AdminCardFooter>
      </AdminCard>

      <AdminCard title="Downloads" icon={Download} bodyClassName="admin-card-body--dense">
        {activity.downloads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data downloads yet.</p>
        ) : (
          <ul className="admin-dense-list">
            {activity.downloads.map((item) => (
              <li key={item.id} className="text-sm">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.createdAt.toISOString())}</p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminCardRow>
  );
}