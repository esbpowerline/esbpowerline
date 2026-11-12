'use client';

/**
 * Pricing & Drivers. The desktop draws two dual-axis charts and a seven-column
 * table. Here one tapped year drives the whole tab: each dual-axis chart is
 * two short plots (one unit each), and the table is the year's six figures
 * with every year behind the table pill.
 */

import { macroEconomicData } from '@/lib/data/macro/economics';
import { SERIES_UNMAPPED } from '@/lib/data/grid/chart-palette';
import { Section } from './shared';
import { A, Cap, Cell, Foot, InfoPill, Pills, Plot, TablePill, useSel, useSeriesColor, type MacroWindow } from './macro-kit';

const H = 116;

export function MacroPricing({ win }: { win: MacroWindow }) {
  const sc = useSeriesColor();
  const data = win.cut(macroEconomicData);
  const [i, setI] = useSel(data.length);
  const d = data[i];
  if (!d) return null;
  const labels = data.map((x) => `’${x.year.slice(2)}`);
  const col = <K extends keyof typeof d>(k: K) => data.map((x) => x[k] as number);
  const infl = sc('peakGeneration');
  const lng = sc('powerBudget');
  const coal = SERIES_UNMAPPED.light;
  return (
    <>
      <div className="gpm-notice gpm-notice--plain">
        <b>Exchange Rate Sensitivity</b>
        Imported energy commodities (Spot LNG, Coal, Heavy Fuel Oil) are denominated in US Dollars (USD). Therefore, the exchange rate of the Bangladesh Taka (BDT) is a direct multiplier on the domestic cost of power generation. A 40%+ devaluation of the BDT since 2021 has automatically increased fuel costs even when global commodity prices remain constant.
      </div>

      <Section title="Macro Pressure Variables (2021 - 2026)" desc="Devaluation of BDT/USD vs. National Inflation Rate (CPI %) — Tracked since 2021" meta="Macro Factors">
        <div className="gp-kicker"><span>Macro Variables {d.year} · Economy</span></div>
        <Cap color="var(--gp-primary)" label="USD Exchange Rate (BDT)" prov="P" value={`${d.exchangeRate.toFixed(2)} BDT/USD`} />
        <Plot ariaLabel="USD exchange rate by year, chart" height={H} labels={labels} sel={i} onSel={setI} series={[{ kind: 'bar', values: col('exchangeRate'), color: 'var(--gp-primary)' }]} />
        <Cap color={infl} label="Inflation Rate (CPI)" prov="P" value={`${d.inflation.toFixed(2)}%`} />
        <Plot ariaLabel="Inflation rate by year, chart" height={H} labels={labels} sel={i} onSel={setI} tick={(v) => `${v}%`} series={[{ kind: 'line', values: col('inflation'), color: infl, width: 2.5 }]} />
        <div className="gpm-pills">
          <InfoPill label="What is being shown?" sub="Macro Pressure Variables (2021 - 2026)">
            <p>This chart shows the year-on-year weighted average interbank exchange rate (BDT per USD) plotted against the national CPI inflation rate since 2021.</p>
            <p><strong>Analytical Insight:</strong> The rapid rise in the exchange rate (from ~85 Tk in 2021 to 122 Tk in 2026) shows a severe depreciation (~43%) of the BDT. This currency devaluation acts as a direct multiplier on imported fuel costs, triggering high domestic inflation. It signals that energy security in Bangladesh is heavily coupled with foreign exchange reserve stability.</p>
            <p>Source Data: Weighted Average Interbank Exchange Rate &amp; Consumer Price Index. Source: Bangladesh Bank &amp; BBS Databases. As published. Not independently audited.</p>
          </InfoPill>
          <TablePill title="Macro Pressure Variables" head={['Year', 'USD Exchange Rate (BDT)', 'Inflation Rate (%)']} rows={data.map((x) => [x.year, x.exchangeRate.toFixed(2), x.inflation.toFixed(2)])} />
        </div>
        <Foot>
          <span>Source: <A href="https://www.bb.org.bd/">Bangladesh Bank Interbank Weighted Average Statistics</A> &amp; <A href="http://bbs.gov.bd/">BBS Inflation Database</A></span>
          <span>As published. Not independently audited.</span>
          <span>Reporting Period: Macro-Economic Tracker (2010 - 2026)</span>
        </Foot>
      </Section>

      <Section title="Global Fuel Commodity Import Costs" desc="Spot LNG (USD/MMBtu) vs. Import Coal (USD/Metric Ton) — Tracked since 2021" meta="Import Costs">
        <div className="gp-kicker"><span>Fuel Import Cost {d.year} · Commodities</span></div>
        <Cap color={lng} label="Spot LNG (R-LNG)" value={`$${d.spotLng.toFixed(2)} / MMBtu`} />
        <Plot ariaLabel="Spot LNG by year, chart" height={H} labels={labels} sel={i} onSel={setI} tick={(v) => `$${v}`} series={[{ kind: 'area', values: col('spotLng'), color: lng }]} />
        <Cap color={coal} label="Imported Coal (CIF)" value={`$${d.importCoal.toFixed(2)} / Ton`} />
        <Plot ariaLabel="Import coal by year, chart" height={H} labels={labels} sel={i} onSel={setI} tick={(v) => `$${v}`} series={[{ kind: 'line', values: col('importCoal'), color: coal, width: 2.5 }]} />
        <div className="gpm-pills">
          <InfoPill label="What is being shown?" sub="Global Fuel Commodity Import Costs">
            <p>This chart compares global Spot LNG prices (USD/MMBtu, left axis) against Newcastle imported coal prices (USD/Ton, right axis) from 2021 to 2026.</p>
            <p><strong>Analytical Insight:</strong> The charts capture the extreme volatility of spot LNG compared to imported coal. The massive price spike in 2022 highlights the vulnerability of relying on global energy spot markets, whereas coal offers relatively more stable pricing, though still high. This shows the necessity of transitioning towards longer-term contracts rather than relying on spot imports.</p>
            <p>Indices: Platts JKM Spot Gas LNG &amp; Newcastle Thermal Coal Price Index. Source: Petrobangla LNG Division / BPDB Coal Purchase audits. As published. Not independently audited.</p>
          </InfoPill>
          <TablePill title="Global Fuel Commodity Import Costs" head={['Year', 'Spot LNG (USD/MMBtu)', 'Import Coal (USD/Ton)']} rows={data.map((x) => [x.year, x.spotLng.toFixed(2), x.importCoal.toFixed(2)])} />
        </div>
        <Foot>
          <span>Source: <A href="https://www.opec.org/">OPEC Bulletin Daily Spot Prices</A> &amp; <A href="https://www.spglobal.com/commodityinsights/en">Platts JKM LNG Assessments</A> / BPC Accounts</span>
          <span>As published. Not independently audited.</span>
          <span>Reporting Period: Global Indexes (2010 - 2026)</span>
        </Foot>
      </Section>

      <Section title="Retail Fuel & Macro Pricing Benchmarks" desc="Historical correlation between BDT devaluation and retail petroleum price hikes — Tracked since 2010">
        <Pills label="Year" items={data.map((x) => x.year)} sel={i} onSel={setI} />
        <div className="gp-stats gp-stats--3" style={{ marginTop: 12 }}>
          <Cell label="Retail Diesel (Tk/L)" value={d.retailDiesel.toFixed(2)} unit="Tk" />
          <Cell label="Retail Octane (Tk/L)" value={d.retailOctane.toFixed(2)} unit="Tk" />
          <Cell label="Exchange Rate (BDT/USD)" value={d.exchangeRate.toFixed(2)} unit="Tk" tone="primary" />
          <Cell label="Spot LNG (USD/MMBtu)" value={`$${d.spotLng.toFixed(2)}`} />
          <Cell label="Import Coal (USD/Ton)" value={`$${d.importCoal.toFixed(2)}`} />
          <Cell label="Inflation Rate (CPI %)" value={`${d.inflation.toFixed(2)}%`} tone="warn" />
        </div>
        <div className="gpm-pills">
          <TablePill title="Retail Fuel & Macro Pricing Benchmarks" sub="Every year held"
            head={['Year', 'Retail Diesel (Tk/L)', 'Retail Octane (Tk/L)', 'Spot LNG (USD/MMBtu)', 'Import Coal (USD/Ton)', 'Exchange Rate (BDT/USD)', 'Inflation Rate (CPI %)']}
            rows={data.map((x) => [x.year, `${x.retailDiesel.toFixed(2)} Tk`, `${x.retailOctane.toFixed(2)} Tk`, `$${x.spotLng.toFixed(2)}`, `$${x.importCoal.toFixed(2)}`, `${x.exchangeRate.toFixed(2)} Tk`, `${x.inflation.toFixed(2)}%`])} />
        </div>
        <Foot>
          <span>Source: <A href="https://bpc.gov.bd/">BPC Retail Gazettes</A> &amp; <A href="https://www.bb.org.bd/">Bangladesh Bank Databases</A></span>
          <span>Hand-entered and not yet checked against the gazettes; Kerosene and Petrol were removed on 2026-09-30 as filled-in rather than read.</span>
          <span>Reporting Period: Historical Macro Pricing Benchmarks (2010 - 2026)</span>
        </Foot>
      </Section>
    </>
  );
}
