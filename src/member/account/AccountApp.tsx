import type { MemberProfile } from '@blufountain/domain';
import type { Language } from '@blufountain/i18n';
import { useI18n } from '@blufountain/i18n/react';
import {
  DraftNotice,
  LanguageBar,
  Logo,
  ThemeToggle,
  type PublicApi,
} from '@blufountain/public-kit';
import { useCallback, useState } from 'react';
import '../portal.css';
import { AccountSignIn } from './AccountSignIn';
import { MemberShell } from './MemberShell';

/**
 * The member's own area: sign in with a phone number and see what belongs to you. Every call
 * needs the member session, which ends by itself after 20 minutes without use (5 on a shared
 * phone). Later sprints fill the home page with policies, cases and dates.
 */
export default function AccountApp({
  api,
  memberApi,
  language,
  onLanguage,
  onLeave,
}: {
  /** The public API, which serves the bot check. */
  api: PublicApi;
  /** The member API, which holds the session token. */
  memberApi: PublicApi;
  language: Language;
  onLanguage: (language: Language) => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<MemberProfile>();
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [expired, setExpired] = useState(false);

  const end = useCallback(
    (becauseIdle: boolean) => {
      memberApi.setToken(undefined);
      setProfile(undefined);
      setExpired(becauseIdle);
    },
    [memberApi],
  );

  const signOut = async (everywhere: boolean) => {
    try {
      await memberApi.send('DELETE', everywhere ? '/sessions' : '/sessions/current');
    } catch {
      // The session ends by itself.
    }
    end(false);
  };

  const signedIn = (p: MemberProfile, seconds: number) => {
    setExpired(false);
    setIdleSeconds(seconds);
    setProfile(p);
    // Their saved choice wins over the browser's guess, once, at sign in.
    onLanguage(p.language);
  };

  const changeLanguage = (next: Language) => {
    onLanguage(next);
    if (profile) {
      memberApi
        .send<MemberProfile>('PATCH', '/profile', { language: next })
        .then(setProfile)
        .catch(() => undefined);
    }
  };

  if (!profile) {
    return (
      <div className="mp-login">
        <aside className="mp-login-side" aria-hidden="true">
          <a className="mp-brand" href="#/home" tabIndex={-1}>
            <Logo />
            <span>Blufountain</span>
          </a>
          <div>
            <p className="mp-login-quote">Your cover, in one place.</p>
            <p className="mp-login-sub">{t('account.intro')}</p>
          </div>
          <p className="mp-login-fine">{t('account.fine')}</p>
        </aside>
        <main id="main" tabIndex={-1} className="mp-login-main">
          <div className="mp-login-top">
            <a href="#/home" onClick={onLeave}>
              ‹ {t('common.back')}
            </a>
            <LanguageBar language={language} onChange={onLanguage} />
            <ThemeToggle />
          </div>
          <DraftNotice language={language} />
          <div className="mp-login-form">
            <AccountSignIn
              api={api}
              memberApi={memberApi}
              expired={expired}
              onSignedIn={signedIn}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <MemberShell
      profile={profile}
      memberApi={memberApi}
      idleSeconds={idleSeconds}
      language={language}
      onLanguage={changeLanguage}
      onSignOut={(everywhere) => void signOut(everywhere)}
      onExpire={() => end(true)}
    />
  );
}
