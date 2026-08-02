/**
 * One-off editorial recategorisation.
 *
 * Several categories render nearly empty on the homepage while Consumers &
 * Tariffs (and, in Bangla, Power Generation) act as catch-all buckets holding
 * stories that plainly belong elsewhere. This moves the misfiled ones into the
 * right category so every section has enough to look filled.
 *
 * Only the category changes. No article is created, edited, published or
 * unpublished. Every original value is written to
 * `scripts/.recategorise-rollback.json` so the whole batch can be reverted with
 * `node scripts/recategorise-articles.mjs --revert`.
 *
 * IMPORTANT: `Article` carries the category twice — `category` (a String, which
 * is what every read path actually queries) and `categoryId` (an optional FK).
 * Both must be written together or the change is invisible to the site.
 *
 * Usage:
 *   node scripts/recategorise-articles.mjs --dry     preview, touch nothing
 *   node scripts/recategorise-articles.mjs           apply
 *   node scripts/recategorise-articles.mjs --repair  re-sync category string to the FK
 *   node scripts/recategorise-articles.mjs --revert  undo from the rollback file
 */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const CAT = {
  policy: 'cmqv473nh0004vk55oaccbbvz', // Energy Policy & Regulators
  generation: 'cmqv473nh0005vk55cyytt3r4', // Power Generation
  fossil: 'cmqv473nh0006vk555w03ngbq', // Fossil Fuels & Commodities
  renewables: 'cmqv473nh0007vk55fyfwonza', // Renewables & Nuclear
  grid: 'cmqv473nh0008vk55hv4ga5ls', // Grid & Transmission
  distribution: 'cmqv473nh0009vk55nefpoof1', // Distribution & Utilities
  consumers: 'cmqv473nh000avk55ur3yty0p', // Consumers & Tariffs
  market: 'cmqv473nh000bvk55mu43hu0w', // Market, Finance & Subsidies
  intl: 'cmqv473nh000cvk559jgrh40y', // International & Cross-Border
  environment: 'cmqv473nh000dvk55qsg8qbkd', // Environment & Efficiency
};

