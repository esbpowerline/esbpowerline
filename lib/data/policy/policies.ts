import { Scale, Map, ScrollText, Landmark } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { lifelineHistoryFact } from '@/lib/tariff/facts';

/**
 * Energy Policy & Regulatory Framework — curated directory of the acts,
 * policies, master plans and regulations that officially govern Bangladesh's
 * power & energy sector.
 *
 * Content is curated on-site (grid-explorer model): each entry carries a
 * plain-language brief plus a link to the official source document so readers
 * can verify. This module is the single source of truth for the homepage
 * sidebar widget, the /energy-policy library, and each /energy-policy/[slug]
 * detail page. Structured so it can later be migrated into the CMS.
 */

export type PolicyStatus = 'In force' | 'Draft' | 'Repealed' | 'Superseded';
export type PolicyGroupKey = 'acts' | 'plans' | 'regulations' | 'regulators';
export type PolicyTint = 'sky' | 'emerald' | 'amber' | 'violet';

export type PolicyGroup = {
  key: PolicyGroupKey;
  title: string;
  blurb: string;
  icon: LucideIcon;
  tint: PolicyTint;
};

/** A verified figure from the official document or an authoritative publisher. */
export type PolicyDataPoint = {
  label: string;
  value: string;
  /** When the figure was true / which version it comes from. */
  asOf?: string;
  source: { label: string; url: string };
};

export type Policy = {
  slug: string;
  title: string;
  short: string;
  group: PolicyGroupKey;
  authority: string;
  year: string;
  status: PolicyStatus;
  /** Shown in the curated homepage sidebar subset. */
  featured?: boolean;
  source: { label: string; url: string; verified: boolean };
  brief: {
    overview: string;
    keyPoints: string[];
    timeline?: { date: string; event: string }[];
  };
  /** Official figures rendered as stat tiles on the detail page, each with its own citation. */
  dataPoints?: PolicyDataPoint[];
  /** Optional caveat surfaced prominently (e.g. replacement under preparation). */
  note?: string;
};

/**
 * The first ESB surface to read a tariff figure from the canonical rule set
 * instead of from a hand-typed string.
 *
 * EVIDENCE (a hashed BERC order on W:) -> VERSIONED RULE (lib/tariff/rules)
 * -> RESOLUTION (resolveApplicableTariff) -> THIS PAGE. Nothing between the
 * order and the reader is retyped, so when the rule set is corrected this page
 * corrects with it, and it can no longer drift out of agreement with the
 * engine the way the string it replaced did.
 *
 * `lifelineHistoryFact` resolves the governing rule and the rule as issued on
 * 3 June, and reports both -- the fact worth publishing is not "Tk 4.63", it is
 * that the rate was raised and restored inside a day.
 */
const LIFELINE_FACT: PolicyDataPoint = (() => {
  const f = lifelineHistoryFact('2026-06');
  // The rule set is validated at import, so this is unreachable; a page must
  // still never render `undefined` as a tariff.
  if (!f) {
    return {
      label: 'Residential lifeline rate',
      value: 'No rule held for this period.',
      asOf: 'Jun 2026',
      source: { label: 'BERC', url: 'https://berc.org.bd/' },
    };
  }
  return { label: f.label, value: f.value, asOf: 'Jun 2026', source: f.source };
})();

export const POLICY_GROUPS: readonly PolicyGroup[] = [
  { key: 'acts', title: 'Acts & Laws', blurb: 'Primary legislation passed by Parliament that governs the sector.', icon: Scale, tint: 'sky' },
  { key: 'plans', title: 'Policies & Master Plans', blurb: 'National policies, master plans and roadmaps setting sector direction.', icon: Map, tint: 'emerald' },
  { key: 'regulations', title: 'Regulations & Rules', blurb: 'Subsidiary regulations, codes and guidelines under the primary laws.', icon: ScrollText, tint: 'amber' },
  { key: 'regulators', title: 'Tariff Orders & Regulators', blurb: 'The statutory regulators and where their tariff orders are published.', icon: Landmark, tint: 'violet' },
] as const;

