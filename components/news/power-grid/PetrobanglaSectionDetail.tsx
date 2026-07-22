'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type {
  DistributionCompany,
  PetrobanglaDaily,
  ProductionField,
} from '@/lib/data/petrobangla/types';
import { loadArchiveDay, loadArchiveIndex } from '@/lib/data/petrobangla/loadArchive';
import { resolveArchiveGasDay } from '@/lib/data/petrobangla/compute';
import { formatNumber } from '@/lib/utils';

/** Loads the archive day backing a grid date — same resolution as PetrobanglaGasKpiStrip. */
export function usePetrobanglaArchiveDay(selectedDate: string): {
  day: PetrobanglaDaily | null;
  gasDay: string | null;
} {
  const [day, setDay] = useState<PetrobanglaDaily | null>(null);
  const [gasDay, setGasDay] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDay(null);
    setGasDay(null);
    loadArchiveIndex()
      .then((index) => {
        const { resolved } = resolveArchiveGasDay(selectedDate, index);
        if (!resolved || cancelled) return null;
        setGasDay(resolved);
        return loadArchiveDay(resolved);
      })
      .then((d) => {
        if (d && !cancelled) setDay(d);
      })
      .catch(() => {
        /* quarantined or missing day — details simply unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  return { day, gasDay };
}

/** Collapse doubled glyphs from overlapping-text parse artifacts ("SSuubb--TToottaall"). */
function collapseDoubles(s: string): string {
  return s.replace(/(.)\1/g, '$1');
}

function isRealFieldRow(f: ProductionField): boolean {
  if (f.record_type !== 'field') return false;
  return !/sub.?total|grand.?total/i.test(collapseDoubles(f.field || ''));
}

/**
 * Live-synced days carry degraded metadata (null company codes, company labels
 * leaked into field names like "1. BGFCL Bakhrabad", Bangora filed under
 * CHEVRON), so field names are the canonical owner signal, codes the fallback.
 */
const FIELD_OWNER: Record<string, string> = {
  titas: 'BGFCL', habiganj: 'BGFCL', bakhrabad: 'BGFCL', narsingdi: 'BGFCL', meghna: 'BGFCL',
  sylhet: 'SGFL', 'kailashtila #1 (silicagel)': 'SGFL', 'kailashtila #2 (mste)': 'SGFL',
  rashidpur: 'SGFL', beanibazar: 'SGFL',
  salda: 'BAPEX', fenchuganj: 'BAPEX', shahbazpur: 'BAPEX', semutung: 'BAPEX',
  sundalpur: 'BAPEX', srikail: 'BAPEX', begumganj: 'BAPEX', begumgonj: 'BAPEX', rupganj: 'BAPEX',
  jalalabad: 'CHEVRON', maulavibazar: 'CHEVRON', moulavibazar: 'CHEVRON', bibiyana: 'CHEVRON',
  bangora: 'TULLOW',
};

/** Strip leaked "N. COMPANY" prefixes so "1. BGFCL Bakhrabad" reads "Bakhrabad". */
export function cleanFieldName(raw: string | null | undefined): string {
  return (raw || '')
    .replace(/^\s*\d+\.\s*/, '')
    .replace(/\b(BGFCL|SGFL|BAPEX|CHEVRON|TULLOW|IOCS?)\b\s*/gi, '')
    .trim();
}

function fieldOwner(f: ProductionField): string | null {
  const name = cleanFieldName(f.field).toLowerCase();
  if (FIELD_OWNER[name]) return FIELD_OWNER[name];
  if (name.startsWith('r-lng')) return 'RPGCL';
  const operator = (f.operator || '').toUpperCase();
  if (operator.includes('CHEVRON')) return 'CHEVRON';
  if (operator.includes('TULLOW')) return 'TULLOW';
  return f.company_code && f.company_code !== 'IOC' ? f.company_code : null;
}

/**
 * Resolve a summary-table company label ("BGFCL (Titas, Habiganj, Bakhrabad)",
 * "Chevron (Bibiyana, …)") to its per-field archive rows.
 */
export function productionFieldsForLabel(
  day: PetrobanglaDaily | null,
  label: string,
): ProductionField[] {
  if (!day?.production?.fields?.length) return [];
  const target = label.toUpperCase().split(/[\s(]/)[0];
  return day.production.fields.filter((f) => isRealFieldRow(f) && fieldOwner(f) === target);
}

export function distributionCompanyForLabel(
  day: PetrobanglaDaily | null,
  label: string,
): DistributionCompany | null {
  if (!day?.distribution?.companies?.length) return null;
  const code = label.toUpperCase().split(/[\s(]/)[0];
  return day.distribution.companies.find((c) => c.company_code === code) ?? null;
}

/**
 * Fixed categorical palette for producers — color follows the entity across the
 * summary rows, share bars and detail accents. Light steps are Tailwind 500s,
 * dark steps drop to 600 (both validated for lightness, chroma, CVD separation
 * and surface contrast; identity is never color-alone — rows are text-labeled).
 */
export const PRODUCER_COLORS: Record<string, { dot: string; bar: string; shell: string; tint: string }> = {
  BGFCL: { dot: 'bg-sky-500 dark:bg-sky-600', bar: 'bg-sky-500 dark:bg-sky-600', shell: 'border-sky-500/40 dark:border-sky-600/45', tint: 'bg-sky-500/5 dark:bg-sky-600/10' },
  SGFL: { dot: 'bg-amber-500 dark:bg-amber-600', bar: 'bg-amber-500 dark:bg-amber-600', shell: 'border-amber-500/40 dark:border-amber-600/45', tint: 'bg-amber-500/5 dark:bg-amber-600/10' },
  BAPEX: { dot: 'bg-emerald-500 dark:bg-emerald-600', bar: 'bg-emerald-500 dark:bg-emerald-600', shell: 'border-emerald-500/40 dark:border-emerald-600/45', tint: 'bg-emerald-500/5 dark:bg-emerald-600/10' },
  CHEVRON: { dot: 'bg-violet-500', bar: 'bg-violet-500', shell: 'border-violet-500/40 dark:border-violet-500/45', tint: 'bg-violet-500/5 dark:bg-violet-500/10' },
  TULLOW: { dot: 'bg-rose-500', bar: 'bg-rose-500', shell: 'border-rose-500/40 dark:border-rose-500/45', tint: 'bg-rose-500/5 dark:bg-rose-500/10' },
  RPGCL: { dot: 'bg-teal-600', bar: 'bg-teal-600', shell: 'border-teal-600/40 dark:border-teal-600/45', tint: 'bg-teal-600/5 dark:bg-teal-600/10' },
};

export function producerKeyFromLabel(label: string): string {
  return label.toUpperCase().split(/[\s(]/)[0];
}

/** Same validated palette, same fixed order, applied to the distributor roster. */
export const DISTRIBUTOR_COLORS: Record<string, { dot: string; bar: string; shell: string; tint: string }> = {
  TGTDCL: PRODUCER_COLORS.BGFCL,
  BGDCL: PRODUCER_COLORS.SGFL,
  KGDCL: PRODUCER_COLORS.BAPEX,
  JGTDSL: PRODUCER_COLORS.CHEVRON,
  PGCL: PRODUCER_COLORS.TULLOW,
  SGCL: PRODUCER_COLORS.RPGCL,
};

function num(v: number | null | undefined, decimals = 1): string {
  return typeof v === 'number' ? formatNumber(v, decimals) : '—';
}

function pct(v: number | null | undefined): string {
  return typeof v === 'number' ? `${v.toFixed(1)}%` : '—';
}

const TH = 'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-left whitespace-nowrap';
const TD = 'px-3 py-2 text-xs tabular-nums text-left whitespace-nowrap';
/** Group-boundary rule — the vertical separators that give the PDF its ruled look. */
const SEP = 'border-l border-border/30';
const THC = 'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center whitespace-nowrap';
const TDC = 'px-3 py-2 text-xs tabular-nums text-center whitespace-nowrap';
const GROUP_TH = 'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center whitespace-nowrap border-b border-border/30';

/**
 * PDF Section I detail for one producer: per-field wells, capacity, gas,
 * condensate and national %-of-capacity / %-of-production, with a sub-total.
 */
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-full border border-border/40 bg-muted/20 px-2.5 py-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-bold tabular-nums text-foreground">{value}</span>
    </span>
  );
}

function MiniBar({ pctValue, fillClass }: { pctValue: number | null; fillClass: string }) {
  if (pctValue == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-muted/40 sm:w-20">
        <span
          className={`block h-full rounded-full ${fillClass}`}
          style={{ width: `${Math.min(100, Math.max(0, pctValue))}%` }}
        />
      </span>
      <span className="tabular-nums">{pctValue.toFixed(0)}%</span>
    </span>
  );
}

function DetailHeader({
  label,
  colors,
  onToggle,
  children,
}: {
  label: string;
  colors: { dot: string; shell: string; tint: string } | null;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role={onToggle ? 'button' : undefined}
      aria-expanded={onToggle ? true : undefined}
      onClick={onToggle}
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-3 py-2.5 ${
        onToggle ? 'cursor-pointer' : ''
      } ${colors ? `${colors.tint} ${colors.shell}` : 'bg-muted/15 border-border/30'}`}
    >
      <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
        {onToggle && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary" />}
        {colors && <span className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />}
        {label}
      </span>
      <span className="flex flex-wrap items-center gap-1.5">{children}</span>
    </div>
  );
}

export function ProductionCompanyDetail({
  fields,
  grandTotal,
  producerKey,
  label,
  onToggle,
}: {
  fields: ProductionField[];
  grandTotal?: ProductionField | null;
  producerKey?: string;
  label: string;
  onToggle?: () => void;
}) {
  if (!fields.length) return null;
  const colors = (producerKey && PRODUCER_COLORS[producerKey]) || null;
  const hasOperator = fields.some((f) => f.operator);
  const sum = (pick: (f: ProductionField) => number | null | undefined) =>
    fields.reduce((acc, f) => acc + (typeof pick(f) === 'number' ? (pick(f) as number) : 0), 0);
  const sumIfAny = (pick: (f: ProductionField) => number | null | undefined) =>
    fields.some((f) => typeof pick(f) === 'number') ? sum(pick) : null;

  // The PDF's per-field % columns are rounded (and occasionally wrong in the
  // source), so summing them drifts from Petrobangla's own subtotal line.
  // Match the PDF by recomputing from volumes over the day's grand totals.
  const gasSum = sum((f) => f.gas_mmcfd);
  const subPctCap =
    typeof grandTotal?.capacity_mmcfd === 'number' && grandTotal.capacity_mmcfd > 0
      ? (gasSum / grandTotal.capacity_mmcfd) * 100
      : sumIfAny((f) => f.pct_of_total_capacity);
  const subPctProd =
    typeof grandTotal?.gas_mmcfd === 'number' && grandTotal.gas_mmcfd > 0
      ? (gasSum / grandTotal.gas_mmcfd) * 100
      : sumIfAny((f) => f.pct_of_total_production);

  const capSum = sum((f) => f.capacity_mmcfd);
  const utilization = capSum > 0 ? (gasSum / capSum) * 100 : null;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-muted/10 ${colors ? colors.shell : 'border-border/40'}`}
    >
      <DetailHeader label={label} colors={colors} onToggle={onToggle}>
        <StatChip label="Fields" value={String(fields.length)} />
        <StatChip label="Wells" value={formatNumber(sum((f) => f.producing_wells), 0)} />
        <StatChip label="Capacity" value={`${formatNumber(capSum, 0)} MMCFD`} />
        <StatChip label="Gas" value={`${formatNumber(gasSum, 1)} MMCFD`} />
        {utilization != null && <StatChip label="Utilization" value={`${utilization.toFixed(0)}%`} />}
      </DetailHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/20">
            <tr>
              <th rowSpan={2} className={`${TH} align-bottom border-b border-border/40`}>Gas Field</th>
              {hasOperator && (
                <th rowSpan={2} className={`${TH} align-bottom border-b border-border/40`}>Operator</th>
              )}
              <th rowSpan={2} className={`${THC} align-bottom border-b border-border/40 ${SEP}`}>Prod. Wells</th>
              <th rowSpan={2} className={`${THC} align-bottom border-b border-border/40 ${SEP}`}>Capacity (MMCFD)</th>
              <th colSpan={2} className={`${GROUP_TH} ${SEP}`}>Daily Production</th>
              <th rowSpan={2} className={`${THC} align-bottom border-b border-border/40 ${SEP}`}>Utilization</th>
              <th colSpan={2} className={`${GROUP_TH} ${SEP}`}>% of Grand Total</th>
            </tr>
            <tr className="border-b border-border/40">
              <th className={`${THC} ${SEP}`}>Gas (MMCFD)</th>
              <th className={`${THC} ${SEP}`}>Condensate (BBLD)</th>
              <th className={`${THC} ${SEP}`}>Total Capacity</th>
              <th className={`${THC} ${SEP}`}>Total Production</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, idx) => {
              const fieldUtil =
                typeof f.gas_mmcfd === 'number' &&
                typeof f.capacity_mmcfd === 'number' &&
                f.capacity_mmcfd > 0
                  ? (f.gas_mmcfd / f.capacity_mmcfd) * 100
                  : null;
              return (
                <tr
                  key={f.id || f.field}
                  className={`border-b border-border/20 last:border-b-0 ${idx % 2 ? 'bg-muted/10' : ''}`}
                >
                  <td className={`${TD} font-semibold`}>{cleanFieldName(f.field)}</td>
                  {hasOperator && (
                    <td className={`${TD} text-muted-foreground`}>
                      {cleanFieldName(f.field).toLowerCase() === 'bangora' ? 'TULLOW' : f.operator || '—'}
                    </td>
                  )}
                  <td className={`${TDC} ${SEP}`}>{num(f.producing_wells, 0)}</td>
                  <td className={`${TDC} ${SEP}`}>{num(f.capacity_mmcfd, 0)}</td>
                  <td className={`${TDC} font-medium ${SEP}`}>{num(f.gas_mmcfd)}</td>
                  <td className={`${TDC} ${SEP}`}>{num(f.condensate_bbld)}</td>
                  <td className={`${TDC} ${SEP}`}>
                    <MiniBar pctValue={fieldUtil} fillClass={colors?.bar || 'bg-primary'} />
                  </td>
                  <td className={`${TDC} text-muted-foreground ${SEP}`}>{pct(f.pct_of_total_capacity)}</td>
                  <td className={`${TDC} text-muted-foreground ${SEP}`}>{pct(f.pct_of_total_production)}</td>
                </tr>
              );
            })}
            <tr className="border-t border-border/60 bg-muted/20 font-bold">
              <td className={TD}>Sub-Total</td>
              {hasOperator && <td className={TD} />}
              <td className={`${TDC} ${SEP}`}>{formatNumber(sum((f) => f.producing_wells), 0)}</td>
              <td className={`${TDC} ${SEP}`}>{formatNumber(capSum, 0)}</td>
              <td className={`${TDC} text-primary ${SEP}`}>{formatNumber(gasSum, 1)}</td>
              <td className={`${TDC} ${SEP}`}>{formatNumber(sum((f) => f.condensate_bbld), 1)}</td>
              <td className={`${TDC} ${SEP}`}>{utilization != null ? `${utilization.toFixed(0)}%` : '—'}</td>
              <td className={`${TDC} ${SEP}`}>{pct(subPctCap)}</td>
              <td className={`${TDC} ${SEP}`}>{pct(subPctProd)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * PDF Section II detail for one distributor: every power plant's demand vs
 * supply with shutdown status, then fertilizer / others / company total.
 */
export function DistributionCompanyDetail({
  company,
  distributorKey,
  label,
  onToggle,
}: {
  company: DistributionCompany;
  distributorKey?: string;
  label: string;
  onToggle?: () => void;
}) {
  const plants = company.power_plants || [];
  const fert = company.fertilizer;
  const colors = (distributorKey && DISTRIBUTOR_COLORS[distributorKey]) || null;
  const onlinePlants = plants.filter(
    (p) => typeof p.supply_mmcfd === 'number' && p.supply_mmcfd > 0,
  ).length;
  const coverage =
    typeof company.power_demand_mmcfd === 'number' &&
    typeof company.power_supply_mmcfd === 'number' &&
    company.power_demand_mmcfd > 0
      ? (company.power_supply_mmcfd / company.power_demand_mmcfd) * 100
      : null;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-muted/10 ${colors ? colors.shell : 'border-border/40'}`}
    >
      <DetailHeader label={label} colors={colors} onToggle={onToggle}>
        <StatChip label="Plants" value={String(plants.length)} />
        <StatChip label="Online" value={`${onlinePlants}/${plants.length}`} />
        <StatChip label="Power Demand" value={`${num(company.power_demand_mmcfd)} MMCFD`} />
        <StatChip label="Power Supply" value={`${num(company.power_supply_mmcfd)} MMCFD`} />
        {coverage != null && <StatChip label="Coverage" value={`${coverage.toFixed(0)}%`} />}
        <StatChip label="Total" value={`${num(company.total_mmcfd)} MMCFD`} />
      </DetailHeader>
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/20">
          <tr>
            <th rowSpan={2} className={`${TH} align-bottom border-b border-border/40`}>Power Plant</th>
            <th colSpan={2} className={`${GROUP_TH} ${SEP}`}>Gas (MMCFD)</th>
            <th rowSpan={2} className={`${TH} align-bottom border-b border-border/40 ${SEP}`}>Status</th>
          </tr>
          <tr className="border-b border-border/40">
            <th className={`${THC} ${SEP}`}>Demand</th>
            <th className={`${THC} ${SEP}`}>Supply</th>
          </tr>
        </thead>
        <tbody>
          {plants.map((p, idx) => {
            const shutdown = p.supply_mmcfd === 0;
            const met =
              typeof p.supply_mmcfd === 'number' &&
              typeof p.demand_mmcfd === 'number' &&
              p.demand_mmcfd > 0
                ? (p.supply_mmcfd / p.demand_mmcfd) * 100
                : null;
            return (
              <tr
                key={`${p.name}-${idx}`}
                className={`border-b border-border/20 last:border-b-0 ${idx % 2 ? 'bg-muted/10' : ''}`}
              >
                <td className={`${TD} font-semibold`}>{p.name}</td>
                <td className={`${TDC} ${SEP}`}>{num(p.demand_mmcfd)}</td>
                <td className={`${TDC} ${SEP} ${shutdown ? 'text-muted-foreground' : 'font-medium'}`}>
                  {num(p.supply_mmcfd)}
                </td>
                <td className={`${TD} ${SEP}`}>
                  {shutdown ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                      Shut down
                    </span>
                  ) : met != null ? (
                    <span className={met < 60 ? 'text-amber-500' : 'text-emerald-500'}>
                      {met.toFixed(0)}% met
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
          <tr className="border-t border-border/60 bg-muted/20 font-bold">
            <td className={TD}>Power Sub-Total</td>
            <td className={`${TDC} ${SEP}`}>{num(company.power_demand_mmcfd)}</td>
            <td className={`${TDC} ${SEP} text-primary`}>{num(company.power_supply_mmcfd)}</td>
            <td className={`${TD} ${SEP}`}>
              {company.power_demand_mmcfd > 0
                ? `${((company.power_supply_mmcfd / company.power_demand_mmcfd) * 100).toFixed(0)}% met`
                : '—'}
            </td>
          </tr>
          <tr className="border-b border-border/20">
            <td className={`${TD} font-semibold`}>
              Fertilizer{fert?.company ? ` (${fert.company})` : ''}
            </td>
            <td className={`${TDC} ${SEP}`}>{num(fert?.demand_mmcfd)}</td>
            <td className={`${TDC} ${SEP}`}>{num(fert?.supply_mmcfd)}</td>
            <td className={`${TD} ${SEP}`}>
              {typeof fert?.supply_mmcfd === 'number' &&
              typeof fert?.demand_mmcfd === 'number' &&
              fert.demand_mmcfd > 0 ? (
                fert.supply_mmcfd === 0 ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                    Shut down
                  </span>
                ) : (
                  <span className={(fert.supply_mmcfd / fert.demand_mmcfd) * 100 < 60 ? 'text-amber-500' : 'text-emerald-500'}>
                    {((fert.supply_mmcfd / fert.demand_mmcfd) * 100).toFixed(0)}% met
                  </span>
                )
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
          </tr>
          <tr className="border-b border-border/20">
            <td className={`${TD} font-semibold`}>Industrial / Others &amp; Supplementary</td>
            <td className={`${TDC} text-muted-foreground ${SEP}`}>—</td>
            <td className={`${TDC} ${SEP}`}>{num(company.others_supplementary_mmcfd)}</td>
            <td className={`${TD} ${SEP}`} />
          </tr>
          <tr className="border-t border-border/60 bg-muted/20 font-bold">
            <td className={TD}>Company Total</td>
            <td className={`${TDC} text-muted-foreground ${SEP}`}>—</td>
            <td className={`${TDC} ${SEP} text-primary`}>{num(company.total_mmcfd)}</td>
            <td className={`${TD} ${SEP}`} />
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}
