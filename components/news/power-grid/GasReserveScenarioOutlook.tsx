'use client';

import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Leaf, Minus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RESERVE_FORECAST_MILESTONES,
  RESERVE_SCENARIO_COLORS,
  RESERVE_SCENARIOS,
  RESERVES_AUDITED_META,
  reserveScenarioAnnualDrawTcf,
  reserveScenarioTcfAt,
  reserveScenarioVsBauYears,
  type ReserveScenarioId,
} from '@/lib/data/macro/reserves';
import {
  liveTcfAt,
  scenarioById,
  type LiveReserveModel,
} from '@/lib/data/macro/reservesLive';

const FORECAST_START = String(RESERVES_AUDITED_META.forecastStartYear);

const SCENARIO_ICONS: Record<ReserveScenarioId, LucideIcon> = {
  lowGrowth: Leaf,
  bau: Minus,
  highGrowth: TrendingUp,
};

interface Props {
  selectedId: ReserveScenarioId;
  highlightId: ReserveScenarioId | null;
  onSelect: (id: ReserveScenarioId) => void;
  onHighlight: (id: ReserveScenarioId | null) => void;
  /** Live extraction-derived model — when present, years/draws come from the daily archive */
  live?: LiveReserveModel | null;
}

export function GasReserveScenarioOutlook({
  selectedId,
  highlightId,
  onSelect,
  onHighlight,
  live,
}: Props) {
  const active = RESERVE_SCENARIOS.find((s) => s.id === selectedId) ?? RESERVE_SCENARIOS[1];
  const ScenarioIcon = SCENARIO_ICONS[active.id];

  const baseRemaining = live?.remainingTcf ?? RESERVES_AUDITED_META.remaining2026Tcf;
  const forkYearLabel = live ? String(live.forkYear) : FORECAST_START;

  const exhaustionOf = (id: ReserveScenarioId) =>
    live
      ? scenarioById(live, id).exhaustionYear
      : RESERVE_SCENARIOS.find((s) => s.id === id)!.exhaustionYear;
  const tcfAt = (year: string, id: ReserveScenarioId) =>
    live ? liveTcfAt(live, Number(year), id) : reserveScenarioTcfAt(year, id);

  const activeExhaustion = exhaustionOf(active.id);
  const runwayYears = activeExhaustion - (live?.forkYear ?? RESERVES_AUDITED_META.forecastStartYear);
  const tcf2030 = tcfAt('2030', active.id);
  const vsBau = reserveScenarioVsBauYears(active.id);
  const annualDraw = live
    ? scenarioById(live, active.id).annualDrawTcf
    : reserveScenarioAnnualDrawTcf(active.id);
  const depletionRate = ((baseRemaining - (tcf2030 ?? 0)) / baseRemaining) * 100;
  const endowmentLeft2030 =
    tcf2030 != null ? (tcf2030 / RESERVES_AUDITED_META.initialRecoverableTcf) * 100 : 0;

  const maxRunway = Math.max(
    12,
    ...RESERVE_SCENARIOS.map((s) => exhaustionOf(s.id) - (live?.forkYear ?? RESERVES_AUDITED_META.forecastStartYear)),
  );

  const bauLiveLabel = live ? `Current rate (${Math.round(live.currentRateMmcfd).toLocaleString()} MMCFD)` : null;
  const activeLabel = active.id === 'bau' && bauLiveLabel ? bauLiveLabel : active.label;
  const activeDescription =
    active.id === 'bau' && live
      ? `Based on the 30-day average domestic extraction through ${live.asOfDate} (${Math.round(live.currentRateMmcfd).toLocaleString()} MMCFD) from daily Petrobangla reports.`
      : active.description;

  return (
    <div className="gas-reserve-scenario-outlook space-y-3">
      <div className="gas-reserve-scenario-band" role="tablist" aria-label="Demand scenarios">
        {RESERVE_SCENARIOS.map((s) => {
          const Icon = SCENARIO_ICONS[s.id];
          const isSelected = selectedId === s.id;
          const isHighlighted = highlightId === s.id;
          const vs = reserveScenarioVsBauYears(s.id);

          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(s.id)}
              onMouseEnter={() => onHighlight(s.id)}
              onMouseLeave={() => onHighlight(null)}
              onFocus={() => onHighlight(s.id)}
              onBlur={() => onHighlight(null)}
              className={cn(
                'gas-reserve-scenario-tile',
                isSelected && 'gas-reserve-scenario-tile--selected',
                isHighlighted && !isSelected && 'gas-reserve-scenario-tile--highlight',
              )}
              style={{ '--scenario-color': s.color } as CSSProperties}
            >
              <div className="gas-reserve-scenario-tile__top">
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: s.color }} />
                <span className="gas-reserve-scenario-tile__label">{s.shortLabel}</span>
                <span
                  className="gas-reserve-scenario-tile__chip"
                  style={{
                    color: s.color,
                    borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)`,
                    background: `color-mix(in srgb, ${s.color} 10%, transparent)`,
                  }}
                >
                  {s.chip}
                </span>
              </div>
              <span className="gas-reserve-scenario-tile__year" style={{ color: s.color }}>
                {exhaustionOf(s.id)}
              </span>
              <span className="gas-reserve-scenario-tile__hint">
                {s.demandGrowth}
                {vs !== 0 && (
                  <span className={vs > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                    {' '}
                    · {vs > 0 ? '+' : ''}
                    {vs} yrs vs Current rate
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="gas-reserve-scenario-compare">
        <div className="gas-reserve-scenario-compare__head">
          <span>Scenario</span>
          <span>Growth</span>
          <span>2030</span>
          <span>Empty</span>
        </div>
        {RESERVE_SCENARIOS.map((s) => (
          <div
            key={s.id}
            className={cn(
              'gas-reserve-scenario-compare__row',
              selectedId === s.id && 'gas-reserve-scenario-compare__row--active',
            )}
            style={selectedId === s.id ? ({ '--scenario-color': s.color } as CSSProperties) : undefined}
          >
            <span className="gas-reserve-scenario-compare__name" style={{ color: s.color }}>
              {s.shortLabel}
            </span>
            <span>{s.demandGrowth}</span>
            <span className="font-semibold tabular-nums">{tcfAt('2030', s.id)?.toFixed(2)} Tcf</span>
            <span className="font-semibold tabular-nums">{exhaustionOf(s.id)}</span>
          </div>
        ))}
      </div>

      <div
        className="gas-reserve-scenario-detail"
        style={{ '--scenario-color': active.color } as CSSProperties}
      >
        <div className="gas-reserve-scenario-detail__head">
          <span
            className="gas-reserve-scenario-detail__icon"
            style={{ color: active.color, background: `color-mix(in srgb, ${active.color} 14%, transparent)` }}
          >
            <ScenarioIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="gas-reserve-scenario-detail__title">{activeLabel}</h4>
            <p className="gas-reserve-scenario-detail__desc">{activeDescription}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="gas-reserve-scenario-detail__year">{activeExhaustion}</div>
            <div className="text-[9px] text-muted-foreground font-medium">exhaustion year</div>
          </div>
        </div>

        <div className="gas-reserve-scenario-detail__stats">
          <div className="gas-reserve-scenario-detail__stat">
            <span className="gas-reserve-scenario-detail__stat-label">Demand growth</span>
            <span className="gas-reserve-scenario-detail__stat-value">{active.demandGrowth}</span>
          </div>
          <div className="gas-reserve-scenario-detail__stat">
            <span className="gas-reserve-scenario-detail__stat-label">Runway</span>
            <span className="gas-reserve-scenario-detail__stat-value">{runwayYears} yrs</span>
          </div>
          <div className="gas-reserve-scenario-detail__stat">
            <span className="gas-reserve-scenario-detail__stat-label">Avg annual draw</span>
            <span className="gas-reserve-scenario-detail__stat-value">{annualDraw.toFixed(2)} Tcf</span>
          </div>
          <div className="gas-reserve-scenario-detail__stat">
            <span className="gas-reserve-scenario-detail__stat-label">vs Current rate</span>
            <span
              className="gas-reserve-scenario-detail__stat-value"
              style={{
                color:
                  vsBau > 0
                    ? RESERVE_SCENARIO_COLORS.lowGrowth
                    : vsBau < 0
                      ? RESERVE_SCENARIO_COLORS.highGrowth
                      : undefined,
              }}
            >
              {vsBau === 0 ? 'Baseline' : `${vsBau > 0 ? '+' : ''}${vsBau} yrs`}
            </span>
          </div>
        </div>

        <div className="gas-reserve-scenario-detail__milestones">
          <div className="gas-reserve-scenario-detail__milestones-head">
            <span>Tcf remaining</span>
            <span>{depletionRate.toFixed(0)}% drawn by 2030</span>
          </div>
          <div className="gas-reserve-scenario-detail__milestones-grid">
            {RESERVE_FORECAST_MILESTONES.map((year) => {
              const tcf = tcfAt(year, active.id);
              return (
                <div key={year} className="gas-reserve-scenario-detail__milestone">
                  <span className="gas-reserve-scenario-detail__milestone-year">{year}</span>
                  <span className="gas-reserve-scenario-detail__milestone-value" style={{ color: active.color }}>
                    {tcf?.toFixed(2)}
                  </span>
                </div>
              );
            })}
            <div className="gas-reserve-scenario-detail__milestone gas-reserve-scenario-detail__milestone--end">
              <span className="gas-reserve-scenario-detail__milestone-year">Empty</span>
              <span className="gas-reserve-scenario-detail__milestone-value">{activeExhaustion}</span>
            </div>
          </div>
          <p className="gas-reserve-scenario-detail__endowment-note">
            Only {endowmentLeft2030.toFixed(1)}% of {RESERVES_AUDITED_META.initialRecoverableTcf} Tcf endowment left by 2030
          </p>
        </div>

        <ul className="gas-reserve-scenario-detail__drivers">
          {active.drivers.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>

        <p className="gas-reserve-scenario-detail__implication">{active.implication}</p>

        <div className="gas-reserve-scenario-detail__runway-wrap">
          <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
            <span>{forkYearLabel} {live ? 'live balance' : 'baseline'}</span>
            <span>{runwayYears} yr runway</span>
            <span>Field empty</span>
          </div>
          <div className="gas-reserve-scenario-detail__runway">
            <div
              className="gas-reserve-scenario-detail__runway-fill"
              style={{
                width: `${(runwayYears / maxRunway) * 100}%`,
                background: `linear-gradient(90deg, ${active.color}, color-mix(in srgb, ${active.color} 55%, transparent))`,
              }}
            />
            <span
              className="gas-reserve-scenario-detail__runway-marker"
              style={{ left: `${(runwayYears / maxRunway) * 100}%`, borderColor: active.color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
