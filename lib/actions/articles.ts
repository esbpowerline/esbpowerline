'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { announceArticles } from '@/lib/notifications/articles';
import { revalidateArticleContent } from '@/lib/revalidate-tags';
import { auth } from '@/lib/auth';
import { can, type Role } from '@/lib/constants';
import { deleteRefusalReason, isLiveStatus } from '@/lib/article-delete';
import { slugify } from '@/lib/utils';
import {
  formatPublishBlockerMessage,
  getPublishBlockers,
  parseArticleInput,
  publishArticleSchema,
  type ArticleInput,
} from '@/lib/validations/article';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-paths';
import { reconcilePlacementFlags, MAX_PINNED_COVERAGE } from '@/lib/placement-rules';
import { resolveEditorialAuthorScope } from '@/lib/editorial-scope';
import { assertCanReadArticle, requireEditorialReader } from '@/lib/server-auth';
import { sanitizeArticleHtml } from '@/lib/sanitize-article-html';

type ArticleUser = { id: string; role: Role };

function withSanitizedContent<T extends { content: string }>(input: T): T {
  return { ...input, content: sanitizeArticleHtml(input.content) };
}

function resolveArticleSlug(title: string, slug?: string, fallback?: string) {
  const candidate = slug?.trim() || slugify(title.trim());
  if (candidate.length >= 3) return candidate;
  if (fallback && fallback.length >= 3) return fallback;
  return `draft-${Date.now().toString(36)}`;
}

function enforceArticlePermissions(
  user: ArticleUser,
  parsed: ArticleInput,
  existing?: { status: string; isFeatured: boolean; isBreaking: boolean; isPinned: boolean; isTrending?: boolean },
): ArticleInput {
  if (
    !can(user.role, 'article.publish')
    && (parsed.status === 'PUBLISHED' || parsed.status === 'SCHEDULED')
  ) {
    throw new Error('You do not have permission to publish or schedule articles');
  }

  const result = { ...parsed };
  if (
    parsed.status === 'IN_REVIEW'
    && !can(user.role, 'admin.access')
    && existing?.status !== 'IN_REVIEW'
  ) {
    result.status = (existing?.status ?? 'DRAFT') as ArticleInput['status'];
  }
  if (
    existing?.status === 'IN_REVIEW'
    && !can(user.role, 'admin.access')
    && parsed.status !== 'IN_REVIEW'
  ) {
    result.status = 'IN_REVIEW';
  }
  if (!can(user.role, 'article.feature')) {
    result.isFeatured = existing?.isFeatured ?? false;
    result.isPinned = existing?.isPinned ?? false;
    result.isTrending = existing?.isTrending ?? false;
  }
  if (!can(user.role, 'article.breaking')) {
    result.isBreaking = existing?.isBreaking ?? false;
  }
  return result;
}

/**
 * Revalidates all public-facing ISR paths.
 * ONLY call this when an article's PUBLIC VISIBILITY has changed
 * (published, unpublished, trashed from published, or placement flags changed).
 * Do NOT call for pure draft saves — they have no public impact.
 */
function revalidatePublicContent(slugs: string[] = []) {
  for (const path of PUBLIC_REVALIDATE_PATHS) revalidatePath(path);
  for (const slug of slugs) revalidatePath(`/articles/${slug}`);
  // Also flush the unstable_cache data layer so freshly published/edited articles
  // (and their category counts) appear immediately instead of after the time TTL.
  revalidateArticleContent();
}

