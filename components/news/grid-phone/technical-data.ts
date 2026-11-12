/**
 * The standing figures and wording of the Technical Information reference.
 *
 * The desktop tab (components/news/power-grid/TechnicalInfoTab.tsx) holds
 * these inline in its JSX, so they cannot be imported; every string below is
 * copied from it character for character and must be changed there first.
 * Nothing is computed here. The substation register and the three project
 * registers are real modules (lib/data/infrastructure/*) and are imported by
 * the phone parts directly, never restated.
 *
 * Where the desktop itself prints two different figures for one thing (the
 * dispatch capacity is 36267.21 MW on its lines page and 38,733 MW on its
 * substations page), both are kept exactly as printed, each on its own page.
 */

export const PGCB_URL = 'https://www.pgcb.gov.bd/';

export type Term = { term: string; body: string };
/** Main figure plus what PGCB lists as "Others" beside it. */
export type Pair = { label: string; value: string; plus?: string };

export const PD_NOTE = {
  title: 'What P and D mean here.',
  p: 'marks a figure PGCB states in its own publication, quoted as written.',
  d: 'marks one computed here — on this tab that is only ever a count of the records held or a total summed from the rows shown, never an estimate.',
  standing: 'standing infrastructure figures, not daily readings',
  tail: 'they carry the date PGCB states for them and do not change with the reporting date selected above.',
};

export const BEFORE_2013 = {
  title: 'PGCB Transmission Grid Data',
  why: 'No official records are available for the selected date. PGCB transmission outages and substation tracking officially started on December 31, 2013.',
  start: 'Official Backlog Start Date: December 31, 2013',
};

/* ── Power Transmission ─────────────────────────────────────────────── */

export const TRANSMISSION = {
  title: 'Power Transmission',
  tag: 'Core Grid Function',
  lead: 'PGCB does not generate electricity and does not sell it to you. It owns the wires in between: it collects power from the stations that make it and carries it to the companies that deliver it to homes and businesses. It earns a fee per unit carried — a toll for use of the road, not a price for the goods — and the regulator, BERC, sets that fee rather than PGCB.',
  wording: 'The main operating function of Power Grid is wheeling of energy from BPDB power stations and Generation Companies to Distribution entities utilizing transmission network. Power Grid gets its energy wheeling charge from its clients(distribution entities) at the rate fixed by Bangladesh Electricity Regulatory Commission (BERC).',
  flowTitle: 'How power reaches you',
  volts: ['400,000', '230,000', '132,000'],
  steps: [
    {
      step: 'Step 1: Generation',
      title: 'Power Generation Plants',
      body: 'Power stations burn gas or coal, or catch sun and wind, and make electricity. State-owned and private plants both feed the same grid.',
      foot: 'Gas, coal, furnace oil, solar, and imported power',
    },
    {
      step: 'Step 2: Transmission',
      title: 'High-Voltage Wheeling Grid',
      // The desktop bolds the three voltages; the phone draws them on the diagram as well.
      body: 'This is PGCB. It raises the voltage to 400,000, 230,000 or 132,000 volts so the power can cross the country without most of it being lost as heat along the way.',
      foot: 'The toll PGCB charges is set by the regulator',
    },
    {
      step: 'Step 3: Distribution',
      title: 'Distribution Entities (Clients)',
      body: 'The voltage is brought back down at a substation and handed to your local utility, which runs the last stretch of cable to your meter.',
      foot: 'Your bill comes from one of these: DPDC, DESCO, BREB/PBS, WZPDCO, NESCO',
    },
  ],
  callout: 'PGCB is building more lines and substations — the projects are listed under Grid Projects in the menu.',
};

export const STARTED = {
  title: 'Where PGCB Started',
  sub: 'What PGCB started with, handed over from BPDB and DESA',
  quote: '"The Power Grid took over about 2497 circuit km of 230 kV lines, 4236 circuit km 27.3 circuit km (Others) of 132 kV lines, 6 nos of 230/132 kV Substation and 63 nos of 132/33 kV substations from BPDB and DESA in different phases."',
  rows: [
    { label: 'Inherited 230 kV Transmission Lines', value: 'about 2497 circuit km' },
    { label: 'Inherited 132 kV Transmission Lines', value: '4236 circuit km', plus: 'Plus 27.3 circuit km (Others)' },
    { label: 'Inherited 230/132 kV Substations', value: '6 nos' },
    { label: 'Inherited 132/33 kV Substations', value: '63 nos' },
  ] as Pair[],
  source: 'corporate profile',
  note: 'Quoted verbatim from PGCB’s own statement. Not independently audited.',
  period: 'Reporting Period: Takeover from BPDB & DESA',
};

