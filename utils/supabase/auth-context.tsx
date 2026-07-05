'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getSupabaseEnv } from '@/utils/supabase/env';
import { resolveRoleFromSupabaseUser } from '@/lib/supabase/resolve-role';
import type { Role } from '@/lib/constants';
import { parseGridPlanId } from '@/lib/data/grid/grid-tier-access';
import type { GridPlanId } from '@/lib/membership/grid-plans';
import {
  EDITOR_EMAIL,
  EDITOR_NAME,
  LEGACY_EDITOR_EMAIL,
  MASTER_ADMIN_EMAIL,
  MASTER_ADMIN_NAME,
} from '@/lib/staff-accounts';
import type { User } from '@supabase/supabase-js';

function resolveStaffDisplayName(email: string, fallback: string): string {
  const normalized = email.toLowerCase();
  if (normalized === EDITOR_EMAIL || normalized === LEGACY_EDITOR_EMAIL) return EDITOR_NAME;
  if (normalized === MASTER_ADMIN_EMAIL) return MASTER_ADMIN_NAME;
  return fallback;
}

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string | null;
  gridPlan?: GridPlanId;
};

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  data: { user: AuthUser } | null;
  status: AuthStatus;
  update: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  data: null,
  status: 'loading',
  update: async () => {},
});

const SESSION_BOOTSTRAP_TIMEOUT_MS = 10_000;

async function buildAuthUser(
  supabase: ReturnType<typeof createClient>,
  supaUser: User,
): Promise<AuthUser | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', supaUser.id)
    .maybeSingle();

  const email = supaUser.email ?? '';
  const rawName =
    (typeof profile?.full_name === 'string' ? profile.full_name : '') ||
    (typeof supaUser.user_metadata?.name === 'string' ? supaUser.user_metadata.name : '') ||
    email;

  const appGridPlan = supaUser.app_metadata?.grid_plan;
  const gridPlan = parseGridPlanId(typeof appGridPlan === 'string' ? appGridPlan : undefined);
  const role = resolveRoleFromSupabaseUser(supaUser, profile?.role ?? null);
  if (!role) return null;

  return {
    id: supaUser.id,
    email,
    name: resolveStaffDisplayName(email, rawName),
    role,
    image: profile?.avatar_url ?? null,
    gridPlan,
  };
}

/**
 * Supabase auth provider — drop-in replacement for NextAuth's SessionProvider.
 * Provides { data: { user }, status } matching the useSession() shape.
 */
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const fetchUser = useCallback(async (sessionUser?: User) => {
    if (!getSupabaseEnv().isConfigured) {
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    const supabase = createClient();

    try {
      let supaUser = sessionUser;

      if (!supaUser) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setUser(null);
          setStatus('unauthenticated');
          return;
        }
        supaUser = data.user;
      }

      const resolvedUser = await buildAuthUser(supabase, supaUser);
      if (!resolvedUser) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }
      setUser(resolvedUser);
      setStatus('authenticated');
    } catch (error) {
      console.error('[SupabaseAuthProvider] Session resolution failed:', error);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const timeout = window.setTimeout(() => {
        if (!cancelled) {
          console.warn('[SupabaseAuthProvider] Session bootstrap timed out');
          setUser(null);
          setStatus('unauthenticated');
        }
      }, SESSION_BOOTSTRAP_TIMEOUT_MS);

      try {
        await fetchUser();
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void bootstrap();

    if (!getSupabaseEnv().isConfigured) {
      return () => {
        cancelled = true;
      };
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      // Never call getUser() synchronously inside this callback — it deadlocks Supabase auth.
      window.setTimeout(() => {
        void fetchUser(session.user);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const refreshSession = useCallback(() => fetchUser(), [fetchUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      data: user ? { user } : null,
      status,
      update: refreshSession,
    }),
    [user, status, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Drop-in replacement for next-auth/react's useSession().
 * Returns { data: { user }, status, update } with the same shape.
 */
export function useSession() {
  return useContext(AuthContext);
}