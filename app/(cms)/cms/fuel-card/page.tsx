import { Fuel } from 'lucide-react';
import { CmsPageHeader, CmsSectionStack } from '@/components/cms/CmsUI';
import { OilCard } from '@/components/cms/oil/OilCard';
import { OilCardDownload } from '@/components/cms/oil/OilCardDownload';
import { getOilCard } from '@/lib/actions/oil-card';

export const metadata = { title: 'Fuel prices card' };
// The card names today's date and the latest settlement; never serve a stale one.
export const dynamic = 'force-dynamic';

const btn =
  'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40';

export default async function CMSFuelCardPage() {
  const model = await getOilCard();

  return (
    <CmsSectionStack>
      <CmsPageHeader
        title="Fuel prices card"
        description="Today's Facebook card: Bangladesh pump prices from EMRD's monthly instrument, and world oil futures at their last settlement."
        icon={Fuel}
      />
      <div className="flex flex-wrap items-start gap-6">
        {/* The card at half size. Its own px are fixed; the box around it scales. */}
        <div className="overflow-hidden rounded-xl border border-border/60" style={{ width: 540, height: 675 }}>
          <div style={{ transform: 'scale(0.5)', transformOrigin: '0 0', width: 1080, height: 1350 }}>
            <OilCard model={model} />
          </div>
        </div>
        <div className="max-w-sm space-y-3 text-[13px] text-muted-foreground">
          <OilCardDownload className={btn} />
          <p>
            Pump prices: <span className="font-medium text-foreground">{model.pump.chip}</span>.
          </p>
          <p>
            World prices:{' '}
            <span className="font-medium text-foreground">
              {model.world ? `settlement of ${model.world.settlement}` : 'no settlement captured yet'}
            </span>
            . The Pi stores settlements once a day at 03:30 Dhaka, after New York closes.
          </p>
        </div>
      </div>
    </CmsSectionStack>
  );
}