/** Honour editor-chosen publish dates (incl. backdating); default to now only when publishing without a date. */
function resolvePublishedAt(
  status: ArticleInput['status'],
  parsedPublishedAt: string | null | undefined,
  existingPublishedAt?: Date | null,
): Date | null {
  const parsed = parsedPublishedAt ? new Date(parsedPublishedAt) : null;
  const validParsed = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;

  if (status === 'PUBLISHED') {
    return validParsed ?? existingPublishedAt ?? new Date();
  }
  if (status === 'SCHEDULED') {
    return validParsed ?? existingPublishedAt ?? null;
  }
  return validParsed ?? existingPublishedAt ?? null;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

async function resolveCategoryRef(categoryName: string) {
  const category = await prisma.category.findFirst({
    where: { name: categoryName.trim() },
    select: { id: true, name: true },
  });
  if (!category) {
    throw new Error(
      `Category "${categoryName}" is not valid. Choose a category from the admin list.`,
    );
  }
  return category;
}

async function enforcePinnedCapacity(articleId: string) {
  const pinned = await prisma.article.findMany({
    where: { isPinned: true, id: { not: articleId } },
    orderBy: { publishedAt: 'asc' },
    select: { id: true },
  });
  if (pinned.length < MAX_PINNED_COVERAGE) return;
  const overflow = pinned.length - MAX_PINNED_COVERAGE + 1;
  const toUnpin = pinned.slice(0, overflow).map((a) => a.id);
  await prisma.article.updateMany({
    where: { id: { in: toUnpin } },
    data: { isPinned: false },
  });
}

export async function getAuthorArticleStats(authorId?: string) {
  const user = await requireEditorialReader();
  const isReviewer = can(user.role, 'article.review');
  const scopedAuthorId = authorId ? resolveEditorialAuthorScope(user, authorId) : undefined;
  if (!isReviewer && !scopedAuthorId) throw new Error('Forbidden');

  const baseWhere = {
    ...(scopedAuthorId ? { authorId: scopedAuthorId } : {}),
    status: { not: 'TRASH' as const },
  };

  const [statusGroups, featured, breaking, viewsAgg, recent, topByViews, pendingNotices] = await Promise.all([
    prisma.article.groupBy({
      by: ['status'],
      where: scopedAuthorId ? { authorId: scopedAuthorId } : { status: { not: 'TRASH' } },
      _count: { _all: true },
    }),
    prisma.article.count({ where: { ...baseWhere, isFeatured: true } }),
    prisma.article.count({ where: { ...baseWhere, isBreaking: true } }),
    prisma.article.aggregate({ where: baseWhere, _sum: { views: true } }),
    getArticles({ ...(scopedAuthorId ? { authorId: scopedAuthorId } : {}), limit: 8 }),
    prisma.article.findMany({
      where: {
        ...(scopedAuthorId ? { authorId: scopedAuthorId } : {}),
        status: 'PUBLISHED',
      },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, views: true, category: true },
    }),
    prisma.editorialNotice.count({
      where: scopedAuthorId
        ? { recipientId: scopedAuthorId, status: 'PENDING' }
        : { status: 'PENDING' },
    }),
  ]);

  const countByStatus = (status: string) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0;

  const published = countByStatus('PUBLISHED');
  const drafts = countByStatus('DRAFT');
  const scheduled = countByStatus('SCHEDULED');
  const archived = countByStatus('ARCHIVED');
  const total = statusGroups
    .filter((g) => g.status !== 'TRASH')
    .reduce((sum, g) => sum + g._count._all, 0);

  return {
    total,
    published,
    drafts,
    scheduled,
    archived,
    featured,
    breaking,
    totalViews: viewsAgg._sum.views ?? 0,
    recent,
    topByViews,
    pendingNotices,
  };
}

export async function getCalendarArticles(opts?: { authorId?: string; allAuthors?: boolean }) {
  const user = await requireEditorialReader();
  const scopedAuthorId = opts?.allAuthors
    ? undefined
    : resolveEditorialAuthorScope(user, opts?.authorId);
  const authorFilter = scopedAuthorId ? { authorId: scopedAuthorId } : can(user.role, 'article.review') ? {} : { authorId: user.id };
  const [scheduled, published] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'SCHEDULED', editorTrash: false, ...authorFilter },
      orderBy: { publishedAt: 'asc' },
      include: { author: { select: { name: true } } },
      // Same reason as `getArticles` below: `include` alone selects Article.*,
      // which drags both full HTML bodies across for a calendar that renders
      // only titles and dates. This query also had no `take`.
      omit: { content: true, contentBn: true },
      take: 200,
    }),
    prisma.article.findMany({
      where: { status: 'PUBLISHED', editorTrash: false, ...authorFilter },
      orderBy: { publishedAt: 'desc' },
      take: 10,
      include: { author: { select: { name: true } } },
      omit: { content: true, contentBn: true },
    }),
  ]);
  return { scheduled, published };
}

