'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';

import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-paths';
import { revalidateAllContent, revalidateArticleContent } from '@/lib/revalidate-tags';
import { MAX_PINNED_COVERAGE } from '@/lib/placement-rules';

export async function revalidatePublicSite() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'settings.edit')) {
    throw new Error('Forbidden');
  }

  for (const path of PUBLIC_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  revalidateAllContent();

  await prisma.auditLog.create({
    data: {
      type: 'platform.revalidate',
      message: 'Public site cache revalidated by admin',
      userId: session.user.id,
    },
  });

  return { ok: true, paths: PUBLIC_REVALIDATE_PATHS.length };
}

export async function getPlatformSnapshot() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'article.feature')) {
    throw new Error('Forbidden');
  }

  const {
    reviewQueue: _rq,
    reviewCount: _rc,
    inReview: _ir,
    scheduled: _sc,
    pendingComments: _pc,
    ...platform
  } = await getAdminDeskSnapshot();
  return platform;
}

export async function getAdminDeskSnapshot() {
  const session = await auth();
  if (!session?.user?.id || !can(session.user.role, 'article.feature')) {
    throw new Error('Forbidden');
  }

  const userId = session.user.id;
  const canModerate = can(session.user.role, 'comment.moderate_any');

  const [
    published,
    featured,
    pinned,
    draft,
    inReview,
    scheduled,
    settingsCount,
    homepageSetting,
    reviewQueue,
    reviewCount,
    pendingComments,
  ] = await Promise.all([
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.article.count({ where: { status: 'PUBLISHED', isFeatured: true } }),
    prisma.article.count({ where: { status: 'PUBLISHED', isPinned: true } }),
    prisma.article.count({ where: { status: 'DRAFT' } }),
    prisma.article.count({ where: { status: 'IN_REVIEW' } }),
    prisma.article.count({ where: { status: 'SCHEDULED' } }),
    prisma.siteSetting.count(),
    prisma.siteSetting.findUnique({ where: { key: 'homepage' } }),
    prisma.editorialNotice.findMany({
      where: {
        recipientId: userId,
        type: 'REVIEW_SUBMISSION',
        status: 'PENDING',
        trashedAt: null,
      },
      include: {
        sender: { select: { id: true, name: true } },
        article: { select: { id: true, title: true, slug: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.editorialNotice.count({
      where: {
        recipientId: userId,
        type: 'REVIEW_SUBMISSION',
        status: 'PENDING',
        trashedAt: null,
      },
    }),
    canModerate
      ? prisma.comment.count({ where: { status: 'PENDING' } })
      : Promise.resolve(0),
  ]);

  return {
    published,
    featured,
    pinned,
    draft,
    inReview,
    scheduled,
    settingsCount,
    carouselMode: 'managed' as const,
    reviewCount,
    pendingComments,
    reviewQueue: reviewQueue.map((n) => ({
      id: n.id,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
      senderName: n.sender.name,
      article: n.article
        ? {
            id: n.article.id,
            title: n.article.title,
            slug: n.article.slug,
            category: n.article.category,
          }
        : null,
    })),
  };
}

/** @deprecated Carousel is always database-driven; kept for legacy callers. */
export async function setCarouselMode(_mode: 'managed') {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'settings.edit')) {
    throw new Error('Forbidden');
  }

  return { carouselMode: 'managed' as const };
}

function periodStarts(now = new Date()) {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);

  const week = new Date(day);
  const weekday = week.getDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  week.setDate(week.getDate() - diff);

  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  return { day, week, month };
}

export async function getEditorialWorkspaceSnapshot() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Forbidden');

  const userId = session.user.id;
  const canReview = can(session.user.role, 'article.review');
  const canModerate = can(session.user.role, 'comment.moderate_any');
  const { day, week, month } = periodStarts();

  const { getEditorTrashCount } = await import('@/lib/actions/editor-trash');

  const publishedWhere = { status: 'PUBLISHED' as const, editorTrash: false };

  const [
    notices,
    myUploads,
    newsroomUploads,
    pendingComments,
    trashCount,
  ] = await Promise.all([
    prisma.editorialNotice.findMany({
      where: { recipientId: userId, status: 'PENDING', trashedAt: null },
      include: {
        sender: { select: { name: true } },
        article: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    Promise.all([
      prisma.article.count({ where: { authorId: userId, ...publishedWhere, publishedAt: { gte: day } } }),
      prisma.article.count({ where: { authorId: userId, ...publishedWhere, publishedAt: { gte: week } } }),
      prisma.article.count({ where: { authorId: userId, ...publishedWhere, publishedAt: { gte: month } } }),
    ]),
    canReview
      ? Promise.all([
          prisma.article.count({ where: { ...publishedWhere, publishedAt: { gte: day } } }),
          prisma.article.count({ where: { ...publishedWhere, publishedAt: { gte: week } } }),
          prisma.article.count({ where: { ...publishedWhere, publishedAt: { gte: month } } }),
        ])
      : Promise.resolve([0, 0, 0] as [number, number, number]),
    canModerate
      ? prisma.comment.count({ where: { status: 'PENDING' } })
      : Promise.resolve(0),
    getEditorTrashCount(),
  ]);

  return {
    notices: notices.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      status: n.status,
      createdAt: n.createdAt.toISOString(),
      senderName: n.sender.name,
      article: n.article
        ? { id: n.article.id, title: n.article.title, slug: n.article.slug }
        : null,
    })),
    uploadStats: {
      mine: { day: myUploads[0], week: myUploads[1], month: myUploads[2] },
      newsroom: canReview
        ? { day: newsroomUploads[0], week: newsroomUploads[1], month: newsroomUploads[2] }
        : null,
    },
    pendingComments,
    trashCount,
    canReview,
    canModerate,
  };
}

export async function toggleArticleFlag(
  articleId: string,
  flag: 'isFeatured' | 'isPinned' | 'isBreaking',
  value: boolean
) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'article.feature')) {
    throw new Error('Forbidden');
  }

  const updates: Record<string, boolean> = { [flag]: value };

  if (flag === 'isPinned' && value) {
    updates.isFeatured = false;
    const pinned = await prisma.article.findMany({
      where: { isPinned: true, id: { not: articleId } },
      orderBy: { publishedAt: 'asc' },
      select: { id: true },
    });
    if (pinned.length >= MAX_PINNED_COVERAGE) {
      const overflow = pinned.length - MAX_PINNED_COVERAGE + 1;
      await prisma.article.updateMany({
        where: { id: { in: pinned.slice(0, overflow).map((a) => a.id) } },
        data: { isPinned: false },
      });
    }
  }

  if (flag === 'isFeatured' && value) {
    updates.isPinned = false;
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, title: true, isFeatured: true, isPinned: true, isBreaking: true },
  });
  if (!article) throw new Error('Article not found');

  await prisma.article.update({
    where: { id: articleId },
    data: updates,
  });

  await prisma.auditLog.create({
    data: {
      type: 'article.flag_toggle',
      message: `Toggled ${flag} to ${value} on article: ${article.title}`,
      userId: session.user.id,
      undoPayload: JSON.stringify({
        action: 'article.flag_toggle',
        articles: [
          {
            id: article.id,
            isFeatured: article.isFeatured,
            isPinned: article.isPinned,
            isBreaking: article.isBreaking,
          },
        ],
      }),
    },
  });

  revalidatePath('/admin/articles');
  revalidatePath('/');
  revalidateArticleContent();

  return { ok: true };
}