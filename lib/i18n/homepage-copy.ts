import type { SiteLocale } from '@/lib/locale';
import type { TickerItem } from '@/components/news/LiveMarketTicker';

/**
 * Keyed by `TickerItem.id`, so it has to be rekeyed whenever the strip's
 * contents change. It had drifted: `lng`, `coal`, `solar` and `gas` were ids of
 * the hardcoded specimen prices removed long ago, and matched nothing the
 * ticker actually emitted, so a Bengali reader saw English names for every item
 * but the tariff and the exchange rate.
 */
const ENERGY_TICKER_LABELS_BN: Record<string, string> = {
  'peak-gen': 'সান্ধ্য পিক উৎপাদন',
  'peak-demand': 'সান্ধ্য পিক চাহিদা',
  'energy-gen': 'উৎপাদিত বিদ্যুৎ',
  'production-cost': 'উৎপাদন খরচ',
  'energy-unserved': 'অপূরণীয় বিদ্যুৎ',
  'gas-prod': 'গ্যাস উৎপাদন',
  tariff: 'বাল্ক ট্যারিফ',
  'diesel-bpc': 'ডিজেল',
  'octane-bpc': 'অকটেন',
  fx: 'ডলার/টাকা',
};

const ENERGY_STAT_LABELS_BN: Record<string, string> = {
  'Generation Capacity': 'উৎপাদন ক্ষমতা',
  'Current Demand': 'বর্তমান চাহিদা',
  'Renewable Share': 'নবায়নযোগ্য অংশ',
  'RE Installed': 'নবায়নযোগ্য স্থাপিত',
  'RE Grid Share': 'নবায়নযোগ্য গ্রিড অংশ',
  'System Loss': 'সিস্টেম লস',
  'Gas Supply': 'গ্যাস সরবরাহ',
  'Forecast Demand': 'চাহিদার পূর্বাভাস',
  'Yesterday Peak Gen': 'গতকালের সর্বোচ্চ উৎপাদন',
  'Current Supply': 'বর্তমান সরবরাহ',
  'Current Generation': 'বর্তমান উৎপাদন',
  // Kept: the archive day pages and the Grid Explorer still print the peaks
  // under their own names, and this map is shared.
  'Peak Demand': 'পিক চাহিদা',
  'Peak Generation': 'পিক উৎপাদন',
  'Energy Unserved': 'অপূরণীয় বিদ্যুৎ',
  'Grid Import': 'গ্রিড আমদানি',
  'India Grid Import': 'ভারত থেকে আমদানি',
  'Solar Installed': 'সোলার স্থাপিত',
  'Daily Generation': 'দৈনিক উৎপাদন',
  'Load Shedding': 'লোড শেডিং',
  'Coal Generation': 'কয়লা বিদ্যুৎ',
  'Grid Frequency': 'গ্রিড ফ্রিকোয়েন্সি',
  'Production Cost': 'উৎপাদন খরচ',
  'Liquid Fuel Gen': 'তরল জ্বালানি বিদ্যুৎ',
  'Hydro Power': 'হাইড্রো বিদ্যুৎ',
};

const PROFESSIONALS_CTA_BN = {
  label: 'সদস্য সুবিধা',
  title: 'সংবাদ ও ম্যাগাজিন সংরক্ষণ, তথ্য ডাউনলোড, মতামত ও গভীর বিশ্লেষণে প্রবেশ করুন।',
  primaryLabel: 'গ্রিড তথ্য দেখুন',
  secondaryLabel: 'সদস্য প্রবেশ',
};

// Mirrors HOMEPAGE_DEFAULTS.snapshotLabel: NLDC leads because ten of the
// twelve tiles are its hourly pages, and SREDA left with the two register
// tiles. Each agency here is keyed in `source-sites.ts` so the Bengali footer
// links out exactly as the English one does.
const SNAPSHOT_LABEL_BN = 'লাইভ • এনএলডিসি • পিজিসিবি • পেট্রোবাংলা • বিপিডিবি';

const MARKET_PULSE_BN =
  'এলএনজি স্পট দাম বাড়ছে • সোলার মডিউল -২.১% সাপ্তাহিক • ডলার/টাকা ওঠানামায় আইপিপি মার্জিনে চাপ • কয়লা API২ $১০২ এ স্থির • ৮.৯৫ টাকা/ইউনিট বাল্ক ট্যারিফ কার্যকর';

export function localizeTickerItem(item: TickerItem, locale: SiteLocale): TickerItem {
  if (locale === 'en') return item;
  const nameBn = ENERGY_TICKER_LABELS_BN[item.id];
  return nameBn ? { ...item, name: nameBn } : item;
}

export function localizeEnergyStatLabel(label: string, locale: SiteLocale): string {
  if (locale === 'en') return label;
  return ENERGY_STAT_LABELS_BN[label] ?? label;
}

/** Stable snapshot header date — format on the server to avoid hydration drift. */
export function formatSnapshotHeaderDate(isoDate: string | undefined, locale: SiteLocale): string {
  let dateObj = new Date();
  if (isoDate) {
    const cleanDate = isoDate.replace(/^"|"$/g, '');
    const match = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, y, m, d] = match;
      dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      const parsed = new Date(cleanDate);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }
  }

  return dateObj.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function localizeSnapshotLabel(label: string, locale: SiteLocale): string {
  if (locale === 'en') return label;
  return SNAPSHOT_LABEL_BN;
}

export function localizeMarketPulse(text: string, locale: SiteLocale): string {
  if (locale === 'en') return text;
  return MARKET_PULSE_BN;
}

export function localizeProfessionalsCta<
  T extends {
    label: string;
    title: string;
    primaryLabel: string;
    secondaryLabel: string;
    primaryHref: string;
    secondaryHref: string;
  },
>(cta: T, locale: SiteLocale): T {
  if (locale === 'en') return cta;
  return {
    ...cta,
    ...PROFESSIONALS_CTA_BN,
  };
}