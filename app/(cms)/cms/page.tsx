import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getAuthorArticleStats } from '@/lib/actions/articles';
import { getMyNotices } from '@/lib/actions/notices';
import { getCalendarArticles } from '@/lib/actions/articles';
import { EditorialNoticesPanel } from '@/components/cms/EditorialNoticesPanel';
import { publicArticleUrl } from '@/lib/public-site-url';
import { formatNumber, formatDeskDate, formatDeskDateTime } from '@/lib/utils';
import { can, isAdminRole } from '@/lib/constants';
import { isEditorLead } from '@/lib/cms-nav';
import {
  FileText, Eye, PenLine, Clock, BookOpen, Layers, Zap, Image as ImageIcon,
  Calendar, BarChart3, MessageSquare, Flame, Star, Send, Hash,
} from 'lucide-react';
import {
  CmsPageHeader, CmsStatCard, CmsCard, CmsActionPill, CmsCreateCapsule,
  CmsListRow, CmsMetricRow, CmsActivityItem,
  CmsSectionStack, CmsStatGrid, CmsActionsGrid,
  CmsListStack, CmsCardFooter,
} from '@/components/cms/CmsUI';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { CmsCategoryChip } from '@/components/cms/CmsCategoryChip';
import { getCategories } from '@/lib/actions/categories';

import { Suspense } from 'react';
import { CmsLoading } from '@/components/cms/CmsUI';

