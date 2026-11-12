'use client';

/** Macro Overview: tariff against supply cost, the gas mix by year, three audit facts. */

import type { ReactNode } from 'react';
import { formatNumber } from '@/lib/utils';
import { macroTariffData, LATEST_BPDB_AUDIT } from '@/lib/data/macro/tariff';
import { macroGasData } from '@/lib/data/macro/gas';
import { Prov, Section } from './shared';
import { A, Foot, InfoPill, Key, KV, Plot, Readout, TablePill, useSel, useSeriesColor, type MacroWindow } from './macro-kit';

const tk = (v: number | null, none = '—') => (v == null ? none : `${v.toFixed(2)} Tk/kWh`);

/**
 * BPDB's bulk tariff (bars) against its supply cost (line). Drawn twice on
 * desktop, on Overview and on Budget, under different titles and wording, so
 * the words arrive as props and the figures have one home.
 */
export function TariffCard({ win, title, desc, meta, tariff, cost, deficit, deficitNote, lead, explain, foot, tableTitle }: {
  win: MacroWindow;
  title: string;
  desc: ReactNode;
  meta?: string;
  tariff: string;
  cost: string;
  deficit: string;
  deficitNote?: string;
  lead?: ReactNode;
  explain: ReactNode;
  foot: ReactNode;
  tableTitle: string;
}) {
  const data = win.cut(macroTariffData);
  const [i, setI] = useSel(data.length);
  const d = data[i];
  if (!d) return null;
  const gap = d.cost == null || d.tariff == null ? null : (d.cost - d.tariff).toFixed(2);
  return (
    <Section title={title} desc={desc} meta={meta}>
      {lead}
      <Readout kicker={`${d.year} · ${cost}`} value={d.cost == null ? '—' : d.cost.toFixed(2)} unit="Tk/kWh" sub={gap == null ? <>Tariff not printed for this year, so no gap is shown</> : <>Costs <b>{gap} Tk</b> more per unit than it earns</>} />
      <Plot ariaLabel={`${title}, chart`} labels={data.map((x) => x.year.replace(/^FY 20/, ''))} sel={i} onSel={setI} tick={(v) => `${v}`}
        series={[{ kind: 'bar', values: data.map((x) => x.tariff), color: 'var(--gp-primary)' }, { kind: 'line', values: data.map((x) => x.cost), color: 'var(--gp-bad)', width: 2.5 }]} />
      <Key items={[{ label: tariff, color: 'var(--gp-primary)' }, { label: cost, color: 'var(--gp-bad)', line: true }]} />
      <div className="gpm-kvs">
        <KV label={tariff} prov="P" value={tk(d.tariff, 'not printed')} sw="var(--gp-primary)" />
        <KV label={cost} prov="P" value={tk(d.cost)} sw="var(--gp-bad)" />
        <KV label={deficit} prov="D" note={deficitNote} value={gap == null ? '—' : `${gap} Tk/kWh`} tone="bad" />
      </div>
      <div className="gpm-pills">
        <InfoPill label="What is being shown?" sub={title}>{explain}</InfoPill>
        <TablePill title={tableTitle} sub="Tk/kWh, as BPDB printed them" head={['Year', tariff, cost]} rows={data.map((x) => [x.year, x.tariff == null ? '—' : x.tariff.toFixed(2), x.cost == null ? '—' : x.cost.toFixed(2)])} />
      </div>
      <Foot>{foot}</Foot>
    </Section>
  );
}

