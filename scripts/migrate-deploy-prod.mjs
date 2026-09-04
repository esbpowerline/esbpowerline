/**
 * Production migrate deploy — uses DIRECT_URL (Supabase session pooler :5432 on Vercel).
 * Auto-baselines when the DB already has tables (Prisma P3005).
 */
import { spawnSync } from 'child_process';
import { readdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import { setTimeout as sleep } from 'timers/promises';
import { parse } from 'dotenv';
import { resolveMigrationDatabaseUrl } from './resolve-migration-database-url.mjs';

function readEnvValue(file, key) {
  if (!existsSync(file)) return '';
  try {
    return parse(readFileSync(file))[key]?.trim() ?? '';
  } catch {
    return '';
  }
}

function getNonEmptyEnv(key) {
  const val = process.env[key]?.trim();
  if (val) return val;
  
  const fromFile =
    readEnvValue('.env.production.local', key) ||
    readEnvValue('.env.local', key) ||
    readEnvValue('.env', key);

  if (fromFile && key === 'DATABASE_URL' && fromFile.startsWith('file:')) {
    return '';
  }
  return fromFile;
}

const directUrl = getNonEmptyEnv('DIRECT_URL') || getNonEmptyEnv('POSTGRES_URL_NON_POOLING');
const databaseUrl = getNonEmptyEnv('DATABASE_URL') || getNonEmptyEnv('POSTGRES_PRISMA_URL');

const migrationsDir = 'prisma/migrations';

const RETRY_MARKERS = ['EMAXCONNSESSION', 'too many clients', 'P1001', 'P1002', 'P1017'];
const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [3000, 5000, 8000, 12000, 15000];

let migrationDatabaseUrl;
try {
  const resolved = resolveMigrationDatabaseUrl(directUrl || databaseUrl);
  migrationDatabaseUrl = resolved.url;
  if (!migrationDatabaseUrl) {
    console.error(
      '❌ DIRECT_URL/DATABASE_URL is required for production migrations (Supabase session pooler :5432).',
    );
    process.exit(1);
  }
  console.log(
    `[migrate-deploy-prod] using ${resolved.mode} host ${resolved.host ?? '(unknown)'}${resolved.rewritten ? ' (normalized)' : ''}`,
  );
} catch (error) {
  console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

function migrationNames() {
  const root = path.join(process.cwd(), migrationsDir);
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function runPrisma(args, { inherit = false } = {}) {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return spawnSync(cmd, ['prisma', ...args], {
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
    env: {
      ...process.env,
      DATABASE_URL: migrationDatabaseUrl,
      // DIRECT_URL is overridden with the SAME resolved URL, not left as it was
      // found. prisma.config.ts prefers DIRECT_URL for migrations (the
      // transaction pooler cannot hold the schema engine's advisory locks), so
      // leaving the raw value here would let the config silently win over this
      // script and skip everything resolveMigrationDatabaseUrl does — the
      // db.<ref>.supabase.co → pooler host rewrite that Vercel needs without
      // the IPv4 add-on, and connection_limit=1. Both variables must name the
      // one URL this script decided on.
      DIRECT_URL: migrationDatabaseUrl,
      PRISMA_MIGRATIONS_DIR: migrationsDir,
    },
    shell: process.platform === 'win32',
  });
}

function deploy() {
  return runPrisma(['migrate', 'deploy']);
}

function deployOutput(result) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

let result = deploy();
process.exit(result.status ?? 1);