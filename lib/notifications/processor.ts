import 'server-only';

/**
 * Drives claimed deliveries through Telegram and turns every outcome into a
 * queue state. docs/telegram-bot/ARCHITECTURE.md §3 and §6 are the contract.
 *
 * Each delivery runs inside its own try/catch, so one poisoned row — a payload
 * that no longer parses, an article that throws on render — marks that row and
 * nothing else. A run never stops the queue for everyone.
 */

import { randomUUID } from 'node:crypto';
import type { NotificationEventType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';
import { ARTICLE_FOR_NOTIFICATION, EDIT_WINDOW_MS, announcementGate } from '@/lib/notifications/articles';
import { getRuntimeConfig, readTelegramEnv, sendingBlockedReason, type RuntimeConfig, type TelegramEnv } from '@/lib/notifications/config';
import { clearHealthFor, getHealth, integrationBlocked, recordFatal } from '@/lib/notifications/health';
import { errorText, logNotification } from '@/lib/notifications/log';
import {
  claimDueDeliveries,
  markCancelled,
  markDead,
  markRetry,
  markSent,
  markSkipped,
  markUncertain,
  recoverExpiredLeases,
  type ClaimedDelivery,
} from '@/lib/notifications/queue';
import {
  editMessage,
  sendMessage,
  sendPhoto,
  type TelegramMessage,
  type TelegramResult,
} from '@/lib/notifications/telegram/client';
import {
  articleContentHash,
  renderArticle,
  renderDailySummary,
  renderGridAlert,
  renderGridHourly,
  renderTest,
  renderWithdrawn,
} from '@/lib/notifications/telegram/format';
import { prepareArticlePhoto } from '@/lib/notifications/telegram/image';
import { parsePayload, type Destination } from '@/lib/notifications/types';

/** Telegram asks for no more than about one message a second to one chat. */
const PER_CHAT_SPACING_MS = 1100;
const DAILY_SUMMARY_MAX_AGE_DAYS = 3;

export interface ProcessSummary {
  runId: string;
  trigger: string;
  claimed: number;
  sent: number;
  retried: number;
  dead: number;
  uncertain: number;
  cancelled: number;
  skipped: number;
  recoveredLeases: number;
  blockedReason: string | null;
}

interface Ctx {
  runId: string;
  env: TelegramEnv;
  config: RuntimeConfig;
  now: Date;
  fetchImpl?: typeof fetch;
  lastSendAt: Map<string, number>;
  summary: ProcessSummary;
  stop: boolean;
}

const FEATURE_OF: Record<NotificationEventType, keyof RuntimeConfig | null> = {
  ARTICLE_PUBLISHED: 'news',
  ARTICLE_UPDATED: 'news',
  ARTICLE_WITHDRAWN: 'news',
  GRID_HOURLY_SNAPSHOT: 'gridHourly',
  GRID_ALERT: 'gridAlerts',
  DAILY_GRID_SUMMARY: 'dailySummary',
  TEST_MESSAGE: null,
};

function resolveChat(env: TelegramEnv, destination: string): string | null {
  if (destination === ('public' satisfies Destination)) return env.channelId;
  if (destination === ('test' satisfies Destination)) return env.testChatId;
  return null;
}

async function pace(ctx: Ctx, chatId: string): Promise<void> {
  const last = ctx.lastSendAt.get(chatId);
  if (last !== undefined) {
    const wait = last + PER_CHAT_SPACING_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  ctx.lastSendAt.set(chatId, Date.now());
}

/** Map one Bot API outcome onto the queue. */
async function settle(
  ctx: Ctx,
  d: ClaimedDelivery,
  chatId: string,
  result: TelegramResult<TelegramMessage | true>,
  sent: { messageKind: string; contentHash: string | null; editOf?: { messageId: string } },
): Promise<void> {
  if (result.ok || (!result.ok && result.kind === 'not_modified')) {
    const messageId =
      sent.editOf?.messageId ??
      (result.ok && result.result !== true ? String(result.result.message_id) : '');
    const recorded = await markSent(d.id, ctx.runId, {
      externalChatId: chatId,
      externalMessageId: messageId,
      messageKind: sent.messageKind,
      contentHash: sent.contentHash,
    });
    if (recorded) ctx.summary.sent += 1;
    await clearHealthFor(d.destination).catch(() => undefined);
    return;
  }
  const failure = { error: result.description, code: result.code };
  logNotification('telegram.api_error', { deliveryId: d.id, eventId: d.event.id, kind: result.kind, code: result.code, description: result.description }, 'warn');
  switch (result.kind) {
    case 'retryable':
      await markRetry(d.id, ctx.runId, d.attemptCount, { ...failure, delayMs: result.retryAfterMs });
      ctx.summary.retried += 1;
      return;
    case 'ambiguous':
      await markUncertain(d.id, ctx.runId, failure);
      ctx.summary.uncertain += 1;
      return;
    case 'fatal_integration':
      await markDead(d.id, ctx.runId, failure);
      await recordFatal('fatal_integration', { code: result.code, description: result.description, destination: null, token: ctx.env.botToken });
      ctx.summary.dead += 1;
      ctx.stop = true; // every later send in this run would fail the same way
      return;
    case 'fatal_destination':
      await markDead(d.id, ctx.runId, failure);
      await recordFatal('fatal_destination', { code: result.code, description: result.description, destination: d.destination, token: ctx.env.botToken });
      ctx.summary.dead += 1;
      return;
    default:
      await markDead(d.id, ctx.runId, failure);
      ctx.summary.dead += 1;
  }
}

async function skip(ctx: Ctx, d: ClaimedDelivery, code: string, error: string) {
  await markSkipped(d.id, ctx.runId, { code, error });
  ctx.summary.skipped += 1;
}

async function cancel(ctx: Ctx, d: ClaimedDelivery, code: string, error: string) {
  await markCancelled(d.id, ctx.runId, { code, error });
  ctx.summary.cancelled += 1;
}

/** The SENT announcement an update or withdrawal must edit, if it can still be edited. */
async function originalAnnouncement(articleId: string, destination: string) {
  return prisma.notificationDelivery.findFirst({
    where: { status: 'SENT', destination, event: { type: 'ARTICLE_PUBLISHED', entityId: articleId } },
    select: { id: true, externalChatId: true, externalMessageId: true, messageKind: true, sentAt: true },
  });
}

async function processOne(ctx: Ctx, d: ClaimedDelivery): Promise<void> {
  const type = d.event.type;
  const feature = FEATURE_OF[type];
  if (feature && ctx.config[feature] !== true) return skip(ctx, d, 'feature_disabled', `${String(feature)} is switched off`);

  const chatId = resolveChat(ctx.env, d.destination);
  if (!chatId) return markDead(d.id, ctx.runId, { code: 'destination_unconfigured', error: `No chat id configured for destination "${d.destination}"` }).then(() => {
    ctx.summary.dead += 1;
  });

  const siteUrl = SITE_URL;

  switch (type) {
    case 'ARTICLE_PUBLISHED': {
      const payload = parsePayload(type, d.event.payload);
      if (!payload.ok) return markDead(d.id, ctx.runId, { code: 'invalid_payload', error: payload.reason }).then(() => void (ctx.summary.dead += 1));
      const a = await prisma.article.findUnique({ where: { id: payload.value.articleId }, select: ARTICLE_FOR_NOTIFICATION });
      if (!a) return cancel(ctx, d, 'article_missing', 'The article no longer exists');
      const gate = announcementGate(a, { now: ctx.now, maxAgeHours: ctx.config.articleMaxAgeHours, since: null });
      if (!gate.ok) return cancel(ctx, d, 'not_publishable', gate.reason);

      const article = { ...a, publishedAt: a.publishedAt as Date };
      const hash = articleContentHash(article);
      if (ctx.env.dryRun) return skip(ctx, d, 'dry_run', 'TELEGRAM_DRY_RUN is set; rendered, not sent');

      const photo = await prepareArticlePhoto(a.imageUrl, { fetchImpl: ctx.fetchImpl, slug: a.slug });
      await pace(ctx, chatId);
      logNotification('delivery.attempt', { deliveryId: d.id, eventId: d.event.id, articleId: a.id, attempt: d.attemptCount, photo: photo.ok });
      if (photo.ok) {
        const caption = renderArticle(article, { siteUrl, asCaption: true, now: ctx.now });
        const res = await sendPhoto(ctx.env.botToken as string, chatId, photo, caption.html, caption.buttons, { fetchImpl: ctx.fetchImpl });
        if (res.ok || res.kind !== 'bad_media') return settle(ctx, d, chatId, res, { messageKind: 'photo', contentHash: hash });
        logNotification('delivery.image_fallback', { deliveryId: d.id, articleId: a.id, reason: res.description }, 'warn');
      } else if (a.imageUrl) {
        logNotification('delivery.image_fallback', { deliveryId: d.id, articleId: a.id, reason: photo.reason });
      }
      const text = renderArticle(article, { siteUrl, asCaption: false, now: ctx.now });
      const res = await sendMessage(ctx.env.botToken as string, chatId, text.html, text.buttons, { fetchImpl: ctx.fetchImpl });
      return settle(ctx, d, chatId, res, { messageKind: 'text', contentHash: hash });
    }

    case 'ARTICLE_UPDATED':
    case 'ARTICLE_WITHDRAWN': {
      const payload = parsePayload(type, d.event.payload);
      if (!payload.ok) return markDead(d.id, ctx.runId, { code: 'invalid_payload', error: payload.reason }).then(() => void (ctx.summary.dead += 1));
      const original = await originalAnnouncement(payload.value.articleId, d.destination);
      if (!original?.externalMessageId || !original.externalChatId || !original.sentAt) {
        return skip(ctx, d, 'no_original', 'There is no sent announcement to edit');
      }
      if (ctx.now.getTime() - original.sentAt.getTime() > EDIT_WINDOW_MS) return skip(ctx, d, 'too_old_to_edit', 'The announcement is older than 48 hours');
      const kind = original.messageKind === 'photo' ? 'photo' : 'text';

      let rendered;
      let hash: string | null = null;
      if (type === 'ARTICLE_UPDATED') {
        const a = await prisma.article.findUnique({ where: { id: payload.value.articleId }, select: ARTICLE_FOR_NOTIFICATION });
        if (!a || a.status !== 'PUBLISHED' || a.editorTrash || !a.publishedAt) return skip(ctx, d, 'not_publishable', 'The article is no longer published');
        const article = { ...a, publishedAt: a.publishedAt };
        hash = articleContentHash(article);
        rendered = renderArticle(article, { siteUrl, asCaption: kind === 'photo', now: ctx.now });
      } else {
        rendered = renderWithdrawn((payload.value as { title: string }).title);
      }
      if (ctx.env.dryRun) return skip(ctx, d, 'dry_run', 'TELEGRAM_DRY_RUN is set; rendered, not sent');
      await pace(ctx, original.externalChatId);
      const res = await editMessage(
        ctx.env.botToken as string,
        { chatId: original.externalChatId, messageId: original.externalMessageId, kind },
        rendered.html,
        rendered.buttons,
        { fetchImpl: ctx.fetchImpl },
      );
      await settle(ctx, d, original.externalChatId, res, { messageKind: kind, contentHash: hash, editOf: { messageId: original.externalMessageId } });
      // The original now shows this version; record it there so the reconciler
      // compares the next edit against what readers actually see.
      if ((res.ok || (!res.ok && res.kind === 'not_modified')) && hash) {
        await prisma.notificationDelivery.update({ where: { id: original.id }, data: { contentHash: hash } }).catch(() => undefined);
      }
      return;
    }

    case 'GRID_HOURLY_SNAPSHOT':
    case 'GRID_ALERT':
    case 'DAILY_GRID_SUMMARY':
    case 'TEST_MESSAGE': {
      let rendered;
      if (type === 'GRID_HOURLY_SNAPSHOT') {
        const p = parsePayload(type, d.event.payload);
        if (!p.ok) return markDead(d.id, ctx.runId, { code: 'invalid_payload', error: p.reason }).then(() => void (ctx.summary.dead += 1));
        if (ctx.now.getTime() - new Date(p.value.observedAt).getTime() > ctx.config.gridMaxAgeHours * 3_600_000) {
          return skip(ctx, d, 'stale', `The hour is older than ${ctx.config.gridMaxAgeHours} h`);
        }
        rendered = renderGridHourly(p.value, { siteUrl });
      } else if (type === 'GRID_ALERT') {
        const p = parsePayload(type, d.event.payload);
        if (!p.ok) return markDead(d.id, ctx.runId, { code: 'invalid_payload', error: p.reason }).then(() => void (ctx.summary.dead += 1));
        if (ctx.now.getTime() - new Date(p.value.observedAt).getTime() > ctx.config.gridMaxAgeHours * 3_600_000) {
          return skip(ctx, d, 'stale', `The hour is older than ${ctx.config.gridMaxAgeHours} h`);
        }
        rendered = renderGridAlert(p.value, { siteUrl });
      } else if (type === 'DAILY_GRID_SUMMARY') {
        const p = parsePayload(type, d.event.payload);
        if (!p.ok) return markDead(d.id, ctx.runId, { code: 'invalid_payload', error: p.reason }).then(() => void (ctx.summary.dead += 1));
        const ageDays = (ctx.now.getTime() - new Date(`${p.value.energyDay}T00:00:00+06:00`).getTime()) / 86_400_000;
        if (ageDays > DAILY_SUMMARY_MAX_AGE_DAYS + 1) return skip(ctx, d, 'stale', 'The energy day is too old to summarise');
        rendered = renderDailySummary(p.value, { siteUrl });
      } else {
        const p = parsePayload(type, d.event.payload);
        if (!p.ok) return markDead(d.id, ctx.runId, { code: 'invalid_payload', error: p.reason }).then(() => void (ctx.summary.dead += 1));
        rendered = renderTest(p.value, ctx.now);
      }
      if (ctx.env.dryRun) return skip(ctx, d, 'dry_run', 'TELEGRAM_DRY_RUN is set; rendered, not sent');
      await pace(ctx, chatId);
      logNotification('delivery.attempt', { deliveryId: d.id, eventId: d.event.id, type, attempt: d.attemptCount });
      const res = await sendMessage(ctx.env.botToken as string, chatId, rendered.html, rendered.buttons, { fetchImpl: ctx.fetchImpl });
      return settle(ctx, d, chatId, res, { messageKind: 'text', contentHash: null });
    }
  }
}

export interface ProcessOptions {
  limit?: number;
  trigger?: string;
  runId?: string;
  now?: Date;
  fetchImpl?: typeof fetch;
}

export async function processDueDeliveries(opts: ProcessOptions = {}): Promise<ProcessSummary> {
  const runId = opts.runId ?? randomUUID();
  const summary: ProcessSummary = {
    runId,
    trigger: opts.trigger ?? 'manual',
    claimed: 0,
    sent: 0,
    retried: 0,
    dead: 0,
    uncertain: 0,
    cancelled: 0,
    skipped: 0,
    recoveredLeases: 0,
    blockedReason: null,
  };
  const env = readTelegramEnv();

  summary.recoveredLeases = await recoverExpiredLeases();

  const blocked = sendingBlockedReason(env);
  // Dry run may bypass the Telegram switches, never the production-only rule:
  // a dry run anywhere else would mark the channel's deliveries SKIPPED.
  if (blocked && (!env.dryRun || !env.processingAllowed)) {
    summary.blockedReason = blocked;
    return summary;
  }
  const config = await getRuntimeConfig();
  if (config.paused) {
    summary.blockedReason = 'paused';
    return summary;
  }
  const health = await getHealth();
  if (integrationBlocked(health, env.botToken)) {
    summary.blockedReason = `Telegram rejected the configured token (${health.integration?.code}); fix TELEGRAM_BOT_TOKEN`;
    return summary;
  }

  const claims = await claimDueDeliveries(runId, opts.limit ?? 10);
  summary.claimed = claims.length;
  const ctx: Ctx = { runId, env, config, now: opts.now ?? new Date(), fetchImpl: opts.fetchImpl, lastSendAt: new Map(), summary, stop: false };

  for (const d of claims) {
    if (ctx.stop) {
      // The token was just rejected. Put the rest back untouched, attempt not spent.
      await prisma.notificationDelivery
        .updateMany({ where: { id: d.id, status: 'SENDING', lockedBy: runId }, data: { status: 'PENDING', lockedAt: null, lockedBy: null, attemptCount: { decrement: 1 } } })
        .catch(() => undefined);
      continue;
    }
    try {
      await processOne(ctx, d);
    } catch (err) {
      // Anything thrown reached here before a send completed (sends are settled
      // inside processOne), so a retry cannot duplicate a post.
      logNotification('delivery.failed', { deliveryId: d.id, eventId: d.event.id, stage: 'process', error: errorText(err) }, 'error');
      await markRetry(d.id, runId, d.attemptCount, { error: errorText(err), code: 'internal_error' }).catch(() => undefined);
      summary.retried += 1;
    }
  }
  return summary;
}
