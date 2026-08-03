/**
 * Titas Gas — accountability record.
 *
 * A standalone dossier on Bangladesh's largest piped-gas distributor, kept
 * deliberately outside the Policy & Regulatory Framework module: this is not a
 * legal instrument, it is a record of a licensee's own reporting.
 *
 * Sourcing rule for this file: every figure must come from Titas's own audited
 * accounts or disclosures, its auditor's report, statements by its management,
 * or documents issued by BERC, Petrobangla or the Anti-Corruption Commission.
 * Where the underlying filing is not publicly hosted, the citation names the
 * outlet that reported it from that document. Nothing here is inferred.
 *
 * Feeds the homepage rail panel (`components/home/TitasGasWatch.tsx`) and the
 * full record page at /titas-gas.
 */

export type TitasSource = { label: string; url: string };

/** A supporting figure in the homepage rail panel. */
export type TitasKpi = {
  label: string;
  value: string;
  /** Short context line under the value — the comparison that gives it meaning. */
  sub: string;
  asOf: string;
  source: TitasSource;
};

/**
 * A verified figure from a Titas filing or an official document.
 *
 * Split deliberately: `value` is the number alone so it can be set large and read
 * at a glance, `meaning` says in plain words what it is, and `against` carries the
 * comparison that makes it land (a limit, or what it used to be).
 */
export type TitasFigure = {
  label: string;
  value: string;
  meaning: string;
  /** The benchmark this number should be read against, if there is one. */
  against?: string;
  asOf?: string;
  source: TitasSource;
};

