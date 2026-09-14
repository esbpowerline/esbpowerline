import type { Role } from '@/lib/constants';
import { can, canAccessAdminPanel } from '@/lib/constants';

/** Minimum permission required to show each admin nav destination */
export const ADMIN_NAV_PERMISSIONS: Record<string, string> = {
  '/admin': 'admin.access',
  '/admin/analytics': 'analytics.view_all',
  '/admin/articles': 'admin.access',
  '/admin/categories': 'category.manage',
  '/admin/tags': 'admin.access',
  '/admin/magazine': 'admin.access',
  '/admin/media': 'admin.access',
  '/admin/messages': 'admin.access',
  '/admin/users': 'user.view',
  '/admin/comments': 'comment.moderate_any',
  '/admin/settings': 'settings.view',
  '/admin/logs': 'logs.view',
  // Without an entry the item defaults to visible for every admin.
  '/admin/notifications': 'notifications.manage',
};

export function canAccessAdminRoute(role: Role | undefined, href: string): boolean {
  if (!canAccessAdminPanel(role)) return false;
  const permission = ADMIN_NAV_PERMISSIONS[href];
  if (!permission) return true;
  return can(role, permission);
}