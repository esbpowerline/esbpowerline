/**
 * Runtime assertions for auth-related environment variables.
 *
 * Call `sanitizeAuthEnv()` early in the server bootstrap (e.g. in
 * `instrumentation.ts` or the root layout's server component) to catch
 * misconfigurations before they leak secrets to the browser bundle.
 */

/** Variable names that must NEVER be prefixed with NEXT_PUBLIC_. */
const SERVER_ONLY_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'AUTH_SECRET',
  'DATABASE_URL',
  'DIRECT_URL',
  'CRON_SECRET',
  'MASTER_ADMIN_PASSWORD',
  'EDITOR_PASSWORD',
  'MEMBER_DEMO_PASSWORD',
  'SEED_DEMO_PASSWORD',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
] as const;

/**
 * Validates that no server-only secret has been accidentally exposed
 * via a `NEXT_PUBLIC_` prefix in `process.env`.
 *
 * @throws {Error} if any server-only variable is found with a public prefix.
 */
export function sanitizeAuthEnv(): void {
  const leaked: string[] = [];

  for (const name of SERVER_ONLY_VARS) {
    const publicKey = `NEXT_PUBLIC_${name}`;
    if (process.env[publicKey] !== undefined) {
      leaked.push(publicKey);
    }
  }

  if (leaked.length > 0) {
    throw new Error(
      `[sanitizeAuthEnv] Server-only secrets exposed with NEXT_PUBLIC_ prefix — ` +
        `this would leak them to the browser bundle. ` +
        `Remove or rename these variables immediately: ${leaked.join(', ')}`,
    );
  }
}