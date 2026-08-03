'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/utils/supabase/auth-context';
import { useState, useEffect, useMemo, memo, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { resolveStaffWorkspaceUrls } from '@/lib/workspace-urls';
import { SiteThemeToggle } from '@/components/shared/SiteThemeToggle';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { PlatformControlLazy, StaffSignOutDialogLazy } from '@/components/staff/StaffShellLazy';
import { Button } from '@/components/ui/button';
import { ROLES, type Role, USER_ROLE_LABELS } from '@/lib/constants';
import { canAccessAdminRoute } from '@/lib/admin-nav';
import { AdminChangeQueueProvider, useAdminChangeQueue } from '@/components/admin/AdminChangeQueueProvider';
import { AdminPreferencesProvider } from '@/components/admin/AdminPreferencesProvider';
import { AdminChangesDock } from '@/components/admin/AdminChangesDock';
import { AdminPendingChangesDialog } from '@/components/admin/AdminPendingChangesDialog';
import { UserProfileSettings } from '@/components/staff/UserProfileSettings';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid, UsersRound, LibraryBig, Activity, Settings2, FileClock, Database,
  Images, Tag, Hash, BookOpenText, LogOut, ExternalLink, Zap, Menu, X, Shield,
  ChevronRight, ChevronLeft, Shapes, MessageCircleReply, PanelLeftClose, PanelLeft,
  Mail,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
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

const NavLink = memo(function NavLink({
  item,
  active,
  onNavigate,
  onNavigateRequest,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
  onNavigateRequest: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={(event) => {
        onNavigateRequest(item.href, event);
        onNavigate();
      }}
      className={cn('admin-nav-item group', active && 'admin-nav-item--active')}
    >
      <span className={cn('admin-nav-icon', active && 'admin-nav-icon--active')}>
        <item.icon className="h-[14px] w-[14px]" strokeWidth={active ? 2.25 : 2} />
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {active && <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
    </Link>
  );
});

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { hasChanges, requestNavigation, requestSignOut } = useAdminChangeQueue();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [publicSiteUrl, setPublicSiteUrl] = useState('/');
  const [cmsUrl, setCmsUrl] = useState('/cms');

  function handleNavRequest(href: string, event: MouseEvent<HTMLAnchorElement>) {
    if (!hasChanges || href === pathname) return;
    event.preventDefault();
    requestNavigation(href);
  }

  useEffect(() => {
    const urls = resolveStaffWorkspaceUrls();
    setPublicSiteUrl(urls.publicSiteUrl);
    setCmsUrl(urls.cmsUrl || '/cms');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const role = session?.user?.role as Role | undefined;
  const roleLabel = role ? (USER_ROLE_LABELS[role] || 'User') : 'User';
  const article = /^[aeiou]/i.test(roleLabel) ? 'an' : 'a';
  const tooltipLabel = `Visit homepage as ${article} ${roleLabel}`;

  const visibleNavGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessAdminRoute(role, item.href)),
      })).filter((group) => group.items.length > 0),
    [role],
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm text-muted-foreground font-semibold">Verifying credentials…</span>
        </div>
      </div>
    );
  }

  const sidebar = (
    <>
      <div className="admin-sidebar-brand">
        <Link
          href="/admin"
          className="flex items-center gap-3 group"
          onClick={(event) => handleNavRequest('/admin', event)}
        >
          <div className="admin-brand-icon">
            <Zap className="h-[17px] w-[17px]" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[14px] tracking-[0.05em] uppercase text-foreground/90 leading-tight">Admin Console</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 min-h-0 px-3 py-2 overflow-y-auto space-y-5">
        {visibleNavGroups.map((group) => (
          <div key={group.label}>
            <div className="admin-nav-group-label">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={active}
                    onNavigate={() => setMobileOpen(false)}
                    onNavigateRequest={handleNavRequest}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {cmsUrl && (
          <div>
            <div className="admin-nav-group-label">Workspace</div>
            <Link
              href={cmsUrl}
              className="admin-nav-item group"
              onClick={(event) => handleNavRequest('/cms', event)}
            >
              <span className="admin-nav-icon">
                <BookOpenText className="h-[14px] w-[14px]" strokeWidth={2} />
              </span>
              <span className="flex-1 truncate">Editorial workspace</span>
              <ExternalLink className="h-3 w-3 opacity-40 shrink-0" />
            </Link>
          </div>
        )}
      </nav>

      <div className="admin-sidebar-footer">
        {session?.user && (
          <button
            type="button"
            className="admin-user-capsule text-left w-full hover:bg-muted/50 transition-colors"
            title={isCollapsed ? (session.user.name ?? undefined) : undefined}
            onClick={() => setShowProfileSettings(true)}
          >
            <div className="admin-user-avatar">
              {(session.user.name ?? 'A').charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-capsule__text">
              <div className="admin-user-capsule__name">{session.user.name}</div>
              <div className="admin-role-pill">{ROLES[session.user.role]?.name ?? session.user.role}</div>
            </div>
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className={cn("admin-shell min-h-screen flex min-h-[100dvh]", isCollapsed && "admin-shell--collapsed")}>
      <aside className={cn("admin-sidebar flex flex-col shrink-0", isCollapsed && "admin-sidebar--collapsed")}>
        {sidebar}
      </aside>

      <div className="admin-shell-main flex-1 flex flex-col min-w-0 min-h-0">
        <header className="admin-header">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="admin-icon-btn md:hidden"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="admin-icon-btn admin-collapse-toggle hidden md:flex"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            </button>

            <div className="hidden md:flex items-center gap-2 min-w-0">
              <span className="admin-header-crumb">Admin</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <span className="admin-header-title truncate">{getPageTitle(pathname)}</span>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <Zap className="h-4 w-4 text-rose-400" />
            </div>
          </div>

          <div className="admin-header-toolbar cms-header-toolbar flex items-center gap-1 sm:gap-1.5 shrink-0">
            <PlatformControlLazy />
            <ModernTooltip label={tooltipLabel} variant="chrome" alwaysShow={true}>
              <Link
                href={publicSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="cms-header-public-link"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden lg:inline">Visit Site</span>
              </Link>
            </ModernTooltip>
            <SiteThemeToggle className="cms-theme-toggle" />
            <Button
              variant="ghost"
              size="sm"
              className="sign-out-control flex admin-header-signout"
              onClick={() => {
                if (hasChanges) requestSignOut();
                else setShowSignOutConfirm(true);
              }}
            >
              <LogOut className="h-3.5 w-3.5 lg:mr-1.5" />
              <span className="hidden lg:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <div 
          className={cn(
            "md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-all duration-300 ease-in-out",
            mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )} 
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className={cn(
              "admin-sidebar admin-sidebar--drawer h-full flex flex-col transition-transform duration-300 ease-out transform",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>

        <main className="admin-main flex-1 overflow-auto min-h-0">
          <div className="admin-main-inner">{children}</div>
        </main>
      </div>

      <AdminChangesDock />
      <AdminPendingChangesDialog />
      <UserProfileSettings open={showProfileSettings} onOpenChange={setShowProfileSettings} />

      {showSignOutConfirm ? (
        <StaffSignOutDialogLazy open onClose={() => setShowSignOutConfirm(false)} />
      ) : null}
    </div>
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