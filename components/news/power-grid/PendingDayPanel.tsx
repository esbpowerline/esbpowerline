'use client';

import { Zap, Gauge, TrendingDown, Factory, Flame, CircleDollarSign, Clock, Info } from 'lucide-react';
import { GridKpiStrip, GridKpiCell } from '@/components/news/power-grid/GridExplorerUI';
import type { PendingDay } from '@/lib/data/grid/pending-days';
import { isoDateToLegacy } from '@/lib/data/grid/date-utils';

/**
 * A day the calendar has reached and PGCB has not filed.
 *
 * The strip is the same six tiles the Overview renders, in the same order, with
 * every figure a dash. That is deliberate and it is the rule the homepage
 * snapshot already follows: dropping the tiles would reflow the panel and imply
 * the day does not exist, while printing zeros would assert measurements nobody
 * took. The layout holds, the figures stay absent, and the panel names who owes
 * them and when they are due.
 *
 * The point of showing the day at all is that a reader who knows today's date
 * can otherwise only conclude the site has stopped updating. It has not — PGCB
 * publishes a day on the morning after it ends.
 */
/**
 * The Overview's six tiles with every figure a dash, and one line saying what
 * the reader is waiting on.
 *
 * Exported because a day whose payload is NOT held has exactly the same
 * problem as a pending day, and used to answer it differently: the Overview
 * strip fell back to a hand-written object of zeros
 * (PowerGridExplorer.tsx, `activeData ?? { systemStats: { eveningPeakGen: 0,
 * … } }`), so a tier-locked day printed "Evening Peak Gen: 0 MW / Total Energy
 * Gen: 0.00 MKWh" for figures it had never fetched — live in production until
 * 2026-09-19, and precisely the claim doctrine rule 1 forbids: zero says the
 * measurement happened and came out zero. One dash strip, two callers.
 */
export function AbsentFiguresStrip({ hint }: { hint: string }) {
  return (
    <GridKpiStrip layer="page" className="grid-explorer-kpi-strip--six" collapsibleAfter={3}>
      {PENDING_TILES.map((t) => (
        <GridKpiCell
          key={t.label}
          icon={t.icon}
          iconClassName="opacity-40"
          label={t.label}
          value="—"
          hint={hint}
        />
      ))}
    </GridKpiStrip>
  );
}

export function PendingDayPanel({ pending }: { pending: PendingDay }) {
  const legacy = isoDateToLegacy(pending.date) ?? pending.date;
  const dueLegacy = isoDateToLegacy(pending.dueDate) ?? pending.dueDate;
  const heading =
    pending.status === 'in-progress'
      ? 'This energy day is still being measured'
      : `Awaiting ${pending.publisher}’s report for this day`;

  return (
    <div className="grid-explorer-panel space-y-6">
      <AbsentFiguresStrip hint={`awaiting ${pending.publisher}`} />

      <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[16rem]">
        <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
          {pending.status === 'in-progress' ? (
            <Clock className="h-8 w-8 shrink-0 text-amber-500" />
          ) : (
            <Info className="h-8 w-8 shrink-0 text-amber-500" />
          )}
        </div>
        <h4 className="text-base font-bold text-foreground">{heading}</h4>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">{pending.note}</p>
        <div className="bg-muted/10 px-4 py-3 rounded-xl border border-border/20 text-xs text-foreground max-w-md w-full text-left">
          <div className="font-bold text-amber-500 uppercase tracking-wider text-[10px] mb-1.5">
            {pending.publisher} filing schedule
          </div>
          <div className="leading-relaxed text-muted-foreground">
            Energy day <span className="font-semibold text-foreground tabular-nums">{legacy}</span> runs midnight to
            midnight. {pending.publisher} files its report on the morning of{' '}
            <span className="font-semibold text-foreground tabular-nums">{dueLegacy}</span>. This archive collects it
            four times a day and publishes it the moment it appears.
          </div>
        </div>
      </div>
    </div>
  );
}

/** A date that has not happened. Nothing to await, nothing to explain away. */
export function FutureDatePanel({ isoDate }: { isoDate: string }) {
  const legacy = isoDateToLegacy(isoDate) ?? isoDate;
  return (
    <div className="grid-explorer-panel space-y-6">
      <div className="grid-explorer-chart-card card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[16rem]">
        <div className="p-4 rounded-full bg-muted/20 text-muted-foreground">
          <Clock className="h-8 w-8 shrink-0 text-muted-foreground" />
        </div>
        <h4 className="text-base font-bold text-foreground">
          <span className="tabular-nums">{legacy}</span> has not happened yet
        </h4>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          This archive holds days the grid has already run. Pick a day up to today from the selector above.
        </p>
      </div>
    </div>
  );
}

/**
 * The Overview strip's own six, same order. Labels only — a pending day has no
 * figures to attach them to, and inventing units for absent numbers would be
 * the mistake this panel exists to avoid.
 */
const PENDING_TILES = [
  { icon: Zap, label: 'Peak Supply' },
  { icon: Gauge, label: 'Peak Demand' },
  { icon: TrendingDown, label: 'Peak Deficit' },
  { icon: Factory, label: 'Capacity Idle' },
  { icon: Flame, label: 'Gas Supply' },
  { icon: CircleDollarSign, label: 'Cost of Power' },
] as const;
