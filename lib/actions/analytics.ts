'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can, canAccessAdminPanel } from '@/lib/constants';
import {
  type AnalyticsPeriod,
  parseAnalyticsQuery,
  resolveAnalyticsRange,
  buildPublishingTrendWithViews,
  buildTimeSeries,
  getMonthOptions,
  pctDelta,
  PERIOD_LABELS,
} from '@/lib/analytics-period';
import { ADMIN_AUDIT_LOG_WHERE } from '@/lib/admin-audit';

const FALLBACK_CATEGORY_COLORS = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];
const ARTICLE_RANK_COLORS = ['#f43f5e', '#e11d48', '#db2777', '#c026d3', '#9333ea'];

async function requireAnalyticsAccess() {
  const session = await auth();
  if (!session?.user || !canAccessAdminPanel(session.user.role) || !can(session.user.role, 'analytics.view_all')) {
    throw new Error('Forbidden');
  }
  return session.user;
}

export type AnalyticsOptions = {
  period?: string;
  month?: string | null;
};

export type AuthorPublishingStat = {
  id: string;
  name: string;
  role: string;
  total: number;
  day: number;
  week: number;
  month: number;
  year: number;
};

function publishingPeriodStarts(now = new Date()) {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);

  const week = new Date(day);
  const weekday = week.getDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  week.setDate(week.getDate() - diff);

  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const year = new Date(now.getFullYear(), 0, 1);
  return { day, week, month, year };
}

import { unstable_cache } from 'next/cache';

/** Published story counts per author/editor for admin dashboard */
export async function getAuthorPublishingStats(): Promise<AuthorPublishingStat[]> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'admin.access')) {
    throw new Error('Forbidden');
  }
  return getCachedAuthorPublishingStats();
}

const getCachedAuthorPublishingStats = unstable_cache(async (): Promise<AuthorPublishingStat[]> => {
  const { day, week, month, year } = publishingPeriodStarts();
  const publishedBase = { status: 'PUBLISHED' as const, editorTrash: false };

  const authors = await prisma.user.findMany({
    where: { role: { in: ['AUTHOR', 'EDITOR'] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });

  if (authors.length === 0) return [];

  const countByAuthor = (groups: { authorId: string; _count: { _all: number } }[]) =>
    new Map(groups.map((g) => [g.authorId, g._count._all]));

  const [totalGroups, dayGroups, weekGroups, monthGroups, yearGroups] = await Promise.all([
    prisma.article.groupBy({
      by: ['authorId'],
      where: publishedBase,
      _count: { _all: true },
    }),
    prisma.article.groupBy({
      by: ['authorId'],
      where: { ...publishedBase, publishedAt: { gte: day } },
      _count: { _all: true },
    }),
    prisma.article.groupBy({
      by: ['authorId'],
      where: { ...publishedBase, publishedAt: { gte: week } },
      _count: { _all: true },
    }),
    prisma.article.groupBy({
      by: ['authorId'],
      where: { ...publishedBase, publishedAt: { gte: month } },
      _count: { _all: true },
    }),
    prisma.article.groupBy({
      by: ['authorId'],
      where: { ...publishedBase, publishedAt: { gte: year } },
      _count: { _all: true },
    }),
  ]);

  const totalMap = countByAuthor(totalGroups);
  const dayMap = countByAuthor(dayGroups);
  const weekMap = countByAuthor(weekGroups);
  const monthMap = countByAuthor(monthGroups);
  const yearMap = countByAuthor(yearGroups);

  return authors
    .map((author) => ({
      id: author.id,
      name: author.name,
      role: author.role,
      total: totalMap.get(author.id) ?? 0,
      day: dayMap.get(author.id) ?? 0,
      week: weekMap.get(author.id) ?? 0,
      month: monthMap.get(author.id) ?? 0,
      year: yearMap.get(author.id) ?? 0,
    }))
    .sort((a, b) => b.total - a.total || b.month - a.month || b.year - a.year || a.name.localeCompare(b.name));
}, ['analytics-author-stats'], { revalidate: 1800 });

/** Lightweight stats for admin dashboard â€” avoids full analytics query storm */
export async function getAdminOverview() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'admin.access')) {
    throw new Error('Forbidden');
  }
  return getCachedAdminOverview();
}

