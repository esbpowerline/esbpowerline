import type { SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '@/lib/constants';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export type AuthUserSyncInput = {
  email: string;
  password: string;
  name: string;
  role: Role;
  status?: UserStatus;
  /**
   * When the address already has an Auth user, overwrite its password and
   * role (default) or refuse. Registration passes `false`: a self-serve form
   * must never be able to reset the password of an account that already
   * exists — a deleted-staff or auth-only identity has no Prisma row, so the
   * database uniqueness check cannot catch it (audit finding, 2026-08-08).
   */
  allowExistingOverwrite?: boolean;
};

export type AuthMetadataSyncInput = {
  email: string;
  name: string;
  role: Role;
  status?: UserStatus;
};

async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  // Page through the directory. A single page of 200 meant that once the
  // member base passed 200 accounts, suspension and password sync silently
  // no-opped for everyone beyond it (audit finding, 2026-08-08).
  const wanted = email.toLowerCase();
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((user) => user.email?.toLowerCase() === wanted);
    if (hit) return hit.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

function buildMetadata(input: { name: string; status?: UserStatus }) {
  return {
    name: input.name,
    full_name: input.name,
    status: input.status ?? 'ACTIVE',
  };
}

async function syncProfilesRow(
  admin: SupabaseClient,
  userId: string,
  input: { name: string; role: Role },
) {
  const { error } = await admin.from('profiles').upsert({
    id: userId,
    full_name: input.name,
    role: input.role,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.warn('[syncProfilesRow] profiles upsert skipped:', error.message);
  }
}

/** Create or update a Supabase Auth user with role metadata (service-role client required). */
export async function upsertAuthUserWithClient(
  admin: SupabaseClient,
  input: AuthUserSyncInput,
): Promise<string | null> {
  const metadata = buildMetadata(input);

  const { error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: { role: input.role, status: input.status ?? 'ACTIVE' },
  });

  if (!createError) {
    const createdId = await findUserIdByEmail(admin, input.email);
    if (createdId) await syncProfilesRow(admin, createdId, input);
    return createdId;
  }

  if (!createError.message.toLowerCase().includes('already')) {
    throw createError;
  }
  if (input.allowExistingOverwrite === false) {
    throw new Error('EMAIL_ALREADY_REGISTERED');
  }

  const userId = await findUserIdByEmail(admin, input.email);
  if (!userId) {
    throw new Error(`Supabase user exists but could not be found: ${input.email}`);
  }

  const { data: current } = await admin.auth.admin.getUserById(userId);
  const currentAppMeta = current.user?.app_metadata ?? {};

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: input.password,
    email_confirm: true,
    user_metadata: metadata,
    // Spread the existing app_metadata so grid_plan (and any other service-role claim)
    // survives — a bare { role } here would drop the tier the edge middleware gates on.
    app_metadata: {
      ...currentAppMeta,
      role: input.role,
      status: input.status ?? currentAppMeta.status ?? 'ACTIVE',
    },
  });
  if (updateError) throw updateError;

  await syncProfilesRow(admin, userId, input);
  return userId;
}

/** Update Supabase Auth metadata when profile changes (no password change). */
export async function syncAuthUserMetadataWithClient(
  admin: SupabaseClient,
  input: AuthMetadataSyncInput,
): Promise<void> {
  const userId = await findUserIdByEmail(admin, input.email);
  if (!userId) {
    throw new Error(`Supabase user not found for metadata sync: ${input.email}`);
  }

  const { data: current } = await admin.auth.admin.getUserById(userId);
  const currentAppMeta = current.user?.app_metadata ?? {};

  const metadata = buildMetadata(input);
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
    // Spread — see upsertAuthUserWithClient. A bare { role } would wipe grid_plan/status.
    app_metadata: {
      ...currentAppMeta,
      role: input.role,
      status: input.status ?? currentAppMeta.status ?? 'ACTIVE',
    },
  });
  if (error) throw error;

  await syncProfilesRow(admin, userId, input);
}

/** Mirror account status to Supabase Auth + profiles (e.g. suspend). */
export async function syncAuthUserStatusWithClient(
  admin: SupabaseClient,
  email: string,
  status: UserStatus,
): Promise<void> {
  const userId = await findUserIdByEmail(admin, email);
  if (!userId) return;

  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const meta = existing.user?.user_metadata ?? {};
  const appMeta = existing.user?.app_metadata ?? {};

  // Status must land in app_metadata, not only user_metadata: user_metadata is writable by
  // the user themselves via supabase.auth.updateUser(), so a suspended user holding a
  // still-valid token could clear their own suspension flag. app_metadata only accepts
  // service-role writes. The live profiles table has no status column (the Prisma Profile
  // model never had one), so before this mirror existed, user_metadata.status was the ONLY
  // per-request suspension signal the edge gate could see.
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...meta,
      status,
    },
    app_metadata: {
      ...appMeta,
      status,
    },
  });
  if (error) throw error;

  const { error: profileError } = await admin
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (profileError) {
    console.warn('[syncAuthUserStatusWithClient] profiles update skipped:', profileError.message);
  }
}

/** Sync grid archive plan to Supabase app_metadata for edge middleware tier checks. */
export async function syncGridPlanMetadataWithClient(
  admin: SupabaseClient,
  email: string,
  gridPlan: string,
): Promise<void> {
  const userId = await findUserIdByEmail(admin, email);
  if (!userId) return;

  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const appMeta = existing.user?.app_metadata ?? {};

  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...appMeta,
      grid_plan: gridPlan,
    },
  });
  if (error) throw error;
}

/** Immediately invalidate all active sessions for a user (demotions/suspensions). */
export async function invalidateAuthSessionWithClient(
  admin: SupabaseClient,
  email: string,
): Promise<void> {
  const userId = await findUserIdByEmail(admin, email);
  if (!userId) return;

  const { error } = await admin.auth.admin.signOut(userId, 'global');
  if (error) {
    console.warn(`[invalidateAuthSessionWithClient] Failed to sign out ${email}:`, error.message);
  }
}