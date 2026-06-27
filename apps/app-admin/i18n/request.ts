import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import {
  isAppLocale,
  localeCookieName,
  resolveAppLocale,
} from './routing';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const requestHeaders = await headers();
  const preferredLanguage = requestHeaders
    .get('accept-language')
    ?.split(',')[0]
    ?.split('-')[0];
  const locale = isAppLocale(cookieLocale)
    ? cookieLocale
    : resolveAppLocale(preferredLanguage);

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
