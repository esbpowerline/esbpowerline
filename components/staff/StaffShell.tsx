'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, ExternalLink, LogOut, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useSession } from '@/utils/supabase/auth-context';
import { cn } from '@/lib/utils';
import { resolveStaffWorkspaceUrls } from '@/lib/workspace-urls';
import { ROLES, type Role, USER_ROLE_LABELS } from '@/lib/constants';
import { SiteThemeToggle } from '@/components/shared/SiteThemeToggle';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { StaffSignOutDialogLazy } from '@/components/staff/StaffShellLazy';
import { UserProfileSettings } from '@/components/staff/UserProfileSettings';
import { Button } from '@/components/ui/button';

/**
 * The one shell for both staff surfaces: sidebar, header, phone drawer.
 *
 * AdminShell and CmsShell were two 350-line copies of this component that had
 * drifted — the CMS repainted the accent inline (sky/teal against the admin's
 * rose), tinted its avatar by hand, locked body scroll under the drawer where
 * the admin did not, and hid its desktop sidebar on phones where the admin
 * did not. Each is now only what is genuinely different: its nav, its brand,
 * its header tools and the providers it needs.
 *
 * Navigation is ONE button. There used to be a hamburger (`md:hidden`) beside
 * a collapse toggle (`hidden md:flex`), and because `.admin-icon-btn {
 * display: flex }` loads after Tailwind's utilities neither responsive class
 * ever applied — both buttons showed, doing the same job. The toggle now
 * collapses the rail from 768px up and opens the drawer below that.
 *
 * A collapsed rail is icons only, so every icon names itself on hover and on
 * keyboard focus, to the right of the rail where it covers nothing.
 */

export type StaffNavItem = { href: string; label: string; icon: LucideIcon };
export type StaffNavGroup = { label: string; items: StaffNavItem[] };
/** The link to the other workspace, at the foot of the nav. */
export type StaffCrossLink = { group: string; href: string; label: string; icon: LucideIcon };
type WorkspaceUrls = ReturnType<typeof resolveStaffWorkspaceUrls>;

const PHONE_QUERY = '(max-width: 767px)';

const NavLink = memo(function NavLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: StaffNavItem;
  active: boolean;
  collapsed: boolean;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <ModernTooltip label={item.label} side="right" variant="chrome" fast alwaysShow disabled={!collapsed} className="w-full">
      <Link
        href={item.href}
        prefetch={false}
        onClick={onClick}
        // The text label is display:none in a collapsed rail, which would
        // leave the link with no accessible name at all.
        aria-label={collapsed ? item.label : undefined}
        aria-current={active ? 'page' : undefined}
        className={cn('admin-nav-item group', active && 'admin-nav-item--active')}
      >
        <span className={cn('admin-nav-icon', active && 'admin-nav-icon--active')}>
          <item.icon className="h-[14px] w-[14px]" strokeWidth={active ? 2.25 : 2} />
        </span>
        <span className="flex-1 truncate">{item.label}</span>
        {active && <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
      </Link>
    </ModernTooltip>
  );
});

type StaffShellProps = {
  /** Adds the `cms-*` hooks the story editor's focus and preview modes key on. */
  surface: 'admin' | 'cms';
  home: string;
  brand: { label: string; icon: LucideIcon };
  crumb: string;
  groups: StaffNavGroup[];
  canSee: (role: Role | undefined, href: string) => boolean;
  isActive: (pathname: string, href: string) => boolean;
  pageTitle: (pathname: string) => string;
  crossLink?: (role: Role | undefined, urls: WorkspaceUrls) => StaffCrossLink | null;
  headerActions?: ReactNode;
  /** Runs before a nav click — the admin change queue uses it to hold
   *  navigation while edits are unsaved. Call preventDefault to stop it. */
  guardNavigation?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Return true when the sign-out was handled (e.g. unsaved changes). */
  interceptSignOut?: () => boolean;
  mainInnerClassName?: string;
  /** Docks and dialogs mounted beside the shell. */
  after?: ReactNode;
  children: ReactNode;
};

