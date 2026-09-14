import 'server-only';

/**
 * The delivery queue: Postgres rows, claimed with FOR UPDATE SKIP LOCKED.
 *
 * Every write below is conditional on the row still being SENDING and still
 * held by the run that claimed it (`lockedBy`). A run that lost its lease — it
 * stalled past LEASE_MS and the row was moved to UNCERTAIN — cannot then mark
 * it SENT or re-queue it; the conditional update matches nothing.
 *
 * Timestamps are zone-less columns holding UTC, so raw SQL writes
 * timezone('utc', now()) rather than now(), which would be converted through
 * the session time zone.
 */

import type { NotificationDeliveryStatus, NotificationEventType, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { errorText, logNotification } from '@/lib/notifications/log';

export const MAX_ATTEMPTS = 6;
/** A claim older than this is presumed dead mid-send. */
export const LEASE_MS = 5 * 60_000;
const BASE_BACKOFF_MS = 60_000;
const MAX_BACKOFF_MS = 60 * 60_000;

/** 1, 2, 4, 8, 16 … minutes, ±20% jitter, capped at an hour. */
export function backoffMs(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempt - 1), MAX_BACKOFF_MS);
  return Math.round(base * (0.8 + 0.4 * random()));
}

export interface ClaimedDelivery {
  id: string;
  destination: string;
  attemptCount: number;
  priority: number;
  event: {
    id: string;
    type: NotificationEventType;
    entityId: string | null;
    payload: Prisma.JsonValue;
    createdAt: Date;
  };
}