export const TODAY = {
  title: 'The Grid Today',
  sub: 'What PGCB owns and runs, as at June 2026',
  // "PGCB now runs 18,816 km of high-voltage line — … It hands that power over at 259 substations, …"
  lineKm: '18,816 km',
  lineWhat: 'of high-voltage line',
  lineBody: 'the long-distance wires that carry power from the plants to your city, before any local pole or street cable.',
  subs: '259 substations',
  subsBody: 'the sites that step the voltage down so it can be used.',
  quote: '“Transmission lines of the company up to June, 2026 are stood at 3,282 ckt km 27.8 ckt km (Others) of 400 kV lines, 5,423 circuit km 27.3 circuit km (Others) of 230 kV lines, 9,687 circuit km and 369 circuit km (Others) of 132 kV lines and 1 nos of 400 kV Station, 11 nos of 400/230kV substation, 5 nos of 400/132kV substation, 36 nos of 230/132 kV substation, 3 nos of 230/33 KV substation and 151 nos of 132/33 kV substations.”',
  lines: [
    { label: '400 kV — the motorways', value: '3,282 km', plus: 'Plus 27.8 km run by others' },
    { label: '230 kV — the trunk roads', value: '5,423 km', plus: 'Plus 27.3 km run by others' },
    { label: '132 kV — the main roads', value: '9,687 km', plus: 'Plus 369 km run by others' },
  ] as Pair[],
  sites: [
    { label: 'Highest-voltage sites', value: '1 × 400 kV station', plus: '11 step 400→230 kV, 5 step 400→132 kV' },
    { label: 'Handover sites', value: '36 step 230→132 kV', plus: '2 step 230→33 kV, 150 step 132→33 kV' },
  ] as Pair[],
  source: 'corporate profile',
  // The desktop footnote, whole. Its four bolded figures are 3, 151, 2 and 150.
  check: [
    'Figures read from PGCB’s page by two independent parsers, which agreed on all 20 checked values. One caveat, and it is PGCB’s own: the paragraph quoted above says ',
    '3',
    ' 230/33 kV and ',
    '151',
    ' 132/33 kV substations, while the table further down the same page says ',
    '2',
    ' and ',
    '150',
    '. The tiles follow the table, because that is the version PGCB’s own totals add up to.',
  ],
  asAt: 'Standing as at: June 2026',
};

export const THEN_NOW = {
  title: 'Then vs Now',
  cols: ['Infrastructure Class', 'Inherited (Takeover from BPDB & DESA)', 'Standing (Up to June, 2026)'],
  /** `then: null` is the desktop's "—": a class PGCB does not state for that period, not a zero. */
  rows: [
    { cls: '400 kV Transmission Lines', then: null, now: ['3,282 ckt km', 'Plus 27.8 ckt km (Others)'] },
    { cls: '230 kV Transmission Lines', then: ['about 2497 circuit km'], now: ['5,423 circuit km', 'Plus 27.3 circuit km (Others)'] },
    { cls: '132 kV Transmission Lines', then: ['4236 circuit km', 'Plus 27.3 circuit km (Others)'], now: ['9,687 circuit km', 'Plus 369 circuit km (Others)'] },
    { cls: '400 kV Stations / Substations', then: null, now: ['1 nos of 400 kV Station', '11 nos of 400/230kV substation', '5 nos of 400/132kV substation'] },
    { cls: '230 kV Substations', then: ['6 nos of 230/132 kV Substation'], now: ['36 nos of 230/132 kV substation', '2 nos of 230/33 KV substation'] },
    { cls: '132/33 kV Substations', then: ['63 nos of 132/33 kV substations'], now: ['150 nos of 132/33 kV substations'] },
  ] as { cls: string; then: string[] | null; now: string[] }[],
  source: 'corporate profile',
  note: 'Both columns restate PGCB’s own figures side by side. No growth rate or difference is computed, so every cell here is P; the “—” marks a class PGCB does not state for that period, not a zero.',
  period: 'Reporting Period: Takeover → June 2026',
};

