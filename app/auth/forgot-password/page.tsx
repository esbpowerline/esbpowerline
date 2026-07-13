import { Suspense } from 'react';
import { ForgotPasswordScreen } from '@/components/auth/ForgotPasswordScreen';

export const metadata = {
  title: 'Forgot password',
  description: 'Request a secure password reset link for your ESB PowerLine account.',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
export const dynamic = 'force-dynamic';