export type CalendarEvent = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  date: string;
  authorName: string;
  isFeatured: boolean;
  isPinned: boolean;
};

export async function getEditorialCalendarEvents(opts?: {
  authorId?: string;
  allAuthors?: boolean;
  month?: number;
  year?: number;
}): Promise<CalendarEvent[]> {
  const user = await requireEditorialReader();
  const scopedAuthorId = opts?.allAuthors
    ? undefined
    : resolveEditorialAuthorScope(user, opts?.authorId);
  const authorFilter = scopedAuthorId ? { authorId: scopedAuthorId } : can(user.role, 'article.review') ? {} : { authorId: user.id };

  const now = new Date();
  const year = opts?.year ?? now.getFullYear();
  const month = opts?.month ?? now.getMonth();
  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const articles = await prisma.article.findMany({
    where: {
      editorTrash: false,
      status: { in: ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED'] },
      ...authorFilter,
      OR: [
        { publishedAt: { gte: rangeStart, lte: rangeEnd } },
        { updatedAt: { gte: rangeStart, lte: rangeEnd }, status: 'DRAFT' },
      ],
    },
    include: { author: { select: { name: true } } },
    // A month of articles, of which the mapper below reads nine scalar fields.
    // Both body columns were coming back and being discarded.
    omit: { content: true, contentBn: true },
    orderBy: { publishedAt: 'asc' },
  });

  return articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    category: a.category,
    date: (a.status === 'DRAFT' ? a.updatedAt : (a.publishedAt ?? a.updatedAt)).toISOString(),
    authorName: a.author.name,
    isFeatured: a.isFeatured,
    isPinned: a.isPinned,
  }));
}

export async function getArticles(opts?: { authorId?: string; status?: string; limit?: number; includeTrash?: boolean }) {
  const user = await requireEditorialReader();
  const scopedAuthorId = resolveEditorialAuthorScope(user, opts?.authorId);
  return prisma.article.findMany({
    where: {
      editorTrash: false,
      ...(scopedAuthorId ? { authorId: scopedAuthorId } : can(user.role, 'article.review') ? {} : { authorId: user.id }),
      ...(opts?.status
        ? { status: opts.status as 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | 'TRASH' }
        : opts?.includeTrash
          ? { OR: [{ status: { not: 'TRASH' } }, { status: 'TRASH', editorTrash: false }] }
          : { status: { not: 'TRASH' } }),
    },
    include: { author: { select: { id: true, name: true, email: true } } },
    // `include` alone pulls Article.*, which means both full HTML bodies come
    // back on every call. No caller of this function renders them — these are
    // list views — and at 134 articles that was 583 kB of markup per page load,
    // growing with the archive. Omitting the two body columns keeps every other
    // field exactly as callers expect.
    omit: { content: true, contentBn: true },
    orderBy: { updatedAt: 'desc' },
    take: opts?.limit,
  });
}

export async function getAdminArticles() {
  const user = await requireAuth();
  if (!can(user.role, 'article.review')) throw new Error('Forbidden');
  return getArticles({ includeTrash: true });
}

export type BulkArticleAction =
  | 'trash'
  | 'restore'
  | 'publish'
  | 'draft'
  | 'archive'
  | 'delete_permanent'
  | 'feature'
  | 'unfeature'
  | 'breaking_on'
  | 'breaking_off'
  | 'pin_on'
  | 'pin_off';

