'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { SITE_SETTINGS_CACHE_TAG } from '@/lib/homepage-content';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';

async function requirePermission(action: string) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, action)) throw new Error('Forbidden');
  return session.user;
}

async function requireAdmin() {
  return requirePermission('settings.view');
}

export async function getSettings() {
  await requireAdmin();
  const settings = await prisma.siteSetting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) map[s.key] = s.value;
  return map;
}

export async function updateSetting(key: string, value: unknown) {
  return updateSettingsBatch({ [key]: value });
}

function mergeSettingValue(existing: unknown, incoming: unknown) {
  if (
    existing !== null &&
    typeof existing === 'object' &&
    !Array.isArray(existing) &&
    incoming !== null &&
    typeof incoming === 'object' &&
    !Array.isArray(incoming)
  ) {
    return { ...(existing as Record<string, unknown>), ...(incoming as Record<string, unknown>) };
  }
  return incoming;
}

export async function updateSettingsBatch(updates: Record<string, unknown>) {
  const admin = await requireAdmin();
  if (!can(admin.role, 'settings.edit')) throw new Error('Forbidden');

  const entries = Object.entries(updates);
  if (!entries.length) return;

  const keys = entries.map(([key]) => key);
  const existingRows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const existingByKey = new Map(existingRows.map((row) => [row.key, row.value]));

  await prisma.$transaction(
    entries.map(([key, value]) => {
      const merged = mergeSettingValue(existingByKey.get(key), value);
      return prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: merged as object },
        update: { value: merged as object },
      });
    }),
  );

  // Record audit log for configuration updates
  const keysStr = keys.join(', ');
  await prisma.auditLog.create({
    data: {
      type: 'settings.update',
      message: `Updated settings keys: ${keysStr}`,
      userId: admin.id,
    },
  }).catch((err) => {
    console.error('Failed to log settings updates to auditLog:', err);
  });

  // The settings maps are cached across requests (lib/homepage-content.ts);
  // drop them first, or the revalidated pages re-render from the stale map.
  revalidateTag(SITE_SETTINGS_CACHE_TAG, { expire: 0 });
  const { PUBLIC_REVALIDATE_PATHS } = await import('@/lib/public-paths');
  for (const path of PUBLIC_REVALIDATE_PATHS) revalidatePath(path);
  revalidatePath('/admin/settings');
}