/** Matches any C0 control character or DEL. */
const CONTROL_CHARS = new RegExp('[\u0000-\u001F\u007F]');

/** Same-origin relative paths only — blocks open redirects. */
export function safeAuthRedirectPath(raw: string | null | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;
  const value = raw.trim();

  // A tab/CR/LF in the middle of the path — reachable as ?to=/%09/evil.com,
  // which searchParams decodes into a raw control char — passes the prefix
  // checks below but is stripped by the URL parser, so "/\t/evil.com" resolves
  // to https://evil.com. trim() does not help; the char is not at either end.
  if (CONTROL_CHARS.test(value)) return fallback;

  // Same-origin relative paths are safe. Resolve rather than pattern-match so
  // anything a URL parser reads as a different origin is rejected.
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) {
    try {
      const base = 'https://esbpowerline.com';
      if (new URL(value, base).origin === base) return value;
    } catch {}
    return fallback;
  }

  // Absolute URLs that point to our own workspaces are safe
  try {
    const url = new URL(value);
    const hostname = url.hostname;
    // Loopback is a development convenience for the three-port dev split. In
    // production it was an accepted destination for a URL carrying a refresh
    // token, i.e. a plain-HTTP hop anyone on the victim's machine could catch.
    const isLocal =
      process.env.NODE_ENV !== 'production' && (hostname === 'localhost' || hostname === '127.0.0.1');
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
