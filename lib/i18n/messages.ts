import type { SiteLocale } from '@/lib/locale';

export type MessageKey =
  | 'nav.home'
  | 'nav.account'
  | 'nav.login'
  | 'nav.latest'
  | 'nav.gridExplorer'
  | 'nav.magazine'
  | 'nav.search'
  | 'nav.latestNews'
  | 'nav.monthlyMagazine'
  | 'nav.searchArticles'
  | 'footer.editorialOffice'
  | 'footer.editorPublisher'
  | 'footer.email'
  | 'footer.officeAddress'
  | 'footer.advertising'
  | 'footer.officialChannels'
  | 'footer.explore'
  | 'footer.sectors'
  | 'footer.members'
  | 'footer.latestNews'
  | 'footer.allCategories'
  | 'footer.monthlyMagazine'
  | 'footer.gridExplorer'
  | 'footer.energyPolicy'
  | 'footer.lpgPrice'
  | 'footer.gridArchive'
  | 'footer.analysis'
  | 'footer.titasGas'
  | 'footer.search'
  | 'footer.copyright'
  | 'footer.tagline'
  | 'footer.about'
  | 'footer.contact'
  | 'footer.privacy'
  | 'footer.backToTop'
  | 'brand.kicker'
  | 'brand.lede'
  | 'brand.ledeEmPortal'
  | 'brand.ledeEmMagazine'
  | 'home.systemSnapshot'
  | 'home.powerSector'
  | 'home.powerSectorSub'
  | 'coverage.title'
  | 'coverage.allCoverage'
  | 'coverage.allDescription'
  | 'coverage.categoryDescription'
  | 'coverage.browseArchive'
  | 'coverage.oneCategory'
  | 'coverage.nCategories'
  | 'coverage.noArticles'
  | 'coverage.viewAllIn'
  | 'categories.title'
  | 'categories.subtitle'
  | 'categories.articles'
  | 'categories.empty'
  | 'categories.footer'
  | 'categories.allCategories'
  | 'categories.latestAnalysis'
  | 'categories.noPublished'
  | 'articles.kicker'
  | 'articles.title'
  | 'articles.subtitle'
  | 'articles.advancedSearch'
  | 'articles.allCategories'
  | 'articles.filterBy'
  | 'articles.showing'
  | 'articles.of'
  | 'articles.loadMore'
  | 'articles.trending'
  | 'articles.latest'
  | 'articles.mostRead'
  | 'articles.page'
  | 'articles.previous'
  | 'articles.next'
  | 'search.title'
  | 'search.subtitle'
  | 'home.trendingWeek'
  | 'home.trendingKicker'
  | 'home.trendingViewAll'
  | 'home.noTrending'
  | 'home.monthlyMagazine'
  | 'home.readIssue'
  | 'home.trendingAlso'
  | 'home.trendingWindow'
  | 'home.trendingWeekShort'
  | 'home.gridExplorerBlurb'
  | 'home.gridExplorerCta'
  | 'home.browseAllNews'
  | 'home.aboutKicker'
  | 'home.aboutTitle'
  | 'home.aboutLead'
  | 'home.aboutAudience'
  | 'home.aboutPillarCoverage'
  | 'home.aboutPillarCoverageDesc'
  | 'home.aboutPillarPolicy'
  | 'home.aboutPillarPolicyDesc'
  | 'home.aboutPillarMagazine'
  | 'home.aboutPillarMagazineDesc'
  | 'home.aboutLearnMore'
  | 'home.aboutEditor'
  | 'about.missionTitle'
  | 'about.missionP1'
  | 'about.missionP2'
  | 'about.teamTitle'
  | 'about.teamSub'
  | 'about.ctaTitle'
  | 'about.ctaNews'
  | 'about.ctaContact'
  | 'common.min'
  | 'common.views'
  | 'common.viewsThisWeek'
  | 'common.esbStaff'
  | 'common.all'
  | 'common.close'
  | 'locale.toggle'
  | 'ticker.energyMarkets'
  | 'ticker.dseLive'
  | 'ticker.live'
  | 'ticker.indicative'
  | 'ticker.commodities'
  | 'ticker.dse'
  | 'sort.label'
  | 'sort.latest'
  | 'sort.mostViewed'
  | 'sort.latestShort'
  | 'sort.mostViewedShort'
  | 'search.placeholder'
  | 'search.resultsFor'
  | 'search.publishedCount'
  | 'search.noResults'
  | 'carousel.noFeatured'
  | 'carousel.readStory'
  | 'carousel.previous'
  | 'carousel.next'
  | 'carousel.pause'
  | 'carousel.play'
  | 'carousel.browseAll'
  | 'carousel.byAuthor'
  | 'carousel.minRead'
  | 'carousel.storiesMarkets'
  | 'placement.featured'
  | 'placement.breaking'
  | 'placement.pinned'
  | 'placement.trending'
  | 'interviews.kicker'
  | 'interviews.title'
  | 'interviews.watchAll'
  | 'interviews.close'
  | 'interviews.noVideo'
  | 'interviews.watchFull'
  | 'interviews.openOnFacebook'
  | 'interviews.openOnYoutube'
  | 'member.loading'
  | 'member.guestPitch'
  | 'member.login'
  | 'member.staffNote'
  | 'member.signedInMember'
  | 'member.signedInStaff'
  | 'member.manageAccount'
  | 'member.staffSignIn'
  | 'energy.simulated'
  | 'energy.indicative'
  | 'portal.todayEdition'
  | 'portal.mastheadTagline'
  | 'portal.breaking'
  | 'portal.latestHeadlines'
  | 'portal.marketPulse'
  | 'portal.topStories'
  | 'portal.viewAllNews'
  | 'portal.energyDeskKicker'
  | 'portal.sectorWatchKicker'
  | 'portal.sectorWatch'
  | 'portal.allSectors'
  | 'portal.newsWireKicker'
  | 'portal.newsWire'
  | 'portal.newsWireSub'
  | 'portal.emptySlot';

