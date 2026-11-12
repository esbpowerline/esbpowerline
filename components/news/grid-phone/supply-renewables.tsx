'use client';

/**
 * Supply › Renewables — desktop "Renewables" tab: the day's renewable output
 * from PGCB, the monthly timeline, the renewable stations, and the SREDA
 * register (standing capacity, which ignores the picked date).
 */

import { useMemo, useState } from 'react';
import { fmt, Legend, LineChart, StackArea } from './charts';
import { usePhone } from './context';
import { fuelPalette, isNum, monthLabel, Prov, Row, Section } from './shared';
import { Absent, Check, How, KV, Note, Pill, Ref, ShowMore, Tile, U, Verdict, useBrief, useNote } from './supply-bits';
import { SredaCards, UnitsGlossary, useSreda } from './supply-sreda';
import { useMonthly } from './useGridPhoneData';

const RENEWABLE = ['Solar', 'Hydro', 'Wind'] as const;
const ADMINISTERED = new Set(['Hydro', 'Wind']);
const RE_SHARE = '#7c3aed';
const mw = (v: number | null | undefined) => (isNum(v) ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—');
const longMonth = (key: string) => new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function RenewablesView() {
  const p = usePhone();
  const { day, date } = p;
  const brief = useBrief();
  const note = useNote();
  const { sreda, state } = useSreda();
  const monthly = useMonthly(true);
  const pal = fuelPalette(day);
  const file = day.sourceFiles?.pgcb;
  const col = (k: string) => pal[k] ?? '#94a3b8';

  /* day, from PGCB */
  const gen = day.generationData ?? [];
  const dRows = gen.filter((g) => (RENEWABLE as readonly string[]).includes(g.name));
  const energy = dRows.reduce((s, r) => s + (isNum(r.gen) ? r.gen : 0), 0);
  const totalGen = gen.reduce((s, r) => s + (isNum(r.gen) ? r.gen : 0), 0);
  const share = dRows.length && totalGen > 0 ? (energy / totalGen) * 100 : null;
  const costSum = dRows.reduce((s, r) => s + (r.cost ?? 0), 0);

  /* stations */
  const plantsAll = p.plants?.plants ?? null;
  const stations = useMemo(
    () => (plantsAll ?? []).filter((x) => (RENEWABLE as readonly string[]).includes(x.fuel)).sort((a, b) => (b.installedMw ?? 0) - (a.installedMw ?? 0)),
    [plantsAll],
  );
  const sumOf = (k: 'installedMw' | 'presentCapacityMw' | 'dayPeakMw' | 'eveningPeakMw' | 'energyKwh') => {
    const have = stations.filter((s) => isNum(s[k]));
    return { v: have.reduce((a, s) => a + (s[k] as number), 0), n: have.length };
  };
  const tInst = sumOf('installedMw');
  const tPres = sumOf('presentCapacityMw');
  const tDay = sumOf('dayPeakMw');
  const tEve = sumOf('eveningPeakMw');
  const tEn = sumOf('energyKwh');
  const stationVsFuel = useMemo(() => {
    if (!stations.length || !dRows.length) return [];
    return RENEWABLE.map((fuel) => {
      const ss = stations.filter((x) => x.fuel === fuel);
      if (!ss.length) return null;
      const computed = ss.reduce((a, x) => a + (x.energyKwh ?? 0), 0) / 1e6;
      const published = dRows.find((r) => r.name === fuel)?.gen;
      if (!isNum(published)) return null;
      const tol = 0.005 * (ss.length + 1);
      return { fuel, n: ss.length, computed, published, delta: computed - published, ok: Math.abs(computed - published) <= tol };
    }).filter(Boolean) as { fuel: string; n: number; computed: number; published: number; delta: number; ok: boolean }[];
  }, [stations, dRows]);

  /* monthly series */
  const series = useMemo(() => {
    const m = monthly.data ?? [];
    return m.filter((r) => r.generation_by_fuel).map((r) => {
      const g = r.generation_by_fuel!;
      const pick = (k: string) => (isNum(g[k]) ? (g[k] as number) : null);
      const Solar = pick('solar');
      const Hydro = pick('hydro');
      const Wind = pick('wind');
      const parts = [Solar, Hydro, Wind].filter(isNum);
      const renewable = parts.length ? parts.reduce((a, v) => a + v, 0) : null;
      const total = isNum(r.total_net_generation) ? r.total_net_generation : null;
      return { month: r.date_key, Solar, Hydro, Wind, renewable, total, share: renewable != null && total != null && total > 0 ? (renewable / total) * 100 : null };
    });
  }, [monthly.data]);
  const latest = series.length ? series[series.length - 1] : null;
  const first = (k: 'Solar' | 'Hydro' | 'Wind') => series.find((r) => (r[k] ?? 0) > 0)?.month ?? null;
  const [mi, setMi] = useState<number | null>(null);
  const at = mi ?? series.length - 1;
  const cur = series[at];

  /* KPI briefings */
  const ref = <Ref part="En-Curve sheet — per-fuel hourly energy" date={date} file={file} url="https://pgcb.gov.bd" />;
  const bEnergy = () =>
    brief({
      title: 'Renewable Output',
      rows: [
        ...dRows.map((r) => ({ kind: 'P' as const, label: `${r.name}:`, value: `${fmt(r.gen, 2)} MKWh` })),
        { kind: 'D', label: 'Renewable total:', value: `${fmt(energy, 2)} MKWh` },
        { kind: 'P', label: 'All fuels:', value: `${fmt(totalGen, 2)} MKWh` },
      ],
      audit: 'PGCB publishes each fuel’s energy; the total is our sum. Not audited.',
      ref,
    });
  const bShare = () =>
    brief({
      title: 'Renewable Share',
      rows: [
        { kind: 'D', label: 'Renewable:', value: `${fmt(energy, 2)} MKWh` },
        { kind: 'P', label: 'Total generated:', value: `${fmt(totalGen, 2)} MKWh` },
      ],
      audit: 'The share is a quotient; PGCB does not state it.',
      ref,
    });
  const bFleet = () =>
    brief({
      title: 'Renewable Fleet',
      rows: [
        { kind: 'P', label: 'Installed:', value: `${mw(tInst.v)} MW${tInst.n < stations.length ? ` (${tInst.n} of ${stations.length} state it)` : ''}` },
        { kind: 'P', label: 'Available today:', value: `${mw(tPres.v)} MW${tPres.n < stations.length ? ` (${tPres.n} of ${stations.length})` : ''}` },
        { kind: 'D', label: 'Sum of day peaks:', value: `${mw(tDay.v)} MW${tDay.n < stations.length ? ` (${tDay.n} of ${stations.length})` : ''}` },
        { kind: 'D', label: 'Sum of evening peaks:', value: `${mw(tEve.v)} MW${tEve.n < stations.length ? ` (${tEve.n} of ${stations.length})` : ''}` },
      ],
      audit: 'Station rows as PGCB publishes them. Totals are our sums of those rows; a station that states no figure is left out of that sum, not counted as zero.',
      ref,
    });
  const bCap = () => {
    const bySrc = new Map<string, number>();
    for (const r of sreda?.technologyBreakdown ?? []) bySrc.set(r.source, (bySrc.get(r.source) ?? 0) + r.totalMwp);
    brief({
      title: 'SREDA Capacity Register',
      rows: [
        ...[...bySrc.entries()].map(([s, v]) => ({ kind: 'D' as const, label: `${s}:`, value: `${fmt(v, 3)} MWp` })),
        { kind: 'P', label: 'SREDA total:', value: sreda?.technologyTotals ? `${fmt(sreda.technologyTotals.totalMwp, 3)} MWp` : '—' },
      ],
      audit: 'MWp is peak DC capacity, not MW; they are never combined.',
      ref: <Ref agency="SREDA NDRE" part={undefined} url="https://ndre.sreda.gov.bd/" urlLabel={`ndre.sreda.gov.bd · Updated: ${sreda?.lastUpdate ?? '—'}`} />,
    });
  };

  const [allSt, setAllSt] = useState(false);
  // The SREDA register is a standing stock, not the day's output, and it is
  // long: on its own tab it no longer buries the day under nine reference cards.
  const [part, setPart] = useState<'day' | 'sreda'>('day');
  const shownSt = allSt ? stations : stations.slice(0, 8);

  return (
    <>
      <div className="gp-seg" role="tablist" aria-label="Renewables view">
        {([['day', 'Output'], ['sreda', 'SREDA register']] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={part === id} className={part === id ? 'is-on' : ''} onClick={() => setPart(id)}>{l}</button>
        ))}
      </div>
      {part === 'sreda' ? (
        <>
          <div className="gp-group-label">Standing capacity, not a day’s output · as of {sreda?.date ?? '—'}</div>
          <SredaCards sreda={sreda} state={state} />
          <UnitsGlossary />
        </>
      ) : (
      <>
      <Section title="Renewables today" desc="Tap a figure for its briefing" source="PGCB daily report · SREDA register">
        <div className="gp-stats gp-stats--first">
          <Tile label="Renewable Generation" prov="D" note="Our sum of PGCB’s solar, hydro and wind rows." value={dRows.length ? fmt(energy, 2) : '—'} unit={dRows.length ? 'MKWh' : undefined} detail={<>PGCB daily report · <span style={{ whiteSpace: 'nowrap' }}>{date}</span></>} onClick={bEnergy} />
          <Tile label="Share of Generation" prov="D" note="Renewable energy over all energy generated that day." value={share != null ? share.toFixed(2) : '—'} unit={share != null ? '%' : undefined} detail="of all energy generated that day" onClick={bShare} />
          <Tile label="Renewable Plants Online" prov="P" value={plantsAll ? String(stations.length) : p.plantsLoading ? '…' : '—'} detail={plantsAll && tPres.n ? `${Math.round(tPres.v).toLocaleString('en-US')} MW available capacity` : 'per-station detail not published'} onClick={bFleet} />
          <Tile label="Installed Capacity" prov="P" value={sreda?.technologyTotals ? fmt(sreda.technologyTotals.totalMwp, 2) : '—'} unit={sreda?.technologyTotals ? 'MWp' : undefined} detail={sreda ? <>SREDA register · <span style={{ whiteSpace: 'nowrap' }}>{sreda.date}</span></> : 'SREDA register'} onClick={bCap} />
        </div>
      </Section>

      <Section
        title="Renewable Output by Fuel"
        desc={`PGCB daily report · ${date}`}
        source={<span>Source: PGCB Daily Generation Report · Reported day: <span style={{ whiteSpace: 'nowrap' }}>{date}</span></span>}
      >
        {dRows.length === 0 ? (
          <Absent>PGCB published no fuel-wise generation for this date.</Absent>
        ) : (
          <>
            <div className="gp-rows">
              {dRows.map((r) => (
                <Row
                  key={r.name}
                  sw={col(r.name)}
                  name={<>{r.name}{ADMINISTERED.has(r.name) && <> <Pill tone="warn" onClick={() => note('flat', <p style={{ marginTop: 0 }}>Administered rate — the publisher applies a fixed Tk/kWh to this fuel rather than reporting an observed cost.</p>)}>flat</Pill></>}</>}
                  top
                  sub={<>{fmt(r.gen, 2)} MKWh<Prov kind="P" /><br />cost {isNum(r.cost) ? `Tk ${fmt(r.cost)}` : '—'}<Prov kind="P" /></>}
                  value={<>{isNum(r.unitCost) ? r.unitCost.toFixed(4) : '—'} <U>Tk/kWh</U></>}
                  small={<>rate<Prov kind="D" note="Cost over energy." /></>}
                />
              ))}
              <Row
                name={<>Renewable total<Prov kind="D" /></>}
                sub={<>{fmt(energy, 2)} MKWh · cost Tk {fmt(costSum)}</>}
                value="—"
                small="no blended rate"
              />
            </div>
            <How title="What does the flat mark mean?" label="What does the flat mark mean?">
              <p style={{ marginTop: 0 }}>Hydro and Wind carry a <b>flat</b> mark because PGCB applies a fixed rate to them — 0.1000 and 14.7100 Tk/kWh on essentially every day of 2026 — rather than reporting a measured cost. A rate no agency prints is derived either way.</p>
            </How>
          </>
        )}
      </Section>

      <Section
        title="Latest Published Month"
        desc={latest ? longMonth(latest.month) : 'PGCB monthly report'}
        source={<span>Source: PGCB Monthly Report{latest ? ` · ${longMonth(latest.month)}` : ''}</span>}
      >
        {!latest ? (
          <Absent>{monthly.status === 'loading' || monthly.status === 'idle' ? 'Loading PGCB’s monthly reports…' : 'PGCB monthly reports could not be loaded.'}</Absent>
        ) : (
          <>
            <div className="gp-stats gp-stats--first">
              {RENEWABLE.map((k) => (
                <Tile key={k} label={<><span className="gp-sw" style={{ background: col(k), display: 'inline-block', marginRight: 6 }} />{k}</>} prov="P" value={latest[k] != null ? fmt(latest[k], 2) : '—'} detail="MKWh" />
              ))}
              <Tile label={<><span className="gp-sw" style={{ background: RE_SHARE, display: 'inline-block', marginRight: 6 }} />Share of generation</>} prov="D" note="Renewable energy over the month’s total net generation." value={latest.share != null ? latest.share.toFixed(2) : '—'} unit={latest.share != null ? '%' : undefined} detail={latest.renewable != null && latest.total != null ? `${fmt(latest.renewable, 2)} of ${fmt(Math.round(latest.total))} MKWh` : undefined} />
            </div>
            <Note>Each figure is from that month’s report; the share is our quotient. PGCB states no renewable percentage.</Note>
          </>
        )}
      </Section>

      <Section
        title="Renewable Generation Timeline"
        desc="Every month PGCB has published — energy by Solar, Hydro and Wind, with renewables as a share of all generation"
        source={<span>Source: PGCB Monthly Reports{latest ? ` · ${series.length} months · through ${longMonth(latest.month)}` : ''}</span>}
      >
        {series.length < 2 ? (
          <Absent>PGCB monthly reports could not be loaded, so no timeline is shown.</Absent>
        ) : (
          <>
            <div className="gp-kicker"><span>{longMonth(cur.month)}{mi == null ? ' · latest' : ''}</span></div>
            <div className="gp-hero gp-hero--md">
              <b>{cur.renewable != null ? fmt(cur.renewable, 1) : '—'}</b><small>MKWh</small><Prov kind="D" note="Our sum of the solar, hydro and wind figures PGCB prints for the month." />
            </div>
            <StackArea
              ariaLabel="Monthly renewable generation by fuel"
              labels={series.map((r) => monthLabel(r.month))}
              groups={[{ name: 'Hydro', color: col('Hydro') }, { name: 'Wind', color: col('Wind') }, { name: 'Solar', color: col('Solar') }]}
              rows={series.map((r) => [r.Hydro ?? 0, r.Wind ?? 0, r.Solar ?? 0])}
              onScrub={(i) => i != null && setMi(i)}
            />
            <div className="gp-group-label" style={{ margin: 'var(--s4) 0 0' }}>Renewables as a share of all generation (%)</div>
            <LineChart
              ariaLabel="Renewable share of all generation, monthly"
              labels={series.map((r) => monthLabel(r.month))}
              series={[{ values: series.map((r) => r.share), color: RE_SHARE, width: 2 }]}
              aspect={0.4}
              minH={150}
              maxH={190}
              min={0}
              onScrub={(i) => i != null && setMi(i)}
            />
            <Legend
              items={[
                { label: <>Hydro<Prov kind="P" /></>, color: col('Hydro') },
                { label: <>Wind<Prov kind="P" /></>, color: col('Wind') },
                { label: <>Solar<Prov kind="P" /></>, color: col('Solar') },
                { label: <>Share of generation<Prov kind="D" /></>, color: RE_SHARE, line: true },
              ]}
            />
            <div className="gp-rows" style={{ marginTop: 8 }}>
              {RENEWABLE.map((k) => (
                <Row key={k} sw={col(k)} name={<>{k}<Prov kind="P" /></>} value={<>{cur[k] != null ? fmt(cur[k], 2) : '—'} <U>MKWh</U></>} />
              ))}
              <Row name={<>Renewable total<Prov kind="D" /></>} value={<>{cur.renewable != null ? fmt(cur.renewable, 2) : '—'} <U>MKWh</U></>} />
              <Row name={<>All generation<Prov kind="P" /></>} value={<>{cur.total != null ? fmt(Math.round(cur.total)) : '—'} <U>MKWh</U></>} />
              <Row name={<>Share<Prov kind="D" /></>} value={cur.share != null ? `${cur.share.toFixed(2)}%` : '—'} small={cur.share == null ? 'not computable for this month' : undefined} />
            </div>
            <div className="gp-hint" style={{ textAlign: 'left' }}>Drag across either chart to read a month.</div>
            <Note>
              {series.length} months published, {longMonth(series[0].month)} – {longMonth(series[series.length - 1].month)}.
              {(['Solar', 'Hydro', 'Wind'] as const).map((k) => {
                const m = first(k);
                return m ? <span key={k}> First {k.toLowerCase()} generation: {longMonth(m)}.</span> : null;
              })}
            </Note>
            <How title="How to read this chart">
              <p style={{ marginTop: 0 }}>The top chart is monthly energy in MKWh, stacked; the lower chart is renewables as a share of all generation that month. Gaps in the line are months PGCB has not published — nothing is interpolated across them.</p>
            </How>
          </>
        )}
      </Section>

      <Section
        title="Renewable Power Stations"
        desc="Every renewable station PGCB lists for this day, with its own output"
        meta={stations.length > 0 ? `${stations.length} stations` : undefined}
        source={<span>Source: PGCB Daily Report — station table · Reported day: <span style={{ whiteSpace: 'nowrap' }}>{date}</span></span>}
      >
        {plantsAll === null ? (
          <Absent>{p.plantsLoading ? 'Loading station detail…' : `PGCB published no per-station table for ${date}, or the day’s workbook did not reconcile against its own totals. Nothing from a neighbouring day is shown in its place.`}</Absent>
        ) : stations.length === 0 ? (
          <Absent>PGCB’s station table for {date} lists no solar, hydro or wind station.</Absent>
        ) : (
          <>
            <div className="gp-rows">
              {shownSt.map((s) => (
                <Row
                  key={s.name}
                  sw={col(s.fuel)}
                  name={s.name}
                  wrap
                  chevron
                  sub={<>{s.fuel} · installed {mw(s.installedMw)} MW · day peak {mw(s.dayPeakMw)} MW</>}
                  value={<>{isNum(s.energyKwh) ? (s.energyKwh / 1e6).toFixed(3) : '—'} <U>MKWh</U></>}
                  onClick={() =>
                    note(
                      s.name,
                      <>
                        <KV label="Fuel" kind="P" value={s.fuel} />
                        <KV label="Producer" kind="P" value={s.producer || '—'} />
                        <KV label="Installed" kind="P" value={`${mw(s.installedMw)} MW`} />
                        <KV label="Available" kind="P" value={`${mw(s.presentCapacityMw)} MW`} />
                        <KV label="Day peak" kind="P" value={`${mw(s.dayPeakMw)} MW`} />
                        <KV label="Evening peak" kind="P" value={`${mw(s.eveningPeakMw)} MW`} />
                        <KV label="Energy" kind="P" value={`${isNum(s.energyKwh) ? (s.energyKwh / 1e6).toFixed(3) : '—'} MKWh`} />
                        {s.remarks ? <Note>{s.remarks}</Note> : null}
                      </>,
                    )
                  }
                />
              ))}
            </div>
            <ShowMore shown={8} total={stations.length} noun="stations" expanded={allSt} onToggle={() => setAllSt((v) => !v)} />
            <div className="gps-check" style={{ marginTop: 'var(--s4)' }}>
              <div className="gps-check__t">{stations.length} stations<Prov kind="D" note="Our sums of the station rows. A station that states no figure is left out of that sum." /></div>
              <KV label="Installed" value={`${Math.round(tInst.v).toLocaleString('en-US')} MW${tInst.n < stations.length ? ` · ${tInst.n} state it` : ''}`} />
              <KV label="Available" value={`${Math.round(tPres.v).toLocaleString('en-US')} MW${tPres.n < stations.length ? ` · ${tPres.n} state it` : ''}`} />
              <KV label="Day peak" value={`${Math.round(tDay.v).toLocaleString('en-US')} MW${tDay.n < stations.length ? ` · ${tDay.n} state it` : ''}`} />
              <KV label="Evening peak" value={`${Math.round(tEve.v).toLocaleString('en-US')} MW${tEve.n < stations.length ? ` · ${tEve.n} state it` : ''}`} />
              <KV label="Energy" value={`${(tEn.v / 1e6).toFixed(3)} MKWh${tEn.n < stations.length ? ` · ${tEn.n} state it` : ''}`} />
            </div>
            {stationVsFuel.length > 0 && (
              <Check title="Stations reconciled against PGCB’s own fuel totals" ok={stationVsFuel.every((c) => c.ok)}>
                {stationVsFuel.map((c) => (
                  <KV key={c.fuel} label={`${c.fuel} — ${c.n} station${c.n === 1 ? '' : 's'} sum`} kind="D" value={<>{fmt(c.computed, 3)} vs {fmt(c.published, 2)} MKWh published<Prov kind="P" /> <Verdict ok={c.ok} delta={c.delta} /></>} />
                ))}
              </Check>
            )}
            <How title="How the stations are checked" label="How the stations are checked">
              <p style={{ marginTop: 0 }}>The station table and the fuel table are different pages of the same PGCB report, so each fuel’s stations should sum to its published energy. Band is half of the last digit PGCB prints, once per figure summed.</p>
            </How>
            <Note>Solar stations report a day peak and no evening peak, because the evening peak is measured after sunset. A zero there is a real reading, not a gap.</Note>
          </>
        )}
      </Section>

      </>
      )}
    </>
  );
}
