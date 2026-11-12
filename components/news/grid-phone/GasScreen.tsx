'use client';

import { useState, type ReactNode } from 'react';
import '@/app/grid-phone-gas.css';
import { usePhone } from './context';
import { fmt, LineChart, Meter, StackBar } from './charts';
import { dm, Empty, isNum, Prov, Row, Section, Stat, useSheet, wd, nbDate } from './shared';
import { distColor, gasKpis, GlossarySheet, DistributionSheet, prodColor, ProductionSheet, useGasFeed, type GasFeed } from './gas-detail';
import { distributionCompanyForLabel, productionFieldsForLabel, cleanFieldName } from '@/components/news/power-grid/PetrobanglaSectionDetail';
import { coverageLabel } from '@/lib/data/grid/coverage';
import { petrobanglaFiledAs, petrobanglaGasDay } from '@/lib/data/grid/observation-window';
import { getDistributionGrandTotal } from '@/lib/data/petrobangla/compute';

type View = 'today' | 'production' | 'distribution';
const Daily = () => <span className="gp-tag">Daily</span>;
const strip = (s: string) => s.replace(/^\d+\.\s*/, '');
const SRC = 'https://www.petrobangla.org.bd/';
const Link = ({ children }: { children: ReactNode }) => <a href={SRC} target="_blank" rel="noopener noreferrer">{children}</a>;

/**
 * Petrobangla's gas day opens 08:00 on the energy day and closes 08:00 the next
 * (observation-window.ts, L1); its PDF is named for the morning it closes. The
 * tables here are the desktop's: the day payload's rows, the archive day for
 * detail, and the nearest earlier report when Petrobangla has not filed yet.
 */
export function GasScreen() {
  const { date, day, week, weekDates } = usePhone();
  const feed = useGasFeed(date, day);
  const [view, setView] = useState<View>('today');

  if (date < '2020-01-12') {
    return (
      <div className="gp-screen">
        <Empty title="Petrobangla Gas Production & Distribution Data" why={<>No official records are available for the selected date. Petrobangla gas production tracking officially started on January 12, 2020.<br /><span className="gpg-sub">Official Backlog Start Date: January 12, 2020</span></>} />
      </div>
    );
  }
  if (!(day.gasProductionData ?? []).length) {
    return (
      <div className="gp-screen">
        <Empty title="Petrobangla Gas & LNG Supply" why="PGCB grid data is available for this date, but Petrobangla production and distribution tables are missing from the daily record. Re-run the official ingest when Petrobangla reports are online." />
      </div>
    );
  }
  if (feed.totalGas <= 0) {
    return (
      <div className="gp-screen">
        <Empty title="Gas & LNG supply" why={<>Awaiting Petrobangla. Its report for the gas day opening 08:00 on {dm(date)} is filed on {dm(petrobanglaFiledAs(date))}, after PGCB’s figures for the same day, and none is held yet. Nothing is shown in its place.</>} />
      </div>
    );
  }

  return (
    <div className="gp-screen">
      <div className="gp-seg gp-seg--sticky" role="tablist" aria-label="Gas view">
        {([['today', 'Overview'], ['production', 'Production'], ['distribution', 'Distribution']] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => setView(id)}>{l}</button>
        ))}
      </div>
      {view === 'today' && <Overview feed={feed} />}
      {view === 'production' && <Production feed={feed} />}
      {view === 'distribution' && <Distribution feed={feed} />}
    </div>
  );

}

/** The desktop's report caption, as a phone line. */
function Caption({ feed }: { feed: GasFeed }) {
  const { date } = usePhone();
  const a = feed.archive;
  if (!a || !feed.gasDay) return null;
  const keyed = a.report.gas_day_start === feed.gasDay ? 'start date' : a.report.gas_day_end === feed.gasDay ? 'end date' : 'file date';
  return (
    <p className="gpg-cap">
      <b>Report: {nbDate(a.report.report_date_label)}</b> — 8:00 AM → 8:00 AM gas day, archived under its {keyed} ({nbDate(feed.gasDay)})
      {feed.gasDay !== date && <> • nearest report to your selected date</>}
    </p>
  );
}

