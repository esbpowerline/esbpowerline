'use client';

/**
 * Decides, on the client, whether this reader gets the phone app.
 *
 * The server always renders the desktop explorer — that HTML is what crawlers
 * index and what a reader without JavaScript sees — so nothing here can change
 * the served page. Below 768px the app mounts as a full-screen layer over it.
 * A reader who picks "Full desktop view" stays on the page underneath, and that
 * choice is remembered on the device; a small pill brings the app back.
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TAB_FROM_DESKTOP, type PhoneTab } from './GridPhoneApp';

const GridPhoneApp = dynamic(() => import('./GridPhoneApp').then((m) => m.GridPhoneApp), { ssr: false });

const CLASSIC_KEY = 'esb-grid-classic-view';
const PHONE = '(max-width: 767px)';

export function GridPhoneGate({ latestDate, runtimeDates }: { latestDate?: string; runtimeDates?: string[] }) {
  const [phone, setPhone] = useState(false);
  const [classic, setClassic] = useState(false);
  const [boot, setBoot] = useState<{ tab: PhoneTab; date?: string }>({ tab: 'today' });

  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    try {
      setClassic(localStorage.getItem(CLASSIC_KEY) === '1');
    } catch {}
    const q = new URLSearchParams(window.location.search);
    const t = q.get('tab');
    const d = q.get('date');
    setBoot({ tab: (t && TAB_FROM_DESKTOP[t]) || 'today', date: d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined });
    return () => mq.removeEventListener('change', sync);
  }, []);

  const on = phone && !classic;
  useEffect(() => {
    document.documentElement.classList.toggle('gp-on', on);
    return () => document.documentElement.classList.remove('gp-on');
  }, [on]);

  const setClassicView = (v: boolean) => {
    setClassic(v);
    try {
      if (v) localStorage.setItem(CLASSIC_KEY, '1');
      else localStorage.removeItem(CLASSIC_KEY);
    } catch {}
  };

  if (!phone) return null;
  if (classic) {
    return (
      <button
        type="button"
        onClick={() => setClassicView(false)}
        className="no-print"
        style={{ position: 'fixed', right: 14, bottom: 'calc(env(safe-area-inset-bottom) + 14px)', zIndex: 70, height: 44, padding: '0 18px', borderRadius: 22, border: 0, background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}
      >
        Open app view
      </button>
    );
  }
  // Portalled to <body>: inside <main> the layer sat in the page's stacking
  // context, and the site header and the explorer's sticky date bar drew over it.
  return createPortal(
    <GridPhoneApp latestDate={latestDate} runtimeDates={runtimeDates} initialTab={boot.tab} initialDate={boot.date} onClassic={() => setClassicView(true)} />,
    document.body,
  );
}
