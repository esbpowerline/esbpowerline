'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  UserRound,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHandoffOverlay } from '@/components/auth/AuthHandoffOverlay';
import { LoginFrame } from '@/components/auth/LoginFrame';
import { MemberValuePanel } from '@/components/auth/MemberValuePanel';
import {
  memberLoginAction,
  memberSignUpAction,
  type MemberAuthResult,
} from '@/app/members/login/actions';


type AuthMode = 'sign-in' | 'sign-up';

const DEMO_MEMBER = {
  role: 'Member',
  identifier: 'member@esbpowerline.com',
  icon: UserRound,
} as const;

const INITIAL_STATE: MemberAuthResult = {};

export function MemberLoginScreen() {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const pendingRedirect = useRef<string | null>(null);
  const [loginState, loginFormAction, loginPending] = useActionState(memberLoginAction, INITIAL_STATE);
  const [signupState, signupFormAction, signupPending] = useActionState(memberSignUpAction, INITIAL_STATE);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '';
  const resetSuccess = searchParams.get('reset') === 'success';
  const isPending = mode === 'sign-in' ? loginPending : signupPending;

  useEffect(() => {
    if (searchParams.get('pending') === '1') {
      setError('Your account is pending verification. Sign in once an administrator activates it.');
    }
  }, [searchParams]);

  useEffect(() => {
    const activeState = mode === 'sign-in' ? loginState : signupState;

    if (activeState?.error) {
      setError(activeState.error);
      setSuccess('');
      setHandoffMessage(null);
      pendingRedirect.current = null;
      return;
    }

    if (activeState?.successMessage) {
      setSuccess(activeState.successMessage);
      setError('');
      setHandoffMessage(null);
      pendingRedirect.current = null;
      setMode('sign-in');
      return;
    }

    if (activeState?.redirectTo) {
      setSuccess('');
      pendingRedirect.current = activeState.redirectTo;
      setHandoffMessage(activeState.handoffMessage ?? 'Opening your library…');
    }
  }, [loginState, signupState, mode]);

  useEffect(() => {
    if (!handoffMessage || !pendingRedirect.current) return;

    const destination = pendingRedirect.current;

    const redirectTimer = window.setTimeout(() => {
      window.location.assign(destination);
    }, 100);

    const failTimer = window.setTimeout(() => {
      setHandoffMessage(null);
      pendingRedirect.current = null;
      setError('Redirect is taking longer than expected. Try opening your library manually.');
    }, 12_000);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearTimeout(failTimer);
    };
  }, [handoffMessage]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
    setSuccess('');
    if (next !== 'sign-in') {
      setPassword('');
    }
  }

  function clearMessages() {
    if (error) setError('');
    if (success) setSuccess('');
  }



  return (
    <>
    <LoginFrame audience="member" brandAside={<MemberValuePanel />}>
      <div className="login-access__body">
        <div className="login-access__staff">
          <span className="login-access__badge">Member access</span>
        </div>

        <div className="login-access__stack">
              <div className="login-access__intro">
                <h2 className="login-access__heading">
                  {mode === 'sign-in' ? 'Member sign in' : 'Create free account'}
                </h2>
                <p className="login-access__hint">
                  {mode === 'sign-in'
                    ? 'One account for saving coverage, downloading data, commenting, and deeper sector analysis.'
                    : 'Join free to save articles, access the magazine archive, download reports, and join the discussion.'}
                </p>
              </div>

              {mode === 'sign-in' ? (
                <form action={loginFormAction} className="login-access__form">
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />

                  <div className="login-access__field">
                    <Label htmlFor="member-identifier" className="login-access__label">
                      Email
                    </Label>
                    <Input
                      id="member-identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      placeholder="you@company.com"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        clearMessages();
                      }}
                      className="login-access__input"
                      required
                    />
                  </div>

                  <div className="login-access__field">
                    <div className="login-access__label-row">
                      <Label htmlFor="member-password" className="login-access__label">
                        Password
                      </Label>
                      <Link
                        href="/auth/forgot-password?audience=member"
                        className="login-access__forgot-link"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="login-access__password">
                      <Input
                        id="member-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearMessages();
                        }}
                        className="login-access__input login-access__input--password"
                        required
                      />
                      <button
                        type="button"
                        className="login-access__reveal"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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

                  {success && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100" role="status">
                      {success}
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
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form action={signupFormAction} className="login-access__form">
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />

                  <div className="login-access__field">
                    <Label htmlFor="member-name" className="login-access__label">
                      Full name
                    </Label>
                    <Input
                      id="member-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearMessages();
                      }}
                      className="login-access__input"
                      required
                    />
                  </div>

                  <div className="login-access__field">
                    <Label htmlFor="member-phone" className="login-access__label">
                      Mobile
                    </Label>
                    <Input
                      id="member-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="01712 345678"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearMessages();
                      }}
                      className="login-access__input"
                      required
                    />
                  </div>

                  <div className="login-access__field">
                    <Label htmlFor="member-email" className="login-access__label">
                      Email <span className="login-access__label-note">(optional)</span>
                    </Label>
                    <Input
                      id="member-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearMessages();
                      }}
                      className="login-access__input"
                    />
                  </div>

                  <div className="login-access__field">
                    <Label htmlFor="member-signup-password" className="login-access__label">
                      Password
                    </Label>
                    <div className="login-access__password">
                      <Input
                        id="member-signup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearMessages();
                        }}
                        className="login-access__input login-access__input--password"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        className="login-access__reveal"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="login-access__error" role="alert">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100" role="status">
                      {success}
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
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              <p className="login-access__alt text-center text-xs text-muted-foreground">
                {mode === 'sign-in' ? (
                  <>
                    New here?{' '}
                    <button
                      type="button"
                      className="font-medium hover:underline"
                      onClick={() => switchMode('sign-up')}
                    >
                      Create free account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="font-medium hover:underline"
                      onClick={() => switchMode('sign-in')}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>



          <p className="login-access__alt text-center text-xs text-muted-foreground">
            Editorial or admin staff?{' '}
            <Link href="/login" className="login-member-access__staff-link">
              Staff sign in
            </Link>
          </p>
        </div>
      </div>
    </LoginFrame>
    {handoffMessage ? <AuthHandoffOverlay message={handoffMessage} /> : null}
    </>
  );
}