function Overview({ feed }: { feed: GasFeed }) {
  const { date, day, week, weekDates } = usePhone();
  const open = useSheet();
  const [scrub, setScrub] = useState<number | null>(null);
  const [allPlants, setAllPlants] = useState(false);
  const a = feed.archive;

  const weekVals = week.map((d) => {
    const s = (d?.gasProductionData ?? []).reduce((x, g) => x + (g.gas ?? 0), 0);
    return d && s > 0 ? s : null;
  });
  const shown = scrub != null ? weekVals[scrub] : feed.totalGas;

  const rows = feed.prod.filter((g) => (g.gas ?? 0) > 0);
  const lngTotal = rows.filter((g) => /RPGCL|LNG/i.test(g.company)).reduce((s, g) => s + (g.gas ?? 0), 0);
  const domTotal = rows.filter((g) => !/RPGCL|LNG/i.test(g.company)).reduce((s, g) => s + (g.gas ?? 0), 0);
  const wells = a ? (a.production?.fields ?? []).filter((f) => f.record_type === 'field' && !/sub.?total|grand.?total/i.test(f.field)).reduce((s, f) => s + (isNum(f.producing_wells) ? f.producing_wells : 0), 0) : null;

  const win = petrobanglaGasDay(feed.gasDay && feed.fallback ? feed.gasDay : date);
  const filed = petrobanglaFiledAs(feed.gasDay && feed.fallback ? feed.gasDay : date);
  const winFrom = feed.fallback && feed.gasDay ? feed.gasDay : date;
  const printed = a?.production?.grand_total?.gas_mmcfd ?? null;
  const delta = isNum(printed) ? feed.totalGas - printed : null;
  const ok = delta != null && Math.abs(delta) <= 0.5;

  const kpis = a && feed.gasDay ? gasKpis(a, feed.gasDay) : [];

  const dist = feed.dist;
  const sum = (k: 'power' | 'fertilizer' | 'others' | 'total') => dist.reduce((s, g) => s + (g[k] ?? 0), 0);
  const gt = a ? getDistributionGrandTotal(a) : null;
  const parts = [
    ['Power stations', sum('power'), gt?.power_demand_mmcfd ?? null, 'var(--gp-primary)'],
    ['Fertiliser factories', sum('fertilizer'), gt?.fertilizer_demand_mmcfd ?? null, '#22c55e'],
    ['Everyone else', sum('others'), null, '#94a3b8'],
  ] as const;
  const partsTot = sum('total') || parts.reduce((s, p) => s + p[1], 0);

  const plants = (a?.distribution?.companies ?? [])
    .flatMap((c) => (c.power_plants ?? []).map((p) => ({ ...p, company: c.company })))
    .flatMap((p) => (isNum(p.demand_mmcfd) && p.demand_mmcfd > 0 && isNum(p.supply_mmcfd) ? [{ ...p, demand: p.demand_mmcfd, supply: p.supply_mmcfd, gap: p.demand_mmcfd - p.supply_mmcfd }] : []))
    .sort((x, y) => y.gap - x.gap);
  const starved = plants.filter((p) => p.supply === 0).length;

  return (
    <>
      <Section source={<>Petrobangla Production Reports<Prov kind="P" /> · {a?.meta?.source_filename ?? 'daily gas report'}</>}>
        <div className="gp-kicker">
          <span>{scrub != null ? `Gas day opening ${wd(weekDates[scrub])} ${dm(weekDates[scrub])}` : `Gas day · ${dm(winFrom)} 08:00 → ${dm(filed)} 08:00`}</span>
          <Daily />
        </div>
        <div className="gp-hero"><b>{fmt(shown, 1)}</b><small>MMCFD</small></div>
        <div className="gp-subline">Grand total production<Prov kind="P" /> · produced at home and imported as LNG</div>
        {weekVals.filter(isNum).length > 1 && (
          <LineChart ariaLabel="Gas produced by day" labels={weekDates.map(wd)} series={[{ values: weekVals, color: '#0ea5e9', fill: true, width: 2.25 }]} aspect={0.45} minH={170} onScrub={setScrub} />
        )}
        <Caption feed={feed} />
        {feed.status === 'loading' && <p className="gpg-cap">Loading Petrobangla’s per-field report…</p>}
        {feed.status === 'none' && <p className="gpg-cap">Petrobangla’s parsed per-field report is not held for this day, so only the summary tables are shown.</p>}
        {isNum(printed) && (
          <div className="gpg-recon">
            Company rows sum<Prov kind="D" note="The company rows of Petrobangla’s production table, added." /> {fmt(feed.totalGas, 1)} vs {fmt(printed, 1)} MMCFD published by Petrobangla<Prov kind="P" />
            {ok ? <span className="gp-tag good">agrees</span> : <span className="gp-tag warn">differs by {delta! > 0 ? '+' : ''}{delta!.toFixed(1)}</span>}
            {!ok && <p className="gpg-note" style={{ marginTop: 6 }}>Petrobangla’s own grand total is the figure to trust here. The company rows are summed from the report’s per-field lines by the grid parser, and on this day that sum does not reproduce the total the same report prints.</p>}
          </div>
        )}
        <div className={`gp-stats${wells ? '' : ' gp-stats--3'}`} style={{ marginTop: 16 }}>
          <Stat label="Imported LNG" value={lngTotal || null} unit="MMCFD" dp={1} prov="D" note="Rows labelled RPGCL or LNG, added." detail={lngTotal ? `${((lngTotal / feed.totalGas) * 100).toFixed(0)}% of total` : undefined} />
          <Stat label="Home fields" value={domTotal || null} unit="MMCFD" dp={1} prov="D" note="All rows except RPGCL and LNG, added." detail={domTotal ? `${((domTotal / feed.totalGas) * 100).toFixed(0)}% of total` : undefined} />
          <Stat label="Condensate" value={feed.totalCond || null} unit="BBLD" dp={1} prov="P" />
          {wells ? <Stat label="Producing wells" value={wells} prov="D" note="Sum of each field’s producing wells as Petrobangla printed them." /> : null}
        </div>
      </Section>

      {kpis.length > 0 && (
        <Section title="Petrobangla indicators" desc="Tap one for the working and its source" meta={<Daily />}>
          <div className="gp-rows">
            {kpis.map((k) => <Row key={k.id} name={k.name} sub={k.sub} value={k.value} chevron onClick={() => open(k.sheet)} wrap />)}
          </div>
        </Section>
      )}

      {dist.length > 0 && (
        <Section title="Where it went" desc="Gas supplied to each sector" source={<>Petrobangla distribution table<Prov kind="D" note="Sector supply is the distribution rows added up. ‘Asked for’ is Petrobangla’s printed demand. ‘Everyone else’ is its others-and-supplementary column." /></>}>
          <StackBar parts={parts.map((p) => ({ key: p[0], value: p[1], color: p[3] }))} height={12} />
          <div className="gp-rows" style={{ marginTop: 8 }}>
            {parts.map(([l, sup, dem, c]) => (
              <Row key={l} sw={c} name={l}
                sub={isNum(dem) && dem > 0 ? `asked for ${fmt(dem, 1)} · got ${Math.round((sup / dem) * 100)}%` : undefined}
                value={<>{fmt(sup, 1)} <span className="gp-u">MMCFD</span></>}
                small={partsTot ? `${((sup / partsTot) * 100).toFixed(0)}% of supply` : undefined} />
            ))}
          </div>
        </Section>
      )}

      {plants.length > 0 && (
        <Section title="Power stations short of gas" desc="Gas each station got against what it asked for" meta={starved ? <span className="gp-tag bad">{starved} got none</span> : undefined} source={<>Petrobangla distribution · per-plant demand and supply<Prov kind="D" note="Shortfall is demand less supply, both as printed." /></>}>
          <div className="gp-rows">
            {(allPlants ? plants : plants.slice(0, 8)).map((p) => (
              <Row key={`${p.company}-${p.name}`} name={p.name} sub={strip(String(p.company ?? ''))} value={fmt(p.supply)} small={`of ${fmt(p.demand)} asked`} meter={<Meter value={p.supply} max={p.demand} color="#0ea5e9" />} />
            ))}
          </div>
          {plants.length > 8 && <button className="gp-more" onClick={() => setAllPlants((v) => !v)}>{allPlants ? 'Show fewer' : `All ${plants.length} stations`}</button>}
        </Section>
      )}
    </>
  );
}

