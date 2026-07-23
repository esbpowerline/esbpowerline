'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Site-styled date picker: a pill trigger opening a rounded calendar popover
 * (the native <input type="date"> popup cannot be themed). Dependency-free —
 * pure UTC string math, clamped to [min, max].
 */

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function parts(isoDate: string): { y: number; m: number; d: number } {
  const [y, m, d] = isoDate.split('-').map(Number);
  return { y, m: m - 1, d };
}

function prettyDate(isoDate: string): string {
  const { y, m, d } = parts(isoDate);
  return `${d} ${MONTHS[m].slice(0, 3)} ${y}`;
}

export function DatePickerField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min: string;
  max: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const v = parts(value);
  const [viewY, setViewY] = useState(v.y);
  const [viewM, setViewM] = useState(v.m);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function openPopover() {
    const cur = parts(value);
    setViewY(cur.y);
    setViewM(cur.m);
    setOpen((o) => !o);
  }

  const minP = parts(min);
  const maxP = parts(max);
  const canPrev = viewY > minP.y || (viewY === minP.y && viewM > minP.m);
  const canNext = viewY < maxP.y || (viewY === maxP.y && viewM < maxP.m);

  function nav(delta: number) {
    let m = viewM + delta;
    let y = viewY;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewY(y);
    setViewM(m);
  }

  const firstDow = new Date(Date.UTC(viewY, viewM, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={openPopover}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-card px-3 py-2 text-left shadow-sm transition-all',
          open
            ? 'border-primary/60 ring-2 ring-primary/20'
            : 'border-border/60 hover:border-primary/40',
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
          <span className="text-xs font-semibold text-foreground">{prettyDate(value)}</span>
        </span>
        <ChevronRight
          className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform', open && 'rotate-90')}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${label} date`}
          className="absolute left-0 top-full z-50 mt-2 w-[248px] rounded-2xl border border-border/60 bg-card p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => nav(-1)}
              disabled={!canPrev}
              aria-label="Previous month"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-foreground">
              {MONTHS[viewM]} {viewY}
            </span>
            <button
              type="button"
              onClick={() => nav(1)}
              disabled={!canNext}
              aria-label="Next month"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {DOW.map((d) => (
              <span key={d} className="py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground/70">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} />;
              const dateIso = iso(viewY, viewM, day);
              const disabled = dateIso < min || dateIso > max;
              const selected = dateIso === value;
              return (
                <button
                  key={dateIso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(dateIso);
                    setOpen(false);
                  }}
                  className={cn(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition-colors',
                    selected
                      ? 'bg-primary font-bold text-primary-foreground shadow-sm'
                      : disabled
                        ? 'text-muted-foreground/30'
                        : 'text-foreground hover:bg-primary/10 hover:text-primary',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2">
            <span className="text-[9px] text-muted-foreground">
              {prettyDate(min)} – {prettyDate(max)}
            </span>
            <button
              type="button"
              onClick={() => {
                onChange(max);
                setOpen(false);
              }}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Latest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
