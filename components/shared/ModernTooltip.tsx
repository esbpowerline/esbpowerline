'use client';

import {
  cloneElement,
  isValidElement,
  useState,
  useRef,
  useCallback,
  useEffect,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useEditorPreferences } from '@/components/cms/EditorPreferencesProvider';

/** `right` sits beside the trigger — for an icon rail, where a label above
 *  or below one icon would cover the next. It does not flip. */
type Placement = 'top' | 'bottom' | 'right';

type ModernTooltipProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  side?: Placement;
  /** Snappier show animation (public chrome, icon controls) */
  fast?: boolean;
  /** Public navbar styling — matches theme swatch flyouts */
  variant?: 'default' | 'chrome' | 'editor' | 'member' | 'data';
  /**
   * Element used to wrap the trigger.
   *
   * `div` is the default and is wrong inside running text: a block element
   * inside a `<p>` closes the paragraph in the parser, which is how the grid
   * explorer's inline P/D marks would have detached themselves from the
   * sentences that explain them. Anything sitting inline should pass `span`.
   */
  wrapperAs?: 'div' | 'span';
  /** Show even when CMS editor guidance is in pro mode (no tooltips) */
  alwaysShow?: boolean;
  /** Force hide even when guidance mode allows tooltips */
  disabled?: boolean;
  /** Delay before showing on hover/focus (avoids accidental flicker) */
  showDelayMs?: number;
  /** Fade-out duration on mouse leave */
  hideFadeMs?: number;
  /** Brief hold + fade after clicking the trigger (e.g. nav links) */
  dismissOnClick?: boolean;
  clickVisibleMs?: number;
  clickFadeMs?: number;
};

