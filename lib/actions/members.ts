'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getMemberSession } from '@/lib/member-session';
import { can, ROLES, type Role } from '@/lib/constants';
import prisma from '@/lib/prisma';
import type { PublicArticleCard } from '@/lib/category-types';
import type { PublicMagazineIssue } from '@/lib/category-content';
import { requireMemberPanelUser } from '@/lib/server-auth';
import { resolvePrismaUserId } from '@/lib/resolve-prisma-user-id';

async function requireUserId() {
  const memberSession = await getMemberSession();
  if (!memberSession) {
    throw new Error('Sign in required');
  }

  const userId = await resolvePrismaUserId(memberSession.user.id, memberSession.user.email);

  return {
    userId,
    session: { user: { ...memberSession.user, id: userId } },
  };
}

async function requireCommentAuthor() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Sign in required');
  }

  const role = session.user.role as Role;
  if (!can(role, 'comment.create')) {
    throw new Error('Sign in required');
  }

  const userId = await resolvePrismaUserId(session.user.id, session.user.email);

  return {
    userId,
    session,
    role,
    autoApprove: can(role, 'comment.moderate_any'),
  };
}

export async function toggleSaveArticle(articleId: string) {
  const { userId } = await requireUserId();

  const existing = await prisma.savedItem.findUnique({
    where: {
      userId_itemType_targetId: { userId, itemType: 'ARTICLE', targetId: articleId },
    },
  });

  if (existing) {
    await prisma.savedItem.delete({ where: { id: existing.id } });
    revalidatePath('/members');
    revalidatePath('/members/saved');
    return { saved: false };
  }

  await prisma.savedItem.create({
    data: { userId, itemType: 'ARTICLE', targetId: articleId },
  });
  revalidatePath('/members');
  revalidatePath('/members/saved');
  return { saved: true };
}

export async function toggleSaveMagazine(magazineId: string) {
  const { userId } = await requireUserId();

  const existing = await prisma.savedItem.findUnique({
    where: {
      userId_itemType_targetId: { userId, itemType: 'MAGAZINE', targetId: magazineId },
    },
  });

  if (existing) {
    await prisma.savedItem.delete({ where: { id: existing.id } });
    revalidatePath('/members');
    revalidatePath('/members/saved');
    revalidatePath('/members/magazine');
    return { saved: false };
  }

  await prisma.savedItem.create({
    data: { userId, itemType: 'MAGAZINE', targetId: magazineId },
  });
  revalidatePath('/members');
  revalidatePath('/members/saved');
  revalidatePath('/members/magazine');
  return { saved: true };
}

export async function submitArticleComment(articleId: string, articleSlug: string, content: string) {
  const { userId, session, autoApprove } = await requireCommentAuthor();
  const trimmed = content.trim();
  if (trimmed.length < 3) {
    throw new Error('Comment is too short');
  }

  await prisma.comment.create({
    data: {
      articleId,
      userId,
      authorName: session.user.name ?? 'Member',
      authorEmail: session.user.email ?? null,
      content: trimmed,
      status: autoApprove ? 'APPROVED' : 'PENDING',
    },
  });

  revalidatePath(`/articles/${articleSlug}`);
  revalidatePath('/members/comments');
  revalidatePath('/cms/comments');
  return { ok: true, autoApproved: autoApprove };
}

export async function logMemberDownload(label: string, fileUrl?: string) {
  const { userId } = await requireUserId();

  await prisma.memberDownload.create({
    data: { userId, label, fileUrl: fileUrl ?? null },
  });

  revalidatePath('/members/downloads');
  revalidatePath('/members');
  return { ok: true };
}

export async function getArticleSavedState(articleId: string): Promise<boolean> {
  const memberSession = await getMemberSession();
  if (!memberSession) return false;

  const userId = await resolvePrismaUserId(memberSession.user.id, memberSession.user.email);

  const item = await prisma.savedItem.findUnique({
    where: {
      userId_itemType_targetId: {
        userId,
        itemType: 'ARTICLE',
        targetId: articleId,
      },
    },
  });
  return !!item;
}

export async function getMagazineSavedState(magazineId: string): Promise<boolean> {
  const memberSession = await getMemberSession();
  if (!memberSession) return false;

  const userId = await resolvePrismaUserId(memberSession.user.id, memberSession.user.email);

  const item = await prisma.savedItem.findUnique({
    where: {
      userId_itemType_targetId: {
        userId,
        itemType: 'MAGAZINE',
        targetId: magazineId,
      },
    },
  });
  return !!item;
}

export type MemberOverview = {
  savedCount: number;
  downloadCount: number;
  commentCount: number;
  pendingComments: number;
};

