'use server';

import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseEnv, SUPABASE_AUTH_SETUP_MESSAGE } from '@/utils/supabase/env';
import { getPublicSiteOrigin } from '@/lib/public-site-url';
import {
  PASSWORD_RESET_SUCCESS_MESSAGE,
  loginPathForAudience,
  parsePasswordResetAudience,
  type PasswordResetAudience,
} from '@/lib/auth-redirect';
import { validateNewPassword } from '@/lib/password-policy';
import { checkRateLimit, clientIpFromForwarded } from '@/lib/rate-limit';

// Cap reset-email requests to blunt enumeration/mailbox-flooding abuse.
const RESET_REQUEST_LIMIT = 5;
const RESET_REQUEST_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export type RequestPasswordResetResult = {
  error?: string;
  successMessage?: string;
};

export type CompletePasswordResetResult = {
  error?: string;
  success?: boolean;
  loginPath?: string;
};

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function requestPasswordResetAction(
  _prev: RequestPasswordResetResult,
  formData: FormData,
): Promise<RequestPasswordResetResult> {
  const email = readField(formData, 'email').toLowerCase();
  const audience = parsePasswordResetAudience(readField(formData, 'audience'));

  if (!email || !isValidEmail(email)) {
    return { error: 'Enter a valid email address.' };
  }

  const headerList = await headers();
  const clientIp = clientIpFromForwarded(
    headerList.get('x-forwarded-for'),
    headerList.get('x-real-ip'),
  );
  const ipRate = checkRateLimit(`pwreset-ip:${clientIp}`, RESET_REQUEST_LIMIT, RESET_REQUEST_WINDOW_MS);
  const emailRate = checkRateLimit(`pwreset-email:${email}`, RESET_REQUEST_LIMIT, RESET_REQUEST_WINDOW_MS);
  if (!ipRate.allowed || !emailRate.allowed) {
    // Keep the generic success response so throttling can't be used to enumerate accounts.
    return { successMessage: PASSWORD_RESET_SUCCESS_MESSAGE };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { error: SUPABASE_AUTH_SETUP_MESSAGE };
  }

  const origin = getPublicSiteOrigin();
  if (!origin) {
    return { error: 'Password reset is not configured. Contact support.' };
  }

  try {
    const next = `/auth/reset-password?audience=${audience}`;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      console.error('[requestPasswordResetAction]', error.message);
    }
  } catch (err) {
    console.error('[requestPasswordResetAction]', err);
  }

  return { successMessage: PASSWORD_RESET_SUCCESS_MESSAGE };
}

export async function completePasswordResetAction(input: {
  newPassword: string;
  audience: PasswordResetAudience;
}): Promise<CompletePasswordResetResult> {
  const audience = parsePasswordResetAudience(input.audience);
  const passwordError = validateNewPassword(input.newPassword);
  if (passwordError) return { error: passwordError };

  const next = input.newPassword.trim();

  if (!getSupabaseEnv().isConfigured) {
    return { error: SUPABASE_AUTH_SETUP_MESSAGE };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return {
      error: 'Your reset link has expired. Request a new one from the sign-in page.',
      loginPath: loginPathForAudience(audience),
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: next });
  if (updateError) {
    return { error: updateError.message };
  }

  const email = user.email.toLowerCase();
  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { supabaseUserId: user.id }],
    },
    select: { id: true, email: true },
  });

  if (dbUser) {
    const passwordHash = await bcrypt.hash(next, 10);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        type: 'password.reset',
        message: `Password reset via email link (${dbUser.email})`,
        userId: dbUser.id,
      },
    });
  }

  await supabase.auth.signOut();

  return {
    success: true,
    loginPath: loginPathForAudience(audience),
  };
}