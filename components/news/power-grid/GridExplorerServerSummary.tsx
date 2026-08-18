import Link from 'next/link';
import type { GridDailyData } from '@/lib/data/grid/types';

/**
 * The explorer, in HTML, for anyone who cannot run it.
 *
 * `PowerGridExplorerClient` loads with `ssr: false`, so the initial document
 * carries the page header, the JSON-LD and a grey box — measured at 5,641
 * characters of visible text, of which every word belongs to the ticker, the
 * nav and the footer. No headings from the explorer, no tables, no figures.
 * Googlebot renders JavaScript on a second pass, but that pass is best-effort
 * and deferred, and nothing in the first pass tells it this page is a daily
 * dataset about Bangladesh's grid.
 *
 * This is not a duplicate of the explorer and must not become one. It is the
 * day's headline figures as a short, honest summary with real headings, real
 * tables and real links — the thing a search result should be able to quote,
 * and the thing a reader on a dead connection should still get. The interactive
 * explorer renders below it and is where the work actually happens.
 *
 * Everything here is read off the day already prefetched for the client. No
 * figure is computed that the report does not support, and a figure the report
 * withholds is left out rather than defaulted: `totalEnergyGen` and its
 * siblings are nullable precisely because PGCB leaves those cells empty on some
 * days, and printing `0.00` there would publish a claim the report never made.
 *
 * The day shown is the newest one, which every visitor tier can already see
 * (`GRID_TIER_LIMITS.visitor` covers the last seven days), so this block
 * discloses nothing the paywall withholds. Per-fuel unit rates are deliberately
 * absent: they are `D` figures whose corroboration lives in the client, and a
 * derived rate without its witness is exactly the thing this site refuses to
 * print.
 *
 * Marked P and D like everything else, in words rather than badges: this block
 * is read by machines and by people without CSS, and a bare letter in a span
 * means nothing to either.
 *
 * NOTHING HERE MAY BE HIDDEN FROM READERS TO FEED CRAWLERS. The collapsed
 * sections are `<details>` — real progressive disclosure, openable by anyone,
 * crawled as ordinary content. No `display:none`, no zero-height, no off-screen
 * text: that is cloaking, and it costs the whole domain.
 */

const nf = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** The tabs, as crawlable links. The client reads the same `?tab=` value. */
const VIEWS: { tab: string; label: string; blurb: string }[] = [
  { tab: 'gen', label: 'Generation & cost', blurb: 'Half-hourly fuel mix and the day’s production cost by fuel' },
  { tab: 'gas', label: 'Gas & LNG supply', blurb: 'Field-by-field gas production and where it was allocated' },
  { tab: 'imports', label: 'Cross-border imports', blurb: 'The four interconnectors with India and Nepal, hour by hour' },
  { tab: 'regional', label: 'Regional grid', blurb: 'Zone-wise demand, load shedding and the NLDC outage log' },
  { tab: 'renewables', label: 'Renewables', blurb: 'Solar, wind and hydro output against installed capacity' },
  { tab: 'plants', label: 'Power stations', blurb: 'Every station’s output, installed capacity and utilisation' },
  { tab: 'transmission', label: 'Technical information', blurb: 'Transmission lines, substations and grid infrastructure' },
  { tab: 'macro', label: 'Macro trends', blurb: 'Gas reserves, budgets, monthly archives and long-run indicators' },
];

/** How the zone Demand column got its figures, in the words the reader needs. */
const REGIONAL_SOURCE_NOTE: Record<string, string> = {
  'p1-published':
    'Both columns are published by PGCB in the daily report and reproduced unchanged (P).',
  'derived-served-plus-shed':
    'Load shedding is published by PGCB (P); the Demand column is not held for this day and is reconstructed from area served plus shedding (D).',
  'bpdb-published':
    'Load shedding is published by PGCB (P); the Demand column is BPDB’s published evening-peak table for the same day, credited to BPDB rather than to PGCB (P).',
};

const detailsCls = 'mt-4 border-t border-border/30 pt-3';
const summaryCls = 'cursor-pointer text-muted-foreground hover:text-foreground';
/**
 * The collapsed sections carry real `h3`s, not styled spans — a `<details>`
 * whose label is not a heading contributes nothing to the document outline, and
 * the outline is most of what a crawler reads a long page by. `!my-0` because
 * the shared `h3` rule adds block margins that a summary row does not want.
 */
const summaryHeadingCls = 'inline !my-0';