/** [articleId, targetCategory, why] — every move is a story sitting in the wrong bucket. */
const MOVES = [
  // ── English ──────────────────────────────────────────────────────────────
  ['cmqv4r3ql005p8055oq7h3qc9', 'distribution', 'Illegal gas connections cut in Mohammadpur — Titas distribution enforcement'],
  ['cmqz5uk99000004ju2fufj9fx', 'distribution', 'Drive against illegal gas connections, Brahmanbaria — distribution enforcement'],
  ['cmqv4q45i00428055bel9wfb9', 'distribution', 'PDB squeezes REB — rural electricity distribution'],
  ['cmqv4qr2j00548055vx1z37ql', 'grid', '9-hour outage across Sylhet and Rangpur — grid supply failure'],
  ['cmqv4q61c00458055i0ts0ljn', 'grid', 'Chattogram–Dhaka oil pipeline — transmission infrastructure'],
  ['cmqv4mayg001ijc55uctlkiuh', 'policy', 'Cabinet sub-committee on energy security — government policy body'],
  ['cmqv4qlbj004v8055xt999wmv', 'policy', 'Energy Division on the Russian-fuel waiver — ministry policy'],

  // ── Bangla: out of the Consumers & Tariffs catch-all ─────────────────────
  ['cmqv4oow2001q8055amuxkiwn', 'fossil', 'Bay of Bengal 26-block exploration tender'],
  ['cmqv4ou5h001z8055e1dtospg', 'fossil', 'Crude cargo reaches Chattogram avoiding Hormuz — supply'],
  ['cmqv4oxpz002580552o6f6n7c', 'fossil', 'Jet fuel price tracks the global market'],
  ['cmqv4pay2002p80558woqxg8e', 'fossil', 'Global oil market heading for crisis'],
  ['cmqv4pkwl003780558j69nj3f', 'fossil', 'Iran crisis lifts oil prices'],
  ['cmqv4ro3s006g8055ggez18i0', 'fossil', 'Coal unloading delays hitting thermal plants — coal supply'],
  ['cmqv4p7ex002j805588cnmhoo', 'intl', 'Fuel prices in India'],
  ['cmqv4rrvo006m8055406kzamz', 'intl', 'Nepal’s electricity arrives in Bangladesh — cross-border trade'],
  ['cmqv4r20g005m8055hhl0krzx', 'distribution', 'Illegal gas connections cut in Mohammadpur (Bangla of the English story)'],
  ['cmqv4qsmo00578055e87v9a2i', 'grid', '9-hour outage in Sylhet and Rangpur (Bangla of the English story)'],
  ['cmqv4qybo005g8055rls8lyam', 'environment', 'IEEFA: efficiency target may be met early'],
  ['cmqv4o6n2000w8055u8vcll1d', 'renewables', 'Government leaning on renewables for self-reliance'],
  ['cmqv4oht1001e80559htb7q7g', 'market', 'Subsidy cuts could raise power prices 78% — subsidy policy'],
  ['cmqv4qwi5005d8055qd7o29at', 'generation', 'Khulna Power’s future in doubt — a generator'],
  ['cmqv4r7u6005v8055ralz4a8g', 'generation', 'Baraka Power at risk over plant closure — a generator'],
  ['cmqv4on2a001n8055pzcpd500', 'generation', 'Load shedding despite record capacity — generation shortfall'],

  // ── Bangla: out of Power Generation, which was holding non-generation news ─
  ['cmqv4oby1001580557lcp6m7h', 'distribution', 'Tk 35,000cr of investment idle for want of gas connections'],
  ['cmqv4ru3f006r8055hwqr9xyu', 'distribution', 'Mass recruitment at the rural electricity cooperatives (REB)'],
  ['cmqv4pe1h002v80555f08nlle', 'fossil', 'Petrobangla’s offshore exploration tender'],
  ['cmqv4pwm5003p8055cft1juic', 'fossil', 'Chinese supertankers cross Hormuz with 4m barrels'],
  ['cmqv4pznf003v8055dsg3fai7', 'fossil', 'Oil prices fall after Trump suspends strikes'],
  ['cmqv4phlf003180550ma2xckd', 'intl', 'Coal mine gas explosion in China'],
  ['cmqv4puvt003m8055qptpxrmt', 'intl', 'Putin and Xi in Beijing'],
  ['cmqv4rmgc006d8055smicow07', 'intl', 'Border talks with India — foreign ministry'],
  ['cmqv4ppzr003g8055x6psga4n', 'market', 'Private investment drought slowing GDP growth'],
  ['cmqv4ra0w005y8055tnzqo4id', 'market', 'Commodity prices: Indian onions, rice, poultry'],
];

const ROLLBACK = path.resolve('scripts/.recategorise-rollback.json');

