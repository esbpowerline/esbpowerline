'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { authContinuePath, needsAuthHandoff } from '@/lib/auth-handoff';
import { registerMemberAction } from '@/lib/actions/member-register';
import { ensureDemoMemberAccount } from '@/lib/ensure-demo-accounts';
import {
  MEMBER_PENDING_LOGIN_MESSAGE,
  MEMBER_PENDING_SIGNUP_MESSAGE,
} from '@/lib/member-registration';
import { resolveRoleFromSupabaseUser } from '@/lib/supabase/resolve-role';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseEnv, SUPABASE_AUTH_SETUP_MESSAGE } from '@/utils/supabase/env';
import prisma from '@/lib/prisma';
import { normalizeBdPhone } from '@/lib/bd-phone';

export type MemberAuthResult = {
  error?: string;
  redirectTo?: string;
  handoffMessage?: string;
  successMessage?: string;
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

function memberLoginFailure(message: string): MemberAuthResult {
  return { error: message };
}

async function resolveMemberEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (trimmed.includes('@')) return trimmed.toLowerCase();

  const phone = normalizeBdPhone(trimmed);
  if (!phone) return null;

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { email: true },
  });
  return user?.email?.toLowerCase() ?? null;
}

async function establishMemberSession(
  identifier: string,
  password: string,
): Promise<MemberAuthResult | null> {
  const email = await resolveMemberEmail(identifier);
  if (!email) {
    return memberLoginFailure(
      'Invalid phone, email, or password. Check your details and try again.',
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return memberLoginFailure(
      'Invalid phone, email, or password. Check your details and try again.',
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return memberLoginFailure('Sign-in failed. Please try again.');
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
    (dbUser?.role as 'SUBSCRIBER' | undefined);

  if (dbUser?.status === 'SUSPENDED') {
    await supabase.auth.signOut();
    return memberLoginFailure('This account has been suspended. Contact support.');
  }

  if (dbUser?.status === 'PENDING') {
    await supabase.auth.signOut();
    return memberLoginFailure(MEMBER_PENDING_LOGIN_MESSAGE);
  }

  const metadataStatus = user.user_metadata?.status;
  if (metadataStatus === 'PENDING') {
    await supabase.auth.signOut();
    return memberLoginFailure(MEMBER_PENDING_LOGIN_MESSAGE);
  }

  if (role !== 'SUBSCRIBER') {
    await supabase.auth.signOut();
    return memberLoginFailure('This account is not a member account. Use staff sign in instead.');
  }

  await prisma.user.update({
    where: { email },
    data: { lastLoginAt: new Date() },
  });

  return null;
}

/** Member sign-in — useActionState(memberLoginAction, {}) */
export async function memberLoginAction(
  _prevState: MemberAuthResult,
  formData: FormData,
): Promise<MemberAuthResult> {
  try {
    if (!getSupabaseEnv().isConfigured) {
      return memberLoginFailure(SUPABASE_AUTH_SETUP_MESSAGE);
    }

    const identifier = readField(formData, 'identifier');
    const password = readField(formData, 'password');

    if (!identifier || !password) {
      return memberLoginFailure('Email and password are required.');
    }

    await ensureDemoMemberAccount();

    const authError = await establishMemberSession(identifier, password);
    if (authError) return authError;

    revalidatePath('/', 'layout');

    const callbackUrl = safeCallbackUrl(readField(formData, 'callbackUrl'));
    const destination = callbackUrl ?? '/members';
    const headerStore = await headers();
    const host = headerStore.get('host') ?? 'localhost:3000';
    const redirectTo = needsAuthHandoff(destination, host)
      ? authContinuePath(destination)
      : destination;

    return {
      redirectTo,
      handoffMessage: 'Opening your library…',
    };
  } catch (error) {
    console.error('[memberLoginAction]', error);
    return memberLoginFailure('Sign-in failed. Please try again in a moment.');
  }
}

/** Member sign-up then sign-in — useActionState(memberSignUpAction, {}) */
export async function memberSignUpAction(
  _prevState: MemberAuthResult,
  formData: FormData,
): Promise<MemberAuthResult> {
  try {
    const name = readField(formData, 'name');
    const phone = readField(formData, 'phone');
    const email = readField(formData, 'email');
    const password = readField(formData, 'password');

    const registerResult = await registerMemberAction({
      name,
      phone,
      email: email || undefined,
      password,
    });

    if (!registerResult.ok) {
      return memberLoginFailure(registerResult.error);
    }

    if (registerResult.status === 'PENDING') {
      return { successMessage: MEMBER_PENDING_SIGNUP_MESSAGE };
    }

    const authError = await establishMemberSession(registerResult.email, password);
    if (authError) return authError;

    revalidatePath('/', 'layout');

    const callbackUrl = safeCallbackUrl(readField(formData, 'callbackUrl'));
    const destination = callbackUrl ?? '/members';
    const headerStore = await headers();
    const host = headerStore.get('host') ?? 'localhost:3000';
    const redirectTo = needsAuthHandoff(destination, host)
      ? authContinuePath(destination)
      : destination;

    return {
      redirectTo,
      handoffMessage: 'Opening your library…',
    };
  } catch (error) {
    console.error('[memberSignUpAction]', error);
    return memberLoginFailure('Could not create your account. Please try again.');
  }
}