'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Copy, GitCompare, Info, Search, Calendar } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { ARCHIVE_BASELINE_DATE, ARCHIVE_START_DATE } from '@/lib/data/petrobangla/constants';
import {
  computeArchiveKpis,
  getDomesticGas,
  getFieldGas,
  getRpgclGas,
  powerFulfillmentPct,
  resolveArchiveGasDay,
} from '@/lib/data/petrobangla/compute';
import { loadArchiveDay } from '@/lib/data/petrobangla/loadArchive';
import type { AudienceMode, PetrobanglaDaily, PetrobanglaIndex } from '@/lib/data/petrobangla/types';
import { useGridTierAccess } from '@/hooks/useGridTierAccess';
import { isDateAllowedForTier, type GridAccessTier } from '@/lib/data/grid/grid-tier-access';
import { COMPARE_FREE_BASELINE_DATE } from '@/lib/data/grid/public-sample-dates';
import { GridDataLockedGate } from '@/components/news/power-grid/GridDataLockedGate';
import { CustomDropdown } from '@/components/news/power-grid/shared';
import { GridProvenanceTag, type GridProvenance } from '@/components/news/power-grid/GridExplorerUI';
import { ArchiveBadge, ArchiveDateGridPicker, ArchiveInsightCallout } from './PetrobanglaArchiveShared';

const COMPARE_MODE_HINT: Record<AudienceMode, string> = {
  simple: 'Interactive side-by-side gas comparison — national total, power fulfillment, and top fields. Hover a row to sync highlight.',
  analyst: 'Full analyst mode: hover fields to compare inline deltas, filter by field name, and use YoY or DoD presets.',
  investor: 'Risk dashboard: watch power fulfillment, LNG import share, and Bibiyana concentration shift over time.',
  researcher: 'Validation reconciliation status, copy-to-markdown exports, and raw telemetry field delta tracking.',
};

