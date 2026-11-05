'use client';

/** Overview cards 2 and 3: the day's generation mix and its fuel & import cost. */

import { useState } from 'react';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { formatUnitRate } from '@/lib/utils';
import { Bars, StackBar } from './charts';
import { usePhone } from './context';
import { fuelPalette, isNum, Row, Section, Stat, useSheet } from './shared';
import { Foot } from './today-util';

export function TodayMixCard() {
  const { day } = usePhone();
  const open = useSheet();
  const pal = fuelPalette(day);
  const gd = day.generationData ?? [];
  const total = gd.reduce((a, g) => a + (g.gen || 0), 0);
  const rows = gd.filter((g) => isNum(g.gen) && g.gen > 0);
  const colour = (g: (typeof gd)[number]) => g.color || pal[g.name] || 'var(--gp-primary)';
  const files = day.sourceFiles;

  return (
    <Section
      title="Daily generation mix"
      desc={
        <>
          Energy share by fuel · total <b style={{ color: 'var(--gp-on)' }}>{total.toFixed(1)} MKWh</b> <span className="gp-u">(our sum of the fuel rows, D)</span>
          <br />
          {coverageLabel('fuelMix')}
        </>
      }
    >
      {rows.length === 0 || total <= 0 ? (
        <div className="gp-empty" style={{ minHeight: 110 }}>
          <div>
            <b style={{ color: 'var(--gp-on)' }}>No generation data</b>
            <br />
            No fuel mix recorded for this reporting date.
          </div>
        </div>
      ) : (
        <>
          <StackBar height={14} parts={gd.map((g) => ({ key: g.name, value: g.gen, color: colour(g) }))} />
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {rows.map((g) => (
              <Row
                key={g.name}
                sw={colour(g)}
                name={g.name}
                sub={`${((g.gen / total) * 100).toFixed(1)}% of the day’s energy`}
                value={g.gen.toFixed(1)}
                small="MKWh"
                chevron
                onClick={() =>
                  open(
                    <>
                      <h3>{g.name} share</h3>
                      <p className="gp-sheet__sub">Operational mix · {day.systemStats.date}</p>
                      <div className="gp-rows">
                        <Row name={<>Energy output <span className="gp-u">P</span></>} value={g.gen.toFixed(2)} small="MKWh" />
                        <Row name={<>System share <span className="gp-u">D</span></>} value={`${((g.gen / total) * 100).toFixed(2)}%`} />
                      </div>
                      <p>Share = this fuel’s published energy ÷ the sum of the published fuel rows, calculated here.</p>
                      <p className="gp-taudit">PGCB Daily Operations Report, zone-wise generation summary · Reproduced as published. Not audited by ESB PowerLine.</p>
                    </>,
                  )
                }
              />
            ))}
          </div>
          <div className="gp-hint">Share is derived (D) · energy is published (P) · tap a fuel for its figures</div>
        </>
      )}
      <Foot
        lead="Source: PGCB Daily Report — P1 sheet, zone-wise generation summary"
        rest={[
          files?.pgcb ? <>Read from: PGCB <code>{files.pgcb}</code></> : null,
          'Per-fuel energy as published; total and shares are ours. Not independently audited.',
          `Reporting Date: ${day.systemStats.date}`,
        ]}
      />
    </Section>
  );
}

