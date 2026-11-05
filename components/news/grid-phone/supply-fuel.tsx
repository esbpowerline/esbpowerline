'use client';

/**
 * Supply › Fuel & cost — desktop "Generation & Cost" tab: KPI strip, day windows
 * and methodology, the half-hourly mix, the generation & production-cost
 * breakdown, BPDB's annual accounts and the Power Supply Scenario.
 */

import { useMemo } from 'react';
import { macroTariffData } from '@/lib/data/macro/tariff';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { useUnitCostAuthentication, type UnitCostStatus } from '@/components/news/power-grid/useUnitCostAuthentication';
import { fmt, StackBar } from './charts';
import { usePhone } from './context';
import { isNum, Prov, Row, Section } from './shared';
import { BpdbSection } from './supply-bpdb';
import { Absent, Check, How, KV, Note, Pill, Ref, Tile, U, Verdict, useBrief, useNote } from './supply-bits';
import { MixSection } from './supply-mix';
import { DaySlots } from './supply-slots';

const UC: Record<UnitCostStatus, { label: string; tone?: 'good' | 'warn' | 'bad'; text: string }> = {
  corroborated: { label: '2×', tone: 'good', text: 'Corroborated. BPDB publishes the same production cost and the same energy independently, in its own Daily Electricity Generation Report with its own control totals, and the rate derived from those figures agrees with this one.' },
  disagreement: { label: '!=', tone: 'bad', text: 'Two publishers state the cost and energy behind this rate and they disagree by more than their printing precision allows. Neither figure has been altered.' },
  administered: { label: 'flat', tone: 'warn', text: 'Administered rate, not a measurement. The publisher applies a fixed Tk/kWh to this fuel rather than reporting an observed cost: the figure holds to four decimals for long runs and then steps to a new flat value, so read it as a tariff in force on this day, not as what the fuel cost that day.' },
  'published-only': { label: '1×', text: 'Derived from this agency’s published cost and energy. No second publisher states the same inputs for this fuel, so there is no independent check.' },
  'awaiting-witness': { label: '1×', text: 'Derived from this agency’s published cost and energy, and not yet cross-checked. The second-publisher comparison is a periodic export from BPDB’s own daily reports and this day falls after the last one loaded — so the check is outstanding, not failed, and nothing here says BPDB disagrees.' },
};

const pct = (v: number, dp = 1) => `${v.toFixed(dp)}%`;

