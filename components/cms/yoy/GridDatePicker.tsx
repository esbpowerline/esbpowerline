'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AdminDropdownBackdrop,
  AdminDropdownPanel,
  AdminDropdownTrigger,
  useAdminDropdown,
} from '@/components/admin/AdminDropdown';
import { datetimeMenuStyle, useDatetimeMenuPosition } from '@/components/cms/useDatetimeMenuPosition';
import { formatIso, MONTHS_ABBR, type ArchiveIndex } from '@/lib/data/grid/archive-coverage';

/**
 * A calendar that only offers days the archive holds.
 *
 * This replaced `<input type="date">`, which was wrong here in two ways. It
 * renders differently in every browser and looked nothing like the rest of the
 * CMS; and `min`/`max` describe a *span*, so it happily accepted any of the 81
 * days inside our range that the site does not actually have. The editor found
 * out by pressing the button and reading an error.
 *
 * Built on the same dropdown and grid-cell vocabulary as the CMS datetime
 * pickers — `admin-dropdown-*`, `cms-datetime-day-grid`, `cms-datetime-grid-cell`
 * — so it inherits the site's look rather than inventing a second one, with one
 * new modifier for the state those pickers never needed: a day that exists on
 * the calendar but not in the archive.
 */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

function partsOf(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function isoOf(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Leading blanks so the 1st lands under its weekday, then the days. */
function cellsFor(year: number, month: number): Array<number | null> {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<number | null> = Array.from({ length: firstDow }, () => null);
  for (let d = 1; d <= days; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function GridDatePicker({
  value,
  onChange,
  archive,
  /**
   * A day may be archived and still not usable — the year-on-year sheet also
   * needs the same day a year earlier. The calendar asks rather than assuming,
   * so one component serves both modes and neither offers a day that cannot
   * produce an answer.
   */
  selectable,
  label,
  id,
  disabled,
  /** Shown under the grid when a day is refused, so the grey is explained. */
  unselectableHint,
}: {
  value: string;
  onChange: (iso: string) => void;
  archive: ArchiveIndex;
  selectable?: (iso: string) => boolean;
  label?: string;
  id?: string;
  disabled?: boolean;
  unselectableHint?: string;
}) {
  const { open, toggle, close } = useAdminDropdown();
  const { rootRef, rect } = useDatetimeMenuPosition(open, '19rem', { menuMinHeight: 320 });

  const selected = partsOf(value);
  const [view, setView] = useState(() => ({
    year: selected?.year ?? new Date().getUTCFullYear(),
    month: selected?.month ?? new Date().getUTCMonth() + 1,
  }));

  /**
   * Days, months or years — one grid at a time, in the same square.
   *
   * The header used to hold two native `<select>`s. They were the last controls
   * in this panel the browser drew itself, they looked like nothing else in the
   * CMS, and reaching January 2014 from August 2026 meant opening a menu of 153
   * options. A dropdown inside a dropdown was the obvious fix and the wrong
   * one: two stacked popovers, two backdrops, and a click target that moves.
   *
   * Drilling down instead. The header label is a button: press it on the day
   * grid and the same square becomes twelve months; press it again and it
   * becomes a page of years. Choosing narrows back down one level. Three
   * presses and a pick reach any day in the archive, and nothing overlaps
   * anything.
   */
  const [level, setLevel] = useState<'day' | 'month' | 'year'>('day');

  // Reopening on a different day should land on that day's month, not on
  // wherever the editor last browsed to.
  useEffect(() => {
    if (!open) return;
    // Always reopen on the day grid: the level is a way of getting somewhere,
    // not a preference to remember.
    setLevel('day');
    if (!selected) return;
    setView({ year: selected.year, month: selected.month });
    // Only when the popover opens; browsing inside it must not be undone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canSelect = useMemo(
    () => (iso: string) => (selectable ? selectable(iso) : archive.has(iso)),
    [selectable, archive],
  );

  const cells = cellsFor(view.year, view.month);
  const coverage = archive.monthCoverage(view.year, view.month);

  const bounds = archive.coverage;
  const firstParts = bounds.first ? partsOf(bounds.first) : null;
  const lastParts = bounds.last ? partsOf(bounds.last) : null;
  const viewIndex = view.year * 12 + view.month - 1;
  const minIndex = firstParts ? firstParts.year * 12 + firstParts.month - 1 : viewIndex;
  const maxIndex = lastParts ? lastParts.year * 12 + lastParts.month - 1 : viewIndex;

  const minYear = firstParts?.year ?? view.year;
  const maxYear = lastParts?.year ?? view.year;

  /**
   * Every archived year at once, not a paged window.
   *
   * Paging twelve at a time was the reflex, and it put 2025 and 2026 alone on
   * the last page while 2013–2024 sat behind an arrow — sparse, and an extra
   * press to reach most of the archive. Thirteen years is five rows of three;
   * it fits. The grid scrolls if the archive ever outgrows the popover, which
   * is a decade away and costs one CSS line.
   */
  const allYears = useMemo(() => {
    const out: number[] = [];
    for (let y = minYear; y <= maxYear; y += 1) out.push(y);
    return out;
  }, [minYear, maxYear]);

  /** The arrows mean "one of whatever the grid is showing". */
  function step(delta: number) {
    if (level === 'day') {
      const next = viewIndex + delta;
      if (next < minIndex || next > maxIndex) return;
      setView({ year: Math.floor(next / 12), month: (next % 12) + 1 });
      return;
    }
    const next = view.year + delta;
    if (next < minYear || next > maxYear) return;
    setView((v) => ({ ...v, year: next }));
  }

  // Nothing to step through at the year level — every year is already on screen.
  const atStart =
    level === 'year' || (level === 'day' ? viewIndex <= minIndex : view.year <= minYear);
  const atEnd =
    level === 'year' || (level === 'day' ? viewIndex >= maxIndex : view.year >= maxYear);

  const headLabel =
    level === 'day'
      ? `${MONTHS_ABBR[view.month - 1]} ${view.year}`
      : level === 'month'
        ? String(view.year)
        : `${minYear} – ${maxYear}`;

  const menu = open ? (
    <>
      <AdminDropdownBackdrop onClose={close} />
      <AdminDropdownPanel
        className={cn('admin-select-menu', 'cms-datetime-select-menu', 'grid-date-menu')}
        align="left"
        style={datetimeMenuStyle(rect)}
      >
        <div className="grid-date-menu__head">
          <button
            type="button"
            className="grid-date-menu__nav"
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label={level === 'month' ? 'Previous year' : 'Previous month'}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            className="grid-date-menu__zoom"
            // Years are the top; there is nothing above them to zoom out to.
            disabled={level === 'year'}
            onClick={() => setLevel(level === 'day' ? 'month' : 'year')}
            aria-label={`${headLabel} — choose a ${level === 'day' ? 'month' : 'year'}`}
          >
            <span className="grid-date-menu__zoom-label">{headLabel}</span>
            {level !== 'year' && <ChevronDown className="h-3 w-3 opacity-55" />}
          </button>

          <button
            type="button"
            className="grid-date-menu__nav"
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label={level === 'month' ? 'Next year' : 'Next month'}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {level === 'month' && (
          <div className="grid-month-grid">
            {MONTHS_ABBR.map((m, i) => {
              const has = archive.hasMonth(view.year, i + 1);
              const active = i + 1 === view.month;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!has}
                  title={has ? `${m} ${view.year}` : `${m} ${view.year} — nothing archived`}
                  onClick={() => {
                    setView((v) => ({ ...v, month: i + 1 }));
                    setLevel('day');
                  }}
                  className={cn(
                    'cms-datetime-grid-cell',
                    active && 'cms-datetime-grid-cell--active',
                    !has && 'cms-datetime-grid-cell--absent',
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        )}

        {level === 'year' && (
          <div className="grid-year-grid">
            {allYears.map((y) => {
              const active = y === view.year;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setView((v) => ({ ...v, year: y }));
                    setLevel('month');
                  }}
                  className={cn(
                    'cms-datetime-grid-cell',
                    active && 'cms-datetime-grid-cell--active',
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}

        {level === 'day' && (
        <div className="cms-datetime-day-grid">
          <div className="cms-datetime-day-grid__weekdays" aria-hidden>
            {WEEKDAYS.map((d, i) => (
              <span
                key={d}
                className={cn(
                  'cms-datetime-day-grid__weekday',
                  (i === 0 || i === 6) && 'cms-datetime-day-grid__weekday--weekend',
                )}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="cms-datetime-day-grid__cells">
            {cells.map((day, idx) => {
              if (day === null) {
                return <span key={`pad-${idx}`} className="cms-datetime-day-grid__pad" aria-hidden />;
              }
              const iso = isoOf(view.year, view.month, day);
              const usable = canSelect(iso);
              const active = iso === value;
              const dow = new Date(Date.UTC(view.year, view.month - 1, day)).getUTCDay();
              return (
                <button
                  key={iso}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  disabled={!usable}
                  // The reason a day is greyed out, on the day itself. Without
                  // it the calendar just looks broken on the gaps.
                  title={usable ? formatIso(iso) : `${formatIso(iso)} — not in the archive`}
                  onClick={() => {
                    onChange(iso);
                    close();
                  }}
                  className={cn(
                    'cms-datetime-grid-cell cms-datetime-grid-cell--day',
                    (dow === 0 || dow === 6) && 'cms-datetime-grid-cell--weekend',
                    active && 'cms-datetime-grid-cell--active',
                    !usable && 'cms-datetime-grid-cell--absent',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
        )}

        <div className="grid-date-menu__foot">
          <span>
            {level === 'day'
              ? `${coverage.held} of ${coverage.days} days archived`
              : level === 'month'
                ? `${MONTHS_ABBR.filter((_, i) => archive.hasMonth(view.year, i + 1)).length} of 12 months archived in ${view.year}`
                : `${archive.coverage.total.toLocaleString()} days archived in all`}
          </span>
          {bounds.last && (
            <button
              type="button"
              className="grid-date-menu__jump"
              onClick={() => {
                const latest = selectable ? archive.nearest(bounds.last!) : bounds.last;
                const target =
                  latest && canSelect(latest) ? latest : findLatestSelectable(archive, canSelect);
                if (target) {
                  onChange(target);
                  close();
                }
              }}
            >
              Latest
            </button>
          )}
        </div>
        {unselectableHint && <p className="grid-date-menu__hint">{unselectableHint}</p>}
      </AdminDropdownPanel>
    </>
  ) : null;

  return (
    <div className="grid-date-field">
      {label && (
        <label className="grid-date-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <div ref={rootRef} className="cms-form-select relative">
        <AdminDropdownTrigger
          open={open}
          onClick={() => !disabled && toggle()}
          className={cn('grid-date-trigger', disabled && 'opacity-40')}
          aria-label={label ?? 'Choose a date'}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="admin-select-trigger-label">{value ? formatIso(value) : 'Pick a day'}</span>
          <ChevronDown
            className={cn(
              'h-3 w-3 shrink-0 opacity-60 transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        </AdminDropdownTrigger>
        {typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
      </div>
    </div>
  );
}

/**
 * The newest day this picker would accept, walking back from the end.
 *
 * Only reached when "Latest" is pressed in a mode with an extra condition — the
 * sheet needs a prior-year day too — and the newest archived day does not meet
 * it. Bounded for the same reason `nearest` is.
 */
function findLatestSelectable(
  archive: ArchiveIndex,
  canSelect: (iso: string) => boolean,
  maxBack = 400,
): string | null {
  const last = archive.coverage.last;
  if (!last) return null;
  const start = Date.parse(`${last}T00:00:00Z`);
  for (let d = 0; d <= maxBack; d += 1) {
    const iso = new Date(start - d * 86_400_000).toISOString().slice(0, 10);
    if (canSelect(iso)) return iso;
  }
  return null;
}
