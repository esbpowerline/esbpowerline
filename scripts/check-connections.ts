import { config } from 'dotenv';
import { existsSync } from 'fs';

config({ path: '.env' });
if (existsSync('.env.local')) config({ path: '.env.local', override: true });

async function main() {
  const { checkSupabaseHealth } = await import('../lib/supabase/health');
  const prisma = (await import('../lib/prisma')).default;

  const supabase = await checkSupabaseHealth();

  let db: Record<string, unknown> = { ok: false };
  try {
    const [articles, categories, users] = await Promise.all([
      prisma.article.count(),
      prisma.category.count(),
      prisma.user.count(),
    ]);
    db = { ok: true, connection: 'ok', tables: { articles, categories, users } };
  } catch (error) {
    db = {
      ok: false,
      connection: 'error',
      error: error instanceof Error ? error.message : 'Database query failed',
    };
  } finally {
    await prisma.$disconnect();
  }

  console.log('=== Supabase ===');
  console.log(JSON.stringify(supabase, null, 2));
  console.log('\n=== Database (Prisma) ===');
  console.log(JSON.stringify(db, null, 2));

  if (!supabase.ok || !db.ok) process.exit(1);
}

main();