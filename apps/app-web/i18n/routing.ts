export const locales = ['en', 'tl'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';
export const localeCookieName = 'NEXT_LOCALE';

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === 'en' || value === 'tl';
}

export function resolveAppLocale(
  value: string | null | undefined,
): AppLocale {
  if (value === 'tl' || value === 'fil') return 'tl';
  return defaultLocale;
}
