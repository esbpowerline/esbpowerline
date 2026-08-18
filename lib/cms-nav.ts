import type { Role } from '@/lib/constants';
import { can } from '@/lib/constants';

/** Minimum permission required to show each CMS nav destination */
export const CMS_NAV_PERMISSIONS: Record<string, string> = {
  '/cms': 'article.create',
  '/cms/articles': 'article.create',
  '/cms/articles/new': 'article.create',
  '/cms/articles/drafts': 'article.create',
  '/cms/articles/scheduled': 'article.create',
  '/cms/calendar': 'article.create',
  '/cms/yoy-sheet': 'article.create',
  '/cms/media': 'media.upload',
  '/cms/tags': 'article.create',
  '/cms/categories': 'article.create',
  '/cms/comments': 'comment.moderate_any',
  '/cms/notices': 'article.create',
  '/cms/trash': 'article.create',
  '/cms/analytics': 'analytics.view_own',
};

export function canAccessCmsRoute(role: Role | undefined, href: string): boolean {
  const permission = CMS_NAV_PERMISSIONS[href];
  if (!permission) return Boolean(role && can(role, 'article.create'));
  return can(role, permission);
}

/** Editors who can review the full newsroom (not edit others' copy). */
export function isEditorLead(role: Role | undefined): boolean {
  return can(role, 'article.review');
}

/** Full admin panel link — only roles explicitly granted platform admin (ADMIN+). */
export function canAccessAdminPanel(role: Role | undefined): boolean {
  return can(role, 'settings.view');
}