const getCachedAdminOverview = unstable_cache(async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    articleCount,
    userCount,
    viewsAgg,
    publishedCount,
    topArticles,
    recentLogs,
    dashboardStats,
    publishedThisMonth,
    addedThisMonth,
    pendingComments,
    memberCount,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.user.count(),
    prisma.article.aggregate({ _sum: { views: true } }),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, views: true },
    }),
    prisma.auditLog.findMany({
      where: ADMIN_AUDIT_LOG_WHERE,
      orderBy: { timestamp: 'desc' },
      take: 8,
    }),
    prisma.dashboardStat.findMany({ orderBy: { lastVerified: 'desc' }, take: 4 }),
    prisma.article.count({ where: { status: 'PUBLISHED', publishedAt: { gte: monthStart } } }),
    prisma.article.count({
      where: { status: { not: 'TRASH' }, editorTrash: false, createdAt: { gte: monthStart } },
    }),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'SUBSCRIBER' } }),
  ]);

  return {
    articleCount,
    userCount,
    totalViews: viewsAgg._sum.views ?? 0,
    publishedCount,
    topArticles,
    recentLogs,
    dashboardStats,
    publishedThisMonth,
    addedThisMonth,
    pendingComments,
    memberCount,
    computedAt: now.toISOString(),
  };
}, ['analytics-admin-overview'], { revalidate: 1800 });

export async function getAnalytics(options?: AnalyticsOptions) {
  await requireAnalyticsAccess();
  return getCachedAnalytics(options);
}