const PASSWORD_REQUIRED_ACTIONS = new Set<BulkArticleAction>(['trash', 'delete_permanent', 'archive']);

export async function bulkArticleAction(
  rawIds: string[],
  action: BulkArticleAction,
  options?: { password?: string; authorNote?: string }
) {
  // Article.id is a cuid, not a uuid — .uuid() rejected every real id, which
  // made every bulk action on /admin/articles throw a raw ZodError.
  const ids = z.array(z.string().min(1)).min(1).max(100).parse(rawIds);
  const user = await requireAuth();
  if (!ids.length) throw new Error('No articles selected');

  const articles = await prisma.article.findMany({
    where: { id: { in: ids } },
    select: { 
      id: true, 
      title: true, 
      slug: true, 
      status: true, 
      publishedAt: true, 
      authorId: true,
      isFeatured: true,
      isPinned: true,
      isBreaking: true
    },
  });
  if (articles.length === 0) throw new Error('No articles found');

  const needsEditAny = action !== 'delete_permanent';
  const needsDeleteAny = action === 'delete_permanent' || action === 'trash';

  if (needsEditAny && !can(user.role, 'article.edit_any')) throw new Error('Forbidden');
  if (needsDeleteAny && !can(user.role, 'article.delete_any')) throw new Error('Forbidden');

  if (PASSWORD_REQUIRED_ACTIONS.has(action)) {
    const { verifyAdminPassword } = await import('@/lib/actions/auth-verify');
    await verifyAdminPassword(options?.password ?? '');
  }

  let affected = 0;

  switch (action) {
    case 'trash':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { status: 'TRASH' },
      }));
      break;
    case 'restore':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids }, status: 'TRASH' },
        data: { status: 'DRAFT' },
      }));
      break;
    case 'publish':
      await prisma.$transaction(
        articles.map((a) =>
          prisma.article.update({
            where: { id: a.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: a.publishedAt ?? new Date(),
            },
          })
        )
      );
      affected = articles.length;
      break;
    case 'draft':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { status: 'DRAFT' },
      }));
      break;
    case 'archive':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ARCHIVED' },
      }));
      break;
    case 'delete_permanent': {
      const trashIds = articles.filter((a) => a.status === 'TRASH').map((a) => a.id);
      if (trashIds.length === 0) throw new Error('Only trashed articles can be permanently deleted');
      ({ count: affected } = await prisma.article.deleteMany({
        where: { id: { in: trashIds }, status: 'TRASH' },
      }));
      break;
    }
    case 'feature':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { isFeatured: true },
      }));
      break;
    case 'unfeature':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { isFeatured: false },
      }));
      break;
    case 'breaking_on':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { isBreaking: true },
      }));
      break;
    case 'breaking_off':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { isBreaking: false },
      }));
      break;
    case 'pin_on': {
      const pinId = ids[0];
      await enforcePinnedCapacity(pinId);
      await prisma.article.update({
        where: { id: pinId },
        data: { isPinned: true, isFeatured: false },
      });
      affected = 1;
      break;
    }
    case 'pin_off':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { isPinned: false },
      }));
      break;
  }

  if (action === 'trash' || action === 'archive' || action === 'delete_permanent') {
    const noticeType = action === 'delete_permanent' ? 'CONTENT_REMOVED' : 'ADMIN_NOTE';
    const defaultMessage =
      action === 'trash'
        ? 'Your article was moved to trash by an administrator.'
        : action === 'archive'
          ? 'Your article was archived by an administrator.'
          : 'Your article was permanently deleted by an administrator.';
    const message = options?.authorNote?.trim() || defaultMessage;

    await prisma.$transaction(
      articles.map((article) =>
        prisma.editorialNotice.create({
          data: {
            type: noticeType,
            message,
            recipientId: article.authorId,
            senderId: user.id,
            articleId: action === 'delete_permanent' ? null : article.id,
            metadata: {
              articleTitle: article.title,
              action,
            },
          },
        })
      )
    );
  }

  await prisma.auditLog.create({
    data: {
      type: `article.bulk_${action}`,
      message: `Bulk ${action} on ${affected} article(s)`,
      userId: user.id,
      undoPayload: JSON.stringify({
        action: `article.bulk_${action}`,
        articles: articles.map((a) => ({
          id: a.id,
          status: a.status,
          publishedAt: a.publishedAt,
          isFeatured: a.isFeatured,
          isPinned: a.isPinned,
          isBreaking: a.isBreaking,
        })),
      }),
    },
  });

  if (['trash', 'restore', 'publish', 'draft', 'archive', 'delete_permanent'].includes(action)) {
    const { syncAuthorArticleCounts } = await import('@/lib/author-stats');
    const authorIds = Array.from(new Set(articles.map((a) => a.authorId)));
    await Promise.all(authorIds.map((id) => syncAuthorArticleCounts(id)));
  }

  revalidatePath('/cms/articles');
  revalidatePath('/cms');
  revalidatePath('/admin/articles');

  // Only sweep public ISR paths when publicly visible content actually changes.
  // Placement flags (feature/pin/break) change homepage ordering — always revalidate.
  // Status changes: only revalidate if articles were or will be publicly visible.
  const publiclyAffected = action === 'feature' || action === 'unfeature' ||
    action === 'pin_on' || action === 'pin_off' ||
    action === 'breaking_on' || action === 'breaking_off' ||
    action === 'publish' || action === 'trash' || action === 'archive' ||
    articles.some((a) => a.status === 'PUBLISHED');

  if (publiclyAffected) {
    revalidatePublicContent(articles.map((a) => a.slug));
  }
  // Bulk publish re-publishes rows that were already live; the announcement
  // key is per article, so those are not announced twice.
  if (action === 'publish') await announceArticles(articles.map((a) => a.id));

  return { affected, action };
}

