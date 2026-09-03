import '@/app/staff-surface.css';
import { CmsShell } from '@/components/cms/CmsShell';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { redirect } from 'next/navigation';
import '../../cms.css';

export const metadata = { title: 'CMS' };

export default async function CMSDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.role || !can(session.user.role, 'article.create')) {
    redirect('/login');
  }
  return <CmsShell>{children}</CmsShell>;
}