import { Database } from 'lucide-react';
import { AdminPageHeader, AdminSectionStack } from '@/components/admin/AdminUI';
import { DataIngestPanel } from '@/components/admin/DataIngestPanel';
import { getIngestStatus } from '@/lib/data/grid/ingest-status.server';

export const dynamic = 'force-dynamic';

export default async function AdminDataPage() {
  const status = await getIngestStatus();

  return (
    <AdminSectionStack>
      <AdminPageHeader
        icon={Database}
        title="Grid data ingest"
        description="Upload the PGCB workbook and Petrobangla gas report, check the parsed figures, and publish the day straight to the site — no deployment."
      />
      <DataIngestPanel status={status} />
    </AdminSectionStack>
  );
}