export const JARGON_TRANSMISSION: Term[] = [
  { term: 'kV (Kilovolt)', body: '1,000 volts. Pushing power at high voltage is like using a wider pipe — less is wasted as heat on a long journey, which is why the grid steps voltage up to travel and back down to deliver.' },
  { term: 'ckt km (Circuit Kilometers)', body: 'Length of wire, not length of route. One tower line often carries two circuits, so a 10 km stretch of towers counts as 20 circuit km.' },
  { term: 'MVA (Megavolt-Ampere)', body: 'The size rating of a substation — roughly how much power it can pass at once. Think of it as the width of the doorway, not how much actually walks through.' },
  { term: 'Nos (Numbers)', body: 'Just “number of”. PGCB writes “11 nos” where we would write “11”.' },
  { term: 'BERC / BPDB', body: 'BERC is the regulator that sets prices. BPDB is the state power company that generates and buys electricity.' },
];

/* ── Transmission Line Information ──────────────────────────────────── */

export const LINES = {
  title: 'Transmission Line as on: June, 2026',
  sub: 'How much high-voltage wire exists, by voltage class',
  cols: ['Voltage Class', 'Main Capacity', 'Others'],
  rows: [
    { label: '400kV', value: '3,282 Circuit km', plus: '27.8 Circuit km (Others)' },
    { label: '230kV', value: '5,423 Circuit km', plus: '27.3 Circuit km (Others)' },
    { label: '132kV', value: '9,687 Circuit km', plus: '369 Circuit km (Others)' },
  ] as Pair[],
  total: { label: 'Total Line', value: '18,816 Circuit km' },
};

export const FIVE_YEARS = {
  title: 'Last Five years achievement',
  sub: 'Major projects and capacities commissioned recently',
  cols: ['Infrastructure Item', 'Verbatim Capacity / Length'],
  rows: [
    { label: '400/230kV Substation', value: '9 Nos. 13,100 MVA' },
    { label: '400/132 kV Substation', value: '4 Nos. 2,990 MVA' },
    { label: '230/132kV Substation', value: '10 Nos: 7,550 MVA' },
    { label: '230/33KV Substation', value: '1 Nos 280 MVA' },
    { label: '132/33kV Substation', value: '38 Nos. 7,647 MVA' },
    { label: '400kV Transmission Line', value: '2,124.77 Circuit km' },
    { label: '230kV Transmission Line', value: '1,481.94 Circuit km' },
    { label: '132kV Transmission Line', value: '1,249.874 Circuit km' },
  ] as Pair[],
};

export type SubClass = { cls: string; count: string; capacity: string; others: string | null };

export const SUBS_JUNE = {
  title: 'Substation as on: June, 2026',
  sub: 'Comprehensive capacity aggregates across all operation nodes',
  cols: ['Substation / Station Class', 'Count / Quantity', 'Main Capacity / Rating', 'Others (Quantity & Capacity)'],
  rows: [
    { cls: '400kV HVDC Station', count: '1 Nos.', capacity: '2x500MW HVDC Back to Back station', others: null },
    { cls: '400/230kV Substation', count: '11 Nos.', capacity: '16,180 MVA', others: '3 Nos. 2730 MVA (Others)' },
    { cls: '400/132 kV Substation', count: '5 Nos.', capacity: '4,590 MVA', others: null },
    { cls: '230/132kV Substation', count: '36 Nos.', capacity: '24,725 MVA', others: '1 Nos. 250 MVA (Others)' },
    { cls: '230/33KV Substation', count: '2 Nos.', capacity: '700 MVA', others: '4 Nos. 1,050 MVA (Others)' },
    { cls: '132/33kV Substation', count: '150 Nos.', capacity: '33,627 MVA', others: '46 Nos. 7,661 MVA (Others)' },
  ] as SubClass[],
  overall: { label: 'Overall Capacity', count: '259 Nos.', capacity: '91,512 MVA' },
  dispatch: { label: 'Dispatch Capacity at 33kV level', value: '36267.21 MW', note: '(Including all organizations)' },
};

