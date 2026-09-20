'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AdminDropdownBackdrop,
  AdminDropdownPanel,
  AdminDropdownTrigger,
  useAdminDropdown,
} from '@/components/admin/AdminDropdown';
import {
  datetimeMenuStyle,
  useDatetimeMenuPosition,
} from '@/components/cms/useDatetimeMenuPosition';

export type AdminSelectOption = {
  value: string;
  label: string;
  count?: number;
  /** CSS color for status dot */
  dot?: string;
  description?: string;
  /** Per-option accent (category menus) */
  accent?: string;
  /** Subtle highlight (e.g. current year in date pickers) */
  marked?: boolean;
  /** Non-interactive option (e.g. legacy roles) */
  disabled?: boolean;
};

const STATUS_DOTS: Record<string, string> = {
  ALL: 'hsl(var(--muted-foreground))',
  PUBLISHED: 'hsl(160 84% 39%)',
  DRAFT: 'hsl(var(--muted-foreground))',
  SCHEDULED: 'hsl(38 92% 50%)',
  ARCHIVED: 'hsl(var(--muted-foreground) / 0.5)',
  TRASH: 'hsl(0 72% 51%)',
};

export function AdminSelectMenu({
  value,
  onChange,
  options,
  icon: Icon,
  placeholder = 'Select',
  menuTitle,
  menuClassName,
  optionClassName,
  className,
  minWidth = '10.5rem',
  menuWidth,
  portal = false,
  hideDot = false,
  optionsLayout = 'list',
  gridColumns = 4,
  menuPosition = 'default',
  menuMinHeight,
  align = 'left',
}: {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  icon?: LucideIcon;
  placeholder?: string;
  menuTitle?: string;
  menuClassName?: string;
  optionClassName?: string;
  className?: string;
  minWidth?: string;
  /** Fixed width for portaled grid menus (wider than trigger) */
  menuWidth?: string;
  /** Render menu in a portal to escape overflow/stacking contexts (CMS sidebar) */
  portal?: boolean;
  hideDot?: boolean;
  optionsLayout?: 'list' | 'grid';
  gridColumns?: number;
  menuPosition?: 'default' | 'datetime' | 'top';
  menuMinHeight?: number;
  align?: 'left' | 'right';
}) {
  const { open, toggle, close } = useAdminDropdown();
  const useDatetimePosition = portal && menuPosition === 'datetime';
  const datetimePosition = useDatetimeMenuPosition(open && useDatetimePosition, menuWidth, {
    menuMinHeight,
    fallbackWidthPx: 216,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const selected = options.find((o) => o.value === value);
  const dotColor = selected?.dot ?? STATUS_DOTS[value] ?? STATUS_DOTS.ALL;
  const isGrid = optionsLayout === 'grid';
  const suppressDot = hideDot || isGrid;
  const triggerRef = useDatetimePosition ? datetimePosition.rootRef : rootRef;

  useEffect(() => {
    if (!open || !portal || useDatetimePosition || !rootRef.current) {
      if (!useDatetimePosition) setMenuRect(null);
      return;
    }

    function updatePosition() {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (menuPosition === 'top') {
        const approxHeight = options.length * 32 + 36;
        setMenuRect({
          top: rect.top - approxHeight - 6,
          left: rect.left,
          width: rect.width,
        });
      } else {
        setMenuRect({
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width,
        });
      }
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, portal, useDatetimePosition, menuPosition, options.length]);

  const menu = open ? (
    <>
      <AdminDropdownBackdrop onClose={close} />
      <AdminDropdownPanel
        className={cn(
          'admin-select-menu',
          portal && 'admin-select-menu--portal',
          menuPosition === 'top' && 'admin-dropdown-panel--up',
          menuClassName
        )}
        align={align}
        style={
          portal && useDatetimePosition
            ? datetimeMenuStyle(datetimePosition.rect)
            : portal && menuRect
              ? {
                  position: 'fixed',
                  top: menuRect.top,
                  left: menuRect.left,
                  width: menuWidth ?? menuRect.width,
                  minWidth: menuWidth ?? menuRect.width,
                  zIndex: 250,
                }
              : menuWidth
                ? { width: menuWidth, minWidth: menuWidth }
                : undefined
        }
      >
        <div className="admin-select-menu-title">{menuTitle ?? placeholder}</div>
        <div
          className={cn('admin-select-options', isGrid && 'admin-select-options--grid')}
          style={isGrid ? { gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` } : undefined}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            const optDot = opt.dot ?? STATUS_DOTS[opt.value] ?? STATUS_DOTS.ALL;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                aria-disabled={opt.disabled || undefined}
                disabled={opt.disabled}
                title={isGrid ? (opt.description ?? opt.label) : undefined}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  close();
                }}
                className={cn(
                  'admin-select-option',
                  isGrid && 'admin-select-option--grid',
                  optionClassName,
                  opt.marked && 'admin-select-option--marked',
                  opt.disabled && 'admin-select-option--disabled',
                  active && 'admin-select-option--active',
                )}
                style={
                  opt.accent
                    ? ({ '--opt-accent': opt.accent } as CSSProperties)
                    : undefined
                }
                data-accent={opt.accent || undefined}
              >
                {!suppressDot && (
                  <span className="admin-select-dot" style={{ background: optDot }} aria-hidden="true" />
                )}
                {isGrid ? (
                  <span className="admin-select-option-label">{opt.label}</span>
                ) : (
                  <>
                    <span className="admin-select-option-body">
                      <span className="admin-select-option-label">{opt.label}</span>
                      {opt.description && (
                        <span className="admin-select-option-desc">{opt.description}</span>
                      )}
                    </span>
                    {opt.count !== undefined && (
                      <span className="admin-select-option-count">{opt.count}</span>
                    )}
                    {active && <Check className="h-3 w-3 shrink-0 opacity-70" />}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </AdminDropdownPanel>
    </>
  ) : null;

  return (
    <div ref={triggerRef} className={cn('relative shrink-0', className)} style={{ minWidth }}>
      <AdminDropdownTrigger open={open} onClick={toggle} aria-label={placeholder}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
        {!suppressDot && (
          <span
            className="admin-select-dot shrink-0"
            style={{ background: dotColor }}
            aria-hidden="true"
          />
        )}
        <span className="admin-select-trigger-label">
          {selected?.label ?? placeholder}
        </span>
        {/* A count on the trigger says how much the filter narrowed things.
            While nothing is chosen it narrows nothing, so four menus sat in a
            row each printing the same total, beside a counter already showing
            it — five copies of 217 (2026-09-20). Open the menu and every
            option still carries its own number. */}
        {selected?.count !== undefined && selected.value !== 'ALL' && (
          <span className="admin-select-trigger-count">{selected.count}</span>
        )}
        <ChevronDown className={cn('h-3 w-3 shrink-0 opacity-60 transition-transform duration-150', open && 'rotate-180')} />
      </AdminDropdownTrigger>

      {portal && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </div>
  );
}