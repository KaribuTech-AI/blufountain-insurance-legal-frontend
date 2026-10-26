import { detectLanguage, isLanguage, type Language } from '@blufountain/i18n';
import { LANGUAGE_SWITCH } from './components';
import { useCallback, useEffect, useState } from 'react';
import { PublicError } from './api';

const KEY = 'bf.lang';

/** The reader's language: their last choice, else the browser's, else English. */
export function useLanguage(): [Language, (language: Language) => void] {
  const [language, setLanguage] = useState<Language>(() => {
    // English until the switch is turned on (see LANGUAGE_SWITCH): a saved choice is ignored.
    if (!LANGUAGE_SWITCH) return 'en';
    try {
      const saved = localStorage.getItem(KEY);
      if (isLanguage(saved)) return saved;
    } catch {
      // Storage can be blocked; the choice then lasts until the page closes.
    }
    return detectLanguage(typeof navigator === 'undefined' ? undefined : navigator.languages);
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const choose = useCallback((next: Language) => {
    setLanguage(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Ignored: see above.
    }
  }, []);
  return [language, choose];
}

/** The part of the address after #, so the phone's back button moves between screens. */
export function useHashView<T extends string>(
  views: readonly T[],
  initial: T,
): [T, (view: T) => void] {
  const read = (): T => {
    // Only the first part names the view: #/account/payments/abc is still the account view.
    const hash = window.location.hash.replace(/^#\/?/, '').split('/')[0] ?? '';
    return (views as readonly string[]).includes(hash) ? (hash as T) : initial;
  };
  const [view, setView] = useState<T>(read);
  useEffect(() => {
    const onChange = () => setView(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read only depends on the fixed lists
  }, []);
  return [
    view,
    (next) => {
      window.location.hash = `/${next}`;
    },
  ];
}

export interface Action<T> {
  run: () => Promise<T | undefined>;
  busy: boolean;
  error: PublicError | null;
  reset: () => void;
}

/** Runs one async step, tracking whether it is busy and what went wrong. */
export function useAction<T>(fn: () => Promise<T>, onDone?: (result: T) => void): Action<T> {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PublicError | null>(null);
  return {
    busy,
    error,
    reset: () => setError(null),
    async run() {
      if (busy) return undefined;
      setBusy(true);
      setError(null);
      try {
        const result = await fn();
        onDone?.(result);
        return result;
      } catch (e) {
        setError(e instanceof PublicError ? e : new PublicError(500, 'ERROR'));
        return undefined;
      } finally {
        setBusy(false);
      }
    },
  };
}
