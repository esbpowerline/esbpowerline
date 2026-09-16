import { Facebook, Youtube } from 'lucide-react';
import { OFFICIAL_SOCIAL_LINKS } from '@/components/shared/OfficialSocialLinks';

const SOCIAL_CHANNELS = [
  { id: 'facebook' as const, icon: Facebook },
  { id: 'youtube' as const, icon: Youtube },
] as const;

/** Shared login masthead footer — publisher, location, and official social. */
export function LoginBrandFooter() {
  return (
    <div className="login-portal-footer">
      <div className="login-portal-footer__identity">
        <span className="login-portal-footer__publisher">ESB Power Line</span>
        <span className="login-portal-footer__location">Mirpur, Dhaka · Bangladesh</span>
      </div>

      <div className="login-portal-footer__rail" aria-hidden />

      <div className="login-portal-footer__connect">
        <div className="login-portal-footer__connect-copy">
          <span className="login-portal-footer__connect-label">Stay connected</span>
          <span className="login-portal-footer__connect-hint">News &amp; video on social</span>
        </div>
        <ul className="login-portal-footer__social" aria-label="Official social channels">
          {SOCIAL_CHANNELS.map(({ id, icon: Icon }) => {
            const channel = OFFICIAL_SOCIAL_LINKS[id];

            return (
              <li key={id}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="login-portal-footer__social-link"
                  aria-label={`${channel.label} — opens in a new tab`}
                >
                  <Icon className="login-portal-footer__social-icon" aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}