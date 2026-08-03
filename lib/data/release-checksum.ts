import { createHash } from 'node:crypto';

/**
 * Content hash for a release payload.
 *
 * Kept out of the 'use server' action module for two reasons: a Server Actions
 * file may only export async functions, and scripts (the local ingest bridge,
 * tests) need this without dragging in Prisma and the auth stack.
 */
export function payloadChecksum(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex');
}

/**
 * JSON.stringify with sorted keys. Plain stringify would hash differently
 * whenever the parser happened to emit keys in another order, making every
 * re-parse look like a change.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}
