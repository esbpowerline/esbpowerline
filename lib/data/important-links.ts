/**
 * Important Official Links — JSON-safe data for the homepage sidebar directory
 * of Bangladesh's Ministry of Power, Energy & Mineral Resources (MPEMR).
 *
 * Icons are stored as string names (mapped to lucide components in the
 * component) so the whole structure is serialisable and editable as JSON from
 * the admin panel (SiteSetting key `importantLinks`). Falls back to these
 * curated defaults when unset.
 */

export type ILTint = 'amber' | 'sky' | 'emerald' | 'orange' | 'teal' | 'cyan' | 'violet' | 'stone';

/** Allowed icon names — must exist in the ICONS map in ImportantLinks.tsx. */
export type ILIconName =
  | 'Zap' | 'Network' | 'Waypoints' | 'Factory' | 'ShieldCheck'
  | 'Flame' | 'Fuel' | 'Droplet' | 'Mountain' | 'Link';

export type ILOrgNode = {
  name: string;
  short: string;
  href: string;
  domain: string;
  icon?: ILIconName;
  tint?: ILTint;
  note?: string;
  children?: ILOrgNode[];
};

export type ILDivision = {
  name: string;
  short: string;
  href: string;
  icon: ILIconName;
  tint: ILTint;
};

export type ILSection = {
  title: string;
  tint: ILTint;
  orgs: ILOrgNode[];
};

export type ImportantLinksData = {
  ministry: { name: string; short: string; href: string; domain: string };
  divisions: ILDivision[];
  regulator: ILOrgNode;
  sections: ILSection[];
};

