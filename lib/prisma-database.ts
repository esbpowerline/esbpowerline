import path from 'path';
import dotenv from 'dotenv';

try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
} catch (e) {}

export function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    const fallback = process.env.POSTGRES_PRISMA_URL?.trim() || process.env.POSTGRES_URL?.trim();
    if (!fallback) {
      // Fallback to local default PostgreSQL connection to prevent startup crashes
      return 'postgresql://postgres:postgres@localhost:5432/esbpowerline';
    }
    return fallback;
  }
  return raw;
}

export function isSqliteUrl(url: string): boolean {
  return false;
}

export function isPostgresUrl(url: string): boolean {
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

/** Supabase pooler TLS needs relaxed cert verification in serverless Node runtimes. */
export function createPgPoolConfig(connectionString: string) {
  let remote = true;
  let poolUrl = connectionString;

  try {
    const normalized = connectionString
      .replace(/^postgresql:\/\//, 'https://')
      .replace(/^postgres:\/\//, 'https://');
    const parsed = new URL(normalized);
    const host = parsed.hostname;
    remote = host !== 'localhost' && host !== '127.0.0.1';

    if (remote) {
      // sslmode=require in the URL forces strict verification — strip it and use Pool.ssl instead.
      parsed.searchParams.delete('sslmode');
      parsed.searchParams.delete('supa');
      const search = parsed.searchParams.toString();
      poolUrl = `postgresql://${parsed.username}:${parsed.password}@${parsed.host}${parsed.pathname}${search ? `?${search}` : ''}`;
    }
  } catch {
    remote = true;
  }

  return {
    connectionString: poolUrl,
    // Verify the pooler's certificate when its CA is supplied. Supabase's
    // pooler chain is signed by a project CA, not a public one — Node's bundled
    // store rejects it (`SELF_SIGNED_CERT_IN_CHAIN`, tested 2026-09-03) — so
    // verification needs the PEM from Dashboard → Database → SSL in
    // `PG_CA_CERT`. Without it the connection is still encrypted but the peer
    // is unverified, which the audit flagged; set the variable to close it.
    ssl: remote
      ? process.env.PG_CA_CERT?.trim()
        ? { rejectUnauthorized: true as const, ca: process.env.PG_CA_CERT.trim() }
        : { rejectUnauthorized: false as const }
      : undefined,
    max: process.env.NODE_ENV === 'production' ? 2 : 10,
    idleTimeoutMillis: 15000,
    // Fail fast when Supabase is slow or restricted. Without these bounds a
    // render waits on the pooler until Vercel kills the function: on
    // 2026-08-26 eleven article/category/tag renders each ran the full 300 s
    // ("Task timed out after 300 seconds") — 55 minutes of billed compute
    // that produced nothing — and on 2026-08-29..09-01 ISR revalidations
    // died with EAUTHTIMEOUT. Ten seconds to get a connection and fifteen
    // per statement is generous for this schema; past that the ISR layer
    // should serve the stale page it already has.
    /*
      Except during a build, where those ten seconds are the wrong trade.

      `next build` prerenders 379 pages across three workers, each worker
      holding this same two-connection pool, so every page queues behind the
      others. Ten seconds is generous for one render and nothing at all for a
      queue that deep: three production deploys in two days died here, each on
      a different reader — /about on `readSettingsMap`, then on
      `getPublicCategories` from the public layout — with the same
      `timeout exceeded when trying to connect` underneath.

      The reason the bound exists does not apply here. In a request it stops a
      render waiting on the pooler until Vercel kills the function, and the ISR
      layer has a stale page to serve meanwhile. A build has no stale page: the
      only outcomes are "wait" and "the deploy fails".

      So a build waits. Note what is NOT changed: `max` stays at 2. Raising it
      would take connections from the live site sharing this pooler — the exact
      trade refused when /about first failed. Queueing patiently costs the build
      time and the running site nothing.

      `NEXT_PHASE` is set by Next itself during `next build`, so this cannot
      leak into request handling.
    */
    connectionTimeoutMillis:
      process.env.NEXT_PHASE === 'phase-production-build' ? 120_000 : 10_000,
    query_timeout: 15_000,
    statement_timeout: 15_000,
  };
}

export function resolvePrismaSchemaProvider(databaseUrl?: string): 'sqlite' | 'postgresql' {
  return 'postgresql';
}

export function assertDatabaseUrlMatchesSchema(
  databaseUrl: string,
  provider: 'sqlite' | 'postgresql',
) {
  if (!isPostgresUrl(databaseUrl)) {
    throw new Error(
      'DATABASE_URL is not a postgresql:// URL. Please set DATABASE_URL to your Supabase pooler URL.'
    );
  }
}