export function FuelView() {
  const p = usePhone();
  const { day, date, curve } = p;
  const note = useNote();
  const brief = useBrief();
  const auth = useUnitCostAuthentication(date);
  const gen = day.generationData ?? [];
  const ss = day.systemStats;
  const file = day.sourceFiles?.pgcb;
  const rows = gen.filter((g) => isNum(g.gen) && g.gen > 0);
  const totalRow = rows.reduce((a, g) => a + g.gen, 0);
  const totalGen = gen.reduce((a, g) => a + (isNum(g.gen) ? g.gen : 0), 0);
  const hasCost = gen.some((g) => g.cost != null);
  const totalCost = gen.reduce((a, g) => a + (g.cost ?? 0), 0);
  const avgCost = hasCost && totalGen > 0 ? totalCost / (totalGen * 1e6) : null;
  const leader = rows.length ? rows.reduce((a, g) => (g.gen > a.gen ? g : a)) : null;
  const priced = gen.filter((g) => isNum(g.unitCost) && g.unitCost > 0);
  const dearest = priced.length ? priced.reduce((a, g) => ((g.unitCost as number) > (a.unitCost as number) ? g : a)) : null;
  const net = ss.totalEnergyGen;
  const costNet = ss.totalDailyCost;
  const mkwh = (v: number | null | undefined, dp = 2) => (isNum(v) ? `${fmt(v, dp)} MKWh` : '—');
  const ref = (part: string) => <Ref part={part} date={ss.date} file={file} url="https://pgcb.gov.bd" />;

  const dailyImport = gen.find((g) => g.name === 'Imports')?.unitCost ?? null;

  // ── KPI briefings ──
  const top5 = [...rows].sort((a, b) => b.gen - a.gen).slice(0, 5);
  const dear5 = [...priced].sort((a, b) => (b.unitCost as number) - (a.unitCost as number)).slice(0, 5);
  const bEnergy = () =>
    brief({
      title: 'Energy Briefing',
      rows: [
        { kind: 'P', label: 'Headline total:', value: isNum(net) ? mkwh(net) : 'not published for this day' },
        { kind: 'D', label: 'Sum of the fuel rows:', value: mkwh(totalRow) },
        { kind: 'P', label: 'Energy demanded:', value: mkwh(ss.totalEnergyDemand) },
      ],
      audit: 'The headline is P1’s own total. The fuel rows are summed separately and shown beside it because PGCB prints both and does not state that they must agree — where they differ, the difference is the report’s, not a rounding of ours.',
      ref: ref('P1 sheet — daily energy total'),
    });
  const bLeader = () =>
    brief({
      title: 'Fuel Mix Briefing',
      rows: top5.map((g) => ({ kind: 'P' as const, label: `${g.name}:`, value: `${fmt(g.gen, 2)} MKWh · ${pct((g.gen / totalRow) * 100)}` })),
      audit: 'Each fuel’s energy is PGCB’s figure. The percentages are those rows over their own sum, so they describe the published mix rather than the headline total.',
      ref: ref('P1 sheet — zone-wise generation summary'),
    });
  const bBill = () =>
    brief({
      title: 'Cost Briefing',
      rows: [
        { kind: 'P', label: 'Fuel & import bill:', value: isNum(costNet) ? `${fmt(costNet / 1e7, 2)} Crore BDT` : '—' },
        { kind: 'D', label: 'Avg production cost:', value: ss.avgProductionCost > 0 ? `${fmt(ss.avgProductionCost, 3)} Tk/kWh` : '—', note: 'The parser divides the bill by the day’s energy; PGCB’s printed cell is not read.' },
      ],
      audit: 'Fuel and imports only. Capacity payments, debt service and O&M are not on this report at all, so this is what the day’s electricity cost to fuel, not what it cost to supply.',
      ref: ref('P1 sheet — production-cost block'),
    });
  const bDear = () =>
    brief({
      title: 'Unit Rate Briefing',
      rows: dear5.map((g) => ({ kind: 'D' as const, label: `${g.name}:`, value: `${fmt(g.unitCost, 2)} Tk/kWh` })),
      audit: 'These are not published tariffs. Each is that fuel’s cost divided by its own generation on this day, so a fuel that ran briefly can price high on a small denominator, and the import rate is a blended settlement figure rather than a contracted price. Fuels the report does not price are left out entirely rather than shown at zero.',
      ref: ref('P1 sheet — production-cost block'),
    });

  // ── breakdown ──
  const intensity = (g: (typeof gen)[number]) => {
    const gs = totalGen > 0 ? g.gen / totalGen : 0;
    const cs = g.cost == null || totalCost <= 0 ? null : g.cost / totalCost;
    return { gs, cs, x: cs == null || gs <= 0 ? null : cs / gs };
  };
  const xTone = (x: number) => (x >= 1.5 ? 'var(--gp-bad)' : x > 1.05 ? 'var(--gp-warn)' : x <= 0.95 ? 'var(--gp-good)' : 'var(--gp-muted)');
  const band = 0.005 * (gen.length + 1);

  const openMatrix = () =>
    note(
      'Generation & production cost, all columns',
      <div className="gps-tbl gps-tbl--free" style={{ maxHeight: '60vh' }}>
        <table>
          <thead>
            <tr>
              <th>Fuel / Source</th>
              <th>Generation MKWh<Prov kind="P" /></th>
              <th>Generation share<Prov kind="D" /></th>
              <th>Daily cost Crore BDT<Prov kind="P" /></th>
              <th>Cost share<Prov kind="D" /></th>
              <th>Cost intensity<Prov kind="D" /></th>
              <th>Unit cost Tk/kWh<Prov kind="D" /></th>
            </tr>
          </thead>
          <tbody>
            {gen.map((g) => {
              const t = intensity(g);
              const fact = auth.factFor(g.name, g.unitCost);
              return (
                <tr key={g.name} className={g.gen === 0 ? 'is-dim' : ''}>
                  <td className="gps-name"><span className="gp-sw" style={{ background: g.color, display: 'inline-block', marginRight: 8 }} />{g.name}</td>
                  <td>{fmt(g.gen, 2)}</td>
                  <td>{pct(t.gs * 100, 2)}</td>
                  <td>{g.cost == null ? '—' : fmt(g.cost / 1e7, 2)}</td>
                  <td>{t.cs == null ? '—' : pct(t.cs * 100, 2)}</td>
                  <td style={{ color: t.x == null ? undefined : xTone(t.x), fontWeight: 600 }}>{t.x == null ? '—' : `${t.x.toFixed(2)}×`}</td>
                  <td>{g.unitCost == null ? '—' : fmt(g.unitCost, 2)}{fact ? <> <span className="gp-tag">{UC[fact.status].label}</span></> : null}</td>
                </tr>
              );
            })}
            <tr className="is-total">
              <td>Total System / Average<Prov kind="D" /></td>
              <td>{fmt(totalGen, 2)}</td>
              <td>100.00%</td>
              <td>{hasCost ? fmt(totalCost / 1e7, 2) : '—'}</td>
              <td>{hasCost ? '100.00%' : '—'}</td>
              <td>{hasCost ? '1.00×' : '—'}</td>
              <td>{avgCost != null ? fmt(avgCost, 2) : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>,
      'Cost intensity is cost share over generation share. Rows with no generation are dimmed.',
    );

  const annual = macroTariffData[macroTariffData.length - 1];
  const allIn = annual?.cost ?? null;
  const fuelOnly = avgCost;
  const nonFuel = allIn != null && fuelOnly != null ? allIn - fuelOnly : null;

  // ── scenario ──
  const gas = gen.find((g) => g.name === 'Gas');

  const avail = useMemo(() => gen.length > 0, [gen]);

  return (
    <>
      {/* KPI strip */}
      <Section title="Today’s supply" desc="Tap a figure for its briefing" meta={<span className="gp-tag">Daily</span>} source={<span>PGCB daily report · P1 sheet</span>}>
        <div className="gp-stats gp-stats--first">
          <Tile label="Energy Generated" prov="P" value={isNum(ss.totalEnergyGen) ? fmt(ss.totalEnergyGen, 2) : '—'} unit={isNum(ss.totalEnergyGen) ? 'MKWh' : undefined} detail={isNum(ss.totalEnergyGen) ? undefined : 'Not published for this day'} onClick={bEnergy} />
          <Tile label="Largest Source" prov="D" note="The fuel with the most energy among the published rows." value={leader ? leader.name : '—'} detail={leader && totalRow > 0 ? `${((leader.gen / totalRow) * 100).toFixed(1)}% of the day’s energy` : undefined} onClick={bLeader} />
          <Tile label="Fuel Bill" prov="P" value={isNum(ss.totalDailyCost) ? fmt(ss.totalDailyCost / 1e7, 2) : '—'} unit={isNum(ss.totalDailyCost) ? 'Cr Tk' : undefined} onClick={bBill} />
          <Tile label="Costliest Fuel Run" prov="D" note="The highest cost-over-energy quotient among priced fuels." value={dearest ? fmt(dearest.unitCost, 2) : '—'} unit={dearest ? 'Tk/kWh' : undefined} detail={dearest?.name} onClick={bDear} />
        </div>
        <DaySlots />
      </Section>

      <MixSection curve={curve} day={day} date={date} />

      {avail && (
        <Section
          title="Generation & Production Cost Breakdown"
          desc={<>System performance logged on {ss.date} · {coverageLabel('fuelMix')}</>}
          meta={<span className="gp-tag">Daily</span>}
          source={<span>Source: PGCB Daily Report — P1 sheet, generation and production cost as published · {file ? <code style={{ fontSize: 11 }}>{file}</code> : null} · Unit rate corroborated against <a href="https://bpdb.gov.bd" target="_blank" rel="noopener noreferrer">BPDB Daily Reports</a>. Not audited.</span>}
        >
          <StackBar parts={rows.map((g) => ({ key: g.name, value: g.gen, color: g.color }))} height={12} />
          <Note>Energy and cost as published <Prov kind="P" /> · shares, cost intensity and Tk/kWh are ours <Prov kind="D" note="Shares are each row over the sum of rows; intensity is cost share over energy share; Tk/kWh is cost over energy." /></Note>
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {gen.map((g) => {
              const t = intensity(g);
              const fact = auth.factFor(g.name, g.unitCost);
              return (
                <Row
                  key={g.name}
                  sw={g.color}
                  name={<>{g.name}{fact && <> <Pill tone={UC[fact.status].tone} onClick={() => note(`${g.name}: ${UC[fact.status].label}`, <p style={{ marginTop: 0 }}>{UC[fact.status].text}{fact.secondPublisherUnitCost != null && fact.secondPublisher ? ` ${fact.secondPublisher} derives ${fact.secondPublisherUnitCost.toFixed(4)} Tk/kWh from its own published figures (difference ${Math.abs(fact.delta ?? 0).toFixed(4)}).` : fact.status === 'awaiting-witness' && fact.witnessThrough ? ` Cross-checks currently run through ${fact.witnessThrough}.` : ''}</p>)}>{UC[fact.status].label}</Pill></>}</>}
                  wrap
                  sub={
                    <>
                      {fmt(g.gen, 2)} MKWh · {pct(t.gs * 100, 2)} energy
                      <br />
                      {g.cost == null ? 'cost not published' : `৳${fmt(g.cost / 1e7, 2)} Cr · ${t.cs == null ? '—' : pct(t.cs * 100, 2)} bill`}
                    </>
                  }
                  value={g.unitCost == null ? '—' : <>{fmt(g.unitCost, 2)} <U>Tk/kWh</U></>}
                  small={t.x == null ? 'intensity —' : <span style={{ color: xTone(t.x), fontWeight: 600 }} title={`${t.cs == null ? '' : (t.cs * 100).toFixed(2)}% of cost for ${(t.gs * 100).toFixed(2)}% of energy`}>{t.x.toFixed(2)}× cost for energy</span>}
                  top
                />
              );
            })}
            <Row
              name={<>Total System / Average<Prov kind="D" note="Every cell in this row is ours: the totals are sums of the rows, the average their quotient. PGCB prints its own energy total; see the reconciliation below." /></>}
              wrap
              sub={<>{fmt(totalGen, 2)} MKWh · {hasCost ? `৳${fmt(totalCost / 1e7, 2)} Cr` : 'cost —'}</>}
              value={avgCost != null ? <>{fmt(avgCost, 2)} <U>Tk/kWh</U></> : '—'}
              small={hasCost ? '1.00× · 100%' : '—'}
            />
          </div>
          <button type="button" className="gp-more" onClick={openMatrix}>All columns as a table</button>

          {isNum(ss.totalEnergyGen) && (() => {
            const delta = totalGen - ss.totalEnergyGen;
            const ok = Math.abs(delta) <= band;
            return (
              <Check title="Fuel rows against PGCB’s own total" ok={ok}>
                <KV label="Fuel rows sum" kind="D" value={`${fmt(totalGen, 2)} MKWh`} />
                <KV label="Published by PGCB" kind="P" value={<>{fmt(ss.totalEnergyGen, 2)} MKWh<Verdict ok={ok} delta={delta} /></>} />
              </Check>
            );
          })()}

          {allIn != null && fuelOnly != null && nonFuel != null && (
            <>
              <div className="gps-box gps-box--soft" style={{ marginBottom: 0 }}>
                <b>What this table cannot see: about {((nonFuel / allIn) * 100).toFixed(0)}% of the real bill.</b> PGCB publishes a fuel cost daily; nobody publishes a daily all-in cost. BPDB’s own audited bulk cost — which adds capacity payments, O&amp;M and capital recovery — is published annually.
              </div>
              <div className="gp-stats gp-stats--3" style={{ marginTop: 'var(--s2)' }}>
                <Tile label="Fuel only, today" prov="D" note="Fuel bill over energy generated, from the table above." value={fmt(fuelOnly, 2)} detail="Tk/kWh — the table above" />
                <Tile label="BPDB all-in" prov="P" value={fmt(allIn, 2)} detail={`Tk/kWh — ${annual.year}, annual`} />
                <Tile label="Not in this table" prov="D" note="BPDB all-in minus today’s fuel-only rate." value={fmt(nonFuel, 2)} detail="Tk/kWh of non-fuel cost" />
              </div>
              <Note>The two are different periods — one day against a financial year — so the gap is indicative of scale, not an exact decomposition of today. A reader taking {fmt(fuelOnly, 2)} Tk/kWh as the cost of electricity would be understating it by roughly a third.</Note>
            </>
          )}

          <How title="Why these rates cannot be ranked" label="Why these rates cannot be ranked">
            <p style={{ marginTop: 0 }}><b>These rates are not comparable to each other, and do not rank the options.</b> Each is a fuel or purchase cost divided by the energy that fuel produced. It excludes what a plant costs whether or not it runs — capacity payments to idle IPPs, capital recovery, O&amp;M — and excludes transmission losses. Three consequences worth holding onto:</p>
            <p><b>Solar and wind burn no fuel.</b> Their figure is the tariff paid under a power-purchase agreement, which is capital recovery. Setting it against gas — a fuel bill that excludes the gas plant’s own capital — compares two different quantities. It does not mean solar costs more to run; a solar plant costs almost nothing to run.</p>
            <p><b>Hydro is not free.</b> Kaptai has no fuel bill and is long since built, so its rate collapses towards zero. It cannot be scaled: the dam is what it is, and the output depends on rainfall.</p>
            <p><b>Imports cannot simply be increased.</b> The rate is contractual, and the volume is capped by what the interconnectors can physically carry — the HVDC link, Adani and Tripura are near their limits on most days. A low rate on a capped supply is not an option to buy more of.</p>
            <p>The columns that do compare fairly are the two beside each other: <b>Generation Share against Cost Share</b>. A fuel taking a larger share of the bill than of the electricity is the one raising the average — which is the question the rate column is usually being asked, and cannot answer.</p>
          </How>
          <How title="How the unit cost is derived" label="How the unit cost is derived, and what 2× / flat mean">
            <p style={{ marginTop: 0 }}><b>How the unit cost is arrived at.</b> No agency publishes a Tk/kWh rate. PGCB publishes a production cost in Taka and an energy total in MKWh for each fuel; the rate here is the first divided by the second, which is why it is marked D. The marker beside each rate says what independent evidence supports it:</p>
            <p><b>Why the columns may not divide exactly.</b> The rate is computed from the energy PGCB publishes at full precision, while the Generation column is rounded to two decimals to read cleanly. On small fuels the two printed columns therefore divide to something slightly different — Wind shows 0.31 MKWh against an actual 0.30624 — so the rate shown is the more precise one, not the one the visible columns produce.</p>
            <div className="gp-rows">
              <Row name={<Pill tone="good">2×</Pill>} wrap sub="BPDB publishes the same cost and the same energy in a separate report with its own control totals, and the rate derived from those agrees. Re-measured across every witnessed day from 2025-01-01 to 2026-06-24: gas agrees on 274 of 274 days, coal on 274 of 274, imports on 273 of 274 — the exception being 2026-04-03, where BPDB’s own page overstates imported energy by exactly 188.00 MKWh while PGCB’s three interconnectors sum to its own total." top />
              <Row name={<Pill tone="warn">flat</Pill>} wrap sub="A flat rate the publisher applies rather than measures. Through 2026 PGCB prints Wind at 14.7100 Tk/kWh unchanged, and Hydro at 0.1000 except for 2026-06-30 to 07-15, when it stepped to 3.8100 and back. Rates that hold to four decimals for weeks and then jump are tariffs in force, not daily costs." top />
              <Row name={<Pill tone="bad">!=</Pill>} wrap sub="Both agencies state the inputs and they disagree by more than their printing precision allows. Neither figure is altered." top />
              <Row name={<Pill>1×</Pill>} wrap sub="Correctly derived, but only one agency publishes the inputs, so there is no second witness." top />
              <Row name={<Pill>1× dashed</Pill>} wrap sub={`Correctly derived, and the cross-check has not been run for this day yet. The BPDB comparison is a periodic export${auth.witnessThrough ? ` covering days through ${auth.witnessThrough}` : ''}; a day past that is unchecked, which is not the same as unconfirmed.`} top />
            </div>
          </How>
        </Section>
      )}

      <BpdbSection dailyImportRate={dailyImport} />

      <Section
        title="Power Supply Scenario"
        desc={<>PGCB’s summary block as printed · {coverageLabel('fuelMix')}</>}
        meta={<span className="gp-tag">Daily</span>}
        source={<span>Source: PGCB Daily Report — P1 sheet and the reported-day Forecast block; Nepal from the En-Curve stack · {file ? <code style={{ fontSize: 11 }}>{file}</code> : null} · As published by PGCB. Not audited. · Reporting period: System Summary (Date: {ss.date})</span>}
      >
        <div className="gp-group-label" style={{ marginTop: 0 }}>Load-shedding &amp; demand</div>
        <div className="gp-rows">
          <Row name={<>Peak Demand<Prov kind="P" /></>} value={<>{isNum(ss.eveningPeakDemand) ? fmt(ss.eveningPeakDemand, 1) : '—'} <U>MW</U></>} />
          <Row name={<>Peak Generation<Prov kind="P" /></>} value={<>{isNum(ss.eveningPeakGen) ? fmt(ss.eveningPeakGen, 1) : '—'} <U>MW</U></>} />
          <Row name={<>Unserved Energy<Prov kind="P" /></>} value={<span style={isNum(ss.totalEnergyUnserved) && ss.totalEnergyUnserved > 0 ? { color: 'var(--gp-bad)' } : undefined}>{isNum(ss.totalEnergyUnserved) ? fmt(ss.totalEnergyUnserved, 2) : '—'} <U>MKWh</U></span>} small={isNum(ss.totalEnergyUnserved) ? undefined : 'PGCB did not state it'} />
        </div>
        <div className="gp-group-label">Generation extremes &amp; temperature</div>
        <div className="gp-rows">
          <Row name={<>Max Generation<Prov kind="P" /></>} value={<>{isNum(ss.maxGen) ? fmt(ss.maxGen, 1) : '—'} <U>MW</U></>} small={isNum(ss.maxGen) ? undefined : 'not in this day’s report'} />
          <Row name={<>Min Generation<Prov kind="P" /></>} value={<>{isNum(ss.minGen) ? fmt(ss.minGen, 1) : '—'} <U>MW</U></>} small={isNum(ss.minGen) ? undefined : 'not in this day’s report'} />
          <Row name={<>Max Temp<Prov kind="P" /></>} value={<>{isNum(ss.maxTemp) ? fmt(ss.maxTemp, 1) : '—'} <U>°C</U></>} small={isNum(ss.maxTemp) ? undefined : 'not in this day’s report'} />
        </div>
        <div className="gp-group-label">Gas-to-power</div>
        <div className="gp-rows">
          <Row name={<>Gas Supplied<Prov kind="P" /></>} value={<>{isNum(ss.totalGasSuppliedPower) ? fmt(ss.totalGasSuppliedPower, 1) : '—'} <U>MMCFD</U></>} small="the power sector’s slice" />
          <Row name={<>Gas Cost<Prov kind="P" /></>} value={<>{gas?.cost != null ? fmt(gas.cost / 1e7, 2) : '—'} <U>Crore BDT</U></>} />
          <Row name={<>Gas Unit Cost<Prov kind="D" note="Gas cost over gas energy." /></>} value={<>{gas?.unitCost != null ? fmt(gas.unitCost, 2) : '—'} <U>Tk/kWh</U></>} />
        </div>
      </Section>

      {!avail && <Section><Absent>PGCB’s fuel table is not in this day’s report.</Absent></Section>}
    </>
  );
}
