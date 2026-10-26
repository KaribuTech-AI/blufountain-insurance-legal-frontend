import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { formatDate, translator, type Language, type Translate } from './index';

interface I18n {
  language: Language;
  t: Translate;
  date: (iso: string) => string;
}

const Context = createContext<I18n | null>(null);

export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  const value = useMemo<I18n>(
    () => ({ language, t: translator(language), date: (iso) => formatDate(iso, language) }),
    [language],
  );
  return createElement(Context.Provider, { value }, children);
}

export function useI18n(): I18n {
  const value = useContext(Context);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
