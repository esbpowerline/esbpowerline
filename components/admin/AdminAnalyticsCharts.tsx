'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
  ComposedChart, Line,
} from 'recharts';
import { AdminCard } from '@/components/admin/AdminUI';
import { useChartTheme } from '@/components/admin/analytics/useChartTheme';
import { BarChart3, PieChart as PieIcon, TrendingUp, Layers, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import { AdminContentPipelinePanel } from '@/components/admin/AdminContentPipelinePanel';
import { ROLES, USER_ROLE_LABELS, type Role } from '@/lib/constants';
import { formatDelta, PERIOD_ACCENTS } from '@/lib/analytics-period';
import { LiveArticleTextLink } from '@/components/shared/LiveArticleLink';
import type { AnalyticsPeriod } from '@/lib/analytics-period';
import { chartGridProps } from '@/lib/data/grid/chart-axis';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'hsl(346 77% 58%)',
  ADMIN: 'hsl(262 72% 62%)',
  EDITOR: 'hsl(217 91% 60%)',
  AUTHOR: 'hsl(160 84% 42%)',
  CONTRIBUTOR: 'hsl(38 92% 50%)',
  SUBSCRIBER: 'hsl(215 16% 52%)',
};

const FALLBACK_COLORS = [
  'hsl(346 77% 58%)',
  'hsl(262 72% 62%)',
  'hsl(217 91% 60%)',
  'hsl(160 84% 42%)',
  'hsl(38 92% 50%)',
  'hsl(199 89% 48%)',
];

const tooltipWrapperStyle = {
  zIndex: 40,
  outline: 'none',
  pointerEvents: 'none' as const,
};

type ChartProps = {
  filters: {
    period: AnalyticsPeriod;
    month: string | null;
    periodLabel: string;
    rangeLabel: string;
    compareLabel: string | null;
  };
  topArticles: { title: string; slug: string; views: number; category: string; likes?: number; color?: string }[];
  usersByRole: { role: string; _count: number }[];
  publishingTrend: { label: string; count: number; views: number }[];
  categoriesByViews: { category: string; articles: number; views: number; color?: string }[];
  contentPipeline: { status: string; count: number; color: string }[];
  monthlySnapshots: { label: string; published: number; subscribers: number; comments: number }[];
  periodComparison: {
    label: string;
    published: { current: number; previous: number; delta: number };
    subscribers: { current: number; previous: number; delta: number };
    comments: { current: number; previous: number; delta: number };
    newUsers: { current: number; previous: number; delta: number };
  } | null;
};

function roleLabel(role: string) {
  return USER_ROLE_LABELS[role as Role] ?? ROLES[role as Role]?.name ?? role.replace(/_/g, ' ');
}

