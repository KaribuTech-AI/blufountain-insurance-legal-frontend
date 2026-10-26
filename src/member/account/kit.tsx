import type { MemberTarget } from '@blufountain/domain';
import { DICTIONARIES, formatUsd, type MessageKey, type Translate } from '@blufountain/i18n';
import type { PublicApi } from '@blufountain/public-kit';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/* ------------------------------------------------------------------------------ routing */

export type Page = 'home' | 'cover' | 'payments' | 'cases' | 'claims' | 'requests' | 'profile';
export const PAGES: readonly Page[] = [
  'home',
  'cover',
  'payments',
  'cases',
  'claims',
  'requests',
  'profile',
];

export interface AccountRoute {
  page: Page;
  id: string | undefined;
}

/** `#/account/payments/abc` is the payments page for policy abc. */
export function parseRoute(hash: string): AccountRoute {
  const [, page, id] = hash.replace(/^#\/?/, '').split('/');
  return {
    page: (PAGES as readonly string[]).includes(page ?? '') ? (page as Page) : 'home',
    id: id || undefined,
  };
}

export function useAccountRoute(): AccountRoute {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const hrefFor = (page: Page, id?: string) =>
  `#/account${page === 'home' ? '' : `/${page}`}${id ? `/${id}` : ''}`;

/** Where a button on an item leads. */
export function hrefOfTarget(link: { to: MemberTarget; id?: string | undefined }): string {
  switch (link.to) {
    case 'payments':
      return hrefFor('payments', link.id);
    case 'cover':
      return hrefFor('cover', link.id);
    case 'case':
      return hrefFor('cases', link.id);
    case 'claim':
      return hrefFor('claims', link.id);
    case 'claims':
      return hrefFor('claims');
  }
}

/* ---------------------------------------------------------------------------------- data */

interface AccountContextValue {
  api: PublicApi;
  /** Tells the idle timer the server has just seen the member. */
  touch: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({
  api,
  touch,
  children,
}: AccountContextValue & { children: ReactNode }) {
  return <AccountContext.Provider value={{ api, touch }}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error('useAccount must be used inside AccountProvider');
  return value;
}

export interface Loaded<T> {
  data: T | undefined;
  failed: boolean;
  reload: () => void;
}

/** Loads one answer from the member API. A null path loads nothing. */
export function useMemberData<T>(path: string | null): Loaded<T> {
  const { api, touch } = useAccount();
  const [state, setState] = useState<{ path: string | null; data?: T; failed: boolean }>({
    path,
    failed: false,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let live = true;
    api
      .get<T>(path)
      .then((data) => {
        if (!live) return;
        touch();
        setState({ path, data, failed: false });
      })
      .catch(() => live && setState({ path, failed: true }));
    return () => {
      live = false;
    };
  }, [api, path, tick, touch]);

  // An answer for another path is not an answer for this one.
  const current = state.path === path;
  return {
    data: current ? state.data : undefined,
    failed: current && state.failed,
    // Refresh in place: what is on screen stays until the new answer arrives.
    reload: useCallback(() => {
      setState((prev) => ({ ...prev, failed: false }));
      setTick((n) => n + 1);
    }, []),
  };
}

/* ---------------------------------------------------------------------------------- words */

/** A word for a code from the server, or the code itself when there is no word for it. */
export function word(t: Translate, prefix: string, code: string): string {
  const key = `${prefix}.${code}`;
  return key in DICTIONARIES.en ? t(key as MessageKey) : code;
}

export const money = formatUsd;
