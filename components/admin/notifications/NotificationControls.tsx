'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AdminCard } from '@/components/admin/AdminUI';
import {
  clearNotificationHealth,
  sendNotificationTest,
  updateNotificationSettings,
  type EditableNotificationSettings,
} from '@/lib/actions/notifications';

type Feature = 'news' | 'gridHourly' | 'gridAlerts' | 'dailySummary' | 'commands';
type Threshold =
  | 'loadShedAlertMw'
  | 'loadShedClearMw'
  | 'loadShedEscalationMw'
  | 'loadShedRealertHours'
  | 'generationDropAlertMw'
  | 'gridMaxAgeHours'
  | 'hourlyMinIntervalMinutes'
  | 'articleMaxAgeHours';

export interface ControlsConfig extends Record<Feature | Threshold, boolean | number> {
  paused: boolean;
}

const FEATURES: Array<{ key: Feature; label: string; hint: string }> = [
  { key: 'news', label: 'News', hint: 'Post each article when it is published' },
  { key: 'gridHourly', label: 'Hourly grid update', hint: 'The newest NLDC hour, at most once an hour' },
  { key: 'gridAlerts', label: 'Grid alerts', hint: 'High load shedding and sharp generation drops' },
  { key: 'dailySummary', label: 'Daily summary', hint: 'PGCB’s figures for each energy day' },
  { key: 'commands', label: 'Bot commands', hint: '/grid, /latest and the rest (admin commands always work)' },
];

const THRESHOLDS: Array<{ key: Threshold; label: string; unit: string; basis: string }> = [
  { key: 'loadShedAlertMw', label: 'Load shed alert at', unit: 'MW', basis: '2.6% of posted hours reached 3,000 MW (Apr–Sep 2026)' },
  { key: 'loadShedClearMw', label: 'Clears below', unit: 'MW', basis: 'Must be under the alert level, so a value at the line does not flap' },
  { key: 'loadShedEscalationMw', label: 'Re-alert after a rise of', unit: 'MW', basis: 'While active, only a real rise re-alerts' },
  { key: 'loadShedRealertHours', label: 'Re-alert no sooner than', unit: 'h', basis: 'Measured in NLDC’s hours, not the clock' },
  { key: 'generationDropAlertMw', label: 'Generation drop alert at', unit: 'MW / h', basis: 'Twice in the year to Sep 2026; 2022-10-04 was 7,176' },
  { key: 'gridMaxAgeHours', label: 'Grid hours older than this are not posted', unit: 'h', basis: 'NLDC’s p90 posting lag is 6.3 h' },
  { key: 'hourlyMinIntervalMinutes', label: 'Minimum gap between hourly updates', unit: 'min', basis: 'NLDC posts in batches; only the newest is posted' },
  { key: 'articleMaxAgeHours', label: 'Articles older than this are not announced', unit: 'h', basis: 'Keeps imports and backdated stories off the channel' },
];

export function NotificationControls({ config, canTest }: { config: ControlsConfig; canTest: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [values, setValues] = useState(config);
  const [note, setNote] = useState('');

  const save = (patch: EditableNotificationSettings, done: string) =>
    start(async () => {
      const res = await updateNotificationSettings(patch);
      if (res.ok) {
        toast.success(done);
        router.refresh();
      } else {
        toast.error(res.error);
        setValues(config);
      }
    });

  const thresholdsChanged = THRESHOLDS.some((t) => values[t.key] !== config[t.key]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminCard title="Switches">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{config.paused ? 'Paused' : 'Posting'}</p>
            <p className="text-xs text-muted-foreground">
              {config.paused ? 'Nothing is posted. Queued posts wait and are not lost.' : 'Emergency stop for everything that posts to the channel.'}
            </p>
          </div>
          <Button
            size="sm"
            variant={config.paused ? 'default' : 'outline'}
            className={config.paused ? undefined : 'border-destructive/40 text-destructive hover:bg-destructive/10'}
            disabled={pending}
            onClick={() => save({ paused: !config.paused }, config.paused ? 'Resumed' : 'Paused')}
          >
            {config.paused ? 'Resume' : 'Pause all'}
          </Button>
        </div>
        <ul className="mt-2 divide-y divide-border">
          {FEATURES.map((f) => (
            <li key={f.key} className="flex items-center justify-between gap-4 py-3">
              <div>
                <Label htmlFor={`feature-${f.key}`} className="text-sm font-medium">{f.label}</Label>
                <p className="text-xs text-muted-foreground">{f.hint}</p>
              </div>
              <Switch
                id={`feature-${f.key}`}
                checked={Boolean(values[f.key])}
                disabled={pending}
                onCheckedChange={(checked) => {
                  setValues((v) => ({ ...v, [f.key]: checked }));
                  save({ [f.key]: checked }, `${f.label} ${checked ? 'on' : 'off'}`);
                }}
              />
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4">
          <Label htmlFor="test-note" className="text-sm font-medium">Test message</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            {canTest ? 'Posts to the test destination only, never the public channel.' : 'Set TELEGRAM_TEST_CHAT_ID to enable.'}
          </p>
          <div className="flex gap-2">
            <Input id="test-note" value={note} maxLength={200} placeholder="Optional note" onChange={(e) => setNote(e.target.value)} disabled={!canTest || pending} />
            <Button
              size="sm"
              variant="outline"
              disabled={!canTest || pending}
              onClick={() =>
                start(async () => {
                  const res = await sendNotificationTest(note);
                  if (res.ok) {
                    toast.success('Test queued');
                    setNote('');
                    router.refresh();
                  } else toast.error(res.error);
                })
              }
            >
              Send test
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-3 px-0 text-xs text-muted-foreground"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await clearNotificationHealth();
                if (res.ok) {
                  toast.success('Recorded Telegram errors cleared');
                  router.refresh();
                } else toast.error(res.error);
              })
            }
          >
            Clear recorded Telegram errors
          </Button>
        </div>
      </AdminCard>

      <AdminCard title="Thresholds">
        <div className="grid gap-3">
          {THRESHOLDS.map((t) => (
            <div key={t.key} className="grid grid-cols-[1fr_7.5rem] items-center gap-3">
              <div className="min-w-0">
                <Label htmlFor={`t-${t.key}`} className="text-sm">{t.label}</Label>
                <p className="truncate text-[11px] text-muted-foreground" title={t.basis}>{t.basis}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  id={`t-${t.key}`}
                  type="number"
                  inputMode="numeric"
                  className="h-8 text-right tabular-nums"
                  value={String(values[t.key])}
                  disabled={pending}
                  onChange={(e) => setValues((v) => ({ ...v, [t.key]: Number(e.target.value) }))}
                />
                <span className="w-10 shrink-0 text-[11px] text-muted-foreground">{t.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" disabled={!thresholdsChanged || pending} onClick={() => setValues(config)}>
            Reset
          </Button>
          <Button
            size="sm"
            disabled={!thresholdsChanged || pending}
            onClick={() =>
              save(Object.fromEntries(THRESHOLDS.map((t) => [t.key, Number(values[t.key])])) as EditableNotificationSettings, 'Thresholds saved')
            }
          >
            Save thresholds
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}
