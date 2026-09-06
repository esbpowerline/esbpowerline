'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  BookOpenCheck,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PenLine,
  Shield,
  UserRound,
} from 'lucide-react';
import { AccountAvatar } from '@/components/members/AccountAvatar';
import { useLocale } from '@/components/shared/LocaleProvider';
import { useMemberAccess } from '@/hooks/useMemberAccess';
import { signOutToPublicSite } from '@/lib/staff-sign-out';
import { cn } from '@/lib/utils';

export function AccountMenu() {
  const pathname = usePathname();
  const { t } = useLocale();
  const access = useMemberAccess();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMemberArea = pathname.startsWith('/members');

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      left: rect.right,
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setOpen((current) => {
      if (!current) updatePosition();
      return !current;
    });
  }, [updatePosition]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [close, open, updatePosition]);

  if (access.state === 'loading') {
    return (
      <span
        className="public-nav-bar__pill-btn public-nav-bar__pill-btn--paired public-nav-bar__account-pill public-nav-bar__pill-skeleton"
        aria-hidden
      />
    );
  }

  const menu = open && mounted ? createPortal(
    <div
      ref={menuRef}
      id="account-menu-panel"
      role="menu"
      className="account-menu__panel"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-100%)',
        zIndex: 99999,
      }}
    >
      {access.state === 'guest' ? (
        <>
          <div className="account-menu__header">
            <p className="account-menu__eyebrow">Account access</p>
            <p className="account-menu__title">Choose how to sign in</p>
          </div>
          <div className="account-menu__options">
            <Link prefetch={false} href="/members/login" role="menuitem" className="account-menu__option" onClick={close}>
              <span className="account-menu__option-icon account-menu__option-icon--member" aria-hidden>
                <BookOpenCheck className="h-4 w-4" />
              </span>
              <span className="account-menu__option-copy">
                <span className="account-menu__option-label">Member</span>
                <span className="account-menu__option-hint">Reading library, saves &amp; downloads</span>
              </span>
              <ChevronRight className="account-menu__option-arrow" aria-hidden />
            </Link>
            <Link prefetch={false} href="/login" role="menuitem" className="account-menu__option" onClick={close}>
              <span className="account-menu__option-icon account-menu__option-icon--staff" aria-hidden>
                <Shield className="h-4 w-4" />
              </span>
              <span className="account-menu__option-copy">
                <span className="account-menu__option-label">Staff</span>
                <span className="account-menu__option-hint">Editorial workspace &amp; admin tools</span>
              </span>
              <ChevronRight className="account-menu__option-arrow" aria-hidden />
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="account-menu__profile">
            {access.accountKind && access.initial ? (
              <AccountAvatar kind={access.accountKind} initial={access.initial} size="md" />
            ) : null}
            <div className="min-w-0">
              <p className="account-menu__profile-name">{access.userName}</p>
              <p className="account-menu__profile-role">
                {access.roleLabel}
                <span className="account-menu__signed-in">Signed in</span>
              </p>
            </div>
          </div>
          <div className="account-menu__actions">
            <Link
              prefetch={false}
              href={access.href}
              role="menuitem"
              className={cn(
                'account-menu__action workspace-open-control',
                access.accountKind && `account-menu__action--${access.accountKind}`,
                access.accountKind && `workspace-open-control--${access.accountKind}`,
              )}
              onClick={close}
            >
              {access.accountKind === 'member' ? (
                <BookOpenCheck className="h-4 w-4 shrink-0" />
              ) : access.accountKind === 'admin' ? (
                <LayoutDashboard className="h-4 w-4 shrink-0" />
              ) : (
                <PenLine className="h-4 w-4 shrink-0" />
              )}
              <span>
                {access.accountKind === 'member'
                  ? 'Open library'
                  : access.accountKind === 'admin'
                    ? 'Open admin'
                    : 'Open workspace'}
              </span>
            </Link>
            <button
              type="button"
              role="menuitem"
              className="account-menu__action account-menu__action--signout sign-out-control"
              onClick={() => {
                close();
                void signOutToPublicSite();
              }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'account-menu__trigger',
          'public-nav-bar__pill-btn',
          'public-nav-bar__pill-btn--paired',
          'public-nav-bar__account-pill',
          open && 'account-menu__trigger--open',
          access.signedIn && 'account-menu__trigger--signed-in',
          access.accountKind && `account-menu__trigger--${access.accountKind}`,
          isMemberArea && access.isMember && 'account-menu__trigger--active',
        )}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu-panel"
        aria-label={
          access.signedIn
            ? `Account menu — ${access.userName}`
            : t('nav.login')
        }
      >
        <span className="public-nav-bar__account-icon-slot" aria-hidden>
          {access.signedIn && access.accountKind && access.initial ? (
            <AccountAvatar kind={access.accountKind} initial={access.initial} compact />
          ) : (
            <UserRound className="public-nav-bar__account-glyph" strokeWidth={2} aria-hidden />
          )}
        </span>
        <span className="public-nav-bar__pill-label public-nav-bar__pill-label--account">
          {access.signedIn ? t('nav.account') : t('nav.login')}
        </span>
      </button>
      {menu}
    </>
  );
}