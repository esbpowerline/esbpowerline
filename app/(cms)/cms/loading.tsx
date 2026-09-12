import { CmsPageSkeleton } from '@/components/cms/CmsUI';

/* The same neutral placeholder as the admin panel — see (admin)/admin/loading.tsx. */
export default function CMSLoading() {
  return (
    <CmsPageSkeleton>
      <div className="admin-skeleton admin-skeleton--header" />
      <div className="admin-skeleton admin-skeleton--card" />
    </CmsPageSkeleton>
  );
}
