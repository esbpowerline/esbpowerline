/**
 * Publishes the Titas Gas investigation and puts it in the Breaking hero.
 *
 * The hero carousel is driven by `isBreaking = true` + PUBLISHED + not pinned /
 * not trending, ordered by publishedAt desc (see fetchManagedCarouselItems).
 *
 * Every figure below traces to the same sources as /titas-gas: Titas's audited
 * accounts, its auditor's report, its managing director's public statements,
 * DSE filings, and documents from BERC, Petrobangla and the ACC. Nothing is
 * invented, and no quotation is paraphrased into something the speaker did not
 * say.
 *
 *   node scripts/publish-titas-investigation.mjs --dry   preview
 *   node scripts/publish-titas-investigation.mjs         publish
 *   node scripts/publish-titas-investigation.mjs --unpublish   remove it again
 */
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const SLUG = 'titas-gas-system-loss-tk-3000-crore-auditor';
const AUTHOR_ID = 'cmqv471700000vk55trr7n8df'; // ESB NEWS DESK
const CATEGORY = 'Distribution & Utilities';
const CATEGORY_ID = 'cmqv473nh0009vk55nefpoof1';
// Reused from the library — the cover already carried on the Mohammadpur
// illegal-gas-connection story, which is the same subject matter.
const IMAGE_URL =
  'https://sxgokpmrbgdndstygapc.supabase.co/storage/v1/object/public/media/library/1782490384939-Gas-1.webp';

const TITLE = 'Titas Lost Tk 3,000 Crore of Gas Last Year, and Its Own Auditor Named the Cause';
const SHORT_TITLE = 'Titas’s Tk 3,000 Crore Gas Loss';
const EXCERPT =
  'Close to one cubic metre in every ten that Titas Gas bought last year never reached a paying customer. Its auditor calls that the main reason the company is bleeding — and a household without a meter is billed for gas Titas’s own meters say it never burned.';

