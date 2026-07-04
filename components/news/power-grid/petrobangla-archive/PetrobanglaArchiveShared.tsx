'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Activity, Calendar, ChevronDown, FileText, Info } from 'lucide-react';
import { CustomDropdown } from '@/components/news/power-grid/shared';
import { cn } from '@/lib/utils';
import type { AudienceMode, PetrobanglaDaily } from '@/lib/data/petrobangla/types';
import { PETROBANGLA_OFFICIAL_LABEL, PETROBANGLA_OFFICIAL_SITE } from '@/lib/data/petrobangla/constants';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function PetrobanglaOfficialSourceLink({ className }: { className?: string }) {
  return (
    <a
      href={PETROBANGLA_OFFICIAL_SITE}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('text-primary hover:underline font-semibold', className)}
    >
      {PETROBANGLA_OFFICIAL_LABEL}
    </a>
  );
}

/** Matches live gas tab badge family (sky) — distinct label from emerald Daily */
export function ArchiveBadge() {
  return <sup className="text-sky-500 font-extrabold text-[10px] ml-2 select-none">Archive</sup>;
}

export function AudienceModeToggle({
  mode,
  onChange,
}: {
  mode: AudienceMode;
  onChange: (m: AudienceMode) => void;
}) {
  const modes: { id: AudienceMode; label: string }[] = [
    { id: 'simple', label: 'Simple' },
    { id: 'analyst', label: 'Analyst' },
    { id: 'investor', label: 'Investor' },
    { id: 'researcher', label: 'Researcher' },
  ];
  return (
    <div className="gas-reserve-segmented" role="group" aria-label="Audience mode">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={cn(
            'gas-reserve-segmented__btn',
            mode === m.id && 'gas-reserve-segmented__btn--active',
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export function ArchiveChartFooter({
  day,
  dayCount,
  caption,
  embedded = false,
}: {
  day?: PetrobanglaDaily;
  dayCount?: number;
  caption?: string;
  /** When true, omit duplicate source line — parent panel carries unified footer */
  embedded?: boolean;
}) {
  const date = day?.report.report_date_end ?? day?.report.report_date_start;
  return (
    <div
      className={cn(
        'bg-muted/10 p-4 text-xs text-muted-foreground space-y-2',
        embedded ? 'rounded-xl border border-border/30' : 'border-t border-border/40',
      )}
    >
      {caption && (
        <>
          <p><strong>What is being shown?</strong></p>
          <p className="leading-relaxed">{caption}</p>
        </>
      )}
      {!embedded && (
        <div className="grid-explorer-card-footer">
          <span>
            Source:{' '}
            <PetrobanglaOfficialSourceLink />
            {date && <> · report end {date}</>}
            {dayCount != null && <> · {dayCount.toLocaleString()} days</>}
          </span>
          {day && (
            <a
              href={`/data/petrobangla/daily/${day.report.report_date_end}.json`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Raw JSON
            </a>
          )}
        </div>
      )}
      {embedded && day && (
        <div className="flex justify-end pt-1">
          <a
            href={`/data/petrobangla/daily/${day.report.report_date_end}.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline font-semibold"
          >
            Raw JSON · {date}
          </a>
        </div>
      )}
    </div>
  );
}

export function ArchiveDateSelect({
  label,
  value,
  onChange,
  dates,
  hint,
  accent,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  dates: string[];
  hint?: string;
  accent?: 'sky' | 'emerald' | 'default';
}) {
  return (
    <label className="gas-reserve-archive-select">
      <span className="gas-reserve-archive-select__label">{label}</span>
      <div
        className={cn(
          'gas-reserve-archive-select__wrap',
          accent === 'sky' && 'gas-reserve-archive-select__wrap--sky',
          accent === 'emerald' && 'gas-reserve-archive-select__wrap--emerald',
        )}
      >
        <select
          className="gas-reserve-archive-select__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <ChevronDown className="gas-reserve-archive-select__chevron" aria-hidden />
      </div>
      {hint && <span className="gas-reserve-archive-select__hint">{hint}</span>}
    </label>
  );
}

export function ArchiveDateGridPicker({
  label,
  value,
  onChange,
  dates,
  hint,
  accent = 'default',
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  dates: string[];
  hint?: string;
  accent?: 'sky' | 'emerald' | 'default';
}) {
  const [selectedYear, selectedMonth, selectedDay] = value.split('-');
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);

  const years = useMemo(
    () => Array.from(new Set(dates.map((d) => d.split('-')[0]))).sort((a, b) => b.localeCompare(a)),
    [dates],
  );

  const yearOptions = useMemo(
    () => years.map((y) => ({ label: y, value: y })),
    [years],
  );

  const monthsForYear = useMemo(
    () =>
      Array.from(
        new Set(dates.filter((d) => d.startsWith(`${selectedYear}-`)).map((d) => d.split('-')[1])),
      ).sort((a, b) => a.localeCompare(b)),
    [dates, selectedYear],
  );

  const monthOptions = useMemo(
    () =>
      monthsForYear.map((m) => ({
        label: MONTH_NAMES[parseInt(m, 10) - 1] || m,
        value: m,
      })),
    [monthsForYear],
  );

  const daysForMonth = useMemo(
    () =>
      Array.from(
        new Set(
          dates
            .filter((d) => d.startsWith(`${selectedYear}-${selectedMonth}-`))
            .map((d) => d.split('-')[2]),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [dates, selectedYear, selectedMonth],
  );

  const dayOptions = useMemo(
    () =>
      daysForMonth.map((d) => ({
        label: String(parseInt(d, 10)),
        value: d,
      })),
    [daysForMonth],
  );

  const pickDate = (year: string, month: string, day: string) => {
    const iso = `${year}-${month}-${day}`;
    if (dates.includes(iso)) onChange(iso);
  };

  const handleYearChange = (newYear: string) => {
    const datesInYear = dates.filter((d) => d.startsWith(`${newYear}-`)).sort();
    if (!datesInYear.length) return;

    const months = Array.from(new Set(datesInYear.map((d) => d.split('-')[1]))).sort();
    let month = selectedMonth;
    if (!months.includes(month)) month = months[months.length - 1];

    const days = datesInYear
      .filter((d) => d.startsWith(`${newYear}-${month}-`))
      .map((d) => d.split('-')[2])
      .sort();
    if (!days.length) return;

    let day = selectedDay;
    if (!days.includes(day)) day = days[days.length - 1];
    pickDate(newYear, month, day);
  };

  const handleMonthChange = (newMonth: string) => {
    const days = dates
      .filter((d) => d.startsWith(`${selectedYear}-${newMonth}-`))
      .map((d) => d.split('-')[2])
      .sort();
    if (!days.length) return;

    let day = selectedDay;
    if (!days.includes(day)) day = days[days.length - 1];
    pickDate(selectedYear, newMonth, day);
  };

  const handleDayChange = (newDay: string) => {
    pickDate(selectedYear, selectedMonth, newDay);
  };

  const accentClass =
    accent === 'sky'
      ? 'gas-reserve-compare-date-group--sky'
      : accent === 'emerald'
        ? 'gas-reserve-compare-date-group--emerald'
        : '';

  return (
    <div className={cn('gas-reserve-compare-date-group', accentClass)}>
      <span className="gas-reserve-compare-date-group__label">{label}</span>
      <div className="gas-reserve-compare-date-grid">
        <div className="gas-reserve-compare-date-grid__cell relative z-50">
          <CustomDropdown
            value={selectedYear}
            onChange={handleYearChange}
            options={yearOptions}
            placeholder="Year"
            isOpen={yearOpen}
            setIsOpen={setYearOpen}
            dropdownRef={yearRef}
            icon={<Calendar className="h-3.5 w-3.5 text-primary shrink-0" />}
            prefixLabel="Year:"
            layout="grid"
            gridColumns={3}
            menuWidth="12rem"
            noBackground
            hideDecorationsOnSelect
          />
        </div>
        <div className="gas-reserve-compare-date-grid__cell relative z-50">
          <CustomDropdown
            value={selectedMonth}
            onChange={handleMonthChange}
            options={monthOptions}
            placeholder="Month"
            isOpen={monthOpen}
            setIsOpen={setMonthOpen}
            dropdownRef={monthRef}
            icon={<FileText className="h-3.5 w-3.5 text-primary shrink-0" />}
            prefixLabel="Month:"
            layout="grid"
            gridColumns={3}
            menuWidth="18rem"
            noBackground
            hideDecorationsOnSelect
          />
        </div>
        <div className="gas-reserve-compare-date-grid__cell relative z-50">
          <CustomDropdown
            value={selectedDay}
            onChange={handleDayChange}
            options={dayOptions}
            placeholder="Day"
            isOpen={dayOpen}
            setIsOpen={setDayOpen}
            dropdownRef={dayRef}
            icon={<Activity className="h-3.5 w-3.5 text-primary shrink-0" />}
            prefixLabel="Day:"
            layout="grid"
            gridColumns={6}
            menuWidth="18rem"
            noBackground
            hideDecorationsOnSelect
            align="right"
          />
        </div>
      </div>
      {hint && <span className="gas-reserve-compare-date-group__hint">{hint}</span>}
    </div>
  );
}

export function ArchiveInsightCallout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 p-3 rounded-xl bg-muted/10 border border-border/40 text-[11px] text-muted-foreground leading-relaxed">
      <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function ArchiveSyncNotice({
  gridDate,
  archiveDate,
  exact,
  latestArchiveDate,
}: {
  gridDate: string;
  archiveDate: string;
  exact: boolean;
  latestArchiveDate: string;
}) {
  const gridAhead =
    gridDate > latestArchiveDate && archiveDate === latestArchiveDate && !exact;

  return (
    <div className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
      <span>
        Controlled by grid backlog selector · gas-day{' '}
        <span className="font-semibold text-foreground">{archiveDate}</span>
        {exact ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1">(synced)</span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">
            (nearest to {gridDate})
          </span>
        )}
      </span>
      {gridAhead && (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Archive ends {latestArchiveDate}
        </span>
      )}
    </div>
  );
}