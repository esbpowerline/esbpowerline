import Link from 'next/link';
import { Award, ShieldCheck, FileText, Users, ArrowRight, Quote, CheckCircle2, ChevronDown, Briefcase, Newspaper, MonitorCog, Palette, UserRound } from 'lucide-react';
import { getServerSiteLocale } from '@/lib/locale-server';
import { createTranslator } from '@/lib/i18n/messages';
import { ScrollGeometryBackdrop } from '@/components/shared/ScrollGeometryBackdrop';

export const revalidate = 86400;

export default async function AboutPage() {
  const locale = await getServerSiteLocale();
  const t = createTranslator(locale);

  return (
    <div className="relative min-h-screen overflow-hidden isolate">
      {/* Background dot pattern texture with a fade mask */}
      <div 
        className="absolute inset-0 hero-dot-pattern opacity-60 pointer-events-none -z-20"
        style={{ 
          maskImage: 'radial-gradient(ellipse at top, black, transparent)', 
          WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent)' 
        }} 
      />
      
      {/* Background glow decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* Subtle mathematical geometry backdrop with parallax scroll and dynamic animations */}
      <ScrollGeometryBackdrop />
      
      <div className="container container--shell py-10 md:py-14 max-w-4xl mx-auto space-y-10 md:space-y-14 relative z-10">
        
        {/* SECTION 1: Hero Header */}
        <section className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20">
            {t('brand.kicker')}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-foreground leading-none">
            ESB PowerLine
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
            {t('portal.mastheadTagline')}
          </p>
        </section>

        {/* SECTION 2: Pillars Feature Grid */}
        <section className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="card p-5 border border-border/40 bg-card/25 rounded-2xl hover:border-rose-500/30 hover:bg-card/30 transition-all duration-300 group hover:shadow-lg hover:shadow-rose-500/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-foreground leading-none">
                  Authoritative Coverage
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Serving the energy value chain with comprehensive updates from ministries, utilities, IPPs, and stakeholders.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-5 border border-border/40 bg-card/25 rounded-2xl hover:border-primary/30 hover:bg-card/30 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-foreground leading-none">
                  Policy & Regulatory Focus
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Detailed tracking of BERC tariff orders, Ministry masterplans, cross-border imports, and public hearings.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-5 border border-border/40 bg-card/25 rounded-2xl hover:border-blue-500/30 hover:bg-card/30 transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base text-foreground leading-none">
                  Monthly Magazine
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Deep dives, sector data reports, project checklists, and executive interviews in our digital print edition.
              </p>
            </div>

          </div>
        </section>

        {/* SECTION 3: Brand Mission */}
        <section className="grid md:grid-cols-3 gap-8 border border-border/40 bg-gradient-to-br from-card/10 to-transparent rounded-3xl p-8 md:p-10 shadow-sm items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-bl-full blur-2xl pointer-events-none" />
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Our Mission
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base font-light">
              <p>
                Founded with the commitment to provide accurate and timely energy journalism, 
                <strong> ESB PowerLine</strong> stands as a primary beacon for Bangladesh's power and energy sectors. 
                We bring transparent visibility into capacity management, fuel supply realities, tariff reform, 
                and the transition toward clean, sustainable energy options.
              </p>
              <p>
                Our publications, both in digital news wire formats and our monthly subscription-based magazine, 
                are curated for utility executives, regulatory officers, IPP investors, policy analysts, and 
                stakeholders shaping the nation's energy future.
              </p>
            </div>
          </div>
          
          <div className="bg-card/25 border border-border/30 rounded-2xl p-5 space-y-4 backdrop-blur-sm self-stretch flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-display font-bold text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Editorial Code</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                We strictly adhere to a rigorous verification standard, ensuring every sector brief is cross-checked with official databases.
              </p>
            </div>
            
            <ul className="space-y-2 border-t border-border/20 pt-4 text-xs font-light text-foreground/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Verified Data Curation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Regulatory Transparency</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Independent Journalism</span>
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 4: Leadership & Publishing Team */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-foreground">
              Publishing & Operations Team
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto font-light leading-relaxed">
              Meet the professionals managing Bangladesh's premier energy news wire, quarterly data briefs, and monthly magazine.
            </p>
          </div>
          
          <div className="space-y-4 md:space-y-5">
            {/* Top Level: Editor & Publisher */}
            <div className="relative group overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/30 to-card/10 p-6 md:p-8 hover:border-orange-500/45 transition-all duration-300 shadow-md hover:shadow-orange-500/5">
              <div className="absolute top-0 right-0 h-32 w-32 bg-orange-500/5 rounded-bl-full -mr-8 -mt-8 blur-2xl group-hover:bg-orange-500/10 transition-colors duration-300" />
              <div className="flex flex-col items-center gap-6 relative z-10 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 text-white flex items-center justify-center font-display font-black text-2xl shadow shrink-0 ring-4 ring-rose-500/10">
                  FA
                </div>
                <div className="space-y-3 w-full">
                  <div className="flex flex-col items-center gap-2">
                    <h4 className="font-display font-extrabold text-2xl tracking-tight text-foreground">
                      Farid Uddin Ahmed
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase tracking-wider font-sans">
                      Founder
                    </span>
                  </div>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wider font-sans">
                    Editor & Publisher
                  </p>
                  
                  <div className="relative max-w-2xl mx-auto py-2 px-6">
                    <Quote className="absolute left-0 top-0 h-6 w-6 text-orange-500/15" />
                    <p className="text-sm text-muted-foreground leading-relaxed font-light italic">
                      Directing the strategic editorial vision, publisher relations, and executive interviews for ESB PowerLine across Bangladesh.
                    </p>
                    <Quote className="absolute right-0 bottom-0 h-6 w-6 text-orange-500/15 transform rotate-180" />
                  </div>
                </div>
              </div>
            </div>

            {/* Department Dropdowns: Core Operational Team — 2×2 quad grid.
                Two independent columns so opening a dropdown only reflows its own column. */}
            <div className="grid sm:grid-cols-2 gap-4 md:gap-5 items-start">
              <div className="space-y-4 md:space-y-5">

              {/* Administrative Team */}
              <details className="group rounded-2xl border border-border/40 bg-card/15 overflow-hidden shadow-md open:border-amber-500/40 transition-colors duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 hover:bg-muted/10 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <span>
                      <h3 className="font-display font-bold text-base text-foreground leading-tight">Administration</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 font-sans">1 member</p>
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="border-t border-border/30 p-5">
                  <div className="relative group/card overflow-hidden rounded-2xl border border-border/40 bg-card/15 p-5 hover:border-amber-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-bl-full -mr-6 -mt-6 blur-xl" />
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center shadow shrink-0 ring-4 ring-amber-500/10">
                        <UserRound className="h-6 w-6" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div>
                          <h4 className="font-display font-bold text-base text-foreground truncate">Obaidul Haque</h4>
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-0.5 font-sans">Admin &amp; Accounting</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-light">
                          Manages corporate finance, billing ledgers, and operational logistics, acting as a direct representative for key face-to-face deals and business relations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              {/* Reporters */}
              <details className="group rounded-2xl border border-border/40 bg-card/15 overflow-hidden shadow-md open:border-rose-500/40 transition-colors duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 hover:bg-muted/10 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                      <Newspaper className="h-5 w-5" />
                    </span>
                    <span>
                      <h3 className="font-display font-bold text-base text-foreground leading-tight">Newsroom</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 font-sans">2 members</p>
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="border-t border-border/30 p-5">
                  <div className="grid gap-5">
                    <div className="relative group/card overflow-hidden rounded-2xl border border-border/40 bg-card/15 p-5 hover:border-rose-500/40 transition-all duration-300">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/5 rounded-bl-full -mr-6 -mt-6 blur-xl" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-display font-bold text-sm shadow shrink-0 ring-4 ring-rose-500/10">
                          ESB
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div>
                            <h4 className="font-display font-bold text-base text-foreground truncate">ESB News Desk</h4>
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-0.5 font-sans">Staff Correspondents</p>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-light">
                            The collective byline for desk-compiled coverage — ministry statements, agency wires, tariff notices, and sector briefs verified and filed by the newsroom.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="relative group/card overflow-hidden rounded-2xl border border-border/40 bg-card/15 p-5 hover:border-blue-500/40 transition-all duration-300">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-bl-full -mr-6 -mt-6 blur-xl" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow shrink-0 ring-4 ring-blue-500/10">
                          <UserRound className="h-6 w-6" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div>
                            <h4 className="font-display font-bold text-base text-foreground truncate">Mehedi Hasan Hamim</h4>
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-0.5 font-sans">Reporter &amp; Sub-Editor</p>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-light">
                            Leads content curation and energy sector research, tracking policy revisions, aggregating data points, and compiling valuable briefs for the monthly publications.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              </div>
              <div className="space-y-4 md:space-y-5">

              {/* IT Department */}
              <details className="group rounded-2xl border border-border/40 bg-card/15 overflow-hidden shadow-md open:border-emerald-500/40 transition-colors duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 hover:bg-muted/10 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                      <MonitorCog className="h-5 w-5" />
                    </span>
                    <span>
                      <h3 className="font-display font-bold text-base text-foreground leading-tight">IT Team</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 font-sans">2 members</p>
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="border-t border-border/30 p-5">
                  <div className="grid gap-5">
                    <div className="relative group/card overflow-hidden rounded-2xl border border-border/40 bg-card/15 p-5 hover:border-emerald-500/40 transition-all duration-300">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-bl-full -mr-6 -mt-6 blur-xl" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow shrink-0 ring-4 ring-emerald-500/10">
                          <UserRound className="h-6 w-6" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div>
                            <h4 className="font-display font-bold text-base text-foreground truncate">Md Riazul Islam</h4>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5 font-sans">Head of IT</p>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-light">
                            Administers cloud hosting systems, secure domain infrastructure, network routing stability, and enforces platform-wide security compliance.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="relative group/card overflow-hidden rounded-2xl border border-border/40 bg-card/15 p-5 hover:border-blue-500/40 transition-all duration-300">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-bl-full -mr-6 -mt-6 blur-xl" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow shrink-0 ring-4 ring-blue-500/10">
                          <UserRound className="h-6 w-6" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div>
                            <h4 className="font-display font-bold text-base text-foreground truncate">Mehedi Hasan Hamim</h4>
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-0.5 font-sans">IT Developer</p>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-light">
                            Develops and maintains the ESB PowerLine platform — the newsroom CMS, the Petrobangla and PGCB data pipelines, and the Grid Explorer analytics suite.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              {/* Creative & Design */}
              <details className="group rounded-2xl border border-border/40 bg-card/15 overflow-hidden shadow-md open:border-violet-500/40 transition-colors duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 hover:bg-muted/10 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
                      <Palette className="h-5 w-5" />
                    </span>
                    <span>
                      <h3 className="font-display font-bold text-base text-foreground leading-tight">Art &amp; Design</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 font-sans">1 member</p>
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="border-t border-border/30 p-5">
                  <div className="relative group/card overflow-hidden rounded-2xl border border-border/40 bg-card/15 p-5 hover:border-violet-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-bl-full -mr-6 -mt-6 blur-xl" />
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow shrink-0 ring-4 ring-violet-500/10">
                        <UserRound className="h-6 w-6" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div>
                          <h4 className="font-display font-bold text-base text-foreground truncate">Faisal Al Mahmud</h4>
                          <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mt-0.5 font-sans">Graphics &amp; Motion Designer</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-light">
                          Directs the visual identity across all platforms, designing motion graphics, corporate logos, marketing banners, and managing the overall aesthetic of our monthly magazine.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Footer CTA */}
        <section className="relative overflow-hidden border border-border/40 bg-gradient-to-br from-card/25 to-card/5 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-sm isolate">
          {/* Subtle minimal spiral-to-wave backdrop flow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 isolate">
            {/* Left Floral Constellation (spins clockwise) */}
            <div className="absolute -left-16 -top-12 w-[240px] h-[240px] opacity-[0.09] text-primary animate-[spin_140s_linear_infinite]">
              <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
                <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="0.75" strokeDasharray="6 4" />
                {/* Petal-like spirograph loops */}
                <path d="M 100 100 C 60 40, 140 40, 100 100" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 100 100 C 160 60, 160 140, 100 100" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 100 100 C 140 160, 60 160, 100 100" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 100 100 C 40 140, 40 60, 100 100" stroke="currentColor" strokeWidth="0.5" />
                {/* Intersecting dots */}
                <circle cx="100" cy="30" r="3" fill="currentColor" />
                <circle cx="170" cy="100" r="3" fill="currentColor" />
                <circle cx="100" cy="170" r="3" fill="currentColor" />
                <circle cx="30" cy="100" r="3" fill="currentColor" />
              </svg>
            </div>

            {/* Right Floral Constellation (spins counter-clockwise) */}
            <div className="absolute -right-16 -bottom-12 w-[240px] h-[240px] opacity-[0.09] text-primary animate-[spin_180s_linear_infinite_reverse]">
              <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 4" />
                <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" />
                {/* Alternate petal-like spirograph loops */}
                <path d="M 100 100 C 80 20, 120 20, 100 100" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
                <path d="M 100 100 C 180 80, 180 120, 100 100" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
                <path d="M 100 100 C 120 180, 80 180, 100 100" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
                <path d="M 100 100 C 20 120, 20 80, 100 100" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
                {/* Nodes */}
                <circle cx="100" cy="40" r="2.5" fill="currentColor" />
                <circle cx="160" cy="100" r="2.5" fill="currentColor" />
                <circle cx="100" cy="160" r="2.5" fill="currentColor" />
                <circle cx="40" cy="100" r="2.5" fill="currentColor" />
              </svg>
            </div>

            {/* Soft wave connecting the two constellations across the card background */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.07] text-primary"
              viewBox="0 0 800 240"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="cta-connect-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                  <stop offset="30%" stopColor="currentColor" stopOpacity="1" />
                  <stop offset="70%" stopColor="currentColor" stopOpacity="1" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 100,120 C 250,50 550,190 700,120"
                stroke="url(#cta-connect-flow)"
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />
            </svg>
          </div>
          <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-primary/5 rounded-tr-full blur-2xl pointer-events-none" />
          <div className="space-y-2 max-w-xl mx-auto relative z-10">
            <h3 className="text-2xl font-display font-extrabold text-foreground">
              Ready to explore further?
            </h3>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Stay ahead of policy updates, power capacity metrics, and local grid expansions. Discover our publications or reach our editorial desk.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <Link href="/articles" className="btn btn--primary flex items-center gap-2 group shadow-lg shadow-primary/10">
              Read Latest News <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
            <Link href="/contact" className="btn border border-border hover:bg-muted/80 backdrop-blur-sm text-foreground transition-all duration-300">
              Get in Touch
            </Link>
          </div>
        </section>
        
      </div>
    </div>
  );
}