'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Copy, GitCompare } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { ARCHIVE_BASELINE_DATE, ARCHIVE_START_DATE } from '@/lib/data/petrobangla/constants';
import {
  computeArchiveKpis,
  getRpgclGas,
  powerFulfillmentPct,
  resolveArchiveGasDay,
} from '@/lib/data/petrobangla/compute';
import { loadArchiveDay, loadArchiveTimeline } from '@/lib/data/petrobangla/loadArchive';
import type { AudienceMode, PetrobanglaDaily, PetrobanglaIndex } from '@/lib/data/petrobangla/types';
import { ArchiveBadge, ArchiveDateGridPicker, ArchiveInsightCallout } from './PetrobanglaArchiveShared';

const COMPARE_MODE_HINT: Record<AudienceMode, string> = {
  simple: 'Side-by-side gas-day snapshot — national total, power fulfillment, and top fields.',
  analyst: 'Full field tables unlocked. Use presets to benchmark against Jan 2020 or the verified baseline.',
  investor: 'Watch power fulfillment and LNG share deltas — these drive fuel-cost and dispatch risk.',
  researcher: 'Validation flags and raw JSON links available. Copy summary exports a markdown table.',
};

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

  const [leftDate, setLeftDate] = useState(ARCHIVE_BASELINE_DATE);
  const [rightDate, setRightDate] = useState(gridResolved);
  const [left, setLeft] = useState<PetrobanglaDaily | null>(null);
  const [right, setRight] = useState<PetrobanglaDaily | null>(null);
  const [loading, setLoading] = useState(false);

  const okDates = [...new Set(index.days.filter((d) => d.parse_status === 'ok').map((d) => d.date))].sort();

  useEffect(() => {
    setRightDate(gridResolved);
  }, [gridResolved]);

  useEffect(() => {
    let cancelled = false;
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
  }, [leftDate, rightDate, mode]);

  const copySummary = useCallback(async () => {
    if (!left || !right) return;
    const timeline = await loadArchiveTimeline();
    const lk = computeArchiveKpis(left, timeline, index);
    const rk = computeArchiveKpis(right, timeline, index);
    const md = [
      `# Petrobangla Archive Comparison`,
      ``,
      `| Metric | ${leftDate} | ${rightDate} | Δ |`,
      `|--------|------------|------------|---|`,
      `| National gas (MMCFD) | ${lk.totalGas.toFixed(1)} | ${rk.totalGas.toFixed(1)} | ${(rk.totalGas - lk.totalGas).toFixed(1)} |`,
      `| Power fulfillment | ${lk.powerFulfillmentPct.toFixed(1)}% | ${rk.powerFulfillmentPct.toFixed(1)}% | ${(rk.powerFulfillmentPct - lk.powerFulfillmentPct).toFixed(1)}pp |`,
      `| LNG share | ${lk.lngSharePct.toFixed(1)}% | ${rk.lngSharePct.toFixed(1)}% | ${(rk.lngSharePct - lk.lngSharePct).toFixed(1)}pp |`,
      `| Bibiyana (MMCFD) | ${lk.bibiyanaGas.toFixed(1)} | ${rk.bibiyanaGas.toFixed(1)} | ${(rk.bibiyanaGas - lk.bibiyanaGas).toFixed(1)} |`,
      ``,
      `Sources: /data/petrobangla/daily/${leftDate}.json · /data/petrobangla/daily/${rightDate}.json`,
    ].join('\n');
    await navigator.clipboard.writeText(md);
  }, [left, right, leftDate, rightDate, index]);

  const topMovers = left && right ? fieldMovers(left, right) : [];
  const wrapperClass = embedded ? 'grid-explorer-gas-subview' : 'grid-explorer-chart-card card';

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
          <GitCompare className="h-5 w-5 text-sky-500 shrink-0" />
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
          <ArchiveDateGridPicker
            label="Earlier date"
            value={leftDate}
            onChange={setLeftDate}
            dates={okDates}
            accent="sky"
          />
          <div className="gas-reserve-compare-toolbar__arrow" aria-hidden title="Compare direction">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <ArchiveDateGridPicker
            label="Later date"
            value={rightDate}
            onChange={setRightDate}
            dates={okDates}
            hint="Synced to grid when available"
            accent="emerald"
          />
        </div>
        <div className="gas-reserve-compare-toolbar__presets">
          <button
            type="button"
            className={cn(
              'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle w-full sm:w-auto',
              leftDate === ARCHIVE_START_DATE && rightDate === gridResolved && 'gas-reserve-archive-range__btn--active',
            )}
            onClick={() => {
              setLeftDate(ARCHIVE_START_DATE);
              setRightDate(gridResolved);
            }}
          >
            Jan 2020 vs grid
          </button>
          <button
            type="button"
            className={cn(
              'gas-reserve-archive-range__btn gas-reserve-archive-range__btn--toggle w-full sm:w-auto',
              leftDate === ARCHIVE_BASELINE_DATE && rightDate === gridResolved && 'gas-reserve-archive-range__btn--active',
            )}
            onClick={() => {
              setLeftDate(ARCHIVE_BASELINE_DATE);
              setRightDate(gridResolved);
            }}
          >
            Baseline vs grid
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-[11px] text-muted-foreground px-1">Loading archive days…</p>
      )}

      {left && right && !loading && (
        <>
          <CompareDeltaStrip left={left} right={right} leftDate={leftDate} rightDate={rightDate} mode={mode} />

          <div className="gas-reserve-compare-panels">
            <ComparePanel day={left} label={leftDate} mode={mode} side="left" />
            <ComparePanel day={right} label={rightDate} mode={mode} side="right" other={left} />
          </div>

          <div className="gas-reserve-compare-movers">
            <h4 className="gas-reserve-compare-movers__title">Top field movers</h4>
            <div className="gas-reserve-compare-movers__chips">
              {topMovers.map((m) => (
                <span
                  key={m.field}
                  className={cn(
                    'gas-reserve-compare-movers__chip',
                    m.delta >= 0 ? 'gas-reserve-compare-movers__chip--up' : 'gas-reserve-compare-movers__chip--down',
                  )}
                >
                  {m.field}: {m.delta >= 0 ? '+' : ''}
                  {formatNumber(m.delta, 1)} MMCFD
                </span>
              ))}
            </div>
          </div>
        </>
      )}
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
      ? [{
          label: 'LNG share',
          delta: lngShareR - lngShareL,
          unit: 'pp',
          fmt: (v: number) => v.toFixed(1),
        }]
      : []),
  ];

  return (
    <div className="gas-reserve-compare-delta-strip">
      <p className="gas-reserve-compare-delta-strip__title">
        {leftDate} → {rightDate}
      </p>
      <div className="gas-reserve-compare-delta-strip__grid">
        {items.map((item) => (
          <div key={item.label} className="gas-reserve-compare-delta-strip__item">
            <span className="gas-reserve-compare-delta-strip__label">{item.label}</span>
            <span
              className={cn(
                'gas-reserve-compare-delta-strip__value',
                item.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
              )}
            >
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
}: {
  day: PetrobanglaDaily;
  label: string;
  mode: AudienceMode;
  side: 'left' | 'right';
  other?: PetrobanglaDaily;
}) {
  const fulfillment = powerFulfillmentPct(day);
  const lng = getRpgclGas(day.production.fields);
  const total = day.production.grand_total.gas_mmcfd;
  const lngShare = total > 0 ? (lng / total) * 100 : 0;

  const deltaGas =
    other != null ? total - other.production.grand_total.gas_mmcfd : null;

  return (
    <div
      className={cn(
        'gas-reserve-compare-panel',
        side === 'left' ? 'gas-reserve-compare-panel--left' : 'gas-reserve-compare-panel--right',
      )}
    >
      <div className="gas-reserve-compare-panel__head">
        <span className="gas-reserve-compare-panel__date">{label}</span>
        {deltaGas != null && (
          <span
            className={cn(
              'gas-reserve-compare-panel__delta',
              deltaGas >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
            )}
          >
            {deltaGas >= 0 ? '+' : ''}
            {formatNumber(deltaGas, 1)} MMCFD
          </span>
        )}
      </div>

      <div className="gas-reserve-compare-panel__stats">
        <div className="gas-reserve-compare-panel__stat">
          <span className="gas-reserve-compare-panel__stat-label">National gas</span>
          <span className="gas-reserve-compare-panel__stat-value">{formatNumber(total, 1)}</span>
        </div>
        <div className="gas-reserve-compare-panel__stat">
          <span className="gas-reserve-compare-panel__stat-label">Power fulfillment</span>
          <span className="gas-reserve-compare-panel__stat-value">{fulfillment.toFixed(0)}%</span>
        </div>
        <div className="gas-reserve-compare-panel__stat">
          <span className="gas-reserve-compare-panel__stat-label">LNG share</span>
          <span className="gas-reserve-compare-panel__stat-value">{lngShare.toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid-explorer-table-wrap gas-reserve-compare-panel__table">
        <table className="grid-explorer-table text-[10px]">
          <thead>
            <tr>
              <th>Field</th>
              <th className="text-right">Gas MMCFD</th>
            </tr>
          </thead>
          <tbody>
            {day.production.fields.slice(0, mode === 'simple' ? 8 : 99).map((f) => (
              <tr key={f.id}>
                <td>{f.field}</td>
                <td className="tabular-nums text-right">{formatNumber(f.gas_mmcfd, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mode === 'researcher' && day.validation && (
        <p className="gas-reserve-compare-panel__foot">
          Reconciled: {day.validation.reconciled ? 'Yes' : 'No'}
        </p>
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