export const POLICIES: Policy[] = [
  // ── Acts & Laws ───────────────────────────────────────────────────────────
  {
    slug: 'electricity-act-2018',
    title: 'The Electricity Act, 2018',
    short: 'Electricity Act 2018',
    group: 'acts',
    authority: 'Power Division, MPEMR',
    year: '2018',
    status: 'In force',
    featured: true,
    source: { label: 'bdlaws.minlaw.gov.bd', url: 'http://bdlaws.minlaw.gov.bd/act-details-1228.html', verified: true },
    brief: {
      overview:
        'The primary law governing electricity generation, transmission, distribution and supply in Bangladesh. Enacted in 2018, it repealed and re-enacted the colonial-era Electricity Act, 1910, modernising licensing, safety and enforcement for the sector.',
      keyPoints: [
        'Repealed the Electricity Act, 1910, which had governed the sector for over a century.',
        'Frames licensing and obligations for generation, transmission, distribution and supply.',
        'Modernises provisions on electricity theft, safety, offences and penalties.',
      ],
    },
    dataPoints: [
      { label: 'Act number & enactment', value: 'Act No. VII of 2018, enacted 12 February 2018', asOf: 'Feb 2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4092' } },
      { label: 'Repealed law', value: 'Repealed and re-enacted the Electricity Act, 1910 (Act No. IX of 1910)', asOf: '2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4092' } },
      { label: 'Theft penalty (domestic)', value: 'Up to 3 years imprisonment, or a fine of twice the electricity value or Tk 50,000, or both', asOf: '2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4092' } },
      { label: 'Theft penalty (commercial/industrial)', value: 'Up to 3 years imprisonment, or a fine of twice the electricity value or Tk 5 lakh, or both', asOf: '2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4092' } },
      { label: 'Licensing regime', value: 'Generation, transmission, distribution and supply licences issued by BERC under the BERC Act 2003', asOf: '2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4092' } },
    ],
  },
  {
    slug: 'berc-act-2003',
    title: 'Bangladesh Energy Regulatory Commission Act, 2003',
    short: 'BERC Act 2003',
    group: 'acts',
    authority: 'MPEMR',
    year: '2003',
    status: 'In force',
    featured: true,
    source: { label: 'bdlaws.minlaw.gov.bd', url: 'http://bdlaws.minlaw.gov.bd/act-902.html', verified: true },
    brief: {
      overview:
        'The act that establishes the Bangladesh Energy Regulatory Commission (BERC) as the independent regulator for electricity, gas and petroleum. It gives BERC authority to license operators and set tariffs through a transparent public-hearing process.',
      keyPoints: [
        'Creates BERC as an independent statutory regulator for energy and power.',
        'Grants tariff-setting authority through mandatory public hearings.',
        'A 2022–2023 amendment (Section 34(k)) let the government fix tariffs by gazette without a hearing — repealed in August 2024, restoring BERC’s public-hearing authority.',
      ],
      timeline: [
        { date: '2003', event: 'BERC Act enacted; commission established.' },
        { date: '2023', event: 'Section 34(k) allows executive tariff-setting by gazette.' },
        { date: 'Aug 2024', event: 'Section 34(k) repealed; public-hearing tariff authority restored.' },
      ],
    },
    dataPoints: [
      { label: 'Act number', value: 'Act No. 13 of 2003; commission effective from 2004', asOf: '2003', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/212' } },
      { label: 'Commission composition', value: 'A Chairman and 4 Members (Section 6(1))', asOf: '2003', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/212' } },
      { label: 'Tariff process rules', value: 'Decision within 90 days of hearing (s.34(6)); revision at most once per fiscal year absent significant cost changes (s.34(5))', asOf: '2003', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/212' } },
      { label: 'Section 34(ka) introduced', value: 'Ordinance 1 Dec 2022; Amendment Bill passed 29 Jan 2023 — executive price-setting without hearings', asOf: 'Jan 2023', source: { label: 'BSS', url: 'https://www.bssnews.net/news/107832' } },
      { label: 'Section 34(ka) repealed', value: 'BERC (Amendment) Ordinance issued 27 August 2024, restoring public-hearing tariff setting', asOf: 'Aug 2024', source: { label: 'The Business Standard', url: 'https://www.tbsnews.net/bangladesh/energy/ordinance-issued-revoking-govts-ability-raise-power-energy-prices-bypassing-berc' } },
    ],
  },
  {
    slug: 'sreda-act-2012',
    title: 'Sustainable & Renewable Energy Development Authority Act, 2012',
    short: 'SREDA Act 2012',
    group: 'acts',
    authority: 'Power Division, MPEMR',
    year: '2012',
    status: 'In force',
    featured: true,
    source: { label: 'powerdivision.gov.bd', url: 'https://powerdivision.portal.gov.bd/sites/default/files/files/powerdivision.portal.gov.bd/page/18d2690b_f02f_4c35_8f90_79b70d333242/acts_6_sustainable_and_renewable_energy_development_authority_act_english.pdf', verified: true },
    brief: {
      overview:
        'Creates the Sustainable & Renewable Energy Development Authority (SREDA) as the nodal body for renewable energy and energy efficiency. SREDA became operational in 2014 and coordinates the country’s clean-energy and conservation programmes.',
      keyPoints: [
        'Establishes SREDA as the national authority for renewables and energy efficiency.',
        'Mandates promotion, coordination and financing of clean-energy programmes.',
        'Underpins later instruments such as the Net Metering Guidelines and the EE&C Master Plan.',
      ],
    },
    dataPoints: [
      { label: 'Act number & assent', value: 'Act No. 48 of 2012, assented 10 December 2012', asOf: 'Dec 2012', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/216' } },
      { label: 'SREDA operational', value: 'Functional from 2014; authentic English text of the Act gazetted 28 April 2014', asOf: '2014', source: { label: 'IEA Policies Database', url: 'https://www.iea.org/policies/6127-the-sustainable-and-renewable-energy-development-authority-act-2012-creation-of-the-sustainable-and-renewable-energy-development-authority-sreda' } },
      { label: 'Board composition', value: 'Chairman plus up to 16 members — 5 full-time, 6 ex-officio ministry representatives, up to 5 honorary', asOf: '2012', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/216' } },
    ],
  },
  {
    slug: 'bangladesh-petroleum-act-1974',
    title: 'The Bangladesh Petroleum Act, 1974',
    short: 'Bangladesh Petroleum Act 1974',
    group: 'acts',
    authority: 'Energy & Mineral Resources Division (EMRD)',
    year: '1974',
    status: 'In force',
    featured: true,
    source: { label: 'bdlaws.minlaw.gov.bd', url: 'http://bdlaws.minlaw.gov.bd/act-details-480.html', verified: true },
    brief: {
      overview:
        'The core upstream petroleum law, vesting in the government the exclusive right to explore for and produce petroleum. It is the legal basis for Production Sharing Contracts (PSCs) with international oil companies.',
      keyPoints: [
        'Reserves exclusive petroleum exploration & production rights to the government.',
        'Provides the framework for Production Sharing Contracts (PSCs).',
        'Distinct from the downstream Petroleum Act 2016 and the BPC Act 2016, which remain separate laws — 2016 did not replace the 1974 Act.',
      ],
    },
    dataPoints: [
      { label: 'Act number & entry into force', value: 'Act No. LXIX of 1974, in force from 22 August 1974', asOf: 'Aug 1974', source: { label: 'ECOLEX (FAO/UNEP/IUCN)', url: 'https://www.ecolex.org/details/legislation/bangladesh-petroleum-act-1974-act-no-lxix-of-1974-lex-faoc066865/' } },
      { label: 'Rights vested', value: 'Exclusive government right to explore, develop, produce, refine and market petroleum across territory, shelf and economic zone', asOf: '1974', source: { label: 'ECOLEX (FAO/UNEP/IUCN)', url: 'https://www.ecolex.org/details/legislation/bangladesh-petroleum-act-1974-act-no-lxix-of-1974-lex-faoc066865/' } },
      { label: 'PSC basis', value: 'Legal framework for Production Sharing Contracts, exercised through Petrobangla by delegation', asOf: '1974', source: { label: 'Banglapedia', url: 'https://en.banglapedia.org/index.php/Production_Sharing_Contract' } },
      { label: '2023 offshore framework', value: 'Offshore Model PSC 2023 approved 26 July 2023 — gas price pegged to 10% of Brent, export option opened', asOf: 'Jul 2023', source: { label: 'Prothom Alo', url: 'https://en.prothomalo.com/bangladesh/b3iyof7ayx' } },
    ],
  },
  {
    slug: 'atomic-energy-regulatory-act-2012',
    title: 'The Bangladesh Atomic Energy Regulatory Act, 2012',
    short: 'Atomic Energy Regulatory Act 2012',
    group: 'acts',
    authority: 'Ministry of Science & Technology',
    year: '2012',
    status: 'In force',
    source: { label: 'bdlaws.minlaw.gov.bd', url: 'http://bdlaws.minlaw.gov.bd/act-1096.html', verified: true },
    brief: {
      overview:
        'Establishes the Bangladesh Atomic Energy Regulatory Authority (BAERA), the independent nuclear and radiation-safety regulator. BAERA became operational in 2013 and licenses facilities such as the Rooppur Nuclear Power Plant.',
      keyPoints: [
        'Creates BAERA as the independent nuclear/radiation-safety regulator.',
        'Provides licensing and oversight for nuclear installations and radiation sources.',
        'Key to the regulatory framework for the Rooppur Nuclear Power Plant.',
      ],
    },
    dataPoints: [
      { label: 'Act number & date', value: 'Act No. 19 of 2012, dated 19 June 2012; authentic English text gazetted 30 August 2017', asOf: 'Jun 2012', source: { label: 'Bangladesh Gazette (dpp.gov.bd)', url: 'https://www.dpp.gov.bd/upload_file/gazettes/22943_94609.pdf' } },
      { label: 'BAERA formed', value: '12 February 2013, as the independent nuclear and radiation-safety regulator', asOf: 'Feb 2013', source: { label: 'IAEA (CNS National Report)', url: 'https://www.iaea.org/sites/default/files/24/02/cns_bangladesh_national_report_2022.pdf' } },
      { label: 'Rooppur licensing under the Act', value: 'Siting licence 21 Jun 2016; Unit 1 design & construction licence 2 Nov 2017; Unit 2 licence 8 Jul 2018', asOf: 'Jul 2018', source: { label: 'IAEA (CNS National Report)', url: 'https://www.iaea.org/sites/default/files/24/02/cns_bangladesh_national_report_2022.pdf' } },
    ],
  },
  {
    slug: 'nuclear-power-plant-act-2015',
    title: 'Nuclear Power Plant Act, 2015',
    short: 'Nuclear Power Plant Act 2015',
    group: 'acts',
    authority: 'Ministry of Science & Technology',
    year: '2015',
    status: 'In force',
    source: { label: 'Official source (verify on publish)', url: 'https://bdlaws.minlaw.gov.bd/', verified: false },
    brief: {
      overview:
        'Provides the legal framework for building and operating nuclear power plants in Bangladesh, and established Nuclear Power Plant Company Bangladesh Ltd (NPCBL) to develop and run the Rooppur project.',
      keyPoints: [
        'Establishes NPCBL to build and operate nuclear power plants.',
        'Sets the statutory basis for the Rooppur Nuclear Power Plant.',
        'Works alongside the Atomic Energy Regulatory Act 2012 (BAERA oversight).',
      ],
    },
    dataPoints: [
      { label: 'Act number & enactment', value: 'Act No. 19 of 2015, enacted 16 September 2015', asOf: 'Sep 2015', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4013' } },
      { label: 'Company established', value: 'Nuclear Power Plant Company Bangladesh Ltd (NPCBL), the operating organisation for Rooppur; BAEC is the Owner Organization (s.4(3))', asOf: '2015', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4013' } },
      { label: 'Rooppur capacity', value: '2 × VVER-1200 reactors, 1,200 MWe each (2,400 MW total)', asOf: '2026', source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rooppur_Nuclear_Power_Plant' } },
      { label: 'Project financing', value: '≈USD 12.65 billion, with a Russian state export credit covering ≈USD 11.38 billion (~90%)', asOf: '2026', source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rooppur_Nuclear_Power_Plant' } },
      { label: 'Construction start', value: 'Unit 1 first concrete 30 Nov 2017; Unit 2 on 14 Jul 2018', asOf: 'Jul 2018', source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Rooppur_Nuclear_Power_Plant' } },
    ],
    note: 'Exact official bdlaws deep-link to be confirmed before relying on the source URL.',
  },
  {
    slug: 'quick-enhancement-act-2010',
    title: 'The Quick Enhancement of Electricity and Energy Supply (Special Provisions) Act, 2010',
    short: 'Speedy Power & Energy Supply Act 2010',
    group: 'acts',
    authority: 'Power Division, MPEMR',
    year: '2010',
    status: 'Repealed',
    featured: true,
    source: { label: 'Repeal reported (Nov 2024)', url: 'https://thefinancialexpress.com.bd/national/electricity-and-energy-special-provisions-act-repealed', verified: true },
    brief: {
      overview:
        'A special law that allowed no-tender (“unsolicited”) power and energy deals to be signed quickly, with immunity from legal challenge. It was widely used to fast-track power projects — and widely criticised — before being repealed by the interim government in 2024.',
      keyPoints: [
        'Permitted no-tender power/energy contracts and shielded them from legal challenge.',
        'The High Court declared Sections 6(2) and 9 illegal on 14 Nov 2024.',
        'Repealed by ordinance signed on 28 Nov 2024; contracts already signed under it remain valid.',
      ],
      timeline: [
        { date: '2010', event: 'Act passed to fast-track power supply.' },
        { date: '14 Nov 2024', event: 'High Court strikes down Sections 6(2) and 9.' },
        { date: '28 Nov 2024', event: 'Repeal ordinance signed by the President.' },
      ],
    },
    dataPoints: [
      { label: 'Enacted', value: 'October 2010, initially valid for 2 years', asOf: '2010', source: { label: 'Gas Outlook', url: 'https://gasoutlook.com/analysis/bangladesh-interim-government-makes-sweeping-energy-sector-changes/' } },
      { label: 'Extensions', value: 'Extended repeatedly — most recently in 2021, for five years through 2026', asOf: '2021', source: { label: 'Gas Outlook', url: 'https://gasoutlook.com/analysis/bangladesh-interim-government-makes-sweeping-energy-sector-changes/' } },
      { label: 'Projects taken up under the Act', value: '≈96 power & energy projects implemented or pipelined; interim government suspended its use 19 Aug 2024', asOf: 'Aug 2024', source: { label: 'Gas Outlook', url: 'https://gasoutlook.com/analysis/bangladesh-interim-government-makes-sweeping-energy-sector-changes/' } },
      { label: 'High Court ruling', value: 'Sections 6(2) and 9 (indemnity) declared illegal', asOf: '14 Nov 2024', source: { label: 'Daily Morning Voice', url: 'https://dailymorningvoice.com/38413/quick-power-supply-act-repealed-ordinance-issued/' } },
      { label: 'Repeal', value: 'Repeal ordinance issued 28 Nov 2024; contracts already signed remain valid', asOf: '28 Nov 2024', source: { label: 'Daily Morning Voice', url: 'https://dailymorningvoice.com/38413/quick-power-supply-act-repealed-ordinance-issued/' } },
    ],
  },
  {
    slug: 'electricity-act-1910',
    title: 'The Electricity Act, 1910',
    short: 'Electricity Act 1910',
    group: 'acts',
    authority: 'Colonial-era legislation',
    year: '1910',
    status: 'Repealed',
    source: { label: 'bdlaws.minlaw.gov.bd', url: 'http://bdlaws.minlaw.gov.bd/act-93.html', verified: true },
    brief: {
      overview:
        'The colonial-era statute that governed electricity supply in the territory for over a century, until it was repealed and replaced by the Electricity Act, 2018. Retained here for historical and reference completeness.',
      keyPoints: [
        'Governed electricity supply from 1910 until 2018.',
        'Repealed by the Electricity Act, 2018.',
      ],
    },
    dataPoints: [
      { label: 'Act number', value: 'Act No. IX of 1910', asOf: '1910', source: { label: 'bdlaws.minlaw.gov.bd', url: 'http://bdlaws.minlaw.gov.bd/act-93.html' } },
      { label: 'Repealed', value: '12 February 2018, by the Electricity Act 2018 (Act No. VII of 2018)', asOf: 'Feb 2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4092' } },
      { label: 'Duration in force', value: '≈108 years, spanning British, Pakistani and Bangladeshi administrations', asOf: '2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/4092' } },
      { label: 'Line-materials theft penalty (as amended)', value: 'Section 40A: 3–5 years imprisonment plus fine up to Tk 25,000 for theft of poles, conductors or transformers', asOf: '2018', source: { label: 'bdlaws.minlaw.gov.bd', url: 'http://bdlaws.minlaw.gov.bd/act-93/section-24054.html' } },
    ],
  },

  // ── Policies & Master Plans ───────────────────────────────────────────────
  {
    slug: 'iepmp-2023',
    title: 'Integrated Energy and Power Master Plan (IEPMP) 2023',
    short: 'IEPMP 2023',
    group: 'plans',
    authority: 'Power Division, MPEMR',
    year: '2023',
    status: 'In force',
    featured: true,
    source: { label: 'powerdivision.gov.bd', url: 'https://powerdivision.portal.gov.bd/sites/default/files/files/powerdivision.portal.gov.bd/npfblock/IEPMP_Report_2023.pdf', verified: true },
    brief: {
      overview:
        'The current integrated master plan for energy and power to 2050, built around an “S+3E” concept (energy security, economy, efficiency and environment). Unveiled in late 2023, it effectively supersedes the Power System Master Plan 2016.',
      keyPoints: [
        'Integrates energy and power planning through 2050.',
        'Effectively supersedes PSMP 2016 as the guiding master plan.',
        'Prepared with technical support from IEEJ / JICA.',
      ],
    },
    dataPoints: [
      { label: 'Published', value: '27 November 2023, developed with JICA / IEEJ (Japan) support', asOf: 'Nov 2023', source: { label: 'Centre for Policy Dialogue', url: 'https://cpd.org.bd/bangladeshs-energy-backtrack/' } },
      { label: 'Clean energy target', value: '40% of installed capacity by 2041 (18% by 2030) — conventional renewables only 8.8% (5,157 MW) within it', asOf: '2041 target', source: { label: 'Centre for Policy Dialogue', url: 'https://cpd.org.bd/bangladeshs-energy-backtrack/' } },
      { label: 'Demand projection', value: 'Power demand ×2.26 by 2030, ×4.5 by 2041, ×7.38 by 2050', asOf: '2023', source: { label: 'Centre for Policy Dialogue', url: 'https://cpd.org.bd/2023-integrated-energy-power-master-plan-the-numbers-dont-add-up/' } },
      { label: '2050 capacity plan', value: '111,000 MW installed by 2050 — incl. 20,000 MW wind, 11,200 MW hydrogen, 5,000 MW ammonia', asOf: '2050 target', source: { label: 'Energy & Power Magazine', url: 'https://ep-bd.com/view/details/article/OTY3NA==/title?q=IPEMP+2023:+Ambitious+And+Challenging' } },
      { label: 'Investment need', value: '≈USD 300 billion in power-sector investment by 2050', asOf: '2050 horizon', source: { label: 'Energy & Power Magazine', url: 'https://ep-bd.com/view/details/article/OTY3NA==/title?q=IPEMP+2023:+Ambitious+And+Challenging' } },
      { label: 'Co-firing pathway', value: 'Ammonia co-firing with coal from 2035 (20% → 50% by 2040); hydrogen co-firing with gas from 2037', asOf: '2023', source: { label: 'Centre for Policy Dialogue', url: 'https://cpd.org.bd/bangladeshs-energy-backtrack/' } },
    ],
    note: 'The interim government has begun preparing a successor Energy & Power Sector Master Plan (EPSMP) 2026–2050 — treat as under review.',
  },
  {
    slug: 'psmp-2016',
    title: 'Power System Master Plan (PSMP) 2016',
    short: 'PSMP 2016',
    group: 'plans',
    authority: 'Power Division, MPEMR',
    year: '2016',
    status: 'Superseded',
    featured: true,
    source: { label: 'powerdivision.gov.bd', url: 'https://powerdivision.gov.bd/site/page/f68eb32d-cc0b-483e-b047-13eb81da6820/Power-System-Master-Plan-2016', verified: true },
    brief: {
      overview:
        'The 2016 master plan with a planning horizon to 2041, targeting roughly 60,000 MW of capacity with a heavy coal and gas mix. Largely superseded by the IEPMP 2023 but still widely referenced.',
      keyPoints: [
        'Planning horizon to 2041 with a ~60,000 MW capacity target.',
        'Emphasised coal and imported LNG in the generation mix.',
        'Superseded by IEPMP 2023.',
      ],
    },
    dataPoints: [
      { label: '2041 capacity target', value: '≈60,000 MW of generation capacity by 2041', asOf: '2016', source: { label: 'Energy & Power Magazine', url: 'https://ep-bd.com/view/details/article/NzI0NA==/title?q=revisiting+psmp+amid+volatile+global+energy+market' } },
      { label: 'Fuel-mix target', value: '35% coal + 35% gas/LNG + 30% liquid fuel, nuclear, renewables and imports (coal cut from 50% in PSMP 2010)', asOf: '2016', source: { label: 'Energy & Power Magazine', url: 'https://ep-bd.com/view/details/article/NzI0NA==/title?q=revisiting+psmp+amid+volatile+global+energy+market' } },
      { label: 'Renewables & imports', value: '3,864 MW domestic renewables and 9,000 MW cross-border imports planned by 2041; six nuclear units phased to 2040-41', asOf: '2016', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3219' } },
      { label: 'Prepared by', value: 'JICA-sponsored, with Tokyo Electric Power Services Co. (TEPCO group); adopted 2016', asOf: '2016', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3219' } },
      { label: 'Superseded', value: 'Replaced as the guiding plan by the IEPMP, published 27 Nov 2023', asOf: 'Nov 2023', source: { label: 'Centre for Policy Dialogue', url: 'https://cpd.org.bd/bangladeshs-energy-backtrack/' } },
    ],
  },
  {
    slug: 'national-energy-policy',
    title: 'National Energy Policy (1996, updated 2004)',
    short: 'National Energy Policy',
    group: 'plans',
    authority: 'Energy & Mineral Resources Division (EMRD)',
    year: '1996 / 2004',
    status: 'In force',
    featured: true,
    source: { label: 'emrd.gov.bd', url: 'https://emrd.portal.gov.bd/sites/default/files/files/emrd.portal.gov.bd/law/b3868d02_274c_4f1a_bd2c_d81c5b4d7c32/NEP_2004_fulldoc.pdf', verified: true },
    brief: {
      overview:
        'The standing national policy framework for the energy sector, first adopted in 1996 and revised in 2004. It sets broad objectives for exploration, supply, pricing and sustainable use of the country’s energy resources.',
      keyPoints: [
        'First adopted 1996; expanded/revised edition issued 2004.',
        'Sets national objectives across exploration, supply, pricing and conservation.',
        'Remains the standing policy; comprehensive replacements have been discussed but not gazetted.',
      ],
    },
    dataPoints: [
      { label: 'First adopted', value: '1996, by the Ministry of Power, Energy and Mineral Resources', asOf: '1996', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3184' } },
      { label: 'Updated', value: 'Revised 2004 (published as the 2005 edition) for changed domestic and global circumstances', asOf: '2004', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3184' } },
      { label: 'Electrification goal', value: 'Whole-country electrification by 2020 set as a national objective', asOf: '2004', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3184' } },
      { label: 'Scope', value: 'Ten objectives spanning coal, gas, power and renewables — sustainable growth and optimal use of indigenous resources', asOf: '2004', source: { label: 'Energy & Mineral Resources Division', url: 'https://emrd.portal.gov.bd/sites/default/files/files/emrd.portal.gov.bd/law/b3868d02_274c_4f1a_bd2c_d81c5b4d7c32/NEP_2004_fulldoc.pdf' } },
    ],
  },
  {
    slug: 'renewable-energy-policy-2008',
    title: 'Renewable Energy Policy of Bangladesh, 2008',
    short: 'Renewable Energy Policy 2008',
    group: 'plans',
    authority: 'Power Division / SREDA',
    year: '2008',
    status: 'In force',
    featured: true,
    source: { label: 'sreda.gov.bd', url: 'https://sreda.gov.bd/', verified: false },
    brief: {
      overview:
        'The operative renewable-energy policy, setting the direction for solar, wind and other clean sources and the incentives that support them. A revised policy is in preparation to raise ambition.',
      keyPoints: [
        'Frames national support and targets for renewable energy.',
        'Basis for SREDA’s renewable programmes and incentives.',
        'A draft Renewable Energy Policy 2025 (20% RE by 2030 / 30% by 2041) is under finalisation.',
      ],
    },
    dataPoints: [
      { label: 'Effective', value: '18 December 2008; provided for creating SEDA, forerunner of SREDA', asOf: 'Dec 2008', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/208' } },
      { label: 'Original targets', value: '5% of power demand from renewables by 2015; 10% by 2020', asOf: '2008', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/208' } },
      { label: 'Outcome vs targets', value: 'Both missed — ≈1,183 MW installed (≈4.5% of capacity, ~3% of generation) by June 2023', asOf: 'Jun 2023', source: { label: 'United Nations in Bangladesh', url: 'https://bangladesh.un.org/en/260959-bangladesh%E2%80%99s-energy-transition-journey-so-far' } },
      { label: 'Current RE share', value: '≈5.6% of installed capacity (roughly 1.5–1.6 GW)', asOf: '2025', source: { label: 'Centre for Policy Dialogue', url: 'https://cpd.org.bd/resources/2025/05/Renewable-Energy-Policy-Draft-2025.pdf' } },
      { label: 'Draft 2025 replacement targets', value: '20% of electricity (6,145 MW) from RE by 2030; 30% (17,470 MW) by 2041', asOf: 'Apr 2025', source: { label: 'Centre for Policy Dialogue', url: 'https://cpd.org.bd/resources/2025/05/Renewable-Energy-Policy-Draft-2025.pdf' } },
      { label: 'Incentives', value: '2008: 15% VAT exemption + 5-year tax holiday; draft 2025 extends to 10 years full + 5 partial', asOf: '2025', source: { label: 'Centre for Policy Dialogue', url: 'https://cpd.org.bd/resources/2025/05/Renewable-Energy-Policy-Draft-2025.pdf' } },
    ],
    note: 'Being replaced by a draft Renewable Energy Policy 2025 — the 2008 text remains operative until the new policy is gazetted.',
  },
  {
    slug: 'eec-master-plan-2030',
    title: 'Energy Efficiency and Conservation Master Plan up to 2030 (EECMP)',
    short: 'EE&C Master Plan 2030',
    group: 'plans',
    authority: 'SREDA, Power Division',
    year: '2015',
    status: 'In force',
    source: { label: 'SREDA (policy database mirror)', url: 'https://policy.asiapacificenergy.org/sites/default/files/EEC_Master_Plan_SREDA_2.pdf', verified: true },
    brief: {
      overview:
        'The national plan for improving energy efficiency and conservation, adopted in 2015. It targets a 20% improvement in energy intensity by FY2029–30 relative to FY2013–14 through efficiency programmes across sectors.',
      keyPoints: [
        'Targets 20% improvement in energy intensity by FY2029–30.',
        'Covers efficiency in industry, buildings, appliances and utilities.',
        'Implemented by SREDA under the SREDA Act 2012.',
      ],
    },
    dataPoints: [
      { label: 'Published', value: 'March 2015, by SREDA / Power Division with JICA technical support', asOf: 'Mar 2015', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/2297' } },
      { label: 'Energy-intensity targets', value: '15% reduction by 2021 and 20% by 2030 in primary energy per GDP, vs the 2013 baseline', asOf: '2015', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/2297' } },
      { label: 'Demand impact', value: 'EE&C scenario cuts 2030 electricity demand by 8 GW vs business-as-usual', asOf: '2030 target', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/2297' } },
      { label: 'Projected savings', value: '≈95 million toe of energy and ≈BDT 2.3 trillion in avoided fuel imports over 2015–2030', asOf: '2015', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/2297' } },
      { label: 'Flagship programmes', value: 'Energy Management, EE Labeling and EE Buildings — implemented by SREDA', asOf: '2015', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/2297' } },
    ],
  },
  {
    slug: 'gas-sector-master-plan-2017',
    title: 'Gas Sector Master Plan 2017',
    short: 'Gas Sector Master Plan 2017',
    group: 'plans',
    authority: 'Petrobangla / EMRD',
    year: '2017',
    status: 'In force',
    source: { label: 'Policy database record', url: 'https://policy.asiapacificenergy.org/node/3509', verified: true },
    brief: {
      overview:
        'A master plan for the gas sector handed to Petrobangla in 2017, projecting demand, supply and rising dependence on imported LNG through 2041.',
      keyPoints: [
        'Projects gas demand/supply balance to 2041.',
        'Anticipates growing reliance on imported LNG.',
        'Guides Petrobangla’s upstream and infrastructure planning.',
      ],
    },
    dataPoints: [
      { label: 'Prepared by', value: 'Ramboll (Denmark) for Petrobangla and Power Cell; final report 28 February 2018', asOf: 'Feb 2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3509' } },
      { label: 'Planning horizon', value: 'Through 2041 — updating the 2006 gas master plan that ran only to 2025', asOf: '2017', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3509' } },
      { label: 'LNG share of gas demand', value: 'Projected 17% (2018) → 40% (2023) → 50% (2028) → 70% (2041)', asOf: '2017', source: { label: 'Bonik Barta', url: 'https://en.bonikbarta.com/bangladesh/eImo8W1Xv4hcENHN' } },
      { label: 'LNG import volume by 2041', value: '≈30 million tonnes/year needed for industry, power and fertilizer demand', asOf: '2017', source: { label: 'S&P Global Commodity Insights', url: 'https://www.spglobal.com/commodity-insights/en/market-insights/latest-news/natural-gas/082417-bangladesh-to-need-30-million-mtyear-lng-imports-by-2041' } },
      { label: 'Supply gap at drafting', value: '≈1,000 MMcfd (27%) daily gas shortage against ≈2,750 MMcfd consumption', asOf: '2016', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3509' } },
    ],
  },
  {
    slug: 'national-solar-roadmap',
    title: 'National Solar Energy Roadmap, 2021–2041',
    short: 'National Solar Energy Roadmap',
    group: 'plans',
    authority: 'SREDA, MPEMR',
    year: '2021',
    status: 'Draft',
    source: { label: 'ESMAP (RISE) copy', url: 'https://rise.esmap.org/sites/default/files/library/bangladesh/Renewable%20Energy/Bangladesh_National-Solar-Energy-Roadmap.pdf', verified: true },
    brief: {
      overview:
        'A roadmap estimating 20,000–30,000 MW of solar potential by 2041 and mapping the deployment pathways to get there. Circulated as a draft.',
      keyPoints: [
        'Estimates 20,000–30,000 MW solar potential by 2041.',
        'Maps utility-scale, rooftop and other deployment pathways.',
        'Circulated as a draft; a finalised/gazetted version should be confirmed.',
      ],
    },
    dataPoints: [
      { label: 'Scenario targets by 2041', value: '6 GW (business-as-usual), 20 GW (medium) or 30 GW (high deployment) of solar PV', asOf: 'Dec 2020', source: { label: 'Draft Roadmap (SREDA/UNDP, ESMAP mirror)', url: 'https://rise.esmap.org/sites/default/files/library/bangladesh/Renewable%20Energy/Bangladesh_National-Solar-Energy-Roadmap.pdf' } },
      { label: 'Recommended scenario', value: 'High case: 30 GW, making solar ≈50% of projected generation capacity by 2041', asOf: 'Dec 2020', source: { label: 'Draft Roadmap (SREDA/UNDP)', url: 'https://rise.esmap.org/sites/default/files/library/bangladesh/Renewable%20Energy/Bangladesh_National-Solar-Energy-Roadmap.pdf' } },
      { label: 'High-case composition', value: '12,000 MW solar hubs + 12,000 MW rooftop + 2,200 MW IPPs + 2,000 MW utility + 1,200 MW irrigation pumps', asOf: 'Dec 2020', source: { label: 'Draft Roadmap (SREDA/UNDP)', url: 'https://rise.esmap.org/sites/default/files/library/bangladesh/Renewable%20Energy/Bangladesh_National-Solar-Energy-Roadmap.pdf' } },
      { label: 'Submitted', value: '14 December 2020 to SREDA and the UNDP SREPGen project; authored at CER, United International University', asOf: 'Dec 2020', source: { label: 'Draft Roadmap (SREDA/UNDP)', url: 'https://rise.esmap.org/sites/default/files/library/bangladesh/Renewable%20Energy/Bangladesh_National-Solar-Energy-Roadmap.pdf' } },
      { label: 'Storage trigger', value: 'Large-scale storage recommended once grid-tied solar exceeds 10% of installed capacity', asOf: 'Dec 2020', source: { label: 'Draft Roadmap (SREDA/UNDP)', url: 'https://rise.esmap.org/sites/default/files/library/bangladesh/Renewable%20Energy/Bangladesh_National-Solar-Energy-Roadmap.pdf' } },
    ],
    note: 'Circulated as a draft roadmap — confirm whether a finalised version has been adopted.',
  },
  {
    slug: 'bangladesh-ndc',
    title: 'Nationally Determined Contribution (NDC), updated 2021',
    short: 'Bangladesh NDC',
    group: 'plans',
    authority: 'Ministry of Environment, Forest & Climate Change',
    year: '2021',
    status: 'In force',
    featured: true,
    source: { label: 'unfccc.int', url: 'https://unfccc.int/sites/default/files/NDC/2022-06/NDC_submission_20210826revised.pdf', verified: true },
    brief: {
      overview:
        'Bangladesh’s climate pledge submitted to the UNFCCC. The updated 2021 NDC commits to a 6.73% unconditional and 15.12% conditional cut in greenhouse-gas emissions below business-as-usual by 2030, shaping energy-sector decarbonisation.',
      keyPoints: [
        '6.73% unconditional + 15.12% conditional GHG cut below BAU by 2030.',
        'Drives renewable-energy and efficiency ambition in the power sector.',
        'A third NDC (NDC 3.0) with a 2035 target was reportedly submitted in 2025.',
      ],
    },
    dataPoints: [
      { label: 'Unconditional target', value: '−27.56 Mt CO₂e (6.73%) below business-as-usual by 2030', asOf: 'Aug 2021', source: { label: 'UNFCCC (official submission)', url: 'https://unfccc.int/sites/default/files/NDC/2022-06/NDC_submission_20210826revised.pdf' } },
      { label: 'Conditional target', value: 'Further −61.9 Mt CO₂e (15.12%) with international support — combined 89.47 Mt (21.85%)', asOf: 'Aug 2021', source: { label: 'UNFCCC (official submission)', url: 'https://unfccc.int/sites/default/files/NDC/2022-06/NDC_submission_20210826revised.pdf' } },
      { label: 'Base year & BAU', value: 'Base year 2012 (169.05 Mt CO₂e); BAU projected 409.41 Mt in 2030', asOf: 'Aug 2021', source: { label: 'UNFCCC (official submission)', url: 'https://unfccc.int/sites/default/files/NDC/2022-06/NDC_submission_20210826revised.pdf' } },
      { label: 'Energy-sector share of cuts', value: '95.4% of the unconditional and 96.5% of the conditional reduction comes from energy', asOf: 'Aug 2021', source: { label: 'UNFCCC (official submission)', url: 'https://unfccc.int/sites/default/files/NDC/2022-06/NDC_submission_20210826revised.pdf' } },
      { label: 'Submitted to UNFCCC', value: '26 August 2021 (updated NDC, expanding coverage to Energy, IPPU, AFOLU and Waste)', asOf: 'Aug 2021', source: { label: 'ADB Law & Policy Reform Program', url: 'https://lpr.adb.org/resource/updated-nationally-determined-contribution-2021-bangladesh' } },
    ],
    note: 'Bangladesh has not adopted a formal legally-binding net-zero-2050 target — only its NDCs and the aspirational Mujib Climate Prosperity Plan.',
  },

  // ── Regulations & Rules ───────────────────────────────────────────────────
  {
    slug: 'berc-regulations',
    title: 'BERC Tariff, Licensing & Other Regulations',
    short: 'BERC Regulations',
    group: 'regulations',
    authority: 'Bangladesh Energy Regulatory Commission (BERC)',
    year: '2003+',
    status: 'In force',
    featured: true,
    source: { label: 'berc.org.bd', url: 'https://berc.org.bd/site/view/law', verified: true },
    brief: {
      overview:
        'The body of subsidiary regulations BERC issues under the BERC Act 2003 — including electricity and gas tariff regulations, licensing regulations and technical codes. The commission’s Laws/Regulations page is the central official listing.',
      keyPoints: [
        'Includes electricity & gas tariff regulations and licensing regulations.',
        'Issued under the authority of the BERC Act 2003.',
        'Central official listing is BERC’s Laws/Regulations page.',
      ],
    },
    dataPoints: [
      { label: 'Enabling power', value: 'Regulations made under Section 59 of the BERC Act 2003 (Act 13 of 2003)', asOf: '2003', source: { label: 'BERC Electricity Grid Code 2018 (notification)', url: 'https://policy.asiapacificenergy.org/sites/default/files/Electricity%20Grid%20Code%202018.pdf' } },
      { label: 'Licensing', value: 'Licensing Regulations 2006, amended 2011 & 2016 — the 2016 amendment extended licence validity from 1 to 3 years', asOf: '2016', source: { label: 'OGR Legal Resource Portal', url: 'https://resource.ogrlegal.com/laws/energy/' } },
      { label: 'Electricity tariff regulations', value: 'Generation 2008; Transmission 2016; Distribution Retail 2016', asOf: '2016', source: { label: 'OGR Legal Resource Portal', url: 'https://resource.ogrlegal.com/laws/energy/' } },
      { label: 'Gas tariff regulations', value: 'Natural Gas Transmission and Distribution Tariff Regulations, both 2010', asOf: '2010', source: { label: 'OGR Legal Resource Portal', url: 'https://resource.ogrlegal.com/laws/energy/' } },
      { label: 'Dispute resolution', value: 'Dispute Settlement Regulations 2014, replaced by Dispute Resolution Regulations 2021', asOf: '2021', source: { label: 'OGR Legal Resource Portal', url: 'https://resource.ogrlegal.com/laws/energy/' } },
      { label: 'Grid code', value: 'Electricity Grid Code Regulations 2018; revised Grid Code Regulations issued 2023', asOf: '2023', source: { label: 'OGR Legal Resource Portal', url: 'https://resource.ogrlegal.com/laws/energy/' } },
    ],
  },
  {
    slug: 'net-metering-guidelines-2018',
    title: 'Net Metering Guidelines, 2018',
    short: 'Net Metering Guidelines 2018',
    group: 'regulations',
    authority: 'Power Division / SREDA',
    year: '2018',
    status: 'In force',
    featured: true,
    source: { label: 'Approved English text (policy database)', url: 'https://policy.asiapacificenergy.org/sites/default/files/Net%20metering%20Guidelines%20-%202018.pdf', verified: true },
    brief: {
      overview:
        'Rules governing rooftop solar net metering, letting consumers export surplus generation to the grid and offset their bills. Issued in July 2018 and amended in 2019 to cover all three-phase consumers.',
      keyPoints: [
        'Allows rooftop solar owners to export surplus power and offset bills.',
        'Amended 2019 to include all three-phase consumers.',
        'Requires SREDA-approved equipment; SREDA has been revising the rules (2025).',
      ],
    },
    dataPoints: [
      { label: 'Issued', value: '28 July 2018 by the Power Division; revised November 2019', asOf: 'Nov 2019', source: { label: 'Energy & Power Magazine', url: 'https://ep-bd.com/view/details/article/NTQ0OQ==/title?q=Net+Energy+Metering:+A+Game+Changer+for+Renewable+Energy+in+Bangladesh' } },
      { label: 'Capacity cap', value: '70% of sanctioned load (or transformer rating), with a 3 MW absolute ceiling', asOf: '2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3519' } },
      { label: 'Settlement', value: 'Monthly netting with credit carry-over; annual settlement each 30 June at the bulk purchase rate', asOf: '2018', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/3519' } },
      { label: 'Cumulative uptake', value: '2,190 net-metered rooftop systems totalling ≈100 MWp registered', asOf: 'Jul 2026', source: { label: 'National Solar Help Desk, SREDA', url: 'https://www.nshd.sreda.gov.bd/about' } },
      { label: '2025 revision', value: 'Cap raised from 70% to 100% of sanctioned load; opened to single-phase, prepaid and smart-meter consumers', asOf: 'Sep 2025', source: { label: 'pv magazine', url: 'https://www.pv-magazine.com/2025/09/10/bangladesh-revises-net-metering-rules-to-expand-solar/' } },
    ],
  },
  {
    slug: 'grid-code-2018',
    title: 'Bangladesh Electricity Grid Code (2018, revised 2019)',
    short: 'Grid Code 2018/2019',
    group: 'regulations',
    authority: 'Bangladesh Energy Regulatory Commission (BERC)',
    year: '2018',
    status: 'In force',
    featured: true,
    source: { label: 'BERC (policy database copy)', url: 'https://policy.asiapacificenergy.org/sites/default/files/Electricity%20Grid%20Code%202018.pdf', verified: true },
    brief: {
      overview:
        'The technical rulebook for operating the national transmission system, covering planning, connection, operation and metering. It includes the Metering Code section setting minimum operational and commercial metering requirements.',
      keyPoints: [
        'Governs transmission system planning, connection and operation.',
        'Includes the Metering Code (minimum metering requirements).',
        'A 2019 revised gazette version is published on the BERC portal.',
      ],
    },
    dataPoints: [
      { label: 'Legal basis', value: 'BERC (Electricity Grid Code) Regulations 2018 under Section 59 of the BERC Act; Revision 0 dated 20 Dec 2018', asOf: 'Dec 2018', source: { label: 'BERC Electricity Grid Code 2018', url: 'https://policy.asiapacificenergy.org/sites/default/files/Electricity%20Grid%20Code%202018.pdf' } },
      { label: 'Frequency band', value: 'Nominal 50.0 Hz, controlled within 49.5–50.5 Hz (±1%)', asOf: '2018', source: { label: 'Grid Code 2018, cl. 5.4.3', url: 'https://policy.asiapacificenergy.org/sites/default/files/Electricity%20Grid%20Code%202018.pdf' } },
      { label: 'Voltage limits', value: 'Normal: ±5% at 400 kV, ±6% at 230/132 kV; emergency: ±10% at 400 kV, +10/−15% at 230/132 kV', asOf: '2018', source: { label: 'Grid Code 2018, cl. 4.4/5.4.4', url: 'https://policy.asiapacificenergy.org/sites/default/files/Electricity%20Grid%20Code%202018.pdf' } },
      { label: 'Generator withstand', value: 'Full rated output across 49.5–50.5 Hz; must not disconnect within 48.0–51.5 Hz', asOf: '2018', source: { label: 'Grid Code 2018, cl. 5.8.1', url: 'https://policy.asiapacificenergy.org/sites/default/files/Electricity%20Grid%20Code%202018.pdf' } },
      { label: 'Governance', value: 'Changes go through the Grid Code Review Panel (meets at least quarterly) with Commission approval', asOf: '2018', source: { label: 'BERC Electricity Grid Code 2018', url: 'https://policy.asiapacificenergy.org/sites/default/files/Electricity%20Grid%20Code%202018.pdf' } },
    ],
  },
  {
    slug: 'distribution-code-2015',
    title: 'Bangladesh Electricity Distribution Code, 2015',
    short: 'Distribution Code 2015',
    group: 'regulations',
    authority: 'Bangladesh Energy Regulatory Commission (BERC)',
    year: '2015',
    status: 'In force',
    source: { label: 'berc.org.bd', url: 'https://berc.org.bd/site/view/law', verified: false },
    brief: {
      overview:
        'The rulebook for electricity distribution — covering distribution planning, connection conditions, performance standards and consumer service obligations for the distribution utilities.',
      keyPoints: [
        'Governs distribution planning, connection and service standards.',
        'Applies to distribution utilities (DPDC, DESCO, NESCO, WZPDCL, BREB).',
        'Locate the exact official PDF on BERC’s Laws/Regulations page.',
      ],
    },
    dataPoints: [
      { label: 'Statutory basis', value: 'Framed by BERC to enforce Sections 31 & 54 of the BERC Act 2003, read with regs 19–20 of the Licensing Regulations 2006', asOf: '2015', source: { label: 'BERC portal (official PDF)', url: 'https://berc.portal.gov.bd/sites/default/files/files/berc.portal.gov.bd/page/a250b6fc_8bcf_4c96_bb20_3c3de230467a/2021-06-07-04-24-cbc591d9d9e86f45f50013ea00684274.pdf' } },
      { label: 'Scope', value: 'Distribution management, planning, operation, connection conditions, performance standards and safety', asOf: '2015', source: { label: 'Distribution Code 2015 (full text)', url: 'https://www.scribd.com/document/826636329/Distribution-Code-2015' } },
      { label: 'Performance standards', value: 'Power Quality, Reliability and System Loss standards for distribution licensees, plus consumer-service provisions', asOf: '2015', source: { label: 'BERC portal (official PDF)', url: 'https://berc.portal.gov.bd/sites/default/files/files/berc.portal.gov.bd/page/a250b6fc_8bcf_4c96_bb20_3c3de230467a/2021-06-07-04-24-cbc591d9d9e86f45f50013ea00684274.pdf' } },
      { label: 'Drafting history', value: 'Updated public draft circulated February 2012; finalised as the Distribution Code 2015', asOf: '2015', source: { label: 'BERC portal', url: 'https://berc.portal.gov.bd/sites/default/files/files/berc.portal.gov.bd/page/a250b6fc_8bcf_4c96_bb20_3c3de230467a/2021-06-07-04-24-cbc591d9d9e86f45f50013ea00684274.pdf' } },
    ],
  },
  {
    slug: 'eec-rules-2016',
    title: 'Energy Efficiency and Conservation Rules, 2016',
    short: 'EE&C Rules 2016',
    group: 'regulations',
    authority: 'SREDA / Power Division',
    year: '2016',
    status: 'In force',
    source: { label: 'sreda.gov.bd', url: 'https://sreda.gov.bd/', verified: false },
    brief: {
      overview:
        'Subsidiary rules under the SREDA Act enabling energy management and audits, efficiency labelling and building-efficiency programmes — the operational basis for the EE&C Master Plan.',
      keyPoints: [
        'Enable energy audits, management and efficiency labelling.',
        'Provide the operational basis for the EE&C Master Plan.',
        'Confirm the exact year and official SREDA PDF before relying on it.',
      ],
    },
    dataPoints: [
      { label: 'Legal basis', value: 'Issued 2016 under the SREDA Act 2012 framework; amended 2023', asOf: '2016', source: { label: 'OGR Legal Resource Portal', url: 'https://resource.ogrlegal.com/laws/energy/' } },
      { label: 'Designated Consumers', value: 'Establishments above sector-wise annual TOE thresholds must engage SREDA-certified Energy Managers', asOf: '2016', source: { label: 'SREDA (Energy Manager Certification Module)', url: 'https://sreda.portal.gov.bd/sites/default/files/files/sreda.portal.gov.bd/page/37b731e9_248c_407a_a75b_0d081364690e/2023-01-03-10-12-1cd2f30399fba886f0abbb42812c0f69.pdf' } },
      { label: 'DC obligations', value: 'Appoint an energy manager, meet consumption norms, undergo periodic audits, and file baseline + yearly progress reports', asOf: '2018', source: { label: 'EDGG Paper 10 (Green Policy Platform)', url: 'https://www.greenpolicyplatform.org/sites/default/files/downloads/resource/EDGG+Paper+10+Energy+Efficiency+and+Energy+Auditing.pdf' } },
      { label: 'First cohort', value: '113 industries selected as the first designated energy consumers; first published list later expanded to 150', asOf: '2018', source: { label: 'EDGG Paper 10 (Green Policy Platform)', url: 'https://www.greenpolicyplatform.org/sites/default/files/downloads/resource/EDGG+Paper+10+Energy+Efficiency+and+Energy+Auditing.pdf' } },
    ],
  },

  // ── Tariff Orders & Regulators ────────────────────────────────────────────
  {
    slug: 'berc',
    title: 'Bangladesh Energy Regulatory Commission (BERC)',
    short: 'BERC',
    group: 'regulators',
    authority: 'Independent statutory regulator (BERC Act 2003)',
    year: 'Est. 2003',
    status: 'In force',
    featured: true,
    source: { label: 'berc.org.bd', url: 'https://berc.org.bd/', verified: true },
    brief: {
      overview:
        'The independent statutory regulator for electricity, gas and petroleum. BERC licenses operators and sets bulk and retail electricity and gas tariffs through public hearings — an authority restored in 2024 after the repeal of BERC Act Section 34(k).',
      keyPoints: [
        'Regulates electricity, gas and petroleum; licenses operators.',
        'Sets bulk & retail tariffs via public hearing.',
        'Official domain is berc.org.bd (not berc.gov.bd).',
      ],
    },
    dataPoints: [
      { label: 'Established', value: 'BERC Act 2003 (Act No. 13 of 2003); commission effective 27 April 2004 with first appointments', asOf: '2004', source: { label: 'UN ESCAP Asia-Pacific Energy Portal', url: 'https://policy.asiapacificenergy.org/node/212' } },
      { label: 'Composition', value: 'Five members: Chairman + Members for Admin, Gas, Petroleum and Electricity', asOf: '2026', source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bangladesh_Energy_Regulatory_Commission' } },
      { label: 'Current chairman', value: 'Jalal Ahmed, appointed August 2024', asOf: 'Jun 2026', source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bangladesh_Energy_Regulatory_Commission' } },
      { label: 'Jurisdiction', value: 'Electricity, gas and petroleum — tariffs, licensing and dispute resolution; headquartered in Dhaka', asOf: '2026', source: { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bangladesh_Energy_Regulatory_Commission' } },
      { label: 'Hearing authority restored', value: 'August 2024 ordinance restored mandatory public hearings before power/gas price changes', asOf: 'Aug 2024', source: { label: 'The Business Standard', url: 'https://www.tbsnews.net/bangladesh/energy/ordinance-issued-revoking-govts-ability-raise-power-energy-prices-bypassing-berc' } },
    ],
  },
  {
    slug: 'berc-tariff-orders',
    title: 'BERC Tariff Orders & Notices',
    short: 'BERC Tariff Orders',
    group: 'regulators',
    authority: 'Bangladesh Energy Regulatory Commission (BERC)',
    year: 'Live',
    status: 'In force',
    featured: true,
    source: { label: 'berc.org.bd/notices', url: 'https://berc.org.bd/site/view/notices', verified: true },
    brief: {
      overview:
        'The official page where BERC publishes its current tariff orders and gazette notifications — bulk and retail electricity tariff orders and gas tariff orders — for download. Because individual orders change frequently, this page is the canonical live source.',
      keyPoints: [
        'Publishes bulk & retail electricity and gas tariff orders.',
        'Canonical source for the latest gazette notifications.',
        'Preferred over listing individual, frequently-changing orders.',
      ],
    },
    dataPoints: [
      /**
       * QUARANTINED 2026-09-30, for the reason the entry below was on 09-05.
       *
       * This entry read: "Latest retail power tariff: +16.68% — weighted
       * average Tk 9.11 → Tk 10.63/kWh, announced 3 June 2026", cited to
       * Prothom Alo. That is BERC's order of 3 June 2026, which BERC amended
       * on 4 June (Reconsideration Order 2026/01) — so for four months the
       * library called a one-day figure the latest tariff. The 09-05 pass
       * quarantined its neighbour and missed this line. No post-amendment
       * weighted average is held from a BERC document, so none is printed.
       */
      /**
       * QUARANTINED 2026-09-05, and replaced by a fact the engine resolves.
       *
       * This entry read: "+19.85% — Tk 7.00 → Tk 8.39/kWh; transmission charge
       * up to ~39 paisa/unit; lifeline rate Tk 4.63 → Tk 5.32", asOf Jun 2026,
       * cited to Dhaka Tribune. Every figure in it is from BERC's order of
       * 3 June 2026, and BERC amended that order on 4 June: the lifeline
       * increase was set aside and the bulk rates were cut. The page therefore
       * told readers for three months that the lifeline rate had risen to 5.32
       * when it had never left 4.63.
       *
       * It is not replaced with better hand-typed numbers, because the bulk
       * half cannot be one number at all -- Appendix-ka of the reconsideration
       * order fixes bulk per utility AND per voltage, and the 33 kV rate alone
       * runs from 7.1530 for BREB's PBSs to 10.0950 for DPDC and DESCO.
       */
      LIFELINE_FACT,
      { label: 'Feb 2024 retail adjustment', value: '+8.5% to average Tk 8.95/kWh (from Tk 8.25), gazetted 29 Feb 2024 effective 1 Feb 2024', asOf: 'Feb 2024', source: { label: 'Dhaka Tribune', url: 'https://www.dhakatribune.com/bangladesh/power-energy/340667/gazette-notification-issued-to-raise-8.50%25-power' } },
      { label: 'Feb 2024 bulk adjustment', value: '+5% to Tk 7.04/kWh; distributors buy from BPDB at Tk 8.44 (230 kV), Tk 8.47 (132 kV), Tk 7.62 (33 kV)', asOf: 'Feb 2024', source: { label: 'Dhaka Tribune', url: 'https://www.dhakatribune.com/bangladesh/power-energy/340667/gazette-notification-issued-to-raise-8.50%25-power' } },
      { label: 'Latest gas tariff order', value: '+33% for new industrial connections (Tk 30 → 40/m³) and new captive users (Tk 31.5 → 42), effective 13 April 2025', asOf: 'Apr 2025', source: { label: 'The Daily Star', url: 'https://www.thedailystar.net/news/bangladesh/news/33-hike-gas-tariff-new-industries-3870696' } },
    ],
  },
  {
    slug: 'sreda',
    title: 'Sustainable & Renewable Energy Development Authority (SREDA)',
    short: 'SREDA',
    group: 'regulators',
    authority: 'National authority for RE & efficiency (SREDA Act 2012)',
    year: 'Est. 2012',
    status: 'In force',
    featured: true,
    source: { label: 'sreda.gov.bd', url: 'https://sreda.gov.bd/', verified: true },
    brief: {
      overview:
        'The national authority promoting renewable energy and energy efficiency. SREDA hosts the net-metering guidelines, renewable-energy policy drafts, the EE&C Master Plan and the National Solar Help Desk.',
      keyPoints: [
        'Promotes and coordinates renewables and energy efficiency.',
        'Hosts net-metering guidelines and RE policy drafts.',
        'Runs the National Solar Help Desk (solar.sreda.gov.bd).',
      ],
    },
    dataPoints: [
      { label: 'Operational since', value: '2014, under the SREDA Act 2012, as the national nodal agency for RE and efficiency', asOf: '2014', source: { label: 'IEA Policies Database', url: 'https://www.iea.org/policies/6127-the-sustainable-and-renewable-energy-development-authority-act-2012-creation-of-the-sustainable-and-renewable-energy-development-authority-sreda' } },
      { label: 'Net-metered registry', value: '2,657 net-metered rooftop systems ≈116 MW, plus 264 non-net-metered systems ≈94 MW', asOf: 'Mar 2025', source: { label: 'pv magazine', url: 'https://www.pv-magazine.com/2025/03/17/bangladesh-seeking-to-improve-net-metering-for-rooftop-pv/' } },
      { label: '2025 guideline revision', value: 'Rooftop solar allowance raised 70% → 100% of sanctioned load; single-phase and prepaid consumers made eligible', asOf: 'Sep 2025', source: { label: 'pv magazine', url: 'https://www.pv-magazine.com/2025/09/10/bangladesh-revises-net-metering-rules-to-expand-solar/' } },
      { label: 'National Solar Help Desk', value: 'Online portal (nshd.sreda.gov.bd) processing and tracking rooftop solar applications', asOf: '2026', source: { label: 'SREDA National Solar Help Desk', url: 'https://www.nshd.sreda.gov.bd/about' } },
      { label: 'Certification schemes', value: 'Runs Energy Manager Certification and certifies energy auditors for designated consumers under the EE&C Rules 2016', asOf: '2022', source: { label: 'SREDA (certification module)', url: 'https://sreda.portal.gov.bd/sites/default/files/files/sreda.portal.gov.bd/page/37b731e9_248c_407a_a75b_0d081364690e/2023-01-03-10-12-1cd2f30399fba886f0abbb42812c0f69.pdf' } },
    ],
  },
  {
    slug: 'baera',
    title: 'Bangladesh Atomic Energy Regulatory Authority (BAERA)',
    short: 'BAERA',
    group: 'regulators',
    authority: 'Independent nuclear/radiation regulator (Act 2012)',
    year: 'Est. 2012',
    status: 'In force',
    featured: true,
    source: { label: 'baera.gov.bd', url: 'https://baera.gov.bd/', verified: true },
    brief: {
      overview:
        'The independent regulator for nuclear and radiation safety, responsible for licensing and oversight of nuclear installations such as the Rooppur Nuclear Power Plant.',
      keyPoints: [
        'Regulates nuclear and radiation safety in Bangladesh.',
        'Licenses and oversees the Rooppur Nuclear Power Plant.',
        'Established under the Atomic Energy Regulatory Act 2012.',
      ],
    },
    dataPoints: [
      { label: 'Formed', value: '12 February 2013 under the Atomic Energy Regulatory Act 2012; HQ Agargaon, Dhaka (Ministry of Science & Technology)', asOf: 'Feb 2013', source: { label: 'IAEA (CNS National Report)', url: 'https://www.iaea.org/sites/default/files/24/02/cns_bangladesh_national_report_2022.pdf' } },
      { label: 'Rooppur siting licence', value: 'Issued to the Bangladesh Atomic Energy Commission on 21 June 2016', asOf: 'Jun 2016', source: { label: 'IAEA (CNS National Report)', url: 'https://www.iaea.org/sites/default/files/24/02/cns_bangladesh_national_report_2022.pdf' } },
      { label: 'Construction licences', value: 'Rooppur Unit 1: 2 November 2017; Unit 2: 8 July 2018', asOf: 'Jul 2018', source: { label: 'IAEA (CNS National Report)', url: 'https://www.iaea.org/sites/default/files/24/02/cns_bangladesh_national_report_2022.pdf' } },
      { label: 'Unit 1 operating licence', value: 'Issued 16 April 2026 — clearing Bangladesh’s first nuclear unit for fuel loading and commissioning', asOf: 'Apr 2026', source: { label: 'World Nuclear News', url: 'https://world-nuclear-news.org/articles/operating-licence-issued-for-first-bangladesh-nuclear-power-unit' } },
      { label: 'Fuel loading', value: 'All 163 fuel assemblies loaded into Rooppur Unit 1 between 28 April and 12 May 2026', asOf: 'May 2026', source: { label: 'World Nuclear News', url: 'https://www.world-nuclear-news.org/articles/nuclear-fuel-loading-completed-at-rooppur-1' } },
      { label: 'IAEA oversight', value: 'Reports under the Convention on Nuclear Safety peer-review process covering Rooppur regulation', asOf: '2022', source: { label: 'IAEA', url: 'https://www.iaea.org/sites/default/files/24/02/cns_bangladesh_national_report_2022.pdf' } },
    ],
  },
];

export const POLICY_STATUSES: readonly PolicyStatus[] = ['In force', 'Draft', 'Superseded', 'Repealed'];

/**
 * Merge admin-managed policy content (SiteSetting `policyFramework`) over the
 * code defaults. Falls back to the curated defaults when unset or malformed.
 */
export function resolvePolicies(settings: Record<string, unknown> | undefined): Policy[] {
  const custom = settings?.policyFramework;
  if (Array.isArray(custom) && custom.length > 0) {
    return (custom as Policy[])
      .filter((p) => p && typeof p.slug === 'string' && typeof p.title === 'string')
      .map((p) => {
        // CMS snapshots predating the dataPoints field would otherwise hide the
        // curated official figures — fall back to the code defaults per slug.
        if (p.dataPoints?.length) return p;
        const fallback = POLICIES.find((d) => d.slug === p.slug)?.dataPoints;
        return fallback?.length ? { ...p, dataPoints: fallback } : p;
      });
  }
  return POLICIES;
}

export function getPolicyBySlug(slug: string, list: Policy[] = POLICIES): Policy | undefined {
  return list.find((p) => p.slug === slug);
}

export function getPoliciesByGroup(group: PolicyGroupKey): Policy[] {
  return POLICIES.filter((p) => p.group === group);
}

export function getFeaturedPolicies(): Policy[] {
  return POLICIES.filter((p) => p.featured);
}