export function ModernTooltip({
  label,
  hint,
  children,
  className,
  side = 'top',
  fast = false,
  variant = 'default',
  wrapperAs = 'div',
  alwaysShow = false,
  disabled = false,
  showDelayMs = 0,
  hideFadeMs = 200,
  dismissOnClick = false,
  clickVisibleMs = 500,
  clickFadeMs = 500,
}: ModernTooltipProps) {
  const { showTooltips, guidanceMode } = useEditorPreferences();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [placement, setPlacement] = useState<Placement>(side);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedRef = useRef(false);

  // Pro mode quiets guidance tooltips. An `alwaysShow` tooltip is not
  // guidance — it is the only name an icon-only control has — so it keeps its
  // own timing; a five-second wait made the collapsed nav unreadable.
  const isPro = guidanceMode === 'pro' && !alwaysShow;
  const delay = isPro ? 5000 : showDelayMs;
  const fadeOutTime = isPro ? 0 : hideFadeMs;

  useEffect(() => setMounted(true), []);

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const gap = 8;

    if (side === 'right') {
      setPlacement('right');
      setCoords({ top: rect.top + rect.height / 2, left: rect.right + gap });
      return;
    }

    let nextPlacement: Placement = side;

    if (side === 'top' && rect.top < 72) {
      nextPlacement = 'bottom';
    } else if (side === 'bottom' && rect.bottom > window.innerHeight - 72) {
      nextPlacement = 'top';
    }

    const top = nextPlacement === 'top' ? rect.top - gap : rect.bottom + gap;
    const left = rect.left + rect.width / 2;

    setPlacement(nextPlacement);
    setCoords({ top, left });
  }, [side]);

  const finishClose = useCallback(() => {
    setOpen(false);
    setClosing(false);
    lockedRef.current = false;
    hideTimerRef.current = null;
  }, []);

  const startClose = useCallback(
    (fadeMs: number) => {
      if (!open && !closing) return;
      if (fadeMs <= 0) {
        finishClose();
        return;
      }
      setClosing(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(finishClose, fadeMs);
    },
    [open, closing, finishClose],
  );

  const reveal = useCallback(() => {
    updatePosition();
    setClosing(false);
    setOpen(true);
  }, [updatePosition]);

  const scheduleShow = useCallback(() => {
    if (lockedRef.current) return;
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
      setClosing(false);
      if (open) return;
    }
    if (showTimerRef.current) return;
    if (delay <= 0) {
      reveal();
      return;
    }
    showTimerRef.current = setTimeout(() => {
      showTimerRef.current = null;
      if (!lockedRef.current) reveal();
    }, delay);
  }, [open, reveal, delay]);

  const scheduleHide = useCallback(() => {
    if (lockedRef.current) return;
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
      return;
    }
    if (!open) return;
    startClose(fadeOutTime);
  }, [fadeOutTime, open, startClose]);

  const scheduleClickDismiss = useCallback(() => {
    if (!dismissOnClick) return;
    clearTimers();
    lockedRef.current = true;
    setClosing(false);
    reveal();
    hideTimerRef.current = setTimeout(() => {
      startClose(clickFadeMs);
    }, clickVisibleMs);
  }, [clearTimers, clickFadeMs, clickVisibleMs, dismissOnClick, reveal, startClose]);

  const handleTriggerClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const target = event.currentTarget;
      target.blur();
      scheduleClickDismiss();
    },
    [scheduleClickDismiss],
  );

  useEffect(() => {
    if (!open && !closing) return;
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, closing, updatePosition]);

  const child = dismissOnClick && isValidElement(children)
    ? cloneElement(children as ReactElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void }>, {
        onClick: (event: MouseEvent<HTMLElement>) => {
          (children as ReactElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void }>).props.onClick?.(event);
          if (!event.defaultPrevented) handleTriggerClick(event);
        },
      })
    : children;

  const Wrapper = wrapperAs;
  const showPortal = open || closing;
  const tooltipsEnabled = (alwaysShow || showTooltips) && !disabled;

  if (!tooltipsEnabled) {
    return <>{children}</>;
  }

  return (
    <>
      <Wrapper
        ref={triggerRef as React.Ref<HTMLDivElement & HTMLSpanElement>}
        className={cn('modern-tooltip-wrap inline-flex', className)}
        onMouseEnter={scheduleShow}
        onMouseLeave={scheduleHide}
        onFocusCapture={scheduleShow}
        onBlurCapture={(event: FocusEvent<HTMLElement>) => {
          const next = event.relatedTarget as Node | null;
          if (next && triggerRef.current?.contains(next)) return;
          scheduleHide();
        }}
      >
        {child}
      </Wrapper>
      {mounted && showPortal && createPortal(
        <div
          role="tooltip"
          className={cn(
            'modern-tooltip modern-tooltip--portal',
            fast && 'modern-tooltip--fast',
            variant === 'chrome' && 'modern-tooltip--chrome',
            variant === 'editor' && 'modern-tooltip--editor',
            variant === 'member' && 'modern-tooltip--member',
            variant === 'data' && 'modern-tooltip--data',
            closing && 'modern-tooltip--out',
            closing && clickFadeMs >= 400 && 'modern-tooltip--out-slow',
            placement === 'top'
              ? 'modern-tooltip--top'
              : placement === 'right'
                ? 'modern-tooltip--right'
                : 'modern-tooltip--bottom',
          )}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform:
              placement === 'top'
                ? 'translate(-50%, -100%)'
                : placement === 'right'
                  ? 'translate(0, -50%)'
                  : 'translate(-50%, 0)',
            zIndex: 99999,
            ...(closing && clickFadeMs >= 400
              ? { animationDuration: `${clickFadeMs}ms` }
              : closing && hideFadeMs
                ? { animationDuration: `${hideFadeMs}ms` }
                : {}),
          }}
        >
          <span className="modern-tooltip-label">{label}</span>
          {hint && <span className="modern-tooltip-hint">{hint}</span>}
          <span className="modern-tooltip-arrow" aria-hidden />
        </div>,
        document.body,
      )}
    </>
  );
}