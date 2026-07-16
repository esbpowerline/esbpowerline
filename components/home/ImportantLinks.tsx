"use client";

import { Zap, Network, Factory, ShieldCheck, Flame, Landmark, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useLocale } from '@/components/shared/LocaleProvider';

export function ImportantLinks() {
  const { t } = useLocale();

  const links = [
    { 
      name: 'Ministry of Power, Energy & Mineral Resources', 
      short: 'MPEMR',
      href: 'https://mpemr.gov.bd/',
      domain: 'mpemr.gov.bd',
      icon: Landmark,
    },
    { 
      name: 'Bangladesh Power Development Board', 
      short: 'BPDB',
      href: 'https://www.bpdb.gov.bd/',
      domain: 'bpdb.gov.bd',
      icon: Zap,
    },
    { 
      name: 'Power Grid Company of Bangladesh', 
      short: 'PGCB',
      href: 'https://pgcb.gov.bd/',
      domain: 'pgcb.gov.bd',
      icon: Network,
    },
    { 
      name: 'Sustainable & Renewable Energy Authority', 
      short: 'SREDA',
      href: 'http://www.sreda.gov.bd/',
      domain: 'sreda.gov.bd',
      icon: Factory,
    },
    { 
      name: 'Bangladesh Energy Regulatory Commission', 
      short: 'BERC',
      href: 'https://berc.org.bd/',
      domain: 'berc.org.bd',
      icon: ShieldCheck,
    },
    { 
      name: 'Petrobangla', 
      short: 'Petrobangla',
      href: 'https://www.petrobangla.org.bd/',
      domain: 'petrobangla.org.bd',
      icon: Flame,
    },
  ];

  return (
    <section className="mt-8 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden" aria-labelledby="important-links-title">
      <div className="p-4 md:p-5">
        <header className="mb-4 border-b border-border/40 pb-4">
          <div className="section-kicker text-primary mb-1.5">
            Directory
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <LinkIcon className="text-primary shrink-0 h-5 w-5 md:h-6 md:w-6" aria-hidden />
            <h2 id="important-links-title" className="min-w-0 truncate font-display font-bold tracking-tight text-xl md:text-2xl text-foreground">
              {t('importantLinks') === 'importantLinks' ? 'Important Links' : t('importantLinks')}
            </h2>
          </div>
        </header>

        <div className="flex flex-col">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a 
              key={link.short}
              href={link.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-3.5 py-3.5 border-t border-border/40 transition-all hover:bg-muted/20 -mx-4 px-4 md:-mx-5 md:px-5"
            >
              <div className="w-9 h-9 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary transition-colors text-muted-foreground/70 shadow-sm">
                <Icon className="w-4 h-4 stroke-[1.75]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors tracking-tight leading-none mt-[1px]">
                    {link.short}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                </div>
                
                <div className="text-[11.5px] text-muted-foreground leading-snug mb-1.5 pr-2">
                  {link.name}
                </div>
                
                <div className="flex items-center gap-1.5">
                  <div className="w-[3px] h-[3px] rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  <span className="text-[9.5px] font-mono text-muted-foreground/70 group-hover:text-primary/80 transition-colors tracking-wide uppercase">
                    {link.domain}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
      </div>
    </section>
  );
}
