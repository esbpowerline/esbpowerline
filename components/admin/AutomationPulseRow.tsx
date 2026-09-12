'use client';

import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Bot, Clock3, Gauge } from 'lucide-react';
import { StaffStatGrid } from '@/components/staff/StaffUILayout';
import { AdminCard, AdminStatCard } from '@/components/admin/AdminUI';
import type { AutomationPulse } from '@/lib/data/grid/ingest-provenance.server';

/**
 * Is the automation running, and how recently.
 *
 * The panel could tell you the site was three days behind but not whether the
 * thing that fills those days was alive — so a dead Pi looked exactly like a
 * publisher who had not filed yet, and both look like "nothing to do". Each
 * figure here is read from what a runner actually writes, never from a
 * heartbeat it reports about itself: the hourly capture's newest stored hour,
 * the forecast board it last stored, and the newest release row of any kind.
 * A runner that claims success while writing nothing — which is precisely how
 * the hourly capture died for a day in September — cannot make these move.
 *
 * The thresholds are the same ones the Pi's own alerts use: one missed hourly
 * tick is normal (NLDC's page turns over on the hour and the next tick's
 * two-page walk picks it up), four in a row is not.
 */

const HOUR = 3_600_000;

/** "just now", "12s ago", "14 min ago", "3 h ago", "2 days ago" — dynamic and precise */
function formatAgo(iso: string | null, nowMs: number): string {
  if (!iso) return 'never';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'never';
  const diffMs = Math.max(0, nowMs - t);
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 36) return `${h} h ago`;
  return `${Math.floor(h / 24)} days ago`;
}

type Tone = 'ok' | 'warn' | 'bad' | 'idle';

/** Tone tints the tile's icon in the status colours, and nothing else. */
const TONE_ACCENT = { ok: 'emerald', warn: 'amber', bad: 'red', idle: 'sky' } as const;

/**
 * The shared KPI tile. This row had its own — a 10px label over a 14px value
 * with the icon beside it — so the two strips at the top of the Admin
 * Overview read at two different scales.
 */
function Stat({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return <AdminStatCard title={label} value={value} change={detail} icon={icon} accent={TONE_ACCENT[tone]} />;
}

export function AutomationPulseRow({
  pulse,
  degraded,
}: {
  pulse: AutomationPulse;
  degraded: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  // Real-time ticking every second strictly on the client browser.
  // 0 server queries, 0 database reads, 0 API calls — 100% wallet safe.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (pulse.degraded || degraded) {
    return (
      <AdminCard title="The release database could not be read" icon={AlertTriangle} className="admin-card--warn">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Coverage below is what this machine holds on disk, which on the deployed panel is
          nothing. Nothing is wrong with the site — readers are served from the same rows this
          screen could not reach.
        </p>
      </AdminCard>
    );
  }

  const hourlyAge = pulse.hourlyFetchedAt ? Math.max(0, now - Date.parse(pulse.hourlyFetchedAt)) : null;
  // Four consecutive misses is the Pi's own alerting threshold; below that a
  // gap is ordinary. Reported against fetchedAt, not observedAt: NLDC's newest
  // published hour lags the clock, and judging the capture by the publisher's
  // lag would call a healthy Pi late.
  const hourlyTone: Tone =
    hourlyAge === null ? 'bad' : hourlyAge > 4 * HOUR ? 'bad' : hourlyAge > 2 * HOUR ? 'warn' : 'ok';

  const publishAge = pulse.lastPublishAt ? Math.max(0, now - Date.parse(pulse.lastPublishAt)) : null;
  // The daily poll runs four times between 09:30 and 21:30 Dhaka and publishes
  // only when something moved, so a quiet overnight stretch is normal and a day
  // and a half of silence is not.
  const publishTone: Tone =
    publishAge === null ? 'idle' : publishAge > 36 * HOUR ? 'warn' : 'ok';

  const hoursTone: Tone =
    pulse.hoursLast24 >= 20 ? 'ok' : pulse.hoursLast24 >= 12 ? 'warn' : 'bad';

  return (
    // The shared strip, not `admin-stat-grid sm:grid-cols-2 lg:grid-cols-4`:
    // staff-surface.css loads after Tailwind's utilities, so those two
    // classes never won and the row followed whatever the stylesheet did.
    <StaffStatGrid>
      <Stat
        icon={Activity}
        label="Hourly capture"
        value={formatAgo(pulse.hourlyFetchedAt, now)}
        detail={
          pulse.hourlyObservedAt
            ? `newest hour ${new Date(pulse.hourlyObservedAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Asia/Dhaka',
              })}`
            : 'no NLDC rows stored'
        }
        tone={hourlyTone}
      />
      <Stat
        icon={Gauge}
        label="Hours in the last 24"
        value={`${pulse.hoursLast24} / 24`}
        detail={pulse.hoursLast24 >= 20 ? 'NLDC read on the hour' : 'ticks were missed'}
        tone={hoursTone}
      />
      <Stat
        icon={Clock3}
        label="Forecast board"
        value={pulse.boardDate ?? '—'}
        detail={pulse.boardFetchedAt ? `read ${formatAgo(pulse.boardFetchedAt, now)}` : 'never captured'}
        tone={pulse.boardDate ? 'ok' : 'idle'}
      />
      <Stat
        icon={Bot}
        label="Last publish"
        value={formatAgo(pulse.lastPublishAt, now)}
        detail={
          pulse.lastPublishActor === 'pi'
            ? 'by the Pi, automatically'
            : pulse.lastPublishActor === 'panel'
              ? 'from this panel'
              : 'source not recorded'
        }
        tone={publishTone}
      />
    </StaffStatGrid>
  );
}