const getCachedAnalytics = unstable_cache(async (options?: AnalyticsOptions) => {
  const now = new Date();
  const overviewMode = options === undefined;
  const { period, month } = overviewMode
    ? { period: 'monthly' as AnalyticsPeriod, month: null }
    : parseAnalyticsQuery(options);
  const { current: range, previous: prevRange, compareLabel } = overviewMode
    ? {
        current: { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13), end: now, label: 'Last 14 days' },
        previous: null,
        compareLabel: null,
      }
    : resolveAnalyticsRange(period, month, now);

  const dateWhere = { gte: range.start, lte: range.end };
  const prevDateWhere = prevRange ? { gte: prevRange.start, lte: prevRange.end } : null;
  const publishedInPeriod = overviewMode
    ? { status: 'PUBLISHED' as const }
    : { status: 'PUBLISHED' as const, publishedAt: dateWhere };

  const [
    articleCount,
    userCount,
    totalViewsAgg,
    publishedCount,
    draftCount,
    scheduledCount,
    archivedCount,
    trashCount,
    featuredCount,
    breakingCount,
    pinnedCount,
    categoryCount,
    mediaCount,
    magazineCount,
    newsletterCount,
    pendingComments,
    approvedComments,
    spamComments,
    pendingNotices,
    nodeCount,
    edgeCount,
    recentLogs,
    usersByRole,
    ads,
    adTotals,
    activeAdCount,
    homepageSetting,
    articlesMissingImage,

    avgReadTimeAgg,
    publishedInRange,
    publishedPrevRange,
    subsInRange,
    subsPrevRange,
    commentsInRange,
    commentsPrevRange,
    usersJoinedInRange,
    usersJoinedPrevRange,
    usersActiveInRange,
    allPublishedInWindow,
    topArticlesPeriod,
    categoryBreakdown,
    authorGroups,
    auditInRange,
    dbCategories,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.user.count(),
    prisma.article.aggregate({ _sum: { views: true, likes: true } }),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.article.count({ where: { status: 'DRAFT' } }),
    prisma.article.count({ where: { status: 'SCHEDULED' } }),
    prisma.article.count({ where: { status: 'ARCHIVED' } }),
    prisma.article.count({ where: { status: 'TRASH' } }),
    prisma.article.count({ where: { isFeatured: true, status: 'PUBLISHED' } }),
    prisma.article.count({ where: { isBreaking: true, status: 'PUBLISHED' } }),
    prisma.article.count({ where: { isPinned: true, status: 'PUBLISHED' } }),
    prisma.category.count(),
    prisma.media.count(),
    prisma.magazineIssue.count(),
    prisma.newsletterSub.count({ where: { status: 'active' } }),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'APPROVED' } }),
    prisma.comment.count({ where: { status: 'SPAM' } }),
    prisma.editorialNotice.count({ where: { status: 'PENDING' } }),
    prisma.node.count(),
    prisma.edge.count(),
    prisma.auditLog.findMany({
      where: overviewMode
        ? ADMIN_AUDIT_LOG_WHERE
        : { AND: [ADMIN_AUDIT_LOG_WHERE, { timestamp: dateWhere }] },
      orderBy: { timestamp: 'desc' },
      take: overviewMode ? 10 : 8,
    }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.ad.findMany({ orderBy: [{ isActive: 'desc' }, { impressions: 'desc' }], take: 6 }),
    prisma.ad.aggregate({ _sum: { impressions: true, clicks: true }, _count: true }),
    prisma.ad.count({ where: { isActive: true } }),
    prisma.siteSetting.findUnique({ where: { key: 'homepage' } }),
    prisma.article.count({
      where: { status: 'PUBLISHED', OR: [{ imageUrl: null }, { imageUrl: '' }] },
    }),
    prisma.article.aggregate({ _avg: { readTime: true } }),
    prisma.article.count({
      where: { status: 'PUBLISHED', publishedAt: dateWhere },
    }),
    prevDateWhere
      ? prisma.article.count({ where: { status: 'PUBLISHED', publishedAt: prevDateWhere } })
      : Promise.resolve(0),
    prisma.newsletterSub.count({ where: { subscribedAt: dateWhere } }),
    prevDateWhere
      ? prisma.newsletterSub.count({ where: { subscribedAt: prevDateWhere } })
      : Promise.resolve(0),
    prisma.comment.count({ where: { createdAt: dateWhere } }),
    prevDateWhere
      ? prisma.comment.count({ where: { createdAt: prevDateWhere } })
      : Promise.resolve(0),
    prisma.user.count({ where: { createdAt: dateWhere } }),
    prevDateWhere
      ? prisma.user.count({ where: { createdAt: prevDateWhere } })
      : Promise.resolve(0),
    prisma.user.count({ where: { lastLoginAt: dateWhere } }),
    prisma.article.findMany({
      where: overviewMode
        ? { status: 'PUBLISHED', publishedAt: dateWhere }
        : publishedInPeriod,
      select: { publishedAt: true, views: true },
    }),
    prisma.article.findMany({
      where: publishedInPeriod,
      orderBy: { views: 'desc' },
      take: 8,
      select: { id: true, title: true, slug: true, views: true, category: true, likes: true, publishedAt: true },
    }),
    prisma.article.groupBy({
      by: ['category'],
      where: publishedInPeriod,
      _count: true,
      _sum: { views: true },
      orderBy: { _sum: { views: 'desc' } },
    }),
    prisma.article.groupBy({
      by: ['authorId'],
      where: publishedInPeriod,
      _count: true,
      _sum: { views: true },
      orderBy: { _sum: { views: 'desc' } },
      take: 5,
    }),
    overviewMode
      ? Promise.resolve(0)
      : prisma.auditLog.count({ where: { timestamp: dateWhere } }),
    prisma.category.findMany({ select: { name: true, color: true }, orderBy: { order: 'asc' } }),
  ]);

  const categoryColorMap = new Map(
    dbCategories.map((c, i) => [c.name, c.color || FALLBACK_CATEGORY_COLORS[i % FALLBACK_CATEGORY_COLORS.length]]),
  );

  const authorIds = authorGroups.map((g) => g.authorId);
  const authors = authorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true, role: true },
      })
    : [];

  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const topAuthors = authorGroups.map((g) => ({
    id: g.authorId,
    name: authorMap.get(g.authorId)?.name ?? 'Unknown',
    role: authorMap.get(g.authorId)?.role ?? 'AUTHOR',
    articles: g._count,
    views: g._sum.views ?? 0,
  }));

  const totalViews = totalViewsAgg._sum.views ?? 0;
  const totalLikes = totalViewsAgg._sum.likes ?? 0;
  const avgViewsPerArticle = publishedCount > 0 ? Math.round(totalViews / publishedCount) : 0;
  const avgReadTime = Math.round(avgReadTimeAgg._avg.readTime ?? 0);

  const adImpressions = adTotals._sum.impressions ?? 0;
  const adClicks = adTotals._sum.clicks ?? 0;
  const adCtr = adImpressions > 0 ? (adClicks / adImpressions) * 100 : 0;

  const carouselMode = 'managed' as const;

  const contentPipeline = [
    { status: 'Published', count: publishedCount, color: 'hsl(160 84% 39%)' },
    { status: 'Draft', count: draftCount, color: 'hsl(38 92% 50%)' },
    { status: 'Scheduled', count: scheduledCount, color: 'hsl(217 91% 60%)' },
    { status: 'Archived', count: archivedCount, color: 'hsl(262 72% 62%)' },
    { status: 'Trash', count: trashCount, color: 'hsl(215 16% 52%)' },
  ];

  const publishingTrend = buildPublishingTrendWithViews(allPublishedInWindow, period, range, month);

  const categoriesByViews = categoryBreakdown.map((c, i) => ({
    category: c.category,
    articles: c._count,
    views: c._sum.views ?? 0,
    color: categoryColorMap.get(c.category) ?? FALLBACK_CATEGORY_COLORS[i % FALLBACK_CATEGORY_COLORS.length],
  }));

  const colorizeArticles = (list: typeof topArticlesPeriod) =>
    list.map((a, i) => ({
      ...a,
      color: categoryColorMap.get(a.category) ?? ARTICLE_RANK_COLORS[i % ARTICLE_RANK_COLORS.length],
    }));

  const periodViewsInRange = categoriesByViews.reduce((s, c) => s + c.views, 0);

  const adsWithMetrics = ads.map((ad) => ({
    id: ad.id,
    name: ad.name,
    position: ad.position,
    isActive: ad.isActive,
    impressions: ad.impressions,
    clicks: ad.clicks,
    ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
  }));

  const periodComparison = overviewMode || !prevRange
    ? null
    : {
        published: { current: publishedInRange, previous: publishedPrevRange, delta: pctDelta(publishedInRange, publishedPrevRange) },
        subscribers: { current: subsInRange, previous: subsPrevRange, delta: pctDelta(subsInRange, subsPrevRange) },
        comments: { current: commentsInRange, previous: commentsPrevRange, delta: pctDelta(commentsInRange, commentsPrevRange) },
        newUsers: { current: usersJoinedInRange, previous: usersJoinedPrevRange, delta: pctDelta(usersJoinedInRange, usersJoinedPrevRange) },
        label: compareLabel ?? '',
      };

  let monthlySnapshots: { label: string; key: string; published: number; subscribers: number; comments: number }[] = [];
  if (!overviewMode && !month && period === 'monthly') {
    const snapStart = range.start;
    const [snapArticles, snapSubs, snapComments] = await Promise.all([
      prisma.article.findMany({
        where: { status: 'PUBLISHED', publishedAt: { gte: snapStart, lte: range.end } },
        select: { publishedAt: true },
      }),
      prisma.newsletterSub.findMany({
        where: { subscribedAt: { gte: snapStart, lte: range.end } },
        select: { subscribedAt: true },
      }),
      prisma.comment.findMany({
        where: { createdAt: { gte: snapStart, lte: range.end } },
        select: { createdAt: true },
      }),
    ]);
    const pubSeries = buildTimeSeries(
      snapArticles.filter((a) => a.publishedAt).map((a) => ({ at: a.publishedAt! })),
      'monthly',
      range,
      null,
    );
    const subMap = new Map<string, number>();
    const comMap = new Map<string, number>();
    for (const s of snapSubs) {
      const k = `${s.subscribedAt.getFullYear()}-${String(s.subscribedAt.getMonth() + 1).padStart(2, '0')}`;
      subMap.set(k, (subMap.get(k) ?? 0) + 1);
    }
    for (const c of snapComments) {
      const k = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
      comMap.set(k, (comMap.get(k) ?? 0) + 1);
    }
    monthlySnapshots = pubSeries.map((b) => ({
      key: b.key,
      label: b.label,
      published: b.count,
      subscribers: subMap.get(b.key) ?? 0,
      comments: comMap.get(b.key) ?? 0,
    }));
  }

  const monthOptions = await (async () => {
    const base = getMonthOptions(12, now);
    if (overviewMode) {
      return base.map((o) => ({
        ...o,
        description: 'Daily chart Â· MoM comparison',
        dot: 'hsl(var(--muted-foreground) / 0.4)',
      }));
    }
    const statsStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthArticles = await prisma.article.findMany({
      where: { status: 'PUBLISHED', publishedAt: { gte: statsStart, lte: now } },
      select: { publishedAt: true, views: true },
    });
    const monthStats = new Map<string, { published: number; views: number }>();
    for (const a of monthArticles) {
      if (!a.publishedAt) continue;
      const key = `${a.publishedAt.getFullYear()}-${String(a.publishedAt.getMonth() + 1).padStart(2, '0')}`;
      const cur = monthStats.get(key) ?? { published: 0, views: 0 };
      cur.published += 1;
      cur.views += a.views;
      monthStats.set(key, cur);
    }
    return base.map((o, i) => {
      const s = monthStats.get(o.value);
      const published = s?.published ?? 0;
      const views = s?.views ?? 0;
      const viewsLabel = views >= 1000 ? `${(views / 1000).toFixed(1)}k views` : `${views} views`;
      return {
        ...o,
        count: published,
        description: published > 0 ? `${published} post${published === 1 ? '' : 's'} Â· ${viewsLabel}` : 'No publishes Â· daily trend only',
        dot: published > 0 ? `hsl(${148 + (i * 7) % 40} 65% 44%)` : 'hsl(var(--muted-foreground) / 0.35)',
      };
    });
  })();

  return {
    generatedAt: now.toISOString(),
    filters: {
      period,
      month,
      periodLabel: overviewMode ? 'Overview' : PERIOD_LABELS[period],
      rangeLabel: range.label,
      compareLabel: overviewMode ? null : compareLabel,
    },
    monthOptions,
    articleCount,
    userCount,
    totalViews,
    publishedCount,
    draftCount,
    scheduledCount,
    archivedCount,
    trashCount,
    featuredCount,
    breakingCount,
    pinnedCount,
    categoryCount,
    mediaCount,
    magazineCount,
    newsletterCount,
    pendingComments,
    approvedComments,
    spamComments,
    pendingNotices,
    nodeCount,
    edgeCount,
    recentLogs,
    topArticles: colorizeArticles(topArticlesPeriod),
    categoryColors: Object.fromEntries(categoryColorMap),
    usersByRole,
    topAuthors,
    contentPipeline,
    publishingTrend,
    monthlySnapshots,
    periodComparison,
    categoriesByViews,
    totalLikes,
    avgViewsPerArticle,
    avgReadTime,
    articlesMissingImage,
    periodMetrics: {
      published: publishedInRange,
      subscribers: subsInRange,
      comments: commentsInRange,
      newUsers: usersJoinedInRange,
      activeUsers: usersActiveInRange,
      auditEvents: auditInRange,
      periodViews: periodViewsInRange,
    },
    engagement: {
      totalLikes,
      avgViewsPerArticle,
      avgReadTime,
      commentTotal: pendingComments + approvedComments + spamComments,
    },
    ads: {
      total: adTotals._count,
      active: activeAdCount,
      impressions: adImpressions,
      clicks: adClicks,
      ctr: adCtr,
      slots: adsWithMetrics,
    },
    platform: {
      carouselMode,
      homepageManaged: true,
    },
    computedAt: now.toISOString(),
  };
}, ['analytics-main'], { revalidate: 1800 });