function Production({ feed }: { feed: GasFeed }) {
  const { date } = usePhone();
  const open = useSheet();
  const [allFields, setAllFields] = useState(false);
  const a = feed.archive;
  const grand = a?.production?.grand_total ?? null;

  const rows = feed.prod.filter((g) => (g.gas ?? 0) > 0);
  const national = rows.reduce((s, g) => s + (g.gas ?? 0), 0);
  const lng = rows.filter((g) => /RPGCL|LNG/i.test(g.company));
  const domestic = rows.filter((g) => !/RPGCL|LNG/i.test(g.company));
  const domTotal = domestic.reduce((s, g) => s + (g.gas ?? 0), 0);
  const top = domestic.slice().sort((x, y) => (y.gas ?? 0) - (x.gas ?? 0))[0];
  const lngTotal = lng.reduce((s, g) => s + (g.gas ?? 0), 0);

  const fields = (a?.production?.fields ?? []).filter((f) => f.record_type === 'field' && !/sub.?total|grand.?total/i.test(f.field) && isNum(f.gas_mmcfd) && f.gas_mmcfd > 0).sort((x, y) => y.gas_mmcfd - x.gas_mmcfd);
  const fMax = Math.max(...fields.map((f) => Math.max(f.capacity_mmcfd || 0, f.gas_mmcfd)), 1);
  const reportDate = feed.fallback && a ? a.report.report_date_label : date;

  const explain = (
    <>
      <h3>How to read this</h3>
      <p className="gp-sheet__sub">Daily Gas &amp; Condensate Production</p>
      <p>This table displays the daily gas volume (MMCFD) and associated condensate liquids (BBLD, barrels per day) produced by local gas fields and foreign operators (Chevron, Tullow), alongside imported liquefied natural gas (LNG) regasified into the grid.</p>
      {top && national > 0 && domTotal > 0 && (
        <p><b>Reading this day:</b> {top.company} is the largest domestic producer, at {(((top.gas ?? 0) / domTotal) * 100).toFixed(1)}% of gas from Bangladeshi fields and {(((top.gas ?? 0) / national) * 100).toFixed(1)}% of the national total once imported LNG ({fmt(lngTotal, 1)} MMCFD, {((lngTotal / national) * 100).toFixed(1)}%) is counted. That concentration in one field and one importer is the exposure the gas-to-power chain carries.</p>
      )}
      <p><b>How Petrobangla calculates this:</b> Each report covers an 8:00 AM → 8:00 AM “gas day” and is dated by the morning it closes — the report for the 31 Dec → 1 Jan window is filed under 1 Jan. In the per-field detail, <i>% T. Cap</i> is a field’s gas output divided by national installed capacity, and <i>% T. Prod</i> is its share of the day’s grand-total production. Sub-totals are recomputed from volumes exactly as Petrobangla computes its own subtotal lines; the PDF’s per-field % column is rounded to one decimal (and occasionally misprinted at source), so summing that printed column can drift a few tenths from the official subtotal.</p>
    </>
  );

  return (
    <>
      <Section title="Daily Gas & Condensate Production" desc={<>Petrobangla Production &amp; Marketing Division Report · {coverageLabel('gasProduction')}</>} meta={<Daily />}
        source={<>Source: <Link>Petrobangla Production Reports</Link> · As published. Not independently audited. · Reporting period: Daily Field Snapshot (Date: {reportDate})</>}>
        <div className="gpg-marks" style={{ marginBottom: 0 }}><span>Gas<Prov kind="P" /></span><span>Condensate<Prov kind="P" /></span><span>National share<Prov kind="P" /></span></div>
        <Caption feed={feed} />
        <div className="gp-hint" style={{ textAlign: 'left', marginBottom: 4 }}>Tap a company for per-field detail</div>
        <div className="gp-rows" style={{ marginTop: 8 }}>
          {feed.prod.map((g, i) => {
            const fl = productionFieldsForLabel(a, g.company);
            const color = prodColor(g.company);
            return (
              <Row key={i} sw={color} wrap name={g.company}
                sub={<>Condensate {g.condensate !== undefined ? fmt(Math.round(g.condensate)) : '—'} BBLD · {g.share !== undefined ? `${g.share.toFixed(1)}% national share` : 'share —'}</>}
                value={<>{g.gas ? fmt(g.gas, 1) : '—'} <span className="gp-u">MMCFD</span></>}
                chevron={fl.length > 0}
                onClick={fl.length ? () => open(<ProductionSheet label={g.company} fields={fl} grand={grand} color={color} />) : undefined}
                meter={g.share !== undefined ? <Meter value={Math.min(100, Math.max(0, g.share))} max={100} color={color} /> : undefined}
              />
            );
          })}
          <Row top wrap name={<>Grand Total Production <Prov kind="P" /></>} sub={<>Condensate {fmt(feed.totalCond, 1)} BBL · 100.0%</>} value={<>{fmt(feed.totalGas, 1)} <span className="gp-u">MMCFD</span></>} />
        </div>
        {isNum(grand?.gas_mmcfd) && (() => {
          const d = feed.totalGas - grand!.gas_mmcfd;
          const ok = Math.abs(d) <= 0.5;
          return (
            <div className="gpg-recon">
              Company rows sum<Prov kind="D" /> {fmt(feed.totalGas, 1)} vs {fmt(grand!.gas_mmcfd, 1)} MMCFD published by Petrobangla<Prov kind="P" />
              {ok ? <span className="gp-tag good">agrees</span> : <span className="gp-tag warn">differs by {d > 0 ? '+' : ''}{d.toFixed(1)}</span>}
              {!ok && <p className="gpg-note" style={{ marginTop: 6 }}>Petrobangla’s own grand total is the figure to trust here. The company rows above are summed from the report’s per-field lines by the grid parser, and on this day that sum does not reproduce the total the same report prints.</p>}
            </div>
          );
        })()}
        <button className="gpg-open" onClick={() => open(explain)}><span>How to read this</span><span>›</span></button>
      </Section>

      {fields.length > 0 && (
        <Section title="Fields" desc="Output against capacity · the tick marks capacity" meta={`${fields.length} producing`} source={<>Petrobangla production table<Prov kind="P" /></>}>
          <div className="gp-rows">
            {(allFields ? fields : fields.slice(0, 8)).map((f) => {
              const isLng = /r-?lng/i.test(f.field);
              const c = isLng ? '#a855f7' : '#0ea5e9';
              return (
                <Row key={f.id ?? f.field} sw={c} wrap name={isLng ? 'Imported LNG' : cleanFieldName(f.field)}
                  sub={isLng ? 'R-LNG terminals' : `${f.producing_wells ?? '—'} wells${f.operator ? ` · ${f.operator}` : ''}`}
                  value={fmt(f.gas_mmcfd, 1)}
                  small={f.capacity_mmcfd ? `${Math.round((f.gas_mmcfd / f.capacity_mmcfd) * 100)}% of ${fmt(f.capacity_mmcfd)}` : 'capacity not printed'}
                  meter={<Meter value={f.gas_mmcfd} max={fMax} color={c} cap={f.capacity_mmcfd || undefined} />} />
              );
            })}
          </div>
          {fields.length > 8 && <button className="gp-more" onClick={() => setAllFields((v) => !v)}>{allFields ? 'Show fewer' : `All ${fields.length} fields`}</button>}
        </Section>
      )}
    </>
  );
}

