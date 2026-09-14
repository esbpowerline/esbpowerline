import 'server-only';

/**
 * Notification configuration, split by who should be able to change it.
 *
 * Environment (Vercel): secrets and the hard switches. Changing them needs a
 * redeploy, which is the point — `TELEGRAM_ENABLED` unset means nothing is ever
 * sent, whatever the dashboard says.
 *
 * Runtime (`NotificationSetting` "telegram.config"): what an administrator may
 * reasonably change at 2 a.m. without a deploy — pause, per-feature switches,
 * thresholds. Never a secret.
 */

import { z } from 'zod';
import { SETTING_KEYS, readSetting, writeSetting } from '@/lib/notifications/store';

export interface TelegramEnv {
  /** TELEGRAM_ENABLED — the master switch. */
  enabled: boolean;
  /** TELEGRAM_DRY_RUN — render and record, never call Telegram. */
  dryRun: boolean;
  botToken: string | null;
  /** TELEGRAM_CHANNEL_ID — "@esbpowerline" or "-100…". */
  channelId: string | null;
  /** TELEGRAM_TEST_CHAT_ID — a private staging channel or an admin's chat. */
  testChatId: string | null;
  /** TELEGRAM_ADMIN_USER_IDS — numeric Telegram user ids, never usernames. */
  adminUserIds: ReadonlySet<string>;
  /** TELEGRAM_WEBHOOK_SECRET — checked against X-Telegram-Bot-Api-Secret-Token. */
  webhookSecret: string | null;
  /**
   * Whether this deployment may work the shared queue. Development machines
   * point at the production database (CLAUDE.md), so a local processor would
   * claim the channel's deliveries and post them wherever its own environment
   * points — or, in dry run, mark them SKIPPED so they are never posted at
   * all. Only the production deployment processes, unless
   * TELEGRAM_ALLOW_LOCAL_PROCESSING is set against a database of its own.
   */
  processingAllowed: boolean;
}

const truthy = (v: string | undefined) => v === '1' || v?.toLowerCase() === 'true';
const nonEmpty = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

/**
 * Numeric ids only. A username can be changed by its owner and reassigned to
 * someone else; an id cannot. Anything that is not 1-20 digits is dropped, so a
 * typo'd "@hamim" in the variable grants nothing rather than everything.
 */
export function parseAdminIds(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? '')
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d{1,20}$/.test(s)),
  );
}

// Telegram's own rule for secret_token: 1-256 characters, A-Z a-z 0-9 _ -.
const WEBHOOK_SECRET_SHAPE = /^[A-Za-z0-9_-]{16,256}$/;

export function readTelegramEnv(env: NodeJS.ProcessEnv = process.env): TelegramEnv {
  const secret = nonEmpty(env.TELEGRAM_WEBHOOK_SECRET);
  return {
    enabled: truthy(env.TELEGRAM_ENABLED),
    dryRun: truthy(env.TELEGRAM_DRY_RUN),
    botToken: nonEmpty(env.TELEGRAM_BOT_TOKEN),
    channelId: nonEmpty(env.TELEGRAM_CHANNEL_ID),
    testChatId: nonEmpty(env.TELEGRAM_TEST_CHAT_ID),
    adminUserIds: parseAdminIds(env.TELEGRAM_ADMIN_USER_IDS),
    // A short or oddly shaped secret is treated as absent: the webhook then
    // refuses every request rather than accepting a guessable one.
    webhookSecret: secret && WEBHOOK_SECRET_SHAPE.test(secret) ? secret : null,
    processingAllowed: env.VERCEL_ENV === 'production' || truthy(env.TELEGRAM_ALLOW_LOCAL_PROCESSING),
  };
}

/** Whether sending is possible at all, and why not when it is not. */
export function sendingBlockedReason(env: TelegramEnv): string | null {
  if (!env.processingAllowed) {
    return 'Not the production deployment; set TELEGRAM_ALLOW_LOCAL_PROCESSING=true only against a database of your own';
  }
  if (!env.enabled) return 'TELEGRAM_ENABLED is not set';
  if (!env.botToken) return 'TELEGRAM_BOT_TOKEN is not set';
  return null;
}

export const runtimeConfigSchema = z
  .object({
    /** Emergency stop. Queued deliveries wait; nothing is lost. */
    paused: z.boolean().default(false),
    news: z.boolean().default(true),
    gridHourly: z.boolean().default(false),
    gridAlerts: z.boolean().default(false),
    dailySummary: z.boolean().default(false),
    commands: z.boolean().default(true),
    /** An article older than this when first seen is never announced (imports, backdating). */
    articleMaxAgeHours: z.number().int().min(1).max(168).default(24),
    /** A grid hour older than this is not bulletined. Above NLDC's measured p90 lag of 6.3 h. */
    gridMaxAgeHours: z.number().int().min(1).max(48).default(8),
    hourlyMinIntervalMinutes: z.number().int().min(15).max(1440).default(60),
    /** 2.6% of posted hours reached 3,000 MW over 2026-04-22..09-14. */
    loadShedAlertMw: z.number().int().min(100).max(10_000).default(3000),
    loadShedClearMw: z.number().int().min(0).max(10_000).default(2500),
    loadShedEscalationMw: z.number().int().min(100).max(5000).default(500),
    loadShedRealertHours: z.number().int().min(1).max(48).default(3),
    /** Twice in the year to 2026-09-14; the 2022-10-04 collapse was 7,176 MW. */
    generationDropAlertMw: z.number().int().min(500).max(10_000).default(2000),
    /**
     * Articles published before this instant are never announced. Set on the
     * first scheduler run, so switching the feature on does not post the backlog.
     */
    newsSince: z.string().datetime().nullable().default(null),
  })
  .refine((c) => c.loadShedClearMw < c.loadShedAlertMw, {
    message: 'loadShedClearMw must be below loadShedAlertMw',
    path: ['loadShedClearMw'],
  });

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = runtimeConfigSchema.parse({});

export function getRuntimeConfig(): Promise<RuntimeConfig> {
  return readSetting(SETTING_KEYS.config, runtimeConfigSchema, DEFAULT_RUNTIME_CONFIG);
}

/**
 * Merge a change into the stored config. Validated as a whole, so a patch that
 * would leave the clear threshold above the alert threshold is refused.
 */
export async function updateRuntimeConfig(
  patch: Partial<RuntimeConfig>,
): Promise<{ ok: true; config: RuntimeConfig } | { ok: false; error: string }> {
  const current = await getRuntimeConfig();
  const next = runtimeConfigSchema.safeParse({ ...current, ...patch });
  if (!next.success) return { ok: false, error: next.error.issues.map((i) => i.message).join('; ') };
  await writeSetting(SETTING_KEYS.config, next.data);
  return { ok: true, config: next.data };
}
