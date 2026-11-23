import type { User } from '@supabase/supabase-js';
import type { Role } from '@/lib/constants';

const VALID_ROLES = new Set<string>([
  'SUPER_ADMIN',
  'ADMIN',
  'EDITOR',
  'AUTHOR',
  'CONTRIBUTOR',
  'SUBSCRIBER',
]);

function normalizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null;
  const role = value.trim().toUpperCase();
  return VALID_ROLES.has(role) ? (role as Role) : null;
}

/**
 * Resolve the app role for a Supabase Auth user.
 *
 * app_metadata wins. Only the service role can write it (lib/supabase/auth-user-sync.ts sets
 * it on every create and role change), so a user cannot choose their own. profiles.role used
 * to win instead, and on 2026-11-23 the live handle_new_user() trigger was found filling it
 * from raw_user_meta_data — the sign-up payload — so anyone could sign up as SUPER_ADMIN.
 * The profile row is now only a fallback for the few early accounts created before
 * app_metadata.role existed.
 */
export function resolveRoleFromSupabaseUser(
  user:
    | Pick<User, 'user_metadata' | 'app_metadata'>
    | { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }
    | null
    | undefined,
  profileRole?: string | null,
): Role | null {
  return normalizeRole(user?.app_metadata?.role) ?? normalizeRole(profileRole);
}
