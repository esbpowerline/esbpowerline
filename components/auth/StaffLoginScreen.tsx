'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { MASTER_ADMIN_EMAIL } from '@/lib/staff-accounts';
import { getStaffDevLoginHint } from '@/app/login/actions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHandoffOverlay } from '@/components/auth/AuthHandoffOverlay';
import { LoginFrame } from '@/components/auth/LoginFrame';
import { StaffValuePanel } from '@/components/auth/StaffValuePanel';
import { loginAction, type AuthActionResult } from '@/app/login/actions';

const INITIAL_STATE: AuthActionResult = {};

export function StaffLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const pendingRedirect = useRef<string | null>(null);
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_STATE);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '';
  const resetSuccess = searchParams.get('reset') === 'success';

  useEffect(() => {
    if (state?.error) {
      setError(state.error);
      setHandoffMessage(null);
      pendingRedirect.current = null;
      return;
    }

    if (state?.redirectTo) {
      pendingRedirect.current = state.redirectTo;
      setHandoffMessage(state.handoffMessage ?? 'Opening your workspace…');
    }
  }, [state]);

  useEffect(() => {
    if (!handoffMessage || !pendingRedirect.current) return;

    const destination = pendingRedirect.current;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.location.assign(destination);
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [handoffMessage]);

  function clearError() {
    if (error) setError('');
  }

  return (
    <>
    <LoginFrame audience="staff" brandAside={<StaffValuePanel />}>
      <div className="login-access__body">
        <div className="login-access__staff">
          <span className="login-access__badge">Staff access</span>
        </div>

        <div className="login-access__stack">
          <div className="login-access__intro">
            <h2 className="login-access__heading">Staff sign in</h2>
            <p className="login-access__hint">
              Master admin opens the admin dashboard. Editors and authors use the email and password set in Admin → Users.
            </p>
          </div>

          <form action={formAction} className="login-access__form">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            <div className="login-access__field">
              <Label htmlFor="email" className="login-access__label">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@esbpowerline.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                className="login-access__input"
                required
              />
            </div>

            <div className="login-access__field">
              <div className="login-access__label-row">
                <Label htmlFor="password" className="login-access__label">Password</Label>
                <Link href="/auth/forgot-password?audience=staff" className="login-access__forgot-link">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                className="login-access__input"
                required
              />
            </div>

            {resetSuccess && !error && (
              <div
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100"
                role="status"
              >
                Password updated. Sign in with your new password.
              </div>
            )}

            {error && (
              <div className="login-access__error" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              variant="ghost"
              className="login-access__submit w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>



          <p className="login-access__alt login-staff-access__footer text-center text-xs text-muted-foreground">
            Looking for member access?{' '}
            <Link href="/members/login" className="login-staff-access__member-link">
              Member sign in
            </Link>
          </p>
        </div>
      </div>
    </LoginFrame>
    {handoffMessage ? <AuthHandoffOverlay message={handoffMessage} /> : null}
    </>
  );
}