export const JARGON_LINES: Term[] = [
  { term: 'kV (Kilovolt)', body: '1,000 volts. Higher voltage travels further with less waste.' },
  { term: 'Circuit km (ckt km)', body: 'Length of wire rather than length of route — a tower line carrying two circuits counts twice.' },
  { term: 'MVA / MW', body: 'Two different things that both sound like size. MVA rates what a substation can pass; MW measures power actually flowing. They cannot be added together.' },
  { term: 'HVDC Station', body: 'A converter station. Bangladesh’s grid and India’s run out of step with each other, so power is turned into DC and back to cross between them.' },
  { term: 'Others Capacity', body: 'Lines and substations on the network that someone other than PGCB owns. Listed separately so PGCB’s own assets are not overstated.' },
];

/* ── Substation Information ─────────────────────────────────────────── */

export const REGISTER = {
  title: 'National Grid Substation Database',
  tag: 'Register as collected May 24, 2026 — not refreshed automatically',
  body: 'Every substation on the national grid — the sites where voltage is stepped down and power changes hands. Search or filter the list below.',
  summaryTitle: 'Substation Database Summary',
  zones: '9 Zones',
  circles: 'HVDC & Circles',
  source: 'PGCB substation register',
  // The desktop footnote, whole; odd entries are the phrases it bolds.
  note: [
    'Each substation is listed as PGCB states it; the counts and the capacity total are ours, computed over whatever the filters above currently select — so they move as you filter and are not PGCB totals. ',
    'The register lists one row per transformer bank, not per station',
    ', so its 260 rows cover 227 distinct stations; the row count is shown as rows rather than as a station count for that reason. ',
    'Filtered Capacity sums only the MVA-rated transformers',
    ': the HVDC back-to-back blocks are rated in MW, a different quantity, and adding them to an MVA total would be arithmetic on mismatched units, so they are excluded. ',
    'This station list is the April 2026 collection and has not been re-collected since.',
    ' Summed whole it comes to 89,155 MVA, which matched PGCB’s April total exactly; PGCB has since published 91,512 MVA for June, so the list now trails the summary tables above by 2,357 MVA.',
  ],
  asAt: 'Register as at: April 2026',
  zoneList: ['Dhaka', 'Khulna', 'Barishal', 'Cumilla', 'Sylhet', 'Rajshahi', 'Chattogram', 'Rangpur', 'Mymensingh'],
  ownerList: ['POWER GRID', 'APSCL', 'BIFPCL', 'RNPP', 'Bulk', 'BPDB', 'DESCO', 'DPDC', 'MoST', 'DMTCL'],
  voltages: [
    { label: 'All Voltage Classes', value: 'all' },
    { label: '400 kV', value: '400kV' },
    { label: '230 kV', value: '230kV' },
    { label: '132 kV', value: '132kV' },
    { label: '230/33 kV', value: '230/33kV' },
    { label: '132/33 kV', value: '132/33kV' },
  ],
  cols: ['SN', 'Substation Name', 'Voltage Class', 'Operation Zone', 'Transformer Detail', 'Total Capacity', 'Ownership', 'Grid Circle'],
  empty: 'No substations match your filter criteria.',
};

