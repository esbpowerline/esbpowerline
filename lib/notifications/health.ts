import 'server-only';

/**
 * Integration health: the failures that retrying cannot fix.
 *
 * A 401 means the token is wrong, and every delivery after it will fail the
 * same way. Without a record of that, each cron run would claim ten rows,
 * burn an attempt on each against Telegram, and do it again five minutes
 * later. So a fatal integration error is recorded with a fingerprint of the
 * token it happened under, and the processor refuses to claim while the same
 * token is configured. Rotating the token — the fix — clears the block by
 * itself; so does an administrator.
 *
 * Destination errors (bot removed from the channel, chat not found) are
 * recorded for the dashboard but do not block: the test destination may still
 * work while the public one does not.
 */

import { createHash } from 'node:crypto';
import { z } from 'zod';
import { SETTING_KEYS, readSetting, writeSetting } from '@/lib/notifications/store';

const fatalRecord = z.object({
  kind: z.enum(['fatal_integration', 'fatal_destination']),
  code: z.string(),
  description: z.string(),
  destination: z.string().nullable(),
  at: z.string().datetime(),
  tokenFingerprint: z.string().nullable(),
});

const healthSchema = z.object({
  integration: fatalRecord.nullable().default(null),
  destinations: z.record(fatalRecord).default({}),
});

export type IntegrationHealth = z.infer<typeof healthSchema>;
const EMPTY: IntegrationHealth = { integration: null, destinations: {} };

/** A short, non-reversible fingerprint — enough to tell tokens apart, useless to an attacker. */
export function tokenFingerprint(token: string | null): string | null {
  return token ? createHash('sha256').update(token).digest('hex').slice(0, 12) : null;
}

export function getHealth(): Promise<IntegrationHealth> {
  return readSetting(SETTING_KEYS.health, healthSchema, EMPTY);
}

export async function recordFatal(
  kind: 'fatal_integration' | 'fatal_destination',
  info: { code: string; description: string; destination: string | null; token: string | null },
): Promise<void> {
  const health = await getHealth();
  const record = {
    kind,
    code: info.code,
    description: info.description,
    destination: info.destination,
    at: new Date().toISOString(),
    tokenFingerprint: tokenFingerprint(info.token),
  };
  if (kind === 'fatal_integration') health.integration = record;
  else if (info.destination) health.destinations[info.destination] = record;
  await writeSetting(SETTING_KEYS.health, health);
}

/** A successful send proves the token and that destination are fine again. */
export async function clearHealthFor(destination: string): Promise<void> {
  const health = await getHealth();
  if (!health.integration && !health.destinations[destination]) return;
  health.integration = null;
  delete health.destinations[destination];
  await writeSetting(SETTING_KEYS.health, health);
}

export async function clearAllHealth(): Promise<void> {
  await writeSetting(SETTING_KEYS.health, EMPTY);
}

/** Whether a recorded 401 still applies to the token configured now. */
export function integrationBlocked(health: IntegrationHealth, token: string | null): boolean {
  return Boolean(health.integration && health.integration.tokenFingerprint === tokenFingerprint(token));
}
