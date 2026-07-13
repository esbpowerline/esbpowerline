import { Suspense } from 'react';
import { ResetPasswordScreen } from '@/components/auth/ResetPasswordScreen';

export const metadata = {
  title: 'Reset password',
  description: 'Set a new password for your ESB PowerLine account.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
export const dynamic = 'force-dynamic';
