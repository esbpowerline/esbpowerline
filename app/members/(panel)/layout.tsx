import '@/app/staff-surface.css';
import { requireMemberSession } from '@/lib/member-auth';
import { MemberShell } from '@/components/members/MemberShell';

export default async function MemberPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireMemberSession();
  return <MemberShell userName={session.user.name ?? 'Member'}>{children}</MemberShell>;
}