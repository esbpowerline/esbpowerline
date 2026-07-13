import { MemberLoginScreen } from '@/components/auth/MemberLoginScreen';

export const metadata = {
  title: 'Member sign in',
  description: 'Sign in to save articles, download data, comment, and access in-depth power sector analysis.',
};

export default function MemberLoginPage() {
  return <MemberLoginScreen />;
}
export const dynamic = 'force-dynamic';
