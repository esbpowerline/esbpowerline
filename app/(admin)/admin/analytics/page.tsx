import Link from 'next/link';
import { Suspense } from 'react';
import {
  AdminPageHeader, AdminCard, AdminListRow, AdminMetricRow, AdminActionPill,
  AdminSectionStack, AdminStatGrid, AdminStatCard, AdminTileGrid, AdminCardRow,
} from '@/components/admin/AdminUI';
import { AdminRecentActivity } from '@/components/admin/AdminRecentActivity';
import { AdminAnalyticsUpdated } from '@/components/admin/AdminAnalyticsUpdated';
import { AdminAnalyticsChartsLazy } from '@/components/admin/AdminAnalyticsChartsLazy';
import { AdminAnalyticsToolbar } from '@/components/admin/AdminAnalyticsToolbar';
import { getAnalytics } from '@/lib/actions/analytics';
import { formatNumber } from '@/lib/utils';

import type { AnalyticsPeriod } from '@/lib/analytics-period';
import {
  BarChart3, Eye, FileText, Users, Megaphone,
  Image, BookOpen, AlertTriangle, Zap, Layers, Clock,
  CheckCircle, PenLine, CalendarRange,
} from 'lucide-react';

type PageProps = {
  searchParams: Promise<{ period?: string; month?: string }>;
};

