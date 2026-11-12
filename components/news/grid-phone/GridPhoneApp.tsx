'use client';

/**
 * The Grid Explorer as a phone app: one full-screen layer with its own app
 * bar, date strip and bottom navigation, mounted by GridPhoneGate below 768px.
 * The desktop explorer stays in the page underneath — server-rendered for
 * crawlers and readers without JavaScript — and is what every wider screen
 * gets, untouched.
 *
 * Access follows the desktop rules exactly: the same tier hook decides which
 * days a reader may open, and the same date guard keeps the loaders from
 * asking for a day the server would refuse.
 */

import '@/app/grid-phone.css';
import '@/app/grid-phone-polish.css';
import '@/app/grid-phone-look-editorial.scoped.css';
import '@/app/grid-phone-look-cards.scoped.css';
import '@/app/grid-phone-look-ink.scoped.css';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { availableDates, getLatestAvailableDate } from '@/lib/data/grid/available-dates';
import { dateRequestable, setDateGuard } from '@/lib/data/grid/client-date-window';
import { useGridTierAccess } from '@/hooks/useGridTierAccess';
import { backlogBadge } from '@/lib/data/grid/backlog-badge';
import { describeDayProvenance, type LedgerDay } from '@/lib/data/grid/verification-ledger';
import { isBeyondToday, pendingDayFor, pendingDays } from '@/lib/data/grid/pending-days';
import { tabAvailability } from '@/lib/data/grid/tab-availability';
import { findEventStudyForDate } from '@/lib/data/analysis/event-registry';
import { getTierStatusMessage } from '@/lib/membership/grid-access-messaging';
import { GridExportDialog } from '@/components/members/GridExportDialog';
import { MemberToolsPanel } from '@/components/members/MemberToolsPanel';
import { RefreshGridDataButton } from '@/components/members/RefreshGridDataButton';
import { GridReportingStandards } from '@/components/news/power-grid/GridReportingStandards';
import { PowerGridExplorerErrorBoundary } from '@/components/news/PowerGridExplorerErrorBoundary';
import { SheetContext, dm, longDate, Skeleton, wd } from './shared';
import { useCurve, useDay, useDays, useGasDay, useGasDays, useMonthly, usePlants, useWeekWindow } from './useGridPhoneData';
import { TodayScreen } from './TodayScreen';
import { SupplyScreen } from './SupplyScreen';
import { PlantsScreen } from './PlantsScreen';
import { GasScreen } from './GasScreen';
import { GridScreen } from './GridScreen';
import { HistoryScreen } from './HistoryScreen';
import { PhoneDataContext, type PhoneData } from './context';

export type PhoneTab = 'today' | 'supply' | 'grid' | 'plants' | 'gas' | 'history';

/** Which lazily-loaded feeds each screen reads from the context. */
const NEEDS: Record<PhoneTab, { curve?: boolean; plants?: boolean; gas?: boolean; monthly?: boolean }> = {
  today: { curve: true, plants: true },
  supply: { curve: true, plants: true },
  grid: {},
  plants: { plants: true },
  gas: { gas: true },
  history: { monthly: true },
};

