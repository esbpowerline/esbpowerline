import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateProdEnv } from '@/lib/env-guard';

/**
 * The guard runs in the instrumentation hook, so a throw takes down every
 * server-rendered route while the build and every static route stay green.
 * These tests pin which names are worth that and which are not.
 */

const NAMES = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'CSRF_SECRET',
];

const saved: Record<string, string | undefined> = {};

function setProdEnv(overrides: Record<string, string | undefined>) {
  vi.stubEnv('NODE_ENV', 'production');
  for (const name of NAMES) {
    const value = name in overrides ? overrides[name] : 'set';
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

beforeEach(() => {
  for (const name of [...NAMES, 'NODE_ENV']) saved[name] = process.env[name];
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const name of NAMES) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name]!;
  }
});

describe('validateProdEnv', () => {
  it('passes when the fatal names are all set', () => {
    setProdEnv({});
    expect(() => validateProdEnv()).not.toThrow();
  });

  it.each(['DATABASE_URL', 'AUTH_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'])(
    'throws when %s is missing — there is no working behaviour without it',
    (name) => {
      setProdEnv({ [name]: undefined });
      expect(() => validateProdEnv()).toThrow(name);
    },
  );

  it('reports every missing fatal name at once, not just the first', () => {
    setProdEnv({ DATABASE_URL: undefined, AUTH_SECRET: undefined });
    expect(() => validateProdEnv()).toThrow(/DATABASE_URL.*AUTH_SECRET/);
  });

  it('warns but does not throw when CRON_SECRET is missing — the cron routes fail closed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setProdEnv({ CRON_SECRET: undefined });
    expect(() => validateProdEnv()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('CRON_SECRET'));
    warn.mockRestore();
  });

  it('warns but does not throw when NEXT_PUBLIC_SITE_URL is missing — every call site has a fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setProdEnv({ NEXT_PUBLIC_SITE_URL: undefined });
    expect(() => validateProdEnv()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('NEXT_PUBLIC_SITE_URL'));
    warn.mockRestore();
  });

  it('ignores CSRF_SECRET, which nothing outside the guard ever read', () => {
    setProdEnv({ CSRF_SECRET: undefined });
    expect(() => validateProdEnv()).not.toThrow();
  });

  it('does nothing outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const name of NAMES) delete process.env[name];
    expect(() => validateProdEnv()).not.toThrow();
  });
});
