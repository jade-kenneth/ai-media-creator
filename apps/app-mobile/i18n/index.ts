import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import tl from './locales/tl.json';

export const SUPPORTED_LOCALES = ['en', 'tl'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'en' || value === 'tl';
}

export function resolveSupportedLocale(
  value: string | null | undefined,
): SupportedLocale {
  if (value === 'tl' || value === 'fil') return 'tl';
  return 'en';
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  lng: 'en',
  resources: {
    en: { translation: en },
    tl: { translation: tl },
  },
  returnNull: false,
});

export default i18n;
