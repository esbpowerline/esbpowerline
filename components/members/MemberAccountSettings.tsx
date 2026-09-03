'use client';

import { useState, useTransition } from 'react';
import { Lock, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatBdPhoneDisplay } from '@/lib/bd-phone';
import { changeMemberPassword, updateMemberProfile } from '@/lib/actions/member-profile';

type MemberAccountSettingsProps = {
  name: string;
  email: string;
  phone: string | null;
  status: string;
};

export function MemberAccountSettings({ name, email, phone, status }: MemberAccountSettingsProps) {
  const [profileName, setProfileName] = useState(name);
  const [profileEmail, setProfileEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();

    startProfileTransition(async () => {
      try {
        await updateMemberProfile({
          name: profileName !== name ? profileName : undefined,
          email: profileEmail !== email ? profileEmail : undefined,
        });
        toast.success('Profile updated');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Could not update profile');
      }
    });
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    startPasswordTransition(async () => {
      try {
        await changeMemberPassword({ currentPassword, newPassword });
        toast.success('Password updated');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Could not update password');
      }
    });
  }

  return (
    <div className="space-y-6">
      {status === 'PENDING' && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Your account is pending verification. Profile changes are disabled until an administrator activates your
          account.
        </p>
      )}

      <div className="member-account-card">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <User className="h-4 w-4 text-primary" />
          Profile
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Full name</Label>
            <Input
              id="member-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              minLength={2}
              required
              disabled={status === 'PENDING'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              required
              disabled={status === 'PENDING'}
            />
          </div>
          {phone && (
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <p className="text-sm font-medium text-foreground">{formatBdPhoneDisplay(phone)}</p>
              <p className="text-xs text-muted-foreground">Contact support to change your registered mobile number.</p>
            </div>
          )}
          <Button type="submit" disabled={profilePending || status === 'PENDING'}>
            {profilePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save profile
          </Button>
        </form>
      </div>

      <div className="member-account-card">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4 text-primary" />
          Password
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="member-current-password">Current password</Label>
            <Input
              id="member-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={status === 'PENDING'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-new-password">New password</Label>
            <Input
              id="member-new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={status === 'PENDING'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-confirm-password">Confirm new password</Label>
            <Input
              id="member-confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={status === 'PENDING'}
            />
          </div>
          <Button type="submit" disabled={passwordPending || status === 'PENDING'}>
            {passwordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
          <p className="text-xs text-muted-foreground">
            Locked out?{' '}
            {/* Auth flow: this path 307s to the real reset screen and must be a
                full navigation so the session cookie is re-read on arrival. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/auth/forgot-password?audience=member" className="font-medium hover:underline">
              Reset via email
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}