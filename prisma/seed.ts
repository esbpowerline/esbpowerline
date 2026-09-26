/**
 * ESB PowerLine — Comprehensive Prisma Seed
 * Realistic Bangladesh power & energy sector data.
 * 20+ articles across the 10 legacy categories + users + magazine + grid nodes/edges + stats.
 * Run with: npm run db:seed (or npx tsx prisma/seed.ts)
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createScriptPrismaClient } from './client';
import { CATEGORIES, CATEGORY_DETAILS } from '../lib/constants';
import { EDITOR_EMAIL, EDITOR_NAME, MASTER_ADMIN_EMAIL, RASEL_EMAIL, RASEL_NAME } from '../lib/staff-accounts';
import { DEFAULT_COVERAGE_SLOTS } from '../lib/coverage-defaults';
import { slugify } from '../lib/utils';
import { upsertSupabaseAuthUser } from '../lib/supabase/sync-auth-user';
import { MEMBER_DEMO_EMAIL, seedPasswordForEmail } from '../lib/seed-credentials';
import { assertSafeSeedTarget } from '../lib/seed-target-guard';


const prisma = createScriptPrismaClient();

async function main() {
  // Gates on the DATABASE_URL host, not NODE_ENV — no npm script sets NODE_ENV,
  // so the old check never fired and this ran against the live database.
  assertSafeSeedTarget('prisma/seed.ts');

  console.log('🌱 Seeding ESB PowerLine database...');

  // Clean in dev (order matters for relations)
  await prisma.auditLog.deleteMany();
  await prisma.revision.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.magazineIssue.deleteMany();
  await prisma.media.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();
  await prisma.memberDownload.deleteMany();
  await prisma.savedItem.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.newsletterSub.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.siteSetting.deleteMany();

  // === USERS (demo accounts — per-role dev passwords or env overrides) ===
  const adminPassword = seedPasswordForEmail(MASTER_ADMIN_EMAIL);
  const editorPassword = seedPasswordForEmail(EDITOR_EMAIL);
  const raselPassword = seedPasswordForEmail(RASEL_EMAIL);
  const memberPassword = seedPasswordForEmail(MEMBER_DEMO_EMAIL);
  if (!adminPassword || !editorPassword || !raselPassword || !memberPassword) {
    throw new Error('Seed passwords not configured. Set SEED_DEMO_PASSWORD or per-account env vars.');
  }

  const superAdmin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: MASTER_ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      bio: 'Platform administrator',
    },
  });

  const editor = await prisma.user.create({
    data: {
      name: EDITOR_NAME,
      email: EDITOR_EMAIL,
      passwordHash: await bcrypt.hash(editorPassword, 10),
      role: 'EDITOR',
      status: 'ACTIVE',
      bio: 'Senior Energy Correspondent — ESB PowerLine',
      articlesCount: 0,
      totalViews: 0,
    },
  });

  const rasel = await prisma.user.create({
    data: {
      name: RASEL_NAME,
      email: RASEL_EMAIL,
      passwordHash: await bcrypt.hash(raselPassword, 10),
      role: 'EDITOR',
      status: 'ACTIVE',
      bio: 'Senior Editor — ESB PowerLine',
      articlesCount: 0,
      totalViews: 0,
    },
  });

  const demoMember = await prisma.user.create({
    data: {
      name: 'Demo Member',
      email: MEMBER_DEMO_EMAIL,
      phone: '+8801712345678',
      passwordHash: await bcrypt.hash(memberPassword, 10),
      role: 'SUBSCRIBER',
      status: 'ACTIVE',
      bio: 'Energy sector professional — member account',
    },
  });

  // Sync to Supabase Auth if configured
  await upsertSupabaseAuthUser({ email: MASTER_ADMIN_EMAIL, password: adminPassword, name: 'System Admin', role: 'SUPER_ADMIN', status: 'ACTIVE' });
  await upsertSupabaseAuthUser({ email: EDITOR_EMAIL, password: editorPassword, name: EDITOR_NAME, role: 'EDITOR', status: 'ACTIVE' });
  await upsertSupabaseAuthUser({ email: RASEL_EMAIL, password: raselPassword, name: RASEL_NAME, role: 'EDITOR', status: 'ACTIVE' });
  await upsertSupabaseAuthUser({ email: MEMBER_DEMO_EMAIL, password: memberPassword, name: 'Demo Member', role: 'SUBSCRIBER', status: 'ACTIVE' });

  console.log('✓ Users seeded (admin, editors, member)');

  // === CATEGORIES (optimized 10) ===
  const catRecords = await Promise.all(
    CATEGORIES.map((name, idx) => {
      const meta = CATEGORY_DETAILS[name];
      return prisma.category.create({
        data: {
          name,
          slug: slugify(name),
          description: meta.description,
          color: meta.color,
          icon: meta.icon,
          order: idx,
        },
      });
    })
  );
  console.log('✓ 10 Categories seeded');

  const categoryIdByName = Object.fromEntries(catRecords.map((c) => [c.name, c.id]));

  // === OFFICIAL ESB POWERLINE ARTICLES (All Coverage mosaic + detailed archive) ===
  const officialArticles = [
    {
      slug: 'bangladeshs-power-costs-rise-manifold-on-fossil-fuel-dependency-report',
      title: "Bangladesh's power costs rise manifold on fossil fuel dependency: report",
      cat: 'Market, Finance & Subsidies',
      featured: true,
      breaking: true,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-06-10T09:36:00'),
      imageUrl: '/images/INNER001.jpg',
      excerpt: "Primary energy imports rose to 62.5% and generation costs surged 83% in four years, an IEEFA report finds, while renewables account for only 2.3% of grid output.",
      content: `<p>Bangladesh's reliance on primary energy imports rose from 47.7 percent to 62.5 percent in four years, leaving the country exposed to volatile global fossil fuel markets. As a result, power generation costs have gone up by 83%, according to a new report.</p>
<p>The report, <strong>"Fostering Bangladesh's Energy Transition,"</strong> published by the Institute for Energy Economics and Financial Analysis (IEEFA), analysed data from FY2020-21 to FY2024-25.</p>
<p>A 290 percent surge in average coal prices between FY21 and FY23, compounded by elevated oil prices and sharp taka depreciation, drove generation costs sharply higher, the report finds.</p>
<p>Despite a 59.7 percent fall in coal prices since FY23 and subdued oil prices, costs did not ease in FY25. Capacity payments were a key factor.</p>
<p>"The average capacity payments of approximately Tk 9.5/kWh ($0.077/kWh) and Tk 5.9/kWh ($0.048/kWh) paid to private oil- and coal-fired plants, respectively, in FY25 raised overall generation costs," said IEEFA lead energy analyst and report author Shafiqul Alam.</p>
<p>Gas supply shortages added further pressure, with plants operating below 25 percent load factor generating power at Tk 16.85/kWh ($0.137/kWh), against Tk 6/kWh ($0.049/kWh) for those running at around 75 percent load.</p>
<p>Declining domestic gas output means Bangladesh must rely increasingly on imported liquefied natural gas (LNG). The report estimates the country could pay $1.07 billion (Tk 131.34 billion) in LNG import subsidies between April and June 2026.</p>
<p>Renewable energy accounts for just 2.3 percent of grid-based generation against a global average of around 33.8 percent. The report estimates 100 megawatts of combined rooftop solar capacity would save more than 30 times its one-off import duties over its lifecycle.</p>
<p>The report also urges Bangladesh to tap hydropower under the Bangladesh-Bhutan-India-Nepal (BBIN) framework. A combined 6,000MW from Nepal and Bhutan during the peak March-September period could cut annual gas consumption by up to 257 billion cubic feet post-2030.</p>
<p>Bangladesh Power Development Board recorded revenue shortfalls of Tk 556.6 billion ($4.53 billion) in FY25. "The pathway to energy transition hinges on prudent policy decisions supported by a favourable ecosystem," Alam said.</p>`,
    },
    {
      slug: 'bangladesh-to-buy-five-more-lng-cargoes',
      title: 'Bangladesh to buy five more LNG cargoes',
      cat: 'Fossil Fuels & Commodities',
      featured: true,
      breaking: true,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-06-10T09:33:00'),
      imageUrl: '/images/INNER002.jpg',
      excerpt: 'The Cabinet Committee on Government Purchase approved five LNG cargoes—including three spot purchases—to meet summer demand amid Middle East supply uncertainty.',
      content: `<p>The government yesterday approved the purchase of five liquefied natural gas (LNG) cargoes, including three from the spot market, to help meet the country's energy demand as supplies under long-term contracts face uncertainty amid the conflict in the Middle East.</p>
<p>The Cabinet Committee on Government Purchase (CCGP) approved the proposals at a meeting yesterday following recommendations from the Energy and Mineral Resources Division.</p>
<p>Among the approved proposals was the purchase of two LNG cargoes from SOCAR Trading SA of Switzerland under a direct procurement method for 2026. Under the agreement, the LNG will be purchased at a price linked to the Japan-Korea Marker (JKM) benchmark, with a premium of $0.25 per million British thermal units (MMBtu).</p>
<p>The committee also approved the purchase of three LNG cargoes from the spot market. The cargoes are scheduled for delivery during three separate windows: June 26-27, June 30-July 1 and July 6-7.</p>
<p>According to the approvals, BP Singapore Pte Ltd will supply one cargo, while TotalEnergies Gas & Power Ltd of the UK will supply the remaining two.</p>
<p>The additional cargoes are expected to support power plants and industrial consumers facing gas rationing during peak summer demand, when domestic production and pipeline supplies typically fall short of requirements.</p>`,
    },
    {
      slug: 'record-electricity-price-hike-industrial-and-household-expenses-on-the-rise',
      title: 'Record Electricity Price Hike: Industrial and Household Expenses on the Rise',
      cat: 'Consumers & Tariffs',
      featured: true,
      breaking: true,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-06-04T10:00:00'),
      imageUrl: '/images/INNER003.jpg',
      excerpt: 'BERC has raised average electricity prices by 16.68%, pushing up costs for households and export-oriented industries already under margin pressure.',
      content: `<p>The Bangladesh Energy Regulatory Commission (BERC) has once again significantly increased electricity prices in the country. Under the new announcement, electricity prices have been raised by an average of 16.68 percent across consumer categories.</p>
<p>Industrial consumers, particularly those in the readymade garment and textile sectors, face steep increases that will feed directly into production costs. Household consumers in higher slab categories will also see noticeably larger monthly bills.</p>
<p>BERC officials cited rising fuel costs, capacity payments to independent power producers, and the taka's depreciation against the US dollar as primary drivers behind the adjustment.</p>
<p>Trade bodies have warned that repeated tariff hikes without corresponding improvements in supply reliability could erode Bangladesh's export competitiveness, especially as regional rivals maintain more stable power pricing.</p>
<p>Consumer rights groups staged demonstrations outside the BERC headquarters during the public hearing process, arguing that subsidy rationalisation should target inefficiency and system losses before passing costs to end users.</p>
<p>The new rates take effect immediately for bulk supply and will cascade to retail tariffs through distribution companies over the coming billing cycle.</p>`,
    },
    {
      slug: 'electricity-prices-hiked-at-consumer-and-wholesale-levels-new-rates-announced',
      title: 'Electricity Prices Hiked at Consumer and Wholesale Levels; New Rates Announced',
      cat: 'Consumers & Tariffs',
      featured: false,
      breaking: true,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-06-03T14:30:00'),
      imageUrl: '/images/INNER004.jpg',
      excerpt: 'BERC announced simultaneous increases at wholesale and retail levels, publishing revised tariffs at a press conference attended by utility executives and consumer representatives.',
      content: `<p>The Bangladesh Energy Regulatory Commission (BERC) has announced an increase in electricity prices at both the consumer and wholesale levels. The new tariffs were published at a press conference, where commissioners outlined the phased implementation schedule.</p>
<p>At the wholesale level, the Bangladesh Power Development Board and affiliated entities will pay higher bulk supply tariffs designed to narrow the gap between average cost of service and regulated revenue recovery.</p>
<p>Distribution utilities including DESCO, DPDC, and the Palli Bidyut Samity network received revised rate schedules differentiated by voltage level and consumer class.</p>
<p>Officials emphasised that lifeline consumers in the lowest consumption bracket would see more modest adjustments compared with large industrial and commercial accounts.</p>
<p>The commission also signalled that further automatic adjustments linked to fuel price pass-through mechanisms could follow if international energy markets remain volatile through the second half of 2026.</p>`,
    },
    {
      slug: 'government-focusing-on-renewable-energy-to-achieve-self-reliance-in-power-chief-whip',
      title: 'Government Focusing on Renewable Energy to Achieve Self-Reliance in Power: Chief Whip',
      cat: 'Energy Policy & Regulators',
      featured: true,
      breaking: false,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-05-24T11:00:00'),
      imageUrl: '/images/INNER005.jpg',
      excerpt: 'Chief Whip Md. Nurul Islam said expanding renewables is central to long-term power stability and reducing dependence on imported fossil fuels.',
      content: `<p>Chief Whip of the National Parliament, Md. Nurul Islam has stated that the government is focusing on expanding the use of renewable energy to achieve long-term stability and self-reliance in the power sector.</p>
<p>Speaking at a policy dialogue on national energy security, the Chief Whip highlighted solar, wind, and cross-border hydropower as pillars of a diversified generation mix that could reduce exposure to LNG and coal price shocks.</p>
<p>He noted that rooftop solar programmes, utility-scale tenders under SREDA, and improved grid integration policies would be prioritised in the upcoming annual development programme.</p>
<p>Energy advisers present at the event underscored the need for streamlined permitting and duty relief on imported components for distributed generation systems.</p>
<p>Industry stakeholders welcomed the emphasis on renewables but called for binding targets and transparent auction timelines to unlock private capital at scale.</p>`,
    },
    {
      slug: 'private-investments-worth-tk-35000-crore-stalled-due-to-gas-connection-crisis',
      title: 'Private Investments Worth Tk 35,000 Crore Stalled Due to Gas Connection Crisis',
      cat: 'Fossil Fuels & Commodities',
      featured: false,
      breaking: false,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-05-24T09:15:00'),
      imageUrl: '/images/INNER006.jpg',
      excerpt: 'At least Tk 35,000 crore in private investment across economic zones is stalled as factories await gas connections amid chronic supply deficits.',
      content: `<p>At least Tk 35,000 crore in private investments across various economic and industrial zones in the country is virtually stalled due to a gas connection crisis. With numerous factories that have completed construction unable to commence operations, investors are facing mounting carrying costs.</p>
<p>Petrobangla and the Energy and Mineral Resources Division have struggled to allocate new connections as domestic production declines and LNG import capacity remains constrained during peak demand periods.</p>
<p>Business leaders estimate that delayed commissioning across multiple zones could affect tens of thousands of projected jobs if gas allocations are not resolved before the next fiscal year.</p>
<p>Officials have pointed to new LNG cargoes and expanded regasification throughput at Moheshkhali as near-term remedies, but investors argue that firm delivery timelines are needed before additional capital commitments materialise.</p>
<p>The Bangladesh Economic Zones Authority has requested a fast-track review of pending connection applications for export-oriented units with signed international purchase agreements.</p>`,
    },
    {
      slug: 'new-initiative-for-offshore-oil-and-gas-exploration-petrobangla-to-invite-international-tenders-on-sunday',
      title: 'New Initiative for Offshore Oil and Gas Exploration: Petrobangla to Invite International Tenders on Sunday',
      cat: 'Fossil Fuels & Commodities',
      featured: false,
      breaking: false,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-05-23T16:00:00'),
      imageUrl: '/images/INNER001.jpg',
      excerpt: 'Petrobangla will invite international tenders for offshore blocks in the Bay of Bengal under revised fiscal terms aimed at attracting foreign explorers.',
      content: `<p>To inject new momentum into oil and gas exploration in the Bay of Bengal, the Bangladesh Oil, Gas and Mineral Resources Corporation (Petrobangla) will invite international tenders on Sunday under an updated production-sharing framework.</p>
<p>The initiative covers multiple offshore blocks and introduces improved cost-recovery provisions and arbitration clauses designed to address concerns raised by international majors in previous bidding rounds.</p>
<p>Energy officials expect strong interest from regional and global players given rising domestic gas demand and the success of neighbouring offshore programmes.</p>
<p>Domestic exploration has yielded limited new discoveries in recent years, increasing reliance on imported LNG. Successful offshore development could materially improve Bangladesh's long-term energy security outlook.</p>
<p>Environmental groups have called for rigorous impact assessments and transparent benefit-sharing arrangements with coastal communities as exploration activity intensifies.</p>`,
    },
    {
      slug: 'world-bank-allocates-usd-350-million-for-bangladesh-lng-imports',
      title: 'World Bank allocates USD 350 million for Bangladesh LNG imports',
      cat: 'Market, Finance & Subsidies',
      featured: false,
      breaking: false,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-05-18T12:00:00'),
      imageUrl: '/images/INNER002.jpg',
      excerpt: 'The World Bank approved $350 million in additional financing to help Bangladesh secure LNG supplies and stabilise the gas grid during peak demand.',
      content: `<p>The World Bank approved USD 350 million in additional financing on Friday to help Bangladesh secure liquefied natural gas (LNG) imports and support related infrastructure upgrades.</p>
<p>The funding is intended to cushion fiscal pressures associated with spot and term LNG purchases while Petrobangla and RPGCL expand delivery capacity to power plants and industrial consumers.</p>
<p>Development partners noted that predictable gas supply is essential for maintaining generation availability and avoiding costly diesel-fired peaking plant dispatch.</p>
<p>The financing package includes technical assistance components for improving procurement transparency and demand forecasting across the power and industrial sectors.</p>
<p>Government officials welcomed the support as a bridge measure while longer-term domestic exploration and renewable deployment programmes scale up.</p>`,
    },
    {
      slug: 'small-garment-exporters-adopt-solar-power-amid-european-buyer-pressure',
      title: 'Small garment exporters adopt solar power amid European buyer pressure',
      cat: 'Renewables & Nuclear',
      featured: false,
      breaking: false,
      views: 0,
      author: editor.id,
      publishedAt: new Date('2026-05-18T10:30:00'),
      imageUrl: '/images/INNER003.jpg',
      excerpt: 'Smaller RMG exporters are installing rooftop solar to meet European buyer sustainability requirements and hedge against rising grid tariffs.',
      content: `<p>A growing number of small and medium garment exporters are adopting rooftop solar systems as European buyers intensify sustainability requirements in sourcing contracts.</p>
<p>Factory owners cite dual motivations: meeting buyer audit standards on carbon footprint reduction and insulating operations from successive electricity tariff increases that have compressed already thin margins.</p>
<p>Leasing models and third-party power purchase arrangements are lowering upfront capital barriers for firms that cannot fund installations outright.</p>
<p>SREDA and partner banks have expanded refinance windows for distributed solar, though industry associations continue to push for duty waivers on imported inverters and modules.</p>
<p>Analysts expect distributed industrial solar to accelerate if open-access wheeling rules are simplified and net-metering settlements become more predictable for export-oriented units.</p>`,
    },
  ];

  for (const a of officialArticles) {
    await prisma.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        authorId: a.author,
        category: a.cat,
        categoryId: categoryIdByName[a.cat],
        status: 'PUBLISHED',
        isFeatured: a.featured,
        isBreaking: a.breaking,
        views: a.views,
        readTime: Math.max(4, Math.ceil(a.content.replace(/<[^>]+>/g, '').length / 900)),
        publishedAt: a.publishedAt,
        imageUrl: a.imageUrl,
        tags: [a.cat.split(' ')[0].toLowerCase(), 'esb-official'],
        seo: { metaTitle: a.title, metaDescription: a.excerpt },
      },
    });
  }
  console.log(`✓ ${officialArticles.length} Official ESB PowerLine articles seeded`);

  // === ARTICLES (additional sector coverage) ===
  const articlesData = [
    { title: 'BPDB hits 28.4 GW installed capacity milestone', cat: 'Power Generation', featured: true, breaking: false, views: 0, author: editor.id, excerpt: 'New IPP additions and Rooppur nuclear progress drive record total generation capacity.', content: '<p>State-owned and private generation assets have pushed Bangladesh past the 28 GW mark...</p>', status: 'PUBLISHED' },
    { title: 'SREDA opens 1,800 MW solar + wind tender', cat: 'Renewables & Nuclear', featured: true, breaking: true, views: 0, author: editor.id, excerpt: 'Competitive bidding for utility-scale projects expected to accelerate the 10% RE target by 2030.', content: '<p>The Sustainable and Renewable Energy Development Authority (SREDA) has floated a major tender...</p>', status: 'PUBLISHED' },
    { title: 'BERC approves 8.95 Tk/kWh bulk supply tariff', cat: 'Energy Policy & Regulators', featured: false, breaking: true, views: 0, author: editor.id, excerpt: 'Adjustment balances generator cost recovery with measures to protect residential consumers.', content: '<p>The Bangladesh Energy Regulatory Commission published the gazette notification yesterday...</p>', status: 'PUBLISHED' },
    { title: 'Petrobangla gas supply shortfall hits 650 MMcfd', cat: 'Fossil Fuels & Commodities', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'Power plants on alternative fuel as domestic production and LNG imports lag summer demand.', content: '<p>RPGCL and Petrobangla have declared a supply deficit...</p>', status: 'PUBLISHED' },
    { title: 'Rooppur Unit-1 fuel loading begins', cat: 'Renewables & Nuclear', featured: true, breaking: false, views: 0, author: editor.id, excerpt: 'First fuel assemblies loaded at Bangladesh’s maiden nuclear power plant; commercial operation targeted late 2026.', content: '<p>Russian and Bangladeshi engineers completed initial fuel loading procedures...</p>', status: 'PUBLISHED' },
    { title: 'PGCB completes 400 kV Patuakhali–Gopalganj line', cat: 'Grid & Transmission', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'New backbone strengthens evacuation from southern generation clusters.', content: '<p>The 170 km double-circuit line increases transfer capacity by 1,800 MW...</p>', status: 'PUBLISHED' },
    { title: 'BREB solar home systems surpass 6.5 million installations', cat: 'Distribution & Utilities', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'Off-grid households continue to benefit from the world’s largest SHS program.', content: '<p>Cumulative installations have delivered clean lighting and phone charging to over 25 million people...</p>', status: 'PUBLISHED' },
    { title: 'Industrial efficiency program saves 420 MW peak', cat: 'Environment & Efficiency', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'BEA and ADB-backed motor and pump replacement drive yields rapid demand-side results.', content: '<p>Over 1,200 industrial units participated in the first phase...</p>', status: 'PUBLISHED' },
    { title: 'Adani Godda import row heads to BERC arbitration', cat: 'International & Cross-Border', featured: false, breaking: true, views: 0, author: editor.id, excerpt: 'Tariff dispute and transmission charges dominate talks between Bangladesh and Indian supplier.', content: '<p>Both sides have submitted written submissions to the regulator...</p>', status: 'PUBLISHED' },
    { title: 'IPPs report record quarterly earnings on capacity payments', cat: 'Power Generation', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'Summit, United, and Confidence Power post strong results despite fuel cost volatility.', content: '<p>Capacity charge revenue remained robust even as energy dispatch varied...</p>', status: 'PUBLISHED' },
    // 10 more for volume
    { title: 'DESCO peak demand reaches 3,180 MW new record', cat: 'Distribution & Utilities', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'Dhaka distribution utility prepares summer contingency with additional 132 kV bays.', content: '<p>Load shedding was avoided through careful demand management...</p>', status: 'PUBLISHED' },
    { title: 'New 225 MW wind project at Cox’s Bazar gets environmental clearance', cat: 'Renewables & Nuclear', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'First utility-scale wind farm moves closer to financial close.', content: '<p>The 50-turbine project is expected online by 2028...</p>', status: 'PUBLISHED' },
    { title: 'Government mulls 3,000 MW cross-border hydro import from Nepal & Bhutan', cat: 'International & Cross-Border', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'Tripartite talks advance on firm power contracts and transmission corridors.', content: '<p>A high-level technical committee has been formed...</p>', status: 'DRAFT' },
    { title: 'BERC proposes time-of-use tariffs for large industrial consumers', cat: 'Energy Policy & Regulators', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'Peak/off-peak pricing aimed at flattening the national load curve.', content: '<p>Consultation paper published; comments due by end of month...</p>', status: 'PUBLISHED' },
    { title: 'LNG spot cargoes arrive at 12% discount to long-term contracts', cat: 'Fossil Fuels & Commodities', featured: false, breaking: false, views: 0, author: editor.id, excerpt: 'Relief for power sector fuel costs as global prices soften.', content: '<p>Three spot cargoes discharged at Moheshkhali this week...</p>', status: 'PUBLISHED' },
  ];

  for (let i = 0; i < articlesData.length; i++) {
    const a = articlesData[i];
    const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
    await prisma.article.create({
      data: {
        title: a.title,
        slug,
        excerpt: a.excerpt,
        content: a.content,
        authorId: a.author,
        category: a.cat,
        categoryId: categoryIdByName[a.cat],
        status: a.status as any,
        isFeatured: a.featured,
        isBreaking: a.breaking,
        views: a.views,
        readTime: Math.ceil((a.content.length || 600) / 200),
        publishedAt: a.status === 'PUBLISHED' ? new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 12) : null,
        imageUrl: `/images/INNER00${1 + (i % 6)}.jpg`,
        tags: [a.cat.split(' ')[0].toLowerCase()],
        seo: { metaTitle: a.title, metaDescription: a.excerpt },
      },
    });
  }
  console.log(`✓ ${articlesData.length} Articles seeded`);

  // === MAGAZINE ISSUES (3) ===
  await prisma.magazineIssue.createMany({
    data: [
      { title: 'Renewables Surge & Tariff Reform', issueDate: new Date('2026-05-01'), coverUrl: '/images/demo_magazine_cover.jpg', pdfUrl: 'https://example.com/magazine/2026-05.pdf', summary: 'Cover story on the 1,800 MW solar tender and BERC’s latest bulk tariff order.', status: 'published' },
      { title: 'Grid Modernization & Nuclear Dawn', issueDate: new Date('2026-04-01'), coverUrl: '/images/COVER001.jpg', pdfUrl: 'https://example.com/magazine/2026-04.pdf', summary: 'Rooppur fuel loading, 400 kV backbone projects, and digital dispatch upgrades.', status: 'published' },
      { title: 'Gas Security & Regional Trade', issueDate: new Date('2026-03-01'), coverUrl: '/images/COVER002.jpg', pdfUrl: 'https://example.com/magazine/2026-03.pdf', summary: 'LNG strategy, Nepal-Bhutan hydro prospects, and the future of domestic gas fields.', status: 'published' },
    ],
  });
  console.log('✓ Magazine issues seeded');

  const [sampleArticle, sampleMagazine] = await Promise.all([
    prisma.article.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' } }),
    prisma.magazineIssue.findFirst({ orderBy: { issueDate: 'desc' } }),
  ]);

  if (sampleArticle && sampleMagazine) {
    await prisma.savedItem.createMany({
      data: [
        { userId: demoMember.id, itemType: 'ARTICLE', targetId: sampleArticle.id },
        { userId: demoMember.id, itemType: 'MAGAZINE', targetId: sampleMagazine.id },
      ],
    });
    await prisma.memberDownload.create({
      data: {
        userId: demoMember.id,
        label: 'Grid snapshot (CSV)',
        fileUrl: '/api/members/grid-export',
      },
    });
    await prisma.comment.createMany({
      data: [
        {
          articleId: sampleArticle.id,
          userId: demoMember.id,
          authorName: demoMember.name,
          authorEmail: demoMember.email,
          content: 'Useful breakdown — the tariff implications for IPPs are especially clear.',
          status: 'APPROVED',
        },
        {
          articleId: sampleArticle.id,
          userId: demoMember.id,
          authorName: demoMember.name,
          authorEmail: demoMember.email,
          content: 'Would be helpful to see a follow-up on regional import pricing.',
          status: 'PENDING',
        },
      ],
    });
    console.log('✓ Demo member library seeded');
  }

  // Dashboard stats are no longer seeded: DashboardStat was retired 2026-09-01
  // (migration 0013). The Sector Snapshot reads the grid archive instead.

  // === NODES + EDGES (subset from BD_PWR_TREE for the explorer) ===
  const nodes = [
    { id: 'mpemr', label: 'Ministry of Power, Energy & Mineral Resources', designation: 'Ministry', category: 'government', kpiValue: '17345', kpiUnit: 'Cr BDT Budget', nodeColor: '#64748b', icon: 'building' },
    { id: 'berc', label: 'Bangladesh Energy Regulatory Commission', designation: 'Regulator', category: 'regulator', kpiValue: '47', kpiUnit: 'Tariff Changes/Year', nodeColor: '#059669', icon: 'cpu' },
    { id: 'bpdb', label: 'BPDB', designation: 'State Generation', category: 'state_generation', kpiValue: '6600', kpiUnit: 'MW', nodeColor: '#0D9488', icon: 'factory' },
    { id: 'pgcb', label: 'PGCB', designation: 'Transmission', category: 'transmission', kpiValue: '24000', kpiUnit: 'Circuit km', nodeColor: '#1E3A8A', icon: 'network' },
  ];
  for (const n of nodes) {
    await prisma.node.create({ data: { ...n, x: Math.random() * 800, y: Math.random() * 600 } });
  }
  // A couple edges
  await prisma.edge.create({ data: { sourceId: 'mpemr', targetId: 'berc', flowType: 'policy', label: 'Policy oversight', flowVolume: 0 } });
  await prisma.edge.create({ data: { sourceId: 'bpdb', targetId: 'pgcb', flowType: 'power', label: 'Evacuation', flowVolume: 6600 } });

  console.log('✓ Grid nodes & edges (sample) seeded');

  // Site settings
  await prisma.siteSetting.createMany({
    data: [
      { key: 'site', value: { name: 'ESB PowerLine', tagline: "Bangladesh's premier energy news portal" } },
      { key: 'seo', value: { metaTitle: 'ESB PowerLine — Bangladesh Energy News', metaDescription: 'Authoritative coverage of power generation, renewables, policy, and grid infrastructure.' } },
      { key: 'hero', value: { title: 'Bangladesh Energy Intelligence', subtitle: 'Real-time news, data, and analysis for the power sector', imageUrl: '/images/banner_final.jpg' } },
      {
        key: 'homepage',
        value: {
          carouselMode: 'managed',
          marketPulse: 'LNG spot firming • Solar module prices -2.1% WoW • BDT volatility impacting IPP margins • Coal API2 steady at $102',
          snapshotLabel: 'Live • BPDB • PGCB • SREDA • Petrobangla',
          professionalsCta: {
            label: 'MEMBER ACCESS',
            title: 'Save articles & magazine issues, download data, comment, and unlock in-depth analysis.',
            primaryLabel: 'Open Grid Explorer',
            primaryHref: '/grid-explorer',
            secondaryLabel: 'Member login',
            secondaryHref: '/members/login',
          },
        },
      },
      {
        key: 'ticker',
        value: [
          { id: 'avg-cost', name: 'Avg Gen Cost', value: 6.62, unit: 'Tk/kWh', change: 0.0, prefix: '' },
          { id: 'gas-cost', name: 'Gas Gen Cost', value: 3.45, unit: 'Tk/kWh', change: 0.0, prefix: '' },
          { id: 'coal-cost', name: 'Coal Gen Cost', value: 6.62, unit: 'Tk/kWh', change: 0.0, prefix: '' },
          { id: 'hfo-cost', name: 'HFO Gen Cost', value: 18.06, unit: 'Tk/kWh', change: 0.0, prefix: '' },
          { id: 'import-cost', name: 'Import Gen Cost', value: 6.34, unit: 'Tk/kWh', change: 0.0, prefix: '' },
          { id: 'solar-cost', name: 'Solar Gen Cost', value: 15.77, unit: 'Tk/kWh', change: 0.0, prefix: '' },
          { id: 'diesel-bpc', name: 'Diesel (BPC)', value: 106.75, unit: 'Tk/L', change: 0.0, prefix: '' },
          { id: 'octane-bpc', name: 'Octane (BPC)', value: 126.00, unit: 'Tk/L', change: 0.0, prefix: '' },
          { id: 'gas-prod', name: 'Total Gas Prod', value: 2647.5, unit: 'MMcfd', change: 0.0, prefix: '' },
          { id: 'renewables-cap', name: 'Renewables Cap', value: 1804.8, unit: 'MW', change: 0.0, prefix: '' },
        ],
      },
      {
        key: 'snapshot',
        value: [
          { label: 'Current Demand', value: 16741, unit: 'MW', icon: 'Activity', color: '#ef4444' },
          { label: 'Peak Generation', value: 16181, unit: 'MW', icon: 'Zap', color: '#3b82f6' },
          { label: 'Peak Today', value: 16741, unit: 'MW', icon: 'TrendingUp', color: '#3b82f6' },
          { label: 'Daily Generation', value: 354.9, unit: 'GWh', isDecimal: true, icon: 'TrendingUp', color: '#3b82f6' },
          { label: 'Load Shedding', value: 0, unit: 'MW', icon: 'Activity', color: '#ef4444' },
          { label: 'Energy Unserved', value: 2.14, unit: 'GWh', isDecimal: true, icon: 'Gauge', color: '#ef4444' },
          { label: 'Fuel Cost', value: 6.5, unit: 'Tk/kWh', isDecimal: true, icon: 'Gauge', color: '#f59e0b' },
          { label: 'Gas Supply', value: 2610, unit: 'MMcfd', icon: 'Flame', color: '#8b5cf6' },
          { label: 'Coal Generation', value: 129.2, unit: 'GWh', isDecimal: true, icon: 'Flame', color: '#8b5cf6' },
          { label: 'Grid Import', value: 2570, unit: 'MW', icon: 'Cable', color: '#06b6d4' },
        ],
      },
      {
        key: 'snapshotDate',
        value: '2026-06-24',
      },
      {
        key: 'interviews',
        value: [
          {
            id: 'fb-express-talk-energy-crisis',
            title: 'বর্তমান জ্বালানী সংকট ও উত্তরনের উপায়',
            guest: 'অধ্যাপক আনু মুহাম্মদ',
            role: 'অর্থনীতি ও জালানী বিশেষজ্ঞ',
            programme: 'এক্সপ্রেস টক',
            duration: '—',
            date: '',
            thumbnail: '/images/interviews/express-talk-energy-crisis.jpg',
            youtubeId: '',
            excerpt: 'উপস্থাপনা- ফরিদ উদ্দিন আহমেদ · সৌজন্যে- নিউজ এক্সপ্রেস ও ইএসবি পাওয়ার লাইন',
            provider: 'facebook',
            videoUrl: 'https://www.facebook.com/esbpowerlineofficial/videos/28273693645615960',
          },
          {
            id: 'yt-P2_wGjesKQ',
            title: 'সক্ষমতা আছে, উৎপাদন নেই—বাড়ছে লোকসান ড  এনামুল হক',
            guest: 'ESB Power Line',
            role: 'YouTube',
            duration: '—',
            date: 'Sep 14',
            thumbnail: '/images/interviews/youtube-2026-09-14.jpg',
            youtubeId: '-P2_wGjesKQ',
            excerpt: '',
          },
          {
            id: 'yt-0PpigU6MgLk',
            title: 'সিপিডির আলোচনা সভায় শিল্পপতিদের গ্যাসও বিদ্যুৎ নিয়ে আলোচনা',
            guest: 'ESB Power Line',
            role: 'YouTube Short',
            duration: '—',
            date: 'Sep 13',
            thumbnail: '/images/interviews/youtube-2026-09-13-short.jpg',
            youtubeId: '0PpigU6MgLk',
            excerpt: '',
          },
        ],
      },
      {
        key: 'gridMix',
        value: [
          { name: 'Gas (CCGT + GT)', value: 52, mw: 14780 },
          { name: 'Coal', value: 18, mw: 5110 },
          { name: 'HFO / Diesel', value: 12, mw: 3410 },
          { name: 'Hydro', value: 2, mw: 570 },
          { name: 'Solar + Wind', value: 5, mw: 1420 },
          { name: 'Imports', value: 8, mw: 2270 },
          { name: 'Nuclear (Rooppur-1)', value: 3, mw: 850 },
        ],
      },
      {
        key: 'gridLines',
        value: [
          // Load factors removed: the 74/82/90% figures had no source — no
          // publication reports per-line loading, so none is seeded or shown.
          { name: '400 kV Patuakhali–Gopalganj', status: 'Commissioned', capacity: '1800 MW', owner: 'PGCB' },
          { name: '400 kV Rooppur–Baghabari', status: 'Under Construction', capacity: '2400 MW', owner: 'PGCB' },
          { name: '230 kV Barisal–Khulna', status: 'Commissioned', capacity: '650 MW', owner: 'PGCB' },
          { name: '400 kV Bheramara HVDC (India)', status: 'Operational', capacity: '1000 MW', owner: 'PGCB/POWERGRID' },
        ],
      },
      {
        key: 'gridProjects',
        value: [
          { name: 'SREDA 1800 MW Solar+Wind', status: 'Tender', mw: '1800', date: 'Q3 2026' },
          { name: 'Matarbari Phase-2 Coal', status: 'Construction', mw: '1200', date: '2027' },
          { name: 'Payra 1320 MW Expansion', status: 'Planned', mw: '1320', date: '2028' },
          { name: 'BREB 500k SHS + Mini-grid', status: 'Ongoing', mw: '—', date: '2026-27' },
        ],
      },
      {
        key: 'coverage',
        value: DEFAULT_COVERAGE_SLOTS,
      },
    ],
  });
  console.log('✓ Site settings seeded');

  // Newsletter + a log
  await prisma.newsletterSub.create({ data: { email: 'industry@power.com.bd' } });
  await prisma.auditLog.create({ data: { type: 'system', message: 'Database seeded with realistic Bangladesh power sector content', timestamp: new Date() } });

  console.log('\n✅ Seed complete. Demo accounts (use SEED_DEMO_PASSWORD from .env.local):');
  console.log('  admin@esbpowerline.com  (SUPER_ADMIN)');
  console.log(`  ${EDITOR_EMAIL}  (EDITOR)`);
  console.log('  member@esbpowerline.com  (SUBSCRIBER)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

