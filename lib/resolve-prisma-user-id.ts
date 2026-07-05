import 'server-only';

import prisma from '@/lib/prisma';

/** Map Supabase session id to Prisma User.id (cuid), matching email/supabaseUserId fallbacks. */
export async function resolvePrismaUserId(userId: string, email: string): Promise<string> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: userId }, { email: email.toLowerCase() }, { supabaseUserId: userId }],
    },
    select: { id: true, status: true },
  });
  if (!user || user.status === 'SUSPENDED' || user.status === 'PENDING') {
    throw new Error('Sign in required');
  }
  return user.id;
}