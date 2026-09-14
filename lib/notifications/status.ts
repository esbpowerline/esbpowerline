import 'server-only';

/**
 * Is the notification layer working? One answer for the health endpoint, the
 * dashboard and /status, so they cannot disagree.
 *
 * A green deploy says nothing about this: the cron may not be running, the
 * token may have been revoked, the bot may have been removed from the
 * channel, and the site would look perfect. So health is judged from what the
 * layer itself last did — the heartbeat, the queue, the last fatal error.
 */

import { getRuntimeConfig, readTelegramEnv, sendingBlockedReason, type RuntimeConfig } from '@/lib/notifications/config';
import { getHealth, integrationBlocked, type IntegrationHealth } from '@/lib/notifications/health';
import { queueStats, type QueueStats } from '@/lib/notifications/queue';
import { heartbeatSchema, type Heartbeat } from '@/lib/notifications/scheduler';
import { SETTING_KEYS, readSetting } from '@/lib/notifications/store';

/** The cron runs every 5 minutes; three missed runs is a stalled scheduler. */
export const HEARTBEAT_STALE_MS = 15 * 60_000;
/** A delivery waiting this long is stuck, whatever the reason. */
export const PENDING_STALE_MS = 30 * 60_000;

export type OverallStatus = 'ok' | 'degraded' | 'down' | 'disabled';

export interface NotificationStatus {
  status: OverallStatus;
  reasons: string[];
  configured: {
    enabled: boolean;
    dryRun: boolean;
    botToken: boolean;
    channelId: string | null;
    testChatId: string | null;
    adminCount: number;
    webhookSecret: boolean;
    processingAllowed: boolean;
  };
  config: RuntimeConfig;
  heartbeat: (Heartbeat & { ageSeconds: number }) | null;
  queue: QueueStats;
  health: IntegrationHealth;
}

export async function getNotificationStatus(now = new Date()): Promise<NotificationStatus> {
  const env = readTelegramEnv();
  const [config, queue, health, heartbeat] = await Promise.all([
    getRuntimeConfig(),
    queueStats(),
    getHealth(),
    readSetting(SETTING_KEYS.heartbeat, heartbeatSchema.nullable(), null),
  ]);

  const reasons: string[] = [];
  let status: OverallStatus = 'ok';
  const worsen = (to: OverallStatus, reason: string) => {
    reasons.push(reason);
    const rank: Record<OverallStatus, number> = { ok: 0, disabled: 1, degraded: 2, down: 3 };
    if (rank[to] > rank[status]) status = to;
  };

  const blocked = sendingBlockedReason(env);
  if (blocked && !env.dryRun) worsen('disabled', blocked);
  if (config.paused) worsen('degraded', 'Paused by an administrator');
  if (integrationBlocked(health, env.botToken)) worsen('down', `Telegram rejected the bot token: ${health.integration?.description}`);
  for (const [dest, rec] of Object.entries(health.destinations)) worsen('degraded', `Destination "${dest}": ${rec.description}`);
  if (!env.channelId) worsen('degraded', 'TELEGRAM_CHANNEL_ID is not set');

  const ageMs = heartbeat ? now.getTime() - new Date(heartbeat.at).getTime() : null;
  if (ageMs === null) worsen('degraded', 'The notification cron has never run');
  else if (ageMs > HEARTBEAT_STALE_MS) worsen('down', `The notification cron last ran ${Math.round(ageMs / 60_000)} min ago`);
  if (heartbeat?.errors.length) worsen('degraded', `Last run had errors: ${heartbeat.errors.join(' | ')}`);

  if (queue.oldestPendingAt && now.getTime() - queue.oldestPendingAt.getTime() > PENDING_STALE_MS && !config.paused && !blocked) {
    worsen('degraded', `A delivery has been pending since ${queue.oldestPendingAt.toISOString()}`);
  }
  if (queue.byStatus.UNCERTAIN > 0) worsen('degraded', `${queue.byStatus.UNCERTAIN} deliveries need checking against the channel (UNCERTAIN)`);

  return {
    status,
    reasons,
    configured: {
      enabled: env.enabled,
      dryRun: env.dryRun,
      botToken: Boolean(env.botToken),
      channelId: env.channelId,
      testChatId: env.testChatId,
      adminCount: env.adminUserIds.size,
      webhookSecret: Boolean(env.webhookSecret),
      processingAllowed: env.processingAllowed,
    },
    config,
    heartbeat: heartbeat && ageMs !== null ? { ...heartbeat, ageSeconds: Math.round(ageMs / 1000) } : null,
    queue,
    health,
  };
}