function GasMix({ win }: { win: MacroWindow }) {
  const sc = useSeriesColor();
  const data = win.cut(macroGasData);
  const [i, setI] = useSel(data.length);
  const d = data[i];
  if (!d) return null;
  // The desktop tooltip's arithmetic, unchanged (MacroTrendsTab.tsx:998-1000).
  const total = d.domestic + d.lng;
  const domesticPct = total > 0 ? ((d.domestic / total) * 100).toFixed(1) : '0';
  const lngPct = total > 0 ? ((d.lng / total) * 100).toFixed(1) : '0';
  const dom = sc('domesticGas');
  const lng = sc('powerBudget');
  return (
    <Section title="Gas Supply Transition: Domestic vs. Imported LNG" desc={<>Yearly mean of Petrobangla’s daily reports (MMCFD) — 2020 onwards, current year to date</>} meta="LNG Reliance">
      <Readout kicker={`Gas Supply ${d.year} · LNG reliance`} value={`${lngPct}%`} unit={<>imported LNG<Prov kind="D" note="Calculation: LNG Reliance % = (LNG / Total Supply) * 100" /></>} sub={<>Domestic fields <b>{domesticPct}%</b> of {formatNumber(total)} MMCFD</>} />
      <Plot ariaLabel="Gas Supply Transition: Domestic vs. Imported LNG, chart" labels={data.map((x) => x.year)} sel={i} onSel={setI}
        series={[{ kind: 'bar', stack: 'g', values: data.map((x) => x.domestic), color: dom }, { kind: 'bar', stack: 'g', values: data.map((x) => x.lng), color: lng }]} />
      <div className="gpm-kvs">
        <KV label="Domestic Fields" prov="P" value={`${d.domestic} MMCFD`} sub={<>{domesticPct}% of supply (D)</>} sw={dom} />
        <KV label="Imported LNG (R-LNG)" prov="P" value={`${d.lng} MMCFD`} sub={<>{lngPct}% of supply (D)</>} sw={lng} />
        <KV label="Total Grid Supply" prov="D" note="Domestic fields plus imported LNG, added." value={`${total} MMCFD`} tone="primary" />
      </div>
      <div className="gpm-pills">
        <InfoPill label="What is being shown?" sub="Gas Supply Transition: Domestic vs. Imported LNG">
          <p>This chart shows the volume (MMCFD) of natural gas supplied from local fields versus imported Liquefied Natural Gas (LNG). Each year is the mean of the daily figures Petrobangla published that year, from 12 January 2020, when this archive begins; the current year runs to the newest report held.</p>
          <p><strong>Analytical Insight:</strong> The visual depicts a major structural dependency shift: domestic gas production is stagnant or declining, while imported LNG share is rising to meet energy demand. Because imported LNG is purchased at volatile global spot prices (linked to Brent oil and Platts JKM), this shift directly exposes Bangladesh&apos;s power generation costs to global commodity shocks and foreign exchange reserves pressure.</p>
        </InfoPill>
        <TablePill title="Gas supply by year" sub="Mean MMCFD over the days Petrobangla filed" head={['Year', 'Domestic Gas (MMCFD)', 'Imported LNG (MMCFD)']} rows={data.map((x) => [x.year, x.domestic, x.lng])} />
      </div>
      <Foot>
        <span>Source: <A href="https://www.petrobangla.org.bd/">Petrobangla daily gas reports</A></span>
        <span>Domestic and LNG volumes are Petrobangla&apos;s, stated daily. Each year is their mean over the days it filed — a rate, not a total — and the shares are ours, divided from those volumes. Not independently audited.</span>
        <span>Reporting Period: daily reports, 12 Jan 2020 onwards (current year to date)</span>
      </Foot>
    </Section>
  );
}

