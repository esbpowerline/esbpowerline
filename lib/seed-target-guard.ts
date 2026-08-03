import { resolveDatabaseUrl } from './prisma-database';

/** Hosts we consider a throwaway local database. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal']);

export function databaseHost(url = resolveDatabaseUrl()): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '(unparseable)';
  }
}

export function isLocalDatabase(url = resolveDatabaseUrl()): boolean {
  return LOCAL_HOSTS.has(databaseHost(url));
}

/**
 * Refuse a destructive seed unless it targets a local database.
 *
 * The previous guard keyed off `NODE_ENV === 'production'`, but no npm script
 * sets NODE_ENV — so `npm run db:seed` sailed past it and ran `deleteMany()`
 * across 17 tables against whatever DATABASE_URL pointed at, which in this repo
 * is the live Supabase project. Gate on the *target* instead of the mode.
 */
export function assertSafeSeedTarget(scriptName: string): void {
  if (process.env.ALLOW_PRODUCTION_SEED === 'true') {
    console.warn(
      `⚠️  ${scriptName}: ALLOW_PRODUCTION_SEED=true — seeding ${databaseHost()} anyway.`,
    );
    return;
  }
  if (isLocalDatabase()) return;

  console.error(
    [
      `❌ Refusing to run ${scriptName}: DATABASE_URL points at "${databaseHost()}", not a local database.`,
      '   This script deletes every row in 17 tables and resets staff passwords.',
      '   If you really mean to target that database, re-run with ALLOW_PRODUCTION_SEED=true.',
    ].join('\n'),
  );
  process.exit(1);
}
