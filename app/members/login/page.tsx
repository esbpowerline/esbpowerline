import { MemberLoginScreen } from '@/components/auth/MemberLoginScreen';

export const metadata = {
  title: 'Member sign in',
  description: 'Sign in to save articles, download data, comment, and access in-depth power sector analysis.',
  // A sign-in form has no place in an index, and every `?callbackUrl=`
  // variant is the same page: one canonical, no indexing (SEO_FIX_LOG stage 2).
  robots: { index: false, follow: false },
  alternates: { canonical: '/members/login' },
};

export default function MemberLoginPage() {
  return <MemberLoginScreen />;
}
export const dynamic = 'force-dynamic';
