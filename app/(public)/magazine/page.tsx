import Link from 'next/link';
import { ArrowRight, Download, Calendar, Users } from 'lucide-react';
import { getLatestMagazineIssue } from '@/lib/category-content';
import { auth } from '@/lib/auth';
import { getMagazineSavedState } from '@/lib/actions/members';
import { MagazinePageClient } from '@/components/news/MagazinePageClient';

export const revalidate = 60;

export const metadata = {
  title: 'Monthly Magazine | ESB PowerLine',
  description: 'Read the latest issue of ESB PowerLine — in-depth analysis, data and features on Bangladesh energy & power.',
};

export default async function MagazinePage() {
  const issue = await getLatestMagazineIssue();
  const session = await auth();
  const signedIn = !!session?.user?.id;
  const saved = issue && signedIn ? await getMagazineSavedState(issue.id) : false;

  const magazine = issue ?? {
    id: '',
    title: 'ESB PowerLine Monthly',
    summary: 'In-depth analysis on Bangladesh power sector policy, projects and data.',
    coverUrl: '/images/demo_magazine_cover.jpg',
    pdfUrl: null,
    issueDate: new Date(),
  };

  const issueLabel = new Date(magazine.issueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  const features = [
    { title: 'Solar + Wind Pipeline 2026–2030', excerpt: 'Full project map and tender calendar for utility-scale renewables.' },
    { title: 'Cross-Border Trade Update', excerpt: 'India–Bangladesh power flows, new HVDC links, and pricing mechanics.' },
    { title: 'BERC Tariff Reform Deep Dive', excerpt: 'How the new bulk supply tariff affects generators, DISCOs and consumers.' },
    { title: 'Rooppur Commissioning Timeline', excerpt: 'Inside the first nuclear fuel loading and grid integration milestones.' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Full-Page Ambient Glow with subtle cover page energy colors */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Soft Solar Amber */}
        <div className="absolute top-[5%] left-[10%] w-[35rem] h-[35rem] rounded-full bg-amber-500/[0.03] blur-[150px] animate-pulse duration-[8000ms]" />
        {/* Soft Clean Energy Teal */}
        <div className="absolute top-[25%] right-[10%] w-[45rem] h-[45rem] rounded-full bg-teal-500/[0.03] blur-[160px] animate-pulse duration-[12000ms]" />
        {/* Soft Power Blue */}
        <div className="absolute bottom-[20%] left-[5%] w-[40rem] h-[40rem] rounded-full bg-blue-500/[0.025] blur-[150px] animate-pulse duration-[10000ms]" />
        {/* Soft National Grid Emerald */}
        <div className="absolute bottom-[5%] right-[15%] w-[35rem] h-[35rem] rounded-full bg-emerald-500/[0.03] blur-[140px] animate-pulse duration-[9000ms]" />
      </div>

      {/* Subtle grid pattern overlay for high-tech premium feel */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />
      
      {/* Interactive client page wrapper */}
      <MagazinePageClient
        coverUrl={magazine.coverUrl}
        title={magazine.title}
        summary={magazine.summary}
        issueLabel={issueLabel}
        signedIn={signedIn}
        pdfUrl={magazine.pdfUrl}
        saved={saved}
        issueId={magazine.id}
        features={features}
      />

      <div className="container container--shell pb-12 relative z-10">
        <div className="mt-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-xl">In this issue</h2>
            <Link href="/articles" className="text-xs text-primary hover:underline flex items-center gap-1">All power sector features <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
            {features.map((f, idx) => (
              <div key={idx} className="card p-6 group hover:border-primary/50 transition-all duration-200 relative overflow-hidden">
                {/* Subtle card glow */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
                  <div className="absolute -top-[30%] -right-[30%] w-[10rem] h-[10rem] rounded-full bg-emerald-500/6 blur-[30px]" />
                  <div className="absolute -bottom-[30%] -left-[30%] w-[10rem] h-[10rem] rounded-full bg-primary/4 blur-[30px]" />
                </div>
                <div className="uppercase text-accent text-xs tracking-widest font-semibold mb-1.5">FEATURE</div>
                <h4 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{f.title}</h4>
                <p className="text-sm text-muted-foreground">{f.excerpt}</p>
                <div className="text-[11px] mt-4 text-muted-foreground/80">12 pages • Analysis + Data</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-border/70 p-8 bg-muted/30 text-center">
          <div className="max-w-md mx-auto">
            <div className="font-semibold text-lg mb-2">Access the full archive + exclusive briefings</div>
            <p className="text-sm text-muted-foreground mb-5">Monthly magazine + data packages for energy professionals.</p>
            {signedIn ? (
              <Link href="/members" className="btn btn-primary px-8">Open my library</Link>
            ) : (
              <Link href="/members/login" className="btn btn-primary px-8">Sign in for full access</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}