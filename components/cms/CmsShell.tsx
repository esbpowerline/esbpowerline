'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutGrid, LibraryBig, CalendarDays, Images, Feather, Tag, Shapes, MessageCircleReply,
  Activity, Timer, FileSignature, Layers, Megaphone, Trash, GitCompare,
} from 'lucide-react';
import { StaffShell, type StaffNavGroup } from '@/components/staff/StaffShell';
import { CmsArticleEditorProvider } from '@/components/cms/CmsArticleEditorContext';
import {
  CmsWriteHeaderActionsLazy,
  EditorialPlatformControlLazy,
  EditorSettingsMenuLazy,
} from '@/components/staff/StaffShellLazy';
import { EditorPreferencesProvider } from '@/components/cms/EditorPreferencesProvider';
import { AdminPreferencesProvider } from '@/components/admin/AdminPreferencesProvider';
import { canAccessCmsRoute, canAccessAdminPanel } from '@/lib/cms-nav';

/** The editorial suite's nav, brand and tools. Everything else is StaffShell. */

const NAV_GROUPS: StaffNavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/cms', label: 'Dashboard', icon: LayoutGrid },
      { href: '/cms/analytics', label: 'Performance', icon: Activity },
      { href: '/cms/calendar', label: 'Editorial Calendar', icon: CalendarDays },
      { href: '/cms/yoy-sheet', label: 'Grid Comparison', icon: GitCompare },
    ],
  },
  {
    label: 'Stories',
    items: [
      { href: '/cms/articles/new', label: 'New story', icon: Feather },
      { href: '/cms/articles', label: 'All stories', icon: LibraryBig },
      { href: '/cms/articles/drafts', label: 'My Drafts', icon: FileSignature },
      { href: '/cms/articles/scheduled', label: 'Scheduled', icon: Timer },
      { href: '/cms/trash', label: 'Trash', icon: Trash },
    ],
  },
  {
    label: 'Content Library',
    items: [
      { href: '/cms/media', label: 'Media Library', icon: Images },
      { href: '/cms/categories', label: 'Categories', icon: Shapes },
      { href: '/cms/tags', label: 'Tags', icon: Tag },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { href: '/cms/notices', label: 'Notices', icon: Megaphone },
      { href: '/cms/comments', label: 'Comments', icon: MessageCircleReply },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/cms': 'Editorial Dashboard',
  '/cms/analytics': 'Performance',
  '/cms/articles': 'All Articles',
  '/cms/articles/new': 'Story editor',
  '/cms/articles/drafts': 'My Drafts',
  '/cms/articles/scheduled': 'Scheduled',
  '/cms/calendar': 'Editorial Calendar',
  '/cms/yoy-sheet': 'Grid Comparison',
  '/cms/media': 'Media Library',
  '/cms/categories': 'Categories',
  '/cms/tags': 'Tags',
  '/cms/comments': 'Comment Moderation',
  '/cms/notices': 'Editorial notices',
  '/cms/trash': 'Editor trash',
};

function isWritePath(pathname: string) {
  return pathname === '/cms/articles/new' || (pathname.startsWith('/cms/articles/') && pathname.endsWith('/edit'));
}

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (isWritePath(pathname)) return 'Story editor';
  return 'CMS Workspace';
}

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === '/cms') return false;
  // Editing an existing story is still "writing a story".
  if (href === '/cms/articles/new') return isWritePath(pathname);
  if (href === '/cms/articles') return false;
  return pathname.startsWith(href);
}

export function CmsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWriteWorkspace = isWritePath(pathname);

  // AdminPreferencesProvider carries the staff clock format (12/24h). The
  // article manager both panels share renders its Updated column through
  // AdminFormattedTime, and without this provider /cms/articles threw on every
  // row in production (2026-09-12).
  return (
    <AdminPreferencesProvider>
      <EditorPreferencesProvider>
        <StaffShell
          surface="cms"
          home="/cms"
          brand={{ label: 'Editorial Suite', icon: Feather }}
          crumb="Editorial"
          groups={NAV_GROUPS}
          canSee={canAccessCmsRoute}
          isActive={isNavActive}
          pageTitle={getPageTitle}
          crossLink={(role, urls) =>
            canAccessAdminPanel(role)
              ? { group: 'Platform', href: urls.adminUrl, label: 'Full admin panel', icon: Layers }
              : null
          }
          headerActions={
            <>
              {isWriteWorkspace ? <CmsWriteHeaderActionsLazy /> : null}
              <EditorSettingsMenuLazy variant="header" />
              <EditorialPlatformControlLazy />
            </>
          }
          mainInnerClassName={isWriteWorkspace ? 'cms-main-inner--write' : undefined}
        >
          {isWriteWorkspace ? <CmsArticleEditorProvider>{children}</CmsArticleEditorProvider> : children}
        </StaffShell>
      </EditorPreferencesProvider>
    </AdminPreferencesProvider>
  );
}