export const ASSETS = {
  title: 'Substation Assets & Capacity',
  sub: 'Active substations and transformer ratings as of June 2026',
  cols: ['Rating / Type', 'Quantity', 'Capacity (MVA)', 'Others Capacity'],
  rows: [
    { cls: '400 kV HVDC Back-to-Back', count: '1 Station', capacity: '2x500 MW', others: null },
    { cls: '400/230 kV Substations', count: '11 Nos.', capacity: '16,180 MVA', others: '3 Nos. (2,730 MVA)' },
    { cls: '400/132 kV Substations', count: '5 Nos.', capacity: '4,590 MVA', others: null },
    { cls: '230/132 kV Substations', count: '36 Nos.', capacity: '24,725 MVA', others: '1 Nos. (250 MVA)' },
    { cls: '230/33 kV Substations', count: '2 Nos.', capacity: '700 MVA', others: '4 Nos. (1,050 MVA)' },
    { cls: '132/33 kV Substations', count: '150 Nos.', capacity: '33,627 MVA', others: '46 Nos. (7,661 MVA)' },
  ] as SubClass[],
  overall: { label: 'Overall Substation Capacity', count: '259 Stations', capacity: '91,512 MVA' },
  dispatch: { label: 'Dispatch Capacity (33kV level)', value: '38,733 MW' },
  source: 'substation assets',
  note: [
    'Every row here is PGCB’s, including the Overall line, which PGCB prints itself — so it is marked P rather than as our sum. Adding the rows up gives 259 stations, matching exactly, and ',
    '91,513 MVA against the 91,512 PGCB prints',
    ' — a 1 MVA difference in PGCB’s own arithmetic, shown as published rather than quietly corrected. The HVDC back-to-back station sits outside the MVA total: it is rated 2×500 MW, a different quantity that cannot be added to an MVA figure.',
  ],
  asAt: 'Assets as at: June 2026',
};

export const JARGON_SUBSTATIONS: Term[] = [
  { term: 'MVA (Megavolt-Ampere)', body: 'Apparent power capacity rating of the step-down transformers operating inside the substation.' },
  { term: 'kV (Kilovolt Class)', body: 'Substation connection voltage (e.g. 132/33 kV steps down 132kV grid line to 33kV distribution feeder).' },
  { term: 'Transformer Code', body: 'System operators designate transformer units (e.g. T-1, TR-2) for maintenance tracking.' },
  { term: 'Owner Groups', body: 'Entities managing the station (e.g. POWER GRID / PGCB, APSCL, BPDB utilities).' },
];

/* ── Grid Projects ──────────────────────────────────────────────────── */

export const PROJECTS = {
  ongoing: {
    title: 'Ongoing Projects',
    body: 'Detailed status tracking of PGCB high-voltage grid upgrades, river crossings, and transmission line projects.',
    count: 'Projects under tracking',
    search: 'Search project name, objective, partner...',
    check: 'Checked against PGCB’s live ongoing-projects list on 13 Aug 2026: all 13 match, with nothing on their list missing here and nothing here absent from theirs.',
    registry: 'Registry: Ongoing projects',
  },
  upcoming: {
    title: 'Upcoming Projects',
    body: 'Planned high-voltage grid expansions, battery energy storage systems (BESS), and power transmission line projects in the pipeline.',
    count: 'Projects under tracking',
    search: 'Search project name, objective, partner...',
    check: 'PGCB publishes no upcoming-projects list on its site, so unlike the ongoing and completed registers these 7 cannot be reconciled against a live PGCB page.',
    registry: 'Registry: Upcoming projects',
  },
  completed: {
    title: 'Completed Projects',
    body: 'Comprehensive registry of successfully completed high-voltage transmission lines, substations, and grid network infrastructure projects.',
    count: 'Completed Projects',
    search: 'Search completed project name, objective, scope...',
    registry: 'Registry: Completed projects',
  },
  source: 'Source: PGCB project documents, cited per project on each card above',
  note: 'Every project’s name, partner, cost, duration and status is as the source document states it. The counts are ours — they count the records held here.',
  completedNote: [
    'Each completed project is described as its source document states it; the count is ours. Checked against PGCB’s live completed-projects list on 13 Aug 2026: ',
    '50 of these 51 appear on it, and none of theirs is missing here.',
    ' The one exception is the Western Grid Network Development Project (kfW, completed June 2022), which PGCB’s current list does not carry. It is kept rather than dropped — a project finishing is not a reason to erase it — but it stands on our record alone.',
  ],
  partners: ['EXIM Bank of India', 'World Bank', 'ADB', 'AIIB', 'JICA', 'EDCF', 'KfW', 'Exim Bank China (G to G)', 'Indian LoC', 'N/A'],
  completedPartners: ['ADB', 'IDB', 'World Bank', 'JICA', 'EDCF', 'KfW', 'DANIDA', 'PGCB', 'N/A'],
  allPartners: 'All Development Partners',
};

/* ── Maps & Diagrams, OPGW map ──────────────────────────────────────── */

