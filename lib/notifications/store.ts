import 'server-only';

/**
 * Typed access to `NotificationSetting` — runtime config, alert state, the
 * heartbeat and scheduler leases. Every read goes through a zod schema, so a row
 * edited by hand into a bad shape degrades to the schema's fallback rather than
 * reaching the scheduler as garbage.
 */

import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import prisma from '@/lib/prisma';
import { errorText, logNotification } from '@/lib/notifications/log';

export const SETTING_KEYS = {
  config: 'telegram.config',
  heartbeat: 'telegram.heartbeat',
  health: 'telegram.health',
  hourlyLast: 'grid.hourly.last',
  schedulerLease: 'lease.scheduler',
  alertState: (rule: string) => `grid.alert.${rule}`,
} as const;

export async function readSetting<S extends z.ZodTypeAny>(
  key: string,
  schema: S,
  fallback: z.infer<S>,
): Promise<z.infer<S>> {
  const row = await prisma.notificationSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  const parsed = schema.safeParse(row.value);
  if (parsed.success) return parsed.data;
  logNotification('scheduler.skipped', { key, reason: `setting failed validation: ${parsed.error.message}` }, 'warn');
  return fallback;
}

export async function writeSetting(key: string, value: unknown): Promise<void> {
  const json = value as Prisma.InputJsonValue;
  await prisma.notificationSetting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  });
}

/**
 * A row lease: true when this run now holds `key` until `ttlMs` from now.
 *
 * One conditional UPDATE, so it works through the transaction pooler — no
 * advisory lock, no interactive transaction. Two cron runs that overlap cannot
 * both evaluate the alert state machines: the second finds the lease unexpired.
 */
export async function acquireLease(key: string, runId: string, ttlMs: number): Promise<boolean> {
  try {
    const until = new Date(Date.now() + ttlMs).toISOString();
    const value = JSON.stringify({ runId, until });
    // Create the row if it has never existed; ON CONFLICT leaves an existing one alone.
    // "updatedAt" is a zone-less column holding UTC; now() would be converted
    // through the session time zone, so it is written as timezone('utc', now()).
    await prisma.$executeRaw`
      INSERT INTO "NotificationSetting" ("key", "value", "updatedAt")
      VALUES (${key}, ${JSON.stringify({ runId: null, until: new Date(0).toISOString() })}::jsonb, timezone('utc', now()))
      ON CONFLICT ("key") DO NOTHING`;
    const taken = await prisma.$executeRaw`
      UPDATE "NotificationSetting"
         SET "value" = ${value}::jsonb, "updatedAt" = timezone('utc', now())
       WHERE "key" = ${key}
         AND (("value"->>'until')::timestamptz < now() OR "value"->>'runId' = ${runId})`;
    return taken === 1;
  } catch (err) {
    logNotification('scheduler.skipped', { key, reason: errorText(err) }, 'warn');
    return false;
  }
}

export async function releaseLease(key: string, runId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "NotificationSetting"
         SET "value" = jsonb_set("value", '{until}', to_jsonb(${new Date(0).toISOString()}::text)), "updatedAt" = now()
       WHERE "key" = ${key} AND "value"->>'runId' = ${runId}`;
  } catch {
    // An unreleased lease expires on its own.
  }
}
