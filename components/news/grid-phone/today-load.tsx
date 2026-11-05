'use client';

/**
 * Overview card 1 beside the hero chart: what the 24-hour curve is made of —
 * its key (every entry with its P/D mark), the half-hour samples, the
 * operational-insights sentence, the explanation glossary and the footer.
 */

import { coverageLabel } from '@/lib/data/grid/coverage';
import { fmt } from './charts';
import { usePhone } from './context';
import { isNum, Prov, Row, Section, wholeHours } from './shared';
import { Foot, HowTo, Term } from './today-util';

/** The three layouts the sheet comes in, as the desktop card tells them apart. */
export function loadLayout(rows: { demand: number | null; loadShed: number | null }[]) {
  const curveIsHourly = rows.length > 0 && rows.every((h) => isNum(h.demand));
  const sheddingIsHourly = rows.filter((h) => isNum(h.loadShed)).length > 1;
  return { curveIsHourly, sheddingIsHourly };
}

export function TodayLoadNotes() {
  const { day } = usePhone();
  const s = day.systemStats;
  const all = day.hourlyLoadData ?? [];
  const hours = wholeHours(all);
  const half = all.filter((r) => !r.time.endsWith(':00'));
  const { curveIsHourly, sheddingIsHourly } = loadLayout(all);
  const files = day.sourceFiles;

  const maxOf = <T,>(rows: T[], pick: (r: T) => number | null | undefined) => {
    let best: { v: number; r: T } | null = null;
    for (const r of rows) {
      const v = pick(r);
      if (isNum(v) && (!best || v > best.v)) best = { v, r };
    }
    return best;
  };
  const peakGen = maxOf(all, (r) => r.generation);
  const peakDem = maxOf(all, (r) => r.demand);
  const widest = maxOf(all, (r) => (isNum(r.demand) && isNum(r.generation) ? r.demand - r.generation : null));
  const worstShed = maxOf(all, (r) => r.loadShed);
  const anyShedPublished = all.some((r) => isNum(r.loadShed));
  const showShedding = (worstShed?.v ?? 0) > 0;
  const peakRow = all.find((r) => isNum(r.demand) || isNum(r.loadShed)) ?? null;

  // Whole hours only, so the count, the denominator and the MWh total describe the same thing.
  const shedHours = hours.filter((h) => (h.loadShed ?? 0) > 0);
  const worstWhole = shedHours.length ? [...shedHours].sort((a, b) => (b.loadShed ?? 0) - (a.loadShed ?? 0))[0] : null;
  const shedMwh = sheddingIsHourly && hours.length >= 24 ? hours.reduce((a, h) => a + (h.loadShed ?? 0), 0) : 0;

  const sub = curveIsHourly
    ? 'Generation, demand and load shedding for every hour PGCB publishes, from the NLDC hourly report'
    : sheddingIsHourly
      ? 'Hourly generation and load shedding from the NLDC hourly report; demand as published for the evening peak hour'
      : 'Hourly generation from the NLDC load curve; demand and load shedding as published for the evening peak hour';

  if (all.length === 0) {
    return (
      <Section title="24-hour generation, demand & load shed" desc={coverageLabel('loadCurve')}>
        <div className="gp-empty" style={{ minHeight: 120 }}>
          <div>
            <b style={{ color: 'var(--gp-on)' }}>No load curve published for this day</b>
            <br />
            PGCB’s report for {s.date} does not include the half-hourly NLDC load-curve sheet. Daily totals and peaks above are unaffected.
          </div>
        </div>
      </Section>
    );
  }

  const insight = (
    <>
      The load curve illustrates the shape of generation across this day.
      {(curveIsHourly || sheddingIsHourly) && worstWhole ? (
        <>
          {' '}Load was shed in <b>{shedHours.length} of the {hours.length} published hours</b>, worst at <b>{worstWhole.time} Hr</b> with <b>{fmt(Math.round(worstWhole.loadShed ?? 0))} MW</b> unserved
          {shedMwh > 0 && <> — around <b>{fmt(Math.round(shedMwh))} MWh</b> across the day, taking each hourly figure as the rate for that hour.</>}
        </>
      ) : curveIsHourly || sheddingIsHourly ? (
        ' No load shedding was recorded in any published hour of this day.'
      ) : peakRow && isNum(peakRow.demand) ? (
        <>
          {' '}At the evening peak (<b>{peakRow.time} Hr</b>) PGCB reported demand of <b>{fmt(Math.round(peakRow.demand))} MW</b>
          {isNum(peakRow.loadShed) && peakRow.loadShed > 0 ? <> against <b>{fmt(Math.round(peakRow.loadShed))} MW</b> of load shedding.</> : ' with no load shedding recorded.'}
        </>
      ) : (
        ' This report does not publish an evening-peak demand or load-shedding figure.'
      )}
    </>
  );

  return (
    <Section title="24-hour generation, demand & load shed" desc={<>{sub} · {coverageLabel(curveIsHourly || sheddingIsHourly ? 'hourlyShedding' : 'loadCurve')}</>}>
      <div className="gp-rows">
        <Row
          top
          sw="var(--gp-primary)"
          name={<>Generation <Prov kind="P" /></>}
          sub={peakGen ? `peak ${fmt(peakGen.v)} MW · ${peakGen.r.time}` : 'not published'}
        />
        <Row
          top
          sw="var(--gp-demand)"
          name={<>Demand <Prov kind="P" /></>}
          sub={peakDem ? `${curveIsHourly ? 'peak' : 'evening peak only,'} ${fmt(peakDem.v)} MW · ${peakDem.r.time}` : 'not published'}
        />
        <Row
          top
          sw="var(--gp-bad)"
          name={<>Unmet demand <Prov kind="D" note="Demand minus generation for the hour — our subtraction, not a figure PGCB states." /></>}
          sub={widest && widest.v > 0 ? `widest ${fmt(Math.round(widest.v))} MW · ${widest.r.time}` : widest ? 'none at any hour where both are published' : 'needs demand and generation in the same hour'}
        />
        <Row
          top
          sw="var(--gp-bad)"
          name={<>Load shed, by hour <Prov kind="P" /></>}
          sub={!anyShedPublished ? 'not published' : showShedding ? `worst ${fmt(Math.round(worstShed!.v))} MW · ${worstShed!.r.time}` : 'none reported all day'}
        />
        {half.length > 0 && (
          <Row
            top
            sw="#d4a017"
            name={half.length > 1 ? 'Half-hour samples' : `${half[0].time} sample`}
            sub={
              <>
                PGCB’s extra half-hour {half.length > 1 ? 'readings' : 'reading'}
                {half.map((r) => (
                  <div key={r.time}>
                    {r.time} · generation {fmt(r.generation)}
                    {isNum(r.demand) ? ` · demand ${fmt(r.demand)}` : ''}
                    {isNum(r.loadShed) ? ` · shed ${fmt(r.loadShed)}` : ''} MW
                  </div>
                ))}
              </>
            }
          />
        )}
      </div>

      {showShedding && (
        <p className="gp-taudit" style={{ marginTop: 12 }}>
          The band between the two curves is demand the grid did not meet. <b style={{ color: 'var(--gp-bad)' }}>Load shedding</b> below it is PGCB’s own published figure for each hour, drawn against the worst hour of the day rather than a megawatt scale of its own.
        </p>
      )}

      <p className="gp-taudit" style={{ color: 'var(--gp-on)' }}>
        <b>Operational insights</b> <Prov kind="D" note="The hour counts and totals are ours, counted and summed from the hours PGCB states." /> {insight}
      </p>

      <HowTo title="What is being shown?" label="What is being shown?">
        {curveIsHourly ? (
          <>
            <p>
              Everything on this chart comes from one sheet — PGCB’s hourly demand, generation and load-shed table — which states each figure for every hour it publishes. Most days carry <b>25 readings, not 24</b>: the twenty-four hours plus a half-hour sample at 19:30 taken across the evening-peak window.
            </p>
            <dl className="gp-tdl">
              <Term name="Generation" kind="P" color="var(--gp-primary)">The megawatts actually produced and delivered at that moment — the blue mass. This is what the country <em>had</em>.</Term>
              <Term name="Demand" kind="P" color="var(--gp-demand)">
                What the country <em>asked for</em> — the amber line. PGCB publishes this column, but it is not measured independently: across all 3,600 hourly rows of 2026 it equals <em>generation + 1.045 × load shed</em>, to within a megawatt. The 4.5% is a network-loss allowance — shedding is counted where consumers are, generation where the plants are — so demand is reconstructed on the generation side of the network rather than metered at the door.
              </Term>
              <Term name="Unmet demand" kind="D" color="var(--gp-bad)">
                The shaded band between the two curves: demand minus generation. It is the electricity the country asked for and did not get. This is our subtraction, not a figure PGCB states — and because demand is built from the shed column, the band is the same quantity as the strip below it, 4.5% larger. It is drawn because a shortfall is easier to judge as a gap between two lines than as a number in a table.
              </Term>
              {showShedding ? (
                <Term name="Load shed, by hour" kind="P" color="var(--gp-bad)">
                  PGCB’s own third column, along the foot: load the grid deliberately disconnected because it could not supply it. This is the published figure and the one to quote. Bars are sized against the day’s worst hour, so the strip shows shape and severity rather than a second megawatt scale. A flat grey stub means an hour PGCB reported as <em>none</em>; a gap in the baseline means an hour it did not report at all.
                </Term>
              ) : (
                <Term name="Load shed, by hour" color="var(--gp-bad)">Nothing to show: this report states no load shedding in any hour of this day, which is why the two curves meet all the way across.</Term>
              )}
              <Term name="19:30 sample" color="#b58900">
                The gold reading. PGCB takes one extra reading half an hour before the evening-peak hour, so it sits closer to its neighbours than the rest. It is a reading like any other, not a separate series — listed apart here so its spacing does not read as a mistake.
              </Term>
            </dl>
          </>
        ) : sheddingIsHourly ? (
          <p>
            The <b>generation</b> curve is read from PGCB’s hourly station log, which carries a national total and a shortage figure at every hourly stamp
            {showShedding ? <>; the <b>load shedding</b> strip along the foot is that shortage column, sized against the day’s worst hour.</> : <>, and records no shortage in any hour of this day.</>} That sheet publishes no demand column, so <b>demand</b> is the evening-peak figure from the report’s front page and appears as a single reading rather than a curve.
          </p>
        ) : (
          <p>
            The hourly <b>generation</b> curve is the NLDC load-curve sheet, logged every half hour. <b>Total demand</b>
            {showShedding ? <> and the <b>load shedding deficit</b> are published for the evening peak hour only on this report’s layout, so they appear as single readings rather than continuous lines, and the shortfall band is drawn only where both were measured.</> : <> is published for the evening peak hour only on this report’s layout, so it appears as a single reading rather than a continuous line.</>}
          </p>
        )}
        <p><b>Reading the chart.</b> Touch and drag across the curve to read any hour; lift to clear. Tap a name under the chart to hide or show that line.</p>
      </HowTo>

      <Foot
        lead={<>Source: PGCB Daily Report — P4 sheet, hourly generation, demand and load-shed columns</>}
        rest={[
          files?.pgcb ? <>Read from: PGCB <code>{files.pgcb}</code></> : null,
          'Hourly figures as published; hour counts and day totals are ours. Not independently audited.',
          `Reporting Period: 24-Hour SCADA Log (Date: ${s.date})`,
        ]}
      />
    </Section>
  );
}