export async function getArticle(id: string) {
  const user = await requireEditorialReader();
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  if (!article) return null;
  await assertCanReadArticle(user, article);
  return article;
}

export async function createArticle(data: ArticleInput) {
  const user = await requireAuth();
  if (!can(user.role, 'article.create')) throw new Error('Forbidden');

  const parsed = withSanitizedContent(enforceArticlePermissions(user, parseArticleInput(data)));
  const categoryRef = await resolveCategoryRef(parsed.category);
  const placement = reconcilePlacementFlags({
    isFeatured: parsed.isFeatured ?? false,
    isBreaking: parsed.isBreaking ?? false,
    isPinned: parsed.isPinned ?? false,
      isTrending: parsed.isTrending ?? false,
  });
  const slug = resolveArticleSlug(parsed.title, parsed.slug);

  if (placement.isPinned) {
    await enforcePinnedCapacity('new');
  }

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) throw new Error('Slug already exists');

  const article = await prisma.article.create({
    data: {
      title: parsed.title,
      shortTitle: parsed.shortTitle,
      slug,
      excerpt: parsed.excerpt,
      content: parsed.content,
      category: categoryRef.name,
      categoryId: categoryRef.id,
      status: parsed.status,
      imageUrl: parsed.imageUrl,
      imageCredit: parsed.imageCredit,

      tags: parsed.tags ?? [],
      collaboratorIds: parsed.collaboratorIds ?? [],
      isFeatured: placement.isFeatured,
      isBreaking: placement.isBreaking,
      isPinned: placement.isPinned,
      isTrending: placement.isTrending,
      postAsNewsDesk: parsed.postAsNewsDesk ?? false,
      authorId: user.id,
      publishedAt: resolvePublishedAt(parsed.status, parsed.publishedAt),
      seo: parsed.seo ?? {},
      readTime: Math.max(1, Math.ceil(parsed.content.length / 1000)),
    },
  });

  const { registerArticleMedia } = await import('@/lib/media-registry');
  const { syncAuthorArticleCounts } = await import('@/lib/author-stats');
  await registerArticleMedia({
    imageUrl: parsed.imageUrl,
    content: parsed.content,
    uploadedById: user.id,
    title: parsed.title,
  });
  await syncAuthorArticleCounts(user.id);

  await prisma.auditLog.create({
    data: { type: 'article.create', message: `Created article: ${article.title}`, userId: user.id },
  });

  revalidatePath('/cms');
  revalidatePath('/cms/articles');
  revalidatePath('/cms/media');
  revalidatePath('/admin/articles');
  revalidatePath('/admin/media');
  if (parsed.status === 'PUBLISHED') revalidatePublicContent([article.slug]);
  // After the write and the revalidation: the channel is told, the editor's
  // request never waits for it, and a Telegram outage cannot fail a publish.
  if (parsed.status === 'PUBLISHED') await announceArticles([article.id]);
  return article;
}

