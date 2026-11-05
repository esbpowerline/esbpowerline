'use client';

/**
 * The day-status notices and the three shared tab slots (day windows,
 * provenance, methodology) as one compact row that opens a sheet. The row
 * carries amber tags only when something needs saying; the sheet holds the
 * whole of each notice, in the desktop's own words.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { assessFreshness } from '@/lib/data/grid/ingest-freshness';
import { loadNoSourceDays } from '@/lib/data/grid/no-source-days.client';
import { BST_OFFSET_LABEL, formatWindow, petrobanglaGasDay, pgcbEnergyDay, pgcbFiledAs } from '@/lib/data/grid/observation-window';
import { emptyTabs, tabAvailability, type GridTabId } from '@/lib/data/grid/tab-availability';
import { describeDayProvenance, provenanceNeedsDisclosure, type DayProvenance } from '@/lib/data/grid/verification-ledger';
import { usePhone } from './context';
import { isNum, Prov, useSheet } from './shared';
import { Term } from './today-util';

const TAB_ORDER: GridTabId[] = ['overview', 'regional', 'gas', 'gen', 'plants', 'imports', 'renewables', 'macro', 'transmission'];
const TAB_LABEL: Record<GridTabId, string> = {
  overview: 'Overview',
  regional: 'Regional Grid',
  gas: 'Gas & LNG Supply',
  gen: 'Generation & Cost',
  plants: 'Power Stations',
  imports: 'C/B Imports',
  renewables: 'Renewables',
  macro: 'Macro Trends',
  transmission: 'Technical Information',
};

const H = ({ children }: { children: ReactNode }) => (
  <div className="gp-tsub" style={{ marginTop: 20 }}>
    <h3>{children}</h3>
  </div>
);

export function TodayStatus() {
  const phone = usePhone();
  const { date, day, latestDate } = phone;
  const open = useSheet();
  const [noSource, setNoSource] = useState(false);
  useEffect(() => {
    let live = true;
    loadNoSourceDays().then((d) => live && setNoSource(Boolean(d?.includes(date))));
    return () => {
      live = false;
    };
  }, [date]);

  const s = day.systemStats;
  const fresh = assessFreshness(latestDate);
  const lagging = fresh && fresh.level !== 'current';
  const absent = emptyTabs(tabAvailability(day), TAB_ORDER);
  // The verification ledger is server-side; the shell may hand the day's provenance down.
  const prov: DayProvenance | null = phone.provenance ?? null;
  const provNeeds = prov ? provenanceNeedsDisclosure(prov) : false;
  const flags = (noSource ? 1 : 0) + (lagging ? 1 : 0) + (provNeeds ? 1 : 0);

  const pgw = day.observationWindows?.pgcb;
  const pbw = day.observationWindows?.petrobangla;
  const gen = day.generationData ?? [];
  const gas = day.gasProductionData ?? [];
  const hasGas = gas.reduce((a, g) => a + (g.gas || 0), 0) > 0;
  const sumGen = gen.reduce((a, g) => a + (g.gen || 0), 0);
  const sumCost = gen.reduce((a, g) => a + (g.cost || 0), 0);

  const show = () => {
    const pgcbFile = pgw?.sourceFile ?? day.sourceFiles?.pgcb;
    const pgcbWin = pgcbEnergyDay(date, pgcbFile ?? undefined);
    const gasWin = petrobanglaGasDay(date);
    const gasWindowText = pbw
      ? formatWindow({ publisher: 'Petrobangla', start: pbw.start, end: pbw.end, anchorDay: date }, { offset: false })
      : formatWindow(gasWin, { offset: false });
    const gasFiled = pbw?.filedAs ?? gasWin.end!.slice(0, 10);
    const genGap = isNum(s.totalEnergyGen) ? sumGen - s.totalEnergyGen : null;
    const costNet = isNum(s.totalDailyCost) && s.totalDailyCost > 0 ? s.totalDailyCost / 1e7 : null;
    const costGross = sumCost / 1e7;
    const costGap = costNet != null ? costGross - costNet : null;
    const genMaterial = genGap != null && Math.abs(genGap) >= 0.05;
    const costMaterial = costGap != null && Math.abs(costGap) >= 0.005;
    const sg = (n: number, dp: number) => `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(dp)}`;

    open(
      <>
        <h3>About this day</h3>
        <p className="gp-sheet__sub">{date} · what it covers, where it comes from, what it lacks</p>

        {noSource && (
          <div className="gp-tnote">
            <b>No published source has been found for {date}.</b> No daily report for this date is held here, and PGCB’s published archive index carries no entry for it. Everything shown is reproduced as it stands and has not been checked against a source document. Nothing has been assumed, reconstructed or carried over from a neighbouring day to fill the gap.
          </div>
        )}
        {lagging && fresh && (
          <div className="gp-tnote" style={fresh.level === 'lagging' ? { background: 'var(--gp-surface2)' } : undefined}>
            <b style={fresh.level === 'lagging' ? { color: 'var(--gp-on)' } : undefined}>Archive is {fresh.daysBehind} days behind.</b> {fresh.note}
          </div>
        )}

        <div className="gp-tsub" style={{ marginTop: 8, borderTop: 0, paddingTop: 0 }}>
          <h3>What “{date}” covers</h3>
          <p>Each agency measures a different 24 hours.</p>
        </div>
        <dl className="gp-tdl" style={{ marginTop: 12 }}>
          <Term name="PGCB">
            {pgcbFile ? (
              <>
                <b style={{ color: 'var(--gp-on)' }}>Energy day:</b> {formatWindow(pgcbWin, { offset: false })}
                {(pgw?.filedAs ?? pgcbFiledAs(date)) !== date && <> · filed by PGCB under {pgw?.filedAs ?? pgcbFiledAs(date)}</>}
                <br />
                <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{pgcbFile}</code>
              </>
            ) : (
              <>
                <b style={{ color: 'var(--gp-warn)' }}>Nothing held for this day.</b> An energy day would run {formatWindow(pgcbWin, { offset: false })}; no figures on this page come from PGCB.
              </>
            )}
          </Term>
          <Term name="Petrobangla">
            {hasGas || pbw ? (
              <>
                <b style={{ color: 'var(--gp-on)' }}>Gas day:</b> {gasWindowText}
                {pbw?.publishedLabel ? <> · printed as {pbw.publishedLabel}</> : null}
                {gasFiled !== date && <> · filed by Petrobangla under {gasFiled}</>}
                {(pbw?.sourceFile ?? day.sourceFiles?.petrobangla) && (
                  <>
                    <br />
                    <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{pbw?.sourceFile ?? day.sourceFiles?.petrobangla}</code>
                  </>
                )}
              </>
            ) : (
              <>
                <b style={{ color: 'var(--gp-warn)' }}>Nothing held for this day.</b> A gas day would run {formatWindow(gasWin, { offset: false })}; no figures on this page come from Petrobangla.
              </>
            )}
          </Term>
        </dl>
        {absent.length > 0 && (
          <>
            <H>What this day’s reports do not cover</H>
            <dl className="gp-tdl" style={{ marginTop: 8 }}>
              {absent.map((t) => (
                <Term key={t.id} name={TAB_LABEL[t.id]}>{t.reason}</Term>
              ))}
            </dl>
          </>
        )}
        <p className="gp-taudit">
          All times {BST_OFFSET_LABEL} (Bangladesh Standard Time). A record is shown on the calendar day its window <b>opens</b>, which is why the evening peak and the gas that fuelled it appear together — the peak falls inside the 08:00-to-08:00 gas day. The two windows overlap for 16 of their 24 hours, so a PGCB total and a Petrobangla total are not measurements of the same period and are not differenced anywhere on this page.
        </p>

        <H>Source verification</H>
        {prov ? (
          <p style={{ marginTop: 6 }}>
            <b>
              {prov.verdict === 'INDICATOR' || prov.verdict === 'HASH'
                ? 'This day disagrees with its source. '
                : prov.duplicateSuspect
                  ? `Unverified — identical to ${prov.duplicateSuspect}. `
                  : !prov.verified
                    ? 'Not re-checked against the source document. '
                    : prov.reconstructed
                      ? 'Verified — read by a reconstructed parser. '
                      : 'Verified against the source document. '}
            </b>
            {prov.summary}
          </p>
        ) : (
          <p style={{ marginTop: 6 }}>This view does not carry the source-verification ledger yet, so it cannot say whether this day has been re-checked against its document. Nothing is implied either way.</p>
        )}

        <H>Where each figure comes from</H>
        <p style={{ marginTop: 6 }}>
          Every figure carries a mark. <Prov kind="P" /> means PGCB, Petrobangla or SREDA states the number and we reproduce it unchanged. <Prov kind="D" /> means we calculated it from published figures — a sum, a share, an average or a subtraction that the source does not itself print. <b>No figure on this page is independently audited</b>, by us or by anyone whose report we hold; we reproduce daily operational reports as published.
        </p>
        <dl className="gp-tdl">
          <Term name="1. Two generation totals">
            The <b>Energy generated</b> figure is PGCB’s own headline <Prov kind="P" />. The <b>Daily generation mix</b> total is our sum of the per-fuel rows in the zone-wise table <Prov kind="D" />. Both are printed on the same report, and PGCB does not state that they must agree.
          </Term>
        </dl>
        <div className="gp-tmono">
          <div>Published headline = {isNum(s.totalEnergyGen) ? `${s.totalEnergyGen.toFixed(2)} MKWh` : 'not published'}</div>
          <div>Sum of fuel rows = {sumGen.toFixed(2)} MKWh</div>
          <b>{genGap == null ? 'No headline to set the sum against' : genMaterial ? `Unexplained residual = ${sg(genGap, 2)} MKWh (${s.totalEnergyGen ? ((Math.abs(genGap) / s.totalEnergyGen) * 100).toFixed(2) : '—'}%)` : 'The two agree for this day'}</b>
        </div>
        <dl className="gp-tdl">
          <Term name="2. Two cost totals">
            The <b>Production cost</b> figure is the <code>Total :</code> row PGCB prints at the foot of its production-cost block <Prov kind="P" />. The <b>Daily fuel &amp; import cost</b> header adds up the per-fuel bars <Prov kind="D" />.
          </Term>
        </dl>
        <div className="gp-tmono">
          <div>Published total = {costNet != null ? `${costNet.toFixed(2)} Cr BDT` : 'not published'}</div>
          <div>Sum of fuel costs = {costGross.toFixed(2)} Cr BDT</div>
          <b>{costGap == null ? 'No published total to set the sum against' : costMaterial ? `Unexplained residual = ${sg(costGap, 2)} Cr BDT` : 'The two agree for this day'}</b>
        </div>
        <H>What a residual can and cannot tell you</H>
        <dl className="gp-tdl" style={{ marginTop: 8 }}>
          <Term name="A headline is not a sum">PGCB states a day total and, separately, a fuel breakdown. Nothing in the report claims the second adds to the first, and on most days it very nearly does. A small residual is the normal state of two independently stated figures.</Term>
          <Term name="A large residual is a defect signal">Where the gap runs to whole percent, the likelier cause is a fuel row this archive failed to read than anything physical — 2019-07-28 is missing its gas and coal rows and shows a 68% gap. Treat a wide residual as a reason to distrust the breakdown, not as a measurement.</Term>
          <Term name="We do not attribute it">Station auxiliary use and transmission loss are real quantities, but PGCB does not publish them on this report and we cannot derive them from it. This note previously named them as the cause; it no longer does, because that was an explanation the data did not support.</Term>
        </dl>
        <p className="gp-taudit">
          <b>This day:</b> on <b>{s.date}</b>, {genGap == null ? 'there is no published headline to compare the fuel-mix sum with.' : genMaterial ? <>the fuel-mix sum and the published headline differ by <b>{Math.abs(genGap).toFixed(2)} MKWh</b> ({s.totalEnergyGen ? ((Math.abs(genGap) / s.totalEnergyGen) * 100).toFixed(2) : '—'}%), which this page does not attribute to a cause.</> : <>the fuel-mix sum and the published headline agree to <b>{Math.abs(genGap).toFixed(2)} MKWh</b> — there is no discrepancy to explain.</>}
        </p>
      </>,
    );
  };

  return (
    <button type="button" className="gp-tstatus" onClick={show}>
      <div className="gp-tstatus__main">
        <b>About this day</b>
        <span>
          PGCB 00:00→24:00 · gas 08:00→08:00
          {absent.length > 0 && ` · ${absent.length} part${absent.length === 1 ? '' : 's'} not published`}
        </span>
        {flags > 0 && (
          <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {noSource && <span className="gp-tag warn">No source found</span>}
            {lagging && fresh && <span className="gp-tag warn">{fresh.daysBehind} days behind</span>}
            {provNeeds && prov && <span className="gp-tag warn">{prov.verified ? 'Check source note' : 'Not re-checked'}</span>}
          </div>
        )}
      </div>
      <span className="gp-tstatus__go" aria-hidden>›</span>
    </button>
  );
}