/** Claim up to `limit` due deliveries for `runId`. Concurrent callers never share a row. */
export async function claimDueDeliveries(runId: string, limit: number): Promise<ClaimedDelivery[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE "NotificationDelivery"
       SET "status" = 'SENDING', "lockedAt" = timezone('utc', now()), "lockedBy" = ${runId},
           "attemptCount" = "attemptCount" + 1, "updatedAt" = timezone('utc', now())
     WHERE "id" IN (
       SELECT "id" FROM "NotificationDelivery"
        WHERE "status" = 'PENDING' AND "nextAttemptAt" <= timezone('utc', now())
        ORDER BY "priority" DESC, "createdAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED)
    RETURNING "id"`;
  if (rows.length === 0) return [];
  const claimed = await prisma.notificationDelivery.findMany({
    where: { id: { in: rows.map((r) => r.id) }, lockedBy: runId },
    select: {
      id: true,
      destination: true,
      attemptCount: true,
      priority: true,
      event: { select: { id: true, type: true, entityId: true, payload: true, createdAt: true } },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
  return claimed;
}

async function finish(
  deliveryId: string,
  runId: string,
  data: Prisma.NotificationDeliveryUpdateManyMutationInput,
): Promise<boolean> {
  const res = await prisma.notificationDelivery.updateMany({
    where: { id: deliveryId, status: 'SENDING', lockedBy: runId },
    data: { ...data, lockedAt: null, lockedBy: null },
  });
  return res.count === 1;
}

/**
 * Record a send Telegram accepted. Retried in-process: this is the write whose
 * loss would otherwise turn a delivered post into an UNCERTAIN one. If every
 * try fails the row keeps its lease, the lease expires, and it becomes
 * UNCERTAIN — never re-sent, because it was sent.
 */
export async function markSent(
  deliveryId: string,
  runId: string,
  sent: { externalChatId: string; externalMessageId: string; messageKind: string; contentHash: string | null },
): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const ok = await finish(deliveryId, runId, {
        status: 'SENT',
        sentAt: new Date(),
        externalChatId: sent.externalChatId,
        externalMessageId: sent.externalMessageId,
        messageKind: sent.messageKind,
        contentHash: sent.contentHash,
        lastError: null,
        lastErrorCode: null,
      });
      logNotification('delivery.sent', { deliveryId, runId, externalMessageId: sent.externalMessageId, recorded: ok });
      return ok;
    } catch (err) {
      logNotification('delivery.failed', { deliveryId, runId, stage: 'record-sent', attempt, error: errorText(err) }, 'error');
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }
  return false;
}

export async function markRetry(
  deliveryId: string,
  runId: string,
  attemptCount: number,
  failure: { error: string; code: string; delayMs?: number },
): Promise<void> {
  if (attemptCount >= MAX_ATTEMPTS) {
    await markDead(deliveryId, runId, { error: `${failure.error} (after ${attemptCount} attempts)`, code: failure.code });
    return;
  }
  const delay = failure.delayMs ?? backoffMs(attemptCount);
  await finish(deliveryId, runId, {
    status: 'PENDING',
    nextAttemptAt: new Date(Date.now() + delay),
    lastError: failure.error,
    lastErrorCode: failure.code,
  });
  logNotification('delivery.retry_scheduled', { deliveryId, runId, attemptCount, delayMs: delay, code: failure.code }, 'warn');
}

async function markTerminal(
  status: Extract<NotificationDeliveryStatus, 'DEAD' | 'UNCERTAIN' | 'CANCELLED' | 'SKIPPED'>,
  deliveryId: string,
  runId: string,
  failure: { error: string; code: string },
): Promise<void> {
  await finish(deliveryId, runId, { status, lastError: failure.error, lastErrorCode: failure.code });
  const event = ({ DEAD: 'delivery.dead', UNCERTAIN: 'delivery.uncertain', CANCELLED: 'delivery.cancelled', SKIPPED: 'delivery.skipped' } as const)[status];
  logNotification(event, { deliveryId, runId, code: failure.code, error: failure.error }, status === 'SKIPPED' || status === 'CANCELLED' ? 'info' : 'error');
}

export const markDead = (id: string, runId: string, f: { error: string; code: string }) => markTerminal('DEAD', id, runId, f);
export const markUncertain = (id: string, runId: string, f: { error: string; code: string }) => markTerminal('UNCERTAIN', id, runId, f);
export const markCancelled = (id: string, runId: string, f: { error: string; code: string }) => markTerminal('CANCELLED', id, runId, f);
export const markSkipped = (id: string, runId: string, f: { error: string; code: string }) => markTerminal('SKIPPED', id, runId, f);

/**
 * A SENDING row whose lease expired belongs to a run that died mid-send. It may
 * have been posted, so it becomes UNCERTAIN — a person checks the channel and
 * retries it from the dashboard if it is not there.
 */
export async function recoverExpiredLeases(leaseMs: number = LEASE_MS): Promise<number> {
  const cutoff = new Date(Date.now() - leaseMs);
  const res = await prisma.notificationDelivery.updateMany({
    where: { status: 'SENDING', lockedAt: { lt: cutoff } },
    data: {
      status: 'UNCERTAIN',
      lockedAt: null,
      lockedBy: null,
      lastErrorCode: 'lease_expired',
      lastError: 'The run sending this stopped before recording the outcome. Check the channel before retrying.',
    },
  });
  if (res.count > 0) logNotification('delivery.uncertain', { recovered: res.count, reason: 'lease_expired' }, 'error');
  return res.count;
}

/**
 * Put a failed, uncertain or cancelled delivery back in the queue — an
 * administrator's decision, never an automatic one. Attempts restart from zero.
 */
export async function requeueDelivery(deliveryId: string): Promise<boolean> {
  const res = await prisma.notificationDelivery.updateMany({
    where: { id: deliveryId, status: { in: ['DEAD', 'UNCERTAIN', 'CANCELLED', 'SKIPPED'] } },
    data: { status: 'PENDING', attemptCount: 0, nextAttemptAt: new Date(), lastError: null, lastErrorCode: null },
  });
  return res.count === 1;
}

export interface QueueStats {
  byStatus: Record<NotificationDeliveryStatus, number>;
  oldestPendingAt: Date | null;
  lastSentAt: Date | null;
}

export async function queueStats(): Promise<QueueStats> {
  const [groups, oldest, last] = await Promise.all([
    prisma.notificationDelivery.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.notificationDelivery.findFirst({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    prisma.notificationDelivery.findFirst({ where: { status: 'SENT' }, orderBy: { sentAt: 'desc' }, select: { sentAt: true } }),
  ]);
  const byStatus = { PENDING: 0, SENDING: 0, SENT: 0, UNCERTAIN: 0, DEAD: 0, CANCELLED: 0, SKIPPED: 0 } as Record<NotificationDeliveryStatus, number>;
  for (const g of groups) byStatus[g.status] = g._count._all;
  return { byStatus, oldestPendingAt: oldest?.createdAt ?? null, lastSentAt: last?.sentAt ?? null };
}
