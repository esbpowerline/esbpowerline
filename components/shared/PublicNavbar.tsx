'use client';

import Link from 'next/link';
import Image from 'next/image';

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
import { LocaleToggle } from '@/components/shared/LocaleToggle';
import { useLocale } from '@/components/shared/LocaleProvider';
import { SiteThemeToggle } from '@/components/shared/SiteThemeToggle';

type NavCategory = {
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  iconImageUrl?: string | null;
};

function PublicNavLink({
  href,
  className,
  style,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: () => void;
}) {
  const resolvedHref = usePublicHref(href);
  return (
    <Link href={resolvedHref} className={className} style={style} onClick={onClick}>
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
  const [bannerSrc, setBannerSrc] = useState('/images/banner.jpg?v=5');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const activeScrollIdRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    const updateBanner = () => {
      const currentTheme = html.dataset.siteTheme;
      if (currentTheme === 'midnight') {
        setBannerSrc('/images/banner_midnight.jpg?v=5');
      } else if (currentTheme === 'dark') {
        setBannerSrc('/images/banner_dark.jpg?v=5');
      } else {
        setBannerSrc('/images/banner.jpg?v=5');
      }
    };
    
    updateBanner();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-site-theme') {
          updateBanner();
        }
      }
    });

    observer.observe(html, { attributes: true, attributeFilter: ['data-site-theme'] });

    return () => observer.disconnect();
  }, [mounted]);

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
            <PublicNavLink href="/" className="w-full block transition-opacity hover:opacity-95">
              <img
                src={bannerSrc}
                alt="ESB PowerLine — Safe Energy Safe Nation"
                className="site-banner__image block mx-auto"
                width={3728}
                height={343}
                onError={() => {
                  if (bannerSrc !== '/images/logo.jpg') {
                    setBannerSrc('/images/logo.jpg');
                  }
                }}
              />
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
                <div className="public-nav-bar__pill-cluster public-nav-bar__start-cluster">
                  <div className="public-nav-bar__utilities">
                    <Link
                      href="/"
                      className={`public-nav-bar__pill-btn public-nav-bar__pill-btn--paired public-nav-bar__home${
                        pathname === '/' ? ' public-nav-bar__home--active' : ''
                      }`}
                    >
                      <Home className="icon-sm" aria-hidden />
                      <span className="public-nav-bar__pill-label">{t('nav.home')}</span>
                    </Link>

                    <span className="public-nav-bar__pill-divider hidden sm:block" aria-hidden />

                    <LocaleToggle className="public-nav-bar__locale" />

                    <span className="public-nav-bar__pill-divider" aria-hidden />

                    <PublicNavLink
                      href="/search"
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
                    className={`public-nav-bar__hub-link public-nav-bar__hub-link--latest${
                      pathname === '/articles' ? ' public-nav-bar__hub-link--active' : ''
                    }`}
                  >
                    <Newspaper className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    <span className="hidden lg:inline">{t('nav.latest')}</span>
                  </PublicNavLink>

                  <PublicNavLink
                    href="/grid-explorer"
                    className={`public-nav-bar__hub-link public-nav-bar__hub-link--grid${
                      pathname.includes('/power-grid') ? ' public-nav-bar__hub-link--active' : ''
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    <span className="hidden lg:inline">{t('nav.gridExplorer')}</span>
                  </PublicNavLink>

                  <PublicNavLink
                    href="/magazine"
                    className={`public-nav-bar__hub-link public-nav-bar__hub-link--magazine${
                      pathname === '/magazine' ? ' public-nav-bar__hub-link--active' : ''
                    }`}
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

          <div className="public-nav-bar__categories-shell public-nav-bar__categories hidden lg:block">
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
                    <span className="category-nav-cell__stack">
                      <CategoryIconDisplay
                        icon={c.icon}
                        iconImageUrl={c.iconImageUrl}
                        name={c.name}
                        size={10}
                        className={`relative z-[1] h-2.5 w-2.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          colors.useCustom ? 'category-nav--custom' : colors.text
                        }`}
                        style={colors.useCustom ? categoryTextStyle(c.color) : undefined}
                      />
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
    </PublicHrefProvider>
  );
}
