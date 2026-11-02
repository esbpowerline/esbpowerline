'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The phone/tablet shell of the Grid Explorer (below 1024px only).
 *
 * Two controls were the whole reason a reader got lost on a phone: the day
 * picker lived in the middle of the page and the nine-tab row scrolled away
 * with it. This bar keeps both within thumb reach for the whole scroll:
 * left, the day on screen (opens the existing date sheet — no second picker);
 * right, the section on screen (opens a "Jump to section" bottom sheet).
 *
 * Desktop never sees it (`lg:hidden`) and keeps its tab row untouched.
 */

export interface ShellSection {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Short right-hand hint ("Fuel mix · cost"). */
  hint: string;
  /** True when the selected day has nothing for this section. */
  empty?: boolean;
  /** Why it is empty, kept for the title/aria text. */
  reason?: string;
}

export function GridExplorerMobileShell({
  dateLabel,
  isLatest,
  dateSheetOpen,
  onOpenDate,
  sections,
  activeId,
  onSelect,
}: {
  dateLabel: string;
  isLatest: boolean;
  dateSheetOpen: boolean;
  onOpenDate: () => void;
  sections: ShellSection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The site navbar is sticky and its height changes (it folds its category
  // ribbon on every tab but Overview), so the bar's `top` is measured, not
  // hard-coded. Written as a CSS variable on the bar itself.
  useEffect(() => {
    const bar = barRef.current;
    const nav = document.querySelector('.public-nav-bar') as HTMLElement | null;
    if (!bar) return;
    const apply = () => {
      const sticky = nav && getComputedStyle(nav).position === 'sticky';
      bar.style.setProperty('--ge-nav-h', `${sticky && nav ? nav.getBoundingClientRect().height : 0}px`);
    };
    apply();
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(apply);
    ro.observe(nav);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // While open: lock page scroll, close on Escape, keep Tab inside the sheet.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const sheet = sheetRef.current;
    (sheet?.querySelector('[aria-current="true"]') as HTMLElement | null)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !sheet) return;
      const f = Array.from(sheet.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // Phone: the year is dropped from the chip (full date stays in the aria-label
  // and the date sheet) so the section name gets the width it needs.
  const shortDate = dateLabel.replace(/[ ,/-]*(19|20)[0-9]{2} *$/, '').trim() || dateLabel;
  const current = sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <>
      <div
        ref={barRef}
        data-ge-shell-bar
        className="ge-shell-bar lg:hidden"
        style={{ top: 'var(--ge-nav-h, 0px)' }}
      >
        <button
          type="button"
          onClick={onOpenDate}
          aria-expanded={dateSheetOpen}
          aria-label={`Reporting date ${dateLabel}${isLatest ? ', latest' : ''}. Change date`}
          className="ge-shell-chip ge-shell-chip--date"
        >
          <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="font-bold whitespace-nowrap">{shortDate}</span>
          {isLatest && <span className="ge-shell-tag">Latest</span>}
        </button>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="ge-shell-chip ge-shell-chip--section"
        >
          <span className="min-w-0 flex-1 text-left">
            <span className="ge-shell-label block text-[13px] font-bold leading-tight text-primary">{current?.label}</span>
            <span className="block text-[11px] leading-tight text-muted-foreground">{sections.length} sections</span>
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-primary transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </div>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="ge-sheet-layer lg:hidden">
            <div className="ge-sheet-scrim" onClick={close} aria-hidden />
            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ge-sheet-title"
              className="ge-sheet"
            >
              <div className="ge-sheet__handle" aria-hidden />
              <div className="ge-sheet__head">
                <h2 id="ge-sheet-title">Jump to section</h2>
                <button type="button" onClick={close} className="ge-sheet__close" aria-label="Close section list">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <ul className="ge-sheet__list">
                {sections.map((s) => {
                  const Icon = s.icon;
                  const active = s.id === activeId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-current={active ? 'true' : undefined}
                        onClick={() => {
                          setOpen(false);
                          onSelect(s.id);
                        }}
                        className={cn('ge-sheet__row', active && 'is-active', s.empty && 'is-empty')}
                      >
                        <span className="ge-sheet__icon">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="ge-sheet__label">{s.label}</span>
                        <span className="ge-sheet__hint" title={s.empty ? s.reason : undefined}>
                          {s.empty ? 'not published yet' : s.hint}
                        </span>
                        {active && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