export const TITAS_RECORD = {
  title: 'Titas Gas — the accountability record',
  short: 'Titas Gas',
  kicker: 'Accountability Record',
  entity: 'Titas Gas T&D PLC (Petrobangla)',
  established: 'Est. 1964',
  /** Ownership / listing facts shown in the fact strip on the record page. */
  ownership: '75% government-owned, DSE-listed',
  source: { label: 'titasgas.portal.gov.bd', url: 'https://titasgas.portal.gov.bd/site/view/annual_reports' },

  note:
    'Every figure on this page comes from Titas Gas’s own audited accounts and disclosures, its auditor’s report, its managing director’s public statements, or documents issued by BERC, Petrobangla and the Anti-Corruption Commission. Where the underlying filing is not publicly hosted online, the citation names the outlet that reported it from that document.',

  overview:
    'Titas Gas is the company that pipes gas into most of the kitchens, shops and factories of Dhaka, Gazipur, Narayanganj, Munshiganj, Narsingdi, Manikganj and Mymensingh. In that territory it has no competition. It is three-quarters owned by the government, and because the remaining quarter trades on the stock exchange, it is required to publish audited accounts every year. That matters, because it means what follows is not rumour or allegation. It is Titas’s own reporting, its own auditor’s findings, and its own managing director’s words — describing a company that loses close to a tenth of the gas it buys, has lost money three years running, and knows exactly why.',

  /**
   * The homepage rail panel.
   *
   * Built around one comparison rather than a list of equal-weight stats: what
   * the regulator permits against what Titas reports. The allowed bar is drawn
   * to scale (2 ÷ 10.13 = 19.7% of the actual bar), so the gap is the visual.
   */
  snippet: {
    tagline: 'Bangladesh’s biggest gas distributor, in its own numbers.',
    lead: {
      caption: 'Gas that never reaches a paying customer',
      asOf: 'Q1 FY2025-26',
      allowed: { label: 'What BERC allows', value: '2%', pct: 19.7 },
      actual: { label: 'What Titas reports', value: '10.13%', pct: 100 },
      verdict: 'Five times the limit — and higher every year:',
      /** The climb, so "still rising" is evidenced rather than asserted. */
      trend: [
        { label: 'FY23', value: '5.28%' },
        { label: 'FY24', value: '7.67%' },
        { label: 'FY25', value: '9.47%' },
        { label: 'now', value: '10.13%' },
      ],
    },
    /**
     * `asOf` is carried per figure, not just in the footnote: these four are a
     * per-household monthly bill, two single-year totals and a three-year
     * cumulative, and without a date each they read as one comparable series.
     */
    stats: [
      { value: 'Tk 468', asOf: '2022', sub: 'a month a non-metered home is billed for gas Titas’s own meters say it never burned' },
      { value: 'Tk 3,000cr', asOf: 'FY2024-25', sub: 'of gas gone in a single year — Tk 8.2 crore a day, every day' },
      { value: 'Tk 2,422cr', asOf: 'FY2024-25', sub: 'booked by its own auditor as lost gas inside one year’s cost of sales' },
      { value: 'Tk 1,680cr', asOf: 'FY23–FY25', sub: 'lost over three straight years, while the dividend fell from 26% to 2%' },
    ],
    footnote: 'From Titas’s audited accounts, its auditor, BERC and the Dhaka Stock Exchange.',
    cta: 'Read the full record',
  },

  /**
   * The scale of the FY2024-25 loss, converted into units a reader can feel.
   *
   * Everything here is arithmetic on two reported figures — 1,436 mmcm lost and
   * its ≈Tk 3,000 crore value — and the working is printed on the page so a
   * reader can check it. Nothing is estimated by us.
   */
  scale: {
    hero: {
      value: 'Tk 3,000 crore',
      label: 'of gas Titas bought in 2024-25 and never sold to anyone',
      sub: '1,436 million cubic metres — 15,154 mmcm came in, 13,718 mmcm was billed. The rest leaked away or was stolen. Titas had already paid for all of it.',
      source: { label: 'Industry Insider, on Petrobangla data', url: 'https://www.industryinsiderbd.com/article/gas-worth-tk-41-billion-lost-to-system-leaks-and-theft-in-fy25' },
    },
    /** The same annual figure as a rate — Tk 3,000cr ÷ 365 / 8,760 / 525,600. */
    rates: [
      { unit: 'Every day', value: 'Tk 8.2 crore', sub: 'and 139 million cubic feet of gas' },
      { unit: 'Every hour', value: 'Tk 34 lakh', sub: 'through the night, all year' },
      { unit: 'Every minute', value: 'Tk 57,000', sub: 'across all 525,600 minutes of the year' },
    ],
    /** Ratio against the regulator's limit — rendered as a meter. */
    meter: {
      caption: 'Of the 1,436 mmcm that vanished, this much was within the 2% BERC allows:',
      allowedLabel: 'Allowed (2%)',
      allowedValue: '303 mmcm',
      allowedPct: 21,
      excessLabel: 'Beyond the allowance',
      excessValue: '1,133 mmcm',
      excessPct: 79,
      note: 'Four-fifths of the loss is gas the regulator never permitted Titas to lose.',
    },
    equivalence:
      'Two million homes could have cooked on that gas for a year. Titas supplies about 2.85 million households in all — so what leaked away or was stolen would have fed seven kitchens in every ten it serves.',
    working:
      'Working: Tk 3,000 crore ÷ 365 days ÷ 24 hours ÷ 60 minutes. 1,436 mmcm ÷ 365 = 3.93 mmcm a day (139 million cubic feet). Household figure = 1,436 mmcm ÷ 720 m³ — the year’s gas for a non-metered double-burner home at the 60 m³ a month BERC fixed in its 2022 tariff order — against the 2.853 million household connections Titas reports.',
  },

  /**
   * What the system costs an ordinary household.
   *
   * A non-metered home is billed for an assumed volume, not for what it burns.
   * Both sides of this comparison come from the same BERC order of June 2022 —
   * the 60 m³ assumption and the Tk 18/m³ metered rate — so it is like for like.
   * The 34 m³ actual comes from Prothom Alo's review of Titas's own prepaid-meter
   * records; it cross-checks exactly against the Tk 428 bill that article reports
   * at the then-current Tk 12.60/m³ metered rate.
   */
  household: {
    caption:
      'A home without a prepaid meter does not pay for the gas it burns. It pays a flat monthly bill for a volume BERC assumes it burns — and the assumption is generous.',
    billed: { label: 'What a non-metered home is billed for', volume: '60 m³ a month', amount: 'Tk 1,080' },
    actual: { label: 'What Titas’s own prepaid meters record', volume: '34 m³ a month', amount: 'Tk 612' },
    gap: { label: 'Paid for gas never burned', month: 'Tk 468 a month', year: 'Tk 5,616 a year' },
    /** The honest range — the two credible estimates of real consumption. */
    range:
      'How big the gap is depends on whose figure you take. BERC’s own technical committee put real double-burner use at about 50 m³ a month, which makes the overpayment Tk 180. Titas’s prepaid meters say 34 m³, which makes it Tk 468. On either number, the household is billed for 60.',
    aggregate:
      'About 2.43 million of Titas’s 2.85 million household connections still have no meter. Across all of them, the gap is worth somewhere between Tk 525 crore and Tk 1,365 crore a year — money collected for gas that was never delivered.',
    /** Titas's answer, included because the comparison has a real counter-argument. */
    rebuttal:
      'Titas’s answer, from a former managing director: BERC sets the price, not Titas — and prepaid customers use gas carefully precisely because they are metered, so comparing them with everyone else is unfair. That objection is real. It also concedes the point that nobody knows what an unmetered home actually burns.',
    sources: [
      { label: 'Prothom Alo — on Titas prepaid-meter records', url: 'https://en.prothomalo.com/business/local/residents-pay-tk-975-for-gas-worth-tk-500' },
      { label: 'TBS — BERC volumes & Titas’s petition', url: 'https://www.tbsnews.net/bangladesh/energy/titas-wants-47-hike-non-metred-domestic-gas-bills-631974' },
    ],
    working:
      'Working: 60 m³ − 34 m³ = 26 m³ a month, at the Tk 18/m³ metered rate BERC set in the same June 2022 order = Tk 468 a month, Tk 5,616 a year. Non-metered count = 2.853 million household connections less the roughly 420,000 prepaid meters installed to date.',
  },

  /** The numbered record on the full page. */
  record: [
    'Start with the simplest number in the accounts. Of all the gas Titas bought last year, close to one cubic metre in every ten never reached a paying customer. It leaked out of ageing pipes, or it was stolen — and Titas had already paid for it either way.',
    'For years, the number was not even real. Until 2022 Titas reported its system loss as 2% — not because anyone measured it, but because it "was kept at 2 per cent following a decision of the energy ministry." Titas officials have since admitted it was never actually calculated. When the government went and looked in 2022, it found something closer to 13%.',
    'Once the counting became honest, the line moved one way only. 5.28% in 2022-23. 7.67% in 2023-24. 9.47% in 2024-25. 10.13% in the first three months of this financial year. The limit the regulator allows is 2%.',
    'This is not a critic’s verdict — it is the auditor’s. ACNABIN, the firm that signs off Titas’s accounts, named the rise in system loss as a main reason the company’s finances are deteriorating, and spelled out the causes: illegal connections, leaks from old and corroded pipes, damage from other people’s digging, and the fact that nobody really knows how much gas non-metered households are using.',
    'Much of the network is older than the country. Most of the distribution pipe under Dhaka and Narayanganj was laid in 1968-69. By January 2025 Titas had got as far as preparing the paperwork to start replacing it — the tender had still not been floated.',
    'Management knows precisely what this costs, because it did the arithmetic in public. When the loss was running at 7%, managing director Shahnewaz Parvez put it at Tk 150–180 crore a month — Tk 1,800–2,160 crore a year. He reckoned roughly half was leaking pipe and roughly half was theft.',
    'He has also said, plainly, who is doing the stealing. "There are syndicates consisting of locals, contractors and some workers of Titas itself," he told The Daily Star. On the people behind the illegal lines: "Influential people are behind this — it is common knowledge."',
    'And yet the crackdown is getting smaller, not bigger. In 2024-25 Titas cut off 1.16 lakh illegal household lines and 576 business connections — down from 2.19 lakh and 683 the year before. Officials conceded the drives slowed for stretches of the year. The system loss went up anyway.',
    'None of this is news to the anti-corruption watchdog. In 2019 the ACC listed 22 separate ways money bleeds out of Titas: bribes for legal connections, tampered meters, illegal lines quietly reconnected after being cut, unauthorised lines run to boilers and generators — and, tellingly, "showing artificial system loss." In one year alone it found 118,455 illegal connections across five areas, with Tk 92.39 crore of bills that nobody ever collected.',
    'Nor did it stop with the change of government. The administration that took over in August 2024 replaced Titas’s management and called it one of the "most corrupt" organisations under the energy ministry. Seven months later the ACC was raiding two Dhanmondi restaurants over illegal lines it said had been arranged with the help of Titas staff.',
    'All of it lands in the accounts eventually. Titas lost money for the first time in 2022-23 — Tk 165 crore. Then Tk 744 crore. Then Tk 772 crore. That is Tk 1,680 crore in three years, from a company that used to be a dependable earner, and the dividend has fallen from 26% to 2%. In the year it lost Tk 744 crore, the board still paid shareholders Tk 49 crore out of past profits.',
    'Its own regulator is not persuaded either. When Titas asked to be allowed to earn more on every cubic metre it delivers, BERC went the other way — halving its margin to Tk 0.13 per cubic metre in the 2022 tariff order, against the roughly Tk 0.55 the company said it needed.',
  ],

  timeline: [
    { date: '1964', event: 'Titas Gas incorporated; becomes the monopoly piped-gas distributor for Dhaka and Mymensingh.' },
    { date: '1968–69', event: 'Most of Titas’s distribution pipeline is laid — and is still in service, leaking, today.' },
    { date: 'Apr 2019', event: 'ACC submits a report to the energy ministry identifying 22 sources of corruption at Titas.' },
    { date: '2022', event: 'BERC’s tariff order cuts the allowed distribution margin to Tk 0.13/m³ from Tk 0.25, and fixes non-metered domestic use at 60 m³ a month for a double burner.' },
    { date: 'FY2022-23', event: 'The first annual loss in the company’s history — Tk 165 crore. Reported system loss 5.28%.' },
    { date: 'FY2023-24', event: 'Loss trebles to Tk 744.08 crore; system loss 7.67% (1,204 mmcm, ≈Tk 2,945 crore). A 5% dividend is paid from retained earnings.' },
    { date: 'Sep 2024', event: 'Shahnewaz Parvez takes over as managing director on 10 September, after the change of government replaces Titas’s leadership.' },
    { date: 'Oct 2024', event: 'The managing director says system loss reached 13% that month.' },
    { date: 'Jan 2025', event: 'Tenders prepared — not yet floated — to replace the 1968-69 era pipelines in Dhaka and Narayanganj.' },
    { date: 'Mar 2025', event: 'ACC raids two Dhanmondi restaurants over illegal gas lines allegedly arranged with Titas officials’ collusion.' },
    { date: 'FY2024-25', event: 'Loss widens to Tk 772 crore; system loss 9.47%; dividend cut to 2%. The auditor names system loss as one of the primary reasons.' },
    { date: 'Q1 FY2025-26', event: 'System loss hits 10.13%; quarterly net loss Tk 249.25 crore, even as revenue rises 17% year on year to Tk 9,655 crore.' },
  ],

  figures: [
    { label: 'System loss', value: '9.47%', meaning: 'of all the gas Titas bought never reached a paying customer', against: 'the regulator allows 2%', asOf: 'FY2024-25', source: { label: 'TBS — on Titas’s audited FY25 accounts', url: 'https://www.tbsnews.net/economy/stocks/titas-gas-bleeds-tk1680cr-over-3-years-despite-turnaround-efforts-1271771' } },
    { label: 'And still climbing', value: '10.13%', meaning: 'the system loss in the latest quarter Titas has reported', against: 'was 8.63% a year earlier', asOf: 'Q1 FY2025-26', source: { label: 'Titas unaudited Q1 accounts, via TBS', url: 'https://www.tbsnews.net/economy/stocks/titas-gas-posts-tk249cr-loss-despite-revenue-rise-system-loss-jumps-1287336' } },
    { label: 'Gas that vanished', value: '1,436 mmcm', meaning: '15,154 mmcm came in, 13,718 mmcm was billed. This is the gap.', against: '1,204 mmcm the year before', asOf: 'FY2024-25', source: { label: 'TBS — on Titas’s audited FY25 accounts', url: 'https://www.tbsnews.net/economy/stocks/titas-gas-bleeds-tk1680cr-over-3-years-despite-turnaround-efforts-1271771' } },
    { label: 'What the auditor booked for it', value: 'Tk 2,422cr', meaning: 'charged as lost gas inside a single year’s cost of sales', against: 'up 34% in one year', asOf: 'FY2024-25', source: { label: 'ACNABIN audit report, via TBS', url: 'https://www.tbsnews.net/economy/stocks/titas-gas-bleeds-tk1680cr-over-3-years-despite-turnaround-efforts-1271771' } },
    { label: 'The number nobody measured', value: '2%', meaning: 'the system loss Titas reported every year until 2022 — set by ministry decision, never calculated', against: 'the government found 13%', asOf: 'to FY2021-22', source: { label: 'New Age', url: 'https://www.newagebd.net/post/power-energy/251496/titas-loses-tk-3000cr-amid-rising-system-losses-across-bangladesh' } },
    { label: 'What a household overpays', value: 'Tk 468', meaning: 'a month, billed for 60 m³ of gas when Titas’s own meters record 34 m³ burned', against: 'Tk 5,616 a year', asOf: 'BERC rates, 2022', source: { label: 'Prothom Alo — on Titas prepaid-meter records', url: 'https://en.prothomalo.com/business/local/residents-pay-tk-975-for-gas-worth-tk-500' } },
    { label: 'Homes with no meter', value: '2.43m', meaning: 'households billed on an assumption rather than a reading', against: 'of 2.85m connections', asOf: '2025', source: { label: 'TBS — Titas prepaid metering', url: 'https://www.tbsnews.net/bangladesh/energy/titas-aims-bring-82-household-under-prepaid-metering-5-years-692642' } },
    { label: 'Losses, three years running', value: 'Tk 1,680cr', meaning: 'Tk 165cr, then Tk 744cr, then Tk 772cr — from a company that used to be a dependable earner', against: 'first ever loss was FY2022-23', asOf: 'FY2024-25', source: { label: 'TBS — on Titas’s audited FY25 accounts', url: 'https://www.tbsnews.net/economy/stocks/titas-gas-bleeds-tk1680cr-over-3-years-despite-turnaround-efforts-1271771' } },
    { label: 'Loss per share, 9 months', value: '−Tk 6.21', meaning: 'what each of its 989 million shares has lost so far this year', against: '−2.52, −1.43, −2.26 by quarter', asOf: 'Jul 2025 – Mar 2026', source: { label: 'Dhaka Stock Exchange (TITASGAS)', url: 'https://www.dsebd.org/displayCompany.php?name=TITASGAS' } },
    { label: 'Dividend', value: '2%', meaning: 'paid for FY2024-25, in a year the company lost Tk 772 crore', against: 'was 26% in 2019 and 2020', asOf: 'FY2024-25', source: { label: 'Dhaka Stock Exchange (TITASGAS)', url: 'https://www.dsebd.org/displayCompany.php?name=TITASGAS' } },
    { label: 'What management says it costs', value: 'Tk 150–180cr', meaning: 'a month, the MD’s own estimate of what 7% system loss costs', against: 'Tk 1,800–2,160cr a year', asOf: 'Oct 2024', source: { label: 'UNB, via TBS', url: 'https://www.tbsnews.net/bangladesh/titas-gas-faces-major-challenge-service-delivery-7-system-loss-966521' } },
    { label: 'Illegal lines cut', value: '1.16 lakh', meaning: 'household connections severed — and the system loss rose anyway', against: 'was 2.19 lakh the year before', asOf: 'FY2024-25', source: { label: 'Industry Insider, on Petrobangla data', url: 'https://www.industryinsiderbd.com/article/gas-worth-tk-41-billion-lost-to-system-leaks-and-theft-in-fy25' } },
    { label: 'Ways money leaks out', value: '22', meaning: 'separate sources of graft the ACC identified at Titas — meter tampering, bribes for connections, "artificial system loss"', against: 'Tk 92.39cr unbilled in five areas alone', asOf: 'Apr 2019', source: { label: 'The Daily Star — on the ACC report', url: 'https://www.thedailystar.net/frontpage/news/plagued-corruption-acc-identifies-22-sources-graft-titas-including-illegal-connections-meter-1731214' } },
    { label: 'What Titas may earn per m³', value: 'Tk 0.13', meaning: 'the distribution margin its regulator allows it', against: 'halved from Tk 0.25; it asked for Tk 0.55', asOf: '2022', source: { label: 'TBS — on the BERC order', url: 'https://www.tbsnews.net/bangladesh/energy/halved-distribution-charge-hurt-profits-titas-gas-453710' } },
  ] satisfies TitasFigure[],
} as const;
