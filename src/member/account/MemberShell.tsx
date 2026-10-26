import type { MemberProfile } from '@blufountain/domain';
import type { Language } from '@blufountain/i18n';
import { useI18n } from '@blufountain/i18n/react';
import {
  DraftNotice,
  Icon,
  LanguageBar,
  Logo,
  ThemeToggle,
  type IconName,
  type PublicApi,
} from '@blufountain/public-kit';
import { useCallback, useState, type ReactNode } from 'react';
import { CasesPage } from './CasesPage';
import { ClaimsPage } from './ClaimsPage';
import { CoverPage } from './CoverPage';
import { HomePage } from './HomePage';
import { AccountProvider, hrefFor, useAccountRoute, type Page } from './kit';
import { PaymentsPage } from './PaymentsPage';
import { ProfilePage } from './ProfilePage';
import { RequestsPage } from './RequestsPage';
import { useIdleSession } from './useIdleSession';

const NAV: { page: Page; icon: IconName }[] = [
  { page: 'home', icon: 'home' },
  { page: 'cover', icon: 'shield' },
  { page: 'payments', icon: 'pay' },
  { page: 'cases', icon: 'info' },
  { page: 'claims', icon: 'claims' },
  { page: 'requests', icon: 'phone' },
  { page: 'profile', icon: 'info' },
];

/**
 * The signed-in member area: a menu, the page for the address, and the idle timer. The timer
 * tracks the server's, which moves on each call the page makes.
 */
export function MemberShell({
  profile,
  memberApi,
  idleSeconds,
  language,
  onLanguage,
  onSignOut,
  onExpire,
}: {
  profile: MemberProfile;
  memberApi: PublicApi;
  idleSeconds: number;
  language: Language;
  onLanguage: (language: Language) => void;
  onSignOut: (everywhere: boolean) => void;
  onExpire: () => void;
}) {
  const { t } = useI18n();
  const route = useAccountRoute();
  // Asked once; the server remembers the answer. A profile without the field is already asked.
  const [consented, setConsented] = useState(profile.consentAccepted !== false);
  const accept = useCallback(async () => {
    try {
      await memberApi.send('POST', '/profile/consent', { accepted: true });
      setConsented(true);
    } catch {
      // The notice stays until it is accepted.
    }
  }, [memberApi]);
  const keepAlive = useCallback(() => memberApi.get('/profile'), [memberApi]);
  const { secondsLeft, stay, touch } = useIdleSession({
    lengthSeconds: idleSeconds,
    onExpire,
    keepAlive,
  });

  let page: ReactNode;
  switch (route.page) {
    case 'cover':
      page = <CoverPage key={route.id ?? 'all'} id={route.id} />;
      break;
    case 'payments':
      page = <PaymentsPage key={route.id ?? 'all'} id={route.id} />;
      break;
    case 'cases':
      page = <CasesPage key={route.id ?? 'all'} id={route.id} />;
      break;
    case 'claims':
      page = <ClaimsPage key={route.id ?? 'all'} id={route.id} />;
      break;
    case 'requests':
      page = <RequestsPage key={route.id ?? 'all'} id={route.id} />;
      break;
    case 'profile':
      page = <ProfilePage />;
      break;
    default:
      page = <HomePage />;
  }

  return (
    <div className="mp-app">
      <a className="pk-skip" href="#main">
        Skip to the page
      </a>
      <header className="mp-top">
        <a className="mp-brand" href="#/home">
          <Logo />
          <span>Blufountain</span>
        </a>
        <span className="mp-who">{t('portal.signedIn', { name: profile.firstName })}</span>
        <LanguageBar language={language} onChange={onLanguage} />
        <ThemeToggle />
        <button type="button" className="mp-btn" onClick={() => onSignOut(false)}>
          {t('common.signOut')}
        </button>
      </header>
      <div className="mp-body">
        <nav className="mp-side" aria-label={t('acct.nav')}>
          {NAV.map(({ page: p, icon }) => (
            <a key={p} href={hrefFor(p)} aria-current={route.page === p ? 'page' : undefined}>
              <Icon name={icon} />
              <span>{t(`acct.nav.${p}`)}</span>
            </a>
          ))}
          <a className="mp-site" href="#/home">
            {t('nav.home')} ›
          </a>
        </nav>
        <main id="main" tabIndex={-1} className="mp-main">
          <DraftNotice language={language} />
          {secondsLeft !== null && (
            <div
              className="mp-card"
              role="alertdialog"
              aria-labelledby="idle-h"
              aria-describedby="idle-b"
            >
              <h2 id="idle-h">{t('account.idle.title')}</h2>
              <p id="idle-b">{t('account.idle.body', { seconds: secondsLeft })}</p>
              <button type="button" className="mp-btn" onClick={() => void stay()}>
                {t('account.idle.stay')}
              </button>
            </div>
          )}
          {!consented && (
            <section className="mp-card" aria-labelledby="consent-h">
              <h2 id="consent-h">{t('acct.consent.title')}</h2>
              <p>{t('acct.consent.body')}</p>
              <button type="button" className="mp-btn mp-primary" onClick={() => void accept()}>
                {t('acct.consent.accept')}
              </button>
            </section>
          )}
          {route.page === 'home' && (
            <header className="mp-head">
              <h1>{t('account.hello', { name: profile.firstName })}</h1>
              {profile.phoneHint && (
                <p className="mp-muted">{t('account.phoneHint', { hint: profile.phoneHint })}</p>
              )}
            </header>
          )}
          <AccountProvider api={memberApi} touch={touch}>
            {page}
          </AccountProvider>
          <p>
            <button type="button" className="mp-btn" onClick={() => onSignOut(true)}>
              {t('account.signOutAll')}
            </button>
          </p>
        </main>
      </div>
    </div>
  );
}
