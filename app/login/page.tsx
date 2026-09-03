import { StaffLoginScreen } from '@/components/auth/StaffLoginScreen';

export const metadata = {
  title: 'Staff sign in',
  description: 'Secure sign-in for ESB PowerLine editorial staff, CMS, and administration.',
  // A sign-in form has no place in an index, and every `?callbackUrl=`
  // variant is the same page: one canonical, no indexing (SEO_FIX_LOG stage 2).
  robots: { index: false, follow: false },
  alternates: { canonical: '/login' },
};

export default function LoginPage() {
  return <StaffLoginScreen />;
}
export const dynamic = 'force-dynamic';
