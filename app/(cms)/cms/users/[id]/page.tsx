import { notFound } from 'next/navigation';
import { CmsPageHeader, CmsSectionStack } from '@/components/cms/CmsUI';
import { MemberActivityPanel } from '@/components/admin/MemberActivityPanel';
import { getUser, getUserMemberActivity } from '@/lib/actions/users';
import { User } from 'lucide-react';

export default async function ViewUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, activity] = await Promise.all([getUser(id), getUserMemberActivity(id)]);
  if (!user) notFound();

  return (
    // CmsSectionStack, not a hand-rolled `space-y-6`: every other CMS page
    // spaces its sections from --shell-section, so this one sat 24px apart
    // where the rest of the surface sits at 20.
    <CmsSectionStack>
      <CmsPageHeader
        icon={User}
        title={`Member: ${user.name}`}
        description={user.email}
      />
      {activity ? <MemberActivityPanel activity={activity} /> : <p>No activity yet.</p>}
    </CmsSectionStack>
  );
}
