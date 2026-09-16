import { Facebook, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OFFICIAL_SOCIAL_LINKS = {
  facebook: {
    href: 'https://www.facebook.com/esbpowerlineofficial',
    label: 'Facebook',
  },
  youtube: {
    href: 'https://www.youtube.com/@esbplbd',
    label: 'YouTube',
  },
} as const;

const SOCIAL_ITEMS = [
  { id: 'facebook' as const, icon: Facebook },
  { id: 'youtube' as const, icon: Youtube },
];

type OfficialSocialLinksProps = {
  className?: string;
  variant?: 'inline' | 'compact' | 'footer';
};

export function OfficialSocialLinks({ className, variant = 'inline' }: OfficialSocialLinksProps) {
  return (
    <ul
      className={cn(
        'official-social',
        variant === 'compact' && 'official-social--compact',
        variant === 'footer' && 'official-social--footer',
        variant === 'inline' && 'official-social--inline',
        className,
      )}
    >
      {SOCIAL_ITEMS.map(({ id, icon: Icon }) => {
        const link = OFFICIAL_SOCIAL_LINKS[id];

        return (
          <li key={id}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="official-social__link"
            >
              <Icon className="official-social__icon" aria-hidden />
              <span>{link.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}