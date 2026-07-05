'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BrandDeck } from '@/components/shared/BrandDeck';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { LoginBrandFooter } from '@/components/auth/LoginBrandFooter';
import { SiteThemeToggle } from '@/components/shared/SiteThemeToggle';
import { cn } from '@/lib/utils';
import { applySiteTheme } from '@/lib/site-theme';

export type LoginAudience = 'staff' | 'member';

export function LoginFrame({
  children,
  audience = 'staff',
  brandAside,
}: {
  children: ReactNode;
  audience?: LoginAudience;
  /** Renders under BrandDeck in the left column (member perks, etc.) */
  brandAside?: ReactNode;
}) {
  const [publicUrl, setPublicUrl] = useState('/');
  const isMember = audience === 'member';

  useEffect(() => {
    applySiteTheme('white');
    const { hostname, host, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const port = host.split(':')[1];
      if (port === '3001' || port === '3002') {
        setPublicUrl(`${protocol}//${hostname}:3000/`);
      }
    } else if (hostname.startsWith('cms.') || hostname.startsWith('admin.')) {
      const baseDomain = hostname.replace(/^(cms\.|admin\.)/, '');
      setPublicUrl(`${protocol}//${baseDomain}/`);
    }
  }, []);

  return (
    <div className={cn('login-shell', isMember ? 'login-shell--member' : 'login-shell--staff')}>
      <div className="login-frame">
        <header className="login-frame__bar">
          <a href={publicUrl} className="login-frame__back">
            <ArrowLeft className="h-3.5 w-3.5" />
            esbpowerline.com
          </a>
          <SiteThemeToggle />
        </header>

        <div className="login-frame__split">
          <aside className="login-brand">
            <div className="login-brand__wash" aria-hidden />
            <div className="login-brand__texture hero-dot-pattern" aria-hidden />
            <div className="login-brand__body">
              <div className="login-brand__content">
                <div className="login-brand__intro">
                  <BrandLogo
                    href={publicUrl}
                    priority
                    frameClassName="login-brand__logo-frame login-brand__logo-frame--portal"
                    imageClassName="login-brand__logo-img login-brand__logo-img--portal"
                  />
                  <span className="login-brand__rule" aria-hidden />
                  <BrandDeck />
                </div>
                {brandAside ? <div className="login-brand__aside">{brandAside}</div> : null}
              </div>

              <footer className="login-brand__meta">
                <LoginBrandFooter />
              </footer>
            </div>
          </aside>

          <main className="login-access">{children}</main>
        </div>
      </div>
    </div>
  );
}