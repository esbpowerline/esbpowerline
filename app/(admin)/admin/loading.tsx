import { AdminPageSkeleton } from '@/components/admin/AdminUI';

/*
 * One neutral placeholder for every admin route: a page header and a card.
 * It used to be dashboard-shaped — four stat tiles over two cards at a 1rem
 * radius — and shown for every page under /admin, none of which but the
 * dashboard has stat tiles, so each page jumped shape as it arrived.
 */
export default function AdminLoading() {
  return (
    <AdminPageSkeleton>
      <div className="admin-skeleton admin-skeleton--header" />
      <div className="admin-skeleton admin-skeleton--card" />
    </AdminPageSkeleton>
  );
}
