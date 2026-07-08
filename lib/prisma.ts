import 'server-only';
import 'dotenv/config';
import { PrismaClient, type Prisma } from '@prisma/client';
import {
  createPgPoolConfig,
  resolveDatabaseUrl,
} from './prisma-database';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// REMINDER: Ensure DATABASE_URL uses the Supabase Transaction Pooler (port 6543)
// instead of the direct connection string to prevent pool exhaustion.
function createPrismaClient() {
  const databaseUrl = resolveDatabaseUrl();
  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

  const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg');
  const { Pool } = require('pg') as typeof import('pg');
  const pool = new Pool(createPgPoolConfig(databaseUrl));
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter, log });
}

/** Dev hot-reload can keep an old client after schema changes — recreate if models are missing */
function isPrismaClientCurrent(client: PrismaClient): boolean {
  return (
    'savedItem' in client &&
    'memberDownload' in client &&
    'user' in client &&
    'contactMessage' in client &&
    'memberGridSubscription' in client
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && isPrismaClientCurrent(cached)) {
    return cached;
  }
  if (cached) {
    console.warn('[prisma] Outdated client detected on hot-reload. Disconnecting old instance to prevent pool leakage...');
    cached.$disconnect().catch((err) => console.error('[prisma] Error disconnecting old client:', err));
  }
  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;