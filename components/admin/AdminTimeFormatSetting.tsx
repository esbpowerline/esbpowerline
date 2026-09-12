'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminCard } from '@/components/admin/AdminUI';
import { useAdminPreferences } from '@/components/admin/AdminPreferencesProvider';
import type { AdminTimeFormat } from '@/lib/admin-time-format';
import { formatAdminDateTime } from '@/lib/admin-time-format';

const OPTIONS: { value: AdminTimeFormat; label: string; hint: string }[] = [
  { value: '12', label: '12-hour', hint: '3:45 PM' },
  { value: '24', label: '24-hour', hint: '15:45' },
];

export function AdminTimeFormatSetting() {
  const { timeFormat, setTimeFormat } = useAdminPreferences();
  const preview = formatAdminDateTime(new Date(), timeFormat);

  return (
    <AdminCard title="Admin workspace" icon={Clock} className="lg:col-span-2" bodyClassName="admin-settings-body">
      <p className="admin-card-lead text-[12px] text-muted-foreground">
        Personal display preference for this browser. Affects timestamps across the admin console only — not the public site or editorial CMS.
      </p>

      <div className="admin-time-format-toggle" role="radiogroup" aria-label="Admin time format">
        {OPTIONS.map((option) => {
          const active = timeFormat === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={cn('admin-time-format-option', active && 'admin-time-format-option--active')}
              onClick={() => setTimeFormat(option.value)}
            >
              <span className="admin-time-format-option__label">{option.label}</span>
              <span className="admin-time-format-option__hint">e.g. {option.hint}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Preview: <span className="font-medium text-foreground">{preview}</span>
      </p>
    </AdminCard>
  );
}