const EN: Record<MessageKey, string> = {
  'nav.home': 'Home',
  'nav.account': 'Account',
  'nav.login': 'Login',
  'nav.latest': 'Latest',
  'nav.gridExplorer': 'Grid Explorer',
  'nav.magazine': 'Magazine',
  'nav.search': 'Search',
  'nav.latestNews': 'Latest News',
  'nav.monthlyMagazine': 'Monthly Magazine',
  'nav.searchArticles': 'Search Articles',
  'footer.editorialOffice': 'Editorial & Office',
  'footer.editorPublisher': 'Editor & Publisher',
  'footer.email': 'E-mail',
  'footer.officeAddress': 'Office Address',
  'footer.advertising': 'Advertising Department',
  'footer.officialChannels': 'Official channels',
  'footer.explore': 'Explore',
  'footer.sectors': 'Sectors',
  'footer.members': 'Members',
  'footer.latestNews': 'Latest News',
  'footer.allCategories': 'All Categories',
  'footer.monthlyMagazine': 'Monthly Magazine',
  'footer.gridExplorer': 'Grid Explorer',
  'footer.energyPolicy': 'Energy Policy Library',
  'footer.lpgPrice': 'LPG Price (BERC)',
  'footer.gridArchive': 'Grid Archive since 2013',
  'footer.analysis': 'Event Studies',
  'footer.titasGas': 'Titas Gas Record',
  'footer.search': 'Search',
  'footer.copyright': '© {year} ESB PowerLine. All rights reserved.',
  'footer.tagline':
    'Authoritative coverage for utilities, regulators, IPPs, investors and policymakers.',
  'footer.about': 'About Us',
  'footer.contact': 'Contact ESB',
  'footer.privacy': 'Privacy',
  'footer.backToTop': 'Back to Top',
  'brand.kicker': 'News portal & magazine',
  'brand.lede':
    "{portal} and the {magazine} — daily reporting, sector data, and analysis from generation and grid to policy and projects.",
  'brand.ledeEmPortal': "Bangladesh's power sector news portal",
  'brand.ledeEmMagazine': 'ESB PowerLine monthly magazine',
  'home.systemSnapshot': 'System Snapshot',
  'home.powerSector': 'Featured News',
  'home.powerSectorSub': 'Handpicked stories and latest coverage from across all sectors.',
  'coverage.title': 'Sector Coverage',
  'coverage.allCoverage': 'All News',
  'coverage.allDescription': 'Latest stories across all {count} power sector categories.',
  'coverage.categoryDescription': 'Latest {category} coverage and analysis.',
  'coverage.browseArchive': 'Browse full archive',
  'coverage.oneCategory': '1 category',
  'coverage.nCategories': '{count} categories',
  'coverage.noArticles': 'No recent articles in this category.',
  'coverage.viewAllIn': 'View all in {label}',
  'categories.title': 'Power Sector Categories',
  'categories.subtitle':
    "Focused coverage across Bangladesh's energy value chain. Click any sector for dedicated reporting, analysis and data.",
  'categories.articles': '{count} articles',
  'categories.empty': 'No categories configured yet.',
  'categories.footer': '{count} sectors • Daily updates • In-depth analysis and project trackers',
  'categories.allCategories': '← All categories',
  'categories.latestAnalysis': 'Latest analysis, projects and policy updates for this sector.',
  'categories.noPublished': 'No published articles in this category yet. Check back soon.',
  'articles.kicker': 'Newsroom',
  'articles.title': 'Latest News',
  'articles.subtitle': 'Power & energy sector coverage for Bangladesh',
  'articles.advancedSearch': 'Advanced Search',
  'articles.allCategories': 'All categories',
  'articles.filterBy': 'Filter by category',
  'articles.showing': 'Showing',
  'articles.of': 'of',
  'articles.loadMore': 'Load more articles',
  'articles.trending': 'Trending',
  'articles.latest': 'Latest',
  'articles.mostRead': 'Most read',
  'articles.page': 'Page',
  'articles.previous': 'Previous',
  'articles.next': 'Next',
  'search.title': 'Search',
  'search.subtitle': 'Search titles, excerpts, and categories from live published content.',
  'home.trendingWeek': 'Trending this week',
  'home.trendingKicker': 'Most read',
  'home.trendingViewAll': 'All stories',
  'home.noTrending': 'No trending articles yet — publish stories to populate this list.',
  'home.monthlyMagazine': 'Monthly Magazine',
  'home.readIssue': 'Read {label} Issue',
  'home.trendingAlso': 'Also trending',
  'home.trendingWindow': '7-day reads',
  'home.trendingWeekShort': 'Trending',
  'home.gridExplorerBlurb':
    'Generation mix, transmission corridors, demand curves and project pipelines — interactive sector data.',
  'home.gridExplorerCta': 'Open Grid Explorer',
  'home.browseAllNews': 'Browse archive',
  'home.aboutKicker': 'Editorial identity',
  'home.aboutTitle': 'About ESB PowerLine',
  'home.aboutLead':
    "Bangladesh's dedicated energy news wire — daily reporting, sector data, and analysis for the professionals shaping the power value chain.",
  'home.aboutAudience': 'Utilities · Regulators · IPPs · Investors · Policymakers',
  'home.aboutPillarCoverage': 'Authoritative coverage',
  'home.aboutPillarCoverageDesc':
    'Comprehensive updates from ministries, utilities, IPPs, and stakeholders across the energy value chain.',
  'home.aboutPillarPolicy': 'Policy & regulatory focus',
  'home.aboutPillarPolicyDesc':
    'BERC tariff orders, Ministry masterplans, cross-border imports, and public hearings — tracked in detail.',
  'home.aboutPillarMagazine': 'Monthly magazine',
  'home.aboutPillarMagazineDesc':
    'Deep dives, sector data reports, project checklists, and executive interviews in our digital print edition.',
  'home.aboutLearnMore': 'Our story & team',
  'home.aboutEditor': 'Farid Uddin Ahmed — Editor & Publisher',
  'about.missionTitle': 'Our Mission',
  'about.missionP1':
    "Founded with the commitment to provide accurate and timely energy journalism, ESB PowerLine stands as a primary beacon for Bangladesh's power and energy sectors. We bring transparent visibility into capacity management, fuel supply realities, tariff reform, and the transition toward clean, sustainable energy options.",
  'about.missionP2':
    'Our publications, both in digital news wire formats and our monthly subscription-based magazine, are curated for utility executives, regulatory officers, IPP investors, policy analysts, and stakeholders shaping the nation\'s energy future.',
  'about.teamTitle': 'Publishing & Operations Team',
  'about.teamSub':
    "Meet the professionals managing Bangladesh's premier energy news wire, quarterly data briefs, and monthly magazine.",
  'about.ctaTitle': 'Ready to explore further?',
  'about.ctaNews': 'Read Latest News',
  'about.ctaContact': 'Get in Touch',
  'common.min': 'min',
  'common.views': 'views',
  'common.viewsThisWeek': 'views this week',
  'common.esbStaff': 'ESB Staff',
  'common.all': 'All',
  'common.close': 'Close',
  'locale.toggle': 'Language',
  'ticker.energyMarkets': 'Energy Markets',
  'ticker.dseLive': 'DSE Live',
  'ticker.live': 'Live',
  'ticker.indicative': 'Indicative',
  'ticker.commodities': 'Commodities',
  'ticker.dse': 'DSE',
  'sort.label': 'Sort',
  'sort.latest': 'Latest First',
  'sort.mostViewed': 'Most Viewed',
  'sort.latestShort': 'Latest',
  'sort.mostViewedShort': 'Most Viewed',
  'search.placeholder': 'Search power sector news...',
  'search.resultsFor': '{count} results for “{query}”',
  'search.publishedCount': '{count} published articles',
  'search.noResults': 'No articles match your search.',
  'carousel.noFeatured': 'No featured stories currently available.',
  'carousel.readStory': 'Read story',
  'carousel.previous': 'Previous story',
  'carousel.next': 'Next story',
  'carousel.pause': 'Pause carousel',
  'carousel.play': 'Play carousel',
  'carousel.browseAll': 'Browse all news',
  'carousel.byAuthor': '{author}',
  'carousel.minRead': '{minutes} min read',
  'carousel.storiesMarkets': 'Stories & markets',
  'placement.featured': 'Featured',
  'placement.breaking': 'Breaking',
  'placement.pinned': 'Pinned',
  'placement.trending': 'Trending',
  'interviews.kicker': 'In conversation',
  'interviews.title': 'Latest Interviews',
  'interviews.watchAll': 'Watch all on YouTube',
  'interviews.close': 'Close interview player',
  'interviews.noVideo': 'This interview does not have a playable video yet.',
  'interviews.watchFull': 'Watch the full conversation on our YouTube channel.',
  'interviews.openOnFacebook': 'Watch full on Facebook',
  'interviews.openOnYoutube': 'Watch full on YouTube',
  'member.loading': 'Loading member access…',
  'member.guestPitch':
    'Sign in to save articles and magazine issues, download data packages, join discussions, and unlock in-depth analysis across the power sector.',
  'member.login': 'Member login',
  'member.staffNote': 'Editorial staff and administrators use the same sign-in with assigned roles.',
  'member.signedInMember':
    "You're signed in as {name}. Open your library for saved articles, magazine archive, downloads, and comments.",
  'member.signedInStaff':
    'Signed in as {name} (staff). Member library is for subscriber accounts — use your staff workspace for editorial tools.',
  'member.manageAccount': 'Manage your account from the library → Account section.',
  'member.staffSignIn': 'Staff sign in',
  'energy.simulated': 'Simulated telemetry (dev)',
  'energy.indicative': 'Indicative snapshot',
  'portal.todayEdition': "Today's edition",
  'portal.mastheadTagline':
    'Energy-first reporting with markets, policy, grid data — and the stories beyond the sector that keep Bangladesh reading.',
  'portal.breaking': 'Breaking',
  'portal.latestHeadlines': 'Latest headlines',
  'portal.marketPulse': 'Market pulse',
  'portal.topStories': 'Top stories',
  'portal.viewAllNews': 'View all news',
  'portal.energyDeskKicker': 'Energy desk',
  'portal.sectorWatchKicker': 'Sector watch',
  'portal.sectorWatch': 'Across the power value chain',
  'portal.allSectors': 'All sectors',
  'portal.newsWireKicker': 'News wire',
  'portal.newsWire': 'Latest from the desk',
  'portal.newsWireSub': 'Recent stories across the power sector and beyond.',
  'portal.emptySlot': 'Assign a story in admin → Coverage',
};

