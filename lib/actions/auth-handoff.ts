'use server';

import { auth } from '@/lib/auth';
import { authContinuePath, needsAuthHandoff } from '@/lib/auth-handoff';

/** Resolve a post-login destination, routing cross-origin sessions through /auth/continue. */
export async function resolveAuthDestinationAction(
  destination: string,
  currentHost: string,
): Promise<string> {
  if (!needsAuthHandoff(destination, currentHost)) return destination;

  const session = await auth();
  if (!session?.user?.id) {
    return authContinuePath(destination);
  }

  return authContinuePath(destination);
}