/** Same-origin relative paths only — blocks open redirects. */
export function safeAuthRedirectPath(raw: string | null | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;
  const value = raw.trim();
  
  // Same-origin relative paths are safe
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) {
    return value;
  }

  // Absolute URLs that point to our own workspaces are safe
  try {
    const url = new URL(value);
    const hostname = url.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const vercelHost = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, '').split('/')[0];
    const isProdDomain =
      hostname === 'esbpowerline.com' ||
      hostname.endsWith('.esbpowerline.com') ||
      hostname === 'esbpowerline' ||
      (vercelHost ? hostname === vercelHost : false);

    if (isLocal || isProdDomain) {
      return value;
    }
  } catch {}

  return fallback;
}

export type PasswordResetAudience = 'staff' | 'member';

export function parsePasswordResetAudience(raw: string | null | undefined): PasswordResetAudience {
  return raw === 'member' ? 'member' : 'staff';
}

export function loginPathForAudience(audience: PasswordResetAudience): string {
  return audience === 'member' ? '/members/login' : '/login';
}

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.';