/** Author-scoped analytics for the CMS workspace */
export async function getAuthorAnalytics(authorId?: string) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'analytics.view_own')) {
    throw new Error('Forbidden');
  }

  const targetId = authorId && can(session.user.role, 'analytics.view_all') ? authorId : session.user.id;
  return getCachedAuthorAnalytics(targetId);
}

const getCachedAuthorAnalytics = unstable_cache(async (targetId: string) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseWhere = { authorId: targetId, status: { not: 'TRASH' as const } };

  const [
    totalArticles,
    published,
    drafts,
    scheduled,
    viewsAgg,
    likesAgg,
    topArticles,
    categoryBreakdown,
    publishedThisMonth,
    recentPublished,
    peerGroups,
    newsroomTotals,
  ] = await Promise.all([
    prisma.article.count({ where: baseWhere }),
    prisma.article.count({ where: { authorId: targetId, status: 'PUBLISHED' } }),
    prisma.article.count({ where: { authorId: targetId, status: 'DRAFT' } }),
    prisma.article.count({ where: { authorId: targetId, status: 'SCHEDULED' } }),
    prisma.article.aggregate({ where: baseWhere, _sum: { views: true } }),
    prisma.article.aggregate({ where: baseWhere, _sum: { likes: true } }),
    prisma.article.findMany({
      where: { authorId: targetId, status: 'PUBLISHED' },
      orderBy: { views: 'desc' },
      take: 10,
      select: { id: true, title: true, slug: true, views: true, likes: true, category: true, publishedAt: true },
    }),
    prisma.article.groupBy({
      by: ['category'],
      where: { authorId: targetId, status: 'PUBLISHED' },
      _count: { id: true },
      _sum: { views: true },
    }),
    prisma.article.count({
      where: { authorId: targetId, status: 'PUBLISHED', publishedAt: { gte: monthStart } },
    }),
    prisma.article.findMany({
      where: { authorId: targetId, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, publishedAt: true, views: true },
    }),
    prisma.article.groupBy({
      by: ['authorId'],
      where: { status: 'PUBLISHED', editorTrash: false },
      _count: { id: true },
      _sum: { views: true, likes: true },
    }),
    prisma.article.aggregate({
      where: { status: 'PUBLISHED', editorTrash: false },
      _sum: { views: true, likes: true },
      _count: { id: true },
    }),
  ]);

  const totalViews = viewsAgg._sum.views ?? 0;
  const avgViews = published > 0 ? Math.round(totalViews / published) : 0;

  const sortedPeerGroups = [...peerGroups].sort(
    (a, b) => (b._sum.views ?? 0) - (a._sum.views ?? 0),
  );

  const peerAuthorIds = sortedPeerGroups.map((g) => g.authorId);
  const peerAuthors = peerAuthorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: peerAuthorIds } },
        select: { id: true, name: true },
      })
    : [];
  const peerNameMap = new Map(peerAuthors.map((a) => [a.id, a.name]));

  const peers = sortedPeerGroups.map((g) => ({
    authorId: g.authorId,
    name: g.authorId === targetId ? 'You' : (peerNameMap.get(g.authorId) ?? 'Editor'),
    published: g._count.id,
    views: g._sum.views ?? 0,
    likes: g._sum.likes ?? 0,
    avgViews: g._count.id > 0 ? Math.round((g._sum.views ?? 0) / g._count.id) : 0,
    isYou: g.authorId === targetId,
  }));

  const yourIndex = peers.findIndex((p) => p.isYou);
  const newsroomPublished = newsroomTotals._count.id;
  const newsroomViews = newsroomTotals._sum.views ?? 0;
  const newsroomAvgViews = newsroomPublished > 0 ? Math.round(newsroomViews / newsroomPublished) : 0;

  return {
    authorId: targetId,
    generatedAt: now.toISOString(),
    totals: {
      articles: totalArticles,
      published,
      drafts,
      scheduled,
      views: totalViews,
      likes: likesAgg._sum.likes ?? 0,
      avgViewsPerArticle: avgViews,
      publishedThisMonth,
    },
    topArticles,
    categoryBreakdown: categoryBreakdown
      .map((c) => ({
        category: c.category,
        count: c._count.id,
        views: c._sum.views ?? 0,
      }))
      .sort((a, b) => b.views - a.views),
    recentPublished,
    benchmarks: {
      rank: yourIndex >= 0 ? yourIndex + 1 : null,
      totalEditors: peers.length,
      yourAvgViews: avgViews,
      newsroomAvgViews,
      viewsVsNewsroom: newsroomAvgViews > 0 ? Math.round(((avgViews - newsroomAvgViews) / newsroomAvgViews) * 100) : 0,
      yourViewsShare: newsroomViews > 0 ? Math.round((totalViews / newsroomViews) * 100) : 0,
    },
    peers: peers.slice(0, 8),
  };
}, ['analytics-author'], { revalidate: 1800 });