// Note on style: percentages are written as %, except inside direct quotations,
// where the speaker's or publication's original wording is preserved.
const CONTENT = `
<p>Titas Gas Transmission &amp; Distribution PLC lost close to one cubic metre in every ten it bought last financial year — roughly Tk 3,000 crore of gas that never reached a paying customer. Its own auditor has put that loss at the centre of a slide which has left the country's largest gas distributor in the red for three straight years.</p>

<p>The figure is not an outside estimate. It falls out of Titas's own audited accounts for 2024-25: 15,154 million cubic metres of gas came in, 13,718 mmcm was billed. The missing 1,436 mmcm leaked from ageing pipe or was stolen. Titas had already paid for all of it.</p>

<h2>What the auditor found</h2>

<p>ACNABIN Chartered Accountants, which signs off Titas's accounts, named the rise in system loss as one of the primary reasons for the company's deteriorating financial health. The audit booked a net system loss of Tk 2,421.76 crore inside a cost of sales of Tk 35,407.77 crore — a 34% jump in one year, and that is what remains <em>after</em> deducting the 2% the regulator allows.</p>

<p>The report also set out the causes: illegal connections, leaks from old and corroded distribution lines, damage from the underground works of other utilities, and the fact that nobody knows how much gas non-metered households actually use.</p>

<h2>The number that was never measured</h2>

<p>For years the problem stayed invisible, because the number was fiction. Until 2022 Titas reported system loss at a flat 2%. Nobody had measured it. Company officials told New Age the figure "was never actually calculated" and that the loss "was kept at 2 per cent following a decision of the energy ministry." When the government checked in 2022, it found something closer to 13%.</p>

<p>Once the counting became honest, the line moved one way: 5.28% in 2022-23, 7.67% in 2023-24, 9.47% in 2024-25, and 10.13% in the most recent quarter Titas has reported. The regulator allows 2%.</p>

<h2>What it costs a household</h2>

<p>A home without a prepaid meter does not pay for the gas it burns. It pays a flat monthly bill for a volume the Bangladesh Energy Regulatory Commission assumes it burns — and the assumption is generous. BERC's 2022 tariff order fixed non-metered use at 60 cubic metres a month for a double burner, billed at Tk 1,080.</p>

<p>Titas's own meters tell a different story. A Prothom Alo review of the company's prepaid-meter records found households averaging 34 cubic metres a month. At the Tk 18 per cubic metre metered rate set in that same order, that is Tk 612 of gas against a Tk 1,080 bill — a gap of about Tk 468 a month, or Tk 5,616 a year, for gas that was never delivered.</p>

<p>How wide the gap runs depends on whose figure you take. BERC's own technical committee put real double-burner use at about 50 cubic metres a month, which would put the overpayment at Tk 180. On either number, the household is billed for 60. Roughly 2.43 million of Titas's 2.85 million household connections still have no meter. Across all of them, the gap is worth between Tk 525 crore and Tk 1,365 crore a year.</p>

<p>Titas has an answer, offered by a former managing director: BERC sets the price, not Titas, and prepaid customers use gas carefully precisely because they are metered, so the comparison is unfair. The objection is a fair one. It also concedes the point — nobody knows what an unmetered home actually burns.</p>

<h2>Three years in the red</h2>

<p>A company that was once a dependable earner posted the first annual loss in its history in 2022-23, at Tk 165 crore. Then Tk 744.08 crore. Then Tk 772 crore — Tk 1,680 crore in three years. The cash dividend has fallen from 26% in 2019 and 2020 to 2% for 2024-25. In the year it lost Tk 744 crore, the board still paid shareholders Tk 49 crore out of retained earnings.</p>

<p>This year has not turned it around. Titas's filings with the Dhaka Stock Exchange show a basic loss per share of Tk 6.21 across the first nine months, on 989,221,831 shares in issue.</p>

<h2>Management has done the arithmetic</h2>

<p>Managing director Shahnewaz Parvez has priced the failure in public. With the loss running at 7%, he put the cost at Tk 150–180 crore a month — Tk 1,800–2,160 crore a year — and reckoned roughly half was leaking pipe and half was theft.</p>

<p>He has been equally direct about who is doing the stealing. "There are syndicates consisting of locals, contractors and some workers of Titas itself," he told The Daily Star. Of the people behind the illegal lines: "Influential people are behind this — it is common knowledge."</p>

<p>Much of the network is older than the country. Most of the distribution pipe under Dhaka and Narayanganj was laid in 1968-69. By January 2025 Titas had prepared the paperwork to start replacing it; the tender had still not been floated.</p>

<h2>The crackdown is shrinking</h2>

<p>Enforcement is moving the wrong way. In 2024-25 Titas cut off 1.16 lakh illegal household lines and 576 commercial and industrial connections, down from 2.19 lakh and 683 a year earlier. Officials conceded that anti-theft drives slowed for stretches of the year. System loss rose regardless.</p>

<p>None of this is new to the anti-corruption watchdog. In 2019 the Anti-Corruption Commission identified 22 separate sources of graft at Titas: bribes for legal connections, tampered meters, severed illegal lines quietly reconnected, unauthorised lines run to boilers and generators — and "showing artificial system loss." In a single year it found 118,455 illegal connections across five areas, with Tk 92.39 crore in billing that nobody ever collected.</p>

<p>Nor did it end with the change of government. The administration that took office in August 2024 replaced Titas's management and called the company one of the "most corrupt" organisations under the energy ministry. Seven months later the ACC raided two Dhanmondi restaurants over illegal lines it said had been arranged with the help of Titas staff.</p>

<h2>The regulator is not persuaded either</h2>

<p>When Titas asked to be allowed to earn more on every cubic metre it delivers, BERC went the other way — halving its distribution margin to Tk 0.13 per cubic metre in the 2022 tariff order, against the roughly Tk 0.55 the company said it needed.</p>

<p><em>How this was compiled: every figure in this report comes from Titas Gas's own audited accounts and disclosures, its auditor's report, statements by its management, filings with the Dhaka Stock Exchange, or documents issued by BERC, Petrobangla and the Anti-Corruption Commission. Where the underlying filing is not publicly hosted, the figure is attributed to the outlet that reported it from that document. Quotations are reproduced as they were published. A fuller record, with every figure linked to its source, is on our Titas Gas accountability page.</em></p>
`.trim();