function Distribution({ feed }: { feed: GasFeed }) {
  const { date } = usePhone();
  const open = useSheet();
  const a = feed.archive;
  const rows = feed.dist;
  const t = (k: 'power' | 'fertilizer' | 'others' | 'total') => rows.reduce((s, g) => s + (g[k] ?? 0), 0);
  const grand = t('total');
  const reportDate = feed.fallback && a ? a.report.report_date_label : date;

  const explain = (
    <>
      <h3>How to read this</h3>
      <p className="gp-sheet__sub">Sectorwise Gas Distribution</p>
      <p>This table tracks the distribution of natural gas across different sectors (power grid generators, fertilizer plants, and industrial/domestic consumers) by regional distribution utilities.</p>
      <p><b>Analytical Insight:</b> Natural gas distribution is heavily skewed toward the power sector and industrial customers. Titas Gas (TGTDCL) remains the largest distributor by volume. Under gas supply shortages, fertilizer plants and industries are often rationed to prioritize power generation, illustrating the competing demands for limited gas supply.</p>
      <p><b>How Petrobangla calculates this:</b> In the per-plant detail, “demand” is each plant’s nominal gas requirement at full output and “supply” is the metered delivery over the same 8:00 AM → 8:00 AM gas day; plants with zero supply form the report’s shutdown list. Because plants never all peak simultaneously, Petrobangla also applies its own diversity factor (typically ×0.85) to raw power demand to estimate the realistic requirement — the Adjusted Power-Gas Gap indicator is measured against that adjusted demand, not the raw plant total.</p>
    </>
  );

  if (!rows.length) return <Empty title="Sectorwise Gas Distribution" why="Petrobangla’s distribution table is not in this day’s record." />;

  return (
    <Section title="Sectorwise Gas Distribution" desc={<>Allocated supply (MMCFD) across regional gas distributors · {coverageLabel('gasProduction')}</>} meta={<Daily />}
      source={<>Source: <Link>Petrobangla Distribution Reports</Link> · As published. Not independently audited. · Reporting period: Daily Distribution Allocation (Date: {reportDate})</>}>
      <div className="gpg-marks" style={{ marginBottom: 0 }}><span>Power<Prov kind="P" /></span><span>Fertilizer<Prov kind="P" /></span><span>Others (Suppl.)<Prov kind="P" /></span><span>Total<Prov kind="P" /></span></div>
      <Caption feed={feed} />
      <div className="gp-hint" style={{ textAlign: 'left', marginBottom: 4 }}>Tap a distributor for per-plant detail</div>
      <div className="gp-rows" style={{ marginTop: 8 }}>
        {rows.map((g, i) => {
          const c = distributionCompanyForLabel(a, g.company);
          const color = distColor(g.company);
          return (
            <Row key={i} sw={color} wrap name={g.company}
              sub={<>Power {g.power.toFixed(1)} · Fertilizer {g.fertilizer.toFixed(1)} · Others {g.others.toFixed(1)}</>}
              value={<>{fmt(g.total, 1)} <span className="gp-u">MMCFD</span></>}
              small={grand > 0 ? `${((g.total / grand) * 100).toFixed(0)}% of total` : undefined}
              chevron={!!c}
              onClick={c ? () => open(<DistributionSheet label={g.company} c={c} color={color} />) : undefined}
              meter={grand > 0 ? <Meter value={g.total} max={grand} color={color} /> : undefined} />
          );
        })}
        <Row top name="National Total Supply" sub={<>Power {fmt(t('power'), 1)} · Fertilizer {fmt(t('fertilizer'), 1)} · Others {fmt(t('others'), 1)}</>} value={<>{fmt(grand, 1)} <span className="gp-u">MMCFD</span></>} />
      </div>
      <button className="gpg-open" onClick={() => open(explain)}><span>How to read this</span><span>›</span></button>
      <button className="gpg-open" onClick={() => open(<GlossarySheet />)}><span>Gas sector acronyms &amp; units</span><span>›</span></button>
    </Section>
  );
}
