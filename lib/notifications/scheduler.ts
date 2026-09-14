import 'server-only';

/**
 * One notification cycle: what the five-minute cron runs.
 *
 *   lease → initialise → reconcile articles → grid producers → deliver → heartbeat
 *
 * The lease keeps two overlapping runs from evaluating the alert state machines
 * at once. Each producer runs in its own try/catch and records its own error,
 * so a grid query that times out does not stop articles from being delivered.
 *
 * Producers only run while Telegram is enabled (or in dry run). Events created
 * while sending is switched off would sit in the queue and post in a burst
 * the moment it came back on.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { reconcileArticles, type ReconcileSummary } from '@/lib/notifications/articles';
import { getRuntimeConfig, readTelegramEnv, updateRuntimeConfig, type RuntimeConfig } from '@/lib/notifications/config';
import { emitEvent } from '@/lib/notifications/events';
import {
  INITIAL_GENERATION_DROP_STATE,
  INITIAL_LOAD_SHED_STATE,
  evaluateGenerationDrop,
  evaluateLoadShed,
} from '@/lib/notifications/grid/alerts';
import { buildDailySummaryPayload } from '@/lib/notifications/grid/daily';
import { generationHoursSince, loadShedHoursSince, readNewestHour } from '@/lib/notifications/grid/snapshot';
import { errorText, logNotification } from '@/lib/notifications/log';
import { processDueDeliveries, type ProcessSummary } from '@/lib/notifications/processor';
import { SETTING_KEYS, acquireLease, readSetting, releaseLease, writeSetting } from '@/lib/notifications/store';
import { PRIORITY } from '@/lib/notifications/types';

const HOUR_MS = 3_600_000;
const LEASE_TTL_MS = 4 * 60_000;

const hourlyLastSchema = z.object({ observedAt: z.string().datetime(), emittedAt: z.string().datetime() }).nullable();
const loadShedStateSchema = z.object({
  active: z.boolean(),
  lastAlertedMw: z.number().nullable(),
  lastAlertAt: z.string().nullable(),
  lastObservedAt: z.string().nullable(),
});
const dropStateSchema = z.object({ lastObservedAt: z.string().nullable() });

export interface CycleSummary {
  runId: string;
  trigger: string;
  startedAt: string;
  finishedAt: string;
  leaseHeld: boolean;
  initialised: boolean;
  producing: boolean;
  reconcile: ReconcileSummary | null;
  hourly: string;
  alerts: number;
  daily: string;
  process: ProcessSummary | null;
  errors: string[];
}

export const heartbeatSchema = z.object({
  at: z.string().datetime(),
  runId: z.string(),
  trigger: z.string(),
  leaseHeld: z.boolean(),
  producing: z.boolean(),
  claimed: z.number().int(),
  sent: z.number().int(),
  failed: z.number().int(),
  blockedReason: z.string().nullable(),
  errors: z.array(z.string()),
});
export type Heartbeat = z.infer<typeof heartbeatSchema>;

export async function produceHourly(config: RuntimeConfig, now: Date): Promise<string> {
  if (!config.gridHourly) return 'disabled';
  const snap = await readNewestHour();
  if (!snap) return 'no stored hour';
  const age = now.getTime() - new Date(snap.observedAt).getTime();
  if (age > config.gridMaxAgeHours * HOUR_MS) {
    logNotification('grid.hourly_skipped', { observedAt: snap.observedAt, reason: 'stale', ageHours: Math.round(age / HOUR_MS) });
    return 'stale';
  }
  const last = await readSetting(SETTING_KEYS.hourlyLast, hourlyLastSchema, null);
  if (last && last.observedAt >= snap.observedAt) return 'no new hour';
  if (last && now.getTime() - new Date(last.emittedAt).getTime() < config.hourlyMinIntervalMinutes * 60_000) return 'within interval';
  await emitEvent({
    type: 'GRID_HOURLY_SNAPSHOT',
    dedupeKey: `grid.hourly:${snap.observedAt}`,
    entityId: snap.observedAt,
    payload: snap,
    destinations: ['public'],
  });
  // Written after the emit: if this write fails, the next run re-emits the same
  // key, which is one row.
  await writeSetting(SETTING_KEYS.hourlyLast, { observedAt: snap.observedAt, emittedAt: now.toISOString() });
  return 'queued';
}

export async function produceAlerts(config: RuntimeConfig, now: Date): Promise<number> {
  if (!config.gridAlerts) return 0;
  const window = config.gridMaxAgeHours * HOUR_MS;
  const fresh = (at: Date) => now.getTime() - at.getTime() <= window;
  let emitted = 0;

  // Load shed: every new hour, in order — NLDC posts in batches, and the
  // newest hour of a batch is not the only one that matters.
  let shed = await readSetting(SETTING_KEYS.alertState('HIGH_LOAD_SHED'), loadShedStateSchema, INITIAL_LOAD_SHED_STATE);
  const shedFrom = shed.lastObservedAt ? new Date(shed.lastObservedAt) : new Date(now.getTime() - window);
  for (const h of await loadShedHoursSince(shedFrom)) {
    const decision = evaluateLoadShed(shed, h, config);
    shed = decision.state;
    if (decision.alert && fresh(h.observedAt)) {
      const iso = h.observedAt.toISOString();
      await emitEvent({
        type: 'GRID_ALERT',
        dedupeKey: `grid.alert:HIGH_LOAD_SHED:${decision.alert.transition}:${iso}`,
        entityId: iso,
        payload: {
          rule: 'HIGH_LOAD_SHED',
          transition: decision.alert.transition,
          observedAt: iso,
          valueMw: decision.alert.valueMw,
          thresholdMw: decision.alert.thresholdMw,
          previousMw: decision.alert.previousMw,
        },
        destinations: ['public'],
        priority: PRIORITY.breaking,
      });
      logNotification('grid.alert_transition', { rule: 'HIGH_LOAD_SHED', transition: decision.alert.transition, observedAt: iso, valueMw: decision.alert.valueMw });
      emitted += 1;
    }
  }
  await writeSetting(SETTING_KEYS.alertState('HIGH_LOAD_SHED'), shed);

  let drop = await readSetting(SETTING_KEYS.alertState('GENERATION_DROP'), dropStateSchema, INITIAL_GENERATION_DROP_STATE);
  const dropFrom = drop.lastObservedAt ? new Date(drop.lastObservedAt) : new Date(now.getTime() - window);
  const hours = await generationHoursSince(dropFrom);
  for (let i = 1; i < hours.length; i += 1) {
    const decision = evaluateGenerationDrop(drop, hours[i - 1], hours[i], config.generationDropAlertMw);
    drop = decision.state;
    if (decision.alert && fresh(hours[i].observedAt)) {
      const iso = hours[i].observedAt.toISOString();
      await emitEvent({
        type: 'GRID_ALERT',
        dedupeKey: `grid.alert:GENERATION_DROP:ENTER:${iso}`,
        entityId: iso,
        payload: {
          rule: 'GENERATION_DROP',
          transition: 'ENTER',
          observedAt: iso,
          valueMw: decision.alert.valueMw,
          thresholdMw: decision.alert.thresholdMw,
          previousMw: decision.alert.previousMw,
        },
        destinations: ['public'],
        priority: PRIORITY.breaking,
      });
      logNotification('grid.alert_transition', { rule: 'GENERATION_DROP', observedAt: iso, valueMw: decision.alert.valueMw });
      emitted += 1;
    }
  }
  await writeSetting(SETTING_KEYS.alertState('GENERATION_DROP'), drop);
  return emitted;
}

export async function produceDaily(config: RuntimeConfig, now: Date): Promise<string> {
  if (!config.dailySummary) return 'disabled';
  const payload = await buildDailySummaryPayload(now);
  if (!payload) return 'nothing to summarise';
  const res = await emitEvent({
    type: 'DAILY_GRID_SUMMARY',
    dedupeKey: `grid.daily:${payload.energyDay}`,
    entityId: payload.energyDay,
    payload,
    destinations: ['public'],
  });
  return res.created ? `queued ${payload.energyDay}` : `already queued ${payload.energyDay}`;
}

export async function runNotificationCycle(opts: { trigger: string; now?: Date }): Promise<CycleSummary> {
  const now = opts.now ?? new Date();
  const runId = randomUUID();
  const summary: CycleSummary = {
    runId,
    trigger: opts.trigger,
    startedAt: now.toISOString(),
    finishedAt: now.toISOString(),
    leaseHeld: false,
    initialised: false,
    producing: false,
    reconcile: null,
    hourly: 'not run',
    alerts: 0,
    daily: 'not run',
    process: null,
    errors: [],
  };

  if (!(await acquireLease(SETTING_KEYS.schedulerLease, runId, LEASE_TTL_MS))) {
    summary.leaseHeld = true;
    logNotification('scheduler.skipped', { runId, reason: 'another run holds the lease' });
    return summary;
  }

  const step = async <T>(name: string, fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (err) {
      summary.errors.push(`${name}: ${errorText(err, 300)}`);
      logNotification('scheduler.skipped', { runId, step: name, error: errorText(err) }, 'error');
      return null;
    }
  };

  try {
    let config = await getRuntimeConfig();
    if (!config.newsSince) {
      // The floor for announcements: nothing published before the first run
      // is ever posted, so turning the feature on never floods the channel.
      const res = await updateRuntimeConfig({ newsSince: now.toISOString() });
      if (res.ok) {
        config = res.config;
        summary.initialised = true;
        logNotification('config.changed', { runId, newsSince: now.toISOString(), by: 'first scheduler run' });
      }
    }
    const env = readTelegramEnv();
    summary.producing = env.processingAllowed && (env.enabled || env.dryRun);
    if (summary.producing) {
      summary.reconcile = await step('reconcile', () => reconcileArticles(config, now));
      summary.hourly = (await step('hourly', () => produceHourly(config, now))) ?? 'error';
      summary.alerts = (await step('alerts', () => produceAlerts(config, now))) ?? 0;
      summary.daily = (await step('daily', () => produceDaily(config, now))) ?? 'error';
    }
    summary.process = await step('process', () => processDueDeliveries({ limit: 10, trigger: opts.trigger, runId }));
  } finally {
    summary.finishedAt = new Date().toISOString();
    const p = summary.process;
    const heartbeat: Heartbeat = {
      at: summary.finishedAt,
      runId,
      trigger: opts.trigger,
      leaseHeld: false,
      producing: summary.producing,
      claimed: p?.claimed ?? 0,
      sent: p?.sent ?? 0,
      failed: (p?.dead ?? 0) + (p?.uncertain ?? 0),
      blockedReason: p?.blockedReason ?? null,
      errors: summary.errors.slice(0, 5),
    };
    await writeSetting(SETTING_KEYS.heartbeat, heartbeat).catch(() => undefined);
    await releaseLease(SETTING_KEYS.schedulerLease, runId);
    logNotification('scheduler.run', {
      runId,
      trigger: opts.trigger,
      producing: summary.producing,
      hourly: summary.hourly,
      alerts: summary.alerts,
      daily: summary.daily,
      sent: p?.sent ?? 0,
      claimed: p?.claimed ?? 0,
      errors: summary.errors.length,
    });
  }
  return summary;
}
