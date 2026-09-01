import 'server-only';

import type { Role } from '@/lib/constants';
import { createServiceRoleClient } from '@/lib/supabase/admin-client';
import {
  invalidateAuthSessionWithClient,
  syncAuthUserMetadataWithClient,
  syncAuthUserStatusWithClient,
  syncGridPlanMetadataWithClient,
  upsertAuthUserWithClient,
  type AuthMetadataSyncInput,
  type AuthUserSyncInput,
  type UserStatus,
} from '@/lib/supabase/auth-user-sync';

export type { UserStatus };

/** Create or update a Supabase Auth user with role metadata (service role required). */
export async function upsertSupabaseAuthUser(input: AuthUserSyncInput): Promise<string | null> {
  const admin = createServiceRoleClient();
  if (!admin) {
    console.warn('[upsertSupabaseAuthUser] Supabase service role not configured — skipping sync');
    return null;
  }
  return upsertAuthUserWithClient(admin, input);
}

/** Update Supabase Auth metadata when Prisma user profile changes (no password change). */
export async function syncSupabaseAuthUserMetadata(input: AuthMetadataSyncInput): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) {
    console.warn('[syncSupabaseAuthUserMetadata] Supabase service role not configured — skipping sync');
    return;
  }
  await syncAuthUserMetadataWithClient(admin, input);
}

/** Sync grid plan to Supabase app_metadata (edge tier enforcement). */
export async function syncSupabaseGridPlan(email: string, gridPlan: string): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) return;
  await syncGridPlanMetadataWithClient(admin, email, gridPlan);
}

/** Mirror account status to Supabase Auth + profiles (e.g. suspend). */
export async function syncSupabaseAuthUserStatus(email: string, status: UserStatus): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) {
    // A suspension that cannot reach Supabase leaves the account fully privileged at the
    // edge while the admin UI reports success. Fail loudly instead: updateUser() catches
    // this, rolls the Prisma write back and surfaces the error, so the two stores never
    // silently disagree about whether someone is suspended.
    if (status === 'SUSPENDED') {
      throw new Error(
        'Supabase service role not configured — refusing to report a suspension that did not propagate',
      );
    }
    console.warn('[syncSupabaseAuthUserStatus] Supabase service role not configured — skipping sync');
    return;
  }
  await syncAuthUserStatusWithClient(admin, email, status);
}

/** Immediately invalidate all active sessions for a user (used for demotions/suspensions). */
export async function invalidateSupabaseAuthSession(email: string): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) return;
  await invalidateAuthSessionWithClient(admin, email);
}