'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import {
  changeSupabaseAuthUserEmail,
  upsertSupabaseAuthUser,
  syncSupabaseAuthUserMetadata,
  syncSupabaseAuthUserStatus,
  invalidateSupabaseAuthSession,
} from '@/lib/supabase/sync-auth-user';
import { ADMIN_ASSIGNABLE_ROLES, ROLES, type Role } from '@/lib/constants';
import { userSchema, type UserInput } from '@/lib/validations/user';
import { requireStaffCollaboration } from '@/lib/server-auth';
import { assertActorCanManageTarget } from '@/lib/role-hierarchy';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'admin.access')) throw new Error('Forbidden');
  return session.user;
}

export type UserListFilter = 'all' | 'admin' | 'editor' | 'members';

export type UserMemberActivity = {
  savedItems: { id: string; itemType: string; label: string; createdAt: Date }[];
  comments: { id: string; content: string; status: string; articleSlug: string | null; createdAt: Date }[];
  downloads: { id: string; label: string; createdAt: Date }[];
};

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR'] as const;

export async function getStaffForCollaboration() {
  await requireStaffCollaboration();
  return prisma.user.findMany({
    where: { role: { in: [...STAFF_ROLES] }, status: 'ACTIVE' },
    select: { id: true, name: true, role: true, avatar: true },
    orderBy: { name: 'asc' },
  });
}

export async function getUsers(filter: UserListFilter = 'all') {
  await requireAdmin();
  const where =
    filter === 'members'
      ? { role: 'SUBSCRIBER' as const }
      : filter === 'admin'
        ? { role: 'ADMIN' as const }
        : filter === 'editor'
          ? { role: 'EDITOR' as const }
          : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, role: true, status: true,
      articlesCount: true, totalViews: true, lastLoginAt: true, createdAt: true,
      _count: {
        select: {
          savedItems: true,
          comments: true,
          memberDownloads: true,
        },
      },
    },
  });

  return users.map(({ _count, ...user }) => ({
    ...user,
    savedCount: _count.savedItems,
    commentCount: _count.comments,
    downloadCount: _count.memberDownloads,
  }));
}

export async function getUserMemberActivity(userId: string): Promise<UserMemberActivity | null> {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== 'SUBSCRIBER') return null;

  const [savedItems, comments, downloads] = await Promise.all([
    prisma.savedItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.comment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.memberDownload.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, label: true, createdAt: true },
    }),
  ]);

  const articleIds = savedItems.filter((s) => s.itemType === 'ARTICLE').map((s) => s.targetId);
  const magazineIds = savedItems.filter((s) => s.itemType === 'MAGAZINE').map((s) => s.targetId);
  const commentArticleIds = [...new Set(comments.map((c) => c.articleId))];

  const [articles, magazines, commentArticles] = await Promise.all([
    articleIds.length
      ? prisma.article.findMany({ where: { id: { in: articleIds } }, select: { id: true, title: true } })
      : [],
    magazineIds.length
      ? prisma.magazineIssue.findMany({ where: { id: { in: magazineIds } }, select: { id: true, title: true } })
      : [],
    commentArticleIds.length
      ? prisma.article.findMany({ where: { id: { in: commentArticleIds } }, select: { id: true, slug: true } })
      : [],
  ]);

  const articleTitles = Object.fromEntries(articles.map((a) => [a.id, a.title]));
  const magazineTitles = Object.fromEntries(magazines.map((m) => [m.id, m.title]));
  const articleSlugs = Object.fromEntries(commentArticles.map((a) => [a.id, a.slug]));

  return {
    savedItems: savedItems.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      label:
        item.itemType === 'ARTICLE'
          ? articleTitles[item.targetId] ?? 'Article'
          : magazineTitles[item.targetId] ?? 'Magazine issue',
      createdAt: item.createdAt,
    })),
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      status: c.status,
      articleSlug: articleSlugs[c.articleId] ?? null,
      createdAt: c.createdAt,
    })),
    downloads,
  };
}

export async function getUser(id: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, status: true,
      bio: true, avatar: true, articlesCount: true, totalViews: true,
      lastLoginAt: true, createdAt: true,
    },
  });
}

function assertRoleAssignment(_actorRole: Role, targetRole: Role, existingRole?: Role) {
  if (existingRole && existingRole === targetRole) return;
  if (!ADMIN_ASSIGNABLE_ROLES.includes(targetRole as (typeof ADMIN_ASSIGNABLE_ROLES)[number])) {
    throw new Error('Only Admin, Editor, and Member roles can be assigned');
  }
}