export async function updateArticle(id: string, data: ArticleInput) {
  const user = await requireAuth();
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new Error('Not found');

  const canEdit = existing.authorId === user.id
    ? can(user.role, 'article.edit_own')
    : can(user.role, 'article.edit_any');
  if (!canEdit) throw new Error('Forbidden');

  const parsed = withSanitizedContent(enforceArticlePermissions(user, parseArticleInput(data), existing));
  const categoryRef = await resolveCategoryRef(parsed.category);
  const placement = reconcilePlacementFlags({
    isFeatured: parsed.isFeatured ?? false,
    isBreaking: parsed.isBreaking ?? false,
    isPinned: parsed.isPinned ?? false,
      isTrending: parsed.isTrending ?? false,
  });

  if (placement.isPinned) {
    await enforcePinnedCapacity(id);
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      title: parsed.title,
      shortTitle: parsed.shortTitle,
      slug: resolveArticleSlug(parsed.title, parsed.slug, existing.slug),
      excerpt: parsed.excerpt,
      content: parsed.content,
      category: categoryRef.name,
      categoryId: categoryRef.id,
      status: parsed.status,
      imageUrl: parsed.imageUrl,
      imageCredit: parsed.imageCredit,

      tags: parsed.tags ?? [],
      collaboratorIds: parsed.collaboratorIds ?? [],
      isFeatured: placement.isFeatured,
      isBreaking: placement.isBreaking,
      isPinned: placement.isPinned,
      isTrending: placement.isTrending,
      postAsNewsDesk: parsed.postAsNewsDesk ?? false,
      publishedAt: resolvePublishedAt(parsed.status, parsed.publishedAt, existing.publishedAt),
      seo: parsed.seo ?? {},
      version: { increment: 1 },
      readTime: Math.max(1, Math.ceil(parsed.content.length / 1000)),
    },
  });

  if (parsed.content !== existing.content) {
    await prisma.revision.create({
      data: { articleId: id, content: parsed.content, userId: user.id, note: 'Auto-save' },
    });
  }

  const { registerArticleMedia } = await import('@/lib/media-registry');
  const { syncAuthorArticleCounts } = await import('@/lib/author-stats');
  await registerArticleMedia({
    imageUrl: parsed.imageUrl,
    content: parsed.content,
    uploadedById: existing.authorId,
    title: parsed.title,
  });
  await syncAuthorArticleCounts(existing.authorId);

  revalidatePath('/cms');
  revalidatePath('/cms/articles');
  revalidatePath('/admin/media');
  revalidatePath('/admin/articles');
  const slugs = [existing.slug];
  if (parsed.slug && parsed.slug !== existing.slug) slugs.push(parsed.slug);
  const wasPublished = existing.status === 'PUBLISHED';
  const isPublished = parsed.status === 'PUBLISHED';
  if (wasPublished || isPublished) revalidatePublicContent(slugs);
  // Only a transition into PUBLISHED is announced. Edits to a live article are
  // picked up by the notification cron, which edits the post in place.
  if (!wasPublished && isPublished) await announceArticles([article.id]);
  return article;
}

