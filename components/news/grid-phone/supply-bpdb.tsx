'use client';

/** "BPDB Annual Accounts" — power-grid/BpdbAccountsPanel for the phone. */

import { useMemo, useState } from 'react';
import { BPDB_ANNUAL_ACCOUNTS, BPDB_IMPORT_CAVEAT, BPDB_OWN_GENERATION_NOTE, type BpdbCostGroup } from '@/lib/data/bpdb-annual-accounts';
import { useChartTheme } from '@/hooks/useChartTheme';
import { fmt, Legend, StackBar } from './charts';
import { Prov, Row, Section } from './shared';
import { How, KV, Note, ShowMore, Tile, U } from './supply-bits';

const GROUP_LABEL: Record<BpdbCostGroup, string> = {
  purchase: 'Electricity BPDB bought',
  'own-fuel': 'Fuel BPDB burnt itself',
  fixed: 'Fixed and staff costs',
  network: 'Network charges',
};
const GROUP_SLOT: Record<BpdbCostGroup, number> = { purchase: 0, 'own-fuel': 1, fixed: 2, network: 3 };
const SOURCE_LABEL: Record<string, string> = { PublicSector: 'Public sector', JointVenture: 'Joint venture', PrivateSector: 'Private — IPP & rental', PowerImport: 'Imported from India' };
const SOURCE_ORDER = ['PublicSector', 'JointVenture', 'PrivateSector', 'PowerImport'];
const cr = (n: number) => fmt(n, 2);
const crShort = (n: number) => fmt(n, 0);

