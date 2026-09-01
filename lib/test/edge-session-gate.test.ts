import { describe, it, expect } from 'vitest';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { resolveEdgeSession } from '@/lib/supabase/edge-session-gate';

// The attack this file pins down: user_metadata is writable by the account holder via
// supabase.auth.updateUser(), and the live profiles table has no status column. Until
// app_metadata.status existed, a suspended user holding a still-valid access token could
// set their own user_metadata.status back to ACTIVE and walk through the middleware gate.

function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'staff@example.com',
    user_metadata: {},
    app_metadata: {},
    ...overrides,
  } as User;
}

function fakeSupabase(profileRow: { role: string | null; status?: string | null } | null) {
  const result = { data: profileRow, error: null };
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => result,
  };
  return { from: () => query } as unknown as SupabaseClient;
}

describe('resolveEdgeSession status checks', () => {
  it('blocks when app_metadata.status is SUSPENDED even if the user rewrote user_metadata to ACTIVE', async () => {
    const user = fakeUser({
      user_metadata: { status: 'ACTIVE' }, // the user-writable field, "cleared" by the attacker
      app_metadata: { status: 'SUSPENDED', role: 'ADMIN' }, // service-role-only mirror
    });
    const session = await resolveEdgeSession(user, fakeSupabase({ role: 'ADMIN' }));
    expect(session).toEqual({ active: false, role: null, gridPlan: 'none' });
  });

  it('blocks when app_metadata.status is PENDING', async () => {
    const user = fakeUser({ app_metadata: { status: 'PENDING', role: 'AUTHOR' } });
    const session = await resolveEdgeSession(user, fakeSupabase({ role: 'AUTHOR' }));
    expect(session.active).toBe(false);
  });

  it('still blocks on user_metadata.status alone (legacy suspensions predating the mirror)', async () => {
    const user = fakeUser({
      user_metadata: { status: 'SUSPENDED' },
      app_metadata: { role: 'EDITOR' },
    });
    const session = await resolveEdgeSession(user, fakeSupabase({ role: 'EDITOR' }));
    expect(session.active).toBe(false);
  });

  it('admits an active user and resolves role and plan', async () => {
    const user = fakeUser({
      user_metadata: { status: 'ACTIVE' },
      app_metadata: { status: 'ACTIVE', role: 'EDITOR', grid_plan: 'none' },
    });
    const session = await resolveEdgeSession(user, fakeSupabase({ role: 'EDITOR' }));
    expect(session).toMatchObject({ active: true, role: 'EDITOR' });
  });

  it('does not treat an absent status as inactive', async () => {
    const user = fakeUser({ app_metadata: { role: 'ADMIN' } });
    const session = await resolveEdgeSession(user, fakeSupabase({ role: 'ADMIN' }));
    expect(session.active).toBe(true);
  });
});
