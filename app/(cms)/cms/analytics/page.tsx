import Link from 'next/link';
import { getAuthorAnalytics } from '@/lib/actions/analytics';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { publicArticleUrl } from '@/lib/public-site-url';
import { CmsCategoryChip } from '@/components/cms/CmsCategoryChip';
import { getCategories } from '@/lib/actions/categories';
import {
  CmsPageHeader, CmsStatCard, CmsCard, CmsListRow, CmsMetricRow,
  CmsSectionStack, CmsStatGrid, CmsListStack, CmsScheduleList,
} from '@/components/cms/CmsUI';
import { BarChart3, Eye, FileText, Heart, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';

export default async function CMSAnalyticsPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'analytics.view_own')) {
    return (
      <CmsSectionStack>
        <CmsPageHeader
          icon={BarChart3}
          title="Performance"
          description="Analytics are not available for your role."
        />
        <CmsCard title="Access restricted" icon={BarChart3}>
          <p className="text-[13px] text-muted-foreground">
            Contact your editorial lead if you need performance metrics for your stories.
          </p>
        </CmsCard>
      </CmsSectionStack>
    );
  }

  let stats: Awaited<ReturnType<typeof getAuthorAnalytics>>;
  // Article.category is a name, not a relation, so the colour needs a lookup.
  const categoryColor = new Map((await getCategories()).map((c) => [c.name, c.color]));
  try {
    stats = await getAuthorAnalytics();
  } catch {
    return (
      <CmsSectionStack>
        <CmsPageHeader
          icon={BarChart3}
          title="Performance"
          description="Could not load analytics right now."
        />
        <CmsCard title="Something went wrong" icon={BarChart3}>
          <p className="text-[13px] text-muted-foreground">
            Try refreshing the page. If this keeps happening, the database may still be starting up.
          </p>
        </CmsCard>
      </CmsSectionStack>
    );
  }
  const { totals, benchmarks } = stats;

  const updated = new Date(stats.generatedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const vsNewsroom = benchmarks.viewsVsNewsroom;
  const vsLabel = vsNewsroom === 0
    ? 'On par with newsroom average'
    : vsNewsroom > 0
      ? `${vsNewsroom}% above newsroom avg`
      : `${Math.abs(vsNewsroom)}% below newsroom avg`;

  return (
    <CmsSectionStack>
      <CmsPageHeader
        icon={BarChart3}
        title="Performance"
        description="How your stories compare across the newsroom."
      >
        <span className="text-[12px] text-muted-foreground">Updated {updated}</span>
      </CmsPageHeader>

      <CmsStatGrid>
        <CmsStatCard title="Total Views" value={formatNumber(totals.views)} icon={Eye} accent="sky" change={`${formatNumber(totals.avgViewsPerArticle)} / article`} />
        <CmsStatCard title="Published" value={formatNumber(totals.published)} icon={CheckCircle} accent="emerald" change={`${totals.publishedThisMonth} this month`} />
        <CmsStatCard
          title="Newsroom rank"
          value={benchmarks.rank ? `#${benchmarks.rank}` : '—'}
          icon={TrendingUp}
          accent="amber"
          change={benchmarks.totalEditors > 0 ? `of ${benchmarks.totalEditors} editors` : undefined}
        />
        <CmsStatCard title="Likes" value={formatNumber(totals.likes)} icon={Heart} accent="violet" change={`${benchmarks.yourViewsShare}% of newsroom views`} />
      </CmsStatGrid>

      {/* The shared split, not a hand-rolled 2/3 + 1/3.
          This page put `space-y-6` inside a 12px grid, so its cards sat 24px
          apart vertically and 12px horizontally — the same gap measured two
          different ways depending on which direction you looked. It also left
          the right column ending 632px above the left, because the three
          tallest panels were all on one side. */}
      <div className="admin-split">
        <div className="admin-split__main">
          <CmsCard title="Editor leaderboard" icon={Users}>
            <p className="text-[12px] text-muted-foreground admin-card-lead">
              Published stories ranked by total views. {vsLabel}.
            </p>
            <CmsListStack>
              {/* The kit's row, so this list and Top Articles below it share one
                  row height. It was a hand-rolled row with its own padding and
                  a boxed "you" pill sitting inside a hairline list. */}
              {stats.peers.map((peer, i) => (
                <CmsListRow
                  key={peer.authorId}
                  rank={i + 1}
                  title={peer.isYou ? `${peer.name} (you)` : peer.name}
                  meta={`${peer.published} published · ${formatNumber(peer.avgViews)} avg views`}
                  value={formatNumber(peer.views)}
                  valueLabel={`${formatNumber(peer.likes)} likes`}
                  highlight={peer.isYou}
                />
              ))}
              {stats.peers.length === 0 && (
                <p className="text-[13px] text-muted-foreground py-2">No published editors yet.</p>
              )}
            </CmsListStack>
          </CmsCard>

          <CmsCard title="Top Articles" icon={BarChart3}>
            <CmsListStack>
              {stats.topArticles.map((a, i) => (
                <CmsListRow
                  key={a.id}
                  rank={i + 1}
                  title={a.title}
                  href={publicArticleUrl(a.slug)}
                  metaNode={<CmsCategoryChip name={a.category} color={categoryColor.get(a.category)} />}
                  value={`${formatNumber(a.views)} views`}
                />
              ))}
              {stats.topArticles.length === 0 && (
                <p className="text-[13px] text-muted-foreground py-2">No published articles yet.</p>
              )}
            </CmsListStack>
          </CmsCard>

        </div>

        <aside className="admin-split__rail">
          <CmsCard title="Benchmarks" icon={BarChart3}>
            <CmsListStack>
              <CmsMetricRow label="Your avg views" value={formatNumber(benchmarks.yourAvgViews)} />
              <CmsMetricRow label="Newsroom avg" value={formatNumber(benchmarks.newsroomAvgViews)} />
              <CmsMetricRow label="Views share" value={`${benchmarks.yourViewsShare}%`} />
              <CmsMetricRow label="Scheduled" value={formatNumber(totals.scheduled)} />
              <CmsMetricRow label="Drafts" value={formatNumber(totals.drafts)} />
            </CmsListStack>
          </CmsCard>

          <CmsCard title="Content Mix" icon={FileText}>
            <CmsListStack>
              {stats.categoryBreakdown.slice(0, 8).map((c) => (
                <CmsMetricRow
                  key={c.category}
                  label={<CmsCategoryChip name={c.category} color={categoryColor.get(c.category)} className="admin-cat-chip--inline" />}
                  value={`${c.count} · ${formatNumber(c.views)} views`}
                />
              ))}
              {stats.categoryBreakdown.length === 0 && (
                <p className="text-[13px] text-muted-foreground py-2">No category data yet.</p>
              )}
            </CmsListStack>
          </CmsCard>

          <CmsCard title="Recently Published" icon={Clock}>
            <CmsListStack>
              {stats.recentPublished.map((a) => (
                <CmsListRow
                  key={a.id}
                  title={a.title}
                  href={`/cms/articles/${a.id}/edit`}
                  value={`${formatNumber(a.views)} views`}
                />
              ))}
              {stats.recentPublished.length === 0 && (
                <p className="text-[13px] text-muted-foreground py-2">No published articles yet.</p>
              )}
            </CmsListStack>
          </CmsCard>
        </aside>
      </div>
    </CmsSectionStack>
  );
}