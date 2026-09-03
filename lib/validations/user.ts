import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2),
  // One identity per address regardless of case; the lower(email) unique index
  // (migration 0017) rejects a mixed-case duplicate, so normalise before it
  // can. See lib/actions/profile.ts for the takeover this closes.
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR', 'SUBSCRIBER']),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']),
  bio: z.string().optional(),
});

export type UserInput = z.infer<typeof userSchema>;