function roleColor(role: string, index: number) {
  return ROLE_COLORS[role] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

type RoleDatum = { key: string; name: string; value: number };

function UsersByRolePanel({ roleData, totalUsers }: { roleData: RoleDatum[]; totalUsers: number }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  if (roleData.length === 0) {
    return <p className="admin-analytics-empty">No users.</p>;
  }

  const hoveredRole = hoveredKey ? roleData.find((role) => role.key === hoveredKey) : null;
  const hoveredIndex = hoveredRole ? roleData.findIndex((role) => role.key === hoveredKey) : -1;
  const hoveredColor = hoveredRole ? roleColor(hoveredRole.key, Math.max(hoveredIndex, 0)) : null;
  const hoveredPct = hoveredRole && totalUsers > 0
    ? ((hoveredRole.value / totalUsers) * 100).toFixed(1)
    : null;

  return (
    <div className="admin-analytics-role-panel">
      <div className="admin-analytics-role-stack" aria-label="User role composition">
        {roleData.map((role, i) => {
          const color = roleColor(role.key, i);
          const width = totalUsers > 0 ? (role.value / totalUsers) * 100 : 0;
          const isDimmed = hoveredKey !== null && hoveredKey !== role.key;
          return (
            <button
              key={role.key}
              type="button"
              className={cn('admin-analytics-role-stack-seg', isDimmed && 'admin-analytics-role-stack-seg--dim')}
              style={{ width: `${width}%`, backgroundColor: color }}
              onMouseEnter={() => setHoveredKey(role.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onFocus={() => setHoveredKey(role.key)}
              onBlur={() => setHoveredKey(null)}
              aria-label={`${role.name}: ${formatNumber(role.value)} users, ${width.toFixed(1)}%`}
            />
          );
        })}
      </div>

      <div
        className={cn(
          'admin-analytics-role-focus',
          !hoveredRole && 'admin-analytics-role-focus--idle',
        )}
        style={hoveredColor ? ({ '--role-accent': hoveredColor } as React.CSSProperties) : undefined}
        aria-live="polite"
      >
        {hoveredRole ? (
          <>
            <span className="admin-analytics-role-focus-swatch" aria-hidden />
            <span className="admin-analytics-role-focus-name">{hoveredRole.name}</span>
            <span className="admin-analytics-role-focus-meta">
              <strong>{formatNumber(hoveredRole.value)}</strong> users
              <span className="admin-analytics-role-focus-sep">·</span>
              <strong>{hoveredPct}%</strong> of total
            </span>
          </>
        ) : (
          <span className="admin-analytics-role-focus-hint">Hover a segment or legend row for role details</span>
        )}
      </div>

      <div className="admin-analytics-role-hero">
        <div className="admin-analytics-donut-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={roleData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                cornerRadius={4}
                stroke="hsl(var(--card))"
                strokeWidth={2}
                isAnimationActive={false}
                onMouseEnter={(_, i) => setHoveredKey(roleData[i]?.key ?? null)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {roleData.map((entry, i) => {
                  const color = roleColor(entry.key, i);
                  const isDimmed = hoveredKey !== null && hoveredKey !== entry.key;
                  return (
                    <Cell
                      key={entry.key}
                      fill={color}
                      fillOpacity={isDimmed ? 0.28 : 1}
                      style={{ transition: 'fill-opacity 180ms ease' }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="admin-analytics-donut-center">
            <span className="admin-analytics-donut-total">{formatNumber(totalUsers)}</span>
            <span className="admin-analytics-donut-label">users</span>
          </div>
        </div>
      </div>

      <div className="admin-analytics-role-legend">
        {roleData.map((role, i) => {
          const color = roleColor(role.key, i);
          const pct = totalUsers > 0 ? ((role.value / totalUsers) * 100).toFixed(1) : '0';
          const isActive = hoveredKey === role.key;
          return (
            <button
              key={role.key}
              type="button"
              className={cn('admin-analytics-role-legend-row', isActive && 'admin-analytics-role-legend-row--active')}
              onMouseEnter={() => setHoveredKey(role.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onFocus={() => setHoveredKey(role.key)}
              onBlur={() => setHoveredKey(null)}
            >
              <span className="admin-analytics-role-swatch" style={{ backgroundColor: color }} />
              <span className="admin-analytics-role-legend-name">{role.name}</span>
              <span className="admin-analytics-role-legend-pct">{pct}%</span>
              <span className="admin-analytics-role-legend-count">{formatNumber(role.value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const up = value > 0;
  const flat = value === 0;
  return (
    <span
      className={`admin-analytics-delta ${flat ? 'admin-analytics-delta--flat' : up ? 'admin-analytics-delta--up' : 'admin-analytics-delta--down'}`}
    >
      {formatDelta(value)}
    </span>
  );
}

function truncateCat(name: string, max = 22) {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

function CategoryTrafficTooltip({
  active,
  payload,
  totalViews,
}: {
  active?: boolean;
  payload?: { payload?: { fullName?: string; articles?: number; views?: number; color?: string } }[];
  totalViews: number;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row?.fullName) return null;
  const color = row.color ?? FALLBACK_COLORS[0];
  const views = row.views ?? 0;
  const share = totalViews > 0 ? ((views / totalViews) * 100).toFixed(1) : '0';
  return (
    <div
      className="admin-analytics-category-tooltip"
      style={{ '--tip-accent': color } as React.CSSProperties}
    >
      <div className="admin-analytics-category-tooltip-head">
        <span className="admin-analytics-category-tooltip-dot" />
        <span className="admin-analytics-category-tooltip-name">{row.fullName}</span>
      </div>
      <div className="admin-analytics-category-tooltip-grid">
        <span><strong>{formatNumber(views)}</strong> views</span>
        <span><strong>{formatNumber(row.articles ?? 0)}</strong> articles</span>
        <span><strong>{share}%</strong> of period</span>
      </div>
    </div>
  );
}

function PublishingTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const posts = payload.find((p) => p.dataKey === 'count');
  const views = payload.find((p) => p.dataKey === 'views');
  return (
    <div className="admin-analytics-chart-tooltip">
      <div className="admin-analytics-chart-tooltip-label">{label}</div>
      <div className="admin-analytics-chart-tooltip-row">
        <span className="admin-analytics-chart-tooltip-dot" style={{ background: '#8b5cf6' }} />
        Published posts
        <strong>{formatNumber(Number(posts?.value ?? 0))}</strong>
      </div>
      <div className="admin-analytics-chart-tooltip-row">
        <span className="admin-analytics-chart-tooltip-dot admin-analytics-chart-tooltip-dot--line" style={{ background: 'currentColor' }} />
        Views on published
        <strong>{formatNumber(Number(views?.value ?? 0))}</strong>
      </div>
    </div>
  );
}

export function AdminAnalyticsCharts({
  filters,
  topArticles,
  usersByRole,
  publishingTrend,
  categoriesByViews,
  contentPipeline,
  monthlySnapshots,
  periodComparison,
}: ChartProps) {
  const chartTheme = useChartTheme();
  const periodAccent = PERIOD_ACCENTS[filters.period];
  const articles = topArticles.slice(0, 5);
  const maxArticleViews = articles[0]?.views ?? 1;

  const roleData = usersByRole
    .map((r) => ({ key: r.role, name: roleLabel(r.role), value: r._count }))
    .sort((a, b) => b.value - a.value);

  const totalUsers = roleData.reduce((sum, r) => sum + r.value, 0);

  const categories = categoriesByViews.slice(0, 8).map((c) => ({
    ...c,
    shortName: truncateCat(c.category),
    fullName: c.category,
  }));
  const totalCategoryViews = categories.reduce((sum, c) => sum + c.views, 0) || 1;

  const trendTitle = filters.month
    ? `Published vs views · ${filters.rangeLabel}`
    : `Published vs views · ${filters.periodLabel}`;

  const maxPosts = Math.max(...publishingTrend.map((p) => p.count), 1);
  const maxViews = Math.max(...publishingTrend.map((p) => p.views), 1);

  const showMomChart = !filters.month && monthlySnapshots.length > 0;

  return (
    <div className="admin-analytics-charts">
      {(periodComparison || showMomChart) && (
        <div className={cn('admin-analytics-row admin-analytics-row--mom', !periodComparison && 'admin-analytics-row--mom-single')}>
          {periodComparison && (
            <AdminCard
              title="MoM comparison"
              icon={CalendarRange}
              className="admin-analytics-mom-card-wrap"
              bodyClassName="admin-card-body--dense"
              action={<span className="admin-analytics-summary">{periodComparison.label}</span>}
            >
              <p className="admin-analytics-mom-caption">Current period vs prior</p>
              <div className="admin-analytics-mom-grid admin-analytics-mom-grid--compact">
                {[
                  { label: 'Published', short: 'Posts', data: periodComparison.published, accent: '#8b5cf6' },
                  { label: 'Subscribers', short: 'Subs', data: periodComparison.subscribers, accent: '#3b82f6' },
                  { label: 'Comments', short: 'Cmts', data: periodComparison.comments, accent: '#10b981' },
                  { label: 'New users', short: 'Users', data: periodComparison.newUsers, accent: '#f59e0b' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="admin-analytics-mom-metric"
                    style={{ '--mom-accent': item.accent } as React.CSSProperties}
                  >
                    <span className="admin-analytics-mom-card-label">{item.short}</span>
                    <div className="admin-analytics-mom-card-main">
                      <span className="admin-analytics-mom-card-current">{formatNumber(item.data.current)}</span>
                      <DeltaBadge value={item.data.delta} />
                    </div>
                    <span className="admin-analytics-mom-card-prev">
                      Prior {formatNumber(item.data.previous)}
                    </span>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {showMomChart && (
            <AdminCard
              title="Month over month"
              icon={BarChart3}
              className="admin-analytics-mom-chart-wrap"
              bodyClassName="admin-card-body--dense"
              action={<span className="admin-analytics-summary">12-mo rolling</span>}
            >
              <div className="admin-analytics-chart-area admin-analytics-chart-area--mom">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySnapshots} margin={{ top: 10, right: 8, left: -12, bottom: 56 }}>
                    <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 8, fill: chartTheme.axisTick }}
                      interval={0}
                      angle={-40}
                      textAnchor="end"
                      height={44}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 8, fill: chartTheme.axisTick }} width={22} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--card))',
                        fontSize: '11px',
                        padding: '6px 10px',
                      }}
                      wrapperStyle={tooltipWrapperStyle}
                      allowEscapeViewBox={{ x: true, y: true }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 9, lineHeight: '12px', paddingTop: 14 }}
                    />
                    <Bar dataKey="published" name="Published" fill="#f43f5e" radius={[2, 2, 0, 0]} maxBarSize={10} />
                    <Bar dataKey="subscribers" name="Subs" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={10} />
                    <Bar dataKey="comments" name="Comments" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminCard>
          )}
        </div>
      )}

      <div className="admin-analytics-row admin-analytics-row--articles">
        <AdminCard
          title="Top in period"
          icon={BarChart3}
          className="admin-analytics-card-fill"
          bodyClassName="admin-card-body--dense admin-card-body--fill"
          action={<span className="admin-analytics-summary">Lifetime views</span>}
        >
          {articles.length > 0 ? (
            <div className="flex-1 min-h-0">
              {articles.map((article, i) => {
                const color = article.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const barWidth = Math.max(4, Math.round((article.views / maxArticleViews) * 100));
                return (
                  <div key={article.slug} className="admin-analytics-article-row">
                    <span
                      className="admin-rank admin-rank--sm admin-rank--colored"
                      style={{ background: `${color}22`, color }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="admin-analytics-article-head">
                        <LiveArticleTextLink
                          slug={article.slug}
                          title={article.title}
                          className="admin-analytics-article-title line-clamp-1 block"
                        />
                        <span className="admin-analytics-inline-stat" style={{ color }}>{formatNumber(article.views)}</span>
                      </div>
                      <div className="admin-analytics-article-sub">
                        <span
                          className="admin-tag-capsule admin-tag-capsule--xs"
                          style={{ borderColor: `${color}55`, color, background: `${color}12` }}
                        >
                          {article.category}
                        </span>
                      </div>
                      <div className="admin-analytics-bar-track admin-analytics-bar-track--sm">
                        <div className="admin-analytics-bar-fill" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="admin-analytics-empty">No publishes in this period.</p>
          )}
        </AdminCard>

        <AdminCard
          title={trendTitle}
          icon={TrendingUp}
          className="admin-analytics-card-fill"
          bodyClassName="admin-card-body--dense admin-card-body--fill"
          action={<span className="admin-analytics-summary">Posts &amp; views</span>}
        >
          <div className="admin-analytics-chart-area admin-analytics-chart-area--md">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={publishingTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid {...chartGridProps(chartTheme.gridStroke, 'posts')} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 8, fill: chartTheme.axisTick }}
                  interval="preserveStartEnd"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="posts"
                  allowDecimals={false}
                  domain={[0, maxPosts]}
                  tick={{ fontSize: 8, fill: chartTheme.axisTick }}
                  width={22}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="views"
                  orientation="right"
                  allowDecimals={false}
                  domain={[0, maxViews]}
                  tick={{ fontSize: 8, fill: chartTheme.axisTick }}
                  width={28}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${formatNumber(Math.round(v / 1000))}K` : formatNumber(v))}
                />
                <Tooltip
                  content={<PublishingTooltip />}
                  wrapperStyle={tooltipWrapperStyle}
                  allowEscapeViewBox={{ x: true, y: true }}
                />
                <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
                <Bar
                  yAxisId="posts"
                  dataKey="count"
                  name="Published posts"
                  fill={periodAccent}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={12}
                  opacity={0.92}
                />
                <Line
                  yAxisId="views"
                  type="monotone"
                  dataKey="views"
                  name="Views on published"
                  stroke={chartTheme.trendStroke}
                  strokeWidth={2}
                  dot={{ r: 2, fill: chartTheme.trendFill, strokeWidth: 0 }}
                  activeDot={{ r: 3, fill: chartTheme.trendFill, stroke: chartTheme.trendStroke, strokeWidth: 1 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>

      <AdminCard
        title="Category traffic"
        icon={Layers}
        bodyClassName="admin-card-body--dense"
        action={<span className="admin-analytics-summary">{formatNumber(totalCategoryViews)} views · {categories.length} sectors</span>}
      >
        {categories.length > 0 ? (
          <div className="admin-analytics-category-chart-wrap">
            <ResponsiveContainer width="100%" height={Math.max(120, categories.length * 28)}>
              <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid {...chartGridProps(chartTheme.gridStroke)} vertical horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 8 }} tickFormatter={(v) => formatNumber(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="shortName" width={88} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: chartTheme.hoverFill }}
                  content={<CategoryTrafficTooltip totalViews={totalCategoryViews} />}
                  wrapperStyle={tooltipWrapperStyle}
                  allowEscapeViewBox={{ x: true, y: true }}
                />
                <Bar dataKey="views" radius={[0, 3, 3, 0]} maxBarSize={14} activeBar={{ fillOpacity: 0.88 }}>
                  {categories.map((cat, i) => (
                    <Cell key={cat.category} fill={cat.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="admin-analytics-empty">No category data for period.</p>
        )}
      </AdminCard>

      <div className="admin-analytics-row admin-analytics-row--split admin-analytics-row--pipeline">
        <AdminCard title="Users by role" icon={PieIcon} bodyClassName="admin-card-body--dense">
          <UsersByRolePanel roleData={roleData} totalUsers={totalUsers} />
        </AdminCard>

        <AdminCard title="Pipeline" icon={BarChart3} className="admin-pipeline-card" bodyClassName="admin-card-body--dense admin-card-body--pipeline-v2">
          <AdminContentPipelinePanel items={contentPipeline} />
        </AdminCard>
      </div>
    </div>
  );
}