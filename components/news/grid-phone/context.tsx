'use client';

/**
 * Everything a phone screen needs about the open day, provided once by the
 * app shell. Screens read it with usePhone() instead of threading props, so a
 * new section never changes the shell's signature.
 *
 * Feeds load lazily: the shell asks for a feed only when a screen that uses
 * it is open (see NEEDS in GridPhoneApp). A screen that needs something not
 * listed here fetches it itself through the existing loaders in
 * lib/data/** — never with a hand-written URL — so the tier gate and the
 * release-over-static precedence still apply.
 */

import { createContext, useContext } from 'react';
import type { DailyPlantDetail, EnergyCurve, GridDailyData } from '@/lib/data/grid/types';
import type { PetrobanglaDaily } from '@/lib/data/petrobangla/types';
import type { GridTierAccessState } from '@/hooks/useGridTierAccess';
import type { MonthlyRow } from './useGridPhoneData';

export type PhoneData = {
  /** The open energy day, ISO. */
  date: string;
  /** Newest day the site serves. */
  latestDate: string;
  day: GridDailyData;
  /** The previous day the reader may open, and its report (null if not loaded or absent). */
  prevDate: string | null;
  prev: GridDailyData | null;
  /** Up to 7 days ending at `date`, oldest first, among the days the reader may open. */
  weekDates: string[];
  week: (GridDailyData | null)[];
  curve: EnergyCurve | null;
  plants: DailyPlantDetail | null;
  plantsLoading: boolean;
  /** Petrobangla gas day opening 08:00 on `date`. */
  gas: PetrobanglaDaily | null;
  gasLoading: boolean;
  gasWeek: (PetrobanglaDaily | null)[];
  monthly: MonthlyRow[] | null;
  access: GridTierAccessState;
  /** Jump the whole app to another day. */
  setDate: (iso: string) => void;
};

export const PhoneDataContext = createContext<PhoneData | null>(null);

export function usePhone(): PhoneData {
  const v = useContext(PhoneDataContext);
  if (!v) throw new Error('usePhone() outside the phone app');
  return v;
}
