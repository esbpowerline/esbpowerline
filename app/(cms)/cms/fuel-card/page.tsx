import { Fuel } from 'lucide-react';
import { CmsPageHeader, CmsSectionStack } from '@/components/cms/CmsUI';
import { OilCardPanel } from '@/components/cms/oil/OilCardPanel';
import { getOilCalendar, getOilCard } from '@/lib/actions/oil-card';

export const metadata = { title: 'Fuel prices card' };
// The card names today's date and the latest settlement; never serve a stale one.
export const dynamic = 'force-dynamic';

export default async function CMSFuelCardPage() {
  const calendar = await getOilCalendar();
  // Today when the archive can answer it, else the latest day it can.
  const initial = await getOilCard(
    calendar.latest && calendar.latest < calendar.today ? calendar.latest : calendar.today,
  );

  return (
    <CmsSectionStack>
      <CmsPageHeader
        title="Fuel prices card"
        description="The daily Facebook card — Bangladesh pump prices from EMRD's instrument in force that day, and world oil futures at their last settlement — for today or any missed day."
        icon={Fuel}
      />
      <OilCardPanel calendar={calendar} initial={initial} />
    </CmsSectionStack>
  );
}