export type MapDoc = { title: string; sub: string; href: string; body: string; keyTitle: string; keys: Term[] };

export const MAPS: Record<'grid_net' | 'geo_map' | 'opgw_map', MapDoc> = {
  grid_net: {
    title: 'National Grid Network Diagram',
    sub: 'Schematic mapping of grid interconnectivity across Bangladesh',
    href: '/pdf/national_grid_network.pdf',
    body: 'This official schematic diagram depicts the complete topology of the Bangladesh electricity transmission network, mapping the electrical connections between power generation stations, high-voltage transmission lines (400 kV, 230 kV, and 132 kV), and grid substations.',
    keyTitle: 'Diagram Key & Technical Footnote',
    keys: [
      { term: 'Line Voltages', body: 'Red lines represent 400 kV circuits; blue/amber lines show 230 kV and 132 kV circuits respectively.' },
      { term: 'Substation Nodes', body: 'Circles represent grid substations. Solid lines entering/leaving circles represent active bus bar feeders.' },
      { term: 'Asynchronous Interface', body: 'High-Voltage Direct Current (HVDC) station links at borders are represented as block interface icons.' },
      { term: 'Document Details', body: 'Published officially by PGCB (Power Grid Company of Bangladesh) System Operations & Planning Division.' },
    ],
  },
  geo_map: {
    title: 'Geographical Grid Map',
    sub: 'Geographic layout and physical routing of national transmission lines',
    href: '/pdf/geo_map.pdf',
    body: 'This geographical map projects all high-voltage pylon paths and transmission line routing across the physical terrain of Bangladesh. It details grid line runs crossing major rivers (such as Padma and Jamuna) and the locations of substations relative to regional load centers.',
    keyTitle: 'Mapping & Geography Footnote',
    keys: [
      { term: 'Physical Routing', body: 'Traces the geographical paths of pylons. Crucial for understanding regional grid vulnerability to natural hazards (e.g. floods, cyclones).' },
      { term: 'River Crossings', body: 'Includes details of special high-tension long-span river-crossing towers engineered across active delta rivers.' },
      { term: 'Scale Projection', body: 'Geospatial representations conform to official national grid system projections.' },
      { term: 'Data Sources', body: 'Sourced from PGCB Engineering and Survey Departments.' },
    ],
  },
  opgw_map: {
    title: 'OPGW Fiber Network Map',
    sub: 'National Optical Ground Wire (OPGW) telecommunication backbone network',
    href: '/pdf/opgw_map.pdf',
    body: 'Optical Ground Wire (OPGW) is a dual-functioning cable. It acts as a conventional shield wire at the top of transmission towers to protect lines from lightning strikes, while containing optical fibers used for PGCB\'s protection signaling, SCADA telemetry, and commercial telecommunication leases.',
    keyTitle: 'OPGW & Telecom Footnote',
    keys: [
      { term: 'OPGW (Optical Ground Wire)', body: 'A ground/shield wire containing optical fiber cores. Installed on pylon tops for dual lightning shielding and high-speed data transmission.' },
      { term: 'SCADA & Telemetry', body: 'Optic lines provide real-time connection from grid stations to the National Load Dispatch Center (NLDC) for remote data monitoring.' },
      { term: 'Commercial Leasing', body: 'PGCB leases spare fiber capacity (dark fiber cores) to telecom operators, ISP companies, and state agencies.' },
      { term: 'Planning Source', body: 'Published officially by PGCB Telecommunications Division.' },
    ],
  },
};

/* ── Optical Fiber Leasing ──────────────────────────────────────────── */

