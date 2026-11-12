'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { BarChart3, BookOpen, ChevronRight, Home, Info, Mail, Menu, Newspaper, Search, X } from 'lucide-react';
import { CategoryIconDisplay } from '@/components/category/CategoryIconDisplay';
import { MemberNavMenuLinks } from '@/components/members/MemberNavMenuLinks';
import { categoryColorVars, categoryTextStyle, getNavbarColorClasses } from '@/lib/category-icons';
import { usePublicHref } from '@/lib/public-href-client';
import { useLocale } from '@/components/shared/LocaleProvider';
import '@/app/phone-dock.css';

/**
 * The phone's floating tab bar for the public site (below 768px only; the
 * stylesheet hides it from 768px up, so the desktop page is untouched).
 *
 * It is the Grid Explorer phone app's dock (`.gp-nav` in the cards look),
 * carried out to the newsroom so the two read as one app. Every destination is
 * one the navbar above already has: Home, Grid Explorer, Articles, Magazine,
 * and the navbar's own menu sheet. No route is introduced here.
 *
 * Not rendered inside /grid-explorer: the phone app there is full-screen and
 * has its own dock, and two docks would stack.
 */
function DockLink({
  href,
  on,
  label,
  children,
  onClick,
  prefetch = false,
}: {
  href: string;
  on: boolean;
  label: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** The Grid Explorer is the dock's heaviest hop; prefetching it keeps the
      homepage → app transition seamless (owner, 2026-11-12). */
  prefetch?: boolean;
}) {
  const resolved = usePublicHref(href);
  return (
    <Link
      href={resolved}
      prefetch={prefetch}
      className={on ? 'is-on' : undefined}
      aria-current={on ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="hp-dock__ind" aria-hidden>
        {children}
      </span>
      {label}
    </Link>
  );
}

export function PhoneDock({
  menuOpen,
  onMenuToggle,
  onHomeClick,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
  onHomeClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  if (pathname.startsWith('/grid-explorer')) return null;

  const bn = locale === 'bn';
  const within = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // While the menu sheet is open it is the place the reader is, so it holds the
  // highlight alone rather than sharing it with the page underneath.
  const at = (hit: boolean) => hit && !menuOpen;

  return (
    <nav className="hp-dock" aria-label="Quick navigation">
      <DockLink href="/" on={at(pathname === '/')} label={t('nav.home')} onClick={onHomeClick}>
        <Home />
      </DockLink>
      <DockLink href="/grid-explorer" prefetch on={false} label={bn ? t('nav.gridExplorer') : 'Grid'}>
        <BarChart3 />
      </DockLink>
      <DockLink
        href="/articles"
        on={at(within('/articles') || within('/categories'))}
        label={bn ? t('nav.latest') : 'News'}
      >
        <Newspaper />
      </DockLink>
      <DockLink href="/magazine" on={at(within('/magazine'))} label={t('nav.magazine')}>
        <BookOpen />
      </DockLink>
      <button
        type="button"
        className={menuOpen ? 'is-on' : undefined}
        aria-expanded={menuOpen}
        aria-controls="phone-menu-sheet"
        onClick={onMenuToggle}
      >
        <span className="hp-dock__ind" aria-hidden>
          {menuOpen ? <X /> : <Menu />}
        </span>
        {bn ? 'মেনু' : 'Menu'}
      </button>
    </nav>
  );
}

export type SheetCategory = {
  name: string;
  slug: string;
  color?: string | null;
  icon?: string | null;
  iconImageUrl?: string | null;
};

function SheetRow({ href, icon, label, on, onNavigate, style }: {
  href: string; icon: ReactNode; label: string; on?: boolean; onNavigate: () => void; style?: CSSProperties;
}) {
  const resolved = usePublicHref(href);
  return (
    <Link href={resolved} prefetch={false} className={`hp-sheet__row${on ? ' is-on' : ''}`} aria-current={on ? 'page' : undefined} onClick={onNavigate} style={style}>
      <span className="hp-sheet__ico" aria-hidden>{icon}</span>
      <span className="hp-sheet__label">{label}</span>
      <ChevronRight className="hp-sheet__chev" aria-hidden />
    </Link>
  );
}

/**
 * The dock's Menu, as a bottom sheet in the Grid Explorer app's style
 * (phone only; app/phone-dock.css hides it from 768px, where the navbar's own
 * panel is unchanged). Same destinations the old top panel carried — search,
 * the member/staff entry and every category — plus the dock's four pages, so
 * the sheet is a complete map of the site. Closes on scrim tap, the close
 * button, Escape, any link, or a downward swipe on the handle/header.
 */
export function PhoneMenuSheet({ open, onClose, categories }: {
  open: boolean; onClose: () => void; categories: SheetCategory[];
}) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const bn = locale === 'bn';
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  useEffect(() => { if (!open) setDrag(0); }, [open]);

  if (!open || pathname.startsWith('/grid-explorer')) return null;
  const within = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const grab = {
    onTouchStart: (e: React.TouchEvent) => { start.current = e.touches[0].clientY; },
    onTouchMove: (e: React.TouchEvent) => { if (start.current != null) setDrag(Math.max(0, e.touches[0].clientY - start.current)); },
    onTouchEnd: () => { if (drag > 80) onClose(); else setDrag(0); start.current = null; },
  };

  return (
    <div className="hp-sheet-root">
      <div className="hp-sheet__scrim" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        id="phone-menu-sheet"
        className="hp-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={bn ? 'মেনু' : 'Menu'}
        tabIndex={-1}
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      >
        <div className="hp-sheet__head" {...grab}>
          <span className="hp-sheet__grab" aria-hidden />
          <div className="hp-sheet__bar">
            <h2>{bn ? 'মেনু' : 'Menu'}</h2>
            <button type="button" className="hp-sheet__close" onClick={onClose} aria-label="Close menu">
              <X aria-hidden width={20} height={20} />
            </button>
          </div>
        </div>
        <div className="hp-sheet__body">
          <p className="hp-sheet__sec">{bn ? 'পাতা ও টুল' : 'Pages & tools'}</p>
          <div className="hp-sheet__group">
            <SheetRow href="/search" icon={<Search />} label={t('nav.searchArticles')} on={within('/search')} onNavigate={onClose} />
            <SheetRow href="/" icon={<Home />} label={t('nav.home')} on={pathname === '/'} onNavigate={onClose} />
            <SheetRow href="/grid-explorer" icon={<BarChart3 />} label={t('nav.gridExplorer')} onNavigate={onClose} />
            <SheetRow href="/articles" icon={<Newspaper />} label={t('nav.latest')} on={within('/articles')} onNavigate={onClose} />
            <SheetRow href="/magazine" icon={<BookOpen />} label={t('nav.magazine')} on={within('/magazine')} onNavigate={onClose} />
            <SheetRow href="/about" icon={<Info />} label={bn ? 'আমাদের সম্পর্কে' : 'About'} on={within('/about')} onNavigate={onClose} />
            <SheetRow href="/contact" icon={<Mail />} label={bn ? 'যোগাযোগ' : 'Contact'} on={within('/contact')} onNavigate={onClose} />
          </div>

          <p className="hp-sheet__sec">{bn ? 'বিভাগ' : 'Categories'}</p>
          <div className="hp-sheet__group">
            {categories.map((c) => {
              const colors = getNavbarColorClasses(c.name, c.color);
              return (
                <SheetRow
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  on={pathname === `/categories/${c.slug}`}
                  onNavigate={onClose}
                  style={categoryColorVars(c.color)}
                  label={c.name}
                  icon={
                    <CategoryIconDisplay
                      icon={c.icon}
                      iconImageUrl={c.iconImageUrl}
                      name={c.name}
                      size={18}
                      className={`h-[18px] w-[18px] ${colors.useCustom ? 'category-nav--custom' : colors.text}`}
                      style={colors.useCustom ? categoryTextStyle(c.color) : undefined}
                    />
                  }
                />
              );
            })}
          </div>

          <p className="hp-sheet__sec">{bn ? 'সদস্য' : 'Members'}</p>
          <div className="hp-sheet__group hp-sheet__members" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) onClose(); }}>
            <MemberNavMenuLinks />
          </div>
        </div>
      </div>
    </div>
  );
}
