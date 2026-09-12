'use client';

import { useState, useTransition } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminCard } from '@/components/admin/AdminUI';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { changeStaffPassword } from '@/lib/actions/profile';

export function AdminAccountSecurity({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    startTransition(async () => {
      try {
        await changeStaffPassword({ currentPassword, newPassword });
        toast.success('Password updated — use your new password at Staff sign in');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Could not update password');
      }
    });
  }

  return (
    <AdminCard title="Account security" icon={Lock}>
      <p className="text-sm text-muted-foreground mb-4">
        Change the password for <strong>{email}</strong>. This updates both the platform database and Supabase Auth.
      </p>
      <form onSubmit={handleSubmit} className="admin-form-stack--compact max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          <span className="inline-flex items-center justify-center gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Update password</span>
          </span>
        </Button>
      </form>
    </AdminCard>
  );
}