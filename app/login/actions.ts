'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ensureMasterAdminAccount } from '@/lib/master-admin';
import { authContinuePath, needsAuthHandoff } from '@/lib/auth-handoff';
import {
  getAuthHandoffMessage,
  hostContextFromHeaders,
  isStaffRole,
  resolvePostLoginPath,
} from '@/lib/auth-routing';
import type { Role } from '@/lib/constants';
import { resolveRoleFromSupabaseUser } from '@/lib/supabase/resolve-role';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseEnv, SUPABASE_AUTH_SETUP_MESSAGE } from '@/utils/supabase/env';
import { upsertSupabaseAuthUser } from '@/lib/supabase/sync-auth-user';
import prisma from '@/lib/prisma';
import { getDevBootstrapPassword } from '@/lib/dev-login-hints';
import { friendlyAuthError } from '@/lib/auth-error-copy';

export type AuthActionResult = {
  error?: string;
  redirectTo?: string;
  handoffMessage?: string;
};

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function safeCallbackUrl(raw: string) {
  if (!raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  return raw;
}

/** Attach to staff login form: useActionState(loginAction, {}) */
export async function loginAction(
  _prevState: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  try {
    if (!getSupabaseEnv().isConfigured) {
      return { error: SUPABASE_AUTH_SETUP_MESSAGE };
    }

    const email = readField(formData, 'email').toLowerCase();
    const password = readField(formData, 'password');

    if (!email || !password) {
      return { error: 'Email and password are required.' };
    }

    await ensureMasterAdminAccount();

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const { message, detail } = friendlyAuthError(error.message);
      // The visitor gets what they can act on; the operator gets the rest.
      if (detail) console.error('[loginAction] unhandled auth error:', detail);
      return { error: message };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Sign-in failed. Please try again.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true, status: true },
    });

    const role =
      resolveRoleFromSupabaseUser(user, profile?.role ?? null) ??
      (dbUser?.role as Role | undefined);

    if (!role) {
      await supabase.auth.signOut();
      return { error: 'Account is missing a role. Contact an administrator.' };
    }

    if (dbUser?.status === 'SUSPENDED') {
      await supabase.auth.signOut();
      return { error: 'This account has been suspended. Contact an administrator.' };
    }

    if (!isStaffRole(role)) {
      await supabase.auth.signOut();
      return { error: 'This account is not authorized for staff access. Use member sign in instead.' };
    }

    await prisma.user.update({
      where: { email },
      data: { lastLoginAt: new Date() },
    });

    revalidatePath('/', 'layout');

    const headerStore = await headers();
    const hostContext = hostContextFromHeaders(
      headerStore.get('host'),
      headerStore.get('x-forwarded-proto'),
    );
    const callbackUrl = readField(formData, 'callbackUrl');
    const destination = resolvePostLoginPath(role, {
      callbackUrl,
      audience: 'staff',
    }, hostContext);

    const host = headerStore.get('host') ?? 'localhost:3000';
    const redirectTo = needsAuthHandoff(destination, host)
      ? authContinuePath(destination)
      : destination;

    return {
      redirectTo,
      handoffMessage: getAuthHandoffMessage(
        role,
        'staff',
        destination,
        headerStore.get('host') ?? 'localhost:3000',
      ),
    };
  } catch (error) {
    console.error('[loginAction]', error);
    return { error: 'Sign-in failed. Please try again in a moment.' };
  }
}

/** Dev-only password hint for master admin quick-fill — never returns a value in production. */
export async function getStaffDevLoginHint(): Promise<{ passwordHint: string | null }> {
  return { passwordHint: getDevBootstrapPassword() };
}

/** Attach to staff sign-up form: useActionState(signupAction, {}) */
export async function signupAction(
  _prevState: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Staff self-registration is disabled. Contact the master admin.' };
  }

  const email = readField(formData, 'email').toLowerCase();
  const password = readField(formData, 'password');
  const name = readField(formData, 'name');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  try {
    await upsertSupabaseAuthUser({
      email,
      password,
      name: name || '',
      role: 'AUTHOR',
      status: 'ACTIVE',
    });
  } catch (error: any) {
    // Same rule as sign-in: never hand an upstream provider's message to the
    // form. `upsertSupabaseAuthUser` wraps Supabase admin calls, which is where
    // the billing-restriction text came from.
    const { message, detail } = friendlyAuthError(error);
    if (detail) console.error('[registerAction] unhandled auth error:', detail);
    return { error: message };
  }

  revalidatePath('/', 'layout');

  const callbackUrl = safeCallbackUrl(readField(formData, 'callbackUrl'));
  redirect(callbackUrl ?? '/admin');
}

/** Optional sign-out action for staff panels. */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}