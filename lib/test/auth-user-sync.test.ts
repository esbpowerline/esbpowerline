import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  syncAuthUserStatusWithClient,
  syncAuthUserMetadataWithClient,
} from '@/lib/supabase/auth-user-sync';

// Suspension must land in app_metadata (service-role-only writable); user_metadata alone
// is clearable by the suspended user. And every app_metadata write must spread the
// existing object — a bare { role } wipes grid_plan and status for anyone whose profile
// gets edited after suspension.

function fakeAdmin(existingUser: {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}) {
  const updateUserById = vi.fn(async () => ({ data: {}, error: null }));
  const profileUpdate = {
    update: () => ({ eq: async () => ({ error: null }) }),
    upsert: async () => ({ error: null }),
  };
  const admin = {
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [existingUser] }, error: null }),
        getUserById: async () => ({ data: { user: existingUser }, error: null }),
        updateUserById,
      },
    },
    from: () => profileUpdate,
  } as unknown as SupabaseClient;
  return { admin, updateUserById };
}

describe('syncAuthUserStatusWithClient', () => {
  it('mirrors SUSPENDED into app_metadata, preserving existing service-role claims', async () => {
    const { admin, updateUserById } = fakeAdmin({
      id: 'u1',
      email: 'staff@example.com',
      user_metadata: { name: 'Staff' },
      app_metadata: { role: 'EDITOR', grid_plan: 'pro' },
    });

    await syncAuthUserStatusWithClient(admin, 'staff@example.com', 'SUSPENDED');

    expect(updateUserById).toHaveBeenCalledWith('u1', {
      user_metadata: { name: 'Staff', status: 'SUSPENDED' },
      app_metadata: { role: 'EDITOR', grid_plan: 'pro', status: 'SUSPENDED' },
    });
  });
});

describe('syncAuthUserMetadataWithClient', () => {
  it('does not wipe grid_plan or a standing suspension when a profile edit omits status', async () => {
    const { admin, updateUserById } = fakeAdmin({
      id: 'u1',
      email: 'staff@example.com',
      app_metadata: { role: 'EDITOR', grid_plan: 'pro', status: 'SUSPENDED' },
    });

    await syncAuthUserMetadataWithClient(admin, {
      email: 'staff@example.com',
      name: 'New Name',
      role: 'EDITOR',
      // status deliberately omitted — the caller only changed the display name
    });

    const call = updateUserById.mock.calls[0] as unknown[];
    const payload = call[1] as { app_metadata: Record<string, unknown> };
    expect(payload.app_metadata).toMatchObject({
      role: 'EDITOR',
      grid_plan: 'pro',
      status: 'SUSPENDED',
    });
  });
});