export function BpdbSection({ dailyImportRate }: { dailyImportRate: number | null }) {
  const years = BPDB_ANNUAL_ACCOUNTS;
  const [fy, setFy] = useState(years[years.length - 1].fy);
  const [all, setAll] = useState(false);
  const theme = useChartTheme();
  const year = years.find((y) => y.fy === fy) ?? years[years.length - 1];
  const last = years[years.length - 1].fy;

  const heads = useMemo(() => [...year.heads].sort((a, b) => b.crore - a.crore), [year]);
  const headsTotal = heads.reduce((s, h) => s + h.crore, 0);
  const printed = year.totalOperatingExpensesCrore;
  const reconciles = Math.abs(headsTotal - printed) <= 0.05;
  const groups = useMemo(() => {
    const m = new Map<BpdbCostGroup, number>();
    for (const h of heads) m.set(h.group, (m.get(h.group) ?? 0) + h.crore);
    return [...m.entries()].map(([group, crore]) => ({ group, crore })).sort((a, b) => b.crore - a.crore);
  }, [heads]);

  const imp = year.derived.importUnitCost;
  const priv = year.derived.privateUnitCost;
  const sys = year.derived.systemAllInUnitCost;
  const pubAll = year.published.generationCostPerUnit;
  const pubFuel = year.published.fuelCostPerUnitThermal;
  const sales = year.energySalesCrore;
  const subsidy = year.subsidyCrore;
  const gap = sales != null ? printed - sales : null;
  const subShare = gap != null && gap > 0 && subsidy != null ? (subsidy / gap) * 100 : null;
  const cost = year.published.bulkSupplyCostPerUnit;
  const tariff = year.published.bulkTariffPerUnit;
  const recovery = cost && tariff ? (tariff.value / cost.value) * 100 : null;

  const sources = useMemo(() => {
    const rows = SOURCE_ORDER.filter((k) => (year.generationMkwh[k] ?? 0) > 0).map((k) => ({ key: k, label: SOURCE_LABEL[k] ?? k, mkwh: year.generationMkwh[k] }));
    return { rows, sum: rows.reduce((s, r) => s + r.mkwh, 0), printed: year.generationMkwh.SingleBuyerTotal };
  }, [year]);

  const shown = all ? heads : heads.slice(0, 6);
  const fmtIn = (n: number) => n.toLocaleString('en-US');

  return (
    <Section
      title="BPDB Annual Accounts"
      desc="Purchase prices over a whole financial year, from BPDB’s own published accounts — the capacity payments and contracted charges a daily fuel bill cannot show"
      meta={<span className="gp-tag">Annual</span>}
      source={
        <span>
          Source:{' '}
          {year.source.url ? <a href={year.source.url} target="_blank" rel="noopener noreferrer">{year.source.file}</a> : year.source.file} — {year.source.statement}
          {year.source.printedUnit !== 'Crore BDT' && <>, printed in {year.source.printedUnit} and converted (1 Crore = 100 Lac)</>} · As published. Not independently audited. · Reporting period: financial year {year.fy}. Series ends at FY {last} — BPDB lists FY 2023-24 and FY 2024-25 with no file attached, and its earlier reports are page scans with no readable text.
        </span>
      }
    >
      <div className="gp-filter" style={{ marginTop: 0 }} role="group" aria-label="Financial year">
        {[...years].reverse().map((y) => (
          <button key={y.fy} className={y.fy === fy ? 'is-on' : ''} aria-pressed={y.fy === fy} onClick={() => { setFy(y.fy); setAll(false); }}>FY {y.fy}</button>
        ))}
      </div>

      <div className="gp-stats" style={{ marginTop: 'var(--s4)' }}>
        <Tile label="Imports, annual" prov="D" note="BPDB’s published import purchase cost divided by its published imported energy." value={imp ? fmt(imp.value, 2) : '—'} unit="Tk" detail={imp ? `${cr(imp.numeratorCrore)} Cr ÷ ${fmtIn(imp.denominatorMkwh)} MkWh` : `Not separable in FY ${year.fy}`} />
        <Tile label="IPP & rental" prov="D" note="BPDB’s published private-producer purchase cost divided by its published energy." value={priv ? fmt(priv.value, 2) : '—'} unit="Tk" detail={priv ? `${cr(priv.numeratorCrore)} Cr ÷ ${fmtIn(priv.denominatorMkwh)} MkWh` : `Not separable in FY ${year.fy}`} />
        <Tile label="All-in generation" prov="P" value={pubAll ? fmt(pubAll.value, 2) : '—'} unit="Tk" detail={pubAll ? `BPDB’s own figure, FY ${year.fy}` : `Not printed for FY ${year.fy}`} />
        <Tile label="Thermal fuel only" prov="P" value={pubFuel ? fmt(pubFuel.value, 2) : '—'} unit="Tk" detail={pubFuel ? `BPDB’s own figure, FY ${year.fy}` : `Not printed for FY ${year.fy}`} />
        <Tile label="Operating expenditure" prov="P" value={crShort(printed)} unit="Cr" detail="Total operating expenses, Crore BDT" />
        <Tile label="Energy sales revenue" prov="P" value={sales != null ? crShort(sales) : '—'} unit={sales != null ? 'Cr' : undefined} detail={sales != null ? 'Revenue from energy sales' : `Not printed for FY ${year.fy}`} />
        <Tile label="Government subsidy" prov="P" value={subsidy != null ? crShort(subsidy) : '—'} unit={subsidy != null ? 'Cr' : undefined} detail={subShare != null ? `Covers ${subShare.toFixed(0)}% of the shortfall` : `Not stated for FY ${year.fy}`} />
        <Tile label="Cost recovered in tariff" prov="D" note="BPDB’s printed bulk tariff over its printed bulk supply cost." value={recovery != null ? recovery.toFixed(0) : '—'} unit={recovery != null ? '%' : undefined} detail={cost && tariff ? `Sold at ${tariff.value.toFixed(2)} against ${cost.value.toFixed(2)} Tk/kWh` : `Bulk tariff not printed for FY ${year.fy}`} />
      </div>

      <div className="gp-group-label" style={{ margin: 'var(--s5) 0 var(--s2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Operating expenditure by head<Prov kind="P" /></span>
        <span className="num" style={{ fontWeight: 500 }}>{cr(printed)} Cr</span>
      </div>
      <StackBar parts={groups.map((g) => ({ key: g.group, value: g.crore, color: theme.categorical(GROUP_SLOT[g.group]) }))} height={12} />
      <Note>Share of total<Prov kind="D" note="Each group’s crore over the sum of the heads." /></Note>
      <Legend
        items={[
          ...groups.map((g) => ({ key: g.group, color: theme.categorical(GROUP_SLOT[g.group]), label: <>{GROUP_LABEL[g.group]} <b className="num">{((g.crore / headsTotal) * 100).toFixed(1)}%</b></> })),
        ]}
      />
      <div className="gp-rows" style={{ marginTop: 8 }}>
        {shown.map((h) => (
          <Row
            key={h.key}
            sw={theme.categorical(GROUP_SLOT[h.group])}
            name={h.label}
            wrap
            sub={GROUP_LABEL[h.group]}
            value={<>{h.resolvedBy && <span style={{ color: 'var(--gp-warn)' }} aria-label={`Reconciled against BPDB’s ${h.resolvedBy}`}>† </span>}{cr(h.crore)} <U>Cr</U></>}
            small={`${((h.crore / headsTotal) * 100).toFixed(1)}%`}
          />
        ))}
        <Row name="Total operating expenses" value={<>{cr(printed)} <U>Cr</U></>} small="100.0%" />
      </div>
      <ShowMore shown={6} total={heads.length} noun="heads" expanded={all} onToggle={() => setAll((v) => !v)} />
      {heads.some((h) => h.resolvedBy) && <Note>† The two extraction engines disagreed on this head; the figure shown is the one BPDB’s own printed total supports.</Note>}

      {sources.rows.length > 1 && (
        <>
          <div className="gp-group-label" style={{ margin: 'var(--s5) 0 var(--s2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Where the power came from<Prov kind="P" /></span>
            <span className="num" style={{ fontWeight: 500 }}>{fmtIn(sources.printed ?? sources.sum)} MkWh</span>
          </div>
          <StackBar parts={sources.rows.map((r, i) => ({ key: r.key, value: r.mkwh, color: theme.categorical(i) }))} height={12} />
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {sources.rows.map((r, i) => (
              <Row key={r.key} sw={theme.categorical(i)} name={r.label} sub={<>MkWh <Prov kind="P" /> · share <Prov kind="D" /></>} value={<>{fmtIn(r.mkwh)} <U>MkWh</U></>} small={`${((r.mkwh / sources.sum) * 100).toFixed(1)}%`} />
            ))}
          </div>
        </>
      )}

      <How title="BPDB Annual Accounts: what is being shown">
        <p>
          PGCB publishes a fuel cost daily; nobody publishes a daily all-in cost. BPDB’s audited accounts do, once a year, and this card reads FY {year.fy} of them. The four per-unit rates are per unit: the two marked D divide one published figure by another and print both inputs, the two marked P are BPDB’s own. The expenditure list is every head BPDB itemises, and{' '}
          {reconciles ? <>the {heads.length} of them sum to {cr(headsTotal)} Crore BDT against the {cr(printed)} Crore BDT printed as Total Operating Expenses — they reconcile.</> : <>the {heads.length} of them sum to {cr(headsTotal)} Crore BDT against the {cr(printed)} Crore BDT printed as Total Operating Expenses, a difference of {cr(Math.abs(headsTotal - printed))} Crore. Both figures are as published; the discrepancy is BPDB’s.</>}
          {sources.printed != null && (
            <> The {sources.rows.length} generation sources sum to {fmtIn(sources.sum)} MkWh against the {fmtIn(sources.printed)} MkWh printed as the single-buyer total{Math.abs(sources.sum - sources.printed) <= 2 ? ', which reconciles too.' : `, a difference of ${fmtIn(Math.abs(sources.sum - sources.printed))} MkWh.`}</>
          )}
        </p>
        {sys && cost && (
          <p>
            Dividing that total by the {year.bulkSalesMkwh ? fmtIn(year.bulkSalesMkwh) : '—'} MkWh BPDB reports selling in bulk gives {sys.value.toFixed(2)} Tk/kWh <Prov kind="D" />, against the {cost.value.toFixed(2)} Tk/kWh BPDB prints as its average bulk supply cost <Prov kind="P" />. BPDB does not state which denominator it used, so the two are close rather than identical.
          </p>
        )}
        <p>
          <b>How these were extracted.</b> BPDB publishes the accounts as a PDF, not as data. Two engines read every figure independently — one by column geometry, one by requiring BPDB’s own Performance-over-Budget column to reconcile — and a figure ships only where the two agree, or where BPDB’s printed total settles the disagreement. A figure settled that way is marked † in the list
          {heads.some((h) => h.resolvedBy) ? <> — {heads.filter((h) => h.resolvedBy).length} of the {heads.length} heads this year</> : <>, and no head this year needed it</>}. Amounts print in Lac Taka on the older reports and Crore on the newer ones; the unit is read off each page rather than assumed, because taking it for granted is a factor-of-100 error.
        </p>
        <p>
          <b>What is not here.</b> Coverage stops at FY {last}. BPDB lists FY 2023-24 and FY 2024-25 with no file attached, and every report before FY {years[0].fy} is a page scan with no text layer. Neither gap is filled by inference, and FY 2021-22 is absent from the series for the same reason — so this is not current-year data. {BPDB_IMPORT_CAVEAT}
        </p>
        <Note>{BPDB_OWN_GENERATION_NOTE}</Note>
        <p><b>Analytical insight.</b></p>
        <p>
          {dailyImportRate != null && dailyImportRate > 0 && imp && <>The daily table prices imports at {dailyImportRate.toFixed(2)} Tk/kWh; BPDB paid {imp.value.toFixed(2)} Tk/kWh for the same electricity across the year, because a daily figure is a fuel cost and imported power has no fuel line at all. </>}
          {priv && imp && <>Against {priv.value.toFixed(2)} Tk/kWh for power bought from private producers, imports were the cheaper purchase that year, not the dearer one. </>}
          {gap != null && gap > 0 && <>BPDB spent {cr(gap)} Crore BDT more than it earned selling energy{subShare != null && <>, and a subsidy covered {subShare.toFixed(0)}% of that shortfall</>}; BPDB books other income beyond energy sales, so this is not its bottom line. </>}
          {cost && tariff && recovery != null && <>A unit cost {cost.value.toFixed(2)} Tk/kWh to supply in bulk and sold for {tariff.value.toFixed(2)} — a shortfall of {(cost.value - tariff.value).toFixed(2)} Tk on every kWh, which is what the subsidy is for.</>}
          {!imp && !(gap && gap > 0) && BPDB_IMPORT_CAVEAT}
        </p>
        <KV label="Reporting period" value={`FY ${year.fy}`} />
      </How>
    </Section>
  );
}