function pool() {
  const raw = (process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || '').trim();
  const u = new URL(raw.replace(/^postgres(ql)?:\/\//, 'https://'));
  u.searchParams.delete('sslmode');
  u.searchParams.delete('supa');
  const s = u.searchParams.toString();
  const remote = u.hostname !== 'localhost' && u.hostname !== '127.0.0.1';
  return new pg.Pool({
    connectionString: `postgresql://${u.username}:${u.password}@${u.host}${u.pathname}${s ? `?${s}` : ''}`,
    ssl: remote ? { rejectUnauthorized: false } : undefined,
    max: 3,
  });
}

const NAME_BY_ID = Object.fromEntries(
  Object.entries({
    policy: 'Energy Policy & Regulators', generation: 'Power Generation',
    fossil: 'Fossil Fuels & Commodities', renewables: 'Renewables & Nuclear',
    grid: 'Grid & Transmission', distribution: 'Distribution & Utilities',
    consumers: 'Consumers & Tariffs', market: 'Market, Finance & Subsidies',
    intl: 'International & Cross-Border', environment: 'Environment & Efficiency',
  }).map(([k, name]) => [CAT[k], name]),
);

/**
 * Counts read the `category` string, exactly as the site does, and split locale
 * by the same title-script test as getPublishedArticlesByCategory — so this
 * table reflects what a reader sees, not what the FK says.
 */
const counts = async (db) => {
  const { rows } = await db.query(`
    select a.category as name, a.title, a."titleBn"
    from "Article" a where a.status = 'PUBLISHED'`);
  const BN = /[ঀ-৿]/;
  const m = {};
  for (const name of Object.values(NAME_BY_ID)) m[name] = { en: 0, bn: 0 };
  for (const r of rows) {
    const b = (m[r.name] ||= { en: 0, bn: 0 });
    if (!BN.test(r.title)) b.en++;
    if (r.titleBn || BN.test(r.title)) b.bn++;
  }
  return m;
};

const table = (m) => {
  console.log('\n' + 'CATEGORY'.padEnd(32) + '  EN   BN');
  for (const [k, v] of Object.entries(m)) {
    const en = v.en ?? 0, bn = v.bn ?? 0;
    const flag = en < 3 || bn < 3 ? '  <- under 3' : '';
    console.log(k.padEnd(32) + String(en).padStart(4) + String(bn).padStart(5) + flag);
  }
};

const db = pool();
const mode = process.argv.includes('--revert') ? 'revert' : process.argv.includes('--repair') ? 'repair' : process.argv.includes('--dry') ? 'dry' : 'apply';

try {
  if (mode === 'revert') {
    if (!fs.existsSync(ROLLBACK)) throw new Error(`no rollback file at ${ROLLBACK}`);
    const saved = JSON.parse(fs.readFileSync(ROLLBACK, 'utf8'));
    await db.query('begin');
    for (const r of saved) {
      await db.query('update "Article" set "categoryId"=$1, category=$2 where id=$3',
        [r.from, r.fromCategory ?? NAME_BY_ID[r.from], r.id]);
    }
    await db.query('commit');
    console.log(`Reverted ${saved.length} articles to their original categories.`);
    table(await counts(db));
  } else if (mode === 'repair') {
    // The first run wrote only categoryId, leaving the `category` string — the
    // column every read path uses — pointing at the old category. Re-sync it.
    const { rows: bad } = await db.query(`
      select a.id, a.category as old, c.name as want
      from "Article" a join "Category" c on c.id = a."categoryId"
      where a.category <> c.name`);
    console.log(`${bad.length} article(s) whose category string disagrees with the FK.`);
    await db.query('begin');
    for (const r of bad) await db.query('update "Article" set category=$1 where id=$2', [r.want, r.id]);
    await db.query('commit');
    // Backfill fromCategory so --revert can restore both columns.
    if (fs.existsSync(ROLLBACK)) {
      const saved = JSON.parse(fs.readFileSync(ROLLBACK, 'utf8'));
      fs.writeFileSync(ROLLBACK, JSON.stringify(
        saved.map((r) => ({ ...r, fromCategory: r.fromCategory ?? NAME_BY_ID[r.from] })), null, 1));
    }
    console.log('Repaired. Rollback file backfilled with original category names.\n\nAFTER:');
    table(await counts(db));
  } else {
    const ids = MOVES.map((m) => m[0]);
    const { rows: before } = await db.query(
      'select id, title, locale, "categoryId" from "Article" where id = any($1)', [ids]);
    const byId = Object.fromEntries(before.map((r) => [r.id, r]));

    const missing = ids.filter((id) => !byId[id]);
    if (missing.length) throw new Error(`article ids not found: ${missing.join(', ')}`);

    const plan = MOVES.map(([id, key, why]) => ({
      id, to: CAT[key], toName: key, from: byId[id].categoryId,
      title: byId[id].title, locale: byId[id].locale, why,
    })).filter((p) => p.from !== p.to);

    console.log(`${plan.length} article(s) to move (${MOVES.length - plan.length} already correct):\n`);
    for (const p of plan) console.log(`  [${p.locale}] -> ${p.toName.padEnd(13)} ${p.title.slice(0, 62)}`);

    console.log('\nBEFORE:');
    table(await counts(db));

    if (mode === 'dry') {
      console.log('\n--dry: nothing written.');
    } else {
      await db.query('begin');
      for (const p of plan) await db.query("update \"Article\" set \"categoryId\"=$1, category=$2 where id=$3", [p.to, NAME_BY_ID[p.to], p.id]);
      await db.query('commit');
      fs.writeFileSync(ROLLBACK, JSON.stringify(plan.map(({ id, from, title }) => ({ id, from, title })), null, 1));
      console.log(`\nApplied. Rollback written to ${ROLLBACK}`);
      console.log('\nAFTER:');
      table(await counts(db));
    }
  }
} catch (e) {
  try { await db.query('rollback'); } catch {}
  console.error('FAILED:', e.message);
  process.exitCode = 1;
}
await db.end();
