import { GitCompare } from 'lucide-react';
import { CmsPageHeader, CmsSectionStack } from '@/components/cms/CmsUI';
import { YoyComparisonPanel } from '@/components/cms/YoyComparisonPanel';
import { getYoyBootstrap } from '@/lib/actions/yoy-comparison';

export const metadata = { title: 'Grid comparison' };

export default async function CMSYoySheetPage() {
  const bootstrap = await getYoyBootstrap();

  return (
    <CmsSectionStack>
      <CmsPageHeader
        title="Grid comparison"
        description="The published year-on-year sheet, a free comparison of any two archived days or two monthly reports, and range exports for a spreadsheet."
        icon={GitCompare}
      />
      <YoyComparisonPanel bootstrap={bootstrap} />
    </CmsSectionStack>
  );
}
