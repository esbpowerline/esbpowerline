'use client';

/**
 * Annual Reports: BPDB's and Petrobangla's accounts by fiscal year. One plot
 * each; the tapped year's ledger is set out as rows, and the desktop's full
 * table sits behind the table pill.
 */

import { useState } from 'react';
import { PETROBANGLA_STATEMENTS, PETROBANGLA_BALANCE_SHEET, PETROBANGLA_FINANCIALS_PROVENANCE } from '@/lib/data/companies/petrobangla-financials';
import { formatNumber } from '@/lib/utils';
import { bpdbAuditedFinancials, BPDB_FINANCIALS_COVERAGE_NOTE } from '@/lib/data/companies/bpdb';
import { petrobanglaAuditedFinancials, PETROBANGLA_SERIES_COVERAGE_NOTE } from '@/lib/data/macro/economics';
import { STATUS_COLORS } from '@/lib/data/grid/chart-palette';
import { Prov, Section, useSheet } from './shared';
import { A, DataTable, Foot, Key, KV, Plot, Readout, TablePill, useSel, useSeriesColor, type MacroWindow } from './macro-kit';

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
      <Readout kicker={`BPDB ${d.year} Financials`} tone={tone} value={d.loss == null ? '—' : formatNumber(d.loss, 2)} unit="Crore BDT" sub={<>Operating balance after subsidy<Prov kind="D" /></>} />
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
        <TablePill title="BPDB by fiscal year" sub={<>Operating balance after subsidy is derived<Prov kind="D" />; the rest is as printed<Prov kind="P" />.</>}
          head={['Fiscal Year', { label: 'Energy Sales', unit: 'Crore BDT' }, { label: 'Total Operating Expenses', unit: 'Crore BDT' }, { label: 'Govt Subsidy Received', unit: 'Crore BDT' }, { label: 'Balance after subsidy', unit: 'Crore BDT' }]}
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

/**
 * The desktop's "View Full Report" opened /annual-reports/financials in a new
 * tab. Its Petrobangla figures are a module we hold, so the phone sets them out
 * in the sheet; the page itself is one same-tab link below, never a new tab.
 */
function FullReport() {
  return (
    <>
      <h3>Petrobangla statements, FY 2016-17 and FY 2017-18</h3>
      <p className="gp-sheet__sub">As held on the Annual Reports page<Prov kind="P" note={PETROBANGLA_FINANCIALS_PROVENANCE} /></p>
      <div className="gpm-notice gpm-notice--in" style={{ marginTop: 12 }}><b>Unverified</b>{PETROBANGLA_FINANCIALS_PROVENANCE}</div>
      <p className="gpm-sub">Income statement</p>
      <DataTable head={['Line', ...PETROBANGLA_STATEMENTS.map((y) => ({ label: y.fy, unit: 'Crore BDT' }))]}
        rows={[
          ['Revenue', ...PETROBANGLA_STATEMENTS.map((y) => formatNumber(y.revenueCrore))],
          ['Cost of sales', ...PETROBANGLA_STATEMENTS.map((y) => formatNumber(y.costOfSalesCrore))],
          ['Operating result', ...PETROBANGLA_STATEMENTS.map((y) => formatNumber(y.operatingResultCrore))],
          ['GDES fund receipts', ...PETROBANGLA_STATEMENTS.map((y) => formatNumber(y.gdesFundCrore))],
        ]} />
      <p className="gpm-sub">Balance sheet</p>
      <DataTable head={['Line', ...PETROBANGLA_STATEMENTS.map((y) => ({ label: y.fy, unit: 'Crore BDT' }))]}
        rows={PETROBANGLA_BALANCE_SHEET.map((r) => [r.label, ...PETROBANGLA_STATEMENTS.map((y) => (r.byYear[y.shortLabel] == null ? '—' : formatNumber(r.byYear[y.shortLabel])))])} />
      <div className="gpm-foot"><span>Full page, with BPDB beside it: <a href="/annual-reports/financials">Annual Reports · Financials</a></span></div>
    </>
  );
}

function FullReportLink() {
  const open = useSheet();
  return <a href="/annual-reports/financials" onClick={(e) => { e.preventDefault(); open(<FullReport />); }}>View</a>;
}

function FullReportPill() {
  const open = useSheet();
  return <button type="button" className="gpm-info" onClick={() => open(<FullReport />)}><span aria-hidden>≡</span>View Full Report (FY 18)</button>;
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
          <TablePill title="Petrobangla by fiscal year" sub="Crore BDT, as published (P)" head={['Fiscal Year', { label: 'Gas Sales Revenue', unit: 'Crore BDT' }, { label: 'LNG Import Costs', unit: 'Crore BDT' }, { label: 'Net Profit / Loss', unit: 'Crore BDT' }, { label: 'Full report', text: true }]}
            rows={data.map((x) => [x.year, formatNumber(x.revenue), formatNumber(x.lngCost), formatNumber(x.netProfit), x.year === 'FY 18' ? <FullReportLink key="a" /> : 'N/A'])} />
          <FullReportPill />
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
