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
import { TrendsScreen } from './TrendsScreen';

export type PhoneTab = 'today' | 'supply' | 'plants' | 'gas' | 'trends';

const TABS: { id: PhoneTab; label: string; icon: ReactNode }[] = [
  { id: 'today', label: 'Today', icon: <path d="M3 17l5-6 4 3 6-8 3 4" /> },
  { id: 'supply', label: 'Supply', icon: <path d="M13 2L4 14h7l-1 8 9-12h-7z" /> },
  { id: 'plants', label: 'Plants', icon: <path d="M3 21V10l5 3V10l5 3V6l8-3v18z" /> },
  { id: 'gas', label: 'Gas', icon: <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" /> },
  { id: 'trends', label: 'Trends', icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
];

/** Desktop ?tab= values, so a shared desktop link opens the right phone screen. */
export const TAB_FROM_DESKTOP: Record<string, PhoneTab> = {
  overview: 'today', gen: 'supply', regional: 'supply', imports: 'supply', renewables: 'supply',
  plants: 'plants', gas: 'gas', macro: 'trends', timemachine: 'trends', transmission: 'today',
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
  onClassic,
}: {
  latestDate?: string;
  runtimeDates?: string[];
  initialTab?: PhoneTab;
  initialDate?: string;
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
  const curve = useCurve(locked ? null : current, tab === 'today' || tab === 'supply');
  const plants = usePlants(locked ? null : current, tab === 'today' || tab === 'plants');
  const gas = useGasDay(locked ? null : current, tab === 'gas');
  const gasWeek = useGasDays(week, tab === 'gas' && !locked);
  const monthly = useMonthly(tab === 'trends');

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
      <div className="gp-card gp-lock">
        <Icon size={32}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></Icon>
        <h3>{longDate(current)} is in the archive</h3>
        <p>Your access covers the most recent days. Sign up free to open more of the archive.</p>
        <Link className="gp-btn" href={access.signedIn ? '/members/subscription' : '/sign-up'}>{access.signedIn ? 'See plans' : 'Sign up free'}</Link>
      </div>
    );
  } else if (day.status === 'loading' && !day.data) body = <Skeleton />;
  else if (!day.data) {
    body = (
      <div className="gp-card gp-lock">
        <h3>No report for {dm(current)}</h3>
        <p>PGCB’s report for this day is not in the archive yet.</p>
      </div>
    );
  } else {
    const d = day.data;
    body =
      tab === 'today' ? (
        <TodayScreen date={current} day={d} prev={prevDay} prevDate={prevDate} week={weekData} weekDates={week} curve={curve.data} plants={plants.data} />
      ) : tab === 'supply' ? (
        <SupplyScreen day={d} curve={curve.data} />
      ) : tab === 'plants' ? (
        plants.status === 'loading' && !plants.data ? <Skeleton /> : <PlantsScreen day={d} plants={plants.data} />
      ) : tab === 'gas' ? (
        gas.status === 'loading' && !gas.data ? <Skeleton /> : <GasScreen gas={gas.data} week={gasWeek.data ?? []} weekDates={week} />
      ) : (
        <TrendsScreen monthly={monthly.data} week={weekData} weekDates={week} date={current} />
      );
  }

  return (
    <SheetContext.Provider value={openSheet}>
      <div className="gp" role="application" aria-label="Power Grid Explorer">
        <header className={`gp-bar${scrolled ? ' is-scrolled' : ''}`}>
          <div className="gp-bar__row">
            <button type="button" className="gp-icon" aria-label="Menu" onClick={openMenu}>
              <Icon><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
            </button>
            <div className="gp-bar__title"><b>ESB</b> Grid Explorer</div>
            <button type="button" className="gp-icon" aria-label="Pick a date" onClick={openCalendar}>
              <Icon><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>
            </button>
          </div>
          <div className="gp-chips" ref={chipsRef} role="tablist" aria-label="Day">
            {chipDates.map((d) => (
              <button key={d} role="tab" aria-selected={d === current} className={`gp-chip${d === current ? ' is-on' : ''}`} onClick={() => setDate(d)}>
                {wd(d)} <small>{dm(d)}</small>
              </button>
            ))}
            {current && !chipDates.includes(current) && (
              <button className="gp-chip is-on">{wd(current)} <small>{dm(current)}</small></button>
            )}
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
  const days = all.filter((d) => d.startsWith(m));
  const label = m ? new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
  const anyLocked = days.some((d) => !allowedSet.has(d));
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <button className="gp-icon" aria-label="Previous month" disabled={mi <= 0} onClick={() => setM(months[mi - 1])}>‹</button>
        <h3 style={{ flex: 1, textAlign: 'center', margin: 0 }}>{label}</h3>
        <button className="gp-icon" aria-label="Next month" disabled={mi >= months.length - 1} onClick={() => setM(months[mi + 1])}>›</button>
      </div>
      <div className="gp-datelist">
        {days.map((d) => (
          <button key={d} disabled={!allowedSet.has(d)} className={d === current ? 'is-on' : ''} onClick={() => onPick(d)}>
            {+d.slice(8)}
            <small>{allowedSet.has(d) ? wd(d) : '🔒'}</small>
          </button>
        ))}
      </div>
      {anyLocked && (
        <p className="gp-sheet__sub" style={{ marginTop: 14, textAlign: 'center' }}>
          Locked days are in the archive. <Link href={signedIn ? '/members/subscription' : '/sign-up'}>{signedIn ? 'See plans' : 'Sign up free'}</Link> to open them.
        </p>
      )}
    </>
  );
}
