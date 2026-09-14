'use server';

/**
 * Dashboard actions for the notification layer. Every one re-checks
 * `notifications.manage` (SUPER_ADMIN, ADMIN) — the page check alone protects
 * nothing, because a server action is callable on its own — and records what
 * it did in AuditLog.
 *
 * Retrying is always a person's decision. The queue never re-sends an
 * UNCERTAIN delivery by itself, because it may already be in the channel.
 */

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { scheduleDelivery } from '@/lib/notifications/articles';
import { readTelegramEnv, updateRuntimeConfig, type RuntimeConfig } from '@/lib/notifications/config';
import { emitEvent } from '@/lib/notifications/events';
import { clearAllHealth } from '@/lib/notifications/health';
import { logNotification } from '@/lib/notifications/log';
import { requeueDelivery } from '@/lib/notifications/queue';

type ActionResult = { ok: true } | { ok: false; error: string };

/** What the dashboard may change. `newsSince` is deliberately absent. */
const EDITABLE_KEYS = [
  'paused',
  'news',
  'gridHourly',
  'gridAlerts',
  'dailySummary',
  'commands',
  'articleMaxAgeHours',
  'gridMaxAgeHours',
  'hourlyMinIntervalMinutes',
  'loadShedAlertMw',
  'loadShedClearMw',
  'loadShedEscalationMw',
  'loadShedRealertHours',
  'generationDropAlertMw',
] as const satisfies ReadonlyArray<keyof RuntimeConfig>;

export type EditableNotificationSettings = Partial<Pick<RuntimeConfig, (typeof EDITABLE_KEYS)[number]>>;

async function requireManager() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'notifications.manage')) throw new Error('Forbidden');
  return session.user;
}

async function audit(userId: string, message: string) {
  // A failed audit write must not fail the action it records.
  await prisma.auditLog.create({ data: { type: 'notifications.update', message, userId } }).catch(() => undefined);
}

export async function updateNotificationSettings(patch: EditableNotificationSettings): Promise<ActionResult> {
  const user = await requireManager();
  const allowed: EditableNotificationSettings = {};
  for (const key of EDITABLE_KEYS) {
    if (key in patch) (allowed as Record<string, unknown>)[key] = (patch as Record<string, unknown>)[key];
  }
  if (Object.keys(allowed).length === 0) return { ok: false, error: 'Nothing to change' };
  const res = await updateRuntimeConfig(allowed);
  if (!res.ok) return res;
  const summary = Object.entries(allowed).map(([k, v]) => `${k}=${String(v)}`).join(', ');
  await audit(user.id, `Notification settings: ${summary}`);
  logNotification('config.changed', { by: `admin:${user.id}`, change: summary });
  if (allowed.paused === false) scheduleDelivery();
  revalidatePath('/admin/notifications');
  return { ok: true };
}

export async function retryNotificationDelivery(deliveryId: string): Promise<ActionResult> {
  const user = await requireManager();
  const ok = await requeueDelivery(deliveryId);
  if (!ok) return { ok: false, error: 'That delivery is not failed, uncertain, cancelled or skipped' };
  await audit(user.id, `Notification delivery re-queued: ${deliveryId}`);
  scheduleDelivery();
  revalidatePath('/admin/notifications');
  return { ok: true };
}

export async function cancelNotificationDelivery(deliveryId: string): Promise<ActionResult> {
  const user = await requireManager();
  const res = await prisma.notificationDelivery.updateMany({
    where: { id: deliveryId, status: { in: ['PENDING', 'UNCERTAIN', 'DEAD'] } },
    data: { status: 'CANCELLED', lastErrorCode: 'cancelled_by_admin', lastError: 'Cancelled from the dashboard', lockedAt: null, lockedBy: null },
  });
  if (res.count !== 1) return { ok: false, error: 'Only pending, uncertain or failed deliveries can be cancelled' };
  await audit(user.id, `Notification delivery cancelled: ${deliveryId}`);
  revalidatePath('/admin/notifications');
  return { ok: true };
}

export async function sendNotificationTest(note: string): Promise<ActionResult> {
  const user = await requireManager();
  const env = readTelegramEnv();
  if (!env.testChatId) return { ok: false, error: 'TELEGRAM_TEST_CHAT_ID is not set' };
  await emitEvent({
    type: 'TEST_MESSAGE',
    dedupeKey: `test:${randomUUID()}`,
    payload: { requestedBy: user.name?.trim() || user.email || 'an administrator', note: note.slice(0, 200) },
    destinations: ['test'],
  });
  await audit(user.id, 'Notification test message queued');
  scheduleDelivery();
  revalidatePath('/admin/notifications');
  return { ok: true };
}

export async function clearNotificationHealth(): Promise<ActionResult> {
  const user = await requireManager();
  await clearAllHealth();
  await audit(user.id, 'Notification integration errors cleared');
  revalidatePath('/admin/notifications');
  return { ok: true };
}
