import type { Language } from '@blufountain/i18n';
import { useI18n } from '@blufountain/i18n/react';
import { DraftNotice, Icon, LanguageBar, Logo, ThemeToggle } from '@blufountain/public-kit';
import type { ReactNode } from 'react';
import './site.css';
import './finish.css';
import './chrome.css';
import './photos.css';

export const SITE_VIEWS = [
  'home',
  'services',
  'serve',
  'how',
  'membership',
  'about',
  'contact',
] as const;
export type SiteView = (typeof SITE_VIEWS)[number];

const YEAR = new Date().getFullYear();
export const OFFICE_PHONE = '0242 000 000';

/** The public face: a quiet sticky header, the page, and a full footer. Members log in from here. */
export function SiteLayout({
  view,
  language,
  onLanguage,
  children,
}: {
  view: string;
  language: Language;
  onLanguage: (language: Language) => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const links: { view: SiteView; label: string }[] = [
    { view: 'services', label: t('nav.services') },
    { view: 'serve', label: t('nav.serve') },
    { view: 'how', label: t('home.how') },
    { view: 'membership', label: t('nav.membership') },
    { view: 'about', label: t('nav.about') },
    { view: 'contact', label: t('nav.contact') },
  ];
  return (
    <div className="s-app">
      <a className="pk-skip" href="#main">
        Skip to the page
      </a>
      <div className="s-util">
        <div className="s-wrap s-util-in">
          <a href={`tel:${OFFICE_PHONE.replace(/\s/g, '')}`}>
            <Icon name="phone" />
            {t('common.callUs', { phone: OFFICE_PHONE })}
          </a>
          <span className="s-util-note">{t('brand.tagline')}</span>
          <div className="s-util-tools">
            <LanguageBar language={language} onChange={onLanguage} />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <header className="s-header">
        <div className="s-wrap s-header-in">
          <a className="s-brand" href="#/home" aria-label={`${t('app.portal')} — ${t('nav.home')}`}>
            <Logo />
            <span>
              Blufountain
              <small>Legal aid &amp; cover</small>
            </span>
          </a>
          <nav className="s-nav" aria-label={t('nav.label')}>
            {links.map((l) => (
              <a
                key={l.view}
                href={`#/${l.view}`}
                aria-current={view === l.view ? 'page' : undefined}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="s-header-cta">
            <a className="s-ghost" href="#/apply">
              {t('home.apply')}
            </a>
            <a className="s-btn s-primary s-small" href="#/member">
              {t('nav.login')}
            </a>
            <button
              type="button"
              className="s-menu-btn"
              popoverTarget="s-menu"
              aria-label={t('nav.label')}
            >
              <span aria-hidden="true" />
            </button>
          </div>
        </div>
        <div id="s-menu" className="s-menu" popover="auto">
          <nav aria-label={t('nav.label')}>
            {links.map((l) => (
              <a
                key={l.view}
                href={`#/${l.view}`}
                aria-current={view === l.view ? 'page' : undefined}
                onClick={() => document.getElementById('s-menu')?.hidePopover?.()}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <a
            className="s-btn s-primary"
            href="#/apply"
            onClick={() => document.getElementById('s-menu')?.hidePopover?.()}
          >
            {t('home.apply')}
          </a>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="s-main">
        <div className="s-wrap">
          <DraftNotice language={language} />
        </div>
        {children}
      </main>
      <footer className="s-footer">
        <div className="s-wrap s-footer-grid">
          <div>
            <a className="s-brand" href="#/home">
              <Logo />
              <span>Blufountain</span>
            </a>
            <p className="s-footer-blurb">
              {t('brand.tagline')}. Plain words, real lawyers, fair prices.
            </p>
          </div>
          <nav aria-label="Explore">
            <h2>Explore</h2>
            {links.map((l) => (
              <a key={l.view} href={`#/${l.view}`}>
                {l.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Take action">
            <h2>Take action</h2>
            <a href="#/apply">{t('home.apply')}</a>
            <a href="#/check">{t('home.check')}</a>
            <a href="#/member">{t('nav.login')}</a>
          </nav>
          <div>
            <h2>{t('nav.contact')}</h2>
            <a href={`tel:${OFFICE_PHONE.replace(/\s/g, '')}`}>
              {t('common.callUs', { phone: OFFICE_PHONE })}
            </a>
            <p className="s-footer-blurb">
              Monday to Friday. Free legal aid is for people who cannot pay a lawyer.
            </p>
          </div>
        </div>
        <div className="s-wrap s-legal">
          <span>© {YEAR} Blufountain</span>
          <span>Legal aid and legal cover are different services. Photos are illustrations.</span>
        </div>
      </footer>
    </div>
  );
}
