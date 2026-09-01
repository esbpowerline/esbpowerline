import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Role } from '@/lib/constants';
import { parseGridPlanId } from '@/lib/data/grid/grid-tier-access';
import { resolveRoleFromSupabaseUser } from '@/lib/supabase/resolve-role';
import type { GridPlanId } from '@/lib/membership/grid-plans';

const INACTIVE_STATUSES = new Set(['SUSPENDED', 'PENDING']);

function metadataStatus(user: User): string | undefined {
  const value = user.user_metadata?.status;
  return typeof value === 'string' ? value : undefined;
}

// The authoritative status signal. user_metadata is writable by the user themselves
// (supabase.auth.updateUser), so on its own it let a suspended user with a still-valid
// token clear their suspension at the edge; profiles has no status column to back it up.
// app_metadata accepts service-role writes only — syncAuthUserStatusWithClient mirrors
// suspension here. Both are still checked: either saying inactive means inactive.
function appMetadataStatus(user: User): string | undefined {
  const value = user.app_metadata?.status;
  return typeof value === 'string' ? value : undefined;
}

type ProfileGateRow = { role: string | null; status?: string | null };

async function loadProfileRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileGateRow | null> {
  const withStatus = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', userId)
    .maybeSingle();

  if (!withStatus.error) {
    return withStatus.data as ProfileGateRow | null;
  }

  const roleOnly = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (roleOnly.error) return null;
  return roleOnly.data as ProfileGateRow | null;
}

/**
 * Edge-safe session gate for middleware.ts — profiles + app_metadata only (no Prisma).
 */
function resolveGridPlanFromUser(user: User): GridPlanId {
  const appPlan = user.app_metadata?.grid_plan;
  if (typeof appPlan === 'string') return parseGridPlanId(appPlan);
  return 'none';
}

export type EdgeSession = {
  active: boolean;
  role: Role | null;
  gridPlan: GridPlanId;
};

export async function resolveEdgeSession(
  user: User | null,
  supabase: SupabaseClient | null,
): Promise<EdgeSession> {
  if (!user || !supabase) return { active: false, role: null, gridPlan: 'none' };

  const appStatus = appMetadataStatus(user);
  if (appStatus && INACTIVE_STATUSES.has(appStatus)) {
    return { active: false, role: null, gridPlan: 'none' };
  }

  const metaStatus = metadataStatus(user);
  if (metaStatus && INACTIVE_STATUSES.has(metaStatus)) {
    return { active: false, role: null, gridPlan: 'none' };
  }

  const profile = await loadProfileRow(supabase, user.id);

  if (profile?.status && INACTIVE_STATUSES.has(profile.status)) {
    return { active: false, role: null, gridPlan: 'none' };
  }

  const role = resolveRoleFromSupabaseUser(user, profile?.role ?? null);
  if (!role) return { active: false, role: null, gridPlan: 'none' };

  return { active: true, role, gridPlan: resolveGridPlanFromUser(user) };
}