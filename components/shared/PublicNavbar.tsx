'use client';

import Link from 'next/link';
import { ThemeBanner } from '@/components/shared/ThemeBanner';

import { Search, Menu, X, Newspaper, BookOpen, BarChart3, Home } from 'lucide-react';
import { useMemo, useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PublicHrefProvider, usePublicHref } from '@/lib/public-href-client';
import type { PublicCategory } from '@/lib/category-types';
import { CATEGORIES } from '@/lib/constants';
import { slugify, cn } from '@/lib/utils';
import { localizeCategoryFields } from '@/lib/i18n/categories';
import {
  categoryColorVars,
  categoryTextStyle,
  categoryUnderlineStyle,
  getNavbarColorClasses,
} from '@/lib/category-icons';
import { CategoryIconDisplay } from '@/components/category/CategoryIconDisplay';
import type { TickerItem } from '@/components/news/LiveMarketTicker';

import { PublicMarketStrip } from '@/components/news/PublicMarketStrip';
import { MemberAuthButton } from '@/components/members/MemberAuthButton';
import { MemberNavMenuLinks } from '@/components/members/MemberNavMenuLinks';
import { useLocale } from '@/components/shared/LocaleProvider';
import { SiteThemeToggle } from '@/components/shared/SiteThemeToggle';
import { PhoneDock } from '@/components/shared/PhoneDock';
import { PhoneAppBarLogo, PhoneThemeCycle } from '@/components/shared/PhoneAppBar';

type NavCategory = {
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  iconImageUrl?: string | null;
};

function isHubSectionActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Home goes home — and when you are already there, it goes to the top.
 *
 * A `<Link href="/">` clicked from `/` is a navigation to the route you are
 * already on, so nothing moves: the reader is four screens down the homepage,
 * presses Home, and the page sits still. That reads as a broken control, and it
 * is the one link a reader reaches for precisely when they are lost.
 *
 * Modifier clicks and anything that is not the primary button are left alone —
 * ctrl/cmd/middle-click means "open in a new tab", and swallowing that to
 * scroll the current page would be worse than doing nothing. Off the homepage
 * the handler does nothing at all and the ordinary navigation runs, which
 * already lands at the top.
 */
function useHomeClick() {
  const pathname = usePathname();
  return (event: React.MouseEvent<HTMLAnchorElement>, onNavigate?: () => void) => {
    if (pathname !== '/') return;
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    onNavigate?.();
    // Smooth unless the reader has asked for less motion, in which case a jump
    // is the whole point rather than a compromise.
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };
}

