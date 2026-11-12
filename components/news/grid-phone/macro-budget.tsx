'use client';

/**
 * National Budget & Infra. The desktop's bar-plus-two-lines chart on two axes
 * becomes two short plots under one tapped fiscal year: the allocation (crore
 * Tk) and the megawatts it bought. The tariff chart is the Overview's with
 * this tab's wording; the longitudinal study below is drawn natively.
 */

import { useMemo } from 'react';
import { formatNumber, formatUnitRate } from '@/lib/utils';
import { nationalBudgetData } from '@/lib/data/macro/budget';
import { macroInfrastructureData } from '@/lib/data/macro/infrastructure';
import { LATEST_BPDB_AUDIT, BERC_BULK_RANGE } from '@/lib/data/macro/tariff';
import { usePhone } from './context';
import { Prov, Row, Section, useSheet } from './shared';
import { A, Cap, Foot, InfoPill, Key, KV, Plot, Readout, TablePill, useSel, useSeriesColor, type MacroWindow } from './macro-kit';
import { TariffCard } from './macro-overview';
import { MacroLongitudinal } from './macro-longitudinal';

const H = 116;
type Merged = (typeof nationalBudgetData)[number] & Partial<(typeof macroInfrastructureData)[number]>;
const mw = (v: number | undefined) => (v == null ? '—' : `${v} MW`);

function BudgetCard({ win }: { win: MacroWindow }) {
  const sc = useSeriesColor();
  // Budget rows joined to the infrastructure row of the same fiscal year (MacroTrendsTab.tsx:167).
  const merged = useMemo<Merged[]>(() => {
    const infra = Object.fromEntries(macroInfrastructureData.map((r) => [r.fiscal_year, r]));
    return nationalBudgetData.map((b) => ({ ...b, ...(infra[b.fiscal_year] ?? {}) }));
  }, []);
  const data = win.isTruncated ? merged.slice(-(win.allowedYears === 5 ? 6 : 5)) : merged;
  const [i, setI] = useSel(data.length);
  const d = data[i];
  if (!d) return null;
  const labels = data.map((x) => `’${x.fiscal_year.slice(5)}`);
  const cB = sc('powerBudget'), cC = sc('installedCapacity'), cP = sc('peakGeneration');
  return (
    <Section title="National Budget vs Capacity & Peak Generation" desc="Power sector fiscal allocation (Crore BDT) plotted against installed capacity and peak generation (MW) — Tracked since 2011" meta="FY 2011 - 2027">
      <Readout kicker={`${d.fiscal_year} Financials`} value={`${d.percentage}%`} unit="of Budget" sub={<>Power &amp; energy share of the national budget<Prov kind="P" /></>} />
      <Cap color={cB} label="Power Budget (Cr Tk)" prov="P" value={`${d.power_energy_allocation_crore_tk} Cr Tk`} />
      <Plot ariaLabel="Power budget by fiscal year, chart" height={H} labels={labels} sel={i} onSel={setI} series={[{ kind: 'bar', values: data.map((x) => x.power_energy_allocation_crore_tk), color: cB }]} />
      <div className="gpm-cap"><Key items={[{ label: 'Installed Cap. (MW)', color: cC, line: true }, { label: 'Peak Gen. (MW)', color: cP, line: true }]} /></div>
      <Plot ariaLabel="Installed capacity and peak generation by fiscal year, chart" height={H} labels={labels} sel={i} onSel={setI}
        series={[{ kind: 'line', values: data.map((x) => x.installed_capacity_mw ?? null), color: cC, width: 2.5 }, { kind: 'line', values: data.map((x) => x.peak_generation_mw ?? null), color: cP, width: 2.5 }]} />
      <p className="gpm-sub">Fiscal Allocation</p>
      <div className="gpm-kvs">
        <KV label="Power & Energy Budget" prov="P" value={`${d.power_energy_allocation_crore_tk} Cr Tk`} sw={cB} />
        <KV label="Total National Budget" prov="P" value={`${d.total_budget_crore_tk} Cr Tk`} />
      </div>
      <p className="gpm-sub">Grid Infrastructure</p>
      <div className="gpm-kvs">
        <KV label="Installed Capacity" prov="P" value={mw(d.installed_capacity_mw)} sw={cC} />
        <KV label="Peak Generation" value={mw(d.peak_generation_mw)} sw={cP} />
      </div>
      <div className="gpm-pills">
        <InfoPill label="What is being shown?" sub="National Budget vs Capacity & Peak Generation">
          <ul>
            <li><strong>Power Sector Budget (Crore BDT):</strong> The total fiscal allocation dedicated specifically to the Ministry of Power, Energy and Mineral Resources each fiscal year.</li>
            <li><strong>Installed Capacity</strong> vs <strong>Peak Generation (MW)</strong>: The physical manifestation of those budgets—showing how much total capacity was built versus how much was actually utilized during peak hours.</li>
          </ul>
          <p><strong>Analytical Insight:</strong> While fiscal allocation to the power sector has historically risen, the proposed FY2026-27 budget allocation dropped sharply to 17,345 Crore BDT (~1.85% of total national budget). This contraction signals a major policy pivot: the government is shifting focus away from massive capacity expansions to reviewing existing power purchase agreements (PPAs), reducing subsidies, and eliminating high capacity payments for underutilized plants.</p>
        </InfoPill>
        <TablePill title="National Budget vs Capacity and Peak Generation" head={['Fiscal year', { label: 'Power Budget', unit: 'Cr Tk' }, { label: 'Share', unit: '% of budget' }, { label: 'Installed Cap.', unit: 'MW' }, { label: 'Peak Gen.', unit: 'MW' }]}
          rows={data.map((x) => [x.fiscal_year, x.power_energy_allocation_crore_tk, x.percentage, x.installed_capacity_mw ?? '—', x.peak_generation_mw ?? '—'])} />
      </div>
      <Foot>
        <span>Source: <A href="https://www.mof.gov.bd/">Ministry of Finance</A> &amp; <A href="https://www.bpdb.gov.bd/">BPDB Annual Reports</A></span>
        <span className="gp-note">Every figure here is published — budget allocations and their share of the national budget by the Ministry of Finance, capacity and peak generation by BPDB. Nothing on this chart is computed by us; the two series are simply drawn on one pair of axes so the fiscal and physical build-out can be read together. Not independently audited.</span>
        <span>Data compiled from FY 2010-11 to FY 2026-27</span>
      </Foot>
    </Section>
  );
}

