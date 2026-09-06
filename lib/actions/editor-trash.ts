'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-paths';
import { revalidateArticleContent } from '@/lib/revalidate-tags';
import { auth } from '@/lib/auth';
import { can, type Role } from '@/lib/constants';
import { daysUntilPurge, purgeCutoffDate } from '@/lib/editor-trash';

const REVALIDATE_PATHS = ['/cms', '/cms/trash', '/cms/articles', '/cms/notices', '/cms/calendar'] as const;

function revalidateTrash() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

/**
 * An editor may trash their own article whatever its status — including one
 * that is live. `revalidateTrash` only covers the CMS, so trashing a published
 * article left it on the public site until the data cache aged out on its own.
 * That was survivable while every cache carried `revalidate: 60`; it is not a
 * thing to rely on, and taking published content down is the last path that
 * should wait for a timer.
 */
function revalidateAfterPublicRemoval(slug: string) {
  for (const path of PUBLIC_REVALIDATE_PATHS) revalidatePath(path);
  revalidatePath(`/articles/${slug}`);
  revalidateArticleContent();
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user;
}

/** Permanently remove editor-trash items older than retention window (internal — session-scoped only). */
async function purgeExpiredEditorTrash(userId: string) {
  const cutoff = purgeCutoffDate();

  await prisma.$transaction([
    prisma.article.deleteMany({
      where: {
        authorId: userId,
        editorTrash: true,
        status: 'TRASH',
        trashedAt: { lt: cutoff },
      },
    }),
    prisma.editorialNotice.deleteMany({
      where: {
        recipientId: userId,
        trashedAt: { lt: cutoff },
      },
    }),
  ]);
}

export type EditorTrashArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  trashedAt: Date;
  daysLeft: number;
};

export type EditorTrashNotice = {
  id: string;
  type: string;
  message: string;
  trashedAt: Date;
  daysLeft: number;
  articleTitle?: string;
};

export async function getEditorTrash() {
  const user = await requireUser();
  await purgeExpiredEditorTrash(user.id);

  const [articles, notices] = await Promise.all([
    prisma.article.findMany({
      where: {
        authorId: user.id,
        editorTrash: true,
        status: 'TRASH',
        trashedAt: { not: null },
      },
      orderBy: { trashedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        status: true,
        trashedAt: true,
      },
    }),
    prisma.editorialNotice.findMany({
      where: {
        recipientId: user.id,
        trashedAt: { not: null },
      },
      orderBy: { trashedAt: 'desc' },
      include: {
        article: { select: { title: true } },
      },
    }),
  ]);

  return {
    articles: articles.map((a) => ({
      ...a,
      trashedAt: a.trashedAt!,
      daysLeft: daysUntilPurge(a.trashedAt!),
    })),
    notices: notices.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      trashedAt: n.trashedAt!,
      daysLeft: daysUntilPurge(n.trashedAt!),
      articleTitle: n.article?.title,
    })),
  };
}

export async function getEditorTrashCount() {
  const user = await requireUser();
  await purgeExpiredEditorTrash(user.id);

  const [articles, notices] = await Promise.all([
    prisma.article.count({
      where: { authorId: user.id, editorTrash: true, status: 'TRASH', trashedAt: { not: null } },
    }),
    prisma.editorialNotice.count({
      where: { recipientId: user.id, trashedAt: { not: null } },
    }),
  ]);

  return articles + notices;
}

export async function trashOwnArticle(articleId: string) {
  const user = await requireUser();
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || article.authorId !== user.id) throw new Error('Article not found');

  const canTrash = article.authorId === user.id && can(user.role as Role, 'article.delete_own');
  if (!canTrash) throw new Error('Forbidden');

  const wasPublic = article.status === 'PUBLISHED';

  await prisma.article.update({
    where: { id: articleId },
    data: { status: 'TRASH', editorTrash: true, trashedAt: new Date() },
  });

  revalidateTrash();
  if (wasPublic) revalidateAfterPublicRemoval(article.slug);
  return { ok: true };
}

export async function trashNotice(id: string) {
  const user = await requireUser();
  const notice = await prisma.editorialNotice.findUnique({ where: { id } });
  if (!notice || notice.recipientId !== user.id) throw new Error('Notice not found');

  await prisma.editorialNotice.update({
    where: { id },
    data: { trashedAt: new Date(), status: 'DISMISSED' },
  });

  revalidateTrash();
  return { ok: true };
}

export async function restoreTrashArticle(articleId: string) {
  const user = await requireUser();
  const article = await prisma.article.findFirst({
    where: { id: articleId, authorId: user.id, editorTrash: true, status: 'TRASH' },
  });
  if (!article) throw new Error('Article not found in trash');

  await prisma.article.update({
    where: { id: articleId },
    data: { status: 'DRAFT', editorTrash: false, trashedAt: null },
  });

  revalidateTrash();
  return { ok: true };
}

export async function restoreTrashNotice(noticeId: string) {
  const user = await requireUser();
  const notice = await prisma.editorialNotice.findFirst({
    where: { id: noticeId, recipientId: user.id, trashedAt: { not: null } },
  });
  if (!notice) throw new Error('Notice not found in trash');

  await prisma.editorialNotice.update({
    where: { id: noticeId },
    data: { trashedAt: null, status: 'PENDING' },
  });

  revalidateTrash();
  return { ok: true };
}

export async function permanentlyDeleteTrashArticle(articleId: string) {
  const user = await requireUser();
  const article = await prisma.article.findFirst({
    where: { id: articleId, authorId: user.id, editorTrash: true, status: 'TRASH' },
  });
  if (!article) throw new Error('Article not found in trash');

  await prisma.article.delete({ where: { id: articleId } });
  revalidateTrash();
  return { ok: true };
}

export async function permanentlyDeleteTrashNotice(noticeId: string) {
  const user = await requireUser();
  const notice = await prisma.editorialNotice.findFirst({
    where: { id: noticeId, recipientId: user.id, trashedAt: { not: null } },
  });
  if (!notice) throw new Error('Notice not found in trash');

  await prisma.editorialNotice.delete({ where: { id: noticeId } });
  revalidateTrash();
  return { ok: true };
}

export async function emptyEditorTrash() {
  const user = await requireUser();

  await prisma.$transaction([
    prisma.article.deleteMany({
      where: { authorId: user.id, editorTrash: true, status: 'TRASH' },
    }),
    prisma.editorialNotice.deleteMany({
      where: { recipientId: user.id, trashedAt: { not: null } },
    }),
  ]);

  revalidateTrash();
  return { ok: true };
}