'use client';

/**
 * Global vs. Domestic: world benchmarks against Bangladesh's retail prices.
 * One tapped year is shared by the three cards (each falls back to its newest
 * year when its own series does not hold the picked one). The conversions are
 * the desktop tooltips' own, kept as written beside each card.
 */

import { useState } from 'react';
import { globalVsDomesticData, historicalExchangeRates } from '@/lib/data/macro/fuel-prices';
import { STATUS_COLORS } from '@/lib/data/grid/chart-palette';
import { Section } from './shared';
import { A, Cap, Foot, Key, KV, Plot, Readout, TablePill, useSeriesColor, type MacroWindow } from './macro-kit';

const H = 116;
type Row = (typeof globalVsDomesticData)[number];
const yl = (rows: Row[]) => rows.map((x) => `’${x.year.slice(2)}`);

export function MacroGlobal({ win }: { win: MacroWindow }) {
  const sc = useSeriesColor();
  const all = win.cut(globalVsDomesticData);
  const [year, setYear] = useState<string | null>(null);
  const at = (rows: Row[]) => { const k = rows.findIndex((x) => x.year === year); return k >= 0 ? k : rows.length - 1; };
  const pick = (rows: Row[]) => (k: number) => setYear(rows[k].year);
  const fx = (d: Row) => historicalExchangeRates[d.year] || 122.0;

  const gas = all.filter((x) => parseInt(x.year) >= 2010);
  const solar = all.filter((x) => parseInt(x.year) >= 2015);
  const o = all[at(all)];
  const g = gas[at(gas)];
  const s = solar[at(solar)];
  if (!o) return null;

  // 1 bbl = 158.987 L (GlobalVsDomesticCards.tsx:70).
  const brentBdtL = (o.globalOil * fx(o)) / 158.987;
  const oilGap = o.bdDiesel - brentBdtL;
  const cBrent = sc('brent'), cDiesel = sc('retailDiesel'), cLng = sc('globalLng'), cTariff = sc('bdGasTariff'), cSolar = sc('transmissionIndex'), cBdSolar = STATUS_COLORS.critical;

  return (
    <>
      <div className="gpm-notice gpm-notice--plain">
        <b>Global Benchmark Comparison</b>
        Energy cost volatility in Bangladesh is structurally linked to global commodity indexes. This dashboard tracks global benchmark pricing (Brent Crude, World Bank Gas/JKM indexes, and IRENA Solar LCOE) against domestic retail tariffs since 1975, highlighting historical subsidy periods and cost de-linkages. Values are converted to BDT equivalents based on historical weighted interbank exchange rates. Tap a year on any plot to read every card for that year.
      </div>

      <Section title="Brent Crude vs. Retail Diesel" desc="Brent Crude (USD/Bbl) vs. Domestic Retail Diesel (Tk/L) — Tracked since 1975" meta="Petroleum">
        <Readout kicker={`Benchmark Oil Price (${o.year}) · Oil`} tone={oilGap >= 0 ? 'good' : 'bad'} value={`${oilGap >= 0 ? '+' : ''}${oilGap.toFixed(2)}`} unit={`Tk/L ${oilGap >= 0 ? '(Premium)' : '(Subsidized)'}`} sub="Retail diesel against Brent’s cost per litre" />
        <Cap color={cBrent} label="Brent Crude ($/bbl)" prov="P" value={`$${o.globalOil.toFixed(2)} / Bbl`} />
        <Plot ariaLabel="Brent crude by year, chart" height={H} labels={yl(all)} sel={at(all)} onSel={pick(all)} tick={(v) => `$${v}`} series={[{ kind: 'line', values: all.map((x) => x.globalOil), color: cBrent, width: 2.5 }]} />
        <Cap color={cDiesel} label="BD Retail Diesel (Tk/L)" prov="P" value={`${o.bdDiesel.toFixed(2)} Tk/L`} />
        <Plot ariaLabel="Bangladesh retail diesel by year, chart" height={H} labels={yl(all)} sel={at(all)} onSel={pick(all)} series={[{ kind: 'area', values: all.map((x) => x.bdDiesel), color: cDiesel, width: 2.5 }]} />
        <div className="gpm-kvs">
          <KV label="Exchange Rate" prov="P" value={`${fx(o).toFixed(2)} Tk/$`} />
          <KV label="Brent Cost (Tk/L equivalent)" prov="D" note="Formula: (Brent USD * Exchange Rate) / 158.987 L" value={`${brentBdtL.toFixed(2)} Tk/L`} />
          <KV label="Margin / Subsidy Gap" prov="D" note="BD Retail Diesel minus Brent Cost (Tk/L equivalent)." tone={oilGap >= 0 ? 'good' : 'bad'} value={oilGap >= 0 ? `+${oilGap.toFixed(2)} Tk/L (Premium)` : `${oilGap.toFixed(2)} Tk/L (Subsidized)`} />
        </div>
        <div className="gpm-pills">
          <TablePill title="Brent crude against Bangladesh retail diesel, by year" head={['Year', 'Brent Crude ($/bbl)', 'BD Retail Diesel (Tk/L)']} rows={all.map((x) => [x.year, x.globalOil, x.bdDiesel])} />
        </div>
        <Foot>
          <span>Source: OPEC Bulletin Historical Spot Prices &amp; <A href="https://bpc.gov.bd/">BPC Official Pricing Gazettes</A></span>
          <span>Series from: OPEC Bulletin, World Bank Pink Sheet, BPC. Ref: <A href="https://bpc.gov.bd/">BPC Pricing Gazettes</A></span>
          <span>As published. Not independently audited.</span>
          <span>Reporting Period: Global Comparison (1975 - 2026)</span>
        </Foot>
      </Section>

      {g && (() => {
        // 1 MMBtu = 28.3 CM (GlobalVsDomesticCards.tsx:259).
        const gasBdtCm = (g.globalGas * fx(g)) / 28.3;
        const gap = g.bdGas - gasBdtCm;
        return (
          <Section title="Global LNG Benchmark vs. Gas Tariff" desc="Global Gas/LNG (USD/MMBtu) vs. BD Avg Tariff (Tk/CM) — Tracked since 2010" meta="Natural Gas">
            <Readout kicker={`Benchmark Gas Price (${g.year}) · Gas`} tone={gap >= 0 ? 'good' : 'bad'} value={`${gap >= 0 ? '+' : ''}${gap.toFixed(2)}`} unit={`Tk/CM${gap >= 0 ? '' : ' (Subsidized)'}`} sub="Average gas tariff against the world price per cubic metre" />
            <Cap color={cLng} label="Global LNG ($/MMBtu)" prov="P" value={`$${g.globalGas.toFixed(2)} / MMBtu`} />
            <Plot ariaLabel="Global LNG by year, chart" height={H} labels={yl(gas)} sel={at(gas)} onSel={pick(gas)} tick={(v) => `$${v}`} series={[{ kind: 'line', values: gas.map((x) => x.globalGas), color: cLng, width: 2.5 }]} />
            <Cap color={cTariff} label="BD Avg Gas Tariff (Tk/CM)" prov="P" value={`${g.bdGas.toFixed(2)} Tk/CM`} />
            <Plot ariaLabel="Bangladesh average gas tariff by year, chart" height={H} labels={yl(gas)} sel={at(gas)} onSel={pick(gas)} series={[{ kind: 'area', values: gas.map((x) => x.bdGas), color: cTariff, width: 2.5 }]} />
            <div className="gpm-kvs">
              <KV label="Global LNG (US/JKM)" prov="P" value={`$${g.globalGas.toFixed(2)} / MMBtu`} />
              <KV label="Exchange Rate" prov="P" value={`${fx(g).toFixed(2)} Tk/$`} />
              <KV label="Global Gas (Tk/CM equivalent)" prov="D" note="Formula: (Global LNG USD * Exchange Rate) / 28.3 CM" value={`${gasBdtCm.toFixed(2)} Tk/CM`} />
              <KV label="Subsidization Gap" prov="D" note="BD Avg Gas Tariff minus Global Gas (Tk/CM equivalent)." tone={gap >= 0 ? 'good' : 'bad'} value={gap >= 0 ? `+${gap.toFixed(2)} Tk/CM` : `${gap.toFixed(2)} Tk/CM (Subsidized)`} />
            </div>
            <div className="gpm-pills">
              <TablePill title="Global LNG benchmark against Bangladesh average gas tariff, by year" head={['Year', 'Global LNG ($/MMBtu)', 'BD Avg Gas Tariff (Tk/CM)']} rows={gas.map((x) => [x.year, x.globalGas, x.bdGas])} />
            </div>
            <Foot>
              <span>Source: World Bank Pink Sheets &amp; <A href="https://www.petrobangla.org.bd/">Petrobangla Annual Reports</A></span>
              <span>Series from: World Bank Pink Sheet, JKM Index, Petrobangla. Ref: <A href="https://www.petrobangla.org.bd/">Petrobangla Audited Reports</A></span>
              <span>As published. Not independently audited.</span>
              <span>Reporting Period: Global Comparison (2010 - 2026)</span>
            </Foot>
          </Section>
        );
      })()}

      {s && (() => {
        // globalSolar LCOE is in cents/kWh: cents * exRate / 100 (MacroTrendsTab.tsx:2508).
        const solarBdt = (s.globalSolar * fx(s)) / 100;
        const premium = s.bdSolar - solarBdt;
        return (
          <Section title="Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff" desc="Global Average Solar LCOE vs. Domestic Solar Contracts (Tk/kWh) — Tracked since 2015" meta="Solar Energy">
            <Readout kicker={`Solar PV Benchmarks (${s.year}) · Solar`} tone={premium >= 0 ? 'bad' : 'good'} value={`${premium >= 0 ? '+' : ''}${premium.toFixed(2)}`} unit={`Tk/kWh${premium >= 0 ? ' (Premium)' : ''}`} sub="Domestic Contract Premium over the global cost" />
            <Plot ariaLabel="Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff, chart" labels={yl(solar)} sel={at(solar)} onSel={pick(solar)}
              series={[{ kind: 'line', values: solar.map((x) => x.globalSolarBdt), color: cSolar, width: 2.5 }, { kind: 'line', values: solar.map((x) => x.bdSolar), color: cBdSolar, width: 2.5 }]} />
            <Key items={[{ label: 'Global Solar LCOE (Tk/kWh)', color: cSolar, line: true }, { label: 'BD Solar Tariff (Tk/kWh)', color: cBdSolar, line: true }]} />
            <div className="gpm-kvs">
              <KV label="Global Solar LCOE" value={`${s.globalSolar.toFixed(2)} US Cents/KWh`} />
              <KV label="Exchange Rate" prov="P" value={`${fx(s).toFixed(2)} Tk/$`} />
              <KV label="Global Solar (Tk/kWh equivalent)" value={`${solarBdt.toFixed(2)} Tk/kWh`} sw={cSolar} sub="Formula: (Global LCOE Cents * Exchange Rate) / 100" />
              <KV label="BD Solar Contract Tariff" value={`${s.bdSolar.toFixed(2)} Tk/kWh`} sw={cBdSolar} />
              <KV label="Domestic Contract Premium" tone={premium >= 0 ? 'bad' : 'good'} value={premium >= 0 ? `+${premium.toFixed(2)} Tk/kWh (Premium)` : `${premium.toFixed(2)} Tk/kWh`} />
            </div>
            <div className="gpm-pills">
              <TablePill title="Solar LCOE Global Trend vs. Bangladesh Feed-In Tariff" head={['Year', 'Global Solar LCOE (Tk/kWh)', 'BD Solar Tariff (Tk/kWh)']} rows={solar.map((x) => [x.year, x.globalSolarBdt.toFixed(2), x.bdSolar.toFixed(2)])} />
            </div>
            <Foot>
              <span>Source: IRENA Renewable Cost Databases &amp; BPDB Power Purchase Agreements (PPAs)</span>
              <span>Series from: IRENA renewable costs, SREDA solar registry, BPDB planning. Ref: <A href="http://www.renewableenergy.gov.bd/">SREDA Databases</A></span>
              <span>As published. Not independently audited.</span>
              <span>Reporting Period: Global Cost Comparison (2015 - 2026)</span>
            </Foot>
          </Section>
        );
      })()}
    </>
  );
}