const TAGS = ['Titas Gas', 'system loss', 'gas distribution', 'BERC', 'ACC', 'accountability'];

function pool() {
  const raw = (process.env.DATABASE_URL || '').trim();
  const u = new URL(raw.replace(/^postgres(ql)?:\/\//, 'https://'));
  u.searchParams.delete('sslmode');
  u.searchParams.delete('supa');
  const s = u.searchParams.toString();
  return new pg.Pool({
    connectionString: `postgresql://${u.username}:${u.password}@${u.host}${u.pathname}${s ? `?${s}` : ''}`,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
}

const db = pool();
const mode = process.argv.includes('--unpublish') ? 'unpublish' : process.argv.includes('--dry') ? 'dry' : 'publish';

try {
  if (mode === 'unpublish') {
    const r = await db.query('delete from "Article" where slug = $1', [SLUG]);
    console.log(`Removed ${r.rowCount} article(s).`);
  } else {
    const words = CONTENT.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.round(words / 200));
    console.log(`title    : ${TITLE}`);
    console.log(`category : ${CATEGORY}`);
    console.log(`slug     : ${SLUG}`);
    console.log(`words    : ${words}  (readTime ${readTime} min)`);
    console.log(`breaking : true  -> enters the hero carousel`);

    if (mode === 'dry') {
      console.log('\n--dry: nothing written.');
    } else {
      const existing = await db.query('select id from "Article" where slug = $1', [SLUG]);
      if (existing.rowCount) {
        await db.query(
          `update "Article" set title=$1, "shortTitle"=$2, excerpt=$3, content=$4, category=$5,
             "categoryId"=$6, "imageUrl"=$7, "readTime"=$8, tags=$9, status='PUBLISHED',
             "isBreaking"=true, "isPinned"=false, "isTrending"=false, "publishedAt"=now(), "updatedAt"=now()
           where slug=$10`,
          [TITLE, SHORT_TITLE, EXCERPT, CONTENT, CATEGORY, CATEGORY_ID, IMAGE_URL, readTime, JSON.stringify(TAGS), SLUG],
        );
        console.log('\nUpdated existing article.');
      } else {
        await db.query(
          `insert into "Article"
             (id, title, "shortTitle", slug, excerpt, content, "authorId", "publishedAt", status,
              category, "categoryId", "imageUrl", "readTime", views, likes,
              "isFeatured", "isBreaking", "isPinned", "isTrending", "postAsNewsDesk", tags,
              "createdAt", "updatedAt", version, locale)
           values
             (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, now(), 'PUBLISHED',
              $7, $8, $9, $10, 0, 0,
              false, true, false, false, true, $11,
              now(), now(), 1, 'en')`,
          [TITLE, SHORT_TITLE, SLUG, EXCERPT, CONTENT, AUTHOR_ID, CATEGORY, CATEGORY_ID, IMAGE_URL, readTime, JSON.stringify(TAGS)],
        );
        console.log('\nPublished.');
      }
      const { rows } = await db.query(
        `select title, category, "isBreaking", "publishedAt" from "Article"
         where status='PUBLISHED' and "isBreaking"=true and "isPinned"=false and "isTrending"=false
         order by "publishedAt" desc limit 5`);
      console.log('\nHero carousel now:');
      rows.forEach((r, i) => console.log(`  ${i + 1}. [${r.category}] ${r.title.slice(0, 70)}`));
    }
  }
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
}
await db.end();