function PublicNavLink({
  href,
  className,
  style,
  children,
  onClick,
  'aria-current': ariaCurrent,
  'aria-label': ariaLabel,
  prefetch = false,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  'aria-current'?: 'page' | undefined;
  'aria-label'?: string;
  /**
   * Off by default. Next prefetches every `<Link>` that enters the viewport,
   * and with no `loading.tsx` the payload is the destination's *entire* RSC
   * tree — measured at ~20 KB each. The navbar renders the category ribbon
   * twice (desktop rail and mobile sheet), so ten categories became twenty
   * speculative page loads on every view of every page, for links a reader
   * mostly scrolls past. The five primary hubs below opt back in explicitly.
   */
  prefetch?: boolean;
}) {
  const resolvedHref = usePublicHref(href);
  return (
    <Link
      href={resolvedHref}
      prefetch={prefetch}
      className={className}
      style={style}
      onClick={onClick}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

export function PublicNavbar({
  categories = [],
  tickerItems,
}: {
  categories?: PublicCategory[];
  tickerItems?: TickerItem[];
}) {
  const { locale, t } = useLocale();
  const navCategories: NavCategory[] = useMemo(() => {
    const source = categories.length
      ? categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          description: c.description,
          color: c.color,
          icon: c.icon,
          iconImageUrl: c.iconImageUrl,
        }))
      : CATEGORIES.map((c) => ({
          name: c,
          slug: slugify(c),
          description: null,
          color: null,
          icon: null,
          iconImageUrl: null,
        }));
    return source.map((cat) => {
      const localized = localizeCategoryFields(locale, cat);
      return { ...cat, name: localized.name, description: localized.description };
    });
  }, [categories, locale]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const onHomeClick = useHomeClick();
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const activeScrollIdRef = useRef<number | null>(null);

  /**
   * The category ribbon folds away inside a Grid Explorer tab.
   *
   * The explorer's deeper tabs — Technical Information most of all — are dense
   * enough to want the whole viewport, and the ten-category ribbon is
   * navigation for the newsroom, not for the tab a reader is reading. It folds
   * on any tab but Overview and comes back on Overview, on leaving the page,
   * and whenever the mobile menu is open, so the ribbon is never hidden while
   * someone is trying to navigate with it.
   *
   * `esb-grid-tab-change` has been dispatched by the explorer since it was
   * written and nothing has ever listened to it. This is its first listener.
   */
  const [gridImmersive, setGridImmersive] = useState(false);

  useEffect(() => {
    function onTabChange(event: Event) {
      const detail = (event as CustomEvent<{ tab?: string; picked?: boolean }>).detail;
      const tab = detail?.tab;
      // Overview folds too once the reader has picked a tab by hand, so every
      // tab click lands the explorer in the same place. A first load on
      // Overview (nothing picked yet) keeps the ribbon.
      setGridImmersive(Boolean(tab) && (tab !== 'overview' || Boolean(detail?.picked)));
    }
    window.addEventListener('esb-grid-tab-change', onTabChange);
    return () => window.removeEventListener('esb-grid-tab-change', onTabChange);
  }, []);

  // Leaving the explorer restores it: the flag is about a tab, and no other
  // page has tabs to be inside of.
  useEffect(() => {
    if (!pathname.startsWith('/grid-explorer')) setGridImmersive(false);
  }, [pathname]);

  useEffect(() => {
    const targetPaths = ['/grid-explorer', '/articles', '/magazine', '/about', '/contact'];
    const isTarget = targetPaths.some(p => pathname.startsWith(p));
    
    if (isTarget && prevPathname.current !== pathname) {
      const timer = setTimeout(() => {
        const banner = document.querySelector('.site-banner-shell');
        if (banner) {
          if (activeScrollIdRef.current !== null) {
            cancelAnimationFrame(activeScrollIdRef.current);
            activeScrollIdRef.current = null;
          }

          const bannerHeight = banner.getBoundingClientRect().height;
          
          const startY = window.scrollY;
          const targetY = bannerHeight;
          const difference = targetY - startY;
          const duration = 950; // Premium 950ms natural transition duration
          const startTime = performance.now();

          const easeInOutCubic = (t: number) => {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
          };

          const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutCubic(progress);
            
            window.scrollTo(0, startY + difference * ease);

            if (progress < 1) {
              activeScrollIdRef.current = requestAnimationFrame(step);
            } else {
              activeScrollIdRef.current = null;
            }
          };

          activeScrollIdRef.current = requestAnimationFrame(step);
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        if (activeScrollIdRef.current !== null) {
          cancelAnimationFrame(activeScrollIdRef.current);
        }
      };
    } else if (!isTarget && prevPathname.current !== pathname) {
      if (activeScrollIdRef.current !== null) {
        cancelAnimationFrame(activeScrollIdRef.current);
        activeScrollIdRef.current = null;
      }
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);

      return () => clearTimeout(timer);
    }
    prevPathname.current = pathname;
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);



  useEffect(() => {
    if (!mobileOpen) return;

    const preventScroll = (e: Event) => {
      const panel = document.getElementById('mobile-categories-panel');
      if (panel && panel.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventScroll);
    };
  }, [mobileOpen]);

  return (
    <PublicHrefProvider>
      <div className="site-banner-shell w-full flex justify-center">
        <div className="container container--shell px-0">
          <div className="site-banner-frame border-l border-r border-b border-border/40 overflow-hidden">
            <PublicNavLink
              href="/"
              // Prefetch home from every page but home. Next prefetches the
              // current route like any other, and the homepage's full RSC
              // payload is the largest on the site — 64 KB, fetched by the
              // homepage on every cold load of itself (2026-09-19, production
              // build, phone viewport) to warm a navigation this link cannot
              // make: on `/` it scrolls to the top instead (useHomeClick).
              prefetch={pathname !== '/'}
              className="w-full block transition-opacity hover:opacity-95"
              onClick={(event) => onHomeClick(event, () => setMobileOpen(false))}
            >
              {/* The illustrated banner, by Hamim's decision (2026-09-03): the
                  typographic masthead that replaced it on 1 Sep is retired. */}
              <ThemeBanner />
            </PublicNavLink>
            <PublicMarketStrip energyItems={tickerItems} />
          </div>
        </div>
      </div>

      <nav className="public-nav-bar" aria-label="Primary">
        <div className="container container--shell public-nav-bar__inner">
          <div className="public-nav-bar__hub-band">
            <div className="public-nav-bar__main">
              <div className="public-nav-bar__start">
                <PhoneAppBarLogo />
                <div className="public-nav-bar__pill-cluster public-nav-bar__start-cluster">
                  <div className="public-nav-bar__utilities">
                    <Link
                      href="/"
                      // The masthead logo above already prefetches home; this
                      // pill is the same destination, and two Links to one href
                      // are two prefetches.
                      prefetch={false}
                      className={`public-nav-bar__pill-btn public-nav-bar__pill-btn--paired public-nav-bar__home${
                        pathname === '/' ? ' public-nav-bar__home--active' : ''
                      }`}
                      aria-label={t('nav.home')}
                      onClick={(event) => onHomeClick(event, () => setMobileOpen(false))}
                    >
                      <Home className="icon-sm" aria-hidden />
                      <span className="public-nav-bar__pill-label">{t('nav.home')}</span>
                    </Link>

                    <span className="public-nav-bar__pill-divider hidden sm:block" aria-hidden />

                    <PublicNavLink
                      href="/search"
                    prefetch
                      className={`public-nav-bar__pill-btn public-nav-bar__pill-btn--paired public-nav-bar__search-pill public-nav-bar__utility-btn${
                        pathname === '/search' ? ' public-nav-bar__utility-btn--active' : ''
                      }`}
                      aria-label={t('nav.search')}
                    >
                      <Search className="icon-sm opacity-85" strokeWidth={2} aria-hidden />
                      <span className="public-nav-bar__pill-label public-nav-bar__pill-label--search">
                        {t('nav.search')}
                      </span>
                    </PublicNavLink>
                  </div>
                </div>
              </div>

              <div className="public-nav-bar__center flex">
                <div className="public-nav-bar__hub" role="group" aria-label="Primary sections">
                  <PublicNavLink
                    href="/articles"
                    prefetch
                    className={`public-nav-bar__hub-link public-nav-bar__hub-link--latest${
                      isHubSectionActive(pathname, '/articles') ? ' public-nav-bar__hub-link--active' : ''
                    }`}
                    aria-label="Articles"
                  >
                    <Newspaper className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    <span className="hidden lg:inline">{t('nav.latest')}</span>
                  </PublicNavLink>

                  <PublicNavLink
                    href="/grid-explorer"
                    prefetch
                    className={`public-nav-bar__hub-link public-nav-bar__hub-link--grid${
                      isHubSectionActive(pathname, '/grid-explorer') ? ' public-nav-bar__hub-link--active' : ''
                    }`}
                    aria-label="Grid Explorer"
                    aria-current={isHubSectionActive(pathname, '/grid-explorer') ? 'page' : undefined}
                  >
                    <BarChart3 className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    <span className="hidden lg:inline">{t('nav.gridExplorer')}</span>
                  </PublicNavLink>

                  {/* No Analysis link in the hub, deliberately. An event study
                      is a reading OF the archive, so it is entered from the
                      archive — the date row in the Grid Explorer — rather than
                      standing beside it as a fifth destination. */}
                  <PublicNavLink
                    href="/magazine"
                    prefetch
                    className={`public-nav-bar__hub-link public-nav-bar__hub-link--magazine${
                      isHubSectionActive(pathname, '/magazine') ? ' public-nav-bar__hub-link--active' : ''
                    }`}
                    aria-label="Magazine"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    <span className="hidden lg:inline">{t('nav.magazine')}</span>
                  </PublicNavLink>
                </div>
              </div>

              <div className="public-nav-bar__end">
                <div className="public-nav-bar__pill-cluster public-nav-bar__utility-cluster">
                  <div className="public-nav-bar__utilities">
                    <MemberAuthButton />

                    <span className="public-nav-bar__pill-divider hidden sm:block" aria-hidden />

                    <SiteThemeToggle className="public-nav-bar__themes" />
                    <PhoneThemeCycle />
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="public-nav-bar__menu-btn lg:hidden tap-safe"
                    aria-label="Toggle menu"
                  >
                    {mobileOpen ? <X className="icon-md" /> : <Menu className="icon-md" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`public-nav-bar__categories-shell public-nav-bar__categories hidden lg:block${
              gridImmersive && !mobileOpen ? ' public-nav-bar__categories--folded' : ''
            }`}
            aria-hidden={gridImmersive && !mobileOpen ? true : undefined}
          >
            <div
              className="category-nav-ribbon category-nav-ribbon--desktop grid divide-x divide-border/40"
              style={{ gridTemplateColumns: `repeat(${navCategories.length}, minmax(0, 1fr))` }}
            >
              {navCategories.map((c) => {
                const href = `/categories/${c.slug}`;
                const isActive = pathname === `/categories/${c.slug}`;
                const colors = getNavbarColorClasses(c.name, c.color);

                return (
                  <PublicNavLink
                    key={c.slug}
                    href={href}
                    style={categoryColorVars(c.color)}
                    className={`category-nav-cell group relative transition-all duration-200 select-none w-full overflow-hidden font-medium ${
                      isActive
                        ? `${colors.activeBg} text-foreground`
                        : `${colors.hoverBg} text-foreground hover:text-foreground`
                    }`}
                  >
                    <span
                      className={`absolute top-0 left-0 z-[2] h-[2px] w-full transition-transform duration-200 origin-left ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      } ${colors.useCustom ? 'category-nav-underline--custom' : colors.underline}`}
                      style={colors.useCustom ? categoryUnderlineStyle(c.color) : undefined}
                      aria-hidden
                    />
                    {/* Text only. Each cell used to carry a decorative icon —
                        an atom for "Renewables & Nuclear" adds nothing the
                        word does not, and ten of them made the strip read as a
                        toolbar. The mobile menu keeps its icons: there they
                        are tap targets, not decoration. */}
                    <span className="category-nav-cell__stack">
                      <span className="category-nav-label relative z-[1] font-sans">
                        {c.name}
                      </span>
                    </span>
                  </PublicNavLink>
                );
              })}
            </div>
          </div>
        </div>

        {mobileOpen && (
          <>
            <div
              className="lg:hidden absolute top-[calc(100%-1px)] left-0 right-0 h-[100vh] bg-black/40 backdrop-blur-sm z-[240] transition-opacity duration-200 touch-none"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div id="mobile-categories-panel" className="lg:hidden absolute top-[calc(100%-1px)] left-0 right-0 border-t border-border/70 bg-background/95 backdrop-blur-lg px-4 py-4 text-sm space-y-2 shadow-2xl max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain z-[250]">
              <PublicNavLink href="/search" className="flex items-center gap-2 py-1.5">
                <Search className="h-4 w-4" /> {t('nav.searchArticles')}
              </PublicNavLink>
              {/* Phone app bar keeps only logo, search and theme; the member
                  button moves here so it stays one tap from the dock's Menu. */}
              <div className="hp-appbar-auth md:hidden">
                <span>Members</span>
                <MemberAuthButton />
              </div>

              <div className="pt-4 pb-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Categories
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {navCategories.map((c) => {
                    const href = `/categories/${c.slug}`;
                    const isActive = pathname === href;
                    const colors = getNavbarColorClasses(c.name, c.color);
                    return (
                      <PublicNavLink 
                        key={c.slug} 
                        href={href} 
                        style={categoryColorVars(c.color)}
                        className={`flex items-center gap-2.5 py-2 px-2.5 rounded-xl border border-border/40 bg-muted/20 transition-all tap-safe group font-medium ${
                          isActive 
                            ? `${colors.activeBg} border-primary/30` 
                            : `${colors.hoverBg} text-foreground`
                        }`}
                      >
                        <CategoryIconDisplay 
                          icon={c.icon} 
                          iconImageUrl={c.iconImageUrl} 
                          name={c.name} 
                          size={9}
                          className={`transition-transform duration-200 group-hover:scale-110 shrink-0 h-[9px] w-[9px] ${
                            colors.useCustom ? 'category-nav--custom' : colors.text
                          }`}
                          style={colors.useCustom ? categoryTextStyle(c.color) : undefined}
                        />
                        <span className="font-medium text-[14px] leading-tight transition-colors duration-200 text-foreground">
                          {c.name}
                        </span>
                      </PublicNavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Phone only (hidden from 768px by app/phone-dock.css). A sibling of the
          nav, not a child: the nav is sticky with its own stacking context, and
          the dock has to float over the menu sheet the nav opens. */}
      <PhoneDock
        menuOpen={mobileOpen}
        onMenuToggle={() => setMobileOpen((open) => !open)}
        onHomeClick={(event) => onHomeClick(event, () => setMobileOpen(false))}
      />
    </PublicHrefProvider>
  );
}
