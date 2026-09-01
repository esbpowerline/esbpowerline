/**
 * What a failed sign-in is allowed to tell the visitor.
 *
 * The sign-in page is public, and the action used to return the upstream
 * error string verbatim for anything it did not recognise. When the Supabase
 * project exceeded its egress quota, the form rendered:
 *
 *   "Service for this project is restricted due to the following violations:
 *    exceed_egress_quota. The project owner must upgrade their plan or remove
 *    spend caps to restore service."
 *
 * — naming the provider, the account's billing state and what the operator
 * owes, to anyone who opened the page, above a Continue button that could not
 * work. That is operational detail, and it belongs in a log.
 *
 * The rule: a message goes to the visitor only if the visitor can act on it.
 * A wrong password they can fix. A quota they cannot.
 */

const ACTIONABLE_AUTH_ERRORS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Invalid email or password. Check your credentials and try again.'],
  [/user not found/i, 'Invalid email or password. Check your credentials and try again.'],
  [/email not confirmed/i, 'This address has not been confirmed yet. Check your inbox for the confirmation link.'],
  [/too many requests|rate limit|for security purposes/i, 'Too many attempts. Wait a minute and try again.'],
  [/password.*at least|weak password|password.*too short/i, 'That password is too short. Use at least 8 characters.'],
  [/user already registered|already been registered/i, 'An account with this email already exists. Try signing in instead.'],
];

/** The message shown for anything the visitor cannot do anything about. */
export const GENERIC_AUTH_ERROR = 'Sign-in is temporarily unavailable. Please try again shortly.';

/**
 * Map an upstream auth error onto visitor-facing copy.
 *
 * Returns `{ message, leaked: false }` for a recognised, actionable failure,
 * and the generic line otherwise — with `detail` carried out separately so the
 * caller can log what actually happened.
 */
export function friendlyAuthError(raw: unknown): { message: string; detail: string | null } {
  const text = typeof raw === 'string' ? raw : String((raw as { message?: unknown })?.message ?? raw ?? '');

  for (const [pattern, friendly] of ACTIONABLE_AUTH_ERRORS) {
    if (pattern.test(text)) return { message: friendly, detail: null };
  }

  return { message: GENERIC_AUTH_ERROR, detail: text || 'unknown auth error' };
}