function shiftIsoYear(iso: string, delta: number): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  return `${y + delta}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const TIER_RANK: Record<GridAccessTier, number> = {
  visitor: 0,
  member: 1,
  plan_499: 2,
  plan_999: 3,
};

function getRequiredTierForDate(date: string, latestDate: string): GridAccessTier {
  if (date === COMPARE_FREE_BASELINE_DATE) return 'visitor';
  if (isDateAllowedForTier(date, 'visitor', latestDate)) return 'visitor';
  if (isDateAllowedForTier(date, 'member', latestDate)) return 'member';
  if (isDateAllowedForTier(date, 'plan_499', latestDate)) return 'plan_499';
  return 'plan_999';
}

function resolveMatchingDateForYear(year: string, rightDate: string, okDates: string[]): string {
  const parts = rightDate.split('-');
  if (parts.length !== 3) return okDates[0] || COMPARE_FREE_BASELINE_DATE;
  const [, m, d] = parts;

  const exact = `${year}-${m}-${d}`;
  if (okDates.includes(exact)) return exact;

  const datesInYear = okDates.filter((date) => date.startsWith(`${year}-`));
  if (!datesInYear.length) return okDates[0] || COMPARE_FREE_BASELINE_DATE;

  const targetDays = parseInt(m, 10) * 31 + parseInt(d, 10);
  let closestDate = datesInYear[0];
  let minDiff = Infinity;

  for (const date of datesInYear) {
    const [, curM, curD] = date.split('-');
    const curDays = parseInt(curM, 10) * 31 + parseInt(curD, 10);
    const diff = Math.abs(curDays - targetDays);
    if (diff < minDiff) {
      minDiff = diff;
      closestDate = date;
    }
  }
  return closestDate;
}

export function ArchiveEarlierYearPicker({
  label,
  value,
  onChange,
  years,
  accent = 'default',
}: {
  label: string;
  value: string;
  onChange: (year: string) => void;
  years: string[];
  accent?: 'sky' | 'emerald' | 'default';
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const yearOptions = useMemo(() => years.map((y) => ({ label: y, value: y })), [years]);

  const accentClass =
    accent === 'sky'
      ? 'gas-reserve-compare-date-group--sky'
      : accent === 'emerald'
        ? 'gas-reserve-compare-date-group--emerald'
        : '';

  return (
    <div className={cn('gas-reserve-compare-date-group', accentClass)} ref={dropdownRef}>
      <span className="gas-reserve-compare-date-group__label">{label}</span>
      <div className="gas-reserve-compare-date-grid grid-cols-1">
        <div className="gas-reserve-compare-date-grid__cell relative z-50">
          <CustomDropdown
            value={value}
            onChange={onChange}
            options={yearOptions}
            placeholder="Select Year"
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            dropdownRef={dropdownRef}
            icon={<Calendar className="h-3.5 w-3.5 text-primary shrink-0" />}
            prefixLabel="Year:"
            layout="grid"
            gridColumns={3}
            menuWidth="14rem"
            noBackground
            hideDecorationsOnSelect
          />
        </div>
      </div>
      <span className="gas-reserve-compare-date-group__hint">Matches month and day of Later Date</span>
    </div>
  );
}

export function PetrobanglaArchiveCompare({
  index,
  latestDate,
  gridSelectedDate,
  mode,
  embedded = false,
  compact = false,
}: {
  index: PetrobanglaIndex;
  latestDate: string;
  gridSelectedDate: string;
  mode: AudienceMode;
  embedded?: boolean;
  compact?: boolean;
}) {
  const gridResolved = useMemo(
    () => resolveArchiveGasDay(gridSelectedDate, index).resolved ?? latestDate,
    [gridSelectedDate, index, latestDate],
  );

  const [isDefaultComparison, setIsDefaultComparison] = useState(true);
  const [leftYear, setLeftYear] = useState(() => {
    const parts = gridResolved.split('-');
    return parts.length === 3 ? String(parseInt(parts[0], 10) - 2) : '2024';
  });
  const [leftDateOverride, setLeftDateOverride] = useState<string | null>(null);
  const [rightDate, setRightDate] = useState(gridResolved);
  const [left, setLeft] = useState<PetrobanglaDaily | null>(null);
  const [right, setRight] = useState<PetrobanglaDaily | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [fieldQuery, setFieldQuery] = useState('');

  const { tier } = useGridTierAccess();

  const okDates = useMemo(() => {
    return [...new Set(index.days.filter((d) => d.parse_status === 'ok').map((d) => d.date))].sort();
  }, [index]);

  const leftDate = useMemo(() => {
    if (tier === 'visitor' && isDefaultComparison) {
      return COMPARE_FREE_BASELINE_DATE;
    }
    if (leftDateOverride) return leftDateOverride;
    return resolveMatchingDateForYear(leftYear, rightDate, okDates);
  }, [leftDateOverride, leftYear, rightDate, okDates, tier, isDefaultComparison]);

  const leftReq = useMemo(() => getRequiredTierForDate(leftDate, latestDate), [leftDate, latestDate]);
  const rightReq = useMemo(() => getRequiredTierForDate(rightDate, latestDate), [rightDate, latestDate]);
  const requiredTier = TIER_RANK[leftReq] > TIER_RANK[rightReq] ? leftReq : rightReq;
  const isLocked = !isDefaultComparison && TIER_RANK[tier] < TIER_RANK[requiredTier];

  const availableYears = useMemo(() => {
    return Array.from(new Set(okDates.map((d) => d.split('-')[0]))).sort((a, b) => b.localeCompare(a));
  }, [okDates]);

  const currentLeftYear = useMemo(() => leftDate.split('-')[0], [leftDate]);

  const handleYearChange = useCallback((year: string) => {
    setLeftYear(year);
    setLeftDateOverride(null);
    setIsDefaultComparison(false);
  }, []);

  const handleRightDateChange = useCallback((date: string) => {
    setRightDate(date);
    setIsDefaultComparison(false);
  }, []);

  useEffect(() => {
    setRightDate(gridResolved);
    setLeftDateOverride(null);
  }, [gridResolved]);

  useEffect(() => {
    let cancelled = false;

    if (isLocked) {
      setLeft(null);
      setRight(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      loadArchiveDay(leftDate, { allowPartial: mode === 'analyst' }),
      loadArchiveDay(rightDate, { allowPartial: mode === 'analyst' }),
    ])
      .then(([l, r]) => {
        if (!cancelled) {
          setLeft(l);
          setRight(r);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLeft(null);
          setRight(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leftDate, rightDate, mode, isLocked]);

  const copySummary = useCallback(async () => {
    if (!left || !right) return;
    const lk = computeArchiveKpis(left);
    const rk = computeArchiveKpis(right);
    const md = [
      `# Petrobangla Archive Comparison`,
      ``,
      `| Metric | ${leftDate} | ${rightDate} | Δ |`,
      `|--------|------------|------------|---|`,
      `| National gas (MMCFD) | ${lk.totalGas.toFixed(1)} | ${rk.totalGas.toFixed(1)} | ${(rk.totalGas - lk.totalGas).toFixed(1)} |`,
      `| Power fulfillment | ${lk.powerFulfillmentPct.toFixed(1)}% | ${rk.powerFulfillmentPct.toFixed(1)}% | ${(rk.powerFulfillmentPct - lk.powerFulfillmentPct).toFixed(1)}pp |`,
      `| LNG share | ${lk.lngSharePct.toFixed(1)}% | ${rk.lngSharePct.toFixed(1)}% | ${(rk.lngSharePct - lk.lngSharePct).toFixed(1)}pp |`,
      `| Bibiyana (MMCFD) | ${lk.bibiyanaGas.toFixed(1)} | ${rk.bibiyanaGas.toFixed(1)} | ${(rk.bibiyanaGas - lk.bibiyanaGas).toFixed(1)} |`,
      `| Active wells | ${lk.activeWells} | ${rk.activeWells} | ${rk.activeWells - lk.activeWells} |`,
      ``,
      `Sources: /data/petrobangla/daily/${leftDate}.json · /data/petrobangla/daily/${rightDate}.json`,
    ].join('\n');
    await navigator.clipboard.writeText(md);
  }, [left, right, leftDate, rightDate]);

  const topMovers = left && right ? fieldMovers(left, right) : [];
  const wrapperClass = embedded ? 'grid-explorer-gas-subview' : 'grid-explorer-chart-card card';

  // YoY calculation
  const yoyDate = useMemo(() => shiftIsoYear(rightDate, -1), [rightDate]);
  const hasYoy = useMemo(() => okDates.includes(yoyDate), [okDates, yoyDate]);

  // DoD calculation
  const prevDate = useMemo(() => {
    const rightIndex = okDates.indexOf(rightDate);
    return rightIndex > 0 ? okDates[rightIndex - 1] : null;
  }, [okDates, rightDate]);

  return (
    <div className={cn(wrapperClass, 'space-y-4')}>
      {compact ? (
        <div className="gas-reserve-archive-view-toolbar">
          <div className="min-w-0">
            <p className="gas-reserve-archive-view-toolbar__title">Compare days</p>
            <p className="gas-reserve-archive-view-toolbar__sub">Pick any two gas-days · right date follows grid selector</p>
          </div>
          <button
            type="button"
            onClick={copySummary}
            className="gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle flex items-center gap-1 shrink-0"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
        </div>
      ) : (
        <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
          <GitCompare className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <h3 className="grid-explorer-chart-card__title">Compare Any Two Days<ArchiveBadge /></h3>
            <p className="grid-explorer-chart-card__sub">Right date follows grid selector · pick any two days to compare</p>
          </div>
          <button
            type="button"
            onClick={copySummary}
            className="gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle flex items-center gap-1 shrink-0"
          >
            <Copy className="h-3 w-3" />
            Copy summary
          </button>
        </div>
      )}

      <ArchiveInsightCallout>{COMPARE_MODE_HINT[mode]}</ArchiveInsightCallout>

      <div className="gas-reserve-compare-toolbar">
        <div className="gas-reserve-compare-toolbar__dates">
          <ArchiveEarlierYearPicker
            label="Earlier Year"
            value={currentLeftYear}
            onChange={handleYearChange}
            years={availableYears}
            accent="sky"
          />
          <div className="gas-reserve-compare-toolbar__arrow" aria-hidden title="Compare direction">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <ArchiveDateGridPicker
            label="Later date"
            value={rightDate}
            onChange={handleRightDateChange}
            dates={okDates}
            hint="Synced to grid date selector"
            accent="emerald"
          />
        </div>
        <div className="gas-reserve-compare-toolbar__presets flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle w-full sm:w-auto text-xs py-1.5',
              isDefaultComparison && rightDate === gridResolved && 'gas-reserve-archive-range__btn--active',
            )}
            onClick={() => {
              const defaultYear = String(parseInt(gridResolved.split('-')[0], 10) - 2);
              setLeftYear(defaultYear);
              setLeftDateOverride(null);
              setRightDate(gridResolved);
              setIsDefaultComparison(true);
            }}
          >
            Sample (2 Years Ago vs grid)
          </button>
          <button
            type="button"
            className={cn(
              'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle w-full sm:w-auto text-xs py-1.5',
              !isDefaultComparison && leftDate === ARCHIVE_START_DATE && rightDate === gridResolved && 'gas-reserve-archive-range__btn--active',
            )}
            onClick={() => {
              setLeftYear('2020');
              setLeftDateOverride(null);
              setRightDate(gridResolved);
              setIsDefaultComparison(false);
            }}
          >
            Jan 2020 vs grid
          </button>
          <button
            type="button"
            className={cn(
              'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle w-full sm:w-auto text-xs py-1.5',
              !isDefaultComparison && leftDate === ARCHIVE_BASELINE_DATE && rightDate === gridResolved && 'gas-reserve-archive-range__btn--active',
            )}
            onClick={() => {
              setLeftDateOverride(ARCHIVE_BASELINE_DATE);
              setRightDate(gridResolved);
              setIsDefaultComparison(false);
            }}
          >
            Baseline vs grid
          </button>
          {hasYoy && (
            <button
              type="button"
              className={cn(
                'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle w-full sm:w-auto text-xs py-1.5',
                !isDefaultComparison && leftDate === yoyDate && rightDate === gridResolved && 'gas-reserve-archive-range__btn--active',
              )}
              onClick={() => {
                setLeftDateOverride(yoyDate);
                setRightDate(gridResolved);
                setIsDefaultComparison(false);
              }}
            >
              YoY (1 Year Ago)
            </button>
          )}
          {prevDate && (
            <button
              type="button"
              className={cn(
                'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle w-full sm:w-auto text-xs py-1.5',
                !isDefaultComparison && leftDate === prevDate && rightDate === gridResolved && 'gas-reserve-archive-range__btn--active',
              )}
              onClick={() => {
                setLeftDateOverride(prevDate);
                setRightDate(gridResolved);
                setIsDefaultComparison(false);
              }}
            >
              DoD (Prev Day)
            </button>
          )}
        </div>
      </div>

      <div className="relative min-h-[16rem]">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Reconciling comparative day metrics…</p>
          </div>
        )}

        {!loading && isLocked && (
          <div className="relative w-full py-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] z-10 rounded-xl" />
            <GridDataLockedGate
              requiredTier={requiredTier}
              selectedDate={`comparison for ${leftDate} vs ${rightDate}`}
              variant="overlay"
              className="z-20 w-[95%] max-w-md shadow-2xl relative"
              onClose={() => {
                const defaultYear = String(parseInt(gridResolved.split('-')[0], 10) - 2);
                setLeftYear(defaultYear);
                setLeftDateOverride(null);
                setRightDate(gridResolved);
                setIsDefaultComparison(true);
              }}
            />
          </div>
        )}

        {!loading && !isLocked && (!left || !right) && (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
            <Info className="h-5 w-5 mb-2 text-muted-foreground/60" />
            No comparative data loaded for the selected dates.
          </div>
        )}

        {!loading && !isLocked && left && right && (
          <div className="space-y-4">
            <CompareDeltaStrip left={left} right={right} leftDate={leftDate} rightDate={rightDate} mode={mode} />

            {/* Search/Filter Bar */}
            {mode !== 'simple' && (
              <div className="relative max-w-sm mb-1 px-1 mt-4">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search production fields (e.g. Bibiyana, Titas)..."
                  value={fieldQuery}
                  onChange={(e) => setFieldQuery(e.target.value)}
                  className="w-full bg-muted/40 border border-border/40 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                />
              </div>
            )}

            <div className="gas-reserve-compare-panels mt-4">
              <ComparePanel
                day={left}
                label={leftDate}
                mode={mode}
                side="left"
                hoveredField={hoveredField}
                setHoveredField={setHoveredField}
                filter={fieldQuery}
              />
              <ComparePanel
                day={right}
                label={rightDate}
                mode={mode}
                side="right"
                other={left}
                hoveredField={hoveredField}
                setHoveredField={setHoveredField}
                filter={fieldQuery}
              />
            </div>

            <div className="gas-reserve-compare-movers mt-4">
              <h4 className="gas-reserve-compare-movers__title flex items-center gap-1.5">
                Top field movers
                <GridProvenanceTag kind="D" />
              </h4>
              <div className="gas-reserve-compare-movers__chips">
                {topMovers.map((m) => (
                  <span
                    key={m.field}
                    className={cn(
                      'gas-reserve-compare-movers__chip cursor-pointer select-none hover:brightness-95',
                      m.delta >= 0 ? 'gas-reserve-compare-movers__chip--up' : 'gas-reserve-compare-movers__chip--down',
                      hoveredField === m.field && 'ring-2 ring-sky-500/50 scale-[1.02]',
                    )}
                    onMouseEnter={() => setHoveredField(m.field)}
                    onMouseLeave={() => setHoveredField(null)}
                  >
                    {m.field}: {m.delta >= 0 ? '+' : ''}
                    {formatNumber(m.delta, 1)} MMCFD
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareDeltaStrip({
  left,
  right,
  leftDate,
  rightDate,
  mode,
}: {
  left: PetrobanglaDaily;
  right: PetrobanglaDaily;
  leftDate: string;
  rightDate: string;
  mode: AudienceMode;
}) {
  const gasL = left.production.grand_total.gas_mmcfd;
  const gasR = right.production.grand_total.gas_mmcfd;
  const fulL = powerFulfillmentPct(left);
  const fulR = powerFulfillmentPct(right);
  const lngL = getRpgclGas(left.production.fields);
  const lngR = getRpgclGas(right.production.fields);
  const lngShareL = gasL > 0 ? (lngL / gasL) * 100 : 0;
  const lngShareR = gasR > 0 ? (lngR / gasR) * 100 : 0;

  const bibL = getFieldGas(left.production.fields, 'Bibiyana');
  const bibR = getFieldGas(right.production.fields, 'Bibiyana');
  const wellsL = left.production.grand_total.producing_wells || 0;
  const wellsR = right.production.grand_total.producing_wells || 0;

  const items = [
    {
      label: 'National gas',
      delta: gasR - gasL,
      unit: 'MMCFD',
      fmt: (v: number) => formatNumber(v, 1),
    },
    {
      label: 'Power fulfillment',
      delta: fulR - fulL,
      unit: 'pp',
      fmt: (v: number) => v.toFixed(1),
    },
    ...(mode !== 'simple'
      ? [
          {
            label: 'LNG share',
            delta: lngShareR - lngShareL,
            unit: 'pp',
            fmt: (v: number) => v.toFixed(1),
          },
          {
            label: 'Bibiyana output',
            delta: bibR - bibL,
            unit: 'MMCFD',
            fmt: (v: number) => formatNumber(v, 1),
          },
          {
            label: 'Active wells',
            delta: wellsR - wellsL,
            unit: 'wells',
            fmt: (v: number) => (v >= 0 ? `+${v}` : v.toString()),
          },
        ]
      : []),
  ];

  return (
    <div className="gas-reserve-compare-delta-strip">
      <p className="gas-reserve-compare-delta-strip__title">
        {leftDate} → {rightDate}
      </p>
      <div className="gas-reserve-compare-delta-strip__grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.label} className="gas-reserve-compare-delta-strip__item flex flex-col p-3 bg-muted/20 border border-border/30 rounded-xl">
            <span className="gas-reserve-compare-delta-strip__label flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase font-semibold leading-tight">
              {item.label}
              <GridProvenanceTag kind="D" />
            </span>
            <span
              className={cn(
                'gas-reserve-compare-delta-strip__value text-sm font-bold tabular-nums flex items-center justify-center gap-1 mt-1',
                item.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
              )}
            >
              {item.delta >= 0 ? <ArrowUp className="h-3 w-3 shrink-0" /> : <ArrowDown className="h-3 w-3 shrink-0" />}
              {item.delta >= 0 ? '+' : ''}{item.fmt(item.delta)} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparePanel({
  day,
  label,
  mode,
  side,
  other,
  hoveredField,
  setHoveredField,
  filter,
}: {
  day: PetrobanglaDaily;
  label: string;
  mode: AudienceMode;
  side: 'left' | 'right';
  other?: PetrobanglaDaily;
  hoveredField: string | null;
  setHoveredField: (f: string | null) => void;
  filter: string;
}) {
  const fulfillment = powerFulfillmentPct(day);
  const lng = getRpgclGas(day.production.fields);
  const total = day.production.grand_total.gas_mmcfd;
  const lngShare = total > 0 ? (lng / total) * 100 : 0;

  const deltaGas =
    other != null ? total - other.production.grand_total.gas_mmcfd : null;

  // Filter fields
  const filteredFields = useMemo(() => {
    const fields = day.production.fields;
    if (!filter) return fields.slice(0, mode === 'simple' ? 8 : 99);
    const q = filter.toLowerCase();
    return fields.filter(
      (f) => f.field.toLowerCase().includes(q) || f.company_code.toLowerCase().includes(q),
    );
  }, [day, filter, mode]);

  // Map to other fields for inline delta calculation
  const otherMap = useMemo(() => {
    if (!other) return null;
    return new Map(other.production.fields.map((f) => [f.field, f.gas_mmcfd]));
  }, [other]);

  return (
    <div
      className={cn(
        'gas-reserve-compare-panel border border-border/30 rounded-2xl p-4 bg-muted/5',
        side === 'left' ? 'gas-reserve-compare-panel--left' : 'gas-reserve-compare-panel--right',
      )}
    >
      <div className="gas-reserve-compare-panel__head flex items-center justify-between pb-3 border-b border-border/30">
        <span className="gas-reserve-compare-panel__date font-bold tabular-nums text-foreground text-sm">{label}</span>
        {deltaGas != null && (
          <span
            className={cn(
              'gas-reserve-compare-panel__delta text-xs font-bold tabular-nums px-2 py-0.5 rounded-full flex items-center gap-1 select-none',
              deltaGas >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500',
            )}
          >
            {deltaGas >= 0 ? <ArrowUp className="h-3 w-3 shrink-0" /> : <ArrowDown className="h-3 w-3 shrink-0" />}
            {deltaGas >= 0 ? '+' : ''}
            {formatNumber(deltaGas, 1)} MMCFD
            <GridProvenanceTag kind="D" />
          </span>
        )}
      </div>

      <div className="gas-reserve-compare-panel__stats grid grid-cols-3 gap-2 my-4">
        {([
          { label: 'National gas', value: formatNumber(total, 1), provenance: 'P' as GridProvenance },
          { label: 'Fulfillment', value: `${fulfillment.toFixed(0)}%`, provenance: 'D' as GridProvenance },
          { label: 'LNG share', value: `${lngShare.toFixed(0)}%`, provenance: 'D' as GridProvenance },
        ]).map((stat) => (
          <div key={stat.label} className="gas-reserve-compare-panel__stat flex flex-col p-3 bg-background border border-border/40 rounded-xl">
            <span className="gas-reserve-compare-panel__stat-label flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-semibold leading-tight">
              <span className="truncate">{stat.label}</span>
              <GridProvenanceTag kind={stat.provenance} />
            </span>
            <span className="gas-reserve-compare-panel__stat-value font-bold text-sm tabular-nums text-foreground mt-1">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid-explorer-table-wrap gas-reserve-compare-panel__table max-h-72 overflow-y-auto">
        <table className="grid-explorer-table text-[10px]">
          <thead>
            <tr>
              <th className="text-left font-bold text-muted-foreground pb-2">Field</th>
              <th className="text-right font-bold text-muted-foreground pb-2">
                Gas MMCFD<GridProvenanceTag kind="P" className="ml-1" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFields.map((f) => {
              const otherVal = otherMap?.get(f.field);
              const fieldDelta = otherVal !== undefined ? f.gas_mmcfd - otherVal : null;
              const gasPct = total > 0 ? (f.gas_mmcfd / total) * 100 : 0;
              const isHovered = hoveredField === f.field;

              return (
                <tr
                  key={f.id}
                  className={cn(
                    'group transition-colors relative cursor-pointer',
                    isHovered ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium' : 'hover:bg-muted/30',
                  )}
                  onMouseEnter={() => setHoveredField(f.field)}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <td className="py-2 pr-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="truncate max-w-[120px]">{f.field}</span>
                      {fieldDelta !== null && fieldDelta !== 0 && (
                        <span
                          className={cn(
                            'text-[9px] font-bold ml-1 transition-opacity opacity-70 group-hover:opacity-100',
                            fieldDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
                          )}
                        >
                          {fieldDelta > 0 ? '▲' : '▼'} {Math.abs(fieldDelta).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="tabular-nums text-right py-2 relative z-10 font-mono">
                    <div className="relative inline-block pr-1">
                      {/* Share background progress bar */}
                      <span
                        className="absolute right-0 bottom-0 top-0 bg-sky-500/5 dark:bg-sky-400/10 rounded"
                        style={{ width: `${Math.min(100, gasPct * 1.5)}%`, zIndex: -1 }}
                      />
                      {formatNumber(f.gas_mmcfd, 1)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mode === 'researcher' && day.validation && (
        <div className="mt-3 pt-2 border-t border-border/30 text-[9px] text-muted-foreground flex justify-between">
          <span>Reconciled: <strong className="text-foreground">{day.validation.reconciled ? 'Yes' : 'No'}</strong></span>
          <span>Wells: <strong className="text-foreground">{day.production.grand_total.producing_wells}</strong></span>
        </div>
      )}
    </div>
  );
}

function fieldMovers(left: PetrobanglaDaily, right: PetrobanglaDaily) {
  const lm = new Map(left.production.fields.map((f) => [f.field, f.gas_mmcfd]));
  const movers: { field: string; delta: number }[] = [];
  for (const f of right.production.fields) {
    const prev = lm.get(f.field) ?? 0;
    movers.push({ field: f.field, delta: f.gas_mmcfd - prev });
  }
  return movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5);
}