export async function createUser(data: UserInput) {
  const admin = await requireAdmin();
  if (!can(admin.role, 'user.create')) throw new Error('Forbidden');

  const parsed = userSchema.parse(data);
  assertRoleAssignment(admin.role as Role, parsed.role as Role);

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) throw new Error('Email already exists');

  if (!parsed.password?.trim()) {
    throw new Error('Password is required when creating a user');
  }
  if (parsed.password.trim().length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  const passwordHash = await bcrypt.hash(parsed.password.trim(), 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      role: parsed.role,
      status: parsed.status,
      bio: parsed.bio,
    },
  });

  try {
    const supabaseUserId = await upsertSupabaseAuthUser({
      email: parsed.email,
      password: parsed.password!.trim(),
      name: parsed.name,
      role: parsed.role,
      status: parsed.status,
    });
    if (supabaseUserId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { supabaseUserId },
      });
    }
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    throw error;
  }

  const roleLabel = parsed.role === 'EDITOR' ? 'editor (CMS access)' : parsed.role.toLowerCase();
  await prisma.auditLog.create({
    data: {
      type: 'user.create',
      message: `Created ${roleLabel}: ${user.email}`,
      userId: admin.id,
    },
  });

  revalidatePath('/admin/users');
  return user;
}

export async function updateUser(id: string, data: Partial<UserInput>) {
  const admin = await requireAdmin();
  if (!can(admin.role, 'user.edit')) throw new Error('Forbidden');

  const parsed = userSchema.partial().parse(data);
  const updateData: Record<string, unknown> = { ...parsed };
  delete updateData.password;

  if (parsed.password) {
    if (parsed.password.trim().length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    updateData.passwordHash = await bcrypt.hash(parsed.password, 10);
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true, role: true, status: true, passwordHash: true },
  });
  if (!existing) throw new Error('User not found');

  assertActorCanManageTarget(admin.role as Role, existing.role as Role, {
    isSelf: admin.id === id,
  });

  if (parsed.role) {
    if (!can(admin.role, 'user.change_role')) {
      throw new Error('Cannot change role');
    }
    assertRoleAssignment(admin.role as Role, parsed.role as Role, existing.role as Role);
  }

  // An email edit moves the Auth identity first (see changeAuthUserEmailWithClient). It used
  // to change Prisma only, and every sync below then looked the Auth user up by the OLD
  // address while sign-in kept using it.
  const emailChanged = Boolean(parsed.email && parsed.email !== existing.email.toLowerCase());
  if (emailChanged) {
    const taken = await prisma.user.findFirst({
      where: { email: { equals: parsed.email!, mode: 'insensitive' }, NOT: { id } },
      select: { id: true },
    });
    if (taken) throw new Error('Email already exists');
    await changeSupabaseAuthUserEmail(existing.email, parsed.email!);
  }
  const authEmail = emailChanged ? parsed.email! : existing.email;

  // Track original values for potential rollback
  const originalData: Record<string, unknown> = {};
  for (const key of Object.keys(updateData)) {
    originalData[key] = (existing as any)[key];
  }

  const user = await prisma.user.update({ where: { id }, data: updateData as any });

  try {
    const nextName = parsed.name ?? existing.name;
    const nextRole = (parsed.role ?? existing.role) as UserInput['role'];
    const nextStatus = (parsed.status ?? user.status) as UserInput['status'];

    if (parsed.password) {
      const supabaseUserId = await upsertSupabaseAuthUser({
        email: authEmail,
        password: parsed.password,
        name: nextName,
        role: nextRole,
        status: nextStatus,
      });
      if (supabaseUserId) {
        await prisma.user.update({
          where: { id },
          data: { supabaseUserId },
        });
      }
    } else if (parsed.name || parsed.role || parsed.status) {
      await syncSupabaseAuthUserMetadata({
        email: authEmail,
        name: nextName,
        role: nextRole,
        status: nextStatus,
      });
    }

    if (parsed.status === 'SUSPENDED') {
      await syncSupabaseAuthUserStatus(authEmail, 'SUSPENDED');
      await invalidateSupabaseAuthSession(authEmail);
    } else if (parsed.status === 'ACTIVE') {
      await syncSupabaseAuthUserStatus(authEmail, 'ACTIVE');
    }

    // Force immediate session invalidation if role is reduced
    if (parsed.role && ROLES[parsed.role].level < ROLES[existing.role].level) {
      await invalidateSupabaseAuthSession(authEmail);
    }
  } catch (error: any) {
    // Rollback local changes on Supabase sync failure, including the Auth email moved above.
    if (emailChanged) {
      await changeSupabaseAuthUserEmail(authEmail, existing.email).catch(() => undefined);
    }
    await prisma.user.update({
      where: { id },
      data: originalData as any,
    }).catch(() => undefined);
    throw new Error(`User update failed (Supabase sync error: ${error.message || error})`);
  }

  revalidatePath('/admin/users');
  return user;
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();
  if (!can(admin.role, 'user.delete')) throw new Error('Forbidden');
  if (admin.id === id) throw new Error('Cannot delete yourself');

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { email: true, role: true },
  });
  if (!existing) throw new Error('User not found');

  assertActorCanManageTarget(admin.role as Role, existing.role as Role);

  await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } });
  await syncSupabaseAuthUserStatus(existing.email, 'SUSPENDED');
  await invalidateSupabaseAuthSession(existing.email);
  revalidatePath('/admin/users');
}