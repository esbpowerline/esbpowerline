const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DIRECT_URL or DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  
  const res = await pool.query('SELECT id, title, "imageUrl" FROM "Article" ORDER BY "createdAt" DESC LIMIT 15');
  console.log('--- LATEST 15 ARTICLES ---');
  console.log(JSON.stringify(res.rows, null, 2));

  const totalRes = await pool.query('SELECT COUNT(*)::integer FROM "Article"');
  const total = totalRes.rows[0].count;

  const withImagesRes = await pool.query('SELECT COUNT(*)::integer FROM "Article" WHERE "imageUrl" IS NOT NULL');
  const withImages = withImagesRes.rows[0].count;

  const relativeRes = await pool.query('SELECT COUNT(*)::integer FROM "Article" WHERE "imageUrl" LIKE \'/uploads/%\'');
  const relativeImages = relativeRes.rows[0].count;

  const supabaseRes = await pool.query('SELECT COUNT(*)::integer FROM "Article" WHERE "imageUrl" LIKE \'http%\'');
  const supabaseImages = supabaseRes.rows[0].count;

  console.log(`\nTotal Articles: ${total}`);
  console.log(`With Images: ${withImages}`);
  console.log(`Relative Images (/uploads/): ${relativeImages}`);
  console.log(`Supabase Images (http): ${supabaseImages}`);

  await pool.end();
}

main().catch(console.error);
