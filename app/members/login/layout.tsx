import '@/app/staff-surface.css';
import { Suspense } from 'react';

function MemberLoginFallback() {
  return (
    <div className="login-shell login-shell--member login-shell--loading">
      <div className="login-frame">
        <div className="login-access p-10 flex items-center justify-center min-h-[280px]">
          <div className="flex flex-col items-center gap-3">
            <div className="admin-loading-spinner" />
            <span className="text-sm text-muted-foreground">Preparing member sign in…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemberLoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<MemberLoginFallback />}>{children}</Suspense>;
}