import {
  AdminPageHeader, AdminStatCard, AdminCard, AdminActionPill,
  AdminListRow, AdminMetricRow,
  AdminSectionStack, AdminStatGrid, AdminCardGrid, AdminActionsGrid,
  AdminListStack, AdminCardFooter,
} from '@/components/admin/AdminUI';
import { AdminRecentActivity } from '@/components/admin/AdminRecentActivity';
import { getAdminOverview, getAuthorPublishingStats } from '@/lib/actions/analytics';
import { AuthorProductivityPanel } from '@/components/admin/AuthorProductivityPanel';
import { formatNumber } from '@/lib/utils';
import {
  FileText, Users, Eye, CheckCircle, Zap, BarChart3,
  UserPlus, Settings, Tag, Layers, MessageSquare, PenLine,
} from 'lucide-react';

import { publicArticleUrl, publicPathUrl } from '@/lib/public-site-url';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';

import { Suspense } from 'react';
import { AdminLoading } from '@/components/admin/AdminUI';

async function AdminDashboardData() {
  const [stats, authorStats, session] = await Promise.all([
    getAdminOverview(),
    getAuthorPublishingStats(),
    auth(),
  ]);
  const role = session?.user?.role;

  return (
    <AdminSectionStack>
      <AdminPageHeader
        icon={BarChart3}
        title="Admin Overview"
        description="Platform health, content pipeline, and user activity at a glance."
      />

      <AdminStatGrid>
        <AdminStatCard title="Total Articles" value={formatNumber(stats.articleCount)} icon={FileText} accent="rose" change={`${stats.publishedCount} published`} />
        <AdminStatCard title="Total Users" value={formatNumber(stats.userCount)} icon={Users} accent="violet" />
        <AdminStatCard title="Total Views" value={formatNumber(stats.totalViews)} icon={Eye} accent="sky" />
        <AdminStatCard title="Published Live" value={formatNumber(stats.publishedCount)} icon={CheckCircle} accent="emerald" change="Visible on public site" />
      </AdminStatGrid>

      {(stats.pendingComments > 0 || stats.memberCount > 0) && (
        <AdminStatGrid cols={2}>
          {stats.pendingComments > 0 && (
            <AdminStatCard title="Pending Comments" value={formatNumber(stats.pendingComments)} icon={MessageSquare} accent="amber" change="Awaiting moderation" />
          )}
          <AdminStatCard title="Members" value={formatNumber(stats.memberCount)} icon={Users} accent="emerald" change="Subscriber accounts" />
        </AdminStatGrid>
      )}

      <AdminCardGrid cols={3}>
        {/* Main Details (Left 2/3 Column) */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Top Content by Views" icon={BarChart3}>
            <AdminListStack>
              {stats.topArticles.map((a: { id: string; slug: string; title: string; views: number }, i: number) => (
                <AdminListRow
                  key={a.id}
                  rank={i + 1}
                  title={a.title}
                  href={publicArticleUrl(a.slug)}
                  value={formatNumber(a.views)}
                />
              ))}
            </AdminListStack>
          </AdminCard>

          <AdminCard title="Author & Editor Output" icon={PenLine}>
            <AuthorProductivityPanel authors={authorStats} />
          </AdminCard>

          <AdminCard title="Administrative Activity" icon={Layers}>
            <AdminRecentActivity logs={stats.recentLogs} />
          </AdminCard>
        </div>

        {/* Sidebar Summary & Actions (Right 1/3 Column) */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard title="Sector Snapshot" icon={Zap}>
            <AdminListStack>
              {stats.dashboardStats.length > 0 ? stats.dashboardStats.map((s) => (
                <AdminMetricRow
                  key={s.id}
                  label={s.statName}
                  value={`${s.value}${s.unit ? ` ${s.unit}` : ''}`}
                />
              )) : (
                <>
                  <AdminMetricRow label="Published live" value={formatNumber(stats.publishedCount)} />
                  <AdminMetricRow label="Total views" value={formatNumber(stats.totalViews)} />
                </>
              )}
              <AdminMetricRow label="Published this month" value={formatNumber(stats.publishedThisMonth)} />
              <AdminMetricRow label="Added this month" value={formatNumber(stats.addedThisMonth)} highlight />
            </AdminListStack>
            <AdminCardFooter href={publicPathUrl('/grid-explorer')} external className="admin-card-footer--link">
              Open live grid data →
            </AdminCardFooter>
          </AdminCard>

          <AdminCard title="Quick Actions" icon={Zap}>
            <AdminActionsGrid>
              {can(role, 'user.create') && (
                <AdminActionPill href="/admin/users/new" label="Create user" icon={UserPlus} description="Add platform member" />
              )}
              <AdminActionPill href="/admin/articles" label="Review content" icon={FileText} description="Moderate articles" />
              {can(role, 'comment.moderate_any') && (
                <AdminActionPill href="/admin/comments" label="Moderate comments" icon={MessageSquare} description={`${stats.pendingComments} pending`} />
              )}
              <AdminActionPill href="/admin/users?filter=members" label="Members" icon={Users} description={`${stats.memberCount} accounts`} accent="emerald" />
              {can(role, 'category.manage') && (
                <AdminActionPill href="/admin/categories" label="Categories" icon={Tag} description="Organize topics" />
              )}
              {can(role, 'settings.view') && (
                <AdminActionPill href="/admin/settings" label="Settings" icon={Settings} description="Platform config" />
              )}
            </AdminActionsGrid>
          </AdminCard>
        </div>
      </AdminCardGrid>
    </AdminSectionStack>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminLoading label="Loading metrics..." />}>
      <AdminDashboardData />
    </Suspense>
  );
}
