import { Scale, Map, ScrollText, Landmark } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  /** Optional caveat surfaced prominently (e.g. replacement under preparation). */
  note?: string;
};

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
    return (custom as Policy[]).filter((p) => p && typeof p.slug === 'string' && typeof p.title === 'string');
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
