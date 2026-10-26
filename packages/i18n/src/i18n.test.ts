import { describe, expect, it } from 'vitest';
import { en } from './en';
import {
  DICTIONARIES,
  LANGUAGES,
  REVIEWED,
  detectLanguage,
  format,
  formatDate,
  formatUsd,
  translator,
} from './index';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

describe('dictionaries', () => {
  for (const { code } of LANGUAGES) {
    it(`${code} has every key of English, and nothing extra`, () => {
      expect(Object.keys(DICTIONARIES[code]).sort()).toEqual(Object.keys(en).sort());
    });

    it(`${code} keeps every placeholder of English`, () => {
      for (const [key, text] of Object.entries(en)) {
        const translated = DICTIONARIES[code][key as keyof typeof en];
        expect(placeholders(translated), `${code}:${key}`).toEqual(placeholders(text));
      }
    });

    it(`${code} has no empty text`, () => {
      for (const [key, text] of Object.entries(DICTIONARIES[code])) {
        expect(text.trim().length, `${code}:${key}`).toBeGreaterThan(0);
      }
    });
  }

  it('marks Shona and Ndebele as drafts until a native speaker signs them off', () => {
    expect(REVIEWED).toEqual({ en: true, sn: false, nd: false });
  });

  it('keeps messages short enough for a small screen', () => {
    for (const [key, text] of Object.entries(en)) {
      expect(text.length, key).toBeLessThanOrEqual(200);
    }
  });
});

describe('format', () => {
  it('fills placeholders and leaves unknown ones visible', () => {
    expect(format('Hello {name}, {missing}', { name: 'Rudo' })).toBe('Hello Rudo, {missing}');
    expect(format('No placeholders')).toBe('No placeholders');
  });

  it('translates with parameters in each language', () => {
    expect(translator('en')('member.hello', { name: 'Rudo' })).toBe('Hello Rudo');
    expect(translator('sn')('member.hello', { name: 'Rudo' })).toBe('Mhoroi Rudo');
    expect(translator('nd')('member.hello', { name: 'Rudo' })).toBe('Sawubona Rudo');
  });
});

describe('dates and money', () => {
  it('writes dates with the month in the reader’s language', () => {
    expect(formatDate('2026-10-21', 'en')).toBe('21 October 2026');
    expect(formatDate('2026-10-21', 'sn')).toBe('21 Gumiguru 2026');
    expect(formatDate('2026-10-21', 'nd')).toBe('21 Okthoba 2026');
    expect(formatDate('not a date', 'en')).toBe('not a date');
  });

  it('writes whole dollars without cents', () => {
    expect(formatUsd(1200)).toBe('$12');
    expect(formatUsd(1250)).toBe('$12.50');
  });
});

describe('detectLanguage', () => {
  it('picks the first supported browser language, else English', () => {
    expect(detectLanguage(['fr-FR', 'sn-ZW', 'en'])).toBe('sn');
    expect(detectLanguage(['nd'])).toBe('nd');
    expect(detectLanguage(['de'])).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });
});