function pct(n: number, total: number) {
  if (total <= 0) return '0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

/*
 * The same kit, grid and card chrome as every other staff page.
 *
 * This page used to be its own design system inside the admin panel: a
 * bespoke 4-cell KPI strip and a 6-cell inline "secondary" strip in place of
 * the shared stat cards, three hand-rolled grids gapped at 0.375, 0.5 and
 * 0.75rem against 1rem everywhere else, and a page-scoped rule that shrank
 * every card header to 0.5rem of padding and an 11px uppercase title. Its
 * wide-screen rules also went 5-up over six quick links (5 + 1) and 3-up over
 * two footer cards, leaving an empty third column.
 */
export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const stats = await getAnalytics({ period: params.period, month: params.month ?? null });

  const pm = stats.periodMetrics;

  const primaryKpis = [
    { label: 'Views', value: formatNumber(stats.totalViews), hint: `${formatNumber(stats.avgViewsPerArticle)} / article`, icon: Eye },
    { label: 'Published', value: formatNumber(pm.published), hint: stats.filters.month ? stats.filters.rangeLabel : `${stats.filters.periodLabel} window`, icon: CheckCircle },
    { label: 'Active logins', value: formatNumber(pm.activeUsers), hint: 'In selected range', icon: Users },
    { label: 'Queue', value: formatNumber(stats.pendingComments + stats.pendingNotices), hint: `${stats.pendingComments} comments · ${stats.pendingNotices} notices`, icon: AlertTriangle },
  ];

  const periodTotals = [
    { label: 'Subscribers', value: formatNumber(pm.subscribers) },
    { label: 'Comments', value: formatNumber(pm.comments) },
    { label: 'New users', value: formatNumber(pm.newUsers) },
    { label: 'Likes', value: formatNumber(stats.totalLikes) },
    { label: 'Ads CTR', value: pct(stats.ads.clicks, stats.ads.impressions) },
    { label: 'Drafts', value: formatNumber(stats.draftCount) },
  ];

  const healthItems = [
    { label: 'Pending comments', value: stats.pendingComments, warn: stats.pendingComments > 0 },
    { label: 'Editorial notices', value: stats.pendingNotices, warn: stats.pendingNotices > 0 },
    { label: 'Missing images', value: stats.articlesMissingImage, warn: stats.articlesMissingImage > 0 },
    { label: 'Scheduled', value: stats.scheduledCount, warn: false },
  ];

  return (
    <AdminSectionStack className="admin-analytics-page">
      <AdminPageHeader
        icon={BarChart3}
        title="Analytics"
        description="Operational metrics · filter by day, week, month, year, or focus a calendar month."
      >
        <AdminAnalyticsUpdated generatedAt={stats.generatedAt} />
      </AdminPageHeader>

      <Suspense fallback={null}>
        <AdminAnalyticsToolbar
          period={stats.filters.period as AnalyticsPeriod}
          month={stats.filters.month}
          monthOptions={stats.monthOptions}
          rangeLabel={stats.filters.rangeLabel}
        />
      </Suspense>

      <AdminTileGrid>
        <AdminActionPill href="/admin/articles" label="Articles" icon={FileText} description={`${stats.draftCount} drafts`} />
        <AdminActionPill href="/admin/media" label="Media" icon={Image} description={`${stats.mediaCount} files`} />
        <AdminActionPill href="/admin/magazine" label="Magazine" icon={BookOpen} description={`${stats.magazineCount} issues`} accent="emerald" />
        <AdminActionPill href="/admin/logs" label="Logs" icon={Clock} description="Audit trail" />
        <AdminActionPill href="/admin/comments" label="Comments" icon={PenLine} description={`${stats.pendingComments} pending`} />
        <AdminActionPill href="/admin/users?filter=members" label="Members" icon={Users} description="Subscriber accounts" accent="emerald" />
      </AdminTileGrid>

      <AdminStatGrid>
        {primaryKpis.map((kpi) => (
          <AdminStatCard key={kpi.label} title={kpi.label} value={kpi.value} icon={kpi.icon} change={kpi.hint} />
        ))}
      </AdminStatGrid>

      <AdminCardRow>
        {/* Was a 9px inline strip under the KPIs; the same six figures, now
            read the way every other metric on the page is. */}
        <AdminCard
          title="In this period"
          icon={CalendarRange}
          bodyClassName="admin-card-body--dense"
          action={<span className="admin-analytics-summary">{stats.filters.rangeLabel}</span>}
        >
          {periodTotals.map((item) => (
            <AdminMetricRow key={item.label} label={item.label} value={item.value} />
          ))}
        </AdminCard>

        <AdminCard title="Editorial" icon={AlertTriangle} bodyClassName="admin-card-body--dense">
          {healthItems.map((item) => (
            <AdminMetricRow key={item.label} label={item.label} value={formatNumber(item.value)} highlight={item.warn} />
          ))}
          {stats.pendingComments > 0 && (
            <Link href="/admin/comments" className="admin-analytics-link">Moderate pending comments →</Link>
          )}
          <div className="admin-analytics-flag-row">
            <span>{stats.featuredCount} feat</span>
            <span>{stats.breakingCount} break</span>
            <span>{stats.pinnedCount} pin</span>
          </div>
        </AdminCard>

        <AdminCard title="Platform" icon={Zap} bodyClassName="admin-card-body--dense">
          <AdminMetricRow label="Carousel" value="DB" highlight />
          <AdminMetricRow label="Live articles" value={formatNumber(stats.publishedCount)} />
          <AdminMetricRow label="Magazine" value={formatNumber(stats.magazineCount)} />
          <AdminMetricRow label="Grid nodes" value={formatNumber(stats.nodeCount)} />
          <Link href="/admin/settings" className="admin-analytics-link">Settings →</Link>
        </AdminCard>

        <AdminCard
          title="Authors"
          icon={PenLine}
          bodyClassName="admin-card-body--dense"
          action={<span className="admin-analytics-summary">Published · views</span>}
        >
          {stats.topAuthors.length > 0 ? stats.topAuthors.map((author, i) => (
            <AdminListRow
              key={author.id}
              rank={i + 1}
              title={author.name}
              meta={`${formatNumber(author.articles)} published`}
              value={formatNumber(author.views)}
              valueLabel="views"
            />
          )) : (
            <p className="admin-analytics-empty">No authors in period.</p>
          )}
        </AdminCard>
      </AdminCardRow>

      <AdminAnalyticsChartsLazy
        filters={stats.filters}
        topArticles={stats.topArticles}
        usersByRole={stats.usersByRole}
        publishingTrend={stats.publishingTrend}
        categoriesByViews={stats.categoriesByViews}
        contentPipeline={stats.contentPipeline}
        monthlySnapshots={stats.monthlySnapshots}
        periodComparison={stats.periodComparison}
      />

      <AdminCardRow>
        <AdminCard title="Ads" icon={Megaphone} bodyClassName="admin-card-body--dense">
          {stats.ads.slots.length > 0 ? stats.ads.slots.map((ad) => (
            <AdminListRow
              key={ad.id}
              title={ad.name}
              meta={`${ad.position} · ${ad.ctr.toFixed(1)}%`}
              value={formatNumber(ad.impressions)}
            />
          )) : (
            <p className="admin-analytics-empty">No ad slots.</p>
          )}
        </AdminCard>

        <AdminCard title="Activity" icon={Layers} bodyClassName="admin-card-body--dense">
          <AdminRecentActivity logs={stats.recentLogs} emptyLabel="No administrative events in range." />
        </AdminCard>
      </AdminCardRow>
    </AdminSectionStack>
  );
}
