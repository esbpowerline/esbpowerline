'use client';

import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import {
  LayoutGrid, UsersRound, LibraryBig, Activity, Settings2, FileClock, Database,
  Images, Tag, BookOpenText, Zap, Shapes, MessageCircleReply, Mail, BellRing,
} from 'lucide-react';
import { StaffShell, type StaffNavGroup } from '@/components/staff/StaffShell';
import { PlatformControlLazy } from '@/components/staff/StaffShellLazy';
import { canAccessAdminRoute } from '@/lib/admin-nav';
import { AdminChangeQueueProvider, useAdminChangeQueue } from '@/components/admin/AdminChangeQueueProvider';
import { AdminPreferencesProvider } from '@/components/admin/AdminPreferencesProvider';
import { AdminChangesDock } from '@/components/admin/AdminChangesDock';
import { AdminPendingChangesDialog } from '@/components/admin/AdminPendingChangesDialog';

/** The admin console's nav, brand and tools. Everything else is StaffShell. */

const NAV_GROUPS: StaffNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutGrid },
      { href: '/admin/analytics', label: 'Analytics', icon: Activity },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/articles', label: 'Articles', icon: LibraryBig },
      { href: '/admin/categories', label: 'Categories', icon: Shapes },
      { href: '/admin/tags', label: 'Tags', icon: Tag },
      { href: '/admin/magazine', label: 'Magazine', icon: BookOpenText },
      { href: '/admin/media', label: 'Media', icon: Images },
      { href: '/admin/comments', label: 'Comments', icon: MessageCircleReply },
      { href: '/admin/messages', label: 'Messages', icon: Mail },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/data', label: 'Grid Data Ingest', icon: Database },
      { href: '/admin/notifications', label: 'Notifications', icon: BellRing },
      { href: '/admin/users', label: 'Users', icon: UsersRound },
      { href: '/admin/settings', label: 'Settings', icon: Settings2 },
      { href: '/admin/logs', label: 'Activity Logs', icon: FileClock },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/analytics': 'Analytics',
  '/admin/articles': 'Articles',
  '/admin/categories': 'Categories',
  '/admin/tags': 'Tags',
  '/admin/magazine': 'Magazine',
  '/admin/media': 'Media',
  '/admin/comments': 'Comments',
  '/admin/messages': 'Contact Messages',
  '/admin/data': 'Grid Data Ingest',
  '/admin/notifications': 'Notifications',
  '/admin/users': 'Users',
  '/admin/users/new': 'New User',
  '/admin/settings': 'Settings',
  '/admin/logs': 'Activity Logs',
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/admin/users/')) return 'Edit User';
  return 'Admin';
}

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(href));
}

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasChanges, requestNavigation, requestSignOut } = useAdminChangeQueue();

  return (
    <StaffShell
      surface="admin"
      home="/admin"
      brand={{ label: 'Admin Console', icon: Zap }}
      crumb="Admin"
      groups={NAV_GROUPS}
      canSee={canAccessAdminRoute}
      isActive={isNavActive}
      pageTitle={getPageTitle}
      crossLink={(_role, urls) => ({
        group: 'Workspace',
        href: urls.cmsUrl || '/cms',
        label: 'Editorial workspace',
        icon: BookOpenText,
      })}
      headerActions={<PlatformControlLazy />}
      // Unsaved settings edits are queued, not lost: a nav click with
      // changes pending opens the review dialog instead of leaving.
      guardNavigation={(href: string, event: MouseEvent<HTMLAnchorElement>) => {
        if (!hasChanges || href === pathname) return;
        event.preventDefault();
        requestNavigation(href);
      }}
      interceptSignOut={() => {
        if (!hasChanges) return false;
        requestSignOut();
        return true;
      }}
      after={
        <>
          <AdminChangesDock />
          <AdminPendingChangesDialog />
        </>
      }
    >
      {children}
    </StaffShell>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminPreferencesProvider>
      <AdminChangeQueueProvider>
        <AdminShellInner>{children}</AdminShellInner>
      </AdminChangeQueueProvider>
    </AdminPreferencesProvider>
  );
}
