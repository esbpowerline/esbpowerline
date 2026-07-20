'use client';

import { useState } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import { dayOverDayDelta } from '@/lib/data/petrobangla/computeLiveWeek';
import type { PetrobanglaLiveWeekBundle } from '@/lib/data/petrobangla/types';
import { LiveBadge } from './pbLiveShared';

export function PbLiveDayCompare({ bundle }: { bundle: PetrobanglaLiveWeekBundle }) {
  const n = bundle.days.length;
  const [leftIdx, setLeftIdx] = useState(Math.max(0, n - 2));
  const [rightIdx, setRightIdx] = useState(Math.max(0, n - 1));

  const left = bundle.days[leftIdx];
  const right = bundle.days[rightIdx];
  if (!left || !right) return null;

  const delta = dayOverDayDelta(left, right);

  // Gas-day labels can repeat across carried/duplicate entries (e.g. "29-30 Jun, 2026");
  // append the ISO date only when a label is ambiguous so the two selects stay distinguishable.
  const labelCounts = new Map<string, number>();
  bundle.index_entries.forEach((e) =>
    labelCounts.set(e.date_label, (labelCounts.get(e.date_label) ?? 0) + 1),
  );
  const optionLabel = (e: (typeof bundle.index_entries)[number]) =>
    (labelCounts.get(e.date_label) ?? 0) > 1 ? `${e.date_label} · ${e.date}` : e.date_label;

  return (
    <div className="space-y-3">
      <h4 className="grid-explorer-chart-card__title text-sm">
        Day-over-Day (within week)<LiveBadge />
      </h4>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
          value={leftIdx}
          onChange={(e) => setLeftIdx(Number(e.target.value))}
        >
          {bundle.index_entries.map((entry, i) => (
            <option key={entry.date} value={i}>
              {optionLabel(entry)}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground text-xs">vs</span>
        <select
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
          value={rightIdx}
          onChange={(e) => setRightIdx(Number(e.target.value))}
        >
          {bundle.index_entries.map((entry, i) => (
            <option key={entry.date} value={i}>
              {optionLabel(entry)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="grid-explorer-chip text-[10px] cursor-pointer"
          onClick={() => {
            setLeftIdx(Math.max(0, n - 2));
            setRightIdx(n - 1);
          }}
        >
          Latest 2 days
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'National gas Δ', value: delta.gasDelta, unit: 'MMCFD' },
          { label: 'LNG Δ', value: delta.lngDelta, unit: 'MMCFD' },
          { label: 'Bibiyana Δ', value: delta.bibiyanaDelta, unit: 'MMCFD' },
          { label: 'Fulfillment Δ', value: delta.fulfillmentDelta, unit: 'pp' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/50 p-2 bg-muted/5 text-center">
            <div className="text-[9px] text-muted-foreground uppercase font-bold">{item.label}</div>
            <div className={cn('text-sm font-bold tabular-nums', item.value >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {item.value >= 0 ? '+' : ''}
              {item.unit === 'pp' ? item.value.toFixed(1) : formatNumber(item.value, 1)}
              {item.unit === 'pp' ? 'pp' : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {delta.topMovers.map((m) => (
          <span key={m.field} className="grid-explorer-chip text-[10px]">
            {m.field}: {m.delta >= 0 ? '+' : ''}{formatNumber(m.delta, 1)}
          </span>
        ))}
      </div>
    </div>
  );
}