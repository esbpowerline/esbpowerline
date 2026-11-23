'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getMemberSession } from '@/lib/member-session';
import {
  changeSupabaseAuthUserEmail,
  upsertSupabaseAuthUser,
  syncSupabaseAuthUserMetadata,
} from '@/lib/supabase/sync-auth-user';

async function requireMemberUser() {
  const session = await getMemberSession();
  if (!session?.user?.id) throw new Error('Sign in required');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      passwordHash: true,
    },
  });
  if (!user) throw new Error('Account not found');
  if (user.status === 'SUSPENDED') throw new Error('Account suspended');
  if (user.status === 'PENDING') throw new Error('Account pending verification');
  if (user.role !== 'SUBSCRIBER') throw new Error('Not a member account');

  return user;
}

export async function updateMemberProfile(input: { name?: string; email?: string }) {
  const user = await requireMemberUser();

  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();

  const updateData: { name?: string; email?: string } = {};

  if (name && name.length >= 2 && name !== user.name) {
    updateData.name = name;
  }

  if (email && email !== user.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Enter a valid email address');
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
      throw new Error('This email is already registered');
    }
    updateData.email = email;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  const nextName = updateData.name ?? user.name;

  // Supabase first, then Prisma: see changeAuthUserEmailWithClient for why the order and
  // the ownership check matter.
  if (updateData.email) {
    try {
      await changeSupabaseAuthUserEmail(user.email, updateData.email);
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
        throw new Error('This email is already registered');
      }
      throw error;
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  await syncSupabaseAuthUserMetadata({
    email: updateData.email ?? user.email,
    name: nextName,
    role: 'SUBSCRIBER',
    status: user.status,
  });

  revalidatePath('/members/account');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function changeMemberPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const user = await requireMemberUser();
  const current = input.currentPassword?.trim();
  const next = input.newPassword?.trim();

  if (!current) throw new Error('Current password is required');
  if (!next || next.length < 8) throw new Error('New password must be at least 8 characters');
  if (current === next) throw new Error('New password must be different from the current password');

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) throw new Error('Current password is incorrect');

  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await upsertSupabaseAuthUser({
    email: user.email,
    password: next,
    name: user.name,
    role: 'SUBSCRIBER',
    status: user.status,
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function getMemberAccountDetails() {
  const session = await getMemberSession();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
}