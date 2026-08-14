'use client';

import { RefObject } from 'react';
import { Activity, Check, ChevronDown, FileText, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TakaIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="16.5" cy="15.5" r="1.25" fill="currentColor" />
      <path d="M7 7a2 2 0 1 1 4 0v9a3 3 0 0 0 6 0v-.5" />
      <path d="M8 11h6" />
    </svg>
  );
}

export type CustomDropdownOption = {
  label: string;
  value: string;
  locked?: boolean;
};

export interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomDropdownOption[];
  placeholder: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
  icon?: React.ReactNode;
  prefixLabel?: string;
  layout?: 'list' | 'grid';
  gridColumns?: number;
  menuWidth?: string;
  noBackground?: boolean;
  hideDecorationsOnSelect?: boolean;
  align?: 'left' | 'right';
  /**
   * This list holds a set that cannot grow without bound, so it renders in full
   * with no height cap and no scrollbar — the same treatment grid menus already
   * get, and for the same reason.
   *
   * Only pass it when that is true of the options. A list that can grow with
   * the data (substations, plants, partners) must keep the cap, or the menu
   * eventually runs off the viewport.
   */
  boundedList?: boolean;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  isOpen,
  setIsOpen,
  dropdownRef,
  icon,
  prefixLabel,
  layout = 'list',
  gridColumns = 3,
  menuWidth,
  noBackground = false,
  hideDecorationsOnSelect = false,
  align = 'left',
  boundedList = false,
}: CustomDropdownProps) {
  const selectedOption = options.find((opt) => opt.value === value) || { label: placeholder, value };
  const hasValue = value && value !== '';
  const showDecorations = !hideDecorationsOnSelect || !hasValue;

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'grid-explorer-control w-full relative flex items-center justify-center gap-2 px-3.5 py-2 min-h-11 text-xs text-foreground font-semibold shadow-sm pr-8',
          noBackground
            ? 'bg-transparent hover:bg-muted/10 hover:border-primary/30'
            : 'bg-muted/20 hover:bg-muted/30 hover:border-primary/30',
        )}
      >
        <span className="flex items-center justify-center gap-1.5 font-bold min-w-0 w-full text-center">
          {showDecorations && icon}
          {showDecorations && prefixLabel && (
            <span className="text-muted-foreground font-medium mr-0.5 shrink-0">{prefixLabel}</span>
          )}
          <span
            className={cn(
              'truncate whitespace-nowrap text-center',
              selectedOption.locked && 'text-muted-foreground/60 font-semibold',
            )}
          >
            {selectedOption.label}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div
          style={menuWidth ? { width: menuWidth } : undefined}
          className={cn(
            'absolute mt-2.5 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 z-[100] animate-in fade-in slide-in-from-top-1 duration-150',
            // Grid menus hold a bounded set (years / 12 months / ≤31 days), so they
            // render in full — no height cap, no scrollbar. List menus keep the
            // capped, scrollable behaviour unless the caller states its own set is
            // bounded too: a six-row list that overflows by one row hides a option
            // behind a scrollbar for nothing.
            layout === 'grid' || boundedList
              ? 'overflow-visible'
              : 'max-h-60 overflow-y-auto scrollbar-thin',
            align === 'right' ? 'right-0' : 'left-0',
            layout === 'grid' ? 'grid gap-1' : 'flex flex-col',
            layout === 'grid' && gridColumns === 3 && 'grid-cols-3',
            layout === 'grid' && gridColumns === 4 && 'grid-cols-4',
            layout === 'grid' && gridColumns === 6 && 'grid-cols-6',
            layout !== 'grid' && 'w-full',
          )}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            const locked = Boolean(opt.locked);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center rounded-xl text-xs md:text-sm font-semibold transition-colors duration-150 select-none text-left min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  layout === 'grid' ? 'justify-center p-2' : 'w-full justify-between px-3.5 py-2.5',
                  locked
                    ? cn(
                        active
                          ? 'bg-muted/25 text-muted-foreground/50 font-medium'
                          : 'text-muted-foreground/30 hover:text-muted-foreground/45 hover:bg-muted/15',
                      )
                    : cn(
                        active
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-foreground hover:text-foreground hover:bg-muted/40',
                      ),
                )}
              >
                <span className={cn(layout === 'grid' ? 'whitespace-nowrap text-center w-full' : 'truncate')}>
                  {opt.label}
                </span>
                {active && layout !== 'grid' && (
                  <Check className={cn('h-3.5 w-3.5 shrink-0', locked && 'opacity-40')} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function getUpcomingProjectStatusInfo(statusStr: string) {
  const lowercase = statusStr.toLowerCase();
  if (lowercase.includes('approved')) {
    return {
      label: 'PDPP Approved',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500 border-emerald-500/20',
      icon: Check,
    };
  }
  if (lowercase.includes('sent') || lowercase.includes('recast')) {
    return {
      label: 'PDPP Submitted',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400 border-blue-500/20',
      icon: FileText,
    };
  }
  if (lowercase.includes('feasibility')) {
    return {
      label: 'Feasibility Study',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400 border-cyan-500/20',
      icon: Activity,
    };
  }
  return {
    label: 'Pipeline',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400 border-purple-500/20',
    icon: TrendingUp,
  };
}

export function renderProjectCost(costStr: string | undefined | null) {
  if (!costStr || costStr.trim() === '' || costStr.toLowerCase().includes('n/a') || costStr === '-') {
    return <div className="font-bold text-foreground">N/A</div>;
  }

  const isLakh = costStr.toLowerCase().includes('lakh');
  if (isLakh) {
    const cleanStr = costStr.replace(/,/g, '');
    const match = cleanStr.match(/\b[0-9.]+\b/);
    if (match) {
      const numVal = parseFloat(match[0]);
      if (!isNaN(numVal)) {
        const croreVal = numVal / 100;
        let formattedCrore = '';
        if (croreVal >= 1000) {
          const kCroreVal = croreVal / 1000;
          formattedCrore =
            kCroreVal.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + 'K';
        } else {
          formattedCrore = croreVal.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }

        let currencySuffix = 'BDT';
        if (costStr.toLowerCase().includes('tk')) {
          currencySuffix = 'Tk';
        }

        return (
          <div className="space-y-0.5">
            <div className="font-bold text-foreground text-sm">{costStr}</div>
            <div className="text-[10px] text-muted-foreground font-semibold">
              (~{formattedCrore} Crore {currencySuffix})
            </div>
          </div>
        );
      }
    }
  }

  return <div className="font-bold text-foreground">{costStr}</div>;
}