/**
 * Move an article to the trash.
 *
 * This is a recoverable delete, not an erasure: the row goes to TRASH and an
 * editor can restore it from Editorial → Trash until the retention window
 * purges it. Permanent removal stays where it already was, behind the trash
 * panel, because a hard `article.delete` orphans rows in six tables that hold
 * an `articleId` with no foreign key (comments, bookmarks, history, saved
 * items, notification events) — see prisma/schema.prisma.
 *
 * A live article additionally needs the phrase typed out. The status is read
 * from the database rather than trusted from the caller, so a client that
 * omits or lies about it cannot skip the gate.
 */
export async function deleteArticle(id: string, options?: { confirmation?: string }) {
  const user = await requireAuth();
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new Error('Not found');

  const canDelete = existing.authorId === user.id
    ? can(user.role, 'article.delete_own')
    : can(user.role, 'article.delete_any');
  if (!canDelete) throw new Error('Forbidden');

  const refusal = deleteRefusalReason(existing.status, options?.confirmation);
  if (refusal) throw new Error(refusal);

  const isOwn = existing.authorId === user.id;
  await prisma.article.update({
    where: { id },
    data: isOwn
      ? { status: 'TRASH', editorTrash: true, trashedAt: new Date() }
      : { status: 'TRASH', editorTrash: false, trashedAt: null },
  });

  /* Editor-side trashing was unaudited until 2026-09-20, which meant taking a
     published story off the site left no record of who did it or when. The
     status it was in when deleted is kept, because that is what distinguishes
     a discarded draft from an unpublishing. */
  await prisma.auditLog.create({
    data: {
      type: 'article.delete',
      message: `${user.name ?? user.email ?? 'A user'} moved "${existing.title}" to trash (was ${existing.status})`,
      userId: user.id,
      undoPayload: JSON.stringify({ articleId: id, previousStatus: existing.status, wasOwn: isOwn }),
    },
  });

  const { syncAuthorArticleCounts } = await import('@/lib/author-stats');
  await syncAuthorArticleCounts(existing.authorId);

  revalidatePath('/cms');
  revalidatePath('/cms/articles');
  revalidatePath('/cms/trash');
  revalidatePath('/admin/articles');
  if (existing.status === 'PUBLISHED') revalidatePublicContent([existing.slug]);
}

export async function getAllTags(authorId?: string) {
  const user = await requireEditorialReader();
  const scopedAuthorId = resolveEditorialAuthorScope(user, authorId);
  const articles = await prisma.article.findMany({
    where: {
      status: { not: 'TRASH' },
      ...(scopedAuthorId ? { authorId: scopedAuthorId } : can(user.role, 'article.review') ? {} : { authorId: user.id }),
    },
    select: { tags: true },
  });
  const tagSet = new Set<string>();
  for (const a of articles) {
    for (const t of (a.tags as string[]) ?? []) tagSet.add(t);
  }
  return Array.from(tagSet).sort();
}