export function StaffShell({
  surface,
  home,
  brand,
  crumb,
  groups,
  canSee,
  isActive,
  pageTitle,
  crossLink,
  headerActions,
  guardNavigation,
  interceptSignOut,
  mainInnerClassName,
  after,
  children,
}: StaffShellProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isPhone, setIsPhone] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [urls, setUrls] = useState<WorkspaceUrls | null>(null);
  const isCms = surface === 'cms';

  useEffect(() => {
    setUrls(resolveStaffWorkspaceUrls());
    // A tablet opens on the icon rail; the reader can still widen it.
    if (window.innerWidth < 1024) setIsCollapsed(true);
    const mq = window.matchMedia(PHONE_QUERY);
    const sync = () => setIsPhone(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // The page behind an open drawer must not scroll under the reader's thumb.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const role = session?.user?.role as Role | undefined;
  const roleLabel = role ? USER_ROLE_LABELS[role] || 'User' : 'User';
  const visitLabel = `Visit homepage as ${/^[aeiou]/i.test(roleLabel) ? 'an' : 'a'} ${roleLabel}`;

  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({ ...group, items: group.items.filter((item) => canSee(role, item.href)) }))
        .filter((group) => group.items.length > 0),
    [groups, canSee, role],
  );
  const cross = urls && crossLink ? crossLink(role, urls) : null;

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

  const navOpen = isPhone ? mobileOpen : !isCollapsed;
  const toggleNav = () => (isPhone ? setMobileOpen((o) => !o) : setIsCollapsed((c) => !c));
  const follow = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    guardNavigation?.(href, event);
    setMobileOpen(false);
  };

  const BrandIcon = brand.icon;
  const CrossIcon = cross?.icon;

  /** The drawer is never collapsed, so its links carry no tooltips. */
  const renderSidebar = (collapsed: boolean) => (
    <>
      <div className="admin-sidebar-brand">
        <Link href={home} className="flex items-center gap-3 group" onClick={follow(home)} aria-label={brand.label}>
          <div className="admin-brand-icon">
            <BrandIcon className="h-[17px] w-[17px]" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="admin-brand-label">{brand.label}</div>
          </div>
        </Link>
      </div>

      <nav className="admin-sidebar-nav" aria-label={`${brand.label} navigation`}>
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <div className="admin-nav-group-label">{group.label}</div>
            <div className="admin-nav-group">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  collapsed={collapsed}
                  onClick={follow(item.href)}
                />
              ))}
            </div>
          </div>
        ))}

        {cross && CrossIcon && (
          <div>
            <div className="admin-nav-group-label">{cross.group}</div>
            <ModernTooltip label={cross.label} side="right" variant="chrome" fast alwaysShow disabled={!collapsed} className="w-full">
              {/* Both cross-workspace links open a new tab, so neither can
                  drop unsaved work in the panel it leaves. */}
              <Link
                href={cross.href}
                target="_blank"
                rel="noreferrer"
                aria-label={collapsed ? cross.label : undefined}
                className="admin-nav-item group"
                onClick={() => setMobileOpen(false)}
              >
                <span className="admin-nav-icon">
                  <CrossIcon className="h-[14px] w-[14px]" strokeWidth={2} />
                </span>
                <span className="flex-1 truncate">{cross.label}</span>
                <ExternalLink className="h-3 w-3 opacity-40 shrink-0" />
              </Link>
            </ModernTooltip>
          </div>
        )}
      </nav>

      <div className="admin-sidebar-footer">
        {session?.user && (
          <ModernTooltip
            label={session.user.name ?? 'Profile'}
            hint="Profile settings"
            side="right"
            variant="chrome"
            fast
            alwaysShow
            disabled={!collapsed}
            className="w-full"
          >
            <button
              type="button"
              className="admin-user-capsule"
              aria-label={collapsed ? `${session.user.name ?? 'Profile'} — profile settings` : undefined}
              onClick={() => setShowProfileSettings(true)}
            >
              <div className="admin-user-avatar">{(session.user.name ?? 'U').charAt(0).toUpperCase()}</div>
              <div className="admin-user-capsule__text">
                <div className="admin-user-capsule__name">{session.user.name}</div>
                <div className="admin-role-pill">{ROLES[session.user.role]?.name ?? session.user.role}</div>
              </div>
            </button>
          </ModernTooltip>
        )}
      </div>
    </>
  );

  return (
    <div
      className={cn(
        'admin-shell min-h-screen flex min-h-[100dvh]',
        isCms && 'cms-shell',
        isCollapsed && 'admin-shell--collapsed',
      )}
    >
      <aside id="staff-nav" className={cn('admin-sidebar', isCollapsed && 'admin-sidebar--collapsed')}>
        {renderSidebar(isCollapsed)}
      </aside>

      <div className="admin-shell-main flex-1 flex flex-col min-w-0 min-h-0">
        <header className={cn('admin-header', isCms && 'cms-header')}>
          <div className="flex items-center gap-3 min-w-0">
            <ModernTooltip
              label={navOpen ? 'Collapse menu' : 'Expand menu'}
              side="bottom"
              variant="chrome"
              fast
              alwaysShow
              disabled={isPhone}
            >
              <button
                type="button"
                onClick={toggleNav}
                className="admin-icon-btn"
                aria-label={navOpen ? 'Collapse menu' : 'Expand menu'}
                aria-expanded={navOpen}
                aria-controls="staff-nav"
              >
                {navOpen ? (
                  <PanelLeftClose className="h-[18px] w-[18px]" />
                ) : (
                  <PanelLeft className="h-[18px] w-[18px]" />
                )}
              </button>
            </ModernTooltip>

            <div className="admin-header-crumbs">
              <span className="admin-header-crumb">{crumb}</span>
              <ChevronRight className="admin-header-crumb-sep h-3 w-3 shrink-0" />
              <span className="admin-header-title truncate">{pageTitle(pathname)}</span>
            </div>
          </div>

          <div className="admin-header-toolbar cms-header-toolbar flex items-center gap-1 sm:gap-1.5 shrink-0">
            {headerActions}
            <ModernTooltip label={visitLabel} variant="chrome" alwaysShow>
              <Link href={urls?.publicSiteUrl ?? '/'} target="_blank" rel="noreferrer" className="cms-header-public-link">
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
                if (!interceptSignOut?.()) setShowSignOutConfirm(true);
              }}
            >
              <LogOut className="h-3.5 w-3.5 lg:mr-1.5" />
              <span className="hidden lg:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <div
          className={cn(
            'md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-all duration-300 ease-in-out',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
          aria-hidden={!mobileOpen}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className={cn(
              'admin-sidebar admin-sidebar--drawer h-full shadow-2xl transition-transform duration-300 ease-out transform',
              mobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebar(false)}
          </aside>
        </div>

        <main className={cn('admin-main flex-1 overflow-auto min-h-0', isCms && 'cms-main')}>
          <div className={cn('admin-main-inner', isCms && 'cms-main-inner', mainInnerClassName)}>{children}</div>
        </main>
      </div>

      {after}
      <UserProfileSettings open={showProfileSettings} onOpenChange={setShowProfileSettings} />
      {showSignOutConfirm ? <StaffSignOutDialogLazy open onClose={() => setShowSignOutConfirm(false)} /> : null}
    </div>
  );
}
