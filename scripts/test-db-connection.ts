import dotenv from 'dotenv';
import path from 'path';

import { existsSync } from 'fs';

dotenv.config({ path: '.env' });
if (existsSync('.env.local')) dotenv.config({ path: '.env.local', override: true });
if (existsSync('.env.production.local')) {
  dotenv.config({ path: '.env.production.local', override: true });
}

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL (masked):', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
}
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING');
