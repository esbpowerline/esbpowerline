import { StaffLoginScreen } from '@/components/auth/StaffLoginScreen';

export const metadata = {
  title: 'Staff sign in',
  description: 'Secure sign-in for ESB PowerLine editorial staff, CMS, and administration.',
};

export default function LoginPage() {
  return <StaffLoginScreen />;
}
export const dynamic = 'force-dynamic';