export function GridExplorerServerSummary({
  data,
  date,
  archiveDays,
  earliestDate,
}: {
  data?: GridDailyData;
  date?: string;
  archiveDays: number;
  earliestDate?: string;
}) {
  const stats = data?.systemStats;
  const fuels = (data?.generationData ?? []).filter((f) => f.gen > 0);
  const totalGen = fuels.reduce((s, f) => s + f.gen, 0);
  const gas = (data?.gasProductionData ?? []).reduce((s, g) => s + (g.gas ?? 0), 0);
  const imports = data?.borderImportsData ?? [];
  const zones = data?.regionalDemandData ?? [];
  const shedZones = zones.filter((z) => z.loadShed > 0);
  const totalShedMw = zones.reduce((s, z) => s + z.loadShed, 0);
  const sources = data?.sourceFiles;
  const regionalNote = data?.regionalDemandSource
    ? REGIONAL_SOURCE_NOTE[data.regionalDemandSource]
    : undefined;
  // The report stamps a clock time against the evening peak, and that hour
  // genuinely moves. Never name a fixed hour.
  const peakHour = stats?.peakTimes?.eveningPeakGen;
  const dayLabel = stats?.date ?? date;

  return (
    <section className="grid-explorer-summary" aria-labelledby="grid-summary-heading">
      <h2 id="grid-summary-heading">
        Bangladesh power grid{dayLabel ? `, ${dayLabel}` : ''}
      </h2>

      {stats ? (
        <p>
          On{' '}
          {date ? <time dateTime={date}>{dayLabel}</time> : dayLabel}, Bangladesh’s national grid
          reached an evening peak of <strong>{nf(stats.eveningPeakGen)} MW</strong> of generation
          against <strong>{nf(stats.eveningPeakDemand)} MW</strong> of demand
          {peakHour ? <> at {peakHour}</> : null}.
          {stats.totalEnergyGen != null ? (
            <>
              {' '}
              The system generated <strong>{nf(stats.totalEnergyGen, 2)} million kWh</strong> over
              the day
              {stats.totalEnergyDemand != null ? (
                <> against a demand of <strong>{nf(stats.totalEnergyDemand, 2)} million kWh</strong></>
              ) : null}
              .
            </>
          ) : null}
          {stats.totalEnergyUnserved != null ? (
            <>
              {' '}
              Load shedding left{' '}
              <strong>{nf(stats.totalEnergyUnserved, 2)} million kWh</strong> of demand unserved
              {totalShedMw > 0 ? (
                <>
                  , and <strong>{nf(totalShedMw)} MW</strong> was being shed across{' '}
                  {shedZones.length} of the {zones.length} grid zones at the evening peak
                </>
              ) : null}
              .
            </>
          ) : null}
          {gas > 0 ? (
            <>
              {' '}
              Domestic and imported gas supply totalled <strong>{nf(gas, 1)} MMCFD</strong>.
            </>
          ) : null}
          {stats.maxTemp != null ? (
            <>
              {' '}
              The maximum temperature recorded against the day was{' '}
              <strong>{nf(stats.maxTemp, 1)} °C</strong>.
            </>
          ) : null}
        </p>
      ) : (
        <p>
          Daily generation, demand, load shedding, fuel mix, gas supply and cross-border imports for
          Bangladesh’s national grid, from the official daily reports of the Power Grid Company of
          Bangladesh and Petrobangla.
        </p>
      )}

      <p>
        Every figure above is published by the Power Grid Company of Bangladesh (PGCB) in its daily
        report, or by Petrobangla in its daily gas report, and is reproduced unchanged — marked{' '}
        <strong>P</strong>. Shares, totals and anything we calculate from those figures are marked{' '}
        <strong>D</strong> and named as such wherever they appear.
        {sources?.pgcb || sources?.petrobangla ? (
          <>
            {' '}
            This day was built from{' '}
            {sources.pgcb ? <em>{sources.pgcb}</em> : null}
            {sources.pgcb && sources.petrobangla ? ' and ' : null}
            {sources.petrobangla ? <em>{sources.petrobangla}</em> : null}, named exactly as the
            agencies publish them so the same document can be requested independently.
          </>
        ) : null}
      </p>

      <p>
        The archive holds <strong>{nf(archiveDays)} days</strong>
        {earliestDate ? (
          <>
            {' '}
            of Bangladesh grid data, from {earliestDate} to {date}
          </>
        ) : null}
        , one record per day, each traced to the report it came from.
      </p>

      {fuels.length > 0 ? (
        <>
          <h3>Electricity generation by fuel{dayLabel ? `, ${dayLabel}` : ''}</h3>
          <table>
            <caption>
              Energy generated by fuel type on {dayLabel}, in million kWh. Energy figures are
              published by PGCB (P); the share of the day’s total is calculated from them (D). Fuels
              that produced nothing on this day are omitted.
            </caption>
            <thead>
              <tr>
                <th scope="col">Fuel</th>
                <th scope="col">Energy (million kWh)</th>
                <th scope="col">Share of generation</th>
              </tr>
            </thead>
            <tbody>
              {fuels.map((f) => (
                <tr key={f.name}>
                  <th scope="row">{f.name}</th>
                  <td>{nf(f.gen, 2)}</td>
                  <td>{totalGen > 0 ? `${((f.gen / totalGen) * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">Total</th>
                <td>{nf(totalGen, 2)}</td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : null}

      {imports.length > 0 ? (
        <details className={detailsCls}>
          <summary className={summaryCls}>
            <h3 className={summaryHeadingCls}>
              Cross-border electricity imports{dayLabel ? `, ${dayLabel}` : ''}
            </h3>
          </summary>
          <table>
            <caption>
              Electricity imported into Bangladesh over each interconnector on {dayLabel}. Energy in
              million kWh and peak flow in MW, both as published by PGCB (P).
            </caption>
            <thead>
              <tr>
                <th scope="col">Interconnector</th>
                <th scope="col">Corridor</th>
                <th scope="col">Energy (million kWh)</th>
                <th scope="col">Peak flow (MW)</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((i) => (
                <tr key={i.source}>
                  <th scope="row">{i.source}</th>
                  {/* The shared stylesheet right-aligns every td for the numeric
                      columns; this one is prose and keeps the left axis. */}
                  <td className="!text-left">{i.type}</td>
                  <td>{nf(i.energy, 2)}</td>
                  <td>{nf(i.peakFlow, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}

      {zones.length > 0 ? (
        <details className={detailsCls}>
          <summary className={summaryCls}>
            <h3 className={summaryHeadingCls}>
              Zone-wise demand and load shedding{dayLabel ? `, ${dayLabel}` : ''}
            </h3>
          </summary>
          <table>
            <caption>
              Evening-peak demand and load shedding for each of Bangladesh’s {zones.length} grid
              zones on {dayLabel}, in MW.{regionalNote ? ` ${regionalNote}` : ''} The percentage is
              PGCB’s own shedding column where it prints one.
            </caption>
            <thead>
              <tr>
                <th scope="col">Zone</th>
                <th scope="col">Demand (MW)</th>
                <th scope="col">Load shedding (MW)</th>
                <th scope="col">Shed (%)</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.zone}>
                  <th scope="row">{z.zone}</th>
                  <td>{nf(z.demand)}</td>
                  <td>{nf(z.loadShed)}</td>
                  <td>{z.pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}

      <details className={detailsCls}>
        <summary className={summaryCls}>
          <h3 className={summaryHeadingCls}>How to read these figures</h3>
        </summary>
        <dl className="mt-2 grid gap-2 text-[0.75rem] leading-relaxed text-muted-foreground">
          <div>
            <dt className="font-semibold text-foreground">Evening peak</dt>
            <dd>
              The grid’s highest evening loading of the day. PGCB prints a clock time against it,
              and that time moves from day to day, so this page reports the hour the report itself
              stamps rather than a fixed one.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Load shedding</dt>
            <dd>
              Demand the system could not serve, and so disconnected. PGCB publishes it two ways: in
              MW per zone at the evening peak, and as energy unserved in million kWh over the whole
              day.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Million kWh (MKWh)</dt>
            <dd>
              The unit PGCB uses for a day’s energy — a million kilowatt-hours, equal to one
              gigawatt-hour. MW, by contrast, is an instantaneous rate, which is why peaks are in MW
              and day totals are in million kWh.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">MMCFD</dt>
            <dd>
              Million cubic feet per day, the unit Petrobangla uses for gas production and
              allocation. Its gas day runs 08:00 to 08:00, not midnight to midnight.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">P and D</dt>
            <dd>
              <strong>P</strong> marks a figure published unchanged by an official body — PGCB,
              Petrobangla, BPDB. <strong>D</strong> marks one derived by us from published figures.
              Nothing on this site is presented without one of the two, and a derived figure names
              the published figures it came from.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Where the data comes from</dt>
            <dd>
              The daily report of the{' '}
              <a href="https://www.pgcb.gov.bd/" rel="nofollow noopener" target="_blank">
                Power Grid Company of Bangladesh
              </a>{' '}
              and the daily gas report of{' '}
              <a href="https://petrobangla.org.bd/" rel="nofollow noopener" target="_blank">
                Petrobangla
              </a>
              , collected from those agencies directly rather than from any republisher.
            </dd>
          </div>
        </dl>
      </details>

      <h3>What the explorer covers</h3>
      <ul>
        {VIEWS.map((v) => (
          <li key={v.tab}>
            <Link href={`/grid-explorer?tab=${v.tab}`}>{v.label}</Link> — {v.blurb}
          </li>
        ))}
      </ul>
    </section>
  );
}
