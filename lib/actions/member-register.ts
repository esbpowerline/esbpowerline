'use server';

import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { initialMemberStatus } from '@/lib/member-registration';
import { upsertSupabaseAuthUser } from '@/lib/supabase/sync-auth-user';
import {
  formatBdPhoneDisplay,
  isValidBdPhone,
  normalizeBdPhone,
  phoneMemberEmail,
} from '@/lib/bd-phone';
import { checkRateLimit, clientIpFromForwarded } from '@/lib/rate-limit';

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export type MemberRegisterResult =
  | { ok: true; email: string; status: 'ACTIVE' | 'PENDING' }
  | { ok: false; error: string };

export async function registerMemberAction(input: {
  name: string;
  phone: string;
  email?: string;
  password: string;
}): Promise<MemberRegisterResult> {
  const headerList = await headers();
  const clientIp = clientIpFromForwarded(
    headerList.get('x-forwarded-for'),
    headerList.get('x-real-ip'),
  );
  const rate = checkRateLimit(`member-register:${clientIp}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  if (!rate.allowed) {
    return { ok: false, error: 'Too many registration attempts. Please try again later.' };
  }

  const name = input.name.trim();
  const password = input.password;
  const emailRaw = input.email?.trim().toLowerCase() ?? '';

  if (name.length < 2) {
    return { ok: false, error: 'Enter your full name.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  const phone = normalizeBdPhone(input.phone);
  if (!phone || !isValidBdPhone(phone)) {
    return {
      ok: false,
      error: 'Enter a valid Bangladesh mobile number (e.g. 01712 345678).',
    };
  }

  const email = emailRaw || phoneMemberEmail(phone);

  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return { ok: false, error: 'Enter a valid email address or leave it blank.' };
  }

  const [existingEmail, existingPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { phone } }),
  ]);

  if (existingPhone) {
    return {
      ok: false,
      error: `This number is already registered (${formatBdPhoneDisplay(phone)}). Sign in instead.`,
    };
  }

  if (existingEmail) {
    return { ok: false, error: 'This email is already registered. Sign in instead.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const status = initialMemberStatus();

  const created = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: 'SUBSCRIBER',
      status,
    },
  });

  try {
    const supabaseUserId = await upsertSupabaseAuthUser({
      email,
      password,
      name,
      role: 'SUBSCRIBER',
      status,
      // Never reset an existing Auth account from the public form.
      allowExistingOverwrite: false,
    });
    if (supabaseUserId) {
      await prisma.user.update({
        where: { id: created.id },
        data: { supabaseUserId },
      });
    }
  } catch (error) {
    await prisma.user.delete({ where: { id: created.id } }).catch(() => undefined);
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
      return { ok: false, error: 'An account with this email already exists. Sign in or reset your password.' };
    }
    console.error('[registerMemberAction] Supabase sync failed:', error);
    return { ok: false, error: 'Could not create your account. Please try again.' };
  }

  return { ok: true, email, status };
}