export function TodayCostCard() {
  const { day } = usePhone();
  const open = useSheet();
  const s = day.systemStats;
  const pal = fuelPalette(day);
  const gd = day.generationData ?? [];
  const costed = gd.filter((g) => isNum(g.cost) && g.cost > 0);
  const hasCost = gd.some((g) => g.cost != null);
  const totalBdt = gd.reduce((a, g) => a + (g.cost || 0), 0);
  const [pick, setPick] = useState<number | null>(null);
  const colour = (g: (typeof gd)[number]) => g.color || pal[g.name] || 'var(--gp-primary)';
  const files = day.sourceFiles;
  const sel = pick != null ? costed[pick] : null;
  const detail = (g: (typeof gd)[number]) =>
    open(
      <>
        <h3>{g.name} daily cost</h3>
        <p className="gp-sheet__sub">Published cost · {s.date}</p>
        <div className="gp-rows">
          <Row name={<>Total daily cost <span className="gp-u">P</span></>} value={(g.cost! / 1e7).toFixed(2)} small="Crore BDT" />
          {isNum(g.unitCost) && <Row name={<>Average unit rate <span className="gp-u">D</span></>} value={formatUnitRate(g.unitCost)} small="Tk/kWh" />}
        </div>
        <p>Unit rate = cost ÷ (gen × 10⁶), calculated here.</p>
        <p className="gp-taudit">PGCB daily report, “Cost of the Consumed Fuel” block · Restates BPDB fuel economics. Not audited by ESB PowerLine.</p>
      </>,
    );

  return (
    <Section
      title="Daily fuel & import cost"
      desc={
        <>
          Cost in crore taka by fuel ·{' '}
          {hasCost ? <>total <b style={{ color: 'var(--gp-on)' }}>{(totalBdt / 1e7).toFixed(2)} Cr</b> <span className="gp-u">(our sum, D)</span></> : 'per-fuel split not published for this day'}
          <br />
          {coverageLabel('fuelCost')}
        </>
      }
    >
      {costed.length === 0 ? (
        <div className="gp-empty" style={{ minHeight: 110 }}>
          <div>
            <b style={{ color: 'var(--gp-on)' }}>Per-fuel cost not published for this day</b>
            <br />
            PGCB’s report for this date carries no production-cost breakdown by fuel.
            {isNum(s.totalDailyCost) && s.totalDailyCost > 0 ? <> The published day total — {(s.totalDailyCost / 1e7).toFixed(2)} Cr Tk. — is shown above.</> : null}
          </div>
        </div>
      ) : (
        <>
          <div className="gp-subline" style={{ marginTop: 0 }}>
            {sel ? (
              <>
                <b>{sel.name}</b> {(sel.cost! / 1e7).toFixed(2)} Cr{isNum(sel.unitCost) ? <> · {formatUnitRate(sel.unitCost)} Tk/kWh</> : null}
              </>
            ) : (
              'Tap a bar to read it'
            )}
          </div>
          <Bars ariaLabel="Daily cost by fuel, crore taka" values={costed.map((g) => g.cost! / 1e7)} labels={costed.map((g) => g.name)} colors={costed.map(colour)} highlight={pick} onPick={(i) => setPick((p) => (p === i ? null : i))} height={200} valueLabels dp={1} />
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {costed.map((g) => (
              <Row
                key={g.name}
                sw={colour(g)}
                name={g.name}
                sub={isNum(g.unitCost) ? `${formatUnitRate(g.unitCost)} Tk/kWh · derived (D)` : 'unit rate not derivable'}
                value={(g.cost! / 1e7).toFixed(2)}
                small="Crore BDT"
                chevron
                onClick={() => detail(g)}
              />
            ))}
          </div>
        </>
      )}
      <div className="gp-stats" style={{ marginTop: 16 }}>
        <Stat label="Avg production cost" value={isNum(s.avgProductionCost) && s.avgProductionCost > 0 ? s.avgProductionCost : null} unit="Tk/kWh" dp={2} prov="D" note="The day’s fuel bill divided by its energy. PGCB prints the bill, not this rate." />
        <Stat label="Total gas to power" value={s.totalGasSuppliedPower > 0 ? s.totalGasSuppliedPower : null} unit="MMCFD" dp={2} prov="P" detail="the power sector’s share, not national supply" />
      </div>
      <Foot
        lead="Source: PGCB Daily Report — P1 sheet, production-cost block and gas-supplied line"
        rest={[
          files?.pgcb ? <>Read from: PGCB <code>{files.pgcb}</code></> : null,
          'Restates BPDB fuel economics. Unit rates are ours. Not independently audited.',
          `Reporting Date: ${s.date}`,
        ]}
      />
    </Section>
  );
}
