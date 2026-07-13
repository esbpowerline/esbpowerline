'use client';

import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Leaf, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridChartExternalLegend } from '@/components/news/PowerGridChartUI';
import { GridCardFooter } from './GridExplorerUI';
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

const FORECAST_START = String(RESERVES_AUDITED_META.forecastStartYear);

const SCENARIO_ICONS: Record<ReserveScenarioId, LucideIcon> = {
  lowGrowth: Leaf,
  bau: Minus,
  highGrowth: TrendingUp,
};

interface Props {
  activeScenario: ReserveScenarioId | null;
  onScenarioHover: (id: ReserveScenarioId | null) => void;
  /** Nested beside depletion chart inside the outlook card */
  embedded?: boolean;
}

export function GasReserveScenarioRail({ activeScenario, onScenarioHover, embedded = false }: Props) {
  return (
    <aside className={cn('gas-reserve-scenario-rail h-full flex flex-col min-h-0', embedded && 'gas-reserve-scenario-rail--embedded')}>
      {!embedded ? (
        <header className="gas-reserve-zone-head gas-reserve-zone-head--rail">
          <TrendingDown className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="gas-reserve-zone-eyebrow">Scenario forks</p>
            <h3 className="gas-reserve-zone-title">Demand scenarios</h3>
            <p className="gas-reserve-zone-sub">
              Three demand forks from {RESERVES_AUDITED_META.remaining2026Tcf} Tcf — hover to highlight chart
            </p>
          </div>
        </header>
      ) : (
        <div className="gas-reserve-scenario-rail__embed-head px-4 pt-3 pb-2 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Demand scenarios</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Hover a card to highlight its fork on the chart
          </p>
        </div>
      )}

      {!embedded && (
        <div className="gas-reserve-scenario-rail__legend px-4">
          <GridChartExternalLegend
            items={RESERVE_SCENARIOS.map((s) => ({
              id: s.id,
              label: `${s.shortLabel} → ${s.exhaustionYear}`,
              color: s.color,
              variant: s.id === 'bau' ? ('line' as const) : ('dashed' as const),
            }))}
          />
        </div>
      )}

      <div className="px-4 pb-3 shrink-0">
        <div className="gas-reserve-scenario-compare">
          <div className="gas-reserve-scenario-compare__head">
            <span>Scenario</span>
            <span>Growth</span>
            <span>2030</span>
            <span>Empty</span>
          </div>
          {RESERVE_SCENARIOS.map((s) => (
            <div key={s.id} className="gas-reserve-scenario-compare__row">
              <span className="gas-reserve-scenario-compare__name" style={{ color: s.color }}>
                {s.shortLabel}
              </span>
              <span>{s.demandGrowth}</span>
              <span className="font-semibold tabular-nums">
                {reserveScenarioTcfAt('2030', s.id)?.toFixed(2)} Tcf
              </span>
              <span className="font-semibold tabular-nums">{s.exhaustionYear}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="gas-reserve-scenario-rail__cards flex-1 px-3 pb-3 overflow-y-auto min-h-0">
        {RESERVE_SCENARIOS.map((s) => {
          const active = activeScenario === s.id;
          const ScenarioIcon = SCENARIO_ICONS[s.id];
          const runwayYears = s.exhaustionYear - RESERVES_AUDITED_META.forecastStartYear;
          const tcf2030 = reserveScenarioTcfAt('2030', s.id);
          const vsBau = reserveScenarioVsBauYears(s.id);
          const annualDraw = reserveScenarioAnnualDrawTcf(s.id);
          const depletionRate =
            ((RESERVES_AUDITED_META.remaining2026Tcf - (tcf2030 ?? 0)) /
              RESERVES_AUDITED_META.remaining2026Tcf) *
            100;
          const endowmentLeft2030 =
            tcf2030 != null ? (tcf2030 / RESERVES_AUDITED_META.initialRecoverableTcf) * 100 : 0;

          return (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => onScenarioHover(s.id)}
              onMouseLeave={() => onScenarioHover(null)}
              onFocus={() => onScenarioHover(s.id)}
              onBlur={() => onScenarioHover(null)}
              className={cn(
                'gas-reserve-scenario-card w-full text-left transition-all duration-200',
                active && 'gas-reserve-scenario-card--active',
              )}
              style={{ '--scenario-color': s.color } as CSSProperties}
            >
              <div className="gas-reserve-scenario-card__head">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="gas-reserve-scenario-card__icon"
                    style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 14%, transparent)` }}
                  >
                    <ScenarioIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="gas-reserve-scenario-card__label">{s.label}</span>
                      <span
                        className="gas-reserve-scenario-card__chip"
                        style={{
                          color: s.color,
                          borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)`,
                          background: `color-mix(in srgb, ${s.color} 10%, transparent)`,
                        }}
                      >
                        {s.chip}
                      </span>
                    </div>
                    <p className="gas-reserve-scenario-card__desc mt-1">{s.description}</p>
                  </div>
                </div>
                <div className="sm:text-right shrink-0 pt-0.5">
                  <div className="gas-reserve-scenario-card__year">{s.exhaustionYear}</div>
                  <div className="text-[9px] text-muted-foreground font-medium">exhaustion year</div>
                </div>
              </div>

              <div className="gas-reserve-scenario-card__stats">
                <div className="gas-reserve-scenario-card__stat">
                  <span className="gas-reserve-scenario-card__stat-label">Demand growth</span>
                  <span className="gas-reserve-scenario-card__stat-value">{s.demandGrowth}</span>
                </div>
                <div className="gas-reserve-scenario-card__stat">
                  <span className="gas-reserve-scenario-card__stat-label">Runway</span>
                  <span className="gas-reserve-scenario-card__stat-value">{runwayYears} yrs</span>
                </div>
                <div className="gas-reserve-scenario-card__stat">
                  <span className="gas-reserve-scenario-card__stat-label">Avg annual draw</span>
                  <span className="gas-reserve-scenario-card__stat-value">{annualDraw.toFixed(2)} Tcf</span>
                </div>
                <div className="gas-reserve-scenario-card__stat">
                  <span className="gas-reserve-scenario-card__stat-label">vs Current rate</span>
                  <span
                    className="gas-reserve-scenario-card__stat-value"
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

              <div className="gas-reserve-scenario-card__milestones">
                <div className="gas-reserve-scenario-card__milestones-head">
                  <span>Tcf remaining</span>
                  <span>{depletionRate.toFixed(0)}% drawn by 2030</span>
                </div>
                <div className="gas-reserve-scenario-card__milestones-grid">
                  {RESERVE_FORECAST_MILESTONES.map((year) => {
                    const tcf = reserveScenarioTcfAt(year, s.id);
                    return (
                      <div key={year} className="gas-reserve-scenario-card__milestone">
                        <span className="gas-reserve-scenario-card__milestone-year">{year}</span>
                        <span className="gas-reserve-scenario-card__milestone-value" style={{ color: s.color }}>
                          {tcf?.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="gas-reserve-scenario-card__milestone gas-reserve-scenario-card__milestone--end">
                    <span className="gas-reserve-scenario-card__milestone-year">Empty</span>
                    <span className="gas-reserve-scenario-card__milestone-value">{s.exhaustionYear}</span>
                  </div>
                </div>
                <p className="gas-reserve-scenario-card__endowment-note">
                  Only {endowmentLeft2030.toFixed(1)}% of {RESERVES_AUDITED_META.initialRecoverableTcf} Tcf endowment left by 2030
                </p>
              </div>

              <ul className="gas-reserve-scenario-card__drivers">
                {s.drivers.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>

              <p className="gas-reserve-scenario-card__implication">{s.implication}</p>

              <div className="gas-reserve-scenario-card__runway-wrap">
                <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                  <span>{FORECAST_START} baseline</span>
                  <span>{runwayYears} yr runway</span>
                  <span>Field empty</span>
                </div>
                <div className="gas-reserve-scenario-card__runway">
                  <div
                    className="gas-reserve-scenario-card__runway-fill"
                    style={{
                      width: `${(runwayYears / 12) * 100}%`,
                      background: `linear-gradient(90deg, ${s.color}, color-mix(in srgb, ${s.color} 55%, transparent))`,
                    }}
                  />
                  <span
                    className="gas-reserve-scenario-card__runway-marker"
                    style={{ left: `${(runwayYears / 12) * 100}%`, borderColor: s.color }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!embedded && (
        <div className="gas-reserve-zone-foot shrink-0">
          <div className="bg-muted/10 p-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
            <p>
              <strong>How to compare:</strong> All three forks start from the same {RESERVES_AUDITED_META.remaining2026Tcf} Tcf audited balance in {FORECAST_START}.
              Steeper demand pulls reserves down faster — low growth adds ~2 years, high growth cuts ~2 years vs Current rate.
            </p>
            <p>
              <strong>What changes:</strong> Industrial load, power-sector gas burn, and efficiency assumptions — not the starting reserve audit.
            </p>
          </div>
          <GridCardFooter>
            <span>Source: MPEMR multi-scenario audit</span>
            <span>Audited by: MPEMR · CAG Bangladesh</span>
            <span className="font-medium">Forked {FORECAST_START}–2038</span>
          </GridCardFooter>
        </div>
      )}
    </aside>
  );
}
