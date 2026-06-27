import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import { AppProviders } from '@/providers/app-providers';

import './globals.css';

const geistSans = localFont({
  src: './fonts/geist-sans.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/geist-mono.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'App Boilerplate Admin',
    template: '%s | App Boilerplate Admin',
  },
  description:
    'Administrative control panel for App Boilerplate operations and member services.',
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} ${inter.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
