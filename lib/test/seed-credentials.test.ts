import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MEMBER_DEMO_EMAIL,
  seedPasswordForEmail,
  devStaffLoginPasswordHint,
  isProductionSeedTarget,
} from '@/lib/seed-credentials';
import { EDITOR_EMAIL, MASTER_ADMIN_EMAIL } from '@/lib/staff-accounts';

describe('seed-credentials', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses per-account dev defaults against a local Supabase', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    expect(seedPasswordForEmail(MASTER_ADMIN_EMAIL)).toBe('admin007');
    expect(seedPasswordForEmail(EDITOR_EMAIL)).toBe('editor007');
    expect(seedPasswordForEmail(MEMBER_DEMO_EMAIL)).toBe('member007');
    expect(devStaffLoginPasswordHint()).toBe('admin007');
  });

  it('requires explicit env vars in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(seedPasswordForEmail(MASTER_ADMIN_EMAIL)).toBeNull();
    expect(seedPasswordForEmail(EDITOR_EMAIL)).toBeNull();
    expect(seedPasswordForEmail(MEMBER_DEMO_EMAIL)).toBeNull();
    expect(devStaffLoginPasswordHint()).toBeNull();
  });

  it('honors production MASTER_ADMIN_PASSWORD', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MASTER_ADMIN_PASSWORD', 'prod-admin-secret');
    expect(seedPasswordForEmail(MASTER_ADMIN_EMAIL)).toBe('prod-admin-secret');
  });

  it('treats a hosted Supabase project as production whatever NODE_ENV says', () => {
    // The seed script is plain tsx (no NODE_ENV) and .env.local points at the
    // live project: this is the exact combination the audit reproduced.
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abcdefghijkl.supabase.co');
    expect(isProductionSeedTarget()).toBe(true);
    expect(seedPasswordForEmail(MASTER_ADMIN_EMAIL)).toBeNull();
    expect(seedPasswordForEmail(EDITOR_EMAIL)).toBeNull();
    expect(devStaffLoginPasswordHint()).toBeNull();
    vi.stubEnv('MASTER_ADMIN_PASSWORD', 'explicit-secret');
    expect(seedPasswordForEmail(MASTER_ADMIN_EMAIL)).toBe('explicit-secret');
  });

  it('does not expose esbpowerline007 fallback', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    for (const email of [MASTER_ADMIN_EMAIL, EDITOR_EMAIL, MEMBER_DEMO_EMAIL]) {
      expect(seedPasswordForEmail(email)).not.toBe('esbpowerline007');
    }
  });
});