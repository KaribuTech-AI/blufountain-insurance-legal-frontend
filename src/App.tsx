import { I18nProvider, useI18n } from '@blufountain/i18n/react';
import { createApi, useHashView, useLanguage, type PublicApi } from '@blufountain/public-kit';
import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Apply } from './Apply';
import { CheckCase } from './CheckCase';
import { Home } from './site/Home';
import { SITE_VIEWS, SiteLayout, type SiteView } from './site/SiteLayout';

// Marketing pages and the member portal load only when someone opens them, so the first visit
// stays small on a slow phone.
const Pages = lazy(() => import('./site/pages'));
const AccountApp = lazy(() => import('./member/account/AccountApp'));

// `member` is the address the website links to; `account` is where the member area lives. Both
// open the phone-number account (docs/member-portal-design.md).
const VIEWS = [...SITE_VIEWS, 'check', 'apply', 'member', 'account'] as const;

export interface AppProps {
  /** Tests pass a stand-in; the real app talks to /api/v1/public. */
  api?: PublicApi;
  /** The member account API at /api/v1/member; tests pass a stand-in. */
  memberApi?: PublicApi;
}

export default function App({ api, memberApi }: AppProps) {
  const [language, setLanguage] = useLanguage();
  const client = useMemo(() => api ?? createApi(), [api]);
  const members = useMemo(() => memberApi ?? createApi('/api/v1/member'), [memberApi]);
  return (
    <I18nProvider language={language}>
      <Views api={client} memberApi={members} language={language} onLanguage={setLanguage} />
    </I18nProvider>
  );
}

function Views({
  api,
  memberApi,
  language,
  onLanguage,
}: {
  api: PublicApi;
  memberApi: PublicApi;
  language: ReturnType<typeof useLanguage>[0];
  onLanguage: ReturnType<typeof useLanguage>[1];
}) {
  const { t } = useI18n();
  const [view, go] = useHashView(VIEWS, 'home');
  // Every move to another page starts at the top, as a new page would.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [view]);

  // A link to the page you are already on changes nothing in the address, so scroll for it too.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.('a[href^="#/"]');
      if (link && link.getAttribute('href') === window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (view === 'account' || view === 'member') {
    return (
      <Suspense fallback={<p className="pk-main">{t('common.loading')}</p>}>
        <AccountApp
          api={api}
          memberApi={memberApi}
          language={language}
          onLanguage={onLanguage}
          onLeave={() => go('home')}
        />
      </Suspense>
    );
  }

  return (
    <SiteLayout view={view} language={language} onLanguage={onLanguage}>
      {view === 'home' && <Home />}
      {view === 'check' && (
        <div className="s-tool">
          <CheckCase api={api} onBack={() => go('home')} />
        </div>
      )}
      {view === 'apply' && (
        <div className="s-tool">
          <Apply api={api} onBack={() => go('home')} />
        </div>
      )}
      {view !== 'home' && view !== 'check' && view !== 'apply' && (
        <Suspense fallback={<p className="s-wrap">{t('common.loading')}</p>}>
          <Pages view={view as Exclude<SiteView, 'home'>} />
        </Suspense>
      )}
    </SiteLayout>
  );
}
