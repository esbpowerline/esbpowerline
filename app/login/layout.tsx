import '@/app/staff-surface.css';
import { Suspense } from 'react';

function LoginFallback() {
  return (
    <div className="login-shell login-shell--staff login-shell--loading">
      <div className="login-frame">
        <div className="login-access p-10 flex items-center justify-center min-h-[280px]">
          <div className="flex flex-col items-center gap-3">
            <div className="admin-loading-spinner" />
            <span className="text-sm text-muted-foreground">Preparing sign in…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoginFallback />}>{children}</Suspense>;
}