import Link from 'next/link';

export interface FooterLink {
  label: string;
  href: string;
}

export interface SectionFooterProps {
  sources: FooterLink[];
  auditedBy: string;
  reportingDate: string;
}

export default function SectionFooter({ sources, auditedBy, reportingDate }: SectionFooterProps) {
  return (
    <div className="grid-explorer-card-footer">
      <span>
        Source:{' '}
        {sources.map((s, i) => (
          <Link
            key={i}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            {s.label}
            {i < sources.length - 1 ? ' & ' : ''}
          </Link>
        ))}
      </span>
      <span>Audited by: {auditedBy}</span>
      <span className="font-medium">Reporting Date: {reportingDate}</span>
    </div>
  );
}
