export type AdminTimeFormat = '12' | '24';

export const ADMIN_TIME_FORMAT_STORAGE_KEY = 'esb-admin-time-format';

export function readAdminTimeFormat(): AdminTimeFormat {
  if (typeof window === 'undefined') return '12';
  const stored = window.localStorage.getItem(ADMIN_TIME_FORMAT_STORAGE_KEY);
  return stored === '24' ? '24' : '12';
}

export function writeAdminTimeFormat(format: AdminTimeFormat) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_TIME_FORMAT_STORAGE_KEY, format);
  window.dispatchEvent(new CustomEvent('admin-time-format-change', { detail: format }));
}

/** Time first (with seconds), then abbreviated month · day · year — admin panels only. */
export function formatAdminDateTime(
  value: string | Date,
  format: AdminTimeFormat = '12',
  options?: { showSeconds?: boolean },
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const showSeconds = options?.showSeconds ?? true;

  const time = date.toLocaleTimeString('en-US', {
    hour: format === '24' ? '2-digit' : 'numeric',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
    hour12: format === '12',
  });

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${time} · ${datePart}`;
}