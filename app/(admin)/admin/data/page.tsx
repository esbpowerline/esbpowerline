import { Database } from 'lucide-react';
import { AdminPageHeader, AdminSectionStack } from '@/components/admin/AdminUI';
import { DataIngestPanel } from '@/components/admin/DataIngestPanel';
import { getIngestStatus } from '@/lib/data/grid/ingest-status.server';
import { getIngestCoverage } from '@/lib/data/grid/ingest-coverage.server';
import { IngestCoverageCard } from '@/components/admin/IngestCoverageCard';
import { getLatestSredaDaily } from '@/lib/data/sreda/daily-loader.server';
import { getRecentReleaseRevisions } from '@/lib/data/release-history.server';
import { ReleaseHistoryCard } from '@/components/admin/ReleaseHistoryCard';

export const dynamic = 'force-dynamic';

export default async function AdminDataPage() {
  const [status, sreda, coverage, revisions] = await Promise.all([
    getIngestStatus(),
    getLatestSredaDaily(),
    getIngestCoverage(),
    getRecentReleaseRevisions(),
  ]);

  return (
    <AdminSectionStack>
      <AdminPageHeader
        icon={Database}
        title="Grid data ingest"
        description="Upload the PGCB workbook and Petrobangla gas report, check the parsed figures, and publish the day straight to the site — no deployment."
      />
      {/* What the site has and what it still needs, before any upload: the
          panel below can only act on one day at a time, and an operator has to
          know which day that should be. */}
      <IngestCoverageCard coverage={coverage} />
      <DataIngestPanel status={status} latestSredaDate={sreda?.date ?? null} />
      <ReleaseHistoryCard revisions={revisions} />
    </AdminSectionStack>
  );
}
