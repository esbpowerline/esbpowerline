import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // DIRECT_URL first, and only then the pooled URL.
    //
    // DATABASE_URL is Supabase's transaction pooler (port 6543). The pooler
    // cannot hold the session-level advisory locks the schema engine takes, so
    // every migrate command against it dies with a bare "Schema engine error"
    // that names neither the pooler nor the lock — `migrate status` and
    // `migrate diff` both failed that way on 2026-09-05 while the application
    // itself was connecting fine. Migrations need the direct connection on
    // 5432; the runtime client keeps using the pooler through
    // lib/prisma-database.ts, which is the right split.
    url:
      process.env.DIRECT_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/postgres',
  },
});