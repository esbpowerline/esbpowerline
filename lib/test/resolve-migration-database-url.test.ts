import { describe, expect, it } from 'vitest';
import { resolveMigrationDatabaseUrl } from '../../scripts/resolve-migration-database-url.mjs';

describe('resolveMigrationDatabaseUrl', () => {
  it('normalizes Supabase session pooler with connection_limit=1 (Vercel default)', () => {
    const pooler =
      'postgresql://postgres.testprojectref:secret@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';
    const { url, rewritten, host, mode } = resolveMigrationDatabaseUrl(pooler, {
      useDirectHost: false,
    });
    expect(mode).toBe('session-pooler');
    expect(rewritten).toBe(true);
    expect(host).toBe('aws-1-ap-northeast-1.pooler.supabase.com');
    expect(url).toContain('pooler.supabase.com:5432/postgres');
    expect(url).toContain('postgres.testprojectref');
    expect(url).toContain('connection_limit=1');
    expect(url).toContain('connect_timeout=30');
  });

  it('can rewrite to direct db host when explicitly enabled', () => {
    const pooler =
      'postgresql://postgres.testprojectref:secret@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';
    const { url, rewritten, host, mode } = resolveMigrationDatabaseUrl(pooler, {
      useDirectHost: true,
    });
    expect(mode).toBe('direct');
    expect(rewritten).toBe(true);
    expect(host).toBe('db.testprojectref.supabase.co');
    expect(url).toContain('db.testprojectref.supabase.co:5432/postgres');
    expect(url).toContain('postgres:secret');
    expect(url).not.toContain('pooler.supabase.com');
  });

  it('leaves direct Supabase host unchanged', () => {
    const direct =
      'postgresql://postgres:secret@db.testprojectref.supabase.co:5432/postgres';
    const { url, rewritten, host, mode } = resolveMigrationDatabaseUrl(direct);
    expect(mode).toBe('direct');
    expect(rewritten).toBe(false);
    expect(host).toBe('db.testprojectref.supabase.co');
    expect(url).toBe(direct);
  });

  it('rejects transaction pooler port 6543', () => {
    const tx =
      'postgresql://postgres.testprojectref:secret@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    expect(() => resolveMigrationDatabaseUrl(tx)).toThrow(/6543/);
  });
});