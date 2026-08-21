'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AdminDropdownBackdrop,
  AdminDropdownPanel,
  AdminDropdownTrigger,
  useAdminDropdown,
} from '@/components/admin/AdminDropdown';
import { datetimeMenuStyle, useDatetimeMenuPosition } from '@/components/cms/useDatetimeMenuPosition';
import { formatMonth, MONTHS_ABBR } from '@/lib/data/grid/archive-coverage';

/**
 * The month twin of `GridDatePicker`, for PGCB's monthly reports.
 *
 * Same problem, smaller: `<input type="month">` is barely implemented outside
 * Chrome, and it offered all 153 months in the span when only the ones with a
 * report can be compared. Here a year is a row of twelve cells and a month with
 * no report is simply not pressable.
 */
export function GridMonthPicker({
  value,
  onChange,
  months,
  label,
  disabled,
}: {
  value: string;
  onChange: (key: string) => void;
  /** Every archived month, newest first — straight off the bootstrap. */
  months: string[];
  label?: string;
  disabled?: boolean;
}) {
  const { open, toggle, close } = useAdminDropdown();
  const { rootRef, rect } = useDatetimeMenuPosition(open, '17rem', { menuMinHeight: 250 });

  const archived = useMemo(() => new Set(months), [months]);
  const years = useMemo(() => {
    const set = new Set(months.map((m) => Number(m.slice(0, 4))));
    return [...set].sort((a, b) => a - b);
  }, [months]);

  const [year, setYear] = useState(() => Number(value?.slice(0, 4)) || years[years.length - 1]);

  /**
   * The year stepper is also a way in to a year grid.
   *
   * Thirteen years of reports is a lot of arrow presses, and the daily picker
   * next to it drills down the same way — pressing the label opens the level
   * above. Consistency between the two is worth more here than the two saved
   * lines of state.
   */
  const [pickingYear, setPickingYear] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPickingYear(false);
    const y = Number(value?.slice(0, 4));
    if (y) setYear(y);
    // Only on open, so stepping through years inside the popover survives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const yearIdx = years.indexOf(year);
  const counts = useMemo(() => {
    const n = months.filter((m) => m.startsWith(String(year))).length;
    return n;
  }, [months, year]);

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
            onClick={() => yearIdx > 0 && setYear(years[yearIdx - 1])}
            disabled={pickingYear || yearIdx <= 0}
            aria-label="Previous year"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="grid-date-menu__zoom"
            onClick={() => setPickingYear((v) => !v)}
            aria-label={`${year} — choose a year`}
            aria-expanded={pickingYear}
          >
            <span>{year}</span>
            <ChevronDown
              className={cn('h-3 w-3 opacity-55 transition-transform', pickingYear && 'rotate-180')}
            />
          </button>
          <button
            type="button"
            className="grid-date-menu__nav"
            onClick={() => yearIdx < years.length - 1 && setYear(years[yearIdx + 1])}
            disabled={pickingYear || yearIdx < 0 || yearIdx >= years.length - 1}
            aria-label="Next year"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {pickingYear ? (
          <div className="grid-year-grid">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setYear(y);
                  setPickingYear(false);
                }}
                className={cn(
                  'cms-datetime-grid-cell',
                  y === year && 'cms-datetime-grid-cell--active',
                )}
              >
                {y}
              </button>
            ))}
          </div>
        ) : (
        <div className="grid-month-grid">
          {MONTHS_ABBR.map((m, i) => {
            const key = `${year}-${String(i + 1).padStart(2, '0')}`;
            const usable = archived.has(key);
            const active = key === value;
            return (
              <button
                key={key}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                disabled={!usable}
                title={usable ? formatMonth(key) : `${formatMonth(key)} — no monthly report archived`}
                onClick={() => {
                  onChange(key);
                  close();
                }}
                className={cn(
                  'cms-datetime-grid-cell',
                  active && 'cms-datetime-grid-cell--active',
                  !usable && 'cms-datetime-grid-cell--absent',
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
        )}

        <div className="grid-date-menu__foot">
          <span>
            {pickingYear
              ? `${months.length} monthly reports archived`
              : `${counts} of 12 reports archived in ${year}`}
          </span>
        </div>
      </AdminDropdownPanel>
    </>
  ) : null;

  return (
    <div className="grid-date-field">
      {label && <span className="grid-date-field__label">{label}</span>}
      <div ref={rootRef} className="cms-form-select relative">
        <AdminDropdownTrigger
          open={open}
          onClick={() => !disabled && toggle()}
          className={cn('grid-date-trigger', disabled && 'opacity-40')}
          aria-label={label ?? 'Choose a month'}
        >
          <CalendarRange className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="admin-select-trigger-label">
            {value ? formatMonth(value) : 'Pick a month'}
          </span>
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