export const DEFAULT_IMPORTANT_LINKS: ImportantLinksData = {
  ministry: {
    name: 'Ministry of Power, Energy & Mineral Resources',
    short: 'MPEMR',
    href: 'https://mpemr.gov.bd/',
    domain: 'mpemr.gov.bd',
  },
  divisions: [
    { name: 'Power Division', short: 'PD', href: 'https://powerdivision.gov.bd/', icon: 'Zap', tint: 'amber' },
    { name: 'Energy & Mineral Resources Division', short: 'EMRD', href: 'https://emrd.gov.bd/', icon: 'Flame', tint: 'orange' },
  ],
  regulator: {
    name: 'Bangladesh Energy Regulatory Commission',
    short: 'BERC',
    href: 'https://berc.org.bd/',
    domain: 'berc.org.bd',
    icon: 'ShieldCheck',
    tint: 'violet',
  },
  sections: [
    {
      title: 'Fuel & Resources',
      tint: 'orange',
      orgs: [
        {
          name: 'Bangladesh Oil, Gas & Mineral Corporation (Petrobangla)',
          short: 'Petrobangla',
          href: 'https://petrobangla.org.bd/',
          domain: 'petrobangla.org.bd',
          icon: 'Flame',
          tint: 'orange',
          children: [
            { name: 'Bangladesh Petroleum Exploration & Production Company', short: 'BAPEX', href: 'https://bapex.com.bd/', domain: 'bapex.com.bd' },
            { name: 'Bangladesh Gas Fields Company', short: 'BGFCL', href: 'https://bgfcl.org.bd/', domain: 'bgfcl.org.bd' },
            { name: 'Sylhet Gas Fields Ltd', short: 'SGFL', href: 'https://sgfl.gov.bd/', domain: 'sgfl.gov.bd' },
            { name: 'Gas Transmission Company Ltd', short: 'GTCL', href: 'https://gtcl.org.bd/', domain: 'gtcl.org.bd' },
            { name: 'Titas Gas Transmission & Distribution PLC', short: 'Titas Gas', href: 'https://titasgas.gov.bd/', domain: 'titasgas.gov.bd' },
            { name: 'Jalalabad Gas Transmission & Distribution System', short: 'Jalalabad Gas', href: 'https://jalalabadgas.org.bd/', domain: 'jalalabadgas.org.bd' },
            { name: 'Bakhrabad Gas Distribution Company', short: 'BGDCL', href: 'https://bgdcl.portal.gov.bd/', domain: 'bgdcl.portal.gov.bd' },
            { name: 'Karnaphuli Gas Distribution Company', short: 'KGDCL', href: 'https://kgdcl.gov.bd/', domain: 'kgdcl.gov.bd' },
            { name: 'Pashchimanchal Gas Company', short: 'PGCL', href: 'https://pgcl.org.bd/', domain: 'pgcl.org.bd' },
            { name: 'Sundarban Gas Company Ltd', short: 'SGCL', href: 'https://sgcl.gov.bd/', domain: 'sgcl.gov.bd' },
            { name: 'Rupantarita Prakritik Gas Company (RPGCL)', short: 'RPGCL', href: 'https://rpgcl.org.bd/', domain: 'rpgcl.org.bd' },
          ],
        },
        {
          name: 'Bangladesh Petroleum Corporation',
          short: 'BPC',
          href: 'https://bpc.gov.bd/',
          domain: 'bpc.gov.bd',
          icon: 'Fuel',
          tint: 'teal',
          children: [
            { name: 'Padma Oil Company Ltd', short: 'Padma Oil', href: 'https://pocl.gov.bd/', domain: 'pocl.gov.bd' },
            { name: 'Meghna Petroleum Ltd', short: 'Meghna Petroleum', href: 'https://mpl.gov.bd/', domain: 'mpl.gov.bd' },
            { name: 'Jamuna Oil Company Ltd', short: 'Jamuna Oil', href: 'https://jamunaoil.gov.bd/', domain: 'jamunaoil.gov.bd' },
            { name: 'Eastern Refinery PLC', short: 'ERL', href: 'https://erl.com.bd/', domain: 'erl.com.bd' },
            { name: 'Standard Asiatic Oil Company', short: 'SAOCL', href: 'https://saocl.gov.bd/', domain: 'saocl.gov.bd' },
            { name: 'Eastern Lubricants Blenders PLC', short: 'ELBL', href: 'https://elbl.portal.gov.bd/', domain: 'elbl.portal.gov.bd' },
            { name: 'LP Gas Ltd', short: 'LP Gas', href: 'https://lpgl.gov.bd/', domain: 'lpgl.gov.bd' },
          ],
        },
        { name: 'Geological Survey of Bangladesh', short: 'GSB', href: 'https://gsb.gov.bd/', domain: 'gsb.gov.bd', icon: 'Mountain', tint: 'stone' },
        { name: 'Bureau of Mineral Development', short: 'BMD', href: 'https://bomd.gov.bd/', domain: 'bomd.gov.bd', icon: 'Mountain', tint: 'stone' },
        { name: 'Hydrocarbon Unit', short: 'HCU', href: 'https://hcu.gov.bd/', domain: 'hcu.gov.bd', icon: 'Droplet', tint: 'cyan' },
        { name: 'Bangladesh Petroleum Institute', short: 'BPI', href: 'https://bpi.gov.bd/', domain: 'bpi.gov.bd', icon: 'Droplet', tint: 'cyan' },
      ],
    },
    {
      title: 'Generation',
      tint: 'amber',
      orgs: [
        {
          name: 'Bangladesh Power Development Board',
          short: 'BPDB',
          href: 'https://bpdb.gov.bd/',
          domain: 'bpdb.gov.bd',
          icon: 'Zap',
          tint: 'amber',
          children: [
            { name: 'Electricity Generation Company of Bangladesh', short: 'EGCB', href: 'https://egcb.gov.bd/', domain: 'egcb.gov.bd' },
            { name: 'North-West Power Generation Company', short: 'NWPGCL', href: 'https://nwpgcl.gov.bd/', domain: 'nwpgcl.gov.bd' },
            { name: 'Ashuganj Power Station Company', short: 'APSCL', href: 'https://apscl.org.bd/', domain: 'apscl.org.bd', note: 'This official site currently serves an expired security certificate — your browser may show a warning.' },
            { name: 'Coal Power Generation Company Bangladesh', short: 'CPGCBL', href: 'https://cpgcbl.gov.bd/', domain: 'cpgcbl.gov.bd' },
            { name: 'Rural Power Company Ltd', short: 'RPCL', href: 'https://rpcl.gov.bd/', domain: 'rpcl.gov.bd' },
            { name: 'B-R Powergen Ltd', short: 'BRPL', href: 'https://brpowergen.gov.bd/', domain: 'brpowergen.gov.bd' },
            { name: 'Nuclear Power Plant Company Bangladesh', short: 'NPCBL', href: 'https://npcbl.gov.bd/', domain: 'npcbl.gov.bd' },
          ],
        },
        { name: 'Sustainable & Renewable Energy Development Authority', short: 'SREDA', href: 'https://sreda.gov.bd/', domain: 'sreda.gov.bd', icon: 'Factory', tint: 'emerald' },
      ],
    },
    {
      title: 'Transmission',
      tint: 'sky',
      orgs: [
        { name: 'Power Grid Company of Bangladesh', short: 'PGCB', href: 'https://pgcb.gov.bd/', domain: 'pgcb.gov.bd', icon: 'Network', tint: 'sky' },
      ],
    },
    {
      title: 'Distribution',
      tint: 'teal',
      orgs: [
        { name: 'Dhaka Power Distribution Company', short: 'DPDC', href: 'https://dpdc.org.bd/', domain: 'dpdc.org.bd', icon: 'Waypoints', tint: 'teal' },
        { name: 'Dhaka Electric Supply Company', short: 'DESCO', href: 'https://desco.org.bd/', domain: 'desco.org.bd', icon: 'Waypoints', tint: 'teal' },
        { name: 'Northern Electricity Supply Company', short: 'NESCO', href: 'https://nesco.gov.bd/', domain: 'nesco.gov.bd', icon: 'Waypoints', tint: 'teal' },
        { name: 'West Zone Power Distribution Company', short: 'WZPDCL', href: 'https://wzpdcl.org.bd/', domain: 'wzpdcl.org.bd', icon: 'Waypoints', tint: 'teal' },
        { name: 'Bangladesh Rural Electrification Board', short: 'BREB', href: 'https://reb.gov.bd/', domain: 'reb.gov.bd', icon: 'Waypoints', tint: 'teal' },
      ],
    },
  ],
};

/**
 * Merge admin-managed content (SiteSetting `importantLinks`) over the code
 * defaults. Falls back to defaults when unset or structurally invalid.
 */
export function resolveImportantLinks(settings: Record<string, unknown> | undefined): ImportantLinksData {
  const custom = settings?.importantLinks as Partial<ImportantLinksData> | undefined;
  if (
    custom &&
    typeof custom === 'object' &&
    custom.ministry &&
    Array.isArray(custom.divisions) &&
    custom.regulator &&
    Array.isArray(custom.sections)
  ) {
    return custom as ImportantLinksData;
  }
  return DEFAULT_IMPORTANT_LINKS;
}
