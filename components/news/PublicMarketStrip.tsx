'use client';

import { useMemo } from 'react';
import { LiveMarketTicker, type TickerItem } from '@/components/news/LiveMarketTicker';
import { localizeTickerItem } from '@/lib/i18n/homepage-copy';
import { useLocale } from '@/components/shared/LocaleProvider';

/**
 * One ticker lane, not two. The DSE stock lane was the second of five stacked
 * chrome bands the audit measured (~220px before the first headline), and
 * equity prices set larger than the grid's own telemetry was the hierarchy
 * inversion in one image. Energy figures are this publication's subject; the
 * market data lives on where it is subject matter, not chrome.
 */
export function PublicMarketStrip({ energyItems }: { energyItems?: TickerItem[] }) {
  const { locale } = useLocale();

  const localizedEnergy = useMemo(
    () => (energyItems ?? []).map((item) => localizeTickerItem(item, locale)),
    [energyItems, locale],
  );

  return (
    <div className="public-market-strip w-full">
      <div className="public-market-strip__surface">
        <div className="public-market-strip__lane public-market-strip__lane--energy">
          <LiveMarketTicker
            variant="embedded"
            compact
            labelClassName="market-ticker-label market-ticker-label--energy"
            initialItems={localizedEnergy}
          />
        </div>
      </div>
    </div>
  );
}