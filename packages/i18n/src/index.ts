import { en, type MessageKey, type Messages } from './en';
import { nd } from './nd';
import { sn } from './sn';

export type { MessageKey, Messages } from './en';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sn', label: 'chiShona' },
  { code: 'nd', label: 'isiNdebele' },
] as const;
export type Language = (typeof LANGUAGES)[number]['code'];

export const DICTIONARIES: Record<Language, Messages> = { en, sn, nd };

/**
 * Shona and Ndebele are drafts until a native speaker signs them off (E10.4). The apps show
 * them with a notice, and the sign-off flips these flags.
 */
export const REVIEWED: Record<Language, boolean> = { en: true, sn: false, nd: false };

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((l) => l.code === value);
}

/** The first supported language in the browser's list, or English. */
export function detectLanguage(preferred: readonly string[] | undefined): Language {
  for (const tag of preferred ?? []) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLanguage(base)) return base;
  }
  return 'en';
}

export type Params = Record<string, string | number>;

/** Fills `{name}` placeholders. A placeholder with no value is left visible, never blanked. */
export function format(template: string, params?: Params): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    params && key in params ? String(params[key]) : whole,
  );
}

export type Translate = (key: MessageKey, params?: Params) => string;

export function translator(language: Language): Translate {
  const dictionary = DICTIONARIES[language];
  return (key, params) => format(dictionary[key] ?? en[key], params);
}

const MONTHS: Record<Language, readonly string[]> = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  sn: [
    'Ndira',
    'Kukadzi',
    'Kurume',
    'Kubvumbi',
    'Chivabvu',
    'Chikumi',
    'Chikunguru',
    'Nyamavhuvhu',
    'Gunyana',
    'Gumiguru',
    'Mbudzi',
    'Zvita',
  ],
  nd: [
    'Janualadi',
    'Febhuwari',
    'Mashi',
    'Ephreli',
    'Meyi',
    'Juni',
    'Julayi',
    'Agasti',
    'Septhemba',
    'Okthoba',
    'Novemba',
    'Disemba',
  ],
};

/** "21 October 2026" from "2026-10-21", in the reader's language. */
export function formatDate(iso: string, language: Language): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return format(DICTIONARIES[language]['common.date'], {
    day: Number(match[3]),
    month: MONTHS[language][Number(match[2]) - 1] ?? match[2]!,
    year: match[1]!,
  });
}

/** Whole dollars when there are no cents, otherwise two decimals: "$12" or "$12.50". */
export function formatUsd(minor: number): string {
  const dollars = minor / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
