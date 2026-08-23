'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/utils/supabase/auth-context';
import { useState, useEffect, useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import { resolveStaffWorkspaceUrls } from '@/lib/workspace-urls';
import { SiteThemeToggle } from '@/components/shared/SiteThemeToggle';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { CmsArticleEditorProvider } from '@/components/cms/CmsArticleEditorContext';
import {
  CmsWriteHeaderActionsLazy,
  EditorialPlatformControlLazy,
  EditorSettingsMenuLazy,
  StaffSignOutDialogLazy,
} from '@/components/staff/StaffShellLazy';
import { UserProfileSettings } from '@/components/staff/UserProfileSettings';
import { EditorPreferencesProvider } from '@/components/cms/EditorPreferencesProvider';
import { Button } from '@/components/ui/button';
import { ROLES, type Role, USER_ROLE_LABELS } from '@/lib/constants';
import { canAccessCmsRoute, canAccessAdminPanel, isEditorLead } from '@/lib/cms-nav';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid, LibraryBig, CalendarDays, Images, LogOut, ExternalLink, Menu, X, ChevronRight, ChevronLeft,
  Feather, Tag, Shapes, MessageCircleReply, Activity, Timer, FileSignature, Layers, Megaphone, Trash,
  Newspaper, PanelLeftClose, PanelLeft, GitCompare,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
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
      { href: '/cms/articles/drafts', label: 'My drafts', icon: FileSignature },
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
  '/cms/articles/drafts': 'Drafts',
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

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/cms/articles/') && pathname.endsWith('/edit')) return 'Story editor';
  return 'CMS Workspace';
}

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === '/cms') return false;
  if (href === '/cms/articles/new') {
    return pathname === '/cms/articles/new'
      || (pathname.startsWith('/cms/articles/') && pathname.endsWith('/edit'));
  }
  if (href === '/cms/articles') return pathname === '/cms/articles';
  return pathname.startsWith(`${href}/`) || pathname.startsWith(href);
}

const NavLink = memo(function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      className={cn(
        'admin-nav-item group',
        active && 'admin-nav-item--active',
      )}
    >
      <span className={cn('admin-nav-icon', active && 'admin-nav-icon--active')}>
        <item.icon className="h-[14px] w-[14px]" strokeWidth={active ? 2.25 : 2} />
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-500 shrink-0">
          {item.badge}
        </span>
      )}
      {active && <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
    </Link>
  );
});

export function CmsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [publicSiteUrl, setPublicSiteUrl] = useState('/');
  const [adminUrl, setAdminUrl] = useState('/admin');

  useEffect(() => {
    const urls = resolveStaffWorkspaceUrls();
    setPublicSiteUrl(urls.publicSiteUrl);
    setAdminUrl(urls.adminUrl);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const role = session?.user?.role as Role | undefined;
  const roleLabel = role ? (USER_ROLE_LABELS[role] || 'User') : 'User';
  const article = /^[aeiou]/i.test(roleLabel) ? 'an' : 'a';
  const tooltipLabel = `Visit homepage as ${article} ${roleLabel}`;

  const showAdminPanel = canAccessAdminPanel(role);
  const editorLead = isEditorLead(role);
  const isWriteWorkspace = pathname === '/cms/articles/new'
    || (pathname.startsWith('/cms/articles/') && pathname.endsWith('/edit'));

  const visibleNavGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessCmsRoute(role, item.href)),
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
        <Link href="/cms" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          <div className="admin-brand-icon">
            <Feather className="h-[17px] w-[17px]" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[14px] tracking-[0.05em] uppercase text-foreground/90 leading-tight">Editorial Suite</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 min-h-0 px-3 py-2 overflow-y-auto space-y-5">
        {visibleNavGroups.map((group) => (
          <div key={group.label}>
            <div className="admin-nav-group-label">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isNavActive(pathname, item.href)}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}

        {showAdminPanel && (
          <div>
            <div className="admin-nav-group-label">Platform</div>
            <Link
              href={adminUrl}
              className="admin-nav-item group"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileOpen(false)}
            >
              <span className="admin-nav-icon">
                <Layers className="h-[14px] w-[14px]" strokeWidth={2} />
              </span>
              <span className="flex-1 truncate">Full admin panel</span>
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
            <div
              className="admin-user-avatar"
              style={{ background: 'hsl(var(--admin-rose) / 0.2)', color: 'hsl(var(--admin-rose))' }}
            >
              {(session.user.name ?? 'E').charAt(0).toUpperCase()}
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

  const cmsThemeStyles = {
    '--admin-rose': '199 89% 48%',
    '--admin-violet': '175 70% 41%',
  } as React.CSSProperties;

  return (
    <EditorPreferencesProvider>
    <div className={cn("admin-shell cms-shell min-h-screen flex min-h-[100dvh]", isCollapsed && "admin-shell--collapsed")} style={cmsThemeStyles}>
      <aside className={cn("admin-sidebar cms-sidebar hidden md:flex flex-col shrink-0", isCollapsed && "admin-sidebar--collapsed")}>
        {sidebar}
      </aside>

      <div className="admin-shell-main flex-1 flex flex-col min-w-0 min-h-0">
        <header className="admin-header cms-header">
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
              <span className="admin-header-crumb">Editorial</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <span className="admin-header-title truncate">{getPageTitle(pathname)}</span>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <Feather className="h-4 w-4 text-sky-400 shrink-0" />
            </div>
          </div>

          <div className="admin-header-toolbar cms-header-toolbar flex items-center gap-1 sm:gap-1.5 shrink-0">
            {isWriteWorkspace ? <CmsWriteHeaderActionsLazy /> : null}
            <EditorSettingsMenuLazy variant="header" />
            <EditorialPlatformControlLazy />
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
              onClick={() => setShowSignOutConfirm(true)}
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
              "admin-sidebar admin-sidebar--drawer cms-sidebar h-full flex flex-col shadow-2xl transition-transform duration-300 ease-out transform",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>

        <main className="admin-main cms-main flex-1 overflow-auto min-h-0">
          <div className={cn('admin-main-inner cms-main-inner', isWriteWorkspace && 'cms-main-inner--write')}>
            {isWriteWorkspace ? (
              <CmsArticleEditorProvider>{children}</CmsArticleEditorProvider>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {showSignOutConfirm ? (
        <StaffSignOutDialogLazy open onClose={() => setShowSignOutConfirm(false)} />
      ) : null}
      
      <UserProfileSettings open={showProfileSettings} onOpenChange={setShowProfileSettings} />
    </div>
    </EditorPreferencesProvider>
  );
}