export async function getMemberOverview(): Promise<MemberOverview> {
  const user = await requireMemberPanelUser();
  const userId = user.id;
  const [savedCount, downloadCount, commentCount, pendingComments] = await Promise.all([
    prisma.savedItem.count({ where: { userId } }),
    prisma.memberDownload.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.comment.count({ where: { userId, status: 'PENDING' } }),
  ]);

  return { savedCount, downloadCount, commentCount, pendingComments };
}

export async function getMemberSavedArticles(): Promise<PublicArticleCard[]> {
  const user = await requireMemberPanelUser();
  const userId = user.id;
  const saved = await prisma.savedItem.findMany({
    where: { userId, itemType: 'ARTICLE' },
    orderBy: { createdAt: 'desc' },
  });
  if (saved.length === 0) return [];

  const ids = saved.map((s) => s.targetId);
  const articles = await prisma.article.findMany({
    where: { id: { in: ids }, status: 'PUBLISHED' },
    include: { author: { select: { name: true } } },
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  return articles
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      shortTitle: a.shortTitle,
      excerpt: a.excerpt ?? '',
      category: a.category,
      author: a.author?.name ?? 'ESB PowerLine',
      date: (a.publishedAt ?? a.createdAt).toISOString(),
      readTime: a.readTime,
      views: a.views,
      imageUrl: a.imageUrl?.trim() ?? '',
    }));
}

export async function getMemberSavedMagazines(): Promise<PublicMagazineIssue[]> {
  const user = await requireMemberPanelUser();
  const userId = user.id;
  const saved = await prisma.savedItem.findMany({
    where: { userId, itemType: 'MAGAZINE' },
    orderBy: { createdAt: 'desc' },
  });
  if (saved.length === 0) return [];

  const ids = saved.map((s) => s.targetId);
  const issues = await prisma.magazineIssue.findMany({
    where: { id: { in: ids } },
    orderBy: { issueDate: 'desc' },
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  return issues
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((issue) => ({
      id: issue.id,
      title: issue.title,
      issueDate: issue.issueDate,
      coverUrl: issue.coverUrl ?? '/images/demo_magazine_cover.jpg',
      pdfUrl: issue.pdfUrl,
      summary: issue.summary ?? '',
    }));
}

export async function getAllMagazineIssues(): Promise<PublicMagazineIssue[]> {
  const issues = await prisma.magazineIssue.findMany({
    where: { status: 'published' },
    orderBy: { issueDate: 'desc' },
  });

  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    issueDate: issue.issueDate,
    coverUrl: issue.coverUrl ?? '/images/demo_magazine_cover.jpg',
    pdfUrl: issue.pdfUrl,
    summary: issue.summary ?? '',
  }));
}

export type MemberCommentRow = {
  id: string;
  content: string;
  status: string;
  createdAt: Date;
  articleTitle: string;
  articleSlug: string;
};

export async function getMemberComments(): Promise<MemberCommentRow[]> {
  const user = await requireMemberPanelUser();
  const userId = user.id;
  const comments = await prisma.comment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  if (comments.length === 0) return [];

  const articleIds = [...new Set(comments.map((c) => c.articleId))];
  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, title: true, slug: true },
  });
  const articleMap = Object.fromEntries(articles.map((a) => [a.id, a]));

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    status: c.status,
    createdAt: c.createdAt,
    articleTitle: articleMap[c.articleId]?.title ?? 'Article',
    articleSlug: articleMap[c.articleId]?.slug ?? '',
  }));
}

export type MemberDownloadRow = {
  id: string;
  label: string;
  fileUrl: string | null;
  createdAt: Date;
};

export async function getMemberDownloads(): Promise<MemberDownloadRow[]> {
  const user = await requireMemberPanelUser();
  return prisma.memberDownload.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, label: true, fileUrl: true, createdAt: true },
  });
}

export async function getArticleComments(articleId: string) {
  return prisma.comment.findMany({
    where: { articleId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function getRecentDownloadsAction(): Promise<MemberDownloadRow[]> {
  const memberSession = await getMemberSession();
  if (!memberSession) return [];
  let userId: string;
  try {
    userId = await resolvePrismaUserId(memberSession.user.id, memberSession.user.email);
  } catch {
    return [];
  }
  return prisma.memberDownload.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, label: true, fileUrl: true, createdAt: true },
  });
}

/**
 * Re-validate the Grid Explorer ISR cache so newly published grid settings and
 * daily reports surface without a full redeploy. (Live SCADA ingestion runs off
 * the serverless path — data is committed to public/data by the ingestion daemon —
 * so this revalidates the render rather than pulling from PGCB directly.)
 */
export async function triggerGridRefresh(): Promise<{ ok: true; refreshedAt: string }> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!role || !ROLES[role] || ROLES[role].level < ROLES.EDITOR.level) {
    throw new Error('Only editors and administrators can refresh grid data.');
  }

  revalidatePath('/grid-explorer');
  return { ok: true, refreshedAt: new Date().toISOString() };
}
