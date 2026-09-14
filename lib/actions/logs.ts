'use server';

import prisma from '@/lib/prisma';
import { announceArticles } from '@/lib/notifications/articles';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { revalidateArticleContent } from '@/lib/revalidate-tags';

export async function getAdminLogs(limit = 50) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'logs.view')) {
    throw new Error('Forbidden');
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  const userIds = [...new Set(logs.map((log) => log.userId).filter(Boolean))] as string[];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const userById = new Map(users.map((user) => [user.id, user]));

  return logs.map((log) => ({
    ...log,
    userLabel: log.userId
      ? userById.get(log.userId)?.name ?? userById.get(log.userId)?.email ?? log.userId
      : 'System',
  }));
}

export async function undoAuditLogAction(logId: string) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'admin.access')) {
    throw new Error('Forbidden');
  }

  const log = await prisma.auditLog.findUnique({
    where: { id: logId }
  });

  if (!log) {
    throw new Error('Log entry not found');
  }

  // Validate 48 hours restriction
  const limitDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
  if (new Date(log.timestamp) < limitDate) {
    throw new Error('Actions older than 48 hours cannot be undone');
  }

  if (!log.undoPayload) {
    throw new Error('This action does not support undo operations');
  }

  let payload;
  try {
    payload = JSON.parse(log.undoPayload);
  } catch (err) {
    throw new Error('Failed to parse undo data');
  }

  if (!payload || !Array.isArray(payload.articles)) {
    throw new Error('Invalid undo data format');
  }

  // Perform revert updates in a transaction
  if (payload.action === 'media.replace') {
    if (payload.media) {
      await prisma.media.update({
        where: { id: payload.media.id },
        data: {
          name: payload.media.name,
          url: payload.media.url,
          size: payload.media.size,
          mimeType: payload.media.mimeType,
        }
      });
    }

    await prisma.$transaction(
      payload.articles.map((art: any) =>
        prisma.article.update({
          where: { id: art.id },
          data: {
            imageUrl: art.imageUrl,
            imageCredit: art.imageCredit,
            seo: art.seo,
          }
        })
      )
    );
  } else {
    await prisma.$transaction(
      payload.articles.map((art: any) =>
        prisma.article.update({
          where: { id: art.id },
          data: {
            status: art.status !== undefined ? art.status : undefined,
            publishedAt: art.publishedAt !== undefined 
              ? (art.publishedAt ? new Date(art.publishedAt) : null) 
              : undefined,
            isFeatured: art.isFeatured !== undefined ? art.isFeatured : undefined,
            isPinned: art.isPinned !== undefined ? art.isPinned : undefined,
            isBreaking: art.isBreaking !== undefined ? art.isBreaking : undefined,
          }
        })
      )
    );
  }

  // Log the undo action itself
  await prisma.auditLog.create({
    data: {
      type: 'platform.undo',
      message: `Undid action: "${log.message}"`,
      userId: session.user.id,
    }
  });

  // Revalidate pipeline and dashboard pages
  revalidatePath('/admin');
  revalidatePath('/admin/articles');
  revalidatePath('/cms');
  revalidatePath('/cms/articles');
  revalidatePath('/');
  // Undo restores `status` and `publishedAt`, so it can put an article back on
  // the public site or take one off it. `revalidatePath('/')` re-renders the
  // page but the card data it reads comes from the tagged cache, which has to
  // be expired separately or the re-render just paints the same stale rows.
  revalidateArticleContent();

  // Undo can put an article back on the site. It is announced only if it
  // passes the same gate as any publication — never announced before, and
  // recent enough — so undoing a trash does not re-post yesterday's story.
  const undoneIds = Array.isArray(payload?.articles)
    ? (payload.articles as Array<{ id?: unknown }>).map((a) => a.id).filter((id): id is string => typeof id === 'string')
    : [];
  if (undoneIds.length > 0) await announceArticles(undoneIds);

  return { ok: true };
}