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
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { availableDates, getLatestAvailableDate } from '@/lib/data/grid/available-dates';
import { dateRequestable, setDateGuard } from '@/lib/data/grid/client-date-window';
import { useGridTierAccess } from '@/hooks/useGridTierAccess';
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
  onClassic,
}: {
  latestDate?: string;
  runtimeDates?: string[];
  initialTab?: PhoneTab;
  initialDate?: string;
  initialHistory?: 'trends' | 'macro' | 'machine';
  onClassic: () => void;
}) {
  const access = useGridTierAccess(latestDate);
  useEffect(() => {
    setDateGuard((iso) => dateRequestable(iso, { loading: access.loading, tier: access.tier, bundledLatest: getLatestAvailableDate() ?? latestDate ?? '' }));
    return () => setDateGuard(null);
  }, [access.loading, access.tier, latestDate]);

  const allDates = useMemo(() => Array.from(new Set([...availableDates, ...runtimeDates])).sort(), [runtimeDates]);
  const allowed = useMemo(() => access.filterDates(allDates), [access, allDates]);
  const newest = allowed[allowed.length - 1] ?? latestDate ?? allDates[allDates.length - 1] ?? null;

  const [date, setDate] = useState<string | null>(initialDate && allDates.includes(initialDate) ? initialDate : null);
  const current = date ?? newest;
  const locked = current ? !access.loading && !access.canAccessDate(current) : false;
  const [tab, setTab] = useState<PhoneTab>(initialTab);

  const week = useWeekWindow(allowed, current, 7);
  const prevDate = week.length > 1 ? week[week.length - 2] : null;
  const day = useDay(locked ? null : current);
  const weekDays = useDays(week, !locked);
  const need = NEEDS[tab];
  const curve = useCurve(locked ? null : current, !!need.curve);
  const plants = usePlants(locked ? null : current, !!need.plants);
  const gas = useGasDay(locked ? null : current, !!need.gas);
  const gasWeek = useGasDays(week, !!need.gas && !locked);
  const monthly = useMonthly(!!need.monthly);

  const [sheet, setSheet] = useState<ReactNode | null>(null);
  const openSheet = useCallback((c: ReactNode | null) => setSheet(c), []);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const swipe = useRef<number | null>(null);

  const mainRef = useRef<HTMLDivElement | null>(null);
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
          <Link href="/grid-explorer/archive">
            <Icon><path d="M4 7h16M4 12h16M4 17h10" /></Icon>
            <span>Daily archive<small>Every day since 2013, one page each</small></span>
          </Link>
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
  else if (locked) {
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
        <h3>No report for {dm(current)}</h3>
        <p>PGCB’s report for this day is not in the archive yet.</p>
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
    };
    const screen =
      tab === 'today' ? <TodayScreen /> :
      tab === 'supply' ? <SupplyScreen /> :
      tab === 'grid' ? <GridScreen /> :
      tab === 'plants' ? (plants.status === 'loading' && !plants.data ? <Skeleton /> : <PlantsScreen />) :
      tab === 'gas' ? (gas.status === 'loading' && !gas.data ? <Skeleton /> : <GasScreen />) :
      <HistoryScreen initialView={initialHistory} />;
    body = <PhoneDataContext.Provider value={ctx}>{screen}</PhoneDataContext.Provider>;
  }

  return (
    <SheetContext.Provider value={openSheet}>
      <div className="gp" role="application" aria-label="Power Grid Explorer">
        <header className={`gp-bar${scrolled ? ' is-scrolled' : ''}`}>
          <div className="gp-bar__row">
            <button type="button" className="gp-icon" aria-label="Menu" onClick={openMenu}>
              <Icon><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
            </button>
            <div className="gp-bar__title">
              <strong>Grid Explorer</strong>
              <span>{current ? longDate(current) : 'ESB Power Line'}</span>
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
            <button className="gp-chip gp-chip--cal" aria-label="Older days" onClick={openCalendar}>
              <Icon size={20}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>
            </button>
          </div>
        </header>

        <main ref={mainRef} className="gp-main" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}>
          {body}
        </main>

        <nav className="gp-nav" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={t.id === tab ? 'is-on' : ''} aria-current={t.id === tab ? 'page' : undefined} onClick={() => setTab(t.id)}>
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