const TABS: { id: PhoneTab; label: string; icon: ReactNode }[] = [
  { id: 'today', label: 'Today', icon: <path d="M3 17l5-6 4 3 6-8 3 4" /> },
  { id: 'supply', label: 'Supply', icon: <path d="M13 2L4 14h7l-1 8 9-12h-7z" /> },
  { id: 'grid', label: 'Grid', icon: <><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M8 6h8M7 8l4 8M17 8l-4 8" /></> },
  { id: 'plants', label: 'Plants', icon: <path d="M3 21V10l5 3V10l5 3V6l8-3v18z" /> },
  { id: 'gas', label: 'Gas', icon: <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" /> },
];

/** Desktop ?tab= values, so a shared desktop link opens the right phone screen. */
export const TAB_FROM_DESKTOP: Record<string, PhoneTab> = {
  overview: 'today', gen: 'supply', regional: 'grid', imports: 'supply', renewables: 'supply',
  plants: 'plants', gas: 'gas', macro: 'history', timemachine: 'history', transmission: 'grid',
};

const Icon = ({ children, size = 22 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export function GridPhoneApp({
  latestDate,
  runtimeDates = [],
  initialTab = 'today',
  initialDate,
  initialHistory = 'trends',
  verificationLedger,
  onClassic,
}: {
  latestDate?: string;
  runtimeDates?: string[];
  initialTab?: PhoneTab;
  initialDate?: string;
  initialHistory?: 'trends' | 'macro' | 'machine';
  /** verify:source summaries, server-read (verification-ledger.server.ts), as the desktop gets them. */
  verificationLedger?: Record<string, LedgerDay>;
  onClassic: () => void;
}) {
  const access = useGridTierAccess(latestDate);
  useEffect(() => {
    setDateGuard((iso) => dateRequestable(iso, { loading: access.loading, tier: access.tier, bundledLatest: getLatestAvailableDate() ?? latestDate ?? '' }));
    return () => setDateGuard(null);
  }, [access.loading, access.tier, latestDate]);

  const heldDates = useMemo(() => Array.from(new Set([...availableDates, ...runtimeDates])).sort(), [runtimeDates]);
  const pending = useMemo(() => pendingDays(heldDates[heldDates.length - 1] ?? null), [heldDates]);
  const allDates = useMemo(() => Array.from(new Set([...heldDates, ...pending.map((d) => d.date)])).sort(), [heldDates, pending]);
  const allowed = useMemo(() => {
    const ok = access.filterDates(heldDates);
    return Array.from(new Set([...ok, ...pending.map((d) => d.date)])).sort();
  }, [access, heldDates, pending]);
  const allowedHeld = useMemo(() => allowed.filter((d) => heldDates.includes(d)), [allowed, heldDates]);
  const newest = allowedHeld[allowedHeld.length - 1] ?? latestDate ?? heldDates[heldDates.length - 1] ?? null;

  const [date, setDate] = useState<string | null>(initialDate ?? null);
  const current = date ?? newest;
  const pendingDay = current ? pendingDayFor(current, heldDates[heldDates.length - 1] ?? null) : null;
  const future = current ? isBeyondToday(current) : false;
  const notHeld = !!current && !heldDates.includes(current);
  const locked = current && !pendingDay && !future ? !access.loading && !access.canAccessDate(current) : false;
  const skipFetch = locked || !!pendingDay || future;
  const [tab, setTab] = useState<PhoneTab>(initialTab);

  const week = useWeekWindow(allowedHeld, current, 7);
  const prevDate = week.length > 1 ? week[week.length - 2] : null;
  const day = useDay(skipFetch ? null : current);
  const weekDays = useDays(week, !skipFetch);
  const need = NEEDS[tab];
  const curve = useCurve(skipFetch ? null : current, !!need.curve);
  const plants = usePlants(skipFetch ? null : current, !!need.plants);
  const gas = useGasDay(skipFetch ? null : current, !!need.gas);
  const gasWeek = useGasDays(week, !!need.gas && !skipFetch);
  const monthly = useMonthly(!!need.monthly);

  const [sheet, setSheet] = useState<ReactNode | null>(null);
  const openSheet = useCallback((c: ReactNode | null) => setSheet(c), []);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const swipe = useRef<number | null>(null);

  const mainRef = useRef<HTMLDivElement | null>(null);

  // TRIAL (2026-11-12): three looks in one bundle so the owner can compare them
  // on the phone. Remove the switcher and two of the sheets once one is chosen.
  const [look, setLook] = useState<'editorial' | 'cards' | 'ink'>('cards');
  useEffect(() => {
    try { const v = localStorage.getItem('gp-look'); if (v === 'editorial' || v === 'cards' || v === 'ink') setLook(v); } catch {}
  }, []);
  const pickLook = (v: 'editorial' | 'cards' | 'ink') => { setLook(v); try { localStorage.setItem('gp-look', v); } catch {} };

  // Long explanatory paragraphs fold to two lines; a tap opens them. Nothing is
  // removed - the owner asked (2026-11-12) for explanations to be cut down or
  // hidden so the figures lead. Only paragraphs that actually overflow two
  // lines are folded (`data-long`), so a one-line caption is left alone. The
  // observer re-marks after lazy sections and date changes swap content in.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const PROSE = '.gp-taudit, .gp-note, .gps-note, .gp-sec__desc';
    let raf = 0;
    const mark = () => {
      raf = 0;
      main.querySelectorAll<HTMLElement>(PROSE).forEach((el) => {
        if (el.dataset.open === '1') return;
        const lh = parseFloat(getComputedStyle(el).lineHeight) || 20;
        const was = el.dataset.long;
        delete el.dataset.long;
        const long = el.scrollHeight > lh * 2 + 6;
        if (long) el.dataset.long = '1';
        else if (was) delete el.dataset.long;
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(mark); };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('button, a, [role="button"]')) return;
      const el = t.closest<HTMLElement>(PROSE);
      if (!el || !(el.dataset.long || el.dataset.open)) return;
      if (el.dataset.open === '1') { delete el.dataset.open; el.dataset.long = '1'; } else { el.dataset.open = '1'; delete el.dataset.long; }
    };
    const mo = new MutationObserver(queue);
    mo.observe(main, { childList: true, subtree: true });
    main.addEventListener('click', onClick);
    queue();
    return () => { mo.disconnect(); main.removeEventListener('click', onClick); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const chipsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    chipsRef.current?.querySelector('.is-on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [current, allowed.length]);

  // Android back closes the sheet before it leaves the page.
  useEffect(() => {
    if (!sheet) return;
    history.pushState({ gpSheet: true }, '');
    const onPop = () => setSheet(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [sheet]);
  const closeSheet = () => {
    if (history.state?.gpSheet) history.back();
    else setSheet(null);
  };

  const chipDates = allowed.slice(-14);
  const study = current ? findEventStudyForDate(current) : undefined;
  const tierMsg = getTierStatusMessage(access.tier, heldDates.length);
  // The newest day just outside the reader's window (desktop previewLockedArchiveDate).
  const lockedPreview = useMemo(() => {
    const first = allowedHeld[0];
    if (!first) return null;
    const older = heldDates.filter((d) => d < first);
    return older[older.length - 1] ?? null;
  }, [allowedHeld, heldDates]);
  const avail = useMemo(() => (day.data ? tabAvailability(day.data) : null), [day.data]);
  const NAV_TAB: Partial<Record<PhoneTab, string>> = { today: 'overview', supply: 'gen', grid: 'regional', plants: 'plants', gas: 'gas' };
  const weekData = weekDays.data ?? [];
  const prevDay = weekData.length > 1 ? weekData[weekData.length - 2] : null;

  const openCalendar = () =>
    openSheet(
      <CalendarSheet
        all={allDates}
        allowed={allowed}
        current={current}
        signedIn={access.signedIn}
        onPick={(d) => {
          setDate(d);
          closeSheet();
        }}
      />,
    );

  const openMenu = () =>
    openSheet(
      <>
        <h3>Grid Explorer</h3>
        <p className="gp-sheet__sub">{current ? longDate(current) : ''}</p>
        <div className="gp-menu">
          <Link href="/">
            <Icon><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" /></Icon>
            <span>ESB Power Line home<small>Back to the news site</small></span>
          </Link>
          <button type="button" onClick={() => { closeSheet(); onClassic(); }}>
            <Icon><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8" /></Icon>
            <span>Full desktop view<small>Every table, the time machine, exports and methodology</small></span>
          </button>
          {access.signedIn && newest && (
            <div className="gp-menu__export">
              <Icon><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3" /></Icon>
              <span>Download grid data<small>Excel, CSV or a branded PDF report, for any range your plan covers</small></span>
              <GridExportDialog latestDate={newest} earliestDate={heldDates[0]} className="gp-menu__export-btn" />
            </div>
          )}
          {access.signedIn && (
            <button type="button" onClick={() => openSheet(<><h3>Your exports</h3><p className="gp-sheet__sub">The last five downloads on your account</p><div className="grid-explorer gp-host"><MemberToolsPanel latestDate={newest ?? undefined} earliestDate={heldDates[0]} /></div></>)}>
              <Icon><path d="M4 5h16v14H4zM4 9h16M9 13h6" /></Icon>
              <span>Your recent exports<small>Fetch a file again or open your library</small></span>
            </button>
          )}
          {!access.signedIn && (
            <Link href="/members/login?callbackUrl=/grid-explorer">
              <Icon><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3" /></Icon>
              <span>Log in to download data<small>Member access is needed for CSV, Excel and PDF exports</small></span>
            </Link>
          )}
          <Link href="/grid-explorer/archive">
            <Icon><path d="M4 7h16M4 12h16M4 17h10" /></Icon>
            <span>Daily archive<small>Every day since {heldDates[0] ?? '2013'}, one page each</small></span>
          </Link>
          {newest && (
            <Link href={`/grid-explorer/${newest}`}>
              <Icon><path d="M5 4h14v16H5zM9 8h6M9 12h6M9 16h3" /></Icon>
              <span>Latest day page<small>The headline figures for {newest}, as a page you can share</small></span>
            </Link>
          )}
          <Link href="/analysis">
            <Icon><path d="M4 19h16M7 16V9M12 16V5M17 16v-4" /></Icon>
            <span>Event studies<small>Breaks in the record, read day by day</small></span>
          </Link>
          {current && day.data && (
            <button type="button" onClick={() => openSheet(<><h3>Sources and standards</h3><p className="gp-sheet__sub">Where every figure on these screens comes from</p><div className="grid-explorer gp-host"><GridReportingStandards date={day.data!.systemStats.date} sourceFiles={day.data!.sourceFiles} /></div></>)}>
              <Icon><path d="M12 8h.01M11 12h1v4h1M12 21a9 9 0 110-18 9 9 0 010 18z" /></Icon>
              <span>Sources and standards<small>Report period, source files, how often each figure changes</small></span>
            </button>
          )}
          <div className="gp-menu__refresh"><RefreshGridDataButton /></div>
          {!access.signedIn && (
            <Link href="/sign-up">
              <Icon><path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" /></Icon>
              <span>Sign up free<small>Open more of the archive</small></span>
            </Link>
          )}
        </div>
      </>,
    );

  let body: ReactNode;
  if (!current) body = <Skeleton />;
  else if (future) {
    body = (
      <div className="gp-sec gp-lock">
        <h3>{longDate(current)} has not happened yet</h3>
        <p>This archive holds days the grid has already run. Pick a day up to today.</p>
        {newest && <button className="gp-btn" onClick={() => setDate(newest)}>Go to the latest day</button>}
      </div>
    );
  } else if (pendingDay) {
    body = (
      <div className="gp-sec gp-lock">
        <Icon size={32}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
        <h3>{pendingDay.status === 'in-progress' ? 'This energy day is still being measured' : 'Awaiting PGCB’s report for this day'}</h3>
        <p>{pendingDay.note}</p>
        <p style={{ fontSize: 13 }}>Energy day {current} runs midnight to midnight. PGCB files its report on the morning of {pendingDay.dueDate}. This archive collects it four times a day and publishes it the moment it appears.</p>
        {newest && <button className="gp-btn" onClick={() => setDate(newest)}>Open the latest report</button>}
      </div>
    );
  } else if (locked) {
    body = (
      <div className="gp-sec gp-lock">
        <Icon size={32}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></Icon>
        <h3>{longDate(current)} is in the archive</h3>
        <p>Your access covers the most recent days. Sign up free to open more of the archive.</p>
        <Link className="gp-btn" href={access.signedIn ? '/members/subscription' : '/sign-up'}>{access.signedIn ? 'See plans' : 'Sign up free'}</Link>
      </div>
    );
  } else if (day.status === 'loading' && !day.data) body = <Skeleton />;
  else if (!day.data) {
    body = (
      <div className="gp-sec gp-lock">
        <h3>{notHeld ? 'Report has not been released for this day yet' : 'Report file not loaded yet'}</h3>
        <p>
          {notHeld
            ? `The daily grid status report for ${current} has not been finalized or published by PGCB/NLDC.`
            : `The ${current} PGCB daily report is in our catalog but could not be fetched — it may still be syncing to the site mirror.`}
        </p>
        {newest && current !== newest && <button className="gp-btn" onClick={() => setDate(newest)}>View latest report ({dm(newest)})</button>}
      </div>
    );
  } else {
    const ctx: PhoneData = {
      date: current,
      latestDate: newest ?? current,
      day: day.data,
      prevDate,
      prev: prevDay,
      weekDates: week,
      week: weekData,
      curve: curve.data,
      plants: plants.data,
      plantsLoading: plants.status === 'loading',
      gas: gas.data,
      gasLoading: gas.status === 'loading',
      gasWeek: gasWeek.data ?? [],
      monthly: monthly.data,
      access,
      setDate,
      provenance: describeDayProvenance(current, verificationLedger?.[current]),
    };
    const screen =
      tab === 'today' ? <TodayScreen /> :
      tab === 'supply' ? <SupplyScreen /> :
      tab === 'grid' ? <GridScreen /> :
      tab === 'plants' ? (plants.status === 'loading' && !plants.data ? <Skeleton /> : <PlantsScreen />) :
      tab === 'gas' ? (gas.status === 'loading' && !gas.data ? <Skeleton /> : <GasScreen />) :
      <HistoryScreen initialView={initialHistory} />;
    body = (
      <PhoneDataContext.Provider value={ctx}>
        <PowerGridExplorerErrorBoundary>{screen}</PowerGridExplorerErrorBoundary>
      </PhoneDataContext.Provider>
    );
  }

  return (
    <SheetContext.Provider value={openSheet}>
      <div className="gp" data-look={look} role="application" aria-label="Power Grid Explorer">
        <div className="gp-looks" aria-label="Trial look">
          {(['editorial', 'cards', 'ink'] as const).map((v, i) => (
            <button key={v} type="button" className={look === v ? 'is-on' : ''} onClick={() => pickLook(v)} aria-label={`Look ${v}`}>{'ABC'[i]}</button>
          ))}
        </div>
        <header className={`gp-bar${scrolled ? ' is-scrolled' : ''}`}>
          <div className="gp-bar__row">
            <button type="button" className="gp-icon" aria-label="Menu" onClick={openMenu}>
              <Icon><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
            </button>
            <div className="gp-bar__title">
              <strong>Grid Explorer</strong>
              <span>
                {current ? longDate(current) : 'ESB Power Line'}
                {current && newest ? <> · <em className="gp-badge">{backlogBadge(current, newest, pendingDay?.status ?? null).text}</em></> : null}
              </span>
            </div>
            <button type="button" className={`gp-icon${tab === 'history' ? ' is-on' : ''}`} aria-label="History: trends, macro and the time machine" aria-pressed={tab === 'history'} onClick={() => setTab(tab === 'history' ? 'today' : 'history')}>
              <Icon><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5M12 7v5l4 2" /></Icon>
            </button>
          </div>
          <div className="gp-chips" ref={chipsRef} role="tablist" aria-label="Day">
            {chipDates.map((d) => (
              <button key={d} role="tab" aria-selected={d === current} aria-label={longDate(d)} className={`gp-chip${d === current ? ' is-on' : ''}`} onClick={() => setDate(d)}>
                <small>{wd(d)}</small>
                <b>{+d.slice(8)}</b>
              </button>
            ))}
            {current && !chipDates.includes(current) && (
              <button className="gp-chip is-on" aria-label={longDate(current)}><small>{wd(current)}</small><b>{+current.slice(8)}</b></button>
            )}
            {current && newest && current !== newest && (
              <button className="gp-chip gp-chip--latest" onClick={() => setDate(newest)} aria-label="Go to the latest day">
                <small>Go to</small>
                <b>Latest</b>
              </button>
            )}
            <button className="gp-chip gp-chip--cal" aria-label="Older days" onClick={openCalendar}>
              <Icon size={20}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>
            </button>
          </div>
        </header>

        <main ref={mainRef} className="gp-main" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}>
          {study && (
            <Link className="gp-study" href={`/analysis/${study.slug}#day-${current}`}>
              <span className="gp-study__k">Event study</span>
              <span className="gp-study__t">This day falls inside “{study.title}”</span>
              <span className="gp-chev">›</span>
            </Link>
          )}
          {body}
          {!access.loading && (
            <div className="gp-access">
              <div>
                <b>{tierMsg.statusLabel}</b> · {tierMsg.accessWindow}
                <span>{access.earliestAllowedDate ? `${access.earliestAllowedDate} → ${access.latestDate}` : `Full archive · through ${access.latestDate}`}</span>
              </div>
              {tierMsg.upgradeHref && (
                <Link href={tierMsg.upgradeHref}>{access.tier === 'visitor' ? 'Sign up free' : 'Upgrade'}</Link>
              )}
              {access.tier !== 'plan_999' && lockedPreview && (
                <button type="button" onClick={() => setDate(lockedPreview)}>Preview a locked day</button>
              )}
            </div>
          )}
        </main>

        <nav className="gp-nav" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${t.id === tab ? 'is-on' : ''}${avail && NAV_TAB[t.id] && avail[NAV_TAB[t.id] as keyof typeof avail]?.hasData === false ? ' is-empty' : ''}`}
              aria-current={t.id === tab ? 'page' : undefined}
              title={avail && NAV_TAB[t.id] ? avail[NAV_TAB[t.id] as keyof typeof avail]?.reason : undefined}
              onClick={() => setTab(t.id)}
            >
              <span className="gp-nav__ind"><Icon>{t.icon}</Icon></span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className={`gp-scrim${sheet ? ' is-on' : ''}`} onClick={closeSheet} />
        <div
          ref={sheetRef}
          className={`gp-sheet${sheet ? ' is-on' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!sheet}
          onTouchStart={(e) => (swipe.current = e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (swipe.current != null && e.changedTouches[0].clientY - swipe.current > 80 && (sheetRef.current?.scrollTop ?? 0) <= 0) closeSheet();
            swipe.current = null;
          }}
        >
          <div className="gp-grab" />
          {sheet}
        </div>
      </div>
    </SheetContext.Provider>
  );
}

function CalendarSheet({ all, allowed, current, signedIn, onPick }: { all: string[]; allowed: string[]; current: string | null; signedIn: boolean; onPick: (d: string) => void }) {
  const months = useMemo(() => Array.from(new Set(all.map((d) => d.slice(0, 7)))), [all]);
  const [m, setM] = useState((current ?? all[all.length - 1] ?? '').slice(0, 7));
  const mi = months.indexOf(m);
  const allowedSet = useMemo(() => new Set(allowed), [allowed]);
  const held = useMemo(() => new Set(all), [all]);
  const [y, mo] = m.split('-').map(Number);
  const first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
  const lead = (first + 6) % 7; // weeks start on Monday
  const daysIn = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const label = m ? new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
  const cells = Array.from({ length: daysIn }, (_, k) => `${m}-${String(k + 1).padStart(2, '0')}`);
  const anyLocked = cells.some((d) => held.has(d) && !allowedSet.has(d));
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <button className="gp-icon" aria-label="Previous month" disabled={mi <= 0} onClick={() => setM(months[mi - 1])}><Icon><path d="M15 6l-6 6 6 6" /></Icon></button>
        <h3 style={{ flex: 1, textAlign: 'center' }}>{label}</h3>
        <button className="gp-icon" aria-label="Next month" disabled={mi >= months.length - 1} onClick={() => setM(months[mi + 1])}><Icon><path d="M9 6l6 6-6 6" /></Icon></button>
      </div>
      <div className="gp-cal">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <div key={d} className="gp-cal__dow">{d}</div>)}
        {Array.from({ length: lead }, (_, k) => <div key={`l${k}`} />)}
        {cells.map((d) => {
          const has = held.has(d);
          const ok = allowedSet.has(d);
          return (
            <button key={d} disabled={!ok} aria-label={`${d}${has && !ok ? ', locked' : !has ? ', no report' : ''}`} className={`${d === current ? 'is-on' : ok ? 'has' : has ? 'locked' : ''}`} onClick={() => onPick(d)}>
              {+d.slice(8)}
            </button>
          );
        })}
      </div>
      {anyLocked && (
        <p className="gp-sheet__sub" style={{ marginTop: 16, textAlign: 'center' }}>
          Hatched days are in the archive. <Link href={signedIn ? '/members/subscription' : '/sign-up'}>{signedIn ? 'See plans' : 'Sign up free'}</Link> to open them.
        </p>
      )}
    </>
  );
}