export function MacroOverview({ win }: { win: MacroWindow }) {
  const L = LATEST_BPDB_AUDIT;
  return (
    <>
      <TariffCard win={win} title="Wholesale Tariff vs. Unit Production Cost" desc={<>BPDB&apos;s audited supply cost against its bulk tariff (Tk/kWh) — BPDB annual reports</>} meta="Bulk Tariff Gap"
        tariff="Average Bulk Tariff" cost="Bulk Supply Cost" deficit="Unit Deficit" tableTitle="Tariff and supply cost by year"
        deficitNote="Calculation: Unit Deficit = Bulk Supply Cost − Average Bulk Tariff, only where BPDB printed both. Source: BPDB Annual Audits & BERC Notifications. As published. Not independently audited."
        explain={<>
          <ul>
            <li><strong>Average Bulk Tariff:</strong> what BPDB earned per unit sold to the distributors, as BPDB printed it (FY 2022-23 only).</li>
            <li><strong>Bulk Supply Cost:</strong> BPDB&apos;s printed cost per unit sold in bulk, including power bought and capacity charges.</li>
          </ul>
          <p><strong>Analytical Insight:</strong> The widening gap between bulk tariff and actual production cost has resulted in massive structural deficits for BPDB. This trend is highly unsustainable and highlights the critical need to either rationalize power purchase costs (by phasing out liquid fuel plants) or adjust wholesale tariffs to reduce the fiscal subsidy burden on the government.</p>
        </>}
        foot={<>
          <span>Source: <A href="https://www.bpdb.gov.bd/">BPDB Annual Accounts &amp; Audit Reports</A></span>
          <span>Both the tariff and the unit cost are BPDB&apos;s own published figures. The deficit between them is ours — a subtraction, shown so the gap can be read directly rather than eyeballed off the two lines. Not independently audited.</span>
          <span>Reporting Period: FY 2016-17 – FY 2022-23</span>
        </>} />

      <GasMix win={win} />

      <Section title="From the audits" desc="Reserves, capacity charges and the state subsidy">
        <div className="gpm-fact">
          <div className="gpm-fact__l">Petrobangla Natural Gas Reserves<Prov kind="P" /></div>
          <div className="gpm-fact__v">7.63 Tcf<small>Remaining</small></div>
          <p className="gp-note">Of the original 29.74 Tcf recoverable gas reserves, 22.11 Tcf has already been extracted. This is the audited balance at 1 January 2026. The Gas Reserve Depletion panel carries it forward day by day from the daily reports, so it shows a lower figure for today — the same reserve, counted to a later date.</p>
        </div>
        <div className="gpm-fact">
          <div className="gpm-fact__l">Capacity Charge Drag<Prov kind="P" /></div>
          <div className="gpm-fact__v is-bad">~40%<small>of Wholesale Costs</small></div>
          <p className="gp-note">Audited financial statements indicate that over 40% of BPDB&apos;s average bulk purchase rate goes directly toward paying capacity charges to idle or underutilized private IPPs.</p>
        </div>
        <div className="gpm-fact">
          <div className="gpm-fact__l">State Subsidy, FY {L.fy}<Prov kind="P" /></div>
          <div className="gpm-fact__v">{L.subsidyCrore == null ? '—' : <>{formatNumber(L.subsidyCrore, 2)}<small>Crore BDT</small></>}</div>
          <p className="gp-note">The government subsidy BPDB&apos;s own accounts record for the year, covering the gap between its supply cost ({L.cost?.toFixed(2) ?? '—'} Tk/kWh) and its average bulk tariff ({L.tariff?.toFixed(2) ?? '—'}).</p>
        </div>
        <Foot>
          <span>Source: <A href="https://www.petrobangla.org.bd/">Petrobangla Hydrocarbon Unit</A> &amp; <A href="https://www.bpdb.gov.bd/">BPDB Annual Financials</A></span>
          <span>Reserve and capacity-charge figures are as the audits state them. The subsidy is BPDB&apos;s own figure from its FY {L.fy} annual report (it replaced an estimate of ours built on a superseded 8.39 bulk tariff on 2026-09-30). Note that this cost is BPDB&apos;s <em>bulk purchase</em> rate across the year, not the daily production cost shown on the Overview tab — the two measure different things and should not be compared directly. Not independently audited.</span>
          <span>Reporting Period: Macro Analysis (2026 Audit Reports)</span>
        </Foot>
      </Section>
    </>
  );
}