export const LEASE = {
  title: 'Optical Fiber Leasing',
  history: 'Power Grid Bangladesh PLC (Power Grid) is responsible to transmit high voltage power across the whole country. Previously Power Grid used earth wire/ground wire to protect the transmission line from thundering. Before 2008, Power Grid used analog PLC (Power Line Carriers) based technology for telecommunication, SCADA (Supervisory Control and Data Acquisition) and power transmission system protection. After 2008, Power Grid adopted new optical fiber based communication technology replacing the prevalent ground wire by modern OPGW (Optical Ground Wire) with modern digital communication system for reliable and faster telecommunication, SCADA and system protection.',
  installed: 'Till June 2026, Power Grid has installed around 11,876 km of OPGW across the country along with its high voltage transmission lines. Besides Power Grid\'s own needs, the unused optical fibers are being leased out to local telecommunication operator according to approved lease rate and standard contract document with a view to developing national telecommunication infrastructure.',
  installedKm: 'around 11,876 km',
  installedWhen: 'Till June 2026',
  licensing: {
    title: 'Licensing & Leasing Agreements',
    sub: 'National regulatory and partner allocations',
    nttn: { term: 'NTTN Licensing:', body: 'Power Grid has obtained NOFTTN (Nationwide Optical Fiber Telecommunication Transmission Network) license in 2005 which was later transformed into NTTN (Nationwide Telecommunication Transmission Network) license in 2014.' },
    partners: { term: 'Partner Organizations:', body: 'Total 10 (ten) organizations including other NTTN license holders and Mobile network operators are using Power Grid\'s OPGW-based optical fiber under leasing agreement.', figure: '10 (ten)' },
    leased: {
      term: 'Capacity Leased:',
      body: 'Total 22,611.66 KM (22,611.66 x 2=45,223.33 Core-km) of optical fiber core has been leased till June 2026.',
      figure: '22,611.66 KM',
      core: '22,611.66 x 2=45,223.33 Core-km',
      caveat: 'Quoted as PGCB writes it, including the arithmetic: 22,611.66 × 2 is 45,223.32, not the 45,223.33 printed. The figure is left as published rather than silently corrected.',
    },
  },
  backbone: {
    title: 'Transmission Network & Backbone Capacity',
    sub: 'Dhaka – Kuakata – Benapole route deployment stats',
    body: ['With the aim of delivering internet services to the people of the country through Power Grid\'s robust and highly available fiber network, Power Grid has established a data transmission network with ', '9.6 / 13.2 Tbps', ' backbone capacity (operational capacity: 800 Gbps) along the Dhaka–Kuakata–Benapole route.'],
    capacity: '9.6 / 13.2 Tbps',
    operational: 'operational capacity: 800 Gbps',
    leasedLabel: 'Leased Data Capacity (Dec 2025)',
    leased: '200 Gbps',
    leasedTo: '(To International Internet Gateway (IIG) operators)',
  },
  rate: {
    title: 'Dark Fiber Lease Rate',
    effective: 'Effective: 01.01.2026',
    value: 'Tk. 5.40',
    per: '/ Core / Meter / Month',
    body: 'Monthly Recurring Charge (MRC) including Tax & excluding VAT.',
    incrementLabel: 'Annual Increment',
    increment: 'Tk. 0.20 / Year',
  },
  contact: {
    title: 'OFCL Contact Details',
    who: 'Superintending Engineer',
    unit: 'Optical Fiber Commercial Leasing (OFCL)',
    addressLabel: 'Office Address:',
    address: 'Level-10, Grid Bhaban, Avenue-3, Jahurul Islam City, Aftabnagar, Badda, Dhaka-1212.',
    emailLabel: 'Email Query:',
    email: 'se.ofcl@pgcb.gov.bd',
  },
  source: 'Optical Fiber Commercial Leasing',
  note: 'Fiber lengths, partner counts, backbone capacity and the lease rate are quoted as PGCB publishes them. Nothing on this page is computed here.',
  asAt: 'Stated as at: June 2026 · rate effective 01.01.2026',
};

export const JARGON_LEASE: Term[] = [
  { term: 'Core-km', body: 'Fibre length multiplied by how many strands run through it. 10 km of cable carrying 2 strands is 20 core-km.' },
  { term: 'Tbps / Gbps', body: 'Internet speed. 1 Tbps is a thousand times 1 Gbps — roughly the capacity of a national backbone versus a large office.' },
  { term: 'NTTN / NTTN License', body: 'The licence that lets a company rent out long-distance fibre to phone and internet providers. PGCB holds one.' },
  { term: 'Dark Optical Fiber', body: 'Spare fibre strands with no signal running through them. PGCB rents them out and the tenant lights them up with their own equipment.' },
  { term: 'SCADA / PLC', body: 'SCADA is the control-room system operators watch the grid through. PLC was the old way of sending those signals down the power lines themselves.' },
];
