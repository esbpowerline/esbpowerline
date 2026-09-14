import 'server-only';

/**
 * Articles and the channel: the editorial gate, the announcement, and the
 * reconciler that keeps them honest.
 *
 * Seven in-app code paths set an article PUBLISHED and none emits anything
 * (docs/telegram-bot/DISCOVERY.md §2). The paths call `announceArticles` after
 * their write commits, for speed; the reconciler, run every five minutes by the
 * notification cron, is what makes the result correct. It finds recently
 * published articles with no announcement (a path nobody hooked, a script, an
 * insert lost to a crash), announced articles whose headline has since changed,
 * and announced articles that are no longer published.
 *
 * Nothing here throws into a publish path. Publishing an article must succeed
 * whether or not the notification tables, the queue or Telegram are working.
 */

import { after } from 'next/server';
import type { ArticleStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getRuntimeConfig, type RuntimeConfig } from '@/lib/notifications/config';
import { emitEvent } from '@/lib/notifications/events';
import { errorText, logNotification } from '@/lib/notifications/log';
import { articleContentHash } from '@/lib/notifications/telegram/format';
import { PRIORITY } from '@/lib/notifications/types';

/** Telegram allows editing a message for 48 hours; so does editorial relevance. */
export const EDIT_WINDOW_MS = 48 * 60 * 60_000;
/** Clock skew tolerated between an editor's "now" and ours. */
const FUTURE_SKEW_MS = 5 * 60_000;

export const ARTICLE_FOR_NOTIFICATION = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  imageUrl: true,
  isBreaking: true,
  publishedAt: true,
  status: true,
  editorTrash: true,
} as const;

export interface ArticleForGate {
  status: ArticleStatus;
  editorTrash: boolean;
  title: string;
  publishedAt: Date | null;
}

/**
 * Public queries tell Bengali from English by the title's script, not by the
 * `locale` column (category-content.ts), and an article whose title is in
 * Bengali script 404s at /articles/[slug]. Announcing one links to a 404.
 */
export function isEnglishTitle(title: string): boolean {
  return !/[ঀ-৿]/.test(title);
}

export type GateResult = { ok: true } | { ok: false; reason: string };

/**
 * May this article be announced now? Deterministic, and applied twice: when the
 * event is created and again immediately before sending, so an article
 * unpublished in between is cancelled rather than posted.
 */
export function announcementGate(
  a: ArticleForGate,
  opts: { now: Date; maxAgeHours: number; since: Date | null },
): GateResult {
  if (a.status !== 'PUBLISHED') return { ok: false, reason: `status ${a.status}` };
  if (a.editorTrash) return { ok: false, reason: 'in the editor trash' };
  if (!isEnglishTitle(a.title)) return { ok: false, reason: 'Bengali-script title (its public URL 404s)' };
  if (!a.publishedAt) return { ok: false, reason: 'no publication time' };
  // A PUBLISHED article dated in the future is live on the site, but its date
  // says the editor meant it for later. It is announced when that time comes —
  // the reconciler re-evaluates it every run.
  if (a.publishedAt.getTime() > opts.now.getTime() + FUTURE_SKEW_MS) return { ok: false, reason: 'dated in the future' };
  if (opts.now.getTime() - a.publishedAt.getTime() > opts.maxAgeHours * 3_600_000) {
    return { ok: false, reason: `published more than ${opts.maxAgeHours} h ago` };
  }
  if (opts.since && a.publishedAt < opts.since) return { ok: false, reason: 'published before announcements were switched on' };
  return { ok: true };
}

function gateOptions(config: RuntimeConfig, now: Date) {
  return { now, maxAgeHours: config.articleMaxAgeHours, since: config.newsSince ? new Date(config.newsSince) : null };
}

/** Create ARTICLE_PUBLISHED events for any of these articles that pass the gate. */
export async function queueArticleAnnouncements(articleIds: string[], now = new Date()): Promise<number> {
  const ids = [...new Set(articleIds)].filter(Boolean);
  if (ids.length === 0) return 0;
  const config = await getRuntimeConfig();
  // Before the first scheduler run there is no floor, so nothing is announced
  // until one exists — the backlog must never be posted by accident.
  if (!config.news || !config.newsSince) return 0;
  const articles = await prisma.article.findMany({ where: { id: { in: ids } }, select: ARTICLE_FOR_NOTIFICATION });
  let queued = 0;
  for (const a of articles) {
    const gate = announcementGate(a, gateOptions(config, now));
    if (!gate.ok) continue;
    const res = await emitEvent({
      type: 'ARTICLE_PUBLISHED',
      dedupeKey: `article.published:${a.id}`,
      entityId: a.id,
      payload: { articleId: a.id, title: a.title },
      destinations: ['public'],
      priority: a.isBreaking ? PRIORITY.breaking : PRIORITY.routine,
    });
    if (res.created) queued += 1;
  }
  return queued;
}

