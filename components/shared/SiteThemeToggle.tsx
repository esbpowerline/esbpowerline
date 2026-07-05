'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Moon, MoonStar, Sun } from 'lucide-react';
import {
  applySiteTheme,
  getSavedSiteTheme,
  SITE_THEMES,
  SITE_THEME_PREVIEW,
  type SiteTheme,
} from '@/lib/site-theme';
import { cn } from '@/lib/utils';

type SiteThemeToggleProps = {
  className?: string;
};

const THEME_ICONS: Record<SiteTheme, { icon: LucideIcon; iconClass: string }> = {
  midnight: { icon: MoonStar, iconClass: 'text-sky-400' },
  dark: { icon: Moon, iconClass: 'text-zinc-400' },
  white: { icon: Sun, iconClass: 'text-amber-500' },
};

function ThemePreview({ label }: { label: string }) {
  return <div className="site-theme-toggle__preview">{label}</div>;
}

const TIP_VISIBLE_MS = 500;
const TIP_FADE_MS = 500;

export function SiteThemeToggle({ className = '' }: SiteThemeToggleProps) {
  const [theme, setTheme] = useState<SiteTheme>('white');
  const [openTip, setOpenTip] = useState<SiteTheme | null>(null);
  const [closingTip, setClosingTip] = useState<SiteTheme | null>(null);
  const lockedTipRef = useRef<SiteTheme | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useLayoutEffect(() => {
    const saved = getSavedSiteTheme();
    setTheme(saved);
    applySiteTheme(saved);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  function clearTipLock() {
    lockedTipRef.current = null;
    setOpenTip(null);
    setClosingTip(null);
    hideTimerRef.current = null;
  }

  function startTipFade() {
    const tipId = lockedTipRef.current;
    if (!tipId) return;
    setClosingTip(tipId);
    setOpenTip(null);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(clearTipLock, TIP_FADE_MS);
  }

  function scheduleTipDismiss(tipId: SiteTheme) {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setClosingTip(null);
    lockedTipRef.current = tipId;
    setOpenTip(tipId);
    hideTimerRef.current = setTimeout(startTipFade, TIP_VISIBLE_MS);
  }

  function showTip(tipId: SiteTheme) {
    if (lockedTipRef.current) return;
    setOpenTip(tipId);
  }

  function hideTip() {
    if (lockedTipRef.current) return;
    setOpenTip(null);
  }

  function changeTheme(next: SiteTheme, button: HTMLButtonElement) {
    setTheme(next);
    applySiteTheme(next);
    button.blur();
    scheduleTipDismiss(next);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className={cn('site-theme-toggle-wrapper', isOpen && 'is-open', className)}>
      <div className={cn('site-theme-toggle', isOpen && 'is-open')}>
        <div className="site-theme-toggle__swatches">
          {SITE_THEMES.map((t) => {
            const { icon: Icon, iconClass } = THEME_ICONS[t.id];
            const isActive = theme === t.id;
            const preview = SITE_THEME_PREVIEW[t.id];

            return (
              <div
                key={t.id}
                className="site-theme-toggle__item relative"
                onMouseEnter={() => showTip(t.id)}
                onMouseLeave={hideTip}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if (isActive) {
                      setIsOpen(!isOpen);
                    } else {
                      changeTheme(t.id, e.currentTarget);
                    }
                  }}
                  onFocus={() => showTip(t.id)}
                  onBlur={hideTip}
                  className="site-theme-toggle__btn"
                  aria-label={`Switch to ${t.label} theme`}
                  aria-pressed={isActive}
                >
                  <Icon
                    className={cn(
                      'icon-sm transition-colors',
                      isActive ? 'text-primary' : iconClass,
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </button>
                <div
                  className={cn(
                    'site-theme-toggle__flyout',
                    (openTip === t.id || closingTip === t.id) && 'site-theme-toggle__flyout--visible',
                    closingTip === t.id && 'site-theme-toggle__flyout--closing',
                  )}
                  aria-hidden={openTip !== t.id && closingTip !== t.id}
                >
                  <div
                    className="site-theme-toggle__tip"
                    style={
                      {
                        '--theme-preview-bg': preview.background,
                        '--theme-preview-border': preview.border,
                        '--theme-preview-fg': preview.foreground,
                      } as React.CSSProperties
                    }
                  >
                    <div className="site-theme-toggle__flyout-arrow" aria-hidden />
                    <ThemePreview label={t.label} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}