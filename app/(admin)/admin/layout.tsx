import '@/app/staff-surface.css';
import { AdminShell } from '@/components/admin/AdminShell';
import { auth } from '@/lib/auth';
import { canAccessAdminPanel } from '@/lib/constants';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Admin Dashboard' };

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.role || !canAccessAdminPanel(session.user.role)) {
    redirect('/login');
  }
  return <AdminShell>{children}</AdminShell>;
}