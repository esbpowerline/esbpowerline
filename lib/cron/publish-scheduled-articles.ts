import 'server-only';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { announceArticles } from '@/lib/notifications/articles';
import {
  formatPublishBlockerMessage,
  getPublishBlockers,
  publishArticleSchema,
} from '@/lib/validations/article';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-paths';
import { revalidateArticleContent } from '@/lib/revalidate-tags';

export type PublishScheduledResult = {
  published: string[];
  skipped: { id: string; title: string; reason: string }[];
};

function revalidatePublicContent(slugs: string[] = []) {
  for (const path of PUBLIC_REVALIDATE_PATHS) revalidatePath(path);
  for (const slug of slugs) revalidatePath(`/articles/${slug}`);
  revalidateArticleContent();
}

/** Publish scheduled articles whose go-live time has passed. Cron route only — not exposed as a server action. */
export async function publishDueScheduledArticles(now = new Date()): Promise<PublishScheduledResult> {
  const due = await prisma.article.findMany({
    where: {
      status: 'SCHEDULED',
      publishedAt: { lte: now },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      category: true,
      imageUrl: true,
      tags: true,
      publishedAt: true,
      authorId: true,
    },
  });

  const published: string[] = [];
  const publishedIds: string[] = [];
  const skipped: PublishScheduledResult['skipped'] = [];

  for (const article of due) {
    const blockers = getPublishBlockers({
      title: article.title,
      excerpt: article.excerpt ?? '',
      content: article.content,
    });
    if (blockers.length > 0) {
      skipped.push({
        id: article.id,
        title: article.title,
        reason: formatPublishBlockerMessage(blockers),
      });
      continue;
    }

    const parsed = publishArticleSchema.safeParse({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt ?? '',
      content: article.content,
      category: article.category,
      status: 'PUBLISHED',
      imageUrl: article.imageUrl ?? undefined,
      tags: (article.tags as string[]) ?? [],
      publishedAt: article.publishedAt?.toISOString(),
    });

    if (!parsed.success) {
      skipped.push({
        id: article.id,
        title: article.title,
        reason: parsed.error.issues.map((i) => i.message).join('; '),
      });
      continue;
    }

    // Conditional on the row still being SCHEDULED. The select above and this
    // write are separate statements, so two overlapping runs — or an editor
    // unscheduling the article in between — used to both "publish" it. Now
    // exactly one write matches, and only that one counts as a publication.
    const { count } = await prisma.article.updateMany({
      where: { id: article.id, status: 'SCHEDULED' },
      data: {
        status: 'PUBLISHED',
        publishedAt: article.publishedAt ?? now,
      },
    });
    if (count !== 1) continue;
    published.push(article.slug);
    publishedIds.push(article.id);
  }

  if (published.length > 0) {
    const { syncAuthorArticleCounts } = await import('@/lib/author-stats');
    const publishedArticles = due.filter((a) => published.includes(a.slug));
    const authorIds = Array.from(new Set(publishedArticles.map((a) => a.authorId)));
    await Promise.all(authorIds.map((id) => syncAuthorArticleCounts(id)));

    revalidatePublicContent(published);
    revalidatePath('/cms/articles/scheduled');
    revalidatePath('/admin/articles');
    await announceArticles(publishedIds);
  }

  return { published, skipped };
}