async function CmsDashboardData() {
  const session = await auth();
  const authorId = session?.user?.id;
  const role = session?.user?.role;
  const editorLead = isEditorLead(role);
  const isAdmin = isAdminRole(role);

  const [stats, notices, calendar, categories] = await Promise.all([
    authorId ? getAuthorArticleStats(isAdmin ? undefined : authorId) : Promise.resolve({
      total: 0, published: 0, drafts: 0, scheduled: 0, archived: 0, featured: 0, breaking: 0,
      totalViews: 0, recent: [], topByViews: [], pendingNotices: 0,
    }),
    getMyNotices(),
    getCalendarArticles({ authorId, allAuthors: editorLead }),
    getCategories(),
  ]);

  // Article.category is the category NAME, not a relation, so the colour has
  // to be looked up. One map, built once per render.
  const categoryColor = new Map(categories.map((c) => [c.name, c.color]));

  /** A count as a share of the whole desk — the context a bare number lacks. */
  const shareOf = (n: number) => (articlesCount > 0 ? `${Math.round((n / articlesCount) * 100)}%` : '—');

  const {
    total: articlesCount, published, drafts, scheduled, archived, featured, breaking,
    totalViews, recent: articles, topByViews, pendingNotices,
  } = stats;

  return (
    <CmsSectionStack>
      <CmsPageHeader
        title={`Welcome, ${session?.user?.name ?? 'Editor'}`}
        description={
          editorLead
            ? 'Full editorial suite — write, schedule, promote, and publish power sector stories.'
            : 'Your author workspace — craft and submit stories for the editorial team.'
        }
        icon={BookOpen}
      />

      <EditorialNoticesPanel
        notices={notices.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
      />

      {/* One strip, not two.
          Promotion counts used to sit in a second `cols={3}` grid below the
          four headline tiles, and because its members are conditional a normal
          day rendered two tiles stretched across the full width — a "14" and
          an "8" each marooned in half a screen. They belong in the same flow
          as the other counts: same tile, same size, wrapping where the row
          runs out. The grid is `auto-fit` with a capped track now, so however
          many of these are present the tiles stay tile-sized. */}
      {/* Every tile carries a second line, and it is a real one.
          Half of these used to render a number alone, which left 37px of dead
          space under it and made the strip read as six big boxes each saying
          one small thing. The share and the average were already derivable
          from the same query — they were simply never shown. */}
      <CmsStatGrid>
        <CmsStatCard title="My Articles" value={formatNumber(articlesCount)} icon={FileText} change={`${published} live · ${drafts} draft${drafts === 1 ? '' : 's'}`} />
        <CmsStatCard
          title="Total Views"
          value={formatNumber(totalViews)}
          icon={Eye}
          change={published > 0 ? `${formatNumber(Math.round(totalViews / published))} avg per story` : 'No published stories'}
        />
        <CmsStatCard
          title="Drafts"
          value={formatNumber(drafts)}
          icon={PenLine}
          accent="amber"
          change={scheduled > 0 ? `${scheduled} scheduled next` : 'Nothing scheduled'}
        />
        <CmsStatCard
          title="Published"
          value={formatNumber(published)}
          icon={Clock}
          accent="emerald"
          change={archived > 0 ? `${archived} archived` : `${shareOf(published)} of all stories`}
        />
        {featured > 0 && (
          <CmsStatCard title="Featured" value={formatNumber(featured)} icon={Star} accent="amber" change={`${shareOf(featured)} of all stories`} />
        )}
        {breaking > 0 && (
          <CmsStatCard title="Breaking" value={formatNumber(breaking)} icon={Flame} accent="red" change={`${shareOf(breaking)} of all stories`} />
        )}
        {pendingNotices > 0 && (
          <CmsStatCard title="Notices" value={formatNumber(pendingNotices)} icon={MessageSquare} accent="red" change="Awaiting your reply" />
        )}
      </CmsStatGrid>

      {/* Main column + right rail, not two independent 3-column rows.
          The old shape put a tall panel beside a short one twice over, so the
          right-hand side carried two visible voids: the Pipeline card either
          stretched to the height of Recent Articles with a lake of empty space
          inside it, or sat at its natural height leaving the gap outside it.
          Neither is fixable by tuning alignment — a short card simply does not
          belong in a row with a long list. Stacking the four short panels into
          their own rail lets each keep its natural height and the column ends
          where its content does. */}
      <div className="admin-split">
        <div className="admin-split__main">
        <CmsCard
          title="Recent Articles"
          icon={Layers}
          action={<Link href="/cms/articles" className="admin-card-link">All stories →</Link>}
        >
          <CmsListStack>
            {articles.slice(0, 8).map((a) => (
              <CmsListRow
                key={a.id}
                title={a.title}
                href={`/cms/articles/${a.id}/edit`}
                badge={<StatusBadge status={a.status} />}
                value={`${formatNumber(a.views)} views`}
              />
            ))}
            {articlesCount === 0 && (
              <div className="flex flex-wrap items-center gap-2 py-2 px-1">
                <p className="text-[13px] text-muted-foreground">No articles yet.</p>
                <CmsCreateCapsule href="/cms/articles/new" label="Create first story" />
              </div>
            )}
          </CmsListStack>
        </CmsCard>

        <CmsCard
          title="Top Performers"
          icon={BarChart3}
          action={<Link href="/cms/analytics" className="admin-card-link">Performance →</Link>}
        >
          <CmsListStack>
            {topByViews.map((a, i) => (
              <CmsListRow
                key={a.id}
                rank={i + 1}
                title={a.title}
                href={publicArticleUrl(a.slug)}
                metaNode={<CmsCategoryChip name={a.category} color={categoryColor.get(a.category)} />}
                value={`${formatNumber(a.views)} views`}
              />
            ))}
            {topByViews.length === 0 && (
              <p className="text-[13px] text-muted-foreground py-2">Publish stories to track performance.</p>
            )}
          </CmsListStack>
        </CmsCard>


        <CmsCard title="Quick Actions" icon={Zap}>
          <CmsActionsGrid>
            <CmsActionPill href="/cms/articles/new" label="New story" icon={PenLine} description="Start from scratch" accent="emerald" />
            <CmsActionPill href="/cms/articles/drafts" label="Continue drafts" icon={FileText} description={`${drafts} in progress`} />
            <CmsActionPill href="/cms/media" label="Media Library" icon={ImageIcon} description="Upload assets" />
            <CmsActionPill href="/cms/calendar" label="Editorial calendar" icon={Calendar} description="Schedule posts" />
            {can(role, 'analytics.view_own') && (
              <CmsActionPill href="/cms/analytics" label="Performance" icon={BarChart3} description="Views & engagement" />
            )}
            {can(role, 'comment.moderate_any') && (
              <CmsActionPill href="/cms/comments" label="Moderate comments" icon={MessageSquare} description="Review reader discussion" />
            )}
            <CmsActionPill href="/cms/tags" label="Browse tags" icon={Hash} description="Topic coverage" />
          </CmsActionsGrid>
        </CmsCard>
        </div>

        <aside className="admin-split__rail">
        <CmsCard title="Pipeline" icon={Zap}>
          <CmsListStack>
            <CmsMetricRow label="Drafts" value={formatNumber(drafts)} />
            <CmsMetricRow label="Scheduled" value={formatNumber(scheduled)} highlight={scheduled > 0} />
            <CmsMetricRow label="Published" value={formatNumber(published)} />
            <CmsMetricRow label="Archived" value={formatNumber(archived)} />
          </CmsListStack>
          <CmsCardFooter href="/cms/calendar" className="admin-card-footer--link">
            Open editorial calendar →
          </CmsCardFooter>
        </CmsCard>

        <CmsCard title="Coming Up" icon={Calendar}>
          {/* Kit rows, like the Pipeline card above — these were hand-rolled
              12px flex lines of a different height. */}
          <CmsListStack>
            {calendar.scheduled.slice(0, 5).map((a) => (
              <CmsListRow
                key={a.id}
                title={a.title}
                href={`/cms/articles/${a.id}/edit`}
                value={a.publishedAt ? formatDeskDate(a.publishedAt) : 'TBD'}
              />
            ))}
            {calendar.scheduled.length === 0 && (
              <p className="text-[13px] text-muted-foreground py-2">Nothing scheduled.</p>
            )}
          </CmsListStack>
        </CmsCard>


        <CmsCard title="Recently Published" icon={Send}>
          <CmsListStack>
            {calendar.published.slice(0, 6).map((a) => (
              <CmsActivityItem
                key={a.id}
                badge={<StatusBadge status="PUBLISHED" />}
                date={formatDeskDateTime(a.publishedAt)}
                message={
                  <Link href={`/cms/articles/${a.id}/edit`} className="admin-text-link">
                    {a.title}
                  </Link>
                }
              />
            ))}
          </CmsListStack>
        </CmsCard>
        </aside>
      </div>
    </CmsSectionStack>
  );
}

export default function CMSDashboardPage() {
  return (
    <Suspense fallback={<CmsLoading label="Loading CMS data..." />}>
      <CmsDashboardData />
    </Suspense>
  );
}