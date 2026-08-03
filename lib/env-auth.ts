const INSECURE_AUTH_SECRET = 'dev-secret-change-in-prod';

/**
 * Placeholders that have been committed to git (`.env.example`). Anyone can read
 * these, so a production secret equal to one is the same as having no secret:
 * session-handoff tokens signed with it are forgeable by any reader of the repo.
 */
const PUBLISHED_PLACEHOLDERS = new Set([
  INSECURE_AUTH_SECRET,
  'your-super-secret-here-change-in-prod',
  'your-secret-here',
  'change-me',
]);

/** Below this length the HMAC key is worth brute-forcing. */
const MIN_PRODUCTION_SECRET_LENGTH = 32;

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error(
        'AUTH_SECRET must be set to a strong random value in production (openssl rand -base64 32).',
      );
    }
    if (PUBLISHED_PLACEHOLDERS.has(secret) || /change[-_ ]?(me|in[-_ ]?prod)/i.test(secret)) {
      throw new Error(
        'AUTH_SECRET is still a placeholder published in .env.example, so handoff tokens ' +
          'signed with it are forgeable. Generate a new value with `openssl rand -base64 32` ' +
          'and set it in the Vercel project environment.',
      );
    }
    if (secret.length < MIN_PRODUCTION_SECRET_LENGTH) {
      throw new Error(
        `AUTH_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production (got ${secret.length}).`,
      );
    }
    return secret;
  }
  return secret || INSECURE_AUTH_SECRET;
}
