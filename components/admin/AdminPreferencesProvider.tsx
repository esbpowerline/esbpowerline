'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ADMIN_TIME_FORMAT_STORAGE_KEY,
  readAdminTimeFormat,
  writeAdminTimeFormat,
  type AdminTimeFormat,
} from '@/lib/admin-time-format';

type AdminPreferencesContextValue = {
  timeFormat: AdminTimeFormat;
  setTimeFormat: (format: AdminTimeFormat) => void;
};

const AdminPreferencesContext = createContext<AdminPreferencesContextValue | null>(null);

export function AdminPreferencesProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormatState] = useState<AdminTimeFormat>('12');

  useEffect(() => {
    setTimeFormatState(readAdminTimeFormat());

    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key === ADMIN_TIME_FORMAT_STORAGE_KEY) {
        setTimeFormatState(readAdminTimeFormat());
      }
    }

    function onCustom(event: Event) {
      const detail = (event as CustomEvent<AdminTimeFormat>).detail;
      if (detail === '12' || detail === '24') setTimeFormatState(detail);
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('admin-time-format-change', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('admin-time-format-change', onCustom);
    };
  }, []);

  const setTimeFormat = useCallback((format: AdminTimeFormat) => {
    writeAdminTimeFormat(format);
    setTimeFormatState(format);
  }, []);

  const value = useMemo(
    () => ({ timeFormat, setTimeFormat }),
    [timeFormat, setTimeFormat],
  );

  return (
    <AdminPreferencesContext.Provider value={value}>
      {children}
    </AdminPreferencesContext.Provider>
  );
}

/**
 * Outside a provider this answers with the default rather than throwing.
 *
 * It threw, and on 2026-09-12 that took down the CMS's All Articles page in
 * production: the shared article manager started rendering its Updated column
 * through AdminFormattedTime, only AdminShell mounted the provider, and every
 * row on /cms/articles threw. A clock-format preference must never be able to
 * take a page down — the same fail-soft stance middleware takes. CmsShell now
 * mounts the provider too; this is the backstop for the next shared component.
 */
const FALLBACK_PREFERENCES: AdminPreferencesContextValue = {
  timeFormat: '12',
  setTimeFormat: writeAdminTimeFormat,
};

export function useAdminPreferences() {
  return useContext(AdminPreferencesContext) ?? FALLBACK_PREFERENCES;
}