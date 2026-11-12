'use client';

/**
 * The slots the desktop mounts between a tab's KPI strip and its first card:
 * what "this day" covers per publisher (GridDayWindows) and where each figure
 * comes from / why two totals differ (MethodologyReconciliationBanner).
 * Prose lives behind two sheet rows rather than inline.
 */

import { formatWindow, type ObservationWindow, petrobanglaGasDay, pgcbEnergyDay, pgcbFiledAs } from '@/lib/data/grid/observation-window';
import { fmt } from './charts';
import { usePhone } from './context';
import { isNum, Prov, nbDate } from './shared';
import { KV, useNote } from './supply-bits';

export function DaySlots() {
  const { day, date } = usePhone();
  const note = useNote();
  const gen = day.generationData ?? [];
  const ss = day.systemStats;
  const totalGen = gen.reduce((a, g) => a + (isNum(g.gen) ? g.gen : 0), 0);
  const hasCost = gen.some((g) => g.cost != null);
  const totalCost = gen.reduce((a, g) => a + (g.cost ?? 0), 0);
  const net = ss.totalEnergyGen;
  const genGap = isNum(net) ? totalGen - net : null;
  const costNet = ss.totalDailyCost;
  const costGap = isNum(costNet) && hasCost ? (totalCost - costNet) / 1e7 : null;
  const mkwh = (v: number | null | undefined) => (isNum(v) ? `${fmt(v, 2)} MKWh` : '—');

  const ow = day.observationWindows;
  const pgcbRow = pgcbEnergyDay(date, ow?.pgcb?.sourceFile ?? undefined);
  const pb = ow?.petrobangla;
  const pbWin: ObservationWindow = pb
    ? { publisher: 'Petrobangla' as const, start: pb.start, end: pb.end, anchorDay: date, publishedLabel: pb.publishedLabel ?? undefined, sourceFile: pb.sourceFile ?? undefined }
    : petrobanglaGasDay(date);

  const openWindows = () =>
    note(
      <>What “{nbDate(date)}” covers</>,
      <>
        <p style={{ marginTop: 0 }}>Each agency measures a different 24 hours: PGCB’s energy day runs midnight to midnight, Petrobangla’s gas day 08:00 to 08:00, so they share only 16 of their 24 hours.</p>
        <KV
          label="PGCB · Energy day"
          value={<span className="num" style={{ fontSize: 13 }}>{formatWindow(pgcbRow, { offset: false })}</span>}
          sub={<>Filed under {ow?.pgcb?.filedAs ?? pgcbFiledAs(date)}{ow?.pgcb?.sourceFile ? <> · <code>{ow.pgcb.sourceFile}</code></> : <> · nothing held for this day; no figures here come from PGCB</>}</>}
        />
        <KV
          label="Petrobangla · Gas day"
          value={<span className="num" style={{ fontSize: 13 }}>{formatWindow(pbWin, { offset: false })}</span>}
          sub={pb ? <>{pb.publishedLabel ? `Printed as ${pb.publishedLabel} · ` : ''}filed under {pb.filedAs}{pb.sourceFile ? <> · <code>{pb.sourceFile}</code></> : null}</> : <>Nothing held for this day; no figures on this screen come from Petrobangla.</>}
        />
      </>,
    );

  const openMethod = () =>
    note(
      'Where each figure comes from',
      <>
        <p style={{ marginTop: 0 }}>
          Every figure carries a mark. <Prov kind="P" /> means PGCB, Petrobangla or SREDA states the number and we reproduce it unchanged. <Prov kind="D" /> means we calculated it from published figures — a sum, a share, an average or a subtraction the source does not itself print. <b>No figure here is independently audited</b>, by us or by anyone whose report we hold.
        </p>
        <p><b>1. Two generation totals.</b> The headline is PGCB’s own energy figure <Prov kind="P" />; the fuel-mix total is our sum of the per-fuel rows <Prov kind="D" />. Both are printed on the same report, and PGCB does not state they must agree.</p>
        <KV label="Published headline" value={mkwh(net)} />
        <KV label="Sum of fuel rows" value={mkwh(totalGen)} />
        <KV label="This day" value={genGap == null ? '—' : Math.abs(genGap) >= 0.05 ? `Unexplained residual ${genGap > 0 ? '+' : '−'}${fmt(Math.abs(genGap), 2)} MKWh (${net ? fmt((Math.abs(genGap) / net) * 100, 2) : '—'}%)` : 'The two agree'} />
        <p><b>2. Two cost totals.</b> The fuel bill is the Total row PGCB prints at the foot of its production-cost block <Prov kind="P" />; the sum of per-fuel costs is ours <Prov kind="D" />.</p>
        <KV label="Published total" value={isNum(costNet) ? `${fmt(costNet / 1e7, 2)} Cr BDT` : '—'} />
        <KV label="Sum of fuel costs" value={hasCost ? `${fmt(totalCost / 1e7, 2)} Cr BDT` : '—'} />
        <KV label="This day" value={costGap == null ? '—' : Math.abs(costGap) >= 0.005 ? `Unexplained residual ${costGap > 0 ? '+' : '−'}${fmt(Math.abs(costGap), 2)} Cr BDT` : 'The two agree'} />
        <p><b>A headline is not a sum.</b> PGCB states a day total and, separately, a fuel breakdown. Nothing in the report claims the second adds to the first, and on most days it very nearly does.</p>
        <p><b>A large residual is a defect signal.</b> Where the gap runs to whole percent, the likelier cause is a fuel row this archive failed to read than anything physical — 2019-07-28 is missing its gas and coal rows and shows a 68% gap. Treat a wide residual as a reason to distrust the breakdown, not as a measurement.</p>
        <p><b>We do not attribute it.</b> Station auxiliary use and transmission loss are real quantities, but PGCB does not publish them on this report and we cannot derive them from it.</p>
      </>,
    );

  return (
    <div className="gp-rows" style={{ marginTop: 'var(--s4)' }}>
      <button type="button" className="gps-link" onClick={openWindows} style={{ padding: 'var(--s3) var(--s4)' }}>
        <span>What “{nbDate(date)}” covers<small>Each agency measures a different 24 hours</small></span>
        <span className="gp-chev">›</span>
      </button>
      <button type="button" className="gps-link" onClick={openMethod} style={{ padding: 'var(--s3) var(--s4)' }}>
        <span>Where each figure comes from<small>Why two totals on this page can differ</small></span>
        <span className="gp-chev">›</span>
      </button>
    </div>
  );
}