export async function getTagCounts(authorId?: string) {
  const user = await requireEditorialReader();
  const scopedAuthorId = resolveEditorialAuthorScope(user, authorId);
  const articles = await prisma.article.findMany({
    where: {
      status: { not: 'TRASH' },
      ...(scopedAuthorId ? { authorId: scopedAuthorId } : can(user.role, 'article.review') ? {} : { authorId: user.id }),
    },
    select: { tags: true },
  });
  const counts = new Map<string, number>();
  for (const a of articles) {
    for (const t of (a.tags as string[]) ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getArticleRevisions(articleId: string) {
  const user = await requireAuth();
  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { authorId: true } });
  if (!article) throw new Error('Not found');

  const canView = article.authorId === user.id
    ? can(user.role, 'article.edit_own')
    : can(user.role, 'article.edit_any');
  if (!canView) throw new Error('Forbidden');

  return prisma.revision.findMany({
    where: { articleId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function restoreArticleRevision(articleId: string, revisionId: string) {
  const user = await requireAuth();
  const [article, revision] = await Promise.all([
    prisma.article.findUnique({ where: { id: articleId } }),
    prisma.revision.findUnique({ where: { id: revisionId } }),
  ]);
  if (!article || !revision || revision.articleId !== articleId) throw new Error('Not found');

  const canEdit = article.authorId === user.id
    ? can(user.role, 'article.edit_own')
    : can(user.role, 'article.edit_any');
  if (!canEdit) throw new Error('Forbidden');

  await prisma.revision.create({
    data: { articleId, content: article.content, userId: user.id, note: 'Before restore' },
  });

  await prisma.article.update({
    where: { id: articleId },
    data: { content: revision.content, version: { increment: 1 } },
  });

  revalidatePath(`/cms/articles/${articleId}/edit`);
  revalidatePath('/cms/articles');
  return { ok: true };
}

export type OwnBulkAction = 'publish' | 'draft' | 'trash' | 'archive';

export async function bulkOwnArticleAction(
  ids: string[],
  action: OwnBulkAction,
  options?: { confirmation?: string },
) {
  const user = await requireAuth();
  if (!ids.length) throw new Error('No articles selected');

  const articles = await prisma.article.findMany({
    where: { id: { in: ids }, authorId: user.id },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  if (articles.length === 0) throw new Error('No articles found');

  if (action === 'publish' && !can(user.role, 'article.publish')) {
    throw new Error('You do not have permission to publish');
  }
  if (action === 'trash' && !can(user.role, 'article.delete_own')) {
    throw new Error('You do not have permission to delete');
  }

  /* The same gate the edit form applies, because otherwise it is decorative:
     an editor could select a live story in the list and trash it without
     typing anything, which is the exact action the phrase exists to slow
     down (2026-09-20). One phrase covers the batch — it is asked once, for a
     selection that contains anything live. */
  if (action === 'trash') {
    const live = articles.filter((a) => isLiveStatus(a.status));
    if (live.length > 0) {
      const refusal = deleteRefusalReason('PUBLISHED', options?.confirmation);
      if (refusal) {
        throw new Error(
          live.length === articles.length
            ? refusal
            : `${live.length} of the ${articles.length} selected are live. ${refusal}`,
        );
      }
    }
  }

  let affected = 0;
  switch (action) {
    case 'publish':
      await prisma.$transaction(
        articles.map((a) =>
          prisma.article.update({
            where: { id: a.id },
            data: { status: 'PUBLISHED', publishedAt: a.publishedAt ?? new Date() },
          }),
        ),
      );
      affected = articles.length;
      break;
    case 'draft':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids }, authorId: user.id },
        data: { status: 'DRAFT' },
      }));
      break;
    case 'trash':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids }, authorId: user.id },
        data: { status: 'TRASH', editorTrash: true, trashedAt: new Date() },
      }));
      break;
    case 'archive':
      ({ count: affected } = await prisma.article.updateMany({
        where: { id: { in: ids }, authorId: user.id },
        data: { status: 'ARCHIVED' },
      }));
      break;
  }

  revalidatePath('/cms');
  revalidatePath('/cms/articles');
  if (action === 'trash') revalidatePath('/cms/trash');

  // Only sweep public ISR paths if articles were published or are being published.
  const hadPublished = articles.some((a) => a.status === 'PUBLISHED');
  if (action === 'publish' || hadPublished) {
    revalidatePublicContent(articles.map((a) => a.slug));
  }
  if (action === 'publish') await announceArticles(articles.map((a) => a.id));

  return { affected, action };
}

/**
 * @deprecated Views are recorded via POST /api/articles/[id]/view (ArticleView ledger).
 * Kept as a no-op so legacy imports do not break; never increments directly.
 */
export async function incrementArticleView(_articleId: string) {
  return;
}

/** @deprecated Use lib/cron/publish-scheduled-articles — not invokable as a server action. */
export type PublishScheduledResult = import('@/lib/cron/publish-scheduled-articles').PublishScheduledResult;