/**
 * The hook every publish path calls once its write has committed. Never
 * throws, never delays the response: the event is written, and sending is
 * handed to `after()` so the editor's request finishes first. Outside a
 * request (scripts, tests) `after` is unavailable and the cron sweep sends.
 */
export async function announceArticles(articleIds: string[]): Promise<void> {
  try {
    const queued = await queueArticleAnnouncements(articleIds);
    if (queued > 0) scheduleDelivery();
  } catch (err) {
    logNotification('notification.emit_failed', { articleIds: articleIds.join(','), error: errorText(err) }, 'error');
  }
}

export function scheduleDelivery(): void {
  try {
    after(async () => {
      try {
        const { processDueDeliveries } = await import('@/lib/notifications/processor');
        await processDueDeliveries({ limit: 5, trigger: 'after-publish' });
      } catch (err) {
        logNotification('delivery.failed', { stage: 'after', error: errorText(err) }, 'error');
      }
    });
  } catch {
    // Not inside a request scope. The five-minute sweep will deliver.
  }
}

export interface ReconcileSummary {
  announced: number;
  updated: number;
  withdrawn: number;
}

/**
 * The correctness pass. Idempotent by construction: every event it creates is
 * keyed, so running it twice, or alongside a publish hook, creates nothing new.
 */
export async function reconcileArticles(config: RuntimeConfig, now = new Date()): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = { announced: 0, updated: 0, withdrawn: 0 };
  if (!config.news || !config.newsSince) return summary;

  // 1. Published recently, never announced.
  const floor = new Date(Math.max(new Date(config.newsSince).getTime(), now.getTime() - config.articleMaxAgeHours * 3_600_000));
  const recent = await prisma.article.findMany({
    where: { status: 'PUBLISHED', editorTrash: false, publishedAt: { gte: floor, lte: new Date(now.getTime() + FUTURE_SKEW_MS) } },
    select: { id: true },
    take: 100,
    orderBy: { publishedAt: 'desc' },
  });
  if (recent.length) {
    const known = await prisma.notificationEvent.findMany({
      where: { type: 'ARTICLE_PUBLISHED', entityId: { in: recent.map((r) => r.id) } },
      select: { entityId: true },
    });
    const seen = new Set(known.map((k) => k.entityId));
    const missing = recent.map((r) => r.id).filter((id) => !seen.has(id));
    if (missing.length) summary.announced = await queueArticleAnnouncements(missing, now);
  }

  // 2. Announced within the edit window: changed, or withdrawn?
  const sent = await prisma.notificationDelivery.findMany({
    where: {
      status: 'SENT',
      destination: 'public',
      sentAt: { gte: new Date(now.getTime() - EDIT_WINDOW_MS) },
      event: { type: 'ARTICLE_PUBLISHED' },
    },
    select: { id: true, contentHash: true, event: { select: { entityId: true, payload: true } } },
  });
  if (sent.length === 0) return summary;

  const ids = sent.map((s) => s.event.entityId).filter((id): id is string => Boolean(id));
  const articles = await prisma.article.findMany({ where: { id: { in: ids } }, select: ARTICLE_FOR_NOTIFICATION });
  const byId = new Map(articles.map((a) => [a.id, a]));

  for (const d of sent) {
    const articleId = d.event.entityId;
    if (!articleId) continue;
    const a = byId.get(articleId);
    const stillLive = a && a.status === 'PUBLISHED' && !a.editorTrash && isEnglishTitle(a.title);
    if (!stillLive) {
      const snapshotTitle = (d.event.payload as { title?: unknown } | null)?.title;
      const title = a?.title ?? (typeof snapshotTitle === 'string' ? snapshotTitle : 'This report');
      const res = await emitEvent({
        type: 'ARTICLE_WITHDRAWN',
        dedupeKey: `article.withdrawn:${articleId}`,
        entityId: articleId,
        payload: { articleId, title },
        destinations: ['public'],
        priority: PRIORITY.breaking,
      });
      if (res.created) summary.withdrawn += 1;
      continue;
    }
    const hash = articleContentHash(a);
    if (d.contentHash && hash !== d.contentHash) {
      const res = await emitEvent({
        type: 'ARTICLE_UPDATED',
        dedupeKey: `article.updated:${articleId}:${hash}`,
        entityId: articleId,
        payload: { articleId, contentHash: hash, title: a.title },
        destinations: ['public'],
      });
      if (res.created) summary.updated += 1;
    }
  }
  return summary;
}
