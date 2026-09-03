'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { Role } from '@/lib/constants';
import {
  upsertSupabaseAuthUser,
  syncSupabaseAuthUserMetadata,
  syncSupabaseAuthUserStatus,
} from '@/lib/supabase/sync-auth-user';

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

export async function changeStaffPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const sessionUser = await requireSessionUser();
  const current = input.currentPassword?.trim();
  const next = input.newPassword?.trim();

  if (!current) throw new Error('Current password is required');
  if (!next || next.length < 8) throw new Error('New password must be at least 8 characters');
  if (current === next) throw new Error('New password must be different from the current password');

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, status: true },
  });
  if (!user) throw new Error('User not found');
  if (user.status === 'SUSPENDED') throw new Error('Account suspended');

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
    role: user.role as Role,
    status: user.status,
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateProfile(data: {
  name?: string;
  email?: string;
  avatar?: string;
}) {
  const sessionUser = await requireSessionUser();

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) throw new Error('User not found');
  if (user.status === 'SUSPENDED') throw new Error('Account suspended');

  const updateData: Record<string, unknown> = {};
  let requiresNameApproval = false;

  if (data.name && data.name !== user.name) {
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      updateData.name = data.name;
    } else {
      updateData.pendingName = data.name;
      requiresNameApproval = true;
    }
  }

  // Emails are one identity regardless of case. The check used to be
  // case-SENSITIVE against a plain-text unique column while Supabase Auth
  // resolves users case-INsensitively, so an editor could set their email to
  // `Admin@…`, pass this check, and be resolved as the admin's account on the
  // next auth sync (audit finding, 2026-08-08). Lower-case on write and check
  // the same way; the `User_email_lower_key` index enforces it in the database
  // whatever path a write takes.
  const nextEmailNormalized = data.email?.trim().toLowerCase();
  if (nextEmailNormalized && nextEmailNormalized !== user.email.toLowerCase()) {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: nextEmailNormalized, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) throw new Error('Email already in use');
    updateData.email = nextEmailNormalized;
  }

  if (data.avatar !== undefined) {
    updateData.avatar = data.avatar;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
    });
  }

  const nextEmail = (data.email ?? user.email).toLowerCase();
  const nextName = (updateData.name as string | undefined) ?? user.name;

  if (data.name || data.email) {
    await syncSupabaseAuthUserMetadata({
      email: user.email,
      name: nextName,
      role: user.role as Role,
      status: user.status,
    });
  }

  if (requiresNameApproval) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });

    await prisma.$transaction(
      admins.map((admin) =>
        prisma.editorialNotice.create({
          data: {
            type: 'ADMIN_NOTE',
            message: `${user.name} requested a name change to "${data.name}". Please review in the Users panel.`,
            recipientId: admin.id,
            senderId: user.id,
            metadata: { type: 'NAME_CHANGE_REQUEST', pendingName: data.name },
          },
        }),
      ),
    );
  }

  revalidatePath('/', 'layout');
  return { success: true, requiresNameApproval };
}