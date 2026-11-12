'use client';

/**
 * Analyst & Investor Insights. Four briefing cards whose figures the desktop
 * holds as literals in MacroTrendsTab.tsx (the `insights` sub-tab); they are
 * copied here unchanged, with the same P / D marks. If the desktop's wording
 * or a figure changes, change it here too until the cards share one module.
 */

import type { ReactNode } from 'react';
import { Prov, Section } from './shared';
import { A, Foot, KV } from './macro-kit';

type Tone = 'bad' | 'warn' | undefined;
const CARDS: { title: string; desc: string; rows: [string, 'P' | 'D', string, Tone][]; insight: ReactNode; source: ReactNode; audit: string }[] = [
  {
    title: 'Listed IPPs Receivables & Working Capital Risk',
    desc: 'Analysis for Summit Power, Baraka, United Power equity holders',
    rows: [
      ['BPDB Arrears Payment Aging', 'D', '150 - 180 Days', 'bad'],
      ['Est. System Outstanding Arrears', 'D', '~26,500 Crore BDT', undefined],
      ['Working Capital Interest Rate', 'D', '12.5% - 14.5% (Weighted Average)', undefined],
    ],
    insight: <>Due to BPDB&apos;s treasury deficit, payment aging to private Independent Power Producers (IPPs) has inflated from 60 days to over 150 days. Listed IPPs carry heavy receivables on their balance sheets, forcing reliance on high-interest working capital loans (up to 14.5% in 2026), which compresses net profit margins and dilutes dividend payout capacity.</>,
    source: <A href="https://www.bpdb.gov.bd/">BPDB Finance Reports</A>,
    audit: 'As published. Not independently audited.',
  },
  {
    title: 'Forex Exposure & Currency Devaluation Burden',
    desc: 'Macro-economic impact on national fuel imports',
    rows: [
      ['6-Year Devaluation Trend (BDT/USD)', 'D', '+43.70% (84.90 to 122.00)', 'bad'],
      ['Dollar-Denominated Gas Reliance', 'D', '~73.2% of supply (IOCs + LNG)', undefined],
      ['Est. Daily Currency Surcharge', 'D', '1.8 Crore BDT / Tk-devaluation', undefined],
    ],
    insight: <>With over 73.2% of national gas supply linked to USD pricing (comprising Chevron IOC fields at ~35.1% and RPGCL LNG terminals at ~38.1%), devaluations increase BDT wholesale costs. Each 1 BDT depreciation against the USD inflates daily imported fuel overheads by ~1.8 Crore BDT, driving the structural deficit at BPDB and Petrobangla.</>,
    source: <A href="https://www.bb.org.bd/">Bangladesh Bank Exchange Stats</A>,
    audit: 'Rates as published by Bangladesh Bank. Not independently verified.',
  },
  {
    title: 'Industrial Gas Shortage & Corporate Earnings Clues',
    desc: 'Earnings impact on listed steel, cement, and textile mills',
    rows: [
      ['National Gas Deficit', 'D', '30.33% (~1,150 MMCFD short)', 'bad'],
      ['Industrial Zone Plant Utilization', 'D', '55% - 70% (Pressure drop below 2 psi)', undefined],
      ['Operating Margin Impact (bps)', 'D', '-300 to -450 bps', 'bad'],
    ],
    insight: <>Listed manufacturing giants (e.g. BSRM, GPH Ispat, LafargeHolcim) face pressure drops in industrial grids. Running factories at only 55-70% utilization forces the purchase of expensive alternative fuels (LPG and Diesel), compressing operating margins by up to 450 bps and directly impacting listed industrial earnings.</>,
    source: <A href="https://www.petrobangla.org.bd/">Petrobangla Bulletins</A>,
    audit: 'As published. Not independently audited.',
  },
  {
    title: 'Grid Capacity Margin & Overcapacity Charges',
    desc: 'The operational driver of the national power subsidy',
    rows: [
      ['Installed National Grid Capacity', 'P', '28,420 MW', undefined],
      ['Peak Daily Grid Load (Evening)', 'P', '16,154.41 MW', undefined],
      ['Surplus Unutilized Capacity', 'D', '43.16% (12,266 MW idle)', 'warn'],
    ],
    insight: <>Bangladesh operates with a surplus capacity of 43.16%. While providing base-load security, it triggers contractually binding &quot;capacity charges&quot; paid to idle private power plants. These structural capacity charges cost the state an estimated 1.88 Crore BDT daily, driving BPDB&apos;s 39,000 Crore BDT operating subsidy requirement.</>,
    source: <A href="https://www.bpdb.gov.bd/">BPDB Annual Financials</A>,
    audit: 'As published. Not independently audited.',
  },
];

/** A long value ("55% - 70% (Pressure drop below 2 psi)") keeps its figure bold and sets the bracket under it. */
function split(v: string): [string, string | null] {
  const k = v.indexOf(' (');
  return k > 0 ? [v.slice(0, k), v.slice(k + 2, -1)] : [v, null];
}

export function MacroInsights() {
  return (
    <>
      <div className="gpm-notice gpm-notice--plain">
        <b>Analyst &amp; Investor Advisory</b>
        This advisory panel integrates audited financial statements, central bank weighted exchange rate data, and Petrobangla production filings to isolate critical financial clues, cash-flow risks, and industrial utilization metrics for energy sector analysts and public equity investors.
      </div>
      <div className="gpm-notice">
        <b>Read the D tags on this tab more cautiously than elsewhere.</b>
        On the other Macro tabs D means a plain calculation from a published figure. Several numbers here are <em>estimates</em> — ranges and approximations drawn from sector reporting rather than computed from a single stated source. They carry D because they are ours, not because the arithmetic can be retraced. Anything marked <Prov kind="P" /> is a published figure as usual.
      </div>
      {CARDS.map((c) => (
        <Section key={c.title} title={c.title} desc={c.desc}>
          <div className="gpm-kvs gpm-kvs--flush gpm-kvs--r">
            {c.rows.map(([label, prov, value, tone]) => {
              const [main, extra] = split(value);
              return <KV key={label} label={label} prov={prov} value={main} tone={tone} sub={extra} />;
            })}
          </div>
          <p className="gpm-insight"><strong>Analytical Insight:</strong> {c.insight}</p>
          <Foot>
            <span>Source: {c.source}</span>
            <span>{c.audit}</span>
            <span>Reporting Date: Jun 2026</span>
          </Foot>
        </Section>
      ))}
    </>
  );
}
