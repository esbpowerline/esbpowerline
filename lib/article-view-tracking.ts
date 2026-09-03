import 'server-only';

import { createHash, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { viewDedupBucket } from '@/lib/article-view-dedup';

export const VISITOR_COOKIE = 'esb_vid';
export { VIEW_DEDUP_HOURS } from '@/lib/article-view-dedup';

function hashVisitorToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function resolveVisitorKey(cookieValue: string | undefined): string {
  const token = cookieValue?.trim() || randomUUID();
  return hashVisitorToken(token);
}

export function newVisitorToken(): string {
  return randomUUID();
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

/**
 * Record one qualified pageview. Dedupes per visitor per article within VIEW_DEDUP_HOURS.
 * This is the ONLY code path allowed to increment Article.views and author totalViews.
 */
export async function recordArticleView(
  articleId: string,
  visitorKey: string,
  referrer?: string | null,
): Promise<{ recorded: boolean }> {
  const article = await prisma.article.findFirst({
    where: { id: articleId, status: 'PUBLISHED' },
    select: { id: true, authorId: true },
  });
  if (!article) return { recorded: false };

  const dedupBucket = viewDedupBucket();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.articleView.create({
        data: {
          articleId,
          visitorKey,
          dedupBucket,
          referrer: referrer?.trim().slice(0, 500) || null,
        },
      });
      // Raw, not `tx.article.update`: Prisma's `@updatedAt` rewrites
      // `updatedAt` on every update, so a read counted as an edit. That column
      // feeds the sitemap's lastmod and the NewsArticle `dateModified`, so every
      // article claimed to have changed moments before each crawl — the fastest
      // way to have Google discount the field site-wide (SEO_FIX_LOG stage 2).
      await tx.$executeRaw`UPDATE "Article" SET "views" = "views" + 1 WHERE "id" = ${articleId}`;
      await tx.user.update({
        where: { id: article.authorId },
        data: { totalViews: { increment: 1 } },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { recorded: false };
    throw error;
  }

  return { recorded: true };
}

/** Admin integrity check — re-sync denormalized counters from the immutable ledger. */
export async function reconcileArticleViewCounts(): Promise<{ articles: number; users: number }> {
  const articles = await prisma.article.findMany({
    select: { id: true, authorId: true, _count: { select: { viewEvents: true } } },
  });

  let articleUpdates = 0;
  for (const row of articles) {
    const views = row._count.viewEvents;
    await prisma.article.update({ where: { id: row.id }, data: { views } });
    articleUpdates += 1;
  }

  const byAuthor = new Map<string, number>();
  for (const row of articles) {
    byAuthor.set(row.authorId, (byAuthor.get(row.authorId) ?? 0) + row._count.viewEvents);
  }

  let userUpdates = 0;
  for (const [authorId, totalViews] of byAuthor) {
    await prisma.user.update({ where: { id: authorId }, data: { totalViews } });
    userUpdates += 1;
  }

  return { articles: articleUpdates, users: userUpdates };
}