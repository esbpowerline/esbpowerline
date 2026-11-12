'use client';

/**
 * Annual Reports: BPDB's and Petrobangla's accounts by fiscal year. One plot
 * each; the tapped year's ledger is set out as rows, and the desktop's full
 * table sits behind the table pill.
 */

import { useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { bpdbAuditedFinancials, BPDB_FINANCIALS_COVERAGE_NOTE } from '@/lib/data/companies/bpdb';
import { petrobanglaAuditedFinancials, PETROBANGLA_SERIES_COVERAGE_NOTE } from '@/lib/data/macro/economics';
import { STATUS_COLORS } from '@/lib/data/grid/chart-palette';
import { Section } from './shared';
import { A, Foot, Key, KV, Plot, Readout, TablePill, useSel, useSeriesColor, type MacroWindow } from './macro-kit';

const cr = (v: number | null, dp = 2, none = '—') => (v == null ? none : `${formatNumber(v, dp)} Crore BDT`);
const short = (y: string) => y.replace(/^FY 20/, '').replace(/^FY /, '’');

function Bpdb({ win }: { win: MacroWindow }) {
  const sc = useSeriesColor();
  const data = win.cut(bpdbAuditedFinancials);
  const [i, setI] = useSel(data.length);
  const d = data[i];
  if (!d) return null;
  const cS = sc('domesticGas'), cG = sc('retailDiesel'), cE = sc('peakGeneration'), cB = sc('powerBudget');
  const tone = d.loss == null ? undefined : d.loss < 0 ? 'bad' as const : 'good' as const;
  return (
    <Section title="BPDB Annual Cost, Revenue & Subsidy Profile (Crore BDT)" desc="The gap between what BPDB sells power for and what it costs to supply, against the treasury transfer that covers it — FY 2016-17 to FY 2022-23, as BPDB printed it" meta="Audited Ledger">
      <Readout kicker={`BPDB ${d.year} Financials`} tone={tone} value={d.loss == null ? '—' : formatNumber(d.loss, 2)} unit="Crore BDT" sub="Operating balance after subsidy (D)" />
      <Plot ariaLabel="BPDB Annual Cost, Revenue and Subsidy Profile (Crore BDT), chart" labels={data.map((x) => short(x.year))} sel={i} onSel={setI}
        series={[
          { kind: 'bar', stack: 'a', values: data.map((x) => x.revenue), color: cS },
          { kind: 'bar', stack: 'a', values: data.map((x) => x.subsidy), color: cG },
          { kind: 'bar', values: data.map((x) => x.cost), color: cE },
          { kind: 'line', values: data.map((x) => x.loss), color: cB, width: 2.5 },
        ]} />
      <Key items={[{ label: 'Energy Sales', color: cS }, { label: 'Govt Subsidy', color: cG }, { label: 'Total Operating Expenses', color: cE }, { label: 'Operating balance after subsidy', color: cB, line: true }]} />
      <div className="gpm-kvs">
        <KV label="Energy Sales" prov="P" value={cr(d.revenue)} sw={cS} />
        <KV label="Government Subsidy" prov="P" value={cr(d.subsidy, 2, 'Not printed this year')} sw={cG} tone="good" />
        <KV label="Total Operating Expenses" prov="P" value={cr(d.cost)} sw={cE} tone="bad" />
        <KV label="Operating balance after subsidy" prov="D" tone={tone} value={cr(d.loss)} sw={cB}
          note="ESB PowerLine's arithmetic: (Energy Sales + Subsidy) − Total Operating Expenses. BPDB does not print it, and it is an operating balance — no interest, no other income. Blank where BPDB printed no subsidy." />
      </div>
      <div className="gpm-pills">
        <TablePill title="BPDB by fiscal year" sub="Crore BDT. Operating balance after subsidy is derived (D); the rest is as printed (P)."
          head={['Fiscal Year', 'Energy Sales', 'Total Operating Expenses', 'Govt Subsidy Received', 'Operating balance after subsidy']}
          rows={data.map((x) => [x.year, x.revenue == null ? '—' : formatNumber(x.revenue, 2), formatNumber(x.cost, 2), x.subsidy == null ? '—' : formatNumber(x.subsidy, 2), x.loss == null ? '—' : formatNumber(x.loss, 2)])} />
      </div>
      <Foot>
        <span>Source: <code>{d.sourceFile}</code>, Comparative Statement of Budget and Achievement — <A href="https://www.bpdb.gov.bd/site/page/annual-report">BPDB annual reports</A></span>
        <span>Source: <A href="https://www.bpdb.gov.bd/">BPDB Annual Financial Reports</A>. As published. Not independently audited.</span>
        <span className="gp-note">Reporting Period: FY 2016-17 – FY 2022-23. {BPDB_FINANCIALS_COVERAGE_NOTE}</span>
      </Foot>
    </Section>
  );
}

function Petrobangla({ win }: { win: MacroWindow }) {
  const sc = useSeriesColor();
  const data = win.cut(petrobanglaAuditedFinancials);
  const [i, setI] = useSel(data.length);
  const d = data[i];
  if (!d) return null;
  const cS = sc('domesticGas'), cL = sc('powerBudget'), cN = STATUS_COLORS.warning;
  return (
    <>
      <div className="gpm-notice">
        <b>These Petrobangla figures are hand-typed and name no document.</b>
        Revenue less LNG cost does not equal the stated net profit in any year shown, and the series runs to FY 26 — years Petrobangla has not published. Read it as unverified until its annual reports are attached, as BPDB&apos;s now are.
      </div>
      <Section title="Petrobangla Annual Revenue & LNG Import Costs" desc="Gas sales against the LNG import bill (Crore BDT) — FY 2016-17 and FY 2017-18 only, unverified" meta="Audited Ledger">
        <Readout kicker={`Petrobangla ${d.year} Financials`} tone={d.netProfit >= 0 ? 'good' : 'bad'} value={formatNumber(d.netProfit)} unit="Crore BDT" sub={d.netProfit >= 0 ? 'Net Profit' : 'Net Loss'} />
        <Plot ariaLabel="Petrobangla Annual Revenue and LNG Import Costs, chart" labels={data.map((x) => x.year)} sel={i} onSel={setI}
          series={[{ kind: 'bar', values: data.map((x) => x.revenue), color: cS }, { kind: 'bar', values: data.map((x) => x.lngCost), color: cL }, { kind: 'line', values: data.map((x) => x.netProfit), color: cN, width: 2.5 }]} />
        <Key items={[{ label: 'Gas Sales Revenue', color: cS }, { label: 'LNG Import Cost', color: cL }, { label: 'Net Income / Loss', color: cN, line: true }]} />
        <div className="gpm-kvs">
          <KV label="Gas Sales Revenue" prov="P" value={cr(d.revenue, 0)} sw={cS} />
          <KV label="LNG Import Payments" prov="P" value={cr(d.lngCost, 0)} sw={cL} />
          <KV label={d.netProfit >= 0 ? 'Net Profit' : 'Net Loss'} prov="P" value={cr(d.netProfit, 0)} sw={cN} tone={d.netProfit >= 0 ? 'good' : 'bad'} sub="Formula: Net Income/Loss = Operating Revenue - Operational & LNG Import Costs" />
        </div>
        <div className="gpm-pills">
          <TablePill title="Petrobangla by fiscal year" sub="Crore BDT, as published (P)" head={['Fiscal Year', 'Gas Sales Revenue', 'LNG Import Costs', 'Net Profit / Loss', 'Action']}
            rows={data.map((x) => [x.year, formatNumber(x.revenue), formatNumber(x.lngCost), formatNumber(x.netProfit), x.year === 'FY 18' ? <a key="a" href="/annual-reports/financials" target="_blank">View Full Report</a> : 'N/A'])} />
          <a className="gpm-info" href="/annual-reports/financials" target="_blank"><span aria-hidden>↗</span>View Full Report (FY 18)</a>
        </div>
        <Foot>
          <span>Source: <A href="https://www.petrobangla.org.bd/">Petrobangla Audited Financial Accounts</A> (Petrobangla Audited Balance Sheets). As published. Not independently audited.</span>
          <span className="gp-note">Reporting Period: FY 2016-17 – FY 2017-18. {PETROBANGLA_SERIES_COVERAGE_NOTE}</span>
        </Foot>
      </Section>
    </>
  );
}

export function MacroReports({ win }: { win: MacroWindow }) {
  const [company, setCompany] = useState<'bpdb' | 'petrobangla'>('bpdb');
  return (
    <>
      <div className="gp-seg" role="tablist" aria-label="Audited Financial History">
        {([['bpdb', 'BPDB Power', 'BPDB Power Audited Statements'], ['petrobangla', 'Petrobangla Gas', 'Petrobangla Gas Audited Statements']] as const).map(([id, l, full]) => (
          <button key={id} role="tab" aria-selected={company === id} aria-label={full} className={company === id ? 'is-on' : ''} onClick={() => setCompany(id)}>{l}</button>
        ))}
      </div>
      {company === 'bpdb' ? <Bpdb win={win} /> : <Petrobangla win={win} />}
    </>
  );
}