const BN: Record<MessageKey, string> = {
  'nav.home': 'হোম',
  'nav.account': 'অ্যাকাউন্ট',
  'nav.login': 'প্রবেশ',
  'nav.latest': 'সর্বশেষ',
  'nav.gridExplorer': 'গ্রিড তথ্য',
  'nav.magazine': 'ম্যাগাজিন',
  'nav.search': 'খুঁজুন',
  'nav.latestNews': 'সর্বশেষ সংবাদ',
  'nav.monthlyMagazine': 'মাসিক ম্যাগাজিন',
  'nav.searchArticles': 'সংবাদ খুঁজুন',
  'footer.editorialOffice': 'সম্পাদকীয় ও অফিস',
  'footer.editorPublisher': 'সম্পাদক ও প্রকাশক',
  'footer.email': 'ই-মেইল',
  'footer.officeAddress': 'অফিসের ঠিকানা',
  'footer.advertising': 'বিজ্ঞাপন বিভাগ',
  'footer.officialChannels': 'অফিসিয়াল চ্যানেল',
  'footer.explore': 'আরও দেখুন',
  'footer.sectors': 'খাতসমূহ',
  'footer.members': 'সদস্য',
  'footer.latestNews': 'সর্বশেষ সংবাদ',
  'footer.allCategories': 'সব খাত',
  'footer.monthlyMagazine': 'মাসিক ম্যাগাজিন',
  'footer.gridExplorer': 'গ্রিড তথ্য',
  'footer.energyPolicy': 'জ্বালানি নীতি সংগ্রহ',
  'footer.lpgPrice': 'এলপিজির দাম (বিইআরসি)',
  'footer.gridArchive': 'গ্রিড আর্কাইভ (২০১৩ থেকে)',
  'footer.analysis': 'ঘটনা বিশ্লেষণ',
  'footer.titasGas': 'তিতাস গ্যাসের হিসাব',
  'footer.search': 'খুঁজুন',
  'footer.copyright': '© {year} ইএসবি পাওয়ারলাইন। সর্বস্বত্ব সংরক্ষিত।',
  'footer.tagline':
    'বিদ্যুৎ কোম্পানি, নিয়ন্ত্রক সংস্থা, আইপিপি, বিনিয়োগকারী ও নীতিনির্ধারকদের জন্য নির্ভরযোগ্য সংবাদ ও বিশ্লেষণ।',
  'footer.about': 'আমাদের সম্পর্কে',
  'footer.contact': 'যোগাযোগ',
  'footer.privacy': 'গোপনীয়তা',
  'footer.backToTop': 'উপরে যান',
  'brand.kicker': 'সংবাদ পোর্টাল ও ম্যাগাজিন',
  'brand.lede':
    '{portal} এবং {magazine} — উৎপাদন ও জাতীয় গ্রিড থেকে নীতি-নিয়ন্ত্রণ ও প্রকল্প পর্যন্ত দৈনিক সংবাদ, খাতভিত্তিক তথ্য ও বিশ্লেষণ।',
  'brand.ledeEmPortal': 'বাংলাদেশের বিদ্যুৎ খাতের সংবাদ পোর্টাল',
  'brand.ledeEmMagazine': 'ইএসবি পাওয়ারলাইন মাসিক ম্যাগাজিন',
  'home.systemSnapshot': 'বিদ্যুৎ পরিস্থিতি',
  'home.powerSector': 'নির্বাচিত সংবাদ',
  'home.powerSectorSub': 'সব খাতের বাছাইকৃত ও সর্বশেষ সংবাদ ও প্রতিবেদন।',
  'coverage.title': 'খাতভিত্তিক সংবাদ',
  'coverage.allCoverage': 'সকল সংবাদ',
  'coverage.allDescription': 'বিদ্যুৎ খাতের {count}টি শ্রেণিতে সর্বশেষ প্রতিবেদন।',
  'coverage.categoryDescription': '{category} — সর্বশেষ সংবাদ ও বিশ্লেষণ।',
  'coverage.browseArchive': 'পুরনো সংবাদ দেখুন',
  'coverage.oneCategory': '১টি খাত',
  'coverage.nCategories': '{count}টি খাত',
  'coverage.noArticles': 'এই খাতে সাম্প্রতিক কোনো সংবাদ নেই।',
  'coverage.viewAllIn': '{label} — সব সংবাদ',
  'categories.title': 'বিদ্যুৎ খাতের শ্রেণি',
  'categories.subtitle':
    'বাংলাদেশের বিদ্যুৎ ও জ্বালানি মূল্যশৃঙ্খল জুড়ে খাতভিত্তিক সংবাদ। প্রতিবেদন, বিশ্লেষণ ও তথ্যের জন্য যেকোনো খাতে ক্লিক করুন।',
  'categories.articles': '{count}টি সংবাদ',
  'categories.empty': 'এখনও কোনো খাত যোগ করা হয়নি।',
  'categories.footer': '{count}টি খাত • প্রতিদিন আপডেট • বিশ্লেষণ ও প্রকল্প খবর',
  'categories.allCategories': '← সব খাত',
  'categories.latestAnalysis': 'এই খাতের সর্বশেষ বিশ্লেষণ, প্রকল্প ও নীতি সংবাদ।',
  'categories.noPublished': 'এই খাতে এখনও প্রকাশিত সংবাদ নেই। কিছুদিন পর আবার দেখুন।',
  'articles.kicker': 'নিউজরুম',
  'articles.title': 'সর্বশেষ সংবাদ',
  'articles.subtitle': 'বাংলাদেশের বিদ্যুৎ ও জ্বালানি খাতের সংবাদ',
  'articles.advancedSearch': 'বিস্তারিত খোঁজ',
  'articles.allCategories': 'সব খাত',
  'articles.filterBy': 'খাত অনুযায়ী',
  'articles.showing': 'দেখানো হচ্ছে',
  'articles.of': 'এর মধ্যে',
  'articles.loadMore': 'আরও সংবাদ দেখুন',
  'articles.trending': 'আলোচিত',
  'articles.latest': 'সর্বশেষ',
  'articles.mostRead': 'সর্বাধিক পঠিত',
  'articles.page': 'পৃষ্ঠা',
  'articles.previous': 'আগের',
  'articles.next': 'পরের',
  'search.title': 'খুঁজুন',
  'search.subtitle': 'প্রকাশিত শিরোনাম, সারাংশ ও খাত থেকে সংবাদ খুঁজুন।',
  'home.trendingWeek': 'সপ্তাহের আলোচিত',
  'home.trendingKicker': 'সর্বাধিক পঠিত',
  'home.trendingViewAll': 'সব সংবাদ',
  'home.noTrending': 'এখনও কোনো আলোচিত সংবাদ নেই।',
  'home.monthlyMagazine': 'মাসিক ম্যাগাজিন',
  'home.readIssue': '{label} সংখ্যা পড়ুন',
  'home.trendingAlso': 'আরও আলোচিত',
  'home.trendingWindow': '৭ দিনের পাঠ',
  'home.trendingWeekShort': 'আলোচিত',
  'home.gridExplorerBlurb':
    'উৎপাদন মিক্স, ট্রান্সমিশন লাইন, চাহিদা ও প্রকল্পের তথ্য — ইন্টারঅ্যাক্টিভ গ্রিড ড্যাশবোর্ড।',
  'home.gridExplorerCta': 'গ্রিড তথ্য দেখুন',
  'home.browseAllNews': 'সব সংবাদ দেখুন',
  'home.aboutKicker': 'সম্পাদকীয় পরিচিতি',
  'home.aboutTitle': 'ইএসবি পাওয়ারলাইন সম্পর্কে',
  'home.aboutLead':
    'বাংলাদেশের নিবেদিত বিদ্যুৎ সংবাদ ওয়্যার — বিদ্যুৎ মূল্যশৃঙ্খলা গঠনকারী পেশাদারদের জন্য দৈনিক প্রতিবেদন, খাতভিত্তিক তথ্য ও বিশ্লেষণ।',
  'home.aboutAudience': 'বিদ্যুৎ কোম্পানি · নিয়ন্ত্রক · আইপিপি · বিনিয়োগকারী · নীতিনির্ধারক',
  'home.aboutPillarCoverage': 'নির্ভরযোগ্য সংবাদ',
  'home.aboutPillarCoverageDesc':
    'মন্ত্রণালয়, বিদ্যুৎ কোম্পানি, আইপিপি ও সংশ্লিষ্ট স্টেকহোল্ডারদের বিদ্যুৎ মূল্যশৃঙ্খলা জুড়ে বিস্তৃত আপডেট।',
  'home.aboutPillarPolicy': 'নীতি ও নিয়ন্ত্রণ',
  'home.aboutPillarPolicyDesc':
    'বিইআরসি ট্যারিফ, মন্ত্রণালয়ের মাস্টারপ্ল্যান, সীমান্তপার্শ্ব আমদানি ও জনশুনানি — বিস্তারিত অনুসরণ।',
  'home.aboutPillarMagazine': 'মাসিক ম্যাগাজিন',
  'home.aboutPillarMagazineDesc':
    'গভীর বিশ্লেষণ, খাতভিত্তিক তথ্য, প্রকল্প চেকলিস্ট ও নির্বাহী সাক্ষাৎকার — ডিজিটাল প্রিন্ট সংস্করণে।',
  'home.aboutLearnMore': 'আমাদের গল্প ও দল',
  'home.aboutEditor': 'ফরিদ উদ্দিন আহমেদ — সম্পাদক ও প্রকাশক',
  'about.missionTitle': 'আমাদের লক্ষ্য',
  'about.missionP1':
    'নির্ভুল ও সময়োপযোগী বিদ্যুৎ সাংবাদিকতার প্রতিশ্রুতি নিয়ে প্রতিষ্ঠিত ইএসবি পাওয়ারলাইন বাংলাদেশের বিদ্যুৎ ও জ্বালানি খাতের প্রধান সংবাদ উৎস। আমরা উৎপাদন ক্ষমতা, জ্বালানি সরবরাহ, ট্যারিফ সংস্কার ও পরিষ্কার-টেকসই জ্বালানিতে রূপান্তরের স্বচ্ছ তথ্য সরবরাহ করি।',
  'about.missionP2':
    'ডিজিটাল নিউজ ওয়্যার ও মাসিক সাবস্ক্রিপশন ম্যাগাজিন — উভয়ই বিদ্যুৎ কোম্পানির নির্বাহী, নিয়ন্ত্রক কর্মকর্তা, আইপিপি বিনিয়োগকারী, নীতি বিশ্লেষক ও জাতীয় জ্বালানি ভবিষ্যৎ গঠনকারীদের জন্য তৈরি।',
  'about.teamTitle': 'প্রকাশনা ও পরিচালনা দল',
  'about.teamSub':
    'বাংলাদেশের শীর্ষস্থানীয় বিদ্যুৎ সংবাদ ওয়্যার, ত্রৈমাসিক তথ্য ব্রিফ ও মাসিক ম্যাগাজিন পরিচালনাকারী পেশাদারদের সাথে পরিচিত হন।',
  'about.ctaTitle': 'আরও জানতে চান?',
  'about.ctaNews': 'সর্বশেষ সংবাদ পড়ুন',
  'about.ctaContact': 'যোগাযোগ করুন',
  'common.min': 'মিনিট',
  'common.views': 'পাঠ',
  'common.viewsThisWeek': 'পাঠ এই সপ্তাহে',
  'common.esbStaff': 'ইএসবি রিপোর্টার',
  'common.all': 'সব',
  'common.close': 'বন্ধ করুন',
  'locale.toggle': 'ভাষা',
  'ticker.energyMarkets': 'জ্বালানি বাজার',
  'ticker.dseLive': 'ডিএসই লাইভ',
  'ticker.live': 'লাইভ',
  'ticker.indicative': 'আনুমানিক',
  'ticker.commodities': 'পণ্যসমূহ',
  'ticker.dse': 'ডিএসই',
  'sort.label': 'সাজান',
  'sort.latest': 'নতুন আগে',
  'sort.mostViewed': 'সর্বাধিক পঠিত',
  'sort.latestShort': 'সর্বশেষ',
  'sort.mostViewedShort': 'সর্বাধিক পঠিত',
  'search.placeholder': 'বিদ্যুৎ খাতের সংবাদ খুঁজুন...',
  'search.resultsFor': '“{query}” — {count}টি ফলাফল',
  'search.publishedCount': '{count}টি প্রকাশিত সংবাদ',
  'search.noResults': 'আপনার খোঁজের সঙ্গে মিলে এমন সংবাদ নেই।',
  'carousel.noFeatured': 'এখন কোনো বিশেষ সংবাদ নেই।',
  'carousel.readStory': 'সংবাদ পড়ুন',
  'carousel.previous': 'আগের সংবাদ',
  'carousel.next': 'পরের সংবাদ',
  'carousel.pause': 'স্লাইড বিরতি',
  'carousel.play': 'স্লাইড চালু',
  'carousel.browseAll': 'সব সংবাদ দেখুন',
  'carousel.byAuthor': '{author}',
  'carousel.minRead': '{minutes} মিনিট পড়া',
  'carousel.storiesMarkets': 'সংবাদ ও বাজার',
  'placement.featured': 'নির্বাচিত সংবাদ',
  'placement.breaking': 'ব্রেকিং নিউজ',
  'placement.pinned': 'পিন করা হয়েছে',
  'placement.trending': 'ট্রেন্ডিং',
  'interviews.kicker': 'সাক্ষাৎকারে',
  'interviews.title': 'সর্বশেষ সাক্ষাৎকার',
  'interviews.watchAll': 'ইউটিউবে সব দেখুন',
  'interviews.close': 'সাক্ষাৎকার বন্ধ করুন',
  'interviews.noVideo': 'এই সাক্ষাৎকারের ভিডিও এখনও যুক্ত হয়নি।',
  'interviews.watchFull': 'সম্পূর্ণ সাক্ষাৎকার ইউটিউব চ্যানেলে দেখুন।',
  'interviews.openOnFacebook': 'ফেসবুকে সম্পূর্ণ দেখুন',
  'interviews.openOnYoutube': 'ইউটিউবে সম্পূর্ণ দেখুন',
  'member.loading': 'সদস্য প্রবেশ যাচাই হচ্ছে…',
  'member.guestPitch':
    'সংবাদ ও ম্যাগাজিন সংরক্ষণ, তথ্য ডাউনলোড, মতামত ও গভীর বিশ্লেষণের জন্য সদস্য হিসেবে প্রবেশ করুন।',
  'member.login': 'সদস্য প্রবেশ',
  'member.staffNote': 'সম্পাদকীয় কর্মী ও প্রশাসক একই প্রবেশপথ ব্যবহার করেন।',
  'member.signedInMember':
    'আপনি {name} হিসেবে প্রবেশ করেছেন। সংরক্ষিত সংবাদ, ম্যাগাজিন, ডাউনলোড ও মন্তব্যের জন্য লাইব্রেরি খুলুন।',
  'member.signedInStaff':
    '{name} (স্টাফ) হিসেবে প্রবেশ। সদস্য লাইব্রেরি গ্রাহকদের জন্য — সম্পাদনার কাজ স্টাফ ওয়ার্কস্পেসে করুন।',
  'member.manageAccount': 'লাইব্রেরি → অ্যাকাউন্ট থেকে সেটিংস পরিচালনা করুন।',
  'member.staffSignIn': 'স্টাফ প্রবেশ',
  'energy.simulated': 'পরীক্ষামূলক তথ্য (ডেভ)',
  'energy.indicative': 'আনুমানিক তথ্য',
  'portal.todayEdition': 'আজকের সংবাদ',
  'portal.mastheadTagline':
    'বিদ্যুৎ-কেন্দ্রিক সংবাদ — বাজার, নীতি, গ্রিড তথ্য এবং খাতের বাইরের গল্প, যা পাঠককে আবার ফিরিয়ে আনে।',
  'portal.breaking': 'জরুরি সংবাদ',
  'portal.latestHeadlines': 'সর্বশেষ শিরোনাম',
  'portal.marketPulse': 'বাজারের অবস্থা',
  'portal.topStories': 'শীর্ষ সংবাদ',
  'portal.viewAllNews': 'সব সংবাদ দেখুন',
  'portal.energyDeskKicker': 'বিদ্যুৎ ডেস্ক',
  'portal.sectorWatchKicker': 'খাত পর্যবেক্ষণ',
  'portal.sectorWatch': 'বিদ্যুৎ মূল্যশৃঙ্খল জুড়ে',
  'portal.allSectors': 'সব খাত',
  'portal.newsWireKicker': 'তাজা খবর',
  'portal.newsWire': 'ডেস্ক থেকে সর্বশেষ',
  'portal.newsWireSub': 'বিদ্যুৎ খাত ও সংশ্লিষ্ট বিষয়ের সাম্প্রতিক সংবাদ।',
  'portal.emptySlot': 'অ্যাডমিন → কভারেজ থেকে সংবাদ বেছে নিন',
};

const MESSAGES: Record<SiteLocale, Record<MessageKey, string>> = { en: EN, bn: BN };

export function translate(
  locale: SiteLocale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let text = MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function createTranslator(locale: SiteLocale) {
  return (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars);
}