/** The three figures over the tariff chart; a tap opens what the desktop shows on hover. */
function TariffStrip() {
  const { day } = usePhone();
  const open = useSheet();
  const L = LATEST_BPDB_AUDIT;
  const daily = day.systemStats?.avgProductionCost;
  const stats = [
    { label: 'Bulk since 4 Jun 2026', value: BERC_BULK_RANGE, title: 'BERC Order 2026/01', desc: 'Since 4 June 2026 BERC fixes the bulk rate per distributor and per voltage (Reconsideration Order 2026/01, Appendix-ka), so there is no single national figure. Shown: the lowest to the highest rate in the order.', hl: 'Per utility & voltage', hv: `${BERC_BULK_RANGE} Tk/kWh` },
    { label: `Audited, FY ${L.fy}`, value: L.cost?.toFixed(2) ?? '—', title: 'BPDB Annual Report', desc: `BPDB's printed bulk supply cost per unit — generation plus power bought, per unit sold in bulk — for FY ${L.fy}, the latest year it has published. Beside it, the average bulk tariff BPDB printed for the same year.`, hl: 'Average bulk tariff', hv: `${L.tariff?.toFixed(2) ?? '—'} Tk/kWh` },
    { label: 'Daily Fuel Cost', value: daily == null ? '—' : formatUnitRate(daily), title: 'PGCB, latest day', desc: "PGCB's fuel cost per unit for the day shown — fuel only, with no capacity payments or purchased power, so it is not comparable with the audited cost or with a bulk tariff.", hl: 'Measure', hv: 'Fuel only, daily' },
  ];
  return (
    <div className="gp-rows" style={{ marginBottom: 12, borderBottom: '1px solid var(--gp-line)' }}>
      {stats.map((s) => (
        <Row key={s.label} name={s.label} sub="As published" value={s.value} small="Tk/kWh" chevron
          onClick={() => open(<><h3>{s.title}</h3><p className="gp-sheet__sub">{s.label}: {s.value} Tk/kWh</p><div className="gpm-prose"><p>{s.desc}</p><div className="gpm-hl"><span>{s.hl}</span><b>{s.hv}</b></div></div></>)} />
      ))}
    </div>
  );
}

export function MacroBudget({ win }: { win: MacroWindow }) {
  const L = LATEST_BPDB_AUDIT;
  return (
    <>
      <BudgetCard win={win} />
      <TariffCard win={win} title="Historical Pricing & Tariff Comparison" desc={<>BPDB&apos;s audited cost of supply per unit against its average bulk tariff — BPDB annual reports. Tap a figure for its source.</>}
        tariff="Avg Bulk Tariff (Tk/kWh)" cost="BPDB Supply Cost (Tk/kWh)" deficit="BPDB Unit Deficit / Subsidy Reqd" tableTitle="Historical Pricing and Tariff Comparison"
        deficitNote="Bulk Supply Cost (BPDB audit) minus Average Bulk Tariff (BPDB audit), only where BPDB printed both."
        lead={<TariffStrip />}
        explain={<>
          <ul>
            <li><strong>BPDB Supply Cost:</strong> BPDB&apos;s printed cost per unit sold in bulk — its own generation plus power bought from IPPs, rentals and imports, including <strong>capacity charges</strong> — from each year&apos;s annual report.</li>
            <li><strong>Average Bulk Tariff:</strong> what BPDB earned per unit sold to the distributors. BPDB prints it for FY 2022-23 only; other years are left blank rather than derived.</li>
          </ul>
          <p><strong>Analytical Insight:</strong> In FY {L.fy} BPDB&apos;s supply cost was {L.cost?.toFixed(2) ?? '—'} Tk/kWh against an average bulk tariff of {L.tariff?.toFixed(2) ?? '—'}, and its accounts record a government subsidy of Tk {L.subsidyCrore == null ? '—' : formatNumber(L.subsidyCrore, 2)} crore for that year. Later years are not yet published by BPDB.</p>
        </>}
        foot={<>
          <span>Source: <A href="https://www.berc.org.bd/">BERC Tariff Orders</A> &amp; <A href="https://www.bpdb.gov.bd/">BPDB Annual Reports</A></span>
          <span>As published. Not independently audited.</span>
          <span>Reporting Period: FY 2016-17 – FY 2022-23 (BPDB annual reports)</span>
        </>} />
      <MacroLongitudinal isTruncated={win.isTruncated} allowedYears={win.allowedYears} />
    </>
  );
}
