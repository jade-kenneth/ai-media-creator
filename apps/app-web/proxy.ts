import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  isAppLocale,
  localeCookieName,
  resolveAppLocale,
} from './i18n/routing';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (!isAppLocale(request.cookies.get(localeCookieName)?.value)) {
    const preferredLanguage = request.headers
      .get('accept-language')
      ?.split(',')[0]
      ?.split('-')[0];
    const locale = resolveAppLocale(preferredLanguage);

    response.cookies.set(localeCookieName, locale, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
